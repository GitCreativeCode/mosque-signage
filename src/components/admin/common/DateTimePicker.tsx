'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import {
  padDatePart,
  parseDateInput,
  parseTimeInput,
  resolveDatePresetTarget,
  type DatePresetKey,
} from '@/lib/utils/datetime-input';
import { TimePicker } from './TimePicker';
import { DateCalendarPopover } from './DateCalendarPopover';

export { parseDateInput, parseTimeInput };

export interface DateTimePickerProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (isoString: string) => void;
  readonly required?: boolean | undefined;
  readonly disabled?: boolean | undefined;
}

function resolveInitialDate(val: string): Date {
  try {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
}

export function DateTimePicker({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}: DateTimePickerProps) {
  const initialDate = resolveInitialDate(value);
  const [dateText, setDateText] = useState<string>(
    () => `${initialDate.getFullYear()}-${padDatePart(initialDate.getMonth() + 1)}-${padDatePart(initialDate.getDate())}`
  );
  const [time24, setTime24] = useState<string>(
    () => `${padDatePart(initialDate.getHours())}:${padDatePart(initialDate.getMinutes())}`
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date(initialDate));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return;
      setDateText(`${d.getFullYear()}-${padDatePart(d.getMonth() + 1)}-${padDatePart(d.getDate())}`);
      setTime24(`${padDatePart(d.getHours())}:${padDatePart(d.getMinutes())}`);
    } catch {
      // ignore invalid external dates
    }
  }, [value]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsCalendarOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCalendarOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const commitIso = (newDateStr: string, newTimeStr: string) => {
    const pDate = parseDateInput(newDateStr);
    if (!pDate) return;
    const parts = newTimeStr.split(':');
    const d = new Date(pDate.year, pDate.month - 1, pDate.day, Number(parts[0]) || 0, Number(parts[1]) || 0, 0);
    onChange(d.toISOString());
  };

  const handleDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setDateText(text);
    const pDate = parseDateInput(text);
    if (!pDate) return;
    setCalendarViewDate(new Date(pDate.year, pDate.month - 1, 1));
    commitIso(text, time24);
  };

  const handleApplyPreset = (preset: DatePresetKey) => {
    const res = resolveDatePresetTarget(preset, new Date());
    setDateText(res.dateText);
    setCalendarViewDate(res.viewMonthDate);
    commitIso(res.dateText, time24);
    setIsCalendarOpen(false);
  };

  const isDateValid = parseDateInput(dateText) !== null;

  return (
    <div ref={containerRef} className="space-y-1.5 relative select-none">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-neutral-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        <span className="text-[10px] text-neutral-400 font-mono">YYYY-MM-DD • HH:MM</span>
      </div>

      <div
        className={`flex items-center justify-between rounded-lg bg-[#15161b] border ${
          isDateValid ? 'border-[#313542] hover:border-[#444b5c]' : 'border-amber-500/50'
        } transition-colors p-1`}
      >
        <div className="flex items-center px-2 py-1 space-x-2 flex-1 min-w-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsCalendarOpen((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-colors ${
              isCalendarOpen ? 'bg-[#388bfd]/20 text-[#388bfd]' : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            title="Open calendar date picker"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <input
            type="text"
            disabled={disabled}
            value={dateText}
            onChange={handleDateTextChange}
            placeholder="YYYY-MM-DD"
            className="w-full bg-transparent text-white font-mono tabular-nums text-xs focus:outline-none placeholder-neutral-500"
          />
        </div>

        <div className="w-[1px] h-6 bg-[#2e323b] mx-1" />
        <TimePicker value={time24} disabled={disabled} onChange={(t) => { setTime24(t); commitIso(dateText, t); }} />
      </div>

      {!isDateValid && (
        <span className="text-[11px] text-amber-400 block font-mono">Enter date as YYYY-MM-DD (e.g. 2026-10-25)</span>
      )}

      {isCalendarOpen && (
        <DateCalendarPopover
          calendarViewDate={calendarViewDate}
          selectedDateText={dateText}
          onChangeViewDate={setCalendarViewDate}
          onApplyPreset={handleApplyPreset}
          onSelectDay={(newDateStr) => {
            setDateText(newDateStr);
            commitIso(newDateStr, time24);
            setIsCalendarOpen(false);
          }}
        />
      )}
    </div>
  );
}
