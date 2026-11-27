import { describe, it, expect } from 'vitest';
import { calculateDailySchedule } from '@/lib/prayer/prayer-engine';
import { resolveJummahShifts } from '@/lib/engine/jummah-resolver';
import { computeDisplaySnapshot } from '@/lib/engine/display-snapshot';
import { buildSettingsUpdatePatch, mapSettingsRowToDomain } from '@/lib/db/settings-mapper';
import {
  validateNewShiftChronology,
  validateEditedShiftChronology,
} from '@/lib/prayer/jummah-validation';
import { validateTaraweehSessions } from '@/lib/prayer/taraweeh-validation';
import { getHijriDateParts } from '@/lib/prayer/hijri';
import {
  normalizeNightPrayerSession,
  resolveRamadanVisibility,
  validateRamadanDisplayStartDate,
} from '@/lib/prayer/ramadan-visibility';
import { loadPrayerSilenceState } from '@/lib/db/prayer-monitor-loader';
import { minutesToTime, subtractMinutesFromTime } from '@/lib/utils/time';
import { getFaqItemBySlug, FAQ_ITEMS } from '@/lib/faq/faq-data';
import { searchFaqItems } from '@/lib/faq/faq-search';
import type { EidShift, JummahShift, PrayerTimesToday, Settings } from '@/types/index';
import type { DbJummahShiftRecord } from '@/lib/actions/jummah';

