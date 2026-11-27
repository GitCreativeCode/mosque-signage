/**
 * Pure Settings Row Mapper & Update Payload Validator
 * MosqueSignage (TV)
 */

import type {
  ActiveEidType,
  AudioReceiverProtocol,
  DateDisplayMode,
  DisplayResolution,
  HighLatitudeRule,
  MiniPrayerPillPosition,
  NightPrayerType,
  PosterFitMode,
  PosterTransitionType,
  PowerScheduleMode,
  PublicDisplaySettings,
  Settings,
  SidebarAccentTheme,
  SilenceScreenAccentTheme,
  StandbyAppearance,
  TaraweehRakats,
  TaraweehSession,
  TaraweehTimeMode,
  TaraweehWitrMode,
  TvControlProtocol,
  UpdateVenueSettingsInput,
} from '@/types/index';
import type { settingsTable } from './schema';
import { verifyPin } from '../auth/crypto';

export type RawSettingsRow = typeof settingsTable.$inferSelect | undefined;

export const ADHAN_OFFSET_KEYS: readonly (keyof UpdateVenueSettingsInput)[] = [
  'fajr_adhan_offset_minutes',
  'sunrise_adhan_offset_minutes',
  'dhuhr_adhan_offset_minutes',
  'asr_adhan_offset_minutes',
  'maghrib_adhan_offset_minutes',
  'isha_adhan_offset_minutes',
];

export function validateSettingsBoundaries(input: UpdateVenueSettingsInput): void {
  if (input.hijri_offset_days !== undefined) {
    if (input.hijri_offset_days < -2 || input.hijri_offset_days > 2) {
      throw new Error('Hijri offset must be between -2 and +2 days.');
    }
  }
  for (const key of ADHAN_OFFSET_KEYS) {
    const val = input[key];
    if (typeof val === 'number' && (val < -30 || val > 30)) {
      throw new Error('Adhan offsets must be between -30 and +30 minutes.');
    }
  }
}

function parseTaraweehSessions(
  rawJson: string | null | undefined,
  fallbackTime: string | null | undefined,
  fallbackRakats: string | null | undefined
): readonly TaraweehSession[] {
  if (rawJson && rawJson.trim().length > 0) {
    try {
      const parsed: unknown = JSON.parse(rawJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: unknown, idx: number) => {
          const obj = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>;
          const timeMode: TaraweehTimeMode = obj.time_mode === 'FIXED' ? 'FIXED' : 'OFFSET';
          const rakatsRaw = String(obj.rakats ?? '20');
          const typeRaw = typeof obj.prayer_type === 'string' ? obj.prayer_type : '';
          const prayer_type: NightPrayerType =
            typeRaw === 'qiyam' || typeRaw === 'tahajjud' || typeRaw === 'taraweeh'
              ? typeRaw
              : rakatsRaw === 'Qiyam'
                ? 'qiyam'
                : 'taraweeh';
          const validNumericRakats = ['2', '4', '6', '8', '10', '12', '20'];
          const rakats: TaraweehRakats = validNumericRakats.includes(rakatsRaw)
            ? (rakatsRaw as TaraweehRakats)
            : rakatsRaw === 'Qiyam'
              ? '8'
              : '20';
          const witrRaw = String(obj.witr_mode ?? '2+1');
          const witr_mode: TaraweehWitrMode =
            witrRaw === 'none' || witrRaw === '2+1' || witrRaw === 'continuous_3' || witrRaw === '1'
              ? witrRaw
              : '2+1';
          const rawDur = Number(obj.duration_minutes);
          const defaultDur = prayer_type === 'taraweeh' && rakats === '20' ? 60 : 45;
          const duration_minutes =
            Number.isFinite(rawDur) && rawDur > 0 ? Math.min(180, Math.max(10, Math.round(rawDur))) : defaultDur;
          return {
            session_number: typeof obj.session_number === 'number' ? obj.session_number : idx + 1,
            prayer_type,
            label: typeof obj.label === 'string' && obj.label.trim() ? obj.label.trim() : undefined,
            time_mode: timeMode,
            offset_minutes: typeof obj.offset_minutes === 'number' ? Math.max(0, obj.offset_minutes) : 0,
            fixed_time: typeof obj.fixed_time === 'string' && obj.fixed_time.trim() ? obj.fixed_time.trim() : '21:30',
            rakats,
            witr_mode,
            duration_minutes,
          };
        });
      }
    } catch {
      // Fall through to legacy migration
    }
  }

  const trimmedTime = fallbackTime?.trim();
  const hasFixed = Boolean(trimmedTime && /^\d{1,2}:\d{2}$/.test(trimmedTime));
  const rakats: TaraweehRakats =
    fallbackRakats === '2' ||
    fallbackRakats === '4' ||
    fallbackRakats === '6' ||
    fallbackRakats === '8' ||
    fallbackRakats === '10' ||
    fallbackRakats === '12' ||
    fallbackRakats === '20'
      ? fallbackRakats
      : fallbackRakats === 'Qiyam'
        ? '8'
        : '20';
  const prayer_type: NightPrayerType = fallbackRakats === 'Qiyam' ? 'qiyam' : 'taraweeh';

  return [
    {
      session_number: 1,
      prayer_type,
      time_mode: hasFixed ? 'FIXED' : 'OFFSET',
      offset_minutes: 0,
      fixed_time: hasFixed && trimmedTime ? trimmedTime : '21:30',
      rakats,
      witr_mode: '2+1',
    },
  ];
}

