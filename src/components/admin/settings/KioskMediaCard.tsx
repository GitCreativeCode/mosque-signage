'use client';

import React from 'react';
import type { PosterFitMode, PosterTransitionType } from '@/types/index';

export interface KioskMediaCardProps {
  readonly posterFit: PosterFitMode;
  readonly setPosterFit: (val: PosterFitMode) => void;
  readonly posterTransition: PosterTransitionType;
  readonly setPosterTransition: (val: PosterTransitionType) => void;
  readonly showProgressBar: boolean;
  readonly setShowProgressBar: (val: boolean) => void;
  readonly markDirty: () => void;
}

export function KioskMediaCard({
  posterFit, setPosterFit,
  posterTransition, setPosterTransition,
  showProgressBar, setShowProgressBar,
  markDirty,
}: KioskMediaCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 space-y-5 shadow-sm">
      <div className="border-b border-[var(--admin-border)] pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-primary)]">
          Poster &amp; Media Presentation
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Poster Canvas Fit</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { mode: 'contain', label: 'Contain (Blur)' },
              { mode: 'cover', label: 'Cover (Fill)' },
            ] as const).map((opt) => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => { setPosterFit(opt.mode); markDirty(); }}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${
                  posterFit === opt.mode
                    ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] font-semibold shadow-sm'
                    : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)]">
            Contain fits full artwork with ambient blur; Cover fills entire canvas.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Slide Transition Motion</label>
          <select
            value={posterTransition}
            onChange={(e) => { setPosterTransition(e.target.value as PosterTransitionType); markDirty(); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
          >
            <option value="fade">Fade (Smooth 600ms)</option>
            <option value="slide-left">Slide Left</option>
            <option value="slide-right">Slide Right</option>
            <option value="slide-up">Slide Up</option>
            <option value="zoom">Zoom</option>
          </select>
          <p className="text-[11px] text-[var(--admin-text-muted)]">
            GPU-accelerated transition between rotating slides.
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--admin-border)] flex items-center justify-between">
        <div className="space-y-0.5 pr-4">
          <span className="text-xs font-semibold text-[var(--admin-text-primary)] block">
            Slide Dwell Progress Bar (Bottom Edge Line)
          </span>
          <p className="text-[11px] text-[var(--admin-text-muted)]">
            Displays a thin emerald progress line gliding along the bottom screen edge showing slide dwell time.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={showProgressBar}
            onChange={(e) => { setShowProgressBar(e.target.checked); markDirty(); }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-btn-primary-bg)]" />
        </label>
      </div>
    </div>
  );
}

