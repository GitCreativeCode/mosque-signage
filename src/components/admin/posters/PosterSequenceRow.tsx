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
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Pencil,
  QrCode,
  Trash2,
  Video,
} from 'lucide-react';
import { getPosterTypeInfo } from '@/lib/posters/poster-type-info';
import { formatIsoDateTime } from '@/lib/utils/time';
import { MiniCompositeThumbnail } from './MiniCompositeThumbnail';
import { getPosterRecurringSubStatus } from '@/lib/engine/poster-status';
import { parseRecurringSchedule, formatNextActiveTelemetry } from '@/lib/posters/recurring-schedule';
import { getQrScheduleStatus } from '@/lib/posters/qr-schedule';

export interface PosterSequenceRowProps {
  readonly poster: PosterWithStatus;
  readonly index: number;
  readonly totalCount: number;
  readonly isDragging: boolean;
  readonly isOver: boolean;
  readonly archivingId: string | null;
  readonly duplicatingId?: string | null | undefined;
  readonly venueTimezone?: string | undefined;
  readonly isSelected?: boolean | undefined;
  readonly onToggleSelect?: ((id: string) => void) | undefined;
  readonly onDragStart: (e: React.DragEvent, index: number) => void;
  readonly onDragOver: (e: React.DragEvent, index: number) => void;
  readonly onDrop: (e: React.DragEvent, targetIndex: number) => void;
  readonly onDragEnd: () => void;
  readonly onMovePoster: (index: number, direction: -1 | 1) => void;
  readonly onEditPoster: (poster: PosterWithStatus) => void;
  readonly onToggleArchive: (id: string) => void;
  readonly onDeletePoster: (id: string) => void;
  readonly onDuplicatePoster?: ((id: string) => void) | undefined;
}

