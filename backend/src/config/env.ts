import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load from root .env if present, otherwise local .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'SUPABASE_PUBLISHABLE_KEY is required'),
  SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY is required'),
  SUPABASE_JWKS_URL: z.string().optional(),
  ADMIN_SECRET_KEY: z.string().default('acm-admin-secret-2026')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('CRITICAL: Invalid environment configuration:');
  console.error(parsed.error.format());
  throw new Error('Invalid environment variables. Please check your .env configuration.');
}

export const env = parsed.data;
