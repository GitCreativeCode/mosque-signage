'use client';

import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { StudioNumericInput } from './StudioNumericInput';

interface StudioBatchSelectionCardProps {
  readonly selectedCount: number;
  readonly onGroupSelected: () => void;
  readonly onMergeSelected: () => void;
  readonly onLockSelected: () => void;
  readonly onDeleteSelected: () => void;
  readonly onDeselectAll: () => void;
  readonly onBatchRotateDelta?: ((deltaDeg: number) => void) | undefined;
  readonly onBatchResetRotation?: (() => void) | undefined;
}

/** Summary actions and relative delta rotation controls for multi-selected studio layers. */
export function StudioBatchSelectionCard({
  selectedCount,
  onGroupSelected,
  onMergeSelected,
  onLockSelected,
  onDeleteSelected,
  onDeselectAll,
  onBatchRotateDelta,
  onBatchResetRotation,
}: StudioBatchSelectionCardProps) {
  const [batchDeltaDeg, setBatchDeltaDeg] = useState<number>(0);

  useEffect(() => {
    setBatchDeltaDeg(0);
  }, [selectedCount]);

  const handleApplyDelta = (nextVal: number) => {
    const delta = nextVal - batchDeltaDeg;
    setBatchDeltaDeg(nextVal);
    onBatchRotateDelta?.(delta);
  };

  const handleReset = () => {
    setBatchDeltaDeg(0);
    onBatchResetRotation?.();
  };

  return (
    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/40 space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
        <span>{selectedCount} Layers Selected</span>
        <button
          type="button"
          onClick={onDeselectAll}
          className="text-[10px] text-[var(--admin-text-muted)] hover:text-white underline cursor-pointer"
        >
          Deselect All
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={onGroupSelected}
          className="px-2 py-1 rounded-lg bg-[var(--admin-card)] hover:bg-white/20 text-white text-[11px] font-semibold border border-[var(--admin-border)] cursor-pointer"
        >
          Group
        </button>
        <button
          type="button"
          onClick={onMergeSelected}
          className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[11px] font-semibold border border-indigo-400/40 cursor-pointer"
        >
          Merge
        </button>
        <button
          type="button"
          onClick={onLockSelected}
          className="px-2 py-1 rounded-lg bg-[var(--admin-card)] hover:bg-white/20 text-white text-[11px] font-semibold border border-[var(--admin-border)] cursor-pointer"
        >
          Lock
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          className="px-2 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-[11px] font-semibold border border-rose-400/40 cursor-pointer ml-auto"
        >
          Delete
        </button>
      </div>

      <div className="pt-2 border-t border-amber-400/30 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-[var(--admin-text-secondary)]">
          <span className="flex items-center gap-1 font-semibold text-amber-300">
            <RotateCw className="w-3 h-3 opacity-80" />
            <span>Rotate Selected (Delta)</span>
          </span>
          <div className="flex items-center gap-1 font-mono">
            <StudioNumericInput
              min={-180}
              max={180}
              value={batchDeltaDeg}
              onChange={handleApplyDelta}
              className="w-10 text-center font-bold bg-[var(--admin-card)] border border-[var(--admin-border)] rounded py-0.5 px-1 text-[10px] text-[var(--admin-text-primary)]"
            />
            <span className="text-[10px] text-[var(--admin-text-muted)]">°</span>
            {batchDeltaDeg !== 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[9px] text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={batchDeltaDeg}
          onChange={(e) => handleApplyDelta(parseInt(e.target.value, 10))}
          className="w-full accent-amber-400 cursor-pointer"
        />
      </div>
    </div>
  );
}

