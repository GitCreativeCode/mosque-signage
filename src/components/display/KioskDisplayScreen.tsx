'use client';

import React from 'react';
import type {
  Settings,
  PublicDisplaySettings,
  Poster,
  PrayerTimesToday,
  JummahShift,
} from '@/types/index';
import { useDisplayChoreography } from '@/hooks/useDisplayChoreography';
import { useDisplaySync } from '@/hooks/useDisplaySync';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { DisplayViewport } from './DisplayViewport';
import { TopBar } from './TopBar';
import { PosterStage } from './PosterStage';
import { QrCard } from './QrCard';
import { MiniPrayerPill } from './MiniPrayerPill';
import { PrayerDrawer } from './PrayerDrawer';
import { DebugToolbar } from './DebugToolbar';
import { StandbyOverlay } from './StandbyOverlay';
import { PrayerDndOverlay } from './PrayerDndOverlay';
import { FullscreenControl } from './FullscreenControl';

export interface KioskDisplayScreenProps {
  readonly settings: PublicDisplaySettings | Settings;
  readonly initialPosters: readonly Poster[];
  readonly prayers: PrayerTimesToday;
  readonly jummahShifts: readonly JummahShift[];
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
}: KioskDisplayScreenProps) {
  // Real-time SSE synchronization
  const {
    settings,
    posters,
    prayers,
    jummahShifts,
  } = useDisplaySync({
    initialSettings,
    initialPosters,
    initialPrayers,
    initialJummahShifts,
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
    timeOverrideMinutes,
    triggerDrawer,
    clearManualStandby,
    nextPoster,
    prevPoster,
    slideIndex,
    slideDuration,
    activePostersCount,
    toggleForceFriday,
    setTimeOverrideMinutes,
  } = useDisplayChoreography({
    settings,
    initialPosters: posters,
    prayers,
    jummahShifts,
  });

  useScreenWakeLock();
  const isCoordinatesConfigured = Boolean(
    typeof settings.latitude === 'number' && typeof settings.longitude === 'number'
  );
  const hasPrayerTiming = Boolean(
    isCoordinatesConfigured || (prayers && Object.keys(prayers).length > 0)
  );
  const isClockUnsynced = Boolean(displayState.header.is_clock_unsynchronized);
  const isDndActive = Boolean(settings.show_prayer_silence_overlay) && !isStandby && displayState.next_prayer?.status === 'STARTING_NOW' && hasPrayerTiming && !isClockUnsynced;

  return (
    <>
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
              qrUrl={currentPoster?.qr_url}
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
          upcomingPrayerName={(displayState.next_prayer ?? displayState.mini_pill)?.prayer_name}
          showAdhanTimes={settings.show_adhan_times ?? true}
          sidebarMode={settings.sidebar_mode ?? 'drawer'}
          sidebarPosition={settings.sidebar_position ?? 'right'}
          sidebarAccentTheme={settings.sidebar_accent_theme ?? 'teal'}
          pillState={displayState.next_prayer ?? displayState.mini_pill}
          currentPoster={currentPoster}
          isQrVisible={isQrVisible}
          isCoordinatesConfigured={isCoordinatesConfigured}
        />

        {/* Calm Prayer-in-Progress Do-Not-Disturb Reverence Overlay */}
        <PrayerDndOverlay
          isVisible={isDndActive}
          prayerName={displayState.next_prayer?.prayer_name}
          iqamahTime={displayState.next_prayer?.time_display}
          transition={settings.poster_transition ?? 'fade'}
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
        timeOverrideMinutes={timeOverrideMinutes}
        onSetTimeOverrideMinutes={setTimeOverrideMinutes}
        onTriggerDrawer={triggerDrawer}
        onNextPoster={nextPoster}
        onPrevPoster={prevPoster}
      />
      {/* Discreet Auto-Hiding Fullscreen Toggle (Awakens on mouse movement or 'F' key) */}
      <FullscreenControl />
    </>
  );
}
