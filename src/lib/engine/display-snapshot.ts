/**
 * Deterministic Display Snapshot Reducer
 * MosqueSignage (TV)
 */

import type {
  DisplayState,
  DrawerType,
  EidShift,
  HeaderState,
  JummahShift,
  MiniPillState,
  Poster,
  PrayerTimesToday,
  QrCardState,
  PublicDisplaySettings,
  Settings,
} from '@/types/index';
import { formatHijriDate } from '@/lib/prayer/hijri';
import { parseTimeToDate, resolveNextPrayer } from '@/lib/prayer/prayer-engine';
import { getActivePosters } from './poster-status';
import { formatClockTime, isFriday, resolveJummahShifts } from './jummah-resolver';
import { isSystemClockSynchronized, timeToMinutes } from '@/lib/utils/time';
import { isPosterQrActive } from '@/lib/posters/qr-schedule';
import {
  getNightPrayerTypeLabel,
  normalizeNightPrayerSession,
  resolveRamadanVisibility,
} from '@/lib/prayer/ramadan-visibility';

export interface DisplaySnapshotOptions {
  readonly forceDrawerOpen?: boolean | undefined;
  readonly eidShifts?: readonly EidShift[] | undefined;
  readonly forceEid?: boolean | undefined;
}

function isEidScheduleActive(
  settings: PublicDisplaySettings | Settings,
  eidShifts: readonly EidShift[],
  now: Date,
  timezone: string,
  forceEid?: boolean
): boolean {
  if (forceEid) return true;
  if (eidShifts.length === 0) return false;

  if (!settings.active_eid_type || settings.active_eid_type === 'none') return false;
  if (!settings.active_eid_date) return false;

  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  if (todayIso !== settings.active_eid_date) return false;

  const sorted = [...eidShifts].sort((a, b) => a.shift_number - b.shift_number);
  const lastShift = sorted[sorted.length - 1];
  if (!lastShift) return false;

  const autoHideMs = (settings.eid_auto_hide_minutes ?? 60) * 60 * 1000;
  const lastEndMs = parseTimeToDate(lastShift.salah_time, now, timezone).getTime() + autoHideMs;
  return now.getTime() <= lastEndMs;
}

function buildEidTargetTelemetry(
  eidShifts: readonly EidShift[],
  now: Date,
  timezone: string,
  silenceDurationMinutes: number
): MiniPillState | null {
  const sorted = [...eidShifts].sort((a, b) => a.shift_number - b.shift_number);
  const durationMs = silenceDurationMinutes * 60 * 1000;
  const nowMs = now.getTime();

  for (let i = 0; i < sorted.length; i++) {
    const shift = sorted[i]!;
    const salahDate = parseTimeToDate(shift.salah_time, now, timezone);
    const salahMs = salahDate.getTime();

    if (nowMs < salahMs) {
      const totalSec = Math.max(0, Math.floor((salahMs - nowMs) / 1000));
      return {
        prayer_name: sorted.length > 1 ? `Eid Salah ${i + 1}` : 'Eid Salah',
        time_display: shift.salah_time,
        minutes_remaining: Math.ceil(totalSec / 60),
        seconds_remaining: totalSec,
        target_iso: salahDate.toISOString(),
        status: 'COUNTDOWN',
      };
    }

    if (nowMs < salahMs + durationMs) {
      return {
        prayer_name: 'Eid',
        time_display: shift.salah_time,
        minutes_remaining: 0,
        seconds_remaining: 0,
        target_iso: salahDate.toISOString(),
        status: 'STARTING_NOW',
      };
    }
  }

  return null;
}

function getEffectiveShiftTime(shift: JummahShift): string {
  return shift.iqamah_time && shift.iqamah_time.trim().length > 0
    ? shift.iqamah_time
    : shift.adhan_time;
}

function resolveDrawerType(
  isDrawerOpen: boolean,
  isEidActive: boolean,
  isFri: boolean,
  isFajrFinished: boolean,
  resolvedJummahShifts: readonly JummahShift[],
  silenceDurationMs: number,
  now: Date,
  timezone: string
): DrawerType {
  if (!isDrawerOpen) return null;
  if (isEidActive) return 'EID';
  if (!isFri || resolvedJummahShifts.length === 0) return 'DAILY_PRAYER';

  const lastShift = [...resolvedJummahShifts].sort((a, b) => b.shift_number - a.shift_number)[0];
  const lastShiftTime = lastShift
    ? parseTimeToDate(getEffectiveShiftTime(lastShift), now, timezone).getTime() + silenceDurationMs
    : Number.POSITIVE_INFINITY;

  return isFajrFinished && now.getTime() <= lastShiftTime ? 'JUMMAH' : 'DAILY_PRAYER';
}

