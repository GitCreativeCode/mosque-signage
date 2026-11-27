'use client';

import React from 'react';
import type { PosterTextOverlay } from '@/types/index';
import { MoveHorizontal } from 'lucide-react';
import { clampTextScale, TEXT_STRETCH_MAX, TEXT_STRETCH_MIN } from '@/lib/posters/overlay-styles';
import { StudioNumericInput } from './StudioNumericInput';

interface StudioTextStretchControlsProps {
  readonly overlay: PosterTextOverlay;
  readonly overlayIndex: number;
  readonly onPatchOverlay: (index: number, patch: Partial<PosterTextOverlay>) => void;
}

/** Width/Height stretch percentage inputs with 1-click Reset for selected text banners. */
export function StudioTextStretchControls({
  overlay,
  overlayIndex,
  onPatchOverlay,
}: StudioTextStretchControlsProps) {
  const sxPct = Math.round(clampTextScale(overlay.scale_x) * 100);
  const syPct = Math.round(clampTextScale(overlay.scale_y) * 100);
  const isStretched = sxPct !== 100 || syPct !== 100;
  const minStretchPct = Math.round(TEXT_STRETCH_MIN * 100);
  const maxStretchPct = Math.round(TEXT_STRETCH_MAX * 100);

  return (
    <div className="space-y-1.5 pt-1 border-t border-[var(--admin-border)]/50">
      <div className="flex items-center justify-between text-[10px] text-[var(--admin-text-secondary)]">
        <span className="flex items-center gap-1 font-semibold">
          <MoveHorizontal className="w-3 h-3 opacity-70" />
          <span>Stretch (W × H)</span>
        </span>
        {isStretched && (
          <button
            type="button"
            onClick={() => onPatchOverlay(overlayIndex, { scale_x: 1, scale_y: 1 })}
            className="text-[9px] text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)]">
          <span className="text-[10px] text-[var(--admin-text-muted)]">W</span>
          <div className="flex items-center gap-0.5">
            <StudioNumericInput
              min={minStretchPct}
              max={maxStretchPct}
              value={sxPct}
              onChange={(val) => onPatchOverlay(overlayIndex, { scale_x: val / 100 })}
              title="Horizontal stretch (25%–400%)"
              className="w-10 text-right font-bold bg-transparent text-[11px] text-[var(--admin-text-primary)] focus:outline-none"
            />
            <span className="text-[10px] text-[var(--admin-text-muted)]">%</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)]">
          <span className="text-[10px] text-[var(--admin-text-muted)]">H</span>
          <div className="flex items-center gap-0.5">
            <StudioNumericInput
              min={minStretchPct}
              max={maxStretchPct}
              value={syPct}
              onChange={(val) => onPatchOverlay(overlayIndex, { scale_y: val / 100 })}
              title="Vertical stretch (25%–400%)"
              className="w-10 text-right font-bold bg-transparent text-[11px] text-[var(--admin-text-primary)] focus:outline-none"
            />
            <span className="text-[10px] text-[var(--admin-text-muted)]">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