export function buildSettingsUpdatePatch(
  input: UpdateVenueSettingsInput,
  nowIso: string
): Record<string, unknown> {
  const patch: Record<string, unknown> = { updated_at: nowIso };
  const trimFields: readonly (keyof UpdateVenueSettingsInput)[] = [
    'mosque_name',
    'header_greeting',
    'ticker_text',
    'timezone',
    'power_on_time',
    'power_off_time',
    'audio_receiver_host',
    'eid_friday_note',
  ];

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (key === 'ramadan_taraweeh_sessions') {
      patch[key] = Array.isArray(value) ? JSON.stringify(value) : value;
      continue;
    }
    if (key === 'mosque_name' || key === 'timezone' || key === 'power_on_time' || key === 'power_off_time') {
      if (typeof value === 'string' && value) patch[key] = value.trim();
      continue;
    }
    if (trimFields.includes(key as keyof UpdateVenueSettingsInput) && typeof value === 'string') {
      patch[key] = value.trim();
      continue;
    }
    patch[key] = value;
  }
  return patch;
}

export function mapSettingsRowToDomain(raw: RawSettingsRow): Settings {
  return {
    mosque_name: raw?.mosque_name ?? 'Islamic Community Center',
    header_greeting: raw?.header_greeting ?? 'Welcome to',
    ticker_text:
      raw?.ticker_text ??
      'Welcome to the Islamic Center • Please silence mobile phones upon entering the prayer hall',
    timezone: raw?.timezone ?? 'America/Toronto',
    hijri_offset_days: raw?.hijri_offset_days ?? 0,
    drawer_interval_minutes: raw?.drawer_interval_minutes ?? 3,
    drawer_display_seconds: raw?.drawer_display_seconds ?? 12,
    prayer_starting_now_duration_minutes: raw?.prayer_starting_now_duration_minutes ?? 10,
    show_adhan_times: raw?.show_adhan_times ?? true,
    date_format: (raw?.date_format as DateDisplayMode) ?? 'both',
    poster_transition: (raw?.poster_transition as PosterTransitionType) ?? 'fade',
    poster_fit: (raw?.poster_fit as PosterFitMode) ?? 'cover',
    display_resolution: (raw?.display_resolution as DisplayResolution) ?? '1080p',
    sidebar_mode: (raw?.sidebar_mode as Settings['sidebar_mode']) ?? 'hidden',
    sidebar_position: (raw?.sidebar_position as Settings['sidebar_position']) ?? 'right',
    sidebar_accent_theme: (raw?.sidebar_accent_theme as SidebarAccentTheme) ?? 'teal',
    qr_entrance_delay_seconds: raw?.qr_entrance_delay_seconds ?? 3,
    latitude: typeof raw?.latitude === 'number' ? raw.latitude : null,
    longitude: typeof raw?.longitude === 'number' ? raw.longitude : null,
    calculation_method: raw?.calculation_method ?? 'NorthAmerica',
    madhab: (raw?.madhab as 'shafi' | 'hanafi') ?? 'shafi',
    fajr_adhan_offset_minutes: raw?.fajr_adhan_offset_minutes ?? 0,
    sunrise_adhan_offset_minutes: raw?.sunrise_adhan_offset_minutes ?? 0,
    dhuhr_adhan_offset_minutes: raw?.dhuhr_adhan_offset_minutes ?? 0,
    asr_adhan_offset_minutes: raw?.asr_adhan_offset_minutes ?? 0,
    maghrib_adhan_offset_minutes: raw?.maghrib_adhan_offset_minutes ?? 0,
    isha_adhan_offset_minutes: raw?.isha_adhan_offset_minutes ?? 0,
    show_qr_during_drawer: Boolean(raw?.show_qr_during_drawer),
    has_admin_pin: Boolean(raw?.admin_pin_hash),
    tv_auto_power: Boolean(raw?.tv_auto_power),
    power_on_time: raw?.power_on_time ?? '05:00',
    power_off_time: raw?.power_off_time ?? '23:00',
    power_schedule_mode: (raw?.power_schedule_mode as PowerScheduleMode) ?? 'fixed',
    power_fajr_offset_minutes: raw?.power_fajr_offset_minutes ?? -45,
    power_isha_offset_minutes: raw?.power_isha_offset_minutes ?? 45,
    tv_control_protocol: (raw?.tv_control_protocol as TvControlProtocol) ?? 'software_blackout',
    standby_appearance: (raw?.standby_appearance as StandbyAppearance) ?? 'dim_clock',
    standby_show_attribution: Boolean(raw?.standby_show_attribution),
    audio_mute_during_prayer: Boolean(raw?.audio_mute_during_prayer),
    audio_receiver_host: raw?.audio_receiver_host ?? '',
    audio_receiver_port: raw?.audio_receiver_port ?? 23,
    audio_receiver_protocol: (raw?.audio_receiver_protocol as AudioReceiverProtocol) ?? 'denon_telnet',
    audio_mute_delay_seconds: raw?.audio_mute_delay_seconds ?? 0,
    show_mini_prayer_pill: Boolean(raw?.show_mini_prayer_pill),
    show_prayer_silence_overlay: Boolean(raw?.show_prayer_silence_overlay),
    silence_screen_subtitle: raw?.silence_screen_subtitle ?? 'Please switch mobile phones to silent',
    silence_screen_accent_theme: (raw?.silence_screen_accent_theme as SilenceScreenAccentTheme) ?? 'green',
    mini_prayer_pill_position: (raw?.mini_prayer_pill_position as MiniPrayerPillPosition) ?? 'bottom-right',
    show_progress_bar: raw?.show_progress_bar ?? true,
    poster_view_mode: (raw?.poster_view_mode as 'grid' | 'table') ?? 'grid',
    overscan_margin_percent: raw?.overscan_margin_percent ?? 0,
    clock_show_seconds: Boolean(raw?.clock_show_seconds),
    clock_time_format: (raw?.clock_time_format as '12h' | '24h') ?? '12h',
    display_access_mode: (raw?.display_access_mode as 'open' | 'pairing_required') ?? 'open',
    display_allow_localhost: raw?.display_allow_localhost !== undefined ? Boolean(raw.display_allow_localhost) : true,
    display_session_version: raw?.display_session_version ?? 1,
    auth_mode: (raw?.auth_mode as 'pin' | 'password') ?? 'pin',
    admin_username: raw?.admin_username ?? undefined,
    session_version: raw?.session_version ?? 1,
    is_default_pin_active: Boolean(
      raw?.admin_pin_hash &&
      raw?.admin_pin_salt &&
      verifyPin('1234', raw.admin_pin_salt, raw.admin_pin_hash)
    ),
    initial_setup_completed: Boolean(raw?.initial_setup_completed),
    terms_accepted: Boolean(raw?.terms_accepted),
    terms_accepted_at: raw?.terms_accepted_at ?? null,
    high_latitude_rule: (raw?.high_latitude_rule as HighLatitudeRule) ?? 'seventh_of_night',
    ramadan_mode_enabled: Boolean(raw?.ramadan_mode_enabled),
    ramadan_display_start_date: raw?.ramadan_display_start_date ?? null,
    ramadan_taraweeh_time: raw?.ramadan_taraweeh_time ?? null,
    ramadan_taraweeh_rakats: raw?.ramadan_taraweeh_rakats ?? '20',
    ramadan_taraweeh_sessions: parseTaraweehSessions(
      raw?.ramadan_taraweeh_sessions,
      raw?.ramadan_taraweeh_time,
      raw?.ramadan_taraweeh_rakats
    ),
    ramadan_suhoor_buffer_minutes: raw?.ramadan_suhoor_buffer_minutes ?? 10,
    ramadan_silence_during_taraweeh:
      raw?.ramadan_silence_during_taraweeh !== undefined
        ? Boolean(raw.ramadan_silence_during_taraweeh)
        : true,
    active_eid_type: (raw?.active_eid_type as ActiveEidType) ?? 'none',
    active_eid_date: raw?.active_eid_date ?? null,
    eid_auto_hide_minutes: raw?.eid_auto_hide_minutes ?? 60,
    eid_friday_note: raw?.eid_friday_note ?? null,
  };
}

export function mapDbSettingsToPublicDisplay(raw: RawSettingsRow): PublicDisplaySettings {
  const full = mapSettingsRowToDomain(raw);
  const {
    audio_receiver_host,
    audio_receiver_port,
    audio_receiver_protocol,
    audio_mute_during_prayer,
    audio_mute_delay_seconds,
    tv_control_protocol,
    has_admin_pin,
    initial_setup_completed,
    terms_accepted,
    terms_accepted_at,
    poster_view_mode,
    admin_username,
    session_version,
    ...publicSettings
  } = full;
  return publicSettings;
}

