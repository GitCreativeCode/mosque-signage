/**
 * SQLite Static Base Table DDL Definitions
 * MosqueSignage (TV)
 */

export const BASE_TABLES_DDL = `
  CREATE TABLE IF NOT EXISTS settings (
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
    clock_show_seconds INTEGER NOT NULL DEFAULT 0,
    clock_time_format TEXT NOT NULL DEFAULT '12h',
    initial_setup_completed INTEGER NOT NULL DEFAULT 0,
    terms_accepted INTEGER NOT NULL DEFAULT 0,
    terms_accepted_at TEXT,
    high_latitude_rule TEXT NOT NULL DEFAULT 'seventh_of_night',
    ramadan_mode_enabled INTEGER NOT NULL DEFAULT 0,
    ramadan_display_start_date TEXT,
    ramadan_taraweeh_time TEXT,
    ramadan_taraweeh_rakats TEXT DEFAULT '20',
    ramadan_taraweeh_sessions TEXT,
    ramadan_suhoor_buffer_minutes INTEGER NOT NULL DEFAULT 10,
    ramadan_silence_during_taraweeh INTEGER NOT NULL DEFAULT 1,
    active_eid_type TEXT NOT NULL DEFAULT 'none',
    active_eid_date TEXT,
    eid_auto_hide_minutes INTEGER NOT NULL DEFAULT 60,
    eid_friday_note TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posters (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    image_path TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    video_loop_count INTEGER NOT NULL DEFAULT 1,
    video_duration_seconds REAL,
    thumbnail_path TEXT,
    allow_audio INTEGER NOT NULL DEFAULT 0,
    qr_url TEXT,
    qr_label TEXT,
    qr_position TEXT NOT NULL DEFAULT 'bottom-left',
    qr_start_at TEXT,
    qr_end_at TEXT,
    start_at TEXT NOT NULL,
    end_at TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 15,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    layout_config TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prayer_overrides (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    prayer TEXT NOT NULL,
    adhan_override TEXT,
    iqamah_time TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prayer_rules (
    id TEXT PRIMARY KEY,
    prayer TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    offset_minutes INTEGER,
    fixed_time TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS annual_schedules (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    fajr_adhan TEXT,
    sunrise TEXT,
    dhuhr_adhan TEXT,
    asr_adhan TEXT,
    maghrib_adhan TEXT,
    isha_adhan TEXT,
    fajr_iqamah TEXT,
    dhuhr_iqamah TEXT,
    asr_iqamah TEXT,
    maghrib_iqamah TEXT,
    isha_iqamah TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS jummah_shifts (
    id TEXT PRIMARY KEY,
    shift_number INTEGER NOT NULL,
    khateeb_name TEXT NOT NULL,
    adhan_time TEXT NOT NULL,
    iqamah_time TEXT,
    location TEXT,
    language TEXT,
    topic TEXT,
    status TEXT NOT NULL DEFAULT 'UPCOMING',
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS friday_khateeb_roster (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    shift_id TEXT NOT NULL,
    khateeb_name TEXT NOT NULL,
    topic TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS eid_shifts (
    id TEXT PRIMARY KEY,
    eid_type TEXT NOT NULL,
    shift_number INTEGER NOT NULL,
    takbeerat_time TEXT NOT NULL,
    salah_time TEXT NOT NULL,
    khateeb_name TEXT,
    location TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ticker_messages (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    start_at TEXT,
    end_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS display_pairing_codes (
    id TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    consumed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS auth_rate_limits (
    client_key TEXT PRIMARY KEY,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    lockout_tier INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_posters_active_schedule ON posters (is_active, start_at, end_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_annual_schedules_date ON annual_schedules (date);
  CREATE INDEX IF NOT EXISTS idx_jummah_shifts_number ON jummah_shifts (shift_number);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_prayer_overrides_date_prayer ON prayer_overrides (date, prayer);
`;

