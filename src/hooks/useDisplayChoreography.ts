'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Settings, PublicDisplaySettings, Poster, PrayerTimesToday, JummahShift, EidShift, DisplayState } from '@/types/index';
import { computeDisplaySnapshot, getActivePosters } from '@/lib/engine/index';
import { resolveSimulatedDate } from '@/lib/engine/choreography-helpers';
import {
  preloadUpcomingPosterImage,
  processChoreographyTick,
  type ChoreographyLiveProps,
  type ChoreographyMutableState,
  type ManualPowerOverride,
} from './choreography-side-effects';

export interface UseDisplayChoreographyParams {
  readonly settings: PublicDisplaySettings | Settings;
  readonly initialPosters: readonly Poster[];
  readonly prayers: PrayerTimesToday;
  readonly jummahShifts: readonly JummahShift[];
  readonly eidShifts?: readonly EidShift[] | undefined;
}

export function useDisplayChoreography({
  settings,
  initialPosters,
  prayers,
  jummahShifts,
  eidShifts = [],
}: UseDisplayChoreographyParams) {
  const [timeOverrideMinutes, setTimeOverrideMinutes] = useState<number | null>(null);
  const [isFridayForced, setIsFridayForced] = useState<boolean>(false);
  const [isEidForced, setIsEidForced] = useState<boolean>(false);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [slideElapsedSeconds, setSlideElapsedSeconds] = useState<number>(0);
  const [previousPoster, setPreviousPoster] = useState<Poster | null>(null);
  const [isCrossFading, setIsCrossFading] = useState<boolean>(false);

  const isAlwaysOpen = settings.sidebar_mode === 'always_open';
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(isAlwaysOpen);
  const [drawerElapsedSeconds, setDrawerElapsedSeconds] = useState<number>(0);
  const [drawerDurationOverrideSeconds, setDrawerDurationOverrideSeconds] = useState<number | null>(null);
  const [lastDrawerTrigger, setLastDrawerTrigger] = useState<Date>(() => new Date(Date.now() - 3600000));
  const [now, setNow] = useState<Date>(() => new Date());
  const [isStandby, setIsStandby] = useState<boolean>(false);
  const [isSilenceTestActive, setIsSilenceTestActive] = useState<boolean>(false);
  const [manualPowerOverride, setManualPowerOverride] = useState<ManualPowerOverride | null>(null);
  const [isQrVisible, setIsQrVisible] = useState<boolean>(() => isAlwaysOpen && Boolean(initialPosters[0]?.qr_url));

  const stateRef = useRef<ChoreographyMutableState>({
    slideIndex, slideElapsedSeconds, isDrawerOpen, drawerElapsedSeconds, drawerDurationOverrideSeconds,
    lastDrawerTrigger, timeOverrideMinutes, isFridayForced, isEidForced, isQrVisible, manualPowerOverride,
  });
  stateRef.current = {
    slideIndex, slideElapsedSeconds, isDrawerOpen, drawerElapsedSeconds, drawerDurationOverrideSeconds,
    lastDrawerTrigger, timeOverrideMinutes, isFridayForced, isEidForced, isQrVisible, manualPowerOverride,
  };

  const livePropsRef = useRef<ChoreographyLiveProps>({ settings, initialPosters, prayers, jummahShifts, eidShifts });
  livePropsRef.current = { settings, initialPosters, prayers, jummahShifts, eidShifts };

  useEffect(() => {
    setIsDrawerOpen(settings.sidebar_mode === 'always_open');
    if (settings.sidebar_mode !== 'always_open') setDrawerElapsedSeconds(0);
  }, [settings.sidebar_mode]);

  const getEffectiveNow = useCallback((): Date => {
    return resolveSimulatedDate(
      new Date(),
      livePropsRef.current.settings.timezone,
      stateRef.current.timeOverrideMinutes,
      stateRef.current.isFridayForced
    );
  }, []);

  useEffect(() => {
    preloadUpcomingPosterImage(
      getActivePosters(initialPosters, getEffectiveNow(), livePropsRef.current.settings.timezone),
      slideIndex
    );
  }, [slideIndex, initialPosters, getEffectiveNow]);

  useEffect(() => {
    const activeList = getActivePosters(initialPosters, getEffectiveNow(), livePropsRef.current.settings.timezone);
    if (activeList.length > 0 && slideIndex >= activeList.length) {
      setSlideIndex(0);
      setSlideElapsedSeconds(0);
    }
  }, [initialPosters, getEffectiveNow, slideIndex]);

  useEffect(() => {
    const setters = {
      setNow, setIsStandby, setIsDrawerOpen, setDrawerElapsedSeconds, setDrawerDurationOverrideSeconds,
      setLastDrawerTrigger, setSlideElapsedSeconds, setIsQrVisible,
      setPreviousPoster, setIsCrossFading, setSlideIndex,
    };
    const timer = setInterval(() => {
      processChoreographyTick(getEffectiveNow, stateRef, livePropsRef, setters);
    }, 1000);
    return () => clearInterval(timer);
  }, [getEffectiveNow]);

  const triggerDrawer = useCallback((durationOverrideSeconds?: number) => {
    setIsDrawerOpen(true);
    setLastDrawerTrigger(getEffectiveNow());
    setDrawerElapsedSeconds(0);
    setDrawerDurationOverrideSeconds(
      typeof durationOverrideSeconds === 'number' && durationOverrideSeconds > 0
        ? durationOverrideSeconds
        : null
    );
  }, [getEffectiveNow]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ durationSeconds?: number }>).detail;
      triggerDrawer(detail?.durationSeconds);
    };
    window.addEventListener('kiosk:test-drawer', handler);
    return () => window.removeEventListener('kiosk:test-drawer', handler);
  }, [triggerDrawer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePower = (e: Event) => {
      const detail = (e as CustomEvent<{ state?: 'ON' | 'STANDBY' }>).detail;
      if (detail?.state === 'STANDBY' || detail?.state === 'ON') {
        const nextOverride: ManualPowerOverride = {
          state: detail.state,
          expiresAtMs: Date.now() + 60_000,
        };
        stateRef.current.manualPowerOverride = nextOverride;
        setManualPowerOverride(nextOverride);
        setIsStandby(detail.state === 'STANDBY');
      }
    };
    window.addEventListener('kiosk:power-state-changed', handlePower);
    return () => window.removeEventListener('kiosk:power-state-changed', handlePower);
  }, []);

  const toggleSilenceTest = useCallback(() => {
    setIsSilenceTestActive((p) => !p);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSilenceEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ active?: boolean }>).detail;
      setIsSilenceTestActive((prev) => (detail?.active !== undefined ? detail.active : !prev));
    };
    window.addEventListener('kiosk:test-silence', handleSilenceEvent);
    return () => window.removeEventListener('kiosk:test-silence', handleSilenceEvent);
  }, []);

  useEffect(() => {
    if (!isSilenceTestActive || typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSilenceTestActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSilenceTestActive]);

  const clearManualStandby = useCallback(() => {
    if (stateRef.current.manualPowerOverride?.state === 'STANDBY') {
      stateRef.current.manualPowerOverride = null;
      setManualPowerOverride(null);
      setIsStandby(false);
    }
  }, []);

  const stepPoster = useCallback((delta: number) => {
    const curSettings = livePropsRef.current.settings;
    if (Boolean(curSettings.show_prayer_silence_overlay)) {
      const snap = computeDisplaySnapshot(
        curSettings,
        livePropsRef.current.initialPosters,
        livePropsRef.current.prayers,
        livePropsRef.current.jummahShifts,
        stateRef.current.slideIndex,
        stateRef.current.lastDrawerTrigger,
        getEffectiveNow()
      );
      if (snap.next_prayer?.status === 'STARTING_NOW') {
        return;
      }
    }
    const activeList = getActivePosters(initialPosters, getEffectiveNow(), livePropsRef.current.settings.timezone);
    if (activeList.length === 0) return;
    setPreviousPoster(activeList[slideIndex % activeList.length] ?? null);
    setIsCrossFading(true);
    setSlideIndex((prev) => (prev + delta + activeList.length) % activeList.length);
    setSlideElapsedSeconds(0);
    setTimeout(() => setIsCrossFading(false), 600);
  }, [initialPosters, getEffectiveNow, slideIndex]);

  const effectiveNow = getEffectiveNow() || now;
  const displayState: DisplayState = computeDisplaySnapshot(
    settings,
    initialPosters,
    prayers,
    jummahShifts,
    slideIndex,
    lastDrawerTrigger,
    effectiveNow,
    { forceDrawerOpen: isDrawerOpen, eidShifts, forceEid: isEidForced }
  );
  const activePosters = getActivePosters(initialPosters, effectiveNow, settings.timezone);
  const currentPoster = activePosters.length > 0 ? activePosters[slideIndex % activePosters.length] ?? null : null;
  const activeDuration = currentPoster?.duration_seconds ?? 15;

  return {
    displayState, currentPoster, previousPoster, isCrossFading,
    progressPercentage: (slideElapsedSeconds / activeDuration) * 100,
    isDrawerOpen, isStandby, isQrVisible,
    isPillVisible: Boolean(settings.show_mini_prayer_pill) && !isAlwaysOpen && !isDrawerOpen,
    isFridayForced, isEidForced, timeOverrideMinutes, triggerDrawer, clearManualStandby,
    nextPoster: useCallback(() => stepPoster(1), [stepPoster]),
    prevPoster: useCallback(() => stepPoster(-1), [stepPoster]),
    slideIndex, slideDuration: activeDuration,
    activePostersCount: activePosters.length,
    toggleForceFriday: useCallback(() => setIsFridayForced((p) => !p), []),
    toggleForceEid: useCallback(() => setIsEidForced((p) => !p), []),
    setTimeOverrideMinutes,
    isSilenceTestActive,
    toggleSilenceTest,
  };
}
