'use client';

import React, { useMemo } from 'react';
import type { PosterWithStatus } from '@/types/index';
import {
  Clock,
  QrCode,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Video,
  FileText,
} from 'lucide-react';
import { MiniCompositeThumbnail } from './MiniCompositeThumbnail';
import { PosterGridCardActions } from './PosterGridCardActions';
import { getPosterTypeInfo } from '@/lib/posters/poster-type-info';
import { sanitizeExternalUrl } from '@/lib/utils/url-safety';
import { getPosterRecurringSubStatus } from '@/lib/engine/poster-status';
import { parseRecurringSchedule, formatNextActiveTelemetry } from '@/lib/posters/recurring-schedule';

interface PosterGridCardProps {
  readonly poster: PosterWithStatus;
  readonly index: number;
  readonly totalCount: number;
  readonly archivingId: string | null;
  readonly duplicatingId: string | null;
  readonly venueTimezone?: string | undefined;
  readonly onMove: (index: number, direction: -1 | 1) => void;
  readonly onEdit: (poster: PosterWithStatus) => void;
  readonly onToggleArchive: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onRequestDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getStatusDotClass(status: PosterWithStatus['status']): string {
  if (status === 'ACTIVE') return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
  if (status === 'UPCOMING') return 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]';
  if (status === 'ARCHIVED') return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
  return 'bg-neutral-400';
}

/** Displays a single poster card in the admin grid view with thumbnail preview and actions. */
export function PosterGridCard({
  poster,
  index,
  totalCount,
  archivingId,
  duplicatingId,
  venueTimezone = 'UTC',
  onMove,
  onEdit,
  onToggleArchive,
  onDuplicate,
  onRequestDelete,
}: PosterGridCardProps) {
  const isArchived = poster.status === 'ARCHIVED';
  const typeInfo = getPosterTypeInfo(poster);

  const recurringRules = useMemo(() => parseRecurringSchedule(poster.recurring_schedule), [poster.recurring_schedule]);
  const isRecurring = Boolean(recurringRules && recurringRules.length > 0);
  const recurringSubStatus = isRecurring && poster.status === 'ACTIVE'
    ? getPosterRecurringSubStatus(poster, new Date(), venueTimezone)
    : null;

  let statusDot = getStatusDotClass(poster.status);
  let statusText: string = (poster.status || 'ACTIVE').toLowerCase();

  if (recurringSubStatus === 'ACTIVE_NOW') {
    statusDot = 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]';
    statusText = 'Active (Recurring)';
  } else if (recurringSubStatus === 'STANDBY') {
    statusDot = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
    const nextTelemetry = formatNextActiveTelemetry(recurringRules, new Date(), venueTimezone);
    statusText = `Standby (${nextTelemetry})`;
  }

  return (
    <div
      className={`relative isolate bg-[var(--admin-card)] border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-[var(--admin-tab-active-border)] transition-all ${
        isArchived
          ? 'opacity-70 hover:opacity-100 border-dashed border-amber-500/30'
          : 'border-[var(--admin-border)]'
      }`}
    >
      {/* Thumbnail Header */}
      <div className="relative isolate aspect-video w-full bg-[var(--admin-surface)] overflow-hidden flex items-center justify-center border-b border-[var(--admin-border)]">
        {poster.layout_config ? (
          <MiniCompositeThumbnail
            layoutConfig={poster.layout_config}
            posterTitle={poster.title}
            fallbackImagePath={poster.thumbnail_path || poster.image_path}
          />
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

        <div className="absolute top-2.5 left-2.5 z-20 bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-lg text-xs font-medium text-white flex items-center space-x-1.5 shadow-lg">
          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
          <span className="capitalize font-semibold">{statusText}</span>
        </div>

        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center bg-black/80 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1 space-x-2 shadow-lg text-white">
          <span className="font-mono text-xs tabular-nums font-bold text-white">#{index + 1}</span>
          <div className="flex items-center space-x-0.5 border-l border-white/20 pl-1.5">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMove(index, -1)}
              className="text-neutral-200 hover:text-white disabled:opacity-20 p-0.5 active:scale-90 transition cursor-pointer disabled:cursor-not-allowed"
              title="Move Earlier in Rotation"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={index === totalCount - 1}
              onClick={() => onMove(index, 1)}
              className="text-neutral-200 hover:text-white disabled:opacity-20 p-0.5 active:scale-90 transition cursor-pointer disabled:cursor-not-allowed"
              title="Move Later in Rotation"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute top-2.5 right-2.5 z-20 bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold tabular-nums text-white flex items-center space-x-1.5 shadow-lg">
          <Clock className="w-3.5 h-3.5 text-neutral-300" />
          <span>
            {poster.media_type === 'video' && poster.video_loop_count && poster.video_loop_count > 1
              ? `${poster.video_loop_count}x • ${poster.duration_seconds}s`
              : `${poster.duration_seconds}s`}
          </span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="text-sm font-bold text-[var(--admin-text-primary)] leading-snug line-clamp-2">
            {poster.title}
          </h4>

          <div className="mt-2.5 space-y-1 text-xs text-[var(--admin-text-secondary)]">
            <div className="flex items-center space-x-1.5">
              <span className="text-[var(--admin-text-muted)] font-medium">Start:</span>
              <span className="tabular-nums font-mono">{formatDate(poster.start_at)}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[var(--admin-text-muted)] font-medium">End:</span>
              <span className="tabular-nums font-mono">
                {poster.end_at ? formatDate(poster.end_at) : <span className="text-emerald-500 font-medium">Indefinite</span>}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[var(--admin-text-muted)] font-medium">Type:</span>
              <span className="font-medium text-[var(--admin-text-primary)] inline-flex items-center space-x-1.5">
                {typeInfo.type === 'video' ? (
                  <Video className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />
                ) : typeInfo.type === 'notice' ? (
                  <FileText className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />
                )}
                <span>{typeInfo.label}</span>
              </span>
            </div>
            {poster.qr_url && (() => {
              const safeQrHref = sanitizeExternalUrl(poster.qr_url);
              return (
                <div className="flex items-center space-x-1.5 text-[var(--admin-text-primary)] truncate pt-1">
                  <QrCode className="w-3.5 h-3.5 shrink-0 text-[var(--admin-text-muted)]" />
                  <span className="truncate">{poster.qr_label ?? 'Attached Link'}</span>
                  {safeQrHref && (
                    <a
                      href={safeQrHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <PosterGridCardActions
          poster={poster}
          isArchived={isArchived}
          archivingId={archivingId}
          duplicatingId={duplicatingId}
          onEdit={onEdit}
          onToggleArchive={onToggleArchive}
          onDuplicate={onDuplicate}
          onRequestDelete={onRequestDelete}
        />
      </div>
    </div>
  );
}
