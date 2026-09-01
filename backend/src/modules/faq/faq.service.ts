import type { Faq, PaginatedData } from '@scd/types';
import type { CreateFaqInput, UpdateFaqInput } from '@scd/validation';
import { faqRepository } from './faq.repository.js';
import { toFaq } from './faq.types.js';
import { AppError } from '../../utils/errors.js';

export const faqService = {
  async list(): Promise<Faq[]> {
    return (await faqRepository.listPublished()).map(toFaq);
  },

  /** Admin listing — every status. */
  async adminList(page: number, pageSize: number): Promise<PaginatedData<Faq>> {
    const { rows, total } = await faqRepository.list(page, pageSize);
    return {
      items: rows.map(toFaq),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
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
