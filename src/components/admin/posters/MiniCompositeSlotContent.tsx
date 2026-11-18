'use client';

import React from 'react';
import type { PosterSlotMedia } from '@/types/index';
import { getLiturgicalTheme } from '@/lib/posters/notice-themes';
import { IslamicStickerGraphic } from '@/components/common/IslamicStickerGraphic';

export function MiniCompositeSlotContent({ slot }: { readonly slot: PosterSlotMedia }) {
  if (slot.type === 'notice') {
    const palette = getLiturgicalTheme(slot.notice_theme ?? 'emerald');
    return (
      <div
        className="w-full h-full p-1.5 flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ background: `linear-gradient(to bottom, ${palette.gradStart}, ${palette.gradMid}, ${palette.gradEnd})` }}
      >
        <p className="text-[9px] font-black line-clamp-1 leading-tight" style={{ color: palette.headlineColor }}>
          {slot.notice_headline || 'Notice'}
        </p>
        <div className="w-4 h-0.5 my-0.5 rounded-full" style={{ backgroundColor: palette.borderAccent }} />
        {slot.notice_description && (
          <p className="text-[7px] line-clamp-1 leading-snug" style={{ color: palette.textColor }}>
            {slot.notice_description}
          </p>
        )}
      </div>
    );
  }

  if (slot.type === 'badge') {
    return (
      <div className="w-full h-full flex items-center justify-center p-1">
        <IslamicStickerGraphic
          type="badge_custom"
          badgeText={slot.badge_text || slot.label || 'BADGE'}
          badgeVariant={slot.badge_variant ?? 'emerald'}
        />
      </div>
    );
  }

  if (slot.type === 'video') {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        {slot.asset_path && (
          <video
            src={`${slot.asset_path}#t=0.001`}
            muted
            playsInline
            preload="metadata"
            className={`relative z-10 pointer-events-none ${slot.fit_mode === 'cover' ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'}`}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
      {slot.fit_mode === 'contain_blur' && slot.asset_path && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-md opacity-30 scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${slot.asset_path})` }}
        />
      )}
      {slot.asset_path && (
        <img
          src={slot.asset_path}
          alt=""
          className={`relative z-10 ${slot.fit_mode === 'cover' ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'}`}
        />
      )}
    </div>
  );
}

