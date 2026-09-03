import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Speaker } from '@scd/types';
import { SpeakerCard } from '../../src/components/speakers/SpeakerCard.js';

const SPEAKER: Speaker = {
  id: 's1',
  name: 'Asha Rao',
  designation: 'Solutions Architect',
  organization: 'Acme Cloud',
  bio: 'Builds things on AWS.',
  profileImage: null,
  linkedinUrl: 'https://linkedin.com/in/asha',
  websiteUrl: null,
  displayOrder: 1,
  status: 'PUBLISHED',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('SpeakerCard', () => {
  it('renders the name, role, organization, and bio', () => {
    render(<SpeakerCard speaker={SPEAKER} />);
    expect(screen.getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByText(/Solutions Architect/)).toBeInTheDocument();
    expect(screen.getByText(/Acme Cloud/)).toBeInTheDocument();
    expect(screen.getByText('Builds things on AWS.')).toBeInTheDocument();
  });

  it('links to LinkedIn when provided, and omits Website when not', () => {
    render(<SpeakerCard speaker={SPEAKER} />);
    const link = screen.getByRole('link', { name: /linkedin/i });
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/asha');
    expect(screen.queryByRole('link', { name: /website/i })).not.toBeInTheDocument();
  });

  it('falls back to an initial-letter placeholder when there is no profile image', () => {
    render(<SpeakerCard speaker={SPEAKER} />);
    expect(screen.getByText('A', { selector: '.speaker-photo-placeholder' })).toBeInTheDocument();
  });
});
