'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { NoticeTheme, QrPosition } from '@/types/index';
import { getLiturgicalTheme } from '@/lib/posters/notice-themes';

function getPreviewPositionClass(pos: QrPosition = 'bottom-left'): string {
  switch (pos) {
    case 'top-left': return 'top-2.5 left-2.5';
    case 'top-center': return 'top-2.5 left-1/2 -translate-x-1/2';
    case 'top-right': return 'top-9 right-2.5';
    case 'bottom-center': return 'bottom-2.5 left-1/2 -translate-x-1/2';
    case 'bottom-right': return 'bottom-2.5 right-2.5';
    case 'bottom-left':
    default: return 'bottom-2.5 left-2.5';
  }
}

export interface NoticeBroadcastPreviewCardProps {
  readonly themeId: NoticeTheme;
  readonly headline: string;
  readonly description: string;
  readonly duration: number;
  readonly hasQr: boolean;
  readonly qrUrl: string;
  readonly qrLabel: string;
  readonly qrPosition: QrPosition;
}

export function NoticeBroadcastPreviewCard({
  themeId,
  headline,
  description,
  duration,
  hasQr,
  qrUrl,
  qrLabel,
  qrPosition,
}: NoticeBroadcastPreviewCardProps) {
  const currentTheme = getLiturgicalTheme(themeId);

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
          Live Display Preview
        </label>
      </div>
      <div
        className="relative w-full aspect-video rounded-2xl overflow-hidden border shadow-lg flex flex-col justify-between p-6 transition-colors duration-300"
        style={{ background: currentTheme.cssBackground, borderColor: `${currentTheme.borderAccent}60` }}
      >
        <div className="relative z-10 flex items-center justify-end">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-white/90 font-mono text-xs shadow-lg">
            <Clock className="w-3.5 h-3.5 text-white/70" />
            <span>{duration}s</span>
          </div>
        </div>

        <div className="relative z-10 my-auto space-y-2.5 px-2">
          <h3 className="text-lg md:text-xl font-bold tracking-tight text-white line-clamp-2 leading-tight break-words overflow-hidden">
            {headline || 'Notice Headline Appears Here'}
          </h3>
          <div className="w-12 h-1 rounded-full transition-colors duration-300" style={{ backgroundColor: currentTheme.borderAccent }} />
          <p className="text-xs md:text-sm text-white/85 line-clamp-4 leading-relaxed font-normal break-words overflow-hidden">
            {description || 'Notice message and announcement details will be rendered here in high contrast with broadcast readability across the prayer hall.'}
          </p>
        </div>

        {hasQr && (
          <div className={`absolute ${getPreviewPositionClass(qrPosition)} z-20 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl p-2 shadow-2xl flex items-center space-x-2.5 max-w-[220px] transition-all duration-300`}>
            <div className="bg-white p-1 rounded-lg shrink-0">
              <QRCodeSVG value={qrUrl.trim() || 'https://mosque.org'} size={38} level="M" fgColor="#000000" bgColor="#ffffff" />
            </div>
            <div className="min-w-0 pr-1 text-left">
              <p className="text-[10px] font-bold text-white leading-tight truncate">{qrLabel.trim() || 'Scan QR Code'}</p>
              <p className="text-[8px] font-mono text-neutral-300 truncate">{qrUrl.trim() || 'https://...'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

