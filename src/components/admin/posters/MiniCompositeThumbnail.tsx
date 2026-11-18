'use client';

import React, { useMemo } from 'react';
import type { PosterLayoutConfig } from '@/types/index';
import {
  FRAME_STYLES_REGISTRY,
  getArchetypeGridStyle,
  getCanvasBackgroundProps,
  getSlotCellPlacement,
} from '@/lib/posters/layout-engine';
import { MiniCompositeSlotContent } from './MiniCompositeSlotContent';
import { MiniCompositeOverlaysLayer } from './MiniCompositeOverlaysLayer';

export interface MiniCompositeThumbnailProps {
  readonly layoutConfig: string | PosterLayoutConfig | null | undefined;
  readonly posterTitle?: string | undefined;
  readonly fallbackImagePath?: string | undefined;
  readonly className?: string | undefined;
}

export function MiniCompositeThumbnail({
  layoutConfig,
  posterTitle,
  fallbackImagePath,
  className = '',
}: MiniCompositeThumbnailProps) {
  const parsed = useMemo<PosterLayoutConfig | null>(() => {
    if (!layoutConfig) return null;
    if (typeof layoutConfig === 'object') return layoutConfig;
    try {
      return JSON.parse(layoutConfig) as PosterLayoutConfig;
    } catch {
      return null;
    }
  }, [layoutConfig]);

  if (!parsed || !parsed.slots || parsed.slots.length === 0) {
    if (fallbackImagePath) {
      return <img src={fallbackImagePath} alt={posterTitle || 'Poster thumbnail'} className={`w-full h-full object-cover ${className}`} />;
    }
    return <div className={`w-full h-full bg-slate-900 ${className}`} />;
  }

  const isFreeform = parsed.archetype === 'freeform';
  const gridStyle = isFreeform ? undefined : getArchetypeGridStyle(parsed.archetype, parsed.split_ratio, parsed.slots.length);
  const bgProps = getCanvasBackgroundProps(parsed.canvas_background, parsed.canvas_background_custom);

  return (
    <div className={`relative isolate w-full h-full aspect-video overflow-hidden select-none pointer-events-none ${bgProps.className} ${className}`} style={bgProps.style} aria-hidden="true">
      {isFreeform ? (
        <div className="relative w-full h-full overflow-hidden select-none">
          {parsed.slots.map((slot, idx) => {
            if (slot.is_hidden) return null;
            const frame = FRAME_STYLES_REGISTRY[slot.frame_style] ?? FRAME_STYLES_REGISTRY.none;
            return (
              <div
                key={slot.id || `thumb-slot-${idx}`}
                style={{
                  position: 'absolute',
                  left: `${slot.pos_x ?? 50}%`,
                  top: `${slot.pos_y ?? 50}%`,
                  width: `${slot.width_percent ?? 40}%`,
                  height: `${slot.height_percent ?? 40}%`,
                  transform: `translate(-50%, -50%) rotate(${slot.rotation ?? 0}deg) scale(${slot.flip_x ? -1 : 1}, ${slot.flip_y ? -1 : 1})`,
                  zIndex: slot.z_index ?? (idx + 10),
                }}
                className={`overflow-hidden flex flex-col ${frame.containerClasses}`}
              >
                <div className={`relative w-full h-full overflow-hidden ${frame.innerClasses} flex items-center justify-center bg-black`}>
                  {slot.frame_style === 'custom' && slot.custom_frame_url && (
                    <img src={slot.custom_frame_url} alt="" className="absolute inset-0 w-full h-full pointer-events-none z-20 object-fill select-none" />
                  )}
                  <MiniCompositeSlotContent slot={slot} />
                </div>
              </div>
            );
          })}
          <MiniCompositeOverlaysLayer layout={parsed} stickerDefaultZ={20} />
        </div>
      ) : (
        <div className="relative w-full h-full">
          <div className="w-full h-full grid p-0.5 gap-0.5" style={gridStyle}>
            {parsed.slots.map((slot, idx) => {
              if (slot.is_hidden) return null;
              const placement = getSlotCellPlacement(parsed.archetype, idx, parsed.slots.length);
              const frame = FRAME_STYLES_REGISTRY[slot.frame_style] ?? FRAME_STYLES_REGISTRY.none;
              return (
                <div key={slot.id || `thumb-slot-${idx}`} style={placement} className={`relative w-full h-full min-w-0 min-h-0 overflow-hidden flex flex-col ${frame.containerClasses}`}>
                  <div className={`relative w-full h-full overflow-hidden ${frame.innerClasses} flex items-center justify-center bg-black`}>
                    {slot.frame_style === 'custom' && slot.custom_frame_url && (
                      <img src={slot.custom_frame_url} alt="" className="absolute inset-0 w-full h-full pointer-events-none z-20 object-fill select-none" />
                    )}
                    <MiniCompositeSlotContent slot={slot} />
                  </div>
                </div>
              );
            })}
          </div>
          <MiniCompositeOverlaysLayer layout={parsed} stickerDefaultZ={25} />
        </div>
      )}
    </div>
  );
}
