import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api.js';

interface SearchResult {
  type: 'ATTENDEE' | 'REGISTRATION' | 'PAYMENT' | 'INVOICE';
  id: string;
  title: string;
  subtitle: string;
  adminPath: string;
}

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  ATTENDEE: 'Attendee',
  REGISTRATION: 'Registration',
  PAYMENT: 'Payment',
  INVOICE: 'Invoice',
};

/** Cross-entity search bar for the admin topbar — matches attendees,
 * registrations, payments, and invoices in one query (spec #44). The
 * backend only searches the categories the caller's own permissions
 * allow, so results are already scoped correctly per role. */
export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      apiClient
        .get<{ results: SearchResult[] }>('/admin/search', { query: { q: trimmed } })
        .then((data) => setResults(data.results))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const goTo = (result: SearchResult) => {
    navigate(result.adminPath);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="global-search" ref={containerRef}>
      <input
        type="search"
        className="input search-input global-search-input"
        placeholder="Search attendees, registrations, payments, invoices…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim() && (
        <div className="global-search-results">
          {results.length === 0 && <div className="global-search-empty">No matches.</div>}
          {results.map((r) => (
            <button
              type="button"
              key={`${r.type}-${r.id}`}
              className="global-search-result"
              onClick={() => goTo(r)}
            >
              <span className="global-search-result-type">{TYPE_LABELS[r.type]}</span>
              <span className="global-search-result-title">{r.title}</span>
              <span className="global-search-result-subtitle">{r.subtitle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
