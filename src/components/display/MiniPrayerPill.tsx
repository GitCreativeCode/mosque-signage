'use client';

import React from 'react';
import type { MiniPillState, SidebarAccentTheme, MiniPrayerPillPosition } from '@/types/index';
import { Clock } from 'lucide-react';
import { getAccentTheme } from '@/lib/utils/accent-theme';

export interface MiniPrayerPillProps {
  readonly pillState: MiniPillState | null;
  readonly isVisible: boolean;
  readonly accentTheme?: SidebarAccentTheme | undefined;
  readonly position?: MiniPrayerPillPosition | undefined;
}

/**
 * Formats a 24h 'HH:mm' string to friendly 12h display (e.g. '4:45 PM')
 */
export function format12h(time24: string): string {
  const parts = time24.split(':');
  const h = Number(parts[0] ?? '0');
  const m = parts[1] ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

/**
 * Formats countdown duration adhering to requirements:
 * - >= 60m: shows hours and minutes (e.g. 'in 1h 45m')
 * - < 1h and >= 60s: shows minutes (e.g. 'in 45m')
 * - < 60s (1m left): shows seconds (e.g. 'in 42s')
 */
export function formatRemainingTime(secondsRemaining?: number, minutesRemaining: number = 0): string {
  const totalSeconds = typeof secondsRemaining === 'number'
    ? Math.max(0, secondsRemaining)
    : Math.max(0, minutesRemaining * 60);

  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  }

  if (totalSeconds >= 60) {
    const mins = Math.ceil(totalSeconds / 60);
    return `in ${mins}m`;
  }

  const sec = Math.max(1, totalSeconds);
  return `in ${sec}s`;
}

function getPillPositionClass(pos: MiniPrayerPillPosition = 'bottom-right'): string {
  switch (pos) {
    case 'bottom-left':
      return 'bottom-8 left-8';
    case 'top-right':
      return 'top-28 right-8';
    case 'top-left':
      return 'top-28 left-8';
    case 'bottom-right':
    default:
      return 'bottom-8 right-8';
  }
}

/**
 * Floating Mini Prayer Telemetry Pill
 * Displays upcoming prayer countdown or calm breathing 'Prayer in Progress' alert.
 * Autonomously hides with GPU slide transition when Prayer Drawer opens.
 */
export function MiniPrayerPill({
  pillState,
  isVisible,
  accentTheme = 'teal',
  position = 'bottom-right',
}: MiniPrayerPillProps) {
  if (!pillState) {
    return null;
  }

  const theme = getAccentTheme(accentTheme);
  const isStartingNow = pillState.status === 'STARTING_NOW';
  const countdownText = formatRemainingTime(
    pillState.seconds_remaining,
    pillState.minutes_remaining
  );

  const positionClass = getPillPositionClass(position);
  const isTop = position === 'top-right' || position === 'top-left';
  const hiddenTranslate = isTop ? '-translate-y-8' : 'translate-y-8';

  return (
    <div
      suppressHydrationWarning
      className={`absolute ${positionClass} z-30 transition-[transform,opacity] duration-500 ease-out transform-gpu pointer-events-none ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : `${hiddenTranslate} opacity-0 scale-95`
      }`}
    >
      {isStartingNow ? (
        /* In Progress State: Dignified Calm Card with Breathing Status Indicator */
        <div className="flex items-center space-x-3.5 bg-neutral-900/95 border border-white/20 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-md text-white">
          <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: theme.dotColor, animationDuration: '3s' }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3 shadow-sm"
              style={{ backgroundColor: theme.dotColor }}
            />
          </span>
          <div className="flex items-center space-x-2 text-lg font-bold">
            <span className="text-white tracking-wide">
              {pillState.prayer_name} Prayer in Progress
            </span>
          </div>
        </div>
      ) : (
        /* Normal State: High-Contrast Solid Badge */
        <div className="flex items-center space-x-3.5 bg-neutral-900 border border-white/20 px-6 py-3.5 rounded-full shadow-xl text-white">
          <Clock className={`w-5 h-5 ${theme.textAccent} shrink-0`} />
          <div className="flex items-center space-x-2 text-lg font-bold" suppressHydrationWarning>
            <span className="text-neutral-300">Next:</span>
            <span className={theme.textAccent}>{pillState.prayer_name}</span>
            <span className="text-neutral-400 font-normal tabular-nums" suppressHydrationWarning>
              ({format12h(pillState.time_display)})
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-white font-extrabold tracking-wide tabular-nums" suppressHydrationWarning>
              {countdownText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
