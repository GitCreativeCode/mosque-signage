'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Monitor,
  Moon,
  ShieldCheck,
  Tv,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface PowerControlGuideModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function PowerControlGuideModal({ isOpen, onClose }: PowerControlGuideModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>({ isActive: isOpen, onEscape: onClose });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="power-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="power-guide-title" className="text-base font-bold text-[var(--admin-text-primary)]">
                Display Power &amp; Standby Modes
              </h3>
              <p className="text-xs text-[var(--admin-text-muted)]">
                How MosqueSignage controls TV and monitor power during sleep hours
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-card-hover)] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[var(--admin-text-primary)] leading-relaxed">
          {/* Section: Modes Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)] flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Available Execution Modes</span>
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-emerald-400">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Browser Blackout — All Displays (Recommended)</span>
                </div>
                <p className="text-[11px] text-[var(--admin-text-muted)] pl-6">
                  Draws an ultra-low-power, OLED pitch-black (<code className="font-mono text-emerald-300">#000000</code>) canvas on all connected screens. Works seamlessly on Smart TVs, remote TV PCs, tablets, and phones over Wi-Fi/LAN. Requires zero OS privileges and never triggers Windows lock screens.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-1">
                <div className="flex items-center space-x-2 font-bold text-[var(--admin-text-primary)]">
                  <Tv className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Hybrid Mode (Local Host Sleep + Remote Browser Blackout)</span>
                </div>
                <p className="text-[11px] text-[var(--admin-text-muted)] pl-6">
                  Blacks out all browser screens over Wi-Fi <em>and</em> issues physical hardware sleep (HDMI-CEC on Linux/Pi or DPMS on Windows) to the screen physically connected to the server machine.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-1">
                <div className="flex items-center space-x-2 font-bold text-[var(--admin-text-primary)]">
                  <Tv className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>HDMI-CEC Physical TV Power (Raspberry Pi / Linux Only)</span>
                </div>
                <p className="text-[11px] text-[var(--admin-text-muted)] pl-6">
                  Uses the HDMI cable and <code className="font-mono">cec-client</code> to physically turn off TV electronics and wake them on schedule. Only controls the TV physically plugged into the Pi.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-1">
                <div className="flex items-center space-x-2 font-bold text-[var(--admin-text-primary)]">
                  <Monitor className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>PC Monitor Sleep / DPMS (Local Host PC Only)</span>
                </div>
                <p className="text-[11px] text-[var(--admin-text-muted)] pl-6">
                  Puts standard computer monitors physically connected to this server into low-power sleep via Windows/Linux display power management. Does not turn off external remote TVs.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Server vs Remote TV */}
          <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-2">
            <h4 className="text-xs font-bold text-sky-400 flex items-center space-x-1.5">
              <Wifi className="w-3.5 h-3.5" />
              <span>Are You Running MosqueSignage on a Separate Server?</span>
            </h4>
            <p className="text-[11px] text-[var(--admin-text-muted)]">
              If MosqueSignage is running on an office computer or laptop, and your TV is in the prayer hall opening the display over Wi-Fi/LAN, hardware commands (DPMS or HDMI-CEC) would only affect the <em>office computer</em>, not the TV. For remote TV displays, always select <strong>Browser Blackout</strong> so the server keeps running normally and the TV screen darkens properly.
            </p>
          </div>

          {/* Section: Windows Lock Screen Tip */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Windows Lock Screen &amp; PIN Protection</span>
            </h4>
            <p className="text-[11px] text-[var(--admin-text-muted)]">
              When Windows puts a monitor to sleep using DPMS, waking the monitor may show the Windows password or PIN lock screen instead of returning straight to the kiosk display. To avoid this, either keep <strong>Browser Blackout</strong> enabled or disable <em>&ldquo;Require sign-in after display turns off&rdquo;</em> in Windows Settings &rarr; Accounts &rarr; Sign-in options.
            </p>
          </div>

          {/* Section: Energy & Burn-in */}
          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-2">
            <h4 className="text-xs font-bold text-[var(--admin-text-primary)] flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>OLED Energy Efficiency &amp; Burn-In Protection</span>
            </h4>
            <p className="text-[11px] text-[var(--admin-text-muted)]">
              On OLED and Mini-LED panels, rendering <code className="font-mono text-emerald-400">#000000</code> shuts off the individual pixel LEDs, achieving <strong>70% to 85% energy reduction</strong>. On LCD TVs, it eliminates distracting backlight glare in dark prayer halls. Built-in 5-minute subtle pixel shifting ensures static text never burns into the panel.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--admin-tab-active-border)] hover:opacity-90 text-white transition cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
