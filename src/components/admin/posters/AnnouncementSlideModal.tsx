'use client';

import React, { useState } from 'react';
import { ChevronDown, Eye, X, Loader2, Columns } from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { MultiAssetStudioModal } from './MultiAssetStudioModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useIsSmallScreen } from '@/hooks/useIsSmallScreen';
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
  const { isSmallScreen } = useIsSmallScreen();
  const [showMobilePreview, setShowMobilePreview] = useState(true);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      >
        <div
          className="fixed -inset-8 bg-black/60 backdrop-blur-md animate-fadeIn"
          aria-hidden="true"
          onClick={modal.handleRequestClose}
        />

        <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl bg-[var(--admin-card)] border-0 sm:border border-[var(--admin-border)] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--admin-text-primary)]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/50 shrink-0">
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

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {modal.error && (
              <div role="alert" className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                {modal.error}
              </div>
            )}

            <form onSubmit={modal.handleSubmit} className="space-y-5 sm:space-y-6">
              <button
                type="button"
                onClick={() => setShowMobilePreview((p) => !p)}
                className="sm:hidden w-full flex items-center justify-between px-3 py-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs font-semibold text-[var(--admin-text-secondary)]"
              >
                <span className="flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{showMobilePreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMobilePreview ? 'rotate-180' : ''}`} />
              </button>

              <div className={showMobilePreview ? 'block' : 'hidden sm:block'}>
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
              </div>

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
              qrStartAt={modal.qrStartAt}
              onChangeQrStartAt={modal.setQrStartAt}
              qrEndAt={modal.qrEndAt}
              onChangeQrEndAt={modal.setQrEndAt}
              venueTimezone={venueTimezone}
            />

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-[var(--admin-border)]">
              <button
                type="button"
                disabled={isSmallScreen}
                onClick={() => {
                  if (!isSmallScreen) modal.setShowStudioModal(true);
                }}
                className={`min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl border font-medium text-xs transition shadow-sm flex items-center justify-center space-x-1.5 sm:mr-auto ${
                  isSmallScreen
                    ? 'border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)] opacity-60 cursor-not-allowed'
                    : 'border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer'
                }`}
                title={
                  isSmallScreen
                    ? 'Multi-Asset Studio requires a tablet or computer'
                    : 'Design with rich background patterns, frames, and overlays in Layout Studio'
                }
              >
                <Columns className="w-3.5 h-3.5 opacity-70" />
                <span>Design in Studio</span>
                {isSmallScreen && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--admin-card)] border border-[var(--admin-border)] text-[9px] font-bold uppercase">
                    Tablet / PC
                  </span>
                )}
              </button>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={modal.handleRequestClose}
                  disabled={modal.isSubmitting}
                  className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer font-medium text-xs transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modal.isSubmitting}
                  className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] active:scale-[0.98] cursor-pointer disabled:opacity-50 font-semibold text-xs shadow-sm flex items-center justify-center space-x-2 transition"
                >
                  {modal.isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modal.isSubmitting ? 'Creating Notice...' : 'Create Notice Slide'}</span>
                </button>
              </div>
            </div>
          </form>
          </div>
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
