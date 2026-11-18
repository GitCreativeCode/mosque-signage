'use client';

import React from 'react';
import { Check, Frame, Loader2, Trash2, Upload } from 'lucide-react';
import type { SlotFrameStyle } from '@/types/index';

export interface CustomFrameEntry {
  readonly id: string;
  readonly name: string;
  readonly url: string;
}

export interface CustomFrameLibraryGridProps {
  readonly selected: SlotFrameStyle;
  readonly selectedCustomUrl?: string | undefined;
  readonly disabled: boolean;
  readonly isUploading: boolean;
  readonly isLoadingFrames: boolean;
  readonly uploadError: string | null;
  readonly customFrames: readonly CustomFrameEntry[];
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onChange: (style: SlotFrameStyle, customUrl?: string) => void;
  readonly onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onDeleteFrame: (e: React.MouseEvent, frameId: string) => void;
}

export function CustomFrameLibraryGrid({
  selected,
  selectedCustomUrl,
  disabled,
  isUploading,
  isLoadingFrames,
  uploadError,
  customFrames,
  fileInputRef,
  onChange,
  onUploadFile,
  onDeleteFrame,
}: CustomFrameLibraryGridProps) {
  return (
    <div className="pt-2 border-t border-[var(--admin-border)] space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-xs font-semibold text-[var(--admin-text-primary)]">Mosque Custom Frames</span>
          <span className="text-[10px] text-[var(--admin-text-muted)]">Upload transparent PNG or SVG border designs</span>
        </div>

        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1 rounded-lg border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>Upload Frame</span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml" onChange={onUploadFile} className="hidden" />
      </div>

      {uploadError && (
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px]">{uploadError}</div>
      )}

      {isLoadingFrames ? (
        <div className="py-4 flex items-center justify-center space-x-2 text-xs text-[var(--admin-text-muted)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Loading custom frames...</span>
        </div>
      ) : customFrames.length === 0 ? (
        <div className="p-4 text-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)]/50">
          <Frame className="w-6 h-6 text-[var(--admin-text-muted)] mx-auto mb-1 opacity-50" />
          <p className="text-[11px] text-[var(--admin-text-muted)]">
            No custom frames uploaded yet. Upload a transparent PNG/SVG frame to use on your slots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {customFrames.map((frame) => {
            const isSelected = selected === 'custom' && selectedCustomUrl === frame.url;
            return (
              <div
                key={frame.id}
                onClick={() => onChange('custom', frame.url)}
                className={`group relative flex items-center p-2 rounded-xl border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] shadow-sm ring-1 ring-[var(--admin-tab-active-border)]'
                    : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:border-[var(--admin-tab-active-border)]/60'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 mr-2.5 p-0.5">
                  <img src={frame.url} alt={frame.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <span className="block font-semibold text-xs text-[var(--admin-text-primary)] truncate">{frame.name}</span>
                  <span className="text-[10px] text-[var(--admin-text-muted)] block">Custom Frame</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[var(--admin-tab-active-border)] shrink-0 mr-1" />}
                <button
                  type="button"
                  onClick={(e) => onDeleteFrame(e, frame.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--admin-text-muted)] hover:text-rose-500 rounded transition"
                  title="Delete custom frame"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

