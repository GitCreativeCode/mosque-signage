'use client';

import { useEffect } from 'react';
import { deleteLayerKeysFromScene } from '@/lib/posters/studio-layers';
import { isLayerKeyLocked } from '@/lib/posters/studio-zindex';
import type { SelectedEntity, StudioSceneState } from '@/lib/posters/studio-types';

interface UseStudioKeyboardShortcutsParams {
  readonly isOpen: boolean;
  readonly showDiscardConfirm: boolean;
  readonly scene: StudioSceneState;
  readonly selectedSlotIndex: number | null;
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedLayerKeys: readonly string[];
  readonly setSelectedLayerKeys: (keys: string[]) => void;
  readonly setSelectedSlotIndex: (idx: number | null) => void;
  readonly commitScene: (next: StudioSceneState) => void;
  readonly deselectAll: () => void;
  readonly handleUndo: () => void;
  readonly handleRedo: () => void;
  readonly onDuplicateSelected?: (() => void) | undefined;
  readonly onCopySelected?: (() => void) | undefined;
  readonly onPasteSelected?: (() => void) | undefined;
  readonly onToggleLockSelected?: (() => void) | undefined;
}

export function resolveKeysToDelete(
  scene: StudioSceneState,
  selectedLayerKeys: readonly string[],
  selectedEntity: SelectedEntity | null,
  selectedSlotIndex: number | null
): string[] {
  if (selectedLayerKeys.length > 0) {
    return [...selectedLayerKeys];
  }
  if (selectedEntity) {
    return [`${selectedEntity.type}:${selectedEntity.id}`];
  }
  if (selectedSlotIndex !== null && scene.slots[selectedSlotIndex]) {
    return [`slot:${scene.slots[selectedSlotIndex]!.id}`];
  }
  return [];
}

/** Handles global Studio keyboard shortcuts (1-9 slot switch, Ctrl+Z/Y undo-redo, Delete/Backspace). */
export function useStudioKeyboardShortcuts(params: UseStudioKeyboardShortcutsParams) {
  const {
    isOpen, showDiscardConfirm, scene, selectedSlotIndex, selectedEntity,
    selectedLayerKeys, setSelectedLayerKeys, setSelectedSlotIndex, commitScene,
    deselectAll, handleUndo, handleRedo,
  } = params;

  useEffect(() => {
    if (!isOpen || showDiscardConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;

      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < scene.slots.length) setSelectedSlotIndex(idx);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        e.stopPropagation();
        params.onDuplicateSelected?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        params.onCopySelected?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        params.onPasteSelected?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        if (params.onToggleLockSelected) {
          e.preventDefault();
          params.onToggleLockSelected();
          return;
        }
      }

      if (e.key === 'Escape') {
        const hasActiveSelection = selectedLayerKeys.length > 0 || selectedEntity !== null;
        if (hasActiveSelection) {
          e.preventDefault();
          e.stopPropagation();
          setSelectedLayerKeys([]);
          deselectAll();
          return;
        }
      }

      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        const keys = resolveKeysToDelete(scene, selectedLayerKeys, selectedEntity, selectedSlotIndex);
        const unlockedKeys = keys.filter((k) => !isLayerKeyLocked(k, scene));
        if (unlockedKeys.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 5 : 1;
          const k = e.key.toLowerCase();
          const dx = k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0;
          const dy = k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0;

          let hasChanges = false;
          const nextSlots = scene.slots.map((s) => {
            if (!unlockedKeys.includes(`slot:${s.id}`) || s.pos_x === undefined || s.pos_y === undefined) return s;
            hasChanges = true;
            return {
              ...s,
              pos_x: Math.max(5, Math.min(95, s.pos_x + dx)),
              pos_y: Math.max(5, Math.min(95, s.pos_y + dy)),
            };
          });
          const nextStickers = scene.stickers.map((stk) => {
            if (!unlockedKeys.includes(`sticker:${stk.id}`)) return stk;
            hasChanges = true;
            return {
              ...stk,
              pos_x: Math.max(5, Math.min(95, stk.pos_x + dx)),
              pos_y: Math.max(5, Math.min(95, stk.pos_y + dy)),
            };
          });
          const nextTexts = scene.textOverlays.map((t) => {
            if (!unlockedKeys.includes(`text:${t.id}`)) return t;
            hasChanges = true;
            return {
              ...t,
              pos_x: Math.max(5, Math.min(95, (t.pos_x ?? 50) + dx)),
              pos_y: Math.max(5, Math.min(95, (t.pos_y ?? 50) + dy)),
            };
          });
          const nextCompounds = scene.compoundLayers.map((c) => {
            if (!unlockedKeys.includes(`compound:${c.id}`)) return c;
            hasChanges = true;
            return {
              ...c,
              pos_x: Math.max(5, Math.min(95, c.pos_x + dx)),
              pos_y: Math.max(5, Math.min(95, c.pos_y + dy)),
            };
          });

          if (hasChanges) {
            commitScene({
              ...scene,
              slots: nextSlots,
              stickers: nextStickers,
              textOverlays: nextTexts,
              compoundLayers: nextCompounds,
            });
          }
          return;
        }
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      e.preventDefault();

      const keys = resolveKeysToDelete(scene, selectedLayerKeys, selectedEntity, selectedSlotIndex);
      if (keys.length === 0) return;

      const unlockedKeys = keys.filter((k) => !isLayerKeyLocked(k, scene));
      if (unlockedKeys.length === 0) return;

      const nextScene = deleteLayerKeysFromScene(scene, unlockedKeys);
      if (nextScene === scene || (nextScene.slots.length === 0 && scene.slots.length > 0)) return;

      commitScene(nextScene);
      const remainingSelected = selectedLayerKeys.filter((k) => !unlockedKeys.includes(k));
      if (remainingSelected.length > 0) {
        setSelectedLayerKeys(remainingSelected);
      } else {
        setSelectedLayerKeys([]);
        deselectAll();
      }
      if (nextScene.slots.length < scene.slots.length && selectedSlotIndex !== null) {
        setSelectedSlotIndex(Math.max(0, Math.min(selectedSlotIndex, nextScene.slots.length - 1)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen, showDiscardConfirm, scene, selectedSlotIndex, selectedEntity,
    selectedLayerKeys, setSelectedLayerKeys, setSelectedSlotIndex, commitScene,
    deselectAll, handleUndo, handleRedo,
  ]);
}
