'use client';

import React, { useState } from 'react';
import type {
  DisplayResolution,
  MiniPrayerPillPosition,
  PosterFitMode,
  PosterTransitionType,
  SidebarMode,
  SidebarPosition,
} from '@/types/index';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { PwaInstallModal } from './PwaInstallModal';
import { KioskLayoutCard } from './KioskLayoutCard';
import { KioskMediaCard } from './KioskMediaCard';
import { KioskAdvancedOverlaysCard } from './KioskAdvancedOverlaysCard';

export interface KioskChoreographySectionProps {
  readonly hasPrayerTiming?: boolean | undefined;
  readonly showAdhanTimes: boolean;
  readonly setShowAdhanTimes: (val: boolean) => void;
  readonly sidebarMode: SidebarMode;
  readonly setSidebarMode: (val: SidebarMode) => void;
  readonly sidebarPosition: SidebarPosition;
  readonly setSidebarPosition: (val: SidebarPosition) => void;
  readonly drawerInterval: number;
  readonly setDrawerInterval: (val: number) => void;
  readonly drawerDuration: number;
  readonly setDrawerDuration: (val: number) => void;
  readonly showQrDuringDrawer: boolean;
  readonly setShowQrDuringDrawer: (val: boolean) => void;
  readonly showMiniPrayerPill: boolean;
  readonly setShowMiniPrayerPill: (val: boolean) => void;
  readonly showPrayerSilenceOverlay: boolean;
  readonly setShowPrayerSilenceOverlay: (val: boolean) => void;
  readonly miniPrayerPillPosition: MiniPrayerPillPosition;
  readonly setMiniPrayerPillPosition: (val: MiniPrayerPillPosition) => void;
  readonly displayResolution: DisplayResolution;
  readonly setDisplayResolution: (val: DisplayResolution) => void;
  readonly overscanMarginPercent?: number | undefined;
  readonly setOverscanMarginPercent?: ((val: number) => void) | undefined;
  readonly posterFit: PosterFitMode;
  readonly setPosterFit: (val: PosterFitMode) => void;
  readonly posterTransition: PosterTransitionType;
  readonly setPosterTransition: (val: PosterTransitionType) => void;
  readonly showProgressBar: boolean;
  readonly setShowProgressBar: (val: boolean) => void;
  readonly qrReadDelay: number;
  readonly setQrReadDelay: (val: number) => void;
  readonly rememberedPeriodicDelay: number;
  readonly setRememberedPeriodicDelay: (val: number) => void;
  readonly startingNowDuration: number;
  readonly setStartingNowDuration: (val: number) => void;
  readonly markDirty: () => void;
}

export function KioskChoreographySection(props: KioskChoreographySectionProps) {
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [pendingPresetMode, setPendingPresetMode] = useState<SidebarMode | null>(null);
  const [isPendingPillConfirmation, setIsPendingPillConfirmation] = useState(false);
  const { isInstalled: isPwaInstalled, isStandalone: isPwaStandalone } = usePwaInstall();

  const applyPreset = (mode: SidebarMode) => {
    props.setSidebarMode(mode);
    if (mode === 'always_open') {
      if (props.qrReadDelay > 0) props.setRememberedPeriodicDelay(props.qrReadDelay);
      props.setQrReadDelay(0);
    } else if (mode === 'drawer') {
      props.setQrReadDelay(props.rememberedPeriodicDelay);
    }
    props.markDirty();
    setPendingPresetMode(null);
  };

  const handleSelectPreset = (mode: SidebarMode) => {
    if (mode !== 'hidden' && mode !== props.sidebarMode && !props.hasPrayerTiming) {
      setPendingPresetMode(mode);
      return;
    }
    applyPreset(mode);
  };

  const handleToggleMiniPrayerPill = (val: boolean) => {
    if (val && !props.hasPrayerTiming) {
      setIsPendingPillConfirmation(true);
      return;
    }
    props.setShowMiniPrayerPill(val);
    props.markDirty();
  };

  const handleConfirmMiniPill = () => {
    props.setShowMiniPrayerPill(true);
    props.markDirty();
    setIsPendingPillConfirmation(false);
  };

  return (
    <div className="space-y-6">
      <KioskLayoutCard
        sidebarMode={props.sidebarMode}
        onSelectPreset={handleSelectPreset}
        sidebarPosition={props.sidebarPosition}
        setSidebarPosition={props.setSidebarPosition}
        showAdhanTimes={props.showAdhanTimes}
        setShowAdhanTimes={props.setShowAdhanTimes}
        drawerInterval={props.drawerInterval}
        setDrawerInterval={props.setDrawerInterval}
        drawerDuration={props.drawerDuration}
        setDrawerDuration={props.setDrawerDuration}
        showQrDuringDrawer={props.showQrDuringDrawer}
        setShowQrDuringDrawer={props.setShowQrDuringDrawer}
        markDirty={props.markDirty}
      />

      <KioskMediaCard
        posterFit={props.posterFit}
        setPosterFit={props.setPosterFit}
        posterTransition={props.posterTransition}
        setPosterTransition={props.setPosterTransition}
        showProgressBar={props.showProgressBar}
        setShowProgressBar={props.setShowProgressBar}
        markDirty={props.markDirty}
      />

      <KioskAdvancedOverlaysCard
        sidebarMode={props.sidebarMode}
        showMiniPrayerPill={props.showMiniPrayerPill}
        setShowMiniPrayerPill={handleToggleMiniPrayerPill}
        showPrayerSilenceOverlay={props.showPrayerSilenceOverlay}
        setShowPrayerSilenceOverlay={props.setShowPrayerSilenceOverlay}
        miniPrayerPillPosition={props.miniPrayerPillPosition}
        setMiniPrayerPillPosition={props.setMiniPrayerPillPosition}
        qrReadDelay={props.qrReadDelay}
        setQrReadDelay={props.setQrReadDelay}
        setRememberedPeriodicDelay={props.setRememberedPeriodicDelay}
        startingNowDuration={props.startingNowDuration}
        setStartingNowDuration={props.setStartingNowDuration}
        displayResolution={props.displayResolution}
        setDisplayResolution={props.setDisplayResolution}
        overscanMarginPercent={props.overscanMarginPercent ?? 0}
        setOverscanMarginPercent={props.setOverscanMarginPercent}
        isPwaInstalled={isPwaInstalled}
        isPwaStandalone={isPwaStandalone}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
        markDirty={props.markDirty}
      />

      <ConfirmationModal
        isOpen={pendingPresetMode !== null}
        title="Prayer Timings Not Configured"
        message="You selected a prayer timetable display mode, but venue coordinates or an imported timetable schedule have not been added yet. It is recommended to configure your prayer timings first so the display has accurate times to show. If you continue, the screen will display a timetable pending notice until configured."
        confirmLabel="Continue Anyway"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={() => {
          if (pendingPresetMode) applyPreset(pendingPresetMode);
        }}
        onCancel={() => setPendingPresetMode(null)}
      />

      <ConfirmationModal
        isOpen={isPendingPillConfirmation}
        title="Prayer Timings Not Configured"
        message="The floating mini countdown pill requires prayer timings to calculate the countdown to the next prayer. Because venue coordinates or an imported schedule have not been provided, the pill will not be displayed on the broadcast screen until timings are added."
        confirmLabel="Keep Pill On"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleConfirmMiniPill}
        onCancel={() => setIsPendingPillConfirmation(false)}
      />

      <PwaInstallModal isOpen={isPwaModalOpen} onClose={() => setIsPwaModalOpen(false)} />
    </div>
  );
}
