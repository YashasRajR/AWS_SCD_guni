import { REGISTER_URL } from '../../lib/registration.js';

const COMMUNITY_CARDS = [
  {
    tag: 'Builders',
    title: 'Student Builders',
    description: 'Connect with fellow student builders from campuses across Gujarat exchanging code, projects, and cloud architectures.',
  },
  {
    tag: 'Cloud Club',
    title: 'AWS Cloud Club GUNI',
    description: 'Collaborate with the official Ganpat University AWS student club, organize study jams, and prepare for AWS Certifications.',
  },
  {
    tag: 'Mentorship',
    title: 'Mentors & Industry',
    description: 'Direct access to AWS Heroes, Community Builders, and tech leads offering architectural reviews and career guidance.',
  },
];

export function CommunitySection() {
  return (
    <section id="community" className="section" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="container">
        <div
          className="k inv"
          style={{
            padding: '36px 28px',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--primary)',
          }}
        >
          {/* Crowd Silhouette Graphic (7% opacity) */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '520px',
              height: '140px',
              opacity: 0.07,
              pointerEvents: 'none',
              zIndex: 1,
            }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 500 120" fill="#ffffff" width="100%" height="100%">
              <circle cx="40" cy="40" r="18" />
              <path d="M15 120 C15 75 65 75 65 120 Z" />
              <circle cx="110" cy="32" r="20" />
              <path d="M80 120 C80 65 140 65 140 120 Z" />
              <circle cx="180" cy="45" r="16" />
              <path d="M155 120 C155 80 205 80 205 120 Z" />
              <circle cx="250" cy="30" r="22" />
              <path d="M218 120 C218 60 282 60 282 120 Z" />
              <circle cx="320" cy="42" r="18" />
              <path d="M295 120 C295 76 345 76 345 120 Z" />
              <circle cx="390" cy="35" r="19" />
              <path d="M362 120 C362 70 418 70 418 120 Z" />
              <circle cx="460" cy="40" r="18" />
              <path d="M435 120 C435 75 485 75 485 120 Z" />
            </svg>
          </div>

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p className="mo" style={{ color: 'var(--accent)' }}>Community · AWS SBG GUNI</p>
              <h2 className="d2" style={{ color: '#fff', marginTop: '6px', fontSize: 'clamp(22px, 3vw, 28px)' }}>
                Meet. Build. Learn. Connect.
              </h2>
              <p className="tx" style={{ color: '#cfc9be', marginTop: '6px', maxWidth: '64ch' }}>
                AWS Students Community Day brings together builders from every background. Join the conversation online with{' '}
                <strong style={{ color: '#fff' }}>@aws.sbg_guni</strong>.
              </p>
            </div>

            <div className="r" style={{ flexWrap: 'wrap', gap: '14px' }}>
              {COMMUNITY_CARDS.map((card) => (
                <div
                  key={card.tag}
                  className="kd"
                  style={{
                    flex: '1 1 240px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '16px',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <p className="mo" style={{ color: 'var(--accent)', fontSize: '0.68rem' }}>{card.tag}</p>
                  <p className="lbl" style={{ color: '#fff', fontSize: '15px', marginTop: '4px' }}>{card.title}</p>
                  <p className="tx" style={{ color: '#cfc9be', fontSize: '0.85rem', marginTop: '4px' }}>{card.description}</p>
                </div>
              ))}
            </div>

            <div className="r" style={{ gap: '10px', marginTop: '4px' }}>
              <a
                href="https://instagram.com/aws.sbg_guni"
                target="_blank"
                rel="noopener noreferrer"
                className="btn o"
                style={{ fontSize: '0.75rem' }}
              >
                Follow @aws.sbg_guni →
              </a>
              <a href={REGISTER_URL} target="_blank" rel="noopener noreferrer" className="btn g" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                Join Community Free
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
