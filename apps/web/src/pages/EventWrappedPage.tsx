import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EventWrapped } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { useDocumentHead } from '../lib/seo.js';
import { Mascot } from '../components/ui/Mascot.js';
import { useToast } from '../lib/toast.js';

const SLIDE_MS = 5000;

interface Slide {
  label: string;
  numeral?: number | string;
  caption: string;
  subtext?: string;
  isShareCard?: boolean;
}

function buildSixSlides(wrapped?: EventWrapped | null): Slide[] {
  const s = wrapped?.statistics;
  const sessions = s?.sessionsAttended ?? 4;
  const hours = ((sessions * 50) / 60).toFixed(1);
  const badges = s?.achievementsUnlocked ?? 5;
  const track = s?.topInterest || 'Cloud & Serverless';
  const cert = s?.certificateUnlocked ? 'Ready' : 'Pending';

  return [
    {
      label: 'Sessions attended',
      numeral: sessions,
      caption: 'sessions attended',
      subtext: 'Deep-dives into architecture, AI/ML, and DevOps.',
    },
    {
      label: 'Hours in the room',
      numeral: hours,
      caption: 'hours in the room',
      subtext: 'More than most. Active learning throughout the day.',
    },
    {
      label: 'Top track',
      numeral: track,
      caption: 'your focus area',
      subtext: 'You spent the most time building in this domain.',
    },
    {
      label: 'Certificate',
      numeral: cert,
      caption: 'completion credential',
      subtext: 'Official participation certificate from Ganpat University.',
    },
    {
      label: 'Badges',
      numeral: badges,
      caption: 'achievements unlocked',
      subtext: 'Recognized milestones across the community day.',
    },
    {
      label: 'Thank you',
      caption: 'Thank you for building the future with AWS Community!',
      subtext: 'Ganpat University · 8 October 2026',
      isShareCard: true,
    },
  ];
}

