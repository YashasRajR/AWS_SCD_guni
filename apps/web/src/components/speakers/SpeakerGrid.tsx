import { useState, useMemo } from 'react';
import { useSpeakers } from '../../lib/queries.js';
import { SpeakerDetailOverlay } from './SpeakerDetailOverlay.js';
import { ProfileCard } from '../ui/ProfileCard.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';
import type { Speaker } from '@scd/types';

interface SpeakerGridProps {
  limit?: number;
  rotary?: boolean;
  speedSeconds?: number;
  fallback?: boolean;
}

function formatSpeakerRole(designation?: string | null, organization?: string | null) {
  let des = designation ? designation.trim().toUpperCase() : null;
  let org = organization ? organization.trim().toUpperCase() : null;

  if (des === 'X' || (des && des.length <= 1)) des = 'SPEAKER';
  if (org === 'B' || (org && org.length <= 1)) org = 'GUNI';
  if (!org) org = 'GUNI';

  if (des && org) return `${des} • ${org}`;
  return des || org || 'SPEAKER • GUNI';
}

function getGlowColor(idx: number): string {
  if (idx % 3 === 0) return 'rgba(255, 153, 0, 0.45)';
  if (idx % 3 === 1) return 'rgba(56, 189, 248, 0.45)';
  return 'rgba(255, 153, 0, 0.35)';
}

