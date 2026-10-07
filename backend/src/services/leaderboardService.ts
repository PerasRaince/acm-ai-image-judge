import { supabaseAdmin, getSignedImageUrl, downloadImageFromStorage } from './supabaseService';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { LeaderboardEntry } from '../types/database';
import { APP_CONSTANTS } from '../config/constants';
import { logger } from '../utils/logger';

export class LeaderboardService {
  /**
   * Generates a deterministic, versioned, transparent leaderboard for a competition.
   * Ranks each participant by their best scored submission.
   * Tie-breaking policy:
   * 1. Final Reference Similarity Score (DESC)
   * 2. DreamSim Perceptual Similarity Score (DESC)
   * 3. DINO Structural Similarity Score (DESC)
   * 4. Earlier Submission Timestamp (ASC)
   */
  async getCompetitionLeaderboard(competitionId: string, currentUserId?: string, userRole?: string): Promise<{
    competition_id: string;
    competition_title: string;
    scoring_version: string;
    is_host: boolean;
    host_id?: string;
    entries: (LeaderboardEntry & { recreation_image_url?: string })[];
  }> {
    // 1. Fetch competition (supports both UUID and room code)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(competitionId);
    let compQuery = supabaseAdmin
      .from('competitions')
      .select('id, title, host_id, leaderboard_visibility, status, scoring_version_id');

    if (isUuid) {
      compQuery = compQuery.eq('id', competitionId);
    } else {
      compQuery = compQuery.ilike('code', competitionId.trim());
    }

    const { data: comp, error: compError } = await compQuery.maybeSingle();

    if (compError || !comp) {
      if (compError) logger.error(`Error querying competition for leaderboard: ${compError.message}`);
      throw new NotFoundError(`Competition not found: ${competitionId}`);
    }

    const isHost = Boolean(
      currentUserId &&
      (comp.host_id === currentUserId || userRole === 'admin')
    );

    // 2. Fetch all completed submissions with their scores and participant profile
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        participant_id,
        attempt_number,
        submitted_at,
        image_path,
        participant:profiles!participant_id(id, display_name, avatar_url),
        score:scores!inner(
          id,
          final_score,
          dreamsim_score,
          dino_score,
          clip_score,
          lpips_score,
          color_score,
          quality_score,
          scoring_version:scoring_versions!scoring_version_id(version)
        )
      `)
      .eq('competition_id', comp.id)
      .eq('scoring_status', 'completed');

    if (subError) {
      logger.error(`Error querying submissions for leaderboard: ${subError.message}`);
      throw new Error(`Database error: ${subError.message}`);
    }

    // 3. For each participant, pick their highest scoring attempt (using tie-breaking)
    const bestByParticipant = new Map<string, any>();

    for (const sub of (submissions || [])) {
      const scoreObj: any = Array.isArray(sub.score) ? sub.score[0] : sub.score;
      if (!scoreObj) continue;

      const participantObj: any = Array.isArray(sub.participant) ? sub.participant[0] : sub.participant;
      const scoringVerObj: any = Array.isArray(scoreObj.scoring_version) ? scoreObj.scoring_version[0] : scoreObj.scoring_version;

      const currentEntry = {
        submission_id: sub.id,
        participant_id: sub.participant_id,
        participant_name: participantObj?.display_name || 'Anonymous Contestant',
        participant_avatar: participantObj?.avatar_url || null,
        attempt_number: sub.attempt_number,
        submitted_at: sub.submitted_at,
        image_path: sub.image_path,
        final_score: Number(scoreObj.final_score),
        dreamsim_score: Number(scoreObj.dreamsim_score),
        dino_score: Number(scoreObj.dino_score),
        clip_score: Number(scoreObj.clip_score),
        lpips_score: Number(scoreObj.lpips_score),
        color_score: Number(scoreObj.color_score),
        quality_score: Number(scoreObj.quality_score),
        scoring_version: scoringVerObj?.version || 'v1.0.0'
      };

      const existing = bestByParticipant.get(sub.participant_id);
      if (!existing) {
        bestByParticipant.set(sub.participant_id, currentEntry);
      } else {
        // Compare current vs existing
        if (this.compareScores(currentEntry, existing) < 0) {
          bestByParticipant.set(sub.participant_id, currentEntry);
        }
      }
    }

    // 4. Sort entries deterministically
    const sortedEntries = Array.from(bestByParticipant.values()).sort((a, b) => this.compareScores(a, b));

    // 5. Assign 1-indexed ranks and sign recreation image URLs
    const rankedWithUrls = await Promise.all(
      sortedEntries.map(async (entry, index) => {
        let recreationUrl: string | undefined;
        try {
          recreationUrl = await getSignedImageUrl(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS, entry.image_path);
        } catch {
          // ignore
        }

        const rankedEntry: LeaderboardEntry & { recreation_image_url?: string } = {
          rank: index + 1,
          submission_id: entry.submission_id,
          participant_id: entry.participant_id,
          participant_name: entry.participant_name,
          participant_avatar: entry.participant_avatar,
          attempt_number: entry.attempt_number,
          submitted_at: entry.submitted_at,
          final_score: entry.final_score,
          dreamsim_score: entry.dreamsim_score,
          dino_score: entry.dino_score,
          clip_score: entry.clip_score,
          lpips_score: entry.lpips_score,
          color_score: entry.color_score,
          quality_score: entry.quality_score,
          scoring_version: entry.scoring_version,
          recreation_image_url: recreationUrl
        };
        return rankedEntry;
      })
    );

    return {
      competition_id: comp.id,
      competition_title: comp.title,
      scoring_version: rankedWithUrls[0]?.scoring_version || 'v1.0.0',
      is_host: isHost,
      host_id: comp.host_id,
      entries: rankedWithUrls
    };
  }

  /**
   * Allows only the competition host (or admin) to download a contestant's submission image.
   * Throws ForbiddenError if a competitor or unauthenticated user tries to download.
   */
  async getSubmissionDownloadForHost(
    competitionId: string,
    submissionId: string,
    userId: string,
    userRole?: string
  ): Promise<{ fileBuffer: Buffer; mimeType: string; filename: string }> {
    // 1. Fetch competition to verify host authorization (supports UUID or code)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(competitionId);
    let compQuery = supabaseAdmin
      .from('competitions')
      .select('id, title, host_id');

    if (isUuid) {
      compQuery = compQuery.eq('id', competitionId);
    } else {
      compQuery = compQuery.ilike('code', competitionId.trim());
    }

    const { data: comp, error: compError } = await compQuery.maybeSingle();

    if (compError || !comp) {
      if (compError) logger.error(`Error verifying host for download: ${compError.message}`);
      throw new NotFoundError(`Competition not found: ${competitionId}`);
    }

    const isHost = Boolean(comp.host_id === userId || userRole === 'admin');
    if (!isHost) {
      throw new ForbiddenError('Access Denied: Only the competition host is permitted to download participant submission images.');
    }

    // 2. Fetch the submission record
    const { data: sub, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        participant_id,
        image_path,
        original_filename,
        mime_type,
        attempt_number,
        participant:profiles!participant_id(display_name)
      `)
      .eq('id', submissionId)
      .eq('competition_id', comp.id)
      .single();

