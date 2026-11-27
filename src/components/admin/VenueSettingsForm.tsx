'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, CheckCircle2, Loader2, Save } from 'lucide-react';
import type { Settings, VenueSettingsCategory } from '@/types/index';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';
import { useVenueSettingsForm } from '@/hooks/useVenueSettingsForm';
import { AdminSecuritySection } from './settings/AdminSecuritySection';
import { DisplayPairingSettingsCard } from './settings/DisplayPairingSettingsCard';
import { ApplianceHardwareSection } from './settings/ApplianceHardwareSection';
import { KioskChoreographySection } from './settings/KioskChoreographySection';
import { VenueIdentityTabCard } from './settings/VenueIdentityTabCard';
import { VenueAstronomyTabCard } from './settings/VenueAstronomyTabCard';
import { VenueSettingsTabHeader } from './settings/VenueSettingsTabHeader';
import { AdminLoadingFallback } from './common/AdminLoadingFallback';

const DynamicFactoryResetModal = dynamic(
  () => import('./settings/FactoryResetModal').then((m) => m.FactoryResetModal),
  { loading: () => <AdminLoadingFallback label="Loading recovery wizard..." /> }
);

export type { VenueSettingsCategory };

export interface VenueSettingsFormProps {
  readonly settings: Settings;
  readonly onRefresh: () => void;
  readonly onResetSuccessWithSetup?: (() => void) | undefined;
  readonly onResetModalStateChange?: ((isOpen: boolean) => void) | undefined;
  readonly onDirtyChange?: ((isDirty: boolean) => void) | undefined;
  readonly initialSubTab?: string | undefined;
  readonly activeCategoryProp?: VenueSettingsCategory | undefined;
  readonly onCategoryChange?: ((cat: VenueSettingsCategory) => void) | undefined;
  readonly hasAnnualSchedule?: boolean | undefined;
}

const SAVE_MESSAGES: Record<Exclude<VenueSettingsCategory, 'SECURITY'>, { readonly toast: string; readonly btn: string }> = {
  IDENTITY: { toast: 'Mosque Profile & Ticker updated and broadcasted live!', btn: 'Save Profile & Ticker' },
  ASTRONOMY: { toast: 'Calculation Rules updated and broadcasted live!', btn: 'Save Calculation Rules' },
  DISPLAY: { toast: 'Display Behaviors updated and broadcasted live!', btn: 'Save Display Behaviors' },
  MAINTENANCE: { toast: 'Appliance Automation settings updated live!', btn: 'Save Appliance Automation' },
};

