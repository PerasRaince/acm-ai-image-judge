import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController';

export const leaderboardRouter = Router();

leaderboardRouter.get('/competitions/:id/leaderboard', getLeaderboard);
