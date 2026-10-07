export type UserRole = 'user' | 'admin' | 'participant' | 'organizer';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  role: UserRole;
}

export type CompetitionStatus = 'draft' | 'scheduled' | 'active' | 'scoring' | 'completed' | 'cancelled';

export interface HostProfile {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  role: string;
}

export interface Competition {
  id: string;
  code: string;
  host_id: string;
  title: string;
  description?: string | null;
  rules?: string | null;
  reference_image_path: string;
  reference_image_url?: string;
  reference_width?: number | null;
  reference_height?: number | null;
  required_aspect_ratio: string;
  starts_at: string;
  ends_at: string;
  submission_limit: number;
  leaderboard_visibility: 'public' | 'hidden_until_close' | 'participants_only';
  status: CompetitionStatus;
  scoring_version_id?: string | null;
  created_at: string;
  updated_at: string;
  host?: HostProfile;
  organizer?: HostProfile; // Legacy alias
  organizer_id?: string; // Legacy alias
  is_joined?: boolean;
  is_host?: boolean;
  attempts_used?: number;
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
  scored_at: string;
}

export interface Submission {
  id: string;
  competition_id: string;
  participant_id: string;
  image_path: string;
  signed_image_url?: string;
  original_filename: string;
  mime_type: string;
  width: number;
  height: number;
  attempt_number: number;
  submitted_at: string;
  scoring_status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  rejection_reason?: string | null;
  score?: Score;
  participant?: HostProfile;
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
  recreation_image_url?: string;
}

export interface LeaderboardData {
  competition_id: string;
  competition_title: string;
  scoring_version: string;
  is_host?: boolean;
  host_id?: string;
  entries: LeaderboardEntry[];
}
