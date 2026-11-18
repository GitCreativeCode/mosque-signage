'use client';

import React, { useRef } from 'react';
import { Maximize2, Minimize2, Repeat, Upload } from 'lucide-react';
import type { PosterSlotMedia, SlotFitMode } from '@/types/index';

export interface SlotMediaControlsProps {
  readonly slot: PosterSlotMedia;
  readonly isUploading: boolean;
  readonly onUpdateSlot: (updated: PosterSlotMedia) => void;
  readonly onReplaceFile: (file: File) => void;
}

const FIT_MODE_OPTIONS: ReadonlyArray<{
  readonly mode: SlotFitMode;
  readonly label: string;
  readonly title: string;
}> = [
  { mode: 'contain', label: 'Fit (Clean)', title: 'Fit entirely with clean black background (no blur)' },
  { mode: 'contain_blur', label: 'Fit (Blur)', title: 'Fit image with soft ambient blurred halo backdrop' },
  { mode: 'cover', label: 'Fill', title: 'Fill entire card partition (crops edges if needed)' },
];

export function SlotMediaControls({
  slot,
  isUploading,
  onUpdateSlot,
  onReplaceFile,
}: SlotMediaControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onReplaceFile(f);
          }}
          className="hidden"
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs font-semibold transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isUploading ? 'Uploading Media...' : 'Replace Media File'}</span>
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
          Image / Video Fit Mode
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {FIT_MODE_OPTIONS.map((opt) => {
            const active = slot.fit_mode === opt.mode;
            const iconClass = `w-3.5 h-3.5 ${active ? 'text-[var(--admin-tab-active-border)]' : 'text-[var(--admin-text-muted)]'}`;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => onUpdateSlot({ ...slot, fit_mode: opt.mode })}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                  active
                    ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] shadow-sm ring-1 ring-[var(--admin-tab-active-border)]'
                    : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
                title={opt.title}
              >
                {opt.mode === 'contain' ? <Minimize2 className={iconClass} />
                  : opt.mode === 'contain_blur' ? <Repeat className={iconClass} />
                  : <Maximize2 className={iconClass} />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {slot.type === 'video' && (
        <div>
          <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
            Video Loop Repetitions
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onUpdateSlot({ ...slot, video_loop_count: count })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  slot.video_loop_count === count
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface)]'
                }`}
              >
                {count}x Loop
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

