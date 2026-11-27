'use client';

import React from 'react';
import { LayoutGrid, ListOrdered, Search, X } from 'lucide-react';
import type { PosterStatus, PosterWithStatus } from '@/types/index';
import { AddContentDropdown } from './AddContentDropdown';

export interface PosterListToolbarProps {
  readonly posters: readonly PosterWithStatus[];
  readonly filter: 'ALL' | PosterStatus;
  readonly searchQuery: string;
  readonly onChangeSearchQuery: (q: string) => void;
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
  searchQuery,
  onChangeSearchQuery,
  viewMode,
  onChangeFilter,
  onChangeViewMode,
  onCreateNotice,
  onUploadPoster,
  onOpenStudio,
}: PosterListToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--admin-border)] pb-4 gap-3 sm:gap-4">
      {/* Row 1 on mobile / Left column on desktop */}
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === 'ALL' ? posters.length : posters.filter((p) => p.status === tab.key).length;
          const isSelected = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChangeFilter(tab.key)}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer flex items-center space-x-2 shrink-0 border ${
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

      {/* Row 2 on mobile / Right column on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full md:w-auto shrink-0">
        {/* Search Input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[var(--admin-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            placeholder="Search posters or QR..."
            className="w-full h-9 pl-8 pr-7 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onChangeSearchQuery('')}
              className="absolute right-2 top-2.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center space-x-1 bg-[var(--admin-surface)] p-1 rounded-lg border border-[var(--admin-border)] h-9">
            <button
              type="button"
              onClick={() => onChangeViewMode('grid')}
              className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                viewMode === 'grid'
                  ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm border border-[var(--admin-border)]'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
              }`}
              title="Card Grid View"
              aria-label="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('table')}
              className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                viewMode === 'table'
                  ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm border border-[var(--admin-border)]'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
              }`}
              title="Order Table View"
              aria-label="Order Table View"
            >
              <ListOrdered className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Order Table</span>
            </button>
          </div>

          <AddContentDropdown
            onCreateNotice={onCreateNotice}
            onUploadPoster={onUploadPoster}
            onOpenStudio={onOpenStudio}
          />
        </div>
      </div>
    </div>
  );
}
