'use client';

import React, { useEffect, useRef, useState } from 'react';
import { VolumeX } from 'lucide-react';
import { format12h } from './MiniPrayerPill';
import type { PosterTransitionType, SilenceScreenAccentTheme } from '@/types/index';

export interface PrayerDndOverlayProps {
  readonly isVisible: boolean;
  readonly prayerName?: string | undefined;
  readonly iqamahTime?: string | undefined;
  readonly detailLine?: string | null | undefined;
  readonly isExtendedSession?: boolean | undefined;
  readonly transition?: PosterTransitionType | undefined;
  readonly accentTheme?: SilenceScreenAccentTheme | undefined;
  readonly customSubtitle?: string | null | undefined;
}

function resolveSilenceAnimationClass(
  role: 'incoming' | 'outgoing',
  transition: PosterTransitionType
): string {
  if (transition === 'slide-left') {
    return role === 'incoming' ? 'animate-silence-in-slide-left' : 'animate-silence-out-slide-left';
  }
  if (transition === 'slide-right') {
    return role === 'incoming' ? 'animate-silence-in-slide-right' : 'animate-silence-out-slide-right';
  }
  if (transition === 'slide-up') {
    return role === 'incoming' ? 'animate-silence-in-slide-up' : 'animate-silence-out-slide-up';
  }
  if (transition === 'zoom') {
    return role === 'incoming' ? 'animate-silence-in-zoom' : 'animate-silence-out-zoom';
  }
  return role === 'incoming' ? 'animate-silence-in-fade' : 'animate-silence-out-fade';
}

interface ThemeStyles {
  readonly iconContainer: string;
  readonly icon: string;
  readonly iqamahBadge: string;
}

function resolveThemeStyles(theme: SilenceScreenAccentTheme = 'green'): ThemeStyles {
  switch (theme) {
    case 'amber':
      return {
        iconContainer: 'bg-amber-500/15 border border-amber-400/30 text-amber-300 shadow-[0_0_60px_rgba(245,158,11,0.25)]',
        icon: 'text-amber-400',
        iqamahBadge: 'text-amber-300/90',
      };
    case 'teal':
      return {
        iconContainer: 'bg-teal-500/15 border border-teal-400/30 text-teal-300 shadow-[0_0_60px_rgba(20,184,166,0.25)]',
        icon: 'text-teal-400',
        iqamahBadge: 'text-teal-300/90',
      };
    case 'white':
      return {
        iconContainer: 'bg-white/10 border border-white/25 text-white shadow-[0_0_60px_rgba(255,255,255,0.2)]',
        icon: 'text-white',
        iqamahBadge: 'text-neutral-300',
      };
    case 'green':
    default:
      return {
        iconContainer: 'bg-green-600/15 border border-green-500/30 text-green-300 shadow-[0_0_60px_rgba(34,197,94,0.25)]',
        icon: 'text-green-400',
        iqamahBadge: 'text-green-300/90',
      };
  }
}

function formatSilenceTitle(prayerName: string): string {
  const clean = prayerName.trim();
  const lower = clean.toLowerCase();
  if (lower.includes('khutbah') || lower.includes('/') || lower.endsWith('prayer')) {
    return `${clean} in Progress`;
  }
  return `${clean} Prayer in Progress`;
}

function formatSilenceTimeLabel(prayerName: string): string {
  const lower = prayerName.toLowerCase();
  if (lower.includes('khutbah') || lower.includes('jummah') || lower.includes('eid')) {
    return 'Salah';
  }
  if (lower.includes('taraweeh') || lower.includes('qiyam') || lower.includes('tahajjud')) {
    return 'Starts';
  }
  return 'Iqamah';
}

function formatSilenceSubtitle(prayerName: string, customSubtitle?: string | null): string {
  if (prayerName.toLowerCase().includes('khutbah')) {
    return 'Please switch mobile phones to silent and listen attentively';
  }
  if (customSubtitle && customSubtitle.trim().length > 0) {
    return customSubtitle.trim();
  }
  return 'Please switch mobile phones to silent';
}

/**
 * Calm Do-Not-Disturb Reverence Overlay (ux_principles.md §3.3)
 * Active while a prayer Iqamah is in progress (STARTING_NOW).
 * Smoothly transitions in and out using venue-selected slide transition with 100% solid opacity.
 */
