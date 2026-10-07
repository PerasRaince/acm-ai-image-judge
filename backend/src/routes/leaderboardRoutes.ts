import { Router } from 'express';
import { getLeaderboard, downloadLeaderboardSubmission } from '../controllers/leaderboardController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

export const leaderboardRouter = Router();

// Public / Authenticated leaderboard read
leaderboardRouter.get('/competitions/:id/leaderboard', optionalAuthenticate, getLeaderboard);

// Host-only submission download
leaderboardRouter.get('/competitions/:id/leaderboard/download/:submissionId', authenticate, downloadLeaderboardSubmission);
