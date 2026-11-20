import type {
  AudioReceiverProtocol,
  DateDisplayMode,
  DisplayResolution,
  MiniPrayerPillPosition,
  PosterFitMode,
  PosterTransitionType,
  PowerScheduleMode,
  Settings,
  SidebarAccentTheme,
  SidebarMode,
  SidebarPosition,
  StandbyAppearance,
  TvControlProtocol,
  UpdateVenueSettingsInput,
  VenueSettingsCategory,
} from '@/types/index';

export interface VenueSettingsDraft {
  greeting: string;
  mosqueName: string;
  tickerText: string;
  timezone: string;
  dateFormat: DateDisplayMode;
  posterTransition: PosterTransitionType;
  posterFit: PosterFitMode;
  displayResolution: DisplayResolution;
  overscanMarginPercent: number;
  hijriOffset: number;
  drawerInterval: number;
  drawerDuration: number;
  showAdhanTimes: boolean;
  calculationMethod: string;
  madhab: 'shafi' | 'hanafi';
  latitude: number | null;
  longitude: number | null;
  sidebarMode: SidebarMode;
  showProgressBar: boolean;
  showMiniPrayerPill: boolean;
  showPrayerSilenceOverlay: boolean;
  miniPrayerPillPosition: MiniPrayerPillPosition;
  sidebarPosition: SidebarPosition;
  sidebarAccentTheme: SidebarAccentTheme;
  rememberedPeriodicDelay: number;
  qrReadDelay: number;
  showQrDuringDrawer: boolean;
  startingNowDuration: number;
  tvAutoPower: boolean;
  powerOnTime: string;
  powerOffTime: string;
  powerScheduleMode: PowerScheduleMode;
  powerFajrOffset: number;
  powerIshaOffset: number;
  tvControlProtocol: TvControlProtocol;
  standbyAppearance: StandbyAppearance;
  standbyShowAttribution: boolean;
  audioMuteDuringPrayer: boolean;
  audioReceiverHost: string;
  audioReceiverPort: number;
  audioReceiverProtocol: AudioReceiverProtocol;
  audioMuteDelay: number;
}

export function resolveVenueSettingsCategory(sub?: string): VenueSettingsCategory {
  const s = sub?.toUpperCase();
  if (s === 'ASTRONOMY' || s === 'DISPLAY' || s === 'MAINTENANCE' || s === 'SECURITY' || s === 'IDENTITY') return s;
  return 'IDENTITY';
}

