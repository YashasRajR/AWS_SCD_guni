import type { EventConfig, EventStatus } from '@scd/types';

export interface EventRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  registration_open: string | null;
  registration_close: string | null;
  registration_closed_message: string | null;
  status: EventStatus;
  registration_fee: string;
  currency: string;
  hero_subtitle: string | null;
  hero_background_image: string | null;
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  logo_url: string | null;
  header_cta_label: string | null;
  header_cta_url: string | null;
  header_cta_visible: boolean;
  footer_text: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export function toEventConfig(row: EventRow): EventConfig {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    venue: row.venue,
    registrationOpen: row.registration_open,
    registrationClose: row.registration_close,
    registrationClosedMessage: row.registration_closed_message,
    status: row.status,
    registrationFee: row.registration_fee,
    currency: row.currency,
    heroSubtitle: row.hero_subtitle,
    heroBackgroundImage: row.hero_background_image,
    primaryCtaLabel: row.primary_cta_label,
    primaryCtaUrl: row.primary_cta_url,
    secondaryCtaLabel: row.secondary_cta_label,
    secondaryCtaUrl: row.secondary_cta_url,
    logoUrl: row.logo_url,
    headerCtaLabel: row.header_cta_label,
    headerCtaUrl: row.header_cta_url,
    headerCtaVisible: row.header_cta_visible,
    footerText: row.footer_text,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
