import rateLimit from 'express-rate-limit';

// Standard rate limiter for regular browsing
export const standardApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please try again after 15 minutes.'
    }
  }
});

// Stricter rate limiter for submissions & scoring triggers
export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 submissions per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'SUBMISSION_RATE_LIMIT_EXCEEDED',
      message: 'Submission rate limit reached. Please wait before submitting again.'
    }
  }
});
