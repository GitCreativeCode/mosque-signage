'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Settings,
  PosterWithStatus,
  PrayerTimesToday,
  PrayerOverride,
  PrayerRule,
} from '@/types/index';
import type { DbJummahShiftRecord } from '@/lib/actions/jummah';
import { useAppTheme, type ThemePreference } from '@/lib/theme/theme-sync';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import dynamic from 'next/dynamic';
import { useAdminNavigation, type AdminTabKey } from '@/hooks/useAdminNavigation';
import { useAdminLiveSync } from '@/hooks/useAdminLiveSync';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';
import { PosterList } from './posters/PosterList';
import { AdminPinGate } from './AdminPinGate';
import { AdminTopbar } from './AdminTopbar';
import { AdminModalsPortal } from './AdminModalsPortal';
import { AdminLoadingFallback } from './common/AdminLoadingFallback';
import { SiteFooter } from '../common/SiteFooter';
import { triggerBetaNoticeReset } from '../common/BetaNoticeModal';
import { resetPrayerDisclaimer } from './prayer/PrayerCalculationDisclaimer';

const DynamicPrayerScheduleManager = dynamic(
  () => import('./PrayerScheduleManager').then((m) => m.PrayerScheduleManager),
  { loading: () => <AdminLoadingFallback label="Loading prayer schedule manager..." /> }
);

const DynamicVenueSettingsForm = dynamic(
  () => import('./VenueSettingsForm').then((m) => m.VenueSettingsForm),
  { loading: () => <AdminLoadingFallback label="Loading system settings..." /> }
);

export interface AdminDashboardProps {
  readonly initialSettings: Settings;
  readonly initialPosters: readonly PosterWithStatus[];
  readonly initialPrayers?: PrayerTimesToday | undefined;
  readonly initialOverrides: readonly PrayerOverride[];
  readonly initialJummahShifts: readonly DbJummahShiftRecord[];
  readonly initialRules?: readonly PrayerRule[] | undefined;
  readonly initialIsAuthenticated?: boolean | undefined;
  readonly initialTab?: AdminTabKey | undefined;
  readonly initialSubTab?: string | undefined;
  readonly initialTheme?: 'light' | 'dark' | undefined;
  readonly initialPreference?: ThemePreference | undefined;
  readonly hasAnnualSchedule?: boolean | undefined;
}

