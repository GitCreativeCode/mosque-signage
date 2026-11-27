/**
 * Congregation Silence Screen Customization & Friday Dual-Phase Unit Tests
 * MosqueSignage (TV)
 */

import { describe, it, expect } from 'vitest';
import { computeDisplaySnapshot } from '@/lib/engine/display-snapshot';
import { mapSettingsRowToDomain } from '@/lib/db/settings-mapper';
import type { JummahShift, PrayerTimesToday, Settings } from '@/types/index';

const baseSettings: Settings = {
  mosque_name: 'Test Mosque',
  ticker_text: 'Ticker',
  timezone: 'America/Toronto',
  hijri_offset_days: 0,
  drawer_interval_minutes: 3,
  drawer_display_seconds: 12,
  prayer_starting_now_duration_minutes: 10,
  show_adhan_times: true,
  show_prayer_silence_overlay: true,
  silence_screen_subtitle: 'Please switch mobile phones to silent',
  silence_screen_accent_theme: 'green',
};

const mockPrayers: PrayerTimesToday = {
  fajr: { adhan_time: '05:00', iqamah_time: '05:20' },
  sunrise: { adhan_time: '06:30', iqamah_time: '06:30' },
  dhuhr: { adhan_time: '12:30', iqamah_time: '12:45' },
  asr: { adhan_time: '15:30', iqamah_time: '15:45' },
  maghrib: { adhan_time: '18:00', iqamah_time: '18:10' },
  isha: { adhan_time: '19:30', iqamah_time: '19:45' },
};

describe('Congregation Silence Screen & Friday Liturgical Telemetry', () => {
  it('differentiates Khutbah without Salah time from Jummah Prayer with Salah time during STARTING_NOW', () => {
    // Friday afternoon: 2026-10-16 is a Friday
    // Shift 1: Khutbah at 13:00, NO Salah time
    // Shift 2: Khutbah at 14:00, Salah at 14:30
    const shifts: JummahShift[] = [
      {
        shift_number: 1,
        khateeb_name: 'Imam A',
        adhan_time: '13:00',
        iqamah_time: '',
        status: 'UPCOMING',
      },
      {
        shift_number: 2,
        khateeb_name: 'Imam B',
        adhan_time: '14:00',
        iqamah_time: '14:30',
        status: 'UPCOMING',
      },
    ];

    // At 13:05 (Shift 1 Khutbah in progress, no salah time provided)
    // 13:05 EDT is 17:05 UTC
    const timeShift1 = new Date('2026-10-16T17:05:00.000Z');
    const snapshot1 = computeDisplaySnapshot(
      baseSettings,
      [],
      mockPrayers,
      shifts,
      0,
      new Date(timeShift1.getTime() - 600000),
      timeShift1
    );

    expect(snapshot1.next_prayer?.status).toBe('STARTING_NOW');
    // Without Salah time, prayer name is Khutbah 1
    expect(snapshot1.next_prayer?.prayer_name).toBe('Khutbah 1');

    // At 14:32 (Shift 2 Salah in progress, salah time 14:30 was provided)
    // 14:32 EDT is 18:32 UTC
    const timeShift2 = new Date('2026-10-16T18:32:00.000Z');
    const snapshot2 = computeDisplaySnapshot(
      baseSettings,
      [],
      mockPrayers,
      shifts,
      0,
      new Date(timeShift2.getTime() - 600000),
      timeShift2
    );

    expect(snapshot2.next_prayer?.status).toBe('STARTING_NOW');
    // With Salah time, prayer name is Jummah Prayer
    expect(snapshot2.next_prayer?.prayer_name).toBe('Jummah Prayer');
  });

  it('maps silence screen customization fields in settings mapper with resilient defaults', () => {
    const rawUndefined = mapSettingsRowToDomain(undefined);
    expect(rawUndefined.silence_screen_subtitle).toBe('Please switch mobile phones to silent');
    expect(rawUndefined.silence_screen_accent_theme).toBe('green');

    const rawCustom = mapSettingsRowToDomain({
      id: 'global',
      mosque_name: 'Custom',
      ticker_text: 'Ticker',
      timezone: 'America/New_York',
      silence_screen_subtitle: 'Custom reverence message',
      silence_screen_accent_theme: 'amber',
    } as any);

    expect(rawCustom.silence_screen_subtitle).toBe('Custom reverence message');
    expect(rawCustom.silence_screen_accent_theme).toBe('amber');
  });

  it('cleanly hides mini-pill (null next_prayer) for Friday-only venues after all Friday shifts complete', () => {
    const shifts: JummahShift[] = [
      {
        shift_number: 1,
        khateeb_name: 'Imam A',
        adhan_time: '13:00',
        iqamah_time: '13:30',
        status: 'COMPLETED',
      },
    ];

    const unconfiguredDailyPrayers: PrayerTimesToday = {
      fajr: { adhan_time: '--:--', iqamah_time: '--:--' },
      sunrise: { adhan_time: '--:--', iqamah_time: '--:--' },
      dhuhr: { adhan_time: '--:--', iqamah_time: '--:--' },
      asr: { adhan_time: '--:--', iqamah_time: '--:--' },
      maghrib: { adhan_time: '--:--', iqamah_time: '--:--' },
      isha: { adhan_time: '--:--', iqamah_time: '--:--' },
    };

    // 14:00 EDT (18:00 UTC) on Friday - 30 minutes after shift 1 Iqamah ended and silence ended
    const timeAfterAllShifts = new Date('2026-10-16T18:00:00.000Z');
    const fridayOnlySettings: Settings = {
      ...baseSettings,
      latitude: null,
      longitude: null,
    };

    const snapshot = computeDisplaySnapshot(
      fridayOnlySettings,
      [],
      unconfiguredDailyPrayers,
      shifts,
      0,
      new Date(timeAfterAllShifts.getTime() - 600000),
      timeAfterAllShifts
    );

    // Clean slide broadcast mode: next_prayer and mini_pill are null
    expect(snapshot.next_prayer).toBeNull();
    expect(snapshot.mini_pill).toBeNull();
  });
});
