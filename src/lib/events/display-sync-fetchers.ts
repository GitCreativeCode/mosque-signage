/**
 * Client-Side Display Sync Live Fetchers (API + Server Action Fallbacks)
 * MosqueSignage (TV)
 */

import type { JummahShift, Poster, PrayerTimesToday, PublicDisplaySettings } from '@/types/index';

export interface FetchPostersLiveResult {
  readonly posters: readonly Poster[];
  readonly nextTransitionAt: string | null;
}

export async function fetchPostersLive(): Promise<FetchPostersLiveResult | null> {
  try {
    const res = await fetch('/api/posters', { cache: 'no-store' });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) {
        const nextTransitionAt = res.headers.get('X-Next-Transition-At');
        return { posters: data as Poster[], nextTransitionAt };
      }
    }
  } catch {
    // Fallback to Server Action below
  }

  try {
    const { getPublicActivePosters } = await import('@/lib/actions/posters');
    const { posters, nextTransitionAt } = await getPublicActivePosters();
    return { posters, nextTransitionAt: nextTransitionAt ?? null };
  } catch (err) {
    console.warn('[useDisplaySync] Failed to refresh posters:', err);
    return null;
  }
}

export async function fetchSettingsLive(): Promise<PublicDisplaySettings | null> {
  try {
    const { getPublicDisplaySettings } = await import('@/lib/actions/settings');
    return await getPublicDisplaySettings();
  } catch (err) {
    console.warn('[useDisplaySync] Failed to refresh settings:', err);
    return null;
  }
}

export async function fetchPrayersAndShiftsLive(): Promise<{
  prayers: PrayerTimesToday;
  jummahShifts: readonly JummahShift[];
  settings: PublicDisplaySettings;
} | null> {
  try {
    const { getPrayerOverrides, getPrayerRules, getAnnualScheduleForDate } = await import('@/lib/actions/prayers');
    const { getJummahShifts } = await import('@/lib/actions/jummah');
    const { getPublicDisplaySettings } = await import('@/lib/actions/settings');
    const { calculateDailySchedule } = await import('@/lib/prayer/prayer-engine');

    const currentSettings = await getPublicDisplaySettings();
    const today = new Date();
    const todayIsoDate = new Intl.DateTimeFormat('en-CA', { timeZone: currentSettings.timezone }).format(today);

    const [overrides, shifts, rules, annualSchedule] = await Promise.all([
      getPrayerOverrides(todayIsoDate),
      getJummahShifts(),
      getPrayerRules(),
      getAnnualScheduleForDate(todayIsoDate),
    ]);
    const prayers = calculateDailySchedule(
      { latitude: currentSettings.latitude ?? null, longitude: currentSettings.longitude ?? null },
      today,
      overrides,
      {
        timezone: currentSettings.timezone,
        method: currentSettings.calculation_method,
        madhab: currentSettings.madhab ?? 'shafi',
        rules,
        annualSchedule: annualSchedule ?? undefined,
        adhanOffsets: {
          fajr: currentSettings.fajr_adhan_offset_minutes ?? 0,
          sunrise: currentSettings.sunrise_adhan_offset_minutes ?? 0,
          dhuhr: currentSettings.dhuhr_adhan_offset_minutes ?? 0,
          asr: currentSettings.asr_adhan_offset_minutes ?? 0,
          maghrib: currentSettings.maghrib_adhan_offset_minutes ?? 0,
          isha: currentSettings.isha_adhan_offset_minutes ?? 0,
        },
      }
    );
    return { prayers, jummahShifts: shifts, settings: currentSettings };
  } catch (err) {
    console.warn('[useDisplaySync] Failed to refresh prayer times:', err);
    return null;
  }
}

export function getLocalDateKey(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0] ?? '';
  }
}

