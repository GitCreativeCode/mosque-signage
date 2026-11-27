'use client';

import { useRef, useCallback } from 'react';
import type { PosterSlotMedia, PosterCanvasSticker, PosterCompoundLayer, PosterTextOverlay } from '@/types/index';
import type { SelectedEntity, StudioSceneState } from '@/lib/posters/studio-types';
import { normalizeSceneWithZ } from '@/lib/posters/studio-zindex';

interface CopiedLayersSnapshot {
  readonly slots: PosterSlotMedia[];
  readonly stickers: PosterCanvasSticker[];
  readonly textOverlays: PosterTextOverlay[];
  readonly compoundLayers: PosterCompoundLayer[];
}

interface UseStudioClipboardParams {
  readonly scene: StudioSceneState;
  readonly selectedLayerKeys: readonly string[];
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedSlotIndex: number | null;
  readonly commitScene: (next: StudioSceneState) => void;
  readonly selectMultipleKeys?: (keys: string[]) => void;
  readonly setSelectedLayerKeys: (keys: string[]) => void;
  readonly selectSingleEntity?: (type: 'slot' | 'sticker' | 'text' | 'compound', id: string, index?: number | null) => void;
  readonly isDirtyRef: React.MutableRefObject<boolean>;
}

const randId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/** Manages copying selected layers to clipboard state and pasting them with progressive canvas offset. */
export function useStudioClipboard(params: UseStudioClipboardParams) {
  const {
    scene, selectedLayerKeys, selectedEntity, selectedSlotIndex,
    commitScene, setSelectedLayerKeys, selectMultipleKeys, isDirtyRef,
  } = params;

  const clipboardRef = useRef<CopiedLayersSnapshot | null>(null);

  const copySelected = useCallback(() => {
    const keys = selectedLayerKeys.length > 0
      ? selectedLayerKeys
      : selectedEntity
      ? [`${selectedEntity.type}:${selectedEntity.id}`]
      : selectedSlotIndex !== null && scene.slots[selectedSlotIndex]
      ? [`slot:${scene.slots[selectedSlotIndex]!.id}`]
      : [];

    if (keys.length === 0) return;

    clipboardRef.current = {
      slots: scene.slots.filter((s) => keys.includes(`slot:${s.id}`)).map((s) => ({ ...s })),
      stickers: scene.stickers.filter((stk) => keys.includes(`sticker:${stk.id}`)).map((stk) => ({ ...stk })),
      textOverlays: scene.textOverlays.filter((t) => keys.includes(`text:${t.id}`)).map((t) => ({ ...t })),
      compoundLayers: scene.compoundLayers.filter((c) => keys.includes(`compound:${c.id}`)).map((c) => ({ ...c })),
    };
  }, [selectedLayerKeys, selectedEntity, selectedSlotIndex, scene]);

  const pasteSelected = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip) return;
    const totalCount = clip.slots.length + clip.stickers.length + clip.textOverlays.length + clip.compoundLayers.length;
    if (totalCount === 0) return;

    const offset = 4;
    const newKeys: string[] = [];

    const newSlots = clip.slots.map((s) => {
      const id = randId('slot');
      newKeys.push(`slot:${id}`);
      return {
        ...s, id, is_locked: false,
        pos_x: s.pos_x !== undefined ? Math.min(92, s.pos_x + offset) : undefined,
        pos_y: s.pos_y !== undefined ? Math.min(92, s.pos_y + offset) : undefined,
        layer_folder_id: undefined,
        label: s.label ? `${s.label} (Copy)` : undefined,
      };
    });

    const newStickers = clip.stickers.map((stk) => {
      const id = randId('sticker');
      newKeys.push(`sticker:${id}`);
      return {
        ...stk, id, is_locked: false,
        pos_x: Math.min(92, stk.pos_x + offset),
        pos_y: Math.min(92, stk.pos_y + offset),
        layer_folder_id: undefined,
      };
    });

    const newTexts = clip.textOverlays.map((t) => {
      const id = randId('text');
      newKeys.push(`text:${id}`);
      return {
        ...t, id, is_locked: false,
        pos_x: Math.min(92, (t.pos_x ?? 50) + offset),
        pos_y: Math.min(92, (t.pos_y ?? 50) + offset),
        layer_folder_id: undefined,
      };
    });

    const newCompounds = clip.compoundLayers.map((c) => {
      const id = randId('compound');
      newKeys.push(`compound:${id}`);
      return {
        ...c, id, is_locked: false,
        pos_x: Math.min(92, c.pos_x + offset),
        pos_y: Math.min(92, c.pos_y + offset),
        layer_folder_id: undefined,
      };
    });

    // Cascade successive pastes
    clipboardRef.current = {
      slots: newSlots, stickers: newStickers, textOverlays: newTexts, compoundLayers: newCompounds,
    };

    const nextScene = normalizeSceneWithZ({
      ...scene,
      slots: [...scene.slots, ...newSlots],
      stickers: [...scene.stickers, ...newStickers],
      textOverlays: [...scene.textOverlays, ...newTexts],
      compoundLayers: [...scene.compoundLayers, ...newCompounds],
      rootOrder: [...newKeys, ...scene.rootOrder],
    });

    commitScene(nextScene);
    if (newKeys.length === 1 && params.selectSingleEntity) {
      const [type, id] = newKeys[0]!.split(':');
      if (id && (type === 'slot' || type === 'sticker' || type === 'text' || type === 'compound')) {
        params.selectSingleEntity(type, id, 0);
      }
    } else if (selectMultipleKeys) {
      selectMultipleKeys(newKeys);
    } else {
      setSelectedLayerKeys(newKeys);
    }
    isDirtyRef.current = true;
  }, [scene, commitScene, setSelectedLayerKeys, selectMultipleKeys, params.selectSingleEntity, isDirtyRef]);

  return { copySelected, pasteSelected };
}
