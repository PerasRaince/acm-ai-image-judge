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
