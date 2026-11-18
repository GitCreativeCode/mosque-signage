'use client';

import { useEffect, useRef } from 'react';

/**
 * Screen Wake Lock Hook
 * Prevents the digital signage display screen and connected televisions from sleeping
 * or triggering operating system screensavers during 24/7 continuous presentation.
 * Automatically re-acquires the sentinel lock if window visibility is restored.
 */
export function useScreenWakeLock(): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let isActive = true;

    async function requestWakeLock() {
      if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
        return;
      }

      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      try {
        if (sentinelRef.current && !sentinelRef.current.released) {
          return;
        }

        const sentinel = await navigator.wakeLock.request('screen');
        if (!isActive) {
          sentinel.release().catch(() => {});
          return;
        }

        sentinelRef.current = sentinel;
        sentinel.addEventListener('release', () => {
          sentinelRef.current = null;
        });
      } catch (err) {
        // Suppress expected NotAllowedError if page is in a background tab or not focused
        if (err instanceof Error && err.name === 'NotAllowedError') {
          return;
        }
        console.warn('Screen WakeLock request failed or unsupported:', err);
      }
    }

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, []);
}

