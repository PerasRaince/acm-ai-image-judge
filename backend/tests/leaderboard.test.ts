import { LeaderboardService } from '../src/services/leaderboardService';

describe('Leaderboard Ranking and Tie-Breaking Invariants', () => {
  const service = new LeaderboardService();
  const compare = (service as any).compareScores.bind(service);

  it('ranks higher final score first', () => {
    const entryA = { final_score: 95.0, dreamsim_score: 90.0, dino_score: 90.0, submitted_at: '2026-10-06T10:00:00Z' };
    const entryB = { final_score: 90.0, dreamsim_score: 95.0, dino_score: 95.0, submitted_at: '2026-10-06T09:00:00Z' };

    // Negative means entryA ranks higher than entryB
    expect(compare(entryA, entryB)).toBeLessThan(0);
  });

  it('breaks equal final scores using DreamSim perceptual score', () => {
    const entryA = { final_score: 90.0, dreamsim_score: 95.0, dino_score: 80.0, submitted_at: '2026-10-06T10:00:00Z' };
    const entryB = { final_score: 90.0, dreamsim_score: 85.0, dino_score: 90.0, submitted_at: '2026-10-06T09:00:00Z' };

    expect(compare(entryA, entryB)).toBeLessThan(0);
  });

  it('breaks equal final and DreamSim scores using DINO structural score', () => {
    const entryA = { final_score: 90.0, dreamsim_score: 90.0, dino_score: 92.0, submitted_at: '2026-10-06T10:00:00Z' };
    const entryB = { final_score: 90.0, dreamsim_score: 90.0, dino_score: 88.0, submitted_at: '2026-10-06T09:00:00Z' };

    expect(compare(entryA, entryB)).toBeLessThan(0);
  });

  it('breaks all equal scores using earliest submission timestamp', () => {
    const earlier = { final_score: 90.0, dreamsim_score: 90.0, dino_score: 90.0, submitted_at: '2026-10-06T08:00:00Z' };
    const later = { final_score: 90.0, dreamsim_score: 90.0, dino_score: 90.0, submitted_at: '2026-10-06T11:00:00Z' };

    expect(compare(earlier, later)).toBeLessThan(0);
  });
});
