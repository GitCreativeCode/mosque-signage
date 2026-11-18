'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, Moon, Sun } from 'lucide-react';
import type { PowerScheduleMode, StandbyAppearance, TvControlProtocol } from '@/types/index';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';
import { PowerControlModePicker } from './PowerControlModePicker';

export interface AppliancePowerCardProps {
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
  readonly markDirty: () => void;
}

export function AppliancePowerCard({
  tvAutoPower, setTvAutoPower, powerScheduleMode, setPowerScheduleMode,
  powerOnTime, setPowerOnTime, powerOffTime, setPowerOffTime,
  powerFajrOffset, setPowerFajrOffset, powerIshaOffset, setPowerIshaOffset,
  tvControlProtocol, setTvControlProtocol,
  standbyAppearance, setStandbyAppearance,
  standbyShowAttribution, setStandbyShowAttribution,
  hasPrayerTiming = true, markDirty,
}: AppliancePowerCardProps) {
  const [testingPower, setTestingPower] = useState<'ON' | 'STANDBY' | null>(null);
  const [powerFeedback, setPowerFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [fajrInput, setFajrInput] = useState<string>(String(Math.abs(powerFajrOffset)));
  const [ishaInput, setIshaInput] = useState<string>(String(Math.abs(powerIshaOffset)));

  useEffect(() => { setFajrInput(String(Math.abs(powerFajrOffset))); }, [powerFajrOffset]);
  useEffect(() => { setIshaInput(String(Math.abs(powerIshaOffset))); }, [powerIshaOffset]);

  const handleOffsetChange = (raw: string, setText: (v: string) => void, setNum: (n: number) => void) => {
    const clean = raw.length > 1 && raw.startsWith('0') ? raw.replace(/^0+/, '') || '0' : raw;
    setText(clean);
    const parsed = Number.parseInt(clean, 10);
    setNum(Number.isNaN(parsed) ? 0 : Math.abs(parsed));
    markDirty();
  };

  const handleOffsetBlur = (text: string, setText: (v: string) => void, setNum: (n: number) => void) => {
    const parsed = text === '' ? 0 : Math.abs(Number.parseInt(text, 10)) || 0;
    setText(String(parsed));
    setNum(parsed);
  };

  const effectiveScheduleMode: PowerScheduleMode =
    !hasPrayerTiming && powerScheduleMode === 'prayer_relative' ? 'fixed' : powerScheduleMode;

  useEffect(() => {
    if (!hasPrayerTiming && powerScheduleMode === 'prayer_relative') {
      setPowerScheduleMode('fixed');
    }
  }, [hasPrayerTiming, powerScheduleMode, setPowerScheduleMode]);

  const handleTestTvPower = async (action: 'ON' | 'STANDBY') => {
    setTestingPower(action);
    setPowerFeedback(null);
    try {
      const { testTvPowerAction } = await import('@/lib/actions/hardware');
      const res = await testTvPowerAction(action, tvControlProtocol);
      if (res.success) {
        broadcastSignageEvent({ type: 'POWER_STATE_CHANGED', powerState: action });
      }
      setPowerFeedback({ success: res.success, message: res.message });
    } catch (err: unknown) {
      setPowerFeedback({ success: false, message: err instanceof Error ? err.message : 'Failed to test TV power.' });
    } finally {
      setTestingPower(null);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--admin-text-primary)]">Display Screen Auto-Power Schedule</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={tvAutoPower}
            onChange={(e) => { setTvAutoPower(e.target.checked); markDirty(); }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-btn-primary-bg)]" />
        </label>
      </div>

      <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
        Turns connected display screens on before Fajr and into low-power standby overnight to extend panel lifespan and eliminate night glare.
      </p>

      {tvAutoPower && (
        <div className="space-y-4 pt-2 border-t border-[var(--admin-border)]">
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] block mb-1.5">Power Schedule Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {(['fixed', 'prayer_relative'] as const).map((mode) => {
                const isDisabled = mode === 'prayer_relative' && !hasPrayerTiming;
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={isDisabled}
                    aria-disabled={isDisabled}
                    onClick={() => { if (!isDisabled) { setPowerScheduleMode(mode); markDirty(); } }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition ${
                      isDisabled
                        ? 'border-[var(--admin-border)] bg-transparent text-[var(--admin-text-muted)] opacity-45 cursor-not-allowed'
                        : effectiveScheduleMode === mode
                          ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-bold shadow-sm cursor-pointer'
                          : 'border-[var(--admin-border)] bg-transparent text-[var(--admin-text-muted)] hover:bg-[var(--admin-card)] cursor-pointer'
                    }`}
                  >
                    {mode === 'fixed' ? 'Fixed Clock Times' : 'Prayer-Relative Offsets'}
                  </button>
                );
              })}
            </div>
            {!hasPrayerTiming && (
              <p className="mt-1.5 text-[10px] text-[var(--admin-text-muted)] flex items-start space-x-1.5 leading-relaxed">
                <Info className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                <span>Prayer-Relative Offsets require coordinates or uploaded timetable. Using <strong>Fixed Clock Times</strong>.</span>
              </p>
            )}
          </div>

          {effectiveScheduleMode === 'fixed' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] block mb-1 flex items-center space-x-1">
                  <Sun className="w-3 h-3 text-amber-400" /><span>Power-On Time</span>
                </label>
                <input type="time" value={powerOnTime} onChange={(e) => { setPowerOnTime(e.target.value); markDirty(); }} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] block mb-1 flex items-center space-x-1">
                  <Moon className="w-3 h-3 text-indigo-400" /><span>Power-Off Time</span>
                </label>
                <input type="time" value={powerOffTime} onChange={(e) => { setPowerOffTime(e.target.value); markDirty(); }} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] block mb-1 flex items-center space-x-1">
                  <Sun className="w-3 h-3 text-amber-400" /><span>Wake Before Fajr</span>
                </label>
                <div className="relative">
                  <input type="number" min="0" max="360" placeholder="45" value={fajrInput} onChange={(e) => handleOffsetChange(e.target.value, setFajrInput, setPowerFajrOffset)} onBlur={() => handleOffsetBlur(fajrInput, setFajrInput, setPowerFajrOffset)} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono" />
                  <span className="absolute right-2.5 top-2 text-[10px] text-[var(--admin-text-muted)] pointer-events-none">min before</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] block mb-1 flex items-center space-x-1">
                  <Moon className="w-3 h-3 text-indigo-400" /><span>Sleep After Isha</span>
                </label>
                <div className="relative">
                  <input type="number" min="0" max="360" placeholder="45" value={ishaInput} onChange={(e) => handleOffsetChange(e.target.value, setIshaInput, setPowerIshaOffset)} onBlur={() => handleOffsetBlur(ishaInput, setIshaInput, setPowerIshaOffset)} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono" />
                  <span className="absolute right-2.5 top-2 text-[10px] text-[var(--admin-text-muted)] pointer-events-none">min after</span>
                </div>
              </div>
            </div>
          )}

          <PowerControlModePicker
            value={tvControlProtocol}
            onChange={(protocol) => { setTvControlProtocol(protocol); markDirty(); }}
          />

          {/* Standby Screen Appearance Choice */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="standby-appearance-select" className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)] block">
              Standby Screen Appearance
            </label>
            <select
              id="standby-appearance-select"
              value={standbyAppearance}
              onChange={(e) => { setStandbyAppearance(e.target.value as StandbyAppearance); markDirty(); }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)]"
            >
              <option value="dim_clock">Dim Clock &amp; Next Prayer (Burn-in protected)</option>
              <option value="pure_black">Total Pure Black (100% Blackout — Zero Light)</option>
            </select>
          </div>

          {/* Standby Attribution Watermark Toggle */}
          <label className="flex items-start space-x-2.5 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={standbyShowAttribution}
              disabled={standbyAppearance === 'pure_black'}
              onChange={(e) => { setStandbyShowAttribution(e.target.checked); markDirty(); }}
              className="mt-0.5 rounded border-[var(--admin-border)] text-sky-500 focus:ring-sky-500 disabled:opacity-40"
            />
            <div className="space-y-0.5">
              <span className={`text-xs font-medium block ${standbyAppearance === 'pure_black' ? 'text-[var(--admin-text-muted)]' : 'text-[var(--admin-text-primary)]'}`}>
                Display &ldquo;Powered by MosqueSignage&rdquo; badge
              </span>
              <span className="text-[10px] text-[var(--admin-text-muted)] block">
                {standbyAppearance === 'pure_black'
                  ? 'Hidden in Total Pure Black mode.'
                  : 'Shows a discreet, ultra-dim watermark during standby. Disabled by default.'}
              </span>
            </div>
          </label>

          <div className="pt-2 border-t border-[var(--admin-border)] space-y-2">
            <div className="text-[10px] uppercase font-bold text-[var(--admin-text-muted)]">Instant Screen Power Diagnostic Test</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={testingPower !== null} onClick={() => handleTestTvPower('STANDBY')} className="py-1.5 px-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-neutral-800 text-xs font-medium text-[var(--admin-text-primary)] flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer">
                {testingPower === 'STANDBY' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                <span>Test Standby</span>
              </button>
              <button type="button" disabled={testingPower !== null} onClick={() => handleTestTvPower('ON')} className="py-1.5 px-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-neutral-800 text-xs font-medium text-[var(--admin-text-primary)] flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer">
                {testingPower === 'ON' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                <span>Test Wake On</span>
              </button>
            </div>
            {powerFeedback && (
              <div className={`p-2 rounded-lg text-[11px] flex items-start space-x-1.5 ${powerFeedback.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {powerFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <span>{powerFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
