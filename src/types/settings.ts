/**
 * Venue Settings, Hardware Automation & Ticker Contracts
 * MosqueSignage (TV)
 */

export type DateDisplayMode = 'both' | 'hijri' | 'gregorian';
export type PosterTransitionType = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'zoom';
export type PosterFitMode = 'contain' | 'cover';
export type DisplayResolution = '1080p' | '4k' | '1600x900' | '720p' | 'auto';
export type SidebarMode = 'drawer' | 'always_open' | 'hidden';
export type SidebarPosition = 'right' | 'left';
export type SidebarAccentTheme = 'blue' | 'gold' | 'teal' | 'slate';
export type MiniPrayerPillPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type PowerScheduleMode = 'fixed' | 'prayer_relative';
export type TvControlProtocol = 'hybrid' | 'software_blackout' | 'cec_client' | 'dpms';
export type StandbyAppearance = 'dim_clock' | 'pure_black';
export type AudioReceiverProtocol = 'denon_telnet' | 'yamaha_csvp' | 'http_webhook';

export type VenueSettingsCategory = 'IDENTITY' | 'ASTRONOMY' | 'DISPLAY' | 'MAINTENANCE' | 'SECURITY';

export interface PowerScheduleConfig {
  readonly tv_auto_power: boolean;
  readonly power_schedule_mode: PowerScheduleMode;
  readonly power_on_time: string;
  readonly power_off_time: string;
  readonly power_fajr_offset_minutes?: number | undefined;
  readonly power_isha_offset_minutes?: number | undefined;
}

export interface AudioReceiverConfig {
  readonly audio_mute_during_prayer: boolean;
  readonly audio_receiver_host: string;
  readonly audio_receiver_port: number;
  readonly audio_receiver_protocol: AudioReceiverProtocol;
  readonly audio_mute_delay_seconds?: number | undefined;
}

export interface HardwareCommandResult {
  readonly success: boolean;
  readonly method: string;
  readonly message: string;
  readonly timestamp: string;
}

export interface Settings {
  readonly mosque_name: string;
  readonly header_greeting?: string | undefined;
  readonly ticker_text: string;
  readonly timezone: string;
  readonly hijri_offset_days: number;
  readonly drawer_interval_minutes: number;
  readonly drawer_display_seconds: number;
  readonly prayer_starting_now_duration_minutes: number;
  readonly show_adhan_times?: boolean | undefined;
  readonly date_format?: DateDisplayMode | undefined;
  readonly poster_transition?: PosterTransitionType | undefined;
  readonly poster_fit?: PosterFitMode | undefined;
  readonly display_resolution?: DisplayResolution | undefined;
  readonly sidebar_mode?: SidebarMode | undefined;
  readonly sidebar_position?: SidebarPosition | undefined;
  readonly sidebar_accent_theme?: SidebarAccentTheme | undefined;
  readonly qr_entrance_delay_seconds?: number | undefined;
  readonly show_qr_during_drawer?: boolean | undefined;
  readonly latitude?: number | null | undefined;
  readonly longitude?: number | null | undefined;
  readonly calculation_method?: string | undefined;
  readonly madhab?: 'shafi' | 'hanafi' | undefined;
  readonly fajr_adhan_offset_minutes?: number | undefined;
  readonly sunrise_adhan_offset_minutes?: number | undefined;
  readonly dhuhr_adhan_offset_minutes?: number | undefined;
  readonly asr_adhan_offset_minutes?: number | undefined;
  readonly maghrib_adhan_offset_minutes?: number | undefined;
  readonly isha_adhan_offset_minutes?: number | undefined;
  readonly has_admin_pin?: boolean | undefined;
  readonly tv_auto_power?: boolean | undefined;
  readonly power_on_time?: string | undefined;
  readonly power_off_time?: string | undefined;
  readonly power_schedule_mode?: PowerScheduleMode | undefined;
  readonly power_fajr_offset_minutes?: number | undefined;
  readonly power_isha_offset_minutes?: number | undefined;
  readonly tv_control_protocol?: TvControlProtocol | undefined;
  readonly standby_appearance?: StandbyAppearance | undefined;
  readonly standby_show_attribution?: boolean | undefined;
  readonly audio_mute_during_prayer?: boolean | undefined;
  readonly audio_receiver_host?: string | undefined;
  readonly audio_receiver_port?: number | undefined;
  readonly audio_receiver_protocol?: AudioReceiverProtocol | undefined;
  readonly audio_mute_delay_seconds?: number | undefined;
  readonly show_mini_prayer_pill?: boolean | undefined;
  readonly show_prayer_silence_overlay?: boolean | undefined;
  readonly mini_prayer_pill_position?: MiniPrayerPillPosition | undefined;
  readonly show_progress_bar?: boolean | undefined;
  readonly poster_view_mode?: 'grid' | 'table' | undefined;
  readonly overscan_margin_percent?: number | undefined;
  readonly display_access_mode?: 'open' | 'pairing_required' | undefined;
  readonly display_allow_localhost?: boolean | undefined;
  readonly display_session_version?: number | undefined;
  readonly auth_mode?: 'pin' | 'password' | undefined;
  readonly admin_username?: string | undefined;
  readonly session_version?: number | undefined;
  readonly is_default_pin_active?: boolean | undefined;
  readonly initial_setup_completed?: boolean | undefined;
  readonly terms_accepted?: boolean | undefined;
  readonly terms_accepted_at?: string | null | undefined;
}

