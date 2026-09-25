import { useState } from 'react';
import { useEvent, useAboutSections } from '../../lib/queries.js';
import { formatTime } from '../../lib/format.js';

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
      short: 'A premier one-day student cloud conference.',
      detail:
        event?.description ??
        'Hands-on workshops, keynotes, technical deep dives, and peer learning on real-world cloud architectures.',
    },
    {
      id: 'why',
      label: 'Why',
      short: 'Learn AWS from engineers building on it.',
      detail:
        'Practical knowledge from AWS Community Builders, User Group leaders, and cloud engineers who started as students.',
    },
    {
      id: 'who',
      label: 'Who',
      short: 'Any student. No prior cloud experience required.',
      detail:
        'All colleges, all branches, all years. Whether you just wrote your first hello-world or already deploy microservices.',
    },
    {
      id: 'where',
      label: 'Where',
      short: event?.venue ?? 'Centre of Excellence, GUNI Campus.',
      detail: 'Ganpat Vidyanagar, Mehsana, Gujarat 384012. State-of-the-art campus labs and auditorium.',
    },
    {
      id: 'when',
      label: 'When',
      short:
        event?.startTime && event.endTime
          ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}, 8 October.`
          : '09:00 – 17:30, 8 October 2026.',
      detail:
        'Registration opens 09:00 sharp. Includes keynote, workshops, lunch, labs, and closing networking ceremony.',
    },
  ];

  const pillars = [
    {
      id: 'mission',
      title: 'Our Mission',
      tag: 'PURPOSE',
      description:
        'To bridge the gap between classroom theory and industry reality by providing students with hands-on AWS training, expert mentorship, and a collaborative environment to build real-world cloud applications.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      id: 'vision',
      title: 'Our Vision',
      tag: 'OUTLOOK',
      description:
        'To establish Ganpat University as a leading hub for cloud innovation, cultivating a highly skilled community of certified AWS student developers who are fully equipped to excel in the global tech industry.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      id: 'objectives',
      title: 'Key Objectives',
      tag: 'ROADMAP',
      points: [
        'Learn the fundamentals and advanced architectures of the AWS ecosystem.',
        'Connect with cloud professionals to unlock career guidance and networks.',
        'Gain verifiable skills through cloud deployments and industry certifications.',
      ],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
  ];


  return (
    <section id="about" className="section about-enhanced-section" style={{ paddingTop: '50px', paddingBottom: '60px' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Section Header */}
        <div>
          <h2 className="d1" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', margin: '0' }}>
            AWS Student Community Day &amp; AWS SBG GUNI
          </h2>
        </div>

        {/* Highlight Manifesto: What Are We? */}
        <div
          className="k"
          style={{
            background: 'linear-gradient(135deg, #16191f 0%, #232f3e 100%)',
            color: '#fff',
            padding: '28px 32px',
            border: '1.5px solid rgba(255, 153, 0, 0.4)',
            borderRadius: '6px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="chip"
              style={{
                background: 'var(--scd-accent, #ff9900)',
                color: '#000',
                fontWeight: 700,
                fontSize: '11px',
                fontFamily: 'var(--scd-mono, monospace)',
                padding: '3px 10px',
              }}
            >
              WHAT ARE WE?
            </span>
          </div>
          <p
            style={{
              fontSize: 'clamp(15px, 1.6vw, 19px)',
              lineHeight: 1.6,
              color: '#f4f6f8',
              margin: 0,
              fontWeight: 400,
            }}
          >
            The <strong style={{ color: '#fff', fontWeight: 700 }}>AWS Student Builders Group at Ganpat University</strong> is a community of <strong style={{ color: 'var(--scd-accent, #ff9900)' }}>passionate builders</strong>, learning and experimenting with cloud technologies. Our mission is to empower students with the skills, hands-on experience, and network needed to thrive in a cloud-first world.
          </p>
        </div>

        {/* 3 Core Pillars: Mission, Vision, Objectives */}
        <div>
          <div className="card-grid card-grid-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="k"
                style={{
                  background: 'var(--scd-surface, #fff)',
                  border: '1.25px solid var(--scd-border)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderRadius: '4px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: 'rgba(255, 153, 0, 0.12)',
                      color: 'var(--scd-accent, #ff9900)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pillar.icon}
                  </div>
                  <span
                    className="chip mo"
                    style={{
                      fontSize: '10px',
                      color: 'var(--scd-muted)',
                      border: '1px solid var(--scd-border)',
                    }}
                  >
                    {pillar.tag}
                  </span>
                </div>

                <h4 className="d3" style={{ fontSize: '18px', margin: 0, color: 'var(--scd-primary)' }}>
                  {pillar.title}
                </h4>

                {pillar.description && (
                  <p className="tx" style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--scd-muted)', margin: 0 }}>
                    {pillar.description}
                  </p>
                )}

                {pillar.points && (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pillar.points.map((pt, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--scd-muted)', lineHeight: 1.45 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--scd-accent, #ff9900)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Conference Essentials: Interactive 5-Card Reference */}
        <div>
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="d2" style={{ fontSize: '20px', margin: 0, color: 'var(--scd-primary)' }}>
              Conference Essentials
            </h3>
            <span className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
              Tap any card to expand details
            </span>
          </div>

          <div className="r" style={{ flexWrap: 'wrap', gap: '12px' }}>
            {facts.map((f) => {
              const isExpanded = expandedId === f.id;
              return (
                <div
                  key={f.id}
                  className="k"
                  style={{
                    flex: '1 1 220px',
                    background: '#fff',
                    cursor: 'pointer',
                    borderColor: isExpanded ? 'var(--scd-accent, #ff9900)' : 'var(--scd-border)',
                    boxShadow: isExpanded ? '0 6px 20px rgba(255, 153, 0, 0.12)' : undefined,
                    transition: 'all 0.2s ease',
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
                    <p className="d3" style={{ fontSize: '15px' }}>{f.label}</p>
                    <span
                      className="mo"
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: isExpanded ? 'var(--scd-accent, #ff9900)' : 'var(--scd-muted)',
                      }}
                    >
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                  <p className="tx" style={{ fontWeight: 500, fontSize: '12.5px', marginTop: '4px' }}>
                    {f.short}
                  </p>
                  {isExpanded && (
                    <div className="kd" style={{ marginTop: '8px', background: 'var(--scd-surface-muted, #f4f6f8)', padding: '10px' }}>
                      <p className="tx" style={{ fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                        {f.detail}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom CMS About Sections if any are published */}
        {customSections.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {customSections.map((s) => (
              <div key={s.id} className="kd" style={{ background: '#fff', border: '1px solid var(--scd-border)' }}>
                <p className="lbl" style={{ color: 'var(--scd-primary)', fontWeight: 700 }}>{s.title}</p>
                <p className="tx" style={{ fontSize: '13px', lineHeight: 1.5 }}>{s.body}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
