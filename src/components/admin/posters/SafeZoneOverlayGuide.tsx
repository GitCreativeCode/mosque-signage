'use client';

import React from 'react';
import type { QrPosition, MiniPrayerPillPosition } from '@/types/index';
import { QrCode, Clock, AlertCircle } from 'lucide-react';

export interface SafeZoneOverlayGuideProps {
  readonly isVisible: boolean;
  readonly qrUrl?: string | undefined;
  readonly qrPosition: QrPosition;
  readonly onQrPositionChange?: (pos: QrPosition) => void;
  readonly miniPillPosition?: MiniPrayerPillPosition | undefined;
  readonly slotCount?: number | undefined;
}

export function SafeZoneOverlayGuide({
  isVisible,
  qrUrl,
  qrPosition,
  onQrPositionChange,
  miniPillPosition = 'bottom-right',
  slotCount = 1,
}: SafeZoneOverlayGuideProps) {
  if (!isVisible) return null;

  const hasQr = Boolean(qrUrl?.trim());

  const getPositionClass = (pos: QrPosition) => {
    switch (pos) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
      default:
        return 'bottom-4 left-4';
    }
  };

  const getMiniPillPositionClass = (pos: MiniPrayerPillPosition) => {
    switch (pos) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none border-2 border-dashed border-amber-400/40 rounded-xl overflow-hidden bg-black/10">
      {/* Informational Safe Zone Badge at Top */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/60 text-amber-300 text-xs font-semibold shadow-lg flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        Safe Zone Visual Guide Active
      </div>

      {/* Mini Prayer Pill Position Simulator */}
      <div
        className={`absolute ${getMiniPillPositionClass(
          miniPillPosition
        )} px-3 py-1.5 rounded-full bg-emerald-950/85 border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-1.5`}
      >
        <Clock className="w-3.5 h-3.5 text-emerald-400" />
        Mini Prayer Pill Zone
      </div>

      {/* Dynamic QR Code Card Simulator */}
      {hasQr && (
        <div
          className={`absolute ${getPositionClass(
            qrPosition
          )} p-3 rounded-2xl bg-slate-900/90 border-2 border-cyan-400/70 text-cyan-200 text-xs font-bold shadow-2xl flex flex-col items-center gap-1 min-w-[130px]`}
        >
          <div className="flex items-center gap-1 text-cyan-300">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>QR Code Card</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">
            Safe Corner: {qrPosition}
          </span>
        </div>
      )}

      {/* Distance legibility advisory for high asset counts */}
      {slotCount >= 5 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-red-950/90 border border-red-500/60 text-red-300 text-xs font-semibold shadow-lg">
          Note: 5+ items may reduce legibility beyond 15 feet
        </div>
      )}
    </div>
  );
}

