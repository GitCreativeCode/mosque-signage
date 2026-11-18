'use client';

import React from 'react';
import type { PosterLayoutArchetype } from '@/types/index';
import type { StudioTab } from '@/lib/posters/studio-types';
import { Columns, Eye, EyeOff, QrCode, Undo2, Redo2, Copy, Loader2, Check, X } from 'lucide-react';

interface StudioHeaderBarProps {
  readonly slotCount: number;
  readonly compoundCount: number;
  readonly archetype: PosterLayoutArchetype;
  readonly activeTab: StudioTab;
  readonly hasQr: boolean;
  readonly showSafeZone: boolean;
  readonly showPreviewQr: boolean;
  readonly historyIndex: number;
  readonly historyLength: number;
  readonly isSubmitting: boolean;
  readonly isUploading: boolean;
  readonly error: string | null;
  readonly onToggleSafeZone: () => void;
  readonly onTogglePreviewQr: () => void;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly onDuplicateSlide: () => void;
  readonly onSave: () => void;
  readonly onClose: () => void;
  readonly onClearError: () => void;
}

/** Top toolbar and dismissible error banner for MultiAssetStudioModal. */
export function StudioHeaderBar({
  slotCount,
  compoundCount,
  archetype,
  activeTab,
  hasQr,
  showSafeZone,
  showPreviewQr,
  historyIndex,
  historyLength,
  isSubmitting,
  isUploading,
  error,
  onToggleSafeZone,
  onTogglePreviewQr,
  onUndo,
  onRedo,
  onDuplicateSlide,
  onSave,
  onClose,
  onClearError,
}: StudioHeaderBarProps) {
  const hasLayers = slotCount > 0 || compoundCount > 0;

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-text-primary)] shrink-0 shadow-sm">
            <Columns className="w-4 h-4 opacity-75" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="studio-modal-title" className="text-sm sm:text-base font-bold text-[var(--admin-text-primary)] truncate">
                Poster Layout Studio
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--admin-card)] text-[var(--admin-text-secondary)] border border-[var(--admin-border)] shrink-0">
                {slotCount} {slotCount === 1 ? 'Slot' : 'Slots'} • {archetype.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-[var(--admin-text-muted)] truncate hidden sm:block">
              Mix multiple images, videos, and notice cards with live 16:9 TV display preview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleSafeZone}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showSafeZone
                ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm'
                : 'border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)]'
            }`}
            title="Toggle Safe Zone Overlay Guide"
          >
            <Eye className="w-3.5 h-3.5 opacity-70" />
            <span className="hidden md:inline">Safe Zones</span>
          </button>

          {(hasQr || activeTab === 'qr') && (
            <button
              type="button"
              onClick={onTogglePreviewQr}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showPreviewQr
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm'
                  : 'border-amber-400/60 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-sm'
              }`}
              title={
                showPreviewQr
                  ? 'Hide QR code in live preview while editing (keeps QR on saved poster)'
                  : 'Show QR code in live preview'
              }
            >
              {showPreviewQr ? <QrCode className="w-3.5 h-3.5 opacity-70" /> : <EyeOff className="w-3.5 h-3.5 text-amber-500" />}
              <span className="hidden md:inline">{showPreviewQr ? 'QR Code' : 'QR Hidden'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onUndo}
            disabled={historyIndex <= 0}
            aria-label="Undo (Ctrl+Z)"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4 opacity-70" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={historyIndex >= historyLength - 1}
            aria-label="Redo (Ctrl+Y)"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4 opacity-70" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onDuplicateSlide}
            disabled={isSubmitting || isUploading || !hasLayers}
            aria-label="Duplicate slide"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] disabled:opacity-30 transition-colors cursor-pointer"
            title="Duplicate Slide (Create a copy)"
          >
            <Copy className="w-4 h-4 opacity-70" aria-hidden="true" />
          </button>

          <button
            type="button"
            disabled={isSubmitting || isUploading || !hasLayers}
            onClick={onSave}
            className="flex items-center gap-1.5 sm:gap-2 px-4 py-1.5 sm:py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer ml-1 sm:ml-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Slide</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] transition-colors cursor-pointer ml-1"
            aria-label="Close studio"
          >
            <X className="w-4 h-4 opacity-70" />
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between shrink-0">
          <span>{error}</span>
          <button type="button" onClick={onClearError} className="text-rose-500 hover:text-rose-700 underline text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

