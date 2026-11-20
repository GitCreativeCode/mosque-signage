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
import { MiniCompositeThumbnail } from './MiniCompositeThumbnail';
import { getPosterRecurringSubStatus } from '@/lib/engine/poster-status';
import { parseRecurringSchedule, formatNextActiveTelemetry } from '@/lib/posters/recurring-schedule';

export interface PosterSequenceRowProps {
  readonly poster: PosterWithStatus;
  readonly index: number;
  readonly totalCount: number;
  readonly isDragging: boolean;
  readonly isOver: boolean;
  readonly archivingId: string | null;
  readonly duplicatingId?: string | null | undefined;
  readonly venueTimezone?: string | undefined;
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

function formatShortDate(iso: string): string {
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

export function PosterSequenceRow({
  poster, index, totalCount, isDragging, isOver, archivingId, duplicatingId,
  venueTimezone = 'UTC',
  onDragStart, onDragOver, onDrop, onDragEnd, onMovePoster, onEditPoster,
  onToggleArchive, onDeletePoster, onDuplicatePoster,
}: PosterSequenceRowProps) {
  const isArchived = poster.status === 'ARCHIVED';
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
        <div className="relative isolate w-20 h-12 rounded-lg overflow-hidden bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center justify-center shrink-0">
          {poster.layout_config ? (
            <MiniCompositeThumbnail layoutConfig={poster.layout_config} posterTitle={poster.title} fallbackImagePath={poster.thumbnail_path || poster.image_path} />
          ) : (
            <img src={poster.thumbnail_path || poster.image_path} alt={poster.title} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
          )}
        </div>
      </td>

      <td className="py-3 px-4">
        <div className="space-y-1">
          <div className="font-semibold text-[var(--admin-text-primary)] leading-tight line-clamp-1"><span>{poster.title}</span></div>
          <div className="text-[11px] text-[var(--admin-text-muted)] flex items-center space-x-2">
            <span className="tabular-nums">
              {formatShortDate(poster.start_at)} → {poster.end_at ? formatShortDate(poster.end_at) : <span className="text-emerald-500 font-medium">Indefinite</span>}
            </span>
            {poster.qr_url && (
              <span className="inline-flex items-center space-x-1 text-[var(--admin-text-secondary)]">
                <QrCode className="w-3 h-3 text-[var(--admin-text-muted)]" />
                <span className="max-w-[120px] truncate">{poster.qr_label ?? 'Link'}</span>
                <a href={poster.qr_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"><ExternalLink className="w-2.5 h-2.5" /></a>
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-4">
        <span className="inline-flex items-center space-x-1.5 text-xs font-medium">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-[var(--admin-text-secondary)] capitalize">{statusText}</span>
        </span>
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

