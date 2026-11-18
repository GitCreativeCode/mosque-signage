'use client';

import React from 'react';
import type { PrintableTimetableData } from '@/lib/actions/prayer-exports';
import { format12h } from '@/lib/utils/time';
import { formatHijriDate } from '@/lib/prayer/hijri';

export interface PrintableSheetContentProps {
  readonly printData: PrintableTimetableData;
  readonly printTimingMode: 'BOTH' | 'ADHAN' | 'IQAMAH';
  readonly printDateType: 'GREGORIAN' | 'HIJRI' | 'BOTH';
}

const DAILY_PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export function PrintableSheetContent({
  printData,
  printTimingMode,
  printDateType,
}: PrintableSheetContentProps) {
  return (
    <>
      <div className="text-center border-b border-neutral-300 pb-3 mb-3">
        <h2 className="text-lg font-black tracking-tight uppercase text-neutral-900">{printData.mosqueName}</h2>
        <div className="text-xs font-bold text-neutral-800 mt-0.5">
          PRAYER &amp; IQAMAH TIMETABLE — {printData.monthName.toUpperCase()} {printData.year}
        </div>
        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Timezone: {printData.timezone}</div>
      </div>

      <table className="w-full text-center border-collapse text-[10px] border border-neutral-400">
        <thead>
          {printTimingMode === 'BOTH' ? (
            <>
              <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-900">
                <th colSpan={printDateType === 'BOTH' ? 3 : 2} className="py-1.5 px-1 border border-neutral-300 bg-neutral-200/80 font-black uppercase tracking-wider text-[11px]">
                  {printData.monthName} {printData.year}
                </th>
                <th colSpan={2} className="py-1.5 px-1 border border-neutral-300">Fajr</th>
                <th colSpan={1} className="py-1.5 px-1 border border-neutral-300">Sunrise</th>
                <th colSpan={2} className="py-1.5 px-1 border border-neutral-300">Dhuhr</th>
                <th colSpan={2} className="py-1.5 px-1 border border-neutral-300">Asr</th>
                <th colSpan={2} className="py-1.5 px-1 border border-neutral-300">Maghrib</th>
                <th colSpan={2} className="py-1.5 px-1 border border-neutral-300">Isha</th>
              </tr>
              <tr className="bg-neutral-50 border-b border-neutral-300 font-semibold text-neutral-700 text-[9px]">
                {printDateType === 'BOTH' && (
                  <><th className="py-1 px-1 border border-neutral-300">Date</th><th className="py-1 px-1 border border-neutral-300">Day</th><th className="py-1 px-1 border border-neutral-300">Hijri</th></>
                )}
                {printDateType === 'HIJRI' && (
                  <><th className="py-1 px-1 border border-neutral-300">Hijri</th><th className="py-1 px-1 border border-neutral-300">Day</th></>
                )}
                {printDateType === 'GREGORIAN' && (
                  <><th className="py-1 px-1 border border-neutral-300">Date</th><th className="py-1 px-1 border border-neutral-300">Day</th></>
                )}
                <th className="py-1 px-1 border border-neutral-300">Athan</th>
                <th className="py-1 px-1 border border-neutral-300 font-black text-neutral-900">Iqamah</th>
                <th className="py-1 px-1 border border-neutral-300">Shuruq</th>
                {(['dhuhr', 'asr', 'maghrib', 'isha'] as const).map((k) => (
                  <React.Fragment key={k}>
                    <th className="py-1 px-1 border border-neutral-300">Athan</th>
                    <th className="py-1 px-1 border border-neutral-300 font-black text-neutral-900">Iqamah</th>
                  </React.Fragment>
                ))}
              </tr>
            </>
          ) : (
            <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-900">
              {printDateType === 'BOTH' && (
                <><th className="py-1.5 px-1 border border-neutral-300">Date</th><th className="py-1.5 px-1 border border-neutral-300">Day</th><th className="py-1.5 px-1 border border-neutral-300">Hijri</th></>
              )}
              {printDateType === 'HIJRI' && (
                <><th className="py-1.5 px-1 border border-neutral-300">Hijri Date</th><th className="py-1.5 px-1 border border-neutral-300">Day</th></>
              )}
              {printDateType === 'GREGORIAN' && (
                <><th className="py-1.5 px-1 border border-neutral-300">Date</th><th className="py-1.5 px-1 border border-neutral-300">Day</th></>
              )}
              <th className="py-1.5 px-1 border border-neutral-300">Fajr {printTimingMode === 'ADHAN' ? '(Athan)' : '(Iqamah)'}</th>
              <th className="py-1.5 px-1 border border-neutral-300">Sunrise</th>
              {(['Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((label) => (
                <th key={label} className="py-1.5 px-1 border border-neutral-300">
                  {label} {printTimingMode === 'ADHAN' ? '(Athan)' : '(Iqamah)'}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody className="font-mono text-[9.5px]">
          {printData.days.map((d, index) => {
            const isFriday = d.dayName.toLowerCase().startsWith('fri');
            const hijriDayStr = formatHijriDate(new Date(`${d.date}T12:00:00Z`), printData.hijriOffset ?? 0, { day: 'numeric', month: 'short', timezone: 'UTC' });
            const rowClass = isFriday ? 'bg-amber-50/70 font-semibold' : index % 2 === 1 ? 'bg-neutral-50' : 'bg-white';

            return (
              <tr key={d.date} className={rowClass}>
                {printDateType === 'BOTH' ? (
                  <>
                    <td className="py-1 px-1 border border-neutral-300 whitespace-nowrap font-sans font-bold">{d.date.slice(8)}</td>
                    <td className="py-1 px-1 border border-neutral-300 whitespace-nowrap font-sans">{d.dayName.slice(0, 3)}</td>
                    <td className="py-1 px-1 border border-neutral-300 whitespace-nowrap font-sans">{hijriDayStr}</td>
                  </>
                ) : (
                  <>
                    <td className="py-1 px-1 border border-neutral-300 whitespace-nowrap font-sans font-bold">
                      {printDateType === 'HIJRI' ? hijriDayStr : d.date.slice(8)}
                    </td>
                    <td className="py-1 px-1 border border-neutral-300 whitespace-nowrap font-sans">{d.dayName.slice(0, 3)}</td>
                  </>
                )}

                {DAILY_PRAYER_KEYS.map((key) => (
                  <React.Fragment key={key}>
                    {key === 'dhuhr' && (
                      <td className="py-1 px-1 border border-neutral-300 text-neutral-600">{format12h(d.sunrise.adhan)}</td>
                    )}
                    {printTimingMode === 'BOTH' ? (
                      <>
                        <td className="py-1 px-1 border border-neutral-300 text-neutral-600">{format12h(d[key].adhan)}</td>
                        <td className="py-1 px-1 border border-neutral-300 font-bold text-neutral-900">{format12h(d[key].iqamah)}</td>
                      </>
                    ) : (
                      <td className="py-1 px-1 border border-neutral-300 font-semibold text-neutral-900">
                        {format12h(printTimingMode === 'ADHAN' ? d[key].adhan : d[key].iqamah)}
                      </td>
                    )}
                  </React.Fragment>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

