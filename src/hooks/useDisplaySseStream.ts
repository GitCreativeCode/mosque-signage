'use client';

import { useEffect, useRef } from 'react';

export interface UseDisplaySseStreamOptions {
  readonly onPostersUpdated: () => void;
  readonly onSettingsUpdated: () => void;
  readonly onPrayersUpdated: () => void;
  readonly onReconnect: () => void;
  readonly onConnectionChange: (connected: boolean) => void;
}

export function useDisplaySseStream({
  onPostersUpdated,
  onSettingsUpdated,
  onPrayersUpdated,
  onReconnect,
  onConnectionChange,
}: UseDisplaySseStreamOptions): void {
  const reconnectDelayRef = useRef<number>(1000);
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (typeof window === 'undefined' || isCancelled) return;
      eventSource = new EventSource('/api/sse/display');

      eventSource.onopen = () => {
        onConnectionChange(true);
        reconnectDelayRef.current = 1000;
        if (isInitialMountRef.current) isInitialMountRef.current = false;
        else onReconnect();
      };

      eventSource.addEventListener('handshake', () => onConnectionChange(true));
      eventSource.addEventListener('POSTERS_UPDATED', () => { if (!isCancelled) onPostersUpdated(); });
      eventSource.addEventListener('SETTINGS_UPDATED', () => { if (!isCancelled) onSettingsUpdated(); });
      eventSource.addEventListener('PRAYERS_UPDATED', () => { if (!isCancelled) onPrayersUpdated(); });
      eventSource.addEventListener('RELOAD_DISPLAY', () => window.location.reload());
      eventSource.addEventListener('TOGGLE_SIMULATOR', () => window.dispatchEvent(new CustomEvent('kiosk:toggle-simulator')));
      eventSource.addEventListener('TEST_DRAWER', (e: MessageEvent) => {
        let durationSeconds = 15;
        try {
          const parsed = JSON.parse(e.data) as { durationSeconds?: number };
          if (parsed?.durationSeconds) durationSeconds = parsed.durationSeconds;
        } catch {
          // ignore malformed payload
        }
        window.dispatchEvent(new CustomEvent('kiosk:test-drawer', { detail: { durationSeconds } }));
      });
      eventSource.addEventListener('POWER_STATE_CHANGED', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data) as { state?: 'ON' | 'STANDBY' };
          if (parsed?.state === 'ON' || parsed?.state === 'STANDBY') {
            window.dispatchEvent(
              new CustomEvent('kiosk:power-state-changed', { detail: { state: parsed.state } })
            );
          }
        } catch {
          // ignore malformed payload
        }
      });

      eventSource.onerror = () => {
        onConnectionChange(false);
        eventSource?.close();
        if (isCancelled) return;
        const delay = reconnectDelayRef.current;
        const jitter = Math.floor(Math.random() * 1000);
        reconnectDelayRef.current = Math.min(delay * 2, 30000);
        reconnectTimer = setTimeout(connect, delay + jitter);
      };
    };

    connect();
    return () => {
      isCancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [onPostersUpdated, onSettingsUpdated, onPrayersUpdated, onReconnect, onConnectionChange]);
}

