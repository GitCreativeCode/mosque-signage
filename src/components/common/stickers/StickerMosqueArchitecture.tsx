'use client';

import React from 'react';

interface MosqueSvgProps {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly colorOverride?: string | undefined;
  readonly className: string;
  readonly style?: React.CSSProperties | undefined;
}

export function MosqueStickerSvg({ primaryColor, secondaryColor, colorOverride, className, style }: MosqueSvgProps) {
  return (
    <svg
      viewBox="0 0 140 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none filter drop-shadow-[0_4px_16px_rgba(16,185,129,0.7)] ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="mosqueDomeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorOverride || '#34d399'} />
          <stop offset="60%" stopColor={colorOverride || '#059669'} />
          <stop offset="100%" stopColor={colorOverride ? `${colorOverride}cc` : '#022c22'} />
        </linearGradient>
        <linearGradient id="minaretGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorOverride || '#059669'} />
          <stop offset="50%" stopColor={colorOverride || '#10b981'} />
          <stop offset="100%" stopColor={colorOverride || '#047857'} />
        </linearGradient>
      </defs>

      <path d="M 44,56 C 44,30 58,16 70,6 C 82,16 96,30 96,56 Z" fill="url(#mosqueDomeGrad)" stroke={primaryColor} strokeWidth="1.5" />
      <line x1="70" y1="6" x2="70" y2="1" stroke={primaryColor} strokeWidth="1.8" />
      <circle cx="70" cy="1" r="1.5" fill={primaryColor} />
      <path d="M 68.5,-1 A 2.5,2.5 0 0 1 72,-1 A 2,2 0 0 0 68.5,-1" fill={primaryColor} />
      <path d="M 28,58 C 28,42 38,36 44,34 L 44,58 Z" fill={colorOverride ? `${colorOverride}aa` : '#047857'} stroke={primaryColor} strokeWidth="1" />
      <path d="M 112,58 C 112,42 102,36 96,34 L 96,58 Z" fill={colorOverride ? `${colorOverride}aa` : '#047857'} stroke={primaryColor} strokeWidth="1" />
      <rect x="26" y="56" width="88" height="40" rx="2" fill={colorOverride ? `${colorOverride}dd` : '#064e3b'} stroke={primaryColor} strokeWidth="1.5" />
      <path d="M 26,56 L 30,52 L 34,56 L 38,52 L 42,56 L 98,56 L 102,52 L 106,56 L 110,52 L 114,56" stroke={primaryColor} strokeWidth="1.2" fill="none" />
      <path d="M 60,96 L 60,72 C 60,65 80,65 80,72 L 80,96 Z" fill={colorOverride ? '#000000' : '#022c22'} stroke={primaryColor} strokeWidth="1.8" />
      <path d="M 64,96 L 64,74 C 64,68 76,68 76,74 L 76,96 Z" fill="none" stroke={secondaryColor} strokeWidth="1" strokeDasharray="2 1" />
      <path d="M 34,84 L 34,70 C 34,65 44,65 44,70 L 44,84 Z" fill="#022c22" stroke={primaryColor} strokeWidth="1" />
      <path d="M 48,84 L 48,70 C 48,65 56,65 56,70 L 56,84 Z" fill="#022c22" stroke={primaryColor} strokeWidth="1" />
      <path d="M 84,84 L 84,70 C 84,65 92,65 92,70 L 92,84 Z" fill="#022c22" stroke={primaryColor} strokeWidth="1" />
      <path d="M 96,84 L 96,70 C 96,65 106,65 106,70 L 106,84 Z" fill="#022c22" stroke={primaryColor} strokeWidth="1" />

      <rect x="10" y="24" width="10" height="72" rx="1" fill="url(#minaretGrad)" stroke={primaryColor} strokeWidth="1" />
      <rect x="8" y="44" width="14" height="4" rx="1" fill={primaryColor} stroke={secondaryColor} strokeWidth="0.8" />
      <rect x="8" y="24" width="14" height="4" rx="1" fill={primaryColor} stroke={secondaryColor} strokeWidth="0.8" />
      <polygon points="9,24 21,24 15,6" fill={colorOverride || '#047857'} stroke={primaryColor} strokeWidth="1" />
      <line x1="15" y1="6" x2="15" y2="2" stroke={primaryColor} strokeWidth="1.5" />
      <circle cx="15" cy="1.5" r="1.2" fill={primaryColor} />

      <rect x="120" y="24" width="10" height="72" rx="1" fill="url(#minaretGrad)" stroke={primaryColor} strokeWidth="1" />
      <rect x="118" y="44" width="14" height="4" rx="1" fill={primaryColor} stroke={secondaryColor} strokeWidth="0.8" />
      <rect x="118" y="24" width="14" height="4" rx="1" fill={primaryColor} stroke={secondaryColor} strokeWidth="0.8" />
      <polygon points="119,24 131,24 125,6" fill={colorOverride || '#047857'} stroke={primaryColor} strokeWidth="1" />
      <line x1="125" y1="6" x2="125" y2="2" stroke={primaryColor} strokeWidth="1.5" />
      <circle cx="125" cy="1.5" r="1.2" fill={primaryColor} />
    </svg>
  );
}

