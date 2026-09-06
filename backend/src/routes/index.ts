import { Router } from 'express';

import { eventRouter, eventAdminRouter } from '../modules/event/event.routes.js';
import { speakersRouter, speakersAdminRouter } from '../modules/speakers/speakers.routes.js';
import { sessionsRouter, sessionsAdminRouter } from '../modules/sessions/sessions.routes.js';
import { agendaRouter, agendaAdminRouter } from '../modules/agenda/agenda.routes.js';
import { timelineRouter, timelineAdminRouter } from '../modules/timeline/timeline.routes.js';
import { venuesRouter, venuesAdminRouter } from '../modules/venues/venues.routes.js';
import { faqRouter, faqAdminRouter } from '../modules/faq/faq.routes.js';
import { galleryRouter, galleryAdminRouter } from '../modules/gallery/gallery.routes.js';
import { pastEventsRouter, pastEventsAdminRouter } from '../modules/past-events/past-events.routes.js';
import { createSiteLinksRouters } from '../modules/site-links/site-links.routes.js';
import { ticketPlansRouter, ticketPlansAdminRouter } from '../modules/ticket-plans/ticket-plans.routes.js';
import { couponsAdminRouter } from '../modules/coupons/coupons.routes.js';
import {
  announcementsRouter,
  announcementsAdminRouter,
} from '../modules/announcements/announcements.routes.js';

import { authRouter } from '../modules/auth/auth.routes.js';
import { userDashboardRouter } from '../modules/user-dashboard/user-dashboard.routes.js';
import { volunteerSelfRouter, volunteersRouter } from '../modules/volunteers/volunteers.routes.js';

import { reportsRouter } from '../modules/reports/reports.routes.js';
import { registrationsRouter } from '../modules/registrations/registrations.routes.js';
import { attendeesRouter } from '../modules/attendees/attendees.routes.js';
import { checkpointsRouter } from '../modules/checkpoints/checkpoints.routes.js';
import { auditLogsRouter } from '../modules/audit-logs/audit-logs.routes.js';
import { paymentsPublicRouter, paymentsAdminRouter } from '../modules/payments/payments.routes.js';
import {
  certificatesAdminRouter,
  certificatesPublicRouter,
} from '../modules/certificates/certificates.routes.js';
import { achievementsAdminRouter } from '../modules/achievements/achievements.routes.js';
import { emailsAdminRouter } from '../modules/emails/emails.routes.js';
import { ticketsAdminRouter } from '../modules/tickets/tickets.routes.js';
import { invoicesAdminRouter } from '../modules/invoices/invoices.routes.js';
import { uploadsAdminRouter } from '../modules/uploads/uploads.routes.js';
import {
  qrTokensByTicketRouter,
  qrTokensAdminRouter,
} from '../modules/qr-tokens/qr-tokens.routes.js';
import { usersAdminRouter } from '../modules/users/users.routes.js';

/**
 * Everything here is mounted under /api/v1 by server/app.ts. Route
 * boundaries match docs/api structure: PUBLIC (read-only, no auth),
 * AUTH, ATTENDEE (/me/*, ownership-scoped), VOLUNTEER, ADMIN
 * (permission-gated). /health is mounted separately, at the root.
 */
export const apiRouter = Router();

const navLinks = createSiteLinksRouters('NAV');
const socialLinks = createSiteLinksRouters('SOCIAL');

// --- PUBLIC ---------------------------------------------------------------
// Read-only, PUBLISHED-only. Each has an /admin/content/* sibling below
// with full CRUD across every status, gated by its MANAGE_* permission.
apiRouter.use('/event', eventRouter);
apiRouter.use('/speakers', speakersRouter);
apiRouter.use('/sessions', sessionsRouter);
apiRouter.use('/agenda', agendaRouter);
apiRouter.use('/timeline', timelineRouter);
apiRouter.use('/venues', venuesRouter);
apiRouter.use('/faqs', faqRouter);
apiRouter.use('/gallery', galleryRouter);
apiRouter.use('/past-events', pastEventsRouter);
apiRouter.use('/nav-links', navLinks.publicRouter);
apiRouter.use('/social-links', socialLinks.publicRouter);
apiRouter.use('/ticket-plans', ticketPlansRouter);
apiRouter.use('/announcements', announcementsRouter);
apiRouter.use('/certificates', certificatesPublicRouter);

// --- AUTH -------------------------------------------------------------------
apiRouter.use('/auth', authRouter);

// --- ATTENDEE (ownership-scoped via req.identity) --------------------------
apiRouter.use('/me', userDashboardRouter);

// --- PAYMENTS (public webhook — see payments.routes.ts for why) ------------
apiRouter.use('/payments', paymentsPublicRouter);

// --- VOLUNTEER ---------------------------------------------------------------
apiRouter.use('/volunteer', volunteerSelfRouter);

// --- ADMIN (permission-gated) ------------------------------------------------
apiRouter.use('/admin/dashboard', reportsRouter);
apiRouter.use('/admin/registrations', registrationsRouter);
apiRouter.use('/admin/payments', paymentsAdminRouter);
apiRouter.use('/admin/attendees', attendeesRouter);
apiRouter.use('/admin/checkpoints', checkpointsRouter);
apiRouter.use('/admin/volunteers', volunteersRouter);
apiRouter.use('/admin/audit-logs', auditLogsRouter);
apiRouter.use('/admin/certificates', certificatesAdminRouter);
apiRouter.use('/admin/achievements', achievementsAdminRouter);
apiRouter.use('/admin/emails', emailsAdminRouter);
apiRouter.use('/admin/tickets', ticketsAdminRouter);
apiRouter.use('/admin/tickets/:ticketId/qr-tokens', qrTokensByTicketRouter);
apiRouter.use('/admin/invoices', invoicesAdminRouter);
apiRouter.use('/admin/uploads', uploadsAdminRouter);
apiRouter.use('/admin/qr-tokens', qrTokensAdminRouter);
apiRouter.use('/admin/users', usersAdminRouter);

// --- ADMIN content management (every status, not just PUBLISHED) -----------
apiRouter.use('/admin/content/event', eventAdminRouter);
apiRouter.use('/admin/content/speakers', speakersAdminRouter);
apiRouter.use('/admin/content/sessions', sessionsAdminRouter);
apiRouter.use('/admin/content/agenda', agendaAdminRouter);
apiRouter.use('/admin/content/timeline', timelineAdminRouter);
apiRouter.use('/admin/content/venues', venuesAdminRouter);
apiRouter.use('/admin/content/faqs', faqAdminRouter);
apiRouter.use('/admin/content/gallery', galleryAdminRouter);
apiRouter.use('/admin/content/past-events', pastEventsAdminRouter);
apiRouter.use('/admin/content/nav-links', navLinks.adminRouter);
apiRouter.use('/admin/content/social-links', socialLinks.adminRouter);
apiRouter.use('/admin/content/ticket-plans', ticketPlansAdminRouter);
apiRouter.use('/admin/content/coupons', couponsAdminRouter);
apiRouter.use('/admin/content/announcements', announcementsAdminRouter);
