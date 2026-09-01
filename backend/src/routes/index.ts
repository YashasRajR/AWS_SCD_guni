import { Router } from 'express';

import { eventRouter, eventAdminRouter } from '../modules/event/event.routes.js';
import { speakersRouter, speakersAdminRouter } from '../modules/speakers/speakers.routes.js';
import { sessionsRouter, sessionsAdminRouter } from '../modules/sessions/sessions.routes.js';
import { agendaRouter, agendaAdminRouter } from '../modules/agenda/agenda.routes.js';
import { timelineRouter, timelineAdminRouter } from '../modules/timeline/timeline.routes.js';
import { venuesRouter, venuesAdminRouter } from '../modules/venues/venues.routes.js';
import { faqRouter, faqAdminRouter } from '../modules/faq/faq.routes.js';
import { announcementsRouter, announcementsAdminRouter } from '../modules/announcements/announcements.routes.js';

import { authRouter } from '../modules/auth/auth.routes.js';
import { userDashboardRouter } from '../modules/user-dashboard/user-dashboard.routes.js';
import { volunteerSelfRouter, volunteersRouter } from '../modules/volunteers/volunteers.routes.js';

import { reportsRouter } from '../modules/reports/reports.routes.js';
import { registrationsRouter } from '../modules/registrations/registrations.routes.js';
import { attendeesRouter } from '../modules/attendees/attendees.routes.js';
import { checkpointsRouter } from '../modules/checkpoints/checkpoints.routes.js';
import { auditLogsRouter } from '../modules/audit-logs/audit-logs.routes.js';

/**
 * Everything here is mounted under /api/v1 by server/app.ts. Route
 * boundaries match docs/api structure: PUBLIC (read-only, no auth),
 * AUTH, ATTENDEE (/me/*, ownership-scoped), VOLUNTEER, ADMIN
 * (permission-gated). /health is mounted separately, at the root.
 */
export const apiRouter = Router();

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
apiRouter.use('/announcements', announcementsRouter);

// --- AUTH -------------------------------------------------------------------
apiRouter.use('/auth', authRouter);

// --- ATTENDEE (ownership-scoped via req.identity) --------------------------
apiRouter.use('/me', userDashboardRouter);

// --- VOLUNTEER ---------------------------------------------------------------
apiRouter.use('/volunteer', volunteerSelfRouter);

// --- ADMIN (permission-gated) ------------------------------------------------
apiRouter.use('/admin/dashboard', reportsRouter);
apiRouter.use('/admin/registrations', registrationsRouter);
apiRouter.use('/admin/attendees', attendeesRouter);
apiRouter.use('/admin/checkpoints', checkpointsRouter);
apiRouter.use('/admin/volunteers', volunteersRouter);
apiRouter.use('/admin/audit-logs', auditLogsRouter);

// --- ADMIN content management (every status, not just PUBLISHED) -----------
apiRouter.use('/admin/content/event', eventAdminRouter);
apiRouter.use('/admin/content/speakers', speakersAdminRouter);
apiRouter.use('/admin/content/sessions', sessionsAdminRouter);
apiRouter.use('/admin/content/agenda', agendaAdminRouter);
apiRouter.use('/admin/content/timeline', timelineAdminRouter);
apiRouter.use('/admin/content/venues', venuesAdminRouter);
apiRouter.use('/admin/content/faqs', faqAdminRouter);
apiRouter.use('/admin/content/announcements', announcementsAdminRouter);
