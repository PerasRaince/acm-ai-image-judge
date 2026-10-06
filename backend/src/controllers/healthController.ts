import { Request, Response } from 'express';
import { aiScoringService } from '../services/aiScoringService';
import { supabaseAdmin } from '../services/supabaseService';

export async function checkHealth(_req: Request, res: Response): Promise<void> {
  let dbHealthy = false;
  try {
    const { error } = await supabaseAdmin.from('scoring_versions').select('count', { count: 'exact', head: true });
    dbHealthy = !error;
  } catch {
    dbHealthy = false;
  }

  const aiHealthy = await aiScoringService.checkHealth();

  const isHealthy = dbHealthy && aiHealthy;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'connected' : 'unreachable',
      ai_service: aiHealthy ? 'connected' : 'unreachable'
    }
  });
}
