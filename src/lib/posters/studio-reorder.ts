import type { PosterLayerFolder } from '@/types/index';
import type { StudioSceneState } from './studio-types';
import { ensureRootOrder, isLayerKeyLocked, normalizeSceneWithZ } from './studio-zindex';

function setMultipleItemFolderIds(
  scene: StudioSceneState,
  keys: readonly string[],
  newFolderId: string | undefined,
): Pick<StudioSceneState, 'slots' | 'stickers' | 'textOverlays' | 'compoundLayers'> {
  const keySet = new Set(keys);
  return {
    slots: scene.slots.map((s) => (keySet.has(`slot:${s.id}`) ? { ...s, layer_folder_id: newFolderId } : s)),
    stickers: scene.stickers.map((s) => (keySet.has(`sticker:${s.id}`) ? { ...s, layer_folder_id: newFolderId } : s)),
    textOverlays: scene.textOverlays.map((t) => (keySet.has(`text:${t.id}`) ? { ...t, layer_folder_id: newFolderId } : t)),
    compoundLayers: scene.compoundLayers.map((c) => (keySet.has(`compound:${c.id}`) ? { ...c, layer_folder_id: newFolderId } : c)),
  };
}

function findContainingFolder(folders: readonly PosterLayerFolder[], scene: StudioSceneState, key: string): PosterLayerFolder | undefined {
  return folders.find(
    (f) =>
      scene.slots.some((s) => s.layer_folder_id === f.id && `slot:${s.id}` === key) ||
      scene.stickers.some((s) => s.layer_folder_id === f.id && `sticker:${s.id}` === key) ||
      scene.textOverlays.some((t) => t.layer_folder_id === f.id && `text:${t.id}` === key) ||
      scene.compoundLayers.some((c) => c.layer_folder_id === f.id && `compound:${c.id}` === key),
  );
}

function removeKeysFromAllFolders(folders: readonly PosterLayerFolder[], keys: readonly string[]): PosterLayerFolder[] {
  const keySet = new Set(keys);
  return folders.map((f) => ({ ...f, child_keys: (f.child_keys ?? []).filter((k) => !keySet.has(k)) }));
}

function insertKeysAtRoot(root: string[], sourceKeys: readonly string[], targetKey: string, position: 'before' | 'after' | 'inside'): string[] {
  const keySet = new Set(sourceKeys);
  const next = root.filter((k) => !keySet.has(k));
  const idx = next.indexOf(targetKey);
  if (idx === -1) {
    next.push(...sourceKeys);
    return next;
  }
  const insertIdx = Math.max(0, Math.min(next.length, position === 'after' ? idx + 1 : idx));
  next.splice(insertIdx, 0, ...sourceKeys);
  return next;
}

/** Handles drag-and-drop layer and folder hierarchy reordering (single or multi-layer block moves). */
export function reorderLayerInScene(
  scene: StudioSceneState,
  sourceInput: string | readonly string[],
  targetKey: string,
  position: 'before' | 'after' | 'inside' = 'before',
): StudioSceneState | null {
  const rawKeys = Array.isArray(sourceInput) ? sourceInput : [sourceInput];
  const sourceKeys = rawKeys.filter((k) => k !== targetKey && !isLayerKeyLocked(k, scene));
  if (sourceKeys.length === 0) return null;

  const root = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);

  // If moving a single folder at root
  if (sourceKeys.length === 1 && sourceKeys[0]!.startsWith('folder:')) {
    const src = sourceKeys[0]!;
    const nextRoot = insertKeysAtRoot(root, [src], targetKey, position);
    return normalizeSceneWithZ({ ...scene, rootOrder: nextRoot });
  }

  let items = { slots: scene.slots, stickers: scene.stickers, textOverlays: scene.textOverlays, compoundLayers: scene.compoundLayers };
  let folders = [...scene.folders];
  let nextRoot = [...root];

  if (targetKey === 'root-drop-target') {
    items = setMultipleItemFolderIds(scene, sourceKeys, undefined);
    const keySet = new Set(sourceKeys);
    nextRoot = [...nextRoot.filter((k) => !keySet.has(k)), ...sourceKeys];
    folders = removeKeysFromAllFolders(folders, sourceKeys);
    return normalizeSceneWithZ({ ...items, folders, rootOrder: nextRoot });
  }

  if (targetKey.startsWith('folder:')) {
    const targetFolderId = targetKey.replace('folder:', '');
    if (folders.find((f) => f.id === targetFolderId)?.is_locked) return null;
    if (position === 'inside') {
      items = setMultipleItemFolderIds(scene, sourceKeys, targetFolderId);
      const keySet = new Set(sourceKeys);
      nextRoot = nextRoot.filter((k) => !keySet.has(k));
      folders = folders.map((f) => {
        if (f.id === targetFolderId) {
          const filtered = (f.child_keys ?? []).filter((k) => !keySet.has(k));
          return { ...f, is_collapsed: false, child_keys: [...sourceKeys, ...filtered] };
        }
        return { ...f, child_keys: (f.child_keys ?? []).filter((k) => !keySet.has(k)) };
      });
    } else {
      items = setMultipleItemFolderIds(scene, sourceKeys, undefined);
      folders = removeKeysFromAllFolders(folders, sourceKeys);
      nextRoot = insertKeysAtRoot(nextRoot, sourceKeys, targetKey, position);
    }
    return normalizeSceneWithZ({ ...items, folders, rootOrder: nextRoot });
  }

  const targetParent = findContainingFolder(folders, scene, targetKey);
  if (targetParent) {
    if (targetParent.is_locked) return null;
    items = setMultipleItemFolderIds(scene, sourceKeys, targetParent.id);
    const keySet = new Set(sourceKeys);
    nextRoot = nextRoot.filter((k) => !keySet.has(k));
    folders = folders.map((f) => {
      if (f.id !== targetParent.id) return { ...f, child_keys: (f.child_keys ?? []).filter((k) => !keySet.has(k)) };
      const filtered = (f.child_keys ?? []).filter((k) => !keySet.has(k));
      const tIdx = filtered.indexOf(targetKey);
      const insIdx = tIdx !== -1 ? (position === 'after' ? tIdx + 1 : tIdx) : filtered.length;
      filtered.splice(insIdx, 0, ...sourceKeys);
      return { ...f, is_collapsed: false, child_keys: filtered };
    });
  } else {
    items = setMultipleItemFolderIds(scene, sourceKeys, undefined);
    folders = removeKeysFromAllFolders(folders, sourceKeys);
    nextRoot = insertKeysAtRoot(nextRoot, sourceKeys, targetKey, position);
  }

  return normalizeSceneWithZ({ ...items, folders, rootOrder: nextRoot });
}
