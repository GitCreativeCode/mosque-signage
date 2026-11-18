'use client';

import React from 'react';
import { VolumeX } from 'lucide-react';
import { format12h } from './MiniPrayerPill';

export interface PrayerDndOverlayProps {
  readonly isVisible: boolean;
  readonly prayerName?: string | undefined;
  readonly iqamahTime?: string | undefined;
}

/**
 * Calm Do-Not-Disturb Reverence Overlay (ux_principles.md §3.3)
 * Active while a prayer Iqamah is in progress (STARTING_NOW).
 */
export function PrayerDndOverlay({
  isVisible,
  prayerName,
  iqamahTime,
}: PrayerDndOverlayProps) {
  if (!isVisible || !prayerName) return null;

  return (
    <div
      data-testid="prayer-dnd-overlay"
      className="absolute top-24 inset-x-0 bottom-0 z-35 bg-neutral-950/92 backdrop-blur-md flex flex-col items-center justify-center text-center px-12 transition-opacity duration-700 pointer-events-none"
    >
      <div className="max-w-3xl space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
          <VolumeX className="w-10 h-10" aria-hidden="true" />
        </div>
        <h2 className="text-5xl font-extrabold text-white tracking-tight">
          {prayerName} Prayer in Progress
        </h2>
        <p className="text-2xl text-neutral-300 font-medium leading-relaxed">
          Please switch mobile phones to silent and straighten the rows
        </p>
        {iqamahTime && (
          <p className="text-lg font-mono text-emerald-300/90 tabular-nums">
            Iqamah • {format12h(iqamahTime)}
          </p>
        )}
      </div>
    </div>
  );
}

