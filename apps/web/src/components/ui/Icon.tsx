import type { SVGProps } from 'react';

/**
 * A small hand-rolled icon set (no icon-library dependency). Every icon is
 * a plain 24x24 stroke SVG that inherits `currentColor`, so it always
 * matches the surrounding text/tint without extra props.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M13 6v2M13 16v2M13 10.5v3" />
    </svg>
  );
}

export function RocketIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 15c-1 1-1.5 4-1.5 4s3-.5 4-1.5" />
      <path d="M12 15a15 15 0 0 0 6-9 3 3 0 0 0-3-3 15 15 0 0 0-9 6l6 6Z" />
      <circle cx="15" cy="9" r="1.5" />
    </svg>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 18-6-6 6-6M15 6l6 6-6 6" />
    </svg>
  );
}

export function NetworkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="5" cy="7" r="2.2" />
      <circle cx="19" cy="7" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="m6.7 8.6 4 7.4M17.3 8.6l-4 7.4M7.2 7h9.6" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 6-6 2 2-6 6-2Z" />
    </svg>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3-6 7-6s7 2.7 7 6" />
      <circle cx="18" cy="9" r="2.3" />
      <path d="M16.5 14.2c2.6.4 4.5 2.6 4.5 5.8" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4h6v6M20 4 10 14M8 6H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1.5-5H11l8 4V5l-8 4H5a2 2 0 0 0-2 2Z" />
    </svg>
  );
}
