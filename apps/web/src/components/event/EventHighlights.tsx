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
    <section id="highlights" className="section" style={{ paddingTop: '36px', paddingBottom: '36px' }}>
      <div className="container">
        <div className="c" style={{ gap: '16px' }}>
          <div>
            <p className="mo">02 / Highlights</p>
          </div>

          <div className="r highlights-matrix" style={{ alignItems: 'stretch' }}>
            {/* Left Central Card (Info Layer) */}
            <div className="k" style={{ flex: '1.3 1 340px', minHeight: '180px', justifyContent: 'space-between', background: '#fff' }}>
              <div>
                <p className="d2">What&apos;s waiting for you?</p>
                <p className="tx" style={{ marginTop: '4px', color: 'var(--muted)' }}>
                  Six ways to spend the day. Pick one to see what it involves.
                </p>
              </div>

              <div className="kd" style={{ background: 'var(--surface-muted)', marginTop: '12px' }}>
                <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="lbl" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    {active.title} — {active.tagline}
                  </p>
                  <span className="chip on" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>Active</span>
                </div>
                <p className="tx" style={{ fontSize: '0.88rem', marginTop: '4px' }}>
                  {active.detail}
                </p>
              </div>
            </div>

            {/* Right Satellites (2 columns of 3) */}
            <div className="c" style={{ flex: '1 1 280px', gap: '8px' }}>
              <div className="r" style={{ gap: '8px' }}>
                {HIGHLIGHTS.slice(0, 2).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`highlights-satellite-btn ${activeId === h.id ? 'active' : ''}`}
                    style={{ flex: 1 }}
                    onClick={() => setActiveId(h.id)}
                    onMouseEnter={() => setActiveId(h.id)}
                  >
                    <p className="d3" style={{ fontSize: '15px' }}>{h.title}</p>
                    <p className="mo" style={{ fontSize: '0.65rem', marginTop: '2px', color: 'inherit' }}>Tap to view</p>
                  </button>
                ))}
              </div>

              <div className="r" style={{ gap: '8px' }}>
                {HIGHLIGHTS.slice(2, 4).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`highlights-satellite-btn ${activeId === h.id ? 'active' : ''}`}
                    style={{ flex: 1 }}
                    onClick={() => setActiveId(h.id)}
                    onMouseEnter={() => setActiveId(h.id)}
                  >
                    <p className="d3" style={{ fontSize: '15px' }}>{h.title}</p>
                    <p className="mo" style={{ fontSize: '0.65rem', marginTop: '2px', color: 'inherit' }}>Tap to view</p>
                  </button>
                ))}
              </div>

              <div className="r" style={{ gap: '8px' }}>
                {HIGHLIGHTS.slice(4, 6).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`highlights-satellite-btn ${activeId === h.id ? 'active' : ''}`}
                    style={{ flex: 1 }}
                    onClick={() => setActiveId(h.id)}
                    onMouseEnter={() => setActiveId(h.id)}
                  >
                    <p className="d3" style={{ fontSize: '15px' }}>{h.title}</p>
                    <p className="mo" style={{ fontSize: '0.65rem', marginTop: '2px', color: 'inherit' }}>Tap to view</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
