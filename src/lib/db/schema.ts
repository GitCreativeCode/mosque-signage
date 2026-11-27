import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const settingsTable = sqliteTable('settings', {
  id: text('id').primaryKey(), // Fixed 'global'
  mosque_name: text('mosque_name').notNull(),
  header_greeting: text('header_greeting').default('Welcome to'),
  ticker_text: text('ticker_text').notNull(),
  timezone: text('timezone').notNull(), // e.g. 'America/Toronto'
  hijri_offset_days: integer('hijri_offset_days').notNull().default(0),
  drawer_interval_minutes: integer('drawer_interval_minutes').notNull().default(3),
  drawer_display_seconds: integer('drawer_display_seconds').notNull().default(12),
  prayer_starting_now_duration_minutes: integer('prayer_starting_now_duration_minutes').notNull().default(10),
  show_adhan_times: integer('show_adhan_times', { mode: 'boolean' }).notNull().default(true),
  date_format: text('date_format').notNull().default('both'), // 'both' | 'hijri' | 'gregorian'
  poster_transition: text('poster_transition').notNull().default('fade'), // 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'zoom'
  poster_fit: text('poster_fit').notNull().default('cover'), // 'contain' | 'cover'
  display_resolution: text('display_resolution').notNull().default('1080p'), // '1080p' | '4k' | '1600x900' | '720p' | 'auto'
  sidebar_mode: text('sidebar_mode').notNull().default('hidden'), // 'drawer' | 'always_open' | 'hidden'
  sidebar_position: text('sidebar_position').notNull().default('right'), // 'right' | 'left'
  sidebar_accent_theme: text('sidebar_accent_theme').notNull().default('teal'),
  qr_entrance_delay_seconds: integer('qr_entrance_delay_seconds').notNull().default(3), // 0 to 10
  show_qr_during_drawer: integer('show_qr_during_drawer', { mode: 'boolean' }).notNull().default(false),
  show_mini_prayer_pill: integer('show_mini_prayer_pill', { mode: 'boolean' }).notNull().default(false),
  show_prayer_silence_overlay: integer('show_prayer_silence_overlay', { mode: 'boolean' }).notNull().default(false),
  silence_screen_subtitle: text('silence_screen_subtitle').default('Please switch mobile phones to silent'),
  silence_screen_accent_theme: text('silence_screen_accent_theme').notNull().default('green'), // 'green' | 'amber' | 'teal' | 'white'
  mini_prayer_pill_position: text('mini_prayer_pill_position').notNull().default('bottom-right'), // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  show_progress_bar: integer('show_progress_bar', { mode: 'boolean' }).notNull().default(true),
  poster_view_mode: text('poster_view_mode').notNull().default('grid'), // 'grid' | 'table'
  overscan_margin_percent: integer('overscan_margin_percent').notNull().default(0), // 0, 2, 4
  clock_show_seconds: integer('clock_show_seconds', { mode: 'boolean' }).notNull().default(false),
  clock_time_format: text('clock_time_format').notNull().default('12h'), // '12h' | '24h'
  latitude: real('latitude'),
  longitude: real('longitude'),
  calculation_method: text('calculation_method').notNull().default('NorthAmerica'),
  madhab: text('madhab').notNull().default('shafi'), // 'shafi' | 'hanafi'
  fajr_adhan_offset_minutes: integer('fajr_adhan_offset_minutes').notNull().default(0),
  sunrise_adhan_offset_minutes: integer('sunrise_adhan_offset_minutes').notNull().default(0),
  dhuhr_adhan_offset_minutes: integer('dhuhr_adhan_offset_minutes').notNull().default(0),
  asr_adhan_offset_minutes: integer('asr_adhan_offset_minutes').notNull().default(0),
  maghrib_adhan_offset_minutes: integer('maghrib_adhan_offset_minutes').notNull().default(0),
  isha_adhan_offset_minutes: integer('isha_adhan_offset_minutes').notNull().default(0),
  admin_pin_hash: text('admin_pin_hash'),
  admin_pin_salt: text('admin_pin_salt'),
  auth_mode: text('auth_mode').notNull().default('pin'), // 'pin' | 'password'
  admin_username: text('admin_username'),
  admin_password_hash: text('admin_password_hash'),
  admin_password_salt: text('admin_password_salt'),
  session_version: integer('session_version').notNull().default(1),
  tv_auto_power: integer('tv_auto_power', { mode: 'boolean' }).notNull().default(false),
  power_on_time: text('power_on_time').notNull().default('05:00'),
  power_off_time: text('power_off_time').notNull().default('23:00'),
  power_schedule_mode: text('power_schedule_mode').notNull().default('fixed'), // 'fixed' | 'prayer_relative'
  power_fajr_offset_minutes: integer('power_fajr_offset_minutes').notNull().default(45),
  power_isha_offset_minutes: integer('power_isha_offset_minutes').notNull().default(45),
  tv_control_protocol: text('tv_control_protocol').notNull().default('software_blackout'), // 'software_blackout' | 'hybrid' | 'cec_client' | 'dpms'
  standby_appearance: text('standby_appearance').notNull().default('dim_clock'), // 'dim_clock' | 'pure_black'
  standby_show_attribution: integer('standby_show_attribution', { mode: 'boolean' }).notNull().default(false),
  audio_mute_during_prayer: integer('audio_mute_during_prayer', { mode: 'boolean' }).notNull().default(false),
  audio_receiver_host: text('audio_receiver_host').notNull().default(''),
  audio_receiver_port: integer('audio_receiver_port').notNull().default(23),
  audio_receiver_protocol: text('audio_receiver_protocol').notNull().default('denon_telnet'), // 'denon_telnet' | 'yamaha_csvp' | 'http_webhook'
  audio_mute_delay_seconds: integer('audio_mute_delay_seconds').notNull().default(0),
  display_access_mode: text('display_access_mode').notNull().default('open'), // 'open' | 'pairing_required'
  display_allow_localhost: integer('display_allow_localhost', { mode: 'boolean' }).notNull().default(true),
  display_session_version: integer('display_session_version').notNull().default(1),
  initial_setup_completed: integer('initial_setup_completed', { mode: 'boolean' }).notNull().default(false),
  terms_accepted: integer('terms_accepted', { mode: 'boolean' }).notNull().default(false),
  terms_accepted_at: text('terms_accepted_at'),
  high_latitude_rule: text('high_latitude_rule').notNull().default('seventh_of_night'), // 'seventh_of_night' | 'middle_of_night' | 'twilight_angle' | 'none'
  ramadan_mode_enabled: integer('ramadan_mode_enabled', { mode: 'boolean' }).notNull().default(false),
  ramadan_display_start_date: text('ramadan_display_start_date'), // YYYY-MM-DD optional advance display date
  ramadan_taraweeh_time: text('ramadan_taraweeh_time'),
  ramadan_taraweeh_rakats: text('ramadan_taraweeh_rakats').default('20'),
  ramadan_taraweeh_sessions: text('ramadan_taraweeh_sessions'), // JSON serialized TaraweehSession[]
  ramadan_suhoor_buffer_minutes: integer('ramadan_suhoor_buffer_minutes').notNull().default(10),
  ramadan_silence_during_taraweeh: integer('ramadan_silence_during_taraweeh', { mode: 'boolean' }).notNull().default(true),
  active_eid_type: text('active_eid_type').notNull().default('none'), // 'none' | 'eid_ul_fitr' | 'eid_ul_adha'
  active_eid_date: text('active_eid_date'), // YYYY-MM-DD
  eid_auto_hide_minutes: integer('eid_auto_hide_minutes').notNull().default(60),
  eid_friday_note: text('eid_friday_note'),
  updated_at: text('updated_at').notNull(),
});

