import { Router } from 'express';
import multer from 'multer';
import {
  listCompetitions,
  getCompetition,
  getCompetitionByCode,
  createCompetition,
  updateCompetition,
  joinCompetition,
  joinCompetitionByCode,
  listUserJoinedCompetitions
} from '../controllers/competitionController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';
import { APP_CONSTANTS } from '../config/constants';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: APP_CONSTANTS.MAX_FILE_SIZE_BYTES }
});

export const competitionRouter = Router();

// Public / Authenticated read routes (populates req.user if token provided)
competitionRouter.get('/', optionalAuthenticate, listCompetitions);
competitionRouter.get('/code/:code', optionalAuthenticate, getCompetitionByCode);
competitionRouter.get('/user/joined', authenticate, listUserJoinedCompetitions);
competitionRouter.get('/:id', optionalAuthenticate, getCompetition);

// Code-based and ID-based join routes
competitionRouter.post('/join', authenticate, joinCompetitionByCode);
competitionRouter.post('/:id/join', authenticate, joinCompetition);

// Any authenticated user can create a competition (host)
competitionRouter.post(
  '/',
  authenticate,
  upload.single('reference_image'),
  createCompetition
);

// Host or Admin can update competition
competitionRouter.patch(
  '/:id',
  authenticate,
  updateCompetition
);
