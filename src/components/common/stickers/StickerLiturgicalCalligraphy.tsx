'use client';

import React from 'react';

interface StickerSvgProps {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly colorOverride?: string | undefined;
  readonly className: string;
  readonly style?: React.CSSProperties | undefined;
}

/** Pure vector calligraphy for Alhamdulillah ("الْحَمْدُ لِلَّهِ") with typed Arabic typography */
export function AlhamdulillahStickerSvg({ primaryColor, colorOverride, className, style }: StickerSvgProps) {
  const gold = colorOverride || primaryColor || '#fbbf24';
  return (
    <svg
      viewBox="35 8 170 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
      style={style}
    >
      <defs>
        <filter id="alhamdShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.85" />
        </filter>
        <linearGradient id="alhamdGradText" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor={gold} />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <text
        x="120"
        y="42"
        textAnchor="middle"
        fill="url(#alhamdGradText)"
        fontSize="34"
        fontFamily="'Traditional Arabic', 'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif"
        fontWeight="bold"
        direction="rtl"
        filter="url(#alhamdShadow)"
        style={{ letterSpacing: '0.8px' }}
      >
        ٱلْحَمْدُ لِلَّهِ
      </text>
    </svg>
  );
}

/** Pure vector calligraphy for Masha'Allah ("مَا شَاءَ ٱللَّهُ") with typed Arabic typography */
export function MashaallahStickerSvg({ primaryColor, colorOverride, className, style }: StickerSvgProps) {
  const gold = colorOverride || primaryColor || '#fbbf24';
  return (
    <svg
      viewBox="40 8 160 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
      style={style}
    >
      <defs>
        <filter id="mashaShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.85" />
        </filter>
        <linearGradient id="mashaGradText" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor={gold} />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <text
        x="120"
        y="42"
        textAnchor="middle"
        fill="url(#mashaGradText)"
        fontSize="34"
        fontFamily="'Traditional Arabic', 'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif"
        fontWeight="bold"
        direction="rtl"
        filter="url(#mashaShadow)"
        style={{ letterSpacing: '0.8px' }}
      >
        مَا شَاءَ ٱللَّهُ
      </text>
    </svg>
  );
}

/** Pure vector calligraphy for Subhan Allah ("سُبْحَانَ ٱللَّهِ") with typed Arabic typography */
export function SubhanallahStickerSvg({ primaryColor, colorOverride, className, style }: StickerSvgProps) {
  const gold = colorOverride || primaryColor || '#fbbf24';
  return (
    <svg
      viewBox="45 8 150 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
      style={style}
    >
      <defs>
        <filter id="subhanShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.85" />
        </filter>
        <linearGradient id="subhanGradText" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor={gold} />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <text
        x="120"
        y="42"
        textAnchor="middle"
        fill="url(#subhanGradText)"
        fontSize="34"
        fontFamily="'Traditional Arabic', 'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif"
        fontWeight="bold"
        direction="rtl"
        filter="url(#subhanShadow)"
        style={{ letterSpacing: '0.8px' }}
      >
        سُبْحَانَ ٱللَّهِ
      </text>
    </svg>
  );
}
