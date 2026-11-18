'use client';

import React from 'react';
import type { DateDisplayMode } from '@/types/index';

const IANA_TIMEZONES = [
  { label: 'America/Toronto (Eastern Time - Canada)', value: 'America/Toronto' },
  { label: 'America/New_York (Eastern Time - US)', value: 'America/New_York' },
  { label: 'America/Chicago (Central Time)', value: 'America/Chicago' },
  { label: 'America/Edmonton (Mountain Time - Canada)', value: 'America/Edmonton' },
  { label: 'America/Denver (Mountain Time - US)', value: 'America/Denver' },
  { label: 'America/Vancouver (Pacific Time - Canada)', value: 'America/Vancouver' },
  { label: 'America/Los_Angeles (Pacific Time - US)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT/BST - UK)', value: 'Europe/London' },
  { label: 'Asia/Riyadh (AST - Saudi Arabia)', value: 'Asia/Riyadh' },
  { label: 'Asia/Dubai (GST - UAE)', value: 'Asia/Dubai' },
  { label: 'Asia/Karachi (PKT - Pakistan)', value: 'Asia/Karachi' },
];

const GREETING_OPTIONS = [
  { value: 'Welcome to', label: 'Welcome to' },
  { value: 'Ahlan wa Sahlan to', label: 'Ahlan wa Sahlan to' },
  { value: 'As-salamu alaykum — Welcome to', label: 'As-salamu alaykum — Welcome to' },
  { value: 'Bismillah — Welcome to', label: 'Bismillah — Welcome to' },
  { value: '', label: 'None (Direct Mosque Name Only)' },
];

export interface VenueIdentityTabCardProps {
  readonly greeting: string;
  readonly mosqueName: string;
  readonly timezone: string;
  readonly dateFormat: DateDisplayMode;
  readonly tickerText: string;
  readonly onChangeGreeting: (v: string) => void;
  readonly onChangeMosqueName: (v: string) => void;
  readonly onChangeTimezone: (v: string) => void;
  readonly onChangeDateFormat: (v: DateDisplayMode) => void;
  readonly onChangeTickerText: (v: string) => void;
  readonly markDirty: () => void;
}

export function VenueIdentityTabCard(props: VenueIdentityTabCardProps) {
  const liveHeader = props.greeting ? `${props.greeting} ${props.mosqueName || 'Mosque Display'}` : props.mosqueName || 'Mosque Display';

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 space-y-6 shadow-sm">
      <div className="border-b border-[var(--admin-border)] pb-3">
        <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">Mosque Profile &amp; Announcement Ticker</h3>
        <p className="text-xs text-[var(--admin-text-muted)]">
          Configure greeting, venue branding, timezone, and live ticker announcements.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--admin-text-muted)]">
          Live Display Header Preview
        </span>
        <p className="text-sm font-bold text-[var(--admin-text-primary)] tracking-tight">{liveHeader}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Header Greeting</label>
          <select value={props.greeting} onChange={(e) => { props.onChangeGreeting(e.target.value); props.markDirty(); }} className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]">
            {GREETING_OPTIONS.map((opt) => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
          </select>
          <p className="text-[11px] text-[var(--admin-text-muted)]">Prepends a greeting to the Mosque Name on the display screen.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Mosque / Center Name</label>
          <input type="text" value={props.mosqueName} onChange={(e) => { props.onChangeMosqueName(e.target.value); props.markDirty(); }} className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]" placeholder="e.g. Islamic Community Center" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">IANA Timezone</label>
          <select value={props.timezone} onChange={(e) => { props.onChangeTimezone(e.target.value); props.markDirty(); }} className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]">
            {IANA_TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Date Display Mode</label>
          <select value={props.dateFormat} onChange={(e) => { props.onChangeDateFormat(e.target.value as DateDisplayMode); props.markDirty(); }} className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]">
            <option value="both">Both Gregorian &amp; Hijri (Dual Header)</option>
            <option value="gregorian">Gregorian Only</option>
            <option value="hijri">Islamic Hijri Only</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-[var(--admin-border)]">
        <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Live Announcement Marquee Ticker</label>
        <textarea rows={3} value={props.tickerText} onChange={(e) => { props.onChangeTickerText(e.target.value); props.markDirty(); }} className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] leading-relaxed" placeholder="Enter text to continuously marquee along the bottom of the display screen..." />
        <p className="text-[11px] text-[var(--admin-text-muted)]">Scrolls continuously along the bottom edge of the kiosk display.</p>
      </div>
    </div>
  );
}

