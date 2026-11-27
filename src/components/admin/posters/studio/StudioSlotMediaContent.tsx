'use client';

import React from 'react';
import type { PosterSlotMedia } from '@/types/index';
import { FRAME_STYLES_REGISTRY } from '@/lib/posters/layout-engine';
import { getLiturgicalTheme } from '@/lib/posters/notice-themes';
import { IslamicStickerGraphic } from '@/components/common/IslamicStickerGraphic';

const BADGE_CLASSES: Record<string, string> = {
  gold: 'bg-amber-400 text-black border-amber-300',
  red: 'bg-rose-600 text-white border-rose-400',
  blue: 'bg-blue-600 text-white border-blue-400',
  purple: 'bg-purple-700 text-white border-purple-400',
  amber: 'bg-amber-600 text-white border-amber-400',
  emerald: 'bg-emerald-700 text-white border-emerald-400',
};

/** Shared inner media, liturgical notice, badge, and frame overlay renderer for grid and freeform slots. */
export function StudioSlotMediaContent({ slot }: { readonly slot: PosterSlotMedia }) {
  const frameMeta = FRAME_STYLES_REGISTRY[slot.frame_style] ?? FRAME_STYLES_REGISTRY.none;
  const noticePalette = getLiturgicalTheme(slot.notice_theme ?? 'emerald');
  const noticeFontClass =
    slot.notice_font === 'serif'
      ? 'font-serif'
      : slot.notice_font === 'mono'
      ? 'font-mono'
      : slot.notice_font === 'traditional'
      ? 'font-serif tracking-wider'
      : 'font-sans';
  const hAlign = slot.notice_headline_align || 'center';
  const hAlignClass = hAlign === 'left' ? 'text-left self-start' : hAlign === 'right' ? 'text-right self-end' : 'text-center self-center';
  const dAlign = slot.notice_align || 'center';
  const dAlignClass = dAlign === 'left' ? 'text-left self-start' : dAlign === 'right' ? 'text-right self-end' : 'text-center self-center';
  const dividerAlign = hAlign === 'left' ? 'self-start' : hAlign === 'right' ? 'self-end' : 'self-center';
  const italicClass = slot.notice_headline_italic ? 'italic' : '';
  const underlineClass = slot.notice_headline_underline ? 'underline' : '';

  return (
    <div className={`relative w-full h-full flex flex-col ${frameMeta.containerClasses}`}>
      <div className={`relative w-full h-full overflow-hidden ${frameMeta.innerClasses} flex items-center justify-center bg-black`}>
        {slot.frame_style === 'custom' && slot.custom_frame_url && (
          <img
            src={slot.custom_frame_url}
            alt="Frame"
            className="absolute inset-0 w-full h-full pointer-events-none z-20 object-fill select-none"
            draggable={false}
          />
        )}

        {slot.type === 'badge' ? (
          <div className="w-full h-full flex items-center justify-center p-2">
            <IslamicStickerGraphic type="badge_custom" badgeText={slot.badge_text || slot.label} badgeVariant={slot.badge_variant} />
          </div>
        ) : slot.type === 'notice' ? (
          <div
            className={`w-full h-full p-4 flex flex-col justify-center items-stretch ${noticeFontClass} overflow-hidden`}
            style={{ background: `linear-gradient(to bottom, ${noticePalette.gradStart}, ${noticePalette.gradMid}, ${noticePalette.gradEnd})` }}
          >
            <h4
              className={`text-base sm:text-lg font-black line-clamp-2 leading-tight drop-shadow-md max-w-xl ${hAlignClass} ${italicClass} ${underlineClass}`}
              style={{ color: noticePalette.headlineColor }}
            >
              {slot.notice_headline || 'Community Announcement'}
            </h4>
            <div className={`w-16 h-1 rounded-full my-2 shadow-sm ${dividerAlign}`} style={{ backgroundColor: noticePalette.borderAccent }} />
            <p
              className={`text-xs line-clamp-2 font-medium leading-relaxed max-w-md drop-shadow-sm ${dAlignClass}`}
              style={{ color: noticePalette.textColor }}
            >
              {slot.notice_description || 'Program timings and details...'}
            </p>
          </div>
        ) : slot.type === 'video' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            {slot.fit_mode === 'contain_blur' && slot.asset_path && (
              <video src={slot.asset_path} autoPlay muted loop playsInline aria-hidden="true" draggable={false} className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-35 scale-110 pointer-events-none" />
            )}
            {slot.asset_path && (
              <video
                src={slot.asset_path}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className={`relative z-10 pointer-events-none select-none ${slot.fit_mode === 'cover' ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'}`}
              />
            )}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {slot.fit_mode === 'contain_blur' && slot.asset_path && (
              <div className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110 pointer-events-none" style={{ backgroundImage: `url(${slot.asset_path})` }} />
            )}
            {slot.asset_path ? (
              <img
                src={slot.asset_path}
                alt={slot.original_filename ?? 'Slot media'}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className={`relative z-10 pointer-events-none select-none ${slot.fit_mode === 'cover' ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'}`}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

