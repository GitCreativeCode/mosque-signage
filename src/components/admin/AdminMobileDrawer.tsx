'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  Image as ImageIcon,
  Laptop,
  Lock,
  Monitor,
  Moon,
  Settings as SettingsIcon,
  Sun,
  X,
} from 'lucide-react';
import type { VenueSettingsCategory } from '@/types/index';
import type { AdminTabKey, PrayerSubTabKey } from '@/hooks/useAdminNavigation';
import type { ThemePreference } from '@/lib/theme/theme-sync';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { PRAYER_MOBILE_LINKS, SETTINGS_MOBILE_LINKS } from './adminMobileNavItems';

export interface AdminMobileDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
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

type ExpandableGroup = 'prayers' | 'settings' | 'tools';
const DRAWER_TRANSITION_MS = 220;

const NAV_ROW_CLS = 'w-full min-h-[44px] px-3 py-2 rounded-lg text-left text-xs font-medium transition cursor-pointer border';
const TOOL_ROW_CLS = 'w-full min-h-[44px] px-3 py-2 rounded-lg text-left text-xs font-medium text-[var(--admin-text-secondary)] hover:bg-[var(--admin-card)] hover:text-[var(--admin-text-primary)] transition cursor-pointer';

/**
 * Slide-out right navigation drawer for phones and vertical tablets (< 1024px).
 * Houses the 4 core admin navigation sections with expandable sub-menus, Theme Switcher, and Lock button.
 */
