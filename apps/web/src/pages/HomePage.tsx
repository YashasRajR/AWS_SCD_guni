import { Link } from 'react-router-dom';
import { EventHero } from '../components/event/EventHero.js';
import { EventInfo } from '../components/event/EventInfo.js';
import { AboutEvent } from '../components/event/AboutEvent.js';
import { EventHighlights } from '../components/event/EventHighlights.js';
import { CommunitySection } from '../components/event/CommunitySection.js';
import { SpeakerGrid } from '../components/speakers/SpeakerGrid.js';
import { SessionGrid } from '../components/sessions/SessionGrid.js';
import { AgendaList } from '../components/agenda/AgendaList.js';
import { EventTimeline } from '../components/timeline/EventTimeline.js';
import { VenueGrid } from '../components/venues/VenueGrid.js';
import { FAQAccordion } from '../components/faq/FAQAccordion.js';
import { RegistrationCTA } from '../components/registration/RegistrationCTA.js';
import { PricingGrid } from '../components/pricing/PricingGrid.js';
import { PastEventGrid } from '../components/past-events/PastEventGrid.js';
import { GalleryMarqueeSection } from '../components/gallery/GalleryMarqueeSection.js';
import { TeamSection } from '../components/team/TeamSection.js';
import { Section, SectionHeader, SectionTitle } from '../components/layout/Section.js';
import { useDocumentHead } from '../lib/seo.js';

const TEASER_LIMIT = 4;

/**
 * The primary public page. Order follows the spec: Hero → Event
 * Info → About → Highlights → Past Events → Speakers → Sessions → Agenda → Timeline →
 * Venue → Community → Pricing → FAQ → Registration CTA → Footer.
 */
export function HomePage() {
  useDocumentHead({
    title: 'AWS Student Community Day 2026',
    description:
      'A student-organized, community-run day of AWS talks, workshops, and networking for the campus developer community.',
  });

  return (
    <div>
      <EventHero />
      <EventInfo />

      <Section id="tickets">
        <SectionHeader>
          <SectionTitle>Ticket plans</SectionTitle>
        </SectionHeader>
        <PricingGrid />
      </Section>

      <AboutEvent />
      <EventHighlights />

      <Section id="past-events" muted>
        <SectionHeader
          action={
            <Link to="/past-events" className="btn-link">
              View all →
            </Link>
          }
        >
          <SectionTitle>Our previous editions &amp; meetups</SectionTitle>
        </SectionHeader>
        <PastEventGrid rotary speedSeconds={55} />
      </Section>

      <Section id="speakers">
        <SectionHeader
          action={
            <Link to="/speakers" className="btn-link">
              View all →
            </Link>
          }
        >
          <SectionTitle>Meet who&apos;s taking the stage</SectionTitle>
        </SectionHeader>
        <SpeakerGrid limit={TEASER_LIMIT} fallback />
      </Section>

      <Section id="sessions" muted>
        <SectionHeader
          action={
            <Link to="/sessions" className="btn-link">
              View all →
            </Link>
          }
        >
          <SectionTitle>Talks, workshops, and panels</SectionTitle>
        </SectionHeader>
        <SessionGrid limit={TEASER_LIMIT} />
      </Section>

      <Section id="agenda">
        <SectionHeader
          action={
            <Link to="/agenda" className="btn-link">
              Full agenda →
            </Link>
          }
        >
          <SectionTitle>How the day runs</SectionTitle>
        </SectionHeader>
        <AgendaList limit={5} />
      </Section>

      <Section id="timeline" muted>
        <SectionHeader
          action={
            <Link to="/timeline" className="btn-link">
              Full timeline →
            </Link>
          }
        >
          <SectionTitle>A quick look at the timeline</SectionTitle>
        </SectionHeader>
        <EventTimeline limit={6} />
      </Section>

      <Section id="venue">
        <SectionHeader
          action={
            <Link to="/venue" className="btn-link">
              Venue details →
            </Link>
          }
        >
          <SectionTitle>Where to find us</SectionTitle>
        </SectionHeader>
        <VenueGrid limit={2} />
      </Section>

      <CommunitySection />
      
      <GalleryMarqueeSection id="gallery" />

      <TeamSection />

      <Section id="pricing">
        <SectionHeader>
          <SectionTitle>Ticket plans</SectionTitle>
        </SectionHeader>
        <PricingGrid />
      </Section>

      <Section id="faq" muted>
        <SectionHeader
          action={
            <Link to="/faq" className="btn-link">
              All FAQs →
            </Link>
          }
        >
          <SectionTitle>Common questions</SectionTitle>
        </SectionHeader>
        <FAQAccordion limit={5} />
      </Section>

      <Section id="register">
        <RegistrationCTA />
      </Section>
    </div>
  );
}
