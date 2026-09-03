import type { Announcement, PaginatedData } from '@scd/types';
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from '@scd/validation';
import { announcementsRepository } from './announcements.repository.js';
import { toAnnouncement } from './announcements.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const announcementsService = {
  async list(): Promise<Announcement[]> {
    return (await announcementsRepository.listActive()).map(toAnnouncement);
  },

  /** Admin listing — every status. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<Announcement>> {
    const { rows, total } = await announcementsRepository.list(params);
    return {
      items: rows.map(toAnnouncement),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateAnnouncementInput): Promise<Announcement> {
    return toAnnouncement(await announcementsRepository.create(input));
  },

  async update(id: string, patch: UpdateAnnouncementInput): Promise<Announcement> {
    const row = await announcementsRepository.update(id, patch);
    if (!row) throw AppError.notFound('Announcement');
    return toAnnouncement(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await announcementsRepository.delete(id);
    if (!deleted) throw AppError.notFound('Announcement');
  },
};
