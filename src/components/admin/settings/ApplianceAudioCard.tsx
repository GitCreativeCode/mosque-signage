'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import type { AudioReceiverProtocol } from '@/types/index';

export interface ApplianceAudioCardProps {
  readonly audioMuteDuringPrayer: boolean;
  readonly setAudioMuteDuringPrayer: (val: boolean) => void;
  readonly audioReceiverHost: string;
  readonly setAudioReceiverHost: (host: string) => void;
  readonly audioReceiverPort: number;
  readonly setAudioReceiverPort: (port: number) => void;
  readonly audioReceiverProtocol: AudioReceiverProtocol;
  readonly setAudioReceiverProtocol: (proto: AudioReceiverProtocol) => void;
  readonly markDirty: () => void;
}

const DEFAULT_PORT_BY_PROTOCOL: Record<AudioReceiverProtocol, number> = {
  denon_telnet: 23,
  yamaha_csvp: 49280,
  http_webhook: 80,
};

export function ApplianceAudioCard({
  audioMuteDuringPrayer, setAudioMuteDuringPrayer,
  audioReceiverHost, setAudioReceiverHost,
  audioReceiverPort, setAudioReceiverPort,
  audioReceiverProtocol, setAudioReceiverProtocol,
  markDirty,
}: ApplianceAudioCardProps) {
  const [testingAudio, setTestingAudio] = useState<'MUTE' | 'UNMUTE' | null>(null);
  const [audioFeedback, setAudioFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [portInput, setPortInput] = useState<string>(String(audioReceiverPort));

  useEffect(() => { setPortInput(String(audioReceiverPort)); }, [audioReceiverPort]);

  const handleTestAudioReceiver = async (action: 'MUTE' | 'UNMUTE') => {
    setTestingAudio(action);
    setAudioFeedback(null);
    try {
      const { testAudioReceiverAction } = await import('@/lib/actions/hardware');
      const res = await testAudioReceiverAction(action);
      setAudioFeedback({ success: res.success, message: res.message });
    } catch (err: unknown) {
      setAudioFeedback({ success: false, message: err instanceof Error ? err.message : 'Failed to test audio receiver.' });
    } finally {
      setTestingAudio(null);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--admin-text-primary)]">Hall Audio Receiver Muting</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={audioMuteDuringPrayer}
            onChange={(e) => { setAudioMuteDuringPrayer(e.target.checked); markDirty(); }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-btn-primary-bg)]" />
        </label>
      </div>

      <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
        Sends network mute commands to connected Yamaha, Denon, Marantz, or Webhook audio matrices during Congregational Prayer Silence.
      </p>

      {audioMuteDuringPrayer && (
        <div className="space-y-4 pt-2 border-t border-[var(--admin-border)]">
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] block mb-1">Receiver Protocol</label>
            <select
              value={audioReceiverProtocol}
              onChange={(e) => {
                const proto = e.target.value as AudioReceiverProtocol;
                const defaultPort = DEFAULT_PORT_BY_PROTOCOL[proto] ?? 23;
                setAudioReceiverProtocol(proto);
                setAudioReceiverPort(defaultPort);
                setPortInput(String(defaultPort));
                markDirty();
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)]"
            >
              <option value="denon_telnet">Denon / Marantz AVR (Telnet Port 23)</option>
              <option value="yamaha_csvp">Yamaha MTX / MRX Matrix (eCSVP Port 49280)</option>
              <option value="http_webhook">Generic HTTP / REST Webhook (JSON POST)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] block mb-1">
                Receiver IP / Host / Webhook URL
              </label>
              <input
                type="text"
                placeholder="192.168.1.150 or http://..."
                value={audioReceiverHost}
                onChange={(e) => { setAudioReceiverHost(e.target.value); markDirty(); }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] block mb-1">Network Port</label>
              <input
                type="number"
                min="1"
                max="65535"
                placeholder="23"
                value={portInput}
                onChange={(e) => {
                  const clean = e.target.value.length > 1 && e.target.value.startsWith('0')
                    ? e.target.value.replace(/^0+/, '') || '0'
                    : e.target.value;
                  setPortInput(clean);
                  const parsed = Number.parseInt(clean, 10);
                  setAudioReceiverPort(Number.isNaN(parsed) ? 23 : Math.abs(parsed));
                  markDirty();
                }}
                onBlur={() => {
                  const parsed = portInput === '' ? 23 : Math.abs(Number.parseInt(portInput, 10)) || 23;
                  setPortInput(String(parsed));
                  setAudioReceiverPort(parsed);
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 flex items-start space-x-2 text-[11px] text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>Fail-Safe Watchdog Guard Active</strong>: Automatically schedules an emergency UNMUTE watchdog timer so the hall audio matrix can never get stuck muted if the kiosk is disconnected.
            </span>
          </div>

          <div className="pt-2 border-t border-[var(--admin-border)] space-y-2">
            <div className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)]">Instant Audio Network Dispatch Test</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={testingAudio !== null || !audioReceiverHost} onClick={() => handleTestAudioReceiver('MUTE')} className="py-1.5 px-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-neutral-800 text-xs font-medium text-[var(--admin-text-primary)] flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer">
                {testingAudio === 'MUTE' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
                <span>Send Test MUTE</span>
              </button>
              <button type="button" disabled={testingAudio !== null || !audioReceiverHost} onClick={() => handleTestAudioReceiver('UNMUTE')} className="py-1.5 px-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-neutral-800 text-xs font-medium text-[var(--admin-text-primary)] flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer">
                {testingAudio === 'UNMUTE' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Send Test UNMUTE</span>
              </button>
            </div>
            {audioFeedback && (
              <div className={`p-2 rounded-lg text-[11px] flex items-start space-x-1.5 ${audioFeedback.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {audioFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <span>{audioFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

