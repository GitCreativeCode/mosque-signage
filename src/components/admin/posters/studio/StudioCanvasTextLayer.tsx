'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { PosterTextOverlay } from '@/types/index';
import type { ResizeHandle, ResizeSession, SelectedEntity } from '@/lib/posters/studio-types';
import { resolveTextClasses } from '@/lib/posters/overlay-styles';
import { StudioTextBannerItem, selectEditableContents, type TextResizeInitialProps } from './StudioTextBannerItem';

export { resolveTextClasses, selectEditableContents, type TextResizeInitialProps };

interface StudioCanvasTextLayerProps {
  readonly textOverlays: readonly PosterTextOverlay[];
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedLayerKeys: readonly string[];
  readonly draggingTextId: string | null;
  readonly isAspectLocked: boolean;
  readonly isItemLocked: (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) => boolean;
  readonly onTextPointerDown: (e: React.PointerEvent, textId: string) => void;
  readonly onStartResizing: (
    e: React.PointerEvent,
    type: ResizeSession['type'],
    id: string,
    handle: ResizeHandle,
    initialProps: TextResizeInitialProps,
  ) => void;
  readonly onStartEditingText?: ((textId: string) => void) | undefined;
  readonly onCommitText?: ((textId: string, nextText: string) => void) | undefined;
}

/** Renders draggable, rotatable, 8-point resizable & stretchable text overlay banners with Photoshop/Canva-style edge-to-edge selection. */
export function StudioCanvasTextLayer({
  textOverlays,
  selectedEntity,
  selectedLayerKeys,
  draggingTextId,
  isAspectLocked,
  isItemLocked,
  onTextPointerDown,
  onStartResizing,
  onStartEditingText,
  onCommitText,
}: StudioCanvasTextLayerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editDivRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (editingId && editDivRef.current) {
      editDivRef.current.focus();
      selectEditableContents(editDivRef.current);
    }
  }, [editingId]);

  const handleStartEditing = (e: React.MouseEvent, ov: PosterTextOverlay, locked: boolean) => {
    e.stopPropagation();
    if (locked || editingId === ov.id) return;
    setEditingId(ov.id);
    onStartEditingText?.(ov.id);
  };

  const handleCancelEditing = (ov: PosterTextOverlay) => {
    if (editDivRef.current) editDivRef.current.innerText = ov.text;
    setEditingId(null);
  };

  const handleCommit = (ov: PosterTextOverlay) => {
    if (editingId !== ov.id) return;
    const raw = editDivRef.current ? (editDivRef.current.innerText || '') : ov.text;
    const normalized = raw.replace(/\r\n/g, '\n').replace(/\n$/, '');
    const trimmed = normalized.trim();
    if (trimmed.length === 0) {
      onCommitText?.(ov.id, '');
    } else if (normalized !== ov.text) {
      onCommitText?.(ov.id, normalized);
    }
    setEditingId(null);
  };

  return (
    <>
      {textOverlays.map((ov, ovIdx) => {
        if (ov.is_hidden || (!editingId && !ov.text?.trim())) return null;
        const isEditing = editingId === ov.id;
        const isSelected = selectedLayerKeys.length > 0
          ? selectedLayerKeys.includes(`text:${ov.id}`)
          : selectedEntity?.type === 'text' && selectedEntity.id === ov.id;

        return (
          <StudioTextBannerItem
            key={ov.id}
            ov={ov}
            ovIdx={ovIdx}
            isSelected={isSelected}
            isMultiSelected={selectedLayerKeys.length > 1}
            isDraggingThis={draggingTextId === ov.id}
            isEditing={isEditing}
            isAspectLocked={isAspectLocked}
            locked={isItemLocked(ov)}
            editDivRef={editDivRef}
            onTextPointerDown={onTextPointerDown}
            onStartEditing={handleStartEditing}
            onCancelEditing={handleCancelEditing}
            onCommit={handleCommit}
            onStartResizing={onStartResizing}
          />
        );
      })}
    </>
  );
}
