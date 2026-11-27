'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { PosterWithStatus } from '@/types/index';
import { Calendar, Loader2 } from 'lucide-react';
import { PosterSequenceTable } from './PosterSequenceTable';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { PosterListToolbar } from './PosterListToolbar';
import { PosterBulkActionBar } from './PosterBulkActionBar';
import { PosterGridCard } from './PosterGridCard';
import { AdminLoadingFallback } from '../common/AdminLoadingFallback';
import { StudioDeviceRequiredModal } from './StudioDeviceRequiredModal';
import { useIsSmallScreen } from '@/hooks/useIsSmallScreen';
import { usePosterListActions } from '@/hooks/usePosterListActions';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';

const DynamicEditPosterModal = dynamic(
  () => import('./EditPosterModal').then((m) => m.EditPosterModal),
  { loading: () => <AdminLoadingFallback label="Loading poster editor..." /> }
);

const DynamicMultiAssetStudioModal = dynamic(
  () => import('./MultiAssetStudioModal').then((m) => m.MultiAssetStudioModal),
  { loading: () => <AdminLoadingFallback label="Opening layout studio..." /> }
);

export interface PosterListProps {
  readonly posters: readonly PosterWithStatus[];
  readonly isLoading?: boolean | undefined;
  readonly onRefresh: () => void;
  readonly onCreateNotice?: (() => void) | undefined;
  readonly onUploadPoster?: (() => void) | undefined;
  readonly venueTimezone?: string | undefined;
}

