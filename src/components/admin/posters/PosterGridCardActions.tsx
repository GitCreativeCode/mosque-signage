'use client';

import React from 'react';
import type { PosterWithStatus } from '@/types/index';
import { Trash2, Loader2, Pencil, Archive, ArchiveRestore, Copy, CheckCircle2 } from 'lucide-react';

interface PosterGridCardActionsProps {
  readonly poster: PosterWithStatus;
  readonly isArchived: boolean;
  readonly archivingId: string | null;
  readonly duplicatingId: string | null;
  readonly isSelected?: boolean | undefined;
  readonly onToggleSelect?: ((id: string) => void) | undefined;
  readonly onEdit: (poster: PosterWithStatus) => void;
  readonly onToggleArchive: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onRequestDelete: (id: string) => void;
}

/** Bottom action row for PosterGridCard (select, archive, duplicate, edit, delete). */
export function PosterGridCardActions({
  poster,
  isArchived,
  archivingId,
  duplicatingId,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onToggleArchive,
  onDuplicate,
  onRequestDelete,
}: PosterGridCardActionsProps) {
  return (
    <div className="pt-3 border-t border-[var(--admin-border)] flex items-center justify-between">
      <span className="text-[10px] text-[var(--admin-text-muted)] font-mono">
        #{poster.id.slice(0, 8)}
      </span>
      <div className="flex items-center space-x-0.5 md:space-x-1">
        {onToggleSelect && (
          <button
            type="button"
            id={`select-poster-${poster.id}`}
            onClick={() => onToggleSelect(poster.id)}
            aria-label={isSelected ? `Deselect poster: ${poster.title}` : `Select poster: ${poster.title}`}
            className={`min-h-[44px] min-w-[40px] md:min-h-0 md:min-w-0 md:p-1.5 flex items-center justify-center rounded-lg active:scale-95 cursor-pointer transition-all duration-150 ${
              isSelected
                ? 'text-[var(--admin-tab-active-border)] bg-[var(--admin-tab-active-border)]/15 border border-[var(--admin-tab-active-border)]/40 shadow-sm'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)]'
            }`}
            title={isSelected ? 'Deselect Poster' : 'Select Poster for Bulk Actions'}
          >
            <CheckCircle2 className={`w-4 h-4 md:w-3.5 md:h-3.5 ${isSelected ? 'stroke-[2.5]' : ''}`} />
          </button>
        )}
        <button
          type="button"
          id={`archive-poster-${poster.id}`}
          onClick={() => onToggleArchive(poster.id)}
          disabled={archivingId === poster.id}
          aria-label={isArchived ? `Unarchive poster: ${poster.title}` : `Archive poster: ${poster.title}`}
          className={`min-h-[44px] min-w-[40px] md:min-h-0 md:min-w-0 md:p-1.5 flex items-center justify-center rounded-lg active:scale-95 cursor-pointer transition-all duration-150 ${
            isArchived
              ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
              : 'text-[var(--admin-text-muted)] hover:text-amber-500 hover:bg-amber-500/10'
          }`}
          title={isArchived ? 'Unarchive Poster (Restore to Rotation)' : 'Archive Poster (Remove from Rotation)'}
        >
          {archivingId === poster.id ? (
            <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 animate-spin" />
          ) : isArchived ? (
            <ArchiveRestore className="w-4 h-4 md:w-3.5 md:h-3.5" />
          ) : (
            <Archive className="w-4 h-4 md:w-3.5 md:h-3.5" />
          )}
        </button>
        <button
          type="button"
          id={`duplicate-poster-${poster.id}`}
          onClick={() => onDuplicate(poster.id)}
          disabled={duplicatingId === poster.id}
          aria-label={`Duplicate poster: ${poster.title}`}
          className="min-h-[44px] min-w-[40px] md:min-h-0 md:min-w-0 md:p-1.5 flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 active:scale-95 cursor-pointer transition-all duration-150"
          title="Duplicate Poster (1-Click Copy)"
        >
          {duplicatingId === poster.id ? (
            <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 animate-spin" />
          ) : (
            <Copy className="w-4 h-4 md:w-3.5 md:h-3.5" />
          )}
        </button>
        <button
          type="button"
          id={`edit-poster-${poster.id}`}
          onClick={() => onEdit(poster)}
          aria-label={`Edit poster: ${poster.title}`}
          className="min-h-[44px] min-w-[40px] md:min-h-0 md:min-w-0 md:p-1.5 flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] active:scale-95 cursor-pointer transition-all duration-150"
          title="Edit Poster Schedule"
        >
          <Pencil className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </button>
        <button
          type="button"
          id={`delete-poster-${poster.id}`}
          onClick={() => onRequestDelete(poster.id)}
          aria-label={`Delete poster: ${poster.title}`}
          className="min-h-[44px] min-w-[40px] md:min-h-0 md:min-w-0 md:p-1.5 flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 cursor-pointer transition-all duration-150"
          title="Delete Poster"
        >
          <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </button>
      </div>
    </div>
  );
}

