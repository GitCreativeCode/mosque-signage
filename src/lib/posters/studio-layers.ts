import type { PosterLayerFolder } from '@/types/index';
import type { LayerItemTarget, StudioSceneState } from './studio-types';
import { ensureRootOrder, findLayerParentFolderId, isLayerKeyLocked, normalizeSceneWithZ } from './studio-zindex';

function insertKeyAfterInHierarchy(
  folders: PosterLayerFolder[],
  root: string[],
  folderId: string | undefined,
  oldKey: string,
  newKey: string,
): { folders: PosterLayerFolder[]; root: string[] } {
  if (folderId) {
    return {
      root,
      folders: folders.map((f) => {
        if (f.id !== folderId) return f;
        const keys = [...(f.child_keys ?? [])];
        const idx = keys.indexOf(oldKey);
        if (idx !== -1) keys.splice(idx, 0, newKey);
        else keys.unshift(newKey);
        return { ...f, child_keys: keys };
      }),
    };
  }
  const nextRoot = [...root];
  const idx = nextRoot.indexOf(oldKey);
  if (idx !== -1) nextRoot.splice(idx, 0, newKey);
  else nextRoot.unshift(newKey);
  return { folders, root: nextRoot };
}

/** Moves a layer item up (-1) or down (+1) within its folder or root hierarchy. */
export function moveLayerInHierarchy(scene: StudioSceneState, item: LayerItemTarget, direction: -1 | 1): StudioSceneState | null {
  const key = `${item.type}:${item.id}`;
  if (isLayerKeyLocked(key, scene)) return null;
  const folderId = findLayerParentFolderId(key, scene);
  let folders = [...scene.folders];
  const root = ensureRootOrder(scene.rootOrder, folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);

  const shiftInArray = (arr: readonly string[]) => {
    const idx = arr.indexOf(key);
    const nextIdx = idx + direction;
    if (idx === -1 || nextIdx < 0 || nextIdx >= arr.length) return [...arr];
    const copy = [...arr];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved!);
    return copy;
  };

  if (folderId) {
    folders = folders.map((f) => (f.id === folderId ? { ...f, child_keys: shiftInArray(f.child_keys ?? []) } : f));
    return normalizeSceneWithZ({ ...scene, folders, rootOrder: root });
  }
  return normalizeSceneWithZ({ ...scene, folders, rootOrder: shiftInArray(root) });
}

