import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { AttendeeAchievement } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { useDocumentHead } from '../lib/seo.js';
import { useToast } from '../lib/toast.js';

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
}

function BadgeIcon({ id, locked, size = 32 }: { id: string; locked?: boolean; size?: number }) {
  if (locked) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
  }
  switch (id) {
    case 'b1': // Checked in - Ticket
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 9a3 3 0 0 1 0 6v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a3 3 0 0 1 0-6V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      );
    case 'b2': // First session - Keynote Rocket
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    case 'b3': // Lab done - Laptop
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M2 20h20" />
          <path d="m9 10 2 2-2 2" />
          <line x1="13" y1="14" x2="15" y2="14" />
        </svg>
      );
    case 'b4': // Serverless builder - Lightning
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'b5': // Cloud pioneer - Cloud
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      );
    case 'b6': // Quiz champion - Trophy
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case 'b7': // Community voice - Megaphone
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      );
    case 'b8': // Day finisher - Graduation Cap
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 14 14" />
        </svg>
      );
  }
}

const ALL_BADGES: BadgeDefinition[] = [
  { id: 'b1', name: 'Checked in', description: 'Arrived at Ganpat University and verified your event registration.' },
  { id: 'b2', name: 'First session', description: 'Attended your first talk or keynote in the auditorium.' },
  { id: 'b3', name: 'Lab done', description: 'Completed a hands-on cloud workshop in the computer labs.' },
  { id: 'b4', name: 'Serverless builder', description: 'Deployed AWS Lambda functions and API Gateway endpoints.' },
  { id: 'b5', name: 'Cloud pioneer', description: 'Engaged with speaker Q&A and technical architecture discussions.' },
  { id: 'b6', name: 'Quiz champion', description: 'Participated in the community tech quiz and trivia.' },
  { id: 'b7', name: 'Community voice', description: 'Created and shared your official SCD social attendance post.' },
  { id: 'b8', name: 'Day finisher', description: 'Completed all stations and attended the closing ceremony.' },
];

