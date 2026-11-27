'use client';

import React from 'react';
import type { PrayerName } from '@/types/index';

export interface RuleItemState {
  readonly type: 'OFFSET' | 'FIXED';
  readonly offset: number;
  readonly fixed: string;
}

export const IQAMAH_PRAYERS_CONFIG: ReadonlyArray<{ readonly name: PrayerName; readonly label: string }> = [
  { name: 'fajr', label: 'Fajr' },
  { name: 'dhuhr', label: 'Dhuhr' },
  { name: 'asr', label: 'Asr' },
  { name: 'maghrib', label: 'Maghrib' },
  { name: 'isha', label: 'Isha' },
];

export interface IqamahRulesTabPanelProps {
  readonly rulesState: Record<PrayerName, RuleItemState>;
  readonly onUpdateRule: (prayer: PrayerName, patch: Partial<RuleItemState>) => void;
}

export function IqamahRulesTabPanel({ rulesState, onUpdateRule }: IqamahRulesTabPanelProps) {
  return (
    <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
      {IQAMAH_PRAYERS_CONFIG.map((p) => {
        const rule = rulesState[p.name];
        if (!rule) return null;

        return (
          <div key={p.name} className="p-3.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="w-24 shrink-0">
              <span className="text-sm font-bold text-[var(--admin-text-primary)]">{p.label}</span>
            </div>

            <div className="flex items-center space-x-1 bg-[var(--admin-card)] p-1 rounded-xl border border-[var(--admin-border)] w-fit shrink-0">
              <button
                type="button"
                onClick={() => onUpdateRule(p.name, { type: 'OFFSET' })}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                  rule.type === 'OFFSET'
                    ? 'bg-[var(--admin-surface)] text-[var(--admin-text-primary)] border border-[var(--admin-border)] shadow-sm font-semibold'
                    : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                Minutes after Adhan
              </button>
              <button
                type="button"
                onClick={() => onUpdateRule(p.name, { type: 'FIXED' })}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                  rule.type === 'FIXED'
                    ? 'bg-[var(--admin-surface)] text-[var(--admin-text-primary)] border border-[var(--admin-border)] shadow-sm font-semibold'
                    : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                Fixed Time
              </button>
            </div>

            <div className="sm:ml-auto">
              {rule.type === 'OFFSET' ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={rule.offset}
                    onChange={(e) => onUpdateRule(p.name, { offset: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    className="w-16 px-2.5 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-xs font-mono font-semibold text-[var(--admin-text-primary)] text-center focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                  />
                  <span className="text-xs font-medium text-[var(--admin-text-muted)]">min after Adhan</span>
                </div>
              ) : (
                <input
                  type="time"
                  value={rule.fixed}
                  onChange={(e) => onUpdateRule(p.name, { fixed: e.target.value })}
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-xs font-mono font-semibold text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

