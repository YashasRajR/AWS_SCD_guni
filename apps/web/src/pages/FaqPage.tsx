import type { Faq } from '@scd/types';
import { useResource } from '../lib/hooks.js';

export function FaqPage() {
  const { items: faqs, loading, error } = useResource<Faq>('/faqs');

  const groups = new Map<string, Faq[]>();
  for (const faq of faqs) {
    const key = faq.category ?? 'General';
    const bucket = groups.get(key);
    if (bucket) bucket.push(faq);
    else groups.set(key, [faq]);
  }

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>Frequently asked questions</h1>
        <p className="page-section-lede">Can&apos;t find your answer here? Reach out to the organizing team.</p>
      </header>

      {loading && <p className="status-line">Loading FAQs…</p>}
      {error && <p className="status-line status-error">{error}</p>}
      {!loading && !error && faqs.length === 0 && <p className="status-line">FAQs will be published soon.</p>}

      {[...groups.entries()].map(([category, items]) => (
        <div key={category} className="faq-group">
          <h2 className="faq-group-title">{category}</h2>
          <div className="faq-list">
            {items.map((f) => (
              <details key={f.id} className="faq-item">
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
