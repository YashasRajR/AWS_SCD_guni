import type { PaginatedData, Venue } from '@scd/types';
import type { CreateVenueInput, UpdateVenueInput } from '@scd/validation';
import { venuesRepository } from './venues.repository.js';
import { toVenue } from './venues.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const venuesService = {
  async list(): Promise<Venue[]> {
    return (await venuesRepository.listPublished()).map(toVenue);
  },

  /** Admin listing — every status. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<Venue>> {
    const { rows, total } = await venuesRepository.list(params);
    return {
      items: rows.map(toVenue),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateVenueInput): Promise<Venue> {
    return toVenue(await venuesRepository.create(input));
  },

  async update(id: string, patch: UpdateVenueInput): Promise<Venue> {
    const row = await venuesRepository.update(id, patch);
    if (!row) throw AppError.notFound('Venue');
    return toVenue(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await venuesRepository.delete(id);
    if (!deleted) throw AppError.notFound('Venue');
  },
};
