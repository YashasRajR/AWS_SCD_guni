import type { ReactNode } from 'react';
import { REGISTER_URL } from '../lib/registration.js';
import type { TicketPlan } from '@scd/types';

export interface PlanCardProps {
  plan: TicketPlan;
  /** When set, the whole card renders as a button (e.g. the registration picker). */
  onClick?: () => void;
  disabled?: boolean;
  cta?: ReactNode;
  phase?: string;
}

function getPassTitleLines(name: string) {
  const clean = name.trim().toUpperCase();
  if (clean.includes('/')) {
    const parts = clean.split('/').map((s) => s.trim());
    return {
      top: parts[0] || 'GENERAL',
      sub: parts[1] ? `${parts[1]} PASS` : 'BUILDER PASS',
    };
  }
  if (clean.endsWith('PASS')) {
    const words = clean.split(/\s+/);
    if (words.length > 1) {
      return {
        top: words.slice(0, -1).join(' '),
        sub: words[words.length - 1] || 'PASS',
      };
    }
  }
  return {
    top: clean,
    sub: 'BUILDER PASS',
  };
}

function getAuthCode(code: string, id: string): string {
  if (code.toLowerCase().includes('student')) return '0x8F92-PASS';
  if (code.toLowerCase().includes('pro')) return '0xA4C1-PASS';
  const hash = id.slice(0, 4).toUpperCase();
  return `0x${hash || '8F92'}-PASS`;
}

/**
 * Lanyard badge ticket matching the uploaded design mockup:
 * Top lanyard strap with AWS logo and silver buckle, white card,
 * bold pass title, large currency price, frosted glass pill button,
 * and bottom barcode with auth string.
 */
