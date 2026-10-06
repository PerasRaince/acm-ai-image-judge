import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabaseService';
import { UnauthorizedError } from '../utils/errors';
import { APP_CONSTANTS } from '../config/constants';
import { logger } from '../utils/logger';

export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: profile?.role || req.user.role,
          display_name: profile?.display_name || req.user.display_name,
          avatar_url: profile?.avatar_url
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function syncProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { display_name, avatar_url, role } = req.body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    if (display_name) updates.display_name = display_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    // Role switch permitted if requesting organizer or participant
    if (role && ['participant', 'organizer'].includes(role)) {
      updates.role = role;
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: req.user.id,
        ...updates
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
}

export async function signupUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, display_name } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { message: 'Email and password are required.' }
      });
      return;
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      res.status(400).json({
        success: false,
        error: { message: 'An account with this email already exists. Please sign in.' }
      });
      return;
    }

    const name = display_name?.trim() || email.split('@')[0];

    // Create user via admin API with email auto-confirmed (no rate-limited SMTP emails)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        display_name: name,
        role: 'user'
      }
    });

    if (error || !data.user) {
      res.status(400).json({
        success: false,
        error: { message: error?.message || 'Failed to create user account.' }
      });
      return;
    }

    // Auto-create profile in public.profiles
    await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      display_name: name,
      role: 'user'
    });

    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: name
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const userId = req.user.id;
    logger.info(`Initiating complete account deletion for user: ${userId}`);

    // 1. Delete all submission images uploaded by this user
    const { data: userSubs } = await supabaseAdmin
      .from('submissions')
      .select('image_path')
      .eq('participant_id', userId);

    if (userSubs && userSubs.length > 0) {
      const filesToDelete = userSubs.map((s) => s.image_path).filter(Boolean);
      if (filesToDelete.length > 0) {
        await supabaseAdmin.storage
          .from(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS)
          .remove(filesToDelete);
      }
    }

    // 2. Delete competitions hosted by this user and their reference images + submissions
    const { data: userComps } = await supabaseAdmin
      .from('competitions')
      .select('id, reference_image_path')
      .eq('host_id', userId);

    if (userComps && userComps.length > 0) {
      for (const comp of userComps) {
        // Find all submissions under this competition to delete storage files
        const { data: compSubs } = await supabaseAdmin
          .from('submissions')
          .select('image_path')
          .eq('competition_id', comp.id);

        if (compSubs && compSubs.length > 0) {
          const compFiles = compSubs.map((s) => s.image_path).filter(Boolean);
          if (compFiles.length > 0) {
            await supabaseAdmin.storage
              .from(APP_CONSTANTS.STORAGE_BUCKETS.SUBMISSIONS)
              .remove(compFiles);
          }
        }

        // Delete competition reference image
        if (comp.reference_image_path) {
          await supabaseAdmin.storage
            .from(APP_CONSTANTS.STORAGE_BUCKETS.REFERENCE_IMAGES)
            .remove([comp.reference_image_path]);
        }

        // Delete competition row (cascades submissions, scores, participants)
        await supabaseAdmin.from('competitions').delete().eq('id', comp.id);
      }
    }

    // 3. Delete user participations
    await supabaseAdmin.from('competition_participants').delete().eq('user_id', userId);

    // 4. Delete user's own submissions (cascades to scores)
    await supabaseAdmin.from('submissions').delete().eq('participant_id', userId);

    // 5. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // 6. Delete user permanently from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      logger.error(`Error deleting user from Supabase Auth: ${authDeleteError.message}`);
      throw new Error(`Failed to delete authentication account: ${authDeleteError.message}`);
    }

    logger.info(`User ${userId} and all associated files/data permanently purged from system.`);

    res.json({
      success: true,
      message: 'Your account and all associated submissions and images have been permanently deleted.'
    });
  } catch (err) {
    next(err);
  }
}


