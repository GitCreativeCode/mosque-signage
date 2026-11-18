'use client';

import React from 'react';
import type { ResizeHandle } from '@/lib/posters/studio-types';

interface StudioTransformHandlesProps {
  readonly accent?: 'amber' | 'cyan' | 'emerald' | undefined;
  readonly isAspectLocked: boolean;
  readonly onResizeStart: (e: React.PointerEvent, handle: ResizeHandle) => void;
}

const CORNERS: ReadonlyArray<{ readonly h: ResizeHandle; readonly pos: string }> = [
  { h: 'nw', pos: '-top-1.5 -left-1.5 cursor-nwse-resize' },
  { h: 'ne', pos: '-top-1.5 -right-1.5 cursor-nesw-resize' },
  { h: 'sw', pos: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
  { h: 'se', pos: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
];

const EDGES: ReadonlyArray<{ readonly h: ResizeHandle; readonly pos: string; readonly title: string }> = [
  { h: 'n', pos: '-top-1.5 left-1/2 -translate-x-1/2 w-5 h-2 cursor-ns-resize', title: 'Stretch Height (Top)' },
  { h: 's', pos: '-bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-2 cursor-ns-resize', title: 'Stretch Height (Bottom)' },
  { h: 'w', pos: 'top-1/2 -translate-y-1/2 -left-1.5 w-2 h-5 cursor-ew-resize', title: 'Stretch Width (Left)' },
  { h: 'e', pos: 'top-1/2 -translate-y-1/2 -right-1.5 w-2 h-5 cursor-ew-resize', title: 'Stretch Width (Right)' },
];

/** 8-point corner & edge pointer resize handles for selected canvas layers. */
export function StudioTransformHandles({
  accent = 'amber',
  isAspectLocked,
  onResizeStart,
}: StudioTransformHandlesProps) {
  const bgClass =
    accent === 'cyan'
      ? 'bg-cyan-400 border-black'
      : accent === 'emerald'
      ? 'bg-emerald-400 border-black'
      : 'bg-amber-400 border-black';
  const cornerTitle = isAspectLocked
    ? 'Proportional Scale (hold Shift for free transform)'
    : 'Free Scale (hold Shift for fixed ratio)';

  return (
    <>
      {CORNERS.map(({ h, pos }) => (
        <div
          key={h}
          onPointerDown={(e) => onResizeStart(e, h)}
          className={`absolute ${pos} w-3.5 h-3.5 rounded-full ${bgClass} border-2 shadow-md z-50 flex items-center justify-center hover:scale-125 transition-transform`}
          title={cornerTitle}
        />
      ))}
      {EDGES.map(({ h, pos, title }) => (
        <div
          key={h}
          onPointerDown={(e) => onResizeStart(e, h)}
          className={`absolute ${pos} rounded-sm ${bgClass} border shadow-md z-50 hover:scale-125 transition-transform`}
          title={title}
        />
      ))}
    </>
  );
}

