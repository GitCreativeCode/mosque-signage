'use client';

import React from 'react';
import type { PrayerName } from '@/types/index';

export interface RuleConfig {
  readonly type: 'OFFSET' | 'FIXED';
  readonly offset: number;
  readonly fixed: string;
}

export interface AutomatedRulesSectionProps {
  readonly prayersList: readonly { name: PrayerName; label: string; isAstronomical?: boolean }[];
  readonly rulesState: Record<PrayerName, RuleConfig>;
  readonly onRuleTypeChange: (prayer: PrayerName, type: 'OFFSET' | 'FIXED') => void;
  readonly onOffsetChange: (prayer: PrayerName, offset: number) => void;
  readonly onFixedTimeChange: (prayer: PrayerName, fixed: string) => void;
}

/**
 * Automatic Calculation Rules Section
 * Renders a compact table configuring automated Iqamah offsets (+X min after Adhan)
 * or fixed daily times for each prayer.
 */
export function AutomatedRulesSection({
  prayersList,
  rulesState,
  onRuleTypeChange,
  onOffsetChange,
  onFixedTimeChange,
}: AutomatedRulesSectionProps) {
  const eligiblePrayers = prayersList.filter((p) => !p.isAstronomical);

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-400 mb-3">
        Set how each Iqamah is calculated automatically from the Adhan or set to a fixed daily time.
      </p>

      <div className="overflow-x-auto bg-[#181a20] border border-[#2e323b] rounded-lg">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#2e323b] font-medium uppercase tracking-wider text-neutral-400">
              <th className="py-2.5 px-4 w-32">Prayer</th>
              <th className="py-2.5 px-4 w-52">Calculation Type</th>
              <th className="py-2.5 px-4">Rule Setting</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e323b]">
            {eligiblePrayers.map((p) => {
              const currentRule = rulesState[p.name];
              if (!currentRule) return null;

              return (
                <tr key={p.name} className="hover:bg-[#20222a]/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white text-sm">
                    {p.label}
                  </td>
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center space-x-1 bg-[#15161b] p-0.5 rounded-lg border border-[#313542]">
                      <button
                        type="button"
                        onClick={() => onRuleTypeChange(p.name, 'OFFSET')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer ${
                          currentRule.type === 'OFFSET'
                            ? 'bg-[#282a35] text-white border border-[#353945]'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        +Min Offset
                      </button>
                      <button
                        type="button"
                        onClick={() => onRuleTypeChange(p.name, 'FIXED')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer ${
                          currentRule.type === 'FIXED'
                            ? 'bg-[#282a35] text-white border border-[#353945]'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Fixed Time
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {currentRule.type === 'OFFSET' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-neutral-400">Add</span>
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={currentRule.offset}
                          onChange={(e) => onOffsetChange(p.name, Number(e.target.value))}
                          className="w-16 px-2.5 py-1 rounded-lg bg-[#15161b] border border-[#313542] text-white font-mono tabular-nums font-semibold text-xs focus:outline-none focus:border-[#388bfd]"
                        />
                        <span className="text-neutral-400">minutes after Adhan</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-neutral-400">Fixed at</span>
                        <input
                          type="time"
                          value={currentRule.fixed}
                          onChange={(e) => onFixedTimeChange(p.name, e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-[#15161b] border border-[#313542] text-white font-mono tabular-nums font-semibold text-xs focus:outline-none focus:border-[#388bfd]"
                        />
                        <span className="text-neutral-400">daily</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
