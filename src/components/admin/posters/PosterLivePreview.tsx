'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, Tv, Columns } from 'lucide-react';

import type { QrPosition } from '@/types/index';

export interface PosterLivePreviewProps {
  readonly imageUrl?: string | null | undefined;
  readonly thumbnailUrl?: string | null | undefined;
  readonly isVideo?: boolean | undefined;
  readonly videoLoopCount?: number | undefined;
  readonly title: string;
  readonly durationSeconds: number;
  readonly hasQr?: boolean | undefined;
  readonly qrUrl?: string | null | undefined;
  readonly qrLabel?: string | null | undefined;
  readonly qrPosition?: QrPosition | null | undefined;
  readonly onReplaceImage?: (() => void) | undefined;
  readonly onAddMore?: (() => void) | undefined;
}

function getPreviewPositionClass(pos: QrPosition = 'bottom-left'): string {
  switch (pos) {
    case 'top-left':
      return 'top-2.5 left-2.5';
    case 'top-center':
      return 'top-2.5 left-1/2 -translate-x-1/2';
    case 'top-right':
      return 'top-9 right-2.5'; // sits cleanly below top-right duration pill
    case 'bottom-center':
      return 'bottom-2.5 left-1/2 -translate-x-1/2';
    case 'bottom-right':
      return 'bottom-2.5 right-2.5';
    case 'bottom-left':
    default:
      return 'bottom-2.5 left-2.5';
  }
}

/**
 * Miniature 16:9 Live Kiosk Display Preview
 * Accurately simulates the TV canvas:
 * 1. Dual-layer containment (sharp foreground + blurred/dimmed background)
 * 2. Video motion playback with hardware-friendly static backdrop
 * 3. Dynamic 6-spot placement QR card (Option A)
 * 4. Dwell duration badge with repetition multiplier
 */
export function PosterLivePreview({
  imageUrl,
  thumbnailUrl,
  isVideo = false,
  videoLoopCount = 1,
  title,
  durationSeconds,
  hasQr: hasQrProp,
  qrUrl,
  qrLabel,
  qrPosition = 'bottom-left',
  onReplaceImage,
  onAddMore,
}: PosterLivePreviewProps) {
  const showQr = hasQrProp !== undefined
    ? hasQrProp
    : Boolean(qrUrl && qrUrl.trim().length > 0);

  const backdropSrc = thumbnailUrl || imageUrl;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
          Live Display Preview (16:9 Broadcast)
        </label>
        <span className="text-[var(--admin-text-muted)] font-mono text-[11px]">1920 × 1080 Aspect Ratio</span>
      </div>

      <div
        onClick={onReplaceImage}
        className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-neutral-950 border border-white/15 shadow-inner flex items-center justify-center select-none group ${
          onReplaceImage ? 'cursor-pointer hover:border-[var(--admin-tab-active-border)] transition-colors' : ''
        }`}
      >
        {imageUrl ? (
          <>
            {/* Blurred Ambient Backdrop Fill */}
            {backdropSrc && (
              <img
                src={backdropSrc}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35"
              />
            )}

            {/* Sharp Foreground Media */}
            {isVideo ? (
              <video
                src={imageUrl}
                poster={thumbnailUrl ?? undefined}
                muted
                playsInline
                autoPlay
                loop
                className="relative z-10 w-full h-full object-contain drop-shadow-2xl pointer-events-none"
              />
            ) : (
              <img
                src={imageUrl}
                alt={title || 'Preview'}
                className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
              />
            )}

            {/* Top-Left Controls: Replace Image/Video & Add More Media (Split Screen) */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center space-x-2">
              {onReplaceImage && (
                <div className="bg-black/75 hover:bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-medium text-white border border-white/15 shadow-lg flex items-center space-x-1.5 transition">
                  <span>{isVideo ? 'Click to change video clip' : 'Click to change poster image'}</span>
                </div>
              )}
              {onAddMore && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddMore();
                  }}
                  className="bg-black/75 hover:bg-black/90 active:scale-95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white border border-white/20 shadow-lg flex items-center space-x-1.5 transition cursor-pointer"
                  title="Combine multiple images into a split-screen slide"
                >
                  <Columns className="w-3 h-3 text-[var(--admin-text-muted)]" />
                  <span>+ Add More (Split Screen)</span>
                </button>
              )}
            </div>

            {/* Top-Right Dwell Duration Badge */}
            <div className="absolute top-2.5 right-2.5 z-20 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono text-white/90 border border-white/15 flex items-center space-x-1.5 shadow-lg">
              <Clock className="w-3.5 h-3.5 text-white/70" />
              <span>
                {isVideo && videoLoopCount > 1
                  ? `${videoLoopCount}x • ${durationSeconds}s`
                  : `${durationSeconds}s`}
              </span>
            </div>

            {/* Pop-Out QR Card in Selected Placement Spot */}
            {showQr && (
              <div
                className={`absolute ${getPreviewPositionClass(
                  qrPosition ?? 'bottom-left'
                )} z-20 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-2xl flex items-center space-x-2.5 max-w-[220px] transition-all duration-300`}
              >
                <div className="bg-white p-1 rounded-lg shrink-0">
                  <QRCodeSVG
                    value={qrUrl?.trim() || 'https://mosque.org'}
                    size={38}
                    level="M"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
                <div className="min-w-0 pr-1 text-left">
                  <span className="text-[11px] font-extrabold text-white block truncate leading-tight">
                    {qrLabel?.trim() || 'Scan to Register'}
                  </span>
                  <span className="text-[9px] text-neutral-300 font-mono block truncate mt-0.5">
                    {qrUrl?.trim() ? qrUrl.trim().replace(/^https?:\/\//i, '') : 'mosque.org/register'}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 p-6 text-center text-[var(--admin-text-muted)]">
            <Tv className="w-8 h-8 opacity-40 text-[var(--admin-text-muted)]" />
            <p className="text-xs font-medium">Select an image or video to view live display preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
