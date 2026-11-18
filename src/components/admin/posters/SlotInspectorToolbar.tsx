'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { PosterSlotMedia } from '@/types/index';
import { FrameStylePicker } from './FrameStylePicker';
import { SlotNoticeFields } from './SlotNoticeFields';
import { SlotMediaControls } from './SlotMediaControls';

export interface SlotInspectorToolbarProps {
  readonly slot: PosterSlotMedia;
  readonly slotIndex: number;
  readonly totalSlots: number;
  readonly onUpdateSlot: (updated: PosterSlotMedia) => void;
  readonly onRemoveSlot: () => void;
  readonly onReplaceFile: (file: File) => void;
  readonly isUploading?: boolean | undefined;
}

const BADGE_CLASSES: Record<'emerald' | 'gold' | 'red' | 'blue' | 'purple' | 'amber', string> = {
  gold: 'bg-amber-400 text-black',
  red: 'bg-rose-600 text-white',
  blue: 'bg-blue-600 text-white',
  purple: 'bg-purple-600 text-white',
  amber: 'bg-amber-600 text-white',
  emerald: 'bg-emerald-600 text-white',
};

export function SlotInspectorToolbar({
  slot,
  slotIndex,
  totalSlots,
  onUpdateSlot,
  onRemoveSlot,
  onReplaceFile,
  isUploading = false,
}: SlotInspectorToolbarProps) {
  return (
    <div className="space-y-4 p-4 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center justify-center">
            {slotIndex + 1}
          </span>
          <span className="font-bold text-sm text-[var(--admin-text-primary)]">{slot.label || `Layer ${slotIndex + 1}`}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[var(--admin-card)] text-[var(--admin-text-muted)] border border-[var(--admin-border)]">
            {slot.type}
          </span>
        </div>

        {totalSlots > 1 && (
          <button
            type="button"
            onClick={onRemoveSlot}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {slot.type === 'notice' ? (
        <SlotNoticeFields slot={slot} onUpdateSlot={onUpdateSlot} />
      ) : (
        <SlotMediaControls
          slot={slot}
          isUploading={isUploading}
          onUpdateSlot={onUpdateSlot}
          onReplaceFile={onReplaceFile}
        />
      )}

      <FrameStylePicker
        selected={slot.frame_style}
        selectedCustomUrl={slot.custom_frame_url}
        onChange={(frame_style, customUrl) => onUpdateSlot({ ...slot, frame_style, custom_frame_url: customUrl })}
      />

      <div className="pt-3 border-t border-[var(--admin-border)] space-y-2">
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
          Attached Sticker Ribbon (Optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={slot.badge_text ?? ''}
            onChange={(e) => onUpdateSlot({ ...slot, badge_text: e.target.value })}
            placeholder="e.g. TONIGHT, FREE DINNER"
            className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-xs text-[var(--admin-text-primary)]"
          />
          {slot.badge_text && (
            <button
              type="button"
              onClick={() => onUpdateSlot({ ...slot, badge_text: undefined })}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 text-xs"
              title="Remove ribbon"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {slot.badge_text && (
          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {(['emerald', 'gold', 'red', 'blue', 'purple', 'amber'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onUpdateSlot({ ...slot, badge_variant: v })}
                className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  (slot.badge_variant ?? 'emerald') === v ? 'ring-2 ring-white scale-105 shadow' : 'opacity-70 hover:opacity-100'
                } ${BADGE_CLASSES[v]}`}
              >
                {v.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
