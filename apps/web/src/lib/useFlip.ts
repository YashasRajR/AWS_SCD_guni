import { useLayoutEffect, useRef } from 'react';

/**
 * Minimal FLIP (First-Last-Invert-Play) animation for a list whose items
 * reorder/enter/exit — e.g. filtering the sessions list (wireframe 1b:
 * "Filter change = FLIP reposition + fade, never a hard swap"). No library:
 * on every change to `items`, diff each element's position against where it
 * was last render and animate the delta away; new elements fade in.
 * Skips all animation under prefers-reduced-motion.
 */
export function useFlip(containerRef: React.RefObject<HTMLElement>, items: readonly string[]) {
  const prevRects = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      prevRects.current.clear();
      return;
    }

    const seen = new Set<string>();
    container.querySelectorAll<HTMLElement>('[data-flip-id]').forEach((el) => {
      const id = el.dataset.flipId;
      if (!id) return;
      seen.add(id);
      const newRect = el.getBoundingClientRect();
      const oldRect = prevRects.current.get(id);

      if (oldRect) {
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (dx !== 0 || dy !== 0) {
          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          void el.offsetHeight; // force reflow before enabling the transition
          requestAnimationFrame(() => {
            el.style.transition = 'transform 280ms ease';
            el.style.transform = '';
          });
        }
      } else {
        el.style.opacity = '0';
        requestAnimationFrame(() => {
          el.style.transition = 'opacity 220ms ease';
          el.style.opacity = '1';
        });
      }
      prevRects.current.set(id, newRect);
    });

    for (const id of prevRects.current.keys()) {
      if (!seen.has(id)) prevRects.current.delete(id);
    }
  }, [items.join('|')]);
}
