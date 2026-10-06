import { Router } from 'express';
import multer from 'multer';
import {
  submitRecreation,
  getSubmission,
  listSubmissions
} from '../controllers/submissionController';
import { authenticate } from '../middleware/authMiddleware';
import { submissionRateLimiter } from '../middleware/rateLimitMiddleware';
import { APP_CONSTANTS } from '../config/constants';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: APP_CONSTANTS.MAX_FILE_SIZE_BYTES }
});

export const submissionRouter = Router();

// Participant submits recreation image attempt
submissionRouter.post(
  '/competitions/:id/submissions',
  authenticate,
  submissionRateLimiter,
  upload.single('recreation_image'),
  submitRecreation
);

// List submissions
submissionRouter.get('/competitions/:id/submissions', authenticate, (req, res, next) => {
  req.query.competition_id = req.params.id;
  listSubmissions(req, res, next);
});

submissionRouter.get('/submissions', authenticate, listSubmissions);

// Single submission details
submissionRouter.get('/submissions/:id', authenticate, getSubmission);
