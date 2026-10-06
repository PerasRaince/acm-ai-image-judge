import { supabaseAdmin, uploadImageToStorage, getSignedImageUrl } from './supabaseService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { Competition, CompetitionParticipant } from '../types/database';
import { CreateCompetitionInput, UpdateCompetitionInput } from '../validators/competitionValidator';
import { APP_CONSTANTS } from '../config/constants';
import { logger } from '../utils/logger';
import { generateCompetitionCode, normalizeCompetitionCode } from '../utils/codeGenerator';

export class CompetitionService {
  /**
   * Retrieves list of competitions based on filters and user permissions.
   */
  async listCompetitions(options: {
    status?: string;
    hostId?: string;
    organizerId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ competitions: (Competition & { reference_image_url?: string; is_host?: boolean })[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 20);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('competitions')
      .select('*, host:profiles!host_id(id, display_name, avatar_url, role)', { count: 'exact' });

    const hostFilter = options.hostId || options.organizerId;
    if (options.status) {
      query = query.eq('status', options.status);
    } else if (!hostFilter && !options.userId) {
      // By default for public feed, show scheduled, active, scoring, completed
      query = query.in('status', ['scheduled', 'active', 'scoring', 'completed']);
    }

    if (hostFilter) {
      query = query.eq('host_id', hostFilter);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      logger.error(`Error listing competitions: ${error.message}`);
      throw new Error(`Database error: ${error.message}`);
    }

    // Attach signed URLs for reference images & compatibility fields
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
          reference_image_url: referenceUrl,
          is_host: options.userId ? comp.host_id === options.userId : false,
          organizer: comp.host // Legacy alias
        };
      })
    );

    return {
      competitions: competitionsWithUrls,
      total: count || 0
    };
  }

  /**
   * Retrieves a single competition with host details and signed reference image URL.
   */
  async getCompetitionById(
    competitionId: string,
    currentUserId?: string
  ): Promise<Competition & { reference_image_url?: string; is_joined?: boolean; is_host?: boolean; attempts_used?: number }> {
    const { data: comp, error } = await supabaseAdmin
      .from('competitions')
      .select('*, host:profiles!host_id(id, display_name, avatar_url, role)')
      .eq('id', competitionId)
      .single();

    if (error || !comp) {
      throw new NotFoundError(`Competition not found: ${competitionId}`);
    }

    let isJoined = false;
    let attemptsUsed = 0;
    const isHost = currentUserId ? comp.host_id === currentUserId : false;

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
    } catch {
      logger.warn(`Could not sign reference image for competition ${competitionId}`);
    }

    return {
      ...comp,
      reference_image_url: referenceUrl,
      is_joined: isJoined,
      is_host: isHost,
      attempts_used: attemptsUsed,
      organizer: comp.host
    };
  }

  /**
   * Resolves a competition by its Google Meet style unique code.
   */
  async getCompetitionByCode(
    rawCode: string,
    currentUserId?: string
  ): Promise<Competition & { reference_image_url?: string; is_joined?: boolean; is_host?: boolean; attempts_used?: number }> {
    const normalized = normalizeCompetitionCode(rawCode);
    if (!normalized) {
      throw new BadRequestError('Invalid competition code provided.');
    }

    const { data: comp, error } = await supabaseAdmin
      .from('competitions')
      .select('*, host:profiles!host_id(id, display_name, avatar_url, role)')
      .ilike('code', normalized)
      .single();

    if (error || !comp) {
      throw new NotFoundError(`Competition not found for code: ${normalized}`);
    }

    let isJoined = false;
    let attemptsUsed = 0;
    const isHost = currentUserId ? comp.host_id === currentUserId : false;

    if (currentUserId) {
      const { data: participant } = await supabaseAdmin
        .from('competition_participants')
        .select('id')
        .eq('competition_id', comp.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (participant) {
        isJoined = true;
        const { count } = await supabaseAdmin
          .from('submissions')
          .select('id', { count: 'exact' })
          .eq('competition_id', comp.id)
          .eq('participant_id', currentUserId);
        attemptsUsed = count || 0;
      }
    }

    let referenceUrl: string | undefined;
    try {
      referenceUrl = await getSignedImageUrl(APP_CONSTANTS.STORAGE_BUCKETS.REFERENCE_IMAGES, comp.reference_image_path);
    } catch {
      logger.warn(`Could not sign reference image for competition ${comp.id}`);
    }

    return {
      ...comp,
      reference_image_url: referenceUrl,
      is_joined: isJoined,
      is_host: isHost,
      attempts_used: attemptsUsed,
      organizer: comp.host
    };
  }

  /**
   * Any authenticated user can create a competition as host.
   * Automatically generates a unique, non-sequential competition code and invitation link.
   */
  async createCompetition(
    hostId: string,
    input: CreateCompetitionInput,
    referenceFile: { buffer: Buffer; originalname: string; mimetype: string }
  ): Promise<Competition> {
    const storagePath = `ref_${Date.now()}_${input.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}.jpg`;

    // 1. Upload reference image to Supabase Storage
    await uploadImageToStorage(
      APP_CONSTANTS.STORAGE_BUCKETS.REFERENCE_IMAGES,
      storagePath,
      referenceFile.buffer,
      referenceFile.mimetype
    );

    // 2. Generate unique competition code
    let code = generateCompetitionCode();
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabaseAdmin
        .from('competitions')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      if (!existing) break;
      code = generateCompetitionCode();
      attempts++;
    }

    // 3. Insert competition record
    const { data: competition, error } = await supabaseAdmin
      .from('competitions')
      .insert({
        code,
        host_id: hostId,
        title: input.title,
        description: input.description,
        rules: input.rules,
        reference_image_path: storagePath,
        required_aspect_ratio: input.required_aspect_ratio,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        submission_limit: input.submission_limit,
        leaderboard_visibility: input.leaderboard_visibility,
        status: 'active',
        scoring_version_id: input.scoring_version_id || APP_CONSTANTS.DEFAULT_SCORING_VERSION_ID
      })
      .select()
      .single();

    if (error || !competition) {
      logger.error(`Failed to insert competition: ${error?.message}`);
      throw new Error(`Failed to create competition: ${error?.message}`);
    }

    // 4. Automatically register host as an active participant so host can also test submissions
    await supabaseAdmin
      .from('competition_participants')
      .insert({
        competition_id: competition.id,
        user_id: hostId,
        status: 'active'
      })
      .maybeSingle();

    logger.info(`Competition created: ${competition.id} (code: ${code}) by host ${hostId}`);
    return competition;
  }

  /**
   * Host or Admin updates competition details.
   */
  async updateCompetition(
    competitionId: string,
    userId: string,
    input: UpdateCompetitionInput,
    isAdmin = false
  ): Promise<Competition> {
    const existing = await this.getCompetitionById(competitionId);
    if (!isAdmin && existing.host_id !== userId) {
      throw new ForbiddenError('Only the competition host or an administrator can modify this competition.');
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
   * Authenticated user joins an active or scheduled competition by ID.
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
      return existing; // Idempotent return
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

  /**
   * Authenticated user joins a competition by entering a code or invitation link.
   */
  async joinCompetitionByCode(
    rawCode: string,
    userId: string
  ): Promise<{ competition: Competition; participant: CompetitionParticipant; alreadyJoined: boolean }> {
    const competition = await this.getCompetitionByCode(rawCode, userId);
    if (competition.status === 'completed' || competition.status === 'cancelled') {
      throw new BadRequestError(`Cannot join this competition because its status is '${competition.status}'.`);
    }

    const { data: existing } = await supabaseAdmin
      .from('competition_participants')
      .select('*')
      .eq('competition_id', competition.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return {
        competition,
        participant: existing,
        alreadyJoined: true
      };
    }

    const { data: participant, error } = await supabaseAdmin
      .from('competition_participants')
      .insert({
        competition_id: competition.id,
        user_id: userId,
        status: 'active'
      })
      .select()
      .single();

    if (error || !participant) {
      throw new Error(`Failed to join competition: ${error?.message}`);
    }

    logger.info(`User ${userId} joined competition ${competition.id} via code ${competition.code}`);
    return {
      competition,
      participant,
      alreadyJoined: false
    };
  }

  /**
   * Retrieves competitions joined by a given user.
   */
  async listUserJoinedCompetitions(userId: string): Promise<Competition[]> {
    const { data, error } = await supabaseAdmin
      .from('competition_participants')
      .select('competition:competitions(*, host:profiles!host_id(id, display_name, avatar_url))')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to list joined competitions: ${error.message}`);
    }

    return (data || []).map((row: any) => row.competition).filter(Boolean);
  }
}

export const competitionService = new CompetitionService();
