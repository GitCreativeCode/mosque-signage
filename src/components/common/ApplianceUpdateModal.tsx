'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DownloadCloud,
  ExternalLink,
  Loader2,
  Tag,
  X,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { ReleaseInfo } from '@/lib/system/version';
import { ApplianceUpdateTerminalGuide } from './ApplianceUpdateTerminalGuide';

export interface ApplianceUpdateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly currentVersion: string;
  readonly targetVersion: string;
  readonly releaseInfo: ReleaseInfo | null;
}

export function ApplianceUpdateModal({
  isOpen,
  onClose,
  currentVersion,
  targetVersion,
  releaseInfo,
}: ApplianceUpdateModalProps) {
  const modalRef = useFocusTrap({ isActive: isOpen, onEscape: onClose });
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

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
    <div role="dialog" aria-modal="true" aria-labelledby="update-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={modalRef} className="w-full max-w-lg rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-green-600/15 border border-green-600/30 text-green-600 dark:text-green-400 flex items-center justify-center shadow-xs">
              <DownloadCloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-green-600/10 border border-green-600/20 text-green-700 dark:text-green-400 text-[11px] font-semibold">
                <Tag className="w-3 h-3" aria-hidden="true" />
                <span>New Version Available</span>
              </div>
              <h2 id="update-modal-title" className="text-lg font-bold text-[var(--admin-text-primary)] tracking-tight mt-0.5">
                Update Appliance
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

        <div className="p-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">Current Version</p>
            <p className="font-mono text-sm font-bold text-[var(--admin-text-secondary)]">v{currentVersion}</p>
          </div>
          <div className="text-center px-3 py-1 rounded-xl bg-green-600/10 border border-green-600/20 text-green-700 dark:text-green-400 font-mono text-xs font-bold">
            &rarr; Upgrading to &rarr;
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">Target Release</p>
            <p className="font-mono text-sm font-bold text-green-700 dark:text-green-400">v{targetVersion}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[var(--admin-text-muted)] uppercase tracking-wider">Release Highlights</h3>
          <div className="p-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 text-xs text-[var(--admin-text-secondary)] space-y-2 leading-relaxed max-h-48 overflow-y-auto">
            <p className="font-semibold text-[var(--admin-text-primary)]">{releaseInfo?.title || `Release v${targetVersion}`}</p>
            <div className="whitespace-pre-line text-[11px] text-[var(--admin-text-muted)] font-mono">
              {releaseInfo?.body || 'Includes performance optimizations, security hardening, and liturgical calculation adjustments.'}
            </div>
          </div>
        </div>

        {updateStatus && (
          <div role="alert" className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${updateStatus.success ? 'border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
            {updateStatus.success ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <p className="font-semibold">{updateStatus.success ? 'Success' : 'Update Notice'}</p>
              <p className="text-[11px] leading-relaxed opacity-90">{updateStatus.message}</p>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleTriggerUpdate}
            disabled={updating}
            className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-lg shadow-green-600/20 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
          >
            {updating ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Applying Update...</span></> : <><DownloadCloud className="w-4 h-4" /><span>1-Click Update Appliance</span></>}
          </button>

          <ApplianceUpdateTerminalGuide />

          {releaseInfo?.htmlUrl && (
            <a
              href={releaseInfo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <span>View Full Release on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
