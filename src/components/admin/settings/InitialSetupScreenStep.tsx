'use client';

import React from 'react';
import { ExternalLink, HelpCircle, KeyRound, ShieldCheck } from 'lucide-react';

export interface InitialSetupScreenStepProps {
  readonly newAdminPin: string;
  readonly termsAccepted: boolean;
  readonly onChangeNewAdminPin: (pin: string) => void;
  readonly onChangeTermsAccepted: (accepted: boolean) => void;
}

export function InitialSetupScreenStep({
  newAdminPin,
  termsAccepted,
  onChangeNewAdminPin,
  onChangeTermsAccepted,
}: InitialSetupScreenStepProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center space-x-2 text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-[var(--admin-text-primary)]" />
        <span>Administrator Security &amp; Legal Terms</span>
      </div>

      <div className="space-y-2 p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60">
        <div className="flex items-center space-x-1.5">
          <KeyRound className="w-3.5 h-3.5 text-[var(--admin-text-secondary)]" />
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">
            Admin PIN Protection (Optional Update)
          </label>
        </div>
        <input
          type="password"
          maxLength={8}
          inputMode="numeric"
          value={newAdminPin}
          onChange={(e) => onChangeNewAdminPin(e.target.value)}
          placeholder="Enter new 4 to 8 digit PIN"
          className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
        />
        <p className="text-[11px] text-[var(--admin-text-muted)]">
          Leave blank to retain the default factory PIN (
          <span className="font-mono font-bold text-[var(--admin-text-primary)]">1234</span>). You can change this anytime later in Settings.
        </p>
      </div>

      {/* Terms & Privacy Policy Mandatory Agreement Card */}
      <div
        className={`p-3.5 rounded-xl border transition-all ${
          termsAccepted
            ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)]/60'
            : 'border-[var(--admin-border)] bg-[var(--admin-card)]'
        }`}
      >
        <div className="flex items-start space-x-3">
          <input
            id="initial-setup-terms-checkbox"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onChangeTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[var(--admin-border)] text-neutral-900 dark:text-neutral-100 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--admin-tab-active-border)] focus-visible:ring-offset-0 cursor-pointer accent-neutral-900 dark:accent-neutral-100 shrink-0"
          />
          <div className="space-y-1.5 text-xs">
            <div className="font-semibold text-[var(--admin-text-primary)] leading-relaxed">
              <label
                htmlFor="initial-setup-terms-checkbox"
                className="cursor-pointer select-none"
              >
                I agree to the{' '}
              </label>
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--admin-text-primary)] hover:underline underline-offset-2 font-bold inline-flex items-center space-x-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Privacy Policy</span>
                <ExternalLink className="w-3 h-3 inline ml-0.5" />
              </a>
              <label
                htmlFor="initial-setup-terms-checkbox"
                className="cursor-pointer select-none"
              >
                {' '}and{' '}
              </label>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--admin-text-primary)] hover:underline underline-offset-2 font-bold inline-flex items-center space-x-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Terms of Use</span>
                <ExternalLink className="w-3 h-3 inline ml-0.5" />
              </a>
              <label
                htmlFor="initial-setup-terms-checkbox"
                className="cursor-pointer select-none"
              >
                .
              </label>
            </div>
            <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
              Required to launch and operate the signage software. MosqueSignage operates local-first and does not collect or transmit your community announcements or private data to external cloud servers.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[var(--admin-border)]/60 flex items-center justify-between text-[11px] text-[var(--admin-text-muted)] flex-wrap gap-2">
          <span className="flex items-center space-x-1">
            <HelpCircle className="w-3 h-3 text-[var(--admin-text-secondary)]" />
            <span>Need assistance?</span>
          </span>
          <div className="flex items-center space-x-3">
            <a
              href="https://forms.gle/X8j99388AAWAKk3a8"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] font-medium underline underline-offset-2 transition"
            >
              Report a Problem
            </a>
            <span className="text-[var(--admin-border)]">&bull;</span>
            <a
              href="mailto:helpdesk.guidance@gmail.com"
              className="text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] font-medium underline underline-offset-2 transition"
            >
              helpdesk.guidance@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
