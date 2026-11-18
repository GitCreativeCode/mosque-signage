'use client';

import React from 'react';

interface StudioSettingsTabProps {
  readonly title: string;
  readonly duration: number;
  readonly startAt: string;
  readonly endAt: string;
  readonly isIndefinite: boolean;
  readonly onChangeTitle: (val: string) => void;
  readonly onChangeDuration: (sec: number) => void;
  readonly onChangeStartAt: (val: string) => void;
  readonly onChangeEndAt: (val: string) => void;
  readonly onChangeIndefinite: (val: boolean) => void;
}

/** Inspector tab for slide title, dwell duration slider, and start/expiration scheduling. */
export function StudioSettingsTab({
  title,
  duration,
  startAt,
  endAt,
  isIndefinite,
  onChangeTitle,
  onChangeDuration,
  onChangeStartAt,
  onChangeEndAt,
  onChangeIndefinite,
}: StudioSettingsTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] mb-1">
          Slide Information &amp; Schedule
        </h3>
        <p className="text-[11px] text-[var(--admin-text-muted)] mb-3">
          Configure slide title, dwell duration, and active dates
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">Slide Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="e.g. Weekend Youth Program & Community Gala"
            className="w-full px-3 py-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:border-[var(--admin-tab-active-border)]"
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--admin-text-secondary)]">Dwell Duration</span>
            <span className="font-mono font-bold text-[var(--admin-text-primary)]">{duration} seconds</span>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={duration}
            onChange={(e) => onChangeDuration(parseInt(e.target.value, 10))}
            className="w-full accent-[var(--admin-btn-primary-bg)] cursor-pointer"
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">Start Date &amp; Time</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => onChangeStartAt(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Run Indefinitely</label>
            <input
              type="checkbox"
              checked={isIndefinite}
              onChange={(e) => onChangeIndefinite(e.target.checked)}
              className="accent-[var(--admin-btn-primary-bg)] cursor-pointer"
            />
          </div>

          {!isIndefinite && (
            <div>
              <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">Expiration Date &amp; Time</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => onChangeEndAt(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

