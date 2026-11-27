'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Pencil, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import type { DbJummahShiftRecord } from '@/lib/actions/jummah';
import type { FridayKhateebRosterRecord } from '@/types/index';
import {
  getFridayKhateebRoster,
  saveFridayKhateebOverride,
  deleteFridayKhateebOverride,
} from '@/lib/actions/jummah';
import { format12h } from '@/lib/utils/time';
import { getUpcomingFridays } from '@/lib/prayer/jummah-validation';

export interface FridayKhateebRosterCardProps {
  readonly shifts: readonly DbJummahShiftRecord[];
  readonly onScheduleChanged?: () => void;
  readonly refreshKey?: number | undefined;
}

export function FridayKhateebRosterCard({ shifts, onScheduleChanged, refreshKey = 0 }: FridayKhateebRosterCardProps) {
  const upcomingFridays = getUpcomingFridays(6);
  const [selectedDate, setSelectedDate] = useState<string>(upcomingFridays[0] ?? '');
  const [roster, setRoster] = useState<FridayKhateebRosterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestTopic, setGuestTopic] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadRoster = useCallback(async (date: string) => {
    if (!date) return;
    setIsLoading(true);
    try {
      const data = await getFridayKhateebRoster(date);
      setRoster(data);
    } catch (err) {
      console.error('Failed to load Friday Khateeb roster:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoster(selectedDate);
  }, [selectedDate, loadRoster, refreshKey]);

  const handleSaveOverride = async (shiftId: string) => {
    if (!guestName.trim()) return;
    setIsSaving(true);
    try {
      await saveFridayKhateebOverride(selectedDate, shiftId, guestName.trim(), guestTopic.trim() || undefined);
      await loadRoster(selectedDate);
      setEditingShiftId(null);
      setGuestName('');
      setGuestTopic('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onScheduleChanged?.();
    } catch (err) {
      console.error('Failed to save Friday Khateeb override:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    try {
      await deleteFridayKhateebOverride(overrideId);
      await loadRoster(selectedDate);
      onScheduleChanged?.();
    } catch (err) {
      console.error('Failed to delete Friday Khateeb override:', err);
    }
  };

  const rosterMap = new Map(roster.map((r) => [r.shift_id, r]));

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
            Upcoming Friday Khateeb &amp; Guest Speaker Roster
          </h3>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
            Assign or edit guest Khateebs and topics for a specific Friday date without altering weekly baseline shifts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {success && (
            <span className="text-xs font-semibold text-emerald-500 flex items-center space-x-1 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Khateeb saved!</span>
            </span>
          )}
          <div className="flex items-center space-x-1 bg-[var(--admin-card)] p-1 rounded-xl border border-[var(--admin-border)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--admin-text-muted)] ml-1" />
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setEditingShiftId(null);
              }}
              className="bg-transparent text-xs font-semibold text-[var(--admin-text-primary)] border-none focus:outline-none cursor-pointer pr-2"
            >
              {upcomingFridays.map((dateStr) => {
                const parts = dateStr.split('-');
                const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <option key={dateStr} value={dateStr} className="bg-[var(--admin-card)] text-[var(--admin-text-primary)]">
                    Friday, {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-[var(--admin-text-muted)] flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading Khateeb roster for {selectedDate}...</span>
          </div>
        ) : shifts.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--admin-text-muted)]">
            No Jummah shifts configured. Add a shift above to schedule Khateebs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shifts.map((shift, idx) => {
              const override = rosterMap.get(shift.id);
              const isEditingThis = editingShiftId === shift.id;

              return (
                <div
                  key={shift.id}
                  className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[var(--admin-text-primary)]">
                          Khutbah {idx + 1}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-[var(--admin-text-muted)]">
                          {format12h(shift.adhan_time)}
                          {shift.iqamah_time ? ` • Salah ${format12h(shift.iqamah_time)}` : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                        Weekly default: <span className="font-medium text-[var(--admin-text-secondary)]">{shift.khateeb_name?.trim() ? shift.khateeb_name : 'Unassigned'}</span>
                      </div>
                    </div>

                    {override && !isEditingThis && (
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase tracking-wider">
                        Guest Override
                      </span>
                    )}
                  </div>

                  {override && !isEditingThis ? (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--admin-card)] border border-teal-500/30">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-[var(--admin-text-primary)] truncate">
                          {override.khateeb_name}
                        </div>
                        {override.topic && (
                          <div className="text-[11px] text-[var(--admin-text-muted)] italic truncate">
                            Topic: {override.topic}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingShiftId(shift.id);
                            setGuestName(override.khateeb_name);
                            setGuestTopic(override.topic ?? '');
                          }}
                          className="p-1.5 rounded text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
                          title="Edit guest speaker or topic"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteOverride(override.id)}
                          className="p-1.5 rounded text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Remove guest Khateeb for this Friday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : isEditingThis ? (
                    <div className="space-y-2 p-2.5 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-tab-active-border)] animate-fadeIn">
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Guest Khateeb Name (e.g. Dr. Tariq)"
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                      />
                      <input
                        type="text"
                        value={guestTopic}
                        onChange={(e) => setGuestTopic(e.target.value)}
                        placeholder="Optional Khutbah Topic (e.g. Youth Leadership)"
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                      />
                      <div className="flex items-center justify-end space-x-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingShiftId(null);
                            setGuestName('');
                            setGuestTopic('');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSaving || !guestName.trim()}
                          onClick={() => void handleSaveOverride(shift.id)}
                          className="px-3 py-1 rounded-lg bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : override ? 'Update Override' : 'Set for this Friday'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShiftId(shift.id);
                        setGuestName('');
                        setGuestTopic('');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg border border-dashed border-[var(--admin-border)] text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-tab-active-border)] transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Guest Speaker for this Friday</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
