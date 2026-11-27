'use client';

import React, { useState, useCallback } from 'react';
import type { PosterWithStatus } from '@/types/index';
import { X } from 'lucide-react';
import { NoticeEditForm } from './NoticeEditForm';
import { MediaEditForm } from './MediaEditForm';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface EditPosterModalProps {
  readonly poster: PosterWithStatus | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUpdated: () => void;
  readonly onOpenStudio?: ((poster: PosterWithStatus) => void) | undefined;
  readonly venueTimezone?: string | undefined;
}

export function EditPosterModal({
  poster,
  isOpen,
  onClose,
  onUpdated,
  onOpenStudio,
  venueTimezone,
}: EditPosterModalProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const trapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen && poster !== null && !showDiscardConfirm,
    onEscape: handleRequestClose,
  });

  if (!isOpen || !poster) return null;

  const isNotice =
    poster.image_path.includes('announcement-') || poster.image_path.endsWith('.svg');

  const handleForceClose = () => {
    setShowDiscardConfirm(false);
    setIsDirty(false);
    onClose();
  };

  return (
    <>
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-poster-modal-title"
        tabIndex={-1}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      >
        {/* Full-bleed Backdrop extending beyond viewport to eliminate blur kernel edge decay */}
        <div
          className="fixed -inset-8 bg-black/60 backdrop-blur-md animate-fadeIn"
          aria-hidden="true"
          onClick={handleRequestClose}
        />

        <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl bg-[var(--admin-card)] border-0 sm:border border-[var(--admin-border)] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--admin-text-primary)]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/50 shrink-0">
            <div>
              <h2 id="edit-poster-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">
                {isNotice ? 'Edit Notice Slide' : 'Edit Poster Flyer'}
              </h2>
              <span className="text-xs text-[var(--admin-text-muted)] font-mono">
                #{poster.id.slice(0, 8)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Close edit modal"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] active:scale-95 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {/* Content Body routed by slide archetype */}
            {isNotice ? (
              <NoticeEditForm
                poster={poster}
                onClose={onClose}
                onUpdated={onUpdated}
                onDirtyChange={setIsDirty}
                onRequestClose={handleRequestClose}
                venueTimezone={venueTimezone}
              />
            ) : (
              <MediaEditForm
                poster={poster}
                onClose={onClose}
                onUpdated={onUpdated}
                onDirtyChange={setIsDirty}
                onRequestClose={handleRequestClose}
                onOpenStudio={onOpenStudio}
                venueTimezone={venueTimezone}
              />
            )}
          </div>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showDiscardConfirm}
        title="Discard Changes?"
        message="You have unsaved changes to this item. If you close now, your edits will be discarded."
        confirmLabel="Discard Edits"
        cancelLabel="Keep Editing"
        variant="warning"
        onConfirm={handleForceClose}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
