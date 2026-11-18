import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { QrPosition, MiniPrayerPillPosition } from '@/types/index';

export interface QrCardProps {
  readonly qrUrl?: string | null | undefined;
  readonly qrLabel?: string | null | undefined;
  readonly position?: QrPosition | null | undefined;
  readonly isVisible: boolean;
  readonly isPillVisible?: boolean | undefined;
  readonly pillPosition?: MiniPrayerPillPosition | undefined;
}

export function getPositionCoordinates(
  pos: QrPosition,
  isPillVisible: boolean = false,
  pillPosition: MiniPrayerPillPosition = 'bottom-right'
): { containerClass: string; isTop: boolean } {
  const isCornerCollision = isPillVisible && pos === pillPosition;

  switch (pos) {
    case 'top-left':
      return {
        containerClass: isCornerCollision ? 'top-44 left-8' : 'top-6 left-6',
        isTop: true,
      };
    case 'top-center':
      return { containerClass: 'top-6 left-1/2 -translate-x-1/2', isTop: true };
    case 'top-right':
      return {
        containerClass: isCornerCollision ? 'top-44 right-8' : 'top-6 right-6',
        isTop: true,
      };
    case 'bottom-center':
      return { containerClass: 'bottom-8 left-1/2 -translate-x-1/2', isTop: false };
    case 'bottom-right':
      return {
        containerClass: isCornerCollision ? 'bottom-24 right-8' : 'bottom-8 right-8',
        isTop: false,
      };
    case 'bottom-left':
    default:
      return {
        containerClass: isCornerCollision ? 'bottom-24 left-8' : 'bottom-8 left-8',
        isTop: false,
      };
  }
}

/**
 * Contextual QR Code Pop-Out Card
 * Supports Option A 6-spot placement grid (TL, TC, TR, BL, BC, BR).
 * Renders dynamically with smooth enter/exit animations and high legibility.
 */
export function QrCard({
  qrUrl,
  qrLabel,
  position = 'bottom-left',
  isVisible,
  isPillVisible = false,
  pillPosition = 'bottom-right',
}: QrCardProps) {
  if (!qrUrl) {
    return null;
  }

  const { containerClass, isTop } = getPositionCoordinates(
    position ?? 'bottom-left',
    isPillVisible,
    pillPosition
  );

  const transitionClass = isVisible
    ? 'translate-y-0 opacity-100 scale-100'
    : isTop
    ? '-translate-y-6 opacity-0 scale-95'
    : 'translate-y-6 opacity-0 scale-95';

  return (
    <div
      className={`absolute ${containerClass} z-30 transition-[transform,opacity] duration-500 ease-out transform-gpu pointer-events-none ${transitionClass}`}
    >
      <div className="bg-neutral-950/95 border border-white/20 p-4 rounded-xl shadow-2xl flex items-center space-x-4 max-w-[340px] backdrop-blur-md">
        {/* QR Code Container with High-Contrast White Background */}
        <div className="bg-white p-2 rounded-xl shadow shrink-0 flex items-center justify-center">
          <QRCodeSVG
            value={qrUrl}
            size={115}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>

        {/* Action Label & Short URL (No patronizing instructional text) */}
        <div className="flex flex-col justify-center space-y-1 overflow-hidden min-w-0">
          <h3 className="text-base font-bold text-white leading-snug line-clamp-2 tracking-tight">
            {qrLabel ?? 'Scan for Details'}
          </h3>
          <p className="text-xs text-neutral-400 font-mono truncate">
            {qrUrl.replace(/^https?:\/\//, '')}
          </p>
        </div>
      </div>
    </div>
  );
}
