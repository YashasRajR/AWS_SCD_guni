import type { PastEvent } from '@scd/types';
import { usePastEvents } from '../../lib/queries.js';
import { PastEventCard } from './PastEventCard.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';

export const FALLBACK_PAST_EVENTS: PastEvent[] = [
  {
    id: 'event-cloudx-2026',
    eventName: 'CloudX – AWS Certification Drive',
    year: 2026,
    sessionName: 'Mr. Himanshu Patel (Associate Professor)',
    sessionImage: '/gallery/cloudx_poster.jpg',
    shortDescription:
      'Interactive AWS certification drive organized by AWS Student Builder Group at Ganpat University with 210+ registrations, led by Associate Professor Mr. Himanshu Patel on cloud models, distributed systems, and AWS certification pathways.',
    eventDate: '2026-08-22',
    location: 'Seminar Hall 209, 2nd Floor, New Building, Ganpat University',
    archiveUrl: 'https://www.meetup.com/aws-sbg-at-ganpat-university/',
    displayOrder: 1,
    status: 'PUBLISHED',
    createdAt: '2026-08-22T00:00:00Z',
    updatedAt: '2026-08-22T00:00:00Z',
  },
  {
    id: 'event-gujarat-builder-week-2026',
    eventName: 'AWS Gujarat Students Builder Week 2026',
    year: 2026,
    sessionName: '10+ Industry Experts & Continuous Cloud Learning',
    sessionImage: '/gallery/gujarat_builder_week_poster.png',
    shortDescription:
      'A 7-day virtual learning experience organized by the AWS Student Builder Group Leaders – Gujarat. Featuring 10+ industry experts, live interactive Q&A, e-certificates, and hands-on cloud learning.',
    eventDate: '2026-07-05',
    location: 'Online Event (Meetup Live)',
    archiveUrl: 'https://www.meetup.com/aws-sbg-at-ganpat-university/events/315424216/',
    displayOrder: 2,
    status: 'PUBLISHED',
    createdAt: '2026-07-05T00:00:00Z',
    updatedAt: '2026-07-05T00:00:00Z',
  },
  {
    id: 'event-gen-ai-on-aws',
    eventName: 'GEN AI ON AWS',
    year: 2026,
    sessionName: 'Mr. Ashwin Raiyani (Expert AI Speaker)',
    sessionImage: '/gallery/Poster2.png',
    shortDescription:
      'An online technical session delivered by Mr. Ashwin Raiyani illustrating the future of Generative AI, featuring industry use cases, Amazon Bedrock, FMaaS, building agents, and real-world tools.',
    eventDate: '2026-05-25',
    location: 'Online Event (Meetup Live)',
    archiveUrl: 'https://www.meetup.com/aws-sbg-at-ganpat-university/',
    displayOrder: 3,
    status: 'PUBLISHED',
    createdAt: '2026-05-25T00:00:00Z',
    updatedAt: '2026-05-25T00:00:00Z',
  },
  {
    id: 'event-aws-cloud-ignite',
    eventName: 'AWS Cloud Ignite',
    year: 2026,
    sessionName: 'Nilesh Vaghela & Dimple Vaghela (AWS Community Heroes)',
    sessionImage: '/gallery/Poster1.png',
    shortDescription:
      'Flagship cloud computing awareness event organized by AWS Cloud Club Ganpat University with 600+ registrations, introducing students to cloud fundamentals and AWS ecosystem with hands-on EC2 & S3 console labs.',
    eventDate: '2026-03-25',
    location: 'Seminar Hall 209, New Building, Ganpat University, Mehsana',
    archiveUrl: 'https://www.meetup.com/aws-sbg-at-ganpat-university/',
    displayOrder: 4,
    status: 'PUBLISHED',
    createdAt: '2026-03-25T00:00:00Z',
    updatedAt: '2026-03-25T00:00:00Z',
  },
];

export function PastEventGrid({ limit }: { limit?: number } = {}) {
  const { items, loading, error, reload } = usePastEvents();

  if (loading) return <SkeletonGrid count={limit ?? 4} />;
  if (error && items.length === 0) return <ErrorState onRetry={reload} />;

  const displayList = items.length > 0 ? items : FALLBACK_PAST_EVENTS;
  const sliced = limit ? displayList.slice(0, limit) : displayList;

  return (
    <div
      className="card-grid"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'var(--space-5, 20px)',
      }}
    >
      {sliced.map((event) => (
        <PastEventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
