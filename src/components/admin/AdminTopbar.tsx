'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Lock, Menu, Moon, Sun, Laptop } from 'lucide-react';
import type { VenueSettingsCategory } from '@/types/index';
import type { AdminTabKey, PrayerSubTabKey } from '@/hooks/useAdminNavigation';
import type { ThemePreference } from '@/lib/theme/theme-sync';
import { TopNavDropdown } from './common/TopNavDropdown';
import { AdminMobileDrawer } from './AdminMobileDrawer';

export interface AdminTopbarProps {
  readonly timezone: string;
  readonly activeTab: AdminTabKey;
  readonly prayerSubTab: PrayerSubTabKey;
  readonly settingsSubTab: VenueSettingsCategory;
  readonly theme: 'light' | 'dark';
  readonly themePreference?: ThemePreference | undefined;
  readonly isPwaInstalled: boolean;
  readonly isPwaStandalone: boolean;
  readonly onNavigate: (tab: AdminTabKey, sub?: string) => void;
  readonly onToggleTheme: () => void;
  readonly onLockAdmin: () => void;
  readonly onToggleSimulator: () => void;
  readonly onTestDrawer: () => void;
  readonly onReloadDisplay: () => void;
  readonly onOpenPwaModal: () => void;
}

type DropdownId = 'prayers' | 'settings' | 'tools' | null;

