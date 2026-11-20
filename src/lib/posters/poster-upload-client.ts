import type { QrPosition } from '@/types/index';
import { fromLocalDatetimeString } from '@/lib/utils/time';

export interface MediaPosterMetadataInput {
  readonly title: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly isIndefinite: boolean;
  readonly activeTotalDwell: number;
  readonly isVideo: boolean;
  readonly videoLoopCount: number;
  readonly videoDuration: number;
  readonly thumbnailBuffer: ArrayBuffer | null;
  readonly allowAudio: boolean;
  readonly hasQr: boolean;
  readonly isEligibleForQr: boolean;
  readonly qrUrl: string;
  readonly qrLabel: string;
  readonly qrPosition: QrPosition;
  readonly recurringSchedule?: string | null | undefined;
}

/** Formats shared scheduling, video looping, thumbnail, and QR metadata fields for upload/update actions. */
export function buildMediaPosterMetadata(input: MediaPosterMetadataInput) {
  const qrEnabled = input.hasQr && input.isEligibleForQr;
  return {
    title: input.title.trim(),
    start_at: fromLocalDatetimeString(input.startAt),
    end_at: input.isIndefinite ? null : fromLocalDatetimeString(input.endAt),
    duration_seconds: input.activeTotalDwell,
    video_loop_count: input.isVideo ? input.videoLoopCount : undefined,
    video_duration_seconds: input.isVideo ? input.videoDuration : undefined,
    thumbnailBuffer: input.isVideo && input.thumbnailBuffer ? input.thumbnailBuffer : undefined,
    allow_audio: input.isVideo ? input.allowAudio : false,
    qr_url: qrEnabled && input.qrUrl.trim() ? input.qrUrl.trim() : undefined,
    qr_label: qrEnabled && input.qrLabel.trim() ? input.qrLabel.trim() : undefined,
    qr_position: qrEnabled ? input.qrPosition : undefined,
    recurring_schedule: input.recurringSchedule ?? null,
  };
}

