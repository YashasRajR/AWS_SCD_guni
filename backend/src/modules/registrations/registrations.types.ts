import type { Registration, RegistrationStatus } from '@scd/types';

export interface RegistrationRow {
  id: string;
  attendee_id: string;
  registration_number: string;
  status: RegistrationStatus;
  ticket_plan_id: string | null;
  registered_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined ticket plan columns (see registrations.repository.ts's
  // SELECT_WITH_TICKET_PLAN) -- all null when ticket_plan_id is null.
  tp_id: string | null;
  tp_code: string | null;
  tp_name: string | null;
  tp_description: string | null;
  tp_price: string | null;
  tp_currency: string | null;
  tp_is_active: boolean | null;
  tp_display_order: number | null;
  tp_created_at: string | null;
  tp_updated_at: string | null;
}

export interface RegistrationExportRow {
  registration_number: string;
  status: RegistrationStatus;
  full_name: string;
  email: string;
  phone: string | null;
  university: string | null;
  department: string | null;
  year: string | null;
  ticket_plan_name: string | null;
  registered_at: string;
  confirmed_at: string | null;
  payment_status: string | null;
  payment_amount: string | null;
  payment_currency: string | null;
}

export function toRegistration(row: RegistrationRow): Registration {
  return {
    id: row.id,
    attendeeId: row.attendee_id,
    registrationNumber: row.registration_number,
    status: row.status,
    ticketPlanId: row.ticket_plan_id,
    ticketPlan: row.tp_id
      ? {
          id: row.tp_id,
          code: row.tp_code!,
          name: row.tp_name!,
          description: row.tp_description,
          price: row.tp_price!,
          currency: row.tp_currency!,
          isActive: row.tp_is_active!,
          displayOrder: row.tp_display_order!,
          createdAt: row.tp_created_at!,
          updatedAt: row.tp_updated_at!,
        }
      : null,
    registeredAt: row.registered_at,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
