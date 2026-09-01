import type { Request, Response } from 'express';
import { attendeesService } from '../attendees/attendees.service.js';
import { registrationsService } from '../registrations/registrations.service.js';
import { ticketsService } from '../tickets/tickets.service.js';
import { checkpointsService } from '../checkpoints/checkpoints.service.js';
import { certificatesService } from '../certificates/certificates.service.js';
import { achievementsService } from '../achievements/achievements.service.js';
import { eventWrappedService } from '../event-wrapped/event-wrapped.service.js';
import { eventService } from '../event/event.service.js';
import { usersService } from '../users/users.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/errors.js';

/**
 * Aggregates the authenticated attendee's own data across domains for the
 * personalized dashboard. Every read here is scoped by req.identity.userId
 * — never by a client-supplied id — so an attendee can only ever see their
 * own data (see docs/architecture/authorization.md).
 */
export const userDashboardController = {
  async getMe(req: Request, res: Response): Promise<void> {
    const user = await usersService.getPublicUserById(req.identity!.userId);
    if (!user) throw AppError.notFound('User');
    const attendee = await attendeesService.getByUserId(req.identity!.userId);
    sendSuccess(res, { user, attendee });
  },

  async getProfile(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await attendeesService.requireByUserId(req.identity!.userId));
  },

  async getRegistration(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    sendSuccess(res, await registrationsService.getByAttendeeId(attendee.id));
  },

  /** Self-service — registers the authenticated attendee for the event. */
  async createRegistration(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const registration = await registrationsService.create(attendee.id);
    await auditLogsService.log(req, 'REGISTRATION_CREATED', 'registration', registration.id);
    sendCreated(res, registration, 'Registered for the event.');
  },

  async getTicket(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const registration = await registrationsService.getByAttendeeId(attendee.id);
    if (!registration) {
      sendSuccess(res, null);
      return;
    }
    sendSuccess(res, await ticketsService.getByRegistrationId(registration.id));
  },

  async getProgress(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const event = await eventService.getCurrent();
    sendSuccess(res, await checkpointsService.getProgressForAttendee(attendee.id, event.id));
  },

  /**
   * There is no session_attendance table yet (session-level participation
   * tracking, as opposed to checkpoint attendance, is a later phase) — this
   * route is established now per the API architecture but returns an empty
   * list until that model exists, rather than fabricating data.
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    await attendeesService.requireByUserId(req.identity!.userId);
    sendSuccess(res, []);
  },

  async getCertificates(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    sendSuccess(res, await certificatesService.listForAttendee(attendee.id));
  },

  async getAchievements(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    sendSuccess(res, await achievementsService.listForAttendee(attendee.id));
  },

  async getEventWrapped(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const event = await eventService.getCurrent();
    sendSuccess(res, await eventWrappedService.getForAttendee(attendee.id, event.id));
  },
};
