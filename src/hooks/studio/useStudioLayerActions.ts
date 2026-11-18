'use client';

import { useCallback } from 'react';
import type { LayerItemTarget, StudioSceneState } from '@/lib/posters/studio-types';
import { ensureRootOrder, normalizeSceneWithZ } from '@/lib/posters/studio-zindex';
import { mergeSelectionIntoCompoundState, unmergeCompoundState } from '@/lib/posters/studio-compound';
import {
  deleteLayerKeysFromScene,
  duplicateLayerInScene,
  moveLayerInHierarchy,
} from '@/lib/posters/studio-layers';
import {
  duplicateFolderInScene,
  groupSelectionIntoFolderState,
  ungroupFolderFromScene,
} from '@/lib/posters/studio-folders';
import { reorderLayerInScene } from '@/lib/posters/studio-reorder';

interface UseStudioLayerActionsParams {
  readonly scene: StudioSceneState;
  readonly selectedLayerKeys: readonly string[];
  readonly setSelectedLayerKeys: (keys: string[]) => void;
  readonly setSelectedSlotIndex: (idx: number | null) => void;
  readonly selectSticker: (idx: number | null) => void;
  readonly selectText: (idx: number | null) => void;
  readonly selectCompound: (id: string | null) => void;
  readonly deselectAll: () => void;
  readonly commitScene: (next: StudioSceneState) => void;
  readonly commitSlots: (slots: StudioSceneState['slots']) => void;
  readonly setSlots: React.Dispatch<React.SetStateAction<StudioSceneState['slots']>>;
  readonly setStickers: React.Dispatch<React.SetStateAction<StudioSceneState['stickers']>>;
  readonly setTextOverlays: React.Dispatch<React.SetStateAction<StudioSceneState['textOverlays']>>;
  readonly setCompoundLayers: React.Dispatch<React.SetStateAction<StudioSceneState['compoundLayers']>>;
  readonly setFolders: React.Dispatch<React.SetStateAction<StudioSceneState['folders']>>;
  readonly isDirtyRef: React.MutableRefObject<boolean>;
}

