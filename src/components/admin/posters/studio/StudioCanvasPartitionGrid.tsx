'use client';

import React from 'react';
import type { PosterLayoutArchetype, PosterSlotMedia, SlotFitMode } from '@/types/index';
import type { SelectedEntity } from '@/lib/posters/studio-types';
import { getSlotCellPlacement } from '@/lib/posters/layout-engine';
import { GripVertical, Trash2 } from 'lucide-react';
import { StudioSlotMediaContent } from './StudioSlotMediaContent';

interface StudioCanvasPartitionGridProps {
  readonly slots: readonly PosterSlotMedia[];
  readonly archetype: PosterLayoutArchetype;
  readonly gridStyle: React.CSSProperties;
  readonly gapClass: string;
  readonly selectedSlotIndex: number | null;
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedLayerKeys: readonly string[];
  readonly draggedCanvasSlotIndex: number | null;
  readonly canvasDropTargetIndex: number | null;
  readonly setDraggedCanvasSlotIndex: (idx: number | null) => void;
  readonly setCanvasDropTargetIndex: (idx: number | null) => void;
  readonly onReorderSlot: (from: number, to: number) => void;
  readonly onSelectSlot: (idx: number) => void;
  readonly onToggleLayerSelection: (key: string) => void;
  readonly onCommitSlots: (nextSlots: PosterSlotMedia[]) => void;
  readonly onRequestReplaceSlot: (idx: number) => void;
}

/** Structured multi-partition grid cells with drag-to-swap and inline fit/replace/remove buttons. */
export function StudioCanvasPartitionGrid({
  slots,
  archetype,
  gridStyle,
  gapClass,
  selectedSlotIndex,
  selectedEntity,
  selectedLayerKeys,
  draggedCanvasSlotIndex,
  canvasDropTargetIndex,
  setDraggedCanvasSlotIndex,
  setCanvasDropTargetIndex,
  onReorderSlot,
  onSelectSlot,
  onToggleLayerSelection,
  onCommitSlots,
  onRequestReplaceSlot,
}: StudioCanvasPartitionGridProps) {
  return (
    <div className={`relative w-full h-full grid ${gapClass}`} style={gridStyle}>
      {slots.map((s, idx) => {
        const isSelected =
          (selectedSlotIndex === idx && selectedEntity?.type === 'slot') ||
          selectedLayerKeys.includes(`slot:${s.id}`);
        const isDragged = draggedCanvasSlotIndex === idx;
        const isDropTarget = canvasDropTargetIndex === idx && !isDragged;
        const nextFit: SlotFitMode = s.fit_mode === 'contain' ? 'contain_blur' : s.fit_mode === 'contain_blur' ? 'cover' : 'contain';

        return (
          <div
            key={s.id}
            draggable={slots.length > 1}
            onDragStart={(e) => {
              if (slots.length <= 1) return;
              if ((e.target as HTMLElement).closest('button, input, textarea')) { e.preventDefault(); return; }
              setDraggedCanvasSlotIndex(idx);
              e.dataTransfer.setData('text/x-slot-index', String(idx));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              if (slots.length <= 1) return;
              e.preventDefault(); e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
              if (canvasDropTargetIndex !== idx) setCanvasDropTargetIndex(idx);
            }}
            onDragLeave={(e) => {
              if (e.relatedTarget && (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
              if (canvasDropTargetIndex === idx) setCanvasDropTargetIndex(null);
            }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation();
              const raw = e.dataTransfer.getData('text/x-slot-index');
              const fromIdx = raw !== '' ? parseInt(raw, 10) : draggedCanvasSlotIndex;
              if (fromIdx !== null && !isNaN(fromIdx) && fromIdx !== idx) onReorderSlot(fromIdx, idx);
              setDraggedCanvasSlotIndex(null);
              setCanvasDropTargetIndex(null);
            }}
            onDragEnd={() => { setDraggedCanvasSlotIndex(null); setCanvasDropTargetIndex(null); }}
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey) onToggleLayerSelection(`slot:${s.id}`);
              else onSelectSlot(idx);
            }}
            style={getSlotCellPlacement(archetype, idx, slots.length)}
            className={`relative w-full h-full min-w-0 min-h-0 select-none transition-all ${slots.length > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${
              isDragged ? 'opacity-35 scale-[0.98] ring-2 ring-dashed ring-amber-400 z-20'
              : isDropTarget ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-black z-30 scale-[1.01] shadow-2xl'
              : isSelected ? 'ring-2 ring-white/90 z-10 shadow-lg'
              : 'hover:opacity-90'
            }`}
          >
            {isDropTarget && (
              <div className="absolute inset-0 z-30 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <div className="px-3 py-1.5 rounded-xl bg-black/90 border border-amber-400 text-amber-300 text-xs font-bold shadow-xl flex items-center gap-1.5 animate-pulse">
                  <GripVertical className="w-3.5 h-3.5" />
                  <span>Drop to move here</span>
                </div>
              </div>
            )}

            <StudioSlotMediaContent slot={s} />

            <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 shadow-md" title={slots.length > 1 ? 'Drag on canvas to switch position' : undefined}>
                {slots.length > 1 && <GripVertical className="w-2.5 h-2.5 opacity-70" />}
                <span>{s.label || `Layer ${idx + 1}`}</span>
              </span>

              {isSelected && (
                <div className="flex items-center gap-1 pointer-events-auto">
                  {s.type !== 'notice' && s.type !== 'badge' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = [...slots];
                        next[idx] = { ...s, fit_mode: nextFit };
                        onCommitSlots(next);
                      }}
                      className="px-2 py-0.5 rounded-md bg-black/85 hover:bg-black text-[10px] font-semibold text-white border border-white/25 transition cursor-pointer"
                      title={`Fit Mode: ${s.fit_mode}. Click to cycle.`}
                    >
                      {s.fit_mode === 'contain' ? 'Fit: Clean' : s.fit_mode === 'contain_blur' ? 'Fit: Blur' : 'Fit: Fill'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRequestReplaceSlot(idx); }}
                    className="px-2 py-0.5 rounded-md bg-black/85 hover:bg-black text-[10px] font-semibold text-white border border-white/25 transition cursor-pointer"
                    title="Replace media file in this slot"
                  >
                    Replace
                  </button>
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCommitSlots(slots.filter((_, i) => i !== idx));
                        onSelectSlot(Math.max(0, idx - 1));
                      }}
                      className="p-1 rounded-md bg-black/85 hover:bg-rose-950 text-rose-400 border border-white/25 transition cursor-pointer"
                      title="Remove slot"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

