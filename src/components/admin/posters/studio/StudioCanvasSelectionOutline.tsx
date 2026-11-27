'use client';

import React, { useMemo } from 'react';
import type { PosterLayoutArchetype } from '@/types/index';
import type { SelectedEntity, StudioSceneState } from '@/lib/posters/studio-types';
import { getStickerAspectRatio } from './StudioCanvasStickersAndCompounds';

interface StudioCanvasSelectionOutlineProps {
  readonly selectedLayerKeys: readonly string[];
  readonly selectedEntity: SelectedEntity | null;
  readonly scene: StudioSceneState;
  readonly archetype: PosterLayoutArchetype;
}

/** High-priority visual indicator projecting the active layer bounding box at z-55. */
export function StudioCanvasSelectionOutline({
  selectedLayerKeys,
  selectedEntity,
  scene,
  archetype,
}: StudioCanvasSelectionOutlineProps) {
  const topOutlineGeom = useMemo(() => {
    if (selectedLayerKeys.length > 1 || (selectedLayerKeys.length === 0 && !selectedEntity)) return null;
    const targetKey = selectedLayerKeys[0] || (selectedEntity ? `${selectedEntity.type}:${selectedEntity.id}` : null);
    if (!targetKey) return null;
    const [type, id] = targetKey.split(':');
    if (!type || !id) return null;

    if (type === 'sticker') {
      const stk = scene.stickers.find((s) => s.id === id);
      if (!stk || stk.is_hidden) return null;
      return {
        left: stk.pos_x,
        top: stk.pos_y,
        width: stk.width_percent,
        aspectRatio: getStickerAspectRatio(stk.type),
        rotation: stk.rotation ?? 0,
      };
    }
    if (type === 'compound') {
      const comp = scene.compoundLayers.find((c) => c.id === id);
      if (!comp || comp.is_hidden) return null;
      return {
        left: comp.pos_x,
        top: comp.pos_y,
        width: comp.width_percent,
        height: comp.height_percent,
        rotation: comp.rotation ?? 0,
      };
    }
    if (type === 'slot' && archetype === 'freeform') {
      const slot = scene.slots.find((s) => s.id === id);
      if (!slot) return null;
      return {
        left: slot.pos_x ?? 50,
        top: slot.pos_y ?? 50,
        width: slot.width_percent ?? 50,
        height: slot.height_percent ?? 50,
        rotation: slot.rotation ?? 0,
      };
    }
    return null;
  }, [selectedLayerKeys, selectedEntity, scene, archetype]);

  if (!topOutlineGeom) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${topOutlineGeom.left}%`,
        top: `${topOutlineGeom.top}%`,
        width: `${topOutlineGeom.width}%`,
        height: topOutlineGeom.height ? `${topOutlineGeom.height}%` : undefined,
        aspectRatio: topOutlineGeom.aspectRatio,
        transform: `translate(-50%, -50%) rotate(${topOutlineGeom.rotation}deg)`,
        zIndex: 55,
      }}
      className="pointer-events-none ring-2 ring-amber-400 ring-offset-0 rounded-lg shadow-2xl"
    />
  );
}