export function AdminMobileDrawer(props: AdminMobileDrawerProps) {
  const { isOpen, onClose, timezone, activeTab, prayerSubTab, settingsSubTab, theme, themePreference, isPwaInstalled, isPwaStandalone } = props;
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState<Record<ExpandableGroup, boolean>>({
    prayers: activeTab === 'PRAYERS',
    settings: activeTab === 'SETTINGS',
    tools: false,
  });

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setExpanded((prev) => ({
        ...prev,
        prayers: activeTab === 'PRAYERS' ? true : prev.prayers,
        settings: activeTab === 'SETTINGS' ? true : prev.settings,
      }));
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setIsVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }
    setIsVisible(false);
    const timer = window.setTimeout(() => setShouldRender(false), DRAWER_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, activeTab]);

  const trapRef = useFocusTrap<HTMLDivElement>({ isActive: isOpen, onEscape: onClose });
  if (!shouldRender) return null;

  const toggleGroup = (group: ExpandableGroup) => setExpanded((prev) => ({ ...prev, [group]: !prev[group] }));
  const runNav = (tab: AdminTabKey, sub?: string) => { props.onNavigate(tab, sub); onClose(); };
  const runAction = (fn: () => void) => { fn(); onClose(); };

  const themeLabel = themePreference === 'system' ? 'Theme: System Default' : themePreference === 'light' ? 'Theme: Light Mode' : 'Theme: Dark Mode';

  return (
    <div id="admin-mobile-drawer" role="dialog" aria-modal="true" aria-label="Admin Navigation Menu" className="fixed inset-0 z-50 flex justify-end lg:hidden">
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={trapRef}
        className={`relative w-[min(86vw,340px)] h-[100dvh] bg-[var(--admin-surface)] border-l border-[var(--admin-border)] shadow-2xl flex flex-col text-[var(--admin-text-primary)] z-10 transition-transform duration-200 ease-out will-change-transform ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-4 py-3.5 border-b border-[var(--admin-border)] flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold tracking-tight truncate">Mosque Signage</span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-green-600/15 border border-green-600/30 text-green-700 dark:text-green-400">BETA</span>
            </div>
            <p className="text-[10px] text-[var(--admin-text-muted)] font-mono mt-0.5 truncate">{timezone || 'America/Toronto'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] active:scale-95 transition cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-1.5" aria-label="Mobile Admin Navigation">
          <button
            type="button"
            onClick={() => runNav('POSTERS')}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 border transition cursor-pointer ${
              activeTab === 'POSTERS'
                ? 'border-[var(--admin-menu-active-border)] bg-[var(--admin-menu-active-bg)] text-[var(--admin-menu-active-text)] shadow-xs'
                : 'border-transparent text-[var(--admin-text-primary)] hover:bg-[var(--admin-card)]'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Posters &amp; Notices</span>
          </button>

          <DrawerAccordion
            icon={<Calendar className="w-4 h-4 shrink-0 text-[var(--admin-text-muted)]" aria-hidden="true" />}
            label="Prayer & Jummah"
            isExpanded={expanded.prayers}
            isActiveTab={activeTab === 'PRAYERS'}
            onToggle={() => toggleGroup('prayers')}
          >
            {PRAYER_MOBILE_LINKS.map((item) => (
              <button
                key={item.sub}
                type="button"
                onClick={() => runNav('PRAYERS', item.sub)}
                className={`${NAV_ROW_CLS} ${
                  activeTab === 'PRAYERS' && prayerSubTab === item.sub
                    ? 'border-[var(--admin-menu-active-border)] bg-[var(--admin-menu-active-bg)] text-[var(--admin-menu-active-text)] font-semibold'
                    : 'border-transparent text-[var(--admin-text-secondary)] hover:bg-[var(--admin-card)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </DrawerAccordion>

          <DrawerAccordion
            icon={<SettingsIcon className="w-4 h-4 shrink-0 text-[var(--admin-text-muted)]" aria-hidden="true" />}
            label="Settings"
            isExpanded={expanded.settings}
            isActiveTab={activeTab === 'SETTINGS'}
            onToggle={() => toggleGroup('settings')}
          >
            {SETTINGS_MOBILE_LINKS.map((item) => (
              <button
                key={item.sub}
                type="button"
                onClick={() => runNav('SETTINGS', item.sub)}
                className={`${NAV_ROW_CLS} ${
                  activeTab === 'SETTINGS' && settingsSubTab === item.sub
                    ? 'border-[var(--admin-menu-active-border)] bg-[var(--admin-menu-active-bg)] text-[var(--admin-menu-active-text)] font-semibold'
                    : 'border-transparent text-[var(--admin-text-secondary)] hover:bg-[var(--admin-card)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </DrawerAccordion>

          <DrawerAccordion
            icon={<Monitor className="w-4 h-4 shrink-0 text-[var(--admin-text-muted)]" aria-hidden="true" />}
            label="Display Tools"
            isExpanded={expanded.tools}
            isActiveTab={false}
            onToggle={() => toggleGroup('tools')}
          >
            <button type="button" onClick={() => runAction(props.onToggleSimulator)} className={TOOL_ROW_CLS}>Toggle Simulator</button>
            <button type="button" onClick={() => runAction(props.onTestDrawer)} className={TOOL_ROW_CLS}>Test Drawer (15s)</button>
            <button type="button" onClick={() => runAction(props.onReloadDisplay)} className={TOOL_ROW_CLS}>Reload Display Screens</button>
            <button type="button" onClick={() => runAction(() => window.open('/display', '_blank', 'noopener,noreferrer'))} className={TOOL_ROW_CLS}>Open Live Display</button>
            <button
              type="button"
              disabled={isPwaStandalone}
              onClick={() => runAction(() => {
                if (isPwaStandalone) return;
                if (isPwaInstalled) { window.open('/display', '_blank', 'noopener,noreferrer'); return; }
                props.onOpenPwaModal();
              })}
              className={`${TOOL_ROW_CLS} disabled:opacity-40 flex items-center justify-between`}
            >
              <span>{isPwaStandalone ? 'PWA Installed (Active Window)' : isPwaInstalled ? 'Open Installed Kiosk App' : 'Install Standalone App (PWA)'}</span>
              {(isPwaStandalone || isPwaInstalled) && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-bold">{isPwaStandalone ? 'Active' : 'Installed'}</span>
              )}
            </button>
          </DrawerAccordion>
        </nav>

        <div className="p-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)]/40 space-y-2 shrink-0">
          <button
            type="button"
            onClick={props.onToggleTheme}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-xs font-semibold text-[var(--admin-text-primary)] flex items-center justify-between transition active:scale-[0.98] cursor-pointer"
          >
            <span className="flex items-center space-x-2.5">
              {themePreference === 'system' ? <Laptop className="w-4 h-4 text-emerald-500" aria-hidden="true" /> : theme === 'light' ? <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" /> : <Moon className="w-4 h-4 text-[var(--admin-text-secondary)]" aria-hidden="true" />}
              <span>{themeLabel}</span>
            </span>
            <span className="text-[10px] text-[var(--admin-text-muted)]">Tap to switch</span>
          </button>

          <button
            type="button"
            onClick={() => runAction(props.onLockAdmin)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer"
          >
            <Lock className="w-4 h-4" aria-hidden="true" />
            <span>Lock &amp; Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface DrawerAccordionProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly isExpanded: boolean;
  readonly isActiveTab: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}

function DrawerAccordion({ icon, label, isExpanded, isActiveTab, onToggle, children }: DrawerAccordionProps) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)]/70 bg-[var(--admin-card)]/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
          isActiveTab ? 'text-[var(--admin-text-primary)] bg-[var(--admin-card)]' : 'text-[var(--admin-text-primary)] hover:bg-[var(--admin-card)]'
        }`}
      >
        <span className="flex items-center space-x-2.5">{icon}<span>{label}</span></span>
        <ChevronDown className={`w-4 h-4 text-[var(--admin-text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isExpanded && <div className="px-2 pb-2 pt-1 space-y-1 border-t border-[var(--admin-border)]/50 bg-[var(--admin-surface)]/50">{children}</div>}
    </div>
  );
}
