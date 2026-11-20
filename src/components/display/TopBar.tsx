'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { DateDisplayMode } from '@/types/index';
import { TopBarDateBlock } from './TopBarDateBlock';

export interface TopBarProps {
  readonly hijriDate: string;
  readonly gregorianDate?: string | undefined;
  readonly dateFormat?: DateDisplayMode | undefined;
  readonly clockTime: string;
  readonly tickerText?: string | undefined;
  readonly mosqueName: string;
  readonly greeting?: string | undefined;
  readonly isClockUnsynchronized?: boolean | undefined;
}

export function TopBar({
  hijriDate,
  gregorianDate,
  dateFormat = 'both',
  clockTime,
  tickerText,
  mosqueName,
  greeting,
  isClockUnsynchronized,
}: TopBarProps) {
  const fullMosqueTitle = greeting?.trim() ? `${greeting.trim()} ${mosqueName}` : mosqueName;
  const cleanTicker = tickerText?.trim() ?? '';
  const [isTitleOverflowing, setIsTitleOverflowing] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(45);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const halfRef = useRef<HTMLSpanElement>(null);
  const clickTimesRef = useRef<number[]>([]);

  const handleClockClick = () => {
    const now = Date.now();
    const recent = [...clickTimesRef.current.filter((t) => now - t < 1500), now];
    clickTimesRef.current = recent;
    if (recent.length >= 3) {
      clickTimesRef.current = [];
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('kiosk:toggle-simulator'));
    }
  };

  const shouldMarquee = Boolean(cleanTicker) || isTitleOverflowing;
  const tickerUnit = cleanTicker ? `${fullMosqueTitle} \u00A0•\u00A0 ${cleanTicker}` : fullMosqueTitle;
  const repeatCount = shouldMarquee ? Math.max(3, Math.ceil(3500 / Math.max(tickerUnit.length * 14, 100))) : 0;
  const fullHalfText = shouldMarquee
    ? Array(repeatCount).fill(tickerUnit).join(' \u00A0\u00A0•\u00A0\u00A0 ') + ' \u00A0\u00A0•\u00A0\u00A0 '
    : '';

  useEffect(() => {
    const checkOverflow = () => {
      if (!measureRef.current || !containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      if (containerWidth > 0) setIsTitleOverflowing(measureRef.current.offsetWidth > containerWidth - 32);
    };
    checkOverflow();
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(checkOverflow).catch(() => {});
    }
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && containerRef.current
        ? new ResizeObserver(checkOverflow)
        : null;
    if (resizeObserver && containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
      resizeObserver?.disconnect();
    };
  }, [fullMosqueTitle]);

  useEffect(() => {
    if (!shouldMarquee) return;
    const updateDuration = () => {
      if (halfRef.current && halfRef.current.offsetWidth > 0) {
        setDuration(Math.max(15, Math.round(halfRef.current.offsetWidth / 55)));
      }
    };
    updateDuration();
    window.addEventListener('resize', updateDuration);
    return () => window.removeEventListener('resize', updateDuration);
  }, [shouldMarquee, fullHalfText]);

  return (
    <header suppressHydrationWarning className="relative w-full h-24 bg-neutral-950 border-b border-white/10 flex items-center justify-between px-8 z-30 shadow-lg">
      <TopBarDateBlock hijriDate={hijriDate} gregorianDate={gregorianDate} dateFormat={dateFormat} />

      <div className="w-px h-12 bg-white/15 shrink-0" aria-hidden="true" />

      <div
        ref={containerRef}
        role="region"
        aria-label="Community Announcements and Mosque Title"
        suppressHydrationWarning
        className={`flex-1 mx-5 overflow-hidden relative h-full flex items-center ${shouldMarquee ? 'justify-start' : 'justify-center'}`}
      >
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-neutral-950 to-transparent z-10 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-neutral-950 to-transparent z-10 pointer-events-none" aria-hidden="true" />

        <span ref={measureRef} aria-hidden="true" className="absolute -top-[9999px] -left-[9999px] invisible pointer-events-none whitespace-nowrap text-2xl font-bold tracking-wide">
          {fullMosqueTitle}
        </span>

        {shouldMarquee ? (
          <div suppressHydrationWarning className="animate-marquee-continuous whitespace-nowrap flex items-center will-change-transform" style={{ animationDuration: `${duration}s` }} role="marquee" aria-live="off">
            <span ref={halfRef} suppressHydrationWarning className={`text-2xl tracking-wide shrink-0 ${cleanTicker ? 'font-medium text-neutral-200' : 'font-bold text-white'}`}>
              {fullHalfText}
            </span>
            <span suppressHydrationWarning className={`text-2xl tracking-wide shrink-0 ${cleanTicker ? 'font-medium text-neutral-200' : 'font-bold text-white'}`} aria-hidden="true">
              {fullHalfText}
            </span>
          </div>
        ) : (
          <div suppressHydrationWarning className="text-2xl font-bold tracking-wide text-white text-center px-4">{fullMosqueTitle}</div>
        )}
      </div>

      <div className="w-px h-12 bg-white/15 shrink-0" aria-hidden="true" />

      <div className="flex items-center gap-3 shrink-0 ml-5">
        {isClockUnsynchronized && (
          <div
            role="status"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-lg text-xs font-bold tracking-wide uppercase animate-pulse select-none"
            title="System clock is not synchronized. Prayer silence and automated audio muting are suspended."
          >
            <span aria-hidden="true">⚠️</span>
            <span>Unsynced Clock</span>
          </div>
        )}
        <div
          role="button"
          tabIndex={0}
          onClick={handleClockClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClockClick();
            }
          }}
          suppressHydrationWarning
          className="flex items-center justify-center px-2 py-1 cursor-pointer select-none active:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-lg"
          title="Current Time (Triple-click to toggle scenario simulator)"
          aria-label="Current Time. Triple-click or activate to toggle scenario simulator."
        >
          <span suppressHydrationWarning className="text-4xl font-extrabold tracking-tight text-white tabular-nums">
            {clockTime}
          </span>
        </div>
      </div>
    </header>
  );
}
