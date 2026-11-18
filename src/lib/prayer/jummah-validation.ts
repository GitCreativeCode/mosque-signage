import type { DbJummahShiftRecord } from '@/lib/actions/jummah';
import { format12h, timeToMinutes } from '@/lib/utils/time';

export function validateEditedShiftChronology(
  shifts: readonly DbJummahShiftRecord[],
  currIdx: number,
  adhan: string,
  iqamah: string
): string | null {
  if (iqamah.trim() && timeToMinutes(iqamah) < timeToMinutes(adhan)) {
    return `Salah time (${format12h(iqamah)}) cannot be earlier than Khutbah time (${format12h(adhan)}).`;
  }
  const prev = currIdx > 0 ? shifts[currIdx - 1] : undefined;
  if (prev && timeToMinutes(adhan) <= timeToMinutes(prev.adhan_time)) {
    return `Khutbah time (${format12h(adhan)}) must be later than Shift ${currIdx} (${format12h(prev.adhan_time)}).`;
  }
  const next = currIdx >= 0 && currIdx < shifts.length - 1 ? shifts[currIdx + 1] : undefined;
  if (next && timeToMinutes(adhan) >= timeToMinutes(next.adhan_time)) {
    return `Khutbah time (${format12h(adhan)}) must be earlier than Shift ${currIdx + 2} (${format12h(next.adhan_time)}).`;
  }
  return null;
}

export function validateNewShiftChronology(
  shifts: readonly DbJummahShiftRecord[],
  adhan: string,
  iqamah: string
): string | null {
  if (iqamah.trim() && timeToMinutes(iqamah) < timeToMinutes(adhan)) {
    return `Salah time (${format12h(iqamah)}) cannot be earlier than Khutbah time (${format12h(adhan)}).`;
  }
  const last = shifts.length > 0 ? shifts[shifts.length - 1] : undefined;
  if (last && timeToMinutes(adhan) <= timeToMinutes(last.adhan_time)) {
    return `Khutbah time (${format12h(adhan)}) must be later than Shift ${shifts.length} (${format12h(last.adhan_time)}).`;
  }
  return null;
}

export function computeNextDefaultKhutbahTime(shifts: readonly DbJummahShiftRecord[]): string {
  if (shifts.length === 0) return '12:30';
  const nextMins = (timeToMinutes(shifts[shifts.length - 1]?.adhan_time) + 60) % 1440;
  return `${String(Math.floor(nextMins / 60)).padStart(2, '0')}:${String(nextMins % 60).padStart(2, '0')}`;
}

