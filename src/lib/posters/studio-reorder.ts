import type { PosterLayerFolder } from '@/types/index';
import type { StudioSceneState } from './studio-types';
import { ensureRootOrder, isLayerKeyLocked, normalizeSceneWithZ } from './studio-zindex';

function setItemFolderId(
  scene: StudioSceneState,
  key: string,
  newFolderId: string | undefined,
): Pick<StudioSceneState, 'slots' | 'stickers' | 'textOverlays' | 'compoundLayers'> {
  const [type, id] = key.split(':');
  return {
    slots: type === 'slot' ? scene.slots.map((s) => (s.id === id ? { ...s, layer_folder_id: newFolderId } : s)) : scene.slots,
    stickers: type === 'sticker' ? scene.stickers.map((s) => (s.id === id ? { ...s, layer_folder_id: newFolderId } : s)) : scene.stickers,
    textOverlays: type === 'text' ? scene.textOverlays.map((t) => (t.id === id ? { ...t, layer_folder_id: newFolderId } : t)) : scene.textOverlays,
    compoundLayers: type === 'compound' ? scene.compoundLayers.map((c) => (c.id === id ? { ...c, layer_folder_id: newFolderId } : c)) : scene.compoundLayers,
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

function removeKeyFromAllFolders(folders: readonly PosterLayerFolder[], key: string): PosterLayerFolder[] {
  return folders.map((f) => ({ ...f, child_keys: (f.child_keys ?? []).filter((k) => k !== key) }));
}

function insertAtRootKey(root: string[], sourceKey: string, targetKey: string, position: 'before' | 'after' | 'inside'): string[] {
  const next = root.filter((k) => k !== sourceKey);
  const idx = next.indexOf(targetKey);
  if (idx === -1) {
    next.push(sourceKey);
    return next;
  }
  const insertIdx = Math.max(0, Math.min(next.length, position === 'after' ? idx + 1 : idx));
  next.splice(insertIdx, 0, sourceKey);
  return next;
}

function reorderFolderInRoot(
  root: string[],
  folders: readonly PosterLayerFolder[],
  scene: StudioSceneState,
  sourceKey: string,
  targetKey: string,
  position: 'before' | 'after' | 'inside',
): string[] {
  const srcIdx = root.indexOf(sourceKey);
  if (srcIdx === -1) return root;
  if (targetKey === 'root-drop-target') {
    const next = [...root];
    next.splice(srcIdx, 1);
    next.push(sourceKey);
    return next;
  }
  let targetRootKey = targetKey;
  if (!root.includes(targetKey)) {
    const parent = findContainingFolder(folders, scene, targetKey);
    if (parent) targetRootKey = `folder:${parent.id}`;
  }
  return root.includes(targetRootKey) ? insertAtRootKey(root, sourceKey, targetRootKey, position) : root;
}

/** Handles drag-and-drop layer and folder hierarchy reordering including folder adoption/ejection. */
export function reorderLayerInScene(
  scene: StudioSceneState,
  sourceKey: string,
  targetKey: string,
  position: 'before' | 'after' | 'inside' = 'before',
): StudioSceneState | null {
  if (sourceKey === targetKey || isLayerKeyLocked(sourceKey, scene)) return null;

  const root = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);
  if (sourceKey.startsWith('folder:')) {
    const nextRoot = reorderFolderInRoot(root, scene.folders, scene, sourceKey, targetKey, position);
    return normalizeSceneWithZ({ ...scene, rootOrder: nextRoot });
  }

  let items = { slots: scene.slots, stickers: scene.stickers, textOverlays: scene.textOverlays, compoundLayers: scene.compoundLayers };
  let folders = [...scene.folders];
  let nextRoot = [...root];

  if (targetKey === 'root-drop-target') {
    items = setItemFolderId(scene, sourceKey, undefined);
    nextRoot = [...nextRoot.filter((k) => k !== sourceKey), sourceKey];
    folders = removeKeyFromAllFolders(folders, sourceKey);
    return normalizeSceneWithZ({ ...items, folders, rootOrder: nextRoot });
  }

  if (targetKey.startsWith('folder:')) {
    const targetFolderId = targetKey.replace('folder:', '');
    if (folders.find((f) => f.id === targetFolderId)?.is_locked) return null;
    if (position === 'inside') {
      items = setItemFolderId(scene, sourceKey, targetFolderId);
      nextRoot = nextRoot.filter((k) => k !== sourceKey);
      folders = folders.map((f) => {
        if (f.id === targetFolderId) {
          return { ...f, is_collapsed: false, child_keys: [sourceKey, ...(f.child_keys ?? []).filter((k) => k !== sourceKey)] };
        }
        return { ...f, child_keys: (f.child_keys ?? []).filter((k) => k !== sourceKey) };
      });
    } else {
      items = setItemFolderId(scene, sourceKey, undefined);
      folders = removeKeyFromAllFolders(folders, sourceKey);
      nextRoot = insertAtRootKey(nextRoot, sourceKey, targetKey, position);
    }
    return normalizeSceneWithZ({ ...items, folders, rootOrder: nextRoot });
  }

  const targetParent = findContainingFolder(folders, scene, targetKey);
  if (targetParent) {
    if (targetParent.is_locked) return null;
    items = setItemFolderId(scene, sourceKey, targetParent.id);
    nextRoot = nextRoot.filter((k) => k !== sourceKey);
    folders = folders.map((f) => {
      if (f.id !== targetParent.id) return { ...f, child_keys: (f.child_keys ?? []).filter((k) => k !== sourceKey) };
      const keys = [...(f.child_keys ?? [])].filter((k) => k !== sourceKey);
      const tIdx = keys.indexOf(targetKey);
      if (tIdx !== -1) keys.splice(Math.max(0, Math.min(keys.length, position === 'after' ? tIdx + 1 : tIdx)), 0, sourceKey);
      else keys.push(sourceKey);
      return { ...f, is_collapsed: false, child_keys: keys };
    });
  } else {
    items = setItemFolderId(scene, sourceKey, undefined);
    folders = removeKeyFromAllFolders(folders, sourceKey);
    nextRoot = insertAtRootKey(nextRoot, sourceKey, targetKey, position);
  }

  return normalizeSceneWithZ({ ...items, folders, rootOrder: nextRoot });
}