export const postersTable = sqliteTable(
  'posters',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    image_path: text('image_path').notNull(),
    media_type: text('media_type').notNull().default('image'), // 'image' | 'video'
    video_loop_count: integer('video_loop_count').notNull().default(1),
    video_duration_seconds: real('video_duration_seconds'),
    thumbnail_path: text('thumbnail_path'), // WebP thumbnail snapshot
    allow_audio: integer('allow_audio', { mode: 'boolean' }).notNull().default(false),
    qr_url: text('qr_url'),
    qr_label: text('qr_label'),
    qr_position: text('qr_position').notNull().default('bottom-left'), // 'bottom-left' | 'top-left' | 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right'
    qr_start_at: text('qr_start_at'), // ISO 8601 or null
    qr_end_at: text('qr_end_at'), // ISO 8601 or null
    start_at: text('start_at').notNull(), // ISO 8601
    end_at: text('end_at'), // ISO 8601 or null for indefinite
    duration_seconds: integer('duration_seconds').notNull().default(15),
    display_order: integer('display_order').notNull().default(0),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    layout_config: text('layout_config'), // JSON serialized PosterLayoutConfig
    recurring_schedule: text('recurring_schedule'), // JSON serialized RecurringSchedule
    created_at: text('created_at').notNull(),
  },
  (table) => [
    index('idx_posters_active_schedule').on(table.is_active, table.start_at, table.end_at),
  ]
);

export const prayerOverridesTable = sqliteTable(
  'prayer_overrides',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(), // YYYY-MM-DD
    prayer: text('prayer').notNull(), // fajr, sunrise, dhuhr, asr, maghrib, isha
    adhan_override: text('adhan_override'), // HH:mm
    iqamah_time: text('iqamah_time').notNull(), // HH:mm
    updated_at: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_prayer_overrides_date_prayer').on(table.date, table.prayer),
  ]
);

