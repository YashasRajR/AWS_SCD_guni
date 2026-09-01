import type { Announcement, PaginatedData } from '@scd/types';
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from '@scd/validation';
import { announcementsRepository } from './announcements.repository.js';
import { toAnnouncement } from './announcements.types.js';
import { AppError } from '../../utils/errors.js';

export const announcementsService = {
  async list(): Promise<Announcement[]> {
    return (await announcementsRepository.listActive()).map(toAnnouncement);
  },

  /** Admin listing — every status. */
  async adminList(page: number, pageSize: number): Promise<PaginatedData<Announcement>> {
    const { rows, total } = await announcementsRepository.list(page, pageSize);
    return {
      items: rows.map(toAnnouncement),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
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
