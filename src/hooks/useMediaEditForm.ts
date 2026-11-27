'use client';

import { useState, useRef, useEffect } from 'react';
import type { PosterWithStatus, QrPosition } from '@/types/index';
import { toLocalDatetimeString } from '@/lib/utils/time';
import {
  isVideoMedia,
  calculateMaxLoops,
  calculateTotalDwell,
  isQrEligible,
  calculateMinLoopsForQr,
} from '@/lib/engine/video-engine';
import { buildMediaPosterMetadata } from '@/lib/posters/poster-upload-client';
import { probeAndPrepareMediaFile } from './useMediaProbeUpload';

interface MediaEditSnapshot {
  readonly title: string;
  readonly duration: number;
  readonly videoLoopCount: number;
  readonly allowAudio: boolean;
  readonly hasQr: boolean;
  readonly qrUrl: string;
  readonly qrLabel: string;
  readonly qrPosition: QrPosition;
  readonly qrStartAt: string | null;
  readonly qrEndAt: string | null;
  readonly isIndefinite: boolean;
  readonly startAt: string;
  readonly endAt: string;
  readonly recurringSchedule: string | null;
}

interface UseMediaEditFormParams {
  readonly poster: PosterWithStatus;
  readonly onClose: () => void;
  readonly onUpdated: () => void;
  readonly onDirtyChange?: ((isDirty: boolean) => void) | undefined;
}

function isMediaDirty(
  snap: MediaEditSnapshot,
  curr: MediaEditSnapshot,
  hasNewFile: boolean,
): boolean {
  return Boolean(
    hasNewFile ||
      curr.title.trim() !== snap.title.trim() ||
      curr.duration !== snap.duration ||
      curr.videoLoopCount !== snap.videoLoopCount ||
      curr.allowAudio !== snap.allowAudio ||
      curr.hasQr !== snap.hasQr ||
      (curr.hasQr && curr.qrUrl.trim() !== snap.qrUrl.trim()) ||
      (curr.hasQr && curr.qrLabel.trim() !== snap.qrLabel.trim()) ||
      (curr.hasQr && curr.qrPosition !== snap.qrPosition) ||
      (curr.hasQr && curr.qrStartAt !== snap.qrStartAt) ||
      (curr.hasQr && curr.qrEndAt !== snap.qrEndAt) ||
      curr.isIndefinite !== snap.isIndefinite ||
      curr.startAt !== snap.startAt ||
      (!curr.isIndefinite && curr.endAt !== snap.endAt) ||
      curr.recurringSchedule !== snap.recurringSchedule,
  );
}