export const prayerRulesTable = sqliteTable('prayer_rules', {
  id: text('id').primaryKey(),
  prayer: text('prayer').notNull(), // fajr, dhuhr, asr, maghrib, isha
  rule_type: text('rule_type').notNull(), // OFFSET | FIXED
  offset_minutes: integer('offset_minutes'),
  fixed_time: text('fixed_time'), // HH:mm
  updated_at: text('updated_at').notNull(),
});

export const annualSchedulesTable = sqliteTable(
  'annual_schedules',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(), // YYYY-MM-DD
    fajr_adhan: text('fajr_adhan'),
    sunrise: text('sunrise'),
    dhuhr_adhan: text('dhuhr_adhan'),
    asr_adhan: text('asr_adhan'),
    maghrib_adhan: text('maghrib_adhan'),
    isha_adhan: text('isha_adhan'),
    fajr_iqamah: text('fajr_iqamah'),
    dhuhr_iqamah: text('dhuhr_iqamah'),
    asr_iqamah: text('asr_iqamah'),
    maghrib_iqamah: text('maghrib_iqamah'),
    isha_iqamah: text('isha_iqamah'),
    updated_at: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_annual_schedules_date').on(table.date),
  ]
);

export const jummahShiftsTable = sqliteTable(
  'jummah_shifts',
  {
    id: text('id').primaryKey(),
    shift_number: integer('shift_number').notNull(),
    khateeb_name: text('khateeb_name').notNull(),
    adhan_time: text('adhan_time').notNull(), // HH:mm
    iqamah_time: text('iqamah_time'), // HH:mm (optional)
    location: text('location'),
    language: text('language'),
    topic: text('topic'),
    status: text('status').notNull().default('UPCOMING'), // UPCOMING | KHUTBAH_IN_PROGRESS | STARTING_NOW | COMPLETED
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [
    index('idx_jummah_shifts_number').on(table.shift_number),
  ]
);

export const fridayKhateebRosterTable = sqliteTable(
  'friday_khateeb_roster',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(), // YYYY-MM-DD
    shift_id: text('shift_id').notNull(),
    khateeb_name: text('khateeb_name').notNull(),
    topic: text('topic'),
    created_at: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_friday_khateeb_roster_date_shift').on(table.date, table.shift_id),
  ]
);

export const eidShiftsTable = sqliteTable(
  'eid_shifts',
  {
    id: text('id').primaryKey(),
    eid_type: text('eid_type').notNull(), // 'eid_ul_fitr' | 'eid_ul_adha'
    shift_number: integer('shift_number').notNull(),
    takbeerat_time: text('takbeerat_time').notNull(), // HH:mm
    salah_time: text('salah_time').notNull(), // HH:mm
    khateeb_name: text('khateeb_name'),
    location: text('location'),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at').notNull(),
  },
  (table) => [
    index('idx_eid_shifts_type_number').on(table.eid_type, table.shift_number),
  ]
);

export const tickerMessagesTable = sqliteTable('ticker_messages', {
  id: text('id').primaryKey(),
  message: text('message').notNull(),
  priority: integer('priority').notNull().default(0),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  start_at: text('start_at'),
  end_at: text('end_at'),
  created_at: text('created_at').notNull(),
});

export const displayPairingCodesTable = sqliteTable('display_pairing_codes', {
  id: text('id').primaryKey(),
  code_hash: text('code_hash').notNull(),
  created_at: text('created_at').notNull(),
  expires_at: text('expires_at').notNull(),
  consumed_at: text('consumed_at'),
});

export const authRateLimitsTable = sqliteTable('auth_rate_limits', {
  client_key: text('client_key').primaryKey(),
  failed_attempts: integer('failed_attempts').notNull().default(0),
  lockout_tier: integer('lockout_tier').notNull().default(0),
  locked_until: integer('locked_until'), // epoch ms
  updated_at: integer('updated_at').notNull(),
});

export type DbSettings = typeof settingsTable.$inferSelect;
export type DbPoster = typeof postersTable.$inferSelect;
export type DbPrayerOverride = typeof prayerOverridesTable.$inferSelect;
export type DbPrayerRule = typeof prayerRulesTable.$inferSelect;
export type DbAnnualSchedule = typeof annualSchedulesTable.$inferSelect;
export type DbJummahShift = typeof jummahShiftsTable.$inferSelect;
export type DbFridayKhateebRoster = typeof fridayKhateebRosterTable.$inferSelect;
export type DbEidShift = typeof eidShiftsTable.$inferSelect;
export type DbTickerMessage = typeof tickerMessagesTable.$inferSelect;
export type DbDisplayPairingCode = typeof displayPairingCodesTable.$inferSelect;
export type DbAuthRateLimit = typeof authRateLimitsTable.$inferSelect;
