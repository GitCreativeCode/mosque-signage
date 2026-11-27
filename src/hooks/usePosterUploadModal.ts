'use client';

import { useState, useRef, useEffect } from 'react';
import type { QrPosition } from '@/types/index';
import { toLocalDatetimeString } from '@/lib/utils/time';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';
import {
  calculateMaxLoops,
  calculateTotalDwell,
  isQrEligible,
  calculateMinLoopsForQr,
} from '@/lib/engine/video-engine';
import { buildMediaPosterMetadata } from '@/lib/posters/poster-upload-client';
import { probeAndPrepareMediaFile } from './useMediaProbeUpload';

function getDefaultEndAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return toLocalDatetimeString(d);
}

function cleanFileTitle(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
}

function validateUploadInputs(
  file: File | null,
  title: string,
  isIndefinite: boolean,
  endAt: string,
): string | null {
  if (!file) return 'Please select an image or video file to upload.';
  if (!title.trim()) return 'Please enter a poster title.';
  if (!isIndefinite && !endAt) return 'Please select an expiration end date, or check "Run indefinitely".';
  return null;
}

/** State and media probe controller for single-asset image/video upload modal. */
export function usePosterUploadModal(
  isOpen: boolean,
  onClose: () => void,
  onUploaded: () => void,
  isSmallScreen = false,
) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [thumbnailBuffer, setThumbnailBuffer] = useState<ArrayBuffer | null>(null);
  const [duration, setDuration] = useState<number>(15);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoLoopCount, setVideoLoopCount] = useState<number>(1);
  const [allowAudio, setAllowAudio] = useState<boolean>(false);
  const [hasQr, setHasQr] = useState<boolean>(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [qrLabel, setQrLabel] = useState<string>('Scan to Register');
  const [qrPosition, setQrPosition] = useState<QrPosition>('bottom-left');
  const [qrStartAt, setQrStartAt] = useState<string | null>(null);
  const [qrEndAt, setQrEndAt] = useState<string | null>(null);
  const [isIndefinite, setIsIndefinite] = useState<boolean>(true);
  const [recurringSchedule, setRecurringSchedule] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [studioFiles, setStudioFiles] = useState<File[]>([]);
  const [startAt, setStartAt] = useState<string>(() => toLocalDatetimeString(new Date()));
  const [endAt, setEndAt] = useState<string>(getDefaultEndAt);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFormState = () => {
    setTitle(''); setFile(null); setPreviewUrl(null); setThumbnailPreviewUrl(null);
    setThumbnailBuffer(null); setIsVideo(false); setVideoDuration(0);
    setVideoLoopCount(1); setAllowAudio(false); setDuration(15);
    setHasQr(false); setQrUrl(''); setQrLabel('Scan to Register');
    setQrPosition('bottom-left'); setQrStartAt(null); setQrEndAt(null);
    setIsIndefinite(true);
    setRecurringSchedule(null);
    setStartAt(toLocalDatetimeString(new Date())); setEndAt(getDefaultEndAt());
    setError(null); setIsSubmitting(false); setShowDiscardConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (isOpen) resetFormState();
  }, [isOpen]);

  const isDirty = file !== null || title.trim().length > 0 || (hasQr && qrUrl.trim().length > 0);
  const handleRequestClose = () => (isDirty ? setShowDiscardConfirm(true) : onClose());

  const handleForceClose = () => {
    resetFormState();
    onClose();
  };

  const activeTotalDwell = isVideo ? calculateTotalDwell(videoDuration, videoLoopCount) : duration;
  const isEligibleForQr = !isVideo || isQrEligible(videoDuration, videoLoopCount);
  const minLoopsRequiredForQr = isVideo ? calculateMinLoopsForQr(videoDuration) : 1;
  const maxLoops = isVideo && videoDuration > 0 ? calculateMaxLoops(videoDuration) : 1;

  const handleFileChange = (selectedFile: File) => {
    probeAndPrepareMediaFile(selectedFile, {
      onError: setError,
      onImageSelected: (f, url) => {
        setIsVideo(false);
        setThumbnailBuffer(null);
        setThumbnailPreviewUrl(null);
        setFile(f);
        setPreviewUrl(url);
        if (!title) setTitle(cleanFileTitle(f.name));
      },
      onVideoProbed: (info) => {
        setIsVideo(true);
        setVideoDuration(info.videoDuration);
        setVideoLoopCount(info.defaultLoops);
        setDuration(info.totalDwell);
        setFile(info.file);
        setPreviewUrl(info.url);
        if (!info.qrEligible) setHasQr(false);
        if (!title) setTitle(cleanFileTitle(info.file.name));
      },
      onVideoThumbnailReady: (buf, thumbUrl) => {
        setThumbnailBuffer(buf);
        setThumbnailPreviewUrl(thumbUrl);
      },
      onVideoProbeFailed: (msg) => {
        setError(msg);
        setFile(null);
        setPreviewUrl(null);
        setIsVideo(false);
      },
    });
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      if (isSmallScreen) {
        setError('Multi-asset split-screen layouts require a tablet or computer. Please select a single poster or video.');
        return;
      }
      setStudioFiles(Array.from(files));
      setShowStudioModal(true);
    } else if (files[0]) {
      handleFileChange(files[0]);
    }
  };

  const handleLoopCountChange = (newCount: number) => {
    setVideoLoopCount(newCount);
    setDuration(calculateTotalDwell(videoDuration, newCount));
    if (!isQrEligible(videoDuration, newCount)) setHasQr(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validateUploadInputs(file, title, isIndefinite, endAt);
    if (validationErr || !file) {
      setError(validationErr ?? 'Please select a file.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const { uploadPoster } = await import('@/lib/actions/posters');
      await uploadPoster({
        fileBuffer: buffer,
        fileName: file.name,
        mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        ...buildMediaPosterMetadata({
          title, startAt, endAt, isIndefinite, activeTotalDwell, isVideo,
          videoLoopCount, videoDuration, thumbnailBuffer, allowAudio,
          hasQr, isEligibleForQr, qrUrl, qrLabel, qrPosition,
          qrStartAt, qrEndAt,
          recurringSchedule,
        }),
      });
      broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'create' });
      onUploaded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title, setTitle, file, previewUrl, thumbnailPreviewUrl, duration, setDuration,
    isVideo, videoDuration, videoLoopCount, allowAudio, setAllowAudio,
    hasQr, setHasQr, qrUrl, setQrUrl, qrLabel, setQrLabel, qrPosition, setQrPosition,
    qrStartAt, setQrStartAt, qrEndAt, setQrEndAt,
    isIndefinite, setIsIndefinite, recurringSchedule, setRecurringSchedule,
    isSubmitting, error, showDiscardConfirm, setShowDiscardConfirm,
    showStudioModal, setShowStudioModal, studioFiles, setStudioFiles,
    startAt, setStartAt, endAt, setEndAt, fileInputRef,
    activeTotalDwell, isEligibleForQr, minLoopsRequiredForQr, maxLoops,
    handleRequestClose, handleForceClose, handleFilesSelected, handleLoopCountChange,
    openInStudio: () => {
      if (isSmallScreen) return;
      setStudioFiles(file ? [file] : []);
      setShowStudioModal(true);
    },
    handleSubmit,
  };
}
