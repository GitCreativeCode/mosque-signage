/**
 * Pure Poster Row Mapper & Duration Helpers
 * MosqueSignage (TV)
 */

import type { MediaType, Poster, QrPosition } from '@/types/index';

export interface PosterDbRow {
  readonly id: string;
  readonly title: string;
  readonly image_path: string;
  readonly media_type: string;
  readonly video_loop_count: number;
  readonly video_duration_seconds: number | null;
  readonly thumbnail_path: string | null;
  readonly allow_audio: boolean;
  readonly qr_url: string | null;
  readonly qr_label: string | null;
  readonly qr_position: string;
  readonly start_at: string;
  readonly end_at: string | null;
  readonly duration_seconds: number;
  readonly display_order: number;
  readonly is_active: boolean;
  readonly layout_config: string | null;
  readonly created_at: string;
}

export interface UploadPosterInput {
  readonly title: string;
  readonly fileBuffer: Buffer | Uint8Array | ArrayBuffer;
  readonly fileName: string;
  readonly mimeType: string;
  readonly start_at: string;
  readonly end_at?: string | null | undefined;
  readonly duration_seconds?: number | undefined;
  readonly video_loop_count?: number | undefined;
  readonly video_duration_seconds?: number | undefined;
  readonly thumbnailBuffer?: (Buffer | Uint8Array | ArrayBuffer) | undefined;
  readonly allow_audio?: boolean | undefined;
  readonly qr_url?: string | undefined;
  readonly qr_label?: string | undefined;
  readonly qr_position?: QrPosition | undefined;
}

export interface UpdatePosterInput {
  readonly id: string;
  readonly title: string;
  readonly start_at: string;
  readonly end_at?: string | null | undefined;
  readonly duration_seconds: number;
  readonly video_loop_count?: number | undefined;
  readonly video_duration_seconds?: number | undefined;
  readonly thumbnailBuffer?: (Buffer | Uint8Array | ArrayBuffer) | undefined;
  readonly allow_audio?: boolean | undefined;
  readonly qr_url?: string | undefined;
  readonly qr_label?: string | undefined;
  readonly qr_position?: QrPosition | undefined;
  readonly is_active?: boolean | undefined;
  readonly fileBuffer?: (Buffer | Uint8Array | ArrayBuffer) | undefined;
  readonly fileName?: string | undefined;
  readonly mimeType?: string | undefined;
}

export function mapPosterRowToDomain(row: PosterDbRow): Poster {
  return {
    id: row.id,
    title: row.title,
    image_path: row.image_path,
    media_type: (row.media_type as MediaType) ?? 'image',
    video_loop_count: row.video_loop_count ?? 1,
    video_duration_seconds: row.video_duration_seconds ?? undefined,
    thumbnail_path: row.thumbnail_path ?? undefined,
    allow_audio: Boolean(row.allow_audio),
    qr_url: row.qr_url ?? undefined,
    qr_label: row.qr_label ?? undefined,
    qr_position: (row.qr_position as QrPosition) ?? 'bottom-left',
    start_at: row.start_at,
    end_at: row.end_at ?? null,
    duration_seconds: row.duration_seconds,
    display_order: row.display_order,
    is_active: row.is_active,
    layout_config: row.layout_config ?? undefined,
    created_at: row.created_at,
  };
}
