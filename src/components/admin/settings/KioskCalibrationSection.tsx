'use client';

import React from 'react';
import type { DisplayResolution } from '@/types/index';

export interface KioskCalibrationSectionProps {
  readonly displayResolution: DisplayResolution;
  readonly setDisplayResolution: (val: DisplayResolution) => void;
  readonly overscanMarginPercent?: number | undefined;
  readonly setOverscanMarginPercent?: ((val: number) => void) | undefined;
  readonly clockShowSeconds?: boolean | undefined;
  readonly setClockShowSeconds?: ((val: boolean) => void) | undefined;
  readonly clockTimeFormat?: '12h' | '24h' | undefined;
  readonly setClockTimeFormat?: ((val: '12h' | '24h') => void) | undefined;
  readonly markDirty: () => void;
}

/**
 * Screen resolution calibration, TV overscan margin with live 16:9 frame simulation,
 * and display clock precision (seconds / 24h format).
 */
export function KioskCalibrationSection({
  displayResolution,
  setDisplayResolution,
  overscanMarginPercent = 0,
  setOverscanMarginPercent,
  clockShowSeconds = false,
  setClockShowSeconds,
  clockTimeFormat = '12h',
  setClockTimeFormat,
  markDirty,
}: KioskCalibrationSectionProps) {
  return (
    <div className="space-y-4 pt-3 border-t border-[var(--admin-border)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Screen Resolution Calibration</label>
            <select
              value={displayResolution}
              onChange={(e) => {
                setDisplayResolution(e.target.value as DisplayResolution);
                markDirty();
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
            >
              <option value="1080p">Standard 1080p (Universal 16:9 Auto-Scale - Recommended)</option>
              <option value="4k">4K Ultra HD (3840 × 2160 Auto-Fitted)</option>
              <option value="1600x900">HD+ (1600 × 900 Auto-Fitted)</option>
              <option value="720p">720p HD (1280 × 720 Auto-Fitted)</option>
              <option value="auto">Auto / Dynamic Viewport (Auto-Fitted)</option>
            </select>
            <p className="text-[11px] text-[var(--admin-text-muted)]">
              Standardizes on universal 1080p canvas and automatically scales via GPU matrix to fit any 720p, 1080p, 1440p, 4K, or 8K TV.
            </p>
          </div>

          {setOverscanMarginPercent && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">TV Overscan Safe-Zone Margin</label>
                <span className="text-[11px] font-mono font-semibold text-[var(--admin-text-muted)]">
                  {overscanMarginPercent === 0 ? '0% (Full Bleed)' : `${overscanMarginPercent}% Inset`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { val: 0, label: '0% (Full Bleed)' },
                  { val: 2, label: '2% Safe Margin' },
                  { val: 4, label: '4% Deep Margin' },
                ] as const).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setOverscanMarginPercent(opt.val);
                      markDirty();
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${
                      overscanMarginPercent === opt.val
                        ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] font-semibold shadow-xs'
                        : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[var(--admin-text-muted)]">
                Insets the 1080p canvas slightly to prevent television bezels or HDMI overscan from cropping outer edges.
              </p>
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/70 space-y-2 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between text-[10px] text-[var(--admin-text-muted)] font-mono">
            <span>TV Border Simulation</span>
            <span>1920 × 1080</span>
          </div>
          <div className="relative w-full max-w-[260px] aspect-video rounded-xl bg-slate-950 border-2 border-slate-700 shadow-md flex items-center justify-center p-1.5 overflow-hidden">
            <div
              className="w-full h-full rounded border border-dashed border-emerald-400/90 bg-emerald-500/15 flex flex-col items-center justify-center transition-all duration-200"
              style={{
                transform: `scale(${1 - (overscanMarginPercent || 0) * 0.04})`,
              }}
            >
              <span className="text-[9px] font-mono font-bold text-emerald-400">
                {overscanMarginPercent === 0 ? 'Full Bleed (0%)' : `Safe Margin (${overscanMarginPercent}%)`}
              </span>
              <span className="text-[8px] text-emerald-500/80">Active Content</span>
            </div>
          </div>
          <div className="w-8 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>

      {setClockShowSeconds && setClockTimeFormat && (
        <div className="pt-3 border-t border-[var(--admin-border)] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
            <div>
              <span className="text-xs font-semibold text-[var(--admin-text-secondary)] block">Show Seconds on Clock</span>
              <span className="text-[10px] text-[var(--admin-text-muted)]">Precision ticking for Iqamah countdowns</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(clockShowSeconds)}
              onChange={(e) => {
                setClockShowSeconds(e.target.checked);
                markDirty();
              }}
              className="w-4 h-4 accent-[var(--admin-btn-primary-bg)] cursor-pointer rounded"
            />
          </div>
          <div className="p-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--admin-text-secondary)]">Clock Time Format</span>
              <span className="text-[10px] font-mono text-[var(--admin-text-muted)]">
                {clockTimeFormat === '24h' ? '24h Military' : '12h AM/PM'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
              {(['12h', '24h'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    setClockTimeFormat(fmt);
                    markDirty();
                  }}
                  className={`py-1.5 rounded-lg border font-semibold text-center transition cursor-pointer ${
                    (clockTimeFormat ?? '12h') === fmt
                      ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] shadow-xs'
                      : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                  }`}
                >
                  {fmt === '12h' ? '12-Hour (AM/PM)' : '24-Hour (23:59)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

