'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { padTimePart } from '@/lib/utils/time-picker-utils';

export interface TimePickerMinuteSteppersProps {
  readonly currentMinNum: number;
  readonly onStepMinute: (delta: number) => void;
  readonly onSelectMinute: (minute: number) => void;
}

export function TimePickerMinuteSteppers({
  currentMinNum,
  onStepMinute,
  onSelectMinute,
}: TimePickerMinuteSteppersProps) {
  return (
    <div className="mt-2 pt-2 border-t border-[#2e323b] space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-neutral-400 text-[11px]">Exact Minute:</span>
        <span className="text-[#388bfd] font-bold text-sm bg-[#15161b] px-2 py-0.5 rounded border border-[#313542] tabular-nums">
          :{padTimePart(currentMinNum)}
        </span>
      </div>

      <div className="flex items-center justify-center space-x-1.5 pt-1">
        <button
          type="button"
          onClick={() => onStepMinute(-5)}
          className="px-2 py-1 rounded bg-[#282a35] hover:bg-[#323642] active:scale-95 cursor-pointer text-neutral-300 hover:text-white font-mono tabular-nums text-[11px] border border-[#353945] transition-all duration-150"
          title="Subtract 5 minutes"
        >
          -5m
        </button>
        <button
          type="button"
          onClick={() => onStepMinute(-1)}
          className="px-2.5 py-1 rounded bg-[#282a35] hover:bg-[#323642] active:scale-95 cursor-pointer text-neutral-200 hover:text-white font-mono tabular-nums text-xs border border-[#353945] flex items-center space-x-1 transition-all duration-150"
          title="Subtract 1 minute"
        >
          <Minus className="w-3 h-3" />
          <span>1m</span>
        </button>
        <button
          type="button"
          onClick={() => onStepMinute(1)}
          className="px-2.5 py-1 rounded bg-[#282a35] hover:bg-[#323642] active:scale-95 cursor-pointer text-neutral-200 hover:text-white font-mono tabular-nums text-xs border border-[#353945] flex items-center space-x-1 transition-all duration-150"
          title="Add 1 minute"
        >
          <Plus className="w-3 h-3" />
          <span>1m</span>
        </button>
        <button
          type="button"
          onClick={() => onStepMinute(5)}
          className="px-2 py-1 rounded bg-[#282a35] hover:bg-[#323642] active:scale-95 cursor-pointer text-neutral-300 hover:text-white font-mono tabular-nums text-[11px] border border-[#353945] transition-all duration-150"
          title="Add 5 minutes"
        >
          +5m
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1 pt-1">
        {[0, 15, 30, 45].map((m) => (
          <button
            key={`preset-min-${m}`}
            type="button"
            onClick={() => onSelectMinute(m)}
            className={`py-1 rounded text-[10px] font-mono tabular-nums font-semibold transition-all duration-150 active:scale-95 cursor-pointer ${
              currentMinNum === m
                ? 'bg-[#388bfd] text-white'
                : 'bg-[#15161b] text-neutral-400 hover:text-white hover:bg-[#282a35]'
            }`}
          >
            :{padTimePart(m)}
          </button>
        ))}
      </div>
    </div>
  );
}

