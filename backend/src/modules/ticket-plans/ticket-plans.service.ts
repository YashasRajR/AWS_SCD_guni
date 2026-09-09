import type { PaginatedData, TicketPlan } from '@scd/types';
import type { CreateTicketPlanInput, UpdateTicketPlanInput } from '@scd/validation';
import { ticketPlansRepository } from './ticket-plans.repository.js';
import { toTicketPlan } from './ticket-plans.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export const ticketPlansService = {
  /** Public listing -- active plans only, with a live spotsLeft for any plan that has a capacity set. */
  async list(): Promise<TicketPlan[]> {
    const [rows, soldCounts] = await Promise.all([
      ticketPlansRepository.listActive(),
      ticketPlansRepository.soldCounts(),
    ]);
    return rows.map((row) => {
      const plan = toTicketPlan(row);
      if (plan.capacity == null) return plan;
      return { ...plan, spotsLeft: Math.max(0, plan.capacity - (soldCounts[plan.id] ?? 0)) };
    });
  },

  /** Used by the registration flow to price the selected plan -- throws if
   * the code doesn't exist or has been deactivated since the attendee
   * loaded the registration form. */
  async requireActiveByCode(code: string): Promise<TicketPlan> {
    const row = await ticketPlansRepository.findByCode(code);
    if (!row || !row.is_active) {
      throw AppError.validation('That ticket plan is no longer available. Please pick another.');
    }
    return toTicketPlan(row);
  },

  /** Admin listing -- active and inactive plans alike. */
  async adminList(params: ListQueryParams): Promise<PaginatedData<TicketPlan>> {
    const { rows, total } = await ticketPlansRepository.list(params);
    return {
      items: rows.map(toTicketPlan),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateTicketPlanInput): Promise<TicketPlan> {
    const existing = await ticketPlansRepository.findByCode(input.code);
    if (existing) throw AppError.duplicate('A ticket plan with this code already exists.');
    return toTicketPlan(await ticketPlansRepository.create(input));
  },

  async update(id: string, patch: UpdateTicketPlanInput): Promise<TicketPlan> {
    if (patch.code) {
      const existing = await ticketPlansRepository.findByCode(patch.code);
      if (existing && existing.id !== id) {
        throw AppError.duplicate('A ticket plan with this code already exists.');
      }
    }
    const row = await ticketPlansRepository.update(id, patch);
    if (!row) throw AppError.notFound('Ticket plan');
    return toTicketPlan(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await ticketPlansRepository.delete(id);
    if (!deleted) throw AppError.notFound('Ticket plan');
  },
};
