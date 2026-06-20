import type { CSSProperties, ReactNode } from "react";

/* Icon path set — ported from the ClipMax prototype. */
export const ICONS: Record<string, ReactNode> = {
  bolt: <path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" />,
  grid: (
    <g>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </g>
  ),
  stream: (
    <g>
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M7 7l5-4 5 4" />
    </g>
  ),
  scissors: (
    <g>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </g>
  ),
  flow: (
    <g>
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </g>
  ),
  mega: (
    <g>
      <path d="M3 11l18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
    </g>
  ),
  cal: (
    <g>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </g>
  ),
  chart: (
    <g>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 4-6" />
    </g>
  ),
  users: (
    <g>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </g>
  ),
  cart: (
    <g>
      <circle cx="9" cy="21" r="1.5" />
      <circle cx="20" cy="21" r="1.5" />
      <path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6" />
    </g>
  ),
  bot: (
    <g>
      <rect x="3" y="8" width="18" height="12" rx="3" />
      <path d="M12 8V4M8 2h8" />
      <circle cx="9" cy="14" r="1" />
      <circle cx="15" cy="14" r="1" />
    </g>
  ),
  plug: (
    <g>
      <path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 01-12 0V8zM12 17v5" />
    </g>
  ),
  inbox: (
    <g>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </g>
  ),
  paint: (
    <g>
      <circle cx="13.5" cy="6.5" r="1.5" />
      <circle cx="17.5" cy="10.5" r="1.5" />
      <circle cx="8.5" cy="7.5" r="1.5" />
      <circle cx="6.5" cy="12.5" r="1.5" />
      <path d="M12 2a10 10 0 000 20c1.1 0 2-.9 2-2 0-.55-.2-1-.55-1.4-.35-.4-.45-.85-.45-1.6 0-1.1.9-2 2-2h2.55A4.45 4.45 0 0022 10.55C22 5.86 17.5 2 12 2z" />
    </g>
  ),
  film: (
    <g>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
    </g>
  ),
  play: <path d="M5 3l16 9-16 9V3z" />,
  plus: (
    <g>
      <path d="M12 5v14M5 12h14" />
    </g>
  ),
  search: (
    <g>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </g>
  ),
  refresh: (
    <g>
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </g>
  ),
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  zap: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  clock: (
    <g>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </g>
  ),
};

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  style,
  filled,
}: {
  name: IconName | string;
  style?: CSSProperties;
  filled?: boolean;
}) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {path}
    </svg>
  );
}
