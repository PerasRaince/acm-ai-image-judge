import { Router } from 'express';
import { healthRouter } from './healthRoutes';
import { authRouter } from './authRoutes';
import { competitionRouter } from './competitionRoutes';
import { submissionRouter } from './submissionRoutes';
import { leaderboardRouter } from './leaderboardRoutes';

export const apiV1Router = Router();

apiV1Router.use('/', healthRouter);
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/competitions', competitionRouter);
apiV1Router.use('/', submissionRouter);
apiV1Router.use('/', leaderboardRouter);
