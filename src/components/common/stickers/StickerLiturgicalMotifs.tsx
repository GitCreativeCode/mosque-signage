'use client';

import React from 'react';

interface StickerSvgProps {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly colorOverride?: string | undefined;
  readonly className: string;
  readonly style?: React.CSSProperties | undefined;
}

/** Pure vector artwork for Mihrab Arch with Mashrabiya Lattice (Clean architectural arch with zero center star/diamond) */
export function MihrabArchStickerSvg({ primaryColor, secondaryColor, colorOverride, className, style }: StickerSvgProps) {
  const gold = colorOverride || primaryColor || '#fbbf24';
  return (
    <svg
      viewBox="8 6 84 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="mihrabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor={gold} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>
      {/* Outer Pointed Horseshoe Arch */}
      <path
        d="M 14,116 L 14,54 C 14,24 50,8 50,8 C 50,8 86,24 86,54 L 86,116"
        stroke="url(#mihrabGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Inner Stepped Ornamental Arch */}
      <path
        d="M 22,116 L 22,56 C 22,32 50,18 50,18 C 50,18 78,32 78,56 L 78,116"
        stroke={gold}
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />
      {/* Mashrabiya Lattice Lintel */}
      <polygon points="50,24 60,34 50,44 40,34" stroke={gold} strokeWidth="1.2" fill="none" opacity="0.8" />
      <polygon points="32,44 42,54 32,64 22,54" stroke={gold} strokeWidth="1.2" fill="none" opacity="0.6" />
      <polygon points="68,44 78,54 68,64 58,54" stroke={gold} strokeWidth="1.2" fill="none" opacity="0.6" />
      {/* Slender Fluted Side Columns */}
      <line x1="18" y1="56" x2="18" y2="116" stroke={secondaryColor} strokeWidth="1" />
      <line x1="82" y1="56" x2="82" y2="116" stroke={secondaryColor} strokeWidth="1" />
      {/* Pillar Capital & Plinth */}
      <rect x="10" y="52" width="8" height="4" rx="1" fill={gold} />
      <rect x="82" y="52" width="8" height="4" rx="1" fill={gold} />
      <rect x="10" y="114" width="8" height="4" rx="1" fill={gold} />
      <rect x="82" y="114" width="8" height="4" rx="1" fill={gold} />
    </svg>
  );
}
