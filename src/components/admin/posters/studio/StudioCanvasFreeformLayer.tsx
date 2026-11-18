'use client';

import React from 'react';
import type { PosterSlotMedia } from '@/types/index';
import type { ResizeHandle, ResizeSession, SelectedEntity } from '@/lib/posters/studio-types';
import { Lock } from 'lucide-react';
import { StudioTransformHandles } from './StudioTransformHandles';
import { StudioSlotMediaContent } from './StudioSlotMediaContent';

interface StudioCanvasFreeformLayerProps {
  readonly slots: readonly PosterSlotMedia[];
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedLayerKeys: readonly string[];
  readonly draggingFreeformSlotId: string | null;
  readonly isSnappedCenterX: boolean;
  readonly isSnappedCenterY: boolean;
  readonly isAspectLocked: boolean;
  readonly isItemLocked: (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) => boolean;
  readonly onSlotPointerDown: (e: React.PointerEvent, slotId: string, idx: number) => void;
  readonly onStartResizing: (
    e: React.PointerEvent,
    type: ResizeSession['type'],
    id: string,
    handle: ResizeHandle,
    initialProps: { pos_x: number; pos_y: number; width_percent: number; height_percent: number },
  ) => void;
}

/** Renders freeform media/notice cards with smart snapping guides and 8-point transform handles. */
export function StudioCanvasFreeformLayer({
  slots,
  selectedEntity,
  selectedLayerKeys,
  draggingFreeformSlotId,
  isSnappedCenterX,
  isSnappedCenterY,
  isAspectLocked,
  isItemLocked,
  onSlotPointerDown,
  onStartResizing,
}: StudioCanvasFreeformLayerProps) {
  return (
    <>
      {isSnappedCenterX && (
        <div className="absolute inset-y-0 left-1/2 w-[2px] bg-amber-400 z-40 pointer-events-none shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />
      )}
      {isSnappedCenterY && (
        <div className="absolute inset-x-0 top-1/2 h-[2px] bg-amber-400 z-40 pointer-events-none shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />
      )}

      {slots.map((s, idx) => {
        if (s.is_hidden) return null;
        const isSelected = (selectedEntity?.type === 'slot' && selectedEntity.id === s.id) || selectedLayerKeys.includes(`slot:${s.id}`);
        const locked = isItemLocked(s);
        const posX = s.pos_x ?? 50;
        const posY = s.pos_y ?? 50;
        const widthPct = s.width_percent ?? 40;
        const heightPct = s.height_percent ?? 40;

        return (
          <div
            key={s.id}
            onPointerDown={(e) => onSlotPointerDown(e, s.id, idx)}
            style={{
              position: 'absolute', left: `${posX}%`, top: `${posY}%`,
              width: `${widthPct}%`, height: `${heightPct}%`,
              transform: `translate(-50%, -50%) rotate(${s.rotation ?? 0}deg)`,
              zIndex: draggingFreeformSlotId === s.id ? 999 : s.z_index ?? idx + 1,
            }}
            className={`group select-none transition-shadow ${locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${
              isSelected ? 'ring-2 ring-amber-400 shadow-2xl' : 'hover:ring-1 hover:ring-white/40'
            }`}
          >
            {isSelected && !locked && selectedLayerKeys.length === 1 && (
              <StudioTransformHandles
                accent="amber"
                isAspectLocked={isAspectLocked}
                onResizeStart={(e, handle) =>
                  onStartResizing(e, 'slot', s.id, handle, { pos_x: posX, pos_y: posY, width_percent: widthPct, height_percent: heightPct })
                }
              />
            )}

            <div className="w-full h-full relative" style={{ transform: `scale(${s.flip_x ? -1 : 1}, ${s.flip_y ? -1 : 1})` }}>
              <StudioSlotMediaContent slot={s} />
            </div>

            <div className="absolute top-2 left-2 flex items-center gap-1 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 shadow-md">
                <span>{s.label || `Layer ${idx + 1}`}</span>
                {locked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

