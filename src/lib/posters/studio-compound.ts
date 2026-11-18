import type {
  PosterSlotMedia,
  PosterTextOverlay,
  PosterCanvasSticker,
  PosterCompoundLayer,
} from '@/types/index';
import type { StudioSceneState } from './studio-types';
import { ensureRootOrder, normalizeSceneWithZ } from './studio-zindex';
import { makeCenteredBox, type BoxBound } from './studio-bounds';

export { computeSelectionGroupBounds } from './studio-bounds';

const round1 = (val: number) => Math.round(val * 10) / 10;

/** Unmerges a compound group layer back into independent global-coordinate layers. */
export function unmergeCompoundState(scene: StudioSceneState, compoundId: string): StudioSceneState | null {
  const target = scene.compoundLayers.find((c) => c.id === compoundId);
  if (!target) return null;

  const pW = target.width_percent;
  const pH = target.height_percent;
  const pLeft = target.pos_x - pW / 2;
  const pTop = target.pos_y - pH / 2;
  const c = target.merged_children;

  const unmergedSlots: PosterSlotMedia[] = (c.slots ?? []).map((s) => ({
    ...s, pos_x: round1(pLeft + ((s.pos_x ?? 50) / 100) * pW), pos_y: round1(pTop + ((s.pos_y ?? 50) / 100) * pH),
    width_percent: round1(((s.width_percent ?? 50) / 100) * pW), height_percent: round1(((s.height_percent ?? 50) / 100) * pH),
    layer_folder_id: target.layer_folder_id, z_index: target.z_index,
  }));
  const unmergedStickers: PosterCanvasSticker[] = (c.stickers ?? []).map((stk) => ({
    ...stk, pos_x: round1(pLeft + ((stk.pos_x ?? 50) / 100) * pW), pos_y: round1(pTop + ((stk.pos_y ?? 50) / 100) * pH),
    width_percent: round1(((stk.width_percent ?? 20) / 100) * pW), height_percent: round1(((stk.height_percent ?? 20) / 100) * pH),
    layer_folder_id: target.layer_folder_id, z_index: target.z_index,
  }));
  const unmergedTexts: PosterTextOverlay[] = (c.text_overlays ?? []).map((t) => ({
    ...t, pos_x: round1(pLeft + ((t.pos_x ?? 50) / 100) * pW), pos_y: round1(pTop + ((t.pos_y ?? 50) / 100) * pH),
    width_mode: 'custom' as const, width_percent: round1(((t.width_percent ?? 40) / 100) * pW),
    layer_folder_id: target.layer_folder_id, z_index: target.z_index,
  }));

  const unmergedKeys = [
    ...unmergedSlots.map((s) => `slot:${s.id}`),
    ...unmergedStickers.map((stk) => `sticker:${stk.id}`),
    ...unmergedTexts.map((t) => `text:${t.id}`),
  ];

  const folders = scene.folders.map((f) => {
    if (f.id !== target.layer_folder_id) return f;
    const keys = [...(f.child_keys ?? [])];
    const idx = keys.indexOf(`compound:${compoundId}`);
    if (idx !== -1) keys.splice(idx, 1, ...unmergedKeys);
    else keys.push(...unmergedKeys);
    return { ...f, child_keys: keys };
  });

  const nextSlots = [...scene.slots, ...unmergedSlots];
  const nextStickers = [...scene.stickers, ...unmergedStickers];
  const nextTexts = [...scene.textOverlays, ...unmergedTexts];
  const nextCompounds = scene.compoundLayers.filter((cp) => cp.id !== compoundId);
  const root = ensureRootOrder(scene.rootOrder, folders, nextSlots, nextStickers, nextTexts, nextCompounds);
  const rootIdx = root.indexOf(`compound:${compoundId}`);
  if (rootIdx !== -1) {
    if (!target.layer_folder_id) root.splice(rootIdx, 1, ...unmergedKeys);
    else root.splice(rootIdx, 1);
  }

  return normalizeSceneWithZ({
    slots: nextSlots, stickers: nextStickers, textOverlays: nextTexts,
    compoundLayers: nextCompounds, folders, rootOrder: root,
  });
}