export function PosterSequenceRow({
  poster, index, totalCount, isDragging, isOver, archivingId, duplicatingId,
  venueTimezone = 'UTC',
  isSelected = false,
  onToggleSelect,
  onDragStart, onDragOver, onDrop, onDragEnd, onMovePoster, onEditPoster,
  onToggleArchive, onDeletePoster, onDuplicatePoster,
}: PosterSequenceRowProps) {
  const isArchived = poster.status === 'ARCHIVED';
  const qrStatus = useMemo(
    () => (poster.qr_url ? getQrScheduleStatus(poster, new Date(), venueTimezone) : null),
    [poster, venueTimezone]
  );
  const recurringRules = useMemo(() => parseRecurringSchedule(poster.recurring_schedule), [poster.recurring_schedule]);
  const isRecurring = Boolean(recurringRules && recurringRules.length > 0);
  const recurringSubStatus = isRecurring && poster.status === 'ACTIVE'
    ? getPosterRecurringSubStatus(poster, new Date(), venueTimezone)
    : null;

  let dotClass = poster.status === 'ACTIVE'
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

  const typeInfo = getPosterTypeInfo(poster);

  return (
    <tr
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`hover:bg-[var(--admin-surface)]/70 transition-colors ${isDragging ? 'opacity-30 bg-[var(--admin-surface)]' : ''} ${
        isOver ? 'border-t-2 border-[var(--admin-tab-active-border)]' : ''
      } ${isArchived ? 'opacity-60 hover:opacity-100' : ''}`}
    >
      <td className="py-3 px-3 text-center">
        <div className="flex items-center justify-center space-x-1.5 font-mono">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(poster.id)}
              aria-label={`Select ${poster.title}`}
              className="w-4 h-4 rounded cursor-pointer accent-[var(--admin-tab-active-border)]"
            />
          )}
          <span className="text-xs tabular-nums text-[var(--admin-text-muted)] font-semibold w-4 text-center">{index + 1}</span>
          <span className="cursor-grab active:cursor-grabbing text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] p-0.5 rounded hover:bg-[var(--admin-surface)] transition-colors" title="Drag up or down to reorder">
            <GripVertical className="w-4 h-4" />
          </span>
          <div className="flex flex-col -space-y-0.5">
            <button type="button" disabled={index === 0} onClick={() => onMovePoster(index, -1)} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] disabled:opacity-20 p-0.5 active:scale-90 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed" title="Move Up">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" disabled={index === totalCount - 1} onClick={() => onMovePoster(index, 1)} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] disabled:opacity-20 p-0.5 active:scale-90 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed" title="Move Down">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </td>

      <td className="py-3 px-3">
        <div className="relative isolate w-24 aspect-video rounded-lg overflow-hidden bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center justify-center shrink-0">
          {poster.layout_config ? (
            <MiniCompositeThumbnail layoutConfig={poster.layout_config} posterTitle={poster.title} fallbackImagePath={poster.thumbnail_path || poster.image_path} compact />
          ) : poster.media_type === 'video' && !poster.thumbnail_path ? (
            <video src={`${poster.image_path}#t=0.001`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
          ) : (
            <img src={poster.thumbnail_path || poster.image_path} alt={poster.title} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
          )}
        </div>
      </td>

      <td className="py-3 px-4">
        <div className="space-y-1">
          <div className="font-semibold text-[var(--admin-text-primary)] leading-tight line-clamp-1"><span>{poster.title}</span></div>
          <div className="text-[11px] text-[var(--admin-text-muted)] tabular-nums">
            {formatIsoDateTime(poster.start_at)} → {poster.end_at ? formatIsoDateTime(poster.end_at) : <span className="text-emerald-500 font-medium">Indefinite</span>}
          </div>
          {poster.qr_url && (
            <div className="text-[11px] flex items-center space-x-1.5 text-[var(--admin-text-secondary)] pt-0.5">
              <QrCode className="w-3 h-3 text-[var(--admin-text-muted)] shrink-0" />
              <span className="max-w-[140px] truncate">{poster.qr_label ?? 'Link'}</span>
              {qrStatus && qrStatus.status !== 'ALWAYS_ACTIVE' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border shrink-0 ${
                  qrStatus.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : qrStatus.color === 'blue' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    : qrStatus.color === 'amber' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {qrStatus.shortBadge}
                </span>
              )}
              <a href={poster.qr_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] shrink-0">
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
        </div>
      </td>

      <td className="py-3 px-4">
        <button
          type="button"
          onClick={() => onToggleArchive(poster.id)}
          disabled={archivingId === poster.id}
          title={isArchived ? 'Click to Activate' : 'Click to Pause / Archive'}
          className="inline-flex items-center space-x-1.5 text-xs font-medium cursor-pointer hover:opacity-80 transition py-1 px-1.5 rounded-lg hover:bg-[var(--admin-surface)]"
        >
          {archivingId === poster.id ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin text-[var(--admin-text-muted)]" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          )}
          <span className="text-[var(--admin-text-secondary)] capitalize">{statusText}</span>
        </button>
      </td>

      <td className="py-3 px-4 text-xs">
        <span className="inline-flex items-center space-x-1.5 text-[var(--admin-text-secondary)] font-medium">
          {typeInfo.type === 'composite' ? <Columns className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />
            : typeInfo.type === 'video' ? <Video className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />
            : typeInfo.type === 'notice' ? <FileText className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />
            : <ImageIcon className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />}
          <span>{typeInfo.label}</span>
        </span>
      </td>

      <td className="py-3 px-4 font-mono tabular-nums text-[var(--admin-text-secondary)]">
        <div className="flex items-center space-x-1 text-xs">
          <Clock className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" /><span>{poster.duration_seconds}s</span>
        </div>
      </td>

      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end space-x-1">
          <button
            type="button"
            onClick={() => onToggleArchive(poster.id)}
            disabled={archivingId === poster.id}
            aria-label={isArchived ? `Restore poster ${poster.title}` : `Archive poster ${poster.title}`}
            className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg active:scale-95 cursor-pointer transition-colors duration-150 ${isArchived ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10' : 'text-[var(--admin-text-muted)] hover:text-amber-500 hover:bg-amber-500/10'}`}
            title={isArchived ? 'Restore to rotation' : 'Archive poster'}
          >
            {archivingId === poster.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
          {onDuplicatePoster && (
            <button type="button" onClick={() => onDuplicatePoster(poster.id)} disabled={duplicatingId === poster.id} aria-label={`Duplicate poster ${poster.title}`} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 active:scale-95 cursor-pointer transition-colors duration-150" title="Duplicate poster (1-Click Copy)">
              {duplicatingId === poster.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
          <button type="button" onClick={() => onEditPoster(poster)} aria-label={`Edit poster ${poster.title}`} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] active:scale-95 cursor-pointer transition-colors duration-150" title="Edit poster">
            <Pencil className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onDeletePoster(poster.id)} aria-label={`Delete poster ${poster.title}`} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 cursor-pointer transition-colors duration-150" title="Delete poster">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