/** Manages media poster replacement, video probing, dirty state, and update submission. */
export function useMediaEditForm({
  poster,
  onClose,
  onUpdated,
  onDirtyChange,
}: UseMediaEditFormParams) {
  const isOriginallyVideo =
    poster.media_type === 'video' || isVideoMedia(undefined, poster.image_path);

  const [title, setTitle] = useState(poster.title);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(poster.image_path);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    poster.thumbnail_path ?? null,
  );
  const [thumbnailBuffer, setThumbnailBuffer] = useState<ArrayBuffer | null>(null);

  const [isVideo, setIsVideo] = useState<boolean>(isOriginallyVideo);
  const [videoDuration, setVideoDuration] = useState<number>(
    poster.video_duration_seconds ||
      (isOriginallyVideo ? Math.round(poster.duration_seconds / (poster.video_loop_count || 1)) : 0),
  );
  const [videoLoopCount, setVideoLoopCount] = useState<number>(poster.video_loop_count || 1);
  const [allowAudio, setAllowAudio] = useState<boolean>(Boolean(poster.allow_audio));
  const [duration, setDuration] = useState<number>(poster.duration_seconds || 15);

  const [hasQr, setHasQr] = useState<boolean>(Boolean(poster.qr_url && poster.qr_url.trim().length > 0));
  const [qrUrl, setQrUrl] = useState<string>(poster.qr_url ?? '');
  const [qrLabel, setQrLabel] = useState<string>(poster.qr_label ?? 'Scan to Register');
  const [qrPosition, setQrPosition] = useState<QrPosition>(poster.qr_position ?? 'bottom-left');
  const [qrStartAt, setQrStartAt] = useState<string | null>(poster.qr_start_at ?? null);
  const [qrEndAt, setQrEndAt] = useState<string | null>(poster.qr_end_at ?? null);

  const isCurrentlyIndefinite = poster.end_at === null || poster.end_at === undefined;
  const [isIndefinite, setIsIndefinite] = useState<boolean>(isCurrentlyIndefinite);
  const [recurringSchedule, setRecurringSchedule] = useState<string | null>(poster.recurring_schedule ?? null);
  const startIsoStr = toLocalDatetimeString(poster.start_at);
  const endIsoStr = toLocalDatetimeString(poster.end_at ?? Date.now() + 14 * 86400000);
  const [startAt, setStartAt] = useState<string>(startIsoStr);
  const [endAt, setEndAt] = useState<string>(endIsoStr);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialRef = useRef<MediaEditSnapshot>({
    title: poster.title, duration: poster.duration_seconds || 15,
    videoLoopCount: poster.video_loop_count || 1, allowAudio: Boolean(poster.allow_audio),
    hasQr: Boolean(poster.qr_url && poster.qr_url.trim().length > 0),
    qrUrl: poster.qr_url ?? '', qrLabel: poster.qr_label ?? 'Scan to Register',
    qrPosition: poster.qr_position ?? 'bottom-left',
    qrStartAt: poster.qr_start_at ?? null,
    qrEndAt: poster.qr_end_at ?? null,
    isIndefinite: isCurrentlyIndefinite,
    startAt: startIsoStr, endAt: endIsoStr, recurringSchedule: poster.recurring_schedule ?? null,
  });

  const isDirty = isMediaDirty(
    initialRef.current,
    { title, duration, videoLoopCount, allowAudio, hasQr, qrUrl, qrLabel, qrPosition, qrStartAt, qrEndAt, isIndefinite, startAt, endAt, recurringSchedule },
    newFile !== null,
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const activeTotalDwell = isVideo ? calculateTotalDwell(videoDuration, videoLoopCount) : duration;
  const isEligibleForQr = !isVideo || isQrEligible(videoDuration, videoLoopCount);
  const minLoopsRequiredForQr = isVideo ? calculateMinLoopsForQr(videoDuration) : 1;
  const maxLoops = isVideo && videoDuration > 0 ? calculateMaxLoops(videoDuration) : 1;

  const handleFileChange = (selectedFile: File) => {
    probeAndPrepareMediaFile(selectedFile, {
      onError: setError,
      onImageSelected: (f, url) => {
        setIsVideo(false); setThumbnailBuffer(null); setThumbnailPreviewUrl(null);
        setNewFile(f); setPreviewUrl(url);
      },
      onVideoProbed: (info) => {
        setIsVideo(true); setVideoDuration(info.videoDuration);
        setVideoLoopCount(info.defaultLoops); setDuration(info.totalDwell);
        setNewFile(info.file); setPreviewUrl(info.url);
        if (!info.qrEligible) setHasQr(false);
      },
      onVideoThumbnailReady: (buf, thumbUrl) => {
        setThumbnailBuffer(buf); setThumbnailPreviewUrl(thumbUrl);
      },
    });
  };

  const handleLoopCountChange = (newCount: number) => {
    setVideoLoopCount(newCount);
    setDuration(calculateTotalDwell(videoDuration, newCount));
    if (!isQrEligible(videoDuration, newCount)) setHasQr(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a poster title.');
      return;
    }
    if (!isIndefinite && !endAt) {
      setError('Please select an expiration end date, or check "Run indefinitely".');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const fileBuffer = newFile ? await newFile.arrayBuffer() : undefined;
      const { updatePoster } = await import('@/lib/actions/posters');
      await updatePoster({
        id: poster.id,
        ...buildMediaPosterMetadata({
          title, startAt, endAt, isIndefinite, activeTotalDwell, isVideo,
          videoLoopCount, videoDuration, thumbnailBuffer, allowAudio,
          hasQr, isEligibleForQr, qrUrl, qrLabel, qrPosition,
          qrStartAt, qrEndAt,
          recurringSchedule,
        }),
        video_loop_count: isVideo ? videoLoopCount : 1,
        ...(newFile && fileBuffer ? { fileBuffer, fileName: newFile.name, mimeType: newFile.type } : {}),
      });
      onDirtyChange?.(false);
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title, setTitle, previewUrl, thumbnailPreviewUrl, isVideo, videoDuration,
    videoLoopCount, allowAudio, setAllowAudio, duration, setDuration, hasQr, setHasQr,
    qrUrl, setQrUrl, qrLabel, setQrLabel, qrPosition, setQrPosition,
    qrStartAt, setQrStartAt, qrEndAt, setQrEndAt,
    isIndefinite,
    setIsIndefinite, recurringSchedule, setRecurringSchedule,
    startAt, setStartAt, endAt, setEndAt, isSubmitting, error,
    fileInputRef, activeTotalDwell, isEligibleForQr, minLoopsRequiredForQr, maxLoops,
    handleFileChange, handleLoopCountChange, handleSubmit,
  };
}