function flattenChildrenFromCompounds(compoundsToMerge: readonly PosterCompoundLayer[]) {
  const flatSlots: PosterSlotMedia[] = [];
  const flatStickers: PosterCanvasSticker[] = [];
  const flatTexts: PosterTextOverlay[] = [];

  compoundsToMerge.forEach((c) => {
    const pW = c.width_percent;
    const pH = c.height_percent;
    const pLeft = c.pos_x - pW / 2;
    const pTop = c.pos_y - pH / 2;
    c.merged_children.slots?.forEach((s) => flatSlots.push({
      ...s, pos_x: pLeft + ((s.pos_x ?? 50) / 100) * pW, pos_y: pTop + ((s.pos_y ?? 50) / 100) * pH,
      width_percent: ((s.width_percent ?? 50) / 100) * pW, height_percent: ((s.height_percent ?? 50) / 100) * pH,
    }));
    c.merged_children.stickers?.forEach((stk) => flatStickers.push({
      ...stk, pos_x: pLeft + ((stk.pos_x ?? 50) / 100) * pW, pos_y: pTop + ((stk.pos_y ?? 50) / 100) * pH,
      width_percent: ((stk.width_percent ?? 20) / 100) * pW, height_percent: ((stk.height_percent ?? 20) / 100) * pH,
    }));
    c.merged_children.text_overlays?.forEach((t) => flatTexts.push({
      ...t, pos_x: pLeft + ((t.pos_x ?? 50) / 100) * pW, pos_y: pTop + ((t.pos_y ?? 50) / 100) * pH,
      width_percent: ((t.width_percent ?? 40) / 100) * pW,
    }));
  });

  return { flatSlots, flatStickers, flatTexts };
}

