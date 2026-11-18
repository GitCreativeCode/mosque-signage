'use client';

import type {
  IslamicStickerType,
  PosterCanvasSticker,
  PosterSlotMedia,
  PosterTextOverlay,
  SlotFitMode,
  SlotFrameStyle,
} from '@/types/index';
import type { StudioSceneState, StudioTab } from '@/lib/posters/studio-types';
import { ISLAMIC_STICKERS_REGISTRY } from '@/lib/posters/layout-engine';
import { ensureRootOrder, normalizeSceneWithZ } from '@/lib/posters/studio-zindex';
import { uploadLayoutAsset } from '@/lib/actions/multi-asset-posters';

interface UseStudioAssetActionsParams {
  readonly scene: StudioSceneState;
  readonly selectedSlotIndex: number | null;
  readonly frameApplyScope: 'selected' | 'all';
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly canvasDropInputRef: React.RefObject<HTMLInputElement | null>;
  readonly setIsUploading: (v: boolean) => void;
  readonly setError: (msg: string | null) => void;
  readonly setSelectedSlotIndex: (idx: number | null) => void;
  readonly setSelectedTextIndex: (idx: number) => void;
  readonly setActiveTab: (tab: StudioTab) => void;
  readonly selectSticker: (idx: number | null) => void;
  readonly commitScene: (next: StudioSceneState) => void;
  readonly commitSlots: (slots: PosterSlotMedia[]) => void;
  readonly setTextOverlays: React.Dispatch<React.SetStateAction<PosterTextOverlay[]>>;
  readonly isDirtyRef: React.MutableRefObject<boolean>;
}

