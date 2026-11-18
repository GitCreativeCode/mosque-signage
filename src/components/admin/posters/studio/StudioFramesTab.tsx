'use client';

import React from 'react';
import type { PosterSlotMedia, SlotFrameStyle } from '@/types/index';
import { FrameStylePicker } from '../FrameStylePicker';

interface StudioFramesTabProps {
  readonly activeSlot: PosterSlotMedia | undefined;
  readonly selectedSlotIndex: number | null;
  readonly totalSlots: number;
  readonly frameApplyScope: 'selected' | 'all';
  readonly onChangeScope: (scope: 'selected' | 'all') => void;
  readonly onChangeFrameStyle: (style: SlotFrameStyle, customUrl?: string) => void;
}

/** Inspector tab for slot frame borders and custom transparent frame uploads. */
export function StudioFramesTab({
  activeSlot,
  selectedSlotIndex,
  totalSlots,
  frameApplyScope,
  onChangeScope,
  onChangeFrameStyle,
}: StudioFramesTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] mb-1">
          Frames & Borders
        </h3>
        <p className="text-[11px] text-[var(--admin-text-muted)] mb-3">
          Add architectural Islamic matting, gold trim, or clean modern borders
        </p>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] mb-3 text-xs">
          <button
            type="button"
            onClick={() => onChangeScope('selected')}
            className={`flex-1 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              frameApplyScope === 'selected'
                ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
            }`}
          >
            Slot {(selectedSlotIndex ?? 0) + 1} Only
          </button>
          <button
            type="button"
            onClick={() => onChangeScope('all')}
            className={`flex-1 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              frameApplyScope === 'all'
                ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
            }`}
          >
            All Slots ({totalSlots})
          </button>
        </div>

        <FrameStylePicker
          selected={activeSlot?.frame_style ?? 'none'}
          selectedCustomUrl={activeSlot?.custom_frame_url}
          onChange={onChangeFrameStyle}
        />
      </div>
    </div>
  );
}

