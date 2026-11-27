/**
 * Canonical Default Database Seed Payloads
 * MosqueSignage (TV)
 */

import { DEFAULT_POSTERS_CONFIG } from './default-posters';

export function buildDefaultSettingsRow(
  nowIso: string,
  pinCredentials?: { hash: string | null; salt: string | null },
  sessionVersion: number = 1
) {
  return {
    id: 'global',
    mosque_name: 'Islamic Community Center',
    header_greeting: 'Welcome to',
    ticker_text:
      'Welcome to the Islamic Center • Please silence mobile phones upon entering the prayer hall',
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
    sidebar_mode: 'hidden',
    sidebar_position: 'right',
    sidebar_accent_theme: 'teal',
    qr_entrance_delay_seconds: 3,
    show_qr_during_drawer: false,
    show_mini_prayer_pill: false,
    show_prayer_silence_overlay: false,
    silence_screen_subtitle: 'Please switch mobile phones to silent',
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
    initial_setup_completed: false,
    terms_accepted: false,
    terms_accepted_at: null,
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
    auth_mode: 'pin',
    admin_username: 'admin',
    admin_password_hash: null,
    admin_password_salt: null,
    session_version: sessionVersion,
    ...(pinCredentials
      ? { admin_pin_hash: pinCredentials.hash, admin_pin_salt: pinCredentials.salt }
      : {}),
    updated_at: nowIso,
  };
}

export function buildDefaultPostersRows(nowIso: string) {
  return [
    {
      id: DEFAULT_POSTERS_CONFIG.welcome.id,
      title: DEFAULT_POSTERS_CONFIG.welcome.title,
      image_path: DEFAULT_POSTERS_CONFIG.welcome.image_path,
      qr_url: DEFAULT_POSTERS_CONFIG.welcome.qr_url,
      qr_label: DEFAULT_POSTERS_CONFIG.welcome.qr_label,
      qr_position: DEFAULT_POSTERS_CONFIG.welcome.qr_position,
      start_at: '2026-01-01T00:00:00.000Z',
      end_at: null,
      duration_seconds: DEFAULT_POSTERS_CONFIG.welcome.duration_seconds,
      display_order: 1,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: DEFAULT_POSTERS_CONFIG.event.id,
      title: DEFAULT_POSTERS_CONFIG.event.title,
      image_path: DEFAULT_POSTERS_CONFIG.event.image_path,
      qr_url: DEFAULT_POSTERS_CONFIG.event.qr_url,
      qr_label: DEFAULT_POSTERS_CONFIG.event.qr_label,
      qr_position: DEFAULT_POSTERS_CONFIG.event.qr_position,
      start_at: '2026-01-01T00:00:00.000Z',
      end_at: null,
      duration_seconds: DEFAULT_POSTERS_CONFIG.event.duration_seconds,
      display_order: 2,
      is_active: true,
      created_at: nowIso,
    },
  ];
}

export const DEFAULT_JUMMAH_SHIFTS_ROWS: readonly {
  id: string;
  shift_number: number;
  khateeb_name: string;
  adhan_time: string;
  iqamah_time: string;
  status: string;
  is_active: boolean;
}[] = [];

export function buildDefaultTickerRows(nowIso: string) {
  return [
    { id: 'ticker-1', message: 'Welcome to the Islamic Community Center', priority: 1, is_active: true, created_at: nowIso },
    { id: 'ticker-2', message: 'Please remember to park only in designated spots to respect our neighbors.', priority: 2, is_active: true, created_at: nowIso },
    { id: 'ticker-3', message: "Daily Qur'an Tafseer program held immediately after Fajr prayer.", priority: 3, is_active: true, created_at: nowIso },
  ];
}

