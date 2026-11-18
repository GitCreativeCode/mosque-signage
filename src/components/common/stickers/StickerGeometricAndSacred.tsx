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
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full select-none filter drop-shadow-[0_4px_16px_rgba(245,158,11,0.7)] ${className}`} style={style}>
      <polygon points="50,4 62,24 84,16 76,38 96,50 76,62 84,84 62,76 50,96 38,76 16,84 24,62 4,50 24,38 16,16 38,24" fill={colorOverride ? `${colorOverride}33` : '#064e3b'} stroke={primaryColor} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,14 60,30 76,24 70,40 86,50 70,60 76,76 60,70 50,86 40,70 24,76 30,60 14,50 30,40 24,24 40,30" fill={colorOverride ? `${colorOverride}55` : '#022c22'} stroke={primaryColor} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="16" fill={colorOverride || '#0f172a'} stroke={primaryColor} strokeWidth="1.8" />
      <circle cx="50" cy="50" r="12" fill="none" stroke={secondaryColor} strokeWidth="1" strokeDasharray="2 1.5" />
      <polygon points="50,38 53,46 62,43 57,50 62,57 53,54 50,62 47,54 38,57 43,50 38,43 47,46" fill={primaryColor} />
      <circle cx="50" cy="50" r="3.5" fill={colorOverride ? '#ffffff' : '#fef08a'} />
    </svg>
  );
}

export function BismillahStickerSvg({ primaryColor, secondaryColor, colorOverride, className, style }: SacredSvgProps) {
  return (
    <svg viewBox="0 0 260 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full select-none filter drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] ${className}`} style={style}>
      <defs>
        <linearGradient id="bismillahBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorOverride ? `${colorOverride}33` : 'rgba(15, 23, 42, 0.95)'} />
          <stop offset="100%" stopColor={colorOverride ? `${colorOverride}15` : 'rgba(2, 6, 23, 0.98)'} />
        </linearGradient>
        <linearGradient id="bismillahBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={primaryColor} stopOpacity="0.4" />
          <stop offset="50%" stopColor={primaryColor} stopOpacity="1" />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="252" height="62" rx="31" fill="url(#bismillahBgGrad)" stroke="url(#bismillahBorderGrad)" strokeWidth="1.75" />
      <rect x="8" y="8" width="244" height="54" rx="27" fill="none" stroke={secondaryColor} strokeWidth="0.75" strokeDasharray="4 3" strokeOpacity="0.8" />
      <circle cx="20" cy="35" r="3" fill={primaryColor} />
      <circle cx="240" cy="35" r="3" fill={primaryColor} />
      <text x="130" y="43" textAnchor="middle" fill={primaryColor} fontSize="22" fontFamily="'Traditional Arabic', 'Amiri', 'Noto Naskh Arabic', 'Scheherazade New', Arial, sans-serif" fontWeight="bold" direction="rtl" style={{ letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
      </text>
    </svg>
  );
}

export function KaabaStickerSvg({ primaryColor, secondaryColor, className, style }: SacredSvgProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full select-none filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)] ${className}`} style={style}>
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
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full select-none filter drop-shadow-[0_4px_12px_rgba(180,83,9,0.6)] ${className}`} style={style}>
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

