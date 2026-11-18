'use client';

import React from 'react';
import type { Poster, PosterFitMode, PosterLayoutConfig } from '@/types/index';
import {
  getArchetypeGridStyle,
  getCanvasBackgroundProps,
  getLayoutGapClass,
  getSlotCellPlacement,
} from '@/lib/posters/layout-engine';
import { SlotPresenter } from './multi-asset/SlotPresenter';
import { CanvasOverlayLayers } from './multi-asset/CanvasOverlayLayers';

export interface MultiAssetStageCanvasProps {
  readonly poster: Poster;
  readonly layout: PosterLayoutConfig;
  readonly isDrawerOpen?: boolean | undefined;
  readonly fitMode?: PosterFitMode | undefined;
  readonly mosqueName?: string | undefined;
  readonly slideIndex?: number | undefined;
}

export function MultiAssetStageCanvas({
  poster,
  layout,
  isDrawerOpen = false,
  slideIndex,
}: MultiAssetStageCanvasProps) {
  const gridStyle = getArchetypeGridStyle(layout.archetype, layout.split_ratio, layout.slots.length);
  const globalMute = layout.slots.filter((s) => s.type === 'video').length > 1;
  const gapClass = getLayoutGapClass(layout.grid_gap);
  const bgProps = getCanvasBackgroundProps(layout.canvas_background, layout.canvas_background_custom);
  const allowAudio = Boolean(poster.allow_audio);

  if (layout.archetype === 'freeform') {
    return (
      <div className={`relative w-full h-[calc(100%-4px)] overflow-hidden select-none ${bgProps.className}`} style={bgProps.style}>
        <div className="relative w-full h-full overflow-hidden select-none">
          {layout.slots.map((slot) => {
            if (slot.is_hidden) return null;
            return (
              <div
                key={slot.id}
                style={{
                  position: 'absolute',
                  top: `${slot.pos_y ?? 50}%`,
                  left: `${slot.pos_x ?? 50}%`,
                  width: `${slot.width_percent ?? 50}%`,
                  height: `${slot.height_percent ?? 50}%`,
                  transform: `translate(-50%, -50%) rotate(${slot.rotation ?? 0}deg) scale(${slot.flip_x ? -1 : 1}, ${slot.flip_y ? -1 : 1})`,
                  zIndex: slot.z_index ?? 10,
                }}
                className="overflow-hidden shadow-2xl transition-transform"
              >
                <SlotPresenter slot={slot} isDrawerOpen={isDrawerOpen} globalMute={globalMute} posterAllowAudio={allowAudio} slideIndex={slideIndex} />
              </div>
            );
          })}
          <CanvasOverlayLayers
            layout={layout}
            isDrawerOpen={isDrawerOpen}
            globalMute={globalMute}
            posterAllowAudio={allowAudio}
            defaultStickerZ={20}
            defaultTextZ={20}
            slideIndex={slideIndex}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[calc(100%-4px)] overflow-hidden select-none ${bgProps.className}`} style={bgProps.style}>
      <div className="relative w-full h-full">
        <div className={`w-full h-full grid ${gapClass}`} style={gridStyle}>
          {layout.slots.map((slot, idx) => {
            if (slot.is_hidden) return null;
            return (
              <div
                key={slot.id}
                className="w-full h-full min-w-0 min-h-0 overflow-hidden"
                style={getSlotCellPlacement(layout.archetype, idx, layout.slots.length)}
              >
                <SlotPresenter slot={slot} isDrawerOpen={isDrawerOpen} globalMute={globalMute} posterAllowAudio={allowAudio} slideIndex={slideIndex} />
              </div>
            );
          })}
        </div>
        <CanvasOverlayLayers
          layout={layout}
          isDrawerOpen={isDrawerOpen}
          globalMute={globalMute}
          posterAllowAudio={allowAudio}
          defaultStickerZ={25}
          defaultTextZ={30}
          slideIndex={slideIndex}
        />
      </div>
    </div>
  );
}
