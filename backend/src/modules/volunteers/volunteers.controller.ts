import type { Request, Response } from 'express';
import type {
  PaginationQuery,
  AttendeeSearchQuery,
  CompleteCheckpointInput,
  CreateVolunteerInput,
  UpdateVolunteerInput,
  AssignCheckpointInput,
} from '@scd/validation';
import { volunteersService } from './volunteers.service.js';
import { attendeesService } from '../attendees/attendees.service.js';
import { checkpointsService } from '../checkpoints/checkpoints.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { AppError } from '../../utils/errors.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const volunteersController = {
  async getMe(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await volunteersService.requireByUserId(req.identity!.userId));
  },

  async getAssignedCheckpoints(req: Request, res: Response): Promise<void> {
    const volunteer = await volunteersService.requireByUserId(req.identity!.userId);
    sendSuccess(res, await volunteersService.getAssignedCheckpoints(volunteer.id));
  },

  async getHistory(req: Request, res: Response): Promise<void> {
    const volunteer = await volunteersService.requireByUserId(req.identity!.userId);
    sendSuccess(res, await volunteersService.getHistory(volunteer.id));
  },

  /** Attendee lookup — returns only the fields a volunteer needs to verify someone, not their full profile. */
  async searchAttendees(req: Request, res: Response): Promise<void> {
    const { q } = req.query as unknown as AttendeeSearchQuery;
    const attendees = await attendeesService.search(q);
    await auditLogsService.log(req, 'VOLUNTEER_SEARCHED_ATTENDEES', 'attendee', null, { query: q });
    sendSuccess(
      res,
      attendees.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        university: a.university,
        registrationType: a.registrationType,
      })),
    );
  },

  async completeCheckpoint(req: Request, res: Response): Promise<void> {
    const volunteer = await volunteersService.requireByUserId(req.identity!.userId);
    const { checkpointId, attendeeId, registrationNumber } = req.body as CompleteCheckpointInput;

    const resolvedAttendeeId = attendeeId;
    if (!resolvedAttendeeId && registrationNumber) {
      // Looking up by registration number is out of scope for this
      // endpoint's minimal contract in this phase; attendeeId is the
      // primary path (from a prior attendee-search call).
      throw AppError.validation('attendeeId is required to complete a checkpoint in this phase.');
    }
    if (!resolvedAttendeeId) throw AppError.validation('attendeeId is required.');

    try {
      const attendance = await checkpointsService.completeCheckpoint(
        volunteer.id,
        checkpointId,
        resolvedAttendeeId,
      );
      await auditLogsService.log(req, 'CHECKPOINT_COMPLETED', 'checkpoint_attendance', attendance.id, {
        checkpointId,
        attendeeId: resolvedAttendeeId,
      });
      sendCreated(res, attendance, 'Checkpoint completed.');
    } catch (err) {
      if (err instanceof AppError && err.code === 'CHECKPOINT_ALREADY_COMPLETED') {
        await auditLogsService.log(req, 'CHECKPOINT_DUPLICATE_ATTEMPT', 'checkpoint', checkpointId, {
          attendeeId: resolvedAttendeeId,
        });
      }
      throw err;
    }
  },

  /** Admin listing — GET /api/v1/admin/volunteers */
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await volunteersService.list(page, pageSize));
  },

  async getById(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await volunteersService.getById(req.params.id!));
  },

  /** Admin — checkpoints currently assigned to this volunteer. */
  async getAssignedCheckpointsAdmin(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await volunteersService.getAssignedCheckpoints(req.params.id!));
  },

  async create(req: Request, res: Response): Promise<void> {
    const volunteer = await volunteersService.create(req.body as CreateVolunteerInput);
    await auditLogsService.log(req, 'VOLUNTEER_CREATED', 'volunteer', volunteer.id, {
      name: volunteer.name,
    });
    sendCreated(res, volunteer, 'Volunteer created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const volunteer = await volunteersService.update(req.params.id!, req.body as UpdateVolunteerInput);
    await auditLogsService.log(req, 'VOLUNTEER_UPDATED', 'volunteer', volunteer.id);
    sendSuccess(res, volunteer, 'Volunteer updated.');
  },

  async assignCheckpoint(req: Request, res: Response): Promise<void> {
    const { checkpointId } = req.body as AssignCheckpointInput;
    await volunteersService.assignCheckpoint(req.params.id!, checkpointId);
    await auditLogsService.log(req, 'VOLUNTEER_CHECKPOINT_ASSIGNED', 'volunteer', req.params.id!, {
      checkpointId,
    });
    sendCreated(res, null, 'Checkpoint assigned.');
  },

  async revokeCheckpoint(req: Request, res: Response): Promise<void> {
    await volunteersService.revokeCheckpoint(req.params.id!, req.params.checkpointId!);
    await auditLogsService.log(req, 'VOLUNTEER_CHECKPOINT_REVOKED', 'volunteer', req.params.id!, {
      checkpointId: req.params.checkpointId,
    });
    sendSuccess(res, null, 'Checkpoint assignment revoked.');
  },
};
