'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import type { DisplayResolution, MiniPrayerPillPosition, SidebarMode, SilenceScreenAccentTheme } from '@/types/index';
import { KioskCalibrationSection } from './KioskCalibrationSection';

const PILL_CORNERS: ReadonlyArray<{ readonly id: MiniPrayerPillPosition; readonly label: string }> = [
  { id: 'bottom-right', label: 'Bottom Right (Default)' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'top-left', label: 'Top Left' },
];

const SILENCE_THEMES: ReadonlyArray<{ readonly id: SilenceScreenAccentTheme; readonly label: string; readonly dotClass: string }> = [
  { id: 'green', label: 'Mosque Green', dotClass: 'bg-green-500' },
  { id: 'amber', label: 'Warm Amber', dotClass: 'bg-amber-400' },
  { id: 'teal', label: 'Cyan Teal', dotClass: 'bg-teal-400' },
  { id: 'white', label: 'Monochrome', dotClass: 'bg-white border border-neutral-400 dark:border-neutral-500 shadow-xs' },
];

export interface KioskAdvancedOverlaysCardProps {
  readonly sidebarMode: SidebarMode;
  readonly showMiniPrayerPill: boolean;
  readonly setShowMiniPrayerPill: (val: boolean) => void;
  readonly showPrayerSilenceOverlay: boolean;
  readonly setShowPrayerSilenceOverlay: (val: boolean) => void;
  readonly silenceScreenSubtitle?: string | undefined;
  readonly setSilenceScreenSubtitle?: ((val: string) => void) | undefined;
  readonly silenceScreenAccentTheme?: SilenceScreenAccentTheme | undefined;
  readonly setSilenceScreenAccentTheme?: ((val: SilenceScreenAccentTheme) => void) | undefined;
  readonly miniPrayerPillPosition: MiniPrayerPillPosition;
  readonly setMiniPrayerPillPosition: (val: MiniPrayerPillPosition) => void;
  readonly qrReadDelay: number;
  readonly setQrReadDelay: (val: number) => void;
  readonly setRememberedPeriodicDelay: (val: number) => void;
  readonly startingNowDuration: number;
  readonly setStartingNowDuration: (val: number) => void;
  readonly displayResolution: DisplayResolution;
  readonly setDisplayResolution: (val: DisplayResolution) => void;
  readonly overscanMarginPercent: number;
  readonly setOverscanMarginPercent?: ((val: number) => void) | undefined;
  readonly clockShowSeconds?: boolean | undefined;
  readonly setClockShowSeconds?: ((val: boolean) => void) | undefined;
  readonly clockTimeFormat?: '12h' | '24h' | undefined;
  readonly setClockTimeFormat?: ((val: '12h' | '24h') => void) | undefined;
  readonly isPwaInstalled: boolean;
  readonly isPwaStandalone: boolean;
  readonly onOpenPwaModal: () => void;
  readonly markDirty: () => void;
}

