import type {
  PosterSlotMedia,
  PosterTextOverlay,
  PosterCanvasSticker,
  PosterLayerFolder,
  PosterCompoundLayer,
} from '@/types/index';
import type { StudioSceneState } from './studio-types';

/** Ensures rootOrder covers every folder and top-level item in visual front-to-back order. */
export function ensureRootOrder(
  currentRoot: readonly string[],
  fList: readonly PosterLayerFolder[],
  sList: readonly PosterSlotMedia[],
  stkList: readonly PosterCanvasSticker[],
  tList: readonly PosterTextOverlay[],
  cList: readonly PosterCompoundLayer[],
): string[] {
  const allValidRootKeys = new Set([
    ...fList.map((f) => `folder:${f.id}`),
    ...sList.filter((s) => !s.layer_folder_id).map((s) => `slot:${s.id}`),
    ...stkList.filter((stk) => !stk.layer_folder_id).map((stk) => `sticker:${stk.id}`),
    ...tList.filter((t) => !t.layer_folder_id).map((t) => `text:${t.id}`),
    ...cList.filter((c) => !c.layer_folder_id).map((c) => `compound:${c.id}`),
  ]);

  const filtered = currentRoot.filter((key) => allValidRootKeys.has(key));
  const seen = new Set(filtered);
  const missing: string[] = [];
  allValidRootKeys.forEach((key) => {
    if (!seen.has(key)) missing.push(key);
  });
  return [...missing, ...filtered];
}

function collectFolderOrderedChildKeys(
  folder: PosterLayerFolder,
  sList: readonly PosterSlotMedia[],
  stkList: readonly PosterCanvasSticker[],
  tList: readonly PosterTextOverlay[],
  cList: readonly PosterCompoundLayer[],
): string[] {
  const fId = folder.id;
  const memberKeys = [
    ...sList.filter((s) => s.layer_folder_id === fId).map((s) => `slot:${s.id}`),
    ...stkList.filter((stk) => stk.layer_folder_id === fId).map((stk) => `sticker:${stk.id}`),
    ...tList.filter((t) => t.layer_folder_id === fId).map((t) => `text:${t.id}`),
    ...cList.filter((c) => c.layer_folder_id === fId).map((c) => `compound:${c.id}`),
  ];
  const memberSet = new Set(memberKeys);
  const ordered = (folder.child_keys ?? []).filter((k) => memberSet.has(k));
  const orderedSet = new Set(ordered);
  memberKeys.forEach((k) => {
    if (!orderedSet.has(k)) ordered.push(k);
  });
  return ordered;
}

/** Computes unified cascading CSS z_index values from rootOrder and folder bands. */
export function applyUnifiedZIndices(
  rootKeys: readonly string[],
  fList: readonly PosterLayerFolder[],
  sList: readonly PosterSlotMedia[],
  stkList: readonly PosterCanvasSticker[],
  tList: readonly PosterTextOverlay[],
  cList: readonly PosterCompoundLayer[],
) {
  const flattenedKeys: string[] = [];
  rootKeys.forEach((rootKey) => {
    if (!rootKey.startsWith('folder:')) {
      flattenedKeys.push(rootKey);
      return;
    }
    const folder = fList.find((f) => f.id === rootKey.replace('folder:', ''));
    if (folder) flattenedKeys.push(...collectFolderOrderedChildKeys(folder, sList, stkList, tList, cList));
  });

  const total = flattenedKeys.length;
  const zMap = new Map<string, number>();
  flattenedKeys.forEach((key, idx) => zMap.set(key, Math.max(1, (total - idx) * 10)));

  const updatedSlots = sList.map((s) => ({ ...s, z_index: zMap.get(`slot:${s.id}`) ?? s.z_index ?? 10 }));
  const updatedStickers = stkList.map((stk) => ({ ...stk, z_index: zMap.get(`sticker:${stk.id}`) ?? stk.z_index ?? 10 }));
  const updatedTexts = tList.map((t) => ({ ...t, z_index: zMap.get(`text:${t.id}`) ?? t.z_index ?? 10 }));
  const updatedCompounds = cList.map((c) => ({ ...c, z_index: zMap.get(`compound:${c.id}`) ?? c.z_index ?? 10 }));

  const updatedFolders = fList.map((f) => {
    const childZs = [
      ...updatedSlots.filter((s) => s.layer_folder_id === f.id).map((s) => s.z_index ?? 10),
      ...updatedStickers.filter((stk) => stk.layer_folder_id === f.id).map((stk) => stk.z_index ?? 10),
      ...updatedTexts.filter((t) => t.layer_folder_id === f.id).map((t) => t.z_index ?? 10),
      ...updatedCompounds.filter((c) => c.layer_folder_id === f.id).map((c) => c.z_index ?? 10),
    ];
    return { ...f, z_index: childZs.length > 0 ? Math.max(...childZs) : undefined };
  });

  return { updatedSlots, updatedStickers, updatedTexts, updatedCompounds, updatedFolders };
}

/** Recomputes ensureRootOrder + applyUnifiedZIndices and returns a coherent StudioSceneState. */
export function normalizeSceneWithZ(scene: StudioSceneState): StudioSceneState {
  const finalRoot = ensureRootOrder(
    scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers,
  );
  const zRes = applyUnifiedZIndices(
    finalRoot, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers,
  );
  return {
    slots: zRes.updatedSlots,
    stickers: zRes.updatedStickers,
    textOverlays: zRes.updatedTexts,
    compoundLayers: zRes.updatedCompounds,
    folders: zRes.updatedFolders,
    rootOrder: finalRoot,
  };
}

export function isLayerItemLocked(
  item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined,
  folders: readonly PosterLayerFolder[],
): boolean {
  if (!item) return false;
  if (item.is_locked) return true;
  if (!item.layer_folder_id) return false;
  return Boolean(folders.find((f) => f.id === item.layer_folder_id)?.is_locked);
}

export function isLayerKeyLocked(key: string, scene: StudioSceneState): boolean {
  const [type, id] = key.split(':');
  if (type === 'folder') return Boolean(scene.folders.find((f) => f.id === id)?.is_locked);
  if (type === 'slot') return isLayerItemLocked(scene.slots.find((s) => s.id === id), scene.folders);
  if (type === 'sticker') return isLayerItemLocked(scene.stickers.find((s) => s.id === id), scene.folders);
  if (type === 'text') return isLayerItemLocked(scene.textOverlays.find((t) => t.id === id), scene.folders);
  if (type === 'compound') return isLayerItemLocked(scene.compoundLayers.find((c) => c.id === id), scene.folders);
  return false;
}

export function findLayerParentFolderId(key: string, scene: StudioSceneState): string | undefined {
  const [type, id] = key.split(':');
  if (type === 'slot') return scene.slots.find((s) => s.id === id)?.layer_folder_id;
  if (type === 'sticker') return scene.stickers.find((s) => s.id === id)?.layer_folder_id;
  if (type === 'text') return scene.textOverlays.find((t) => t.id === id)?.layer_folder_id;
  if (type === 'compound') return scene.compoundLayers.find((c) => c.id === id)?.layer_folder_id;
  return undefined;
}

