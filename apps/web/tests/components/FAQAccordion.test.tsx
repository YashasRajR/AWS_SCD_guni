import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Faq } from '@scd/types';
import { FAQAccordion } from '../../src/components/faq/FAQAccordion.js';
import { renderWithProviders } from '../test-utils.js';
import { apiClient } from '../../src/lib/api.js';

vi.mock('../../src/lib/api.js', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const FAQS: Faq[] = [
  {
    id: 'f1',
    question: 'Is the event free?',
    answer: 'Yes, registration is free for students.',
    category: 'Registration',
    displayOrder: 1,
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'f2',
    question: 'Will there be food?',
    answer: 'Lunch and snacks are provided.',
    category: 'Logistics',
    displayOrder: 1,
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const mockedGet = apiClient.get as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedGet.mockReset();
});

describe('FAQAccordion', () => {
  it('groups FAQs by category and starts every answer collapsed', async () => {
    mockedGet.mockResolvedValue(FAQS);
    renderWithProviders(<FAQAccordion />);

    await screen.findByRole('button', { name: 'Is the event free?' });
    expect(screen.getByText('Registration')).toBeInTheDocument();
    expect(screen.getByText('Logistics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Is the event free?' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens one question independently of the others', async () => {
    mockedGet.mockResolvedValue(FAQS);
    const user = userEvent.setup();
    renderWithProviders(<FAQAccordion />);

    const first = await screen.findByRole('button', { name: 'Is the event free?' });
    const second = screen.getByRole('button', { name: 'Will there be food?' });

    await user.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Yes, registration is free for students.')).toBeVisible();
  });

  it('shows an empty state when there are no FAQs yet', async () => {
    mockedGet.mockResolvedValue([]);
    renderWithProviders(<FAQAccordion />);
    expect(await screen.findByText(/faqs will be published soon/i)).toBeInTheDocument();
  });
});
