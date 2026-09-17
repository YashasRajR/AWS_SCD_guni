import { useState } from 'react';
import { useEvent, useAboutSections } from '../../lib/queries.js';
import { formatDate, formatTime } from '../../lib/format.js';

interface FactItem {
  id: string;
  label: string;
  short: string;
  detail: string;
}

export function AboutEvent() {
  const { data: event } = useEvent();
  const { items: customSections } = useAboutSections();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const facts: FactItem[] = [
    {
      id: 'what',
      label: 'What',
      short: 'A one-day student cloud conference.',
      detail:
        event?.description ??
        'Hands-on workshops, keynotes, technical deep dives, and peer learning on real-world cloud architectures.',
    },
    {
      id: 'why',
      label: 'Why',
      short: 'Learn AWS from people building on it.',
      detail:
        'Practical knowledge from AWS Community Builders, User Group leaders, and cloud engineers who started as students.',
    },
    {
      id: 'who',
      label: 'Who',
      short: 'Any student. No cloud experience needed.',
      detail:
        'All colleges, all branches, all years. Whether you just wrote your first hello-world or already deploy containers.',
    },
    {
      id: 'where',
      label: 'Where',
      short: event?.venue ?? 'Centre of Excellence, GUNI campus.',
      detail: 'Ganpat Vidyanagar, Mehsana, Gujarat 384012. State-of-the-art campus labs and auditorium.',
    },
    {
      id: 'when',
      label: 'When',
      short: event?.startTime && event.endTime
        ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}, 8 October.`
        : '09:00 – 17:30, 8 October 2026.',
      detail: 'Registration opens 09:00 sharp. Includes keynote, workshops, lunch, labs, and closing networking ceremony.',
    },
  ];

  return (
    <section id="about" className="section" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="container">
        <div className="k mut" style={{ padding: '24px', gap: '16px' }}>
          <div>
            <p className="mo">01 / About</p>
            <p className="d2" style={{ marginTop: '4px' }}>AWS Students Community Day</p>
          </div>

          {/* Row 1: What, Why, Who */}
          <div className="r" style={{ flexWrap: 'wrap', gap: '12px' }}>
            {facts.slice(0, 3).map((f) => {
              const isExpanded = expandedId === f.id;
              return (
                <div
                  key={f.id}
                  className="k"
                  style={{
                    flex: '1 1 240px',
                    background: '#fff',
                    cursor: 'pointer',
                    borderColor: isExpanded ? 'var(--accent)' : 'var(--primary)',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : f.id);
                    }
                  }}
                >
                  <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="d3">{f.label}</p>
                    <span className="mo" style={{ fontSize: '0.8rem', color: isExpanded ? 'var(--accent)' : 'var(--muted)' }}>
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                  <p className="tx" style={{ fontWeight: 500 }}>{f.short}</p>
                  {isExpanded && (
                    <div className="kd" style={{ marginTop: '6px', background: 'var(--surface-muted)' }}>
                      <p className="tx" style={{ fontSize: '0.85rem' }}>{f.detail}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Row 2: Where, When, Expansion Hint */}
          <div className="r" style={{ flexWrap: 'wrap', gap: '12px' }}>
            {facts.slice(3, 5).map((f) => {
              const isExpanded = expandedId === f.id;
              return (
                <div
                  key={f.id}
                  className="k"
                  style={{
                    flex: '1 1 240px',
                    background: '#fff',
                    cursor: 'pointer',
                    borderColor: isExpanded ? 'var(--accent)' : 'var(--primary)',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : f.id);
                    }
                  }}
                >
                  <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="d3">{f.label}</p>
                    <span className="mo" style={{ fontSize: '0.8rem', color: isExpanded ? 'var(--accent)' : 'var(--muted)' }}>
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                  <p className="tx" style={{ fontWeight: 500 }}>{f.short}</p>
                  {isExpanded && (
                    <div className="kd" style={{ marginTop: '6px', background: 'var(--surface-muted)' }}>
                      <p className="tx" style={{ fontSize: '0.85rem' }}>{f.detail}</p>
                    </div>
                  )}
                </div>
              );
            })}

            <div
              className="kd"
              style={{
                flex: '1 1 240px',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                minHeight: '80px',
                borderColor: 'var(--border-dashed)',
              }}
            >
              <p className="mo" style={{ color: 'var(--primary)' }}>
                Tap a card → expands in place
              </p>
            </div>
          </div>

          {/* Custom CMS About Sections if any are published */}
          {customSections.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {customSections.map((s) => (
                <div key={s.id} className="kd" style={{ background: '#fff' }}>
                  <p className="lbl">{s.title}</p>
                  <p className="tx">{s.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
