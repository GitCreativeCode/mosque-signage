'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VenueSettingsCategory } from '@/types/index';

export type AdminTabKey = 'POSTERS' | 'PRAYERS' | 'SETTINGS';
export type PrayerSubTabKey = 'TIMETABLE' | 'JUMMAH';

export function resolveInitialPrayerSub(sub?: string): PrayerSubTabKey {
  return sub?.toLowerCase() === 'jummah' ? 'JUMMAH' : 'TIMETABLE';
}

export function resolveInitialSettingsSub(sub?: string): VenueSettingsCategory {
  const s = sub?.toUpperCase();
  if (s === 'ASTRONOMY' || s === 'DISPLAY' || s === 'MAINTENANCE' || s === 'SECURITY' || s === 'IDENTITY') {
    return s;
  }
  return 'IDENTITY';
}

function syncUrlQueryParams(tab: AdminTabKey, sub?: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (tab === 'POSTERS') {
    url.searchParams.delete('tab');
    url.searchParams.delete('sub');
  } else if (tab === 'PRAYERS') {
    url.searchParams.set('tab', 'prayers');
    if (sub?.toLowerCase() === 'jummah') url.searchParams.set('sub', 'jummah');
    else url.searchParams.delete('sub');
  } else {
    url.searchParams.set('tab', 'settings');
    if (sub && sub.toLowerCase() !== 'identity') url.searchParams.set('sub', sub.toLowerCase());
    else url.searchParams.delete('sub');
  }
  window.history.replaceState(null, '', url.pathname + url.search);
}

export function useAdminNavigation(initialTab: AdminTabKey = 'POSTERS', initialSubTab?: string) {
  const [activeTab, setActiveTab] = useState<AdminTabKey>(initialTab);
  const [prayerSubTab, setPrayerSubTab] = useState<PrayerSubTabKey>(() => resolveInitialPrayerSub(initialSubTab));
  const [settingsSubTab, setSettingsSubTab] = useState<VenueSettingsCategory>(() => resolveInitialSettingsSub(initialSubTab));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNav, setPendingNav] = useState<{ tab: AdminTabKey; sub?: string | undefined } | null>(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  const applyNavigation = useCallback((tab: AdminTabKey, sub?: string | undefined) => {
    setActiveTab(tab);
    if (tab === 'PRAYERS') setPrayerSubTab(resolveInitialPrayerSub(sub));
    else if (tab === 'SETTINGS') setSettingsSubTab(resolveInitialSettingsSub(sub));
    syncUrlQueryParams(tab, sub);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const rawTab = params.get('tab')?.toLowerCase();
      const parsedTab: AdminTabKey =
        rawTab === 'prayers' || rawTab === 'prayer' ? 'PRAYERS'
        : rawTab === 'settings' || rawTab === 'venue' ? 'SETTINGS'
        : 'POSTERS';
      const sub = params.get('sub')?.toLowerCase();
      setActiveTab(parsedTab);
      if (parsedTab === 'PRAYERS') setPrayerSubTab(resolveInitialPrayerSub(sub));
      else if (parsedTab === 'SETTINGS') setSettingsSubTab(resolveInitialSettingsSub(sub));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavAction = useCallback((targetTab: AdminTabKey, targetSub?: string | undefined) => {
    const isSameTab = targetTab === activeTab;
    const isSameSub =
      (targetTab === 'PRAYERS' && (targetSub ?? 'TIMETABLE') === prayerSubTab) ||
      (targetTab === 'SETTINGS' && (targetSub ?? 'IDENTITY') === settingsSubTab) ||
      targetTab === 'POSTERS';
    if (isSameTab && isSameSub) return;

    if (hasUnsavedChanges) {
      setPendingNav({ tab: targetTab, sub: targetSub });
      setShowLeaveConfirmation(true);
      return;
    }
    applyNavigation(targetTab, targetSub);
  }, [activeTab, prayerSubTab, settingsSubTab, hasUnsavedChanges, applyNavigation]);

  return {
    activeTab, prayerSubTab, setPrayerSubTab, settingsSubTab, setSettingsSubTab,
    hasUnsavedChanges, setHasUnsavedChanges, pendingNav, showLeaveConfirmation,
    applyNavigation, handleNavAction,
    confirmLeave: () => {
      setShowLeaveConfirmation(false);
      setHasUnsavedChanges(false);
      if (pendingNav) {
        applyNavigation(pendingNav.tab, pendingNav.sub);
        setPendingNav(null);
      }
    },
    cancelLeave: () => {
      setShowLeaveConfirmation(false);
      setPendingNav(null);
    },
  };
}

