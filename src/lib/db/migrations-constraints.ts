/**
 * SQLite Legacy Table Constraint Migrations
 * MosqueSignage (TV)
 */

import type { SqliteDriver } from './client';

function hasNotNullColumn(driver: SqliteDriver, table: string, column: string): boolean {
  const tableInfo = driver.prepare(`PRAGMA table_info(${table})`).all() as { name: string; notnull: number }[];
  const target = tableInfo.find((col) => col.name === column);
  return Boolean(target && target.notnull === 1);
}

export function migrateLegacyTableConstraints(driver: SqliteDriver): void {
  try {
    if (hasNotNullColumn(driver, 'settings', 'latitude') || hasNotNullColumn(driver, 'settings', 'longitude')) {
      const tableInfo = driver.prepare('PRAGMA table_info(settings)').all() as { name: string }[];
      const colNames = tableInfo.map((col) => `"${col.name}"`).join(', ');

      driver.exec(`
        PRAGMA foreign_keys=off;
        CREATE TABLE settings_migration (
          id TEXT PRIMARY KEY,
          mosque_name TEXT NOT NULL,
          ticker_text TEXT NOT NULL,
          timezone TEXT NOT NULL,
          hijri_offset_days INTEGER NOT NULL DEFAULT 0,
          drawer_interval_minutes INTEGER NOT NULL DEFAULT 3,
          drawer_display_seconds INTEGER NOT NULL DEFAULT 12,
          prayer_starting_now_duration_minutes INTEGER NOT NULL DEFAULT 10,
          show_adhan_times INTEGER NOT NULL DEFAULT 1,
          date_format TEXT NOT NULL DEFAULT 'both',
          poster_transition TEXT NOT NULL DEFAULT 'fade',
          poster_fit TEXT NOT NULL DEFAULT 'cover',
          display_resolution TEXT NOT NULL DEFAULT '1080p',
          sidebar_mode TEXT NOT NULL DEFAULT 'hidden',
          sidebar_position TEXT NOT NULL DEFAULT 'right',
          sidebar_accent_theme TEXT NOT NULL DEFAULT 'teal',
          qr_entrance_delay_seconds INTEGER NOT NULL DEFAULT 3,
          show_qr_during_drawer INTEGER NOT NULL DEFAULT 0,
          header_greeting TEXT DEFAULT 'Welcome to',
          latitude REAL,
          longitude REAL,
          calculation_method TEXT NOT NULL DEFAULT 'NorthAmerica',
          madhab TEXT NOT NULL DEFAULT 'shafi',
          fajr_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0,
          sunrise_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0,
          dhuhr_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0,
          asr_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0,
          maghrib_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0,
          isha_adhan_offset_minutes INTEGER NOT NULL DEFAULT 0,
          admin_pin_hash TEXT,
          admin_pin_salt TEXT,
          auth_mode TEXT NOT NULL DEFAULT 'pin',
          admin_username TEXT,
          admin_password_hash TEXT,
          admin_password_salt TEXT,
          session_version INTEGER NOT NULL DEFAULT 1,
          tv_auto_power INTEGER NOT NULL DEFAULT 0,
          power_on_time TEXT NOT NULL DEFAULT '05:00',
          power_off_time TEXT NOT NULL DEFAULT '23:00',
          power_schedule_mode TEXT NOT NULL DEFAULT 'fixed',
          power_fajr_offset_minutes INTEGER NOT NULL DEFAULT -45,
          power_isha_offset_minutes INTEGER NOT NULL DEFAULT 45,
          tv_control_protocol TEXT NOT NULL DEFAULT 'software_blackout',
          audio_mute_during_prayer INTEGER NOT NULL DEFAULT 0,
          audio_receiver_host TEXT NOT NULL DEFAULT '',
          audio_receiver_port INTEGER NOT NULL DEFAULT 23,
          audio_receiver_protocol TEXT NOT NULL DEFAULT 'denon_telnet',
          audio_mute_delay_seconds INTEGER NOT NULL DEFAULT 0,
          display_access_mode TEXT NOT NULL DEFAULT 'open',
          display_allow_localhost INTEGER NOT NULL DEFAULT 1,
          display_session_version INTEGER NOT NULL DEFAULT 1,
          show_mini_prayer_pill INTEGER NOT NULL DEFAULT 0,
          mini_prayer_pill_position TEXT NOT NULL DEFAULT 'bottom-right',
          show_progress_bar INTEGER NOT NULL DEFAULT 1,
          poster_view_mode TEXT NOT NULL DEFAULT 'grid',
          overscan_margin_percent INTEGER NOT NULL DEFAULT 0,
          initial_setup_completed INTEGER NOT NULL DEFAULT 0,
          terms_accepted INTEGER NOT NULL DEFAULT 0,
          terms_accepted_at TEXT,
          updated_at TEXT NOT NULL
        );
        INSERT INTO settings_migration (${colNames}) SELECT ${colNames} FROM settings;
        DROP TABLE settings;
        ALTER TABLE settings_migration RENAME TO settings;
        PRAGMA foreign_keys=on;
      `);
    }
  } catch (err) {
    console.error('Failed to migrate settings table coordinates constraint:', err);
  }

  try {
    if (hasNotNullColumn(driver, 'posters', 'end_at')) {
      driver.exec(`
        PRAGMA foreign_keys=off;
        CREATE TABLE posters_migration (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, image_path TEXT NOT NULL, qr_url TEXT, qr_label TEXT,
          start_at TEXT NOT NULL, end_at TEXT, duration_seconds INTEGER NOT NULL DEFAULT 15,
          display_order INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
        );
        INSERT INTO posters_migration SELECT id, title, image_path, qr_url, qr_label, start_at, end_at, duration_seconds, display_order, is_active, created_at FROM posters;
        DROP TABLE posters; ALTER TABLE posters_migration RENAME TO posters; PRAGMA foreign_keys=on;
      `);
    }
  } catch (err) {
    console.error('Failed to migrate posters table:', err);
  }

  try {
    if (hasNotNullColumn(driver, 'jummah_shifts', 'iqamah_time')) {
      driver.exec(`
        PRAGMA foreign_keys=off;
        CREATE TABLE jummah_shifts_migration (
          id TEXT PRIMARY KEY, shift_number INTEGER NOT NULL, khateeb_name TEXT NOT NULL,
          adhan_time TEXT NOT NULL, iqamah_time TEXT, status TEXT NOT NULL DEFAULT 'UPCOMING', is_active INTEGER NOT NULL DEFAULT 1
        );
        INSERT INTO jummah_shifts_migration SELECT id, shift_number, khateeb_name, adhan_time, iqamah_time, status, is_active FROM jummah_shifts;
        DROP TABLE jummah_shifts; ALTER TABLE jummah_shifts_migration RENAME TO jummah_shifts; PRAGMA foreign_keys=on;
      `);
    }
  } catch (err) {
    console.error('Failed to migrate jummah_shifts table:', err);
  }

  try {
    if (hasNotNullColumn(driver, 'annual_schedules', 'fajr_iqamah')) {
      driver.exec(`
        PRAGMA foreign_keys=off;
        CREATE TABLE annual_schedules_migration (
          id TEXT PRIMARY KEY, date TEXT NOT NULL, fajr_adhan TEXT, sunrise TEXT, dhuhr_adhan TEXT, asr_adhan TEXT,
          maghrib_adhan TEXT, isha_adhan TEXT, fajr_iqamah TEXT, dhuhr_iqamah TEXT, asr_iqamah TEXT,
          maghrib_iqamah TEXT, isha_iqamah TEXT, updated_at TEXT NOT NULL
        );
        INSERT INTO annual_schedules_migration (id, date, fajr_adhan, sunrise, dhuhr_adhan, asr_adhan, maghrib_adhan, isha_adhan, fajr_iqamah, dhuhr_iqamah, asr_iqamah, maghrib_iqamah, isha_iqamah, updated_at)
          SELECT id, date, fajr_adhan, sunrise, dhuhr_adhan, asr_adhan, maghrib_adhan, isha_adhan, fajr_iqamah, dhuhr_iqamah, asr_iqamah, maghrib_iqamah, isha_iqamah, updated_at FROM annual_schedules;
        DROP TABLE annual_schedules; ALTER TABLE annual_schedules_migration RENAME TO annual_schedules;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_annual_schedules_date ON annual_schedules (date); PRAGMA foreign_keys=on;
      `);
    }
  } catch (err) {
    console.error('Failed to migrate annual_schedules table:', err);
  }
}

