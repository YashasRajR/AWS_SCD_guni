import { useId } from 'react';
import type { ReactNode } from 'react';

interface AccordionItemProps {
  title: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * A single accessible, keyboard-operable accordion item: a real <button>
 * (focusable, Enter/Space activate it natively) with aria-expanded and
 * aria-controls pointing at the panel, which carries role="region" and
 * aria-labelledby back to the trigger. The panel animates open/closed via
 * a CSS grid-rows trick (see .accordion-panel-wrap in index.css) so height
 * never has to be measured in JS, and prefers-reduced-motion disables the
 * transition globally.
 */
export function AccordionItem({ title, isOpen, onToggle, children }: AccordionItemProps) {
  const reactId = useId();
  const triggerId = `accordion-trigger-${reactId}`;
  const panelId = `accordion-panel-${reactId}`;

  return (
    <div className="accordion-item">
      <h3 style={{ margin: 0 }}>
        <button
          type="button"
          id={triggerId}
          className="accordion-trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span>{title}</span>
          <span className="accordion-icon" aria-hidden="true">
            +
          </span>
        </button>
      </h3>
      <div className={isOpen ? 'accordion-panel-wrap accordion-panel-wrap-open' : 'accordion-panel-wrap'}>
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="accordion-panel"
          aria-hidden={!isOpen}
        >
          <div className="accordion-panel-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
