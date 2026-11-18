'use client';

import React, { useRef } from 'react';
import {
  CLOCK_HOUR_POSITIONS,
  CLOCK_MINUTE_POSITIONS,
  calculateMinuteFromDialPointer,
} from '@/lib/utils/time-picker-utils';

export interface TimePickerClockDialProps {
  readonly clockMode: 'hour' | 'minute';
  readonly currentHourNum: number;
  readonly currentMinNum: number;
  readonly onSelectHour: (hour: number) => void;
  readonly onSelectMinute: (minute: number) => void;
}

export function TimePickerClockDial({
  clockMode,
  currentHourNum,
  currentMinNum,
  onSelectHour,
  onSelectMinute,
}: TimePickerClockDialProps) {
  const clockFaceRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleFacePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (clockMode !== 'minute' || !clockFaceRef.current) return;
    const rect = clockFaceRef.current.getBoundingClientRect();
    onSelectMinute(calculateMinuteFromDialPointer(e.clientX, e.clientY, rect));
  };

  const activeDeg = clockMode === 'hour' ? (currentHourNum % 12) * 30 : currentMinNum * 6;
  const positions = clockMode === 'hour' ? CLOCK_HOUR_POSITIONS : CLOCK_MINUTE_POSITIONS;

  return (
    <div
      ref={clockFaceRef}
      onPointerDown={(e) => {
        isDraggingRef.current = true;
        handleFacePointer(e);
      }}
      onPointerMove={(e) => {
        if (isDraggingRef.current) handleFacePointer(e);
      }}
      onPointerUp={() => {
        isDraggingRef.current = false;
      }}
      className="relative w-48 h-48 mx-auto my-2 rounded-full bg-[#15161b] border border-[#2e323b] flex items-center justify-center cursor-pointer select-none touch-none shadow-inner"
    >
      <div className="absolute w-2.5 h-2.5 rounded-full bg-[#388bfd] z-20 shadow-md" />

      <div
        className="absolute bottom-1/2 left-1/2 w-0.5 bg-[#388bfd]/70 origin-bottom pointer-events-none transition-transform duration-100"
        style={{ height: '66px', transform: `translateX(-50%) rotate(${activeDeg}deg)` }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[#388bfd] -ml-1 -mt-1 shadow" />
      </div>

      {positions.map((pos) => {
        const isSelected = clockMode === 'hour' ? currentHourNum === pos.val : currentMinNum === pos.val;
        const selectedClass =
          clockMode === 'hour'
            ? 'bg-[#388bfd] text-white shadow-md font-bold'
            : 'bg-[#388bfd] text-white shadow-md font-bold ring-2 ring-white/40';

        return (
          <button
            key={`clock-${clockMode}-${pos.val}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (clockMode === 'hour') onSelectHour(pos.val);
              else onSelectMinute(pos.val);
            }}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute w-7 h-7 rounded-full flex items-center justify-center font-mono ${
              clockMode === 'hour' ? 'text-xs' : 'text-[11px]'
            } font-semibold transition-all z-10 ${
              isSelected ? selectedClass : 'text-neutral-300 hover:bg-[#282a35] hover:text-white'
            }`}
          >
            {pos.label ?? pos.val}
          </button>
        );
      })}
    </div>
  );
}

