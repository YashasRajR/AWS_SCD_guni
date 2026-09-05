import type { Attendee, PaginatedData } from '@scd/types';
import { attendeesRepository } from './attendees.repository.js';
import { toCsv } from '../../utils/csv.js';
import { toAttendee, type CreateAttendeeInput } from './attendees.types.js';
import { AppError } from '../../utils/errors.js';

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
        r.registration_number,
        r.registration_status,
        r.created_at,
      ]),
    );
  },

  async list(page: number, pageSize: number, search?: string): Promise<PaginatedData<Attendee>> {
    const { rows, total } = await attendeesRepository.list(page, pageSize, search);
    return {
      items: rows.map(toAttendee),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },
};
