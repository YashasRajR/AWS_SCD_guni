import type { Request } from 'express';
import { logger } from '../../utils/logger.js';
import { auditLogsRepository } from './audit-logs.repository.js';
import { toAuditLog } from './audit-logs.types.js';
import type { PaginatedData, AuditLog } from '@scd/types';

export const auditLogsService = {
  /** Best-effort audit write from within a request handler. Never throws. */
  async log(
    req: Request,
    action: string,
    entityType: string,
    entityId?: string | null,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await auditLogsRepository.record({
        userId: req.identity?.userId ?? null,
        role: req.identity?.roles[0] ?? null,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
    } catch (err) {
      logger.warn({ err, action, entityType }, 'Failed to write audit log');
    }
  },

  /**
   * Same as log(), for mutations with no HTTP request context — a payment
   * webhook delivery is the canonical case (the provider calls us, there
   * is no req.identity). Still best-effort/never-throws, same as log().
   */
  async logSystem(
    action: string,
    entityType: string,
    entityId?: string | null,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await auditLogsRepository.record({
        userId: null,
        role: 'SYSTEM',
        action,
        entityType,
        entityId,
        metadata,
        ipAddress: null,
        userAgent: null,
      });
    } catch (err) {
      logger.warn({ err, action, entityType }, 'Failed to write system audit log');
    }
  },

  async list(page: number, pageSize: number): Promise<PaginatedData<AuditLog>> {
    const { rows, total } = await auditLogsRepository.list(page, pageSize);
    return {
      items: rows.map(toAuditLog),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async listForEntities(pairs: { entityType: string; entityId: string }[]): Promise<AuditLog[]> {
    const rows = await auditLogsRepository.listForEntities(pairs);
    return rows.map(toAuditLog);
  },
};
