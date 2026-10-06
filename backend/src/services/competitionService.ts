import { supabaseAdmin, uploadImageToStorage, getSignedImageUrl } from './supabaseService';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../utils/errors';
import { Competition, CompetitionParticipant } from '../types/database';
import { CreateCompetitionInput, UpdateCompetitionInput } from '../validators/competitionValidator';
import { APP_CONSTANTS } from '../config/constants';
import { logger } from '../utils/logger';

export class CompetitionService {
  /**
   * Retrieves list of competitions based on filters and user permissions.
   */
  async listCompetitions(options: {
    status?: string;
    organizerId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ competitions: (Competition & { reference_image_url?: string })[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 20);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('competitions')
      .select('*, organizer:profiles!organizer_id(id, display_name, avatar_url, role)', { count: 'exact' });

    if (options.status) {
      query = query.eq('status', options.status);
    } else if (!options.organizerId) {
      // By default for public feed, show scheduled, active, scoring, completed
      query = query.in('status', ['scheduled', 'active', 'scoring', 'completed']);
    }

    if (options.organizerId) {
      query = query.eq('organizer_id', options.organizerId);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      logger.error(`Error listing competitions: ${error.message}`);
      throw new Error(`Database error: ${error.message}`);
    }

    // Attach signed URLs for reference images
    const competitionsWithUrls = await Promise.all(
      (data || []).map(async (comp) => {
        let referenceUrl: string | undefined;
        try {
          referenceUrl = await getSignedImageUrl(APP_CONSTANTS.STORAGE_BUCKETS.REFERENCE_IMAGES, comp.reference_image_path);
        } catch {
          // If signed URL generation fails, leave undefined
        }
        return {
          ...comp,
          reference_image_url: referenceUrl
        };
      })
    );

    return {
      competitions: competitionsWithUrls,
      total: count || 0
    };
  }

  /**
   * Retrieves a single competition with organizer details and signed reference image URL.
   */
  async getCompetitionById(
    competitionId: string,
    currentUserId?: string
  ): Promise<Competition & { reference_image_url?: string; is_joined?: boolean; attempts_used?: number }> {
    const { data: comp, error } = await supabaseAdmin
      .from('competitions')
      .select('*, organizer:profiles!organizer_id(id, display_name, avatar_url, role)')
      .eq('id', competitionId)
      .single();

    if (error || !comp) {
      throw new NotFoundError(`Competition not found: ${competitionId}`);
    }

    // Check if participant has joined
    let isJoined = false;
    let attemptsUsed = 0;
    if (currentUserId) {
      const { data: participant } = await supabaseAdmin
        .from('competition_participants')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (participant) {
        isJoined = true;
        const { count } = await supabaseAdmin
          .from('submissions')
          .select('id', { count: 'exact' })
          .eq('competition_id', competitionId)
          .eq('participant_id', currentUserId);
        attemptsUsed = count || 0;
      }
    }

    let referenceUrl: string | undefined;
    try {
      referenceUrl = await getSignedImageUrl(APP_CONSTANTS.STORAGE_BUCKETS.REFERENCE_IMAGES, comp.reference_image_path);
    } catch (err) {
      logger.warn(`Could not sign reference image for competition ${competitionId}`);
    }

    return {
      ...comp,
      reference_image_url: referenceUrl,
      is_joined: isJoined,
      attempts_used: attemptsUsed
    };
  }

  /**
   * Organizer creates a new competition and uploads reference image.
   */
  async createCompetition(
    organizerId: string,
    input: CreateCompetitionInput,
    referenceFile: { buffer: Buffer; originalname: string; mimetype: string }
  ): Promise<Competition> {
    const storagePath = `ref_${Date.now()}_${input.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}.jpg`;

    // 1. Upload to Supabase Storage
    await uploadImageToStorage(
      APP_CONSTANTS.STORAGE_BUCKETS.REFERENCE_IMAGES,
      storagePath,
      referenceFile.buffer,
      referenceFile.mimetype
    );

    // 2. Insert competition record
    const { data: competition, error } = await supabaseAdmin
      .from('competitions')
      .insert({
        organizer_id: organizerId,
        title: input.title,
        description: input.description,
        rules: input.rules,
        reference_image_path: storagePath,
        required_aspect_ratio: input.required_aspect_ratio,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        submission_limit: input.submission_limit,
        leaderboard_visibility: input.leaderboard_visibility,
        status: 'active', // Direct activation or scheduled based on starts_at
        scoring_version_id: input.scoring_version_id || APP_CONSTANTS.DEFAULT_SCORING_VERSION_ID
      })
      .select()
      .single();

    if (error || !competition) {
      logger.error(`Failed to insert competition: ${error?.message}`);
      throw new Error(`Failed to create competition: ${error?.message}`);
    }

    logger.info(`Competition created: ${competition.id} by organizer ${organizerId}`);
    return competition;
  }

  /**
   * Organizer updates competition details or status.
   */
  async updateCompetition(
    competitionId: string,
    organizerId: string,
    input: UpdateCompetitionInput,
    isAdmin = false
  ): Promise<Competition> {
    const existing = await this.getCompetitionById(competitionId);
    if (!isAdmin && existing.organizer_id !== organizerId) {
      throw new ForbiddenError('Only the competition organizer or admins can modify this competition.');
    }

    const { data: updated, error } = await supabaseAdmin
      .from('competitions')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', competitionId)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update competition: ${error?.message}`);
    }

    return updated;
  }

  /**
   * Participant joins an active or scheduled competition.
   */
  async joinCompetition(competitionId: string, userId: string): Promise<CompetitionParticipant> {
    const comp = await this.getCompetitionById(competitionId);
    if (comp.status === 'completed' || comp.status === 'cancelled') {
      throw new BadRequestError(`Cannot join a competition with status '${comp.status}'.`);
    }

    // Check if already joined
    const { data: existing } = await supabaseAdmin
      .from('competition_participants')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      throw new ConflictError('User has already joined this competition.');
    }

    const { data: participant, error } = await supabaseAdmin
      .from('competition_participants')
      .insert({
        competition_id: competitionId,
        user_id: userId,
        status: 'active'
      })
      .select()
      .single();

    if (error || !participant) {
      throw new Error(`Failed to join competition: ${error?.message}`);
    }

    logger.info(`User ${userId} joined competition ${competitionId}`);
    return participant;
  }
}

export const competitionService = new CompetitionService();
