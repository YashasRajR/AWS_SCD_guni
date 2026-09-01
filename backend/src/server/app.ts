import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getEnv } from '../config/env.js';
import { requestLogger } from '../middleware/logging/index.js';
import { createApiRateLimiter } from '../middleware/rate-limit/index.js';
import { errorHandler, notFoundHandler } from '../middleware/error-handler/index.js';
import { healthRouter } from '../routes/health.js';
import { apiRouter } from '../routes/index.js';

/**
 * Conceptual pipeline (per the architecture doc):
 *   security (helmet/cors) -> request logging -> body parsing -> rate
 *   limit -> routes (auth/authorization/validation applied per-route
 *   inside each module) -> 404 handler -> central error handler.
 */
export function createApp(): Express {
  const env = getEnv();
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      // The API serves JSON only — no need for a browser CSP here.
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: [env.PUBLIC_APP_URL, env.VOLUNTEER_APP_URL, env.ADMIN_APP_URL],
      credentials: true,
    }),
  );
  app.use(requestLogger);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // /health is intentionally outside both the rate limiter and /api/v1 —
  // uptime checks should never be throttled or versioned away.
  app.use('/health', healthRouter);

  app.use('/api/v1', createApiRateLimiter(), apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
