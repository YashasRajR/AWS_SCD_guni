import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils.js';
import type { Session } from '@scd/types';
import { SessionCard } from '../../src/components/sessions/SessionCard.js';

const SESSION: Session = {
  id: 'sess1',
  title: 'Serverless from Scratch',
  description: 'An intro to Lambda and API Gateway.',
  sessionType: 'WORKSHOP',
  track: 'Technical',
  durationMinutes: 60,
  status: 'PUBLISHED',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  speakers: [
    {
      id: 'sp1',
      name: 'Ravi Kumar',
      designation: null,
      organization: null,
      bio: null,
      profileImage: null,
      linkedinUrl: null,
      websiteUrl: null,
      displayOrder: 1,
      status: 'PUBLISHED',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
};

describe('SessionCard', () => {
  it('renders the title, type badge, track, duration, description, and speakers', () => {
    renderWithProviders(<SessionCard session={SESSION} />);
    expect(screen.getByRole('heading', { name: 'Serverless from Scratch' })).toBeInTheDocument();
    expect(screen.getByText('Workshop')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('An intro to Lambda and API Gateway.')).toBeInTheDocument();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
  });

  it('falls back to the raw sessionType label for an unmapped type', () => {
    renderWithProviders(<SessionCard session={{ ...SESSION, sessionType: 'KEYNOTE' }} />);
    expect(screen.getByText('Keynote')).toBeInTheDocument();
  });
});