/** Provides layer tree CRUD, grouping, compound merge/unmerge, lock toggles, and folder actions. */
export function useStudioLayerActions(params: UseStudioLayerActionsParams) {
  const {
    scene, selectedLayerKeys, setSelectedLayerKeys, setSelectedSlotIndex,
    selectSticker, selectText, selectCompound,
    deselectAll, commitScene, commitSlots, setSlots, setStickers, setTextOverlays,
    setCompoundLayers, setFolders, isDirtyRef,
  } = params;

  const handleUnmergeCompound = useCallback(
    (compoundId: string) => {
      const next = unmergeCompoundState(scene, compoundId);
      if (!next) return;
      commitScene(next);
      deselectAll();
    },
    [scene, commitScene, deselectAll],
  );

  const handleGroupSelectedIntoFolder = useCallback(() => {
    const next = groupSelectionIntoFolderState(scene, selectedLayerKeys);
    if (next) commitScene(next);
  }, [scene, selectedLayerKeys, commitScene]);

  const handleMergeSelectedIntoCompound = useCallback(() => {
    const res = mergeSelectionIntoCompoundState(scene, selectedLayerKeys);
    if (!res) return;
    commitScene(res.nextScene);
    setSelectedLayerKeys([]);
    selectCompound(res.newCompoundId);
  }, [scene, selectedLayerKeys, commitScene, setSelectedLayerKeys, selectCompound]);

  const handleDeleteSelectedLayers = useCallback(() => {
    if (selectedLayerKeys.length === 0) return;
    commitScene(deleteLayerKeysFromScene(scene, selectedLayerKeys));
    setSelectedLayerKeys([]);
    deselectAll();
  }, [scene, selectedLayerKeys, commitScene, setSelectedLayerKeys, deselectAll]);

  const handleReorderSlot = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= scene.slots.length || toIndex >= scene.slots.length) return;
      const nextSlots = [...scene.slots];
      const moved = nextSlots[fromIndex];
      if (!moved) return;
      nextSlots.splice(fromIndex, 1);
      nextSlots.splice(toIndex, 0, moved);
      commitSlots(nextSlots);
      setSelectedSlotIndex(toIndex);
    },
    [scene.slots, commitSlots, setSelectedSlotIndex],
  );

  const handleDuplicateLayer = (item: LayerItemTarget) => {
    const res = duplicateLayerInScene(scene, item);
    if (!res) return;
    commitScene(res.nextScene);
    if (item.type === 'slot') setSelectedSlotIndex(res.newIndex);
    else if (item.type === 'sticker') selectSticker(res.newIndex);
    else if (item.type === 'text') selectText(res.newIndex);
    else if (item.type === 'compound') selectCompound(res.newId);
  };

  const toggleItemLock = (item: LayerItemTarget) => {
    if (item.type === 'slot') {
      const updated = [...scene.slots];
      const idx = item.itemIdx ?? updated.findIndex((s) => s.id === item.id);
      if (idx !== -1 && updated[idx]) {
        updated[idx] = { ...updated[idx]!, is_locked: !updated[idx]!.is_locked };
        commitSlots(updated);
      }
      return;
    }
    if (item.type === 'sticker') {
      setStickers((prev) => prev.map((s, i) => ((item.itemIdx !== undefined ? i === item.itemIdx : s.id === item.id) ? { ...s, is_locked: !s.is_locked } : s)));
    } else if (item.type === 'text') {
      setTextOverlays((prev) => prev.map((t, i) => ((item.itemIdx !== undefined ? i === item.itemIdx : t.id === item.id) ? { ...t, is_locked: !t.is_locked } : t)));
    } else if (item.type === 'compound') {
      setCompoundLayers((prev) => prev.map((c) => (c.id === item.id ? { ...c, is_locked: !c.is_locked } : c)));
    }
    isDirtyRef.current = true;
  };

  const handleMoveLayerUp = (item: LayerItemTarget) => { const next = moveLayerInHierarchy(scene, item, -1); if (next) commitScene(next); };
  const handleMoveLayerDown = (item: LayerItemTarget) => { const next = moveLayerInHierarchy(scene, item, 1); if (next) commitScene(next); };
  const handleDeleteLayer = (item: LayerItemTarget) => { commitScene(deleteLayerKeysFromScene(scene, [`${item.type}:${item.id}`])); deselectAll(); };

  const handleMoveFolder = (folderId: string, direction: -1 | 1) => {
    const root = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);
    const idx = root.indexOf(`folder:${folderId}`);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= root.length) return;
    const nextRoot = [...root];
    const [moved] = nextRoot.splice(idx, 1);
    nextRoot.splice(targetIdx, 0, moved!);
    commitScene(normalizeSceneWithZ({ ...scene, rootOrder: nextRoot }));
  };

  const handleToggleFolderLock = (folderId: string) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, is_locked: !f.is_locked } : f)));
    isDirtyRef.current = true;
  };

  const handleDuplicateFolder = (folderId: string) => {
    const next = duplicateFolderInScene(scene, folderId);
    if (next) commitScene(next);
  };

  const handleUngroupFolder = (folderId: string) => {
    commitScene(ungroupFolderFromScene(scene, folderId));
  };

  const handleDeleteFolderAndContents = (folderId: string) => {
    const next = normalizeSceneWithZ({
      slots: scene.slots.filter((s) => s.layer_folder_id !== folderId),
      stickers: scene.stickers.filter((s) => s.layer_folder_id !== folderId),
      textOverlays: scene.textOverlays.filter((t) => t.layer_folder_id !== folderId),
      compoundLayers: scene.compoundLayers.filter((c) => c.layer_folder_id !== folderId),
      folders: scene.folders.filter((f) => f.id !== folderId),
      rootOrder: scene.rootOrder.filter((k) => k !== `folder:${folderId}`),
    });
    commitScene(next);
    deselectAll();
  };

  const handleLockSelectedLayers = () => {
    if (selectedLayerKeys.length === 0) return;
    setSlots((prev) => prev.map((s) => (selectedLayerKeys.includes(`slot:${s.id}`) ? { ...s, is_locked: !s.is_locked } : s)));
    setStickers((prev) => prev.map((s) => (selectedLayerKeys.includes(`sticker:${s.id}`) ? { ...s, is_locked: !s.is_locked } : s)));
    setTextOverlays((prev) => prev.map((t) => (selectedLayerKeys.includes(`text:${t.id}`) ? { ...t, is_locked: !t.is_locked } : t)));
    setCompoundLayers((prev) => prev.map((c) => (selectedLayerKeys.includes(`compound:${c.id}`) ? { ...c, is_locked: !c.is_locked } : c)));
    isDirtyRef.current = true;
  };

  const handleReorderLayers = (sourceKey: string, targetKey: string, position: 'before' | 'after' | 'inside' = 'before') => {
    const next = reorderLayerInScene(scene, sourceKey, targetKey, position);
    if (next) commitScene(next);
  };

  return {
    handleUnmergeCompound, handleGroupSelectedIntoFolder, handleMergeSelectedIntoCompound,
    handleDeleteSelectedLayers, handleReorderSlot,
    handleMoveSlot: (index: number, direction: -1 | 1) => handleReorderSlot(index, index + direction),
    handleDuplicateLayer, toggleItemLock, handleMoveLayerUp, handleMoveLayerDown,
    handleDeleteLayer, handleMoveFolder, handleToggleFolderLock, handleDuplicateFolder,
    handleUngroupFolder, handleDeleteFolderAndContents, handleLockSelectedLayers, handleReorderLayers,
  };
}
