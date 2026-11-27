'use client';

import { useState, useEffect } from 'react';
import type { ContextMenuTarget } from '@/components/admin/posters/studio/StudioCanvasContextMenu';
import type { SelectedEntity, StudioSceneState } from '@/lib/posters/studio-types';

interface UseStudioCanvasContextMenuParams {
  readonly selectedLayerKeys: readonly string[];
  readonly selectedEntity: SelectedEntity | null;
  readonly scene: StudioSceneState;
  readonly canvasRef: React.RefObject<HTMLDivElement | null>;
  readonly isItemLocked: (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) => boolean;
  readonly onSelectSlot: (idx: number | null) => void;
  readonly onToggleLayerSelection: (key: string) => void;
  readonly onDeselectAll: () => void;
}

export function useStudioCanvasContextMenu({
  selectedLayerKeys,
  selectedEntity,
  scene,
  canvasRef,
  isItemLocked,
  onSelectSlot,
  onToggleLayerSelection,
  onDeselectAll,
}: UseStudioCanvasContextMenuParams) {
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [contextMenu]);

  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (contextMenu) {
      setContextMenu(null);
      e.stopPropagation();
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target && !target.closest('[data-studio-layer="true"], [data-resize-handle="true"], button, input, textarea, a, select')) {
      if (!canvasRef.current?.contains(target)) onDeselectAll();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const layerEl = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-studio-layer="true"]');
    if (layerEl) {
      const id = layerEl.dataset.layerId;
      const type = layerEl.dataset.layerType as 'slot' | 'sticker' | 'text' | 'compound';
      const itemIdx = layerEl.dataset.layerIndex ? parseInt(layerEl.dataset.layerIndex, 10) : undefined;
      if (id && type) {
        const layerKey = `${type}:${id}`;
        if (selectedLayerKeys.length > 1) {
          if (selectedLayerKeys.includes(layerKey)) {
            setContextMenu({ mode: 'multi', position: { x: e.clientX, y: e.clientY } });
            return;
          }
          if (type === 'slot' && itemIdx !== undefined) onSelectSlot(itemIdx);
          else onToggleLayerSelection(layerKey);
          const isLocked = type === 'slot' && itemIdx !== undefined ? isItemLocked(scene.slots[itemIdx]) : false;
          setContextMenu({
            mode: 'layer', position: { x: e.clientX, y: e.clientY },
            entity: { type, id }, itemTarget: { type, id, itemIdx }, isLocked,
            supportsFlip: type === 'slot' || type === 'sticker' || type === 'compound',
          });
          return;
        }

        if (!selectedEntity || selectedEntity.id !== id) {
          if (type === 'slot' && itemIdx !== undefined) onSelectSlot(itemIdx);
          else onToggleLayerSelection(layerKey);
        }
        const isLocked = type === 'slot' && itemIdx !== undefined ? isItemLocked(scene.slots[itemIdx]) : false;
        setContextMenu({
          mode: 'layer', position: { x: e.clientX, y: e.clientY },
          entity: { type, id }, itemTarget: { type, id, itemIdx }, isLocked,
          supportsFlip: type === 'slot' || type === 'sticker' || type === 'compound',
        });
        return;
      }
    }

    if (selectedLayerKeys.length > 1) {
      setContextMenu({ mode: 'multi', position: { x: e.clientX, y: e.clientY } });
      return;
    }
    setContextMenu({ mode: 'canvas', position: { x: e.clientX, y: e.clientY } });
  };

  return { contextMenu, setContextMenu, handleStagePointerDown, handleContextMenu };
}

