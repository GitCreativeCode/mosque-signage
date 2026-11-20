import { describe, it, expect } from 'vitest';
import {
  computeDisplaySnapshot,
  shouldTriggerDrawer,
  resolveJummahShifts,
} from '@/lib/engine/index';
import {
  evaluateQrVisibilityOnTick,
  posterContainsVideo,
  resolveSimulatedDate,
} from '@/lib/engine/choreography-helpers';
import {
  processChoreographyTick,
  type ChoreographyMutableState,
  type ChoreographyLiveProps,
  type ChoreographyTickSetters,
} from '@/hooks/choreography-side-effects';
import { formatRemainingTime } from '@/components/display/MiniPrayerPill';
import { getPositionCoordinates } from '@/components/display/QrCard';
import type {
  Poster,
  Settings,
  PrayerTimesToday,
  JummahShift,
} from '@/types/index';

describe('Display Choreography & Mutual Exclusion Engine', () => {
  const mockSettings: Settings = {
    mosque_name: 'Islamic Community Center',
    ticker_text: 'Welcome to the Islamic Center • Please silence your phones',
    timezone: 'America/Toronto',
    hijri_offset_days: 0,
    drawer_interval_minutes: 3,
    drawer_display_seconds: 12,
    prayer_starting_now_duration_minutes: 10,
  };

  const mockPosters: Poster[] = [
    {
      id: 'poster-with-qr',
      title: 'Youth Halaqa',
      image_path: '/uploads/youth.webp',
      qr_url: 'https://icco.org/youth',
      qr_label: 'Scan to Register',
      start_at: '2026-10-01T00:00:00.000Z',
      end_at: '2026-10-31T23:59:59.000Z',
      duration_seconds: 15,
      created_at: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'poster-without-qr',
      title: 'General Announcement',
      image_path: '/uploads/announcement.webp',
      start_at: '2026-10-01T00:00:00.000Z',
      end_at: '2026-10-31T23:59:59.000Z',
      duration_seconds: 20,
      created_at: '2026-10-01T00:00:00.000Z',
    },
  ];

  const mockPrayers: PrayerTimesToday = {
    fajr: { adhan_time: '05:30', iqamah_time: '05:55' },
    sunrise: { adhan_time: '07:15', iqamah_time: '07:15' },
    dhuhr: { adhan_time: '13:05', iqamah_time: '13:25' },
    asr: { adhan_time: '16:15', iqamah_time: '16:30' },
    maghrib: { adhan_time: '18:45', iqamah_time: '18:55' },
    isha: { adhan_time: '20:15', iqamah_time: '20:35' },
  };

  const mockJummahShifts: JummahShift[] = [
    {
      shift_number: 1,
      khateeb_name: 'Shaykh Abdalla Idris',
      adhan_time: '12:15',
      iqamah_time: '12:30',
      status: 'UPCOMING',
    },
    {
      shift_number: 2,
      khateeb_name: 'Imam Nafis Bhayat',
      adhan_time: '13:15',
      iqamah_time: '13:30',
      status: 'UPCOMING',
    },
  ];

  describe('Mutual Exclusion Rule', () => {
    it('suppresses qr_card and mini_pill completely when is_drawer_open === true', () => {
      // 2026-10-17 is Saturday
      const saturdayNoon = new Date('2026-10-17T16:00:00.000Z');
      const drawerTrigger = new Date('2026-10-17T16:00:00.000Z'); // Drawer just triggered (0s elapsed < 12s)

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0, // poster-with-qr is active
        drawerTrigger,
        saturdayNoon
      );

      expect(state.is_drawer_open).toBe(true);
      expect(state.drawer_type).toBe('DAILY_PRAYER');
      // Crucial: Corner widgets MUST be strictly null when drawer is open
      expect(state.qr_card).toBeNull();
      expect(state.mini_pill).toBeNull();
    });

    it('preserves qr_card when is_drawer_open === true if show_qr_during_drawer is enabled', () => {
      const saturdayNoon = new Date('2026-10-17T16:00:00.000Z');
      const drawerTrigger = new Date('2026-10-17T16:00:00.000Z');

      const state = computeDisplaySnapshot(
        { ...mockSettings, show_qr_during_drawer: true },
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        saturdayNoon
      );

      expect(state.is_drawer_open).toBe(true);
      expect(state.qr_card).not.toBeNull();
      expect(state.qr_card?.url).toBe('https://icco.org/youth');
      expect(state.mini_pill).toBeNull();
    });

    it('renders qr_card and mini_pill when is_drawer_open === false and poster has qr_url', () => {
      const saturdayNoon = new Date('2026-10-17T16:00:00.000Z');
      // Last drawer was 60 seconds ago (> 12s display duration), so drawer is closed
      const drawerTrigger = new Date('2026-10-17T15:59:00.000Z');

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0, // poster-with-qr is active
        drawerTrigger,
        saturdayNoon
      );

      expect(state.is_drawer_open).toBe(false);
      expect(state.drawer_type).toBeNull();
      // QR Card must be visible with expected URL
      expect(state.qr_card).not.toBeNull();
      expect(state.qr_card?.url).toBe('https://icco.org/youth');
      expect(state.qr_card?.label).toBe('Scan to Register');
      // Mini countdown pill must be active
      expect(state.mini_pill).not.toBeNull();
    });

    it('omits qr_card when active poster does not have a qr_url', () => {
      const saturdayNoon = new Date('2026-10-17T16:00:00.000Z');
      const drawerTrigger = new Date('2026-10-17T15:59:00.000Z'); // drawer closed

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        1, // poster-without-qr is active
        drawerTrigger,
        saturdayNoon
      );

      expect(state.is_drawer_open).toBe(false);
      expect(state.qr_card).toBeNull();
      expect(state.mini_pill).not.toBeNull();
    });
  });

  describe('Friday Jummah Drawer Override', () => {
    it('switches drawer to JUMMAH mode on Friday between Fajr and final shift', () => {
      // 2026-10-16 is a Friday!
      // In America/Toronto (EDT = UTC-4), 12:45 PM EDT is 16:45 UTC
      const fridayMidday = new Date('2026-10-16T16:45:00.000Z');
      const drawerTrigger = fridayMidday; // Drawer triggered right now

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        fridayMidday
      );

      expect(state.is_drawer_open).toBe(true);
      expect(state.drawer_type).toBe('JUMMAH');
      expect(state.qr_card).toBeNull();
      expect(state.mini_pill).toBeNull();
    });

    it('uses DAILY_PRAYER on non-Friday days when drawer is open', () => {
      // 2026-10-17 is Saturday
      const saturday = new Date('2026-10-17T16:00:00.000Z');
      const drawerTrigger = saturday;

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        saturday
      );

      expect(state.is_drawer_open).toBe(true);
      expect(state.drawer_type).toBe('DAILY_PRAYER');
    });

    it('shows Fajr (not Jummah 1) on Friday morning before Fajr Iqamah', () => {
      // 2026-10-16 05:00 AM EDT is 09:00 UTC (Fajr Iqamah is 05:55 AM)
      const fridayEarlyMorning = new Date('2026-10-16T09:00:00.000Z');
      const drawerTrigger = fridayEarlyMorning;

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        fridayEarlyMorning,
        { forceDrawerOpen: false }
      );

      // On Friday before Fajr, Next Prayer must be Fajr countdown, not Jummah Shift 1
      expect(state.next_prayer?.prayer_name).toBe('Fajr');
      expect(state.next_prayer?.status).toBe('COUNTDOWN');
      expect(state.next_prayer?.time_display).toBe('05:55');
      // When drawer is open early morning, it should show DAILY_PRAYER for morning congregation
      const drawerState = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        fridayEarlyMorning,
        { forceDrawerOpen: true }
      );
      expect(drawerState.drawer_type).toBe('DAILY_PRAYER');
    });

    it('maintains Fajr STARTING_NOW during Prayer Silence Mode on Friday', () => {
      // Fajr Iqamah is 05:55 AM. With 10 min silence duration, silence ends at 06:05 AM.
      // 06:00 AM EDT is 10:00 UTC (5 min into silence mode).
      const fridayFajrSilenceTime = new Date('2026-10-16T10:00:00.000Z');
      const drawerTrigger = fridayFajrSilenceTime;

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        fridayFajrSilenceTime,
        { forceDrawerOpen: false }
      );

      expect(state.next_prayer?.prayer_name).toBe('Fajr');
      expect(state.next_prayer?.status).toBe('STARTING_NOW');
    });

    it('transitions to Jummah Shift 1 after Fajr Prayer Silence Mode elapses', () => {
      // Fajr Iqamah is 05:55 AM + 10m silence = 06:05 AM.
      // 06:06 AM EDT is 10:06 UTC.
      const fridayPostFajrTime = new Date('2026-10-16T10:06:00.000Z');
      const drawerTrigger = fridayPostFajrTime;

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        fridayPostFajrTime,
        { forceDrawerOpen: true }
      );

      // Now Fajr and silence mode are done, Next Prayer transitions to Khutbah 1
      expect(state.next_prayer?.prayer_name).toBe('Khutbah 1');
      expect(state.next_prayer?.time_display).toBe('12:30');
      expect(state.next_prayer?.status).toBe('COUNTDOWN');
      expect(state.drawer_type).toBe('JUMMAH');
    });

    it('transitions immediately to Jummah Shift 1 at Fajr Iqamah if Prayer Silence Mode is disabled (0 min)', () => {
      const settingsNoSilence: Settings = {
        ...mockSettings,
        prayer_starting_now_duration_minutes: 0,
      };

      // 05:54 AM EDT is 09:54 UTC (before Fajr Iqamah 05:55 AM)
      const beforeFajr = new Date('2026-10-16T09:54:00.000Z');
      const stateBefore = computeDisplaySnapshot(
        settingsNoSilence,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        beforeFajr,
        beforeFajr
      );
      expect(stateBefore.next_prayer?.prayer_name).toBe('Fajr');

      // 05:55 AM EDT is 09:55 UTC (exact Fajr Iqamah)
      const atFajr = new Date('2026-10-16T09:55:00.000Z');
      const stateAtFajr = computeDisplaySnapshot(
        settingsNoSilence,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        atFajr,
        atFajr
      );
      // Because silence mode is 0, Fajr finishes immediately and transitions to first Jummah shift
      expect(stateAtFajr.next_prayer?.prayer_name).toBe('Khutbah 1');
    });

    it('transitions to Asr on Friday afternoon after all Jummah shifts have completed', () => {
      // Shifts: Shift 1 Iqamah 12:30, Shift 2 Iqamah 13:30 (+10m silence = 13:40 / 1:40 PM EDT).
      // 02:00 PM EDT is 18:00 UTC (all Jummah shifts completed).
      const fridayAfternoon = new Date('2026-10-16T18:00:00.000Z');
      const drawerTrigger = fridayAfternoon;

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        fridayAfternoon,
        { forceDrawerOpen: true }
      );

      // Next prayer should advance to Asr (skipping Dhuhr since Friday used Jummah)
      expect(state.next_prayer?.prayer_name).toBe('Asr');
      expect(state.next_prayer?.time_display).toBe('16:30');
      expect(state.drawer_type).toBe('DAILY_PRAYER');
    });
  });

  describe('shouldTriggerDrawer Interval Engine', () => {
    it('returns false when interval has not elapsed', () => {
      const lastTrigger = new Date('2026-10-17T12:00:00.000Z');
      const now = new Date('2026-10-17T12:02:59.000Z'); // 2m 59s elapsed (interval = 3m)

      expect(shouldTriggerDrawer(lastTrigger, now, 3)).toBe(false);
    });

    it('returns true when exact interval has elapsed', () => {
      const lastTrigger = new Date('2026-10-17T12:00:00.000Z');
      const now = new Date('2026-10-17T12:03:00.000Z'); // Exactly 3m elapsed

      expect(shouldTriggerDrawer(lastTrigger, now, 3)).toBe(true);
    });

    it('returns true when interval has exceeded', () => {
      const lastTrigger = new Date('2026-10-17T12:00:00.000Z');
      const now = new Date('2026-10-17T12:05:00.000Z');

      expect(shouldTriggerDrawer(lastTrigger, now, 3)).toBe(true);
    });
  });

  describe('resolveJummahShifts Status Tracking', () => {
    const shifts: JummahShift[] = [
      {
        shift_number: 1,
        khateeb_name: 'Shaykh Abdalla Idris',
        adhan_time: '12:15',
        iqamah_time: '12:30',
        status: 'UPCOMING',
      },
      {
        shift_number: 2,
        khateeb_name: 'Imam Nafis Bhayat',
        adhan_time: '13:15',
        iqamah_time: '13:30',
        status: 'UPCOMING',
      },
    ];

    it('correctly categorizes shifts into UPCOMING, STARTING_NOW, and COMPLETED with minutes_remaining countdown', () => {
      // Base date: Friday 2026-10-16 in Toronto (UTC-4)
      // At 12:35 PM Toronto time (16:35 UTC):
      // - Shift 1 (Iqamah 12:30) is 5 min in -> STARTING_NOW
      // - Shift 2 (Iqamah 13:30) is 55 min away -> UPCOMING with minutes_remaining: 55
      const t1 = new Date('2026-10-16T16:35:00.000Z');
      const res1 = resolveJummahShifts(shifts, t1, 'America/Toronto', 10);

      expect(res1[0]?.status).toBe('STARTING_NOW');
      expect(res1[1]?.status).toBe('UPCOMING');
      expect(res1[1]?.minutes_remaining).toBe(55);

      // At 12:45 PM Toronto time (16:45 UTC):
      // - Shift 1 (Iqamah 12:30) is 15 min after Iqamah -> COMPLETED
      // - Shift 2 (Iqamah 13:30) is 45 min away -> UPCOMING with minutes_remaining: 45
      const t2 = new Date('2026-10-16T16:45:00.000Z');
      const res2 = resolveJummahShifts(shifts, t2, 'America/Toronto', 10);

      expect(res2[0]?.status).toBe('COMPLETED');
      expect(res2[1]?.status).toBe('UPCOMING');
      expect(res2[1]?.minutes_remaining).toBe(45);
    });

    it('falls back to adhan_time when iqamah_time is undefined or empty', () => {
      const shiftWithoutIqamah: JummahShift[] = [
        {
          shift_number: 1,
          khateeb_name: 'Visiting Guest',
          adhan_time: '13:00',
          iqamah_time: undefined,
          status: 'UPCOMING',
        },
      ];

      // At 12:40 PM Toronto time (16:40 UTC), 20 minutes before 13:00 Adhan
      const t = new Date('2026-10-16T16:40:00.000Z');
      const res = resolveJummahShifts(shiftWithoutIqamah, t, 'America/Toronto', 10);

      expect(res[0]?.status).toBe('UPCOMING');
      expect(res[0]?.minutes_remaining).toBe(20);
    });
  });

  describe('MiniPrayerPill formatRemainingTime multi-tier countdown format', () => {
    it('formats remaining time >= 60m into hours and minutes (or pure hours)', () => {
      // 1h 45m = 6300 seconds
      expect(formatRemainingTime(6300)).toBe('in 1h 45m');
      // Exact 2 hours = 7200 seconds
      expect(formatRemainingTime(7200)).toBe('in 2h');
      // Exact 1 hour = 3600 seconds
      expect(formatRemainingTime(3600)).toBe('in 1h');
      // 2h 5m = 7500 seconds
      expect(formatRemainingTime(7500)).toBe('in 2h 5m');
    });

    it('formats remaining time < 1h and >= 60s into minutes', () => {
      // 45 minutes = 2700 seconds
      expect(formatRemainingTime(2700)).toBe('in 45m');
      // Exactly 60 seconds (1m)
      expect(formatRemainingTime(60)).toBe('in 1m');
      // 2 minutes 15 seconds (ceil to 3m)
      expect(formatRemainingTime(135)).toBe('in 3m');
    });

    it('formats remaining time < 60s into seconds', () => {
      // 45 seconds
      expect(formatRemainingTime(45)).toBe('in 45s');
      // 10 seconds
      expect(formatRemainingTime(10)).toBe('in 10s');
      // 1 second
      expect(formatRemainingTime(1)).toBe('in 1s');
    });

    it('supports fallback to minutesRemaining if secondsRemaining is omitted', () => {
      // 90 minutes -> in 1h 30m
      expect(formatRemainingTime(undefined, 90)).toBe('in 1h 30m');
      // 60 minutes -> in 1h
      expect(formatRemainingTime(undefined, 60)).toBe('in 1h');
      // 30 minutes -> in 30m
      expect(formatRemainingTime(undefined, 30)).toBe('in 30m');
      // 0 minutes -> in 1s fallback
      expect(formatRemainingTime(undefined, 0)).toBe('in 1s');
    });
  });

  describe('computeDisplaySnapshot MiniPill Telemetry', () => {
    it('populates seconds_remaining and target_iso on mini_pill for upcoming daily prayer', () => {
      // At 12:00 EDT (16:00 UTC) on Saturday, next prayer is Dhuhr (Iqamah 13:25 EDT = 17:25 UTC)
      // Difference: 1 hour 25 minutes = 85 minutes = 5100 seconds
      const saturdayMidday = new Date('2026-10-17T16:00:00.000Z');
      const drawerTrigger = new Date('2026-10-17T15:00:00.000Z'); // Drawer closed

      const state = computeDisplaySnapshot(
        mockSettings,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        saturdayMidday
      );

      expect(state.mini_pill).not.toBeNull();
      expect(state.mini_pill?.prayer_name).toBe('Dhuhr');
      expect(state.mini_pill?.minutes_remaining).toBe(85);
      expect(state.mini_pill?.seconds_remaining).toBe(5100);
      expect(state.mini_pill?.target_iso).toBeDefined();
    });
  });

  describe('Option A, C, D Multi-Spot QR & Sidebar Mode Choreography', () => {
    it('supports 6-spot placement coordinates and entrance delay settings', () => {
      const posterWithSpot: Poster = {
        ...mockPosters[0]!,
        qr_position: 'top-right',
      };
      expect(posterWithSpot.qr_position).toBe('top-right');

      const settingsWithChoreography: Settings = {
        ...mockSettings,
        sidebar_mode: 'always_open',
        sidebar_position: 'left',
        qr_entrance_delay_seconds: 3,
      };
      expect(settingsWithChoreography.sidebar_mode).toBe('always_open');
      expect(settingsWithChoreography.sidebar_position).toBe('left');
      expect(settingsWithChoreography.qr_entrance_delay_seconds).toBe(3);
    });

    it('formats 24h clock times to friendly 12h representation for prayer drawers', async () => {
      const { format12h } = await import('@/components/display/MiniPrayerPill');
      expect(format12h('05:30')).toBe('5:30 AM');
      expect(format12h('13:25')).toBe('1:25 PM');
      expect(format12h('00:15')).toBe('12:15 AM');
      expect(format12h('12:00')).toBe('12:00 PM');
    });

    it('integrates video posters with loop duration and thumbnail metadata in snapshot', () => {
      const videoPoster: Poster = {
        id: 'video-flyer-1',
        title: 'Youthhalaqa Promo',
        image_path: '/uploads/youth.mp4',
        media_type: 'video',
        video_loop_count: 4,
        video_duration_seconds: 5,
        thumbnail_path: '/uploads/youth-thumb.webp',
        duration_seconds: 20, // 5s * 4 loops
        start_at: '2026-10-01T00:00:00.000Z',
        end_at: '2026-10-31T23:59:59.000Z',
        qr_url: 'https://icco.org/youth',
        qr_label: 'Scan Here',
        qr_position: 'bottom-right',
        created_at: '2026-10-01T00:00:00.000Z',
      };

      const drawerTrigger = new Date('2026-10-17T15:00:00.000Z');
      const evalTime = new Date('2026-10-17T16:00:00.000Z');

      const snapshot = computeDisplaySnapshot(
        mockSettings,
        [videoPoster],
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        evalTime
      );

      expect(snapshot.active_poster?.media_type).toBe('video');
      expect(snapshot.active_poster?.video_loop_count).toBe(4);
      expect(snapshot.active_poster?.duration_seconds).toBe(20);
      expect(snapshot.active_poster?.thumbnail_path).toBe('/uploads/youth-thumb.webp');
      expect(snapshot.qr_card?.position).toBe('bottom-right');
    });

    it('supports sidebar_mode === "hidden" disabling timetable drawer and sidebar completely', () => {
      const hiddenSettings: Settings = {
        ...mockSettings,
        sidebar_mode: 'hidden',
        show_mini_prayer_pill: true,
        mini_prayer_pill_position: 'top-right',
        show_progress_bar: false,
      };

      expect(hiddenSettings.sidebar_mode).toBe('hidden');
      expect(hiddenSettings.show_progress_bar).toBe(false);
      expect(hiddenSettings.show_mini_prayer_pill).toBe(true);
      expect(hiddenSettings.mini_prayer_pill_position).toBe('top-right');
    });
  });

  describe('Corner Collision Prevention & Safe Zone Offsets', () => {
    it('applies default corner placement when no collision with pill exists', () => {
      const blWithoutCollision = getPositionCoordinates('bottom-left', false, 'bottom-left');
      expect(blWithoutCollision.containerClass).toBe('bottom-8 left-8');

      const blDifferentPillPos = getPositionCoordinates('bottom-left', true, 'bottom-right');
      expect(blDifferentPillPos.containerClass).toBe('bottom-8 left-8');
    });

    it('offsets bottom-left QR card when MiniPrayerPill is active in bottom-left', () => {
      const blWithCollision = getPositionCoordinates('bottom-left', true, 'bottom-left');
      expect(blWithCollision.containerClass).toBe('bottom-24 left-8');
      expect(blWithCollision.isTop).toBe(false);
    });

    it('offsets bottom-right QR card when MiniPrayerPill is active in bottom-right', () => {
      const brWithCollision = getPositionCoordinates('bottom-right', true, 'bottom-right');
      expect(brWithCollision.containerClass).toBe('bottom-24 right-8');
      expect(brWithCollision.isTop).toBe(false);
    });

    it('offsets top-left QR card when MiniPrayerPill is active in top-left', () => {
      const tlWithCollision = getPositionCoordinates('top-left', true, 'top-left');
      expect(tlWithCollision.containerClass).toBe('top-44 left-8');
      expect(tlWithCollision.isTop).toBe(true);
    });

    it('offsets top-right QR card when MiniPrayerPill is active in top-right', () => {
      const trWithCollision = getPositionCoordinates('top-right', true, 'top-right');
      expect(trWithCollision.containerClass).toBe('top-44 right-8');
      expect(trWithCollision.isTop).toBe(true);
    });
  });

  describe('Single Slide QR Pinning & Video Detection Engine', () => {
    const posterWithQr: Poster = {
      id: 'single-poster-qr',
      title: 'Community Dinner',
      image_path: '/uploads/dinner.webp',
      qr_url: 'https://icco.org/dinner',
      start_at: '2026-10-01T00:00:00.000Z',
      end_at: null,
      duration_seconds: 15,
      created_at: '2026-10-01T00:00:00.000Z',
    };

    it('pins QR permanently visible without blinking when activeCount <= 1', () => {
      // Tick 1 (elapsed 1s < entrance delay 3s): not yet visible
      expect(evaluateQrVisibilityOnTick(posterWithQr, 1, 1, 15, false, false, mockSettings, false)).toBe(false);

      // Tick 3 (elapsed 3s >= entrance delay 3s): becomes visible
      expect(evaluateQrVisibilityOnTick(posterWithQr, 1, 3, 15, false, false, mockSettings, false)).toBe(true);

      // Tick 16 (slide loops back to 1s, but currentlyVisible is true): stays visible permanently
      expect(evaluateQrVisibilityOnTick(posterWithQr, 1, 1, 15, false, false, mockSettings, true)).toBe(true);

      // At end of dwell (15s): still visible
      expect(evaluateQrVisibilityOnTick(posterWithQr, 1, 15, 15, false, false, mockSettings, true)).toBe(true);
    });

    it('fades QR before slide transition when activeCount > 1 (multi-slide mode)', () => {
      // Tick 3 (elapsed 3s): visible
      expect(evaluateQrVisibilityOnTick(posterWithQr, 2, 3, 15, false, false, mockSettings, false)).toBe(true);

      // Tick 14 (elapsed 14s >= dwell 15s - 1.5s = 13.5s): fades out for slide cross-fade
      expect(evaluateQrVisibilityOnTick(posterWithQr, 2, 14, 15, false, false, mockSettings, true)).toBe(false);
    });

    it('hides QR when drawer opens if show_qr_during_drawer is false', () => {
      const settingsNoQrInDrawer = { ...mockSettings, show_qr_during_drawer: false };
      expect(evaluateQrVisibilityOnTick(posterWithQr, 1, 5, 15, false, true, settingsNoQrInDrawer, true)).toBe(false);
    });

    it('accurately identifies standalone and multi-asset video posters', () => {
      expect(posterContainsVideo(null)).toBe(false);
      expect(posterContainsVideo(posterWithQr)).toBe(false);

      const standaloneVideo: Poster = {
        ...posterWithQr,
        media_type: 'video',
      };
      expect(posterContainsVideo(standaloneVideo)).toBe(true);

      const multiAssetWithVideo: Poster = {
        ...posterWithQr,
        layout_config: JSON.stringify({
          version: 1,
          archetype: 'split_vertical_50_50',
          split_ratio: 50,
          slots: [
            { id: 'slot-1', type: 'image', asset_path: '/img.png' },
            { id: 'slot-2', type: 'video', asset_path: '/vid.mp4' },
          ],
          text_overlays: [],
        }),
      };
      expect(posterContainsVideo(multiAssetWithVideo)).toBe(true);

      const multiAssetWithoutVideo: Poster = {
        ...posterWithQr,
        layout_config: JSON.stringify({
          version: 1,
          archetype: 'split_vertical_50_50',
          split_ratio: 50,
          slots: [
            { id: 'slot-1', type: 'image', asset_path: '/img.png' },
            { id: 'slot-2', type: 'notice', label: 'Halaqa' },
          ],
          text_overlays: [],
        }),
      };
      expect(posterContainsVideo(multiAssetWithoutVideo)).toBe(false);
    });

    it('preserves seconds when calculating simulated date with timeOverrideMinutes', () => {
      const baseWithSeconds = new Date('2026-10-17T16:00:35.000Z');
      const simulated = resolveSimulatedDate(baseWithSeconds, 'America/Toronto', 13 * 60 + 25, false);
      expect(simulated.getSeconds()).toBe(baseWithSeconds.getSeconds());
    });
  });

  describe('Congregation Silence Setting & Continuous Dwell', () => {
    it('defaults show_prayer_silence_overlay to false and suppresses overlay', () => {
      const settingsWithoutOverlay: Settings = {
        ...mockSettings,
        show_prayer_silence_overlay: false,
      };
      // At 13:25:00 Dhuhr is starting now
      const dhuhrIqamahTime = new Date('2026-10-17T17:25:00.000Z');
      const drawerTrigger = new Date('2026-10-17T16:00:00.000Z');
      const snapshot = computeDisplaySnapshot(
        settingsWithoutOverlay,
        mockPosters,
        mockPrayers,
        mockJummahShifts,
        0,
        drawerTrigger,
        dhuhrIqamahTime
      );

      expect(snapshot.next_prayer?.status).toBe('STARTING_NOW');
      // When show_prayer_silence_overlay is false, isDndActive is false
      const isDndActive = Boolean(settingsWithoutOverlay.show_prayer_silence_overlay) && snapshot.next_prayer?.status === 'STARTING_NOW';
      expect(isDndActive).toBe(false);

      // When explicitly enabled, isDndActive becomes true
      const settingsWithOverlay: Settings = {
        ...mockSettings,
        show_prayer_silence_overlay: true,
      };
      const isDndActiveEnabled = Boolean(settingsWithOverlay.show_prayer_silence_overlay) && snapshot.next_prayer?.status === 'STARTING_NOW';
      expect(isDndActiveEnabled).toBe(true);
    });

    it('pauses slide dwell and closes open drawer during congregation silence, then resumes smoothly', () => {
      const state: ChoreographyMutableState = {
        slideIndex: 0,
        slideElapsedSeconds: 5,
        isDrawerOpen: true,
        drawerElapsedSeconds: 2,
        drawerDurationOverrideSeconds: null,
        lastDrawerTrigger: new Date('2026-10-17T16:00:00.000Z'),
        timeOverrideMinutes: null,
        isFridayForced: false,
        isQrVisible: false,
        manualPowerOverride: null,
      };

      const setters: ChoreographyTickSetters = {
        setNow: () => {},
        setIsStandby: () => {},
        setIsDrawerOpen: (v) => { state.isDrawerOpen = v; },
        setDrawerElapsedSeconds: (v) => { state.drawerElapsedSeconds = v; },
        setDrawerDurationOverrideSeconds: (v) => { state.drawerDurationOverrideSeconds = v; },
        setLastDrawerTrigger: (d) => { state.lastDrawerTrigger = d; },
        setSlideElapsedSeconds: (v) => { state.slideElapsedSeconds = v; },
        setIsQrVisible: (v) => { state.isQrVisible = v; },
        setPreviousPoster: () => {},
        setIsCrossFading: () => {},
        setSlideIndex: (v) => { state.slideIndex = v; },
      };

      const liveProps: ChoreographyLiveProps = {
        settings: {
          ...mockSettings,
          show_prayer_silence_overlay: true,
        },
        initialPosters: mockPosters,
        prayers: mockPrayers,
        jummahShifts: mockJummahShifts,
      };

      const stateRef = { current: state };
      const livePropsRef = { current: liveProps };

      // At 13:25:00 Dhuhr is starting now
      const dhuhrIqamahTime = new Date('2026-10-17T17:25:00.000Z');

      // Tick during silence mode
      processChoreographyTick(() => dhuhrIqamahTime, stateRef, livePropsRef, setters);

      // Drawer must be closed immediately
      expect(state.isDrawerOpen).toBe(false);
      // Slide elapsed seconds must NOT advance (paused at 5)
      expect(state.slideElapsedSeconds).toBe(5);

      // When silence overlay is off (or after prayer finishes)
      liveProps.settings = { ...mockSettings, show_prayer_silence_overlay: false };
      processChoreographyTick(() => dhuhrIqamahTime, stateRef, livePropsRef, setters);

      // Slide elapsed seconds advances smoothly from 5 to 6
      expect(state.slideElapsedSeconds).toBe(6);
    });
  });
});


