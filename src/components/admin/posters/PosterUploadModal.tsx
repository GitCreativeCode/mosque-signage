'use client';

import React, { useState } from 'react';
import { ChevronDown, Eye, X } from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { MultiAssetStudioModal } from './MultiAssetStudioModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useIsSmallScreen } from '@/hooks/useIsSmallScreen';
import { usePosterUploadModal } from '@/hooks/usePosterUploadModal';
import { PosterUploadDropZone } from './PosterUploadDropZone';
import { PosterVideoEngineSection } from './PosterVideoEngineSection';
import { PosterScheduleDwellFields } from './PosterScheduleDwellFields';
import { PosterQrConfigSection } from './PosterQrConfigSection';
import { PosterUploadFooter } from './PosterUploadFooter';

export interface PosterUploadModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUploaded: () => void;
  readonly venueTimezone?: string | undefined;
}

export function PosterUploadModal({
  isOpen,
  onClose,
  onUploaded,
  venueTimezone,
}: PosterUploadModalProps) {
  const { isSmallScreen } = useIsSmallScreen();
  const [showMobilePreview, setShowMobilePreview] = useState(true);
  const modal = usePosterUploadModal(isOpen, onClose, onUploaded, isSmallScreen);

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
        aria-labelledby="poster-upload-modal-title"
        tabIndex={-1}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      >
        <div
          className="fixed -inset-8 bg-black/60 backdrop-blur-md animate-fadeIn"
          aria-hidden="true"
          onClick={modal.handleRequestClose}
        />

        <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl bg-[var(--admin-card)] border-0 sm:border border-[var(--admin-border)] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--admin-text-primary)]">
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/50 shrink-0">
            <h2 id="poster-upload-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">
              Upload a Poster / Video
            </h2>
            <button
              type="button"
              onClick={modal.handleRequestClose}
              aria-label="Close upload modal"
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
              <input
                ref={modal.fileInputRef}
                type="file"
                multiple={!isSmallScreen}
                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,video/ogg"
                className="hidden"
                onChange={(e) => modal.handleFilesSelected(e.target.files)}
              />

              {modal.previewUrl && (
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
              )}

              <div className={modal.previewUrl && !showMobilePreview ? 'hidden sm:block' : 'block'}>
                <PosterUploadDropZone
                  file={modal.file}
                  previewUrl={modal.previewUrl}
                  thumbnailPreviewUrl={modal.thumbnailPreviewUrl}
                  isVideo={modal.isVideo}
                  videoLoopCount={modal.videoLoopCount}
                  title={modal.title}
                  activeTotalDwell={modal.activeTotalDwell}
                  hasQr={modal.hasQr}
                  isEligibleForQr={modal.isEligibleForQr}
                  qrUrl={modal.qrUrl}
                  qrLabel={modal.qrLabel}
                  qrPosition={modal.qrPosition}
                  isSmallScreen={isSmallScreen}
                  onPickFile={() => modal.fileInputRef.current?.click()}
                  onFilesDropped={modal.handleFilesSelected}
                  onOpenStudio={modal.openInStudio}
                />
              </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1.5">
                Poster Title
              </label>
              <input
                type="text"
                required
                value={modal.title}
                onChange={(e) => modal.setTitle(e.target.value)}
                placeholder="e.g., Annual Fundraising Gala 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] text-sm"
              />
            </div>

            {modal.isVideo && (
              <PosterVideoEngineSection
                videoDuration={modal.videoDuration}
                videoLoopCount={modal.videoLoopCount}
                maxLoops={modal.maxLoops}
                activeTotalDwell={modal.activeTotalDwell}
                allowAudio={modal.allowAudio}
                onLoopCountChange={modal.handleLoopCountChange}
                onChangeAllowAudio={modal.setAllowAudio}
              />
            )}

            <PosterScheduleDwellFields
              showDurationSlider={!modal.isVideo}
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
              urlLabelText="Target URL"
              urlPlaceholder="https://example.com/register"
              labelPlaceholder="e.g., Scan to Register, Donate Now"
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
              isEligibleForQr={modal.isEligibleForQr}
              isVideo={modal.isVideo}
              activeTotalDwell={modal.activeTotalDwell}
              minLoopsRequiredForQr={modal.minLoopsRequiredForQr}
            />

            <PosterUploadFooter
              hasFile={Boolean(modal.file)}
              isVideo={modal.isVideo}
              isSubmitting={modal.isSubmitting}
              isSmallScreen={isSmallScreen}
              onOpenStudio={modal.openInStudio}
              onCancel={modal.handleRequestClose}
            />
          </form>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modal.showDiscardConfirm}
        title="Discard Upload?"
        message="You have unsaved poster content. If you close now, your draft will be discarded."
        confirmLabel="Discard Draft"
        cancelLabel="Keep Editing"
        variant="warning"
        onConfirm={modal.handleForceClose}
        onCancel={() => modal.setShowDiscardConfirm(false)}
      />

      {modal.showStudioModal && (
        <MultiAssetStudioModal
          isOpen={modal.showStudioModal}
          onClose={() => {
            modal.setShowStudioModal(false);
            modal.setStudioFiles([]);
          }}
          initialFiles={modal.studioFiles}
          onSaved={() => {
            modal.setShowStudioModal(false);
            modal.setStudioFiles([]);
            onUploaded();
            onClose();
          }}
        />
      )}
    </>
  );
}
