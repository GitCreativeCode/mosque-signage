'use client';

import React, { useState } from 'react';
import { HelpCircle, Power } from 'lucide-react';
import type { PowerScheduleMode, StandbyAppearance, TvControlProtocol, AudioReceiverProtocol } from '@/types/index';
import { AppliancePowerCard } from './AppliancePowerCard';
import { ApplianceAudioCard } from './ApplianceAudioCard';
import { ApplianceDiagnosticsGrid } from './ApplianceDiagnosticsGrid';

export interface ApplianceHardwareSectionProps {
  readonly tvAutoPower: boolean;
  readonly setTvAutoPower: (val: boolean) => void;
  readonly powerScheduleMode: PowerScheduleMode;
  readonly setPowerScheduleMode: (mode: PowerScheduleMode) => void;
  readonly powerOnTime: string;
  readonly setPowerOnTime: (time: string) => void;
  readonly powerOffTime: string;
  readonly setPowerOffTime: (time: string) => void;
  readonly powerFajrOffset: number;
  readonly setPowerFajrOffset: (val: number) => void;
  readonly powerIshaOffset: number;
  readonly setPowerIshaOffset: (val: number) => void;
  readonly tvControlProtocol: TvControlProtocol;
  readonly setTvControlProtocol: (protocol: TvControlProtocol) => void;
  readonly standbyAppearance: StandbyAppearance;
  readonly setStandbyAppearance: (appearance: StandbyAppearance) => void;
  readonly standbyShowAttribution: boolean;
  readonly setStandbyShowAttribution: (show: boolean) => void;
  readonly hasPrayerTiming?: boolean | undefined;
  readonly audioMuteDuringPrayer: boolean;
  readonly setAudioMuteDuringPrayer: (val: boolean) => void;
  readonly audioReceiverHost: string;
  readonly setAudioReceiverHost: (host: string) => void;
  readonly audioReceiverPort: number;
  readonly setAudioReceiverPort: (port: number) => void;
  readonly audioReceiverProtocol: AudioReceiverProtocol;
  readonly setAudioReceiverProtocol: (proto: AudioReceiverProtocol) => void;
  readonly audioMuteDelay: number;
  readonly setAudioMuteDelay: (delay: number) => void;
  readonly markDirty: () => void;
  readonly onQuickReloadTV?: (() => Promise<void>) | undefined;
  readonly onQuickTestDrawer?: (() => Promise<void>) | undefined;
  readonly onQuickToggleSimulator?: (() => Promise<void>) | undefined;
}

export function ApplianceHardwareSection(props: ApplianceHardwareSectionProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 space-y-6 shadow-sm">
      <div className="border-b border-[var(--admin-border)] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--admin-text-primary)] flex items-center space-x-2">
            <Power className="w-4 h-4 text-[var(--admin-tab-active-border)]" />
            <span>Remote Appliance &amp; Hardware Controls</span>
          </h3>
          <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
            Automate connected TV screen power scheduling, AV receiver congregation muting, and kiosk diagnostics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowHowItWorks((prev) => !prev)}
          className="text-xs text-[var(--admin-tab-active-border)] hover:underline flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHowItWorks ? 'Hide Details' : 'How does hardware automation work?'}</span>
        </button>
      </div>

      {showHowItWorks && (
        <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/10 text-xs text-[var(--admin-text-primary)] space-y-2 animate-in fade-in duration-200">
          <div className="font-bold flex items-center space-x-1.5 text-sky-400">
            <span>How Screen Power &amp; Audio Muting Work in MosqueSignage</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
            <li>
              <strong>Browser Blackout &amp; Local Host Sleep</strong>: By default, puts every connected browser display (local or remote over Wi-Fi/LAN) into an OLED pure-black standby canvas with burn-in pixel shifting — zero lockscreen interruptions. Optionally, if the server PC/Pi is plugged directly into the TV, you can enable HDMI-CEC (Linux/Pi) or PC Monitor Sleep (Windows/Linux).
            </li>
            <li>
              <strong>Congregational Prayer Silence Muting</strong>: Hooks directly into the central liturgical engine. When Iqamah strikes and the kiosk enters <em>Starting Now</em> mode, it dispatches an automated network MUTE packet (Denon Telnet `MUON\r`, Yamaha eCSVP, or Webhook). When the congregation window concludes, it automatically dispatches UNMUTE.
            </li>
            <li>
              <strong>Fail-Safe Watchdog Unmute</strong>: An autonomous background timer guarantees the audio matrix is unmuted even if a power outage, network blip, or server restart occurs during prayer.
            </li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppliancePowerCard
          tvAutoPower={props.tvAutoPower}
          setTvAutoPower={props.setTvAutoPower}
          powerScheduleMode={props.powerScheduleMode}
          setPowerScheduleMode={props.setPowerScheduleMode}
          powerOnTime={props.powerOnTime}
          setPowerOnTime={props.setPowerOnTime}
          powerOffTime={props.powerOffTime}
          setPowerOffTime={props.setPowerOffTime}
          powerFajrOffset={props.powerFajrOffset}
          setPowerFajrOffset={props.setPowerFajrOffset}
          powerIshaOffset={props.powerIshaOffset}
          setPowerIshaOffset={props.setPowerIshaOffset}
          tvControlProtocol={props.tvControlProtocol}
          setTvControlProtocol={props.setTvControlProtocol}
          standbyAppearance={props.standbyAppearance}
          setStandbyAppearance={props.setStandbyAppearance}
          standbyShowAttribution={props.standbyShowAttribution}
          setStandbyShowAttribution={props.setStandbyShowAttribution}
          hasPrayerTiming={props.hasPrayerTiming}
          markDirty={props.markDirty}
        />

        <ApplianceAudioCard
          audioMuteDuringPrayer={props.audioMuteDuringPrayer}
          setAudioMuteDuringPrayer={props.setAudioMuteDuringPrayer}
          audioReceiverHost={props.audioReceiverHost}
          setAudioReceiverHost={props.setAudioReceiverHost}
          audioReceiverPort={props.audioReceiverPort}
          setAudioReceiverPort={props.setAudioReceiverPort}
          audioReceiverProtocol={props.audioReceiverProtocol}
          setAudioReceiverProtocol={props.setAudioReceiverProtocol}
          markDirty={props.markDirty}
        />
      </div>

      <ApplianceDiagnosticsGrid
        onQuickReloadTV={props.onQuickReloadTV}
        onQuickTestDrawer={props.onQuickTestDrawer}
        onQuickToggleSimulator={props.onQuickToggleSimulator}
      />
    </div>
  );
}
