import { cookies } from 'next/headers';
import { getVenueSettings, getPublicDisplaySettings, getVenueSettingsCore } from '@/lib/actions/settings';
import { getPostersWithStatus } from '@/lib/actions/posters';
import {
  getPrayerOverrides,
  getPrayerRules,
  getAnnualScheduleForDate,
  hasConfiguredAnnualSchedule,
} from '@/lib/actions/prayers';
import { getJummahShifts } from '@/lib/actions/jummah';
import { calculateDailySchedule } from '@/lib/prayer/prayer-engine';
import { checkAdminAuth } from '@/lib/actions/auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import type { Settings } from '@/types/index';

export const dynamic = 'force-dynamic';

export interface AdminPageProps {
  readonly searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('mosque_admin_theme')?.value;
  const initialTheme: 'light' | 'dark' = themeCookie === 'light' ? 'light' : 'dark';

  const tabParam = typeof resolvedParams.tab === 'string' ? resolvedParams.tab.toLowerCase() : '';
  const subParam = typeof resolvedParams.sub === 'string' ? resolvedParams.sub.toLowerCase() : undefined;

  const initialTab: 'POSTERS' | 'PRAYERS' | 'SETTINGS' =
    tabParam === 'prayers' || tabParam === 'prayer' ? 'PRAYERS' :
    tabParam === 'settings' || tabParam === 'venue' ? 'SETTINGS' :
    'POSTERS';

  const { authenticated } = await checkAdminAuth();

  // If not authenticated, do not query sensitive admin datasets into SSR payload
  if (!authenticated) {
    const [publicSettings, coreSettings] = await Promise.all([
      getPublicDisplaySettings(),
      getVenueSettingsCore(),
    ]);
    return (
      <AdminDashboard
        initialSettings={{
          ...(publicSettings as unknown as Settings),
          initial_setup_completed: coreSettings.initial_setup_completed,
        }}
        initialPosters={[]}
        initialOverrides={[]}
        initialJummahShifts={[]}
        initialRules={[]}
        initialIsAuthenticated={false}
        initialTab={initialTab}
        initialSubTab={subParam}
        initialTheme={initialTheme}
      />
    );
  }

  const today = new Date();
  const settings = await getVenueSettings();
  const todayIsoDate = new Intl.DateTimeFormat('en-CA', { timeZone: settings.timezone }).format(today);
  const [posters, overrides, jummahShifts, rules, annualSchedule, hasAnnualSchedule] = await Promise.all([
    getPostersWithStatus(today),
    getPrayerOverrides(todayIsoDate),
    getJummahShifts(),
    getPrayerRules(),
    getAnnualScheduleForDate(todayIsoDate),
    hasConfiguredAnnualSchedule(),
  ]);

  const prayers = calculateDailySchedule(
    {
      latitude: settings.latitude ?? null,
      longitude: settings.longitude ?? null,
    },
    today,
    overrides,
    {
      timezone: settings.timezone,
      method: settings.calculation_method,
      madhab: settings.madhab ?? 'shafi',
      rules,
      annualSchedule: annualSchedule ?? undefined,
    }
  );

  return (
    <AdminDashboard
      initialSettings={settings}
      initialPosters={posters}
      initialPrayers={prayers}
      initialOverrides={overrides}
      initialJummahShifts={jummahShifts}
      initialRules={rules}
      initialIsAuthenticated={true}
      initialTab={initialTab}
      initialSubTab={subParam}
      initialTheme={initialTheme}
      hasAnnualSchedule={hasAnnualSchedule}
    />
  );
}
