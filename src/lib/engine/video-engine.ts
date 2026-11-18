/**
 * Pure Video Looping & Media Validation Engine
 * MosqueSignage (TV)
 *
 * Implements deterministic calculation of video loops, dwell ceilings,
 * QR code scannability viability, and media format validation.
 * Zero DOM or React dependencies.
 */

export const MAX_VIDEO_DURATION_SECONDS = 60;
export const MAX_VIDEO_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_IMAGE_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const MIN_QR_DWELL_SECONDS = 10;

export const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/x-m4v',
] as const;

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

export const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.mov',
  '.ogg',
  '.ogv',
  '.m4v',
] as const;

/**
 * Calculates the maximum permitted loop repetitions for a video clip
 * so that total on-screen dwell never exceeds 60 seconds.
 *
 * Formula: floor(60 / durationSeconds)
 * Bound: Minimum 1 loop, Maximum 60 loops.
 */
export function calculateMaxLoops(durationSeconds: number): number {
  if (durationSeconds <= 0) return 1;
  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) return 1;
  const max = Math.floor(MAX_VIDEO_DURATION_SECONDS / durationSeconds);
  return Math.max(1, max);
}

/**
 * Suggests an ergonomic default loop count for a video clip based on its duration.
 * - Under 6s: Default to 4 repeats (e.g. 5s -> 20s)
 * - 7s to 12s: Default to 2 repeats (e.g. 10s -> 20s)
 * - > 12s: Default to 1 repeat
 */
export function calculateDefaultLoops(durationSeconds: number): number {
  if (durationSeconds <= 0) return 1;
  const maxAllowed = calculateMaxLoops(durationSeconds);
  if (durationSeconds <= 6) {
    return Math.min(4, maxAllowed);
  }
  if (durationSeconds <= 12) {
    return Math.min(2, maxAllowed);
  }
  return 1;
}

/**
 * Calculates the total on-screen presentation dwell time.
 * Total Dwell = durationSeconds * loopCount (capped logically at 60s max allowed).
 */
export function calculateTotalDwell(durationSeconds: number, loopCount: number): number {
  if (durationSeconds <= 0 || loopCount <= 0) return 0;
  const raw = durationSeconds * loopCount;
  return Math.round(raw * 10) / 10;
}

/**
 * Scanning Viability Principle:
 * Contextual QR code cards require >= 10 seconds of total on-screen presentation time
 * to account for attendee discovery, device unlock, camera aim, and focusing.
 */
export function isQrEligible(durationSeconds: number, loopCount: number = 1): boolean {
  const totalDwell = calculateTotalDwell(durationSeconds, loopCount);
  return totalDwell >= MIN_QR_DWELL_SECONDS;
}

/**
 * Calculates the minimum number of loop repetitions required for a given video
 * duration to satisfy the 10-second QR code scannability threshold.
 */
export function calculateMinLoopsForQr(durationSeconds: number): number {
  if (durationSeconds <= 0) return 1;
  return Math.ceil(MIN_QR_DWELL_SECONDS / durationSeconds);
}

/**
 * Validates video duration against the 60-second digital signage maximum ceiling.
 */
export function validateVideoDuration(durationSeconds: number): {
  readonly valid: boolean;
  readonly error?: string;
} {
  if (durationSeconds <= 0) {
    return {
      valid: false,
      error: 'Video duration must be greater than 0 seconds.',
    };
  }
  // Allow slight floating point tolerance (e.g., 60.2s from container metadata)
  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS + 0.5) {
    return {
      valid: false,
      error: `Video duration exceeds the 60-second digital signage maximum (detected: ${Math.round(
        durationSeconds
      )}s). Please trim your video clip.`,
    };
  }
  return { valid: true };
}

/**
 * Validates file size for media uploads.
 */
export function validateMediaFileSize(
  sizeBytes: number,
  isAudioVideo: boolean
): { readonly valid: boolean; readonly error?: string } {
  const maxBytes = isAudioVideo ? MAX_VIDEO_FILE_SIZE_BYTES : MAX_IMAGE_FILE_SIZE_BYTES;
  const maxMb = maxBytes / (1024 * 1024);

  if (sizeBytes > maxBytes) {
    const detectedMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds the ${maxMb}MB limit (detected: ${detectedMb}MB).`,
    };
  }
  return { valid: true };
}

/**
 * Checks whether a MIME type is a supported video format.
 */
export function isSupportedVideoMime(mimeType: string): boolean {
  const clean = mimeType.trim().toLowerCase();
  return (SUPPORTED_VIDEO_MIME_TYPES as readonly string[]).includes(clean);
}

/**
 * Checks whether a MIME type is a supported image format.
 */
export function isSupportedImageMime(mimeType: string): boolean {
  const clean = mimeType.trim().toLowerCase();
  return (SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(clean);
}

/**
 * Detects whether a file is a video based on MIME type or filename extension.
 */
export function isVideoMedia(mimeType?: string, fileName?: string): boolean {
  if (mimeType && isSupportedVideoMime(mimeType)) {
    return true;
  }
  if (fileName) {
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    return (SUPPORTED_VIDEO_EXTENSIONS as readonly string[]).includes(ext);
  }
  return false;
}
