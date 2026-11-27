'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Settings, PublicDisplaySettings, Poster, PrayerTimesToday, JummahShift, EidShift } from '@/types/index';
import { subscribeSignageBroadcast } from '@/lib/events/broadcast-channel';
import {
  fetchPostersLive,
  fetchPrayersAndShiftsLive,
  fetchSettingsLive,
  getLocalDateKey,
} from '@/lib/events/display-sync-fetchers';
import { useDisplaySseStream } from './useDisplaySseStream';

export interface UseDisplaySyncParams {
  readonly initialSettings: PublicDisplaySettings | Settings;
  readonly initialPosters: readonly Poster[];
  readonly initialPrayers: PrayerTimesToday;
  readonly initialJummahShifts: readonly JummahShift[];
  readonly initialEidShifts?: readonly EidShift[] | undefined;
}

export interface UseDisplaySyncResult {
  readonly settings: PublicDisplaySettings | Settings;
  readonly posters: readonly Poster[];
  readonly prayers: PrayerTimesToday;
  readonly jummahShifts: readonly JummahShift[];
  readonly eidShifts: readonly EidShift[];
  readonly isConnected: boolean;
}

export function useDisplaySync({
  initialSettings,
  initialPosters,
  initialPrayers,
  initialJummahShifts,
  initialEidShifts = [],
}: UseDisplaySyncParams): UseDisplaySyncResult {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [posters, setPosters] = useState<readonly Poster[]>(initialPosters);
  const [prayers, setPrayers] = useState<PrayerTimesToday>(initialPrayers);
  const [jummahShifts, setJummahShifts] = useState<readonly JummahShift[]>(initialJummahShifts);
  const [eidShifts, setEidShifts] = useState<readonly EidShift[]>(initialEidShifts);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshPostersLive = useCallback(async (): Promise<boolean> => {
    const updated = await fetchPostersLive();
    if (!updated) return false;
    setPosters(updated.posters);

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (updated.nextTransitionAt) {
      const delayMs = Math.max(1000, new Date(updated.nextTransitionAt).getTime() - Date.now() + 500);
      if (delayMs < 86400000 * 2) {
        transitionTimerRef.current = setTimeout(() => {
          refreshPostersLive();
        }, delayMs);
      }
    }

    return true;
  }, []);

  const refreshSettingsLive = useCallback(async (): Promise<boolean> => {
    const updated = await fetchSettingsLive();
    if (!updated) return false;
    setSettings(updated);

    // If display protection is active, verify this kiosk session remains authorized
    if (updated.display_access_mode === 'pairing_required') {
      try {
        const res = await fetch('/api/display/status', { cache: 'no-store' });
        if (res.ok) {
          const status = (await res.json()) as { authorized?: boolean };
          if (status.authorized === false && typeof window !== 'undefined') {
            window.location.reload();
            return true;
          }
        }
      } catch {
        // Retain current view on transient network issue
      }
    }
    return true;
  }, []);

  const refreshPrayersLive = useCallback(async (): Promise<boolean> => {
    const updated = await fetchPrayersAndShiftsLive();
    if (!updated) return false;
    setJummahShifts(updated.jummahShifts);
    setEidShifts(updated.eidShifts);
    setSettings(updated.settings);
    setPrayers(updated.prayers);
    return true;
  }, []);

  const reconcileAll = useCallback(async (): Promise<boolean> => {
    const [okPosters, okSettings, okPrayers] = await Promise.all([
      refreshPostersLive(),
      refreshSettingsLive(),
      refreshPrayersLive(),
    ]);
    return okPosters && okSettings && okPrayers;
  }, [refreshPostersLive, refreshSettingsLive, refreshPrayersLive]);

  useEffect(() => {
    let isCancelled = false;
    let lastDateKey = getLocalDateKey(settings.timezone);

    const midnightWatcher = setInterval(async () => {
      const currentDateKey = getLocalDateKey(settings.timezone);
      if (currentDateKey !== lastDateKey && !isCancelled) {
        const synced = await reconcileAll();
        if (synced && !isCancelled) {
          lastDateKey = currentDateKey;
        }
      }
    }, 10000);

    return () => {
      isCancelled = true;
      clearInterval(midnightWatcher);
    };
  }, [settings.timezone, reconcileAll]);

  useEffect(() => {
    return subscribeSignageBroadcast((message) => {
      if (message.type === 'POSTERS_UPDATED') refreshPostersLive();
      else if (message.type === 'SETTINGS_UPDATED') refreshSettingsLive();
      else if (message.type === 'PRAYERS_UPDATED') refreshPrayersLive();
      else if (message.type === 'RELOAD_DISPLAY' && typeof window !== 'undefined') window.location.reload();
      else if (message.type === 'TOGGLE_SIMULATOR' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kiosk:toggle-simulator'));
      } else if (message.type === 'TEST_DRAWER' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kiosk:test-drawer', { detail: { durationSeconds: message.durationSeconds ?? 15 } }));
      } else if (
        message.type === 'POWER_STATE_CHANGED' &&
        (message.powerState === 'ON' || message.powerState === 'STANDBY') &&
        typeof window !== 'undefined'
      ) {
        window.dispatchEvent(new CustomEvent('kiosk:power-state-changed', { detail: { state: message.powerState } }));
      }
    });
  }, [refreshPostersLive, refreshSettingsLive, refreshPrayersLive]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, []);

  useDisplaySseStream({
    onPostersUpdated: refreshPostersLive,
    onSettingsUpdated: refreshSettingsLive,
    onPrayersUpdated: refreshPrayersLive,
    onReconnect: reconcileAll,
    onConnectionChange: setIsConnected,
  });

  return { settings, posters, prayers, jummahShifts, eidShifts, isConnected };
}
