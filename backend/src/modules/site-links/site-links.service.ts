import type { PaginatedData, SiteLink, SiteLinkKind } from '@scd/types';
import type { CreateSiteLinkInput, UpdateSiteLinkInput } from '@scd/validation';
import { siteLinksRepository } from './site-links.repository.js';
import { toSiteLink } from './site-links.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const siteLinksService = {
  async list(kind: SiteLinkKind): Promise<SiteLink[]> {
    return (await siteLinksRepository.listPublished(kind)).map(toSiteLink);
  },

  /** Admin listing — every status. */
  async adminList(kind: SiteLinkKind, params: ListQueryParams): Promise<PaginatedData<SiteLink>> {
    const { rows, total } = await siteLinksRepository.list(kind, params);
    return {
      items: rows.map(toSiteLink),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(kind: SiteLinkKind, input: CreateSiteLinkInput): Promise<SiteLink> {
    return toSiteLink(await siteLinksRepository.create(kind, input));
  },

  async update(kind: SiteLinkKind, id: string, patch: UpdateSiteLinkInput): Promise<SiteLink> {
    const row = await siteLinksRepository.update(kind, id, patch);
    if (!row) throw AppError.notFound('Site link');
    return toSiteLink(row);
  },

  async remove(kind: SiteLinkKind, id: string): Promise<void> {
    const deleted = await siteLinksRepository.delete(kind, id);
    if (!deleted) throw AppError.notFound('Site link');
  },
};
