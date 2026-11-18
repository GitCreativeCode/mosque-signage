'use client';

import React from 'react';
import type { QrPosition } from '@/types/index';
import { Eye, EyeOff } from 'lucide-react';
import { QrPositionSelector } from '../QrPositionSelector';

interface StudioQrTabProps {
  readonly hasQr: boolean;
  readonly qrUrl: string;
  readonly qrLabel: string;
  readonly qrPosition: QrPosition;
  readonly showPreviewQr: boolean;
  readonly onChangeHasQr: (val: boolean) => void;
  readonly onChangeQrUrl: (val: string) => void;
  readonly onChangeQrLabel: (val: string) => void;
  readonly onChangeQrPosition: (pos: QrPosition) => void;
  readonly onTogglePreviewQr: () => void;
}

/** Inspector tab for attaching a corner Action QR code card and controlling preview visibility. */
export function StudioQrTab({
  hasQr,
  qrUrl,
  qrLabel,
  qrPosition,
  showPreviewQr,
  onChangeHasQr,
  onChangeQrUrl,
  onChangeQrLabel,
  onChangeQrPosition,
  onTogglePreviewQr,
}: StudioQrTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">Action QR Code</h3>
          <p className="text-[11px] text-[var(--admin-text-muted)]">Display a scannable registration link on screen</p>
        </div>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={hasQr}
            onChange={(e) => onChangeHasQr(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-[var(--admin-surface)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--admin-btn-primary-bg)] relative border border-[var(--admin-border)]" />
        </label>
      </div>

      {hasQr && (
        <div className="p-3.5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">Destination URL</label>
            <input
              type="url"
              value={qrUrl}
              onChange={(e) => onChangeQrUrl(e.target.value)}
              placeholder="https://mosque.org/register"
              className="w-full px-3 py-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:border-[var(--admin-tab-active-border)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">Action Callout Label</label>
            <input
              type="text"
              value={qrLabel}
              onChange={(e) => onChangeQrLabel(e.target.value)}
              placeholder="e.g. Scan to Register"
              className="w-full px-3 py-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:border-[var(--admin-tab-active-border)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">On-Screen Placement Corner</label>
            <QrPositionSelector value={qrPosition} onChange={onChangeQrPosition} />
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)]">
            <div>
              <span className="font-semibold text-xs block text-[var(--admin-text-primary)]">Canvas Preview</span>
              <span className="text-[10px] text-[var(--admin-text-muted)] block">
                {showPreviewQr ? 'QR card is shown on canvas' : 'Hidden in preview for editing (still saved to poster)'}
              </span>
            </div>
            <button
              type="button"
              onClick={onTogglePreviewQr}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                showPreviewQr
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] shadow-sm ring-1 ring-[var(--admin-tab-active-border)]'
                  : 'border-amber-400/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
              }`}
            >
              {showPreviewQr ? <><Eye className="w-3.5 h-3.5" /><span>Visible</span></> : <><EyeOff className="w-3.5 h-3.5" /><span>Hidden</span></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

