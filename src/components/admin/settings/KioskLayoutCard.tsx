'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { SidebarMode, SidebarPosition } from '@/types/index';

const DRAWER_INTERVAL_OPTIONS = [
  { value: 1, label: 'Every 1 minute' },
  { value: 2, label: 'Every 2 minutes' },
  { value: 3, label: 'Every 3 minutes (Recommended)' },
  { value: 5, label: 'Every 5 minutes' },
  { value: 10, label: 'Every 10 minutes' },
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
];

const DRAWER_DURATION_OPTIONS = [
  { value: 10, label: '10 seconds' },
  { value: 15, label: '15 seconds (Default)' },
  { value: 20, label: '20 seconds' },
  { value: 30, label: '30 seconds' },
];

const ARCHETYPE_PRESETS: ReadonlyArray<{
  readonly mode: SidebarMode;
  readonly title: string;
  readonly badge?: string;
  readonly description: string;
  readonly footer: string;
}> = [
  {
    mode: 'drawer',
    title: 'Periodic Drawer',
    badge: 'Recommended',
    description: 'Full 16:9 posters rotate continuously. Prayer timetable smoothly slides out at scheduled intervals.',
    footer: 'Best for events & announcements',
  },
  {
    mode: 'always_open',
    title: 'Always Pinned Split-Screen',
    description: 'Prayer timetable remains permanently visible alongside posters. Ensures attendees never miss Iqamah times.',
    footer: 'Best for prayer halls',
  },
  {
    mode: 'hidden',
    title: 'Poster Only (No Timetable)',
    description: 'Completely disables the timetable drawer and sidebar for uninterrupted full-bleed poster broadcast.',
    footer: 'Best for lobbies & conferences',
  },
];

export interface KioskLayoutCardProps {
  readonly sidebarMode: SidebarMode;
  readonly onSelectPreset: (mode: SidebarMode) => void;
  readonly sidebarPosition: SidebarPosition;
  readonly setSidebarPosition: (val: SidebarPosition) => void;
  readonly showAdhanTimes: boolean;
  readonly setShowAdhanTimes: (val: boolean) => void;
  readonly drawerInterval: number;
  readonly setDrawerInterval: (val: number) => void;
  readonly drawerDuration: number;
  readonly setDrawerDuration: (val: number) => void;
  readonly showQrDuringDrawer: boolean;
  readonly setShowQrDuringDrawer: (val: boolean) => void;
  readonly markDirty: () => void;
}

export function KioskLayoutCard({
  sidebarMode, onSelectPreset,
  sidebarPosition, setSidebarPosition,
  showAdhanTimes, setShowAdhanTimes,
  drawerInterval, setDrawerInterval,
  drawerDuration, setDrawerDuration,
  showQrDuringDrawer, setShowQrDuringDrawer,
  markDirty,
}: KioskLayoutCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 space-y-6 shadow-sm">
      <div className="border-b border-[var(--admin-border)] pb-3">
        <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">Screen &amp; Timetable Layout</h3>
        <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
          Choose how the prayer schedule is presented on screen and configure timetable docking.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] block">
          Screen Archetype Preset
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ARCHETYPE_PRESETS.map((preset) => (
            <button
              key={preset.mode}
              type="button"
              onClick={() => onSelectPreset(preset.mode)}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                sidebarMode === preset.mode
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] shadow-md ring-1 ring-[var(--admin-tab-active-border)]'
                  : 'border-[var(--admin-border)] bg-[var(--admin-surface)]/60 hover:bg-[var(--admin-surface)] hover:border-[var(--admin-border)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--admin-text-primary)]">{preset.title}</span>
                  {preset.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] border border-[var(--admin-border)] font-semibold">
                      {preset.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">{preset.description}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[var(--admin-border)]/60 flex items-center justify-between text-[11px] font-medium text-[var(--admin-text-secondary)]">
                <span>{preset.footer}</span>
                {sidebarMode === preset.mode && <Check className="w-3.5 h-3.5 text-[var(--admin-text-primary)] shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {sidebarMode !== 'hidden' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Sidebar Screen Docking Edge</label>
          <div className="grid grid-cols-2 gap-3 w-full">
            {(['left', 'right'] as const).map((edge) => (
              <button
                key={edge}
                type="button"
                onClick={() => { setSidebarPosition(edge); markDirty(); }}
                className={`py-2.5 px-4 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${
                  sidebarPosition === edge
                    ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] border-[var(--admin-btn-primary-bg)] font-semibold shadow-sm'
                    : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                {edge === 'left' ? 'Left Side' : 'Right Side (Default)'}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)]">
            Controls which side of the 1080p canvas displays the prayer timetable.
          </p>
        </div>
      )}

      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] flex items-center justify-between">
        <div className="space-y-0.5 pr-4">
          <span className="text-xs font-bold text-[var(--admin-text-primary)] block">Show Adhan Times on Prayer Schedule</span>
          <p className="text-[11px] text-[var(--admin-text-muted)]">
            When enabled, both Adhan and Iqamah times are shown side-by-side. When disabled, only congregational Iqamah is displayed.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input type="checkbox" checked={showAdhanTimes} onChange={(e) => { setShowAdhanTimes(e.target.checked); markDirty(); }} className="sr-only peer" />
          <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-btn-primary-bg)]" />
        </label>
      </div>

      {sidebarMode === 'drawer' && (
        <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Drawer Frequency</label>
              <select value={drawerInterval} onChange={(e) => { setDrawerInterval(parseInt(e.target.value, 10)); markDirty(); }} className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]">
                {DRAWER_INTERVAL_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <p className="text-[11px] text-[var(--admin-text-muted)]">How often the drawer slides out over rotating posters.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Drawer On-Screen Duration</label>
              <select value={drawerDuration} onChange={(e) => { setDrawerDuration(parseInt(e.target.value, 10)); markDirty(); }} className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]">
                {DRAWER_DURATION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <p className="text-[11px] text-[var(--admin-text-muted)]">Seconds the drawer stays visible before returning.</p>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--admin-border)] flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-semibold text-[var(--admin-text-primary)] block">Show Poster QR Code While Drawer is Open</span>
              <p className="text-[11px] text-[var(--admin-text-muted)]">When enabled, action QR codes remain visible on the poster while the prayer drawer is sliding or open.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={showQrDuringDrawer} onChange={(e) => { setShowQrDuringDrawer(e.target.checked); markDirty(); }} className="sr-only peer" />
              <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-btn-primary-bg)]" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

