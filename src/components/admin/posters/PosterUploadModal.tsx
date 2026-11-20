'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { MultiAssetStudioModal } from './MultiAssetStudioModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';
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
  const modal = usePosterUploadModal(isOpen, onClose, onUploaded);

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="fixed -inset-8 bg-black/60 backdrop-blur-md animate-fadeIn"
          aria-hidden="true"
          onClick={modal.handleRequestClose}
        />

        <div className="relative w-full max-w-2xl bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto text-[var(--admin-text-primary)]">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--admin-border)] mb-6">
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

          {modal.error && (
            <div role="alert" className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
              {modal.error}
            </div>
          )}

          <form onSubmit={modal.handleSubmit} className="space-y-6">
            <input
              ref={modal.fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,video/ogg"
              className="hidden"
              onChange={(e) => modal.handleFilesSelected(e.target.files)}
            />

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
              onPickFile={() => modal.fileInputRef.current?.click()}
              onFilesDropped={modal.handleFilesSelected}
              onOpenStudio={modal.openInStudio}
            />

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
              isEligibleForQr={modal.isEligibleForQr}
              isVideo={modal.isVideo}
              activeTotalDwell={modal.activeTotalDwell}
              minLoopsRequiredForQr={modal.minLoopsRequiredForQr}
            />

            <PosterUploadFooter
              hasFile={Boolean(modal.file)}
              isVideo={modal.isVideo}
              isSubmitting={modal.isSubmitting}
              onOpenStudio={modal.openInStudio}
              onCancel={modal.handleRequestClose}
            />
          </form>
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
