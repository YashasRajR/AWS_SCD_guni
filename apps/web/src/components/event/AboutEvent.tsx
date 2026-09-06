import { useEvent, useAboutSections } from '../../lib/queries.js';
import { Section, SectionHeader, SectionEyebrow, SectionTitle } from '../layout/Section.js';

const FALLBACK_POINTS = [
  'A full day of AWS-focused talks, workshops, and hands-on sessions built for students.',
  'Meet practitioners working with the cloud, and ask the questions a lecture hall never has time for.',
  'Walk away with a clearer path into cloud, DevOps, and modern software careers.',
  'Connect with other student builders from across the community — the kind of network that outlasts the day.',
];

/**
 * About Student Community Day (spec #6). CMS-driven: admin-authored,
 * ordered `about_sections` render here when any are PUBLISHED. Falls back
 * to the original hand-written framing copy when none have been
 * published yet, same fallback pattern as the hero/header (327bc74).
 */
export function AboutEvent() {
  const { data: event } = useEvent();
  const { items: sections } = useAboutSections();

  if (sections.length > 0) {
    return (
      <Section id="about" muted>
        <SectionHeader>
          <SectionEyebrow>About the event</SectionEyebrow>
          <SectionTitle>Student Community Day, built for builders</SectionTitle>
        </SectionHeader>
        <div className="about-sections-list">
          {sections.map((section) => (
            <article key={section.id} className="about-section-block">
              {section.imageUrl && <img src={section.imageUrl} alt="" className="about-section-image" />}
              <div>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
                {section.linkUrl && (
                  <a href={section.linkUrl} target="_blank" rel="noreferrer">
                    {section.linkLabel ?? 'Learn more'}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section id="about" muted>
      <div className="about-grid">
        <div>
          <SectionHeader>
            <SectionEyebrow>About the event</SectionEyebrow>
            <SectionTitle>Student Community Day, built for builders</SectionTitle>
          </SectionHeader>
          <div className="about-copy">
            <p>
              {event?.description ??
                'AWS Student Community Day brings the AWS user-group model to campus — a student-organized, community-run day of learning, building, and connecting around the cloud.'}
            </p>
            <p>
              It&apos;s for anyone curious about cloud computing, whether you&apos;ve deployed your first Lambda
              function or you&apos;re still deciding what AWS stands for. No prerequisites, just curiosity.
            </p>
          </div>
        </div>

        <ul className="about-points">
          {FALLBACK_POINTS.map((point) => (
            <li key={point}>
              <span className="about-points-mark" aria-hidden="true">
                →
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
