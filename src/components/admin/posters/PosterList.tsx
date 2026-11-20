'use client';

import React from 'react';
import type { PosterWithStatus } from '@/types/index';
import { Calendar, Loader2 } from 'lucide-react';
import { EditPosterModal } from './EditPosterModal';
import { MultiAssetStudioModal } from './MultiAssetStudioModal';
import { PosterSequenceTable } from './PosterSequenceTable';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { PosterListToolbar } from './PosterListToolbar';
import { PosterGridCard } from './PosterGridCard';
import { usePosterListActions } from '@/hooks/usePosterListActions';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';

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
  const list = usePosterListActions(posters, onRefresh);

  return (
    <div className="space-y-6">
      <PosterListToolbar
        posters={posters}
        filter={list.filter}
        viewMode={list.viewMode}
        onChangeFilter={list.setFilter}
        onChangeViewMode={list.handleViewModeChange}
        onCreateNotice={onCreateNotice}
        onUploadPoster={onUploadPoster}
        onOpenStudio={() => {
          list.setStudioPoster(null);
          list.setShowStudioModal(true);
        }}
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
          draggedIndex={list.draggedIndex}
          dragOverIndex={list.dragOverIndex}
          onDragStart={list.handleDragStart}
          onDragOver={list.handleDragOver}
          onDrop={list.handleDrop}
          onDragEnd={list.handleDragEnd}
          onMovePoster={list.handleMovePoster}
          onEditPoster={list.handleOpenEdit}
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
              archivingId={list.archivingId}
              duplicatingId={list.duplicatingId}
              onMove={list.handleMovePoster}
              onEdit={list.handleOpenEdit}
              onToggleArchive={list.handleToggleArchive}
              onDuplicate={list.handleDuplicate}
              onRequestDelete={(id) => list.setConfirmDeleteId(id)}
            />
          ))}
        </div>
      )}

      <EditPosterModal
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

      {list.showStudioModal && (
        <MultiAssetStudioModal
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
    </div>
  );
}