export function KioskAdvancedOverlaysCard(props: KioskAdvancedOverlaysCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden shadow-sm">
      <button type="button" onClick={() => setIsOpen((p) => !p)} className="w-full p-5 text-left flex items-center justify-between hover:bg-[var(--admin-surface)]/40 transition cursor-pointer">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-primary)]">Overlays &amp; Advanced Timers</h4>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
            Mini countdown badge, QR entrance delays, congregation silence window, and resolution calibration.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-[var(--admin-text-muted)] hidden sm:inline">{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--admin-text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--admin-text-muted)]" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-6 pt-2 border-t border-[var(--admin-border)] space-y-6 animate-fadeIn">
          <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <span className="text-xs font-bold text-[var(--admin-text-primary)] block">Floating Mini Prayer Countdown Pill</span>
                <p className="text-[11px] text-[var(--admin-text-muted)]">Displays a subtle floating badge on the broadcast screen showing the upcoming prayer countdown.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" checked={props.showMiniPrayerPill} onChange={(e) => { props.setShowMiniPrayerPill(e.target.checked); props.markDirty(); }} className="sr-only peer" />
                <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-btn-primary-bg)]" />
              </label>
            </div>
            {props.showMiniPrayerPill && (
              <div className="pt-2 border-t border-[var(--admin-border)] space-y-1.5 animate-fadeIn">
                <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Pill Screen Corner Placement</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PILL_CORNERS.map((pos) => (
                    <button key={pos.id} type="button" onClick={() => { props.setMiniPrayerPillPosition(pos.id); props.markDirty(); }} className={`py-2 px-2 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${props.miniPrayerPillPosition === pos.id ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] font-semibold shadow-sm' : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <span className="text-xs font-bold text-[var(--admin-text-primary)] block">Congregation Silence Screen</span>
                <p className="text-[11px] text-[var(--admin-text-muted)]">
                  Displays a full-screen reverence reminder (&quot;Please switch mobile phones to silent&quot;) and pauses poster slides during congregational prayer. When disabled (default), slides rotate continuously without interruption.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={props.showPrayerSilenceOverlay}
                  onChange={(e) => {
                    props.setShowPrayerSilenceOverlay(e.target.checked);
                    props.markDirty();
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-btn-primary-bg)]" />
              </label>
            </div>

            {props.showPrayerSilenceOverlay && (
              <div className="pt-3 border-t border-[var(--admin-border)] space-y-4 animate-fadeIn">
                {/* Accent Color Preset */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Silence Screen Accent Theme</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SILENCE_THEMES.map((t) => {
                      const activeTheme = props.silenceScreenAccentTheme ?? 'green';
                      const isSelected = activeTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            props.setSilenceScreenAccentTheme?.(t.id);
                            props.markDirty();
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center justify-center space-x-2 ${
                            isSelected
                              ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] font-semibold shadow-sm'
                              : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${t.dotClass}`} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Subtitle / Guidance */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Reverence Subtitle Guidance</label>
                    {props.silenceScreenSubtitle && props.silenceScreenSubtitle !== 'Please switch mobile phones to silent' && (
                      <button
                        type="button"
                        onClick={() => {
                          props.setSilenceScreenSubtitle?.('Please switch mobile phones to silent');
                          props.markDirty();
                        }}
                        className="text-[10px] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
                      >
                        Reset to default
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={props.silenceScreenSubtitle ?? 'Please switch mobile phones to silent'}
                    onChange={(e) => {
                      props.setSilenceScreenSubtitle?.(e.target.value);
                      props.markDirty();
                    }}
                    placeholder="Please switch mobile phones to silent"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                  />
                  <p className="text-[11px] text-[var(--admin-text-muted)]">
                    Guidance shown during prayer. (For Friday Khutbah services without Salah time, &ldquo;listen attentively&rdquo; is automatically shown).
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">QR Code Entrance Delay</label>
                <span className="text-[11px] font-mono font-semibold text-[var(--admin-text-muted)]">{props.sidebarMode === 'always_open' ? '0s (Instant)' : `+${props.qrReadDelay}s`}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0, 3, 5].map((sec) => {
                  const isAlways = props.sidebarMode === 'always_open';
                  const selected = isAlways ? sec === 0 : props.qrReadDelay === sec;
                  return (
                    <button key={sec} type="button" disabled={isAlways} onClick={() => { props.setQrReadDelay(sec); if (sec > 0) props.setRememberedPeriodicDelay(sec); props.markDirty(); }} className={`py-2 px-3 rounded-xl text-xs font-medium border transition text-center ${isAlways ? (sec === 0 ? 'bg-[var(--admin-btn-primary-bg)]/60 text-[var(--admin-btn-primary-text)] border-transparent cursor-not-allowed opacity-80' : 'bg-[var(--admin-surface)]/40 border-[var(--admin-border)] text-[var(--admin-text-muted)]/40 cursor-not-allowed') : selected ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] font-semibold shadow-sm cursor-pointer' : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] cursor-pointer'}`}>
                      {sec === 0 ? '0s (Instant)' : `${sec}s`}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[var(--admin-text-muted)]">
                {props.sidebarMode === 'always_open' ? 'In split-screen mode, QR code displays immediately (0s).' : 'Seconds before poster QR appears, allowing attendees to view the full flyer first.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Congregation Silence Window</label>
                <span className="text-[11px] font-mono font-semibold text-[var(--admin-text-muted)]">{props.startingNowDuration === 0 ? 'Disabled' : `${props.startingNowDuration} min`}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 5, 10, 15, 20].map((mins) => (
                  <button key={mins} type="button" onClick={() => { props.setStartingNowDuration(mins); props.markDirty(); }} className={`py-2 px-1 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${props.startingNowDuration === mins ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] font-semibold shadow-sm' : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
                    {mins === 0 ? '0m' : `${mins}m`}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[var(--admin-text-muted)]">Minutes the display maintains congregational prayer silence after Iqamah.</p>
            </div>
          </div>

          <KioskCalibrationSection
            displayResolution={props.displayResolution}
            setDisplayResolution={props.setDisplayResolution}
            overscanMarginPercent={props.overscanMarginPercent}
            setOverscanMarginPercent={props.setOverscanMarginPercent}
            clockShowSeconds={props.clockShowSeconds}
            setClockShowSeconds={props.setClockShowSeconds}
            clockTimeFormat={props.clockTimeFormat}
            setClockTimeFormat={props.setClockTimeFormat}
            markDirty={props.markDirty}
          />

          <div className="pt-3 border-t border-[var(--admin-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[var(--admin-text-secondary)]">Standalone Kiosk Desktop App (PWA)</div>
                <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                  {props.isPwaStandalone ? 'You are running MosqueSignage inside the standalone kiosk desktop application.' : props.isPwaInstalled ? 'MosqueSignage is installed on this device. Click to open the kiosk window.' : 'Install MosqueSignage directly to this TV or desktop without browser bars or store downloads.'}
                </p>
              </div>
              <button
                type="button"
                disabled={props.isPwaStandalone}
                onClick={() => {
                  if (props.isPwaStandalone) return;
                  if (props.isPwaInstalled) { window.open('/display', '_blank', 'noopener,noreferrer'); return; }
                  props.onOpenPwaModal();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 shrink-0 shadow-sm ${props.isPwaStandalone ? 'opacity-40 cursor-not-allowed border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)]' : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-primary)] cursor-pointer active:scale-95'}`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>{props.isPwaStandalone ? 'App Already Installed (Active Window)' : props.isPwaInstalled ? 'Open Installed App' : 'Install Kiosk App'}</span>
              </button>
            </div>
          </div>
      )}
    </div>
  );
}

