'use client';

import { useState, useCallback } from 'react';
import type { SelectedEntity, StudioSceneState } from '@/lib/posters/studio-types';
import { isLayerItemLocked, isLayerKeyLocked } from '@/lib/posters/studio-zindex';

/** Manages mutually exclusive single-item selection, multi-select layer keys, and lock checks. */
export function useStudioSelection(scene: StudioSceneState) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number | null>(null);
  const [selectedTextIndex, setSelectedTextIndex] = useState<number>(0);
  const [selectedCompoundId, setSelectedCompoundId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [selectedLayerKeys, setSelectedLayerKeys] = useState<string[]>([]);
  const [lastClickedLayerKey, setLastClickedLayerKey] = useState<string | null>(null);

  const selectSlot = useCallback(
    (idx: number | null) => {
      setSelectedSlotIndex(idx);
      const slot = idx !== null ? scene.slots[idx] : undefined;
      setSelectedEntity(slot ? { type: 'slot', id: slot.id } : null);
      setSelectedLayerKeys(slot ? [`slot:${slot.id}`] : []);
      setSelectedStickerIndex(null);
      setSelectedCompoundId(null);
    },
    [scene.slots],
  );

  const selectSticker = useCallback(
    (idx: number | null) => {
      setSelectedStickerIndex(idx);
      const stk = idx !== null ? scene.stickers[idx] : undefined;
      setSelectedEntity(stk ? { type: 'sticker', id: stk.id } : null);
      setSelectedLayerKeys(stk ? [`sticker:${stk.id}`] : []);
      setSelectedSlotIndex(null);
      setSelectedCompoundId(null);
    },
    [scene.stickers],
  );

  const selectText = useCallback(
    (idx: number | null) => {
      setSelectedTextIndex(idx ?? 0);
      const txt = idx !== null ? scene.textOverlays[idx] : undefined;
      setSelectedEntity(txt ? { type: 'text', id: txt.id } : null);
      setSelectedLayerKeys(txt ? [`text:${txt.id}`] : []);
      setSelectedSlotIndex(null);
      setSelectedStickerIndex(null);
      setSelectedCompoundId(null);
    },
    [scene.textOverlays],
  );

  const selectCompound = useCallback((id: string | null) => {
    setSelectedCompoundId(id);
    setSelectedEntity(id ? { type: 'compound', id } : null);
    setSelectedLayerKeys(id ? [`compound:${id}`] : []);
    setSelectedSlotIndex(null);
    setSelectedStickerIndex(null);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedEntity(null);
    setSelectedSlotIndex(null);
    setSelectedStickerIndex(null);
    setSelectedCompoundId(null);
    setSelectedLayerKeys([]);
  }, []);

  const syncEntityFromSingleKey = useCallback(
    (singleKey: string) => {
      const [type, id] = singleKey.split(':');
      if (!type || !id) return;
      if (type === 'slot') {
        const idx = scene.slots.findIndex((s) => s.id === id);
        if (idx !== -1) { setSelectedSlotIndex(idx); setSelectedEntity({ type: 'slot', id }); }
      } else if (type === 'sticker') {
        const idx = scene.stickers.findIndex((s) => s.id === id);
        if (idx !== -1) { setSelectedStickerIndex(idx); setSelectedEntity({ type: 'sticker', id }); }
      } else if (type === 'text') {
        const idx = scene.textOverlays.findIndex((t) => t.id === id);
        if (idx !== -1) { setSelectedTextIndex(idx); setSelectedEntity({ type: 'text', id }); }
      } else if (type === 'compound') {
        setSelectedCompoundId(id);
        setSelectedEntity({ type: 'compound', id });
      }
    },
    [scene.slots, scene.stickers, scene.textOverlays],
  );

  const toggleLayerSelection = useCallback(
    (key: string) => {
      setSelectedLayerKeys((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        if (next.length === 1 && next[0]) {
          syncEntityFromSingleKey(next[0]);
        } else if (next.length === 0) {
          setSelectedEntity(null);
          setSelectedSlotIndex(null);
          setSelectedStickerIndex(null);
          setSelectedCompoundId(null);
        } else {
          setSelectedEntity(null);
        }
        return next;
      });
    },
    [syncEntityFromSingleKey],
  );

  const isItemLocked = useCallback(
    (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) =>
      isLayerItemLocked(item, scene.folders),
    [scene.folders],
  );

  const isKeyLocked = useCallback((key: string) => isLayerKeyLocked(key, scene), [scene]);

  return {
    selectedSlotIndex, setSelectedSlotIndex,
    selectedStickerIndex, setSelectedStickerIndex,
    selectedTextIndex, setSelectedTextIndex,
    selectedCompoundId, setSelectedCompoundId,
    selectedEntity, setSelectedEntity,
    selectedLayerKeys, setSelectedLayerKeys,
    lastClickedLayerKey, setLastClickedLayerKey,
    selectSlot, selectSticker, selectText, selectCompound,
    deselectAll, toggleLayerSelection, isItemLocked, isKeyLocked,
  };
}

