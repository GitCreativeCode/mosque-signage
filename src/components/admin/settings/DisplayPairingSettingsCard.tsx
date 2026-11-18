'use client';

/**
 * Display Kiosk Pairing & Access Security Card
 * MosqueSignage (TV)
 */

import React, { useState } from 'react';
import { KeyRound, ShieldAlert, ShieldCheck, RefreshCw, Copy, Check, Tv, AlertTriangle } from 'lucide-react';
import type { Settings } from '@/types/index';
import { updateVenueSettings } from '@/lib/actions/settings';
import {
  generateDisplayPairingCode,
  revokeAllPairedDisplays,
} from '@/lib/auth/display-pairing';

export interface DisplayPairingSettingsCardProps {
  readonly settings: Settings;
  readonly onRefresh: () => void;
}

export function DisplayPairingSettingsCard({
  settings,
  onRefresh,
}: DisplayPairingSettingsCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isProtected = settings.display_access_mode === 'pairing_required';
  const allowLocalhost = settings.display_allow_localhost ?? true;

  const handleToggleMode = async (mode: 'open' | 'pairing_required') => {
    setIsUpdating(true);
    setStatusMsg(null);
    try {
      await updateVenueSettings({ display_access_mode: mode });
      onRefresh();
      setStatusMsg(
        mode === 'pairing_required'
          ? 'Display protection activated. Unpaired devices will now be prompted for a code.'
          : 'Display mode set to Open. Screens can now connect without a code.'
      );
      setTimeout(() => setStatusMsg(null), 4000);
    } catch {
      setStatusMsg('Failed to update display security mode.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleLocalhost = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      await updateVenueSettings({ display_allow_localhost: enabled });
      onRefresh();
    } catch {
      setStatusMsg('Failed to update localhost setting.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setPairingCode(null);
    try {
      const { code } = await generateDisplayPairingCode();
      setPairingCode(code);
    } catch {
      setStatusMsg('Failed to generate pairing code.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Revoke all paired displays? All external screens will need to be re-paired.')) {
      return;
    }
    setIsUpdating(true);
    try {
      await revokeAllPairedDisplays();
      onRefresh();
      setStatusMsg('All paired display sessions have been revoked.');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch {
      setStatusMsg('Failed to revoke display sessions.');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-6 border-t border-[var(--admin-border)] space-y-4">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
          Display Kiosk Protection & Pairing
        </h4>
        <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
          Prevent unauthorized visitors on local Wi-Fi or public networks from streaming the display or downloading flyers.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-xs text-[var(--admin-text-primary)] flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-[var(--admin-text-primary)] block">
              Display Access Mode
            </span>
            <span className="text-[11px] text-[var(--admin-text-muted)]">
              {isProtected
                ? 'Protection Active — New devices must enter a pairing code.'
                : 'Open Access — Anyone on the network can view /display.'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggleMode(isProtected ? 'open' : 'pairing_required')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center space-x-1.5 ${
                isProtected
                  ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/20'
                  : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-card-hover)]'
              }`}
            >
              {isProtected ? (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{isProtected ? 'Protected Mode' : 'Open Mode'}</span>
            </button>
          </div>
        </div>

        {isProtected && (
          <div className="space-y-4 pt-3 border-t border-[var(--admin-border)]">
            <div className="flex items-start space-x-2.5">
              <input
                id="allow-localhost-bypass"
                type="checkbox"
                checked={allowLocalhost}
                onChange={(e) => handleToggleLocalhost(e.target.checked)}
                className="mt-0.5 rounded border-[var(--admin-border)] bg-[var(--admin-surface)] text-amber-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="allow-localhost-bypass" className="text-xs cursor-pointer select-none">
                <span className="font-semibold text-[var(--admin-text-primary)] block">
                  Allow Localhost Bypass (Recommended)
                </span>
                <span className="text-[11px] text-[var(--admin-text-muted)]">
                  The TV plugged directly into this appliance HDMI port connects with zero codes or configuration.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateCode}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Generating...' : 'Generate 1-Time Pairing Code'}</span>
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={handleRevokeAll}
                className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Revoke All Paired Displays</span>
              </button>
            </div>

            {pairingCode && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 tracking-wider">
                    Single-Use Pairing Code (Valid 10 Minutes)
                  </span>
                  <div className="text-2xl font-mono font-bold tracking-widest text-neutral-900 dark:text-white">
                    {pairingCode}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyCode}
                  className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-transparent font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

