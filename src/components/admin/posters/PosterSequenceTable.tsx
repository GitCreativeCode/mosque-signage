'use client';

import React from 'react';
import type { PosterWithStatus } from '@/types/index';
import { PosterSequenceRow } from './PosterSequenceRow';
import { PosterSequenceMobileCard } from './PosterSequenceMobileCard';

export interface PosterSequenceTableProps {
  readonly posters: readonly PosterWithStatus[];
  readonly draggedIndex: number | null;
  readonly dragOverIndex: number | null;
  readonly venueTimezone?: string | undefined;
  readonly selectedIds?: ReadonlySet<string> | undefined;
  readonly onToggleSelect?: ((id: string) => void) | undefined;
  readonly onToggleSelectAll?: (() => void) | undefined;
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
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
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
    <>
      {/* Mobile Touch-First Sequence Cards (< 768px) */}
      <div className="md:hidden space-y-3">
        {onToggleSelectAll && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer font-semibold text-[var(--admin-text-secondary)]">
              <input
                type="checkbox"
                checked={posters.length > 0 && selectedIds?.size === posters.length}
                onChange={onToggleSelectAll}
                aria-label="Select all posters"
                className="w-4 h-4 rounded cursor-pointer accent-[var(--admin-tab-active-border)]"
              />
              <span>Select all in view ({posters.length})</span>
            </label>
            <span className="text-[11px] text-[var(--admin-text-muted)]">Use arrows to reorder</span>
          </div>
        )}
        {posters.map((poster, index) => (
          <PosterSequenceMobileCard
            key={poster.id}
            poster={poster}
            venueTimezone={venueTimezone}
            index={index}
            totalCount={posters.length}
            archivingId={archivingId}
            duplicatingId={duplicatingId}
            isSelected={selectedIds?.has(poster.id)}
            onToggleSelect={onToggleSelect}
            onMovePoster={onMovePoster}
            onEditPoster={onEditPoster}
            onToggleArchive={onToggleArchive}
            onDeletePoster={onDeletePoster}
            onDuplicatePoster={onDuplicatePoster}
          />
        ))}
      </div>

      {/* Tablet & Desktop Sequence Table (>= 768px) */}
      <div className="hidden md:block overflow-x-auto bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--admin-border)] text-xs font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] bg-[var(--admin-surface)]/60">
            <th className="py-3 px-3 w-24 text-center">
              <div className="flex items-center justify-center space-x-1.5">
                {onToggleSelectAll && (
                  <input
                    type="checkbox"
                    checked={posters.length > 0 && selectedIds?.size === posters.length}
                    onChange={onToggleSelectAll}
                    aria-label="Select all posters"
                    className="w-4 h-4 rounded cursor-pointer accent-[var(--admin-tab-active-border)]"
                  />
                )}
                <span>Order</span>
              </div>
            </th>
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
              isSelected={selectedIds?.has(poster.id)}
              onToggleSelect={onToggleSelect}
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
    </>
  );
}
