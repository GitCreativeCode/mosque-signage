'use client';

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Moon,
  Monitor,
  VolumeX,
} from 'lucide-react';
import type {
  DisplayState,
  EidShift,
  JummahShift,
  Poster,
  PosterLayoutConfig,
  PrayerTimesToday,
  PublicDisplaySettings,
  Settings,
  TaraweehSession,
} from '@/types/index';
import { format12h } from '@/lib/utils/time';
import { sanitizeExternalUrl } from '@/lib/utils/url-safety';
import { isPosterQrActive } from '@/lib/posters/qr-schedule';
import { validateLayoutConfig } from '@/lib/posters/layout-engine';
import { getAccentTheme } from '@/lib/utils/accent-theme';
import { getNightPrayerTypeLabel, normalizeNightPrayerSession } from '@/lib/prayer/ramadan-visibility';
import { formatRemainingTime } from './MiniPrayerPill';
import { MultiAssetStageCanvas } from './MultiAssetStageCanvas';

export interface MobileCompanionDisplayProps {
  readonly settings: PublicDisplaySettings | Settings;
  readonly displayState: DisplayState;
  readonly currentPoster: Poster | null;
  readonly progressPercentage: number;
  readonly slideIndex: number;
  readonly activePostersCount: number;
  readonly prayers: PrayerTimesToday;
  readonly jummahShifts: readonly JummahShift[];
  readonly eidShifts: readonly EidShift[];
  readonly isStandby: boolean;
  readonly isDndActive: boolean;
  readonly silenceDetailLine: string | null;
  readonly isCoordinatesConfigured: boolean;
  readonly hasPrayerTiming: boolean;
  readonly onPrevPoster: () => void;
  readonly onNextPoster: () => void;
  readonly onWakeStandby: () => void;
  readonly onSwitchToTvPreview: () => void;
}

const DAILY_PRAYER_ROWS = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'sunrise', label: 'Sunrise' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
] as const;

function formatNightTiming(session: TaraweehSession): string {
  if (session.time_mode === 'OFFSET') {
    return session.offset_minutes === 0 ? 'After Isha' : `+${session.offset_minutes}m After Isha`;
  }
  return format12h(session.fixed_time);
}

/**
 * Mobile Companion Display View for phone/narrow screens (< 768px).
 * Reflows the 1080p broadcast into a readable vertical layout with slide controls,
 * tappable QR links, Congregation Silence & Standby handling, and Prayer/Jummah/Eid cards.
 */
