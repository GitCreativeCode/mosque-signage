'use client';

import React from 'react';
import { X, Loader2, Columns } from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { MultiAssetStudioModal } from './MultiAssetStudioModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useAnnouncementSlideModal } from '@/hooks/useAnnouncementSlideModal';
import { NoticeBroadcastPreviewCard } from './NoticeBroadcastPreviewCard';
import { NoticeCoreFields } from './NoticeCoreFields';
import { PosterScheduleDwellFields } from './PosterScheduleDwellFields';
import { PosterQrConfigSection } from './PosterQrConfigSection';

export interface AnnouncementSlideModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
  readonly venueTimezone?: string | undefined;
}

export function AnnouncementSlideModal({
  isOpen,
  onClose,
  onCreated,
  venueTimezone,
}: AnnouncementSlideModalProps) {
  const modal = useAnnouncementSlideModal(isOpen, onClose, onCreated);

  const trapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen && !modal.showDiscardConfirm,
    onEscape: modal.handleRequestClose,
  });

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-modal-title"
        tabIndex={-1}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="fixed -inset-8 bg-black/60 backdrop-blur-md animate-fadeIn"
          aria-hidden="true"
          onClick={modal.handleRequestClose}
        />

        <div className="relative w-full max-w-2xl bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto text-[var(--admin-text-primary)]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--admin-border)] mb-6">
            <h2 id="announcement-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">
              Create Notice Slide
            </h2>
            <button
              type="button"
              onClick={modal.handleRequestClose}
              aria-label="Close notice modal"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {modal.error && (
            <div role="alert" className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
              {modal.error}
            </div>
          )}

          <form onSubmit={modal.handleSubmit} className="space-y-6">
            <NoticeBroadcastPreviewCard
              themeId={modal.selectedTheme}
              headline={modal.headline}
              description={modal.description}
              duration={modal.duration}
              hasQr={modal.hasQr}
              qrUrl={modal.qrUrl}
              qrLabel={modal.qrLabel}
              qrPosition={modal.qrPosition}
            />

            <NoticeCoreFields
              selectedTheme={modal.selectedTheme}
              onSelectTheme={modal.setSelectedTheme}
              headline={modal.headline}
              onChangeHeadline={modal.setHeadline}
              description={modal.description}
              onChangeDescription={modal.setDescription}
            />

            <PosterScheduleDwellFields
              showDurationSlider
              duration={modal.duration}
              onChangeDuration={modal.setDuration}
              isIndefinite={modal.isIndefinite}
              onChangeIndefinite={modal.setIsIndefinite}
              startAt={modal.startAt}
              onChangeStartAt={modal.setStartAt}
              endAt={modal.endAt}
              onChangeEndAt={modal.setEndAt}
              recurringSchedule={modal.recurringSchedule}
              onChangeRecurringSchedule={modal.setRecurringSchedule}
              venueTimezone={venueTimezone}
            />

            <PosterQrConfigSection
              urlPlaceholder="https://chat.whatsapp.com/..."
              labelPlaceholder="e.g., Scan to Join, Register Now"
              hasQr={modal.hasQr}
              onChangeHasQr={modal.setHasQr}
              qrUrl={modal.qrUrl}
              onChangeQrUrl={modal.setQrUrl}
              qrLabel={modal.qrLabel}
              onChangeQrLabel={modal.setQrLabel}
              qrPosition={modal.qrPosition}
              onChangeQrPosition={modal.setQrPosition}
            />

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--admin-border)]">
              <button
                type="button"
                onClick={() => modal.setShowStudioModal(true)}
                className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer font-medium text-xs transition shadow-sm flex items-center space-x-1.5 mr-auto"
                title="Design with rich background patterns, frames, and overlays in Layout Studio"
              >
                <Columns className="w-3.5 h-3.5 opacity-70" />
                <span>Design in Studio</span>
              </button>
              <button
                type="button"
                onClick={modal.handleRequestClose}
                disabled={modal.isSubmitting}
                className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer font-medium text-xs transition shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modal.isSubmitting}
                className="px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] active:scale-[0.98] cursor-pointer disabled:opacity-50 font-semibold text-xs shadow-sm flex items-center space-x-2 transition"
              >
                {modal.isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{modal.isSubmitting ? 'Creating Notice...' : 'Create Notice Slide'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modal.showDiscardConfirm}
        title="Discard Notice?"
        message="You have unsaved notice content. If you close now, your draft will be discarded."
        confirmLabel="Discard Draft"
        cancelLabel="Keep Editing"
        variant="warning"
        onConfirm={modal.handleForceClose}
        onCancel={() => modal.setShowDiscardConfirm(false)}
      />

      {modal.showStudioModal && (
        <MultiAssetStudioModal
          isOpen={modal.showStudioModal}
          onClose={() => modal.setShowStudioModal(false)}
          initialNotice={{
            headline: modal.headline.trim() || 'Community Announcement',
            description: modal.description.trim(),
            theme: modal.selectedTheme,
          }}
          onSaved={() => {
            modal.setShowStudioModal(false);
            onCreated();
            onClose();
          }}
        />
      )}
    </>
  );
}
