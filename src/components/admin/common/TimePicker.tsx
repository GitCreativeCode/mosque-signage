'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { padTimePart } from '@/lib/utils/time-picker-utils';
import { useTimePickerInput } from '@/hooks/useTimePickerInput';
import { TimePickerClockPopover } from './TimePickerClockPopover';

export interface TimePickerProps {
  readonly value: string;
  readonly onChange: (value24h: string) => void;
  readonly placeholder?: string | undefined;
  readonly className?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly id?: string | undefined;
}

export function TimePicker({
  value,
  onChange,
  className = '',
  disabled = false,
  id,
}: TimePickerProps) {
  const [isClockOpen, setIsClockOpen] = useState(false);
  const [clockMode, setClockMode] = useState<'hour' | 'minute'>('hour');
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    hourInput, setHourInput, minuteInput, setMinuteInput, isPm, setIsPm,
    hourInputRef, minuteInputRef, isTypingHourRef, isTypingMinuteRef,
    commitTime, handleHourBlur, handleHourChange, handleHourKeyDown,
    handleMinuteBlur, handleMinuteChange, handleMinuteKeyDown,
  } = useTimePickerInput(value, onChange);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsClockOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsClockOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center px-2 py-1 space-x-1 rounded-lg bg-[#15161b] border border-[#313542] hover:border-[#444b5c] transition-colors focus-within:border-[#388bfd]">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { setIsClockOpen((prev) => !prev); setClockMode('hour'); }}
          className={`p-1 rounded-md transition-colors ${isClockOpen ? 'bg-[#388bfd]/20 text-[#388bfd]' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
          title="Open interactive clock dial"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>

        <input
          ref={hourInputRef}
          id={id ? `${id}-hour` : undefined}
          type="text"
          disabled={disabled}
          value={hourInput}
          onFocus={(e) => { isTypingHourRef.current = true; e.target.select(); }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          onBlur={handleHourBlur}
          onKeyDown={handleHourKeyDown}
          onChange={handleHourChange}
          placeholder="12"
          maxLength={2}
          className="w-6 h-6 text-center rounded bg-[#20222a] text-white font-mono tabular-nums text-xs font-semibold focus:outline-none focus:bg-[#388bfd] focus:text-white transition-colors"
          title="Hour (1-12 or 24h) - Backspace to edit"
        />

        <span className="text-neutral-400 font-mono font-bold text-xs select-none">:</span>

        <input
          ref={minuteInputRef}
          id={id ? `${id}-minute` : undefined}
          type="text"
          disabled={disabled}
          value={minuteInput}
          onFocus={(e) => { isTypingMinuteRef.current = true; e.target.select(); }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          onBlur={handleMinuteBlur}
          onKeyDown={handleMinuteKeyDown}
          onChange={handleMinuteChange}
          placeholder="00"
          maxLength={2}
          className="w-6 h-6 text-center rounded bg-[#20222a] text-white font-mono tabular-nums text-xs font-semibold focus:outline-none focus:bg-[#388bfd] focus:text-white transition-colors"
          title="Minute (00-59) - Backspace to edit"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const nextPm = !isPm;
            setIsPm(nextPm);
            commitTime(Number(hourInput) || 12, Number(minuteInput) || 0, nextPm);
          }}
          className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tabular-nums transition-all duration-150 active:scale-95 cursor-pointer bg-[#20222a] text-[#388bfd] hover:bg-[#282a35] hover:text-white ml-0.5"
          title="Click to toggle AM / PM"
        >
          {isPm ? 'PM' : 'AM'}
        </button>
      </div>

      {isClockOpen && (
        <TimePickerClockPopover
          clockMode={clockMode}
          hourInput={hourInput}
          minuteInput={minuteInput}
          currentHourNum={Number(hourInput) || 12}
          currentMinNum={Number(minuteInput) || 0}
          isPm={isPm}
          onChangeMode={setClockMode}
          onSetPm={(pm) => { setIsPm(pm); commitTime(Number(hourInput) || 12, Number(minuteInput) || 0, pm); }}
          onSelectHour={(h) => { setHourInput(padTimePart(h)); commitTime(h, Number(minuteInput) || 0, isPm); setClockMode('minute'); }}
          onSelectMinute={(m) => { setMinuteInput(padTimePart(m)); commitTime(Number(hourInput) || 12, m, isPm); }}
          onStepMinute={(delta) => {
            const next = ((Number(minuteInput) || 0) + delta + 60) % 60;
            setMinuteInput(padTimePart(next));
            commitTime(Number(hourInput) || 12, next, isPm);
          }}
          onClose={() => setIsClockOpen(false)}
        />
      )}
    </div>
  );
}
