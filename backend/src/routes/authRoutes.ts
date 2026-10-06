import { Router } from 'express';
import { getCurrentUser, syncProfile, signupUser, deleteAccount } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

export const authRouter = Router();

authRouter.post('/signup', signupUser);
authRouter.get('/me', authenticate, getCurrentUser);
authRouter.post('/sync-profile', authenticate, syncProfile);
authRouter.delete('/me', authenticate, deleteAccount);

