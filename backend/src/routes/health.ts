import { Router } from 'express';
import type { HealthCheckResponse } from '@scd/types';
import { checkDatabaseConnection } from '../config/database.js';
import { getEnv } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const databaseConnected = await checkDatabaseConnection();
    const body: HealthCheckResponse = {
      status: databaseConnected ? 'ok' : 'degraded',
      database: databaseConnected ? 'connected' : 'disconnected',
      environment: getEnv().NODE_ENV,
      timestamp: new Date().toISOString(),
    };
    sendSuccess(res, body);
  }),
);
