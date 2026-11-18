import type {
  PosterCanvasSticker,
  PosterCompoundLayer,
  PosterLayerFolder,
  PosterSlotMedia,
  PosterTextOverlay,
} from '@/types/index';
import type { StudioSceneState } from './studio-types';
import { ensureRootOrder } from './studio-zindex';

export interface StudioLayerRowItem {
  readonly key: string;
  readonly id: string;
  readonly type: 'slot' | 'sticker' | 'text' | 'compound';
  readonly label: string;
  readonly sublabel: string;
  readonly zIndex: number;
  readonly isHidden: boolean;
  readonly isLocked: boolean;
  readonly folderId?: string | undefined;
  readonly itemIdx: number;
  readonly slot?: PosterSlotMedia | undefined;
  readonly sticker?: PosterCanvasSticker | undefined;
  readonly textOverlay?: PosterTextOverlay | undefined;
  readonly compound?: PosterCompoundLayer | undefined;
}

/** Builds normalized row descriptors for the Studio Layers tab across all layer types. */
export function buildStudioLayerItems(scene: StudioSceneState): StudioLayerRowItem[] {
  return [
    ...scene.slots.map((s, idx): StudioLayerRowItem => ({
      key: `slot:${s.id}`,
      id: s.id,
      type: 'slot',
      label: s.label || (s.type === 'notice' ? s.notice_headline || 'Notice' : s.original_filename || `Slot ${idx + 1}`),
      sublabel: s.type === 'video' ? 'Video' : s.type === 'notice' ? 'Notice' : 'Image',
      zIndex: s.z_index ?? idx + 1,
      isHidden: Boolean(s.is_hidden),
      isLocked: Boolean(s.is_locked),
      folderId: s.layer_folder_id,
      itemIdx: idx,
      slot: s,
    })),
    ...scene.stickers.map((stk, idx): StudioLayerRowItem => ({
      key: `sticker:${stk.id}`,
      id: stk.id,
      type: 'sticker',
      label: stk.type === 'badge_custom' ? stk.badge_text || 'Ribbon Badge' : stk.type.replace('_', ' ').toUpperCase(),
      sublabel: stk.type === 'badge_custom' ? 'Announcement Ribbon' : 'Sacred Sticker',
      zIndex: stk.z_index ?? idx + 30,
      isHidden: Boolean(stk.is_hidden),
      isLocked: Boolean(stk.is_locked),
      folderId: stk.layer_folder_id,
      itemIdx: idx,
      sticker: stk,
    })),
    ...scene.textOverlays.map((t, idx): StudioLayerRowItem => ({
      key: `text:${t.id}`,
      id: t.id,
      type: 'text',
      label: t.text || `Text #${idx + 1}`,
      sublabel: 'Text Overlay',
      zIndex: 50 + idx,
      isHidden: Boolean(t.is_hidden),
      isLocked: Boolean(t.is_locked),
      folderId: t.layer_folder_id,
      itemIdx: idx,
      textOverlay: t,
    })),
    ...scene.compoundLayers.map((c, idx): StudioLayerRowItem => ({
      key: `compound:${c.id}`,
      id: c.id,
      type: 'compound',
      label: c.label || 'Merged Layer',
      sublabel: 'Compound Layer',
      zIndex: c.z_index ?? 35,
      isHidden: Boolean(c.is_hidden),
      isLocked: Boolean(c.is_locked),
      folderId: c.layer_folder_id,
      itemIdx: idx,
      compound: c,
    })),
  ];
}

export function sortFolderChildren(
  folder: PosterLayerFolder,
  allItems: readonly StudioLayerRowItem[],
): StudioLayerRowItem[] {
  const childOrder = folder.child_keys ?? [];
  return allItems
    .filter((it) => it.folderId === folder.id)
    .sort((a, b) => {
      const idxA = childOrder.indexOf(a.key);
      const idxB = childOrder.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
}

/** Computes visible flat key order matching rendered tree rows for Shift-click range selection. */
export function getVisibleOrderedLayerKeys(
  scene: StudioSceneState,
  allItems: readonly StudioLayerRowItem[],
): { readonly effectiveRootOrder: string[]; readonly visibleKeys: string[] } {
  const effectiveRootOrder = ensureRootOrder(
    scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers,
  );
  const visibleKeys: string[] = [];
  effectiveRootOrder.forEach((entryKey) => {
    if (!entryKey.startsWith('folder:')) {
      visibleKeys.push(entryKey);
      return;
    }
    const folder = scene.folders.find((f) => f.id === entryKey.replace('folder:', ''));
    if (!folder) return;
    visibleKeys.push(`folder:${folder.id}`);
    if (!folder.is_collapsed) {
      sortFolderChildren(folder, allItems).forEach((child) => visibleKeys.push(child.key));
    }
  });
  return { effectiveRootOrder, visibleKeys };
}

