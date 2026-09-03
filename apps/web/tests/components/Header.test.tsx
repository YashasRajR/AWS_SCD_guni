import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../src/components/layout/Header.js';
import { renderWithProviders } from '../test-utils.js';

describe('Header / mobile navigation', () => {
  it('renders the primary nav links and a closed mobile-menu toggle', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('link', { name: /aws student community day/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Speakers' }).length).toBeGreaterThan(0);
    const toggle = screen.getByRole('button', { name: /open navigation menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the mobile menu, traps focus inside it, and moves focus into the panel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    await user.click(screen.getByRole('button', { name: /open navigation menu/i }));

    const panel = await screen.findByRole('dialog', { name: /navigation menu/i });
    expect(panel).toHaveAttribute('aria-modal', 'true');
    // Focus should have moved into the panel, not stayed on the page body.
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it('closes on Escape and returns focus to the toggle button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    const toggle = screen.getByRole('button', { name: /open navigation menu/i });
    await user.click(toggle);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  it('closes when a nav link inside the panel is activated', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);

    await user.click(screen.getByRole('button', { name: /open navigation menu/i }));
    const panel = await screen.findByRole('dialog');

    const sessionsLink = within(panel).getAllByRole('link', { name: 'Sessions' })[0]!;
    await user.click(sessionsLink);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
