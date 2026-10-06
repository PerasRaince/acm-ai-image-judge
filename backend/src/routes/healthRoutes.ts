import { Router } from 'express';
import { checkHealth } from '../controllers/healthController';

export const healthRouter = Router();
healthRouter.get('/health', checkHealth);
