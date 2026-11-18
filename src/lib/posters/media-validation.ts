/**
 * Binary Magic-Number Inspection & Format Verification
 * MosqueSignage (TV)
 *
 * Verifies leading header bytes of image and video streams to guarantee
 * genuine media types and prevent execution or storage of non-media payloads.
 */

export interface MagicValidationResult {
  readonly valid: boolean;
  readonly detectedType?: 'png' | 'jpeg' | 'webp' | 'mp4' | 'webm' | 'ogg' | undefined;
  readonly error?: string | undefined;
}

/**
 * Validates the leading magic bytes of a buffer against whitelisted image and video formats.
 */
export function validateMediaMagicNumbers(
  buffer: Buffer | Uint8Array,
  isVideo: boolean
): MagicValidationResult {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  if (buf.length < 4) {
    return {
      valid: false,
      error: 'File payload is too small to contain valid media headers.',
    };
  }

  if (!isVideo) {
    // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    ) {
      return { valid: true, detectedType: 'png' };
    }

    // 2. JPEG: FF D8 FF
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return { valid: true, detectedType: 'jpeg' };
    }

    // 3. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
    if (
      buf.length >= 12 &&
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return { valid: true, detectedType: 'webp' };
    }

    return {
      valid: false,
      error:
        'Invalid or corrupted image format. Magic bytes do not match a supported image format (PNG, JPEG, WebP).',
    };
  } else {
    // 1. MP4 / MOV: 'ftyp' or 'moov' at bytes 4-7
    if (buf.length >= 8) {
      const boxType = buf.subarray(4, 8).toString('ascii');
      if (boxType === 'ftyp' || boxType === 'moov') {
        return { valid: true, detectedType: 'mp4' };
      }
    }

    // 2. WebM: EBML header 1A 45 DF A3
    if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
      return { valid: true, detectedType: 'webm' };
    }

    // 3. Ogg: 'OggS'
    if (buf.subarray(0, 4).toString('ascii') === 'OggS') {
      return { valid: true, detectedType: 'ogg' };
    }

    return {
      valid: false,
      error:
        'Invalid or corrupted video container. Magic bytes do not match a supported video format (MP4, WebM, QuickTime, Ogg).',
    };
  }
}

