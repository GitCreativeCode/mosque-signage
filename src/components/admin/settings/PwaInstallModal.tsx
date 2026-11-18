'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle,
  ExternalLink,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Tv,
  WifiOff,
  X,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { PwaInstallInstructions } from './PwaInstallInstructions';

export interface PwaInstallModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>({ isActive: isOpen, onEscape: onClose });
  const { isInstallable, isInstalled, isStandalone, diagnostics, triggerInstall } = usePwaInstall();
  const [installStatus, setInstallStatus] = useState<'idle' | 'installed' | 'waiting_browser'>('idle');

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const result = await triggerInstall();
    setInstallStatus(result === 'accepted' ? 'installed' : 'waiting_browser');
  };

  const showInstalledState = installStatus === 'installed' || isInstalled || diagnostics.isInstalledOnDevice;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp max-h-[92vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/30 shadow-md shrink-0 bg-slate-950">
              <Image src="/icon.svg" alt="MosqueSignage App Icon" fill className="object-contain p-0.5" priority />
            </div>
            <div>
              <h3 id="pwa-install-title" className="text-base font-bold text-[var(--admin-text-primary)]">
                Install Standalone Kiosk App (PWA)
              </h3>
              <p className="text-xs text-[var(--admin-text-muted)]">
                Run MosqueSignage as a native, frameless television application without browser tabs
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

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-1.5">
              <Monitor className="w-4 h-4 text-emerald-500" />
              <div className="text-xs font-semibold text-[var(--admin-text-primary)]">Zero Browser Chrome</div>
              <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
                Removes URL bar, tabs, and bookmarks for a pristine, distraction-free display.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-1.5">
              <WifiOff className="w-4 h-4 text-emerald-500" />
              <div className="text-xs font-semibold text-[var(--admin-text-primary)]">24/7 Offline Shield</div>
              <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
                Service Worker caches prayer schedules &amp; posters if Wi-Fi disconnects.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <div className="text-xs font-semibold text-[var(--admin-text-primary)]">Taskbar &amp; Desktop</div>
              <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
                Launches directly with the MosqueSignage star emblem and quick shortcuts.
              </p>
            </div>
          </div>

          {!diagnostics.isServiceWorkerControlling && diagnostics.hasServiceWorkerSupport && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-start sm:items-center gap-2.5">
                <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-emerald-500" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[var(--admin-text-primary)]">Service Worker Registered &bull; Reload Required</p>
                  <p className="text-[11px] text-[var(--admin-text-secondary)] leading-relaxed">
                    Chromium requires one page reload so the browser document runs under active Service Worker control.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shrink-0 shadow-sm"
              >
                Reload Page Now
              </button>
            </div>
          )}

          {showInstalledState ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold">MosqueSignage App is Already Installed!</h4>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {isStandalone
                      ? 'You are currently running MosqueSignage inside the installed standalone desktop app.'
                      : 'MosqueSignage is installed on this device. Click below to open the standalone kiosk window.'}
                  </p>
                </div>
              </div>

              {!isStandalone && (
                <div className="pl-9 pt-0.5">
                  <button
                    type="button"
                    onClick={() => window.open('/display', '_blank', 'noopener,noreferrer')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Tv className="w-4 h-4" />
                    <span>Open Installed Kiosk App</span>
                  </button>
                </div>
              )}

              <div className="text-[11px] text-[var(--admin-text-secondary)] pl-9 space-y-1">
                <p>
                  <strong>Why you don&apos;t see the address bar download icon:</strong> Chromium browsers (Edge &amp; Chrome) automatically hide the address bar install icon once an app is installed to avoid duplicate apps.
                </p>
                <p>
                  You can also search <strong>MosqueSignage</strong> in your Windows Start Menu / Taskbar, or visit <code className="px-1.5 py-0.5 rounded bg-black/20 text-emerald-500 font-mono">edge://apps</code> or <code className="px-1.5 py-0.5 rounded bg-black/20 text-emerald-500 font-mono">chrome://apps</code> to open it.
                </p>
              </div>
            </div>
          ) : (
            <PwaInstallInstructions
              isInstallable={isInstallable}
              installStatus={installStatus}
              onInstallClick={handleInstallClick}
            />
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] shrink-0">
          <button
            type="button"
            onClick={() => window.open('/display', '_blank', 'noopener,noreferrer')}
            className="text-xs text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] flex items-center space-x-1 transition cursor-pointer"
          >
            <span>Open /display in browser</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-primary)] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
