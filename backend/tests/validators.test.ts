import { createCompetitionSchema } from '../src/validators/competitionValidator';

describe('Competition Validator Tests', () => {
  it('validates a correct competition input', () => {
    const valid = {
      title: 'Masterpiece Recreation Contest',
      description: 'Recreate famous painting using Midjourney or Flux',
      rules: 'No cheating, 1:1 aspect ratio',
      required_aspect_ratio: '1:1',
      starts_at: '2026-10-06T12:00:00Z',
      ends_at: '2026-10-10T12:00:00Z',
      submission_limit: 3,
      leaderboard_visibility: 'public'
    };

    const result = createCompetitionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects competition when ends_at is before starts_at', () => {
    const invalid = {
      title: 'Masterpiece Recreation Contest',
      required_aspect_ratio: '1:1',
      starts_at: '2026-10-10T12:00:00Z',
      ends_at: '2026-10-06T12:00:00Z', // Inverted dates!
      submission_limit: 3
    };

    const result = createCompetitionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects competition with too short title', () => {
    const invalid = {
      title: 'AI', // Less than 3 chars
      starts_at: '2026-10-06T12:00:00Z',
      ends_at: '2026-10-10T12:00:00Z'
    };

    const result = createCompetitionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
