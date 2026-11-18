'use client';

import type { MutableRefObject } from 'react';
import type { JummahShift, Poster, PrayerTimesToday, Settings } from '@/types/index';
import { computeDisplaySnapshot, getActivePosters, shouldTriggerDrawer } from '@/lib/engine/index';
import {
  buildPowerConfigFromSettings,
  evaluateQrVisibilityOnTick,
  posterContainsVideo,
} from '@/lib/engine/choreography-helpers';
import { isScreenInPowerWindow } from '@/lib/hardware/power-engine';

export interface ManualPowerOverride {
  readonly state: 'ON' | 'STANDBY';
  readonly expiresAtMs: number;
}

export function resolveStandbyWithManualOverride(
  scheduledStandby: boolean,
  override: ManualPowerOverride | null,
  nowMs: number = Date.now()
): boolean {
  if (override && nowMs < override.expiresAtMs) {
    return override.state === 'STANDBY';
  }
  return scheduledStandby;
}

export interface ChoreographyMutableState {
  slideIndex: number;
  slideElapsedSeconds: number;
  isDrawerOpen: boolean;
  drawerElapsedSeconds: number;
  drawerDurationOverrideSeconds: number | null;
  lastDrawerTrigger: Date;
  timeOverrideMinutes: number | null;
  isFridayForced: boolean;
  isQrVisible: boolean;
  manualPowerOverride: ManualPowerOverride | null;
}

export interface ChoreographyLiveProps {
  settings: Settings;
  initialPosters: readonly Poster[];
  prayers: PrayerTimesToday;
  jummahShifts: readonly JummahShift[];
}

export interface ChoreographyTickSetters {
  readonly setNow: (d: Date) => void;
  readonly setIsStandby: (v: boolean) => void;
  readonly setIsDrawerOpen: (v: boolean) => void;
  readonly setDrawerElapsedSeconds: (v: number) => void;
  readonly setDrawerDurationOverrideSeconds: (v: number | null) => void;
  readonly setLastDrawerTrigger: (d: Date) => void;
  readonly setSlideElapsedSeconds: (v: number) => void;
  readonly setIsQrVisible: (v: boolean) => void;
  readonly setPreviousPoster: (p: Poster | null) => void;
  readonly setIsCrossFading: (v: boolean) => void;
  readonly setSlideIndex: (v: number) => void;
}

export function preloadUpcomingPosterImage(
  activeList: readonly Poster[],
  slideIndex: number
): void {
  if (typeof window === 'undefined' || activeList.length <= 1) return;
  const upcoming = activeList[(slideIndex + 1) % activeList.length];
  if (!upcoming) return;
  const targetSrc = upcoming.media_type === 'video' ? upcoming.thumbnail_path : upcoming.image_path;
  if (!targetSrc) return;
  const img = new Image();
  img.src = targetSrc;
}

function advanceDrawerCountdown(
  curSet: Settings,
  state: ChoreographyMutableState,
  setters: ChoreographyTickSetters
): void {
  if (curSet.sidebar_mode === 'always_open' || !state.isDrawerOpen) return;
  const effectiveDuration = state.drawerDurationOverrideSeconds ?? curSet.drawer_display_seconds;
  const nextDrawerElapsed = state.drawerElapsedSeconds + 1;
  setters.setDrawerElapsedSeconds(nextDrawerElapsed);
  if (nextDrawerElapsed >= effectiveDuration) {
    setters.setIsDrawerOpen(false);
    setters.setDrawerElapsedSeconds(0);
    setters.setDrawerDurationOverrideSeconds(null);
  }
}

function rotatePosterOnDwellComplete(
  curSet: Settings,
  activeList: readonly Poster[],
  activePoster: Poster | null,
  currentNow: Date,
  state: ChoreographyMutableState,
  setters: ChoreographyTickSetters
): void {
  const isAlwaysOpen = curSet.sidebar_mode === 'always_open';
  const isHidden = curSet.sidebar_mode === 'hidden';
  if (
    !isAlwaysOpen &&
    !isHidden &&
    !state.isDrawerOpen &&
    shouldTriggerDrawer(state.lastDrawerTrigger, currentNow, curSet.drawer_interval_minutes)
  ) {
    setters.setIsDrawerOpen(true);
    setters.setLastDrawerTrigger(currentNow);
    setters.setDrawerElapsedSeconds(0);
  }
  if (activeList.length <= 1) {
    if (activePoster && posterContainsVideo(activePoster)) {
      setters.setSlideIndex(state.slideIndex + 1);
    }
    setters.setSlideElapsedSeconds(0);
    return;
  }
  setters.setPreviousPoster(activePoster);
  setters.setIsCrossFading(true);
  const nextIdx = (state.slideIndex + 1) % activeList.length;
  setters.setSlideIndex(nextIdx);
  setters.setSlideElapsedSeconds(0);
  setTimeout(() => setters.setIsCrossFading(false), 600);
  if (!isAlwaysOpen) return;
  const nextHasQr = Boolean(activeList[nextIdx]?.qr_url?.trim());
  if (nextHasQr) setTimeout(() => setters.setIsQrVisible(true), 300);
  else setters.setIsQrVisible(false);
}

export function processChoreographyTick(
  getEffectiveNow: () => Date,
  stateRef: MutableRefObject<ChoreographyMutableState>,
  livePropsRef: MutableRefObject<ChoreographyLiveProps>,
  setters: ChoreographyTickSetters
): void {
  const currentNow = getEffectiveNow();
  setters.setNow(currentNow);
  const { settings: curSet, prayers: curPrayers, jummahShifts: curShifts, initialPosters: curPosters } = livePropsRef.current;
  const state = stateRef.current;

  const inPower = isScreenInPowerWindow(
    buildPowerConfigFromSettings(curSet),
    currentNow,
    curSet.timezone,
    { fajrAdhan: curPrayers.fajr?.adhan_time, ishaIqamah: curPrayers.isha?.iqamah_time }
  );
  const scheduledStandby = Boolean(curSet.tv_auto_power) && !inPower;
  const isStandby = resolveStandbyWithManualOverride(scheduledStandby, state.manualPowerOverride);
  setters.setIsStandby(isStandby);

  const snap = computeDisplaySnapshot(
    curSet, curPosters, curPrayers, curShifts, state.slideIndex, state.lastDrawerTrigger, currentNow
  );
  const isDndActive = !isStandby && snap.next_prayer?.status === 'STARTING_NOW';
  const activeList = getActivePosters(curPosters, currentNow);
  const activePoster = activeList.length > 0 ? activeList[state.slideIndex % activeList.length] ?? null : null;
  const dwell = activePoster?.duration_seconds ?? 15;

  advanceDrawerCountdown(curSet, state, setters);
  if (isStandby || isDndActive) return;

  const nextElapsed = state.slideElapsedSeconds + 1;
  setters.setSlideElapsedSeconds(nextElapsed);
  setters.setIsQrVisible(
    evaluateQrVisibilityOnTick(
      activePoster, activeList.length, nextElapsed, dwell,
      curSet.sidebar_mode === 'always_open', state.isDrawerOpen, curSet,
      state.isQrVisible
    )
  );
  if (nextElapsed < dwell) return;
  rotatePosterOnDwellComplete(curSet, activeList, activePoster, currentNow, state, setters);
}

