import { describe, it, expect } from 'vitest';
import {
  calculateMaxLoops,
  calculateDefaultLoops,
  calculateTotalDwell,
  isQrEligible,
  calculateMinLoopsForQr,
  validateVideoDuration,
  validateMediaFileSize,
  isSupportedVideoMime,
  isSupportedImageMime,
  isVideoMedia,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_FILE_SIZE_BYTES,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from '@/lib/engine/video-engine';

describe('Video Looping & Media Validation Engine', () => {
  describe('calculateMaxLoops (Floor 60 / Duration Rule)', () => {
    it('calculates maximum allowed loops for short clips correctly', () => {
      expect(calculateMaxLoops(5)).toBe(12); // 12 * 5 = 60s
      expect(calculateMaxLoops(8)).toBe(7); // 7 * 8 = 56s
      expect(calculateMaxLoops(10)).toBe(6); // 6 * 10 = 60s
      expect(calculateMaxLoops(12)).toBe(5); // 5 * 12 = 60s
      expect(calculateMaxLoops(15)).toBe(4); // 4 * 15 = 60s
      expect(calculateMaxLoops(20)).toBe(3); // 3 * 20 = 60s
      expect(calculateMaxLoops(25)).toBe(2); // 2 * 25 = 50s
      expect(calculateMaxLoops(30)).toBe(2); // 2 * 30 = 60s
    });

    it('enforces single playthrough for clips exceeding 30 seconds', () => {
      expect(calculateMaxLoops(31)).toBe(1); // 2 * 31 = 62s > 60s
      expect(calculateMaxLoops(45)).toBe(1);
      expect(calculateMaxLoops(60)).toBe(1);
    });

    it('gracefully handles boundary and zero durations', () => {
      expect(calculateMaxLoops(0)).toBe(1);
      expect(calculateMaxLoops(-5)).toBe(1);
      expect(calculateMaxLoops(75)).toBe(1);
    });
  });

  describe('calculateDefaultLoops (Ergonomic Presets)', () => {
    it('assigns 4 repeats for sub-6s micro-clips', () => {
      expect(calculateDefaultLoops(5)).toBe(4); // 4 * 5 = 20s
      expect(calculateDefaultLoops(6)).toBe(4); // 4 * 6 = 24s
    });

    it('assigns 2 repeats for 7s to 12s clips', () => {
      expect(calculateDefaultLoops(8)).toBe(2); // 2 * 8 = 16s
      expect(calculateDefaultLoops(10)).toBe(2); // 2 * 10 = 20s
      expect(calculateDefaultLoops(12)).toBe(2); // 2 * 12 = 24s
    });

    it('assigns 1 repeat for clips longer than 12s', () => {
      expect(calculateDefaultLoops(15)).toBe(1);
      expect(calculateDefaultLoops(30)).toBe(1);
      expect(calculateDefaultLoops(45)).toBe(1);
    });

    it('respects calculateMaxLoops boundary ceiling', () => {
      expect(calculateDefaultLoops(25)).toBe(1);
      expect(calculateDefaultLoops(0)).toBe(1);
    });
  });

  describe('calculateTotalDwell', () => {
    it('computes exact total dwell in seconds', () => {
      expect(calculateTotalDwell(5, 4)).toBe(20);
      expect(calculateTotalDwell(8, 2)).toBe(16);
      expect(calculateTotalDwell(12.5, 2)).toBe(25);
    });

    it('handles non-positive inputs safely', () => {
      expect(calculateTotalDwell(0, 5)).toBe(0);
      expect(calculateTotalDwell(10, 0)).toBe(0);
      expect(calculateTotalDwell(-10, 2)).toBe(0);
    });
  });

  describe('isQrEligible (Scanning Viability Threshold >= 10s)', () => {
    it('rejects QR eligibility for single plays under 10 seconds', () => {
      expect(isQrEligible(5, 1)).toBe(false); // 5s < 10s
      expect(isQrEligible(8, 1)).toBe(false); // 8s < 10s
      expect(isQrEligible(9.9, 1)).toBe(false); // 9.9s < 10s
    });

    it('unlocks QR eligibility when looped to reach or exceed 10 seconds', () => {
      expect(isQrEligible(5, 2)).toBe(true); // 5 * 2 = 10s >= 10s
      expect(isQrEligible(5, 4)).toBe(true); // 5 * 4 = 20s
      expect(isQrEligible(8, 2)).toBe(true); // 8 * 2 = 16s >= 10s
    });

    it('immediately qualifies videos of 10 seconds or longer on single playthrough', () => {
      expect(isQrEligible(10, 1)).toBe(true);
      expect(isQrEligible(12, 1)).toBe(true);
      expect(isQrEligible(15, 1)).toBe(true);
      expect(isQrEligible(30, 1)).toBe(true);
    });
  });

  describe('calculateMinLoopsForQr', () => {
    it('computes the exact minimum loop count to unlock QR code capability', () => {
      expect(calculateMinLoopsForQr(5)).toBe(2); // 5 * 2 = 10s
      expect(calculateMinLoopsForQr(8)).toBe(2); // 8 * 2 = 16s
      expect(calculateMinLoopsForQr(4)).toBe(3); // 4 * 3 = 12s
      expect(calculateMinLoopsForQr(10)).toBe(1); // 10s
      expect(calculateMinLoopsForQr(15)).toBe(1);
    });
  });

  describe('validateVideoDuration', () => {
    it('approves videos within 60 seconds', () => {
      expect(validateVideoDuration(5).valid).toBe(true);
      expect(validateVideoDuration(30).valid).toBe(true);
      expect(validateVideoDuration(60).valid).toBe(true);
      expect(validateVideoDuration(60.4).valid).toBe(true); // small container tolerance
    });

    it('rejects videos exceeding 60 seconds with descriptive guidance', () => {
      const result = validateVideoDuration(65);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Video duration exceeds the 60-second digital signage maximum');
      expect(result.error).toContain('65s');
    });

    it('rejects zero or negative durations', () => {
      expect(validateVideoDuration(0).valid).toBe(false);
      expect(validateVideoDuration(-5).valid).toBe(false);
    });
  });

  describe('validateMediaFileSize', () => {
    it('validates video file size within 50MB limit', () => {
      const validSize = 25 * 1024 * 1024; // 25MB
      expect(validateMediaFileSize(validSize, true).valid).toBe(true);
    });

    it('rejects video files exceeding 50MB', () => {
      const oversized = 55 * 1024 * 1024; // 55MB
      const result = validateMediaFileSize(oversized, true);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds the 50MB limit');
    });

    it('validates image file size within 15MB limit', () => {
      const validImg = 10 * 1024 * 1024;
      expect(validateMediaFileSize(validImg, false).valid).toBe(true);

      const oversizedImg = 16 * 1024 * 1024;
      const result = validateMediaFileSize(oversizedImg, false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds the 15MB limit');
    });
  });

  describe('MIME & Container Recognition', () => {
    it('recognizes supported video containers and MIME types', () => {
      expect(isSupportedVideoMime('video/mp4')).toBe(true);
      expect(isSupportedVideoMime('video/webm')).toBe(true);
      expect(isSupportedVideoMime('video/quicktime')).toBe(true);
      expect(isSupportedVideoMime('video/ogg')).toBe(true);
      expect(isSupportedVideoMime('video/x-m4v')).toBe(true);

      expect(isSupportedVideoMime('video/avi')).toBe(false);
      expect(isSupportedVideoMime('video/x-matroska')).toBe(false);
      expect(isSupportedVideoMime('application/pdf')).toBe(false);
    });

    it('recognizes supported image types', () => {
      expect(isSupportedImageMime('image/png')).toBe(true);
      expect(isSupportedImageMime('image/jpeg')).toBe(true);
      expect(isSupportedImageMime('image/webp')).toBe(true);
      expect(isSupportedImageMime('image/gif')).toBe(false);
    });

    it('correctly classifies media type by extension or MIME', () => {
      expect(isVideoMedia('video/mp4', 'promo.mp4')).toBe(true);
      expect(isVideoMedia('video/webm', 'event.webm')).toBe(true);
      expect(isVideoMedia('video/quicktime', 'flyer.mov')).toBe(true);
      expect(isVideoMedia(undefined, 'clip.ogg')).toBe(true);
      expect(isVideoMedia('image/png', 'poster.png')).toBe(false);
      expect(isVideoMedia('image/webp', 'announcement.webp')).toBe(false);
    });
  });
});
