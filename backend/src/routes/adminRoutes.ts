import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/authMiddleware';
import {
  requireAdminAccess,
  getAdminStats,
  purgeSubmissionImages,
  purgeAllSubmissions,
  promoteUser,
  verifyAdminKey
} from '../controllers/adminController';

export const adminRouter = Router();

// Allow checking key validity without failing requireAdminAccess
adminRouter.post('/verify-key', optionalAuthenticate, verifyAdminKey);

// All subsequent routes require admin access (via role='admin' or x-admin-key)
adminRouter.use(optionalAuthenticate);
adminRouter.use(requireAdminAccess);

adminRouter.get('/stats', getAdminStats);
adminRouter.post('/purge-submission-images', purgeSubmissionImages);
adminRouter.post('/purge-all-submissions', purgeAllSubmissions);
adminRouter.post('/promote-user', promoteUser);
