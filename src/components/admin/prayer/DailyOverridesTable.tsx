'use client';

import React from 'react';
import type { PrayerName } from '@/types/index';

export interface DailyPrayerItem {
  readonly name: PrayerName;
  readonly label: string;
  readonly adhan: string;
  readonly isAstronomical?: boolean;
}

export interface DailyOverridesTableProps {
  readonly prayersList: readonly DailyPrayerItem[];
  readonly iqamahTimes: Record<PrayerName, string>;
  readonly onIqamahChange: (prayer: PrayerName, val: string) => void;
  readonly onAdjustMinutes: (prayer: PrayerName, deltaMinutes: number) => void;
}

/**
 * Daily Congregational Iqamah Overrides Table
 * Displays calculated astronomical Adhan times (including Sunrise transition),
 * allows editing Iqamahs via TimePicker, and quick +/-5m step adjustments.
 */
export function DailyOverridesTable({
  prayersList,
  iqamahTimes,
  onIqamahChange,
  onAdjustMinutes,
}: DailyOverridesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#2e323b] text-xs font-medium uppercase tracking-wider text-neutral-400">
            <th className="py-2.5 px-3">Prayer</th>
            <th className="py-2.5 px-3">Astronomical Adhan</th>
            <th className="py-2.5 px-3">Congregational Iqamah</th>
            <th className="py-2.5 px-3 text-right">Quick Step Adjust</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2e323b] text-xs">
          {prayersList.map((p) => (
            <tr key={p.name} className="hover:bg-[#282a35]/40 transition-colors">
              <td className="py-3 px-3">
                <span className="font-semibold text-white text-sm">{p.label}</span>
              </td>
              <td className="py-3 px-3 font-mono tabular-nums text-neutral-300 font-medium">{p.adhan}</td>
              <td className="py-3 px-3">
                {p.isAstronomical ? (
                  <span className="text-xs text-neutral-500">
                    —
                  </span>
                ) : (
                  <input
                    type="time"
                    value={iqamahTimes[p.name] ?? ''}
                    onChange={(e) => onIqamahChange(p.name, e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-[#15161b] border border-[#313542] text-white font-mono tabular-nums font-semibold text-xs focus:outline-none focus:border-[#388bfd]"
                  />
                )}
              </td>
              <td className="py-3 px-3 text-right space-x-1.5">
                {p.isAstronomical ? (
                  <span className="text-neutral-600 text-xs">—</span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onAdjustMinutes(p.name, -5)}
                      className="px-2.5 py-1 rounded-lg bg-[#282a35] hover:bg-[#323642] active:scale-95 cursor-pointer text-neutral-300 hover:text-white border border-[#353945] font-mono tabular-nums text-xs transition-all duration-150"
                      title="Subtract 5 minutes"
                    >
                      -5m
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdjustMinutes(p.name, 5)}
                      className="px-2.5 py-1 rounded-lg bg-[#282a35] hover:bg-[#323642] active:scale-95 cursor-pointer text-neutral-300 hover:text-white border border-[#353945] font-mono tabular-nums text-xs transition-all duration-150"
                      title="Add 5 minutes"
                    >
                      +5m
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