export function PosterList({
  posters,
  isLoading = false,
  onRefresh,
  onCreateNotice,
  onUploadPoster,
  venueTimezone,
}: PosterListProps) {
  const { isSmallScreen } = useIsSmallScreen();
  const list = usePosterListActions(posters, onRefresh);

  const visibleSelectedCount = useMemo(
    () => list.filteredPosters.filter((p) => list.selectedIds.has(p.id)).length,
    [list.filteredPosters, list.selectedIds]
  );

  return (
    <div className="space-y-6">
      <PosterListToolbar
        posters={posters}
        filter={list.filter}
        searchQuery={list.searchQuery}
        onChangeSearchQuery={list.setSearchQuery}
        viewMode={list.viewMode}
        onChangeFilter={list.setFilter}
        onChangeViewMode={list.handleViewModeChange}
        onCreateNotice={onCreateNotice}
        onUploadPoster={onUploadPoster}
        onOpenStudio={() => {
          if (isSmallScreen) {
            list.setStudioBlockedLabel('');
            return;
          }
          list.setStudioPoster(null);
          list.setShowStudioModal(true);
        }}
      />

      <PosterBulkActionBar
        selectedCount={list.selectedIds.size}
        visibleSelectedCount={visibleSelectedCount}
        totalFilteredCount={list.filteredPosters.length}
        onClearSelection={list.clearSelection}
        onToggleSelectAll={list.toggleSelectAll}
        onBulkArchive={list.handleBulkArchive}
        onRequestBulkDelete={() => list.setConfirmBulkDelete(true)}
        isLoading={list.isBulkLoading}
      />

      {list.isReordering && (
        <div className="p-2.5 rounded-lg bg-[var(--admin-accent)]/10 border border-[var(--admin-accent)]/30 text-[var(--admin-text-primary)] text-xs flex items-center space-x-2 animate-fadeIn">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Updating display order...</span>
        </div>
      )}

      {isLoading && list.filteredPosters.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--admin-border)] rounded-2xl bg-[var(--admin-surface)]">
          <Loader2 className="w-7 h-7 text-[var(--admin-accent)] mx-auto mb-2.5 animate-spin" />
          <h3 className="text-sm font-semibold text-[var(--admin-text-primary)]">Loading posters...</h3>
        </div>
      ) : list.filteredPosters.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--admin-border)] rounded-2xl bg-[var(--admin-surface)]">
          <Calendar className="w-8 h-8 text-[var(--admin-text-muted)] mx-auto mb-2.5" />
          <h3 className="text-base font-semibold text-[var(--admin-text-primary)]">No posters found</h3>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1">
            {list.filter === 'ALL'
              ? 'Upload a flyer or create a notice to start showing announcements on the display.'
              : `No ${list.filter.toLowerCase()} posters found.`}
          </p>
        </div>
      ) : list.viewMode === 'table' ? (
        <PosterSequenceTable
          posters={list.filteredPosters}
          venueTimezone={venueTimezone}
          selectedIds={list.selectedIds}
          onToggleSelect={list.toggleSelectId}
          onToggleSelectAll={list.toggleSelectAll}
          draggedIndex={list.draggedIndex}
          dragOverIndex={list.dragOverIndex}
          onDragStart={list.handleDragStart}
          onDragOver={list.handleDragOver}
          onDrop={list.handleDrop}
          onDragEnd={list.handleDragEnd}
          onMovePoster={list.handleMovePoster}
          onEditPoster={(p) => list.handleOpenEdit(p, isSmallScreen)}
          onToggleArchive={list.handleToggleArchive}
          onDeletePoster={(id) => list.setConfirmDeleteId(id)}
          onDuplicatePoster={list.handleDuplicate}
          archivingId={list.archivingId}
          duplicatingId={list.duplicatingId}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.filteredPosters.map((poster, index) => (
            <PosterGridCard
              key={poster.id}
              poster={poster}
              venueTimezone={venueTimezone}
              index={index}
              totalCount={list.filteredPosters.length}
              isSelected={list.selectedIds.has(poster.id)}
              isSelectionMode={list.selectedIds.size > 0}
              onToggleSelect={list.toggleSelectId}
              archivingId={list.archivingId}
              duplicatingId={list.duplicatingId}
              onMove={list.handleMovePoster}
              onEdit={(p) => list.handleOpenEdit(p, isSmallScreen)}
              onToggleArchive={list.handleToggleArchive}
              onDuplicate={list.handleDuplicate}
              onRequestDelete={(id) => list.setConfirmDeleteId(id)}
            />
          ))}
        </div>
      )}

      {list.editingPoster && (
        <DynamicEditPosterModal
          poster={list.editingPoster}
          isOpen={list.editingPoster !== null}
          venueTimezone={venueTimezone}
          onClose={() => list.setEditingPoster(null)}
          onUpdated={() => {
            onRefresh();
            broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'update' });
            list.setEditingPoster(null);
          }}
          onOpenStudio={(p) => {
            list.setEditingPoster(null);
            list.setStudioPoster(p);
            list.setShowStudioModal(true);
          }}
        />
      )}

      {list.showStudioModal && !isSmallScreen && (
        <DynamicMultiAssetStudioModal
          isOpen={list.showStudioModal}
          initialPoster={list.studioPoster}
          venueTimezone={venueTimezone}
          onClose={() => {
            list.setShowStudioModal(false);
            list.setStudioPoster(null);
          }}
          onSaved={() => {
            onRefresh();
            broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'update' });
            list.setShowStudioModal(false);
            list.setStudioPoster(null);
          }}
        />
      )}

      <StudioDeviceRequiredModal
        isOpen={list.studioBlockedLabel !== null}
        contextLabel={list.studioBlockedLabel || undefined}
        onClose={() => list.setStudioBlockedLabel(null)}
      />

      <ConfirmationModal
        isOpen={list.confirmDeleteId !== null}
        title="Delete Item?"
        message="This will permanently remove the poster from the database and unlink any associated file. This action cannot be undone."
        confirmLabel={list.deletingId !== null ? 'Deleting...' : 'Confirm Delete'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (list.confirmDeleteId) list.handleDelete(list.confirmDeleteId);
        }}
        onCancel={() => list.setConfirmDeleteId(null)}
      />

      <ConfirmationModal
        isOpen={list.confirmBulkDelete}
        title={`Delete ${list.selectedIds.size} ${list.selectedIds.size === 1 ? 'Poster' : 'Posters'}?`}
        message="This will permanently remove the selected posters from the database and unlink their associated files. This action cannot be undone."
        confirmLabel={list.isBulkLoading ? 'Deleting...' : 'Confirm Delete'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={list.handleBulkDelete}
        onCancel={() => list.setConfirmBulkDelete(false)}
      />
    </div>
  );
}
