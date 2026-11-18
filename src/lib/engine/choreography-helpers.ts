/**
 * Pure Choreography Helpers for Display Tick, Simulation Overrides & QR Visibility
 * MosqueSignage (TV)
 */

import type { Poster, PowerScheduleConfig, Settings } from '@/types/index';
import { parseTimeToDate } from '@/lib/prayer/prayer-engine';

export function buildPowerConfigFromSettings(settings: Settings): PowerScheduleConfig {
  return {
    tv_auto_power: Boolean(settings.tv_auto_power),
    power_schedule_mode: settings.power_schedule_mode ?? 'fixed',
    power_on_time: settings.power_on_time ?? '05:00',
    power_off_time: settings.power_off_time ?? '23:00',
    power_fajr_offset_minutes: settings.power_fajr_offset_minutes ?? -45,
    power_isha_offset_minutes: settings.power_isha_offset_minutes ?? 45,
  };
}

export function resolveSimulatedDate(
  baseDate: Date,
  timezone: string,
  timeOverrideMinutes: number | null,
  isFridayForced: boolean
): Date {
  let date = baseDate;
  if (timeOverrideMinutes !== null) {
    const h = Math.floor(timeOverrideMinutes / 60) % 24;
    const m = timeOverrideMinutes % 60;
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    date = parseTimeToDate(timeStr, date, timezone);
  }
  if (isFridayForced) {
    const diff = 5 - date.getDay();
    date = new Date(date);
    date.setDate(date.getDate() + diff);
  }
  return date;
}

export function posterContainsVideo(poster: Poster | null): boolean {
  if (!poster) return false;
  if (poster.media_type === 'video') return true;
  if (!poster.layout_config) return false;
  try {
    const parsed = JSON.parse(poster.layout_config);
    if (Array.isArray(parsed?.slots)) {
      return parsed.slots.some((slot: { type?: string }) => slot.type === 'video');
    }
  } catch {
    return false;
  }
  return false;
}

export function evaluateQrVisibilityOnTick(
  activePoster: Poster | null,
  activeCount: number,
  nextElapsed: number,
  dwellDuration: number,
  isAlwaysOpen: boolean,
  isDrawerOpen: boolean,
  settings: Settings,
  currentlyVisible: boolean = false
): boolean {
  if (!isAlwaysOpen && isDrawerOpen && !settings.show_qr_during_drawer) return false;
  if (!activePoster?.qr_url || activePoster.qr_url.trim().length === 0) return false;

  const entranceDelay = isAlwaysOpen ? 0 : Math.max(0, settings.qr_entrance_delay_seconds ?? 3);
  const isMultiSlide = activeCount > 1;

  if (!isMultiSlide) {
    return currentlyVisible || nextElapsed >= entranceDelay;
  }

  return nextElapsed >= entranceDelay && nextElapsed < dwellDuration - 1.5;
}
