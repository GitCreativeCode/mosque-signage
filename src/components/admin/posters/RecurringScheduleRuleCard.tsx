'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { RecurringScheduleRule } from '@/types/poster';

export const DAYS_OF_WEEK = [
  { day: 0, label: 'Sun', full: 'Sunday' },
  { day: 1, label: 'Mon', full: 'Monday' },
  { day: 2, label: 'Tue', full: 'Tuesday' },
  { day: 3, label: 'Wed', full: 'Wednesday' },
  { day: 4, label: 'Thu', full: 'Thursday' },
  { day: 5, label: 'Fri', full: 'Friday' },
  { day: 6, label: 'Sat', full: 'Saturday' },
] as const;

export interface RecurringScheduleRuleCardProps {
  readonly rule: RecurringScheduleRule;
  readonly index: number;
  readonly totalRules: number;
  readonly onUpdateRule: (index: number, patch: Partial<RecurringScheduleRule>) => void;
  readonly onToggleDay: (ruleIndex: number, day: number) => void;
  readonly onApplyPreset: (ruleIndex: number, preset: 'FRIDAYS' | 'WEEKENDS' | 'WEEKDAYS' | 'ALL') => void;
  readonly onRemoveRule: (index: number) => void;
}

export function RecurringScheduleRuleCard({
  rule,
  index,
  totalRules,
  onUpdateRule,
  onToggleDay,
  onApplyPreset,
  onRemoveRule,
}: RecurringScheduleRuleCardProps) {
  const isInvalidTime = rule.startTime >= rule.endTime;

  return (
    <div className="p-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">
          Window #{index + 1}
        </span>
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-[var(--admin-text-muted)] mr-1">Presets:</span>
          {(['FRIDAYS', 'WEEKENDS', 'WEEKDAYS', 'ALL'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onApplyPreset(index, preset)}
              className="px-1.5 py-0.5 text-[10px] rounded border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
            >
              {preset === 'FRIDAYS' ? 'Fridays' : preset === 'WEEKENDS' ? 'Weekends' : preset === 'WEEKDAYS' ? 'Weekdays' : 'All Days'}
            </button>
          ))}
          {totalRules > 1 && (
            <button
              type="button"
              onClick={() => onRemoveRule(index)}
              className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded cursor-pointer"
              title="Remove rule"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DAYS_OF_WEEK.map(({ day, label, full }) => {
          const isSelected = rule.days.includes(day);
          return (
            <button
              key={day}
              type="button"
              title={full}
              onClick={() => onToggleDay(index, day)}
              className={`w-9 h-7 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 font-bold shadow-sm'
                  : 'border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-border-subtle)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <label className="text-[10px] font-medium text-[var(--admin-text-muted)] block mb-0.5">
            Start Time
          </label>
          <input
            type="time"
            value={rule.startTime}
            onChange={(e) => onUpdateRule(index, { startTime: e.target.value })}
            className="w-full h-8 px-2.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-[var(--admin-text-muted)] block mb-0.5">
            End Time
          </label>
          <input
            type="time"
            value={rule.endTime}
            onChange={(e) => onUpdateRule(index, { endTime: e.target.value })}
            className="w-full h-8 px-2.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
          />
        </div>
      </div>

      {isInvalidTime && (
        <p className="text-[10px] text-red-500 font-medium">
          ⚠️ Start time must be earlier than end time ({rule.startTime} ≥ {rule.endTime}).
        </p>
      )}
    </div>
  );
}

