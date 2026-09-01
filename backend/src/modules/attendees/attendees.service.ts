import type { Attendee, PaginatedData } from '@scd/types';
import { attendeesRepository } from './attendees.repository.js';
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

  async requireByUserId(userId: string): Promise<Attendee> {
    const attendee = await this.getByUserId(userId);
    if (!attendee) throw AppError.notFound('Attendee profile');
    return attendee;
  },

  async search(query: string): Promise<Attendee[]> {
    const rows = await attendeesRepository.search(query);
    return rows.map(toAttendee);
  },

  async list(page: number, pageSize: number): Promise<PaginatedData<Attendee>> {
    const { rows, total } = await attendeesRepository.list(page, pageSize);
    return {
      items: rows.map(toAttendee),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },
};