export function VenueSettingsForm(props: VenueSettingsFormProps) {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const handleSetResetModalOpen = (isOpen: boolean) => {
    setIsResetModalOpen(isOpen);
    props.onResetModalStateChange?.(isOpen);
  };
  const {
    activeCategory, handleCategoryChange, draft, updateField, markDirty,
    isDetectingLocation, detectLocationMsg, handleAutoDetectLocation,
    isSaving, saveSuccess, error, handleSave,
  } = useVenueSettingsForm(props);

  const runHardwareTrigger = async (fn: () => Promise<unknown>, event: Parameters<typeof broadcastSignageEvent>[0]) => {
    try { await fn(); broadcastSignageEvent(event); }
    catch (err) { console.error('Hardware trigger failed:', err); }
  };

  const hasCoordinates =
    typeof draft.latitude === 'number' &&
    typeof draft.longitude === 'number' &&
    Number.isFinite(draft.latitude) &&
    Number.isFinite(draft.longitude);
  const hasPrayerTiming = hasCoordinates || Boolean(props.hasAnnualSchedule);
  const showDisplayWarningBanner =
    !hasPrayerTiming && (draft.sidebarMode !== 'hidden' || draft.showMiniPrayerPill);

  return (
    <div className="space-y-6">
      <VenueSettingsTabHeader activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      {activeCategory === 'SECURITY' ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 sm:p-6 space-y-6 shadow-sm">
          <AdminSecuritySection settings={props.settings} onLocked={props.onRefresh} />
          <DisplayPairingSettingsCard settings={props.settings} onRefresh={props.onRefresh} />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">{error}</div>}

          {activeCategory === 'IDENTITY' && (
            <VenueIdentityTabCard
              greeting={draft.greeting} mosqueName={draft.mosqueName} timezone={draft.timezone}
              dateFormat={draft.dateFormat} tickerText={draft.tickerText}
              onChangeGreeting={(v) => updateField('greeting', v)} onChangeMosqueName={(v) => updateField('mosqueName', v)}
              onChangeTimezone={(v) => updateField('timezone', v)} onChangeDateFormat={(v) => updateField('dateFormat', v)}
              onChangeTickerText={(v) => updateField('tickerText', v)} markDirty={markDirty}
            />
          )}

          {activeCategory === 'ASTRONOMY' && (
            <VenueAstronomyTabCard
              calculationMethod={draft.calculationMethod} madhab={draft.madhab}
              latitude={draft.latitude} longitude={draft.longitude} hijriOffset={draft.hijriOffset}
              isDetectingLocation={isDetectingLocation} detectLocationMsg={detectLocationMsg}
              onChangeCalculationMethod={(v) => updateField('calculationMethod', v)}
              onChangeMadhab={(v) => updateField('madhab', v)} onChangeLatitude={(v) => updateField('latitude', v)}
              onChangeLongitude={(v) => updateField('longitude', v)} onChangeHijriOffset={(v) => updateField('hijriOffset', v)}
              onAutoDetectLocation={handleAutoDetectLocation} markDirty={markDirty}
            />
          )}

          {activeCategory === 'DISPLAY' && (
            <div className="space-y-6">
              {showDisplayWarningBanner && (
                <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start space-x-3.5 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="font-bold text-xs sm:text-sm">
                      Prayer Timings Required for Timetable &amp; Countdown Overlays
                    </div>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                      You have enabled a prayer timetable mode or the floating countdown pill, but venue coordinates or an imported schedule CSV have not been configured. The TV broadcast screen will display a configuration notice or suppress the pill until prayer timings are provided. It is recommended to provide a full year schedule (or at least one month) for continuous display.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('ASTRONOMY')}
                        className="text-xs font-bold underline hover:text-amber-950 dark:hover:text-white cursor-pointer"
                      >
                        Configure Coordinates in Settings →
                      </button>
                      <a
                        href="/admin?tab=prayers"
                        className="text-xs font-bold underline hover:text-amber-950 dark:hover:text-white"
                      >
                        Import Timetable CSV in Prayers →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <KioskChoreographySection
                hasPrayerTiming={hasPrayerTiming}
                showAdhanTimes={draft.showAdhanTimes} setShowAdhanTimes={(v) => updateField('showAdhanTimes', v)}
                sidebarMode={draft.sidebarMode} setSidebarMode={(v) => updateField('sidebarMode', v)}
                sidebarPosition={draft.sidebarPosition} setSidebarPosition={(v) => updateField('sidebarPosition', v)}
                drawerInterval={draft.drawerInterval} setDrawerInterval={(v) => updateField('drawerInterval', v)}
                drawerDuration={draft.drawerDuration} setDrawerDuration={(v) => updateField('drawerDuration', v)}
                showQrDuringDrawer={draft.showQrDuringDrawer} setShowQrDuringDrawer={(v) => updateField('showQrDuringDrawer', v)}
                showMiniPrayerPill={draft.showMiniPrayerPill} setShowMiniPrayerPill={(v) => updateField('showMiniPrayerPill', v)}
                showPrayerSilenceOverlay={draft.showPrayerSilenceOverlay} setShowPrayerSilenceOverlay={(v) => updateField('showPrayerSilenceOverlay', v)}
                silenceScreenSubtitle={draft.silenceScreenSubtitle} setSilenceScreenSubtitle={(v) => updateField('silenceScreenSubtitle', v)}
                silenceScreenAccentTheme={draft.silenceScreenAccentTheme} setSilenceScreenAccentTheme={(v) => updateField('silenceScreenAccentTheme', v)}
                miniPrayerPillPosition={draft.miniPrayerPillPosition} setMiniPrayerPillPosition={(v) => updateField('miniPrayerPillPosition', v)}
                displayResolution={draft.displayResolution} setDisplayResolution={(v) => updateField('displayResolution', v)}
                overscanMarginPercent={draft.overscanMarginPercent} setOverscanMarginPercent={(v) => updateField('overscanMarginPercent', v)}
                clockShowSeconds={draft.clockShowSeconds} setClockShowSeconds={(v) => updateField('clockShowSeconds', v)}
                clockTimeFormat={draft.clockTimeFormat} setClockTimeFormat={(v) => updateField('clockTimeFormat', v)}
                posterFit={draft.posterFit} setPosterFit={(v) => updateField('posterFit', v)}
                posterTransition={draft.posterTransition} setPosterTransition={(v) => updateField('posterTransition', v)}
                showProgressBar={draft.showProgressBar} setShowProgressBar={(v) => updateField('showProgressBar', v)}
                qrReadDelay={draft.qrReadDelay} setQrReadDelay={(v) => updateField('qrReadDelay', v)}
                rememberedPeriodicDelay={draft.rememberedPeriodicDelay} setRememberedPeriodicDelay={(v) => updateField('rememberedPeriodicDelay', v)}
                startingNowDuration={draft.startingNowDuration} setStartingNowDuration={(v) => updateField('startingNowDuration', v)}
                markDirty={markDirty}
              />
            </div>
          )}

          {activeCategory === 'MAINTENANCE' && (
            <div className="space-y-6">
              <ApplianceHardwareSection
                hasPrayerTiming={hasPrayerTiming}
                tvAutoPower={draft.tvAutoPower} setTvAutoPower={(v) => updateField('tvAutoPower', v)}
                powerScheduleMode={draft.powerScheduleMode} setPowerScheduleMode={(v) => updateField('powerScheduleMode', v)}
                powerOnTime={draft.powerOnTime} setPowerOnTime={(v) => updateField('powerOnTime', v)}
                powerOffTime={draft.powerOffTime} setPowerOffTime={(v) => updateField('powerOffTime', v)}
                powerFajrOffset={draft.powerFajrOffset} setPowerFajrOffset={(v) => updateField('powerFajrOffset', v)}
                powerIshaOffset={draft.powerIshaOffset} setPowerIshaOffset={(v) => updateField('powerIshaOffset', v)}
                tvControlProtocol={draft.tvControlProtocol} setTvControlProtocol={(v) => updateField('tvControlProtocol', v)}
                standbyAppearance={draft.standbyAppearance} setStandbyAppearance={(v) => updateField('standbyAppearance', v)}
                standbyShowAttribution={draft.standbyShowAttribution} setStandbyShowAttribution={(v) => updateField('standbyShowAttribution', v)}
                audioMuteDuringPrayer={draft.audioMuteDuringPrayer} setAudioMuteDuringPrayer={(v) => updateField('audioMuteDuringPrayer', v)}
                audioReceiverHost={draft.audioReceiverHost} setAudioReceiverHost={(v) => updateField('audioReceiverHost', v)}
                audioReceiverPort={draft.audioReceiverPort} setAudioReceiverPort={(v) => updateField('audioReceiverPort', v)}
                audioReceiverProtocol={draft.audioReceiverProtocol} setAudioReceiverProtocol={(v) => updateField('audioReceiverProtocol', v)}
                audioMuteDelay={draft.audioMuteDelay} setAudioMuteDelay={(v) => updateField('audioMuteDelay', v)}
                markDirty={markDirty}
                onQuickReloadTV={async () => runHardwareTrigger(async () => (await import('@/lib/actions/hardware')).triggerKioskReload(), { type: 'RELOAD_DISPLAY' })}
                onQuickTestDrawer={async () => runHardwareTrigger(async () => (await import('@/lib/actions/hardware')).triggerKioskTestDrawer(15), { type: 'TEST_DRAWER', durationSeconds: 15 })}
                onQuickToggleSimulator={async () => runHardwareTrigger(async () => (await import('@/lib/actions/hardware')).triggerKioskToggleSimulator(), { type: 'TOGGLE_SIMULATOR' })}
              />
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-rose-500 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4" /><span>Danger Zone: Factory Reset System</span>
                    </span>
                    <p className="text-xs text-[var(--admin-text-muted)]">
                      Permanently wipes all uploaded posters, notices, timetable overrides, and custom rules back to factory default presets.
                    </p>
                  </div>
                  <button type="button" onClick={() => handleSetResetModalOpen(true)} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto cursor-pointer">
                    Factory Reset...
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-500 flex items-center space-x-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{SAVE_MESSAGES[activeCategory].toast}</span>
                </span>
              )}
            </div>
            <button type="submit" disabled={isSaving} className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-5 py-2.5 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center justify-center space-x-2 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : SAVE_MESSAGES[activeCategory].btn}</span>
            </button>
          </div>
        </form>
      )}

      {isResetModalOpen && (
        <DynamicFactoryResetModal
          isOpen={isResetModalOpen}
          authMode={props.settings?.auth_mode ?? 'pin'}
          onClose={() => handleSetResetModalOpen(false)}
          onResetSuccess={(opts) => {
            handleSetResetModalOpen(false);
            if (opts?.triggerInitialSetup && props.onResetSuccessWithSetup) props.onResetSuccessWithSetup();
            else props.onRefresh();
          }}
        />
      )}
    </div>
  );
}
