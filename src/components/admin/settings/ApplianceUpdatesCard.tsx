'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  DownloadCloud,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { APP_VERSION, type ReleaseInfo } from '@/lib/system/version';
import { ApplianceUpdateModal } from '@/components/common/ApplianceUpdateModal';

const LAST_CHECK_KEY = 'mosque_last_update_check_ms';
const ONE_HOUR_MS = 60 * 60 * 1000;

export function ApplianceUpdatesCard() {
  const [checking, setChecking] = useState(false);
  const [lastCheckedText, setLastCheckedText] = useState<string>('Not checked this session');
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState(APP_VERSION);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_CHECK_KEY);
      if (stored) {
        const time = parseInt(stored, 10);
        if (!isNaN(time)) {
          setLastCheckedText(new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const handleCheckUpdates = async () => {
    setChecking(true);
    setFeedback(null);

    const now = Date.now();
    try {
      const stored = localStorage.getItem(LAST_CHECK_KEY);
      const lastTime = stored ? parseInt(stored, 10) : 0;

      // Rate limit check: if checked within last 60 minutes, return cached result immediately
      if (lastTime && now - lastTime < ONE_HOUR_MS && !hasUpdate) {
        setFeedback(`MosqueSignage v${APP_VERSION} is up to date.`);
        setLastCheckedText(new Date(lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setChecking(false);
        return;
      }

      const res = await fetch('/api/system/version', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        hasUpdate?: boolean;
        latestVersion?: string;
        release?: ReleaseInfo | null;
      };

      try {
        localStorage.setItem(LAST_CHECK_KEY, String(now));
      } catch {
        // Storage restricted
      }

      setLastCheckedText(new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      if (data.hasUpdate && data.latestVersion) {
        setHasUpdate(true);
        setLatestVersion(data.latestVersion);
        setReleaseInfo(data.release || null);
        setFeedback(`New release v${data.latestVersion} is available!`);
      } else {
        setHasUpdate(false);
        setFeedback(`MosqueSignage v${APP_VERSION} is currently up to date.`);
      }
    } catch (err: unknown) {
      setFeedback(`Could not verify updates: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--admin-border)]/60">
          <h4 className="text-xs font-bold text-[var(--admin-text-primary)] uppercase tracking-wider">
            System &amp; Software Updates
          </h4>
          <span className="px-2 py-0.5 rounded-full bg-[var(--admin-card)] border border-[var(--admin-border)] text-[10px] font-mono text-[var(--admin-text-secondary)]">
            Channel: Stable (GitHub)
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[var(--admin-text-muted)]">Installed Release:</span>
              <span className="font-mono font-bold text-[var(--admin-text-primary)]">v{APP_VERSION}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
              Last checked: <span className="font-mono text-[var(--admin-text-secondary)]">{lastCheckedText}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {hasUpdate ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                <DownloadCloud className="w-3.5 h-3.5 animate-pulse" />
                <span>Update to v{latestVersion}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCheckUpdates}
                disabled={checking}
                className="px-3 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-xs font-semibold text-[var(--admin-text-primary)] flex items-center space-x-1.5 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {checking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>{checking ? 'Checking...' : 'Check for Updates'}</span>
              </button>
            )}

            <Link
              href="/releases"
              className="px-2.5 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] flex items-center space-x-1 transition cursor-pointer"
              title="View full chronological release notes"
            >
              <History className="w-3.5 h-3.5" />
              <span>Changelog</span>
            </Link>
          </div>
        </div>

        {feedback && (
          <div className="p-2.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-xs font-mono text-[var(--admin-text-secondary)] flex items-center justify-between animate-fadeIn">
            <span>{feedback}</span>
            {hasUpdate && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-emerald-500 hover:underline font-semibold text-xs ml-2 cursor-pointer"
              >
                Inspect Release &rarr;
              </button>
            )}
          </div>
        )}
      </div>

      <ApplianceUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentVersion={APP_VERSION}
        targetVersion={latestVersion}
        releaseInfo={releaseInfo}
        onVersionUpdated={(newTarget, newRelease) => {
          setHasUpdate(true);
          setLatestVersion(newTarget);
          setReleaseInfo(newRelease);
        }}
      />
    </>
  );
}

