'use client';

import React from 'react';
import { Smartphone, Globe } from 'lucide-react';

export interface AdminSecurityModeSelectorProps {
  readonly targetMode: 'pin' | 'password';
  readonly onSelectMode: (mode: 'pin' | 'password') => void;
}

export function AdminSecurityModeSelector({
  targetMode,
  onSelectMode,
}: AdminSecurityModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">
        Authentication Mode
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSelectMode('pin')}
          className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition cursor-pointer ${
            targetMode === 'pin'
              ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card-hover)]'
              : 'border-[var(--admin-border)] bg-[var(--admin-surface)] opacity-70 hover:opacity-100'
          }`}
        >
          <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-[var(--admin-text-primary)]" />
          <div>
            <p className="text-xs font-bold text-[var(--admin-text-primary)]">
              Numeric PIN (Touchscreen / LAN)
            </p>
            <p className="text-[11px] text-[var(--admin-text-muted)]">
              Fast 4–8 digit numeric PIN with on-screen tactile keypad. Ideal for closed LANs.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('password')}
          className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition cursor-pointer ${
            targetMode === 'password'
              ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card-hover)]'
              : 'border-[var(--admin-border)] bg-[var(--admin-surface)] opacity-70 hover:opacity-100'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0 mt-0.5 text-[var(--admin-text-primary)]" />
          <div>
            <p className="text-xs font-bold text-[var(--admin-text-primary)]">
              Username + Password (Public / Remote)
            </p>
            <p className="text-[11px] text-[var(--admin-text-muted)]">
              Strong 8+ character password (uppercase, number & symbol) for public domains and remote management.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

