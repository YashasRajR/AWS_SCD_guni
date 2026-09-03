import type { PaginatedData, Speaker } from '@scd/types';
import type { CreateSpeakerInput, UpdateSpeakerInput } from '@scd/validation';
import { speakersRepository } from './speakers.repository.js';
import { toSpeaker } from './speakers.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const speakersService = {
  async list(): Promise<Speaker[]> {
    return (await speakersRepository.listPublished()).map(toSpeaker);
  },
  async getById(id: string): Promise<Speaker> {
    const row = await speakersRepository.findById(id);
    if (!row) throw AppError.notFound('Speaker');
    return toSpeaker(row);
  },

  /** Admin listing — every status. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<Speaker>> {
    const { rows, total } = await speakersRepository.list(params);
    return {
      items: rows.map(toSpeaker),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateSpeakerInput): Promise<Speaker> {
    return toSpeaker(await speakersRepository.create(input));
  },

  async update(id: string, patch: UpdateSpeakerInput): Promise<Speaker> {
    const row = await speakersRepository.update(id, patch);
    if (!row) throw AppError.notFound('Speaker');
    return toSpeaker(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await speakersRepository.delete(id);
    if (!deleted) throw AppError.notFound('Speaker');
  },
};
