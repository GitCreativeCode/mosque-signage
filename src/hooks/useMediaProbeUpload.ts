'use client';

import {
  calculateDefaultLoops,
  calculateTotalDwell,
  isQrEligible,
  isVideoMedia,
  validateMediaFileSize,
  validateVideoDuration,
} from '@/lib/engine/video-engine';

export interface MediaProbeHandlers {
  readonly onError: (msg: string | null) => void;
  readonly onImageSelected: (file: File, url: string) => void;
  readonly onVideoProbed: (info: {
    file: File;
    url: string;
    videoDuration: number;
    defaultLoops: number;
    totalDwell: number;
    qrEligible: boolean;
  }) => void;
  readonly onVideoThumbnailReady: (buf: ArrayBuffer, previewUrl: string) => void;
  readonly onVideoProbeFailed?: ((msg: string) => void) | undefined;
}

export function probeAndPrepareMediaFile(
  selectedFile: File,
  handlers: MediaProbeHandlers
): void {
  const isVideoFile = isVideoMedia(selectedFile.type, selectedFile.name);
  const sizeCheck = validateMediaFileSize(selectedFile.size, isVideoFile);
  if (!sizeCheck.valid) {
    handlers.onError(sizeCheck.error ?? 'File size exceeds limit.');
    return;
  }

  handlers.onError(null);
  const url = URL.createObjectURL(selectedFile);
  if (!isVideoFile) {
    handlers.onImageSelected(selectedFile, url);
    return;
  }

  const videoProbe = document.createElement('video');
  videoProbe.preload = 'metadata';
  videoProbe.src = url;

  videoProbe.onloadedmetadata = () => {
    const rawDur = videoProbe.duration;
    const durValidation = validateVideoDuration(rawDur);
    if (!durValidation.valid) {
      const msg =
        durValidation.error ??
        'Video duration exceeds the 60-second digital signage maximum. Please trim your video clip.';
      if (handlers.onVideoProbeFailed) handlers.onVideoProbeFailed(msg);
      else handlers.onError(msg);
      return;
    }

    const cleanDur = Math.round(rawDur * 10) / 10;
    const defLoops = calculateDefaultLoops(cleanDur);
    handlers.onVideoProbed({
      file: selectedFile,
      url,
      videoDuration: cleanDur,
      defaultLoops: defLoops,
      totalDwell: calculateTotalDwell(cleanDur, defLoops),
      qrEligible: isQrEligible(cleanDur, defLoops),
    });
    videoProbe.currentTime = Math.min(0.5, cleanDur / 2);
  };

  videoProbe.onseeked = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoProbe.videoWidth || 1920;
      canvas.height = videoProbe.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoProbe, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          handlers.onVideoThumbnailReady(await blob.arrayBuffer(), URL.createObjectURL(blob));
        },
        'image/webp',
        0.85
      );
    } catch (err) {
      console.warn('Canvas thumbnail extraction warning:', err);
    }
  };

  videoProbe.onerror = () => {
    const msg = 'Unable to decode video format in browser. Please use standard H.264 MP4 or VP9 WebM.';
    if (handlers.onVideoProbeFailed) handlers.onVideoProbeFailed(msg);
    else handlers.onError(msg);
  };
}

