import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { apiV1Router } from './routes';
import { errorHandler } from './middleware/errorMiddleware';
import { standardApiLimiter } from './middleware/rateLimitMiddleware';
import { NotFoundError } from './utils/errors';
import { env } from './config/env';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.replace(/\/$/, '');
        const cleanFrontend = env.FRONTEND_URL.replace(/\/$/, '');

        if (
          cleanOrigin === cleanFrontend ||
          cleanOrigin === 'http://localhost:3000' ||
          cleanOrigin === 'http://127.0.0.1:3000' ||
          cleanOrigin.endsWith('.vercel.app') ||
          cleanOrigin.endsWith('.onrender.com')
        ) {
          return callback(null, true);
        }

        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-admin-key', 'X-Admin-Key']
    })
  );

  // Request logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General rate limiting
  app.use('/api', standardApiLimiter);

  // Mount API V1 routes
  app.use('/api/v1', apiV1Router);

  // Fallback 404 handler
  app.use((_req: Request, _res: Response) => {
    throw new NotFoundError('API endpoint not found.');
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
