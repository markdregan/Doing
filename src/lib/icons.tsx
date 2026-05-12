import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const InboxIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 10.5h11" />
    <path d="M2.5 10.5v2a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-2" />
    <path d="M2.5 10.5l1.5-7h8l1.5 7" />
  </svg>
);

export const TodayIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" stroke="none" {...props}>
    <path d="M8 1l2.16 4.38 4.84.7-3.5 3.41.83 4.82L8 12.04l-4.33 2.27.83-4.82-3.5-3.41 4.84-.7L8 1z" />
  </svg>
);

export const UpcomingIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
    <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    <circle cx="5.5" cy="9.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="9.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

export const AnytimeIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 5.5h10M3 8.5h10M3 11.5h10" />
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
  </svg>
);

export const SomedayIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.5 2.5a5.5 5.5 0 1 0 4 9.5A6 6 0 0 1 9.5 2.5z" />
  </svg>
);

export const LogbookIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3.5" y="2.5" width="9" height="11" rx="1" />
    <path d="M6 6h4M6 9h4M6 12h2" />
    <path d="M3.5 4.5h9" />
  </svg>
);

export const TrashIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3.5 3.5h9M5.5 3.5V2h5v1.5M6 6v6M10 6v6M4 3.5l.5 10h7.5l.5-10" />
  </svg>
);

export const DeadlineIcon = ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 1.5v11" />
    <path d="M2.5 2.5s3.5-1.5 4.5 0 4.5 0 4.5 0v5.5s-3.5-1.5-4.5 0-4.5 0-4.5 0" />
  </svg>
);

export const SearchIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);
