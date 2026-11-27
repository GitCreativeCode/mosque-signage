'use client';

import React, { useMemo } from 'react';
import type { PosterWithStatus } from '@/types/index';
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Clock,
  Columns,
  Copy,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  QrCode,
  Trash2,
  Video,
} from 'lucide-react';
import { getPosterTypeInfo } from '@/lib/posters/poster-type-info';
import { formatIsoDateTime } from '@/lib/utils/time';
import { sanitizeExternalUrl } from '@/lib/utils/url-safety';
import { MiniCompositeThumbnail } from './MiniCompositeThumbnail';
import { getPosterRecurringSubStatus } from '@/lib/engine/poster-status';
import { parseRecurringSchedule, formatNextActiveTelemetry } from '@/lib/posters/recurring-schedule';
import { getQrScheduleStatus } from '@/lib/posters/qr-schedule';

export interface PosterSequenceMobileCardProps {
  readonly poster: PosterWithStatus;
  readonly index: number;
  readonly totalCount: number;
  readonly archivingId: string | null;
  readonly duplicatingId?: string | null | undefined;
  readonly venueTimezone?: string | undefined;
  readonly isSelected?: boolean | undefined;
  readonly onToggleSelect?: ((id: string) => void) | undefined;
  readonly onMovePoster: (index: number, direction: -1 | 1) => void;
  readonly onEditPoster: (poster: PosterWithStatus) => void;
  readonly onToggleArchive: (id: string) => void;
  readonly onDeletePoster: (id: string) => void;
  readonly onDuplicatePoster?: ((id: string) => void) | undefined;
}