function buildFridayTargetTelemetry(target: JummahShift, now: Date, timezone: string): MiniPillState {
  const hasSalahTime = Boolean(target.iqamah_time && target.iqamah_time.trim().length > 0);
  const effectiveTime = target.status === 'KHUTBAH_IN_PROGRESS'
    ? target.iqamah_time?.trim() ?? target.adhan_time
    : getEffectiveShiftTime(target);
  const targetDate = parseTimeToDate(effectiveTime, now, timezone);
  const totalSec = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
  
  let prayerName: string;
  let status: 'COUNTDOWN' | 'STARTING_NOW';

  if (target.status === 'KHUTBAH_IN_PROGRESS') {
    prayerName = `Khutbah ${target.shift_number}`;
    status = 'STARTING_NOW'; // Activates reverence overlay & pauses slides during sermon
  } else if (target.status === 'STARTING_NOW') {
    prayerName = hasSalahTime ? 'Jummah Prayer' : `Khutbah ${target.shift_number}`;
    status = 'STARTING_NOW';
  } else {
    prayerName = `Khutbah ${target.shift_number}`;
    status = 'COUNTDOWN';
  }

  return {
    prayer_name: prayerName,
    time_display: effectiveTime,
    minutes_remaining: Math.ceil(totalSec / 60),
    seconds_remaining: totalSec,
    target_iso: targetDate.toISOString(),
    status,
  };
}

