'use client';

import React from 'react';
import { Building2, Laptop, Moon, Sun } from 'lucide-react';
import type { ThemePreference } from '@/lib/theme/theme-sync';

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
  readonly themePreference?: ThemePreference | undefined;
  readonly onChangeMosqueName: (val: string) => void;
  readonly onChangeHeaderGreeting: (val: string) => void;
  readonly onChangeTickerText: (val: string) => void;
  readonly onChangeThemePreference?: ((pref: ThemePreference) => void) | undefined;
}

export function InitialSetupIdentityStep({
  mosqueName,
  headerGreeting,
  tickerText,
  themePreference = 'system',
  onChangeMosqueName,
  onChangeHeaderGreeting,
  onChangeTickerText,
  onChangeThemePreference,
}: InitialSetupIdentityStepProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center space-x-2 text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">
        <Building2 className="w-4 h-4 text-[var(--admin-text-primary)]" />
        <span>Venue Identity &amp; Broadcast Announcement</span>
      </div>

      <div className="p-3.5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/70 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--admin-text-muted)] font-semibold uppercase tracking-wider">
            Live Top Bar Header Preview
          </span>
          <span className="text-[10px] text-[var(--admin-text-muted)] font-mono">1920 × 96 Kiosk Header</span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] flex items-center text-xs shadow-xs">
          <div className="truncate">
            {headerGreeting && (
              <span className="text-[var(--admin-text-muted)] font-medium mr-1.5">{headerGreeting}</span>
            )}
            <span className="font-bold text-[var(--admin-text-primary)] truncate">
              {mosqueName || 'Mosque Name'}
            </span>
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

      <div className="space-y-2 p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60">
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
          System Visual Theme
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'system', label: 'System Default', icon: Laptop, desc: 'Auto OS match' },
              { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Clean daylight' },
              { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'High-contrast dark' },
            ] as const
          ).map((item) => {
            const isSelected = themePreference === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeThemePreference?.(item.id)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[var(--admin-card)] border-[var(--admin-tab-active-border)] shadow-xs ring-1 ring-[var(--admin-tab-active-border)]'
                    : 'bg-[var(--admin-card)]/50 border-[var(--admin-border)] hover:bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[var(--admin-tab-active-border)]' : 'text-[var(--admin-text-muted)]'}`} />
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--admin-tab-active-border)]" />}
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isSelected ? 'text-[var(--admin-text-primary)]' : 'text-[var(--admin-text-secondary)]'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-[var(--admin-text-muted)]">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