    if (subError || !sub) {
      throw new NotFoundError(`Submission not found: ${submissionId}`);
    }

    const participantObj: any = Array.isArray(sub.participant) ? sub.participant[0] : sub.participant;
    const participantName = (participantObj?.display_name || 'participant').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = sub.mime_type === 'image/png' ? 'png' : sub.mime_type === 'image/webp' ? 'webp' : 'jpg';
    const downloadFilename = `${participantName}_att${sub.attempt_number}_submission.${ext}`;

    const fileBuffer = await downloadImageFromStorage(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS, sub.image_path);

    return {
      fileBuffer,
      mimeType: sub.mime_type || 'image/jpeg',
      filename: downloadFilename
    };
  }

  /**
   * Deterministic comparator for leaderboard rankings.
   * Negative return value means 'a' ranks HIGHER (better) than 'b'.
   */
  private compareScores(a: any, b: any): number {
    // 1. Final score descending
    if (b.final_score !== a.final_score) {
      return b.final_score - a.final_score;
    }
    // 2. DreamSim perceptual score descending
    if (b.dreamsim_score !== a.dreamsim_score) {
      return b.dreamsim_score - a.dreamsim_score;
    }
    // 3. DINO structural score descending
    if (b.dino_score !== a.dino_score) {
      return b.dino_score - a.dino_score;
    }
    // 4. Earlier submission timestamp ascending
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  }
}

export const leaderboardService = new LeaderboardService();
