'use client';

import React from 'react';
import type { PosterWithStatus } from '@/types/index';
import { Loader2, Columns } from 'lucide-react';
import { useMediaEditForm } from '@/hooks/useMediaEditForm';
import { PosterLivePreview } from './PosterLivePreview';
import { PosterVideoEngineSection } from './PosterVideoEngineSection';
import { PosterScheduleDwellFields } from './PosterScheduleDwellFields';
import { PosterQrConfigSection } from './PosterQrConfigSection';

export interface MediaEditFormProps {
  readonly poster: PosterWithStatus;
  readonly onClose: () => void;
  readonly onUpdated: () => void;
  readonly onDirtyChange?: ((isDirty: boolean) => void) | undefined;
  readonly onRequestClose?: (() => void) | undefined;
  readonly onOpenStudio?: ((poster: PosterWithStatus) => void) | undefined;
  readonly venueTimezone?: string | undefined;
}

export function MediaEditForm({
  poster,
  onClose,
  onUpdated,
  onDirtyChange,
  onRequestClose,
  onOpenStudio,
  venueTimezone,
}: MediaEditFormProps) {
  const form = useMediaEditForm({ poster, onClose, onUpdated, onDirtyChange });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6 text-[var(--admin-text-primary)]">
      {form.error && (
        <div className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
          {form.error}
        </div>
      )}

      <input
        ref={form.fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,video/ogg"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) form.handleFileChange(selected);
        }}
      />

      <PosterLivePreview
        imageUrl={form.previewUrl}
        thumbnailUrl={form.thumbnailPreviewUrl}
        isVideo={form.isVideo}
        videoLoopCount={form.videoLoopCount}
        title={form.title}
        durationSeconds={form.activeTotalDwell}
        hasQr={form.hasQr && form.isEligibleForQr}
        qrUrl={form.qrUrl}
        qrLabel={form.qrLabel}
        qrPosition={form.qrPosition}
        onReplaceImage={() => form.fileInputRef.current?.click()}
        onAddMore={onOpenStudio ? () => onOpenStudio(poster) : undefined}
      />

      {onOpenStudio && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-xs">
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-[var(--admin-text-muted)] shrink-0" />
            <span className="text-[var(--admin-text-secondary)]">
              Want to split screen, mix videos, or add notices to this poster?
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenStudio(poster)}
            className="px-3 py-1.5 rounded-lg border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] font-semibold transition cursor-pointer shrink-0"
          >
            Open in Layout Studio
          </button>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1.5">
          Poster Title
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => form.setTitle(e.target.value)}
          placeholder="e.g., Annual Fundraising Gala 2026"
          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] text-sm"
        />
      </div>

      {form.isVideo && (
        <PosterVideoEngineSection
          videoDuration={form.videoDuration}
          videoLoopCount={form.videoLoopCount}
          maxLoops={form.maxLoops}
          activeTotalDwell={form.activeTotalDwell}
          allowAudio={form.allowAudio}
          onLoopCountChange={form.handleLoopCountChange}
          onChangeAllowAudio={form.setAllowAudio}
        />
      )}

      <PosterScheduleDwellFields
        showDurationSlider={!form.isVideo}
        duration={form.duration}
        onChangeDuration={form.setDuration}
        isIndefinite={form.isIndefinite}
        onChangeIndefinite={form.setIsIndefinite}
        startAt={form.startAt}
        onChangeStartAt={form.setStartAt}
        endAt={form.endAt}
        onChangeEndAt={form.setEndAt}
        recurringSchedule={form.recurringSchedule}
        onChangeRecurringSchedule={form.setRecurringSchedule}
        venueTimezone={venueTimezone}
      />

      <PosterQrConfigSection
        urlLabelText="Target URL"
        urlPlaceholder="https://example.com/register"
        labelPlaceholder="e.g., Scan to Register, Donate Now"
        hasQr={form.hasQr}
        onChangeHasQr={form.setHasQr}
        qrUrl={form.qrUrl}
        onChangeQrUrl={form.setQrUrl}
        qrLabel={form.qrLabel}
        onChangeQrLabel={form.setQrLabel}
        qrPosition={form.qrPosition}
        onChangeQrPosition={form.setQrPosition}
        isEligibleForQr={form.isEligibleForQr}
        isVideo={form.isVideo}
        activeTotalDwell={form.activeTotalDwell}
        minLoopsRequiredForQr={form.minLoopsRequiredForQr}
        disabled={form.isSubmitting}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--admin-border)]">
        <button
          type="button"
          onClick={onRequestClose || onClose}
          disabled={form.isSubmitting}
          className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer font-medium text-xs transition shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={form.isSubmitting}
          className="px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] active:scale-[0.98] cursor-pointer disabled:opacity-50 font-semibold text-xs shadow-sm flex items-center space-x-2 transition"
        >
          {form.isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{form.isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
        </button>
      </div>
    </form>
  );
}
