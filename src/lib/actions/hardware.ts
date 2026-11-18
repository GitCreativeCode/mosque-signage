'use server';

import { dispatchAudioReceiverCommand } from '@/lib/hardware/audio-driver';
import {
  dispatchTvPowerCommand,
  isValidPowerAction,
  isValidTvControlProtocol,
} from '@/lib/hardware/display-driver';
import { eventBus } from '@/lib/events/event-bus';
import type { AudioReceiverConfig, HardwareCommandResult, TvControlProtocol } from '@/types/index';
import { requireAdminAuth } from './auth';
import { getVenueSettings } from './settings';

function buildAudioConfig(settings: Awaited<ReturnType<typeof getVenueSettings>>): AudioReceiverConfig {
  return {
    audio_mute_during_prayer: Boolean(settings.audio_mute_during_prayer),
    audio_receiver_host: settings.audio_receiver_host ?? '',
    audio_receiver_port: settings.audio_receiver_port ?? 23,
    audio_receiver_protocol: settings.audio_receiver_protocol ?? 'denon_telnet',
    audio_mute_delay_seconds: settings.audio_mute_delay_seconds ?? 0,
  };
}

export async function triggerKioskReload(): Promise<void> {
  await requireAdminAuth();
  eventBus.emitEvent('RELOAD_DISPLAY', {
    timestamp: new Date().toISOString(),
    reason: 'Admin requested hard reload from Action Center',
  });
}

export async function triggerKioskTestDrawer(durationSeconds: number = 15): Promise<void> {
  await requireAdminAuth();
  eventBus.emitEvent('TEST_DRAWER', {
    timestamp: new Date().toISOString(),
    durationSeconds,
  });
}

export async function triggerKioskToggleSimulator(): Promise<void> {
  await requireAdminAuth();
  eventBus.emitEvent('TOGGLE_SIMULATOR', {
    timestamp: new Date().toISOString(),
  });
}

export async function testTvPowerAction(
  action: 'ON' | 'STANDBY',
  protocolOverride?: TvControlProtocol
): Promise<HardwareCommandResult> {
  await requireAdminAuth();
  if (!isValidPowerAction(action)) {
    return {
      success: false,
      method: 'software_blackout',
      message: 'Invalid power test action rejected.',
      timestamp: new Date().toISOString(),
    };
  }
  const settings = await getVenueSettings();
  const resolvedProtocol: TvControlProtocol = isValidTvControlProtocol(protocolOverride)
    ? protocolOverride
    : (settings.tv_control_protocol ?? 'software_blackout');
  return dispatchTvPowerCommand(action, resolvedProtocol, { isManualTest: true });
}

export async function testAudioReceiverAction(
  action: 'MUTE' | 'UNMUTE'
): Promise<{ success: boolean; message: string }> {
  await requireAdminAuth();
  const settings = await getVenueSettings();
  return dispatchAudioReceiverCommand(buildAudioConfig(settings), action, 'Manual Test');
}

export async function triggerPrayerSilenceAudioMute(
  action: 'MUTE' | 'UNMUTE',
  prayerName?: string
): Promise<{ success: boolean; message: string }> {
  await requireAdminAuth();
  const settings = await getVenueSettings();
  if (!settings.audio_mute_during_prayer) {
    return { success: true, message: 'Audio muting during prayer is disabled.' };
  }

  const { scheduleFailSafeUnmute, clearFailSafeWatchdog } = await import('@/lib/hardware/audio-coordinator');
  const config = { ...buildAudioConfig(settings), audio_mute_during_prayer: true };

  if (action === 'MUTE') {
    const durationMinutes = settings.prayer_starting_now_duration_minutes ?? 10;
    scheduleFailSafeUnmute((durationMinutes + 2) * 60 * 1000, config, prayerName);
  } else {
    clearFailSafeWatchdog();
  }

  return dispatchAudioReceiverCommand(config, action, prayerName);
}

