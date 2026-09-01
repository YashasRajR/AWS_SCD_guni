import type { EventConfig, PaginatedData } from '@scd/types';
import type { CreateEventInput, UpdateEventInput } from '@scd/validation';
import { eventRepository } from './event.repository.js';
import { toEventConfig } from './event.types.js';
import { AppError } from '../../utils/errors.js';

interface PgError {
  code?: string;
}

export const eventService = {
  async getCurrent(): Promise<EventConfig> {
    const row = await eventRepository.getCurrent();
    if (!row) throw AppError.notFound('Event');
    return toEventConfig(row);
  },

  async getById(id: string): Promise<EventConfig> {
    const row = await eventRepository.findById(id);
    if (!row) throw AppError.notFound('Event');
    return toEventConfig(row);
  },

  /** Admin listing — every status. */
  async list(page: number, pageSize: number): Promise<PaginatedData<EventConfig>> {
    const { rows, total } = await eventRepository.list(page, pageSize);
    return {
      items: rows.map(toEventConfig),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async create(input: CreateEventInput): Promise<EventConfig> {
    try {
      return toEventConfig(await eventRepository.create(input));
    } catch (err) {
      if ((err as PgError).code === '23505') {
        throw AppError.duplicate('An event with this slug already exists.');
      }
      throw err;
    }
  },

  async update(id: string, patch: UpdateEventInput): Promise<EventConfig> {
    try {
      const row = await eventRepository.update(id, patch);
      if (!row) throw AppError.notFound('Event');
      return toEventConfig(row);
    } catch (err) {
      if ((err as PgError).code === '23505') {
        throw AppError.duplicate('An event with this slug already exists.');
      }
      throw err;
    }
  },

  async remove(id: string): Promise<void> {
    const deleted = await eventRepository.delete(id);
    if (!deleted) throw AppError.notFound('Event');
  },
};
