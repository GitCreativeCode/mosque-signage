import type { PosterLayerFolder } from '@/types/index';
import type { StudioSceneState } from './studio-types';
import { ensureRootOrder, normalizeSceneWithZ } from './studio-zindex';

/** Groups selected layer keys into a new Layer Folder anchored at the first selected root item. */
export function groupSelectionIntoFolderState(scene: StudioSceneState, selectedKeys: readonly string[]): StudioSceneState | null {
  if (selectedKeys.length === 0) return null;
  const newFolderId = `folder-${Date.now()}`;
  const childKeys = selectedKeys.filter((k) => !k.startsWith('folder:'));
  const newFolder: PosterLayerFolder = { id: newFolderId, name: `Folder ${scene.folders.length + 1}`, is_collapsed: false, child_keys: childKeys };
  const currentRoot = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);

  let inserted = false;
  const newRoot: string[] = [];
  currentRoot.forEach((k) => {
    if (childKeys.includes(k)) {
      if (!inserted) { newRoot.push(`folder:${newFolderId}`); inserted = true; }
    } else {
      newRoot.push(k);
    }
  });
  if (!inserted) newRoot.unshift(`folder:${newFolderId}`);

  return normalizeSceneWithZ({
    slots: scene.slots.map((s) => (childKeys.includes(`slot:${s.id}`) ? { ...s, layer_folder_id: newFolderId } : s)),
    stickers: scene.stickers.map((stk) => (childKeys.includes(`sticker:${stk.id}`) ? { ...stk, layer_folder_id: newFolderId } : stk)),
    textOverlays: scene.textOverlays.map((t) => (childKeys.includes(`text:${t.id}`) ? { ...t, layer_folder_id: newFolderId } : t)),
    compoundLayers: scene.compoundLayers.map((c) => (childKeys.includes(`compound:${c.id}`) ? { ...c, layer_folder_id: newFolderId } : c)),
    folders: [...scene.folders, newFolder],
    rootOrder: newRoot,
  });
}

/** Clones an entire folder and all nested child items with +3% positional offset. */
export function duplicateFolderInScene(scene: StudioSceneState, folderId: string): StudioSceneState | null {
  const origFolder = scene.folders.find((f) => f.id === folderId);
  if (!origFolder) return null;
  const newFolderId = `folder-${Date.now()}`;
  const rand = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newChildKeys: string[] = [];

  const clonedSlots = scene.slots.filter((s) => s.layer_folder_id === folderId).map((s) => {
    const id = rand('slot'); newChildKeys.push(`slot:${id}`);
    return { ...s, id, pos_x: s.pos_x !== undefined ? Math.min(90, s.pos_x + 3) : undefined, pos_y: s.pos_y !== undefined ? Math.min(90, s.pos_y + 3) : undefined, layer_folder_id: newFolderId };
  });
  const clonedStickers = scene.stickers.filter((stk) => stk.layer_folder_id === folderId).map((stk) => {
    const id = rand('sticker'); newChildKeys.push(`sticker:${id}`);
    return { ...stk, id, pos_x: Math.min(90, stk.pos_x + 3), pos_y: Math.min(90, stk.pos_y + 3), layer_folder_id: newFolderId };
  });
  const clonedTexts = scene.textOverlays.filter((t) => t.layer_folder_id === folderId).map((t) => {
    const id = rand('text'); newChildKeys.push(`text:${id}`);
    return { ...t, id, pos_x: t.pos_x !== undefined ? Math.min(90, t.pos_x + 3) : undefined, pos_y: t.pos_y !== undefined ? Math.min(90, t.pos_y + 3) : undefined, layer_folder_id: newFolderId };
  });
  const clonedCompounds = scene.compoundLayers.filter((c) => c.layer_folder_id === folderId).map((c) => {
    const id = rand('compound'); newChildKeys.push(`compound:${id}`);
    return { ...c, id, pos_x: Math.min(90, c.pos_x + 3), pos_y: Math.min(90, c.pos_y + 3), layer_folder_id: newFolderId };
  });

  const currentRoot = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);
  const origIdx = currentRoot.indexOf(`folder:${folderId}`);
  const newRoot = [...currentRoot];
  if (origIdx !== -1) newRoot.splice(origIdx + 1, 0, `folder:${newFolderId}`);
  else newRoot.push(`folder:${newFolderId}`);

  return normalizeSceneWithZ({
    slots: [...scene.slots, ...clonedSlots], stickers: [...scene.stickers, ...clonedStickers],
    textOverlays: [...scene.textOverlays, ...clonedTexts], compoundLayers: [...scene.compoundLayers, ...clonedCompounds],
    folders: [...scene.folders, { ...origFolder, id: newFolderId, name: `${origFolder.name} (Copy)`, child_keys: newChildKeys }],
    rootOrder: newRoot,
  });
}

/** Dissolves a folder while elevating all its child items cleanly into rootOrder. */
export function ungroupFolderFromScene(scene: StudioSceneState, folderId: string): StudioSceneState {
  const currentRoot = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);
  const folderIdx = currentRoot.indexOf(`folder:${folderId}`);
  const childKeys = [
    ...scene.slots.filter((s) => s.layer_folder_id === folderId).map((s) => `slot:${s.id}`),
    ...scene.stickers.filter((stk) => stk.layer_folder_id === folderId).map((stk) => `sticker:${stk.id}`),
    ...scene.textOverlays.filter((t) => t.layer_folder_id === folderId).map((t) => `text:${t.id}`),
    ...scene.compoundLayers.filter((c) => c.layer_folder_id === folderId).map((c) => `compound:${c.id}`),
  ];
  const newRoot = [...currentRoot];
  if (folderIdx !== -1) newRoot.splice(folderIdx, 1, ...childKeys);
  else newRoot.push(...childKeys);

  return normalizeSceneWithZ({
    slots: scene.slots.map((s) => (s.layer_folder_id === folderId ? { ...s, layer_folder_id: undefined } : s)),
    stickers: scene.stickers.map((stk) => (stk.layer_folder_id === folderId ? { ...stk, layer_folder_id: undefined } : stk)),
    textOverlays: scene.textOverlays.map((t) => (t.layer_folder_id === folderId ? { ...t, layer_folder_id: undefined } : t)),
    compoundLayers: scene.compoundLayers.map((c) => (c.layer_folder_id === folderId ? { ...c, layer_folder_id: undefined } : c)),
    folders: scene.folders.filter((f) => f.id !== folderId),
    rootOrder: newRoot,
  });
}

