import { Section, SectionHeader, SectionEyebrow, SectionTitle } from '../layout/Section.js';
import { RocketIcon, CodeIcon, NetworkIcon, CompassIcon, UsersIcon, TrendingUpIcon } from '../ui/Icon.js';

const HIGHLIGHTS = [
  { icon: <RocketIcon />, title: 'Learn', description: 'Sessions on AWS fundamentals through to advanced, real-world cloud architecture.' },
  { icon: <CodeIcon />, title: 'Build', description: 'Hands-on workshops where you ship something before the day is over.' },
  { icon: <NetworkIcon />, title: 'Network', description: 'Meet practitioners, mentors, and fellow students building in the cloud.' },
  { icon: <CompassIcon />, title: 'Explore', description: 'Discover career paths across cloud, DevOps, and platform engineering.' },
  { icon: <UsersIcon />, title: 'Connect', description: 'Join a growing community of student builders that lasts past the event.' },
  { icon: <TrendingUpIcon />, title: 'Grow', description: 'Leave with skills, contacts, and momentum for what you build next.' },
];

/** Static highlight cards — not part of the API-driven content list. */
export function EventHighlights() {
  return (
    <Section id="highlights">
      <SectionHeader center>
        <SectionEyebrow>Why attend</SectionEyebrow>
        <SectionTitle>What a day here looks like</SectionTitle>
      </SectionHeader>
      <div className="card-grid card-grid-3">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="highlight-card">
            <span className="highlight-icon">{h.icon}</span>
            <h3>{h.title}</h3>
            <p>{h.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
