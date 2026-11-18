'use client';

import { useState, useEffect } from 'react';
import type { PosterWithStatus, PosterStatus } from '@/types/index';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';

const VIEW_MODE_STORAGE_KEY = 'mosque_admin_poster_view_mode';

function moveArrayItem<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (moved !== undefined) next.splice(toIndex, 0, moved);
  return next;
}

/** Manages filtering, view mode persistence, drag/drop sequence reordering, and CRUD actions. */
export function usePosterListActions(posters: readonly PosterWithStatus[], onRefresh: () => void) {
  const [filter, setFilter] = useState<'ALL' | PosterStatus>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingPoster, setEditingPoster] = useState<PosterWithStatus | null>(null);
  const [studioPoster, setStudioPoster] = useState<PosterWithStatus | null>(null);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === 'grid' || saved === 'table') {
        setViewMode(saved);
        return;
      }
      import('@/lib/actions/settings')
        .then(({ getVenueSettings }) => getVenueSettings())
        .then((settings) => {
          if (settings?.poster_view_mode === 'table' || settings?.poster_view_mode === 'grid') {
            setViewMode(settings.poster_view_mode);
            localStorage.setItem(VIEW_MODE_STORAGE_KEY, settings.poster_view_mode);
          }
        })
        .catch(() => {});
    } catch {}
  }, []);

  const filteredPosters = posters.filter((p) => filter === 'ALL' || p.status === filter);

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {}
    import('@/lib/actions/settings')
      .then(({ updateVenueSettings }) => updateVenueSettings({ poster_view_mode: mode }))
      .catch(() => {});
  };

  const commitReorder = async (nextPosters: readonly PosterWithStatus[]) => {
    setIsReordering(true);
    try {
      const { reorderPosters } = await import('@/lib/actions/posters');
      await reorderPosters(nextPosters.map((p) => p.id));
      onRefresh();
      broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'reorder' });
    } catch (err) {
      console.error('Failed to reorder posters:', err);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const { duplicatePoster } = await import('@/lib/actions/posters');
      await duplicatePoster(id);
      onRefresh();
      broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'create' });
    } catch (err) {
      console.error('Failed to duplicate poster:', err);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleOpenEdit = (poster: PosterWithStatus) => {
    if (poster.layout_config || poster.media_type === 'composite') {
      setStudioPoster(poster);
      setShowStudioModal(true);
    } else {
      setEditingPoster(poster);
    }
  };

  const handleToggleArchive = async (id: string) => {
    setArchivingId(id);
    try {
      const { toggleArchivePoster } = await import('@/lib/actions/posters');
      await toggleArchivePoster(id);
      onRefresh();
      broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'update', posterId: id });
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    } finally {
      setArchivingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { deletePoster } = await import('@/lib/actions/posters');
      await deletePoster(id);
      setConfirmDeleteId(null);
      onRefresh();
      broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'delete', posterId: id });
    } catch (err) {
      console.error('Failed to delete poster:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMovePoster = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= filteredPosters.length) return;
    await commitReorder(moveArrayItem(filteredPosters, index, targetIndex));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const from = draggedIndex;
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (from === null || from === targetIndex) return;
    await commitReorder(moveArrayItem(filteredPosters, from, targetIndex));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return {
    filter, setFilter, viewMode, handleViewModeChange, filteredPosters,
    deletingId, archivingId, duplicatingId, confirmDeleteId, setConfirmDeleteId,
    editingPoster, setEditingPoster, studioPoster, setStudioPoster,
    showStudioModal, setShowStudioModal, isReordering, draggedIndex, dragOverIndex,
    handleDuplicate, handleOpenEdit, handleToggleArchive, handleDelete,
    handleMovePoster, handleDragStart, handleDragOver, handleDrop, handleDragEnd,
  };
}

