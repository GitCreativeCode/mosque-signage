'use client';

import React from 'react';

interface SacredSvgProps {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly colorOverride?: string | undefined;
  readonly className: string;
  readonly style?: React.CSSProperties | undefined;
}

export function IslamicStarStickerSvg({ primaryColor, secondaryColor, colorOverride, className, style }: SacredSvgProps) {
  const gold = colorOverride || primaryColor || '#fbbf24';
  const emerald = colorOverride ? `${colorOverride}44` : '#064e3b';

  return (
    <svg viewBox="6 6 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full select-none ${className}`} style={style}>
      {/* Authentic Rub el Hizb: Two Concentric Interlocking Squares (45 deg) */}
      <rect x="20" y="20" width="60" height="60" rx="3" fill={emerald} stroke={gold} strokeWidth="2" />
      <rect x="20" y="20" width="60" height="60" rx="3" fill={emerald} stroke={gold} strokeWidth="2" transform="rotate(45 50 50)" />
      
      {/* Inner Decorative Concentric Rings */}
      <circle cx="50" cy="50" r="18" fill="#022c22" stroke={gold} strokeWidth="1.5" />
      <circle cx="50" cy="50" r="14" fill="none" stroke={secondaryColor} strokeWidth="0.8" strokeDasharray="2 1.5" />
      <circle cx="50" cy="50" r="5" fill={gold} />
    </svg>
  );
}

export function BismillahStickerSvg({ primaryColor, colorOverride, className, style }: SacredSvgProps) {
  const gold = colorOverride || primaryColor || '#fbbf24';

  return (
    <svg viewBox="20 10 240 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full select-none ${className}`} style={style}>
      <defs>
        <filter id="bismillahDropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.85" />
        </filter>
      </defs>
      <text
        x="140"
        y="36"
        textAnchor="middle"
        fill={gold}
        fontSize="24"
        fontFamily="'Traditional Arabic', 'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif"
        fontWeight="bold"
        direction="rtl"
        filter="url(#bismillahDropShadow)"
        style={{ letterSpacing: '0.5px' }}
      >
        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
      </text>
    </svg>
  );
}

export function KaabaStickerSvg({ primaryColor, secondaryColor, className, style }: SacredSvgProps) {
  return (
    <svg viewBox="10 12 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full select-none filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)] ${className}`} style={style}>
      <polygon points="50,15 88,32 50,48 12,32" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
      <polygon points="12,32 50,48 50,88 12,72" fill="#111827" stroke="#374151" strokeWidth="1.5" />
      <polygon points="50,48 88,32 88,72 50,88" fill="#030712" stroke="#374151" strokeWidth="1.5" />
      <polygon points="12,40 50,56 50,62 12,46" fill={primaryColor} stroke={secondaryColor} strokeWidth="0.8" />
      <polygon points="50,56 88,40 88,46 50,62" fill={secondaryColor} stroke={primaryColor} strokeWidth="0.8" />
      <polygon points="24,62 38,67 38,82 24,76" fill={primaryColor} stroke={secondaryColor} strokeWidth="1" />
    </svg>
  );
}

export function TasbihStickerSvg({ primaryColor, secondaryColor, className, style }: SacredSvgProps) {
  return (
    <svg viewBox="14 6 72 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full select-none filter drop-shadow-[0_4px_12px_rgba(180,83,9,0.6)] ${className}`} style={style}>
      <circle cx="50" cy="42" r="30" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="1 1" fill="none" />
      <g fill={primaryColor} stroke={secondaryColor} strokeWidth="1">
        <circle cx="50" cy="12" r="4" /><circle cx="63" cy="15" r="4" /><circle cx="74" cy="24" r="4" />
        <circle cx="80" cy="36" r="4" /><circle cx="78" cy="49" r="4" /><circle cx="71" cy="61" r="4" />
        <circle cx="60" cy="69" r="4" /><circle cx="40" cy="69" r="4" /><circle cx="29" cy="61" r="4" />
        <circle cx="22" cy="49" r="4" /><circle cx="20" cy="36" r="4" /><circle cx="26" cy="24" r="4" />
        <circle cx="37" cy="15" r="4" />
      </g>
      <polygon points="47,72 53,72 51,84 49,84" fill={secondaryColor} stroke={primaryColor} strokeWidth="0.8" />
      <circle cx="50" cy="85" r="3" fill={primaryColor} />
      <line x1="48" y1="88" x2="44" y2="98" stroke={primaryColor} strokeWidth="2" />
      <line x1="50" y1="88" x2="50" y2="99" stroke={primaryColor} strokeWidth="2" />
      <line x1="52" y1="88" x2="56" y2="98" stroke={primaryColor} strokeWidth="2" />
    </svg>
  );
}

