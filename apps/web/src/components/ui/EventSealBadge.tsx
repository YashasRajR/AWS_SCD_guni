/**
 * Small rotating circular "seal" badge, purely decorative -- a spinning
 * text ring around a fixed center emblem, like an event stamp/seal.
 * Dropped into the hero as one self-contained absolute-positioned piece
 * so it can't affect any existing hero sizing/layout.
 */
export function EventSealBadge() {
  return (
    <svg className="event-seal-badge" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <path id="seal-circle-path" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
      </defs>
      <g className="seal-rotor">
        <circle cx="50" cy="50" r="46" className="seal-ring" />
        <text className="seal-ring-text">
          <textPath href="#seal-circle-path" startOffset="0%">
            • AWS STUDENT COMMUNITY DAY • 2026
          </textPath>
        </text>
      </g>
      <circle cx="50" cy="50" r="27" className="seal-center" />
      <text x="50" y="47" textAnchor="middle" className="seal-center-text-main">
        SCD
      </text>
      <text x="50" y="60" textAnchor="middle" className="seal-center-text-sub">
        GUNI
      </text>
    </svg>
  );
}
