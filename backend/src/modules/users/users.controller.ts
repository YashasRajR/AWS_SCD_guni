import type { Request, Response } from 'express';
import type { PaginationQuery, RoleNameInput } from '@scd/validation';
import { usersService } from './users.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendSuccess } from '../../utils/response.js';

/** Admin (SUPER_ADMIN only, via MANAGE_ROLES) — mounted at /api/v1/admin/users. */
export const usersController = {
  async adminList(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as PaginationQuery;
    sendSuccess(res, await usersService.adminList(params));
  },

  async assignRole(req: Request, res: Response): Promise<void> {
    const { role } = req.body as RoleNameInput;
    const user = await usersService.assignRole(req.params.userId!, role);
    await auditLogsService.log(req, 'ROLE_GRANTED', 'user', user.id, { role });
    sendSuccess(res, user, `${role} granted.`);
  },

  async revokeRole(req: Request, res: Response): Promise<void> {
    const role = req.params.role as RoleNameInput['role'];
    const user = await usersService.revokeRole(req.params.userId!, role);
    await auditLogsService.log(req, 'ROLE_REVOKED', 'user', user.id, { role });
    sendSuccess(res, user, `${role} revoked.`);
  },
};
