import type { AgendaItem, PaginatedData } from '@scd/types';
import type { CreateAgendaItemInput, UpdateAgendaItemInput } from '@scd/validation';
import { agendaRepository } from './agenda.repository.js';
import { toAgendaItem } from './agenda.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

interface PgError {
  code?: string;
}

export const agendaService = {
  async list(): Promise<AgendaItem[]> {
    // Sessions/venues are joined lazily by the frontend via their own ids
    // for now — a single denormalized read endpoint can be added once the
    // admin CMS phase needs it.
    return (await agendaRepository.listPublished()).map((row) => toAgendaItem(row));
  },

  /** Admin listing — every status. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<AgendaItem>> {
    const { rows, total } = await agendaRepository.list(params);
    return {
      items: rows.map((row) => toAgendaItem(row)),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateAgendaItemInput): Promise<AgendaItem> {
    try {
      return toAgendaItem(await agendaRepository.create(input));
    } catch (err) {
      if ((err as PgError).code === '23514') {
        throw AppError.validation('End time must be after start time.');
      }
      throw err;
    }
  },

  async update(id: string, patch: UpdateAgendaItemInput): Promise<AgendaItem> {
    try {
      const row = await agendaRepository.update(id, patch);
      if (!row) throw AppError.notFound('Agenda item');
      return toAgendaItem(row);
    } catch (err) {
      if ((err as PgError).code === '23514') {
        throw AppError.validation('End time must be after start time.');
      }
      throw err;
    }
  },

  async remove(id: string): Promise<void> {
    const deleted = await agendaRepository.delete(id);
    if (!deleted) throw AppError.notFound('Agenda item');
  },
};
