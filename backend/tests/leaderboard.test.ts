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

  it('guarantees highest score gets rank 1 in sorted array', () => {
    const entries = [
      { id: '1', participant: 'Nandana', final_score: 69.2, dreamsim_score: 73.57, dino_score: 64.11, submitted_at: '2026-10-07T17:39:00Z' },
      { id: '2', participant: 'Anas', final_score: 85.1, dreamsim_score: 89.81, dino_score: 82.32, submitted_at: '2026-10-07T21:02:00Z' }
    ];

    const sorted = [...entries].sort((a, b) => compare(a, b));
    const ranked = sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));

    expect(ranked[0].participant).toBe('Anas');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].final_score).toBe(85.1);

    expect(ranked[1].participant).toBe('Nandana');
    expect(ranked[1].rank).toBe(2);
    expect(ranked[1].final_score).toBe(69.2);
  });
});

