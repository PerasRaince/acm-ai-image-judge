import crypto from 'crypto';
import { supabaseAdmin, uploadImageToStorage, downloadImageFromStorage, getSignedImageUrl } from './supabaseService';
import { aiScoringService } from './aiScoringService';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError, ServiceUnavailableError } from '../utils/errors';
import { Submission, Score } from '../types/database';
import { APP_CONSTANTS } from '../config/constants';
import { logger } from '../utils/logger';

export class SubmissionService {
  /**
   * Processes a participant image submission, validates constraints,
   * uploads to storage, executes AI scoring, and records results.
   */
  async createSubmission(params: {
    competitionId: string;
    participantId: string;
    fileBuffer: Buffer;
    originalFilename: string;
    mimeType: string;
  }): Promise<{ submission: Submission; score: Score }> {
    const { competitionId, participantId, fileBuffer, originalFilename, mimeType } = params;

    // 1. Fetch competition and verify eligibility
    const { data: comp, error: compError } = await supabaseAdmin
      .from('competitions')
      .select('*')
      .eq('id', competitionId)
      .single();

    if (compError || !comp) {
      throw new NotFoundError(`Competition not found: ${competitionId}`);
    }

    if (comp.status !== 'active') {
      throw new BadRequestError(`Cannot submit to competition with status '${comp.status}'. Must be 'active'.`);
    }

    const now = new Date();
    if (now < new Date(comp.starts_at)) {
      throw new BadRequestError('Competition has not started yet.');
    }
    if (now > new Date(comp.ends_at)) {
      throw new BadRequestError('Competition submission deadline has passed.');
    }

    // 2. Verify participant joined
    const { data: participantRecord } = await supabaseAdmin
      .from('competition_participants')
      .select('id, status')
      .eq('competition_id', competitionId)
      .eq('user_id', participantId)
      .maybeSingle();

    if (!participantRecord || participantRecord.status !== 'active') {
      throw new ForbiddenError('You must join this competition before submitting.');
    }

    // 3. Verify attempt limit (failed attempts do not count against user limit)
    const { count: existingAttempts } = await supabaseAdmin
      .from('submissions')
      .select('id', { count: 'exact' })
      .eq('competition_id', competitionId)
      .eq('participant_id', participantId)
      .neq('scoring_status', 'failed');

    const attemptsUsed = existingAttempts || 0;
    if (attemptsUsed >= comp.submission_limit) {
      throw new BadRequestError(
        `Submission limit reached (${attemptsUsed}/${comp.submission_limit} attempts used).`
      );
    }
    const attemptNumber = attemptsUsed + 1;

    // 4. Anti-Cheat: Compute SHA-256 and duplicate checks
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Check exact reference image upload
    if (comp.reference_sha256 && comp.reference_sha256 === sha256) {
      throw new BadRequestError('Anti-Cheat: Exact reference image cannot be submitted as a recreation.');
    }

    // Check duplicate submission among successful/in-progress attempts
    const { data: duplicate } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('competition_id', competitionId)
      .eq('participant_id', participantId)
      .eq('sha256', sha256)
      .neq('scoring_status', 'failed')
      .maybeSingle();

    if (duplicate) {
      throw new ConflictError('You have already submitted this identical image for this competition.');
    }

    // Clean up any stale failed attempts with this sha256 so retry succeeds cleanly
    await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('competition_id', competitionId)
      .eq('participant_id', participantId)
      .eq('sha256', sha256)
      .eq('scoring_status', 'failed');

    // 5. Upload recreation image to private Supabase Storage
    const storagePath = `sub_${competitionId}_${participantId}_att${attemptNumber}_${Date.now()}.jpg`;
    await uploadImageToStorage(
      APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS,
      storagePath,
      fileBuffer,
      mimeType
    );

    // 6. Create submission record in database with 'pending' status
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .insert({
        competition_id: competitionId,
        participant_id: participantId,
        image_path: storagePath,
        original_filename: originalFilename,
        mime_type: mimeType,
        width: 512, // Normalized fallback
        height: 512,
        sha256,
        attempt_number: attemptNumber,
        scoring_status: 'processing'
      })
      .select()
      .single();

    if (subError || !submission) {
      logger.error(`Failed to create submission record: ${subError?.message}`);
      throw new Error(`Failed to save submission: ${subError?.message}`);
    }

    // 7. Download reference image from storage to supply to AI service
    let refBuffer: Buffer;
    try {
      refBuffer = await downloadImageFromStorage(
        APP_CONSTANTS.STORAGE_BUCKETS.REFERENCE_IMAGES,
        comp.reference_image_path
      );
    } catch (err: unknown) {
      logger.error(`Failed to download reference image for scoring: ${err instanceof Error ? err.message : String(err)}`);
      await supabaseAdmin
        .from('submissions')
        .update({ scoring_status: 'failed', rejection_reason: 'Reference image unavailable for scoring' })
        .eq('id', submission.id);
      throw new Error('Reference image unavailable for scoring');
    }

    // 8. Invoke AI scoring service
    try {
      const scoringResult = await aiScoringService.scoreImages({
        referenceBuffer: refBuffer,
        referenceFilename: 'reference.jpg',
        candidateBuffer: fileBuffer,
        candidateFilename: originalFilename,
        requiredAspectRatio: comp.required_aspect_ratio,
        scoringVersion: comp.scoring_version_id || APP_CONSTANTS.DEFAULT_SCORING_VERSION_NAME
      });

      // Anti-cheat check: if exact reference match was detected
      if (scoringResult.is_exact_reference_match) {
        await supabaseAdmin
          .from('submissions')
          .update({
            scoring_status: 'rejected',
            rejection_reason: 'Anti-cheat: Upload matched reference image byte fingerprint exactly.'
          })
          .eq('id', submission.id);
        throw new BadRequestError('Submission rejected: Exact reference image match detected.');
      }

      // 9. Persist score in database
      const scoringVersionId = comp.scoring_version_id || APP_CONSTANTS.DEFAULT_SCORING_VERSION_ID;
      const { data: score, error: scoreError } = await supabaseAdmin
        .from('scores')
        .insert({
          submission_id: submission.id,
          scoring_version_id: scoringVersionId,
          dreamsim_score: scoringResult.component_scores.dreamsim,
          dino_score: scoringResult.component_scores.dino,
          clip_score: scoringResult.component_scores.clip,
          lpips_score: scoringResult.component_scores.lpips,
          color_score: scoringResult.component_scores.color,
          quality_score: scoringResult.component_scores.quality,
          final_score: scoringResult.final_score,
          raw_metrics: scoringResult.raw_metrics,
          inference_duration_ms: scoringResult.inference_duration_ms,
          device: scoringResult.device,
          model_metadata: {
            reference_sha256: scoringResult.reference_sha256,
            candidate_sha256: scoringResult.candidate_sha256,
            aspect_ratio: scoringResult.aspect_ratio
          }
        })
        .select()
        .single();

      if (scoreError || !score) {
        logger.error(`Failed to record score: ${scoreError?.message}`);
        throw new Error(`Failed to save score: ${scoreError?.message}`);
      }

      // 10. Mark submission as completed
      await supabaseAdmin
        .from('submissions')
        .update({ scoring_status: 'completed' })
        .eq('id', submission.id);

      logger.info(`Submission ${submission.id} scored successfully! Score: ${score.final_score}`);

      return {
        submission: { ...submission, scoring_status: 'completed' },
        score
      };
    } catch (err: unknown) {
      // Delete the incomplete/failed submission record so it does not count against user's attempt limit or block re-uploading
      await supabaseAdmin
        .from('submissions')
        .delete()
        .eq('id', submission.id);

      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`AI scoring failed for submission ${submission.id}: ${errMsg}`);

      const isTransientGlitch =
        errMsg.includes('502') ||
        errMsg.includes('503') ||
        errMsg.includes('504') ||
        errMsg.includes('Bad Gateway') ||
        errMsg.includes('fetch failed') ||
        errMsg.includes('timeout') ||
        errMsg.includes('terminated') ||
        errMsg.includes('socket') ||
        errMsg.includes('ECONNRESET') ||
        errMsg.includes('warming up');

      if (isTransientGlitch) {
        throw new ServiceUnavailableError(
          'The AI scoring engine is currently warming up or handling queue load. Your submission quota was NOT deducted. Please click Submit again!'
        );
      }

      if (errMsg.includes('aspect ratio')) {
        throw new BadRequestError(errMsg);
      }

      throw new BadRequestError(`Scoring failed: ${errMsg}`);
    }
  }

  /**
   * Retrieves a single submission with score and signed image URL.
   */
  async getSubmissionById(submissionId: string, currentUserId?: string, userRole?: string): Promise<Submission & { signed_image_url?: string }> {
    const { data: sub, error } = await supabaseAdmin
      .from('submissions')
      .select('*, participant:profiles!participant_id(id, display_name, avatar_url), score:scores(*)')
      .eq('id', submissionId)
      .single();

    if (error || !sub) {
      throw new NotFoundError(`Submission not found: ${submissionId}`);
    }

    // Authorization: owner, competition host, or admin can inspect
    if (currentUserId && userRole !== 'admin' && sub.participant_id !== currentUserId) {
      const { data: comp } = await supabaseAdmin
        .from('competitions')
        .select('host_id, leaderboard_visibility, status')
        .eq('id', sub.competition_id)
        .single();

      if (comp?.host_id !== currentUserId && comp?.leaderboard_visibility !== 'public') {
        throw new ForbiddenError('You are not authorized to view this submission.');
      }
    }

    let signedUrl: string | undefined;
    try {
      signedUrl = await getSignedImageUrl(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS, sub.image_path);
    } catch {
      // ignore signed URL error
    }

    return {
      ...sub,
      signed_image_url: signedUrl
    };
  }

  /**
   * Lists submissions for a competition or user.
   */
  async listSubmissions(options: {
    competitionId?: string;
    participantId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ submissions: (Submission & { signed_image_url?: string })[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 20);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('submissions')
      .select('*, participant:profiles!participant_id(id, display_name, avatar_url), score:scores(*)', { count: 'exact' });

    if (options.competitionId) {
      query = query.eq('competition_id', options.competitionId);
    }
    if (options.participantId) {
      query = query.eq('participant_id', options.participantId);
    }

    query = query.order('submitted_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const itemsWithUrls = await Promise.all(
      (data || []).map(async (item) => {
        let signedUrl: string | undefined;
        try {
          signedUrl = await getSignedImageUrl(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS, item.image_path);
        } catch {
          // ignore
        }
        return {
          ...item,
          signed_image_url: signedUrl
        };
      })
    );

    return {
      submissions: itemsWithUrls,
      total: count || 0
    };
  }
}

export const submissionService = new SubmissionService();
