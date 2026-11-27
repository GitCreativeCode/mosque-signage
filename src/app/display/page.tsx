import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { prayerOverridesTable } from '@/lib/db/schema';
import { calculateDailySchedule } from '@/lib/prayer/prayer-engine';
import type { EidShift, JummahShift, PrayerOverride } from '@/types/index';
import { getPrayerRules, getAnnualScheduleForDate } from '@/lib/actions/prayers';
import { getEffectiveJummahShifts, getEidShifts } from '@/lib/actions/jummah';
import { getPublicDisplaySettings } from '@/lib/actions/settings';
import { getPublicActivePosters } from '@/lib/actions/posters';
import { verifyCurrentDisplaySession } from '@/lib/auth/display-pairing';
import { KioskDisplayScreen } from '@/components/display/KioskDisplayScreen';
import { DisplayPairingScreen } from '@/components/display/DisplayPairingScreen';

export const dynamic = 'force-dynamic';

export default async function DisplayPage() {
  const settings = await getPublicDisplaySettings();

  // Enforce display authorization if pairing protection is active
  const isAuthorized = await verifyCurrentDisplaySession();
  if (!isAuthorized) {
    return (
      <DisplayPairingScreen
        mosqueName={settings.mosque_name}
        greeting={settings.header_greeting}
      />
    );
  }

  const today = new Date();
  const { posters } = await getPublicActivePosters(today);

  // Resolve venue local date before querying day-scoped overrides, Jummah roster, and annual timetable
  const todayIsoDate = new Intl.DateTimeFormat('en-CA', { timeZone: settings.timezone }).format(today);
  const activeEidFilter =
    settings.active_eid_type && settings.active_eid_type !== 'none'
      ? settings.active_eid_type
      : undefined;

  const [jummahShiftsRaw, eidShiftsRaw, rawOverrides, rules, annualSchedule] = await Promise.all([
    getEffectiveJummahShifts(todayIsoDate),
    getEidShifts(activeEidFilter),
    db.select().from(prayerOverridesTable).where(eq(prayerOverridesTable.date, todayIsoDate)),
    getPrayerRules(),
    getAnnualScheduleForDate(todayIsoDate),
  ]);

  const jummahShifts: JummahShift[] = jummahShiftsRaw;
  const eidShifts: EidShift[] = eidShiftsRaw;
  const prayerOverrides: PrayerOverride[] = rawOverrides.map((o) => ({
    id: o.id,
    date: o.date,
    prayer: o.prayer as PrayerOverride['prayer'],
    adhan_override: o.adhan_override ?? undefined,
    iqamah_time: o.iqamah_time,
  }));

  // Calculate today's astronomical prayer schedule
  const prayerSchedule = calculateDailySchedule(
    {
      latitude: settings.latitude ?? null,
      longitude: settings.longitude ?? null,
    },
    today,
    prayerOverrides,
    {
      timezone: settings.timezone,
      method: settings.calculation_method,
      madhab: settings.madhab ?? 'shafi',
      highLatitudeRule: settings.high_latitude_rule,
      rules,
      annualSchedule: annualSchedule ?? undefined,
      adhanOffsets: {
        fajr: settings.fajr_adhan_offset_minutes ?? 0,
        sunrise: settings.sunrise_adhan_offset_minutes ?? 0,
        dhuhr: settings.dhuhr_adhan_offset_minutes ?? 0,
        asr: settings.asr_adhan_offset_minutes ?? 0,
        maghrib: settings.maghrib_adhan_offset_minutes ?? 0,
        isha: settings.isha_adhan_offset_minutes ?? 0,
      },
    }
  );

  return (
    <KioskDisplayScreen
      settings={settings}
      initialPosters={posters}
      prayers={prayerSchedule}
      jummahShifts={jummahShifts}
      eidShifts={eidShifts}
    />
  );
}
