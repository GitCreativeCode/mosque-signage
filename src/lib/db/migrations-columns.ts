/**
 * Idempotent SQLite Column & Constraint Migrations
 * MosqueSignage (TV)
 */

import type { SqliteDriver } from './client';
import { hashPin } from '../auth/crypto';

const COLUMN_MIGRATION_STATEMENTS: readonly string[] = [
  'ALTER TABLE settings ADD COLUMN show_adhan_times INTEGER NOT NULL DEFAULT 1;',
  "ALTER TABLE settings ADD COLUMN date_format TEXT NOT NULL DEFAULT 'both';",
  "ALTER TABLE settings ADD COLUMN poster_transition TEXT NOT NULL DEFAULT 'fade';",
  "ALTER TABLE settings ADD COLUMN poster_fit TEXT NOT NULL DEFAULT 'cover';",
  "ALTER TABLE settings ADD COLUMN madhab TEXT NOT NULL DEFAULT 'shafi';",
  "ALTER TABLE settings ADD COLUMN display_resolution TEXT NOT NULL DEFAULT '1080p';",
  "ALTER TABLE settings ADD COLUMN sidebar_mode TEXT NOT NULL DEFAULT 'drawer';",
  "ALTER TABLE settings ADD COLUMN sidebar_position TEXT NOT NULL DEFAULT 'right';",
  'ALTER TABLE settings ADD COLUMN qr_entrance_delay_seconds INTEGER NOT NULL DEFAULT 3;',
  "ALTER TABLE settings ADD COLUMN header_greeting TEXT DEFAULT 'Welcome to';",
  "ALTER TABLE settings ADD COLUMN sidebar_accent_theme TEXT NOT NULL DEFAULT 'teal';",
  "ALTER TABLE posters ADD COLUMN qr_position TEXT NOT NULL DEFAULT 'bottom-left';",
  "ALTER TABLE posters ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image';",
  'ALTER TABLE posters ADD COLUMN video_loop_count INTEGER NOT NULL DEFAULT 1;',
  'ALTER TABLE posters ADD COLUMN video_duration_seconds REAL;',
  'ALTER TABLE posters ADD COLUMN thumbnail_path TEXT;',
  'ALTER TABLE posters ADD COLUMN allow_audio INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE posters ADD COLUMN layout_config TEXT;',
  'ALTER TABLE posters ADD COLUMN recurring_schedule TEXT;',
  'ALTER TABLE posters ADD COLUMN qr_start_at TEXT;',
  'ALTER TABLE posters ADD COLUMN qr_end_at TEXT;',
  "UPDATE settings SET poster_fit = 'cover' WHERE poster_fit = 'contain' OR poster_fit IS NULL;",
  'ALTER TABLE settings ADD COLUMN admin_pin_hash TEXT;',
  'ALTER TABLE settings ADD COLUMN admin_pin_salt TEXT;',
  'ALTER TABLE settings ADD COLUMN fajr_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN sunrise_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN dhuhr_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN asr_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN maghrib_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN isha_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN show_qr_during_drawer INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN tv_auto_power INTEGER NOT NULL DEFAULT 0;',
  "ALTER TABLE settings ADD COLUMN power_on_time TEXT NOT NULL DEFAULT '05:00';",
  "ALTER TABLE settings ADD COLUMN power_off_time TEXT NOT NULL DEFAULT '23:00';",
  "ALTER TABLE settings ADD COLUMN power_schedule_mode TEXT NOT NULL DEFAULT 'fixed';",
  'ALTER TABLE settings ADD COLUMN power_fajr_offset_minutes INTEGER NOT NULL DEFAULT 45;',
  'UPDATE settings SET power_fajr_offset_minutes = 45 WHERE power_fajr_offset_minutes = -45;',
  'ALTER TABLE settings ADD COLUMN power_isha_offset_minutes INTEGER NOT NULL DEFAULT 45;',
  "ALTER TABLE settings ADD COLUMN tv_control_protocol TEXT NOT NULL DEFAULT 'software_blackout';",
  'ALTER TABLE settings ADD COLUMN audio_mute_during_prayer INTEGER NOT NULL DEFAULT 0;',
  "ALTER TABLE settings ADD COLUMN audio_receiver_host TEXT NOT NULL DEFAULT '';",
  'ALTER TABLE settings ADD COLUMN audio_receiver_port INTEGER NOT NULL DEFAULT 23;',
  "ALTER TABLE settings ADD COLUMN audio_receiver_protocol TEXT NOT NULL DEFAULT 'denon_telnet';",
  'ALTER TABLE settings ADD COLUMN audio_mute_delay_seconds INTEGER NOT NULL DEFAULT 0;',
  "ALTER TABLE settings ADD COLUMN display_access_mode TEXT NOT NULL DEFAULT 'open';",
  'ALTER TABLE settings ADD COLUMN display_allow_localhost INTEGER NOT NULL DEFAULT 1;',
  'ALTER TABLE settings ADD COLUMN display_session_version INTEGER NOT NULL DEFAULT 1;',
  'CREATE TABLE IF NOT EXISTS display_pairing_codes (id TEXT PRIMARY KEY, code_hash TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, consumed_at TEXT);',
  'ALTER TABLE settings ADD COLUMN show_mini_prayer_pill INTEGER NOT NULL DEFAULT 1;',
  "ALTER TABLE settings ADD COLUMN mini_prayer_pill_position TEXT NOT NULL DEFAULT 'bottom-right';",
  'ALTER TABLE settings ADD COLUMN show_progress_bar INTEGER NOT NULL DEFAULT 1;',
  "ALTER TABLE settings ADD COLUMN poster_view_mode TEXT NOT NULL DEFAULT 'grid';",
  'ALTER TABLE settings ADD COLUMN initial_setup_completed INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN overscan_margin_percent INTEGER NOT NULL DEFAULT 0;',
  "ALTER TABLE settings ADD COLUMN auth_mode TEXT NOT NULL DEFAULT 'pin';",
  'ALTER TABLE settings ADD COLUMN admin_username TEXT;',
  'ALTER TABLE settings ADD COLUMN admin_password_hash TEXT;',
  'ALTER TABLE settings ADD COLUMN admin_password_salt TEXT;',
  'ALTER TABLE settings ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;',
  'CREATE TABLE IF NOT EXISTS auth_rate_limits (client_key TEXT PRIMARY KEY, failed_attempts INTEGER NOT NULL DEFAULT 0, lockout_tier INTEGER NOT NULL DEFAULT 0, locked_until INTEGER, updated_at INTEGER NOT NULL);',
  'ALTER TABLE annual_schedules ADD COLUMN fajr_adhan TEXT;',
  'ALTER TABLE annual_schedules ADD COLUMN sunrise TEXT;',
  'ALTER TABLE annual_schedules ADD COLUMN dhuhr_adhan TEXT;',
  'ALTER TABLE annual_schedules ADD COLUMN asr_adhan TEXT;',
  'ALTER TABLE annual_schedules ADD COLUMN maghrib_adhan TEXT;',
  'ALTER TABLE annual_schedules ADD COLUMN isha_adhan TEXT;',
  'ALTER TABLE settings ADD COLUMN terms_accepted INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN terms_accepted_at TEXT;',
  'ALTER TABLE settings ADD COLUMN clock_show_seconds INTEGER NOT NULL DEFAULT 0;',
  "ALTER TABLE settings ADD COLUMN clock_time_format TEXT NOT NULL DEFAULT '12h';",
  "ALTER TABLE settings ADD COLUMN standby_appearance TEXT NOT NULL DEFAULT 'dim_clock';",
  'ALTER TABLE settings ADD COLUMN standby_show_attribution INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN show_prayer_silence_overlay INTEGER NOT NULL DEFAULT 0;',
  "ALTER TABLE settings ADD COLUMN silence_screen_subtitle TEXT DEFAULT 'Please switch mobile phones to silent';",
  "ALTER TABLE settings ADD COLUMN silence_screen_accent_theme TEXT NOT NULL DEFAULT 'green';",
  "ALTER TABLE settings ADD COLUMN high_latitude_rule TEXT NOT NULL DEFAULT 'seventh_of_night';",
  'ALTER TABLE settings ADD COLUMN ramadan_mode_enabled INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE settings ADD COLUMN ramadan_display_start_date TEXT;',
  'ALTER TABLE settings ADD COLUMN ramadan_taraweeh_time TEXT;',
  "ALTER TABLE settings ADD COLUMN ramadan_taraweeh_rakats TEXT DEFAULT '20';",
  'ALTER TABLE settings ADD COLUMN ramadan_taraweeh_sessions TEXT;',
  'ALTER TABLE settings ADD COLUMN ramadan_suhoor_buffer_minutes INTEGER NOT NULL DEFAULT 10;',
  'ALTER TABLE settings ADD COLUMN ramadan_silence_during_taraweeh INTEGER NOT NULL DEFAULT 1;',
  "ALTER TABLE settings ADD COLUMN active_eid_type TEXT NOT NULL DEFAULT 'none';",
  'ALTER TABLE settings ADD COLUMN active_eid_date TEXT;',
  'ALTER TABLE settings ADD COLUMN eid_auto_hide_minutes INTEGER NOT NULL DEFAULT 60;',
  'ALTER TABLE settings ADD COLUMN eid_friday_note TEXT;',
  'ALTER TABLE jummah_shifts ADD COLUMN location TEXT;',
  'ALTER TABLE jummah_shifts ADD COLUMN language TEXT;',
  'ALTER TABLE jummah_shifts ADD COLUMN topic TEXT;',
  'CREATE TABLE IF NOT EXISTS friday_khateeb_roster (id TEXT PRIMARY KEY, date TEXT NOT NULL, shift_id TEXT NOT NULL, khateeb_name TEXT NOT NULL, topic TEXT, created_at TEXT NOT NULL);',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_friday_khateeb_roster_date_shift ON friday_khateeb_roster(date, shift_id);',
  'CREATE TABLE IF NOT EXISTS eid_shifts (id TEXT PRIMARY KEY, eid_type TEXT NOT NULL, shift_number INTEGER NOT NULL, takbeerat_time TEXT NOT NULL, salah_time TEXT NOT NULL, khateeb_name TEXT, location TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);',
  'CREATE INDEX IF NOT EXISTS idx_eid_shifts_type_number ON eid_shifts(eid_type, shift_number);',
];

export function applyColumnMigrations(driver: SqliteDriver): void {
  for (const statement of COLUMN_MIGRATION_STATEMENTS) {
    try {
      driver.exec(statement);
    } catch {
      // Column already exists or update skipped
    }
  }
}

export function ensureDefaultAdminPin(driver: SqliteDriver): void {
  try {
    const row = driver.prepare("SELECT admin_pin_hash FROM settings WHERE id = 'global'").get() as
      | { admin_pin_hash?: string | null }
      | undefined;
    if (!row?.admin_pin_hash) {
      const { hash, salt } = hashPin('1234');
      driver
        .prepare("UPDATE settings SET admin_pin_hash = ?, admin_pin_salt = ? WHERE id = 'global'")
        .run(hash, salt);
    }
  } catch {
    // Ignore when settings table is not yet populated
  }
}