export function PlanCard({ plan, onClick, disabled, cta, phase = 'PHASE 01' }: PlanCardProps) {
  const soldOut = plan.spotsLeft === 0;
  const titleLines = getPassTitleLines(plan.name);
  const authCode = getAuthCode(plan.code || plan.name, plan.id);

  const displayPrice =
    plan.currency === 'INR' || !plan.currency
      ? `₹${Math.round(Number(plan.price) || 0)}`
      : `${plan.currency} ${plan.price}`;

  return (
    <div className="lanyard-ticket-wrapper" data-reveal>
      {/* Top Lanyard Strap & Silver Hardware */}
      <div className="lanyard-hanger" aria-hidden="true">
        <div className="lanyard-strap">
          <svg className="lanyard-aws-logo" viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24.8 23.2c0-1.8-.4-3.2-1.3-4.2-.9-1-2.2-1.5-4-1.5-1.7 0-3.1.5-4.1 1.4-1 .9-1.5 2.2-1.6 3.8h-4.3c.1-2.6 1.1-4.7 2.8-6.2 1.8-1.5 4.2-2.3 7.2-2.3 3.1 0 5.5.8 7.3 2.4 1.7 1.6 2.6 3.9 2.6 6.8v11.5c0 1.2.2 2.1.5 2.7.3.6.8 1.1 1.6 1.4v2.7c-1.1.2-2.1.1-3-.2-.9-.3-1.6-.9-2.1-1.8-.8 1.3-1.8 2.2-3.1 2.8-1.3.6-2.8.9-4.5.9-2.6 0-4.7-.7-6.3-2.1-1.6-1.4-2.4-3.3-2.4-5.6 0-2.5.9-4.4 2.6-5.8 1.8-1.4 4.3-2.1 7.6-2.1h4.1v-.7zm-4.1 11.2c1.6 0 2.9-.4 3.8-1.3.9-.9 1.4-2.1 1.4-3.7v-2.3h-3.8c-2 0-3.5.4-4.5 1.2-1 .8-1.5 1.9-1.5 3.3 0 1.3.4 2.3 1.2 3 1 .6 2.1.8 3.4.8zM42.2 14.5l4.3 15.6 4.4-15.6h4.3l-6.8 20.3h-3.9l-4.4-15.2-4.4 15.2h-3.9l-6.8-20.3h4.3l4.4 15.6 4.3-15.6h4.1zM76.4 28.5c0 1.7-.5 3.2-1.5 4.3-1 1.1-2.4 1.9-4.2 2.3-1.8.4-4 .6-6.6.6-2.8 0-5.1-.3-7-.9v-3.5c1.1.4 2.3.8 3.7 1 1.4.2 2.7.3 4 .3 2.1 0 3.7-.3 4.7-.8 1-.5 1.6-1.3 1.6-2.4 0-.8-.3-1.5-1-2-.7-.5-1.9-1-3.6-1.5l-2.6-.7c-2.4-.6-4.1-1.4-5.2-2.4-1.1-1-1.7-2.3-1.7-4 0-1.8.7-3.3 2-4.4 1.4-1.1 3.3-1.7 5.7-1.7 2.4 0 4.7.4 6.7 1.1l-1.1 3.1c-1.8-.6-3.7-1-5.6-1-1.7 0-3 .3-3.9.8-.9.5-1.3 1.3-1.3 2.2 0 .8.3 1.4 1 1.9.6.5 1.7.9 3.2 1.3l2.6.7c2.7.7 4.6 1.6 5.8 2.7 1.2 1 1.8 2.4 1.8 4z"
              fill="#FFFFFF"
            />
            <path
              d="M72.5 40.2c-7.9 5.8-19.4 8.9-29.3 8.9-13.8 0-26.3-5-35.8-13.4-.7-.7-.1-1.6.8-1.1 9.4 5.5 21.1 8.7 33.2 8.7 8.8 0 18.5-2.2 27.2-6.8 1.3-.7 2.5 1.1 1.3 2.2z"
              fill="#FF9900"
            />
            <path
              d="M75.1 36.8c-.9-1.2-6.1-.6-8.5-.3-.7.1-.8-.5-.2-.9 3.8-2.6 10-1.9 10.9-.7.8 1.1-.3 7.5-3.9 10.4-.6.5-1.1.2-.8-.4 1-1.9 3.4-6.9 2.5-8.1z"
              fill="#FF9900"
            />
          </svg>
        </div>
        <div className="lanyard-buckle" />
        <div className="lanyard-ring" />
      </div>

      {/* Main Badge Card */}
      <div className={`lanyard-badge-card ${disabled || soldOut ? 'is-disabled' : ''}`}>
        {/* Slot Cutout */}
        <div className="lanyard-badge-slot" aria-hidden="true" />

        {/* Top Header Row */}
        <div className="lanyard-badge-header">
          <span className="lanyard-badge-org">AWS GUNI SCD 2026</span>
          <span className="lanyard-badge-rule" aria-hidden="true" />
          <span className="lanyard-badge-phase">[ {phase} ]</span>
        </div>

        {/* Hollow Outline Watermark Text */}
        <div className="lanyard-badge-watermark" aria-hidden="true">
          <div>AWS GUNI</div>
          <div>SCD 2026</div>
        </div>

        {/* Pass Name */}
        <div className="lanyard-badge-title">
          <div className="lanyard-badge-title-line1">{titleLines.top}</div>
          <div className="lanyard-badge-title-line2">{titleLines.sub}</div>
        </div>

        {/* Big Price */}
        <div className="lanyard-badge-price">
          {displayPrice}
        </div>

        {/* Action Button: Frosted Pill with Orange Arrow */}
        {cta ? (
          cta
        ) : onClick ? (
          <button
            type="button"
            className="lanyard-claim-btn"
            disabled={disabled || soldOut}
            onClick={onClick}
          >
            <span className="lanyard-claim-label">{soldOut ? 'Sold Out' : 'Claim Pass'}</span>
            <span className="lanyard-claim-arrow" aria-hidden="true">↗</span>
          </button>
        ) : (
          <a
            href={soldOut ? undefined : REGISTER_URL}
            target={soldOut ? undefined : '_blank'}
            rel={soldOut ? undefined : 'noopener noreferrer'}
            className={`lanyard-claim-btn ${soldOut ? 'is-disabled' : ''}`}
            aria-label={`Claim ${plan.name} pass for ${displayPrice}`}
          >
            <span className="lanyard-claim-label">{soldOut ? 'Sold Out' : 'Claim Pass'}</span>
            <span className="lanyard-claim-arrow" aria-hidden="true">↗</span>
          </a>
        )}

        {/* Barcode & Auth String */}
        <div className="lanyard-badge-footer">
          <div className="lanyard-badge-barcode" aria-hidden="true">
            <svg width="124" height="28" viewBox="0 0 124 28" fill="#111827">
              <rect x="0" y="0" width="3" height="28" />
              <rect x="5" y="0" width="1.5" height="28" />
              <rect x="8" y="0" width="3" height="28" />
              <rect x="14" y="0" width="4.5" height="28" />
              <rect x="21" y="0" width="1.5" height="28" />
              <rect x="25" y="0" width="3" height="28" />
              <rect x="30" y="0" width="1.5" height="28" />
              <rect x="34" y="0" width="4.5" height="28" />
              <rect x="41" y="0" width="1.5" height="28" />
              <rect x="44" y="0" width="3" height="28" />
              <rect x="50" y="0" width="3" height="28" />
              <rect x="55" y="0" width="1.5" height="28" />
              <rect x="59" y="0" width="4.5" height="28" />
              <rect x="66" y="0" width="1.5" height="28" />
              <rect x="70" y="0" width="3" height="28" />
              <rect x="75" y="0" width="1.5" height="28" />
              <rect x="79" y="0" width="4.5" height="28" />
              <rect x="86" y="0" width="1.5" height="28" />
              <rect x="90" y="0" width="3" height="28" />
              <rect x="96" y="0" width="3" height="28" />
              <rect x="101" y="0" width="1.5" height="28" />
              <rect x="105" y="0" width="4.5" height="28" />
              <rect x="112" y="0" width="1.5" height="28" />
              <rect x="116" y="0" width="3" height="28" />
              <rect x="121" y="0" width="3" height="28" />
            </svg>
          </div>
          <div className="lanyard-badge-divider" aria-hidden="true" />
          <div className="lanyard-badge-auth">
            AUTH: {authCode}
          </div>
        </div>
      </div>
    </div>
  );
}
