import type { AudioReceiverConfig, AudioReceiverProtocol } from '@/types/index';
import { dispatchAudioReceiverCommand } from './audio-driver';

let activeWatchdogTimer: NodeJS.Timeout | null = null;
let watchdogExpiryTimestamp: string | null = null;

export interface AudioSettingsRow {
  audio_mute_during_prayer?: number | boolean | null;
  audio_receiver_host?: string | null;
  audio_receiver_port?: number | null;
  audio_receiver_protocol?: string | null;
}

/**
 * Recovers audio receiver state on server boot by issuing a fail-safe UNMUTE.
 * If the appliance rebooted or crashed mid-prayer while the receiver was muted,
 * this guarantees hall audio is restored immediately.
 */
export async function recoverAudioReceiverOnBoot(
  driverOrGetter?:
    | { prepare: (sql: string) => { get: (...params: unknown[]) => unknown } }
    | (() => AudioSettingsRow | null | undefined)
): Promise<boolean> {
  try {
    let row: AudioSettingsRow | null | undefined = null;
    if (typeof driverOrGetter === 'function') {
      row = driverOrGetter();
    } else if (driverOrGetter && typeof driverOrGetter.prepare === 'function') {
      row = driverOrGetter
        .prepare(
          'SELECT audio_mute_during_prayer, audio_receiver_host, audio_receiver_port, audio_receiver_protocol FROM settings WHERE id = ?'
        )
        .get('global') as AudioSettingsRow | undefined;
    } else {
      try {
        const { sqlite } = await import('@/lib/db/client');
        row = sqlite
          .prepare(
            'SELECT audio_mute_during_prayer, audio_receiver_host, audio_receiver_port, audio_receiver_protocol FROM settings WHERE id = ?'
          )
          .get('global') as AudioSettingsRow | undefined;
      } catch {
        // In environments where client is not accessible
      }
    }

    if (
      row &&
      Boolean(row.audio_mute_during_prayer) &&
      row.audio_receiver_host &&
      row.audio_receiver_host.trim().length > 0
    ) {
      const config: AudioReceiverConfig = {
        audio_mute_during_prayer: true,
        audio_receiver_host: row.audio_receiver_host.trim(),
        audio_receiver_port: Number(row.audio_receiver_port) || 23,
        audio_receiver_protocol: (row.audio_receiver_protocol as AudioReceiverProtocol) || 'denon_telnet',
      };
      await dispatchAudioReceiverCommand(config, 'UNMUTE', 'Boot-Recovery');
      return true;
    }
  } catch (err) {
    console.error('Failed to recover audio receiver on boot:', err);
  }
  return false;
}

/**
 * Returns current status of the audio fail-safe watchdog.
 */
export function getWatchdogStatus(): {
  readonly isActive: boolean;
  readonly expiryTimestamp: string | null;
} {
  return {
    isActive: activeWatchdogTimer !== null,
    expiryTimestamp: watchdogExpiryTimestamp,
  };
}

/**
 * Clears any active fail-safe unmute watchdog timer.
 */
export function clearFailSafeWatchdog(): void {
  if (activeWatchdogTimer) {
    clearTimeout(activeWatchdogTimer);
    activeWatchdogTimer = null;
    watchdogExpiryTimestamp = null;
  }
}

/**
 * Arm a fail-safe watchdog unmute timer.
 * Guarantees that if the normal unmute trigger fails (network hiccup, browser crash, etc.),
 * the receiver will be automatically unmuted when the timeout expires.
 */
export function scheduleFailSafeUnmute(
  timeoutMs: number,
  config: AudioReceiverConfig,
  prayerName?: string | undefined
): void {
  clearFailSafeWatchdog();

  watchdogExpiryTimestamp = new Date(Date.now() + timeoutMs).toISOString();

  activeWatchdogTimer = setTimeout(async () => {
    try {
      await dispatchAudioReceiverCommand(config, 'UNMUTE', prayerName);
    } catch (err) {
      console.error('Watchdog failed to dispatch fail-safe unmute:', err);
    } finally {
      clearFailSafeWatchdog();
    }
  }, timeoutMs);

  // Unref so the timer doesn't keep node process alive during tests or shutdown
  if (typeof activeWatchdogTimer.unref === 'function') {
    activeWatchdogTimer.unref();
  }
}
