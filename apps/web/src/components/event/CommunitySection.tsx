import { Section, SectionHeader, SectionEyebrow, SectionTitle, SectionDescription } from '../layout/Section.js';

const COMMUNITY_POINTS = [
  { title: 'Meet fellow students', description: 'From your own campus and beyond — people building the same skills you are.' },
  { title: 'Connect with developers', description: 'Talk shop with practitioners who work with AWS day to day.' },
  { title: 'Discover the AWS community', description: 'Find your way into the wider student and user-group ecosystem.' },
];

/** Visually distinct — dark surface, different rhythm from the surrounding info sections. */
export function CommunitySection() {
  return (
    <Section id="community">
      <div className="community-section">
        <SectionHeader center>
          <SectionEyebrow>Community</SectionEyebrow>
          <SectionTitle>More than a day of talks</SectionTitle>
          <SectionDescription>
            Student Community Day exists because the people in the room matter as much as what&apos;s on stage.
          </SectionDescription>
        </SectionHeader>
        <div className="community-grid">
          {COMMUNITY_POINTS.map((p) => (
            <div key={p.title} className="community-card">
              <h3>{p.title}</h3>
              <p>{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
