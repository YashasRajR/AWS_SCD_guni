import { useMemo, useState } from 'react';
import type { Faq } from '@scd/types';
import { useFAQs } from '../../lib/queries.js';
import { FAQItem } from './FAQItem.js';
import { SkeletonText } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

interface FAQAccordionProps {
  limit?: number;
}

function groupByCategory(faqs: Faq[]): Map<string, Faq[]> {
  const groups = new Map<string, Faq[]>();
  for (const faq of faqs) {
    const key = faq.category ?? 'General';
    const bucket = groups.get(key);
    if (bucket) bucket.push(faq);
    else groups.set(key, [faq]);
  }
  return groups;
}

/**
 * Keyboard-accessible, ARIA-compliant accordion (see components/ui/Accordion)
 * grouped by category. Multiple items may be open at once — each toggle is
 * independent, tracked by faq id.
 */
export function FAQAccordion({ limit }: FAQAccordionProps) {
  const { items: faqs, loading, error, reload } = useFAQs();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const shown = limit ? faqs.slice(0, limit) : faqs;
  const grouped = useMemo(() => groupByCategory(shown), [shown]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <SkeletonText lines={5} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (faqs.length === 0) return <EmptyState message="FAQs will be published soon." />;

  return (
    <div>
      {[...grouped.entries()].map(([category, items]) => (
        <div key={category} className="faq-group">
          {grouped.size > 1 && <h3 className="faq-group-title">{category}</h3>}
          <div className="accordion">
            {items.map((faq) => (
              <FAQItem key={faq.id} faq={faq} isOpen={openIds.has(faq.id)} onToggle={() => toggle(faq.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