export function PrayerDndOverlay({
  isVisible,
  prayerName,
  iqamahTime,
  detailLine,
  isExtendedSession = false,
  transition = 'fade',
  accentTheme = 'green',
  customSubtitle,
}: PrayerDndOverlayProps) {
  const [isMounted, setIsMounted] = useState(isVisible);
  const [animState, setAnimState] = useState<'entering' | 'active' | 'exiting' | 'idle'>(
    isVisible ? 'active' : 'idle'
  );
  const [pixelShift, setPixelShift] = useState({ x: 0, y: 0 });
  const prevVisibleRef = useRef(isVisible);
  const cachedPrayerNameRef = useRef(prayerName);
  const cachedIqamahTimeRef = useRef(iqamahTime);
  const cachedDetailLineRef = useRef(detailLine);

  if (prayerName) {
    cachedPrayerNameRef.current = prayerName;
    cachedIqamahTimeRef.current = iqamahTime;
    cachedDetailLineRef.current = detailLine;
  }

  useEffect(() => {
    if (!isVisible || !isExtendedSession) {
      setPixelShift({ x: 0, y: 0 });
      return undefined;
    }
    const shiftTimer = setInterval(() => {
      const offsetX = Math.floor(Math.random() * 11) - 5; // -5px to +5px gentle anti-burn-in drift
      const offsetY = Math.floor(Math.random() * 11) - 5;
      setPixelShift({ x: offsetX, y: offsetY });
    }, 180_000); // every 3 minutes
    return () => clearInterval(shiftTimer);
  }, [isVisible, isExtendedSession]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isVisible && !prevVisibleRef.current) {
      setIsMounted(true);
      setAnimState('entering');
      timer = setTimeout(() => setAnimState('active'), 600);
    } else if (!isVisible && prevVisibleRef.current) {
      setAnimState('exiting');
      timer = setTimeout(() => {
        setIsMounted(false);
        setAnimState('idle');
      }, 600);
    }
    prevVisibleRef.current = isVisible;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible]);

  const displayPrayer = prayerName || cachedPrayerNameRef.current;
  const displayIqamah = iqamahTime || cachedIqamahTimeRef.current;
  const displayDetail = prayerName ? detailLine : cachedDetailLineRef.current;

  if (!isMounted || !displayPrayer) return null;

  const animClass =
    animState === 'entering'
      ? resolveSilenceAnimationClass('incoming', transition)
      : animState === 'exiting'
      ? resolveSilenceAnimationClass('outgoing', transition)
      : 'opacity-100 transform-none';

  const themeStyles = resolveThemeStyles(accentTheme);
  const title = formatSilenceTitle(displayPrayer);
  const subtitle = formatSilenceSubtitle(displayPrayer, customSubtitle);
  const timeLabel = formatSilenceTimeLabel(displayPrayer);

  return (
    <div
      data-testid="prayer-dnd-overlay"
      className={`absolute top-24 inset-x-0 bottom-0 z-40 bg-black flex flex-col items-center justify-center text-center px-12 pointer-events-none transform-gpu overflow-hidden ${animClass}`}
    >
      <div
        className={`max-w-3xl space-y-6 transition-all duration-[2000ms] ease-in-out ${
          isExtendedSession ? 'opacity-80' : 'opacity-100'
        }`}
        style={{ transform: `translate3d(${pixelShift.x}px, ${pixelShift.y}px, 0)` }}
      >
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${themeStyles.iconContainer}`}>
          <VolumeX className={`w-10 h-10 ${themeStyles.icon}`} aria-hidden="true" />
        </div>
        <h2 className="text-5xl font-extrabold text-white tracking-tight">
          {title}
        </h2>
        <p className="text-2xl text-neutral-300 font-medium leading-relaxed">
          {subtitle}
        </p>
        {displayDetail && (
          <p className="text-xl font-semibold text-neutral-200 tracking-wide">
            {displayDetail}
          </p>
        )}
        {displayIqamah && (
          <p className={`text-lg font-mono tabular-nums ${themeStyles.iqamahBadge}`}>
            {timeLabel} • {format12h(displayIqamah)}
          </p>
        )}
      </div>
    </div>
  );
}

