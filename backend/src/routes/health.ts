import { Router } from 'express';
import type { HealthCheckResponse } from '@scd/types';
import { getEnv } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Liveness only — deliberately does not touch the database or any other
 * dependency. See /ready (ready.ts) for the dependency-checking readiness
 * probe. Keeping these separate means a slow/unreachable database causes
 * /ready to fail (so the load balancer stops sending it traffic) without
 * also failing /health (so an orchestrator doesn't kill and restart an
 * otherwise-healthy process over a transient DB blip).
 */
export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const body: HealthCheckResponse = {
    status: 'ok',
    environment: getEnv().NODE_ENV,
    timestamp: new Date().toISOString(),
  };
  sendSuccess(res, body);
});
