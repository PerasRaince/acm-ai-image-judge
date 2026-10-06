import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabaseService';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole, Profile } from '../types/database';
import { logger } from '../utils/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware to verify Supabase JWT token and populate req.user.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header.'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new UnauthorizedError('Authorization Bearer token is empty.'));
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      return next(new UnauthorizedError('Invalid or expired authentication session.'));
    }

    const userId = authData.user.id;

    // Fetch user profile to get assigned role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    let userRole: UserRole = 'participant';
    let displayName = authData.user.email?.split('@')[0] || 'User';

    if (profile && !profileError) {
      userRole = profile.role as UserRole;
      displayName = profile.display_name;
    } else {
      // Auto-create initial profile if not yet created
      const initialProfile: Partial<Profile> = {
        id: userId,
        display_name: displayName,
        role: (authData.user.user_metadata?.role as UserRole) || 'participant'
      };
      await supabaseAdmin.from('profiles').insert(initialProfile);
      userRole = initialProfile.role as UserRole;
    }

    req.user = {
      id: userId,
      email: authData.user.email || '',
      role: userRole,
      display_name: displayName,
      token
    };

    next();
  } catch (err: unknown) {
    logger.error(`Authentication verification failure: ${err instanceof Error ? err.message : String(err)}`);
    next(new UnauthorizedError('Failed to authenticate token.'));
  }
}

/**
 * Role-based authorization middleware guard.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Requires one of [${allowedRoles.join(', ')}], current role is '${req.user.role}'.`
        )
      );
    }

    next();
  };
}
