'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { QrPosition } from '@/types/index';
import { QrPositionSelector } from './QrPositionSelector';

export interface PosterQrConfigSectionProps {
  readonly subtitle?: string | undefined;
  readonly urlLabelText?: string | undefined;
  readonly urlPlaceholder?: string | undefined;
  readonly labelPlaceholder?: string | undefined;
  readonly hasQr: boolean;
  readonly onChangeHasQr: (val: boolean) => void;
  readonly qrUrl: string;
  readonly onChangeQrUrl: (val: string) => void;
  readonly qrLabel: string;
  readonly onChangeQrLabel: (val: string) => void;
  readonly qrPosition: QrPosition;
  readonly onChangeQrPosition: (pos: QrPosition) => void;
  readonly isEligibleForQr?: boolean | undefined;
  readonly isVideo?: boolean | undefined;
  readonly activeTotalDwell?: number | undefined;
  readonly minLoopsRequiredForQr?: number | undefined;
  readonly disabled?: boolean | undefined;
}

export function PosterQrConfigSection({
  subtitle,
  urlLabelText = 'Target URL',
  urlPlaceholder = 'https://example.com/register',
  labelPlaceholder = 'e.g., Scan to Register, Donate Now',
  hasQr,
  onChangeHasQr,
  qrUrl,
  onChangeQrUrl,
  qrLabel,
  onChangeQrLabel,
  qrPosition,
  onChangeQrPosition,
  isEligibleForQr = true,
  isVideo = false,
  activeTotalDwell = 0,
  minLoopsRequiredForQr = 1,
  disabled = false,
}: PosterQrConfigSectionProps) {
  return (
    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-sm text-[var(--admin-text-primary)] block">Attach Action QR Code</span>
          {subtitle && <span className="text-xs text-[var(--admin-text-muted)]">{subtitle}</span>}
        </div>
        <input
          type="checkbox"
          checked={hasQr && isEligibleForQr}
          disabled={!isEligibleForQr}
          onChange={(e) => onChangeHasQr(e.target.checked)}
          className="w-4 h-4 accent-[var(--admin-tab-active-border)] rounded cursor-pointer disabled:opacity-40"
        />
      </div>

      {isVideo && !isEligibleForQr && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>QR Code Disabled:</strong> Video on-screen time must be at least 10 seconds for attendees to scan (current: {activeTotalDwell}s). Set repeat count to at least <strong>{minLoopsRequiredForQr} loops</strong> to enable adding a QR code.
          </span>
        </div>
      )}

      {hasQr && isEligibleForQr && (
        <div className="space-y-3 pt-3 border-t border-[var(--admin-border)]">
          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">{urlLabelText}</label>
            <input type="url" value={qrUrl} onChange={(e) => onChangeQrUrl(e.target.value)} placeholder={urlPlaceholder} className="w-full px-3.5 py-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">Action Label</label>
            <input type="text" value={qrLabel} onChange={(e) => onChangeQrLabel(e.target.value)} placeholder={labelPlaceholder} className="w-full px-3.5 py-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]" />
          </div>
          <div className="pt-2 border-t border-[var(--admin-border)]">
            <QrPositionSelector value={qrPosition} onChange={onChangeQrPosition} disabled={disabled} />
          </div>
        </div>
      )}
    </div>
  );
}

