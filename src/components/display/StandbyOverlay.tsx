'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Clock } from 'lucide-react';
import type { StandbyAppearance } from '@/types/index';

export interface StandbyOverlayProps {
  readonly isStandby: boolean;
  readonly appearance?: StandbyAppearance | undefined;
  readonly showAttribution?: boolean | undefined;
  readonly clockTime?: string | undefined;
  readonly nextPrayerName?: string | undefined;
  readonly nextPrayerTime?: string | undefined;
  readonly onForceWake?: (() => void) | undefined;
}

/**
 * StandbyOverlay Component
 * Renders an ultra-low-power, OLED-pitch-black (#000000) canvas when the kiosk display
 * is within its configured power-off standby schedule.
 *
 * Features:
 * - Appearance choice: Dim Clock with next prayer OR 100% Total Pure Black (Zero Light)
 * - Optional attribution watermark ("Powered by MosqueSignage", opt-in)
 * - Periodic 5-minute burn-in protection pixel-shifting (-6px to +6px)
 * - Interactive temporary wake gesture (click/key) with 60-second countdown and user feedback
 */
export function StandbyOverlay({
  isStandby,
  appearance = 'dim_clock',
  showAttribution = false,
  clockTime = '00:00',
  nextPrayerName,
  nextPrayerTime,
  onForceWake,
}: StandbyOverlayProps) {
  const [isTemporarilyAwake, setIsTemporarilyAwake] = useState(false);
  const [snoozeSecondsLeft, setSnoozeSecondsLeft] = useState(60);
  const [pixelShift, setPixelShift] = useState({ x: 0, y: 0 });

  // Burn-in protection: shift position subtly every 5 minutes
  useEffect(() => {
    if (!isStandby || appearance === 'pure_black') return;

    const shiftTimer = setInterval(() => {
      const offsetX = Math.floor(Math.random() * 13) - 6; // -6px to +6px
      const offsetY = Math.floor(Math.random() * 13) - 6;
      setPixelShift({ x: offsetX, y: offsetY });
    }, 300000); // 5 minutes

    return () => clearInterval(shiftTimer);
  }, [isStandby, appearance]);

  // Temporary wake countdown ticker
  useEffect(() => {
    if (!isTemporarilyAwake) return;

    const ticker = setInterval(() => {
      setSnoozeSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTemporarilyAwake(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [isTemporarilyAwake]);

  const handleWakeInteraction = useCallback(() => {
    if (!isStandby) return;
    setIsTemporarilyAwake(true);
    setSnoozeSecondsLeft(60);
    onForceWake?.();
  }, [isStandby, onForceWake]);

  // Global listeners for physical keyboard or tap interaction to wake
  useEffect(() => {
    if (!isStandby) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTemporarilyAwake(false);
      } else {
        handleWakeInteraction();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isStandby, handleWakeInteraction]);

  if (!isStandby) {
    return null;
  }

  // If temporarily awake, show a floating control banner over the normal display
  if (isTemporarilyAwake) {
    return (
      <aside
        role="status"
        aria-label="Temporary screen wake active"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-neutral-900/90 text-white border border-neutral-700/80 backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl flex items-center space-x-3 text-xs animate-in fade-in slide-in-from-top-4 duration-300"
      >
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <span className="font-medium text-neutral-200">
          Temporary Wake: Screen returning to standby in{' '}
          <strong className="text-amber-300 font-mono font-bold">{snoozeSecondsLeft}s</strong>
        </span>
        <button
          type="button"
          onClick={() => setIsTemporarilyAwake(false)}
          className="ml-2 px-2.5 py-1 text-[11px] font-bold rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-600 transition cursor-pointer flex items-center space-x-1"
        >
          <Moon className="w-3 h-3 text-neutral-400" />
          <span>Sleep Now</span>
        </button>
      </aside>
    );
  }

  // Active Standby: OLED pure black canvas
  return (
    <section
      role="region"
      aria-label="Display screen low power standby"
      onClick={handleWakeInteraction}
      className="fixed inset-0 z-[9999] bg-black text-neutral-500 select-none cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000"
      style={{
        backgroundColor: '#000000',
        transform: appearance === 'pure_black' ? undefined : `translate(${pixelShift.x}px, ${pixelShift.y}px)`,
      }}
    >
      {appearance === 'dim_clock' && (
        <div className="flex flex-col items-center space-y-4 opacity-15 hover:opacity-40 transition-opacity duration-500">
          <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-neutral-600">
            <Moon className="w-3.5 h-3.5 text-neutral-500" />
            <span>Standby Power Mode</span>
          </div>

          <div className="text-7xl font-light font-mono tracking-tighter text-neutral-400">
            {clockTime}
          </div>

          {nextPrayerName && (
            <div className="flex items-center space-x-2 text-xs text-neutral-500 border border-neutral-900 rounded-full px-3 py-1">
              <Clock className="w-3 h-3 text-neutral-600" />
              <span>
                Next: <strong className="text-neutral-400 font-medium">{nextPrayerName}</strong>{' '}
                {nextPrayerTime ? `at ${nextPrayerTime}` : ''}
              </span>
            </div>
          )}

          <div className="pt-8 text-[11px] text-neutral-700 tracking-wide">
            Tap or press any key to wake display screen
          </div>

          {showAttribution && (
            <div className="pt-2 flex items-center space-x-1.5 text-[10px] tracking-widest uppercase text-neutral-600">
              <Moon className="w-3 h-3 text-neutral-600" />
              <span>Powered by MosqueSignage</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
