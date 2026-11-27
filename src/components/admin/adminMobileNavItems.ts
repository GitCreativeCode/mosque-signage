import type { VenueSettingsCategory } from '@/types/index';
import type { PrayerSubTabKey } from '@/hooks/useAdminNavigation';

export interface MobileSubNavItem<T extends string> {
  readonly sub: T;
  readonly label: string;
}

export const PRAYER_MOBILE_LINKS: readonly MobileSubNavItem<PrayerSubTabKey>[] = [
  { sub: 'TIMETABLE', label: 'Prayer Timetable' },
  { sub: 'JUMMAH', label: 'Friday Jummah' },
  { sub: 'SEASONAL', label: 'Seasonal (Eid & Ramadan)' },
];

export const SETTINGS_MOBILE_LINKS: readonly MobileSubNavItem<VenueSettingsCategory>[] = [
  { sub: 'IDENTITY', label: 'Mosque Profile & Ticker' },
  { sub: 'ASTRONOMY', label: 'Calculation & Hijri Calendar' },
  { sub: 'DISPLAY', label: 'Display Timings & Behaviors' },
  { sub: 'MAINTENANCE', label: 'Remote Appliance Controls' },
  { sub: 'SECURITY', label: 'Security & Authentication' },
];
