'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Plus, Pencil, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import type {
  ActiveEidType,
  EidShift,
  EidType,
  NightPrayerType,
  PrayerTimesToday,
  Settings,
  TaraweehRakats,
  TaraweehSession,
  TaraweehWitrMode,
} from '@/types/index';
import { getEidShifts, saveEidShift, deleteEidShift } from '@/lib/actions/jummah';
import { updateVenueSettings } from '@/lib/actions/settings';
import { format12h } from '@/lib/utils/time';
import { formatHijriDate } from '@/lib/prayer/hijri';
import {
  getDefaultNightPrayerDuration,
  normalizeNightPrayerSession,
  VALID_NIGHT_RAKATS,
  validateRamadanDisplayStartDate,
} from '@/lib/prayer/ramadan-visibility';
import { validateTaraweehSessions } from '@/lib/prayer/taraweeh-validation';
import { EidShiftModal } from './EidShiftModal';

export interface SeasonalSchedulesCardProps {
  readonly settings?: Settings | undefined;
  readonly prayers?: PrayerTimesToday | undefined;
  readonly onRefresh: () => void;
}

const DEFAULT_SESSION: TaraweehSession = {
  session_number: 1,
  prayer_type: 'taraweeh',
  time_mode: 'OFFSET',
  offset_minutes: 0,
  fixed_time: '21:30',
  rakats: '20',
  witr_mode: '2+1',
  duration_minutes: 60,
};