/** Touch-first mobile sequence card replacing the 7-column table below `md` (768px). */
export function PosterSequenceMobileCard({
  poster,
  index,
  totalCount,
  archivingId,
  duplicatingId,
  venueTimezone = 'UTC',
  isSelected = false,
  onToggleSelect,
  onMovePoster,
  onEditPoster,
  onToggleArchive,
  onDeletePoster,
  onDuplicatePoster,
}: PosterSequenceMobileCardProps) {
  const isArchived = poster.status === 'ARCHIVED';
  const typeInfo = getPosterTypeInfo(poster);
  const safeQrHref = poster.qr_url ? sanitizeExternalUrl(poster.qr_url) : null;

  const qrStatus = useMemo(
    () => (poster.qr_url ? getQrScheduleStatus(poster, new Date(), venueTimezone) : null),
    [poster, venueTimezone]
  );
  const recurringRules = useMemo(() => parseRecurringSchedule(poster.recurring_schedule), [poster.recurring_schedule]);
  const isRecurring = Boolean(recurringRules && recurringRules.length > 0);
  const recurringSubStatus =
    isRecurring && poster.status === 'ACTIVE'
      ? getPosterRecurringSubStatus(poster, new Date(), venueTimezone)
      : null;

  let dotClass =
    poster.status === 'ACTIVE'
      ? 'bg-emerald-500'
      : poster.status === 'UPCOMING'
      ? 'bg-sky-500'
      : isArchived
      ? 'bg-amber-500'
      : 'bg-neutral-400';

  let statusText: string = (poster.status || 'ACTIVE').toLowerCase();
  if (recurringSubStatus === 'ACTIVE_NOW') {
    dotClass = 'bg-emerald-500 animate-pulse';
    statusText = 'active (recurring)';
  } else if (recurringSubStatus === 'STANDBY') {
    dotClass = 'bg-amber-500';
    const nextTelemetry = formatNextActiveTelemetry(recurringRules, new Date(), venueTimezone);
    statusText = `standby (${nextTelemetry})`;
  }

  return (
    <div
      className={`p-3.5 rounded-2xl border bg-[var(--admin-card)] shadow-xs space-y-3 transition-colors ${
        isSelected
          ? 'border-blue-500 ring-1 ring-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20'
          : isArchived
          ? 'border-dashed border-amber-500/40 opacity-80'
          : 'border-[var(--admin-border)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center space-y-1 shrink-0">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(poster.id)}
              aria-label={`Select ${poster.title}`}
              className="w-5 h-5 rounded cursor-pointer accent-[var(--admin-tab-active-border)] mb-1"
            />
          )}
          <span className="text-[11px] font-mono font-bold text-[var(--admin-text-muted)]">#{index + 1}</span>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMovePoster(index, -1)}
              aria-label={`Move ${poster.title} up`}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] disabled:opacity-25 active:scale-95 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={index === totalCount - 1}
              onClick={() => onMovePoster(index, 1)}
              aria-label={`Move ${poster.title} down`}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] disabled:opacity-25 active:scale-95 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-3">
            <div className="relative isolate w-24 aspect-video rounded-lg overflow-hidden bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center justify-center shrink-0">
              {poster.layout_config ? (
                <MiniCompositeThumbnail
                  layoutConfig={poster.layout_config}
                  posterTitle={poster.title}
                  fallbackImagePath={poster.thumbnail_path || poster.image_path}
                  compact
                />
              ) : poster.media_type === 'video' && !poster.thumbnail_path ? (
                <video src={`${poster.image_path}#t=0.001`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
              ) : (
                <img
                  src={poster.thumbnail_path || poster.image_path}
                  alt={poster.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="font-bold text-sm text-[var(--admin-text-primary)] leading-snug line-clamp-2">
                {poster.title}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--admin-text-secondary)]">
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                  {typeInfo.type === 'composite' ? (
                    <Columns className="w-3 h-3 text-[var(--admin-text-muted)]" aria-hidden="true" />
                  ) : typeInfo.type === 'video' ? (
                    <Video className="w-3 h-3 text-[var(--admin-text-muted)]" aria-hidden="true" />
                  ) : typeInfo.type === 'notice' ? (
                    <FileText className="w-3 h-3 text-[var(--admin-text-muted)]" aria-hidden="true" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-[var(--admin-text-muted)]" aria-hidden="true" />
                  )}
                  <span>{typeInfo.label}</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[var(--admin-surface)] border border-[var(--admin-border)] font-mono">
                  <Clock className="w-3 h-3 text-[var(--admin-text-muted)]" aria-hidden="true" />
                  <span>{poster.duration_seconds}s</span>
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[var(--admin-text-muted)] tabular-nums">
            {formatIsoDateTime(poster.start_at)} &rarr;{' '}
            {poster.end_at ? formatIsoDateTime(poster.end_at) : <span className="text-emerald-500 font-medium">Indefinite</span>}
          </div>

          {poster.qr_url && (
            <div className="text-[11px] flex flex-wrap items-center gap-1.5 text-[var(--admin-text-secondary)]">
              <QrCode className="w-3 h-3 text-[var(--admin-text-muted)] shrink-0" />
              <span className="truncate max-w-[150px]">{poster.qr_label ?? 'Link'}</span>
              {qrStatus && qrStatus.status !== 'ALWAYS_ACTIVE' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border border-[var(--admin-border)] bg-[var(--admin-surface)]">
                  {qrStatus.shortBadge}
                </span>
              )}
              {safeQrHref && (
                <a href={safeQrHref} target="_blank" rel="noopener noreferrer" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-2.5 border-t border-[var(--admin-border)] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleArchive(poster.id)}
          disabled={archivingId === poster.id}
          className="min-h-[40px] px-2.5 py-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs font-medium inline-flex items-center space-x-1.5 cursor-pointer"
        >
          {archivingId === poster.id ? (
            <Loader2 className="w-3 h-3 animate-spin text-[var(--admin-text-muted)]" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          )}
          <span className="text-[var(--admin-text-secondary)] capitalize truncate max-w-[120px]">{statusText}</span>
        </button>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onToggleArchive(poster.id)}
            disabled={archivingId === poster.id}
            aria-label={isArchived ? `Restore poster ${poster.title}` : `Archive poster ${poster.title}`}
            className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl active:scale-95 cursor-pointer transition-colors ${
              isArchived ? 'text-amber-500 hover:bg-amber-500/10' : 'text-[var(--admin-text-muted)] hover:text-amber-500 hover:bg-amber-500/10'
            }`}
          >
            {archivingId === poster.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
          {onDuplicatePoster && (
            <button
              type="button"
              onClick={() => onDuplicatePoster(poster.id)}
              disabled={duplicatingId === poster.id}
              aria-label={`Duplicate poster ${poster.title}`}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[var(--admin-text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 active:scale-95 cursor-pointer transition-colors"
            >
              {duplicatingId === poster.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEditPoster(poster)}
            aria-label={`Edit poster ${poster.title}`}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] active:scale-95 cursor-pointer transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeletePoster(poster.id)}
            aria-label={`Delete poster ${poster.title}`}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
