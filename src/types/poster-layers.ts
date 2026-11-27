/**
 * Multi-Asset Poster Layer & Composite Canvas Types
 * MosqueSignage (TV)
 */

import type { NoticeTheme } from './poster';

export type PosterLayoutArchetype =
  | 'single'
  | 'split_vertical'
  | 'split_horizontal'
  | 'hero_left_2_right'
  | 'hero_top_2_bottom'
  | 'grid_4'
  | 'masonry_flow'
  | 'freeform';

export type SlotFrameStyle =
  | 'none'
  | 'clean_border'
  | 'islamic_matting'
  | 'gold_emerald_trim'
  | 'card_shadow'
  | 'polaroid'
  | 'custom';

export type SlotFitMode = 'contain' | 'contain_blur' | 'cover';

export type IslamicStickerType =
  | 'fanous'
  | 'crescent_moon'
  | 'mosque'
  | 'islamic_star'
  | 'bismillah'
  | 'kaaba'
  | 'tasbih'
  | 'quran_rehal'
  | 'alhamdulillah'
  | 'mashaallah'
  | 'subhanallah'
  | 'mihrab_arch'
  | 'dates_dallah'
  | 'badge_custom';

export type BadgeVariant = 'red' | 'gold' | 'emerald' | 'blue' | 'purple' | 'amber';
export type TextOverlayFont = 'sans' | 'serif' | 'mono' | 'traditional';
export type TextOverlaySizePreset = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
export type TextOverlaySize = TextOverlaySizePreset | number;
export type TextOverlayBgStyle = 'dark' | 'glass' | 'emerald' | 'gold' | 'transparent';
export type TextOverlayPositionPreset =
  | 'top_banner'
  | 'upper_third'
  | 'center'
  | 'lower_third'
  | 'bottom_strip'
  | 'custom';
export type LayoutGridGap = 'none' | 'subtle' | 'normal' | 'spacious';

export interface PosterCanvasSticker {
  readonly id: string;
  readonly type: IslamicStickerType;
  readonly pos_x: number;
  readonly pos_y: number;
  readonly width_percent: number;
  readonly height_percent: number;
  readonly rotation?: number | undefined;
  readonly z_index: number;
  readonly badge_text?: string | undefined;
  readonly badge_variant?: BadgeVariant | undefined;
  readonly flip_x?: boolean | undefined;
  readonly flip_y?: boolean | undefined;
  readonly color_override?: string | undefined;
  readonly layer_folder_id?: string | undefined;
  readonly is_hidden?: boolean | undefined;
  readonly is_locked?: boolean | undefined;
}

export interface PosterSlotMedia {
  readonly id: string;
  readonly type: 'image' | 'video' | 'notice' | 'badge';
  readonly asset_path: string;
  readonly original_filename?: string | undefined;
  readonly label?: string | undefined;
  readonly fit_mode: SlotFitMode;
  readonly frame_style: SlotFrameStyle;
  readonly custom_frame_url?: string | undefined;
  readonly pos_x?: number | undefined;
  readonly pos_y?: number | undefined;
  readonly width_percent?: number | undefined;
  readonly height_percent?: number | undefined;
  readonly rotation?: number | undefined;
  readonly z_index?: number | undefined;
  readonly badge_text?: string | undefined;
  readonly badge_variant?: BadgeVariant | undefined;
  readonly flip_x?: boolean | undefined;
  readonly flip_y?: boolean | undefined;
  readonly layer_folder_id?: string | undefined;
  readonly is_hidden?: boolean | undefined;
  readonly is_locked?: boolean | undefined;
  readonly video_duration_seconds?: number | undefined;
  readonly video_loop_count?: number | undefined;
  readonly notice_headline?: string | undefined;
  readonly notice_headline_italic?: boolean | undefined;
  readonly notice_headline_underline?: boolean | undefined;
  readonly notice_headline_align?: 'left' | 'center' | 'right' | undefined;
  readonly notice_description?: string | undefined;
  readonly notice_theme?: NoticeTheme | undefined;
  readonly notice_font?: TextOverlayFont | undefined;
  readonly notice_align?: 'left' | 'center' | 'right' | undefined;
}

export interface PosterTextOverlay {
  readonly id: string;
  readonly text: string;
  readonly style?: 'announcement_banner' | 'headline' | 'hadith_quote' | 'event_pill' | undefined;
  readonly position: TextOverlayPositionPreset;
  readonly z_index: number;
  readonly font_family?: TextOverlayFont | undefined;
  readonly font_size?: TextOverlaySize | undefined;
  readonly text_color?: string | undefined;
  readonly bg_style?: TextOverlayBgStyle | undefined;
  readonly bg_color?: string | undefined;
  readonly is_bold?: boolean | undefined;
  readonly is_italic?: boolean | undefined;
  readonly is_underline?: boolean | undefined;
  readonly text_align?: 'left' | 'center' | 'right' | undefined;
  readonly pos_y?: number | undefined;
  readonly pos_x?: number | undefined;
  readonly rotation?: number | undefined;
  readonly scale_x?: number | undefined;
  readonly scale_y?: number | undefined;
  readonly width_mode?: 'fit' | 'full' | 'custom' | undefined;
  readonly width_percent?: number | undefined;
  readonly bg_opacity?: number | undefined;
  readonly box_fit?: 'block' | 'hug_lines' | undefined;
  readonly layer_folder_id?: string | undefined;
  readonly is_hidden?: boolean | undefined;
  readonly is_locked?: boolean | undefined;
}

export interface PosterLayerFolder {
  readonly id: string;
  readonly name: string;
  readonly is_collapsed?: boolean | undefined;
  readonly is_hidden?: boolean | undefined;
  readonly is_locked?: boolean | undefined;
  readonly z_index?: number | undefined;
  readonly child_keys?: readonly string[] | undefined;
}

export interface PosterCompoundLayer {
  readonly id: string;
  readonly label: string;
  readonly pos_x: number;
  readonly pos_y: number;
  readonly width_percent: number;
  readonly height_percent: number;
  readonly rotation?: number | undefined;
  readonly z_index: number;
  readonly flip_x?: boolean | undefined;
  readonly flip_y?: boolean | undefined;
  readonly layer_folder_id?: string | undefined;
  readonly is_hidden?: boolean | undefined;
  readonly is_locked?: boolean | undefined;
  readonly merged_children: {
    readonly slots?: readonly PosterSlotMedia[] | undefined;
    readonly stickers?: readonly PosterCanvasSticker[] | undefined;
    readonly text_overlays?: readonly PosterTextOverlay[] | undefined;
  };
}

export type CanvasBackgroundPreset =
  | 'black'
  | 'dark_slate'
  | 'mosque_green'
  | 'blur_ambient'
  | 'islamic_star'
  | 'arabesque'
  | 'mashrabiya'
  | 'emerald_gradient'
  | 'gold_gradient'
  | 'custom';

