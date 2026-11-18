'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PosterWithStatus, Settings } from '@/types/index';
import { broadcastSignageEvent, subscribeSignageBroadcast } from '@/lib/events/broadcast-channel';

export function useAdminLiveSync(
  initialSettings: Settings,
  initialPosters: readonly PosterWithStatus[],
  initialIsAuthenticated = true
) {
  const [posters, setPosters] = useState<PosterWithStatus[]>([...initialPosters]);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isHydrating, setIsHydrating] = useState(false);
  const [quickActionNotice, setQuickActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialIsAuthenticated) {
      setPosters([...initialPosters]);
      setIsHydrating(false);
    }
  }, [initialIsAuthenticated, initialPosters]);

  useEffect(() => {
    if (initialIsAuthenticated) {
      setSettings(initialSettings);
    }
  }, [initialIsAuthenticated, initialSettings]);

  const showNotice = useCallback((msg: string) => {
    setQuickActionNotice(msg);
    setTimeout(() => setQuickActionNotice(null), 3000);
  }, []);

  const refreshPosters = useCallback(async () => {
    try {
      const { getPostersWithStatus } = await import('@/lib/actions/posters');
      const updatedPosters = await getPostersWithStatus();
      setPosters(updatedPosters);
    } catch (err) {
      console.warn('[AdminDashboard] Failed to refresh posters:', err);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const { getVenueSettings } = await import('@/lib/actions/settings');
      setSettings(await getVenueSettings());
    } catch (err) {
      console.warn('[AdminDashboard] Failed to refresh settings:', err);
    }
  }, []);

  const hydrateAfterAuth = useCallback(async () => {
    setIsHydrating(true);
    try {
      await Promise.all([refreshPosters(), refreshSettings()]);
    } finally {
      setIsHydrating(false);
    }
  }, [refreshPosters, refreshSettings]);

  const clearPosters = useCallback(() => {
    setPosters([]);
  }, []);

  useEffect(() => {
    const unsubscribeBroadcast = subscribeSignageBroadcast((message) => {
      if (message.type === 'POSTERS_UPDATED') refreshPosters();
      else if (message.type === 'SETTINGS_UPDATED') refreshSettings();
    });

    let eventSource: EventSource | null = null;
    let sseRetryTimer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const connectSse = () => {
      if (isCancelled || typeof window === 'undefined') return;
      try {
        eventSource = new EventSource('/api/sse/display');
        eventSource.addEventListener('POSTERS_UPDATED', () => { if (!isCancelled) refreshPosters(); });
        eventSource.addEventListener('SETTINGS_UPDATED', () => { if (!isCancelled) refreshSettings(); });
        eventSource.onerror = () => {
          eventSource?.close();
          if (!isCancelled) sseRetryTimer = setTimeout(connectSse, 5000);
        };
      } catch (err) {
        console.warn('[AdminDashboard] SSE listener init warning:', err);
      }
    };

    connectSse();
    return () => {
      isCancelled = true;
      unsubscribeBroadcast();
      if (sseRetryTimer) clearTimeout(sseRetryTimer);
      eventSource?.close();
    };
  }, [refreshPosters, refreshSettings]);

  const handleQuickReload = async () => {
    try {
      const { triggerKioskReload } = await import('@/lib/actions/hardware');
      await triggerKioskReload();
      broadcastSignageEvent({ type: 'RELOAD_DISPLAY' });
      showNotice('Display Reloaded!');
    } catch {
      showNotice('Reload Failed');
    }
  };

  const handleQuickTestDrawer = async () => {
    try {
      const { triggerKioskTestDrawer } = await import('@/lib/actions/hardware');
      await triggerKioskTestDrawer(15);
      broadcastSignageEvent({ type: 'TEST_DRAWER', durationSeconds: 15 });
      showNotice('Test Drawer Sent!');
    } catch {
      showNotice('Test Failed');
    }
  };

  const handleQuickToggleSimulator = async () => {
    try {
      const { triggerKioskToggleSimulator } = await import('@/lib/actions/hardware');
      await triggerKioskToggleSimulator();
      broadcastSignageEvent({ type: 'TOGGLE_SIMULATOR' });
      showNotice('Display Simulator Toggled!');
    } catch {
      showNotice('Toggle Failed');
    }
  };

  return {
    posters, settings, isHydrating, quickActionNotice,
    refreshPosters, refreshSettings, hydrateAfterAuth, clearPosters,
    handleQuickReload, handleQuickTestDrawer, handleQuickToggleSimulator,
  };
}

