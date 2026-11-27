'use client';

import React from 'react';
import { Archive, ArchiveRestore, Trash2, X, CheckSquare } from 'lucide-react';

export interface PosterBulkActionBarProps {
  readonly selectedCount: number;
  readonly visibleSelectedCount?: number | undefined;
  readonly totalFilteredCount?: number | undefined;
  readonly onClearSelection: () => void;
  readonly onToggleSelectAll?: (() => void) | undefined;
  readonly onBulkArchive: (archive: boolean) => void;
  readonly onRequestBulkDelete: () => void;
  readonly isLoading?: boolean | undefined;
}

export function PosterBulkActionBar({
  selectedCount,
  visibleSelectedCount,
  totalFilteredCount,
  onClearSelection,
  onToggleSelectAll,
  onBulkArchive,
  onRequestBulkDelete,
  isLoading = false,
}: PosterBulkActionBarProps) {
  React.useEffect(() => {
    if (selectedCount === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClearSelection();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, onClearSelection]);

  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[var(--admin-card)] border border-blue-500/40 dark:border-blue-400/40 shadow-md animate-fadeIn text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="font-semibold text-[var(--admin-text-primary)]">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          {visibleSelectedCount !== undefined && visibleSelectedCount < selectedCount && (
            <span className="ml-1 text-[var(--admin-text-muted)] font-normal">
              ({visibleSelectedCount} in view)
            </span>
          )}
        </span>
        {onToggleSelectAll && totalFilteredCount !== undefined && (
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="px-2.5 py-1 rounded border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] text-[11px] font-medium transition cursor-pointer"
          >
            {visibleSelectedCount === totalFilteredCount && totalFilteredCount > 0 ? 'Deselect in View' : `Select All in View (${totalFilteredCount})`}
          </button>
        )}
        <button
          type="button"
          onClick={onClearSelection}
          className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] flex items-center space-x-1 underline cursor-pointer py-1"
          title="Press Esc to clear"
        >
          <X className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onBulkArchive(false)}
          disabled={isLoading}
          className="min-h-[38px] sm:min-h-0 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-medium flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition"
          title="Make selected posters active"
        >
          <ArchiveRestore className="w-3.5 h-3.5 text-emerald-500" />
          <span>Set Active</span>
        </button>

        <button
          type="button"
          onClick={() => onBulkArchive(true)}
          disabled={isLoading}
          className="min-h-[38px] sm:min-h-0 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-medium flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition"
          title="Archive selected posters"
        >
          <Archive className="w-3.5 h-3.5 text-amber-500" />
          <span>Archive</span>
        </button>

        <button
          type="button"
          onClick={onRequestBulkDelete}
          disabled={isLoading}
          className="min-h-[38px] sm:min-h-0 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition"
          title="Delete selected posters"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

