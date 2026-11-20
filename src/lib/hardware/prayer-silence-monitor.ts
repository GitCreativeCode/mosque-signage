/**
 * Autonomous Server-Side Prayer Silence Audio Monitor
 * MosqueSignage (TV)
 *
 * Polls pre-loaded schedule state on the Node.js host so AV receiver muting and
 * unmuting never rely on unauthenticated client-browser Server Action calls.
 */

import type { AudioReceiverConfig } from '@/types/index';
import { dispatchAudioReceiverCommand } from './audio-driver';
import { clearFailSafeWatchdog, scheduleFailSafeUnmute } from './audio-coordinator';
import { isSystemClockSynchronized } from '@/lib/utils/time';

export interface PrayerSilenceSnapshot {
  readonly config: AudioReceiverConfig;
  readonly isStartingNow: boolean;
  readonly prayerName?: string | undefined;
  readonly durationMinutes: number;
}

export interface SilenceMonitorState {
  wasMutedForPrayer: boolean;
  lastPrayerName?: string | undefined;
}

/**
 * Evaluates a single tick transition and dispatches MUTE / UNMUTE commands with fail-safe watchdog.
 */
export async function evaluatePrayerSilenceTransition(
  snapshot: PrayerSilenceSnapshot | null,
  state: SilenceMonitorState,
  now: Date = new Date()
): Promise<void> {
  if (!snapshot) return;

  const { config, isStartingNow, prayerName, durationMinutes } = snapshot;
  const isEnabled = Boolean(config.audio_mute_during_prayer) && Boolean(config.audio_receiver_host?.trim());

  // Fail-safe protection against unsynchronized clocks (RTC battery death or offline 1970 reset)
  if (!isSystemClockSynchronized(now)) {
    if (state.wasMutedForPrayer) {
      state.wasMutedForPrayer = false;
      state.lastPrayerName = undefined;
      clearFailSafeWatchdog();
      if (config.audio_receiver_host?.trim()) {
        await dispatchAudioReceiverCommand(
          { ...config, audio_mute_during_prayer: true },
          'UNMUTE',
          'Clock-Skew-Recovery'
        );
      }
    }
    return;
  }

  if (isStartingNow && isEnabled && !state.wasMutedForPrayer) {
    state.wasMutedForPrayer = true;
    state.lastPrayerName = prayerName;
    const watchdogMs = (Math.max(1, durationMinutes) + 2) * 60 * 1000;
    scheduleFailSafeUnmute(watchdogMs, config, prayerName);
    await dispatchAudioReceiverCommand(config, 'MUTE', prayerName);
    return;
  }

  if ((!isStartingNow || !isEnabled) && state.wasMutedForPrayer) {
    const activePrayer = prayerName ?? state.lastPrayerName;
    state.wasMutedForPrayer = false;
    state.lastPrayerName = undefined;
    clearFailSafeWatchdog();
    if (config.audio_receiver_host?.trim()) {
      await dispatchAudioReceiverCommand({ ...config, audio_mute_during_prayer: true }, 'UNMUTE', activePrayer);
    }
  }
}

/**
 * Starts the background prayer-silence monitor loop on the server host.
 * Returns a cleanup handle to stop the interval.
 */
export function startPrayerSilenceMonitor(
  loadSnapshot: (now: Date) => PrayerSilenceSnapshot | null,
  intervalMs: number = 15_000
): () => void {
  const state: SilenceMonitorState = { wasMutedForPrayer: false };

  const runTick = async () => {
    try {
      const snapshot = loadSnapshot(new Date());
      await evaluatePrayerSilenceTransition(snapshot, state);
    } catch (err) {
      console.error('[audio-monitor] Failed to evaluate prayer silence transition:', err);
    }
  };

  const timer = setInterval(() => {
    void runTick();
  }, intervalMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  return () => clearInterval(timer);
}
