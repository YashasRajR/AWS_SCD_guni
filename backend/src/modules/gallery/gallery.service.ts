import type { GalleryItem, PaginatedData } from '@scd/types';
import type { CreateGalleryItemInput, UpdateGalleryItemInput } from '@scd/validation';
import { galleryRepository } from './gallery.repository.js';
import { toGalleryItem } from './gallery.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const galleryService = {
  async list(): Promise<GalleryItem[]> {
    return (await galleryRepository.listPublished()).map(toGalleryItem);
  },

  /** Admin listing — every status. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<GalleryItem>> {
    const { rows, total } = await galleryRepository.list(params);
    return {
      items: rows.map(toGalleryItem),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateGalleryItemInput): Promise<GalleryItem> {
    return toGalleryItem(await galleryRepository.create(input));
  },

  async update(id: string, patch: UpdateGalleryItemInput): Promise<GalleryItem> {
    const row = await galleryRepository.update(id, patch);
    if (!row) throw AppError.notFound('Gallery item');
    return toGalleryItem(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await galleryRepository.delete(id);
    if (!deleted) throw AppError.notFound('Gallery item');
  },
};
