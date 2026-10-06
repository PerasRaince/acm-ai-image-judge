import { createCompetitionSchema, joinCompetitionByCodeSchema } from '../src/validators/competitionValidator';
import { generateCompetitionCode, normalizeCompetitionCode, isValidCompetitionCode } from '../src/utils/codeGenerator';

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

  it('validates join competition code input', () => {
    expect(joinCompetitionByCodeSchema.safeParse({ code: 'abc-defg-hij' }).success).toBe(true);
    expect(joinCompetitionByCodeSchema.safeParse({ code: '' }).success).toBe(false);
  });
});

describe('Competition Code Utility Tests', () => {
  it('generates non-sequential codes with expected format', () => {
    const code1 = generateCompetitionCode();
    const code2 = generateCompetitionCode();

    expect(code1).toMatch(/^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/);
    expect(code2).toMatch(/^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/);
    expect(code1).not.toBe(code2);
  });

  it('normalizes full URLs to raw code', () => {
    expect(normalizeCompetitionCode('https://aijudge.dev/join/abc-defg-hij')).toBe('abc-defg-hij');
    expect(normalizeCompetitionCode('http://localhost:3000/join/ABC-DEFG-HIJ?ref=share')).toBe('abc-defg-hij');
    expect(normalizeCompetitionCode('  xyz-uvwx-rst  ')).toBe('xyz-uvwx-rst');
  });

  it('validates code strings', () => {
    expect(isValidCompetitionCode('abc-defg-hij')).toBe(true);
    expect(isValidCompetitionCode('https://app.dev/join/abc-defg-hij')).toBe(true);
    expect(isValidCompetitionCode('a')).toBe(false);
    expect(isValidCompetitionCode('!!!bad$$code***')).toBe(false);
  });
});
