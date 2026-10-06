import { z } from 'zod';

export const rescoreSubmissionSchema = z.object({
  scoring_version_id: z.string().uuid().optional().nullable()
});

export type RescoreSubmissionInput = z.infer<typeof rescoreSubmissionSchema>;
