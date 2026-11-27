'use client';

import React, { useMemo, useRef } from 'react';
import type { PosterWithStatus } from '@/types/index';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { MiniCompositeThumbnail } from './MiniCompositeThumbnail';
import { PosterGridCardActions } from './PosterGridCardActions';
import { PosterGridCardMeta } from './PosterGridCardMeta';
import { getPosterTypeInfo } from '@/lib/posters/poster-type-info';
import { getPosterRecurringSubStatus } from '@/lib/engine/poster-status';
import { parseRecurringSchedule, formatNextActiveTelemetry } from '@/lib/posters/recurring-schedule';
import { getQrScheduleStatus } from '@/lib/posters/qr-schedule';

export interface PosterGridCardProps {
  readonly poster: PosterWithStatus;
  readonly index: number;
  readonly totalCount: number;
  readonly archivingId: string | null;
  readonly duplicatingId: string | null;
  readonly venueTimezone?: string | undefined;
  readonly isSelected?: boolean | undefined;
  readonly isSelectionMode?: boolean | undefined;
  readonly onToggleSelect?: ((id: string) => void) | undefined;
  readonly onMove: (index: number, direction: -1 | 1) => void;
  readonly onEdit: (poster: PosterWithStatus) => void;
  readonly onToggleArchive: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onRequestDelete: (id: string) => void;
}

function getStatusDotClass(status: PosterWithStatus['status']): string {
  if (status === 'ACTIVE') return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
  if (status === 'UPCOMING') return 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]';
  return status === 'ARCHIVED' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-neutral-400';
}

/** Displays a single poster card in the admin grid view with thumbnail preview and actions. */
export function PosterGridCard({
  poster,
  index,
  totalCount,
  archivingId,
  duplicatingId,
  venueTimezone = 'UTC',
  isSelected = false,
  isSelectionMode = false,
  onToggleSelect,
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

  const qrStatus = useMemo(
    () => (poster.qr_url ? getQrScheduleStatus(poster, new Date(), venueTimezone) : null),
    [poster, venueTimezone]
  );

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

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHeldRef = useRef(false);

  const startHold = (e: React.PointerEvent) => {
    if (!onToggleSelect || (e.target as HTMLElement).closest('button, a, input')) return;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    hasHeldRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      hasHeldRef.current = true;
      onToggleSelect(poster.id);
      try { if ('vibrate' in navigator) navigator.vibrate(40); } catch {}
    }, 500);
  };

  const clearHold = () => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  };

  return (
    <div
      onPointerDown={startHold}
      onPointerUp={clearHold}
      onPointerLeave={clearHold}
      onPointerCancel={clearHold}
      onClick={(e) => {
        if (hasHeldRef.current) { hasHeldRef.current = false; return; }
        if (isSelectionMode && onToggleSelect && !(e.target as HTMLElement).closest('button, a, input')) {
          onToggleSelect(poster.id);
        }
      }}
      className={`relative isolate bg-[var(--admin-card)] border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-[var(--admin-tab-active-border)] transition-all select-none ${
        isSelected
          ? 'ring-2 ring-blue-600 dark:ring-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 shadow-md'
          : isArchived
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

        <button
          type="button"
          onClick={() => onToggleArchive(poster.id)}
          disabled={archivingId === poster.id}
          title={isArchived ? 'Click to Activate' : 'Click to Pause / Archive'}
          className="absolute top-2.5 left-2.5 z-20 bg-black/80 backdrop-blur-md border border-white/20 max-w-[calc(100%-6.25rem)] px-2.5 py-1 rounded-lg text-xs font-medium text-white flex items-center space-x-1.5 shadow-lg cursor-pointer hover:opacity-80 transition active:scale-95"
        >
          {archivingId === poster.id ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin text-white shrink-0" />
          ) : (
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`} />
          )}
          <span className="capitalize font-semibold truncate">{statusText}</span>
        </button>

        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center bg-black/80 backdrop-blur-md border border-white/20 rounded-lg px-2 py-0.5 md:px-2.5 md:py-1 space-x-1.5 md:space-x-2 shadow-lg text-white">
          <span className="font-mono text-xs tabular-nums font-bold text-white">#{index + 1}</span>
          <div className="flex items-center space-x-0.5 border-l border-white/20 pl-1">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMove(index, -1)}
              className="min-h-[32px] min-w-[32px] md:min-h-0 md:min-w-0 md:p-0.5 flex items-center justify-center text-neutral-200 hover:text-white disabled:opacity-20 active:scale-90 transition cursor-pointer disabled:cursor-not-allowed"
              title="Move Earlier in Rotation"
              aria-label={`Move ${poster.title} earlier`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={index === totalCount - 1}
              onClick={() => onMove(index, 1)}
              className="min-h-[32px] min-w-[32px] md:min-h-0 md:min-w-0 md:p-0.5 flex items-center justify-center text-neutral-200 hover:text-white disabled:opacity-20 active:scale-90 transition cursor-pointer disabled:cursor-not-allowed"
              title="Move Later in Rotation"
              aria-label={`Move ${poster.title} later`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute top-2.5 right-2.5 z-20 bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold tabular-nums text-white flex items-center space-x-1.5 shadow-lg">
          <Clock className="w-3.5 h-3.5 text-neutral-300" />
          <span>{poster.media_type === 'video' && poster.video_loop_count && poster.video_loop_count > 1 ? `${poster.video_loop_count}x • ${poster.duration_seconds}s` : `${poster.duration_seconds}s`}</span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="text-sm font-bold text-[var(--admin-text-primary)] leading-snug line-clamp-2">
            {poster.title}
          </h4>

          <PosterGridCardMeta
            poster={poster}
            typeInfo={typeInfo}
            qrStatus={qrStatus}
          />
        </div>

        <PosterGridCardActions
          poster={poster}
          isArchived={isArchived}
          archivingId={archivingId}
          duplicatingId={duplicatingId}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          onEdit={onEdit}
          onToggleArchive={onToggleArchive}
          onDuplicate={onDuplicate}
          onRequestDelete={onRequestDelete}
        />
      </div>
    </div>
  );
}
