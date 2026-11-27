'use client';

import React, { useState, useMemo } from 'react';
import { Clock, Plus, AlertTriangle, Globe } from 'lucide-react';
import type { RecurringSchedule, RecurringScheduleRule } from '@/types/poster';
import {
  parseRecurringSchedule, detectOverlappingRules,
  mergeOverlappingRules, formatRecurringSummary,
} from '@/lib/posters/recurring-schedule';
import { RecurringScheduleRuleCard } from './RecurringScheduleRuleCard';

export interface RecurringScheduleBuilderProps {
  readonly value: string | null | undefined;
  readonly onChange: (val: string | null) => void;
  readonly venueTimezone?: string | undefined;
  readonly embedded?: boolean | undefined;
}

const DEFAULT_RULE: RecurringScheduleRule = {
  days: [5], // Friday default for mosque context
  startTime: '11:00',
  endTime: '15:00',
};

export function RecurringScheduleBuilder({
  value,
  onChange,
  venueTimezone = 'UTC',
  embedded = false,
}: RecurringScheduleBuilderProps) {
  const schedule: RecurringSchedule | null = useMemo(() => {
    return parseRecurringSchedule(value);
  }, [value]);

  const [cachedRules, setCachedRules] = useState<readonly RecurringScheduleRule[]>(() => {
    const parsed = parseRecurringSchedule(value);
    return parsed && parsed.length > 0 ? parsed : [DEFAULT_RULE];
  });

  const isEnabled = Boolean(schedule && schedule.length > 0);

  const rules: readonly RecurringScheduleRule[] = useMemo(() => {
    if (schedule && schedule.length > 0) {
      return schedule;
    }
    return cachedRules;
  }, [schedule, cachedRules]);

  const overlapCheck = useMemo(() => detectOverlappingRules(rules as RecurringScheduleRule[]), [rules]);
  const summary = useMemo(
    () => (isEnabled ? formatRecurringSummary(schedule) : 'Continuous (24/7)'),
    [isEnabled, schedule]
  );

  const commitRules = (nextRules: readonly RecurringScheduleRule[]) => {
    setCachedRules(nextRules);
    onChange(JSON.stringify(nextRules));
  };

  const handleToggleEnabled = (enabled: boolean) => {
    if (!enabled) {
      onChange(null);
    } else {
      commitRules(cachedRules);
    }
  };

  const handleUpdateRule = (index: number, patch: Partial<RecurringScheduleRule>) => {
    const updated = rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    commitRules(updated);
  };

  const handleToggleDay = (ruleIndex: number, day: number) => {
    const target = rules[ruleIndex];
    if (!target) return;
    const exists = target.days.includes(day);
    let nextDays: number[];
    if (exists) {
      if (target.days.length <= 1) return; // Must keep at least 1 day
      nextDays = target.days.filter((d) => d !== day);
    } else {
      nextDays = [...target.days, day].sort();
    }
    handleUpdateRule(ruleIndex, { days: nextDays });
  };

  const handleApplyPreset = (ruleIndex: number, preset: 'FRIDAYS' | 'WEEKENDS' | 'WEEKDAYS' | 'ALL') => {
    let days: number[] = [5];
    if (preset === 'WEEKENDS') days = [0, 6];
    if (preset === 'WEEKDAYS') days = [1, 2, 3, 4, 5];
    if (preset === 'ALL') days = [0, 1, 2, 3, 4, 5, 6];
    handleUpdateRule(ruleIndex, { days });
  };

  const handleAddRule = () => {
    commitRules([...rules, { days: [0, 6], startTime: '09:00', endTime: '18:00' }]);
  };

  const handleRemoveRule = (index: number) => {
    if (rules.length <= 1) return;
    commitRules(rules.filter((_, i) => i !== index));
  };

  const handleMergeOverlaps = () => {
    const merged = mergeOverlappingRules(rules);
    commitRules(merged);
  };

  const containerClasses = embedded
    ? 'space-y-3.5'
    : 'p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-3.5';

  return (
    <div className={containerClasses}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[var(--admin-text-primary)]" />
          <span className="text-xs font-semibold text-[var(--admin-text-primary)]">Schedule Mode</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleEnabled(false)}
            aria-pressed={!isEnabled}
            className={`min-h-[36px] px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
              !isEnabled
                ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 shadow-sm'
                : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-border-subtle)]'
            }`}
          >
            All Day (Continuous)
          </button>
          <button
            type="button"
            onClick={() => handleToggleEnabled(true)}
            aria-pressed={isEnabled}
            className={`min-h-[36px] px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
              isEnabled
                ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 shadow-sm'
                : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-border-subtle)]'
            }`}
          >
            Recurring Windows
          </button>
        </div>
      </div>

      {isEnabled && (
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[var(--admin-text-muted)]">
            <span className="flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
              <span>Timezone: <strong className="text-[var(--admin-text-primary)] font-mono">{venueTimezone}</strong></span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] font-medium text-[10px]">
              {summary}
            </span>
          </div>

          {overlapCheck.hasOverlap && (
            <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px]">
                  Overlapping rules detected. Windows combine automatically into a unified broadcast.
                </span>
              </div>
              <button
                type="button"
                onClick={handleMergeOverlaps}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 shrink-0 cursor-pointer shadow-sm"
              >
                Merge Rules
              </button>
            </div>
          )}

          {rules.map((rule, idx) => (
            <RecurringScheduleRuleCard
              key={idx}
              rule={rule}
              index={idx}
              totalRules={rules.length}
              onUpdateRule={handleUpdateRule}
              onToggleDay={handleToggleDay}
              onApplyPreset={handleApplyPreset}
              onRemoveRule={handleRemoveRule}
            />
          ))}

          <button
            type="button"
            onClick={handleAddRule}
            className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg border border-dashed border-[var(--admin-border)] text-[var(--admin-text-primary)] hover:bg-[var(--admin-card)] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
            <span>Add Additional Recurring Window</span>
          </button>
        </div>
      )}
    </div>
  );
}