/** Handles media asset uploads, frame styling, notice slots, stickers, badges, banners, and color pickers. */
export function useStudioAssetActions(params: UseStudioAssetActionsParams) {
  const {
    scene, selectedSlotIndex, frameApplyScope, fileInputRef, canvasDropInputRef,
    setIsUploading, setError, setSelectedSlotIndex, setSelectedTextIndex,
    setActiveTab, selectSticker, commitScene, commitSlots, setTextOverlays, isDirtyRef,
  } = params;

  const prependItemsAndCommit = (
    nextItems: Partial<Pick<StudioSceneState, 'slots' | 'stickers' | 'textOverlays'>>,
    newRootKeys: string[],
  ) => {
    const updatedSlots = nextItems.slots ?? scene.slots;
    const updatedStickers = nextItems.stickers ?? scene.stickers;
    const updatedTexts = nextItems.textOverlays ?? scene.textOverlays;
    const root = ensureRootOrder(
      [...newRootKeys, ...scene.rootOrder], scene.folders, updatedSlots, updatedStickers, updatedTexts, scene.compoundLayers,
    );
    commitScene(normalizeSceneWithZ({ ...scene, slots: updatedSlots, stickers: updatedStickers, textOverlays: updatedTexts, rootOrder: root }));
  };

  const handleAddMediaFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const newItems: PosterSlotMedia[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const res = await uploadLayoutAsset({ fileBuffer: await file.arrayBuffer(), fileName: file.name, mimeType: file.type || 'image/jpeg' });
        newItems.push({
          id: `slot-${Date.now()}-${i}`, type: res.type, asset_path: res.asset_path,
          original_filename: file.name, fit_mode: 'contain', frame_style: 'clean_border', video_loop_count: 1,
        });
      }
      const updated = [...scene.slots, ...newItems];
      prependItemsAndCommit({ slots: updated }, newItems.map((it) => `slot:${it.id}`));
      setSelectedSlotIndex(updated.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (canvasDropInputRef.current) canvasDropInputRef.current.value = '';
    }
  };

  const handleAddNoticeSlot = () => {
    const slot: PosterSlotMedia = {
      id: `slot-${Date.now()}`, type: 'notice', asset_path: '',
      notice_headline: 'Community Announcement', notice_description: 'Announcement details and program timings...',
      notice_theme: 'sapphire', fit_mode: 'cover', frame_style: 'clean_border',
    };
    const updated = [...scene.slots, slot];
    prependItemsAndCommit({ slots: updated }, [`slot:${slot.id}`]);
    setSelectedSlotIndex(updated.length - 1);
  };

  const handleReplaceSlotFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadLayoutAsset({ fileBuffer: await file.arrayBuffer(), fileName: file.name, mimeType: file.type || 'image/jpeg' });
      if (selectedSlotIndex === null || !scene.slots[selectedSlotIndex]) return;
      const newSlots = [...scene.slots];
      newSlots[selectedSlotIndex] = { ...scene.slots[selectedSlotIndex]!, type: res.type, asset_path: res.asset_path, original_filename: file.name };
      commitSlots(newSlots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File replacement failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFrameStyleChange = (frame_style: SlotFrameStyle, customUrl?: string) => {
    if (frameApplyScope === 'all') {
      commitSlots(scene.slots.map((s) => ({ ...s, frame_style, custom_frame_url: customUrl ?? s.custom_frame_url })));
      return;
    }
    if (selectedSlotIndex === null || !scene.slots[selectedSlotIndex]) return;
    const updated = [...scene.slots];
    updated[selectedSlotIndex] = { ...scene.slots[selectedSlotIndex]!, frame_style, custom_frame_url: customUrl ?? scene.slots[selectedSlotIndex]!.custom_frame_url };
    commitSlots(updated);
  };

  const handleToggleAllFitCover = () => {
    const targetFit: SlotFitMode = scene.slots.every((s) => s.fit_mode === 'cover') ? 'contain' : 'cover';
    commitSlots(scene.slots.map((s) => ({ ...s, fit_mode: targetFit })));
  };

  const handleAddIslamicSticker = (type: IslamicStickerType) => {
    const preset = ISLAMIC_STICKERS_REGISTRY.find((p) => p.id === type);
    const stk: PosterCanvasSticker = {
      id: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, pos_x: 50, pos_y: 50,
      width_percent: preset?.defaultWidth ?? 16, height_percent: preset?.defaultHeight ?? 22, rotation: 0, z_index: 30,
    };
    prependItemsAndCommit({ stickers: [...scene.stickers, stk] }, [`sticker:${stk.id}`]);
    selectSticker(scene.stickers.length);
  };

  const handleAddBadgeSticker = (text: string, variant: 'red' | 'gold' | 'emerald' | 'blue' | 'purple' | 'amber') => {
    const stk: PosterCanvasSticker = {
      id: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: 'badge_custom',
      badge_text: text, badge_variant: variant, pos_x: 50, pos_y: 50,
      width_percent: 24, height_percent: 5, rotation: 0, z_index: 30,
    };
    prependItemsAndCommit({ stickers: [...scene.stickers, stk] }, [`sticker:${stk.id}`]);
    selectSticker(scene.stickers.length);
  };

  const handleAddTextBanner = () => {
    const banner: PosterTextOverlay = {
      id: `banner-${Date.now()}`, text: 'Special Announcement', position: 'custom', z_index: 20,
      font_family: 'sans', font_size: 'lg', text_color: '#ffffff', bg_style: 'dark', bg_color: '#0f172a',
      is_bold: true, is_italic: false, is_underline: false, text_align: 'center',
      pos_y: 15, pos_x: 50, rotation: 0, width_mode: 'fit',
    };
    prependItemsAndCommit({ textOverlays: [...scene.textOverlays, banner] }, [`text:${banner.id}`]);
    setSelectedTextIndex(scene.textOverlays.length);
    setActiveTab('text');
  };

  const pickOverlayColor = async (targetIndex: number, targetField: 'text_color' | 'bg_color') => {
    if (typeof window === 'undefined' || !('EyeDropper' in window)) return;
    try {
      // @ts-expect-error EyeDropper is supported in Chromium
      const dropper = new window.EyeDropper();
      const res = await dropper.open();
      if (!res?.sRGBHex) return;
      setTextOverlays((prev) =>
        prev.map((item, idx) =>
          idx === targetIndex
            ? { ...item, [targetField]: res.sRGBHex, ...(targetField === 'bg_color' ? { bg_style: 'dark' as const } : {}) }
            : item,
        ),
      );
      isDirtyRef.current = true;
    } catch {}
  };

  return {
    handleAddMediaFiles, handleAddNoticeSlot, handleReplaceSlotFile,
    handleFrameStyleChange, handleToggleAllFitCover,
    handleAddIslamicSticker, handleAddBadgeSticker,
    handleAddBadgeSlot: handleAddBadgeSticker,
    handleAddTextBanner,
    handleEyeDropper: (idx: number) => pickOverlayColor(idx, 'text_color'),
    handleBgEyeDropper: (idx: number) => pickOverlayColor(idx, 'bg_color'),
  };
}

