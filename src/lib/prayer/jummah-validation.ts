import type { DbJummahShiftRecord } from '@/lib/actions/jummah';
import { format12h, timeToMinutes } from '@/lib/utils/time';

function minutesTo24h(mins: number): string {
  const norm = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const MIN_PRAYER_DURATION_MINUTES = 10;
export const RECOMMENDED_BUFFER_MINUTES = 15;

export function getShiftEndMinutes(shift: { adhan_time: string; iqamah_time?: string | null | undefined }): number {
  const salahTime = shift.iqamah_time?.trim() ? shift.iqamah_time.trim() : shift.adhan_time;
  return timeToMinutes(salahTime) + MIN_PRAYER_DURATION_MINUTES;
}

export function validateEditedShiftChronology(
  shifts: readonly DbJummahShiftRecord[],
  currIdx: number,
  adhan: string,
  iqamah?: string | null | undefined
): string | null {
  const adhanMins = timeToMinutes(adhan);
  const iqamahTrimmed = iqamah?.trim();
  if (iqamahTrimmed && timeToMinutes(iqamahTrimmed) < adhanMins) {
    return `Salah time (${format12h(iqamahTrimmed)}) cannot be earlier than Khutbah time (${format12h(adhan)}).`;
  }
  const prev = currIdx > 0 ? shifts[currIdx - 1] : undefined;
  if (prev) {
    const prevEndMins = getShiftEndMinutes(prev);
    if (adhanMins < prevEndMins) {
      return `Khutbah time (${format12h(adhan)}) cannot start before Shift ${currIdx} finishes prayer (${format12h(minutesTo24h(prevEndMins))}). A turnover buffer is required.`;
    }
  }
  const next = currIdx >= 0 && currIdx < shifts.length - 1 ? shifts[currIdx + 1] : undefined;
  if (next) {
    const currentEndMins = iqamahTrimmed ? timeToMinutes(iqamahTrimmed) + MIN_PRAYER_DURATION_MINUTES : adhanMins + MIN_PRAYER_DURATION_MINUTES;
    const nextAdhanMins = timeToMinutes(next.adhan_time);
    if (currentEndMins > nextAdhanMins) {
      return `Prayer finishes at ${format12h(minutesTo24h(currentEndMins))}, which collides with Shift ${currIdx + 2} Khutbah at ${format12h(next.adhan_time)}.`;
    }
  }
  return null;
}

export function validateNewShiftChronology(
  shifts: readonly DbJummahShiftRecord[],
  adhan: string,
  iqamah?: string | null | undefined
): string | null {
  const adhanMins = timeToMinutes(adhan);
  const iqamahTrimmed = iqamah?.trim();
  if (iqamahTrimmed && timeToMinutes(iqamahTrimmed) < adhanMins) {
    return `Salah time (${format12h(iqamahTrimmed)}) cannot be earlier than Khutbah time (${format12h(adhan)}).`;
  }
  const last = shifts.length > 0 ? shifts[shifts.length - 1] : undefined;
  if (last) {
    const lastEndMins = getShiftEndMinutes(last);
    if (adhanMins < lastEndMins) {
      return `Khutbah time (${format12h(adhan)}) cannot start before Shift ${shifts.length} finishes prayer (${format12h(minutesTo24h(lastEndMins))}). A turnover buffer is required.`;
    }
  }
  return null;
}

export function computeNextDefaultKhutbahTime(shifts: readonly DbJummahShiftRecord[]): string {
  if (shifts.length === 0) return '12:30';
  const last = shifts[shifts.length - 1];
  const lastEndMins = last ? getShiftEndMinutes(last) + 15 : 750;
  const nextMins = lastEndMins % 1440;
  return minutesTo24h(nextMins);
}

export function getUpcomingFridays(count: number = 8): string[] {
  const fridays: string[] = [];
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7;
  d.setDate(d.getDate() + diff);

  for (let i = 0; i < count; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    fridays.push(`${y}-${m}-${dayStr}`);
    d.setDate(d.getDate() + 7);
  }
  return fridays;
}

