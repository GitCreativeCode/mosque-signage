'use client';

import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import type {
  Settings,
  PublicDisplaySettings,
  Poster,
  PrayerTimesToday,
  JummahShift,
  EidShift,
} from '@/types/index';
import { isFriday } from '@/lib/engine/jummah-resolver';
import { useDisplayChoreography } from '@/hooks/useDisplayChoreography';
import { useDisplaySync } from '@/hooks/useDisplaySync';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { useIsSmallScreen } from '@/hooks/useIsSmallScreen';
import { DisplayViewport } from './DisplayViewport';
import { MobileCompanionDisplay } from './MobileCompanionDisplay';
import { TopBar } from './TopBar';
import { PosterStage } from './PosterStage';
import { QrCard } from './QrCard';
import { MiniPrayerPill } from './MiniPrayerPill';
import { PrayerDrawer } from './PrayerDrawer';
import { DebugToolbar } from './DebugToolbar';
import { StandbyOverlay } from './StandbyOverlay';
import { PrayerDndOverlay } from './PrayerDndOverlay';
import { FullscreenControl } from './FullscreenControl';
import { isPosterQrActive } from '@/lib/posters/qr-schedule';

export interface KioskDisplayScreenProps {
  readonly settings: PublicDisplaySettings | Settings;
  readonly initialPosters: readonly Poster[];
  readonly prayers: PrayerTimesToday;
  readonly jummahShifts: readonly JummahShift[];
  readonly eidShifts?: readonly EidShift[] | undefined;
}

