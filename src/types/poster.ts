/**
 * Poster Entity & Layout Configuration Types
 * MosqueSignage (TV)
 */

import type {
  CanvasBackgroundPreset,
  LayoutGridGap,
  PosterCanvasSticker,
  PosterCompoundLayer,
  PosterLayerFolder,
  PosterLayoutArchetype,
  PosterSlotMedia,
  PosterTextOverlay,
} from './poster-layers';

export type PosterStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'ARCHIVED';

export type NoticeTheme = 'emerald' | 'sapphire' | 'amethyst' | 'amber' | 'ruby' | 'slate';

export type QrPosition =
  | 'bottom-left'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-center'
  | 'bottom-right';

export type MediaType = 'image' | 'video' | 'composite';

export interface RecurringScheduleRule {
  readonly id?: string | undefined;
  readonly days: readonly number[]; // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  readonly startTime: string; // "HH:MM" (24-hour format)
  readonly endTime: string;   // "HH:MM" (24-hour format)
}

export type RecurringSchedule = readonly RecurringScheduleRule[];

export interface PosterLayoutConfig {
  readonly version: 1;
  readonly archetype: PosterLayoutArchetype;
  readonly split_ratio: number;
  readonly secondary_split_ratio?: number | undefined;
  readonly grid_gap?: LayoutGridGap | undefined;
  readonly slots: readonly PosterSlotMedia[];
  readonly text_overlays: readonly PosterTextOverlay[];
  readonly stickers?: readonly PosterCanvasSticker[] | undefined;
  readonly folders?: readonly PosterLayerFolder[] | undefined;
  readonly compound_layers?: readonly PosterCompoundLayer[] | undefined;
  readonly canvas_background?: CanvasBackgroundPreset | undefined;
  readonly canvas_background_custom?: string | undefined;
  readonly root_order?: readonly string[] | undefined;
}

export interface Poster {
  readonly id: string;
  readonly title: string;
  readonly image_path: string;
  readonly media_type?: MediaType | undefined;
  readonly video_loop_count?: number | undefined;
  readonly video_duration_seconds?: number | undefined;
  readonly thumbnail_path?: string | null | undefined;
  readonly allow_audio?: boolean | undefined;
  readonly qr_url?: string | undefined;
  readonly qr_label?: string | undefined;
  readonly qr_position?: QrPosition | null | undefined;
  readonly start_at: string;
  readonly end_at: string | null;
  readonly duration_seconds: number;
  readonly display_order?: number | undefined;
  readonly is_active?: boolean | undefined;
  readonly layout_config?: string | null | undefined;
  readonly recurring_schedule?: string | null | undefined;
  readonly created_at: string;
}

export interface PosterWithStatus extends Poster {
  readonly status: PosterStatus;
}

