'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, EyeOff } from 'lucide-react';

export const PRAYER_DISCLAIMER_PERMANENT_KEY = 'ms_prayer_disclaimer_dismissed_permanent';
export const PRAYER_DISCLAIMER_SESSION_KEY = 'ms_prayer_disclaimer_dismissed_session';
export const PRAYER_DISCLAIMER_EVENT = 'ms-prayer-disclaimer-dismissed';

export function isPrayerDisclaimerDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const permanent = localStorage.getItem(PRAYER_DISCLAIMER_PERMANENT_KEY);
    if (permanent === 'true') return true;
    const session = sessionStorage.getItem(PRAYER_DISCLAIMER_SESSION_KEY);
    return session === 'true';
  } catch {
    return false;
  }
}

export function dismissPrayerDisclaimer(permanent: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (permanent) {
      localStorage.setItem(PRAYER_DISCLAIMER_PERMANENT_KEY, 'true');
    } else {
      sessionStorage.setItem(PRAYER_DISCLAIMER_SESSION_KEY, 'true');
    }
  } catch {}
  window.dispatchEvent(new CustomEvent(PRAYER_DISCLAIMER_EVENT));
}

export function resetPrayerDisclaimer(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PRAYER_DISCLAIMER_PERMANENT_KEY);
    sessionStorage.removeItem(PRAYER_DISCLAIMER_SESSION_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent(PRAYER_DISCLAIMER_EVENT));
}

export interface PrayerCalculationDisclaimerProps {
  readonly className?: string;
  readonly compact?: boolean;
}

export function PrayerCalculationDisclaimer({ className = '', compact = false }: PrayerCalculationDisclaimerProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(true);

  useEffect(() => {
    setIsDismissed(isPrayerDisclaimerDismissed());

    const handleSync = () => {
      setIsDismissed(isPrayerDisclaimerDismissed());
    };

    const handleBetaReset = () => {
      resetPrayerDisclaimer();
      setIsDismissed(false);
    };

    window.addEventListener(PRAYER_DISCLAIMER_EVENT, handleSync);
    window.addEventListener('ms-beta-reset', handleBetaReset);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(PRAYER_DISCLAIMER_EVENT, handleSync);
      window.removeEventListener('ms-beta-reset', handleBetaReset);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  if (isDismissed) return null;

  return (
    <aside
      role="region"
      aria-label="Prayer Calculation Advisory"
      className={`rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 transition-all shadow-sm ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-xs font-bold text-amber-950 dark:text-amber-300 tracking-wide flex items-center space-x-1.5">
            <span>Prayer Timetable &amp; Calculation Advisory</span>
          </h4>
          <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            Astronomical calculations and automated timetable algorithms provided by this appliance are assistive
            reference tools designed to guide your mosque or venue. Local prayer times, twilight angles, and lunar
            calendars vary by juristic consensus, geographic horizon, and daylight observations. Verification and final
            religious approval of all published prayer and Iqamah schedules remain the sole responsibility of the venue
            administration and local religious authority. You can adjust calculation methods, twilight angles, and
            minute buffers anytime in{' '}
            <a
              href="/admin?tab=settings&sub=astronomy"
              className="underline font-semibold hover:text-amber-950 dark:hover:text-white"
            >
              Settings &rarr; Calculation &amp; Hijri Calendar
            </a>
            .
          </p>

          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-amber-300/60 dark:border-amber-500/20">
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 italic font-medium">
              I understand that automated calculations are advisory.
            </p>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => dismissPrayerDisclaimer(false)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-amber-400/80 dark:border-amber-500/40 bg-amber-100/80 hover:bg-amber-200/90 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-950 dark:text-amber-200 dark:hover:text-white transition cursor-pointer flex items-center space-x-1"
                aria-label="Dismiss disclaimer for current session"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Dismiss (This Session)</span>
              </button>
              <button
                type="button"
                onClick={() => dismissPrayerDisclaimer(true)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-600 dark:border-amber-500/60 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500/30 dark:hover:bg-amber-500/45 text-white dark:text-amber-100 dark:hover:text-white transition cursor-pointer flex items-center space-x-1 shadow-sm"
                aria-label="Do not show disclaimer again"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Do Not Show Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
