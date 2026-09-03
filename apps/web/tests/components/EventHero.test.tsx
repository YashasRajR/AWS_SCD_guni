import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import type { EventConfig } from '@scd/types';
import { EventHero } from '../../src/components/event/EventHero.js';
import { renderWithProviders } from '../test-utils.js';
import { apiClient } from '../../src/lib/api.js';

vi.mock('../../src/lib/api.js', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const EVENT: EventConfig = {
  id: 'e1',
  name: 'AWS Student Community Day 2026',
  slug: 'scd-2026',
  description: 'A day of AWS talks and workshops.',
  eventDate: '2026-11-14',
  startTime: '2026-11-14T09:00:00Z',
  endTime: '2026-11-14T17:00:00Z',
  venue: 'Ganpat University',
  registrationOpen: null,
  registrationClose: null,
  status: 'PUBLISHED',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockedGet = apiClient.get as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedGet.mockReset();
  mockedGet.mockImplementation((path: string) => {
    if (path === '/event') return Promise.resolve(EVENT);
    return Promise.resolve([]); // speakers / sessions / venues
  });
});

describe('EventHero', () => {
  it('renders the event name and description from the API', async () => {
    renderWithProviders(<EventHero />);
    expect(await screen.findByRole('heading', { name: EVENT.name })).toBeInTheDocument();
    expect(screen.getByText(EVENT.description!)).toBeInTheDocument();
  });

  it('shows the primary "Register Now" CTA and secondary "Explore Agenda" CTA when signed out', async () => {
    renderWithProviders(<EventHero />);
    await screen.findByRole('heading', { name: EVENT.name });
    const registerCta = screen.getByRole('link', { name: /register now/i });
    expect(registerCta).toHaveAttribute('href', '/register');
    const agendaCta = screen.getByRole('link', { name: /explore agenda/i });
    expect(agendaCta).toHaveAttribute('href', '/agenda');
  });

  it('falls back to a friendly message when no event is published yet', async () => {
    // useResource treats a 404 as "not found" (not an error) — see lib/hooks.ts.
    const { ApiClientError } = await import('@scd/api-client');
    mockedGet.mockImplementation((path: string) => {
      if (path === '/event') return Promise.reject(new ApiClientError(404, { code: 'NOT_FOUND', message: 'none' }));
      return Promise.resolve([]);
    });

    renderWithProviders(<EventHero />);
    expect(await screen.findByRole('heading', { name: /something big is coming to campus/i })).toBeInTheDocument();
  });
});
