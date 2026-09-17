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
  icon: string;
}

const ALL_BADGES: BadgeDefinition[] = [
  { id: 'b1', name: 'Checked in', description: 'Arrived at Ganpat University and verified your event registration.', icon: '🎟️' },
  { id: 'b2', name: 'First session', description: 'Attended your first talk or keynote in the auditorium.', icon: '🚀' },
  { id: 'b3', name: 'Lab done', description: 'Completed a hands-on cloud workshop in the computer labs.', icon: '💻' },
  { id: 'b4', name: 'Serverless builder', description: 'Deployed AWS Lambda functions and API Gateway endpoints.', icon: '⚡' },
  { id: 'b5', name: 'Cloud pioneer', description: 'Engaged with speaker Q&A and technical architecture discussions.', icon: '☁️' },
  { id: 'b6', name: 'Quiz champion', description: 'Participated in the community tech quiz and trivia.', icon: '🏆' },
  { id: 'b7', name: 'Community voice', description: 'Created and shared your official SCD social attendance post.', icon: '📢' },
  { id: 'b8', name: 'Day finisher', description: 'Completed all stations and attended the closing ceremony.', icon: '🎓' },
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
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>
                      {isEarned ? badge.icon : '🔒'}
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

                <div style={{ fontSize: '56px', margin: '4px 0' }}>
                  {earnedIds.has(selectedBadge.id) ? selectedBadge.icon : '🔒'}
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