export function buildDraftFromSettings(s: Settings): VenueSettingsDraft {
  const initialDelay = s.qr_entrance_delay_seconds ?? 3;
  const isAlwaysOpen = s.sidebar_mode === 'always_open';
  return {
    greeting: s.header_greeting ?? 'Welcome to',
    mosqueName: s.mosque_name,
    tickerText: s.ticker_text,
    timezone: s.timezone,
    dateFormat: s.date_format ?? 'both',
    posterTransition: s.poster_transition ?? 'fade',
    posterFit: s.poster_fit ?? 'contain',
    displayResolution: s.display_resolution ?? '1080p',
    overscanMarginPercent: s.overscan_margin_percent ?? 0,
    hijriOffset: s.hijri_offset_days,
    drawerInterval: s.drawer_interval_minutes || 3,
    drawerDuration: s.drawer_display_seconds || 15,
    showAdhanTimes: s.show_adhan_times ?? true,
    calculationMethod: s.calculation_method ?? 'NorthAmerica',
    madhab: s.madhab ?? 'shafi',
    latitude: typeof s.latitude === 'number' ? s.latitude : null,
    longitude: typeof s.longitude === 'number' ? s.longitude : null,
    sidebarMode: s.sidebar_mode ?? 'drawer',
    showProgressBar: s.show_progress_bar ?? true,
    showMiniPrayerPill: Boolean(s.show_mini_prayer_pill),
    showPrayerSilenceOverlay: Boolean(s.show_prayer_silence_overlay),
    miniPrayerPillPosition: s.mini_prayer_pill_position ?? 'bottom-right',
    sidebarPosition: s.sidebar_position ?? 'right',
    sidebarAccentTheme: s.sidebar_accent_theme ?? 'teal',
    rememberedPeriodicDelay: initialDelay > 0 ? initialDelay : 3,
    qrReadDelay: isAlwaysOpen ? 0 : initialDelay,
    showQrDuringDrawer: Boolean(s.show_qr_during_drawer),
    startingNowDuration: s.prayer_starting_now_duration_minutes ?? 15,
    tvAutoPower: Boolean(s.tv_auto_power),
    powerOnTime: s.power_on_time ?? '05:00',
    powerOffTime: s.power_off_time ?? '23:00',
    powerScheduleMode: s.power_schedule_mode ?? 'fixed',
    powerFajrOffset: Math.abs(s.power_fajr_offset_minutes ?? 45),
    powerIshaOffset: Math.abs(s.power_isha_offset_minutes ?? 45),
    tvControlProtocol: s.tv_control_protocol ?? 'software_blackout',
    standbyAppearance: s.standby_appearance ?? 'dim_clock',
    standbyShowAttribution: Boolean(s.standby_show_attribution),
    audioMuteDuringPrayer: Boolean(s.audio_mute_during_prayer),
    audioReceiverHost: s.audio_receiver_host ?? '',
    audioReceiverPort: s.audio_receiver_port ?? 23,
    audioReceiverProtocol: s.audio_receiver_protocol ?? 'denon_telnet',
    audioMuteDelay: s.audio_mute_delay_seconds ?? 0,
  };
}

export function buildUpdatePayloadFromDraft(draft: VenueSettingsDraft): UpdateVenueSettingsInput {
  return {
    header_greeting: draft.greeting,
    mosque_name: draft.mosqueName.trim(),
    timezone: draft.timezone.trim(),
    hijri_offset_days: draft.hijriOffset,
    drawer_interval_minutes: draft.drawerInterval,
    drawer_display_seconds: draft.drawerDuration,
    prayer_starting_now_duration_minutes: draft.startingNowDuration,
    show_adhan_times: draft.showAdhanTimes,
    date_format: draft.dateFormat,
    poster_transition: draft.posterTransition,
    poster_fit: draft.posterFit,
    display_resolution: draft.displayResolution,
    overscan_margin_percent: draft.overscanMarginPercent,
    sidebar_mode: draft.sidebarMode,
    show_progress_bar: draft.showProgressBar,
    show_mini_prayer_pill: draft.showMiniPrayerPill,
    show_prayer_silence_overlay: draft.showPrayerSilenceOverlay,
    mini_prayer_pill_position: draft.miniPrayerPillPosition,
    sidebar_position: draft.sidebarPosition,
    sidebar_accent_theme: draft.sidebarAccentTheme,
    qr_entrance_delay_seconds:
      draft.sidebarMode === 'always_open' ? draft.rememberedPeriodicDelay : draft.qrReadDelay,
    show_qr_during_drawer: draft.showQrDuringDrawer,
    calculation_method: draft.calculationMethod,
    madhab: draft.madhab,
    latitude: draft.latitude,
    longitude: draft.longitude,
    tv_auto_power: draft.tvAutoPower,
    power_on_time: draft.powerOnTime,
    power_off_time: draft.powerOffTime,
    power_schedule_mode: draft.powerScheduleMode,
    power_fajr_offset_minutes: draft.powerFajrOffset,
    power_isha_offset_minutes: draft.powerIshaOffset,
    tv_control_protocol: draft.tvControlProtocol,
    standby_appearance: draft.standbyAppearance,
    standby_show_attribution: draft.standbyShowAttribution,
    audio_mute_during_prayer: draft.audioMuteDuringPrayer,
    audio_receiver_host: draft.audioReceiverHost.trim(),
    audio_receiver_port: draft.audioReceiverPort,
    audio_receiver_protocol: draft.audioReceiverProtocol,
    audio_mute_delay_seconds: draft.audioMuteDelay,
  };
}

