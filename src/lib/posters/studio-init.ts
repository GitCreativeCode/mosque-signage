import type {
  Poster,
  PosterLayoutArchetype,
  PosterLayoutConfig,
  PosterSlotMedia,
  NoticeTheme,
  CanvasBackgroundPreset,
  LayoutGridGap,
  QrPosition,
} from '@/types/index';
import type { StudioHistorySnapshot } from './studio-types';
import { getDefaultArchetypeForCount, validateLayoutConfig } from './layout-engine';
import { toLocalDatetimeString } from '@/lib/utils/time';

export interface StudioAssetUploaderInput {
  readonly fileBuffer: ArrayBuffer;
  readonly fileName: string;
  readonly mimeType: string;
}

export type StudioAssetUploader = (input: StudioAssetUploaderInput) => Promise<{
  readonly type: 'image' | 'video';
  readonly asset_path: string;
}>;

export interface ParsedInitialStudioConfig {
  readonly title: string;
  readonly duration: number;
  readonly qrUrl: string;
  readonly hasQr: boolean;
  readonly qrLabel: string;
  readonly qrPosition: QrPosition;
  readonly startAt: string;
  readonly endAt: string;
  readonly isIndefinite: boolean;
  readonly archetype: PosterLayoutArchetype;
  readonly splitRatio: number;
  readonly gridGap: LayoutGridGap;
  readonly canvasBackground: CanvasBackgroundPreset;
  readonly canvasBackgroundCustom: string;
  readonly snapshot: StudioHistorySnapshot;
}

export function createEmptyStudioSnapshot(): StudioHistorySnapshot {
  return { slots: [], stickers: [], textOverlays: [], compoundLayers: [], folders: [], rootOrder: [] };
}

/** Builds structured initial Studio state from an existing composite or single poster. */
export function buildInitialStateFromPoster(poster: Poster): ParsedInitialStudioConfig | null {
  const base = {
    title: poster.title,
    duration: poster.duration_seconds || 20,
    qrUrl: poster.qr_url || '',
    hasQr: Boolean(poster.qr_url),
    qrLabel: poster.qr_label || 'Scan to Register',
    qrPosition: (poster.qr_position as QrPosition) || 'bottom-left',
    startAt: poster.start_at ? toLocalDatetimeString(new Date(poster.start_at)) : toLocalDatetimeString(new Date()),
    endAt: poster.end_at ? toLocalDatetimeString(new Date(poster.end_at)) : '',
    isIndefinite: !poster.end_at,
  };

  if (poster.layout_config) {
    try {
      const rawParsed: unknown =
        typeof poster.layout_config === 'string' ? JSON.parse(poster.layout_config) : poster.layout_config;
      if (!validateLayoutConfig(rawParsed).valid) return null;
      const cfg = rawParsed as PosterLayoutConfig;
      const safeArch = cfg.archetype === 'single' ? 'split_vertical' : cfg.archetype;
      return {
        ...base,
        archetype: safeArch,
        splitRatio: cfg.split_ratio || 50,
        gridGap: cfg.grid_gap || 'normal',
        canvasBackground: cfg.canvas_background ?? 'black',
        canvasBackgroundCustom: cfg.canvas_background_custom ?? '',
        snapshot: {
          slots: [...cfg.slots],
          stickers: [...(cfg.stickers ?? [])],
          textOverlays: [...(cfg.text_overlays ?? [])],
          compoundLayers: [...(cfg.compound_layers ?? [])],
          folders: [...(cfg.folders ?? [])],
          rootOrder: [...(cfg.root_order ?? [])],
        },
      };
    } catch {
      return null;
    }
  }

  if (!poster.image_path) return null;
  const singleSlot: PosterSlotMedia = {
    id: `slot-${Date.now()}-1`,
    type: poster.media_type === 'video' ? 'video' : 'image',
    asset_path: poster.image_path,
    original_filename: poster.title,
    fit_mode: 'contain',
    frame_style: 'none',
    video_loop_count: poster.video_loop_count ?? 1,
  };
  return {
    ...base,
    archetype: 'split_vertical',
    splitRatio: 50,
    gridGap: 'normal',
    canvasBackground: 'black',
    canvasBackgroundCustom: '',
    snapshot: { ...createEmptyStudioSnapshot(), slots: [singleSlot], rootOrder: [`slot:${singleSlot.id}`] },
  };
}

/** Uploads initial dropped files into Studio media slots via an injected uploader and chooses default archetype. */
export async function uploadInitialFilesToSlots(
  files: readonly File[],
  uploadAsset: StudioAssetUploader
): Promise<{
  readonly slots: PosterSlotMedia[];
  readonly archetype: PosterLayoutArchetype;
  readonly snapshot: StudioHistorySnapshot;
}> {
  const uploadedSlots = await Promise.all(
    files.map(async (file, idx): Promise<PosterSlotMedia> => {
      const res = await uploadAsset({
        fileBuffer: await file.arrayBuffer(),
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
      });
      return {
        id: `slot-${Date.now()}-${idx}`,
        type: res.type,
        asset_path: res.asset_path,
        original_filename: file.name,
        fit_mode: 'contain',
        frame_style: 'clean_border',
        video_loop_count: 1,
      };
    }),
  );
  const arch = getDefaultArchetypeForCount(uploadedSlots.length);
  return {
    slots: uploadedSlots,
    archetype: arch === 'single' ? 'split_vertical' : arch,
    snapshot: {
      ...createEmptyStudioSnapshot(),
      slots: uploadedSlots,
      rootOrder: uploadedSlots.map((s) => `slot:${s.id}`),
    },
  };
}

export function buildInitialNoticeSnapshot(initialNotice: {
  readonly headline: string;
  readonly description: string;
  readonly theme?: NoticeTheme | undefined;
}): StudioHistorySnapshot {
  const noticeSlot: PosterSlotMedia = {
    id: `slot-${Date.now()}-1`,
    type: 'notice',
    asset_path: '',
    original_filename: initialNotice.headline || 'Community Announcement',
    label: 'Notice Card',
    fit_mode: 'contain',
    frame_style: 'islamic_matting',
    notice_headline: initialNotice.headline,
    notice_description: initialNotice.description,
    notice_theme: initialNotice.theme ?? 'emerald',
  };
  return { ...createEmptyStudioSnapshot(), slots: [noticeSlot], rootOrder: [`slot:${noticeSlot.id}`] };
}

