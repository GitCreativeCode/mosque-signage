'use client';

import React, { useState } from 'react';
import { AlertTriangle, HelpCircle, Sliders } from 'lucide-react';
import type { TvControlProtocol } from '@/types/index';
import { PowerControlGuideModal } from './PowerControlGuideModal';

export interface PowerControlModeOption {
  readonly value: TvControlProtocol;
  readonly label: string;
  readonly description: string;
  readonly isLocalHostHardware: boolean;
}

export const POWER_CONTROL_MODE_OPTIONS: readonly PowerControlModeOption[] = [
  {
    value: 'software_blackout',
    label: 'Browser Blackout — All Displays (Recommended)',
    description:
      'Turns any connected /display screen pure black (#000000) with burn-in protection. Works on remote Smart TVs, tablets, Windows, macOS, and Raspberry Pi over Wi-Fi/LAN without triggering OS lock screens.',
    isLocalHostHardware: false,
  },
  {
    value: 'hybrid',
    label: 'Hybrid: Local Host Sleep + Browser Blackout (Local PC/Pi Only)',
    description:
      'Blacks out all browser displays AND sends HDMI-CEC (Raspberry Pi/Linux) or monitor sleep (Windows/Linux) to the screen physically plugged into this server.',
    isLocalHostHardware: true,
  },
  {
    value: 'cec_client',
    label: 'HDMI-CEC Physical TV Power (Linux / Raspberry Pi Only)',
    description:
      'Uses cec-client over HDMI to physically power off/on a TV plugged directly into a Raspberry Pi or Linux host, plus browser blackout.',
    isLocalHostHardware: true,
  },
  {
    value: 'dpms',
    label: 'PC Monitor Sleep / DPMS (Local Host PC Only)',
    description:
      'Puts the monitor physically attached to this server PC into sleep/standby (Windows/Linux X11), plus browser blackout. Does not power off remote TVs.',
    isLocalHostHardware: true,
  },
];

export interface PowerControlModePickerProps {
  readonly value: TvControlProtocol;
  readonly onChange: (protocol: TvControlProtocol) => void;
}

export function PowerControlModePicker({ value, onChange }: PowerControlModePickerProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const selectedOption =
    POWER_CONTROL_MODE_OPTIONS.find((opt) => opt.value === value) ?? POWER_CONTROL_MODE_OPTIONS[0]!;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="power-control-mode-select"
          className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] flex items-center space-x-1"
        >
          <Sliders className="w-3 h-3" />
          <span>Display Power Control Mode</span>
        </label>

        <div className="relative inline-flex items-center">
          <button
            type="button"
            aria-label="Open display power control guide"
            onClick={() => {
              setShowTooltip(false);
              setIsGuideModalOpen(true);
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[var(--admin-text-muted)] hover:text-[var(--admin-tab-active-border)] hover:bg-[var(--admin-card)] transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--admin-tab-active-border)]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Quick reference hover tooltip */}
          {showTooltip && !isGuideModalOpen && (
            <div
              role="tooltip"
              className="absolute right-0 bottom-full mb-1.5 z-30 w-56 p-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[10px] text-[var(--admin-text-primary)] shadow-lg leading-snug animate-fadeIn pointer-events-none"
            >
              <div className="font-semibold text-sky-400">Power Modes Guide</div>
              <p className="text-[var(--admin-text-muted)] mt-0.5">
                Controls how displays sleep. Click to view full guide &amp; remote TV recommendations.
              </p>
            </div>
          )}
        </div>
      </div>

      <select
        id="power-control-mode-select"
        value={value}
        onChange={(e) => onChange(e.target.value as TvControlProtocol)}
        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)]"
      >
        {POWER_CONTROL_MODE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <p className="text-[10px] text-[var(--admin-text-muted)] leading-relaxed">
        {selectedOption.description}
      </p>

      {selectedOption.isLocalHostHardware && (
        <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-900 dark:text-amber-200 flex items-start space-x-2 leading-relaxed">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Local Host Display &amp; Lock Screen Notice</span>
            <span className="text-[10px] text-amber-800/90 dark:text-amber-300/90 block">
              Physical sleep only affects a TV plugged directly into this server PC/Pi (not remote Wi-Fi displays). On Windows PCs with a password/PIN, turn off <em>&ldquo;Require sign-in after screen turns off&rdquo;</em> or use <strong>Browser Blackout</strong> so the lock screen never interrupts your TV.
            </span>
          </div>
        </div>
      )}

      {/* Guide Modal Popup */}
      <PowerControlGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
