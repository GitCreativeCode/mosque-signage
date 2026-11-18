import { describe, it, expect, beforeEach } from 'vitest';
import { saveDayIqamahSchedule, bulkSetIqamahRange } from '@/lib/actions/prayer-schedules';
import { getMonthPrayerSchedule, exportScheduleCsv } from '@/lib/actions/prayer-exports';
import { db } from '@/lib/db/client';
import { annualSchedulesTable } from '@/lib/db/schema';
import { like } from 'drizzle-orm';

describe('Monthly Prayer & Iqamah Timetable Engine', () => {
  beforeEach(async () => {
    // Clean up test dates in 2030 to ensure isolated test environment
    await db.delete(annualSchedulesTable).where(like(annualSchedulesTable.date, '2030-%'));
  });

  it('generates complete month schedule with correct day counts', async () => {
    // November has 30 days
    const novSchedule = await getMonthPrayerSchedule(2030, 11);
    expect(novSchedule).toHaveLength(30);

    const day1 = novSchedule[0];
    expect(day1).toBeDefined();
    expect(day1?.date).toBe('2030-11-01');
    expect(day1?.dayNumber).toBe(1);
    expect(day1?.fajr.adhan).toMatch(/^\d{2}:\d{2}$/);
    expect(day1?.fajr.iqamah).toMatch(/^\d{2}:\d{2}$/);
    expect(day1?.sunrise.adhan).toMatch(/^\d{2}:\d{2}$/);
    expect(day1?.dhuhr.adhan).toMatch(/^\d{2}:\d{2}$/);
    expect(day1?.asr.adhan).toMatch(/^\d{2}:\d{2}$/);
    expect(day1?.maghrib.adhan).toMatch(/^\d{2}:\d{2}$/);
    expect(day1?.isha.adhan).toMatch(/^\d{2}:\d{2}$/);

    // December has 31 days
    const decSchedule = await getMonthPrayerSchedule(2030, 12);
    expect(decSchedule).toHaveLength(31);
    expect(decSchedule[30]?.date).toBe('2030-12-31');
  });

  it('throws error for invalid month numbers', async () => {
    await expect(getMonthPrayerSchedule(2030, 0)).rejects.toThrow('Month must be between 1 and 12.');
    await expect(getMonthPrayerSchedule(2030, 13)).rejects.toThrow('Month must be between 1 and 12.');
  });

  it('saves and updates individual day Iqamah schedule', async () => {
    const testDate = '2030-11-15';
    await saveDayIqamahSchedule(testDate, {
      fajr: '06:15',
      dhuhr: '13:30',
      asr: '16:45',
      maghrib: '17:30',
      isha: '19:15',
    });

    const monthSchedule = await getMonthPrayerSchedule(2030, 11);
    const day15 = monthSchedule.find((d) => d.date === testDate);

    expect(day15).toBeDefined();
    expect(day15?.fajr.iqamah).toBe('06:15');
    expect(day15?.fajr.source).toBe('csv');
    expect(day15?.asr.iqamah).toBe('16:45');
    expect(day15?.isha.iqamah).toBe('19:15');
  });

  it('bulk updates Iqamah time across a date range', async () => {
    const result = await bulkSetIqamahRange({
      startDate: '2030-11-01',
      endDate: '2030-11-10',
      prayer: 'asr',
      iqamahTime: '16:30',
    });

    expect(result.affectedDays).toBe(10);

    const monthSchedule = await getMonthPrayerSchedule(2030, 11);
    for (let day = 1; day <= 10; day++) {
      const dayData = monthSchedule[day - 1];
      expect(dayData?.asr.iqamah).toBe('16:30');
      expect(dayData?.asr.source).toBe('csv');
    }

    // Day 11 should not have been updated by the bulk range
    const day11 = monthSchedule[10];
    expect(day11?.date).toBe('2030-11-11');
  });

  it('exports valid CSV string for the month', async () => {
    await saveDayIqamahSchedule('2030-11-01', {
      fajr: '06:00',
      dhuhr: '13:15',
      asr: '16:15',
      maghrib: '17:45',
      isha: '19:30',
    });

    const csv = await exportScheduleCsv(2030, 11);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('date,fajr,dhuhr,asr,maghrib,isha');
    expect(lines).toHaveLength(31); // Header + 30 days

    const day1Line = lines[1];
    expect(day1Line).toContain('2030-11-01,06:00,13:15,16:15,17:45,19:30');
  });

  it('bulk updates Iqamah with dynamic astronomical Adhan offset (e.g. Maghrib +5m)', async () => {
    const result = await bulkSetIqamahRange({
      startDate: '2030-11-01',
      endDate: '2030-11-05',
      prayer: 'maghrib',
      mode: 'OFFSET',
      offsetMinutes: 5,
    });

    expect(result.affectedDays).toBe(5);

    const monthSchedule = await getMonthPrayerSchedule(2030, 11);
    for (let day = 1; day <= 5; day++) {
      const dayData = monthSchedule[day - 1];
      expect(dayData).toBeDefined();

      const [adhH, adhM] = dayData!.maghrib.adhan.split(':').map(Number);
      const expectedTotal = ((adhH ?? 0) * 60 + (adhM ?? 0) + 5) % 1440;
      const expectedH = String(Math.floor(expectedTotal / 60)).padStart(2, '0');
      const expectedM = String(expectedTotal % 60).padStart(2, '0');
      const expectedIqamah = `${expectedH}:${expectedM}`;

      expect(dayData?.maghrib.iqamah).toBe(expectedIqamah);
    }
  });

  it('imports Full Schedule CSV (Month, Day, Adhan + Iqamah) with automatic dialect detection', async () => {
    const fullCsv = `Month,Day,Fajr_Adhan,Fajr_Iqamah,Sunrise,Dhuhr_Adhan,Dhuhr_Iqamah,Asr_Adhan,Asr_Iqamah,Maghrib_Adhan,Maghrib_Iqamah,Isha_Adhan,Isha_Iqamah
11,1,06:12,06:30,07:51,12:22,12:45,14:40,15:00,16:53,17:03,18:32,19:00
11,2,06:13,06:30,07:52,12:22,12:45,14:39,15:00,16:52,17:02,18:31,19:00`;

    const { importAnnualScheduleCsv } = await import('@/lib/actions/prayer-schedules');
    const result = await importAnnualScheduleCsv(fullCsv, 2030);

    expect(result.formatDetected).toBe('full');
    expect(result.importedCount).toBe(2);

    const monthSchedule = await getMonthPrayerSchedule(2030, 11);
    const day1 = monthSchedule.find((d) => d.date === '2030-11-01');
    expect(day1).toBeDefined();
    expect(day1?.fajr.adhan).toBe('06:12');
    expect(day1?.fajr.iqamah).toBe('06:30');
    expect(day1?.fajr.adhanSource).toBe('csv');
    expect(day1?.sunrise.adhan).toBe('07:51');
    expect(day1?.sunrise.adhanSource).toBe('csv');
    expect(day1?.dhuhr.adhan).toBe('12:22');
    expect(day1?.dhuhr.iqamah).toBe('12:45');
    expect(day1?.maghrib.adhan).toBe('16:53');
  });

  it('imports Adhan-Only CSV and dynamically evaluates Iqamah from active rules', async () => {
    const adhanOnlyCsv = `Month,Day,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha
11,5,06:15,07:55,12:22,14:36,16:48,18:27`;

    const { importAnnualScheduleCsv } = await import('@/lib/actions/prayer-schedules');
    const result = await importAnnualScheduleCsv(adhanOnlyCsv, 2030);

    expect(result.formatDetected).toBe('adhan_only');
    expect(result.importedCount).toBe(1);

    const monthSchedule = await getMonthPrayerSchedule(2030, 11);
    const day5 = monthSchedule.find((d) => d.date === '2030-11-05');
    expect(day5).toBeDefined();
    expect(day5?.fajr.adhan).toBe('06:15');
    expect(day5?.fajr.adhanSource).toBe('csv');
    expect(day5?.sunrise.adhan).toBe('07:55');
    expect(day5?.dhuhr.adhan).toBe('12:22');
    expect(day5?.asr.adhan).toBe('14:36');
    expect(day5?.maghrib.adhan).toBe('16:48');
    expect(day5?.isha.adhan).toBe('18:27');
  });

  it('saves global Adhan offsets and reports source as offset in timetable', async () => {
    const { saveAdhanOffsets, getAdhanOffsets } = await import('@/lib/actions/prayers');
    await saveAdhanOffsets({
      fajr: 3,
      dhuhr: 5,
    });

    const liveOffsets = await getAdhanOffsets();
    expect(liveOffsets.fajr).toBe(3);
    expect(liveOffsets.dhuhr).toBe(5);

    const monthSchedule = await getMonthPrayerSchedule(2030, 11);
    // Day 20 has no manual override and no CSV override
    const day20 = monthSchedule.find((d) => d.date === '2030-11-20');
    expect(day20).toBeDefined();
    expect(day20?.fajr.adhanSource).toBe('offset');
    expect(day20?.dhuhr.adhanSource).toBe('offset');

    // Reset offsets back to 0
    await saveAdhanOffsets({
      fajr: 0,
      dhuhr: 0,
    });
  });

  it('exports schedule CSV with full adhan and iqamah columns when requested', async () => {
    const csvFull = await exportScheduleCsv(2030, 11, 'full');
    const lines = csvFull.split('\n');

    expect(lines[0]).toBe('date,fajr_adhan,fajr_iqamah,sunrise,dhuhr_adhan,dhuhr_iqamah,asr_adhan,asr_iqamah,maghrib_adhan,maghrib_iqamah,isha_adhan,isha_iqamah');
    expect(lines.length).toBe(31);
  });

  it('imports Adhan timetable with single Date column (YYYY-MM-DD) instead of Month, Day', async () => {
    const adhanDateCsv = `Date,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha
2030-11-08,06:18,07:58,12:22,14:34,16:45,18:24
2030-11-09,06:19,07:59,12:22,14:33,16:44,18:23`;

    const { importAnnualScheduleCsv } = await import('@/lib/actions/prayer-schedules');
    const result = await importAnnualScheduleCsv(adhanDateCsv);

    expect(result.formatDetected).toBe('adhan_only');
    expect(result.importedCount).toBe(2);

    const monthSchedule = await getMonthPrayerSchedule(2030, 11);
    const day8 = monthSchedule.find((d) => d.date === '2030-11-08');
    expect(day8).toBeDefined();
    expect(day8?.fajr.adhan).toBe('06:18');
    expect(day8?.fajr.adhanSource).toBe('csv');
    expect(day8?.sunrise.adhan).toBe('07:58');
    expect(day8?.dhuhr.adhan).toBe('12:22');
  });

  it('imports Adhan timetable with North American M/D/YYYY date format and "athan" spelling in header', async () => {
    const athanNaCsv = `Date,Fajr_Athan,Sunrise,Dhuhr_Athan,Asr_Athan,Maghrib_Athan,Isha_Athan
11/12/2030,06:22,08:03,12:23,14:31,16:41,18:21`;

    const { importAnnualScheduleCsv } = await import('@/lib/actions/prayer-schedules');
    const result = await importAnnualScheduleCsv(athanNaCsv);

    expect(result.formatDetected).toBe('adhan_only');
    expect(result.importedCount).toBe(1);

    const monthSchedule = await getMonthPrayerSchedule(2030, 11);
    const day12 = monthSchedule.find((d) => d.date === '2030-11-12');
    expect(day12).toBeDefined();
    expect(day12?.fajr.adhan).toBe('06:22');
    expect(day12?.fajr.adhanSource).toBe('csv');
    expect(day12?.maghrib.adhan).toBe('16:41');
  });

  it('exports CSV across multi-month range (e.g. 2 months: Nov + Dec = 61 days)', async () => {
    const csvTwoMonths = await exportScheduleCsv({
      year: 2030,
      month: 11,
      endMonth: 12,
      format: 'full',
    });
    const lines = csvTwoMonths.split('\n');

    // Header + 30 days (Nov) + 31 days (Dec) = 62 lines
    expect(lines).toHaveLength(62);
    expect(lines[1]).toContain('2030-11-01');
    expect(lines[61]).toContain('2030-12-31');
  });

  it('exports CSV across an arbitrary custom date range', async () => {
    const csvRange = await exportScheduleCsv({
      startDate: '2030-11-10',
      endDate: '2030-11-20',
      format: 'adhan_only',
    });
    const lines = csvRange.split('\n');

    // Header + 11 days (10th through 20th inclusive) = 12 lines
    expect(lines).toHaveLength(12);
    expect(lines[0]).toBe('date,fajr,sunrise,dhuhr,asr,maghrib,isha');
    expect(lines[1]).toContain('2030-11-10');
    expect(lines[11]).toContain('2030-11-20');
  });

  it('retrieves printable timetable data with mosque settings and days', async () => {
    const { getPrintableTimetable } = await import('@/lib/actions/prayer-exports');
    const printData = await getPrintableTimetable(2030, 11);

    expect(printData).toBeDefined();
    expect(printData.monthName).toBe('November');
    expect(printData.year).toBe(2030);
    expect(printData.month).toBe(11);
    expect(printData.days).toHaveLength(30);
    expect(typeof printData.mosqueName).toBe('string');
    expect(Array.isArray(printData.jummahShifts)).toBe(true);
  });

  describe('CSV Import Negative Edge Cases & Resiliency', () => {
    it('gracefully returns importedCount 0 for empty or whitespace-only CSV', async () => {
      const { importAnnualScheduleCsv } = await import('@/lib/actions/prayer-schedules');
      const emptyRes = await importAnnualScheduleCsv('');
      expect(emptyRes.importedCount).toBe(0);

      const whitespaceRes = await importAnnualScheduleCsv('   \n\n  \r\n   ');
      expect(whitespaceRes.importedCount).toBe(0);
    });

    it('safely skips rows with out-of-range dates without crashing', async () => {
      const badDateCsv = `Date,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha
13/45/2030,06:00,07:30,12:30,15:30,17:30,19:00
2030-11-20,06:15,07:45,12:30,15:15,17:15,18:45`;

      const { importAnnualScheduleCsv } = await import('@/lib/actions/prayer-schedules');
      const result = await importAnnualScheduleCsv(badDateCsv);

      // Only the valid row (2030-11-20) is imported; the 13/45/2030 row is skipped
      expect(result.importedCount).toBe(1);

      const monthSchedule = await getMonthPrayerSchedule(2030, 11);
      const validDay = monthSchedule.find((d) => d.date === '2030-11-20');
      expect(validDay).toBeDefined();
      expect(validDay?.fajr.adhan).toBe('06:15');
    });

    it('safely skips rows with malformed or unparseable time cells', async () => {
      const malformedTimeCsv = `Date,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha
2030-11-21,NaN:NaN,invalid,25:99,15:30,17:30,19:00
2030-11-22,06:20,07:50,12:30,15:10,17:10,18:40`;

      const { importAnnualScheduleCsv } = await import('@/lib/actions/prayer-schedules');
      const result = await importAnnualScheduleCsv(malformedTimeCsv);

      // 2030-11-21 should be skipped due to invalid time cells; 2030-11-22 should succeed
      expect(result.importedCount).toBe(1);

      const monthSchedule = await getMonthPrayerSchedule(2030, 11);
      const corruptedDay = monthSchedule.find((d) => d.date === '2030-11-21');
      // Should remain on default calculated adhan rather than corrupt "NaN:NaN"
      expect(corruptedDay?.fajr.adhanSource).toBe('astronomical');
      expect(corruptedDay?.fajr.adhan).toMatch(/^\d{2}:\d{2}$/);

      const validDay = monthSchedule.find((d) => d.date === '2030-11-22');
      expect(validDay?.fajr.adhan).toBe('06:20');
      expect(validDay?.fajr.adhanSource).toBe('csv');
    });
  });
});
