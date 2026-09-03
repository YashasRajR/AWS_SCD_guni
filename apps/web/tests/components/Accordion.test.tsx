import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AccordionItem } from '../../src/components/ui/Accordion.js';

function Wrapper() {
  const [open, setOpen] = useState(false);
  return (
    <AccordionItem title="Is this accessible?" isOpen={open} onToggle={() => setOpen((v) => !v)}>
      Yes, via a real button with aria-expanded/aria-controls.
    </AccordionItem>
  );
}

describe('AccordionItem', () => {
  it('starts closed, with the trigger reporting aria-expanded="false"', () => {
    render(<Wrapper />);
    const trigger = screen.getByRole('button', { name: /is this accessible/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens on mouse click and toggles aria-expanded + the panel content', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    const trigger = screen.getByRole('button', { name: /is this accessible/i });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/real button with aria-expanded/i)).toBeVisible();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('is keyboard-operable: Tab focuses the trigger, Enter/Space toggle it', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    const trigger = screen.getByRole('button', { name: /is this accessible/i });

    await user.tab();
    expect(trigger).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('the panel is aria-labelledby the trigger and role=region', () => {
    render(<Wrapper />);
    const region = screen.getByRole('region', { hidden: true });
    const trigger = screen.getByRole('button', { name: /is this accessible/i });
    expect(region).toHaveAttribute('aria-labelledby', trigger.id);
  });
});

describe('AccordionItem onToggle callback', () => {
  it('calls onToggle exactly once per activation', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <AccordionItem title="Q" isOpen={false} onToggle={onToggle}>
        A
      </AccordionItem>,
    );
    await user.click(screen.getByRole('button', { name: 'Q' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
