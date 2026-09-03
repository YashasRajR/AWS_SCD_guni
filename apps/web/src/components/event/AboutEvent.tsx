import { useEvent } from '../../lib/queries.js';
import { Section, SectionHeader, SectionEyebrow, SectionTitle } from '../layout/Section.js';

const POINTS = [
  'A full day of AWS-focused talks, workshops, and hands-on sessions built for students.',
  'Meet practitioners working with the cloud, and ask the questions a lecture hall never has time for.',
  'Walk away with a clearer path into cloud, DevOps, and modern software careers.',
  'Connect with other student builders from across the community — the kind of network that outlasts the day.',
];

/**
 * About Student Community Day — static, hand-written framing copy (this
 * section isn't part of the required API-driven list: event/speakers/
 * sessions/agenda/timeline/venues/faqs/announcements). Uses the real event
 * description from the API when one is published, instead of duplicating it.
 */
export function AboutEvent() {
  const { data: event } = useEvent();

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
          {POINTS.map((point) => (
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
