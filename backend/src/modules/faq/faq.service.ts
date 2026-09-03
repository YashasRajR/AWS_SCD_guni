import type { Faq, PaginatedData } from '@scd/types';
import type { CreateFaqInput, UpdateFaqInput } from '@scd/validation';
import { faqRepository } from './faq.repository.js';
import { toFaq } from './faq.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const faqService = {
  async list(): Promise<Faq[]> {
    return (await faqRepository.listPublished()).map(toFaq);
  },

  /** Admin listing — every status. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<Faq>> {
    const { rows, total } = await faqRepository.list(params);
    return {
      items: rows.map(toFaq),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateFaqInput): Promise<Faq> {
    return toFaq(await faqRepository.create(input));
  },

  async update(id: string, patch: UpdateFaqInput): Promise<Faq> {
    const row = await faqRepository.update(id, patch);
    if (!row) throw AppError.notFound('FAQ');
    return toFaq(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await faqRepository.delete(id);
    if (!deleted) throw AppError.notFound('FAQ');
  },
};
