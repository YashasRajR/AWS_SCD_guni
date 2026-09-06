import { useState } from 'react';
import type { EventConfig } from '@scd/types';
import { useResource } from '../../lib/hooks.js';
import { apiClient } from '../../lib/api.js';
import { ResourceForm, type FieldDef, type FormValues } from '../../components/ResourceForm.js';
import { StatusBadge } from '../../components/StatusBadge.js';

interface EventListData {
  items: EventConfig[];
}

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  {
    name: 'slug',
    label: 'Slug',
    type: 'text',
    required: true,
    help: 'Lowercase letters, numbers, and hyphens only.',
  },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'eventDate', label: 'Event date', type: 'date', required: true, help: 'YYYY-MM-DD' },
  { name: 'startTime', label: 'Start time', type: 'datetime' },
  { name: 'endTime', label: 'End time', type: 'datetime' },
  { name: 'venue', label: 'Venue (display text)', type: 'text' },
  { name: 'registrationOpen', label: 'Registration opens', type: 'datetime' },
  { name: 'registrationClose', label: 'Registration closes', type: 'datetime' },
  {
    name: 'registrationFee',
    label: 'Registration fee',
    type: 'number',
    help: '0 for a free event — attendees are never asked to pay and the payment flow is skipped entirely.',
  },
  {
    name: 'currency',
    label: 'Currency',
    type: 'text',
    placeholder: 'INR',
    help: '3-letter currency code, e.g. INR.',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'ARCHIVED', label: 'Archived' },
    ],
  },
  { name: 'heroSubtitle', label: 'Hero subtitle', type: 'text', help: 'A short line shown above the description on the homepage hero.' },
  { name: 'heroBackgroundImage', label: 'Hero background image', type: 'image' },
  { name: 'primaryCtaLabel', label: 'Hero primary button label', type: 'text', placeholder: 'Register Now' },
  { name: 'primaryCtaUrl', label: 'Hero primary button destination', type: 'text', help: 'Leave blank to use the default (Register/Dashboard) behavior.' },
  { name: 'secondaryCtaLabel', label: 'Hero secondary button label', type: 'text', placeholder: 'Explore Agenda' },
  { name: 'secondaryCtaUrl', label: 'Hero secondary button destination', type: 'text', help: 'Leave blank to use the default (/agenda).' },
  { name: 'logoUrl', label: 'Site logo', type: 'image', help: 'Shown in the header in place of the default "SCD" mark.' },
  { name: 'headerCtaLabel', label: 'Header CTA label', type: 'text' },
  { name: 'headerCtaUrl', label: 'Header CTA destination', type: 'text' },
  { name: 'headerCtaVisible', label: 'Show header CTA button', type: 'checkbox' },
  { name: 'footerText', label: 'Footer tagline', type: 'textarea', help: 'Leave blank to use the default tagline.' },
  { name: 'contactEmail', label: 'Contact email', type: 'text' },
  { name: 'contactPhone', label: 'Contact phone', type: 'text' },
];

export function EventPage() {
  const { data, loading, error, reload } = useResource<EventListData>('/admin/content/event');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const event = data?.items[0] ?? null;

  const handleSubmit = async (values: FormValues) => {
    setSaveError(null);
    try {
      if (event) {
        await apiClient.patch(`/admin/content/event/${event.id}`, values);
      } else {
        await apiClient.post('/admin/content/event', values);
      }
      setSavedAt(Date.now());
      reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.');
      throw err;
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Event details</h1>
          <p className="page-description">
            The single source of truth for the event's name, date, and registration window — everything on the
            public site reads from this record.
          </p>
        </div>
        {event && <StatusBadge status={event.status} />}
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}
      {saveError && <p className="form-error">{saveError}</p>}
      {savedAt && <p className="form-success">Saved.</p>}

      {!loading && (
        <div className="panel">
          <ResourceForm
            fields={FIELDS}
            initialValues={event ? (event as unknown as FormValues) : undefined}
            submitLabel={event ? 'Save changes' : 'Create event'}
            onSubmit={handleSubmit}
            onCancel={() => reload()}
          />
        </div>
      )}
    </div>
  );
}
