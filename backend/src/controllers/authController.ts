import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabaseService';
import { UnauthorizedError } from '../utils/errors';

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