export const FALLBACK_SPEAKERS: Speaker[] = [
  {
    id: 'speaker-kiran-amin',
    name: 'Dr. Kiran Amin',
    designation: 'Deputy Pro Vice Chancellor & Executive Dean',
    organization: 'Ganpat University',
    bio: 'Executive Dean FoET Principal (GUNI - UVPCE) with decades of leadership in engineering education, academic innovation, and industry collaborations.',
    profileImage: '/gallery/KiranAmin.png',
    linkedinUrl: 'https://www.linkedin.com/school/ganpat-university/',
    websiteUrl: null,
    displayOrder: 1,
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'speaker-pravesh-patel',
    name: 'Dr. Pravesh Patel',
    designation: 'Faculty Coordinator & Cloud Mentor',
    organization: 'Ganpat University',
    bio: 'Academic Innovation & Cloud Architect Bridge, mentoring student builders on scalable cloud architectures and serverless systems.',
    profileImage: '/gallery/Pravesh.png',
    linkedinUrl: 'https://linkedin.com/in/pravesh-patel-43573a10',
    websiteUrl: null,
    displayOrder: 2,
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'speaker-nilesh-vaghela',
    name: 'Nilesh Vaghela',
    designation: 'AWS Community Hero',
    organization: 'Electromech Cloud Solutions',
    bio: 'AWS Community Hero, open source enthusiast, and cloud pioneer with over two decades of experience designing enterprise cloud infrastructure.',
    profileImage: '/gallery/speaker1.png',
    linkedinUrl: 'https://www.linkedin.com/in/nilesh-vaghela-aws/',
    websiteUrl: null,
    displayOrder: 3,
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'speaker-ashwin-raiyani',
    name: 'Ashwin Raiyani',
    designation: 'Senior Cloud & AI Architect',
    organization: 'AWS Community Mentor',
    bio: 'Expert speaker on Generative AI on AWS, Amazon Bedrock, FMaaS, building autonomous agents, and real-world enterprise AI deployments.',
    profileImage: '/gallery/speaker2.png',
    linkedinUrl: 'https://www.linkedin.com/',
    websiteUrl: null,
    displayOrder: 4,
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'speaker-harshil-maniyar',
    name: 'Harshil Maniyar',
    designation: 'AWS SBG Leader',
    organization: 'Ganpat University',
    bio: 'Technical Leadership & Cloud Innovation Guide, driving developer engagement, student hackathons, and cloud certifications at GUNI.',
    profileImage: '/gallery/Harshil.png',
    linkedinUrl: 'https://linkedin.com/in/harshil-maniyar-7a20b832a',
    websiteUrl: null,
    displayOrder: 5,
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export function SpeakerGrid({ limit, rotary = true, speedSeconds = 48, fallback = false }: SpeakerGridProps) {
  const { items: speakers, loading, error, reload } = useSpeakers();
  const [openId, setOpenId] = useState<string | null>(null);

  const effectiveSpeakers =
    speakers && speakers.length > 0
      ? speakers
      : fallback
        ? FALLBACK_SPEAKERS
        : [];
  const shown = limit ? effectiveSpeakers.slice(0, limit) : effectiveSpeakers;
  const openSpeaker = openId ? (effectiveSpeakers.find((s) => s.id === openId) ?? null) : null;

  // Prepare duplicate halves for a continuous, seamless rotary marquee loop
  const { setA, setB } = useMemo(() => {
    if (!shown || shown.length === 0) return { setA: [], setB: [] };

    // Repeat enough times so that each half has at least 10 cards across wide displays
    const minHalfCount = 10;
    const repeatCount = Math.max(2, Math.ceil(minHalfCount / shown.length));

    const halfItems: Array<{
      speaker: Speaker;
      uniqueKey: string;
      originalIndex: number;
      isFirstInstance: boolean;
    }> = [];

    for (let r = 0; r < repeatCount; r++) {
      shown.forEach((sp, idx) => {
        halfItems.push({
          speaker: sp,
          uniqueKey: `${sp.id}-r${r}-i${idx}`,
          originalIndex: idx,
          isFirstInstance: r === 0,
        });
      });
    }

    // Set A (first instance accessible, repeated instances aria-hidden for a11y)
    const setA = halfItems.map((item) => ({
      ...item,
      ariaHidden: !item.isFirstInstance,
    }));

    // Set B (duplicate half to complete the infinite 0% -> -50% CSS translation loop)
    const setB = halfItems.map((item) => ({
      ...item,
      uniqueKey: `${item.uniqueKey}-clone`,
      ariaHidden: true,
    }));

    return { setA, setB };
  }, [shown]);

  if (loading && (!speakers || speakers.length === 0)) return <SkeletonGrid count={limit ?? 3} />;
  if (error && effectiveSpeakers.length === 0) return <ErrorState onRetry={reload} />;
  if (effectiveSpeakers.length === 0) return <EmptyState message="Speakers will be announced soon." />;

  if (!rotary) {
    return (
      <div className="c" style={{ gap: '24px', width: '100%' }}>
        <div className="speakers-profile-cards-grid">
          {shown.map((speaker, idx) => (
            <ProfileCard
              key={speaker.id}
              name={speaker.name}
              roleOrg={formatSpeakerRole(speaker.designation, speaker.organization)}
              avatarUrl={speaker.profileImage || undefined}
              linkedinUrl={speaker.linkedinUrl || undefined}
              showUserInfo={true}
              enableTilt={true}
              enableMobileTilt={true}
              behindGlowEnabled={true}
              behindGlowColor={getGlowColor(idx)}
              onContactClick={() => setOpenId(speaker.id)}
            />
          ))}
        </div>

        {openSpeaker && (
          <SpeakerDetailOverlay speaker={openSpeaker} onClose={() => setOpenId(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="speakers-rotary-container" style={{ width: '100%' }}>
      <div className="speakers-rotary-wrapper">
        <div
          className="speakers-rotary-track"
          style={{
            ['--speaker-rotary-speed' as string]: `${speedSeconds}s`,
            animationDuration: `${speedSeconds}s`,
          }}
        >
          {setA.map(({ speaker, uniqueKey, originalIndex, ariaHidden }) => (
            <ProfileCard
              key={uniqueKey}
              ariaHidden={ariaHidden}
              name={speaker.name}
              roleOrg={formatSpeakerRole(speaker.designation, speaker.organization)}
              avatarUrl={speaker.profileImage || undefined}
              linkedinUrl={speaker.linkedinUrl || undefined}
              showUserInfo={true}
              enableTilt={true}
              enableMobileTilt={true}
              behindGlowEnabled={true}
              behindGlowColor={getGlowColor(originalIndex)}
              onContactClick={() => setOpenId(speaker.id)}
            />
          ))}

          {setB.map(({ speaker, uniqueKey, originalIndex, ariaHidden }) => (
            <ProfileCard
              key={uniqueKey}
              ariaHidden={ariaHidden}
              name={speaker.name}
              roleOrg={formatSpeakerRole(speaker.designation, speaker.organization)}
              avatarUrl={speaker.profileImage || undefined}
              linkedinUrl={speaker.linkedinUrl || undefined}
              showUserInfo={true}
              enableTilt={true}
              enableMobileTilt={true}
              behindGlowEnabled={true}
              behindGlowColor={getGlowColor(originalIndex)}
              onContactClick={() => setOpenId(speaker.id)}
            />
          ))}
        </div>
      </div>

      {openSpeaker && (
        <SpeakerDetailOverlay speaker={openSpeaker} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

export default SpeakerGrid;
