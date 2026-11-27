'use client';

import React from 'react';
import { Calendar, Clock, Play, RotateCcw, SkipBack, SkipForward, VolumeX } from 'lucide-react';

export interface DebugToolbarControlsProps {
  readonly timeOverrideMinutes: number | null;
  readonly isFridayForced: boolean;
  readonly onSetTimeOverrideMinutes: (minutes: number | null) => void;
  readonly onToggleForceFriday: () => void;
  readonly isEidForced?: boolean | undefined;
  readonly onToggleForceEid?: (() => void) | undefined;
  readonly onTriggerDrawer: () => void;
  readonly onNextPoster: () => void;
  readonly onPrevPoster: () => void;
  readonly isSilenceTestActive?: boolean | undefined;
  readonly onToggleSilenceTest?: (() => void) | undefined;
}

function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function DebugToolbarControls({
  timeOverrideMinutes,
  isFridayForced,
  onSetTimeOverrideMinutes,
  onToggleForceFriday,
  isEidForced = false,
  onToggleForceEid,
  onTriggerDrawer,
  onNextPoster,
  onPrevPoster,
  isSilenceTestActive = false,
  onToggleSilenceTest,
}: DebugToolbarControlsProps) {
  const currentScrubberValue = timeOverrideMinutes ?? 720;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
      <div className="md:col-span-5 flex flex-col justify-between bg-[#20222a] p-2.5 rounded-lg border border-[#2e323b] space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-300 font-medium flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Time Override</span>
          </span>
          <span className="font-mono text-xs text-neutral-200">
            {timeOverrideMinutes !== null ? `${minutesToTimeString(timeOverrideMinutes)} (Simulated)` : 'Live Clock'}
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <input
            type="range"
            min="0"
            max="1439"
            step="5"
            value={currentScrubberValue}
            onChange={(e) => onSetTimeOverrideMinutes(Number(e.target.value))}
            className="w-full accent-neutral-300 cursor-pointer h-1.5 bg-[#15161b] rounded-lg"
            aria-label="Simulate time of day"
          />
          {timeOverrideMinutes !== null && (
            <button
              onClick={() => onSetTimeOverrideMinutes(null)}
              className="h-7 px-2.5 rounded bg-[#15161b] hover:bg-[#282b35] border border-[#2e323b] text-xs font-medium text-neutral-300 hover:text-white flex items-center space-x-1 shrink-0 transition-colors"
              title="Reset to Real-Time"
            >
              <RotateCcw className="w-3 h-3 text-neutral-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="md:col-span-3 flex items-center justify-between bg-[#20222a] p-2.5 rounded-lg border border-[#2e323b]">
        <span className="text-xs font-medium text-neutral-300">Slide Stepper</span>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onPrevPoster}
            className="h-7 w-7 rounded bg-[#15161b] hover:bg-[#282b35] border border-[#2e323b] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
            title="Previous Slide"
            aria-label="Previous Slide"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNextPoster}
            className="h-7 w-7 rounded bg-[#15161b] hover:bg-[#282b35] border border-[#2e323b] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
            title="Next Slide"
            aria-label="Next Slide"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="md:col-span-4 flex flex-wrap items-center gap-2">
        <button
          onClick={onTriggerDrawer}
          className="flex-1 h-full min-h-[44px] px-2.5 rounded-lg bg-[#20222a] hover:bg-[#282b35] border border-[#2e323b] text-xs font-medium text-neutral-200 hover:text-white flex items-center justify-center space-x-1 transition-colors"
        >
          <Play className="w-3.5 h-3.5 text-neutral-400" />
          <span>Drawer</span>
        </button>

        <button
          onClick={onToggleForceFriday}
          className={`h-full min-h-[44px] px-2.5 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
            isFridayForced
              ? 'bg-amber-950/40 text-amber-300 border-amber-600/40'
              : 'bg-[#20222a] hover:bg-[#282b35] border-[#2e323b] text-neutral-300 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isFridayForced ? 'Fri Active' : 'Force Fri'}</span>
        </button>

        {onToggleForceEid && (
          <button
            onClick={onToggleForceEid}
            className={`h-full min-h-[44px] px-2.5 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
              isEidForced
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
                : 'bg-[#20222a] hover:bg-[#282b35] border-[#2e323b] text-neutral-300 hover:text-white'
            }`}
            title="Preview Eid Multi-Shift Drawer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isEidForced ? 'Eid Active' : 'Force Eid'}</span>
          </button>
        )}

        <button
          onClick={onToggleSilenceTest}
          className={`h-full min-h-[44px] px-2.5 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1 transition-colors ${
            isSilenceTestActive
              ? 'bg-rose-950/50 text-rose-300 border-rose-600/50 shadow-sm'
              : 'bg-[#20222a] hover:bg-[#282b35] border-[#2e323b] text-neutral-300 hover:text-white'
          }`}
          title="Toggle Congregation Silence Screen (T)"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>{isSilenceTestActive ? 'Exit Silence' : 'Silence'}</span>
          <kbd className="text-[10px] bg-[#15161b] px-1 py-0.5 rounded text-neutral-400 border border-[#2e323b]">T</kbd>
        </button>
      </div>
    </div>
  );
}

