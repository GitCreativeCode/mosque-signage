'use client';

import React from 'react';
import type { ResizeHandle } from '@/lib/posters/studio-types';
import { StudioTransformHandles } from './StudioTransformHandles';

interface StudioGroupBoundsOverlayProps {
  readonly groupBounds: { left: number; top: number; width: number; height: number } | null;
  readonly selectedCount: number;
  readonly isAspectLocked: boolean;
  readonly onMultiDragStart: (e: React.PointerEvent) => void;
  readonly onStartMultiResizing: (e: React.PointerEvent, handle: ResizeHandle) => void;
  readonly onGroupIntoFolder?: (() => void) | undefined;
  readonly onMergeIntoCompound?: (() => void) | undefined;
  readonly onToggleLockSelected?: (() => void) | undefined;
  readonly onDeleteSelected?: (() => void) | undefined;
}

/** Multi-selection dashed bounding box with 8 transform handles without floating toolbar. */
export function StudioGroupBoundsOverlay({
  groupBounds,
  selectedCount,
  isAspectLocked,
  onMultiDragStart,
  onStartMultiResizing,
}: StudioGroupBoundsOverlayProps) {
  if (!groupBounds || selectedCount <= 1) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${groupBounds.left}%`,
        top: `${groupBounds.top}%`,
        width: `${groupBounds.width}%`,
        height: `${groupBounds.height}%`,
        zIndex: 55,
        pointerEvents: 'none',
      }}
      className="border-2 border-dashed border-amber-400 bg-amber-400/5 pointer-events-none"
    >
      <div className="pointer-events-auto">
        <StudioTransformHandles accent="amber" isAspectLocked={isAspectLocked} onResizeStart={onStartMultiResizing} />
      </div>
    </div>
  );
}
