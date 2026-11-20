'use client';

import React from 'react';
import type { PosterWithStatus } from '@/types/index';
import { Loader2 } from 'lucide-react';
import { useNoticeEditForm } from '@/hooks/useNoticeEditForm';
import { NoticeBroadcastPreviewCard } from './NoticeBroadcastPreviewCard';
import { NoticeCoreFields } from './NoticeCoreFields';
import { PosterScheduleDwellFields } from './PosterScheduleDwellFields';
import { PosterQrConfigSection } from './PosterQrConfigSection';

export interface NoticeEditFormProps {
  readonly poster: PosterWithStatus;
  readonly onClose: () => void;
  readonly onUpdated: () => void;
  readonly onDirtyChange?: ((isDirty: boolean) => void) | undefined;
  readonly onRequestClose?: (() => void) | undefined;
  readonly venueTimezone?: string | undefined;
}

export function NoticeEditForm({
  poster,
  onClose,
  onUpdated,
  onDirtyChange,
  onRequestClose,
  venueTimezone,
}: NoticeEditFormProps) {
  const form = useNoticeEditForm({ poster, onClose, onUpdated, onDirtyChange });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6 text-[var(--admin-text-primary)]">
      {form.error && (
        <div className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
          {form.error}
        </div>
      )}

      {form.isLoadingDetails && (
        <div className="flex items-center space-x-2 text-xs text-[var(--admin-text-muted)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Loading existing notice content...</span>
        </div>
      )}

      <NoticeBroadcastPreviewCard
        themeId={form.selectedTheme}
        headline={form.headline}
        description={form.description}
        duration={form.duration}
        hasQr={form.hasQr}
        qrUrl={form.qrUrl}
        qrLabel={form.qrLabel}
        qrPosition={form.qrPosition}
      />

      <NoticeCoreFields
        selectedTheme={form.selectedTheme}
        onSelectTheme={form.setSelectedTheme}
        headline={form.headline}
        onChangeHeadline={form.setHeadline}
        description={form.description}
        onChangeDescription={form.setDescription}
        disabled={form.isSubmitting}
      />

      <PosterScheduleDwellFields
        showDurationSlider
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
        urlPlaceholder="https://chat.whatsapp.com/..."
        labelPlaceholder="e.g., Scan to Join, Register Now"
        hasQr={form.hasQr}
        onChangeHasQr={form.setHasQr}
        qrUrl={form.qrUrl}
        onChangeQrUrl={form.setQrUrl}
        qrLabel={form.qrLabel}
        onChangeQrLabel={form.setQrLabel}
        qrPosition={form.qrPosition}
        onChangeQrPosition={form.setQrPosition}
        disabled={form.isSubmitting}
      />

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--admin-border)]">
        <button
          type="button"
          onClick={onRequestClose ?? onClose}
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
          <span>{form.isSubmitting ? 'Saving Changes...' : 'Save Notice Changes'}</span>
        </button>
      </div>
    </form>
  );
}