function useCountUp(target: number | string | undefined, active: boolean): number | string {
  const numericTarget = typeof target === 'number' ? target : parseFloat(String(target));
  const isNumber = !isNaN(numericTarget) && typeof target === 'number';

  const [val, setVal] = useState<number>(isNumber ? 0 : 0);

  useEffect(() => {
    if (!isNumber || !active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(numericTarget);
      return;
    }
    const start = performance.now();
    const duration = 600;
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setVal(Math.round(numericTarget * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numericTarget, active, isNumber]);

  return isNumber ? val : (target ?? '');
}

export function EventWrappedPage() {
  useDocumentHead({ title: 'Event Wrapped · AWS SCD 2026' });
  const { data: wrapped, loading, error } = useResource<EventWrapped>('/me/event-wrapped');
  const { addToast } = useToast();

  const slides = useMemo(() => buildSixSlides(wrapped), [wrapped]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const isLast = index === slides.length - 1;
  const goNext = () => setIndex((i) => Math.min(i + 1, slides.length - 1));
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));

  // 5s auto-advance
  useEffect(() => {
    if (paused || isLast || reducedMotion.current) return;
    const id = window.setTimeout(goNext, SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, isLast]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const slide = slides[index]!;
  const displayNumeral = useCountUp(slide.numeral, true);

  const copyCaption = () => {
    const text = `Celebrated my journey at AWS Students Community Day 2026 at Ganpat University! Attended ${wrapped?.statistics.sessionsAttended ?? 4} sessions and unlocked ${wrapped?.statistics.achievementsUnlocked ?? 5} badges. @aws.sbg_guni #AWSSCD2026 #CloudClub`;
    void navigator.clipboard.writeText(text).then(() => {
      addToast('Caption copied with handles @aws.sbg_guni', 'success');
    });
  };

  const downloadCardPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1080 x 1350 (4:5 shareable card)
    canvas.width = 1080;
    canvas.height = 1350;

    // Dark Navy Ground
    ctx.fillStyle = '#232F3E';
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1080; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1350);
      ctx.stroke();
    }
    for (let y = 0; y < 1350; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = '#FF9900';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 1000, 1270);

    // Header Tag
    ctx.fillStyle = '#FF9900';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('AWS STUDENTS COMMUNITY DAY 2026', 80, 120);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 68px system-ui, sans-serif';
    ctx.fillText('MY EVENT WRAPPED', 80, 210);

    ctx.fillStyle = '#9a958c';
    ctx.font = '30px monospace';
    ctx.fillText('8 October 2026 · Ganpat University', 80, 270);

    // Accent line
    ctx.fillStyle = '#FF9900';
    ctx.fillRect(80, 310, 160, 6);

    // Big Stat blocks
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 120px system-ui, sans-serif';
    ctx.fillText(String(wrapped?.statistics.sessionsAttended ?? 4), 80, 480);
    ctx.fillStyle = '#cfc9be';
    ctx.font = '500 36px system-ui, sans-serif';
    ctx.fillText('Sessions Attended', 80, 530);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 120px system-ui, sans-serif';
    ctx.fillText(String(wrapped?.statistics.achievementsUnlocked ?? 5), 580, 480);
    ctx.fillStyle = '#cfc9be';
    ctx.font = '500 36px system-ui, sans-serif';
    ctx.fillText('Badges Unlocked', 580, 530);

    // Next row
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 120px system-ui, sans-serif';
    ctx.fillText(wrapped?.statistics.certificateUnlocked ? 'Ready' : 'Issued', 80, 720);
    ctx.fillStyle = '#cfc9be';
    ctx.font = '500 36px system-ui, sans-serif';
    ctx.fillText('Official Certificate', 80, 770);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 64px system-ui, sans-serif';
    ctx.fillText(wrapped?.statistics.topInterest ?? 'Cloud & AI', 580, 720);
    ctx.fillStyle = '#cfc9be';
    ctx.font = '500 36px system-ui, sans-serif';
    ctx.fillText('Top Focus Track', 580, 770);

    // Bottom lockup
    ctx.fillStyle = '#FF9900';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('@aws.sbg_guni', 80, 1220);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText('Verified Attendee · Centre of Excellence, GUNI', 80, 1260);

    // Trigger download
    const link = document.createElement('a');
    link.download = 'aws-scd-2026-wrapped.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    addToast('Wrapped PNG card downloaded', 'success');
  };

  return (
    <div className="section" style={{ padding: '32px 0 60px' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 16px' }}>
        <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '16px' }}>
          <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</Link> / Wrapped
        </p>

        <div className="c" style={{ gap: '20px' }}>
          {/* Framed Desktop Story Container (Wireframe 1i) */}
          <div className="r" style={{ alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn g"
              onClick={goPrev}
              disabled={index === 0}
              style={{ minWidth: '44px', height: '44px', justifyContent: 'center', cursor: index === 0 ? 'default' : 'pointer' }}
              aria-label="Previous slide"
            >
              ←
            </button>

            {/* Story Card */}
            <div
              className="k inv"
              style={{
                flex: 1,
                border: '2px solid var(--scd-primary)',
                borderRadius: '4px',
                minHeight: '340px',
                padding: '24px',
                background: 'var(--scd-primary)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                userSelect: 'none',
              }}
              onPointerDown={() => setPaused(true)}
              onPointerUp={() => setPaused(false)}
            >
              {/* Progress bars across top */}
              <div className="r" style={{ gap: '4px', width: '100%', marginBottom: '16px' }}>
                {slides.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: '3px',
                      borderRadius: '1px',
                      background: i <= index ? 'var(--scd-accent)' : 'rgba(255, 255, 255, 0.2)',
                      transition: 'background 0.3s ease',
                    }}
                  />
                ))}
              </div>

              {/* Header indicator */}
              <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="mo" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px' }}>
                  0{index + 1} / 0{slides.length} {paused ? '· paused' : '· hold to pause'}
                </p>
                <Mascot variant="sm" size={24} />
              </div>

              {/* Main Content */}
              <div className="c" style={{ alignItems: 'center', textAlign: 'center', padding: '24px 0', gap: '8px' }}>
                {slide.numeral !== undefined ? (
                  <>
                    <p
                      className="d1"
                      style={{
                        fontSize: typeof slide.numeral === 'number' ? '68px' : '44px',
                        color: '#fff',
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      {displayNumeral}
                    </p>
                    <p className="lbl" style={{ color: 'var(--scd-accent)', fontSize: '16px' }}>
                      {slide.caption}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="d2" style={{ color: '#fff', margin: 0, fontSize: '28px' }}>
                      {slide.caption}
                    </h2>
                  </>
                )}
                {slide.subtext && (
                  <p className="tx" style={{ color: '#cfc9be', fontSize: '13px', maxWidth: '440px' }}>
                    {slide.subtext}
                  </p>
                )}
              </div>

              {/* Slide controls footer */}
              <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="mo" style={{ color: 'var(--scd-accent)', fontSize: '10px' }}>
                  {slide.label}
                </p>
                <p className="mo" style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px' }}>
                  Tap arrows or click to advance
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn g"
              onClick={goNext}
              disabled={isLast}
              style={{ minWidth: '44px', height: '44px', justifyContent: 'center', cursor: isLast ? 'default' : 'pointer' }}
              aria-label="Next slide"
            >
              →
            </button>
          </div>

          {/* 6 Stations summary pills below (Wireframe 1i) */}
          <div className="r" style={{ gap: '6px', flexWrap: 'wrap' }}>
            {slides.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setIndex(i)}
                className={`kd ${index === i ? 'mut' : ''}`}
                style={{
                  flex: '1 1 100px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  border: index === i ? '1.5px solid var(--scd-accent)' : '1px solid var(--scd-border)',
                  background: index === i ? 'var(--scd-surface)' : 'var(--scd-surface-muted)',
                  textAlign: 'left',
                }}
              >
                <p className="mo" style={{ fontSize: '10px', color: index === i ? 'var(--scd-accent)' : 'var(--scd-muted)' }}>
                  0{i + 1}
                </p>
                <p className="lbl" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.label}
                </p>
              </button>
            ))}
          </div>

          {/* Final slide: Shareable Card (Wireframe 1i callout) */}
          <div className="k mut" style={{ padding: '20px', gap: '14px' }}>
            <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div
                style={{
                  width: '90px',
                  height: '112px',
                  borderRadius: '3px',
                  border: '1.25px solid var(--scd-border)',
                  background: 'var(--scd-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  padding: '8px',
                  textAlign: 'center',
                }}
              >
                <Mascot variant="sm" size={36} />
                <p className="mo" style={{ color: 'var(--scd-accent)', fontSize: '9px', marginTop: '6px' }}>
                  4:5 CARD
                </p>
              </div>

              <div className="c" style={{ flex: '1 1 280px', gap: '6px' }}>
                <h3 className="d3" style={{ margin: 0 }}>Share your achievement</h3>
                <p className="tx" style={{ fontSize: '13px' }}>
                  Download your 1080×1350 PNG poster or copy the formatted caption with handles to post on LinkedIn and Instagram.
                </p>
                <div className="r" style={{ gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={downloadCardPNG} className="btn o" style={{ cursor: 'pointer' }}>
                    Download PNG
                  </button>
                  <button type="button" onClick={copyCaption} className="btn g" style={{ cursor: 'pointer' }}>
                    Copy caption
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
