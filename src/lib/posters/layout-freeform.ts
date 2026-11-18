/**
 * Freeform Canvas Coordinate & Dimension Defaults
 * MosqueSignage (TV)
 */

import type { PosterSlotMedia } from '@/types/index';

function hasExplicitBounds(slot: PosterSlotMedia): boolean {
  return (
    slot.pos_x !== undefined &&
    slot.pos_y !== undefined &&
    slot.width_percent !== undefined &&
    slot.height_percent !== undefined
  );
}

function resolveFreeformRect(
  index: number,
  total: number
): { pos_x: number; pos_y: number; width_percent: number; height_percent: number } {
  if (total <= 1) return { pos_x: 50, pos_y: 50, width_percent: 65, height_percent: 80 };
  if (total === 2) {
    return { pos_x: index === 0 ? 32 : 68, pos_y: 50, width_percent: 44, height_percent: 78 };
  }
  if (total === 3) {
    if (index === 0) return { pos_x: 34, pos_y: 50, width_percent: 48, height_percent: 80 };
    return { pos_x: 74, pos_y: index === 1 ? 28 : 72, width_percent: 38, height_percent: 38 };
  }
  const col = index % 2;
  const row = Math.floor(index / 2);
  return {
    pos_x: col === 0 ? 30 : 70,
    pos_y: row === 0 ? 30 : 70,
    width_percent: 36,
    height_percent: 36,
  };
}

/**
 * Assigns ergonomic default coordinates and dimensions when switching slots to freeform canvas mode.
 */
export function assignFreeformDefaults(
  slot: PosterSlotMedia,
  index: number,
  total: number
): PosterSlotMedia {
  if (hasExplicitBounds(slot)) return slot;
  const defaults = resolveFreeformRect(index, total);
  return {
    ...slot,
    pos_x: slot.pos_x ?? defaults.pos_x,
    pos_y: slot.pos_y ?? defaults.pos_y,
    width_percent: slot.width_percent ?? defaults.width_percent,
    height_percent: slot.height_percent ?? defaults.height_percent,
    rotation: slot.rotation ?? 0,
    z_index: slot.z_index ?? index + 1,
  };
}

