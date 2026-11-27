'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { EyeOff } from 'lucide-react';
import type { QrPosition } from '@/types/index';

interface StudioStageQrOverlayProps {
  readonly isVisible: boolean;
  readonly hasQr: boolean;
  readonly qrUrl: string;
  readonly qrLabel: string;
  readonly qrPosition: QrPosition;
  readonly onHidePreviewQr: () => void;
}

function getQrOverlayStyle(pos: QrPosition = 'bottom-left'): React.CSSProperties {
  switch (pos) {
    case 'top-left':
      return { top: 12, left: 12 };
    case 'top-center':
      return { top: 12, left: '50%', transform: 'translateX(-50%)' };
    case 'top-right':
      return { top: 12, right: 12 };
    case 'bottom-center':
      return { bottom: 12, left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-right':
      return { bottom: 12, right: 12 };
    case 'bottom-left':
    default:
      return { bottom: 12, left: 12 };
  }
}

/** Floating interactive QR registration badge preview overlaid on the 16:9 stage canvas. */
export function StudioStageQrOverlay({
  isVisible,
  hasQr,
  qrUrl,
  qrLabel,
  qrPosition,
  onHidePreviewQr,
}: StudioStageQrOverlayProps) {
  if (!isVisible || !hasQr) return null;

  return (
    <div
      style={getQrOverlayStyle(qrPosition)}
      className="group absolute z-50 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-2.5 shadow-2xl flex items-center space-x-2.5 max-w-[260px] transition-all duration-300 pointer-events-auto"
    >
      <div className="bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
        <QRCodeSVG value={qrUrl?.trim() || 'https://mosque.org'} size={44} level="M" fgColor="#000000" bgColor="#ffffff" />
      </div>
      <div className="min-w-0 pr-1 text-left flex-1">
        <span className="text-[11px] font-extrabold text-white block truncate leading-tight">
          {qrLabel?.trim() || 'Scan to Register'}
        </span>
        <span className="text-[9px] text-neutral-300 font-mono block truncate mt-0.5">
          {qrUrl?.trim() ? qrUrl.trim().replace(/^https?:\/\//i, '') : 'mosque.org/register'}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onHidePreviewQr();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-black/80 hover:bg-black text-neutral-300 hover:text-white transition-opacity border border-white/20 cursor-pointer shrink-0"
        title="Hide QR in preview while editing (keeps QR on saved poster)"
        aria-label="Hide QR in preview"
      >
        <EyeOff className="w-3 h-3" />
      </button>
    </div>
  );
}
