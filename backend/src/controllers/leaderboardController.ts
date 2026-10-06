import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from '../services/leaderboardService';

export async function getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: competitionId } = req.params;
    const leaderboard = await leaderboardService.getCompetitionLeaderboard(competitionId);

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (err) {
    next(err);
  }
}
