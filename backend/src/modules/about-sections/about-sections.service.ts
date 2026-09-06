import type { AboutSection, PaginatedData } from '@scd/types';
import type { CreateAboutSectionInput, UpdateAboutSectionInput } from '@scd/validation';
import { aboutSectionsRepository } from './about-sections.repository.js';
import { toAboutSection } from './about-sections.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const aboutSectionsService = {
  async list(): Promise<AboutSection[]> {
    return (await aboutSectionsRepository.listPublished()).map(toAboutSection);
  },

  /** Admin listing — every status. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<AboutSection>> {
    const { rows, total } = await aboutSectionsRepository.list(params);
    return {
      items: rows.map(toAboutSection),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateAboutSectionInput): Promise<AboutSection> {
    return toAboutSection(await aboutSectionsRepository.create(input));
  },

  async update(id: string, patch: UpdateAboutSectionInput): Promise<AboutSection> {
    const row = await aboutSectionsRepository.update(id, patch);
    if (!row) throw AppError.notFound('About section');
    return toAboutSection(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await aboutSectionsRepository.delete(id);
    if (!deleted) throw AppError.notFound('About section');
  },
};
