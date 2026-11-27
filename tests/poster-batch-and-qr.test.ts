import { describe, it, expect, vi } from 'vitest';
import type { Poster, Settings, PosterWithStatus } from '@/types/index';
import { evaluateQrVisibilityOnTick } from '@/lib/engine/choreography-helpers';
import { computeDisplaySnapshot } from '@/lib/engine/display-snapshot';

describe('Advanced QR Code Display Integration & Search/Bulk Logic', () => {
  const baseNow = new Date('2026-11-23T12:00:00.000Z');

  const mockSettings: Settings = {
    mosque_name: 'Islamic Center',
    header_greeting: 'Welcome to',
    ticker_text: 'Peace be upon you',
    timezone: 'UTC',
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
    qr_entrance_delay_seconds: 0,
    show_qr_during_drawer: false,
    show_mini_prayer_pill: false,
    show_prayer_silence_overlay: false,
    mini_prayer_pill_position: 'bottom-right',
    show_progress_bar: true,
    poster_view_mode: 'grid',
    overscan_margin_percent: 0,
    clock_show_seconds: false,
    clock_time_format: '12h',
    latitude: 43.589,
    longitude: -79.644,
    calculation_method: 'NorthAmerica',
    madhab: 'shafi',
    fajr_adhan_offset_minutes: 0,
    sunrise_adhan_offset_minutes: 0,
    dhuhr_adhan_offset_minutes: 0,
    asr_adhan_offset_minutes: 0,
    maghrib_adhan_offset_minutes: 0,
    isha_adhan_offset_minutes: 0,
    has_admin_pin: true,
    auth_mode: 'pin',
    admin_username: undefined,
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
  };

  const createMockPoster = (overrides?: Partial<Poster>): Poster => ({
    id: 'poster-1',
    title: 'Community Dinner',
    image_path: '/uploads/dinner.jpg',
    qr_url: 'https://example.com/dinner',
    qr_label: 'Scan to RSVP',
    qr_position: 'bottom-left',
    start_at: '2026-11-20T00:00:00.000Z',
    end_at: '2026-11-30T00:00:00.000Z',
    duration_seconds: 15,
    display_order: 0,
    is_active: true,
    created_at: '2026-11-20T00:00:00.000Z',
    ...overrides,
  });

  describe('evaluateQrVisibilityOnTick with Scheduled QR', () => {
    it('returns false when poster QR is scheduled for the future', () => {
      const poster = createMockPoster({
        qr_start_at: '2026-11-23T14:00:00.000Z', // 2 hours in the future
      });

      const isVisible = evaluateQrVisibilityOnTick(
        poster, 1, 5, 15, false, false, mockSettings, false, baseNow
      );
      expect(isVisible).toBe(false);
    });

    it('returns false when poster QR has expired in the past', () => {
      const poster = createMockPoster({
        qr_end_at: '2026-11-23T10:00:00.000Z', // 2 hours in the past
      });

      const isVisible = evaluateQrVisibilityOnTick(
        poster, 1, 5, 15, false, false, mockSettings, false, baseNow
      );
      expect(isVisible).toBe(false);
    });

    it('returns true when current time is within scheduled QR window', () => {
      const poster = createMockPoster({
        qr_start_at: '2026-11-23T10:00:00.000Z',
        qr_end_at: '2026-11-23T14:00:00.000Z',
      });

      const isVisible = evaluateQrVisibilityOnTick(
        poster, 1, 5, 15, false, false, mockSettings, false, baseNow
      );
      expect(isVisible).toBe(true);
    });

    it('returns true when poster QR is always active without dates', () => {
      const poster = createMockPoster({
        qr_start_at: null,
        qr_end_at: null,
      });

      const isVisible = evaluateQrVisibilityOnTick(
        poster, 1, 5, 15, false, false, mockSettings, false, baseNow
      );
      expect(isVisible).toBe(true);
    });
  });

  describe('computeDisplaySnapshot with Scheduled QR', () => {
    const prayers = {
      fajr: { adhan_time: '05:30', iqamah_time: '06:00' },
      sunrise: { adhan_time: '07:00', iqamah_time: '07:00' },
      dhuhr: { adhan_time: '12:30', iqamah_time: '13:00' },
      asr: { adhan_time: '15:00', iqamah_time: '15:30' },
      maghrib: { adhan_time: '17:00', iqamah_time: '17:05' },
      isha: { adhan_time: '19:00', iqamah_time: '19:30' },
    };

    it('omits qr_card from snapshot when QR is scheduled for the future', () => {
      const poster = createMockPoster({
        qr_start_at: '2026-11-24T00:00:00.000Z',
      });

      const snapshot = computeDisplaySnapshot(
        mockSettings,
        [poster],
        prayers,
        [],
        0,
        new Date('2026-11-23T11:00:00.000Z'),
        baseNow
      );

      expect(snapshot.qr_card).toBeNull();
    });

    it('includes qr_card in snapshot when QR schedule is currently active', () => {
      const poster = createMockPoster({
        qr_start_at: '2026-11-23T10:00:00.000Z',
        qr_end_at: '2026-11-23T14:00:00.000Z',
      });

      const snapshot = computeDisplaySnapshot(
        mockSettings,
        [poster],
        prayers,
        [],
        0,
        new Date('2026-11-23T11:00:00.000Z'),
        baseNow
      );

      expect(snapshot.qr_card).not.toBeNull();
      expect(snapshot.qr_card?.url).toBe('https://example.com/dinner');
      expect(snapshot.qr_card?.label).toBe('Scan to RSVP');
    });
  });

  describe('Posters List Search & Filter Logic', () => {
    const list: PosterWithStatus[] = [
      {
        ...createMockPoster({ id: 'p1', title: 'Youth Halaqa & Games' }),
        status: 'ACTIVE',
      },
      {
        ...createMockPoster({ id: 'p2', title: 'Quran Memorization Class', qr_label: 'Sign up here' }),
        status: 'ACTIVE',
      },
      {
        ...createMockPoster({ id: 'p3', title: 'Jummah Announcement', qr_url: 'https://wa.me/group1' }),
        status: 'ARCHIVED',
      },
    ];

    it('matches posters by keyword in title', () => {
      const query = 'halaqa';
      const matched = list.filter((p) => p.title.toLowerCase().includes(query));
      expect(matched).toHaveLength(1);
      expect(matched[0]?.id).toBe('p1');
    });

    it('matches posters by keyword in qr_label', () => {
      const query = 'sign up';
      const matched = list.filter((p) =>
        (p.qr_label && p.qr_label.toLowerCase().includes(query)) || p.title.toLowerCase().includes(query)
      );
      expect(matched).toHaveLength(1);
      expect(matched[0]?.id).toBe('p2');
    });

    it('matches posters by keyword in qr_url', () => {
      const query = 'wa.me';
      const matched = list.filter((p) =>
        (p.qr_url && p.qr_url.toLowerCase().includes(query)) || p.title.toLowerCase().includes(query)
      );
      expect(matched).toHaveLength(1);
      expect(matched[0]?.id).toBe('p3');
    });
  });

  describe('Multi-Selection State Machine', () => {
    it('handles toggling selection and select all', () => {
      let selectedIds = new Set<string>();

      const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        selectedIds = next;
      };

      toggleSelect('p1');
      expect(selectedIds.has('p1')).toBe(true);
      expect(selectedIds.size).toBe(1);

      toggleSelect('p2');
      expect(selectedIds.size).toBe(2);

      toggleSelect('p1');
      expect(selectedIds.has('p1')).toBe(false);
      expect(selectedIds.size).toBe(1);

      // Clear
      selectedIds = new Set();
      expect(selectedIds.size).toBe(0);
    });
  });
});

