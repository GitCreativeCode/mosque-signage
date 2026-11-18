'use client';

import React from 'react';
import type { BadgeVariant, IslamicStickerType } from '@/types/index';
import { CrescentMoonStickerSvg, FanousStickerSvg } from './stickers/StickerLanternAndMoon';
import { MosqueStickerSvg } from './stickers/StickerMosqueArchitecture';
import {
  BismillahStickerSvg,
  IslamicStarStickerSvg,
  KaabaStickerSvg,
  TasbihStickerSvg,
} from './stickers/StickerGeometricAndSacred';

export interface IslamicStickerGraphicProps {
  readonly type: IslamicStickerType;
  readonly badgeText?: string | undefined;
  readonly badgeVariant?: BadgeVariant | undefined;
  readonly colorOverride?: string | undefined;
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties | undefined;
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  gold: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-yellow-200 text-slate-950 font-black shadow-[0_0_20px_rgba(234,179,8,0.7)]',
  red: 'bg-gradient-to-r from-rose-700 to-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)]',
  blue: 'bg-gradient-to-r from-blue-700 to-cyan-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]',
  purple: 'bg-gradient-to-r from-purple-800 to-indigo-700 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)]',
  amber: 'bg-gradient-to-r from-amber-700 to-orange-600 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.6)]',
  emerald: 'bg-gradient-to-r from-emerald-800 to-green-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]',
};

export function IslamicStickerGraphic({
  type,
  badgeText,
  badgeVariant = 'emerald',
  colorOverride,
  className = '',
  style,
}: IslamicStickerGraphicProps) {
  const props = {
    primaryColor: colorOverride || '#fbbf24',
    secondaryColor: colorOverride ? `${colorOverride}88` : '#d97706',
    colorOverride,
    className,
    style,
  };

  if (type === 'fanous') return <FanousStickerSvg {...props} />;
  if (type === 'crescent_moon') return <CrescentMoonStickerSvg {...props} />;
  if (type === 'mosque') return <MosqueStickerSvg {...props} />;
  if (type === 'islamic_star') return <IslamicStarStickerSvg {...props} />;
  if (type === 'bismillah') return <BismillahStickerSvg {...props} />;
  if (type === 'kaaba') return <KaabaStickerSvg {...props} />;
  if (type === 'tasbih') return <TasbihStickerSvg {...props} />;

  return (
    <div className={`w-full h-full flex items-center justify-center select-none ${className}`} style={style}>
      <div className={`w-full h-full flex items-center justify-center px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider text-center truncate ${BADGE_CLASSES[badgeVariant] || BADGE_CLASSES.emerald}`}>
        {badgeText || 'SPECIAL PROGRAM'}
      </div>
    </div>
  );
}
