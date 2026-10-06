import { z } from 'zod';

export const createCompetitionSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().trim().max(2000).optional().nullable(),
  rules: z.string().trim().max(5000).optional().nullable(),
  required_aspect_ratio: z.enum(['any', '1:1', '16:9', '4:3', '9:16', '3:4']).default('any'),
  starts_at: z.string().datetime({ message: 'starts_at must be an ISO 8601 timestamp' }),
  ends_at: z.string().datetime({ message: 'ends_at must be an ISO 8601 timestamp' }),
  submission_limit: z.coerce.number().int().min(1).max(50).default(3),
  leaderboard_visibility: z.enum(['public', 'hidden_until_close', 'participants_only']).default('public'),
  scoring_version_id: z.string().uuid().optional().nullable()
}).refine((data) => new Date(data.ends_at) > new Date(data.starts_at), {
  message: 'Competition end date must be strictly after start date',
  path: ['ends_at']
});

export const updateCompetitionSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  rules: z.string().trim().max(5000).optional().nullable(),
  required_aspect_ratio: z.enum(['any', '1:1', '16:9', '4:3', '9:16', '3:4']).optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  submission_limit: z.coerce.number().int().min(1).max(50).optional(),
  leaderboard_visibility: z.enum(['public', 'hidden_until_close', 'participants_only']).optional(),
  status: z.enum(['draft', 'scheduled', 'active', 'scoring', 'completed', 'cancelled']).optional()
}).refine((data) => {
  if (data.starts_at && data.ends_at) {
    return new Date(data.ends_at) > new Date(data.starts_at);
  }
  return true;
}, {
  message: 'Competition end date must be after start date',
  path: ['ends_at']
});

export const joinCompetitionByCodeSchema = z.object({
  code: z.string().trim().min(3, 'Competition code or link is required')
});

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type UpdateCompetitionInput = z.infer<typeof updateCompetitionSchema>;
export type JoinCompetitionByCodeInput = z.infer<typeof joinCompetitionByCodeSchema>;
