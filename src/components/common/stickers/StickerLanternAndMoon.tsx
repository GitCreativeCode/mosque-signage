'use client';

import React from 'react';

interface StickerSvgProps {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly colorOverride?: string | undefined;
  readonly className: string;
  readonly style?: React.CSSProperties | undefined;
}

export function FanousStickerSvg({ primaryColor, secondaryColor, className, style }: StickerSvgProps) {
  return (
    <svg
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)] ${className}`}
      style={style}
    >
      <line x1="50" y1="0" x2="50" y2="18" stroke={primaryColor} strokeWidth="2.5" strokeDasharray="2 2" />
      <circle cx="50" cy="20" r="3.5" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <path d="M 50,23 C 44,25 43,30 43,34 L 57,34 C 57,30 56,25 50,23 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1" />
      <polygon points="34,42 66,42 59,34 41,34" fill={secondaryColor} stroke={primaryColor} strokeWidth="1" />
      <polygon points="28,54 72,54 78,96 22,96" fill="rgba(245,158,11,0.18)" stroke={primaryColor} strokeWidth="2" />
      <path d="M 35,96 L 35,66 Q 42,58 50,58 Q 58,58 65,66 L 65,96 Z" fill="rgba(254,243,199,0.3)" stroke={primaryColor} strokeWidth="1.5" />
      <circle cx="50" cy="80" r="14" fill="rgba(251,191,36,0.35)" filter="blur(2px)" />
      <ellipse cx="50" cy="82" rx="4" ry="7" fill="#fef08a" />
      <path d="M 50,71 Q 53,77 50,85 Q 47,77 50,71 Z" fill="#f97316" />
      <polygon points="20,96 80,96 72,106 28,106" fill={secondaryColor} stroke={primaryColor} strokeWidth="1" />
      <polygon points="36,106 64,106 50,118" fill={primaryColor} />
      <line x1="50" y1="118" x2="50" y2="135" stroke={primaryColor} strokeWidth="2" />
      <circle cx="50" cy="136" r="3" fill={primaryColor} />
    </svg>
  );
}

export function CrescentMoonStickerSvg({ primaryColor, secondaryColor, colorOverride, className, style }: StickerSvgProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none filter drop-shadow-[0_4px_14px_rgba(234,179,8,0.7)] ${className}`}
      style={style}
    >
      <path
        d="M 50,10 A 40,40 0 1 0 88,68 A 34,34 0 1 1 50,10 Z"
        fill={colorOverride || 'url(#crescentGoldGrad)'}
        stroke={primaryColor}
        strokeWidth="1.5"
      />
      <polygon points="72,25 75,34 84,34 77,40 80,49 72,43 64,49 67,40 60,34 69,34" fill={primaryColor} stroke={secondaryColor} strokeWidth="1" />
      {!colorOverride && (
        <defs>
          <linearGradient id="crescentGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}

