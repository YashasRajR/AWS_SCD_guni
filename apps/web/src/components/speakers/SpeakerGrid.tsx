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

export function SpeakerGrid({ limit, rotary = true, speedSeconds = 48 }: SpeakerGridProps) {
  const { items: speakers, loading, error, reload } = useSpeakers();
  const [openId, setOpenId] = useState<string | null>(null);

  const shown = limit ? speakers.slice(0, limit) : speakers;
  const openSpeaker = openId ? (speakers.find((s) => s.id === openId) ?? null) : null;

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

  if (loading) return <SkeletonGrid count={limit ?? 3} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (speakers.length === 0) return <EmptyState message="Speakers will be announced soon." />;

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
