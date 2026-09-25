import { useRef, useState, useEffect } from 'react';
import { Section, SectionHeader, SectionEyebrow, SectionTitle, SectionDescription } from '../layout/Section.js';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  tagline: string;
  photo: string;
  linkedin: string;
  team: string;
  badgeVariant?: 'accent' | 'primary' | 'secondary' | 'info';
}

export const TEAM_MEMBERS: TeamMember[] = [
  // Mentorship & Leadership
  {
    id: 'kiran-amin',
    name: 'Dr. Kiran Amin',
    role: 'Senior Mentor',
    tagline: 'Deputy Pro Vice Chancellor & Executive Dean FoET Principal (GUNI - UVPCE)',
    photo: '/gallery/KiranAmin.png',
    linkedin: 'https://www.linkedin.com/school/ganpat-university/',
    team: 'Mentorship',
    badgeVariant: 'accent',
  },
  {
    id: 'pravesh-patel',
    name: 'Dr. Pravesh Patel',
    role: 'Faculty Coordinator',
    tagline: 'Academic Innovation & Cloud Architect Bridge',
    photo: '/gallery/Pravesh.png',
    linkedin: 'https://linkedin.com/in/pravesh-patel-43573a10',
    team: 'Mentorship',
    badgeVariant: 'accent',
  },
  {
    id: 'harshil-maniyar',
    name: 'Harshil Maniyar',
    role: 'AWS SBG Leader',
    tagline: 'Technical Leadership & Cloud Innovation Guide',
    photo: '/gallery/Harshil.png',
    linkedin: 'https://linkedin.com/in/harshil-maniyar-7a20b832a',
    team: 'Leadership',
    badgeVariant: 'accent',
  },
  {
    id: 'aric-pandya',
    name: 'Aric Pandya',
    role: 'Advisor',
    tagline: 'Guiding student cloud builders through advanced architectural principles and cloud roadmaps',
    photo: '/gallery/Aric.png',
    linkedin: 'https://linkedin.com/in/aricpandya',
    team: 'Advisor',
    badgeVariant: 'accent',
  },

  // Developer Team
  {
    id: 'yashas-raj',
    name: 'Yashas Raj R',
    role: 'Developer Team',
    tagline: 'Building ideas into reality',
    photo: '/gallery/Yashas.png',
    linkedin: 'https://linkedin.com/in/yashas-raj-116037325',
    team: 'Developer',
    badgeVariant: 'primary',
  },
  {
    id: 'soha-jethva',
    name: 'Soha Jethva',
    role: 'Developer Team',
    tagline: 'Driven by innovation, powered by technology',
    photo: '/gallery/SohaJethva.png',
    linkedin: 'https://linkedin.com/in/soha-jethva',
    team: 'Developer',
    badgeVariant: 'primary',
  },

  // PR Team
  {
    id: 'hetvi-dedania',
    name: 'Hetvi Dedania',
    role: 'PR Team',
    tagline: 'Turning ideas into meaningful connection',
    photo: '/gallery/Hetvi.png',
    linkedin: 'https://linkedin.com/in/hetvi-dedania-788574383',
    team: 'PR Team',
    badgeVariant: 'info',
  },
  {
    id: 'anshika-tiwari',
    name: 'Anshika Tiwari',
    role: 'PR Team',
    tagline: 'Building student engagement and public communication pathways',
    photo: '/gallery/Anshika.png',
    linkedin: 'https://linkedin.com/in/anshika-tiwari-171970337',
    team: 'PR Team',
    badgeVariant: 'info',
  },
  {
    id: 'hiya-patel',
    name: 'Hiya Vipulkumar Patel',
    role: 'PR Team',
    tagline: 'Growing through code, cloud, and collaboration',
    photo: '/gallery/Hiya.png',
    linkedin: 'https://linkedin.com/in/hiya-patel-bbb196379',
    team: 'PR Team',
    badgeVariant: 'info',
  },
  {
    id: 'dhruv-mehta',
    name: 'Dhruv Mehta',
    role: 'PR Team',
    tagline: 'Fostering digital community building and outreach campaigns',
    photo: '/gallery/Dhruv.png',
    linkedin: 'https://linkedin.com/in/dhruvmehta18',
    team: 'PR Team',
    badgeVariant: 'info',
  },

  // Media Team
  {
    id: 'mayank-taranekar',
    name: 'Mayank Taranekar',
    role: 'Media Team',
    tagline: 'Directing community highlights and professional photography coverage',
    photo: '/gallery/Mayank.png',
    linkedin: 'https://linkedin.com/in/taranekar',
    team: 'Media Team',
    badgeVariant: 'secondary',
  },
  {
    id: 'aditya-pandya',
    name: 'Aditya Pandya',
    role: 'Media Team',
    tagline: 'Quietly Creating Impact',
    photo: '/gallery/Aditya.png',
    linkedin: 'https://linkedin.com/in/aditya-pandya-bb1b1032b',
    team: 'Media Team',
    badgeVariant: 'secondary',
  },
  {
    id: 'shanvi-sinha',
    name: 'Shanvi Sinha',
    role: 'Media Team',
    tagline: 'Managing creative event documentation and real-time capture',
    photo: '/gallery/Shanvi.png',
    linkedin: 'https://linkedin.com/in/shanvi-sinha-745b5431a',
    team: 'Media Team',
    badgeVariant: 'secondary',
  },

  // Creative Team
  {
    id: 'aadyasha-swar',
    name: 'Aadyasha Swar',
    role: 'Creative Team',
    tagline: 'Building designs that dominate — making competitors wince',
    photo: '/gallery/Adhyasha.png',
    linkedin: 'https://linkedin.com/in/aadyasha-swar-7575b0347',
    team: 'Creative Team',
    badgeVariant: 'primary',
  },
  {
    id: 'anshu-singh',
    name: 'Anshu Singh',
    role: 'Creative Team',
    tagline: 'Turning Imagination into Innovation',
    photo: '/gallery/Anshu.png',
    linkedin: 'https://linkedin.com/in/anshu-singh-583651384',
    team: 'Creative Team',
    badgeVariant: 'primary',
  },
  {
    id: 'heer-patel',
    name: 'Heer Patel',
    role: 'Creative Team',
    tagline: 'Crafting responsive user experiences for our web platforms',
    photo: '/gallery/Heer.png',
    linkedin: 'https://linkedin.com/in/heer501',
    team: 'Creative Team',
    badgeVariant: 'primary',
  },

  // Event Management Team
  {
    id: 'diksha-patel',
    name: 'Diksha Jayeshkumar Patel',
    role: 'Event Management',
    tagline: 'Deploying Ideas to Experiences',
    photo: '/gallery/Diksha.png',
    linkedin: 'https://linkedin.com/in/diksha-patel0019',
    team: 'Event Mgmt',
    badgeVariant: 'info',
  },
  {
    id: 'varun-vishwakarma',
    name: 'Varun Vishwakarma',
    role: 'Event Management',
    tagline: 'Turning ideas into impactful events through seamless planning and execution',
    photo: '/gallery/Varun.png',
    linkedin: 'https://linkedin.com/in/varun-vishwakarma-b563731b2',
    team: 'Event Mgmt',
    badgeVariant: 'info',
  },
  {
    id: 'ashish-mourya',
    name: 'Ashish Mourya',
    role: 'Event Management',
    tagline: 'Passion for planning, excellence in execution',
    photo: '/gallery/Ashish.png',
    linkedin: 'https://linkedin.com/in/ashish-mourya-706954376',
    team: 'Event Mgmt',
    badgeVariant: 'info',
  },
  {
    id: 'aryan-prajapati',
    name: 'Prajapati Aryan R.',
    role: 'Event Management',
    tagline: 'Turning ideas into unforgettable experiences',
    photo: '/gallery/Aryan.png',
    linkedin: 'https://linkedin.com/in/aryan-prajapati-2946vish2211',
    team: 'Event Mgmt',
    badgeVariant: 'info',
  },

  // Documentation Team
  {
    id: 'vansh-patel',
    name: 'Patel Vansh Gautambhai',
    role: 'Documentation Team',
    tagline: 'Turning Moment into Legacy',
    photo: '/gallery/Vansh.png',
    linkedin: 'https://linkedin.com/in/vansh-patel-2055aa347',
    team: 'Documentation',
    badgeVariant: 'secondary',
  },
  {
    id: 'krina-koshti',
    name: 'Krina Koshti',
    role: 'Documentation Team',
    tagline: 'Capturing the journey that defines our community',
    photo: '/gallery/Krina.png',
    linkedin: 'https://linkedin.com/in/krina-koshti-41429b365',
    team: 'Documentation',
    badgeVariant: 'secondary',
  },

  // Technical Team
  {
    id: 'ranit-pan',
    name: 'Pan Ranit Ramkrishna',
    role: 'Technical Team',
    tagline: 'Transforming challenges into technical solutions',
    photo: '/gallery/Ranit.png',
    linkedin: 'https://linkedin.com/in/ranit-pan-493b3837a',
    team: 'Technical Team',
    badgeVariant: 'primary',
  },
  {
    id: 'man-patel',
    name: 'Man Patel',
    role: 'Technical Team',
    tagline: 'Turning complex logic into seamless reality',
    photo: '/gallery/Man.png',
    linkedin: 'https://linkedin.com/in/mann-patel-0300b5308',
    team: 'Technical Team',
    badgeVariant: 'primary',
  },
];