/** Merges >=2 selected layers (flattening nested compounds) into one normalized compound layer. */
export function mergeSelectionIntoCompoundState(
  scene: StudioSceneState,
  selectedKeys: readonly string[],
): { readonly nextScene: StudioSceneState; readonly newCompoundId: string } | null {
  if (selectedKeys.length < 2) return null;
  const slotsM = scene.slots.filter((s) => selectedKeys.includes(`slot:${s.id}`));
  const stickersM = scene.stickers.filter((s) => selectedKeys.includes(`sticker:${s.id}`));
  const textsM = scene.textOverlays.filter((t) => selectedKeys.includes(`text:${t.id}`));
  const compsM = scene.compoundLayers.filter((c) => selectedKeys.includes(`compound:${c.id}`));
  if (slotsM.length + stickersM.length + textsM.length + compsM.length < 2) return null;

  const flat = flattenChildrenFromCompounds(compsM);
  const allSlots = [...slotsM, ...flat.flatSlots];
  const allStickers = [...stickersM, ...flat.flatStickers];
  const allTexts = [...textsM, ...flat.flatTexts];

  const boxes: BoxBound[] = [
    ...allSlots.map((s) => makeCenteredBox(s.pos_x ?? 50, s.pos_y ?? 50, s.width_percent ?? 40, s.height_percent ?? 40)),
    ...allStickers.map((s) => makeCenteredBox(s.pos_x ?? 50, s.pos_y ?? 50, s.width_percent ?? 20, s.height_percent ?? 20)),
    ...allTexts.map((t) => makeCenteredBox(t.pos_x ?? 50, t.pos_y ?? 50, t.width_percent ?? 40, 10)),
  ];
  const minLeft = Math.min(...boxes.map((b) => b.left));
  const minTop = Math.min(...boxes.map((b) => b.top));
  const boxW = Math.max(2, Math.max(...boxes.map((b) => b.right)) - minLeft);
  const boxH = Math.max(2, Math.max(...boxes.map((b) => b.bottom)) - minTop);

  const normSlots = allSlots.map((s) => ({
    ...s, pos_x: round1((((s.pos_x ?? 50) - minLeft) / boxW) * 100), pos_y: round1((((s.pos_y ?? 50) - minTop) / boxH) * 100),
    width_percent: round1(((s.width_percent ?? 40) / boxW) * 100), height_percent: round1(((s.height_percent ?? 40) / boxH) * 100),
  }));
  const normStickers = allStickers.map((stk) => ({
    ...stk, pos_x: round1((((stk.pos_x ?? 50) - minLeft) / boxW) * 100), pos_y: round1((((stk.pos_y ?? 50) - minTop) / boxH) * 100),
    width_percent: round1(((stk.width_percent ?? 20) / boxW) * 100), height_percent: round1(((stk.height_percent ?? 20) / boxH) * 100),
  }));
  const normTexts = allTexts.map((t) => ({
    ...t, pos_x: round1((((t.pos_x ?? 50) - minLeft) / boxW) * 100), pos_y: round1((((t.pos_y ?? 50) - minTop) / boxH) * 100),
    width_percent: round1(((t.width_percent ?? (t.width_mode === 'custom' && t.width_percent ? t.width_percent : 40)) / boxW) * 100),
  }));

  const newCompoundId = `compound-${Date.now()}`;
  const folderIds = [...slotsM, ...stickersM, ...textsM, ...compsM].map((it) => it.layer_folder_id);
  const commonFolderId = folderIds.length > 0 && folderIds.every((id) => id && id === folderIds[0]) ? folderIds[0] : undefined;
  const newCompound: PosterCompoundLayer = {
    id: newCompoundId, label: `Merged Group (${normSlots.length + normStickers.length + normTexts.length} items)`,
    pos_x: round1(minLeft + boxW / 2), pos_y: round1(minTop + boxH / 2),
    width_percent: round1(boxW), height_percent: round1(boxH), z_index: 35, layer_folder_id: commonFolderId,
    merged_children: {
      slots: normSlots.length > 0 ? normSlots : undefined,
      stickers: normStickers.length > 0 ? normStickers : undefined,
      text_overlays: normTexts.length > 0 ? normTexts : undefined,
    },
  };

  const remSlots = scene.slots.filter((s) => !selectedKeys.includes(`slot:${s.id}`));
  const remStickers = scene.stickers.filter((s) => !selectedKeys.includes(`sticker:${s.id}`));
  const remTexts = scene.textOverlays.filter((t) => !selectedKeys.includes(`text:${t.id}`));
  const remCompounds = [...scene.compoundLayers.filter((c) => !selectedKeys.includes(`compound:${c.id}`)), newCompound];
  const folders = scene.folders.map((f) => {
    const keys = (f.child_keys ?? []).filter((k) => !selectedKeys.includes(k));
    if (commonFolderId && f.id === commonFolderId) keys.push(`compound:${newCompoundId}`);
    return { ...f, child_keys: keys };
  });

  let root = ensureRootOrder(scene.rootOrder, folders, remSlots, remStickers, remTexts, remCompounds);
  if (!commonFolderId) {
    const firstIdx = root.findIndex((k) => selectedKeys.includes(k));
    root = root.filter((k) => !selectedKeys.includes(k));
    if (firstIdx !== -1) root.splice(firstIdx, 0, `compound:${newCompoundId}`);
    else root.unshift(`compound:${newCompoundId}`);
  } else {
    root = root.filter((k) => !selectedKeys.includes(k));
  }

  return {
    newCompoundId,
    nextScene: normalizeSceneWithZ({ slots: remSlots, stickers: remStickers, textOverlays: remTexts, compoundLayers: remCompounds, folders, rootOrder: root }),
  };
}
