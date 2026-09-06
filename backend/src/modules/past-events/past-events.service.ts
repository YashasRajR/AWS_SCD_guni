import type { PaginatedData, PastEvent } from '@scd/types';
import type { CreatePastEventInput, UpdatePastEventInput } from '@scd/validation';
import { pastEventsRepository } from './past-events.repository.js';
import { toPastEvent } from './past-events.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const pastEventsService = {
  async list(): Promise<PastEvent[]> {
    return (await pastEventsRepository.listPublished()).map(toPastEvent);
  },

  /** Admin listing — every status. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<PastEvent>> {
    const { rows, total } = await pastEventsRepository.list(params);
    return {
      items: rows.map(toPastEvent),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreatePastEventInput): Promise<PastEvent> {
    return toPastEvent(await pastEventsRepository.create(input));
  },

  async update(id: string, patch: UpdatePastEventInput): Promise<PastEvent> {
    const row = await pastEventsRepository.update(id, patch);
    if (!row) throw AppError.notFound('Past event');
    return toPastEvent(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await pastEventsRepository.delete(id);
    if (!deleted) throw AppError.notFound('Past event');
  },
};
