import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import './ProfileCard.css';

const DEFAULT_INNER_GRADIENT =
  'radial-gradient(circle at 65% 20%, #ffffff 0%, #f4f6fa 45%, #e1e6ed 100%)';

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180,
};

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

export interface ProfileCardProps {
  avatarUrl?: string;
  cardImageUrl?: string;
  iconUrl?: string;
  grainUrl?: string;
  innerGradient?: string;
  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: string;
  className?: string;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  roleOrg?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  linkedinUrl?: string;
  showUserInfo?: boolean;
  ariaHidden?: boolean;
  onContactClick?: () => void;
  onClick?: () => void;
}

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  avatarUrl,
  cardImageUrl,
  iconUrl,
  grainUrl,
  innerGradient,
  behindGlowEnabled = true,
  behindGlowColor = 'rgba(255, 153, 0, 0.45)',
  behindGlowSize = '45%',
  className = '',
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  name = 'Harshil Maniyar',
  title = 'Leader · GUNI',
  roleOrg,
  linkedinUrl,
  showUserInfo = true,
  ariaHidden = false,
  onContactClick,
  onClick,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const enterTimerRef = useRef<number | null>(null);
  const leaveRafRef = useRef<number | null>(null);

  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;

    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties: Record<string, string> = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`,
      };

      for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x: number, y: number) {
        currentX = targetX = x;
        currentY = targetY = y;
        setVarsFromXY(x, y);
      },
      setTarget(x: number, y: number) {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs: number) {
        initialUntil = performance.now() + durationMs;
        start();
      },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
      },
    };
  }, [enableTilt]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;
      const rect = shell.getBoundingClientRect();
      tiltEngine.setTarget(event.clientX - rect.left, event.clientY - rect.top);
    },
    [tiltEngine]
  );

  const handlePointerEnter = useCallback(
    (event: PointerEvent) => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;
      shell.classList.add('entering');
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = window.setTimeout(() => {
        shell.classList.remove('entering');
      }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

      const rect = shell.getBoundingClientRect();
      tiltEngine.setTarget(event.clientX - rect.left, event.clientY - rect.top);
    },
    [tiltEngine]
  );

  const handlePointerLeave = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    tiltEngine.toCenter();
    const checkActive = () => {
      if (shell.classList.contains('active')) {
        leaveRafRef.current = requestAnimationFrame(checkActive);
      }
    };
    leaveRafRef.current = requestAnimationFrame(checkActive);
  }, [tiltEngine]);

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;

      const { beta, gamma } = event;
      if (beta === null || gamma === null) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const normBeta = (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity;
      const normGamma = gamma * mobileTiltSensitivity;

      const x = (clamp(normGamma, -90, 90) + 90) * (width / 180);
      const y = (clamp(normBeta, -90, 90) + 90) * (height / 180);

      tiltEngine.setTarget(x, y);
    },
    [tiltEngine, mobileTiltSensitivity]
  );

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;

    const shell = shellRef.current;
    if (!shell) return;

    const pointerMoveHandler = handlePointerMove;
    const pointerEnterHandler = handlePointerEnter;
    const pointerLeaveHandler = handlePointerLeave;
    const deviceOrientationHandler = handleDeviceOrientation;

    shell.addEventListener('pointerenter', pointerEnterHandler as any);
    shell.addEventListener('pointermove', pointerMoveHandler as any);
    shell.addEventListener('pointerleave', pointerLeaveHandler as any);

    const handleClick = () => {
      if (!enableMobileTilt || window.location.protocol !== 'https:') return;
      const anyMotion = (window as any).DeviceMotionEvent;
      if (anyMotion && typeof anyMotion.requestPermission === 'function') {
        anyMotion
          .requestPermission()
          .then((state: string) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', deviceOrientationHandler);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', deviceOrientationHandler);
      }
    };
    shell.addEventListener('click', handleClick);

    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    return () => {
      shell.removeEventListener('pointerenter', pointerEnterHandler as any);
      shell.removeEventListener('pointermove', pointerMoveHandler as any);
      shell.removeEventListener('pointerleave', pointerLeaveHandler as any);
      shell.removeEventListener('click', handleClick);
      window.removeEventListener('deviceorientation', deviceOrientationHandler);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove('entering');
    };
  }, [
    enableTilt,
    enableMobileTilt,
    tiltEngine,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
    handleDeviceOrientation,
  ]);

  const cardStyle = useMemo(
    () =>
      ({
        '--icon': iconUrl ? `url(${iconUrl})` : 'none',
        '--grain': grainUrl ? `url(${grainUrl})` : 'none',
        '--inner-gradient': innerGradient ?? DEFAULT_INNER_GRADIENT,
        '--behind-glow-color': behindGlowColor ?? 'rgba(255, 153, 0, 0.45)',
        '--behind-glow-size': behindGlowSize ?? '45%',
      }) as React.CSSProperties,
    [iconUrl, grainUrl, innerGradient, behindGlowColor, behindGlowSize]
  );

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else if (onContactClick) {
      onContactClick();
    }
  }, [onClick, onContactClick]);

  const displayRole = roleOrg || title;

  return (
    <div
      ref={wrapRef}
      className={`pc-card-wrapper ${className}`.trim()}
      style={cardStyle}
      onClick={handleCardClick}
      role={ariaHidden ? undefined : 'button'}
      aria-hidden={ariaHidden ? 'true' : undefined}
      tabIndex={ariaHidden ? -1 : 0}
      onKeyDown={(e) => {
        if (!ariaHidden && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {behindGlowEnabled && <div className="pc-behind" />}
      <div ref={shellRef} className="pc-card-shell">
        <section className="pc-card">
          <div className="pc-inside">
            <div className="pc-glare" />

            {cardImageUrl ? (
              <div className="pc-prerendered-content">
                <img
                  className="pc-prerendered-image"
                  src={cardImageUrl}
                  alt={`${name || 'Speaker'} card`}
                  loading="lazy"
                />
                <h3 className="sr-only">{name}</h3>
                <a
                  href={linkedinUrl || '#'}
                  target={linkedinUrl ? '_blank' : undefined}
                  rel={linkedinUrl ? 'noopener noreferrer' : undefined}
                  tabIndex={ariaHidden ? -1 : undefined}
                  aria-hidden={ariaHidden ? 'true' : undefined}
                  className="pc-prerendered-hotspot-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!linkedinUrl) {
                      e.preventDefault();
                      handleCardClick();
                    }
                  }}
                  aria-label={`${name || 'Speaker'} on LinkedIn`}
                  title={`Open ${name || 'Speaker'}'s LinkedIn`}
                />
              </div>
            ) : (
              <div className="pc-dynamic-content">
                <div className="pc-blinds-overlay" />
                <div className="pc-watermark-text" aria-hidden="true">
                  AWS GUNI SCD 2026
                </div>

                <div className="pc-avatar-layer">
                  {avatarUrl ? (
                    <img
                      className="pc-dynamic-avatar"
                      src={avatarUrl}
                      alt={name || 'Speaker'}
                      loading="lazy"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        t.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="pc-avatar-fallback">
                      {(name || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {showUserInfo && (
                  <div className="pc-glass-pill">
                    <div className="pc-pill-info">
                      <h3 className="pc-pill-name">{name}</h3>
                      <p className="pc-pill-role">{displayRole}</p>
                    </div>
                    <a
                      href={linkedinUrl || '#'}
                      target={linkedinUrl ? '_blank' : undefined}
                      rel={linkedinUrl ? 'noopener noreferrer' : undefined}
                      tabIndex={ariaHidden ? -1 : undefined}
                      aria-hidden={ariaHidden ? 'true' : undefined}
                      className="pc-pill-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!linkedinUrl) {
                          e.preventDefault();
                          handleCardClick();
                        }
                      }}
                      aria-label={`${name || 'Speaker'} on LinkedIn`}
                      title={`Open ${name || 'Speaker'}'s LinkedIn`}
                    >
                      <span className="pc-pill-btn-in">in</span>
                      <span className="pc-pill-btn-divider">|</span>
                      <span className="pc-pill-btn-arrow">↗</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export const ProfileCard = React.memo(ProfileCardComponent);
export default ProfileCard;
