import type { PaginatedData, TimelineItem } from '@scd/types';
import type { CreateTimelineItemInput, UpdateTimelineItemInput } from '@scd/validation';
import { timelineRepository } from './timeline.repository.js';
import { toTimelineItem } from './timeline.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const timelineService = {
  async list(): Promise<TimelineItem[]> {
    return (await timelineRepository.listPublished()).map(toTimelineItem);
  },

  /** Admin listing — every status. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<TimelineItem>> {
    const { rows, total } = await timelineRepository.list(params);
    return {
      items: rows.map(toTimelineItem),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateTimelineItemInput): Promise<TimelineItem> {
    return toTimelineItem(await timelineRepository.create(input));
  },

  async update(id: string, patch: UpdateTimelineItemInput): Promise<TimelineItem> {
    const row = await timelineRepository.update(id, patch);
    if (!row) throw AppError.notFound('Timeline item');
    return toTimelineItem(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await timelineRepository.delete(id);
    if (!deleted) throw AppError.notFound('Timeline item');
  },
};
