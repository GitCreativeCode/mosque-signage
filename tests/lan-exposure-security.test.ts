import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filterPublicActivePosters } from '@/lib/posters/poster-schedule-filter';
import { getPublicDisplaySettings, getVenueSettings } from '@/lib/actions/settings';
import { mapDbSettingsToPublicDisplay } from '@/lib/db/settings-mapper';
import { dispatchAudioReceiverCommand } from '@/lib/hardware/audio-driver';
import type { Poster } from '@/types/index';
import type { DbSettings } from '@/lib/db/schema';

describe('LAN & Display Data Exposure Remediation', () => {
  const baseTime = new Date('2026-11-12T12:00:00.000Z');

  describe('filterPublicActivePosters (Strict Schedule Window Isolation)', () => {
    const testPosters: Poster[] = [
      {
        id: 'active-1',
        title: 'Currently Active Flyer',
        image_path: '/uploads/active.webp',
        media_type: 'image',
        start_at: '2026-11-10T00:00:00.000Z',
        end_at: '2026-11-15T00:00:00.000Z',
        duration_seconds: 15,
        display_order: 1,
        is_active: true,
        created_at: '2026-11-10T00:00:00.000Z',
      },
      {
        id: 'upcoming-draft',
        title: 'Upcoming Secret Program',
        image_path: '/uploads/upcoming.webp',
        media_type: 'image',
        start_at: '2026-11-13T09:00:00.000Z', // In the future
        end_at: '2026-11-20T00:00:00.000Z',
        duration_seconds: 15,
        display_order: 2,
        is_active: true,
        created_at: '2026-11-10T00:00:00.000Z',
      },
      {
        id: 'expired-1',
        title: 'Old Expired Event',
        image_path: '/uploads/expired.webp',
        media_type: 'image',
        start_at: '2026-11-01T00:00:00.000Z',
        end_at: '2026-11-05T00:00:00.000Z', // In the past
        duration_seconds: 15,
        display_order: 3,
        is_active: true,
        created_at: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'archived-1',
        title: 'Disabled Archived Poster',
        image_path: '/uploads/archived.webp',
        media_type: 'image',
        start_at: '2026-11-01T00:00:00.000Z',
        end_at: null,
        duration_seconds: 15,
        display_order: 4,
        is_active: false, // Inactive
        created_at: '2026-11-01T00:00:00.000Z',
      },
    ];

    it('returns strictly ACTIVE posters, filtering out UPCOMING drafts, EXPIRED, and ARCHIVED items', () => {
      const { activePosters, nextTransitionAt } = filterPublicActivePosters(testPosters, baseTime);

      expect(activePosters).toHaveLength(1);
      expect(activePosters[0]?.id).toBe('active-1');
      expect(activePosters[0]?.title).toBe('Currently Active Flyer');

      // Assert zero leak of upcoming or archived titles
      const titles = activePosters.map((p) => p.title);
      expect(titles).not.toContain('Upcoming Secret Program');
      expect(titles).not.toContain('Old Expired Event');
      expect(titles).not.toContain('Disabled Archived Poster');

      // The earliest next transition is upcoming-draft starting at 2026-11-13T09:00:00.000Z
      expect(nextTransitionAt).toBe('2026-11-13T09:00:00.000Z');
    });

    it('emits null nextTransitionAt if no future start or end boundaries exist', () => {
      const singleIndefinite: Poster[] = [
        {
          ...testPosters[0]!,
          end_at: null,
        },
      ];
      const { activePosters, nextTransitionAt } = filterPublicActivePosters(singleIndefinite, baseTime);
      expect(activePosters).toHaveLength(1);
      expect(nextTransitionAt).toBeNull();
    });
  });

  describe('PublicDisplaySettings Sanitization', () => {
    const mockDbRow: DbSettings = {
      id: 'global',
      mosque_name: 'Downtown Masjid',
      header_greeting: 'Welcome',
      ticker_text: 'Peace be upon you',
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
      show_mini_prayer_pill: true,
      show_prayer_silence_overlay: false,
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
      admin_pin_hash: 'secret_salt_hash_here',
      admin_pin_salt: 'some_salt',
      tv_auto_power: true,
      power_on_time: '05:00',
      power_off_time: '23:00',
      power_schedule_mode: 'fixed',
      power_fajr_offset_minutes: 45,
      power_isha_offset_minutes: 45,
      tv_control_protocol: 'hybrid',
      standby_appearance: 'dim_clock',
      standby_show_attribution: false,
      audio_mute_during_prayer: true,
      audio_receiver_host: '192.168.1.188',
      audio_receiver_port: 23,
      audio_receiver_protocol: 'denon_telnet',
      audio_mute_delay_seconds: 5,
      display_access_mode: 'pairing_required',
      display_allow_localhost: true,
      display_session_version: 1,
      auth_mode: 'pin',
      admin_username: 'admin',
      admin_password_hash: null,
      admin_password_salt: null,
      session_version: 1,
      initial_setup_completed: true,
      terms_accepted: true,
      terms_accepted_at: '2026-11-12T00:00:00.000Z',
      high_latitude_rule: 'seventh_of_night',
      ramadan_mode_enabled: false,
      ramadan_display_start_date: null,
      ramadan_taraweeh_time: null,
      ramadan_taraweeh_rakats: '20',
      ramadan_taraweeh_sessions: null,
      ramadan_suhoor_buffer_minutes: 10,
      ramadan_silence_during_taraweeh: true,
      active_eid_type: 'none',
      active_eid_date: null,
      eid_auto_hide_minutes: 60,
      eid_friday_note: null,
      updated_at: '2026-11-12T00:00:00.000Z',
    };

    it('strips all internal audio receiver IPs, ports, and protocols from public display payload', () => {
      const publicSettings = mapDbSettingsToPublicDisplay(mockDbRow);

      expect(publicSettings.mosque_name).toBe('Downtown Masjid');
      expect(publicSettings.display_access_mode).toBe('pairing_required');
      expect(publicSettings.display_allow_localhost).toBe(true);

      // Sensitive fields must NOT be present
      expect('audio_receiver_host' in publicSettings).toBe(false);
      expect('audio_receiver_port' in publicSettings).toBe(false);
      expect('audio_receiver_protocol' in publicSettings).toBe(false);
      expect('audio_mute_during_prayer' in publicSettings).toBe(false);
      expect('tv_control_protocol' in publicSettings).toBe(false);
      expect('has_admin_pin' in publicSettings).toBe(false);
      expect('admin_username' in publicSettings).toBe(false);
      expect('session_version' in publicSettings).toBe(false);
      expect('initial_setup_completed' in publicSettings).toBe(false);
      expect('terms_accepted' in publicSettings).toBe(false);
      expect('terms_accepted_at' in publicSettings).toBe(false);
    });

    it('getPublicDisplaySettings succeeds unauthenticated and returns sanitized settings', async () => {
      const settings = await getPublicDisplaySettings();
      expect(settings).toBeDefined();
      expect(settings.mosque_name).toBeDefined();
      expect('audio_receiver_host' in settings).toBe(false);
      expect('audio_receiver_port' in settings).toBe(false);
    });
  });

  describe('Audio Driver SSRF Defense', () => {
    it('rejects AWS/GCP cloud metadata link-local target IP (169.254.169.254)', async () => {
      const result = await dispatchAudioReceiverCommand(
        {
          audio_mute_during_prayer: true,
          audio_receiver_host: 'http://169.254.169.254/latest/meta-data/',
          audio_receiver_port: 80,
          audio_receiver_protocol: 'http_webhook',
        },
        'MUTE'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rejected SSRF target');
    });

    it('rejects Google Cloud metadata target (metadata.google.internal)', async () => {
      const result = await dispatchAudioReceiverCommand(
        {
          audio_mute_during_prayer: true,
          audio_receiver_host: 'http://metadata.google.internal/computeMetadata/v1/',
          audio_receiver_port: 80,
          audio_receiver_protocol: 'http_webhook',
        },
        'MUTE'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Rejected SSRF target');
    });
  });
});