/** Duplicates a single layer item (+4% canvas offset) right after the original in the tree. */
export function duplicateLayerInScene(
  scene: StudioSceneState,
  item: LayerItemTarget,
): { readonly nextScene: StudioSceneState; readonly newId: string; readonly newIndex: number } | null {
  const randId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const rootBase = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);

  if (item.type === 'slot') {
    const slotIdx = item.itemIdx !== undefined ? item.itemIdx : scene.slots.findIndex((s) => s.id === item.id);
    if (slotIdx === -1 || !scene.slots[slotIdx]) return null;
    const target = scene.slots[slotIdx]!;
    const newId = randId('slot');
    const copy = {
      ...target, id: newId,
      pos_x: target.pos_x !== undefined ? Math.min(90, target.pos_x + 4) : undefined,
      pos_y: target.pos_y !== undefined ? Math.min(90, target.pos_y + 4) : undefined,
      label: target.label ? `${target.label} (Copy)` : undefined,
    };
    const nextSlots = [...scene.slots];
    nextSlots.splice(slotIdx + 1, 0, copy);
    const placed = insertKeyAfterInHierarchy(scene.folders, rootBase, target.layer_folder_id, `slot:${target.id}`, `slot:${newId}`);
    return { newId, newIndex: slotIdx + 1, nextScene: normalizeSceneWithZ({ ...scene, slots: nextSlots, folders: placed.folders, rootOrder: placed.root }) };
  }

  if (item.type === 'sticker') {
    const stkIdx = item.itemIdx !== undefined ? item.itemIdx : scene.stickers.findIndex((s) => s.id === item.id);
    if (stkIdx === -1 || !scene.stickers[stkIdx]) return null;
    const target = scene.stickers[stkIdx]!;
    const newId = randId('sticker');
    const copy = { ...target, id: newId, pos_x: Math.min(90, target.pos_x + 4), pos_y: Math.min(90, target.pos_y + 4) };
    const nextStickers = [...scene.stickers];
    nextStickers.splice(stkIdx + 1, 0, copy);
    const placed = insertKeyAfterInHierarchy(scene.folders, rootBase, target.layer_folder_id, `sticker:${target.id}`, `sticker:${newId}`);
    return { newId, newIndex: stkIdx + 1, nextScene: normalizeSceneWithZ({ ...scene, stickers: nextStickers, folders: placed.folders, rootOrder: placed.root }) };
  }

  if (item.type === 'text') {
    const txtIdx = item.itemIdx !== undefined ? item.itemIdx : scene.textOverlays.findIndex((t) => t.id === item.id);
    if (txtIdx === -1 || !scene.textOverlays[txtIdx]) return null;
    const target = scene.textOverlays[txtIdx]!;
    const newId = randId('text');
    const copy = { ...target, id: newId, pos_x: Math.min(90, (target.pos_x ?? 50) + 4), pos_y: Math.min(90, (target.pos_y ?? 50) + 4) };
    const nextTexts = [...scene.textOverlays];
    nextTexts.splice(txtIdx + 1, 0, copy);
    const placed = insertKeyAfterInHierarchy(scene.folders, rootBase, target.layer_folder_id, `text:${target.id}`, `text:${newId}`);
    return { newId, newIndex: txtIdx + 1, nextScene: normalizeSceneWithZ({ ...scene, textOverlays: nextTexts, folders: placed.folders, rootOrder: placed.root }) };
  }

  if (item.type === 'compound') {
    const target = scene.compoundLayers.find((c) => c.id === item.id);
    if (!target) return null;
    const newId = randId('compound');
    const copy = { ...target, id: newId, pos_x: Math.min(90, target.pos_x + 4), pos_y: Math.min(90, target.pos_y + 4) };
    const nextCompounds = [...scene.compoundLayers, copy];
    const placed = insertKeyAfterInHierarchy(scene.folders, rootBase, target.layer_folder_id, `compound:${target.id}`, `compound:${newId}`);
    return { newId, newIndex: nextCompounds.length - 1, nextScene: normalizeSceneWithZ({ ...scene, compoundLayers: nextCompounds, folders: placed.folders, rootOrder: placed.root }) };
  }
  return null;
}

/** Deletes a single layer or selected multi-layer set (including selected folders), strictly preserving locked layers. */
export function deleteLayerKeysFromScene(scene: StudioSceneState, keysToDelete: readonly string[]): StudioSceneState {
  const safeKeys = keysToDelete.filter((k) => !isLayerKeyLocked(k, scene));
  if (safeKeys.length === 0) return scene;

  const folderIds = safeKeys.filter((k) => k.startsWith('folder:')).map((k) => k.replace('folder:', ''));
  const folders = scene.folders
    .filter((f) => !folderIds.includes(f.id))
    .map((f) => ({ ...f, child_keys: (f.child_keys ?? []).filter((k) => !safeKeys.includes(k)) }));
  return normalizeSceneWithZ({
    slots: scene.slots
      .filter((s) => !safeKeys.includes(`slot:${s.id}`))
      .map((s) => (folderIds.includes(s.layer_folder_id ?? '') ? { ...s, layer_folder_id: undefined } : s)),
    stickers: scene.stickers
      .filter((stk) => !safeKeys.includes(`sticker:${stk.id}`))
      .map((stk) => (folderIds.includes(stk.layer_folder_id ?? '') ? { ...stk, layer_folder_id: undefined } : stk)),
    textOverlays: scene.textOverlays
      .filter((t) => !safeKeys.includes(`text:${t.id}`))
      .map((t) => (folderIds.includes(t.layer_folder_id ?? '') ? { ...t, layer_folder_id: undefined } : t)),
    compoundLayers: scene.compoundLayers
      .filter((c) => !safeKeys.includes(`compound:${c.id}`))
      .map((c) => (folderIds.includes(c.layer_folder_id ?? '') ? { ...c, layer_folder_id: undefined } : c)),
    folders,
    rootOrder: scene.rootOrder.filter((k) => !safeKeys.includes(k)),
  });
}

