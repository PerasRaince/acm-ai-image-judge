import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Admin client using privileged secret key (server-only)
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Factory to create an authenticated client representing a specific user
export function createScopedUserClient(userJwt: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${userJwt}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Generates short-lived signed URLs for private storage images.
 * Keeps raw image files protected behind authorization.
 */
export async function getSignedImageUrl(
  bucket: string,
  filePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    logger.error(`Failed to create signed URL for ${bucket}/${filePath}: ${error?.message}`);
    throw new Error(`Failed to access storage file: ${error?.message || 'Unknown storage error'}`);
  }

  return data.signedUrl;
}

/**
 * Uploads an image buffer directly to a private Supabase Storage bucket.
 */
export async function uploadImageToStorage(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error || !data?.path) {
    logger.error(`Storage upload failed for ${bucket}/${filePath}: ${error?.message}`);
    throw new Error(`Failed to upload image: ${error?.message}`);
  }

  return data.path;
}

/**
 * Downloads an image buffer from Supabase Storage.
 */
export async function downloadImageFromStorage(
  bucket: string,
  filePath: string
): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .download(filePath);

  if (error || !data) {
    logger.error(`Storage download failed for ${bucket}/${filePath}: ${error?.message}`);
    throw new Error(`Failed to download image from storage: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
