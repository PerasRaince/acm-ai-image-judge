import { Router } from 'express';
import { getCurrentUser, syncProfile } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

export const authRouter = Router();

authRouter.get('/me', authenticate, getCurrentUser);
authRouter.post('/sync-profile', authenticate, syncProfile);