function formatTwentyFourHour(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

function buildTaraweehTargetTelemetry(
  settings: PublicDisplaySettings | Settings,
  prayers: PrayerTimesToday,
  now: Date,
  timezone: string,
  allowTaraweehSilence: boolean
): MiniPillState | null {
  if (!allowTaraweehSilence) return null;
  if (!settings.show_prayer_silence_overlay) return null;
  if (settings.ramadan_silence_during_taraweeh === false) return null;

  const sessions =
    settings.ramadan_taraweeh_sessions && settings.ramadan_taraweeh_sessions.length > 0
      ? settings.ramadan_taraweeh_sessions.map(normalizeNightPrayerSession)
      : settings.ramadan_taraweeh_time
        ? [
            normalizeNightPrayerSession({
              session_number: 1,
              prayer_type: 'taraweeh',
              label: 'Taraweeh',
              time_mode: 'FIXED',
              offset_minutes: 0,
              fixed_time: settings.ramadan_taraweeh_time,
              rakats: '20',
              witr_mode: 'none',
            }),
          ]
        : [];

  if (sessions.length === 0) return null;

  const nowMs = now.getTime();
  const ishaIqamah = prayers.isha?.iqamah_time;
  const fajrAdhan = prayers.fajr?.adhan_time;
  const hasIsha = Boolean(ishaIqamah && ishaIqamah !== '--:--' && /^\d{1,2}:\d{2}$/.test(ishaIqamah));
  const hasFajr = Boolean(fajrAdhan && fajrAdhan !== '--:--' && /^\d{1,2}:\d{2}$/.test(fajrAdhan));
  const ishaDate = hasIsha ? parseTimeToDate(ishaIqamah!, now, timezone) : null;
  const anchorMins = hasIsha ? timeToMinutes(ishaIqamah!) : 1200;
  const fajrMins = hasFajr ? timeToMinutes(fajrAdhan!) : 360;
  const nightDuration = (fajrMins - anchorMins + 1440) % 1440 || 600;

  const resolvedOffsets: Array<{ session: (typeof sessions)[number]; nightOffsetMins: number; startMsCandidates: Array<{ startMs: number; timeDisplay: string }> }> = [];

  for (const session of sessions) {
    if (session.time_mode === 'OFFSET') {
      if (!ishaDate) continue;
      const offsetMins = Math.max(0, Number(session.offset_minutes) || 0);
      if (offsetMins >= nightDuration) continue;
      const offsetMs = offsetMins * 60 * 1000;
      const todayStart = ishaDate.getTime() + offsetMs;
      const yesterdayStart = todayStart - 86_400_000;
      resolvedOffsets.push({
        session,
        nightOffsetMins: offsetMins,
        startMsCandidates: [
          { startMs: todayStart, timeDisplay: formatTwentyFourHour(new Date(todayStart), timezone) },
          { startMs: yesterdayStart, timeDisplay: formatTwentyFourHour(new Date(yesterdayStart), timezone) },
        ],
      });
    } else {
      if (!session.fixed_time || !/^\d{1,2}:\d{2}$/.test(session.fixed_time)) continue;
      const fixedMins = timeToMinutes(session.fixed_time);
      const nightOffset = (fixedMins - anchorMins + 1440) % 1440;
      if (nightOffset >= nightDuration) continue;
      const fixedDate = parseTimeToDate(session.fixed_time, now, timezone);
      resolvedOffsets.push({
        session,
        nightOffsetMins: nightOffset,
        startMsCandidates: [{ startMs: fixedDate.getTime(), timeDisplay: session.fixed_time }],
      });
    }
  }

  resolvedOffsets.sort((a, b) => a.nightOffsetMins - b.nightOffsetMins);

  for (let i = 0; i < resolvedOffsets.length; i++) {
    const current = resolvedOffsets[i]!;
    const next = resolvedOffsets[i + 1];
    const durationMins = current.session.duration_minutes ?? 45;
    const maxBeforeFajrMins = Math.max(0, nightDuration - current.nightOffsetMins);
    const maxBeforeNextMins = next ? Math.max(0, next.nightOffsetMins - current.nightOffsetMins) : Number.POSITIVE_INFINITY;
    const effectiveDurationMs = Math.min(durationMins, maxBeforeFajrMins, maxBeforeNextMins) * 60 * 1000;

    if (effectiveDurationMs <= 0) continue;

    for (const candidate of current.startMsCandidates) {
      if (nowMs >= candidate.startMs && nowMs < candidate.startMs + effectiveDurationMs) {
        const typeLabel = getNightPrayerTypeLabel(current.session.prayer_type);
        return {
          prayer_name: current.session.label?.trim() || typeLabel,
          time_display: candidate.timeDisplay,
          minutes_remaining: 0,
          seconds_remaining: 0,
          target_iso: new Date(candidate.startMs).toISOString(),
          status: 'STARTING_NOW',
        };
      }
    }
  }

  return null;
}

function buildDailyPrayerTelemetry(
  settings: Settings,
  prayers: PrayerTimesToday,
  skipDhuhr: boolean,
  now: Date
): MiniPillState {
  const adjusted = skipDhuhr
    ? { ...prayers, dhuhr: { ...prayers.dhuhr, iqamah_time: '00:00' } }
    : prayers;
  const resolved = resolveNextPrayer(adjusted, now, {
    timezone: settings.timezone,
    startingNowDurationMinutes: settings.prayer_starting_now_duration_minutes,
  });
  const totalSec = Math.max(0, Math.floor((resolved.target_date.getTime() - now.getTime()) / 1000));
  return {
    prayer_name: resolved.prayer_name,
    time_display: resolved.time_display,
    minutes_remaining: Math.ceil(totalSec / 60),
    seconds_remaining: totalSec,
    target_iso: resolved.target_date.toISOString(),
    status: resolved.status,
  };
}

function resolveQrCardState(
  activePoster: Poster | null,
  isDrawerOpen: boolean,
  showDuringDrawer?: boolean,
  now?: Date
): QrCardState | null {
  if (isDrawerOpen && !showDuringDrawer) return null;
  if (!activePoster?.qr_url || activePoster.qr_url.trim().length === 0) return null;
  if (now && !isPosterQrActive(activePoster, now)) return null;
  return {
    url: activePoster.qr_url,
    label: activePoster.qr_label ?? 'Scan to Learn More',
    position: activePoster.qr_position ?? 'bottom-left',
  };
}

function buildHeaderState(settings: Settings, now: Date): HeaderState {
  const isClockUnsynced = !isSystemClockSynchronized(now);
  const gregorian = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  return {
    hijri_date: formatHijriDate(now, settings.hijri_offset_days, { timezone: settings.timezone }),
    gregorian_date: gregorian,
    date_format: settings.date_format ?? 'both',
    clock_time: formatClockTime(now, settings.timezone, {
      showSeconds: Boolean(settings.clock_show_seconds),
      timeFormat: settings.clock_time_format,
    }),
    ticker: settings.ticker_text,
    is_clock_unsynchronized: isClockUnsynced,
  };
}

export function computeDisplaySnapshot(
  settings: PublicDisplaySettings | Settings,
  posters: readonly Poster[],
  prayers: PrayerTimesToday,
  jummahShifts: readonly JummahShift[],
  currentSlideIndex: number = 0,
  lastDrawerTrigger: Date,
  now: Date,
  options?: DisplaySnapshotOptions
): DisplayState {
  const timezone = settings.timezone;
  const activePosters = getActivePosters(posters, now, timezone);
  const activePoster =
    activePosters.length > 0 ? activePosters[currentSlideIndex % activePosters.length] ?? null : null;

  const elapsedMs = now.getTime() - lastDrawerTrigger.getTime();
  const isDrawerOpen =
    options?.forceDrawerOpen ?? (elapsedMs >= 0 && elapsedMs < settings.drawer_display_seconds * 1000);

  const resolvedShifts = resolveJummahShifts(
    jummahShifts,
    now,
    timezone,
    settings.prayer_starting_now_duration_minutes
  );
  const isFri = isFriday(now, timezone);
  const silenceMs = (settings.prayer_starting_now_duration_minutes ?? 10) * 60 * 1000;
  const isFajrFinished =
    !prayers.fajr?.iqamah_time || prayers.fajr.iqamah_time === '--:--'
      ? true
      : now.getTime() >= parseTimeToDate(prayers.fajr.iqamah_time, now, timezone).getTime() + silenceMs;

  const eidShiftsList = options?.eidShifts ?? [];
  const isEidActive = isEidScheduleActive(settings, eidShiftsList, now, timezone, options?.forceEid);
  const eidTarget =
    isEidActive && eidShiftsList.length > 0
      ? buildEidTargetTelemetry(eidShiftsList, now, timezone, settings.prayer_starting_now_duration_minutes ?? 10)
      : null;

  const fridayTarget =
    isFri && resolvedShifts.length > 0 && isFajrFinished
      ? resolvedShifts.find((s) => s.status === 'STARTING_NOW' || s.status === 'KHUTBAH_IN_PROGRESS' || s.status === 'UPCOMING')
      : undefined;

  const allFridayShiftsCompleted = isFri && resolvedShifts.length > 0 && isFajrFinished && !fridayTarget;
  const hasDailyTimings =
    (typeof settings.latitude === 'number' && typeof settings.longitude === 'number') ||
    (Boolean(prayers.asr?.iqamah_time) && prayers.asr.iqamah_time !== '--:--');

  const baseNextPrayer = eidTarget
    ? eidTarget
    : fridayTarget
      ? buildFridayTargetTelemetry(fridayTarget, now, timezone)
      : allFridayShiftsCompleted && !hasDailyTimings
        ? null
        : buildDailyPrayerTelemetry(settings, prayers, isFri && resolvedShifts.length > 0 && isFajrFinished, now);

  const ramadanVisibility = resolveRamadanVisibility(settings, now, prayers.maghrib?.adhan_time);

  const taraweehSilenceTarget =
    baseNextPrayer?.status === 'STARTING_NOW'
      ? null
      : buildTaraweehTargetTelemetry(
          settings,
          prayers,
          now,
          timezone,
          ramadanVisibility.showTaraweehSilence
        );

  const rawNextPrayer = taraweehSilenceTarget ?? baseNextPrayer;

  const isClockUnsynced = !isSystemClockSynchronized(now);
  const nextPrayerInfo: MiniPillState | null = rawNextPrayer
    ? {
        ...rawNextPrayer,
        status: isClockUnsynced && rawNextPrayer.status === 'STARTING_NOW' ? 'COUNTDOWN' : rawNextPrayer.status,
      }
    : null;

  return {
    active_poster: activePoster,
    is_drawer_open: isDrawerOpen,
    drawer_type: resolveDrawerType(isDrawerOpen, isEidActive, isFri, isFajrFinished, resolvedShifts, silenceMs, now, timezone),
    mini_pill: isDrawerOpen ? null : nextPrayerInfo,
    next_prayer: nextPrayerInfo,
    qr_card: resolveQrCardState(activePoster, isDrawerOpen, settings.show_qr_during_drawer, now),
    header: buildHeaderState(settings, now),
    resolved_jummah_shifts: resolvedShifts,
    ramadan_visibility: ramadanVisibility,
  };
}
