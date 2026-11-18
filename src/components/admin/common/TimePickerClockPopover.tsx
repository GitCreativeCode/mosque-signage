'use client';

import React from 'react';
import { TimePickerClockDial } from './TimePickerClockDial';
import { TimePickerMinuteSteppers } from './TimePickerMinuteSteppers';

export interface TimePickerClockPopoverProps {
  readonly clockMode: 'hour' | 'minute';
  readonly hourInput: string;
  readonly minuteInput: string;
  readonly currentHourNum: number;
  readonly currentMinNum: number;
  readonly isPm: boolean;
  readonly onChangeMode: (mode: 'hour' | 'minute') => void;
  readonly onSetPm: (pm: boolean) => void;
  readonly onSelectHour: (hour: number) => void;
  readonly onSelectMinute: (minute: number) => void;
  readonly onStepMinute: (delta: number) => void;
  readonly onClose: () => void;
}

export function TimePickerClockPopover({
  clockMode,
  hourInput,
  minuteInput,
  currentHourNum,
  currentMinNum,
  isPm,
  onChangeMode,
  onSetPm,
  onSelectHour,
  onSelectMinute,
  onStepMinute,
  onClose,
}: TimePickerClockPopoverProps) {
  return (
    <div className="absolute top-full right-0 mt-2 z-50 bg-[#20222a] border border-[#2e323b] rounded-xl p-3.5 shadow-xl min-w-[260px] animate-fadeIn text-[#e6edf3]">
      <div className="flex items-center justify-between pb-3 border-b border-[#2e323b] mb-2.5">
        <div className="flex items-center space-x-1 font-mono text-base font-bold tabular-nums">
          <button
            type="button"
            onClick={() => onChangeMode('hour')}
            className={`px-2 py-0.5 rounded-md transition-all duration-150 active:scale-95 cursor-pointer ${
              clockMode === 'hour' ? 'bg-[#388bfd] text-white' : 'text-neutral-300 hover:bg-[#282a35]'
            }`}
            title="Select Hour"
          >
            {hourInput || '12'}
          </button>
          <span className="text-neutral-400">:</span>
          <button
            type="button"
            onClick={() => onChangeMode('minute')}
            className={`px-2 py-0.5 rounded-md transition-all duration-150 active:scale-95 cursor-pointer ${
              clockMode === 'minute' ? 'bg-[#388bfd] text-white' : 'text-neutral-300 hover:bg-[#282a35]'
            }`}
            title="Select Minute"
          >
            {minuteInput || '00'}
          </button>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-[#353945] bg-[#15161b] text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => onSetPm(false)}
            className={`px-2 py-1 transition-all duration-150 active:scale-95 cursor-pointer ${
              !isPm ? 'bg-[#388bfd] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => onSetPm(true)}
            className={`px-2 py-1 transition-all duration-150 active:scale-95 cursor-pointer ${
              isPm ? 'bg-[#388bfd] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            PM
          </button>
        </div>
      </div>

      <div className="text-[11px] font-medium text-neutral-400 text-center mb-1">
        {clockMode === 'hour' ? 'Tap an Hour on the Dial' : 'Tap or Drag for Any Minute (0–59)'}
      </div>

      <TimePickerClockDial
        clockMode={clockMode}
        currentHourNum={currentHourNum}
        currentMinNum={currentMinNum}
        onSelectHour={onSelectHour}
        onSelectMinute={onSelectMinute}
      />

      {clockMode === 'minute' && (
        <TimePickerMinuteSteppers
          currentMinNum={currentMinNum}
          onStepMinute={onStepMinute}
          onSelectMinute={onSelectMinute}
        />
      )}

      <div className="mt-3 pt-2 border-t border-[#2e323b] flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded-lg bg-[#282a35] hover:bg-[#323642] active:scale-95 cursor-pointer text-xs font-semibold text-white border border-[#353945] transition-all duration-150"
        >
          Done
        </button>
      </div>
    </div>
  );
}

