'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import { getQrScheduleStatus, validateQrSchedule } from '@/lib/posters/qr-schedule';
import { toLocalDatetimeString, fromLocalDatetimeString } from '@/lib/utils/time';

export interface PosterQrScheduleSectionProps {
  readonly qrUrl: string;
  readonly qrStartAt?: string | null | undefined;
  readonly onChangeQrStartAt: (val: string | null) => void;
  readonly qrEndAt?: string | null | undefined;
  readonly onChangeQrEndAt: (val: string | null) => void;
  readonly venueTimezone?: string | undefined;
  readonly layoutMode?: 'grid' | 'stacked' | undefined;
}

export function PosterQrScheduleSection({
  qrUrl,
  qrStartAt,
  onChangeQrStartAt,
  qrEndAt,
  onChangeQrEndAt,
  venueTimezone,
  layoutMode = 'grid',
}: PosterQrScheduleSectionProps) {
  const hasCustomSchedule = Boolean(qrStartAt || qrEndAt);
  const [isOpen, setIsOpen] = useState<boolean>(hasCustomSchedule);

  const localStart = qrStartAt ? toLocalDatetimeString(qrStartAt) : '';
  const localEnd = qrEndAt ? toLocalDatetimeString(qrEndAt) : '';

  const validation = validateQrSchedule(qrStartAt, qrEndAt);
  const statusInfo = getQrScheduleStatus(
    { qr_url: qrUrl, qr_start_at: qrStartAt, qr_end_at: qrEndAt },
    new Date(),
    venueTimezone
  );

  const handleStartChange = (val: string) => {
    if (!val) {
      onChangeQrStartAt(null);
    } else {
      onChangeQrStartAt(fromLocalDatetimeString(val));
    }
  };

  const handleEndChange = (val: string) => {
    if (!val) {
      onChangeQrEndAt(null);
    } else {
      onChangeQrEndAt(fromLocalDatetimeString(val));
    }
  };

  const handleClearSchedule = () => {
    onChangeQrStartAt(null);
    onChangeQrEndAt(null);
  };

  return (
    <div className="pt-2 border-t border-[var(--admin-border)]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1 text-xs font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition-colors cursor-pointer group"
      >
        <div className="flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-[var(--admin-text-muted)] group-hover:text-[var(--admin-text-primary)]" />
          <span>Advanced QR Code Availability</span>
          {hasCustomSchedule && (
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                statusInfo.color === 'emerald'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : statusInfo.color === 'blue'
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  : statusInfo.color === 'amber'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}
            >
              {statusInfo.shortBadge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 p-3 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] space-y-3 animate-fadeIn">
          <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
            By default, the QR code is always visible while the slide is on-screen. Configure a start and finish window if the link should unlock or hide at specific times.
          </p>

          <div className={layoutMode === 'stacked' ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--admin-text-secondary)] flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-[var(--admin-text-muted)]" />
                  <span>Available From</span>
                </label>
                {qrStartAt && (
                  <button
                    type="button"
                    onClick={() => onChangeQrStartAt(null)}
                    className="text-[10px] text-[var(--admin-text-muted)] hover:text-red-400 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="datetime-local"
                value={localStart}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
              />
              <span className="text-[10px] text-[var(--admin-text-muted)] block mt-0.5">
                Optional: Shows QR code starting on this date/time
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--admin-text-secondary)] flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-[var(--admin-text-muted)]" />
                  <span>Available Until</span>
                </label>
                {qrEndAt && (
                  <button
                    type="button"
                    onClick={() => onChangeQrEndAt(null)}
                    className="text-[10px] text-[var(--admin-text-muted)] hover:text-red-400 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="datetime-local"
                value={localEnd}
                onChange={(e) => handleEndChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
              />
              <span className="text-[10px] text-[var(--admin-text-muted)] block mt-0.5">
                Optional: Hides QR code after this date/time
              </span>
            </div>
          </div>

          {!validation.valid && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validation.error}</span>
            </div>
          )}

          {validation.valid && hasCustomSchedule && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[var(--admin-text-secondary)]">
                Status:{' '}
                <strong className={`font-semibold ${statusInfo.color === 'amber' ? 'text-amber-500' : 'text-[var(--admin-text-primary)]'}`}>
                  {statusInfo.label}
                </strong>
              </span>
              <button
                type="button"
                onClick={handleClearSchedule}
                className="text-[11px] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] underline cursor-pointer"
              >
                Reset to Always Active
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

