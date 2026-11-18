'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  DownloadCloud,
  HelpCircle,
  Info,
} from 'lucide-react';

export interface PwaInstallInstructionsProps {
  readonly isInstallable: boolean;
  readonly installStatus: 'idle' | 'installed' | 'waiting_browser';
  readonly onInstallClick: () => void;
}

export function PwaInstallInstructions({
  isInstallable,
  installStatus,
  onInstallClick,
}: PwaInstallInstructionsProps) {
  const [showTroubleshooting, setShowTroubleshooting] = useState<boolean>(false);

  return (
    <div className="space-y-4">
      {installStatus === 'waiting_browser' && !isInstallable && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-3 animate-fadeIn">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div className="space-y-1.5">
            <p className="font-bold text-sm">Browser is in Dismissal Cooldown (Chromium Heuristic)</p>
            <p className="text-xs text-[var(--admin-text-secondary)] leading-relaxed">
              Because the prompt was previously opened on localhost without completing installation, Edge/Chrome suppresses automatic prompts for a cooldown period.
            </p>
            <div className="pt-1">
              <p className="font-semibold text-emerald-500 text-xs">
                &rarr; Please use <strong>Method 2 (Browser 3-Dots Menu)</strong> below: Click <strong>... &rarr; More tools &rarr; Apps &rarr; Install this site as an app</strong>. It bypasses all browser cooldowns and installs immediately!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[var(--admin-text-primary)] flex items-center gap-1.5">
            <DownloadCloud className="w-4 h-4 text-emerald-500" />
            <span>Method 1: Address Bar Install Icon (Fastest)</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Recommended
          </span>
        </div>
        <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
          Look at the <strong>far-right end of your browser&apos;s address/search bar</strong> (where the website URL is shown):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] space-y-1">
            <div className="text-xs font-semibold text-[var(--admin-text-primary)]">In Microsoft Edge:</div>
            <p className="text-[11px] text-[var(--admin-text-secondary)] leading-relaxed">
              Look for the <strong className="text-[var(--admin-text-primary)]">App available</strong> icon (three squares with a <span className="font-mono text-emerald-500 font-bold">+</span> or a monitor with a down arrow). Click it and select <strong className="text-emerald-500 font-semibold">Install</strong>.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] space-y-1">
            <div className="text-xs font-semibold text-[var(--admin-text-primary)]">In Google Chrome:</div>
            <p className="text-[11px] text-[var(--admin-text-secondary)] leading-relaxed">
              Look for the <strong className="text-[var(--admin-text-primary)]">Install MosqueSignage</strong> icon (a computer monitor with a down arrow). Click it and select <strong className="text-emerald-500 font-semibold">Install</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-2.5">
        <div className="text-xs font-bold text-[var(--admin-text-primary)] flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-emerald-500" />
          <span>Method 2: Browser 3-Dots Menu (Always Works)</span>
        </div>
        <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
          If the address bar icon does not appear, you can install directly via the browser menu:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] space-y-1.5">
            <div className="text-xs font-semibold text-[var(--admin-text-primary)]">In Microsoft Edge:</div>
            <ol className="text-[11px] text-[var(--admin-text-secondary)] space-y-1 list-decimal list-inside leading-relaxed">
              <li>Click the <strong className="text-[var(--admin-text-primary)]">...</strong> (Settings &amp; more) at the top-right corner.</li>
              <li>Hover or click <strong className="text-[var(--admin-text-primary)]">More tools</strong> &rarr; <strong className="text-[var(--admin-text-primary)]">Apps</strong> <em className="text-[10px] text-[var(--admin-text-muted)]">(or directly &quot;Apps&quot; in some versions)</em>.</li>
              <li>Click <strong className="text-emerald-500 font-semibold">Install this site as an app</strong> (or <em>Install MosqueSignage</em>).</li>
              <li>Click <strong className="text-emerald-500 font-semibold">Install</strong>.</li>
            </ol>
          </div>

          <div className="p-3 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] space-y-1.5">
            <div className="text-xs font-semibold text-[var(--admin-text-primary)]">In Google Chrome:</div>
            <ol className="text-[11px] text-[var(--admin-text-secondary)] space-y-1 list-decimal list-inside leading-relaxed">
              <li>Click the <strong className="text-[var(--admin-text-primary)]">...</strong> menu at the top-right corner.</li>
              <li>Hover over <strong className="text-[var(--admin-text-primary)]">Cast, save, and share</strong> (or <strong>Save and share</strong>).</li>
              <li>Click <strong className="text-emerald-500 font-semibold">Install page as app...</strong> (or <em>Install MosqueSignage</em>).</li>
              <li>Click <strong className="text-emerald-500 font-semibold">Install</strong>.</li>
            </ol>
          </div>
        </div>
      </div>

      <div
        className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isInstallable ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--admin-surface)] border-[var(--admin-border)]'
        }`}
      >
        <div className="space-y-1">
          <div className="text-xs font-bold text-[var(--admin-text-primary)] flex items-center gap-1.5">
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Method 3: Direct In-App Trigger</span>
            {isInstallable && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                Ready to Install
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)]">
            {isInstallable
              ? 'Native browser install prompt is captured and ready! Click below to launch the operating system install dialog.'
              : 'Requires the browser to dispatch an install prompt. If Edge/Chrome is in cooldown or throttled, please use Method 2 above.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onInstallClick}
          disabled={!isInstallable && installStatus === 'waiting_browser'}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer shrink-0 ${
            isInstallable
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-primary)] border border-[var(--admin-border)]'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>{isInstallable ? 'Install Kiosk App (1-Click)' : 'Attempt Install Dialog'}</span>
        </button>
      </div>

      <div className="border border-[var(--admin-border)] rounded-xl bg-[var(--admin-surface)] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Why don&apos;t I see the download icon in my search/address bar?</span>
          </span>
          {showTroubleshooting ? (
            <ChevronUp className="w-4 h-4 text-[var(--admin-text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--admin-text-muted)]" />
          )}
        </button>

        {showTroubleshooting && (
          <div className="px-4 pb-4 pt-1 border-t border-[var(--admin-border)] space-y-3 text-[11px] text-[var(--admin-text-secondary)]">
            <div className="space-y-1">
              <strong className="text-[var(--admin-text-primary)]">1. MosqueSignage might already be installed:</strong>
              <p className="leading-relaxed">
                When an app is already installed, Edge and Chrome hide the download icon to avoid duplicates. Visit <code className="px-1.5 py-0.5 rounded bg-black/20 text-emerald-500 font-mono">edge://apps</code> or <code className="px-1.5 py-0.5 rounded bg-black/20 text-emerald-500 font-mono">chrome://apps</code> to see installed apps or launch MosqueSignage.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-[var(--admin-text-primary)]">2. Running in InPrivate or Incognito Mode:</strong>
              <p className="leading-relaxed">
                Chromium browsers strictly disable PWA installation and Service Workers in private tabs. Open MosqueSignage in a standard browser tab.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-[var(--admin-text-primary)]">3. Accessing via Network IP instead of localhost:</strong>
              <p className="leading-relaxed">
                Browsers only allow Service Workers on <code className="px-1.5 py-0.5 rounded bg-black/20 text-emerald-500 font-mono">http://localhost</code> or secure <code className="px-1.5 py-0.5 rounded bg-black/20 text-emerald-500 font-mono">https://</code> connections. If accessing via an IP (e.g. <code className="px-1.5 py-0.5 rounded bg-black/20 text-emerald-500 font-mono">192.168.x.x</code>), use <strong>Method 2 (More tools &rarr; Apps &rarr; Install this site as an app)</strong> which works on any URL!
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-[var(--admin-text-primary)]">4. Dev Server Refresh:</strong>
              <p className="leading-relaxed">
                Press <strong className="text-[var(--admin-text-primary)]">F5</strong> (or Reload in address bar) so the browser runs under the active service worker.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

