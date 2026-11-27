import type { TaraweehSession } from '@/types/prayer';
import { format12h, timeToMinutes } from '@/lib/utils/time';
import { getNightPrayerTypeLabel, normalizeNightPrayerSession } from './ramadan-visibility';

function describeSessionTime(session: TaraweehSession): string {
  if (session.time_mode === 'OFFSET') {
    return session.offset_minutes === 0 ? 'Directly after Isha' : `+${session.offset_minutes}m after Isha`;
  }
  return format12h(session.fixed_time);
}

/**
 * Validates Taraweeh, Qiyam & Tahajjud sessions within the Islamic night window
 * (from Isha Iqamah across midnight 00:00 until Fajr Adhan).
 * - Rejects 'After Isha (+min)' whenever Isha Iqamah time is missing / unset (--:--).
 * - Prevents sessions before Isha, during daytime hours, or out of chronological night order.
 */
export function validateTaraweehSessions(
  sessions: readonly TaraweehSession[],
  ishaIqamah?: string | null,
  fajrAdhan?: string | null
): string | null {
  if (sessions.length === 0) return null;

  const hasIsha = Boolean(ishaIqamah && ishaIqamah !== '--:--' && /^\d{1,2}:\d{2}$/.test(ishaIqamah));
  const hasFajr = Boolean(fajrAdhan && fajrAdhan !== '--:--' && /^\d{1,2}:\d{2}$/.test(fajrAdhan));

  const anchorMins = hasIsha ? timeToMinutes(ishaIqamah!) : 1200; // Default 20:00 anchor if unconfigured
  const fajrMins = hasFajr ? timeToMinutes(fajrAdhan!) : 360; // Default 06:00 anchor if unconfigured
  const nightDuration = (fajrMins - anchorMins + 1440) % 1440 || 600;

  let prevOffset = -1;

  for (let i = 0; i < sessions.length; i++) {
    const s = normalizeNightPrayerSession(sessions[i]!);
    const num = i + 1;
    const typeLabel = getNightPrayerTypeLabel(s.prayer_type);
    let offsetMins: number;

    if (s.time_mode === 'OFFSET') {
      if (!hasIsha) {
        return `Session ${num} (${typeLabel}) uses "After Isha (+min)", but today's Isha Iqamah time is not set yet. Configure venue coordinates / CSV timetable or switch Start Timing to Fixed Clock Time.`;
      }
      offsetMins = Math.max(0, Number(s.offset_minutes) || 0);
      if (offsetMins >= nightDuration) {
        return `Session ${num} (+${offsetMins}m after Isha) extends past Fajr (${hasFajr ? format12h(fajrAdhan!) : '06:00 AM'}).`;
      }
    } else {
      if (!s.fixed_time || !/^\d{1,2}:\d{2}$/.test(s.fixed_time)) {
        return `Session ${num} (${typeLabel}) requires a valid start time.`;
      }
      const fixedMins = timeToMinutes(s.fixed_time);
      offsetMins = (fixedMins - anchorMins + 1440) % 1440;

      if (offsetMins >= nightDuration) {
        const distBeforeIsha = 1440 - offsetMins;
        if (hasIsha && distBeforeIsha <= 180) {
          return `Session ${num} (${format12h(s.fixed_time)}) cannot start before Isha Iqamah (${format12h(ishaIqamah!)}).`;
        }
        return hasIsha && hasFajr
          ? `Session ${num} (${format12h(s.fixed_time)}) falls outside the night prayer window (between Isha ${format12h(ishaIqamah!)} and Fajr ${format12h(fajrAdhan!)}).`
          : `Session ${num} (${format12h(s.fixed_time)}) must be scheduled during night hours (8:00 PM – 6:00 AM fallback until daily prayers are configured).`;
      }
    }

    if (i > 0 && offsetMins <= prevOffset) {
      return `Session ${num} (${describeSessionTime(s)}) cannot start at or before Session ${i} (${describeSessionTime(sessions[i - 1]!)}).`;
    }

    prevOffset = offsetMins;
  }

  return null;
}