export function MobileCompanionDisplay({
  settings,
  displayState,
  currentPoster,
  progressPercentage,
  slideIndex,
  activePostersCount,
  prayers,
  jummahShifts,
  eidShifts,
  isStandby,
  isDndActive,
  silenceDetailLine,
  isCoordinatesConfigured,
  hasPrayerTiming,
  onPrevPoster,
  onNextPoster,
  onWakeStandby,
  onSwitchToTvPreview,
}: MobileCompanionDisplayProps) {
  const accent = getAccentTheme(settings.sidebar_accent_theme ?? 'teal');
  const nextPrayer = displayState.next_prayer ?? displayState.mini_pill;
  const upcomingName = nextPrayer?.prayer_name?.toLowerCase() ?? '';
  const showQr = Boolean(currentPoster && isPosterQrActive(currentPoster) && currentPoster.qr_url);
  const safeQrHref = showQr && currentPoster?.qr_url ? sanitizeExternalUrl(currentPoster.qr_url) : null;
  const dateFormat = settings.date_format ?? 'both';
  const isHiddenMode = settings.sidebar_mode === 'hidden';
  const showAdhan = settings.show_adhan_times ?? true;
  const ramadanVisible = Boolean(displayState.ramadan_visibility?.showNightPrayers);

  const parsedLayout = useMemo(() => {
    if (!currentPoster?.layout_config) return null;
    try {
      const candidate: unknown = JSON.parse(currentPoster.layout_config);
      return validateLayoutConfig(candidate).valid ? (candidate as PosterLayoutConfig) : null;
    } catch {
      return null;
    }
  }, [currentPoster?.layout_config]);

  const nightSessions: TaraweehSession[] = useMemo(() => {
    if (!ramadanVisible) return [];
    if (settings.ramadan_taraweeh_sessions && settings.ramadan_taraweeh_sessions.length > 0) {
      return settings.ramadan_taraweeh_sessions.map(normalizeNightPrayerSession);
    }
    return [];
  }, [ramadanVisible, settings.ramadan_taraweeh_sessions]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#090b0f] text-white flex flex-col font-sans overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-[#0f131a]/95 backdrop-blur-md border-b border-white/10 px-3.5 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {settings.header_greeting && (
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold truncate">
                {settings.header_greeting}
              </p>
            )}
            <h1 className="text-sm font-extrabold tracking-tight text-white truncate">
              {settings.mosque_name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-400 mt-0.5">
              {(dateFormat === 'both' || dateFormat === 'hijri') && (
                <span className="text-emerald-400 font-medium">{displayState.header.hijri_date}</span>
              )}
              {dateFormat === 'both' && <span className="opacity-40">&bull;</span>}
              {(dateFormat === 'both' || dateFormat === 'gregorian') && (
                <span>{displayState.header.gregorian_date}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 space-y-1">
            <div className="flex items-center space-x-1.5">
              {displayState.header.is_clock_unsynchronized && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Clock</span>
                </span>
              )}
              <span className="font-mono font-extrabold text-lg tabular-nums tracking-tight text-white">
                {displayState.header.clock_time}
              </span>
            </div>
            <button
              type="button"
              onClick={onSwitchToTvPreview}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[10px] font-semibold text-neutral-200 flex items-center space-x-1 transition cursor-pointer"
            >
              <Monitor className="w-3 h-3" aria-hidden="true" />
              <span>16:9 TV Preview</span>
            </button>
          </div>
        </div>

        {displayState.header.ticker && (
          <div className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-neutral-200 leading-snug">
            {displayState.header.ticker}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-3.5 py-4 space-y-4">
        {isStandby && (
          <div className="p-5 rounded-2xl border border-white/10 bg-black text-center space-y-3">
            <Moon className="w-7 h-7 text-neutral-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Display in Scheduled Standby</p>
              <p className="text-xs text-neutral-400">
                The hall television is currently dimmed between Isha and Fajr.
              </p>
            </div>
            <button
              type="button"
              onClick={onWakeStandby}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white cursor-pointer transition"
            >
              Temporarily Wake Preview (60s)
            </button>
          </div>
        )}

        {isDndActive && !isStandby && (
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-black text-center space-y-2.5 shadow-lg">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <VolumeX className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              {displayState.next_prayer?.prayer_name ?? 'Congregational Prayer'} in Progress
            </h2>
            <p className="text-xs text-emerald-200/90">
              {settings.silence_screen_subtitle || 'Please switch mobile phones to silent'}
            </p>
            {silenceDetailLine && (
              <p className="text-[11px] text-neutral-300 font-medium">{silenceDetailLine}</p>
            )}
          </div>
        )}

        {!isDndActive && !isStandby && (
          <section aria-label="Active Announcement Slide" className="space-y-2.5">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-neutral-950 border border-white/15 shadow-xl flex items-center justify-center">
              {currentPoster ? (
                parsedLayout ? (
                  <MultiAssetStageCanvas poster={currentPoster} layout={parsedLayout} />
                ) : currentPoster.media_type === 'video' ? (
                  <video
                    key={currentPoster.id}
                    src={currentPoster.image_path}
                    poster={currentPoster.thumbnail_path ?? undefined}
                    autoPlay
                    muted={!currentPoster.allow_audio}
                    loop
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <>
                    {settings.poster_fit !== 'cover' && (
                      <img
                        src={currentPoster.image_path}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35"
                      />
                    )}
                    <img
                      src={currentPoster.image_path}
                      alt={currentPoster.title}
                      className={`relative z-10 w-full h-full ${
                        settings.poster_fit === 'cover' ? 'object-cover' : 'object-contain'
                      }`}
                    />
                  </>
                )
              ) : (
                <div className="text-center p-6 text-xs text-neutral-400">
                  No active slides scheduled right now.
                </div>
              )}

              {(settings.show_progress_bar ?? true) && currentPoster && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/15 z-20">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">
                  {currentPoster?.title ?? settings.mosque_name}
                </p>
                {activePostersCount > 1 && (
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Slide {slideIndex + 1} of {activePostersCount}
                  </p>
                )}
              </div>

              {activePostersCount > 1 && (
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onPrevPoster}
                    aria-label="Previous slide"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onNextPoster}
                    aria-label="Next slide"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition active:scale-95 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {safeQrHref && (
              <a
                href={safeQrHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs transition"
              >
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">
                    {currentPoster?.qr_label || 'Open Poster Link'}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-300 truncate block">
                    {safeQrHref.replace(/^https?:\/\//i, '')}
                  </span>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold shrink-0 inline-flex items-center space-x-1">
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            )}
          </section>
        )}

        {!isHiddenMode && (
          <section aria-label="Prayer Schedule" className="space-y-3 pt-1">
            {nextPrayer && (isCoordinatesConfigured || hasPrayerTiming) && (
              <div className={`p-4 rounded-2xl border ${accent.borderActive} ${accent.bgSubtle} flex items-center justify-between gap-3`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 block">
                    {nextPrayer.status === 'STARTING_NOW' ? 'Active Now' : 'Next Prayer'}
                  </span>
                  <span className="text-lg font-extrabold text-white">{nextPrayer.prayer_name}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-extrabold text-white block tabular-nums">
                    {nextPrayer.time_display}
                  </span>
                  <span className={`text-xs font-mono font-bold ${accent.textAccent}`}>
                    {nextPrayer.status === 'STARTING_NOW'
                      ? 'In Progress'
                      : formatRemainingTime(nextPrayer.seconds_remaining, nextPrayer.minutes_remaining)}
                  </span>
                </div>
              </div>
            )}

            {!isCoordinatesConfigured && !hasPrayerTiming ? (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 space-y-1">
                <p className="font-bold">Timetable Pending Configuration</p>
                <p className="text-[11px] text-amber-200/80">
                  Configure venue coordinates or import a schedule CSV in Admin Settings.
                </p>
              </div>
            ) : displayState.drawer_type === 'EID' && eidShifts.length > 0 ? (
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{settings.active_eid_type === 'eid_ul_adha' ? 'Eid al-Adha' : 'Eid al-Fitr'} Prayers</span>
                </h2>
                {eidShifts.map((shift, idx) => (
                  <div key={shift.id} className="p-3.5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Eid Prayer {idx + 1}</span>
                      <span className="font-mono text-xs text-emerald-400 font-bold">
                        Salah {format12h(shift.salah_time)}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-300 font-mono">
                      Takbeerat: {format12h(shift.takbeerat_time)}
                    </div>
                    {(shift.khateeb_name || shift.location) && (
                      <div className="text-[11px] text-neutral-400">
                        {[shift.khateeb_name, shift.location].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : displayState.drawer_type === 'JUMMAH' && jummahShifts.length > 0 ? (
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Friday Jummah Schedule</span>
                </h2>
                {jummahShifts.map((shift, idx) => (
                  <div key={shift.id} className="p-3.5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-white">Khutbah {idx + 1}</span>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {format12h(shift.adhan_time)}
                        {shift.iqamah_time ? ` • Salah ${format12h(shift.iqamah_time)}` : ''}
                      </span>
                    </div>
                    {shift.khateeb_name && (
                      <p className="text-xs text-neutral-200">{shift.khateeb_name}</p>
                    )}
                    {shift.topic && (
                      <p className="text-[11px] text-neutral-400 italic">{shift.topic}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Daily Prayer Times</span>
                  </span>
                  <span>{showAdhan ? 'Adhan / Iqamah' : 'Iqamah'}</span>
                </div>
                <div className="divide-y divide-white/10">
                  {DAILY_PRAYER_ROWS.map(({ key, label }) => {
                    if (key === 'sunrise') {
                      return (
                        <div key={key} className="px-4 py-2.5 flex items-center justify-between text-xs text-neutral-400">
                          <span>Sunrise (Shuruq)</span>
                          <span className="font-mono tabular-nums">{format12h(prayers.sunrise.adhan_time)}</span>
                        </div>
                      );
                    }
                    const slot = prayers[key];
                    const isNext = upcomingName === key;
                    return (
                      <div
                        key={key}
                        className={`px-4 py-3 flex items-center justify-between text-sm ${
                          isNext ? 'bg-emerald-500/15 font-bold text-white' : 'text-neutral-200'
                        }`}
                      >
                        <span>{label}</span>
                        <div className="font-mono tabular-nums flex items-center space-x-2 text-xs">
                          {showAdhan && (
                            <span className="text-neutral-400">{format12h(slot.adhan_time)}</span>
                          )}
                          {showAdhan && <span className="text-neutral-600">/</span>}
                          <span className="text-sm font-bold text-white">
                            {format12h(slot.iqamah_time)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {ramadanVisible && nightSessions.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/25 p-3.5 space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Taraweeh &amp; Night Prayers
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {nightSessions.map((sess) => (
                    <div key={sess.session_number} className="flex items-center justify-between text-xs bg-black/30 px-3 py-2 rounded-xl border border-white/10">
                      <span className="font-semibold text-white">
                        {sess.label?.trim() || getNightPrayerTypeLabel(sess.prayer_type)} ({sess.rakats}R)
                      </span>
                      <span className="font-mono font-bold text-emerald-300">
                        {formatNightTiming(sess)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
