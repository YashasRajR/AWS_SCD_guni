import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getEnv } from '../config/env.js';
import { requestLogger } from '../middleware/logging/index.js';
import { createApiRateLimiter } from '../middleware/rate-limit/index.js';
import { errorHandler, notFoundHandler } from '../middleware/error-handler/index.js';
import { healthRouter } from '../routes/health.js';
import { readyRouter } from '../routes/ready.js';
import { apiRouter } from '../routes/index.js';
import { resolveUploadDir } from '../integrations/storage/local-storage.js';

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
  // Deployment (docs/deployment/deployment.md) puts nginx in front of this
  // process in production. Without this, express-rate-limit's IP-based
  // keying reads the proxy's own address (or throws on the X-Forwarded-For
  // header nginx sets) instead of the real client -- every request would
  // share one rate-limit bucket. `1` = trust exactly one hop (the nginx
  // reverse proxy), not the whole X-Forwarded-For chain a client could spoof.
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
  app.use(
    helmet({
      // The API serves JSON only — no need for a browser CSP here.
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: [env.PUBLIC_APP_URL, env.VOLUNTEER_APP_URL, env.ADMIN_APP_URL],
      // No `credentials: true` — auth is a Bearer token attached in JS
      // (packages/api-client), never a cookie, so there is nothing
      // cookie-based for the browser to send cross-origin. Setting
      // `credentials: true` with no cookies in play is dead/misleading
      // config, not a security control.
    }),
  );
  app.use(requestLogger);
  app.use(
    express.json({
      limit: '1mb',
      // Captures the exact raw bytes alongside the parsed body — the
      // payments webhook needs these to verify the provider's HMAC
      // signature, which is computed over the raw request, not our
      // re-serialization of req.body (see modules/payments/payments.controller.ts).
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // /health and /ready are intentionally outside both the rate limiter
  // and /api/v1 — uptime/readiness checks should never be throttled or
  // versioned away.
  app.use('/health', healthRouter);
  app.use('/ready', readyRouter);

  // Uploaded images -- outside /api/v1 and its rate limiter, same
  // reasoning as health/ready: this is static asset serving, not an API
  // call. Public and unauthenticated, matching every other image URL the
  // spec allows (speaker photos, etc. were always plain public URLs).
  // helmet's default Cross-Origin-Resource-Policy: same-origin blocks the
  // web/admin apps (different port = different origin) from loading these
  // as <img> src -- relax it for this route only, everything else keeps
  // helmet's default.
  app.use(
    '/uploads',
    (req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(resolveUploadDir()),
  );

  app.use('/api/v1', createApiRateLimiter(), apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
