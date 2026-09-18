/**
 * Fades/rises any [data-reveal] element into view the first time it
 * crosses into the viewport, with a short stagger for reveal elements
 * that share a parent (card grids, stat rows, etc.). One observer for
 * the whole app -- mounted once from Layout -- rather than a
 * useIntersectionObserver hook per component.
 *
 * A MutationObserver picks up elements added after the initial mount
 * (API-loaded lists, route changes) so newly-rendered [data-reveal]
 * nodes still get observed without every page wiring this up itself.
 * Actual motion is governed by the CSS transition on [data-reveal] --
 * the global prefers-reduced-motion rule in tokens.css already
 * collapses that to effectively instant, so nothing extra is needed
 * here for accessibility.
 */
export function initScrollReveal(): () => void {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
        const index = siblings.indexOf(el);
        el.style.transitionDelay = `${Math.max(index, 0) % 8 * 60}ms`;
        el.classList.add('is-revealed');
        io.unobserve(el);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
  );

  const observeNew = () => {
    document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => io.observe(el));
  };
  observeNew();

  const mo = new MutationObserver(observeNew);
  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
  };
}
