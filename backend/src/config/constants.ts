export const APP_CONSTANTS = {
  DEFAULT_SCORING_VERSION_ID: 'a0000000-0000-0000-0000-000000000001',
  DEFAULT_SCORING_VERSION_NAME: 'v1.0.0',
  STORAGE_BUCKETS: {
    REFERENCE_IMAGES: 'reference-images',
    SUBMISSIONS: 'submissions',
    AVATARS: 'avatars'
  },
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  ALLOWED_IMAGE_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp'
  ] as const,
  METRIC_WEIGHTS: {
    dreamsim: 0.35,
    dino: 0.30,
    clip: 0.15,
    lpips: 0.10,
    color: 0.05,
    quality: 0.05
  },
  COMPETITION_STATUS: {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    ACTIVE: 'active',
    SCORING: 'scoring',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  } as const,
  SCORING_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REJECTED: 'rejected'
  } as const
};
