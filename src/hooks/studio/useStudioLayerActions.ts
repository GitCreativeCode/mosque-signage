'use client';

import { useCallback } from 'react';
import type { PosterLayoutArchetype } from '@/types/index';
import type { LayerItemTarget, SelectedEntityType, StudioSceneState } from '@/lib/posters/studio-types';
import { ensureRootOrder, normalizeSceneWithZ } from '@/lib/posters/studio-zindex';
import { mergeSelectionIntoCompoundState, unmergeCompoundState } from '@/lib/posters/studio-compound';
import { alignSelectedLayersState, type LayerAlignment } from '@/lib/posters/studio-bounds';
import {
  deleteLayerKeysFromScene,
  duplicateLayerInScene,
  moveLayerInHierarchy,
  moveLayerToExtreme,
} from '@/lib/posters/studio-layers';
import {
  duplicateFolderInScene,
  groupSelectionIntoFolderState,
  ungroupFolderFromScene,
} from '@/lib/posters/studio-folders';
import { reorderLayerInScene } from '@/lib/posters/studio-reorder';

interface UseStudioLayerActionsParams {
  readonly scene: StudioSceneState;
  readonly archetype?: PosterLayoutArchetype | undefined;
  readonly selectedLayerKeys: readonly string[];
  readonly setSelectedLayerKeys: (keys: string[]) => void;
  readonly setSelectedSlotIndex: (idx: number | null) => void; readonly selectSticker: (idx: number | null) => void;
  readonly selectText: (idx: number | null) => void; readonly selectCompound: (id: string | null) => void;
  readonly selectSingleEntity?: (type: 'slot' | 'sticker' | 'text' | 'compound', id: string, index?: number | null) => void;
  readonly deselectAll: () => void;
  readonly commitScene: (next: StudioSceneState) => void;
  readonly commitSlots: (slots: StudioSceneState['slots']) => void;
  readonly setSlots: React.Dispatch<React.SetStateAction<StudioSceneState['slots']>>; readonly setStickers: React.Dispatch<React.SetStateAction<StudioSceneState['stickers']>>;
  readonly setTextOverlays: React.Dispatch<React.SetStateAction<StudioSceneState['textOverlays']>>; readonly setCompoundLayers: React.Dispatch<React.SetStateAction<StudioSceneState['compoundLayers']>>;
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