export function SeasonalSchedulesCard({ settings, prayers, onRefresh }: SeasonalSchedulesCardProps) {
  // Ramadan State
  const [ramadanEnabled, setRamadanEnabled] = useState(Boolean(settings?.ramadan_mode_enabled));
  const [ramadanDisplayStartDate, setRamadanDisplayStartDate] = useState(
    settings?.ramadan_display_start_date ?? ''
  );
  const [suhoorBufferText, setSuhoorBufferText] = useState(String(settings?.ramadan_suhoor_buffer_minutes ?? 10));
  const [silenceDuringTaraweeh, setSilenceDuringTaraweeh] = useState(
    settings?.ramadan_silence_during_taraweeh ?? true
  );
  const [taraweehSessions, setTaraweehSessions] = useState<TaraweehSession[]>(() =>
    settings?.ramadan_taraweeh_sessions && settings.ramadan_taraweeh_sessions.length > 0
      ? settings.ramadan_taraweeh_sessions.map(normalizeNightPrayerSession)
      : [DEFAULT_SESSION]
  );
  const [isSavingRamadan, setIsSavingRamadan] = useState(false);
  const [ramadanSuccess, setRamadanSuccess] = useState(false);
  const [ramadanError, setRamadanError] = useState<string | null>(null);

  // Eid Broadcast & Shifts State
  const [activeEidType, setActiveEidType] = useState<EidType>('eid_ul_fitr');
  const [broadcastEidType, setBroadcastEidType] = useState<ActiveEidType>(settings?.active_eid_type ?? 'none');
  const [broadcastEidDate, setBroadcastEidDate] = useState(settings?.active_eid_date ?? '');
  const [eidAutoHideText, setEidAutoHideText] = useState(String(settings?.eid_auto_hide_minutes ?? 60));
  const [eidFridayNote, setEidFridayNote] = useState(settings?.eid_friday_note ?? '');
  const [isSavingEidConfig, setIsSavingEidConfig] = useState(false);
  const [eidConfigSuccess, setEidConfigSuccess] = useState(false);
  const [eidConfigError, setEidConfigError] = useState<string | null>(null);

  const [eidShifts, setEidShifts] = useState<EidShift[]>([]);
  const [isLoadingEid, setIsLoadingEid] = useState(true);
  const [isEidModalOpen, setIsEidModalOpen] = useState(false);
  const [editingEidShift, setEditingEidShift] = useState<EidShift | null>(null);

  useEffect(() => {
    setRamadanEnabled(Boolean(settings?.ramadan_mode_enabled));
    setRamadanDisplayStartDate(settings?.ramadan_display_start_date ?? '');
    setSuhoorBufferText(String(settings?.ramadan_suhoor_buffer_minutes ?? 10));
    setSilenceDuringTaraweeh(settings?.ramadan_silence_during_taraweeh ?? true);
    setTaraweehSessions(
      settings?.ramadan_taraweeh_sessions && settings.ramadan_taraweeh_sessions.length > 0
        ? settings.ramadan_taraweeh_sessions.map(normalizeNightPrayerSession)
        : [DEFAULT_SESSION]
    );
    setBroadcastEidType(settings?.active_eid_type ?? 'none');
    setBroadcastEidDate(settings?.active_eid_date ?? '');
    setEidAutoHideText(String(settings?.eid_auto_hide_minutes ?? 60));
    setEidFridayNote(settings?.eid_friday_note ?? '');
  }, [settings]);

  const loadEidShifts = useCallback(async () => {
    setIsLoadingEid(true);
    try {
      const data = await getEidShifts(activeEidType);
      setEidShifts(data);
    } catch (err) {
      console.error('Failed to load Eid shifts:', err);
    } finally {
      setIsLoadingEid(false);
    }
  }, [activeEidType]);

  useEffect(() => {
    void loadEidShifts();
  }, [loadEidShifts]);

  const handleToggleRamadan = async (nextEnabled: boolean) => {
    setRamadanEnabled(nextEnabled);
    setIsSavingRamadan(true);
    setRamadanSuccess(false);
    try {
      await updateVenueSettings({ ramadan_mode_enabled: nextEnabled });
      setRamadanSuccess(true);
      setTimeout(() => setRamadanSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle Ramadan mode:', err);
      setRamadanEnabled(!nextEnabled);
    } finally {
      setIsSavingRamadan(false);
    }
  };

  const globalSilenceEnabled = Boolean(settings?.show_prayer_silence_overlay);

  const handleEnableGlobalSilence = async () => {
    setIsSavingRamadan(true);
    setRamadanError(null);
    try {
      await updateVenueSettings({ show_prayer_silence_overlay: true });
      setRamadanSuccess(true);
      setTimeout(() => setRamadanSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to enable global Silence Screen:', err);
      setRamadanError('Failed to enable global Congregation Silence Screen.');
    } finally {
      setIsSavingRamadan(false);
    }
  };

  const handleSaveRamadanSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBuffer = Math.min(30, Math.max(0, Number.parseInt(suhoorBufferText, 10) || 0));
    setSuhoorBufferText(String(parsedBuffer));
    setRamadanSuccess(false);
    setRamadanError(null);

    const startDateError = validateRamadanDisplayStartDate(ramadanDisplayStartDate, {
      hijriOffsetDays: settings?.hijri_offset_days,
      activeEidType: broadcastEidType,
      activeEidDate: broadcastEidDate,
    });
    if (startDateError) {
      setRamadanError(startDateError);
      return;
    }

    const normalizedSessions = taraweehSessions.map((s, idx) =>
      normalizeNightPrayerSession({
        ...s,
        session_number: idx + 1,
        offset_minutes: Math.max(0, Number(s.offset_minutes) || 0),
        fixed_time: s.fixed_time || '21:30',
      })
    );

    const validationError = validateTaraweehSessions(
      normalizedSessions,
      prayers?.isha?.iqamah_time,
      prayers?.fajr?.adhan_time
    );
    if (validationError) {
      setRamadanError(validationError);
      return;
    }

    setIsSavingRamadan(true);
    try {
      await updateVenueSettings({
        ramadan_mode_enabled: ramadanEnabled,
        ramadan_display_start_date: ramadanDisplayStartDate.trim() || null,
        ramadan_suhoor_buffer_minutes: parsedBuffer,
        ramadan_taraweeh_sessions: normalizedSessions,
        ramadan_silence_during_taraweeh: silenceDuringTaraweeh,
      });
      setRamadanSuccess(true);
      setTimeout(() => setRamadanSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to update Ramadan settings:', err);
      setRamadanError('Failed to save Ramadan settings. Please try again.');
    } finally {
      setIsSavingRamadan(false);
    }
  };

  const handleSaveEidBroadcastConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedHideMins = Math.min(720, Math.max(5, Number.parseInt(eidAutoHideText, 10) || 60));
    setEidAutoHideText(String(parsedHideMins));
    setEidConfigError(null);
    setEidConfigSuccess(false);

    if (ramadanEnabled && ramadanDisplayStartDate.trim()) {
      const conflict = validateRamadanDisplayStartDate(ramadanDisplayStartDate, {
        hijriOffsetDays: settings?.hijri_offset_days,
        activeEidType: broadcastEidType,
        activeEidDate: broadcastEidDate,
      });
      if (conflict) {
        setEidConfigError(conflict);
        return;
      }
    }

    setIsSavingEidConfig(true);
    try {
      await updateVenueSettings({
        active_eid_type: broadcastEidType,
        active_eid_date: broadcastEidDate.trim() || null,
        eid_auto_hide_minutes: parsedHideMins,
        eid_friday_note: eidFridayNote.trim() || null,
      });
      setEidConfigSuccess(true);
      setTimeout(() => setEidConfigSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to update Eid display config:', err);
      setEidConfigError('Failed to update Eid display rule. Please try again.');
    } finally {
      setIsSavingEidConfig(false);
    }
  };

  const handleSaveEidShift = async (input: {
    id?: string | undefined;
    eid_type: EidType;
    shift_number?: number | undefined;
    takbeerat_time: string;
    salah_time: string;
    khateeb_name?: string | null | undefined;
    location?: string | null | undefined;
  }) => {
    await saveEidShift(input);
    await loadEidShifts();
    onRefresh();
  };

  const handleDeleteEidShift = async (id: string) => {
    await deleteEidShift(id);
    await loadEidShifts();
    onRefresh();
  };

  const updateSession = (idx: number, patch: Partial<TaraweehSession>) => {
    setTaraweehSessions((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Ramadan Sacred Month Mode */}
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
              Ramadan Sacred Mode &amp; Fasting Markers
            </h3>
            <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
              Display optional Suhoor cutoff, Maghrib Iftar marker, and multi-session Taraweeh + Witr details on the TV drawer.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {ramadanSuccess && (
              <span className="text-xs font-semibold text-emerald-500 flex items-center space-x-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                <span>{ramadanEnabled ? 'Saved!' : 'Ramadan mode turned off'}</span>
              </span>
            )}
            <label className="relative inline-flex items-center cursor-pointer" title="Toggle Ramadan Mode">
              <input
                type="checkbox"
                checked={ramadanEnabled}
                onChange={(e) => void handleToggleRamadan(e.target.checked)}
                disabled={isSavingRamadan}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--admin-btn-primary-bg)]" />
            </label>
          </div>
        </div>

        {ramadanEnabled && (
          <form onSubmit={handleSaveRamadanSettings} className="p-5 space-y-5 animate-fadeIn">
            {/* Suhoor Buffer + Display Start Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                  Suhoor / Imsak Buffer
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={suhoorBufferText}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setSuhoorBufferText(digits);
                    }}
                    onBlur={() => {
                      const n = Math.min(30, Math.max(0, Number.parseInt(suhoorBufferText, 10) || 0));
                      setSuhoorBufferText(String(n));
                    }}
                    className="w-20 px-3 py-1.5 text-xs font-mono font-semibold text-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                  />
                  <span className="text-xs text-[var(--admin-text-muted)] whitespace-nowrap">minutes before Fajr</span>
                </div>
                <p className="text-[10px] text-[var(--admin-text-muted)] mt-1">
                  Set to <span className="font-mono font-semibold">0</span> if your mosque does not display a separate Suhoor cutoff.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                  TV Display Start Date <span className="font-normal opacity-75">(Optional • Sha&apos;ban or Ramadan)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={ramadanDisplayStartDate}
                    onChange={(e) => {
                      setRamadanError(null);
                      setRamadanDisplayStartDate(e.target.value);
                    }}
                    className="px-3 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                  />
                  {ramadanDisplayStartDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setRamadanError(null);
                        setRamadanDisplayStartDate('');
                      }}
                      className="text-[11px] font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--admin-surface)] cursor-pointer transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[var(--admin-text-muted)] mt-1">
                  Announce Night Prayers early in Sha&apos;ban or start on 1st Ramadan (Today:{' '}
                  <span className="font-semibold">
                    {formatHijriDate(new Date(), settings?.hijri_offset_days ?? 0, {
                      timezone: settings?.timezone ?? 'UTC',
                    })}
                  </span>
                  ). Auto-hides outside Sha&apos;ban/Ramadan &amp; on Eid.
                </p>
              </div>
            </div>

            {(!prayers?.isha?.iqamah_time ||
              prayers.isha.iqamah_time === '--:--' ||
              !prayers?.fajr?.adhan_time ||
              prayers.fajr.adhan_time === '--:--') && (
              <div className="flex items-start space-x-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Daily Isha/Fajr timetable is not configured yet — <span className="font-semibold">&quot;After Isha (+min)&quot;</span> requires coordinates or an uploaded timetable, while <span className="font-semibold">Fixed Clock Time</span> validates against a standard 8:00 PM – 6:00 AM window.
                </span>
              </div>
            )}

            {/* Taraweeh Multi-Session Builder */}
            <div className="space-y-3 pt-3 border-t border-[var(--admin-border)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[var(--admin-text-primary)]">
                    Taraweeh, Qiyam / Tahajjud &amp; Witr Sessions
                  </h4>
                  <p className="text-[11px] text-[var(--admin-text-muted)]">
                    Configure one or multiple nightly sessions between Isha and Fajr (e.g., an early 8-Rakat session and a late 12/20-Rakat or Qiyam session).
                  </p>
                </div>
                {taraweehSessions.length < 4 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRamadanError(null);
                      setTaraweehSessions((prev) => [
                        ...prev,
                        {
                          session_number: prev.length + 1,
                          prayer_type: 'qiyam',
                          label: '',
                          time_mode: 'FIXED',
                          offset_minutes: 0,
                          fixed_time: '23:30',
                          rakats: '8',
                          witr_mode: '2+1',
                          duration_minutes: 45,
                        },
                      ]);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-semibold flex items-center space-x-1 cursor-pointer transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Session</span>
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/50 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-[var(--admin-text-primary)]">
                      Musallah Congregation Silence Screen
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        globalSilenceEnabled
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      }`}
                    >
                      Master Switch: {globalSilenceEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  {!globalSilenceEnabled && (
                    <button
                      type="button"
                      disabled={isSavingRamadan}
                      onClick={() => void handleEnableGlobalSilence()}
                      className="px-2.5 py-1 rounded-lg border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-[11px] font-semibold cursor-pointer transition"
                    >
                      Enable Global Silence Screen
                    </button>
                  )}
                </div>

                {!globalSilenceEnabled && (
                  <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed">
                    Global <span className="font-semibold text-[var(--admin-text-secondary)]">Congregation Silence Screen</span> (in Venue Settings &rarr; Overlays) is currently OFF, so posters will keep rotating during prayer. Enable it above if this TV is inside the prayer hall.
                  </p>
                )}

                <label
                  className={`flex items-start space-x-2.5 text-xs select-none ${
                    globalSilenceEnabled
                      ? 'text-[var(--admin-text-secondary)] cursor-pointer'
                      : 'text-[var(--admin-text-muted)] opacity-60 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={!globalSilenceEnabled}
                    checked={silenceDuringTaraweeh}
                    onChange={(e) => {
                      setRamadanError(null);
                      setSilenceDuringTaraweeh(e.target.checked);
                    }}
                    className="mt-0.5 rounded border-[var(--admin-border)] text-[var(--admin-btn-primary-bg)] focus:ring-[var(--admin-tab-active-border)] cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span>
                    Hold Congregation Silence Screen across each session&apos;s full duration (recommended inside Musallah halls; uncheck for Lobby TVs).
                  </span>
                </label>
              </div>

              {ramadanError && (
                <div className="flex items-start space-x-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{ramadanError}</span>
                </div>
              )}

              <div className="space-y-3">
                {taraweehSessions.map((session, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/70 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="text-xs font-bold text-[var(--admin-text-primary)] shrink-0">
                          Session {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={session.label ?? ''}
                          onChange={(e) => {
                            setRamadanError(null);
                            updateSession(idx, { label: e.target.value });
                          }}
                          placeholder="Label (e.g. Early, Khatm, Qiyam)"
                          className="w-full sm:w-64 px-2.5 py-1 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]/60"
                        />
                      </div>
                      {taraweehSessions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setTaraweehSessions((prev) =>
                              prev.filter((_, i) => i !== idx).map((s, newIdx) => ({ ...s, session_number: newIdx + 1 }))
                            )
                          }
                          className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition"
                          title="Remove Taraweeh session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                      {/* Time Mode + Value */}
                      <div className="sm:col-span-2 lg:col-span-4">
                        <label className="block text-[11px] font-semibold text-[var(--admin-text-secondary)] mb-1">
                          Start Timing
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <select
                            value={session.time_mode}
                            onChange={(e) => {
                              setRamadanError(null);
                              updateSession(idx, { time_mode: e.target.value as 'OFFSET' | 'FIXED' });
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] cursor-pointer"
                          >
                            <option value="OFFSET">After Isha (+min)</option>
                            <option value="FIXED">Fixed Clock Time</option>
                          </select>

                          {session.time_mode === 'OFFSET' ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={3}
                                value={String(session.offset_minutes)}
                                onChange={(e) => {
                                  setRamadanError(null);
                                  const d = e.target.value.replace(/\D/g, '');
                                  updateSession(idx, { offset_minutes: d === '' ? 0 : Math.min(180, Number.parseInt(d, 10)) });
                                }}
                                className="w-14 px-2 py-1.5 text-xs font-mono font-semibold text-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                                title="Minutes after Isha (0 = directly after Isha)"
                              />
                              <span className="text-[11px] text-[var(--admin-text-muted)]">min</span>
                            </div>
                          ) : (
                            <input
                              type="time"
                              value={session.fixed_time}
                              onChange={(e) => {
                                setRamadanError(null);
                                updateSession(idx, { fixed_time: e.target.value });
                              }}
                              className="px-2 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                            />
                          )}
                        </div>
                      </div>

                      {/* Prayer Type */}
                      <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold text-[var(--admin-text-secondary)] mb-1">
                          Prayer Type
                        </label>
                        <select
                          value={session.prayer_type ?? 'taraweeh'}
                          onChange={(e) => {
                            setRamadanError(null);
                            const nextType = e.target.value as NightPrayerType;
                            const prevDefault = getDefaultNightPrayerDuration(session.prayer_type, session.rakats);
                            const nextDefault = getDefaultNightPrayerDuration(nextType, session.rakats);
                            updateSession(idx, {
                              prayer_type: nextType,
                              ...(session.duration_minutes === undefined || session.duration_minutes === prevDefault
                                ? { duration_minutes: nextDefault }
                                : {}),
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] cursor-pointer"
                        >
                          <option value="taraweeh">Taraweeh</option>
                          <option value="qiyam">Qiyam</option>
                          <option value="tahajjud">Tahajjud</option>
                        </select>
                      </div>

                      {/* Rakats */}
                      <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold text-[var(--admin-text-secondary)] mb-1">
                          Rakats
                        </label>
                        <select
                          value={session.rakats === 'Qiyam' ? '8' : session.rakats}
                          onChange={(e) => {
                            setRamadanError(null);
                            const nextRakats = e.target.value as TaraweehRakats;
                            const prevDefault = getDefaultNightPrayerDuration(session.prayer_type, session.rakats);
                            const nextDefault = getDefaultNightPrayerDuration(session.prayer_type, nextRakats);
                            updateSession(idx, {
                              rakats: nextRakats,
                              ...(session.duration_minutes === undefined || session.duration_minutes === prevDefault
                                ? { duration_minutes: nextDefault }
                                : {}),
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] cursor-pointer"
                        >
                          {VALID_NIGHT_RAKATS.map((r) => (
                            <option key={r} value={r}>
                              {r} Rakats
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Witr Mode */}
                      <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold text-[var(--admin-text-secondary)] mb-1">
                          Witr Prayer
                        </label>
                        <select
                          value={session.witr_mode}
                          onChange={(e) => {
                            setRamadanError(null);
                            updateSession(idx, { witr_mode: e.target.value as TaraweehWitrMode });
                          }}
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] cursor-pointer"
                        >
                          <option value="2+1">3 Rakats (2 + 1)</option>
                          <option value="continuous_3">3 Rakats (Continuous)</option>
                          <option value="1">1 Rakat Witr</option>
                          <option value="none">No Witr in this session</option>
                        </select>
                      </div>

                      {/* Silence Hold Duration */}
                      <div className="lg:col-span-2">
                        <label
                          className="block text-[11px] font-semibold text-[var(--admin-text-secondary)] mb-1"
                          title="How long the Silence Screen holds before flyers resume (automatically capped before Fajr or the next session)"
                        >
                          Silence Duration
                        </label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={3}
                            value={
                              session.duration_minutes === 0
                                ? ''
                                : String(
                                    session.duration_minutes ??
                                      getDefaultNightPrayerDuration(session.prayer_type, session.rakats)
                                  )
                            }
                            onChange={(e) => {
                              setRamadanError(null);
                              const d = e.target.value.replace(/\D/g, '');
                              updateSession(idx, {
                                duration_minutes: d === '' ? 0 : Math.min(180, Number.parseInt(d, 10)),
                              });
                            }}
                            onBlur={() => {
                              const current = session.duration_minutes ?? 45;
                              const clamped = Math.min(180, Math.max(10, current || 45));
                              updateSession(idx, { duration_minutes: clamped });
                            }}
                            className="w-16 px-2 py-1.5 text-xs font-mono font-semibold text-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                          />
                          <span className="text-[11px] text-[var(--admin-text-muted)]">min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--admin-border)]">
              <button
                type="submit"
                disabled={isSavingRamadan}
                className="px-4 py-1.5 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm"
              >
                {isSavingRamadan && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Ramadan Settings</span>
              </button>
            </div>
        </form>
        )}
      </div>

      {/* Card 2: Eid Prayers Multi-Shift Scheduler */}
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
              Eid Prayer Day &amp; Multi-Shift Schedules
            </h3>
            <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
              Set the actual Eid Salah date, morning Eid shifts, and automatic afternoon return to Jummah or daily prayers. Ramadan/Taraweeh displays automatically pause on Eid Day and Eid Eve.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex p-0.5 bg-[var(--admin-card)] rounded-xl border border-[var(--admin-border)]">
              <button
                type="button"
                onClick={() => setActiveEidType('eid_ul_fitr')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeEidType === 'eid_ul_fitr'
                    ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] shadow-sm'
                    : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                Eid al-Fitr
              </button>
              <button
                type="button"
                onClick={() => setActiveEidType('eid_ul_adha')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeEidType === 'eid_ul_adha'
                    ? 'bg-[var(--admin-btn-primary-bg)] text-[var(--admin-btn-primary-text)] shadow-sm'
                    : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                Eid al-Adha
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingEidShift(null);
                setIsEidModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Eid Shift</span>
            </button>
          </div>
        </div>

        {/* Eid Broadcast Date & Expiration Controls */}
        <form
          onSubmit={handleSaveEidBroadcastConfig}
          className="p-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/40 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--admin-text-secondary)] mb-1">
                Active Eid on TV Display
              </label>
              <select
                value={broadcastEidType}
                onChange={(e) => {
                  setEidConfigError(null);
                  setBroadcastEidType(e.target.value as ActiveEidType);
                }}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] cursor-pointer"
              >
                <option value="none">Off (Inactive)</option>
                <option value="eid_ul_fitr">Eid al-Fitr</option>
                <option value="eid_ul_adha">Eid al-Adha</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--admin-text-secondary)] mb-1">
                Target Eid Date <span className="font-normal opacity-75">(Day of Eid Salah)</span>
              </label>
              <input
                type="date"
                value={broadcastEidDate}
                onChange={(e) => {
                  setEidConfigError(null);
                  setBroadcastEidDate(e.target.value);
                }}
                className="w-full px-3 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--admin-text-secondary)] mb-1">
                Auto-Hide After Last Salah
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={eidAutoHideText}
                  onChange={(e) => setEidAutoHideText(e.target.value.replace(/\D/g, ''))}
                  onBlur={() => {
                    const n = Math.min(720, Math.max(5, Number.parseInt(eidAutoHideText, 10) || 60));
                    setEidAutoHideText(String(n));
                  }}
                  className="w-20 px-2.5 py-1.5 text-xs font-mono font-semibold text-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                />
                <span className="text-[11px] text-[var(--admin-text-muted)] whitespace-nowrap">min</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--admin-text-secondary)] mb-1">
                Eid-on-Friday / Afternoon Note <span className="font-normal opacity-70">(Optional)</span>
              </label>
              <input
                type="text"
                value={eidFridayNote}
                onChange={(e) => setEidFridayNote(e.target.value)}
                placeholder="e.g. Consolidated Jummah at 1:30 PM"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]/60"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-[var(--admin-text-muted)]">
              On the Target Eid Date morning, Eid shifts replace the drawer; after the final Salah + grace period, it returns to Friday Jummah or Daily Prayers (without Taraweeh). Preview anytime via <span className="font-mono font-semibold">F2 &rarr; Force Eid</span> on <span className="font-mono">/display</span>.
            </p>
            <div className="flex items-center space-x-2 shrink-0">
              {eidConfigSuccess && (
                <span className="text-xs font-semibold text-emerald-500 flex items-center space-x-1 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </span>
              )}
              <button
                type="submit"
                disabled={isSavingEidConfig}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] font-semibold text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm"
              >
                {isSavingEidConfig && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Broadcast Rule</span>
              </button>
            </div>
          </div>
          {eidConfigError && (
            <div className="flex items-start space-x-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{eidConfigError}</span>
            </div>
          )}
        </form>

        <div>
          {isLoadingEid ? (
            <div className="p-8 text-center text-xs text-[var(--admin-text-muted)] flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading Eid shifts...</span>
            </div>
          ) : eidShifts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--admin-text-muted)] space-y-1">
              <p>No prayer shifts scheduled for {activeEidType === 'eid_ul_fitr' ? 'Eid al-Fitr' : 'Eid al-Adha'}.</p>
              <p className="text-[11px] text-[var(--admin-text-muted)]/70">
                Click &quot;Add Eid Shift&quot; to configure the morning Takbeerat and prayer times.
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-[var(--admin-border)]">
                {eidShifts.map((shift, idx) => (
                  <div key={shift.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--admin-text-primary)]">Shift {idx + 1}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEidShift(shift);
                            setIsEidModalOpen(true);
                          }}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] active:scale-95 cursor-pointer transition"
                          aria-label={`Edit Eid Shift ${idx + 1}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteEidShift(shift.id)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 cursor-pointer transition"
                          aria-label={`Delete Eid Shift ${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <span className="text-[10px] text-[var(--admin-text-muted)] block">Takbeerat</span>
                        <span className="font-mono font-bold text-[var(--admin-text-primary)]">{format12h(shift.takbeerat_time)}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <span className="text-[10px] text-[var(--admin-text-muted)] block">Salah Time</span>
                        <span className="font-mono font-bold text-[var(--admin-text-primary)]">{format12h(shift.salah_time)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--admin-text-secondary)] space-y-0.5">
                      <div>
                        <span className="text-[var(--admin-text-muted)]">Khateeb: </span>
                        {shift.khateeb_name?.trim() ? shift.khateeb_name : <span className="italic text-[var(--admin-text-muted)]">To be announced</span>}
                      </div>
                      {shift.location?.trim() && (
                        <div>
                          <span className="text-[var(--admin-text-muted)]">Location: </span>
                          {shift.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider bg-[var(--admin-surface)]/50">
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Takbeerat</th>
                  <th className="py-3 px-4">Salah Time</th>
                  <th className="py-3 px-4">Khateeb / Imam</th>
                  <th className="py-3 px-4">Hall / Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)] text-xs text-[var(--admin-text-primary)]">
                {eidShifts.map((shift, idx) => (
                  <tr key={shift.id} className="hover:bg-[var(--admin-surface)]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-sm">Shift {idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs tabular-nums text-[var(--admin-text-secondary)]">
                      {format12h(shift.takbeerat_time)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs tabular-nums text-[var(--admin-text-secondary)]">
                      {format12h(shift.salah_time)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--admin-text-primary)]">
                      {shift.khateeb_name?.trim() ? shift.khateeb_name : <span className="text-[var(--admin-text-muted)] italic">To be announced</span>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--admin-text-secondary)]">
                      {shift.location?.trim() ? shift.location : <span className="text-[var(--admin-text-muted)] italic">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEidShift(shift);
                            setIsEidModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] active:scale-95 cursor-pointer transition"
                          title="Edit shift details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteEidShift(shift.id)}
                          className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 cursor-pointer transition"
                          title="Delete shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </>
          )}
        </div>
      </div>

      <EidShiftModal
        isOpen={isEidModalOpen}
        mode={editingEidShift ? 'EDIT' : 'ADD'}
        eidType={activeEidType}
        editingShift={editingEidShift}
        shiftNumber={eidShifts.length + 1}
        onSubmit={handleSaveEidShift}
        onClose={() => {
          setIsEidModalOpen(false);
          setEditingEidShift(null);
        }}
      />
    </div>
  );
}
