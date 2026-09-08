import { useEvent, useAboutSections } from '../../lib/queries.js';
import { formatDate, formatTime } from '../../lib/format.js';
import { Section, SectionHeader, SectionEyebrow, SectionTitle } from '../layout/Section.js';

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

  // Nested-card grammar (wireframe 1a "01/About"): a muted section shell
  // holding What/Why/Who + Where/When as white fact cards. Where/When
  // come straight from the event row; What falls back to a generic
  // description only when the admin hasn't written one, and Why/Who are
  // evergreen framing that stays true regardless of programming details.
  const facts = [
    {
      label: 'What',
      body:
        event?.description ??
        'A one-day, student-organized cloud conference bringing the AWS user-group model to campus.',
    },
    { label: 'Why', body: 'Learn AWS from people building on it, not just reading about it.' },
    { label: 'Who', body: 'Any student, any college, any year. No cloud experience needed.' },
    { label: 'Where', body: event?.venue ?? 'To be announced' },
    {
      label: 'When',
      body:
        event?.startTime && event.endTime
          ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}, ${formatDate(event?.eventDate)}`
          : formatDate(event?.eventDate),
    },
  ];

  return (
    <Section id="about" muted>
      <SectionHeader>
        <SectionEyebrow>About the event</SectionEyebrow>
        <SectionTitle>Student Community Day, built for builders</SectionTitle>
      </SectionHeader>
      <div className="about-fact-grid">
        {facts.map((fact) => (
          <div key={fact.label} className="about-fact-card">
            <span className="about-fact-label">{fact.label}</span>
            <p>{fact.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
