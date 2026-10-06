export type UserRole = 'participant' | 'organizer' | 'admin';

export type CompetitionStatus = 'draft' | 'scheduled' | 'active' | 'scoring' | 'completed' | 'cancelled';

export type ScoringStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';

export type LeaderboardVisibility = 'public' | 'hidden_until_close' | 'participants_only';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ScoringVersion {
  id: string;
  name: string;
  version: string;
  model_versions: Record<string, string>;
  preprocessing_version: string;
  metric_weights: Record<string, number>;
  normalization_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface Competition {
  id: string;
  organizer_id: string;
  title: string;
  description?: string | null;
  rules?: string | null;
  reference_image_path: string;
  reference_width?: number | null;
  reference_height?: number | null;
  reference_sha256?: string | null;
  required_aspect_ratio: string;
  starts_at: string;
  ends_at: string;
  submission_limit: number;
  leaderboard_visibility: LeaderboardVisibility;
  status: CompetitionStatus;
  scoring_version_id?: string | null;
  created_at: string;
  updated_at: string;
  organizer?: Profile;
}

export interface CompetitionParticipant {
  id: string;
  competition_id: string;
  user_id: string;
  joined_at: string;
  status: 'active' | 'disqualified' | 'withdrawn';
  user?: Profile;
}

export interface Submission {
  id: string;
  competition_id: string;
  participant_id: string;
  image_path: string;
  original_filename: string;
  mime_type: string;
  width: number;
  height: number;
  sha256: string;
  perceptual_hash?: string | null;
  attempt_number: number;
  submitted_at: string;
  scoring_status: ScoringStatus;
  rejection_reason?: string | null;
  participant?: Profile;
  score?: Score;
}

export interface Score {
  id: string;
  submission_id: string;
  scoring_version_id: string;
  dreamsim_score: number;
  dino_score: number;
  clip_score: number;
  lpips_score: number;
  color_score: number;
  quality_score: number;
  final_score: number;
  raw_metrics: Record<string, unknown>;
  inference_duration_ms: number;
  device: string;
  model_metadata?: Record<string, unknown>;
  scored_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  submission_id: string;
  participant_id: string;
  participant_name: string;
  participant_avatar?: string | null;
  attempt_number: number;
  submitted_at: string;
  final_score: number;
  dreamsim_score: number;
  dino_score: number;
  clip_score: number;
  lpips_score: number;
  color_score: number;
  quality_score: number;
  scoring_version: string;
}
