import type { PaginatedData, Session } from '@scd/types';
import type { CreateSessionInput, UpdateSessionInput } from '@scd/validation';
import { sessionsRepository } from './sessions.repository.js';
import { toSession } from './sessions.types.js';
import { toSpeaker } from '../speakers/speakers.types.js';
import { AppError } from '../../utils/errors.js';

export const sessionsService = {
  async list(): Promise<Session[]> {
    const rows = await sessionsRepository.listPublished();
    const speakerMap = await sessionsRepository.getSpeakersForSessions(rows.map((r) => r.id));
    return rows.map((row) => toSession(row, (speakerMap.get(row.id) ?? []).map(toSpeaker)));
  },

  async getById(id: string): Promise<Session> {
    const row = await sessionsRepository.findById(id);
    if (!row) throw AppError.notFound('Session');
    const speakerMap = await sessionsRepository.getSpeakersForSessions([id]);
    return toSession(row, (speakerMap.get(id) ?? []).map(toSpeaker));
  },

  /** Admin listing — every status. */
  async adminList(page: number, pageSize: number): Promise<PaginatedData<Session>> {
    const { rows, total } = await sessionsRepository.list(page, pageSize);
    const speakerMap = await sessionsRepository.getSpeakersForSessions(rows.map((r) => r.id));
    return {
      items: rows.map((row) => toSession(row, (speakerMap.get(row.id) ?? []).map(toSpeaker))),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async create(input: CreateSessionInput): Promise<Session> {
    return this.getById((await sessionsRepository.create(input)).id);
  },

  async update(id: string, patch: UpdateSessionInput): Promise<Session> {
    const row = await sessionsRepository.update(id, patch);
    if (!row) throw AppError.notFound('Session');
    return this.getById(id);
  },

  async remove(id: string): Promise<void> {
    const deleted = await sessionsRepository.delete(id);
    if (!deleted) throw AppError.notFound('Session');
  },
};
