import type { AdhanSource, MonthPrayerDay, PrayerName } from '@/types/index';
import { timeToMinutes } from '@/lib/utils/time';

export const TIMETABLE_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const ADHAN_SOURCE_COLOR: Record<AdhanSource, string> = {
  offset: 'text-[var(--admin-tab-active-border)] font-medium',
  csv: 'text-emerald-400 font-medium',
  manual: 'text-amber-400 font-medium',
  astronomical: 'text-[var(--admin-text-muted)] opacity-75',
};

export const ADHAN_SOURCE_TOOLTIP: Record<AdhanSource, string> = {
  offset: 'Calculated with global Adhan offset',
  csv: 'Annual timetable Adhan override',
  manual: 'Manual day Adhan override',
  astronomical: 'Astronomical solar calculation',
};

export function getMaxAllowedOffsetMinutes(
  prayer: PrayerName,
  sample?: MonthPrayerDay
): { max: number; nextName: string; nextAdhan: string } {
  if (!sample) return { max: 120, nextName: 'Next Prayer', nextAdhan: '' };
  if (prayer === 'isha') return { max: 180, nextName: 'Midnight', nextAdhan: '23:59' };

  const nextMap: Partial<Record<PrayerName, { nextName: string; nextAdhan: string }>> = {
    fajr: { nextName: 'Sunrise (Shuruq)', nextAdhan: sample.sunrise.adhan },
    dhuhr: { nextName: 'Asr', nextAdhan: sample.asr.adhan },
    asr: { nextName: 'Maghrib', nextAdhan: sample.maghrib.adhan },
    maghrib: { nextName: 'Isha', nextAdhan: sample.isha.adhan },
  };
  const nextInfo = nextMap[prayer];
  const currAdhan = sample[prayer]?.adhan;
  if (!nextInfo || !currAdhan || !nextInfo.nextAdhan) {
    return { max: 120, nextName: nextInfo?.nextName ?? 'Next Prayer', nextAdhan: nextInfo?.nextAdhan ?? '' };
  }
  let diff = timeToMinutes(nextInfo.nextAdhan) - timeToMinutes(currAdhan);
  if (diff <= 0) diff += 1440;
  return { max: Math.max(1, diff - 1), nextName: nextInfo.nextName, nextAdhan: nextInfo.nextAdhan };
}
