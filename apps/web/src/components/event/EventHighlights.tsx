import { useState } from 'react';

interface HighlightItem {
  id: string;
  title: string;
  tagline: string;
  detail: string;
}

const HIGHLIGHTS: HighlightItem[] = [
  {
    id: 'learn',
    title: 'Learn',
    tagline: 'Deepen your cloud foundations with real architectures.',
    detail: 'Attend curated technical sessions covering AWS Core Services, Serverless, AI/ML models on SageMaker, and scalable backend design delivered by AWS experts and community heroes.',
  },
  {
    id: 'build',
    title: 'Build',
    tagline: 'Ship live infrastructure before you leave the room.',
    detail: 'Hands-on guided labs where you log into live AWS environments, write code, deploy serverless functions, and configure infrastructure without having to worry about cloud bills.',
  },
  {
    id: 'connect',
    title: 'Connect',
    tagline: 'Find your co-founders, study partners, and team.',
    detail: 'Engage with fellow student builders across engineering colleges in Gujarat. Exchange ideas, join ongoing open-source hackathons, and tap into the local AWS Cloud Club ecosystem.',
  },
  {
    id: 'compete',
    title: 'Compete',
    tagline: 'Put your architectural knowledge to the test.',
    detail: 'Participate in fast-paced live architecture quizzes, debugging sprints, and cloud scavenger hunts with exclusive AWS student swags, credits, and recognition vouchers.',
  },
  {
    id: 'create',
    title: 'Create',
    tagline: 'Bring innovative cloud ideas into reality.',
    detail: 'Work on community problem statements, design real-world solutions for campus and local initiatives, and get immediate feedback on your cloud architecture from senior practitioners.',
  },
  {
    id: 'network',
    title: 'Network',
    tagline: 'Bridge the gap between campus and industry.',
    detail: 'Direct conversations with cloud architects, hiring managers, AWS Community Builders, and startup founders who share actionable career paths and internship opportunities.',
  },
];

export function EventHighlights() {
  const [activeId, setActiveId] = useState<string>('learn');
  const active = HIGHLIGHTS.find((h) => h.id === activeId) || HIGHLIGHTS[0]!;

  return (
    <section id="highlights" className="section" style={{ paddingTop: '20px', paddingBottom: '36px' }}>
      <div className="container">
        <div className="r highlights-matrix" style={{ alignItems: 'stretch' }}>
          {/* Left Central Card (Info Layer) */}
          <div
            className="k"
            style={{
              flex: '1.4 1 340px',
              minHeight: '180px',
              justifyContent: 'space-between',
              background: '#fff',
              border: '1.5px solid var(--primary, #232F3E)',
              padding: '24px',
              borderRadius: '4px',
            }}
          >
            <div>
              <h3 className="d2" style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', fontWeight: 800, margin: '0 0 6px', color: 'var(--primary, #232F3E)' }}>
                What&apos;s waiting for you?
              </h3>
              <p className="tx" style={{ color: 'var(--muted, #656d79)', fontSize: '0.95rem', margin: 0 }}>
                Six ways to spend the day. Pick one to see what it involves.
              </p>
            </div>

            <div
              className="kd"
              style={{
                background: 'var(--surface-muted, #f8f6fc)',
                border: '1.25px dashed var(--scd-border, #9a958c)',
                padding: '16px 20px',
                borderRadius: '4px',
                marginTop: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p className="lbl" style={{ color: 'var(--primary, #232F3E)', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
                  {active.title} — {active.tagline}
                </p>
                <span
                  className="chip on"
                  style={{
                    background: 'var(--scd-accent, #FF9900)',
                    color: '#14181F',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '999px',
                  }}
                >
                  Active
                </span>
              </div>
              <p className="tx" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#3d3a34', margin: 0 }}>
                {active.detail}
              </p>
            </div>
          </div>

          {/* Right Satellites (2 columns of 3) */}
          <div className="c" style={{ flex: '1 1 280px', gap: '10px' }}>
            <div className="r" style={{ gap: '10px' }}>
              {HIGHLIGHTS.slice(0, 2).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className={`highlights-satellite-btn ${activeId === h.id ? 'active' : ''}`}
                  onClick={() => setActiveId(h.id)}
                >
                  <span className="d3" style={{ fontSize: '16px', fontWeight: 700 }}>{h.title}</span>
                </button>
              ))}
            </div>

            <div className="r" style={{ gap: '10px' }}>
              {HIGHLIGHTS.slice(2, 4).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className={`highlights-satellite-btn ${activeId === h.id ? 'active' : ''}`}
                  onClick={() => setActiveId(h.id)}
                >
                  <span className="d3" style={{ fontSize: '16px', fontWeight: 700 }}>{h.title}</span>
                </button>
              ))}
            </div>

            <div className="r" style={{ gap: '10px' }}>
              {HIGHLIGHTS.slice(4, 6).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className={`highlights-satellite-btn ${activeId === h.id ? 'active' : ''}`}
                  onClick={() => setActiveId(h.id)}
                >
                  <span className="d3" style={{ fontSize: '16px', fontWeight: 700 }}>{h.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