export type PublicDisplaySettings = Omit<
  Settings,
  | 'audio_receiver_host'
  | 'audio_receiver_port'
  | 'audio_receiver_protocol'
  | 'audio_mute_during_prayer'
  | 'audio_mute_delay_seconds'
  | 'tv_control_protocol'
  | 'has_admin_pin'
  | 'initial_setup_completed'
  | 'terms_accepted'
  | 'terms_accepted_at'
  | 'poster_view_mode'
  | 'admin_username'
  | 'session_version'
>;

export interface TickerMessage {
  readonly id: string;
  readonly message: string;
  readonly priority: number;
  readonly is_active: boolean;
}

export interface UpdateVenueSettingsInput {
  readonly mosque_name?: string | undefined;
  readonly header_greeting?: string | undefined;
  readonly timezone?: string | undefined;
  readonly hijri_offset_days?: number | undefined;
  readonly drawer_interval_minutes?: number | undefined;
  readonly drawer_display_seconds?: number | undefined;
  readonly prayer_starting_now_duration_minutes?: number | undefined;
  readonly show_adhan_times?: boolean | undefined;
  readonly date_format?: DateDisplayMode | undefined;
  readonly poster_transition?: PosterTransitionType | undefined;
  readonly poster_fit?: PosterFitMode | undefined;
  readonly display_resolution?: DisplayResolution | undefined;
  readonly sidebar_mode?: SidebarMode | undefined;
  readonly sidebar_position?: SidebarPosition | undefined;
  readonly sidebar_accent_theme?: SidebarAccentTheme | undefined;
  readonly qr_entrance_delay_seconds?: number | undefined;
  readonly show_qr_during_drawer?: boolean | undefined;
  readonly show_mini_prayer_pill?: boolean | undefined;
  readonly show_prayer_silence_overlay?: boolean | undefined;
  readonly mini_prayer_pill_position?: MiniPrayerPillPosition | undefined;
  readonly show_progress_bar?: boolean | undefined;
  readonly poster_view_mode?: 'grid' | 'table' | undefined;
  readonly overscan_margin_percent?: number | undefined;
  readonly latitude?: number | null | undefined;
  readonly longitude?: number | null | undefined;
  readonly calculation_method?: string | undefined;
  readonly madhab?: 'shafi' | 'hanafi' | undefined;
  readonly fajr_adhan_offset_minutes?: number | undefined;
  readonly sunrise_adhan_offset_minutes?: number | undefined;
  readonly dhuhr_adhan_offset_minutes?: number | undefined;
  readonly asr_adhan_offset_minutes?: number | undefined;
  readonly maghrib_adhan_offset_minutes?: number | undefined;
  readonly isha_adhan_offset_minutes?: number | undefined;
  readonly tv_auto_power?: boolean | undefined;
  readonly power_on_time?: string | undefined;
  readonly power_off_time?: string | undefined;
  readonly power_schedule_mode?: PowerScheduleMode | undefined;
  readonly power_fajr_offset_minutes?: number | undefined;
  readonly power_isha_offset_minutes?: number | undefined;
  readonly tv_control_protocol?: TvControlProtocol | undefined;
  readonly standby_appearance?: StandbyAppearance | undefined;
  readonly standby_show_attribution?: boolean | undefined;
  readonly audio_mute_during_prayer?: boolean | undefined;
  readonly audio_receiver_host?: string | undefined;
  readonly audio_receiver_port?: number | undefined;
  readonly audio_receiver_protocol?: AudioReceiverProtocol | undefined;
  readonly audio_mute_delay_seconds?: number | undefined;
  readonly ticker_text?: string | undefined;
  readonly display_access_mode?: 'open' | 'pairing_required' | undefined;
  readonly display_allow_localhost?: boolean | undefined;
  readonly display_session_version?: number | undefined;
  readonly auth_mode?: 'pin' | 'password' | undefined;
  readonly admin_username?: string | undefined;
  readonly session_version?: number | undefined;
  readonly initial_setup_completed?: boolean | undefined;
  readonly terms_accepted?: boolean | undefined;
  readonly terms_accepted_at?: string | null | undefined;
}

