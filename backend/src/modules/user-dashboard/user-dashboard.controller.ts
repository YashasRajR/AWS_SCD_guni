import type { Request, Response } from 'express';
import { attendeesService } from '../attendees/attendees.service.js';
import { registrationsService } from '../registrations/registrations.service.js';
import type {
  PreviewCouponInput,
  RegisterForEventInput,
  SaveSocialPostInput,
  RecordSocialShareInput,
} from '@scd/validation';
import { ticketsService } from '../tickets/tickets.service.js';
import { ticketPlansService } from '../ticket-plans/ticket-plans.service.js';
import { couponsService } from '../coupons/coupons.service.js';
import { certificatesService } from '../certificates/certificates.service.js';
import { achievementsService } from '../achievements/achievements.service.js';
import { eventWrappedService } from '../event-wrapped/event-wrapped.service.js';
import { eventService } from '../event/event.service.js';
import { usersService } from '../users/users.service.js';
import { socialPostsService } from '../social-posts/social-posts.service.js';
import { socialPostSettingsService } from '../social-post-settings/social-post-settings.service.js';
import { socialSharingService } from '../social-sharing/social-sharing.service.js';
import { uploadsService } from '../uploads/uploads.service.js';
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

  /** Self-service — registers the authenticated attendee for the event
   * under the ticket plan they picked (validated by registerForEventSchema
   * before this runs — see user-dashboard.routes.ts). */
  async createRegistration(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const { ticketPlanCode, couponCode } = req.body as RegisterForEventInput;
    const registration = await registrationsService.create(attendee.id, ticketPlanCode, couponCode);
    await auditLogsService.log(req, 'REGISTRATION_CREATED', 'registration', registration.id, {
      ticketPlanCode,
      couponCode,
    });
    sendCreated(res, registration, 'Registered for the event.');
  },

  /** Preview -- validates a coupon and shows the resulting price WITHOUT
   * redeeming it, so the "Apply coupon" step can show original/discount/
   * final before the attendee commits (spec: show original, discount,
   * final price before submitting). */
  async previewCoupon(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const { ticketPlanCode, couponCode } = req.body as PreviewCouponInput;
    const plan = await ticketPlansService.requireActiveByCode(ticketPlanCode);
    const pricing = await couponsService.price(couponCode, Number(plan.price), plan.currency, plan.id, attendee.id);
    sendSuccess(res, pricing);
  },

  async getTicket(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const registration = await registrationsService.getByAttendeeId(attendee.id);
    if (!registration) {
      sendSuccess(res, null);
      return;
    }
    sendSuccess(res, await ticketsService.getOrIssueByRegistrationId(registration.id, registration.status));
  },

  async getTicketPdf(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const registration = await registrationsService.getByAttendeeId(attendee.id);
    if (!registration) throw AppError.notFound('Ticket');
    const ticket = await ticketsService.getOrIssueByRegistrationId(registration.id, registration.status);
    if (!ticket) throw AppError.notFound('Ticket');
    const pdf = await ticketsService.getPdfBuffer(ticket.id);
    res.type('application/pdf').send(pdf);
  },

  /** Self-service fallback (spec #04A step 3) -- lets an attendee re-trigger
   * their own ticket email if delivery failed, without needing an admin.
   * Only works once the PDF already exists; if generation is still pending
   * there's nothing to resend yet. */
  async resendTicketEmail(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const registration = await registrationsService.getByAttendeeId(attendee.id);
    if (!registration) throw AppError.notFound('Ticket');
    const ticket = await ticketsService.getOrIssueByRegistrationId(registration.id, registration.status);
    if (!ticket || !ticket.pdfAvailable) {
      throw AppError.validation("Your ticket hasn't been generated yet -- please try again shortly.");
    }
    await ticketsService.resendEmail(ticket.id);
    await auditLogsService.log(req, 'TICKET_EMAIL_RESENT', 'ticket', ticket.id, { selfService: true });
    sendSuccess(res, { resent: true });
  },

  /**
   * There is no session_attendance table yet (session-level participation
   * tracking is a later phase) — this
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
    const existing = await eventWrappedService.getForAttendee(attendee.id, event.id);
    if (existing) {
      sendSuccess(res, existing);
      return;
    }
    // Auto-generate if none exists yet
    sendSuccess(res, await eventWrappedService.generate(attendee.id, event.id));
  },

  // --- "Create My SCD Post" (spec #28) ------------------------------------
  async getSocialPost(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const [post, settings] = await Promise.all([
      socialPostsService.get(attendee.id),
      socialPostSettingsService.get(),
    ]);
    sendSuccess(res, {
      post,
      settings: { linkedinEnabled: settings.linkedinEnabled, instagramEnabled: settings.instagramEnabled },
    });
  },

  /** Also used for "Regenerate" -- same endpoint, it always rebuilds the copy. */
  async saveSocialPost(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const input = req.body as SaveSocialPostInput;
    const post = await socialPostsService.save(attendee.id, attendee.fullName, input);
    sendSuccess(res, post, 'Post generated.');
  },

  async approveSocialPost(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    sendSuccess(res, await socialPostsService.approve(attendee.id), 'Post approved.');
  },

  async uploadSocialPostPhoto(req: Request, res: Response): Promise<void> {
    await attendeesService.requireByUserId(req.identity!.userId);
    if (!req.file) throw AppError.validation('No file was uploaded.');
    sendSuccess(res, await uploadsService.storeImage(req.file));
  },

  /** Never touches a real LinkedIn/Instagram account -- just logs that the
   * attendee clicked a share link, for their own history. */
  async recordSocialShare(req: Request, res: Response): Promise<void> {
    const attendee = await attendeesService.requireByUserId(req.identity!.userId);
    const event = await eventService.getCurrent();
    const { platform } = req.body as RecordSocialShareInput;
    await socialSharingService.record(attendee.id, event.id, platform, 'SCD_POST');
    sendSuccess(res, { recorded: true });
  },
};