function resolveSilenceDetailLine(
  prayerName: string | undefined,
  timeDisplay: string | undefined,
  jummahShifts: readonly JummahShift[],
  eidShifts: readonly EidShift[]
): string | null {
  if (!prayerName) return null;
  const lower = prayerName.toLowerCase();

  if (lower.includes('khutbah') || lower.includes('jummah')) {
    const active = jummahShifts.find(
      (s) => s.status === 'KHUTBAH_IN_PROGRESS' || s.status === 'STARTING_NOW'
    );
    if (!active) return null;
    const parts = [
      active.khateeb_name?.trim() ? `Khateeb: ${active.khateeb_name.trim()}` : null,
      active.topic?.trim() || null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : null;
  }

  if (lower.includes('eid')) {
    const active = eidShifts.find((s) => s.salah_time === timeDisplay) ?? eidShifts[0];
    if (!active) return null;
    const parts = [
      active.khateeb_name?.trim() ? `Khateeb: ${active.khateeb_name.trim()}` : null,
      active.location?.trim() || null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : null;
  }

  return null;
}

/**
 * 1080p Digital Signage Kiosk Coordinator
 * Assembles TopBar, PosterStage, QrCard, MiniPrayerPill, PrayerDrawer,
 * and DebugToolbar into a unified, GPU-accelerated 1080p canvas with
 * real-time SSE mutation sync.
 */
export function KioskDisplayScreen({
  settings: initialSettings,
  initialPosters,
  prayers: initialPrayers,
  jummahShifts: initialJummahShifts,
  eidShifts: initialEidShifts = [],
}: KioskDisplayScreenProps) {
  // Real-time SSE synchronization
  const {
    settings,
    posters,
    prayers,
    jummahShifts,
    eidShifts,
  } = useDisplaySync({
    initialSettings,
    initialPosters,
    initialPrayers,
    initialJummahShifts,
    initialEidShifts,
  });

  const {
    displayState,
    currentPoster,
    previousPoster,
    isCrossFading,
    progressPercentage,
    isDrawerOpen,
    isStandby,
    isQrVisible,
    isPillVisible,
    isFridayForced,
    isEidForced,
    timeOverrideMinutes,
    triggerDrawer,
    clearManualStandby,
    nextPoster,
    prevPoster,
    slideIndex,
    slideDuration,
    activePostersCount,
    toggleForceFriday,
    toggleForceEid,
    setTimeOverrideMinutes,
    isSilenceTestActive,
    toggleSilenceTest,
  } = useDisplayChoreography({
    settings,
    initialPosters: posters,
    prayers,
    jummahShifts,
    eidShifts,
  });

  useScreenWakeLock();
  const { isSmallScreen } = useIsSmallScreen();
  const [forceTvPreviewOnMobile, setForceTvPreviewOnMobile] = useState(false);

  const isCoordinatesConfigured = Boolean(
    typeof settings.latitude === 'number' && typeof settings.longitude === 'number'
  );
  const hasPrayerTiming = Boolean(
    isCoordinatesConfigured ||
    (prayers && Object.values(prayers).some((p) => typeof p === 'object' && p?.iqamah_time && p.iqamah_time !== '--:--')) ||
    (jummahShifts && jummahShifts.length > 0) ||
    (eidShifts && eidShifts.length > 0)
  );
  const isClockUnsynced = Boolean(displayState.header.is_clock_unsynchronized);
  const isNaturalDndActive = Boolean(settings.show_prayer_silence_overlay) && !isStandby && displayState.next_prayer?.status === 'STARTING_NOW' && hasPrayerTiming && !isClockUnsynced;
  const isDndActive = isNaturalDndActive || isSilenceTestActive;
  const silenceDetailLine = resolveSilenceDetailLine(
    displayState.next_prayer?.prayer_name,
    displayState.next_prayer?.time_display,
    displayState.resolved_jummah_shifts ?? jummahShifts,
    eidShifts
  );

  if (isSmallScreen && !forceTvPreviewOnMobile) {
    return (
      <>
        <MobileCompanionDisplay
          settings={settings}
          displayState={displayState}
          currentPoster={currentPoster}
          progressPercentage={progressPercentage}
          slideIndex={slideIndex}
          activePostersCount={activePostersCount}
          prayers={prayers}
          jummahShifts={displayState.resolved_jummah_shifts ?? jummahShifts}
          eidShifts={eidShifts}
          isStandby={isStandby}
          isDndActive={isDndActive}
          silenceDetailLine={silenceDetailLine}
          isCoordinatesConfigured={isCoordinatesConfigured}
          hasPrayerTiming={hasPrayerTiming}
          onPrevPoster={prevPoster}
          onNextPoster={nextPoster}
          onWakeStandby={clearManualStandby}
          onSwitchToTvPreview={() => setForceTvPreviewOnMobile(true)}
        />
        <DebugToolbar
          displayState={displayState}
          isFridayForced={isFridayForced}
          onToggleForceFriday={toggleForceFriday}
          isEidForced={isEidForced}
          onToggleForceEid={toggleForceEid}
          timeOverrideMinutes={timeOverrideMinutes}
          onSetTimeOverrideMinutes={setTimeOverrideMinutes}
          onTriggerDrawer={triggerDrawer}
          onNextPoster={nextPoster}
          onPrevPoster={prevPoster}
          isSilenceTestActive={isSilenceTestActive}
          onToggleSilenceTest={toggleSilenceTest}
        />
      </>
    );
  }

  return (
    <>
      {isSmallScreen && forceTvPreviewOnMobile && (
        <button
          type="button"
          onClick={() => setForceTvPreviewOnMobile(false)}
          className="fixed top-3 left-3 z-50 px-3 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-white/20 backdrop-blur-md shadow-2xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          <span>Mobile View</span>
        </button>
      )}
      <DisplayViewport
        resolution={settings.display_resolution ?? '1080p'}
        overscanMarginPercent={settings.overscan_margin_percent ?? 0}
      >
        {/* Top Broadcast Bar (Height: 96px) */}
        <TopBar
          hijriDate={displayState.header.hijri_date}
          gregorianDate={displayState.header.gregorian_date}
          dateFormat={settings.date_format ?? 'both'}
          clockTime={displayState.header.clock_time}
          tickerText={displayState.header.ticker}
          mosqueName={settings.mosque_name}
          greeting={settings.header_greeting}
          isClockUnsynchronized={isClockUnsynced}
        />

        {/* Main 16:9 Canvas Surface */}
        <PosterStage
          currentPoster={currentPoster}
          previousPoster={previousPoster}
          isCrossFading={isCrossFading}
          progressPercentage={progressPercentage}
          slideIndex={slideIndex}
          slideDuration={slideDuration}
          activePostersCount={activePostersCount}
          isDrawerOpen={!isDndActive && isDrawerOpen}
          sidebarMode={isDndActive ? 'hidden' : (settings.sidebar_mode ?? 'drawer')}
          sidebarPosition={settings.sidebar_position ?? 'right'}
          sidebarAccentTheme={settings.sidebar_accent_theme ?? 'teal'}
          transition={settings.poster_transition ?? 'fade'}
          fitMode={settings.poster_fit ?? 'cover'}
          mosqueName={settings.mosque_name}
          showProgressBar={settings.show_progress_bar ?? true}
          isSilenceActive={isDndActive}
        >
          {/* Contextual QR Card on poster (Active in periodic drawer mode; in always-open mode, QR docks cleanly inside sidebar under cards) */}
          {settings.sidebar_mode !== 'always_open' && !isDndActive && (
            <QrCard
              qrUrl={isPosterQrActive(currentPoster) ? currentPoster?.qr_url : undefined}
              qrLabel={currentPoster?.qr_label}
              position={currentPoster?.qr_position ?? 'bottom-left'}
              isVisible={isQrVisible}
              isPillVisible={isPillVisible}
              pillPosition={settings.mini_prayer_pill_position ?? 'bottom-right'}
            />
          )}
        </PosterStage>

        {/* Floating Mini Prayer Pill (Suppressed in permanent always_open mode or when disabled in settings or coordinates unset) */}
        {settings.sidebar_mode !== 'always_open' && isCoordinatesConfigured && !isDndActive && (
          <MiniPrayerPill
            pillState={displayState.next_prayer ?? displayState.mini_pill}
            isVisible={isPillVisible}
            accentTheme={settings.sidebar_accent_theme ?? 'teal'}
            position={settings.mini_prayer_pill_position ?? 'bottom-right'}
          />
        )}

        {/* Periodic Sliding Prayer Drawer or Permanent Always-Open Sidebar */}
        <PrayerDrawer
          isOpen={!isDndActive && isDrawerOpen}
          drawerType={displayState.drawer_type}
          prayers={prayers}
          jummahShifts={displayState.resolved_jummah_shifts ?? jummahShifts}
          eidShifts={eidShifts}
          activeEidType={settings.active_eid_type}
          isFriday={isFridayForced || isFriday(new Date(), settings.timezone)}
          eidFridayNote={settings.eid_friday_note}
          upcomingPrayerName={(displayState.next_prayer ?? displayState.mini_pill)?.prayer_name}
          showAdhanTimes={settings.show_adhan_times ?? true}
          sidebarMode={settings.sidebar_mode ?? 'drawer'}
          sidebarPosition={settings.sidebar_position ?? 'right'}
          sidebarAccentTheme={settings.sidebar_accent_theme ?? 'teal'}
          pillState={displayState.next_prayer ?? displayState.mini_pill}
          currentPoster={currentPoster}
          isQrVisible={isQrVisible}
          isCoordinatesConfigured={isCoordinatesConfigured}
          ramadanModeEnabled={Boolean(displayState.ramadan_visibility?.showNightPrayers)}
          ramadanFastingMarkersEnabled={Boolean(displayState.ramadan_visibility?.showFastingMarkers)}
          ramadanSuhoorBufferMinutes={settings.ramadan_suhoor_buffer_minutes}
          ramadanTaraweehTime={settings.ramadan_taraweeh_time}
          ramadanTaraweehRakats={settings.ramadan_taraweeh_rakats}
          ramadanTaraweehSessions={settings.ramadan_taraweeh_sessions}
        />

        {/* Calm Prayer-in-Progress Do-Not-Disturb Reverence Overlay */}
        <PrayerDndOverlay
          isVisible={isDndActive}
          prayerName={displayState.next_prayer?.prayer_name ?? (isSilenceTestActive ? 'Maghrib' : undefined)}
          iqamahTime={displayState.next_prayer?.time_display ?? (isSilenceTestActive ? '18:30' : undefined)}
          detailLine={resolveSilenceDetailLine(
            displayState.next_prayer?.prayer_name,
            displayState.next_prayer?.time_display,
            displayState.resolved_jummah_shifts ?? jummahShifts,
            eidShifts
          )}
          isExtendedSession={Boolean(
            displayState.next_prayer?.prayer_name &&
              /taraweeh|qiyam|tahajjud|khutbah/i.test(displayState.next_prayer.prayer_name)
          )}
          transition={settings.poster_transition ?? 'fade'}
          accentTheme={settings.silence_screen_accent_theme ?? 'green'}
          customSubtitle={settings.silence_screen_subtitle}
        />

        {/* Low-Power Pitch-Black Standby Overlay with Burn-In Guard */}
        <StandbyOverlay
          isStandby={isStandby}
          appearance={settings.standby_appearance ?? 'dim_clock'}
          showAttribution={Boolean(settings.standby_show_attribution)}
          clockTime={displayState.header.clock_time}
          nextPrayerName={displayState.next_prayer?.prayer_name}
          nextPrayerTime={displayState.next_prayer?.time_display}
          onForceWake={clearManualStandby}
        />
      </DisplayViewport>

      {/* Developer Simulator & Scenario Scrubber Toolbar (Shift+S or ~) */}
      <DebugToolbar
        displayState={displayState}
        isFridayForced={isFridayForced}
        onToggleForceFriday={toggleForceFriday}
        isEidForced={isEidForced}
        onToggleForceEid={toggleForceEid}
        timeOverrideMinutes={timeOverrideMinutes}
        onSetTimeOverrideMinutes={setTimeOverrideMinutes}
        onTriggerDrawer={triggerDrawer}
        onNextPoster={nextPoster}
        onPrevPoster={prevPoster}
        isSilenceTestActive={isSilenceTestActive}
        onToggleSilenceTest={toggleSilenceTest}
      />
      {/* Discreet Auto-Hiding Fullscreen Toggle (Awakens on mouse movement or 'F' key) */}
      <FullscreenControl />
    </>
  );
}
