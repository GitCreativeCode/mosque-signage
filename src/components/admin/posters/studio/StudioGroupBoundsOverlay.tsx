'use client';

import React from 'react';
import type { ResizeHandle } from '@/lib/posters/studio-types';
import { FolderPlus, Layers, Lock, Trash2, Ungroup } from 'lucide-react';
import { StudioTransformHandles } from './StudioTransformHandles';

interface StudioGroupBoundsOverlayProps {
  readonly groupBounds: { left: number; top: number; width: number; height: number } | null;
  readonly selectedCount: number;
  readonly isAspectLocked: boolean;
  readonly onMultiDragStart: (e: React.PointerEvent) => void;
  readonly onStartMultiResizing: (e: React.PointerEvent, handle: ResizeHandle) => void;
  readonly onGroupIntoFolder: () => void;
  readonly onMergeIntoCompound: () => void;
  readonly onToggleLockSelected: () => void;
  readonly onDeleteSelected: () => void;
}

/** Multi-selection dashed bounding box with 8 transform handles and floating group toolbar. */
export function StudioGroupBoundsOverlay({
  groupBounds,
  selectedCount,
  isAspectLocked,
  onMultiDragStart,
  onStartMultiResizing,
  onGroupIntoFolder,
  onMergeIntoCompound,
  onToggleLockSelected,
  onDeleteSelected,
}: StudioGroupBoundsOverlayProps) {
  if (!groupBounds || selectedCount <= 1) return null;
  const isNearTop = groupBounds.top < 14;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: `${groupBounds.left}%`,
          top: `${groupBounds.top}%`,
          width: `${groupBounds.width}%`,
          height: `${groupBounds.height}%`,
          zIndex: 998,
          pointerEvents: 'auto',
        }}
        onPointerDown={onMultiDragStart}
        className="border-2 border-dashed border-amber-400 bg-amber-400/5 cursor-move"
      >
        <StudioTransformHandles accent="amber" isAspectLocked={isAspectLocked} onResizeStart={onStartMultiResizing} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: `${groupBounds.left + groupBounds.width / 2}%`,
          top: `${isNearTop ? groupBounds.top + groupBounds.height + 1.5 : groupBounds.top - 1.5}%`,
          transform: `translate(-50%, ${isNearTop ? '0%' : '-100%'})`,
          zIndex: 1000,
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/95 backdrop-blur-md border border-amber-400/60 shadow-2xl pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] font-bold text-amber-300 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          {selectedCount} Selected
        </span>
        <div className="w-[1px] h-3.5 bg-white/20 my-auto" />
        <button
          type="button"
          onClick={onGroupIntoFolder}
          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
          title="Group into Folder"
        >
          <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
          <span>Group</span>
        </button>
        <button
          type="button"
          onClick={onMergeIntoCompound}
          className="px-2 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/40 text-indigo-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
          title="Merge into Single Layer"
        >
          <Ungroup className="w-3.5 h-3.5 text-indigo-300" />
          <span>Merge</span>
        </button>
        <button
          type="button"
          onClick={onToggleLockSelected}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          title="Lock/Unlock Selected"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
        </button>
        <div className="w-[1px] h-3.5 bg-white/20 my-auto" />
        <button
          type="button"
          onClick={onDeleteSelected}
          className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 cursor-pointer"
          title="Delete Selected Layers"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}

