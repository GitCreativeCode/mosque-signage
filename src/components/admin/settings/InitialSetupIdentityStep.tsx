'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

const GREETING_OPTIONS = [
  { value: 'Welcome to', label: 'Welcome to' },
  { value: 'Ahlan wa Sahlan to', label: 'Ahlan wa Sahlan to' },
  { value: 'As-salamu alaykum — Welcome to', label: 'As-salamu alaykum — Welcome to' },
  { value: 'Bismillah — Welcome to', label: 'Bismillah — Welcome to' },
  { value: '', label: 'None (Direct Mosque Name Only)' },
];

export interface InitialSetupIdentityStepProps {
  readonly mosqueName: string;
  readonly headerGreeting: string;
  readonly tickerText: string;
  readonly onChangeMosqueName: (val: string) => void;
  readonly onChangeHeaderGreeting: (val: string) => void;
  readonly onChangeTickerText: (val: string) => void;
}

export function InitialSetupIdentityStep({
  mosqueName,
  headerGreeting,
  tickerText,
  onChangeMosqueName,
  onChangeHeaderGreeting,
  onChangeTickerText,
}: InitialSetupIdentityStepProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center space-x-2 text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">
        <Building2 className="w-4 h-4 text-[var(--admin-text-primary)]" />
        <span>Venue Identity &amp; Broadcast Announcement</span>
      </div>

      <div className="p-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 space-y-1.5">
        <span className="text-[10px] font-mono text-[var(--admin-text-muted)] font-semibold uppercase tracking-wider">
          Live Top Bar Header Preview
        </span>
        <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/10 flex items-center text-xs text-white">
          <div className="flex items-center space-x-1.5 truncate">
            {headerGreeting && <span className="text-neutral-400 font-light">{headerGreeting}</span>}
            <span className="font-bold text-white truncate">{mosqueName || 'Mosque Name'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60">
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
          Mosque / Center Name
        </label>
        <input
          type="text"
          required
          value={mosqueName}
          onChange={(e) => onChangeMosqueName(e.target.value)}
          placeholder="e.g. Islamic Community Center"
          className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
        />
      </div>

      <div className="space-y-1.5 p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60">
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
          Top Bar Greeting Prefix
        </label>
        <select
          value={headerGreeting}
          onChange={(e) => onChangeHeaderGreeting(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
        >
          {GREETING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[var(--admin-card)]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60">
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
          Scrolling Announcement Marquee Ticker
        </label>
        <textarea
          rows={2}
          value={tickerText}
          onChange={(e) => onChangeTickerText(e.target.value)}
          placeholder="Welcome message or announcements shown in the continuous top bar marquee..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] resize-none leading-relaxed"
        />
      </div>
    </div>
  );
}