export function AdminDashboard({
  initialSettings,
  initialPosters,
  initialPrayers,
  initialOverrides,
  initialJummahShifts,
  initialRules = [],
  initialIsAuthenticated = false,
  initialTab = 'POSTERS',
  initialSubTab,
  initialTheme = 'dark',
  initialPreference = 'system',
  hasAnnualSchedule = false,
}: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialIsAuthenticated);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isInitialSetupModalOpen, setIsInitialSetupModalOpen] = useState(
    initialIsAuthenticated && !initialSettings.initial_setup_completed
  );
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const hasOpenedInitialSetupRef = useRef(
    Boolean(initialSettings.initial_setup_completed) || isInitialSetupModalOpen
  );

  const router = useRouter();
  const { isInstalled: isPwaInstalled, isStandalone: isPwaStandalone } = usePwaInstall();
  const { theme, preference, toggleTheme } = useAppTheme(initialTheme, initialPreference);
  const nav = useAdminNavigation(initialTab, initialSubTab);
  const sync = useAdminLiveSync(initialSettings, initialPosters, initialIsAuthenticated);

  useEffect(() => {
    if (
      isAuthenticated &&
      !sync.settings.initial_setup_completed &&
      !hasOpenedInitialSetupRef.current &&
      !isFactoryResetModalOpen
    ) {
      hasOpenedInitialSetupRef.current = true;
      setIsInitialSetupModalOpen(true);
    }
  }, [isAuthenticated, sync.settings.initial_setup_completed, isFactoryResetModalOpen]);

  const handleLockAdmin = async () => {
    try {
      const { logoutAdmin } = await import('@/lib/actions/auth');
      await logoutAdmin();
      sync.clearPosters();
      setIsAuthenticated(false);
      setIsFactoryResetModalOpen(false);
      setIsInitialSetupModalOpen(false);
      router.refresh();
    } catch (err) {
      console.error('Failed to lock admin panel:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={theme === 'light' ? 'admin-theme-light' : 'admin-theme-dark'}>
        <AdminPinGate
          mosqueName={sync.settings.mosque_name}
          greeting={sync.settings.header_greeting}
          authMode={sync.settings.auth_mode ?? 'pin'}
          onSuccess={() => {
            setIsAuthenticated(true);
            void sync.hydrateAfterAuth();
            if (!sync.settings.initial_setup_completed) {
              hasOpenedInitialSetupRef.current = true;
              setIsInitialSetupModalOpen(true);
            }
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${
        theme === 'light' ? 'admin-theme-light' : 'admin-theme-dark'
      } bg-[var(--admin-bg)] text-[var(--admin-text-primary)] flex flex-col font-sans selection:bg-[var(--admin-accent)]/20 transition-colors duration-200`}
    >
      <AdminTopbar
        timezone={sync.settings.timezone}
        activeTab={nav.activeTab}
        prayerSubTab={nav.prayerSubTab}
        settingsSubTab={nav.settingsSubTab}
        theme={theme}
        themePreference={preference}
        isPwaInstalled={isPwaInstalled}
        isPwaStandalone={isPwaStandalone}
        onNavigate={nav.handleNavAction}
        onToggleTheme={toggleTheme}
        onLockAdmin={handleLockAdmin}
        onToggleSimulator={sync.handleQuickToggleSimulator}
        onTestDrawer={sync.handleQuickTestDrawer}
        onReloadDisplay={sync.handleQuickReload}
        onOpenPwaModal={() => setShowPwaModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
        {nav.activeTab === 'POSTERS' && (
          <div id="panel-posters" role="tabpanel" aria-labelledby="tab-posters">
            <PosterList
              posters={sync.posters}
              venueTimezone={sync.settings.timezone}
              isLoading={sync.isHydrating}
              onRefresh={sync.refreshPosters}
              onCreateNotice={() => setIsAnnouncementModalOpen(true)}
              onUploadPoster={() => setIsUploadModalOpen(true)}
            />
          </div>
        )}

        {nav.activeTab === 'PRAYERS' && (
          <div id="panel-prayers" role="tabpanel" aria-labelledby="tab-prayers">
            <DynamicPrayerScheduleManager
              settings={sync.settings}
              prayers={initialPrayers}
              initialOverrides={initialOverrides}
              initialJummahShifts={initialJummahShifts}
              initialRules={initialRules}
              initialSubTab={initialSubTab}
              activeSubTab={nav.prayerSubTab}
              onSubTabChange={nav.setPrayerSubTab}
              onRefresh={() => { sync.refreshSettings(); broadcastSignageEvent({ type: 'PRAYERS_UPDATED' }); }}
              onDirtyChange={nav.setHasUnsavedChanges}
            />
          </div>
        )}

        {nav.activeTab === 'SETTINGS' && (
          <div id="panel-settings" role="tabpanel" aria-labelledby="tab-settings">
            <DynamicVenueSettingsForm
              settings={sync.settings}
              initialSubTab={initialSubTab}
              activeCategoryProp={nav.settingsSubTab}
              onCategoryChange={nav.setSettingsSubTab}
              hasAnnualSchedule={hasAnnualSchedule}
              onResetModalStateChange={setIsFactoryResetModalOpen}
              onRefresh={() => { sync.refreshSettings(); broadcastSignageEvent({ type: 'SETTINGS_UPDATED' }); }}
              onResetSuccessWithSetup={() => {
                setIsFactoryResetModalOpen(false);
                triggerBetaNoticeReset();
                resetPrayerDisclaimer();
                sync.refreshSettings();
                sync.refreshPosters();
                nav.applyNavigation('POSTERS');
                hasOpenedInitialSetupRef.current = true;
                setIsInitialSetupModalOpen(true);
              }}
              onDirtyChange={nav.setHasUnsavedChanges}
            />
          </div>
        )}
      </main>

      <SiteFooter />

      <AdminModalsPortal
        settings={sync.settings}
        quickActionNotice={sync.quickActionNotice}
        isUploadModalOpen={isUploadModalOpen}
        isAnnouncementModalOpen={isAnnouncementModalOpen}
        isInitialSetupModalOpen={isInitialSetupModalOpen && !isFactoryResetModalOpen}
        showPwaModal={showPwaModal}
        showLeaveConfirmation={nav.showLeaveConfirmation}
        onCloseUpload={() => setIsUploadModalOpen(false)}
        onCloseAnnouncement={() => setIsAnnouncementModalOpen(false)}
        onCloseInitialSetup={() => setIsInitialSetupModalOpen(false)}
        onClosePwaModal={() => setShowPwaModal(false)}
        onRefreshPosters={sync.refreshPosters}
        onRefreshSettings={sync.refreshSettings}
        onConfirmLeave={nav.confirmLeave}
        onCancelLeave={nav.cancelLeave}
      />
    </div>
  );
}
