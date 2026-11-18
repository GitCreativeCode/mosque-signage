'use client';

import React from 'react';
import type { PrayerName } from '@/types/index';

const ADHAN_PRAYERS_CONFIG: ReadonlyArray<{ readonly name: PrayerName; readonly label: string; readonly tip?: string }> = [
  { name: 'fajr', label: 'Fajr', tip: 'Precautionary buffer against early dawn' },
  { name: 'sunrise', label: 'Sunrise (Shuruq)', tip: 'Solar horizon buffer' },
  { name: 'dhuhr', label: 'Dhuhr', tip: 'Zawal delay past solar noon' },
  { name: 'asr', label: 'Asr', tip: 'Shadow multiplier offset' },
  { name: 'maghrib', label: 'Maghrib', tip: 'Precautionary sunset buffer' },
  { name: 'isha', label: 'Isha', tip: 'Twilight horizon buffer' },
];

export interface AdhanOffsetsTabPanelProps {
  readonly adhanOffsets: Record<PrayerName, number>;
  readonly onAdjustOffset: (prayer: PrayerName, delta: number) => void;
  readonly onSetDirectOffset: (prayer: PrayerName, rawVal: string) => void;
  readonly onApplyPrecautionaryDefaults: () => void;
  readonly onResetOffsets: () => void;
}

export function AdhanOffsetsTabPanel({
  adhanOffsets,
  onAdjustOffset,
  onSetDirectOffset,
  onApplyPrecautionaryDefaults,
  onResetOffsets,
}: AdhanOffsetsTabPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--admin-surface)]/60 border border-[var(--admin-border)]">
        <div className="text-[11px] text-[var(--admin-text-muted)]">
          Shifts live astronomical Adhan across all display views. Precautionary buffers add minutes past raw solar equations.
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <button type="button" onClick={onApplyPrecautionaryDefaults} className="px-2 py-1 rounded-lg text-[10px] font-medium border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] text-[var(--admin-text-primary)] transition cursor-pointer" title="Set Fajr +2m, Dhuhr +5m (Zawal), Maghrib +3m">
            Precautionary Presets
          </button>
          <button type="button" onClick={onResetOffsets} className="px-2 py-1 rounded-lg text-[10px] font-medium border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer" title="Reset all adhan offsets to 0">
            Clear (0m)
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 divide-y divide-[var(--admin-border)]/50">
        {ADHAN_PRAYERS_CONFIG.map((p) => {
          const offset = adhanOffsets[p.name] ?? 0;
          return (
            <div key={p.name} className="pt-2 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-[var(--admin-text-primary)]">{p.label}</span>
                  {offset > 0 ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      +{offset} min buffer
                    </span>
                  ) : offset < 0 ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {offset} min earlier
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--admin-text-muted)] font-mono">0m (Solar)</span>
                  )}
                </div>
                {p.tip && <p className="text-[10px] text-[var(--admin-text-muted)] mt-0.5">{p.tip}</p>}
              </div>

              <div className="flex items-center space-x-1.5 self-end sm:self-auto font-mono">
                <button type="button" onClick={() => onAdjustOffset(p.name, -5)} aria-label={`Decrease ${p.label} offset by 5 minutes`} className="min-h-[44px] px-2.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer" title="Subtract 5 minutes">-5m</button>
                <button type="button" onClick={() => onAdjustOffset(p.name, -1)} aria-label={`Decrease ${p.label} offset by 1 minute`} className="min-h-[44px] px-2.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer" title="Subtract 1 minute">-1m</button>
                <input
                  type="number"
                  min={-30}
                  max={30}
                  value={offset}
                  aria-label={`${p.label} Adhan offset minutes`}
                  onChange={(e) => onSetDirectOffset(p.name, e.target.value)}
                  className="min-h-[44px] w-14 px-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs font-mono font-bold text-center text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                />
                <button type="button" onClick={() => onAdjustOffset(p.name, 1)} aria-label={`Increase ${p.label} offset by 1 minute`} className="min-h-[44px] px-2.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer" title="Add 1 minute">+1m</button>
                <button type="button" onClick={() => onAdjustOffset(p.name, 5)} aria-label={`Increase ${p.label} offset by 5 minutes`} className="min-h-[44px] px-2.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer" title="Add 5 minutes">+5m</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

