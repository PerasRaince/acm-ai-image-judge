import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from '../services/leaderboardService';
import { UnauthorizedError } from '../utils/errors';

export async function getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: competitionId } = req.params;
    const leaderboard = await leaderboardService.getCompetitionLeaderboard(
      competitionId,
      req.user?.id,
      req.user?.role
    );

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadLeaderboardSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to download submission');
    }

    const { id: competitionId, submissionId } = req.params;
    const file = await leaderboardService.getSubmissionDownloadForHost(
      competitionId,
      submissionId,
      req.user.id,
      req.user.role
    );

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    res.send(file.fileBuffer);
  } catch (err) {
    next(err);
  }
}
