'use client';

import React from 'react';
import { padDatePart, parseDateInput, type DatePresetKey } from '@/lib/utils/datetime-input';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PRESETS: ReadonlyArray<{ readonly key: DatePresetKey; readonly label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'friday', label: 'This Friday' },
  { key: 'week1', label: '+1 Week' },
  { key: 'week2', label: '+2 Weeks' },
];

export interface DateCalendarPopoverProps {
  readonly calendarViewDate: Date;
  readonly selectedDateText: string;
  readonly onChangeViewDate: (date: Date) => void;
  readonly onApplyPreset: (preset: DatePresetKey) => void;
  readonly onSelectDay: (newDateText: string) => void;
}

export function DateCalendarPopover({
  calendarViewDate,
  selectedDateText,
  onChangeViewDate,
  onApplyPreset,
  onSelectDay,
}: DateCalendarPopoverProps) {
  const calendarYear = calendarViewDate.getFullYear();
  const calendarMonth = calendarViewDate.getMonth();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const parsedCurrentDate = parseDateInput(selectedDateText);
  const today = new Date();

  return (
    <div className="absolute top-full left-0 mt-2 z-50 bg-[#20222a] border border-[#2e323b] rounded-xl p-4 shadow-xl min-w-[300px] max-w-xs animate-fadeIn text-[#e6edf3]">
      <div className="flex items-center space-x-1.5 pb-3 border-b border-[#2e323b] mb-3 overflow-x-auto text-[11px]">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onApplyPreset(preset.key)}
            className="px-2 py-1 rounded-md bg-[#282a35] hover:bg-[#323642] active:scale-95 cursor-pointer transition-all duration-150 text-neutral-300 hover:text-white shrink-0 font-medium"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold text-white">
          {MONTH_NAMES[calendarMonth]} {calendarYear}
        </span>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onChangeViewDate(new Date(calendarYear, calendarMonth - 1, 1))}
            className="p-1 rounded-lg hover:bg-[#282a35] active:scale-95 cursor-pointer text-neutral-400 hover:text-white transition-all duration-150"
            title="Previous Month"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={() => onChangeViewDate(new Date(calendarYear, calendarMonth + 1, 1))}
            className="p-1 rounded-lg hover:bg-[#282a35] active:scale-95 cursor-pointer text-neutral-400 hover:text-white transition-all duration-150"
            title="Next Month"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-neutral-400 mb-1">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7 w-7" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isSelected = Boolean(
            parsedCurrentDate &&
            parsedCurrentDate.year === calendarYear &&
            parsedCurrentDate.month === calendarMonth + 1 &&
            parsedCurrentDate.day === day
          );
          const isToday =
            today.getFullYear() === calendarYear &&
            today.getMonth() === calendarMonth &&
            today.getDate() === day;

          return (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => onSelectDay(`${calendarYear}-${padDatePart(calendarMonth + 1)}-${padDatePart(day)}`)}
              className={`h-7 w-7 rounded-lg flex items-center justify-center font-mono tabular-nums transition-all duration-150 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-[#388bfd] text-white font-bold'
                  : isToday
                  ? 'border border-[#388bfd]/50 text-white hover:bg-[#282a35]'
                  : 'text-neutral-300 hover:bg-[#282a35] hover:text-white'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

