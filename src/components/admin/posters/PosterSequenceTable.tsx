'use client';

import React from 'react';
import type { PosterWithStatus } from '@/types/index';
import { PosterSequenceRow } from './PosterSequenceRow';

export interface PosterSequenceTableProps {
  readonly posters: readonly PosterWithStatus[];
  readonly draggedIndex: number | null;
  readonly dragOverIndex: number | null;
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
  readonly archivingId: string | null;
  readonly duplicatingId?: string | null | undefined;
}

export function PosterSequenceTable({
  posters,
  draggedIndex,
  dragOverIndex,
  venueTimezone,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMovePoster,
  onEditPoster,
  onToggleArchive,
  onDeletePoster,
  onDuplicatePoster,
  archivingId,
  duplicatingId,
}: PosterSequenceTableProps) {
  if (posters.length === 0) return null;

  return (
    <div className="overflow-x-auto bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--admin-border)] text-xs font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] bg-[var(--admin-surface)]/60">
            <th className="py-3 px-3 w-20 text-center">Order</th>
            <th className="py-3 px-3 w-28">Preview</th>
            <th className="py-3 px-4">Title &amp; Schedule</th>
            <th className="py-3 px-4 w-28">Status</th>
            <th className="py-3 px-4 w-28">Type</th>
            <th className="py-3 px-4 w-28">Duration</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)] text-xs text-[var(--admin-text-primary)]">
          {posters.map((poster, index) => (
            <PosterSequenceRow
              key={poster.id}
              poster={poster}
              venueTimezone={venueTimezone}
              index={index}
              totalCount={posters.length}
              isDragging={draggedIndex === index}
              isOver={dragOverIndex === index}
              archivingId={archivingId}
              duplicatingId={duplicatingId}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              onMovePoster={onMovePoster}
              onEditPoster={onEditPoster}
              onToggleArchive={onToggleArchive}
              onDeletePoster={onDeletePoster}
              onDuplicatePoster={onDuplicatePoster}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
