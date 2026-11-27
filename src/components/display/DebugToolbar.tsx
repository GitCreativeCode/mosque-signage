'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Code, Wrench } from 'lucide-react';
import type { DisplayState } from '@/types/index';
import { DebugToolbarControls } from './DebugToolbarControls';

export interface DebugToolbarProps {
  readonly displayState: DisplayState;
  readonly isFridayForced: boolean;
  readonly onToggleForceFriday: () => void;
  readonly isEidForced?: boolean | undefined;
  readonly onToggleForceEid?: (() => void) | undefined;
  readonly timeOverrideMinutes: number | null;
  readonly onSetTimeOverrideMinutes: (minutes: number | null) => void;
  readonly onTriggerDrawer: () => void;
  readonly onNextPoster: () => void;
  readonly onPrevPoster: () => void;
  readonly isSilenceTestActive?: boolean | undefined;
  readonly onToggleSilenceTest?: (() => void) | undefined;
  readonly allowSimulator?: boolean | undefined;
}

export function DebugToolbar({
  displayState,
  isFridayForced,
  onToggleForceFriday,
  isEidForced = false,
  onToggleForceEid,
  timeOverrideMinutes,
  onSetTimeOverrideMinutes,
  onTriggerDrawer,
  onNextPoster,
  onPrevPoster,
  isSilenceTestActive = false,
  onToggleSilenceTest,
  allowSimulator = process.env.NEXT_PUBLIC_PUBLIC_ACCESS_MODE !== 'true',
}: DebugToolbarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isTriggerRevealed, setIsTriggerRevealed] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);
  const onToggleSilenceRef = useRef(onToggleSilenceTest);
  onToggleSilenceRef.current = onToggleSilenceTest;

  useEffect(() => {
    if (!allowSimulator || typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true' || params.get('simulator') === 'true') {
      setIsOpen(true);
      setIsTriggerRevealed(true);
    }

    const toggleSim = () => { setIsTriggerRevealed(true); setIsOpen((prev) => !prev); };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'S', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        toggleSim();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      if (isOpen && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        onToggleSilenceRef.current?.();
        return;
      }

      const isF2 = e.key === 'F2';
      const isBacktick = !e.ctrlKey && !e.altKey && !e.metaKey && (e.key === '`' || e.key === '~');
      const isShiftK = e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.key === 'K' || e.key === 'k');
      if (isF2 || isBacktick || isShiftK) {
        e.preventDefault();
        toggleSim();
      }
    };

    window.addEventListener('kiosk:toggle-simulator', toggleSim);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kiosk:toggle-simulator', toggleSim);
    };
  }, [allowSimulator, isOpen]);

  if (!allowSimulator) return null;
  if (!isOpen) {
    if (!isTriggerRevealed) return null;
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-1 animate-fadeIn">
        <button
          onClick={() => setIsOpen(true)}
          className="h-9 px-3 rounded-lg bg-[#20222a] border border-[#2e323b] text-neutral-300 hover:text-white hover:bg-[#282b35] transition-colors shadow-lg flex items-center space-x-2 text-xs font-medium cursor-pointer"
          title="Open Simulator (F2 or ~)"
        >
          <Wrench className="w-3.5 h-3.5 text-neutral-400" />
          <span>Simulator</span>
          <kbd className="text-[10px] bg-[#15161b] px-1.5 py-0.5 rounded text-neutral-400 border border-[#2e323b]">F2</kbd>
        </button>
        <button
          onClick={() => setIsTriggerRevealed(false)}
          className="h-9 w-7 rounded-lg bg-[#20222a] border border-[#2e323b] text-neutral-400 hover:text-white hover:bg-[#282b35] transition-colors shadow-lg flex items-center justify-center text-sm font-semibold cursor-pointer"
          title="Conceal button"
          aria-label="Conceal Simulator button"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <aside className="fixed bottom-0 inset-x-0 z-50 bg-[#181a20] border-t border-[#2e323b] shadow-2xl text-neutral-200 select-none py-3 px-3.5 sm:px-6 max-h-[75dvh] overflow-y-auto">
      <div className="max-w-7xl mx-auto flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-medium text-white">Kiosk Simulator</span>
            <span className="text-[11px] text-neutral-400 font-mono">[F2 or ~]</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowJson((prev) => !prev)}
              className="h-8 px-3 rounded-lg bg-[#20222a] hover:bg-[#282b35] border border-[#2e323b] text-xs font-medium text-neutral-300 hover:text-white flex items-center space-x-1.5 transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-neutral-400" />
              <span>{showJson ? 'Hide State' : 'Inspect State'}</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg bg-[#20222a] hover:bg-[#282b35] border border-[#2e323b] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close Simulator"
              aria-label="Close Simulator"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <DebugToolbarControls
          timeOverrideMinutes={timeOverrideMinutes}
          isFridayForced={isFridayForced}
          onSetTimeOverrideMinutes={onSetTimeOverrideMinutes}
          onToggleForceFriday={onToggleForceFriday}
          isEidForced={isEidForced}
          onToggleForceEid={onToggleForceEid}
          onTriggerDrawer={onTriggerDrawer}
          onNextPoster={onNextPoster}
          onPrevPoster={onPrevPoster}
          isSilenceTestActive={isSilenceTestActive}
          onToggleSilenceTest={onToggleSilenceTest}
        />

        {showJson && (
          <div className="p-3 bg-[#15161b] border border-[#2e323b] rounded-lg max-h-48 overflow-auto font-mono text-xs text-neutral-300">
            <pre>{JSON.stringify(displayState, null, 2)}</pre>
          </div>
        )}
      </div>
    </aside>
  );
}
