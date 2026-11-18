'use client';

import React from 'react';
import { Columns, FileText, LayoutGrid, ListOrdered, Plus } from 'lucide-react';
import type { PosterStatus, PosterWithStatus } from '@/types/index';

export interface PosterListToolbarProps {
  readonly posters: readonly PosterWithStatus[];
  readonly filter: 'ALL' | PosterStatus;
  readonly viewMode: 'grid' | 'table';
  readonly onChangeFilter: (f: 'ALL' | PosterStatus) => void;
  readonly onChangeViewMode: (m: 'grid' | 'table') => void;
  readonly onCreateNotice?: (() => void) | undefined;
  readonly onUploadPoster?: (() => void) | undefined;
  readonly onOpenStudio: () => void;
}

const STATUS_TABS: ReadonlyArray<{ readonly key: 'ALL' | PosterStatus; readonly label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'ARCHIVED', label: 'Archived' },
];

export function PosterListToolbar({
  posters,
  filter,
  viewMode,
  onChangeFilter,
  onChangeViewMode,
  onCreateNotice,
  onUploadPoster,
  onOpenStudio,
}: PosterListToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--admin-border)] pb-4 gap-4">
      <div className="flex items-center space-x-2 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === 'ALL' ? posters.length : posters.filter((p) => p.status === tab.key).length;
          const isSelected = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChangeFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer flex items-center space-x-2 shrink-0 border ${
                isSelected
                  ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] border-[var(--admin-tab-active-border)] shadow-sm'
                  : 'bg-[var(--admin-surface)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] border-[var(--admin-border)] hover:bg-[var(--admin-card)]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[10px] font-mono tabular-nums text-[var(--admin-text-muted)]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
        <div className="flex items-center space-x-1.5 bg-[var(--admin-surface)] p-1 rounded-lg border border-[var(--admin-border)]">
          <button
            type="button"
            onClick={() => onChangeViewMode('grid')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
              viewMode === 'grid'
                ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm border border-[var(--admin-border)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" /><span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('table')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
              viewMode === 'table'
                ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm border border-[var(--admin-border)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
            }`}
            title="Order Table View"
          >
            <ListOrdered className="w-3.5 h-3.5" /><span>Order Table</span>
          </button>
        </div>

        {onCreateNotice && (
          <button
            type="button"
            onClick={onCreateNotice}
            aria-label="Create Notice Slide"
            className="px-3 py-1.5 rounded-lg border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 opacity-70" aria-hidden="true" /><span>Create Notice</span>
          </button>
        )}

        {onUploadPoster && (
          <button
            type="button"
            onClick={onUploadPoster}
            aria-label="Upload Poster Slide"
            className="px-3.5 py-1.5 rounded-lg bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /><span>Upload Poster</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenStudio}
          aria-label="Open Multi-Asset Layout Studio"
          className="px-3 py-1.5 rounded-lg border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
        >
          <Columns className="w-3.5 h-3.5 opacity-70" aria-hidden="true" /><span>Multi-Asset Studio</span>
        </button>
      </div>
    </div>
  );
}