  const handleUnmergeCompound = useCallback((compoundId: string) => {
    const next = unmergeCompoundState(scene, compoundId);
    if (next) { commitScene(next); deselectAll(); }
  }, [scene, commitScene, deselectAll]);

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
    if (params.selectSingleEntity) {
      params.selectSingleEntity(item.type, res.newId, res.newIndex);
    } else {
      setSelectedLayerKeys([`${item.type}:${res.newId}`]);
    }
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
    if (item.type === 'sticker') setStickers((p) => p.map((s, i) => ((item.itemIdx !== undefined ? i === item.itemIdx : s.id === item.id) ? { ...s, is_locked: !s.is_locked } : s)));
    else if (item.type === 'text') setTextOverlays((p) => p.map((t, i) => ((item.itemIdx !== undefined ? i === item.itemIdx : t.id === item.id) ? { ...t, is_locked: !t.is_locked } : t)));
    else if (item.type === 'compound') setCompoundLayers((p) => p.map((c) => (c.id === item.id ? { ...c, is_locked: !c.is_locked } : c)));
    isDirtyRef.current = true;
  };

  const handleMoveLayerUp = (item: LayerItemTarget) => { const next = moveLayerInHierarchy(scene, item, -1); if (next) commitScene(next); };
  const handleMoveLayerDown = (item: LayerItemTarget) => { const next = moveLayerInHierarchy(scene, item, 1); if (next) commitScene(next); };
  const handleBringToFront = (item: LayerItemTarget) => { const next = moveLayerToExtreme(scene, item, 'front'); if (next) commitScene(next); };
  const handleSendToBack = (item: LayerItemTarget) => { const next = moveLayerToExtreme(scene, item, 'back'); if (next) commitScene(next); };
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

  const handleToggleFolderLock = (folderId: string) => { setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, is_locked: !f.is_locked } : f))); isDirtyRef.current = true; };
  const handleDuplicateFolder = (folderId: string) => { const next = duplicateFolderInScene(scene, folderId); if (next) commitScene(next); };
  const handleUngroupFolder = (folderId: string) => { commitScene(ungroupFolderFromScene(scene, folderId)); };
  const handleDeleteFolderAndContents = (folderId: string) => {
    commitScene(normalizeSceneWithZ({
      slots: scene.slots.filter((s) => s.layer_folder_id !== folderId),
      stickers: scene.stickers.filter((s) => s.layer_folder_id !== folderId),
      textOverlays: scene.textOverlays.filter((t) => t.layer_folder_id !== folderId),
      compoundLayers: scene.compoundLayers.filter((c) => c.layer_folder_id !== folderId),
      folders: scene.folders.filter((f) => f.id !== folderId),
      rootOrder: scene.rootOrder.filter((k) => k !== `folder:${folderId}`),
    }));
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

  const handleAlignSelectedLayers = useCallback(
    (alignment: LayerAlignment) => {
      if (selectedLayerKeys.length <= 1) return;
      const next = alignSelectedLayersState(scene, selectedLayerKeys, params.archetype ?? 'freeform', alignment);
      commitScene(next);
    },
    [scene, selectedLayerKeys, params.archetype, commitScene],
  );

  const handleDuplicateSelectedLayers = useCallback(() => {
    if (selectedLayerKeys.length === 0) return;
    let nextScene = scene;
    const newKeys: string[] = [];
    let lastType: SelectedEntityType | null = null;
    let lastId = '';
    let lastIdx: number | undefined = undefined;
    for (const key of selectedLayerKeys) {
      const [type, id] = key.split(':');
      if (!type || !id) continue;
      if (type !== 'slot' && type !== 'sticker' && type !== 'text' && type !== 'compound') continue;
      const res = duplicateLayerInScene(nextScene, { type, id });
      if (res) {
        nextScene = res.nextScene;
        newKeys.push(`${type}:${res.newId}`);
        lastType = type;
        lastId = res.newId;
        lastIdx = res.newIndex;
      }
    }
    commitScene(nextScene);
    if (newKeys.length === 1 && lastType && lastId && params.selectSingleEntity) {
      params.selectSingleEntity(lastType, lastId, lastIdx);
    } else if (newKeys.length > 0) {
      deselectAll();
      setSelectedLayerKeys(newKeys);
    }
  }, [scene, selectedLayerKeys, commitScene, params.selectSingleEntity, deselectAll, setSelectedLayerKeys]);

  const handleReorderLayers = (sourceKey: string | readonly string[], targetKey: string, position: 'before' | 'after' | 'inside' = 'before') => {
    const next = reorderLayerInScene(scene, sourceKey, targetKey, position);
    if (next) commitScene(next);
  };

  const handleBatchRotateDelta = useCallback((deltaDeg: number) => {
    if (selectedLayerKeys.length === 0) return;
    setStickers((p) => p.map((s) => (selectedLayerKeys.includes(`sticker:${s.id}`) && !s.is_locked ? { ...s, rotation: Math.max(-180, Math.min(180, (s.rotation ?? 0) + deltaDeg)) } : s)));
    setTextOverlays((p) => p.map((t) => (selectedLayerKeys.includes(`text:${t.id}`) && !t.is_locked ? { ...t, rotation: Math.max(-180, Math.min(180, (t.rotation ?? 0) + deltaDeg)) } : t)));
    setCompoundLayers((p) => p.map((c) => (selectedLayerKeys.includes(`compound:${c.id}`) && !c.is_locked ? { ...c, rotation: Math.max(-180, Math.min(180, (c.rotation ?? 0) + deltaDeg)) } : c)));
    if (params.archetype === 'freeform') setSlots((p) => p.map((s) => (selectedLayerKeys.includes(`slot:${s.id}`) && !s.is_locked ? { ...s, rotation: Math.max(-180, Math.min(180, (s.rotation ?? 0) + deltaDeg)) } : s)));
    isDirtyRef.current = true;
  }, [selectedLayerKeys, params.archetype, setStickers, setTextOverlays, setCompoundLayers, setSlots, isDirtyRef]);

  const handleBatchResetRotation = useCallback(() => {
    if (selectedLayerKeys.length === 0) return;
    setStickers((p) => p.map((s) => (selectedLayerKeys.includes(`sticker:${s.id}`) && !s.is_locked ? { ...s, rotation: 0 } : s)));
    setTextOverlays((p) => p.map((t) => (selectedLayerKeys.includes(`text:${t.id}`) && !t.is_locked ? { ...t, rotation: 0 } : t)));
    setCompoundLayers((p) => p.map((c) => (selectedLayerKeys.includes(`compound:${c.id}`) && !c.is_locked ? { ...c, rotation: 0 } : c)));
    if (params.archetype === 'freeform') setSlots((p) => p.map((s) => (selectedLayerKeys.includes(`slot:${s.id}`) && !s.is_locked ? { ...s, rotation: 0 } : s)));
    isDirtyRef.current = true;
  }, [selectedLayerKeys, params.archetype, setStickers, setTextOverlays, setCompoundLayers, setSlots, isDirtyRef]);

  const handleBatchFlip = useCallback((axis: 'h' | 'v') => {
    if (selectedLayerKeys.length === 0) return;
    setStickers((p) => p.map((s) => (selectedLayerKeys.includes(`sticker:${s.id}`) && !s.is_locked ? { ...s, flip_x: axis === 'h' ? !s.flip_x : s.flip_x, flip_y: axis === 'v' ? !s.flip_y : s.flip_y } : s)));
    setCompoundLayers((p) => p.map((c) => (selectedLayerKeys.includes(`compound:${c.id}`) && !c.is_locked ? { ...c, flip_x: axis === 'h' ? !c.flip_x : c.flip_x, flip_y: axis === 'v' ? !c.flip_y : c.flip_y } : c)));
    if (params.archetype === 'freeform') setSlots((p) => p.map((s) => (selectedLayerKeys.includes(`slot:${s.id}`) && !s.is_locked ? { ...s, flip_x: axis === 'h' ? !s.flip_x : s.flip_x, flip_y: axis === 'v' ? !s.flip_y : s.flip_y } : s)));
    isDirtyRef.current = true;
  }, [selectedLayerKeys, params.archetype, setStickers, setCompoundLayers, setSlots, isDirtyRef]);

  const handleBatchBringToFront = useCallback(() => {
    if (selectedLayerKeys.length === 0) return;
    const root = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);
    commitScene(normalizeSceneWithZ({ ...scene, rootOrder: [...root.filter((k) => !selectedLayerKeys.includes(k)), ...root.filter((k) => selectedLayerKeys.includes(k))] }));
  }, [scene, selectedLayerKeys, commitScene]);

  const handleBatchSendToBack = useCallback(() => {
    if (selectedLayerKeys.length === 0) return;
    const root = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);
    commitScene(normalizeSceneWithZ({ ...scene, rootOrder: [...root.filter((k) => selectedLayerKeys.includes(k)), ...root.filter((k) => !selectedLayerKeys.includes(k))] }));
  }, [scene, selectedLayerKeys, commitScene]);

  return {
    handleUnmergeCompound, handleGroupSelectedIntoFolder, handleMergeSelectedIntoCompound,
    handleDeleteSelectedLayers, handleReorderSlot,
    handleMoveSlot: (index: number, direction: -1 | 1) => handleReorderSlot(index, index + direction),
    handleDuplicateLayer, toggleItemLock, handleMoveLayerUp, handleMoveLayerDown,
    handleBringToFront, handleSendToBack,
    handleDeleteLayer, handleMoveFolder, handleToggleFolderLock, handleDuplicateFolder,
    handleUngroupFolder, handleDeleteFolderAndContents, handleLockSelectedLayers,
    handleAlignSelectedLayers, handleDuplicateSelectedLayers, handleReorderLayers,
    handleBatchRotateDelta, handleBatchResetRotation, handleBatchFlip,
    handleBatchBringToFront, handleBatchSendToBack,
  };
}
