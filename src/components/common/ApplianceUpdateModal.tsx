'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DownloadCloud,
  ExternalLink,
  Loader2,
  RefreshCw,
  Tag,
  X,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { DEFAULT_GITHUB_REPO, type ReleaseInfo } from '@/lib/system/version';
import { ApplianceUpdateTerminalGuide } from './ApplianceUpdateTerminalGuide';
import { ReleaseHighlightsView } from './ReleaseHighlightsView';

export interface ApplianceUpdateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly currentVersion: string;
  readonly targetVersion: string;
  readonly releaseInfo: ReleaseInfo | null;
  readonly onVersionUpdated?: ((newTarget: string, newRelease: ReleaseInfo | null) => void) | undefined;
}

export function ApplianceUpdateModal({
  isOpen,
  onClose,
  currentVersion,
  targetVersion: initialTargetVersion,
  releaseInfo: initialReleaseInfo,
  onVersionUpdated,
}: ApplianceUpdateModalProps) {
  const modalRef = useFocusTrap({ isActive: isOpen, onEscape: onClose });
  const [updating, setUpdating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [targetVersion, setTargetVersion] = useState(initialTargetVersion);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(initialReleaseInfo);
  const [updateStatus, setUpdateStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const hasUpdate = targetVersion !== currentVersion;

  const handleCheckForUpdates = async () => {
    setChecking(true);
    setUpdateStatus(null);
    try {
      const res = await fetch('/api/system/version', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        hasUpdate?: boolean;
        latestVersion?: string;
        release?: ReleaseInfo | null;
      };

      if (data.hasUpdate && data.latestVersion) {
        setTargetVersion(data.latestVersion);
        setReleaseInfo(data.release || null);
        onVersionUpdated?.(data.latestVersion, data.release || null);
        setUpdateStatus({
          success: true,
          message: `Update v${data.latestVersion} found! You can now update the appliance below.`,
        });
      } else {
        setUpdateStatus({
          success: true,
          message: `MosqueSignage v${currentVersion} is currently up to date.`,
        });
      }
    } catch (err: unknown) {
      setUpdateStatus({
        success: false,
        message: `Could not check updates: ${err instanceof Error ? err.message : 'Network error'}`,
      });
    } finally {
      setChecking(false);
    }
  };

  const handleTriggerUpdate = async () => {
    setUpdating(true);
    setUpdateStatus(null);
    try {
      const res = await fetch('/api/system/update', { method: 'POST' });
      const data = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (!res.ok || data.error) {
        setUpdateStatus({ success: false, message: data.error || 'Failed to trigger appliance update.' });
      } else {
        setUpdateStatus({ success: true, message: data.message || 'Update completed successfully! The server will restart shortly.' });
      }
    } catch (err: unknown) {
      setUpdateStatus({ success: false, message: `Could not reach update server: ${err instanceof Error ? err.message : 'Network error'}` });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="update-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={modalRef} className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-2xl p-4 sm:p-7 space-y-5 sm:space-y-6 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-xs ${hasUpdate ? 'bg-green-600/15 border-green-600/30 text-green-600 dark:text-green-400' : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-secondary)]'}`}>
              {hasUpdate ? <DownloadCloud className="w-6 h-6 animate-pulse" /> : <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />}
            </div>
            <div>
              <div className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${hasUpdate ? 'bg-green-600/10 border-green-600/20 text-green-700 dark:text-green-400' : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)]'}`}>
                <Tag className="w-3 h-3" aria-hidden="true" />
                <span>{hasUpdate ? 'New Version Available' : 'System Up to Date'}</span>
              </div>
              <h2 id="update-modal-title" className="text-lg font-bold text-[var(--admin-text-primary)] tracking-tight mt-0.5">
                {hasUpdate ? 'Update Appliance' : 'Appliance Update Status'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
            aria-label="Close Update Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <p className="text-[10px] text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">Current Version</p>
            <p className="font-mono text-sm font-bold text-[var(--admin-text-secondary)]">v{currentVersion}</p>
          </div>
          {hasUpdate ? (
            <>
              <div className="text-center px-3 py-1 rounded-xl bg-green-600/10 border border-green-600/20 text-green-700 dark:text-green-400 font-mono text-xs font-bold self-start sm:self-center">
                &rarr; Upgrading to &rarr;
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">Target Release</p>
                <p className="font-mono text-sm font-bold text-green-700 dark:text-green-400">v{targetVersion}</p>
              </div>
            </>
          ) : (
            <div className="sm:text-right">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-green-600/10 border border-green-600/25 text-green-700 dark:text-green-400 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Latest Installed</span>
              </span>
            </div>
          )}
        </div>

        <ReleaseHighlightsView
          title={releaseInfo?.title || (hasUpdate ? `Release v${targetVersion}` : `Version v${currentVersion}`)}
          body={releaseInfo?.body}
        />

        {updateStatus && (
          <div role="alert" className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${updateStatus.success ? 'border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
            {updateStatus.success ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <p className="font-semibold">{updateStatus.success ? 'Notice' : 'Update Notice'}</p>
              <p className="text-[11px] leading-relaxed opacity-90">{updateStatus.message}</p>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-1">
          {hasUpdate && (
            <button
              type="button"
              onClick={handleTriggerUpdate}
              disabled={updating || checking}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-lg shadow-green-600/20 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              {updating ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Applying Update...</span></> : <><DownloadCloud className="w-4 h-4" /><span>1-Click Update Appliance</span></>}
            </button>
          )}

          <button
            type="button"
            onClick={handleCheckForUpdates}
            disabled={checking || updating}
            className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50 ${hasUpdate ? 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]' : 'bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-md shadow-green-600/20'}`}
          >
            {checking ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Checking for Updates...</span></> : <><RefreshCw className="w-3.5 h-3.5" /><span>Check for Updates</span></>}
          </button>

          {hasUpdate && <ApplianceUpdateTerminalGuide />}

          <a
            href={
              releaseInfo?.htmlUrl ||
              (hasUpdate
                ? `https://github.com/${DEFAULT_GITHUB_REPO}/releases/tag/v${targetVersion}`
                : `https://github.com/${DEFAULT_GITHUB_REPO}/releases`)
            }
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <span>View Full Release on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}