/** Renames a slot, sticker tint/ribbon, text overlay, or compound group in scene state. */
export function renameLayerItemInScene(
  scene: StudioSceneState,
  item: { readonly type: 'slot' | 'sticker' | 'text' | 'compound'; readonly id: string; readonly itemIdx: number },
  trimmed: string,
): Partial<Pick<StudioSceneState, 'slots' | 'stickers' | 'textOverlays' | 'compoundLayers'>> {
  if (item.type === 'slot') {
    const next = [...scene.slots];
    next[item.itemIdx] = { ...next[item.itemIdx]!, label: trimmed };
    return { slots: next };
  }
  if (item.type === 'sticker') {
    return { stickers: scene.stickers.map((s, i) => (i === item.itemIdx ? (s.type === 'badge_custom' ? { ...s, badge_text: trimmed } : { ...s, custom_label: trimmed }) : s)) };
  }
  if (item.type === 'text') {
    return { textOverlays: scene.textOverlays.map((t, i) => (i === item.itemIdx ? { ...t, text: trimmed } : t)) };
  }
  return { compoundLayers: scene.compoundLayers.map((c) => (c.id === item.id ? { ...c, label: trimmed } : c)) };
}

/** Toggles is_hidden visibility flag for any layer item inside scene state. */
export function toggleLayerVisibilityInScene(
  scene: StudioSceneState,
  item: { readonly type: 'slot' | 'sticker' | 'text' | 'compound'; readonly id: string; readonly itemIdx: number; readonly isHidden: boolean },
): Partial<Pick<StudioSceneState, 'slots' | 'stickers' | 'textOverlays' | 'compoundLayers'>> {
  if (item.type === 'slot') {
    const next = [...scene.slots];
    next[item.itemIdx] = { ...next[item.itemIdx]!, is_hidden: !item.isHidden };
    return { slots: next };
  }
  if (item.type === 'sticker') return { stickers: scene.stickers.map((s, i) => (i === item.itemIdx ? { ...s, is_hidden: !item.isHidden } : s)) };
  if (item.type === 'text') return { textOverlays: scene.textOverlays.map((t, i) => (i === item.itemIdx ? { ...t, is_hidden: !item.isHidden } : t)) };
  return { compoundLayers: scene.compoundLayers.map((c) => (c.id === item.id ? { ...c, is_hidden: !item.isHidden } : c)) };
}

/** Moves a layer item directly to the top (front) or bottom (back) of its hierarchy band. */
export function moveLayerToExtreme(
  scene: StudioSceneState,
  item: LayerItemTarget,
  destination: 'front' | 'back',
): StudioSceneState | null {
  const key = `${item.type}:${item.id}`;
  if (isLayerKeyLocked(key, scene)) return null;
  const folderId = findLayerParentFolderId(key, scene);
  let folders = [...scene.folders];
  const root = ensureRootOrder(scene.rootOrder, folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);

  const moveToExtreme = (arr: readonly string[]) => {
    const idx = arr.indexOf(key);
    if (idx === -1) return [...arr];
    const copy = [...arr];
    const [moved] = copy.splice(idx, 1);
    if (destination === 'front') copy.unshift(moved!);
    else copy.push(moved!);
    return copy;
  };

  if (folderId) {
    folders = folders.map((f) => (f.id === folderId ? { ...f, child_keys: moveToExtreme(f.child_keys ?? []) } : f));
    return normalizeSceneWithZ({ ...scene, folders, rootOrder: root });
  }
  return normalizeSceneWithZ({ ...scene, folders, rootOrder: moveToExtreme(root) });
}