export function AdminTopbar({
  timezone,
  activeTab,
  prayerSubTab,
  settingsSubTab,
  theme,
  themePreference,
  isPwaInstalled,
  isPwaStandalone,
  onNavigate,
  onToggleTheme,
  onLockAdmin,
  onToggleSimulator,
  onTestDrawer,
  onReloadDisplay,
  onOpenPwaModal,
}: AdminTopbarProps) {
  const [openDropdownId, setOpenDropdownId] = useState<DropdownId>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openDropdown = (id: Exclude<DropdownId, null>) => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setOpenDropdownId(id);
  };

  const closeDropdownLater = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpenDropdownId(null), 120);
  };

  const closeDropdownNow = () => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setOpenDropdownId(null);
  };

  useEffect(() => {
    setMounted(true);
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--admin-surface)] border-b border-[var(--admin-border)] px-4 sm:px-6 py-2.5 shadow-sm">
        {/* Mobile & Vertical Tablet Header (< 1024px): Mosque Signage Left, Hamburger Right */}
        <div className="flex lg:hidden items-center justify-between gap-3">
          <div className="min-w-0 text-left">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold text-[var(--admin-text-primary)] tracking-tight leading-none truncate">
                Mosque Signage
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-green-600/15 border border-green-600/30 text-green-700 dark:text-green-400 shrink-0">
                BETA
              </span>
            </div>
            <p className="text-[10px] text-[var(--admin-text-muted)] font-mono mt-0.5 truncate">
              {timezone || 'America/Toronto'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMobileDrawerOpen}
            aria-controls="admin-mobile-drawer"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-primary)] transition active:scale-95 cursor-pointer shadow-sm shrink-0"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop 3-Zone Header (>= 1024px) */}
        <div className="hidden lg:flex max-w-7xl mx-auto items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-start min-w-0">
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-bold text-[var(--admin-text-primary)] tracking-tight leading-none truncate">
                Mosque Signage
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-green-600/15 border border-green-600/30 text-green-700 dark:text-green-400">
                BETA
              </span>
            </div>
            <p className="text-[10px] text-[var(--admin-text-muted)] font-mono mt-0.5 truncate">
              {timezone || 'America/Toronto'}
            </p>
          </div>
        </div>

        <nav className="flex items-center justify-center space-x-1.5 shrink-0" aria-label="Admin Navigation">
          <button
            id="tab-posters"
            type="button"
            onClick={() => onNavigate('POSTERS')}
            onMouseEnter={closeDropdownNow}
            className={`h-8 px-3 text-xs font-semibold rounded-lg transition-colors duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center space-x-1.5 border whitespace-nowrap hover:underline hover:decoration-2 hover:decoration-[var(--admin-tab-active-border)] hover:underline-offset-4 ${
              activeTab === 'POSTERS'
                ? 'border-[var(--admin-tab-active-border)] text-[var(--admin-text-primary)] bg-[var(--admin-card)] shadow-sm'
                : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
            }`}
          >
            <span>Posters &amp; Notices</span>
          </button>

          <TopNavDropdown
            buttonId="tab-prayers"
            label="Prayer & Jummah"
            isActive={activeTab === 'PRAYERS'}
            isOpen={openDropdownId === 'prayers'}
            onMouseEnter={() => openDropdown('prayers')}
            onMouseLeave={closeDropdownLater}
            onOpenChange={(open) => (open ? openDropdown('prayers') : closeDropdownNow())}
            defaultAction={() => onNavigate('PRAYERS', 'TIMETABLE')}
            items={[
              {
                id: 'prayer-timetable',
                label: 'Prayer Timetable',
                isDefault: true,
                isActive: activeTab === 'PRAYERS' && prayerSubTab === 'TIMETABLE',
                onClick: () => onNavigate('PRAYERS', 'TIMETABLE'),
              },
              {
                id: 'friday-jummah',
                label: 'Friday Jummah',
                isActive: activeTab === 'PRAYERS' && prayerSubTab === 'JUMMAH',
                onClick: () => onNavigate('PRAYERS', 'JUMMAH'),
              },
              {
                id: 'seasonal-schedules',
                label: 'Seasonal (Eid & Ramadan)',
                isActive: activeTab === 'PRAYERS' && prayerSubTab === 'SEASONAL',
                onClick: () => onNavigate('PRAYERS', 'SEASONAL'),
              },
            ]}
          />

          <TopNavDropdown
            buttonId="tab-settings"
            label="Settings"
            isActive={activeTab === 'SETTINGS'}
            isOpen={openDropdownId === 'settings'}
            onMouseEnter={() => openDropdown('settings')}
            onMouseLeave={closeDropdownLater}
            onOpenChange={(open) => (open ? openDropdown('settings') : closeDropdownNow())}
            defaultAction={() => onNavigate('SETTINGS', 'IDENTITY')}
            items={[
              { id: 'mosque-profile', label: 'Mosque Profile & Ticker', isDefault: true, isActive: activeTab === 'SETTINGS' && settingsSubTab === 'IDENTITY', onClick: () => onNavigate('SETTINGS', 'IDENTITY') },
              { id: 'calc-hijri', label: 'Calculation & Hijri Calendar', isActive: activeTab === 'SETTINGS' && settingsSubTab === 'ASTRONOMY', onClick: () => onNavigate('SETTINGS', 'ASTRONOMY') },
              { id: 'display-timings', label: 'Display Timings & Behaviors', isActive: activeTab === 'SETTINGS' && settingsSubTab === 'DISPLAY', onClick: () => onNavigate('SETTINGS', 'DISPLAY') },
              { id: 'appliance-controls', label: 'Remote Appliance Controls', isActive: activeTab === 'SETTINGS' && settingsSubTab === 'MAINTENANCE', onClick: () => onNavigate('SETTINGS', 'MAINTENANCE') },
              { id: 'security-pin', label: 'Security & Authentication', isActive: activeTab === 'SETTINGS' && settingsSubTab === 'SECURITY', onClick: () => onNavigate('SETTINGS', 'SECURITY') },
            ]}
          />

          <TopNavDropdown
            label="Display Tools"
            align="left"
            isOpen={openDropdownId === 'tools'}
            onMouseEnter={() => openDropdown('tools')}
            onMouseLeave={closeDropdownLater}
            onOpenChange={(open) => (open ? openDropdown('tools') : closeDropdownNow())}
            items={[
              { id: 'toggle-sim', label: 'Toggle Simulator', onClick: onToggleSimulator },
              { id: 'test-drawer', label: 'Test Drawer (15s)', onClick: onTestDrawer },
              { id: 'reload-kiosk', label: 'Reload Display Screens', onClick: onReloadDisplay },
              { id: 'open-display', label: 'Open Live Display', onClick: () => window.open('/display', '_blank', 'noopener,noreferrer') },
              {
                id: 'install-pwa',
                label: isPwaStandalone ? 'PWA Installed (Active Window)' : isPwaInstalled ? 'Open Installed Kiosk App' : 'Install Standalone App (PWA)',
                badge: isPwaStandalone ? 'Active' : isPwaInstalled ? 'Installed' : undefined,
                disabled: isPwaStandalone,
                onClick: () => {
                  if (isPwaStandalone) return;
                  if (isPwaInstalled) { window.open('/display', '_blank', 'noopener,noreferrer'); return; }
                  onOpenPwaModal();
                },
              },
            ]}
          />
        </nav>

        <div className="flex-1 flex items-center justify-end space-x-1.5 min-w-0">
          <button
            type="button"
            onClick={onToggleTheme}
            suppressHydrationWarning
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-primary)] transition active:scale-95 cursor-pointer shadow-sm"
            title={
              !mounted
                ? 'Theme Switcher'
                : themePreference === 'system'
                ? 'Theme: System Default (Click to switch to Light mode)'
                : themePreference === 'light'
                ? 'Theme: Light Mode (Click to switch to Dark mode)'
                : 'Theme: Dark Mode (Click to switch to System mode)'
            }
            aria-label={
              !mounted
                ? 'Theme Switcher'
                : themePreference === 'system'
                ? 'Theme: System Default (Click to switch to Light mode)'
                : themePreference === 'light'
                ? 'Theme: Light Mode (Click to switch to Dark mode)'
                : 'Theme: Dark Mode (Click to switch to System mode)'
            }
          >
            {!mounted ? (
              <Laptop className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            ) : themePreference === 'system' ? (
              <Laptop className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--admin-text-secondary)]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onLockAdmin}
            aria-label="Lock Admin Panel"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-secondary)] hover:text-rose-400 transition active:scale-95 cursor-pointer shadow-sm"
            title="Lock Admin Panel"
          >
            <Lock className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      </header>

      <AdminMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        timezone={timezone}
        activeTab={activeTab}
        prayerSubTab={prayerSubTab}
        settingsSubTab={settingsSubTab}
        theme={theme}
        themePreference={themePreference}
        isPwaInstalled={isPwaInstalled}
        isPwaStandalone={isPwaStandalone}
        onNavigate={onNavigate}
        onToggleTheme={onToggleTheme}
        onLockAdmin={onLockAdmin}
        onToggleSimulator={onToggleSimulator}
        onTestDrawer={onTestDrawer}
        onReloadDisplay={onReloadDisplay}
        onOpenPwaModal={onOpenPwaModal}
      />
    </>
  );
}

