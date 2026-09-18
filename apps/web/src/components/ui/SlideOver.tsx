import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * A right-edge overlay panel (Mood-Indigo-style card drill-down -- see
 * tokens.css header). Reuses the .popup-overlay backdrop convention
 * (fixed, full-viewport, dismiss-on-backdrop-click) but slides a panel
 * in from the right instead of centering a card, with just a close
 * button -- there's no "back" step since each panel shows one item.
 */
export function SlideOver({ open, onClose, title, children }: SlideOverProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="slideover-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="slideover-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="slideover-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className="slideover-body">{children}</div>
      </div>
    </div>
  );
}
