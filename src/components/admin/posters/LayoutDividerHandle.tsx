'use client';

import React, { useRef, useCallback } from 'react';
import { clampSplitRatio } from '@/lib/posters/layout-engine';

export interface LayoutDividerHandleProps {
  readonly orientation: 'vertical' | 'horizontal';
  readonly positionPercent: number;
  readonly onMove: (newPercent: number) => void;
  readonly onReset?: () => void;
  readonly disabled?: boolean;
}

export function LayoutDividerHandle({
  orientation,
  positionPercent,
  onMove,
  onReset,
  disabled = false,
}: LayoutDividerHandleProps) {
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isVertical = orientation === 'vertical';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || disabled) return;

      const parentEl = (e.target as HTMLElement).parentElement;
      if (!parentEl) return;

      const rect = parentEl.getBoundingClientRect();
      let rawPercent: number;

      if (isVertical) {
        const offsetX = e.clientX - rect.left;
        rawPercent = (offsetX / rect.width) * 100;
      } else {
        const offsetY = e.clientY - rect.top;
        rawPercent = (offsetY / rect.height) * 100;
      }

      onMove(clampSplitRatio(rawPercent));
    },
    [isVertical, disabled, onMove]
  );

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      onMove(clampSplitRatio(positionPercent - 2));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      onMove(clampSplitRatio(positionPercent + 2));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onReset ? onReset() : onMove(50);
    }
  };

  return (
    <div
      ref={containerRef}
      role="separator"
      tabIndex={0}
      aria-orientation={orientation}
      aria-valuenow={positionPercent}
      aria-valuemin={20}
      aria-valuemax={80}
      aria-label={`${isVertical ? 'Horizontal' : 'Vertical'} layout split divider`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      onDoubleClick={onReset}
      className={`group absolute z-30 flex items-center justify-center transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
        isVertical
          ? 'top-0 bottom-0 w-3 -translate-x-1/2 cursor-col-resize hover:bg-emerald-500/30'
          : 'left-0 right-0 h-3 -translate-y-1/2 cursor-row-resize hover:bg-emerald-500/30'
      }`}
      style={
        isVertical
          ? { left: `${positionPercent}%` }
          : { top: `${positionPercent}%` }
      }
    >
      {/* Central Handle Pill Indicator */}
      <div
        className={`rounded-full bg-slate-700 border border-slate-500 shadow-md group-hover:bg-emerald-500 group-hover:border-emerald-300 transition-all ${
          isVertical ? 'w-1.5 h-12 group-hover:h-16' : 'h-1.5 w-12 group-hover:w-16'
        }`}
      />
    </div>
  );
}

