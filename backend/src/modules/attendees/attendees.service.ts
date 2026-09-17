import type { Attendee, AttendeeDetail, PaginatedData } from '@scd/types';
import type { UpdateAttendeeInput } from '@scd/validation';
import { attendeesRepository } from './attendees.repository.js';
import { toCsv } from '../../utils/csv.js';
import { toAttendee } from './attendees.types.js';
import type { CreateAttendeeInput } from './attendees.types.js';
import { AppError } from '../../utils/errors.js';
import { registrationsService } from '../registrations/registrations.service.js';
import { ticketsService } from '../tickets/tickets.service.js';
import { qrTokensService } from '../qr-tokens/qr-tokens.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { usersRepository } from '../users/users.repository.js';
import { emailsService } from '../emails/emails.service.js';
import { authRepository } from '../auth/auth.repository.js';
import { authService } from '../auth/auth.service.js';

export const attendeesService = {
  async create(input: CreateAttendeeInput): Promise<Attendee> {
    return toAttendee(await attendeesRepository.create(input));
  },

  async getByUserId(userId: string): Promise<Attendee | null> {
    const row = await attendeesRepository.findByUserId(userId);
    return row ? toAttendee(row) : null;
  },

  async getById(id: string): Promise<Attendee | null> {
    const row = await attendeesRepository.findById(id);
    return row ? toAttendee(row) : null;
  },

  async requireById(id: string): Promise<Attendee> {
    const attendee = await this.getById(id);
    if (!attendee) throw AppError.notFound('Attendee');
    return attendee;
  },

  async requireByUserId(userId: string): Promise<Attendee> {
    const attendee = await this.getByUserId(userId);
    if (!attendee) throw AppError.notFound('Attendee profile');
    return attendee;
  },

  async search(query: string): Promise<Attendee[]> {
    const rows = await attendeesRepository.search(query);
    return rows.map(toAttendee);
  },

  async exportCsv(): Promise<string> {
    const rows = await attendeesRepository.listForExport();
    return toCsv(
      [
        'Full name',
        'Email',
        'Phone',
        'University',
        'Department',
        'Year',
        'Registration type',
        'College ID',
        'Group/club',
        'Years of experience',
        'How they heard',
        'T-shirt size',
        'Dietary preference',
        'Emergency contact',
        'Registration #',
        'Registration status',
        'Created at',
      ],
      rows.map((r) => [
        r.full_name,
        r.email,
        r.phone,
        r.university,
        r.department,
        r.year,
        r.registration_type,
        r.college_id,
        r.group_name,
        r.years_of_experience,
        r.how_heard,
        r.tshirt_size,
        r.dietary_preference,
        r.emergency_contact,
        r.registration_number,
        r.registration_status,
        r.created_at,
      ]),
    );
  },

  async list(
    page: number,
    pageSize: number,
    search?: string,
    archived?: boolean,
  ): Promise<PaginatedData<Attendee>> {
    const { rows, total } = await attendeesRepository.list(page, pageSize, search, archived);
    return {
      items: rows.map(toAttendee),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async update(id: string, patch: UpdateAttendeeInput): Promise<Attendee> {
    const row = await attendeesRepository.update(id, patch);
    if (!row) throw AppError.notFound('Attendee');
    return toAttendee(row);
  },

  /** Soft-delete -- excluded from list/search/export from then on, but
   * every prior registration/ticket record is untouched. */
  async archive(id: string): Promise<Attendee> {
    const row = await attendeesRepository.archive(id);
    if (!row) throw AppError.notFound('Attendee', 'Already archived, or does not exist.');
    return toAttendee(row);
  },

  async restore(id: string): Promise<Attendee> {
    const row = await attendeesRepository.restore(id);
    if (!row) throw AppError.notFound('Attendee', 'Not currently archived.');
    return toAttendee(row);
  },

  /**
   * Admin "Reset account access" (spec #34): revokes every outstanding
   * session immediately (not just future ones) and sends the same
   * password-reset email the attendee could request themselves, reusing
   * authService.forgotPassword() rather than a second token/email flow.
   */
  async resetAccess(id: string): Promise<void> {
    const attendee = await this.requireById(id);
    const user = await usersRepository.findById(attendee.userId);
    if (!user) throw AppError.notFound('User account');
    await authRepository.revokeAllRefreshTokensForUser(user.id);
    await authService.forgotPassword({ email: user.email });
  },

  /**
   * Everything the admin attendee-detail page needs, assembled from the
   * existing per-domain services -- see AttendeeDetail's doc comment for
   * why this doesn't duplicate their data.
   */
  async getDetail(id: string): Promise<AttendeeDetail> {
    const attendee = await this.requireById(id);
    const user = await usersRepository.findById(attendee.userId);
    const registration = await registrationsService.getByAttendeeId(id);
    const ticket = registration ? await ticketsService.getByRegistrationId(registration.id) : null;
    const qrTokens = ticket ? await qrTokensService.listForTicket(ticket.id) : [];

    const entityPairs = [{ entityType: 'attendee', entityId: id }];
    if (registration) entityPairs.push({ entityType: 'registration', entityId: registration.id });
    if (ticket) entityPairs.push({ entityType: 'ticket', entityId: ticket.id });
    const activityHistory = await auditLogsService.listForEntities(entityPairs);
    const documentEmails = user ? await emailsService.listForUser(user.id, ['ticket', 'ticket-resend']) : [];

    return {
      attendee,
      email: user?.email ?? null,
      registration,
      ticket,
      qrTokens,
      activityHistory,
      documentEmails,
    };
  },
};
