import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabaseService';
import { APP_CONSTANTS } from '../config/constants';
import { env } from '../config/env';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Middleware ensuring either role === 'admin' OR header 'x-admin-key' matches env.ADMIN_SECRET_KEY.
 */
export async function requireAdminAccess(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey && adminKey === env.ADMIN_SECRET_KEY) {
    return next();
  }

  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return next(
    new ForbiddenError('Admin access required. Provide valid administrator credentials or x-admin-key header.')
  );
}

/**
 * GET /api/v1/admin/stats
 * Aggregates live database and cloud storage storage footprint metrics.
 */
export async function getAdminStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Fetch database entity counts
    const [compCount, subCount, scoreCount, userCount] = await Promise.all([
      supabaseAdmin.from('competitions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('scores').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true })
    ]);

    // 2. Fetch storage file lists
    const [subFiles, refFiles] = await Promise.all([
      supabaseAdmin.storage.from(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS).list('', { limit: 1000 }),
      supabaseAdmin.storage.from(APP_CONSTANTS.STORAGE_BUCKETS.REFERENCE_IMAGES).list('', { limit: 1000 })
    ]);

    const submissionFilesCount = subFiles.data?.length || 0;
    const referenceFilesCount = refFiles.data?.length || 0;
    const totalFilesCount = submissionFilesCount + referenceFilesCount;

    // Approximate size calculation (average image ~1.5MB)
    const approxStorageMb = Math.round(totalFilesCount * 1.5 * 10) / 10;

    res.json({
      database: {
        competitions: compCount.count || 0,
        submissions: subCount.count || 0,
        scores: scoreCount.count || 0,
        users: userCount.count || 0
      },
      storage: {
        submission_images_count: submissionFilesCount,
        reference_images_count: referenceFilesCount,
        total_images_count: totalFilesCount,
        approx_storage_mb: approxStorageMb,
        provider: 'Supabase Storage (AWS S3 Engine)'
      }
    });
  } catch (err: unknown) {
    logger.error(`Failed to fetch admin stats: ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
}

/**
 * POST /api/v1/admin/purge-submission-images
 * Deletes all candidate image files from cloud storage while retaining leaderboard scores and ranks.
 */
export async function purgeSubmissionImages(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    logger.info('Admin triggered submission images storage purge (preserving scores and leaderboards)...');

    // 1. List all files in submission storage
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS)
      .list('', { limit: 1000 });

    if (listError) {
      throw new Error(`Failed to list files in ${APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS}: ${listError.message}`);
    }

    let filesDeleted = 0;
    if (files && files.length > 0) {
      const fileNames = files.map((f) => f.name).filter(Boolean);
      const { error: removeError } = await supabaseAdmin.storage
        .from(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS)
        .remove(fileNames);

      if (removeError) {
        throw new Error(`Failed to remove storage files: ${removeError.message}`);
      }
      filesDeleted = fileNames.length;
    }

    // 2. Mark submission records as purged in DB
    await supabaseAdmin
      .from('submissions')
      .update({ image_path: '[purged_by_admin]' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    logger.info(`Storage purge completed: ${filesDeleted} files deleted from Supabase Storage.`);

    res.json({
      success: true,
      files_deleted: filesDeleted,
      message: `Successfully purged ${filesDeleted} recreation image files from storage. Leaderboard scores and participant ranks remain intact.`
    });
  } catch (err: unknown) {
    logger.error(`Failed to purge submission images: ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
}

/**
 * POST /api/v1/admin/purge-all-submissions
 * Nuclear wipe: deletes all submission files from storage AND deletes all scores and submission rows.
 */
export async function purgeAllSubmissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    logger.warn('Admin triggered complete submissions & scores wipe...');

    // 1. Purge all storage files
    const { data: files } = await supabaseAdmin.storage
      .from(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS)
      .list('', { limit: 1000 });

    let filesDeleted = 0;
    if (files && files.length > 0) {
      const fileNames = files.map((f) => f.name).filter(Boolean);
      await supabaseAdmin.storage
        .from(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS)
        .remove(fileNames);
      filesDeleted = fileNames.length;
    }

    // 2. Delete all scores
    const { error: scoreErr } = await supabaseAdmin
      .from('scores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (scoreErr) {
      logger.error(`Failed to delete scores: ${scoreErr.message}`);
    }

    // 3. Delete all submissions
    const { error: subErr } = await supabaseAdmin
      .from('submissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (subErr) {
      throw new Error(`Failed to delete submissions: ${subErr.message}`);
    }

    logger.info(`Complete wipe finished: ${filesDeleted} files and all submission records cleared.`);

    res.json({
      success: true,
      files_deleted: filesDeleted,
      message: `Successfully wiped all submissions, scores, and ${filesDeleted} files from the system.`
    });
  } catch (err: unknown) {
    logger.error(`Failed to purge all submissions: ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
}

/**
 * POST /api/v1/admin/promote-user
 * Promotes a user to 'admin' role in the profiles table.
 */
export async function promoteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, userId, role = 'admin' } = req.body;

    if (!email && !userId) {
      res.status(400).json({ error: 'Must provide either email or userId to update user role.' });
      return;
    }

    let targetUserId = userId;

    if (!targetUserId && email) {
      // Find user by email in auth
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        throw new Error(`Failed to search users: ${listError.message}`);
      }
      const match = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!match) {
        throw new NotFoundError(`User with email '${email}' not found.`);
      }
      targetUserId = match.id;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', targetUserId);

    if (updateError) {
      throw new Error(`Failed to update user role: ${updateError.message}`);
    }

    logger.info(`User ${targetUserId} updated to role '${role}' by admin.`);

    res.json({
      success: true,
      userId: targetUserId,
      role,
      message: `User has been successfully updated to role '${role}'.`
    });
  } catch (err: unknown) {
    logger.error(`Failed to promote user: ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
}

/**
 * POST /api/v1/admin/verify-key
 * Verifies if an admin secret key or session has admin privileges.
 */
export async function verifyAdminKey(req: Request, res: Response): Promise<void> {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  const isKeyValid = adminKey === env.ADMIN_SECRET_KEY;
  const isRoleAdmin = req.user?.role === 'admin';

  if (isKeyValid || isRoleAdmin) {
    res.json({ authorized: true, role: 'admin' });
  } else {
    res.status(401).json({ authorized: false, error: 'Invalid admin credentials.' });
  }
}
