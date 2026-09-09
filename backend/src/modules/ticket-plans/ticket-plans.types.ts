import type { TicketPlan } from '@scd/types';

export interface TicketPlanRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  is_active: boolean;
  display_order: number;
  benefits: string[];
  capacity: number | null;
  created_at: string;
  updated_at: string;
}

export function toTicketPlan(row: TicketPlanRow): TicketPlan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    price: row.price,
    currency: row.currency,
    isActive: row.is_active,
    displayOrder: row.display_order,
    benefits: row.benefits,
    capacity: row.capacity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
