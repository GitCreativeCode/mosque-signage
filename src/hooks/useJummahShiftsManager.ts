'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DbJummahShiftRecord } from '@/lib/actions/jummah';
import { checkChronologicalShifts } from '@/lib/utils/time';
import {
  computeNextDefaultKhutbahTime,
  getUpcomingFridays,
  validateEditedShiftChronology,
  validateNewShiftChronology,
} from '@/lib/prayer/jummah-validation';

export type PrayerSubTab = 'TIMETABLE' | 'JUMMAH' | 'SEASONAL';

export function resolveInitialPrayerTab(sub?: string): PrayerSubTab {
  const s = sub?.toLowerCase();
  if (s === 'jummah') return 'JUMMAH';
  if (s === 'seasonal' || s === 'eid' || s === 'ramadan') return 'SEASONAL';
  return 'TIMETABLE';
}

export function useJummahShiftsManager({
  initialJummahShifts,
  onRefresh,
  initialSubTab,
  controlledSubTab,
  onSubTabChange,
}: {
  readonly initialJummahShifts: readonly DbJummahShiftRecord[];
  readonly onRefresh: () => void;
  readonly initialSubTab?: string | undefined;
  readonly controlledSubTab?: PrayerSubTab | undefined;
  readonly onSubTabChange?: ((tab: PrayerSubTab) => void) | undefined;
}) {
  const [activeTab, setActiveTab] = useState<PrayerSubTab>(
    () => controlledSubTab ?? resolveInitialPrayerTab(initialSubTab)
  );
  const [shifts, setShifts] = useState<DbJummahShiftRecord[]>([...initialJummahShifts]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingShift, setEditingShift] = useState<DbJummahShiftRecord | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [newKhateeb, setNewKhateeb] = useState('');
  const [newAdhan, setNewAdhan] = useState('12:30');
  const [newIqamah, setNewIqamah] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [editKhateeb, setEditKhateeb] = useState('');
  const [editAdhan, setEditAdhan] = useState('12:30');
  const [editIqamah, setEditIqamah] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [scheduleScope, setScheduleScope] = useState<'WEEKLY' | 'SPECIFIC_DATE'>('WEEKLY');
  const [overrideDate, setOverrideDate] = useState(() => getUpcomingFridays(1)[0] ?? '');
  const [overrideShiftId, setOverrideShiftId] = useState('');
  const [rosterRefreshKey, setRosterRefreshKey] = useState(0);
  const [isShiftSubmitting, setIsShiftSubmitting] = useState(false);
  const [shiftFormError, setShiftFormError] = useState<string | null>(null);
  const [shiftOrderError, setShiftOrderError] = useState<string | null>(null);
  const [jummahSuccess, setJummahSuccess] = useState(false);
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);

  useEffect(() => {
    setShifts([...initialJummahShifts]);
  }, [initialJummahShifts]);

  useEffect(() => {
    if (controlledSubTab && controlledSubTab !== activeTab) setActiveTab(controlledSubTab);
  }, [controlledSubTab, activeTab]);

  useEffect(() => {
    const onPopState = () => {
      if (typeof window === 'undefined') return;
      const tab = resolveInitialPrayerTab(new URLSearchParams(window.location.search).get('sub') ?? undefined);
      setActiveTab(tab);
      onSubTabChange?.(tab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onSubTabChange]);

  const handleSubTabChange = (tab: PrayerSubTab) => {
    setActiveTab(tab);
    onSubTabChange?.(tab);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (tab === 'JUMMAH') url.searchParams.set('sub', 'jummah');
    else if (tab === 'SEASONAL') url.searchParams.set('sub', 'seasonal');
    else url.searchParams.delete('sub');
    window.history.replaceState(null, '', url.pathname + url.search);
  };

  const commitReorder = useCallback(async (newShifts: DbJummahShiftRecord[]) => {
    const chronoError = checkChronologicalShifts(newShifts);
    if (chronoError) { setShiftOrderError(chronoError); setTimeout(() => setShiftOrderError(null), 5000); return; }
    setShifts(newShifts);
    setShiftOrderError(null);
    try {
      const { reorderJummahShifts } = await import('@/lib/actions/jummah');
      await reorderJummahShifts(newShifts.map((s) => s.id));
      onRefresh();
    } catch (err) {
      console.error('Failed to persist reordering:', err);
    }
  }, [onRefresh]);

  const handleMoveShift = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= shifts.length) return;
    const next = [...shifts];
    const [moved] = next.splice(index, 1);
    if (moved) { next.splice(target, 0, moved); await commitReorder(next); }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const src = draggedIndex;
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (src === null || src === targetIndex) return;
    const next = [...shifts];
    const [moved] = next.splice(src, 1);
    if (moved) { next.splice(targetIndex, 0, moved); await commitReorder(next); }
  };

  const handleSaveEditedShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;
    setShiftFormError(null);

    if (scheduleScope === 'SPECIFIC_DATE') {
      if (!overrideDate) { setShiftFormError('Please choose a Friday date.'); return; }
      if (!editKhateeb.trim()) { setShiftFormError('Guest Khateeb name is required for a date override.'); return; }
      setIsShiftSubmitting(true);
      try {
        const { saveFridayKhateebOverride } = await import('@/lib/actions/jummah');
        await saveFridayKhateebOverride(overrideDate, editingShift.id, editKhateeb.trim(), editTopic.trim() || undefined);
        setRosterRefreshKey((k) => k + 1);
        setEditingShift(null);
        setJummahSuccess(true);
        setTimeout(() => setJummahSuccess(false), 3000);
        onRefresh();
      } catch (error) { setShiftFormError(error instanceof Error ? error.message : 'Failed to save Friday override.'); }
      finally { setIsShiftSubmitting(false); }
      return;
    }

    const currIdx = shifts.findIndex((s) => s.id === editingShift.id);
    const err = validateEditedShiftChronology(shifts, currIdx, editAdhan, editIqamah);
    if (err) { setShiftFormError(err); return; }
    setIsShiftSubmitting(true);
    try {
      const { updateJummahShift, getJummahShifts } = await import('@/lib/actions/jummah');
      await updateJummahShift({
        id: editingShift.id,
        shift_number: currIdx + 1,
        khateeb_name: editKhateeb.trim(),
        adhan_time: editAdhan,
        iqamah_time: editIqamah.trim() || undefined,
        location: editLocation.trim() || undefined,
        language: editLanguage.trim() || undefined,
        topic: editTopic.trim() || undefined,
      });
      setShifts(await getJummahShifts());
      setEditingShift(null);
      setJummahSuccess(true);
      setTimeout(() => setJummahSuccess(false), 3000);
      onRefresh();
    } catch (error) { setShiftFormError(error instanceof Error ? error.message : 'Failed to update shift.'); }
    finally { setIsShiftSubmitting(false); }
  };

  const handleAddNewShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftFormError(null);

    if (scheduleScope === 'SPECIFIC_DATE') {
      const targetId = overrideShiftId || shifts[0]?.id;
      if (!overrideDate || !targetId) { setShiftFormError('Please select a Friday date and target Khutbah shift.'); return; }
      if (!newKhateeb.trim()) { setShiftFormError('Guest Khateeb name is required for a date override.'); return; }
      setIsShiftSubmitting(true);
      try {
        const { saveFridayKhateebOverride } = await import('@/lib/actions/jummah');
        await saveFridayKhateebOverride(overrideDate, targetId, newKhateeb.trim(), newTopic.trim() || undefined);
        setRosterRefreshKey((k) => k + 1);
        setIsAddingShift(false);
        setNewKhateeb(''); setNewTopic('');
        setJummahSuccess(true);
        setTimeout(() => setJummahSuccess(false), 3000);
        onRefresh();
      } catch (error) { setShiftFormError(error instanceof Error ? error.message : 'Failed to save Friday override.'); }
      finally { setIsShiftSubmitting(false); }
      return;
    }

    const err = validateNewShiftChronology(shifts, newAdhan, newIqamah);
    if (err) { setShiftFormError(err); return; }
    setIsShiftSubmitting(true);
    try {
      const { createJummahShift, getJummahShifts } = await import('@/lib/actions/jummah');
      await createJummahShift({
        shift_number: shifts.length + 1,
        khateeb_name: newKhateeb.trim(),
        adhan_time: newAdhan,
        iqamah_time: newIqamah || undefined,
        location: newLocation.trim() || undefined,
        language: newLanguage.trim() || undefined,
        topic: newTopic.trim() || undefined,
      });
      setShifts(await getJummahShifts());
      setIsAddingShift(false);
      setNewKhateeb(''); setNewAdhan('12:30'); setNewIqamah(''); setNewLocation(''); setNewLanguage(''); setNewTopic('');
      setJummahSuccess(true);
      setTimeout(() => setJummahSuccess(false), 3000);
      onRefresh();
    } catch (error) { setShiftFormError(error instanceof Error ? error.message : 'Failed to create shift.'); }
    finally { setIsShiftSubmitting(false); }
  };

  const handleDeleteShift = async (id: string) => {
    try {
      const { deleteJummahShift } = await import('@/lib/actions/jummah');
      await deleteJummahShift(id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
      setDeletingShiftId(null);
      onRefresh();
    } catch (error) { console.error('Failed to delete shift:', error); }
  };

  return {
    activeTab, handleSubTabChange, shifts, draggedIndex, setDraggedIndex, dragOverIndex, setDragOverIndex,
    editingShift, setEditingShift, isAddingShift, setIsAddingShift,
    newKhateeb, setNewKhateeb, newAdhan, setNewAdhan, newIqamah, setNewIqamah,
    newLocation, setNewLocation, newLanguage, setNewLanguage, newTopic, setNewTopic,
    editKhateeb, setEditKhateeb, editAdhan, setEditAdhan, editIqamah, setEditIqamah,
    editLocation, setEditLocation, editLanguage, setEditLanguage, editTopic, setEditTopic,
    scheduleScope, setScheduleScope, overrideDate, setOverrideDate, overrideShiftId, setOverrideShiftId, rosterRefreshKey,
    isShiftSubmitting, shiftFormError, shiftOrderError, jummahSuccess, deletingShiftId, setDeletingShiftId,
    handleMoveShift, handleDrop, handleSaveEditedShift, handleAddNewShift, handleDeleteShift,
    handleOpenAddModal: () => {
      setShiftFormError(null);
      setScheduleScope('WEEKLY');
      setOverrideDate(getUpcomingFridays(1)[0] ?? '');
      setOverrideShiftId(shifts[0]?.id ?? '');
      setNewAdhan(computeNextDefaultKhutbahTime(shifts));
      setNewKhateeb(''); setNewIqamah(''); setNewLocation(''); setNewLanguage(''); setNewTopic('');
      setIsAddingShift(true);
    },
    handleOpenEditShift: (shift: DbJummahShiftRecord) => {
      setScheduleScope('WEEKLY');
      setOverrideDate(getUpcomingFridays(1)[0] ?? '');
      setOverrideShiftId(shift.id);
      setEditingShift(shift); setEditKhateeb(shift.khateeb_name ?? '');
      setEditAdhan(shift.adhan_time); setEditIqamah(shift.iqamah_time ?? '');
      setEditLocation(shift.location ?? ''); setEditLanguage(shift.language ?? ''); setEditTopic(shift.topic ?? '');
      setShiftFormError(null);
    },
  };
}
