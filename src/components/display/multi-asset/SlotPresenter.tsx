'use client';

import React, { useEffect, useRef } from 'react';
import type { BadgeVariant, PosterSlotMedia } from '@/types/index';
import { FRAME_STYLES_REGISTRY } from '@/lib/posters/layout-engine';
import { NoticeSlotView } from './NoticeSlotView';
import { BADGE_VARIANT_STYLES, RIBBON_BADGE_STYLES } from './overlay-styles';

export interface SlotPresenterProps {
  readonly slot: PosterSlotMedia;
  readonly isDrawerOpen: boolean;
  readonly globalMute: boolean;
  readonly posterAllowAudio: boolean;
  readonly slideIndex?: number | undefined;
  readonly isPaused?: boolean | undefined;
}

function BadgeSlotView({ text, variant = 'emerald' }: { text: string; variant?: BadgeVariant | undefined }) {
  const style = BADGE_VARIANT_STYLES[variant] ?? 'bg-emerald-700 text-white border-emerald-400';
  return (
    <div className="w-full h-full flex items-center justify-center p-3 select-none">
      <div className={`px-6 py-3 rounded-full border-2 font-black tracking-wider uppercase text-base sm:text-lg md:text-xl lg:text-2xl drop-shadow-2xl text-center ${style}`}>
        {text}
      </div>
    </div>
  );
}

function VideoSlotView({
  slot,
  isMuted,
  slideIndex,
  isPaused = false,
}: {
  slot: PosterSlotMedia;
  isMuted: boolean;
  slideIndex?: number | undefined;
  isPaused?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const loopCountRef = useRef(1);
  const targetLoops = slot.video_loop_count ?? 1;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = isMuted;
    el.currentTime = 0;
    loopCountRef.current = 1;
    if (!isPaused) {
      el.play()?.catch(() => {
        el.muted = true;
        el.play().catch(() => {});
      });
    }
    return () => {
      try { el.pause(); } catch { /* safe disposal */ }
    };
  }, [slot.asset_path, isMuted, slideIndex]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isPaused) {
      try { el.pause(); } catch { /* ignore */ }
    } else {
      try { el.play()?.catch(() => {}); } catch { /* ignore */ }
    }
  }, [isPaused]);

  const handleEnded = () => {
    if (loopCountRef.current >= targetLoops || !videoRef.current) return;
    loopCountRef.current += 1;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      {slot.fit_mode === 'contain_blur' && slot.asset_path && (
        <video
          src={slot.asset_path}
          muted
          playsInline
          autoPlay
          loop
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-2xl brightness-40 saturate-125 scale-110 pointer-events-none"
        />
      )}
      {slot.asset_path && (
        <video
          ref={videoRef}
          src={slot.asset_path}
          muted={isMuted}
          playsInline
          autoPlay
          preload="auto"
          onEnded={handleEnded}
          className={`relative z-10 ${slot.fit_mode === 'cover' ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'}`}
        />
      )}
    </div>
  );
}

export function SlotPresenter({
  slot,
  isDrawerOpen,
  globalMute,
  posterAllowAudio,
  slideIndex,
  isPaused = false,
}: SlotPresenterProps) {
  const frameMeta = FRAME_STYLES_REGISTRY[slot.frame_style] ?? FRAME_STYLES_REGISTRY.none;
  const ribbonStyle = slot.badge_variant ? RIBBON_BADGE_STYLES[slot.badge_variant] : RIBBON_BADGE_STYLES.emerald;

  return (
    <div className={`relative w-full h-full flex flex-col ${frameMeta.containerClasses}`}>
      <div className={`relative w-full h-full overflow-hidden ${frameMeta.innerClasses} flex items-center justify-center`}>
        {slot.type === 'badge' ? (
          <BadgeSlotView text={slot.badge_text || slot.label || 'ANNOUNCEMENT'} variant={slot.badge_variant} />
        ) : slot.type === 'notice' ? (
          <NoticeSlotView
            headline={slot.notice_headline ?? 'Community Announcement'}
            description={slot.notice_description ?? ''}
            theme={slot.notice_theme ?? 'emerald'}
            font={slot.notice_font}
            align={slot.notice_align}
            headlineAlign={slot.notice_headline_align}
            headlineItalic={slot.notice_headline_italic}
            headlineUnderline={slot.notice_headline_underline}
          />
        ) : slot.type === 'video' ? (
          <VideoSlotView slot={slot} isMuted={globalMute || !posterAllowAudio || isDrawerOpen} slideIndex={slideIndex} isPaused={isPaused} />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            {slot.fit_mode === 'contain_blur' && slot.asset_path && (
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-2xl brightness-40 saturate-125 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${slot.asset_path})` }}
              />
            )}
            {slot.asset_path && (
              <img
                src={slot.asset_path}
                alt={slot.original_filename ?? 'Slot media'}
                className={`relative z-10 ${slot.fit_mode === 'cover' ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'}`}
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            )}
          </div>
        )}

        {slot.frame_style === 'custom' && slot.custom_frame_url && (
          <img
            src={slot.custom_frame_url}
            alt="Custom Frame Border"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none z-20 object-fill"
          />
        )}

        {slot.badge_text && slot.type !== 'badge' && (
          <div className="absolute top-3 left-3 z-30 pointer-events-none">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider drop-shadow-md ${ribbonStyle}`}>
              {slot.badge_text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

