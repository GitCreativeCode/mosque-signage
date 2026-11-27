'use client';

import React, { useState, useEffect } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';
import type { PosterLayoutArchetype, PosterSlotMedia } from '@/types/index';
import { FrameStylePicker } from './FrameStylePicker';
import { SlotNoticeFields } from './SlotNoticeFields';
import { SlotMediaControls } from './SlotMediaControls';

export interface SlotInspectorToolbarProps {
  readonly slot: PosterSlotMedia;
  readonly slotIndex: number;
  readonly totalSlots: number;
  readonly archetype?: PosterLayoutArchetype | undefined;
  readonly onUpdateSlot: (updated: PosterSlotMedia) => void;
  readonly onRemoveSlot: () => void;
  readonly onReplaceFile: (file: File) => void;
  readonly isUploading?: boolean | undefined;
}

export function SlotInspectorToolbar({
  slot,
  slotIndex,
  totalSlots,
  archetype = 'single',
  onUpdateSlot,
  onRemoveSlot,
  onReplaceFile,
  isUploading = false,
}: SlotInspectorToolbarProps) {
  const [draftRotation, setDraftRotation] = useState<string>(String(slot.rotation ?? 0));

  useEffect(() => {
    setDraftRotation(String(slot.rotation ?? 0));
  }, [slot.rotation, slot.id]);

  const commitRotation = (val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      setDraftRotation(String(slot.rotation ?? 0));
      return;
    }
    const clamped = Math.max(-180, Math.min(180, parsed));
    onUpdateSlot({ ...slot, rotation: clamped });
    setDraftRotation(String(clamped));
  };

  const isFreeform = archetype === 'freeform';

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
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
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

      {isFreeform && (
        <div className="pt-3 border-t border-[var(--admin-border)] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-semibold text-[var(--admin-text-secondary)]">
              <RotateCw className="w-3.5 h-3.5 opacity-70" />
              <span>Card Rotation</span>
            </span>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <input
                type="text"
                value={draftRotation}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || v === '-' || /^-?\d*$/.test(v)) {
                    setDraftRotation(v);
                  }
                }}
                onBlur={() => commitRotation(draftRotation)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRotation(draftRotation);
                }}
                className="w-12 text-center font-bold bg-[var(--admin-card)] border border-[var(--admin-border)] rounded py-0.5 px-1 text-xs text-[var(--admin-text-primary)] focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-[var(--admin-text-muted)]">°</span>
              {(slot.rotation ?? 0) !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSlot({ ...slot, rotation: 0 });
                    setDraftRotation('0');
                  }}
                  className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold underline cursor-pointer ml-1"
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
            value={slot.rotation ?? 0}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onUpdateSlot({ ...slot, rotation: val });
              setDraftRotation(String(val));
            }}
            className="w-full accent-[var(--admin-tab-active-border)] cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
