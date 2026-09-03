import { Router } from 'express';
import type { ReadinessCheckResponse } from '@scd/types';
import { checkDatabaseConnection } from '../config/database.js';
import { getEnv } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Readiness — checks this instance's actual dependencies (currently just
 * Postgres) and reflects the result in the HTTP status code itself (200
 * ready / 503 not ready), not only the response body, since that's what
 * load balancers and orchestrator readiness probes act on.
 */
export const readyRouter = Router();

readyRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const databaseConnected = await checkDatabaseConnection();
    const body: ReadinessCheckResponse = {
      status: databaseConnected ? 'ready' : 'not_ready',
      database: databaseConnected ? 'connected' : 'disconnected',
      environment: getEnv().NODE_ENV,
      timestamp: new Date().toISOString(),
    };
    sendSuccess(res, body, undefined, databaseConnected ? 200 : 503);
  }),
);