export function TeamSection() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Update button active state on scroll
  const updateScrollButtons = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    rowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <Section id="team" className="team-section-wrap">
      <SectionHeader
        action={
          <div className="team-scroll-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="chip mo"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--scd-muted)',
                background: 'var(--scd-surface-muted)',
              }}
            >
              {TEAM_MEMBERS.length} Members
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left in team members row"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                border: '1.25px solid var(--scd-border)',
                opacity: canScrollLeft ? 1 : 0.35,
                cursor: canScrollLeft ? 'pointer' : 'default',
                background: 'var(--scd-surface)',
                color: 'var(--scd-primary)',
              }}
            >
              ←
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right in team members row"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                border: '1.25px solid var(--scd-border)',
                opacity: canScrollRight ? 1 : 0.35,
                cursor: canScrollRight ? 'pointer' : 'default',
                background: 'var(--scd-surface)',
                color: 'var(--scd-primary)',
              }}
            >
              →
            </button>
          </div>
        }
      >
        <SectionEyebrow>Team</SectionEyebrow>
        <SectionTitle>Meet the Builders &amp; Organizers</SectionTitle>
        <SectionDescription>
          The faculty mentors, student leads, and creators behind AWS Student Community Day 2026.
        </SectionDescription>
      </SectionHeader>

      {/* Single Continuous Row with all members present */}
      <div
        ref={rowRef}
        className="team-single-row-track"
        tabIndex={0}
        aria-label="Team members row"
      >
        {TEAM_MEMBERS.map((member) => (
          <article key={member.id} className="team-member-card k">
            {/* Portrait Image */}
            <div className="team-member-photo-wrap">
              <img
                src={member.photo}
                alt={member.name}
                loading="lazy"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className={`team-subteam-badge badge-${member.badgeVariant ?? 'accent'}`}>
                {member.team}
              </span>
            </div>

            {/* Information */}
            <div className="team-member-info">
              <h3 className="team-member-name d3">{member.name}</h3>
              <p className="team-member-role mo">{member.role}</p>
              <p className="team-member-tagline tx">{member.tagline}</p>

              {/* LinkedIn Action */}
              <div className="team-member-footer">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="team-linkedin-btn"
                  aria-label={`${member.name}'s LinkedIn Profile`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.84 6.2a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
                  </svg>
                  <span>Connect</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
