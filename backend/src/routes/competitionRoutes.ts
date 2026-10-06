import { Router } from 'express';
import multer from 'multer';
import {
  listCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  joinCompetition
} from '../controllers/competitionController';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { APP_CONSTANTS } from '../config/constants';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: APP_CONSTANTS.MAX_FILE_SIZE_BYTES }
});

export const competitionRouter = Router();

// Public / Authenticated read routes
competitionRouter.get('/', listCompetitions);
competitionRouter.get('/:id', getCompetition);

// Participant routes
competitionRouter.post('/:id/join', authenticate, joinCompetition);

// Organizer routes
competitionRouter.post(
  '/',
  authenticate,
  requireRole('organizer', 'admin'),
  upload.single('reference_image'),
  createCompetition
);

competitionRouter.patch(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  updateCompetition
);