describe('Prayer & Jummah Overhaul Suite', () => {
  describe('Time Utilities (minutesToTime & subtractMinutesFromTime)', () => {
    it('converts total minutes from midnight to HH:mm string correctly', () => {
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(330)).toBe('05:30');
      expect(minutesToTime(780)).toBe('13:00');
      expect(minutesToTime(1439)).toBe('23:59');
      // Wrapping across 1440
      expect(minutesToTime(1445)).toBe('00:05');
      expect(minutesToTime(-10)).toBe('23:50');
    });

    it('subtracts minutes from time string correctly for Suhoor buffer calculations', () => {
      expect(subtractMinutesFromTime('05:15', 10)).toBe('05:05');
      expect(subtractMinutesFromTime('05:00', 15)).toBe('04:45');
      expect(subtractMinutesFromTime('00:05', 10)).toBe('23:55');
      expect(subtractMinutesFromTime(null, 10)).toBe('--:--');
    });
  });

  describe('Smart Solar Drift Clamping', () => {
    const coords = { latitude: 43.589, longitude: -79.6441 };
    const timezone = 'America/Toronto';
    const testDate = new Date('2026-10-17T12:00:00Z');

    it('clamps Iqamah to Adhan + 5 min when fixed Iqamah rule is earlier than or within 5 min of Adhan', () => {
      // Create a fixed rule where Asr Iqamah is set to 15:00, but astronomical Asr Adhan is around 16:15
      const rules = [
        {
          id: 'rule-asr',
          prayer: 'asr' as const,
          rule_type: 'FIXED' as const,
          fixed_time: '15:00', // Unrealistic early fixed time before Adhan
        },
      ];

      const schedule = calculateDailySchedule(coords, testDate, [], { timezone, rules });
      // Astronomical Asr Adhan is ~16:15, so Iqamah must be clamped to Adhan + 5 min
      expect(schedule.asr.is_clamped).toBe(true);
      const adhanMins =
        parseInt(schedule.asr.adhan_time.split(':')[0]!, 10) * 60 +
        parseInt(schedule.asr.adhan_time.split(':')[1]!, 10);
      const iqamahMins =
        parseInt(schedule.asr.iqamah_time.split(':')[0]!, 10) * 60 +
        parseInt(schedule.asr.iqamah_time.split(':')[1]!, 10);
      expect(iqamahMins).toBe(adhanMins + 5);
    });

    it('does not clamp Iqamah when it is safely 15 minutes after Adhan', () => {
      const overrides = [
        {
          id: 'ov-maghrib',
          date: '2026-10-17',
          prayer: 'maghrib' as const,
          iqamah_time: '20:30', // Safely after sunset/Adhan
        },
      ];

      const schedule = calculateDailySchedule(coords, testDate, overrides, { timezone });
      expect(schedule.maghrib.iqamah_time).toBe('20:30');
      expect(schedule.maghrib.is_clamped).toBe(false);
    });
  });

  describe('High Latitude Calculation Rule Integration', () => {
    it('accepts highLatitudeRule options without throwing', () => {
      const highLatCoords = { latitude: 60.1699, longitude: 24.9384 }; // Helsinki, Finland
      const summerDate = new Date('2026-06-21T12:00:00Z');

      const methods = ['seventh_of_night', 'middle_of_night', 'twilight_angle'] as const;
      for (const rule of methods) {
        const schedule = calculateDailySchedule(highLatCoords, summerDate, [], {
          timezone: 'Europe/Helsinki',
          highLatitudeRule: rule,
        });
        expect(schedule.fajr.adhan_time).toMatch(/^\d{2}:\d{2}$/);
        expect(schedule.isha.adhan_time).toMatch(/^\d{2}:\d{2}$/);
      }
    });
  });

  describe('Friday Jummah Multi-Shift Validation & Turnover Buffers', () => {
    const existingShifts: readonly DbJummahShiftRecord[] = [
      {
        id: 'shift-1',
        shift_number: 1,
        adhan_time: '12:30',
        iqamah_time: '12:50',
        khateeb_name: 'Sheikh Ahmad',
        status: 'UPCOMING',
      },
    ];

    it('rejects a second shift starting before shift 1 concludes plus 10m turnover buffer', () => {
      // Shift 1 Salah is at 12:50. Prayer takes ~10m (concludes ~13:00) = earliest start 13:00.
      const error = validateNewShiftChronology(existingShifts, '12:55', '13:15');
      expect(error).not.toBeNull();
      expect(error).toContain('turnover buffer');
    });

    it('accepts a second shift starting at or after the required turnover time', () => {
      const error = validateNewShiftChronology(existingShifts, '13:10', '13:30');
      expect(error).toBeNull();
    });

    it('validates edited shift chronology and enforces turnover buffer', () => {
      const shifts: readonly DbJummahShiftRecord[] = [
        { id: '1', shift_number: 1, adhan_time: '12:15', iqamah_time: '12:35', status: 'UPCOMING' },
        { id: '2', shift_number: 2, adhan_time: '13:15', iqamah_time: '13:35', status: 'UPCOMING' },
      ];

      // Moving shift 2 to 12:40 violates Shift 1 conclusion (12:35 + 10m prayer = 12:45)
      const err = validateEditedShiftChronology(shifts, 1, '12:40', '13:00');
      expect(err).not.toBeNull();
      expect(err).toContain('turnover buffer');
    });
  });

  describe('Friday Khutbah Silence & Reverence State Transitions', () => {
    const shifts: readonly JummahShift[] = [
      {
        shift_number: 1,
        adhan_time: '12:30',
        iqamah_time: '12:50',
        khateeb_name: 'Imam Zaid',
        status: 'UPCOMING',
      },
    ];
    const timezone = 'America/Toronto';

    it('detects KHUTBAH_IN_PROGRESS when current time is during sermon delivery', () => {
      // 12:35 PM is between Khutbah (12:30) and Salah (12:50)
      const sermonTime = new Date('2026-10-16T12:35:00-04:00');
      const resolved = resolveJummahShifts(shifts, sermonTime, timezone);

      expect(resolved[0]?.status).toBe('KHUTBAH_IN_PROGRESS');
      expect(resolved[0]?.minutes_remaining).toBe(15); // 15 mins until Salah at 12:50
    });

    it('detects STARTING_NOW when Salah time arrives', () => {
      // 12:50 PM is exact Salah time
      const salahTime = new Date('2026-10-16T12:50:00-04:00');
      const resolved = resolveJummahShifts(shifts, salahTime, timezone);

      expect(resolved[0]?.status).toBe('STARTING_NOW');
      expect(resolved[0]?.minutes_remaining).toBe(0);
    });

    it('marks shift COMPLETED after prayer concludes and silence window passes', () => {
      // 13:10 PM is 20 minutes after Salah
      const afterSalahTime = new Date('2026-10-16T13:10:00-04:00');
      const resolved = resolveJummahShifts(shifts, afterSalahTime, timezone);

      expect(resolved[0]?.status).toBe('COMPLETED');
    });
  });

  describe('Eid Multi-Shift Date Activation, Auto-Hide Grace Timer & Eid-on-Friday Handoff', () => {
    const baseSettings: Settings = {
      mosque_name: 'Test Masjid',
      ticker_text: 'Eid Mubarak',
      timezone: 'America/Toronto',
      hijri_offset_days: 0,
      drawer_interval_minutes: 3,
      drawer_display_seconds: 12,
      prayer_starting_now_duration_minutes: 10,
      active_eid_type: 'eid_ul_fitr',
      active_eid_date: '2026-03-20', // Friday!
      eid_auto_hide_minutes: 60,
    };

    const prayers: PrayerTimesToday = {
      fajr: { adhan_time: '05:45', iqamah_time: '06:05' },
      sunrise: { adhan_time: '07:10', iqamah_time: '07:10' },
      dhuhr: { adhan_time: '13:20', iqamah_time: '13:35' },
      asr: { adhan_time: '16:40', iqamah_time: '17:00' },
      maghrib: { adhan_time: '19:30', iqamah_time: '19:35' },
      isha: { adhan_time: '20:50', iqamah_time: '21:05' },
    };

    const eidShifts: readonly EidShift[] = [
      {
        id: 'eid-1',
        eid_type: 'eid_ul_fitr',
        shift_number: 1,
        takbeerat_time: '07:30',
        salah_time: '08:00',
        khateeb_name: 'Imam Tariq',
        location: null,
        is_active: true,
      },
      {
        id: 'eid-2',
        eid_type: 'eid_ul_fitr',
        shift_number: 2,
        takbeerat_time: '08:45',
        salah_time: '09:15',
        khateeb_name: 'Imam Zaid',
        location: null,
        is_active: true,
      },
    ];

    const jummahShifts: readonly JummahShift[] = [
      {
        shift_number: 1,
        adhan_time: '13:15',
        iqamah_time: '13:35',
        khateeb_name: 'Imam Zaid',
        status: 'UPCOMING',
      },
    ];

    it('shows EID drawer on Eid morning before final Salah + grace period, with Eid Salah telemetry', () => {
      // 7:50 AM on Friday 2026-03-20 (10 mins before Shift 1 at 08:00)
      const morning = new Date('2026-03-20T07:50:00-04:00');
      const snap = computeDisplaySnapshot(baseSettings, [], prayers, jummahShifts, 0, morning, morning, {
        forceDrawerOpen: true,
        eidShifts,
      });

      expect(snap.drawer_type).toBe('EID');
      expect(snap.next_prayer?.prayer_name).toBe('Eid Salah 1');
      expect(snap.next_prayer?.status).toBe('COUNTDOWN');
    });

    it('triggers STARTING_NOW silence state during Eid Salah', () => {
      // 08:05 AM during Shift 1 Salah (08:00 + 10m silence window)
      const duringSalah = new Date('2026-03-20T08:05:00-04:00');
      const snap = computeDisplaySnapshot(baseSettings, [], prayers, jummahShifts, 0, duringSalah, duringSalah, {
        forceDrawerOpen: true,
        eidShifts,
      });

      expect(snap.drawer_type).toBe('EID');
      expect(snap.next_prayer?.prayer_name).toBe('Eid');
      expect(snap.next_prayer?.status).toBe('STARTING_NOW');
    });

    it('automatically hands off to JUMMAH drawer once final Eid Salah + grace period expires on Friday', () => {
      // Last shift is 09:15 + 60m grace = expires at 10:15. At 10:20 AM it hands off to JUMMAH!
      const afterGrace = new Date('2026-03-20T10:20:00-04:00');
      const snap = computeDisplaySnapshot(baseSettings, [], prayers, jummahShifts, 0, afterGrace, afterGrace, {
        forceDrawerOpen: true,
        eidShifts,
      });

      expect(snap.drawer_type).toBe('JUMMAH');
      expect(snap.next_prayer?.prayer_name).toBe('Khutbah 1');
    });

    it('allows simulator preview via forceEid regardless of date mismatch', () => {
      const regularDay = new Date('2026-10-15T14:00:00-04:00');
      const snap = computeDisplaySnapshot(baseSettings, [], prayers, jummahShifts, 0, regularDay, regularDay, {
        forceDrawerOpen: true,
        eidShifts,
        forceEid: true,
      });

      expect(snap.drawer_type).toBe('EID');
    });
  });

  describe('Ramadan Multi-Session Taraweeh & Witr Serialization', () => {
    it('serializes and parses multi-session Taraweeh arrays cleanly', () => {
      const sessions = [
        {
          session_number: 1,
          label: 'Family Early',
          time_mode: 'OFFSET' as const,
          offset_minutes: 0,
          fixed_time: '21:30',
          rakats: '8' as const,
          witr_mode: '2+1' as const,
        },
        {
          session_number: 2,
          label: 'Late Khatm',
          time_mode: 'FIXED' as const,
          offset_minutes: 0,
          fixed_time: '23:30',
          rakats: '12' as const,
          witr_mode: 'continuous_3' as const,
        },
      ];

      const patch = buildSettingsUpdatePatch({ ramadan_taraweeh_sessions: sessions }, '2026-11-25T00:00:00.000Z');
      expect(typeof patch.ramadan_taraweeh_sessions).toBe('string');

      const mapped = mapSettingsRowToDomain({
        id: 'global',
        mosque_name: 'Test',
        header_greeting: 'Welcome',
        ticker_text: 'Salam',
        timezone: 'America/Toronto',
        hijri_offset_days: 0,
        drawer_interval_minutes: 3,
        drawer_display_seconds: 12,
        prayer_starting_now_duration_minutes: 10,
        show_adhan_times: true,
        date_format: 'both',
        poster_transition: 'fade',
        poster_fit: 'cover',
        display_resolution: '1080p',
        sidebar_mode: 'drawer',
        sidebar_position: 'right',
        sidebar_accent_theme: 'teal',
        qr_entrance_delay_seconds: 3,
        show_qr_during_drawer: false,
        show_mini_prayer_pill: false,
        show_prayer_silence_overlay: false,
        silence_screen_subtitle: 'Silent',
        silence_screen_accent_theme: 'green',
        mini_prayer_pill_position: 'bottom-right',
        show_progress_bar: true,
        poster_view_mode: 'grid',
        overscan_margin_percent: 0,
        clock_show_seconds: false,
        clock_time_format: '12h',
        latitude: null,
        longitude: null,
        calculation_method: 'NorthAmerica',
        madhab: 'shafi',
        fajr_adhan_offset_minutes: 0,
        sunrise_adhan_offset_minutes: 0,
        dhuhr_adhan_offset_minutes: 0,
        asr_adhan_offset_minutes: 0,
        maghrib_adhan_offset_minutes: 0,
        isha_adhan_offset_minutes: 0,
        admin_pin_hash: null,
        admin_pin_salt: null,
        auth_mode: 'pin',
        admin_username: 'admin',
        admin_password_hash: null,
        admin_password_salt: null,
        session_version: 1,
        tv_auto_power: false,
        power_on_time: '05:00',
        power_off_time: '23:00',
        power_schedule_mode: 'fixed',
        power_fajr_offset_minutes: 45,
        power_isha_offset_minutes: 45,
        tv_control_protocol: 'software_blackout',
        standby_appearance: 'dim_clock',
        standby_show_attribution: false,
        audio_mute_during_prayer: false,
        audio_receiver_host: '',
        audio_receiver_port: 23,
        audio_receiver_protocol: 'denon_telnet',
        audio_mute_delay_seconds: 0,
        display_access_mode: 'open',
        display_allow_localhost: true,
        display_session_version: 1,
        initial_setup_completed: true,
        terms_accepted: true,
        terms_accepted_at: null,
        high_latitude_rule: 'seventh_of_night',
        ramadan_mode_enabled: true,
        ramadan_display_start_date: null,
        ramadan_taraweeh_time: null,
        ramadan_taraweeh_rakats: '20',
        ramadan_taraweeh_sessions: patch.ramadan_taraweeh_sessions as string,
        ramadan_suhoor_buffer_minutes: 10,
        ramadan_silence_during_taraweeh: true,
        active_eid_type: 'none',
        active_eid_date: null,
        eid_auto_hide_minutes: 60,
        eid_friday_note: null,
        updated_at: '2026-11-25T00:00:00.000Z',
      });

      expect(mapped.ramadan_taraweeh_sessions).toHaveLength(2);
      expect(mapped.ramadan_taraweeh_sessions?.[1]?.witr_mode).toBe('continuous_3');
      expect(mapped.ramadan_taraweeh_sessions?.[1]?.fixed_time).toBe('23:30');
    });
  });

  describe('Prayer & Jummah Schedule FAQ Guide Indexing', () => {
    it('indexes prayer-and-jummah-schedule-guide in FAQ repository', () => {
      const item = getFaqItemBySlug('prayer-and-jummah-schedule-guide');
      expect(item).toBeDefined();
      expect(item?.slug).toBe('prayer-and-jummah-schedule-guide');
      expect(item?.categoryId).toBe('prayer');
      expect(item?.article.title).toContain('Prayer & Jummah Schedule');
      expect(item?.article.sections.length).toBeGreaterThanOrEqual(5);
    });

    it('returns prayer guide when searching for liturgical keywords', () => {
      const results = searchFaqItems('clamping ramadan jummah', FAQ_ITEMS);
      const found = results.some((r) => r.item.slug === 'prayer-and-jummah-schedule-guide');
      expect(found).toBe(true);
    });
  });

  describe('Taraweeh & Qiyam Night-Window Chronological Validation', () => {
    it('accepts multi-session schedules wrapping past midnight (Isha 20:15 -> Taraweeh 21:00 -> Qiyam 02:30 before Fajr 05:30)', () => {
      const error = validateTaraweehSessions(
        [
          {
            session_number: 1,
            label: 'Early Taraweeh',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '21:00',
            rakats: '8',
            witr_mode: 'none',
          },
          {
            session_number: 2,
            label: 'Khatm',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '23:30',
            rakats: '12',
            witr_mode: '2+1',
          },
          {
            session_number: 3,
            label: 'Qiyam',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '02:30',
            rakats: 'Qiyam',
            witr_mode: 'none',
          },
        ],
        '20:15',
        '05:30'
      );
      expect(error).toBeNull();
    });

    it('rejects a session starting before Isha Iqamah or during daytime hours', () => {
      const beforeIsha = validateTaraweehSessions(
        [
          {
            session_number: 1,
            label: '',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '19:45',
            rakats: '20',
            witr_mode: '2+1',
          },
        ],
        '20:15',
        '05:30'
      );
      expect(beforeIsha).toContain('before Isha');

      const daytime = validateTaraweehSessions(
        [
          {
            session_number: 1,
            label: '',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '14:00',
            rakats: '20',
            witr_mode: '2+1',
          },
        ],
        '20:15',
        '05:30'
      );
      expect(daytime).toContain('outside the night prayer window');
    });

    it('rejects consecutive sessions that start at or before the previous session across midnight', () => {
      const outOfOrder = validateTaraweehSessions(
        [
          {
            session_number: 1,
            label: 'Late',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '02:30',
            rakats: 'Qiyam',
            witr_mode: 'none',
          },
          {
            session_number: 2,
            label: 'Earlier',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '23:30',
            rakats: '12',
            witr_mode: '2+1',
          },
        ],
        '20:15',
        '05:30'
      );
      expect(outOfOrder).toContain('cannot start at or before Session 1');
    });
  });

  describe('Congregation Silence Sync: Khutbah Fallback, Taraweeh & PA Audio Eid', () => {
    const basePrayers: PrayerTimesToday = {
      fajr: { adhan_time: '05:30', iqamah_time: '05:45' },
      sunrise: { adhan_time: '06:50', iqamah_time: '06:50' },
      dhuhr: { adhan_time: '13:10', iqamah_time: '13:30' },
      asr: { adhan_time: '16:30', iqamah_time: '16:45' },
      maghrib: { adhan_time: '19:15', iqamah_time: '19:20' },
      isha: { adhan_time: '20:00', iqamah_time: '20:15' },
    };

    const ramadanSettings = {
      id: 'global',
      mosque_name: 'Test Mosque',
      header_greeting: 'Welcome',
      ticker_text: 'Welcome',
      timezone: 'America/Toronto',
      hijri_offset_days: 0,
      drawer_interval_minutes: 3,
      drawer_display_seconds: 12,
      prayer_starting_now_duration_minutes: 10,
      show_adhan_times: true,
      date_format: 'both',
      poster_transition: 'fade',
      poster_fit: 'cover',
      display_resolution: '1080p',
      sidebar_mode: 'always_open',
      sidebar_position: 'right',
      sidebar_accent_theme: 'teal',
      qr_entrance_delay_seconds: 3,
      show_qr_during_drawer: true,
      show_mini_prayer_pill: true,
      show_prayer_silence_overlay: true,
      silence_screen_subtitle: 'Please switch mobile phones to silent',
      silence_screen_accent_theme: 'green',
      mini_prayer_pill_position: 'bottom-right',
      show_progress_bar: true,
      poster_view_mode: 'grid',
      overscan_margin_percent: 0,
      clock_show_seconds: false,
      clock_time_format: '12h',
      latitude: 43.589,
      longitude: -79.6441,
      calculation_method: 'NorthAmerica',
      madhab: 'shafi',
      fajr_adhan_offset_minutes: 0,
      sunrise_adhan_offset_minutes: 0,
      dhuhr_adhan_offset_minutes: 0,
      asr_adhan_offset_minutes: 0,
      maghrib_adhan_offset_minutes: 0,
      isha_adhan_offset_minutes: 0,
      tv_auto_power: false,
      power_on_time: '05:00',
      power_off_time: '23:00',
      power_schedule_mode: 'fixed',
      power_fajr_offset_minutes: 45,
      power_isha_offset_minutes: 45,
      tv_control_protocol: 'software_blackout',
      standby_appearance: 'dim_clock',
      standby_show_attribution: false,
      ramadan_mode_enabled: true,
      ramadan_silence_during_taraweeh: true,
      ramadan_taraweeh_sessions: [
        {
          session_number: 1,
          label: 'Taraweeh',
          time_mode: 'OFFSET',
          offset_minutes: 30,
          fixed_time: '21:30',
          rakats: '20',
          witr_mode: '2+1',
        },
        {
          session_number: 2,
          label: 'Qiyam / Tahajjud',
          time_mode: 'FIXED',
          offset_minutes: 0,
          fixed_time: '02:30',
          rakats: 'Qiyam',
          witr_mode: 'none',
        },
      ],
      ramadan_suhoor_buffer_minutes: 10,
      active_eid_type: 'none',
      active_eid_date: null,
      eid_auto_hide_minutes: 60,
      eid_friday_note: null,
      updated_at: '2026-11-25T00:00:00.000Z',
    } as Settings;

    it('holds Khutbah without separate Salah time in STARTING_NOW for at least 25 minutes', () => {
      const noSalahShift: JummahShift[] = [
        {
          shift_number: 1,
          adhan_time: '13:00',
          iqamah_time: null,
          khateeb_name: 'Imam Tariq',
          status: 'UPCOMING',
        },
      ];
      const at20MinsIn = new Date('2026-10-16T13:20:00-04:00');
      const resolved = resolveJummahShifts(noSalahShift, at20MinsIn, 'America/Toronto', 10);
      expect(resolved[0]?.status).toBe('STARTING_NOW');

      const at26MinsIn = new Date('2026-10-16T13:26:00-04:00');
      const done = resolveJummahShifts(noSalahShift, at26MinsIn, 'America/Toronto', 10);
      expect(done[0]?.status).toBe('COMPLETED');
    });

    it('triggers Taraweeh and post-midnight Qiyam silence windows across full session duration when global Silence is ON and suppresses when OFF', () => {
      const configuredSettings: Settings = {
        ...ramadanSettings,
        ramadan_taraweeh_sessions: [
          {
            session_number: 1,
            prayer_type: 'taraweeh',
            label: 'Taraweeh',
            time_mode: 'OFFSET',
            offset_minutes: 30,
            fixed_time: '21:30',
            rakats: '20',
            witr_mode: '2+1',
            duration_minutes: 60,
          },
          {
            session_number: 2,
            prayer_type: 'qiyam',
            label: 'Qiyam / Tahajjud',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '04:45',
            rakats: '8',
            witr_mode: 'none',
            duration_minutes: 90, // Should clamp cleanly at 05:30 Fajr!
          },
        ],
      };

      // Offset +30m after 20:15 Isha -> 20:45 start with 60m duration -> still STARTING_NOW 45 mins later (21:30)!
      const midHourTaraweeh = new Date('2026-03-10T21:30:00-04:00');
      const snapTaraweeh = computeDisplaySnapshot(
        configuredSettings,
        [],
        basePrayers,
        [],
        0,
        midHourTaraweeh,
        midHourTaraweeh
      );
      expect(snapTaraweeh.ramadan_visibility?.showNightPrayers).toBe(true);
      expect(snapTaraweeh.ramadan_visibility?.showFastingMarkers).toBe(true);
      expect(snapTaraweeh.next_prayer?.prayer_name).toBe('Taraweeh');
      expect(snapTaraweeh.next_prayer?.status).toBe('STARTING_NOW');
      expect(snapTaraweeh.next_prayer?.time_display).toBe('20:45');

      // After 60m finishes (21:46) -> returns to Fajr COUNTDOWN
      const afterTaraweeh = new Date('2026-03-10T21:46:00-04:00');
      const snapAfter = computeDisplaySnapshot(configuredSettings, [], basePrayers, [], 0, afterTaraweeh, afterTaraweeh);
      expect(snapAfter.next_prayer?.status).toBe('COUNTDOWN');
      expect(snapAfter.next_prayer?.prayer_name).toBe('Fajr');

      // Qiyam at 05:10 AM (inside 04:45..05:30 before Fajr 05:30) -> STARTING_NOW
      const duringQiyam = new Date('2026-03-11T05:10:00-04:00');
      const snapQiyam = computeDisplaySnapshot(configuredSettings, [], basePrayers, [], 0, duringQiyam, duringQiyam);
      expect(snapQiyam.next_prayer?.prayer_name).toBe('Qiyam / Tahajjud');
      expect(snapQiyam.next_prayer?.status).toBe('STARTING_NOW');

      // Clamped at Fajr Adhan (05:30) -> stops cleanly so Fajr countdown/Iqamah takes over!
      const atFajrAdhan = new Date('2026-03-11T05:31:00-04:00');
      const snapFajr = computeDisplaySnapshot(configuredSettings, [], basePrayers, [], 0, atFajrAdhan, atFajrAdhan);
      expect(snapFajr.next_prayer?.prayer_name).toBe('Fajr');
      expect(snapFajr.next_prayer?.status).toBe('COUNTDOWN');

      // When Global show_prayer_silence_overlay is OFF, Taraweeh never hijacks COUNTDOWN even if seasonal checkbox is true
      const globalOff = computeDisplaySnapshot(
        { ...configuredSettings, show_prayer_silence_overlay: false },
        [],
        basePrayers,
        [],
        0,
        midHourTaraweeh,
        midHourTaraweeh
      );
      expect(globalOff.next_prayer?.prayer_name).toBe('Fajr');
      expect(globalOff.next_prayer?.status).toBe('COUNTDOWN');

      // When Seasonal opt-out checkbox is OFF (Lobby TVs), Silence does not trigger for Taraweeh/Qiyam
      const snapDisabled = computeDisplaySnapshot(
        { ...configuredSettings, ramadan_silence_during_taraweeh: false },
        [],
        basePrayers,
        [],
        0,
        duringQiyam,
        duringQiyam
      );
      expect(snapDisabled.next_prayer?.prayer_name).toBe('Fajr');
      expect(snapDisabled.next_prayer?.status).toBe('COUNTDOWN');
    });

    it('syncs server PA audio silence monitor with Eid Salah shifts without muting Friday sermons', () => {
      const mockDbRow = {
        id: 'global',
        mosque_name: 'Test',
        header_greeting: 'Welcome',
        ticker_text: 'Salam',
        timezone: 'America/Toronto',
        hijri_offset_days: 0,
        drawer_interval_minutes: 3,
        drawer_display_seconds: 12,
        prayer_starting_now_duration_minutes: 10,
        show_adhan_times: true,
        date_format: 'both',
        poster_transition: 'fade',
        poster_fit: 'cover',
        display_resolution: '1080p',
        sidebar_mode: 'drawer',
        sidebar_position: 'right',
        sidebar_accent_theme: 'teal',
        qr_entrance_delay_seconds: 3,
        show_qr_during_drawer: false,
        show_mini_prayer_pill: false,
        show_prayer_silence_overlay: true,
        silence_screen_subtitle: 'Silent',
        silence_screen_accent_theme: 'green',
        mini_prayer_pill_position: 'bottom-right',
        show_progress_bar: true,
        poster_view_mode: 'grid',
        overscan_margin_percent: 0,
        clock_show_seconds: false,
        clock_time_format: '12h',
        latitude: 43.589,
        longitude: -79.6441,
        calculation_method: 'NorthAmerica',
        madhab: 'shafi',
        fajr_adhan_offset_minutes: 0,
        sunrise_adhan_offset_minutes: 0,
        dhuhr_adhan_offset_minutes: 0,
        asr_adhan_offset_minutes: 0,
        maghrib_adhan_offset_minutes: 0,
        isha_adhan_offset_minutes: 0,
        admin_pin_hash: null,
        admin_pin_salt: null,
        auth_mode: 'pin',
        admin_username: 'admin',
        admin_password_hash: null,
        admin_password_salt: null,
        session_version: 1,
        tv_auto_power: false,
        power_on_time: '05:00',
        power_off_time: '23:00',
        power_schedule_mode: 'fixed',
        power_fajr_offset_minutes: 45,
        power_isha_offset_minutes: 45,
        tv_control_protocol: 'software_blackout',
        standby_appearance: 'dim_clock',
        standby_show_attribution: false,
        audio_mute_during_prayer: true,
        audio_receiver_host: '192.168.1.100',
        audio_receiver_port: 23,
        audio_receiver_protocol: 'denon_telnet',
        audio_mute_delay_seconds: 0,
        display_access_mode: 'open',
        display_allow_localhost: true,
        display_session_version: 1,
        initial_setup_completed: true,
        terms_accepted: true,
        terms_accepted_at: null,
        high_latitude_rule: 'seventh_of_night',
        ramadan_mode_enabled: false,
        ramadan_display_start_date: null,
        ramadan_taraweeh_time: null,
        ramadan_taraweeh_rakats: '20',
        ramadan_taraweeh_sessions: null,
        ramadan_suhoor_buffer_minutes: 10,
        ramadan_silence_during_taraweeh: true,
        active_eid_type: 'eid_ul_fitr',
        active_eid_date: '2026-03-20',
        eid_auto_hide_minutes: 60,
        eid_friday_note: null,
        updated_at: '2026-11-25T00:00:00.000Z',
      };

      const fakeSqlite = {
        prepare: (sql: string) => ({
          get: () => {
            if (sql.includes('FROM settings')) return mockDbRow;
            return undefined;
          },
          all: () => {
            if (sql.includes('FROM eid_shifts')) {
              return [
                {
                  id: 'eid-1',
                  eid_type: 'eid_ul_fitr',
                  shift_number: 1,
                  takbeerat_time: '07:30',
                  salah_time: '08:00',
                  is_active: true,
                },
              ];
            }
            if (sql.includes('FROM jummah_shifts')) {
              return [
                {
                  shift_number: 1,
                  adhan_time: '13:15',
                  iqamah_time: '13:45',
                  status: 'UPCOMING',
                },
              ];
            }
            return [];
          },
        }),
      };

      const duringEidSalah = loadPrayerSilenceState(fakeSqlite, new Date('2026-03-20T08:05:00-04:00'));
      expect(duringEidSalah?.isStartingNow).toBe(true);
      expect(duringEidSalah?.prayerName).toBe('Eid Salah');

      // During Friday Khutbah sermon (13:20 between 13:15 adhan & 13:45 salah): PA stays UNMUTED!
      const duringKhutbahSermon = loadPrayerSilenceState(fakeSqlite, new Date('2026-03-20T13:20:00-04:00'));
      expect(duringKhutbahSermon?.isStartingNow).toBe(false);
    });
  });

  describe('Ramadan Start Date, Hijri Window, Eid Exclusion & Missing Isha Guard', () => {
    it('validates Display Start Date within Hijri Sha\'ban / Ramadan and rejects Eid overlaps', () => {
      // Mid-January 2026 is Rajab 1447 -> rejected (before Sha'ban)
      const rajabErr = validateRamadanDisplayStartDate('2026-01-10');
      expect(rajabErr).toContain('Sha\'ban or Ramadan');

      // Early April 2026 is Shawwal 1447 -> rejected (after Ramadan)
      const shawwalErr = validateRamadanDisplayStartDate('2026-04-05');
      expect(shawwalErr).toContain('Sha\'ban or Ramadan');

      // Late Sha'ban 1447 (Feb 2026) -> accepted
      expect(validateRamadanDisplayStartDate('2026-02-10')).toBeNull();

      // Cannot start outside Sha'ban/Ramadan (even if matching 1 Shawwal) or on/after a configured Ramadan-month Eid date
      const shawwalEid = validateRamadanDisplayStartDate('2026-03-20', {
        activeEidType: 'eid_ul_fitr',
        activeEidDate: '2026-03-20',
      });
      expect(shawwalEid).toContain('Sha\'ban or Ramadan');

      const eidOverlap = validateRamadanDisplayStartDate('2026-03-19', {
        activeEidType: 'eid_ul_fitr',
        activeEidDate: '2026-03-18',
      });
      expect(eidOverlap).toContain('before Eid al-Fitr');
    });

    it('gates Night Prayers vs Fasting Markers cleanly across Sha\'ban, Ramadan, Eid Day, and Eid Eve', () => {
      const shabanPreview = getHijriDateParts(new Date('2026-02-12T12:00:00-05:00'), 0, 'America/Toronto');
      expect(shabanPreview.month).toBe(8); // Sha'ban

      const seasonalSettings = {
        timezone: 'America/Toronto',
        hijri_offset_days: 0,
        ramadan_mode_enabled: true,
        ramadan_display_start_date: '2026-02-10',
        active_eid_type: 'eid_ul_fitr',
        active_eid_date: '2026-03-20',
      } as Settings;

      // Before configured display start date in Sha'ban -> hidden
      const beforeStart = resolveRamadanVisibility(seasonalSettings, new Date('2026-02-05T12:00:00-05:00'), '17:30');
      expect(beforeStart.showNightPrayers).toBe(false);

      // In Sha'ban on/after start date -> show Night Prayers advance schedule, keep fasting markers off
      const inShaban = resolveRamadanVisibility(seasonalSettings, new Date('2026-02-12T12:00:00-05:00'), '17:35');
      expect(inShaban.showNightPrayers).toBe(true);
      expect(inShaban.showFastingMarkers).toBe(false);
      expect(inShaban.showTaraweehSilence).toBe(false);

      // In Ramadan -> all active
      const inRamadan = resolveRamadanVisibility(seasonalSettings, new Date('2026-03-10T12:00:00-04:00'), '19:10');
      expect(inRamadan.showNightPrayers).toBe(true);
      expect(inRamadan.showFastingMarkers).toBe(true);
      expect(inRamadan.showTaraweehSilence).toBe(true);

      // Eid al-Fitr Eve (2026-03-19): afternoon keeps fasting markers, evening post-Maghrib suppresses Ramadan/Taraweeh
      const eidEveDay = resolveRamadanVisibility(seasonalSettings, new Date('2026-03-19T14:00:00-04:00'), '19:15');
      expect(eidEveDay.showFastingMarkers).toBe(true);
      const eidEveNight = resolveRamadanVisibility(seasonalSettings, new Date('2026-03-19T19:30:00-04:00'), '19:15');
      expect(eidEveNight.showNightPrayers).toBe(false);
      expect(eidEveNight.showFastingMarkers).toBe(false);

      // On Active Eid Date itself (2026-03-20) -> suppressed all day
      const onEidDay = resolveRamadanVisibility(seasonalSettings, new Date('2026-03-20T20:00:00-04:00'), '19:16');
      expect(onEidDay.showNightPrayers).toBe(false);
      expect(onEidDay.showFastingMarkers).toBe(false);
    });

    it('rejects After-Isha offset sessions when Isha time is unset and normalizes Prayer Types cleanly', () => {
      const missingIshaError = validateTaraweehSessions(
        [
          {
            session_number: 1,
            prayer_type: 'taraweeh',
            time_mode: 'OFFSET',
            offset_minutes: 10,
            fixed_time: '21:30',
            rakats: '20',
            witr_mode: '2+1',
          },
        ],
        '--:--',
        '--:--'
      );
      expect(missingIshaError).toContain('Isha Iqamah time is not set yet');

      const legacyNormalized = normalizeNightPrayerSession({
        session_number: 2,
        time_mode: 'FIXED',
        offset_minutes: 0,
        fixed_time: '02:30',
        rakats: 'Qiyam',
        witr_mode: 'none',
      });
      expect(legacyNormalized.prayer_type).toBe('qiyam');
      expect(legacyNormalized.rakats).toBe('8');

      const tahajjudOk = validateTaraweehSessions(
        [
          {
            session_number: 1,
            prayer_type: 'taraweeh',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '21:00',
            rakats: '8',
            witr_mode: 'none',
          },
          {
            session_number: 2,
            prayer_type: 'tahajjud',
            time_mode: 'FIXED',
            offset_minutes: 0,
            fixed_time: '03:00',
            rakats: '4',
            witr_mode: '1',
          },
        ],
        '--:--',
        '--:--'
      );
      expect(tahajjudOk).toBeNull();
    });
  });
});
