import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiClientError } from '@scd/api-client';
import type { Speaker } from '@scd/types';
import { SpeakerGrid } from '../../src/components/speakers/SpeakerGrid.js';
import { renderWithProviders } from '../test-utils.js';
import { apiClient } from '../../src/lib/api.js';

vi.mock('../../src/lib/api.js', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const SPEAKER: Speaker = {
  id: 's1',
  name: 'Priya Nair',
  designation: 'Cloud Engineer',
  organization: 'Acme',
  bio: null,
  profileImage: null,
  linkedinUrl: null,
  websiteUrl: null,
  displayOrder: 1,
  status: 'PUBLISHED',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockedGet = apiClient.get as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedGet.mockReset();
});

describe('SpeakerGrid — loading / error / empty / success states', () => {
  it('shows a skeleton grid while the request is in flight', () => {
    mockedGet.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<SpeakerGrid />);
    expect(screen.getByRole('status', { name: /loading content/i })).toBeInTheDocument();
  });

  it('shows an ErrorState with a retry button when the request fails', async () => {
    mockedGet.mockRejectedValue(new ApiClientError(500, { code: 'INTERNAL', message: 'Server exploded' }));
    renderWithProviders(<SpeakerGrid />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Unable to load this section.');
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('retrying re-issues the request', async () => {
    mockedGet
      .mockRejectedValueOnce(new ApiClientError(500, { code: 'INTERNAL', message: 'boom' }))
      .mockResolvedValueOnce([SPEAKER]);
    const user = userEvent.setup();
    renderWithProviders(<SpeakerGrid />);

    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: /try again/i }));

    await screen.findByRole('heading', { name: 'Priya Nair' });
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('shows an EmptyState when the endpoint returns no speakers yet', async () => {
    mockedGet.mockResolvedValue([]);
    renderWithProviders(<SpeakerGrid />);
    expect(await screen.findByText(/speakers will be announced soon/i)).toBeInTheDocument();
  });

  it('renders a card per speaker on success', async () => {
    mockedGet.mockResolvedValue([SPEAKER]);
    renderWithProviders(<SpeakerGrid />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Priya Nair' })).toBeInTheDocument());
  });
});
