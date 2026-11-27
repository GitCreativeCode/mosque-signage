'use client';

import React from 'react';
import { Monitor, Tablet, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface StudioDeviceRequiredModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly contextLabel?: string | undefined;
}

/**
 * Informs phone users (< 768px) that the Multi-Asset Layout Studio requires a tablet or computer,
 * while reminding them of single-asset upload, notice creation, and list management available on mobile.
 */
export function StudioDeviceRequiredModal({
  isOpen,
  onClose,
  contextLabel,
}: StudioDeviceRequiredModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-device-required-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center shrink-0">
              <Tablet className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="studio-device-required-title" className="text-sm font-bold tracking-tight">
                Tablet or Computer Required
              </h2>
              <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                Multi-Asset Layout Studio is disabled on phone screens
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notice"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-xs text-[var(--admin-text-secondary)] space-y-2 leading-relaxed">
          <p>
            {contextLabel
              ? `"${contextLabel}" is a Multi-Asset composite slide built in the Layout Studio.`
              : 'The Multi-Asset Layout Studio lets you compose split-screen layouts, resize layers, arrange stickers, and format text banners on a full widescreen canvas.'}
          </p>
          <p className="text-[11px] text-[var(--admin-text-muted)]">
            Those canvas tools work best on a <strong>tablet</strong> or <strong>computer</strong>. On your phone, you can still upload flyers/videos, create notice slides, and reorder, archive, duplicate, or delete any slide.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="inline-flex items-center space-x-1.5 text-[11px] text-[var(--admin-text-muted)]">
            <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Open on tablet or desktop to edit layout</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
