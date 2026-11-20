'use client';

import React, { useEffect, useRef, useState } from 'react';
import { VolumeX } from 'lucide-react';
import { format12h } from './MiniPrayerPill';
import type { PosterTransitionType } from '@/types/index';

export interface PrayerDndOverlayProps {
  readonly isVisible: boolean;
  readonly prayerName?: string | undefined;
  readonly iqamahTime?: string | undefined;
  readonly transition?: PosterTransitionType | undefined;
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

/**
 * Calm Do-Not-Disturb Reverence Overlay (ux_principles.md §3.3)
 * Active while a prayer Iqamah is in progress (STARTING_NOW).
 * Smoothly transitions in and out using venue-selected slide transition with 100% solid opacity.
 */
export function PrayerDndOverlay({
  isVisible,
  prayerName,
  iqamahTime,
  transition = 'fade',
}: PrayerDndOverlayProps) {
  const [isMounted, setIsMounted] = useState(isVisible);
  const [animState, setAnimState] = useState<'entering' | 'active' | 'exiting' | 'idle'>(
    isVisible ? 'active' : 'idle'
  );
  const prevVisibleRef = useRef(isVisible);
  const cachedPrayerNameRef = useRef(prayerName);
  const cachedIqamahTimeRef = useRef(iqamahTime);

  if (prayerName) {
    cachedPrayerNameRef.current = prayerName;
    cachedIqamahTimeRef.current = iqamahTime;
  }

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

  if (!isMounted || !displayPrayer) return null;

  const animClass =
    animState === 'entering'
      ? resolveSilenceAnimationClass('incoming', transition)
      : animState === 'exiting'
      ? resolveSilenceAnimationClass('outgoing', transition)
      : 'opacity-100 transform-none';

  return (
    <div
      data-testid="prayer-dnd-overlay"
      className={`absolute top-24 inset-x-0 bottom-0 z-40 bg-black flex flex-col items-center justify-center text-center px-12 pointer-events-none transform-gpu overflow-hidden ${animClass}`}
    >
      <div className="max-w-3xl space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
          <VolumeX className="w-10 h-10" aria-hidden="true" />
        </div>
        <h2 className="text-5xl font-extrabold text-white tracking-tight">
          {displayPrayer} Prayer in Progress
        </h2>
        <p className="text-2xl text-neutral-300 font-medium leading-relaxed">
          Please switch mobile phones to silent and straighten the rows
        </p>
        {displayIqamah && (
          <p className="text-lg font-mono text-emerald-300/90 tabular-nums">
            Iqamah • {format12h(displayIqamah)}
          </p>
        )}
      </div>
    </div>
  );
}