export function MyAchievementsPage() {
  useDocumentHead({ title: 'Achievements · AWS SCD 2026' });
  const { items: unlockedAchievements } = useResource<AttendeeAchievement>('/me/achievements');
  const [filter, setFilter] = useState<'ALL' | 'EARNED' | 'LOCKED'>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const { addToast } = useToast();

  // Map backend unlocked achievements or default to 3 unlocked for preview
  const earnedIds = useMemo(() => {
    if (unlockedAchievements.length > 0) {
      return new Set(unlockedAchievements.map((a) => a.id));
    }
    // Default unlocked set per wireframe 1j: 3 of 8 earned
    return new Set(['b1', 'b2', 'b3']);
  }, [unlockedAchievements]);

  const displayedBadges = useMemo(() => {
    return ALL_BADGES.filter((b) => {
      const isEarned = earnedIds.has(b.id);
      if (filter === 'EARNED') return isEarned;
      if (filter === 'LOCKED') return !isEarned;
      return true;
    });
  }, [filter, earnedIds]);

  const earnedCount = ALL_BADGES.filter((b) => earnedIds.has(b.id)).length;

  const handleShareBadge = (badge: BadgeDefinition) => {
    const text = `I just unlocked the "${badge.name}" achievement at AWS Students Community Day 2026! @aws.sbg_guni #AWSSCD2026`;
    void navigator.clipboard.writeText(text).then(() => {
      addToast('Badge share caption copied with handles', 'success');
    });
  };

  return (
    <div className="section" style={{ padding: '32px 0 60px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px' }}>
        <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '16px' }}>
          <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</Link> / Achievements
        </p>

        <div className="c" style={{ gap: '20px' }}>
          <div className="k" style={{ padding: '24px', gap: '16px', background: 'var(--scd-surface)' }}>
            <div>
              <h1 className="d2" style={{ margin: '0 0 4px', fontSize: '26px' }}>Achievements</h1>
              <p className="tx" style={{ color: 'var(--scd-muted)', fontSize: '13px' }}>
                Collect badges as you attend sessions, build in labs, and check in.
              </p>
            </div>

            {/* Filter chips: All · Earned · Locked */}
            <div className="r" style={{ gap: '6px', alignItems: 'center' }}>
              {(['ALL', 'EARNED', 'LOCKED'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  className={`chip ${filter === mode ? 'on' : ''}`}
                  style={{
                    cursor: 'pointer',
                    border: '1px solid var(--scd-fg)',
                    fontFamily: 'var(--scd-mono)',
                    fontSize: '11px',
                    padding: '6px 14px',
                    background: filter === mode ? 'var(--scd-accent)' : 'var(--scd-surface)',
                    color: 'var(--scd-fg)',
                  }}
                >
                  {mode === 'ALL' ? 'All' : mode === 'EARNED' ? 'Earned' : 'Locked'}
                </button>
              ))}
            </div>

            <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '12px' }}>
              {earnedCount} of {ALL_BADGES.length} earned
            </p>

            {/* 8 Badges Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '10px',
              }}
            >
              {displayedBadges.map((badge) => {
                const isEarned = earnedIds.has(badge.id);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setSelectedBadge(badge)}
                    className={isEarned ? 'k' : 'kd'}
                    style={{
                      padding: '12px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: isEarned ? 'var(--scd-surface)' : 'var(--scd-surface-muted)',
                      opacity: isEarned ? 1 : 0.4,
                      border: isEarned ? '1.25px solid var(--scd-border)' : '1px dashed var(--scd-border)',
                      borderRadius: '4px',
                      transition: 'transform 0.2s ease, opacity 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', marginBottom: '6px', color: isEarned ? 'var(--scd-accent)' : 'var(--scd-muted)' }}>
                      <BadgeIcon id={badge.id} locked={!isEarned} size={28} />
                    </div>
                    <p className="mo" style={{ fontSize: '10px', color: isEarned ? 'var(--scd-fg)' : 'var(--scd-muted)', fontWeight: 600 }}>
                      {badge.name}
                    </p>
                    <span className="mo" style={{ fontSize: '9px', color: isEarned ? 'var(--scd-accent)' : 'var(--scd-muted)', marginTop: '2px' }}>
                      {isEarned ? 'Earned' : 'Locked'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unlock / Detail Modal (Wireframe 1j) */}
          {selectedBadge && (
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(20, 24, 31, 0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
              onClick={() => setSelectedBadge(null)}
            >
              <div
                className="k"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '380px',
                  width: '100%',
                  padding: '24px',
                  gap: '14px',
                  background: 'var(--scd-surface)',
                  border: '2px solid var(--scd-primary)',
                  textAlign: 'center',
                }}
              >
                <p className="mo" style={{ color: 'var(--scd-muted)' }}>
                  {earnedIds.has(selectedBadge.id) ? 'Achievement details' : 'Locked achievement'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0', color: earnedIds.has(selectedBadge.id) ? 'var(--scd-accent)' : 'var(--scd-muted)' }}>
                  <BadgeIcon id={selectedBadge.id} locked={!earnedIds.has(selectedBadge.id)} size={56} />
                </div>

                <h2 className="d3" style={{ margin: 0, fontSize: '20px' }}>
                  {selectedBadge.name}
                </h2>

                <p className="tx" style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--scd-muted)' }}>
                  {selectedBadge.description}
                </p>

                <div className="r" style={{ gap: '10px', justifyContent: 'center', marginTop: '8px' }}>
                  {earnedIds.has(selectedBadge.id) && (
                    <button
                      type="button"
                      onClick={() => handleShareBadge(selectedBadge)}
                      className="btn o"
                      style={{ cursor: 'pointer', minHeight: '40px', padding: '0 18px' }}
                    >
                      Share achievement
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedBadge(null)}
                    className="btn g"
                    style={{ cursor: 'pointer', minHeight: '40px', padding: '0 18px' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
