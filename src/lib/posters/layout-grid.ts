/**
 * Pure Grid Archetype & Split Ratio Layout Math
 * MosqueSignage (TV)
 */

import type {
  LayoutGridGap,
  PosterLayoutArchetype,
  PosterLayoutConfig,
  PosterSlotMedia,
} from '@/types/index';

export const MIN_SPLIT_RATIO = 20;
export const MAX_SPLIT_RATIO = 80;
export const DEFAULT_SPLIT_RATIO = 50;

const GAP_CLASSES: Record<LayoutGridGap, string> = {
  none: 'gap-0 p-0',
  subtle: 'gap-1 p-1',
  normal: 'gap-2 p-2',
  spacious: 'gap-4 p-4',
};

export function getLayoutGapClass(gap?: LayoutGridGap): string {
  return gap ? GAP_CLASSES[gap] ?? GAP_CLASSES.none : GAP_CLASSES.none;
}

export function clampSplitRatio(
  ratio: number,
  min: number = MIN_SPLIT_RATIO,
  max: number = MAX_SPLIT_RATIO
): number {
  if (Number.isNaN(ratio) || !Number.isFinite(ratio)) {
    return DEFAULT_SPLIT_RATIO;
  }
  return Math.min(Math.max(Math.round(ratio), min), max);
}

export function getDefaultArchetypeForCount(assetCount: number): PosterLayoutArchetype {
  if (assetCount <= 1) return 'single';
  if (assetCount === 2) return 'split_vertical';
  if (assetCount === 3) return 'hero_left_2_right';
  if (assetCount === 4) return 'grid_4';
  return 'masonry_flow';
}

export function createDefaultLayoutConfig(
  slots: readonly PosterSlotMedia[],
  archetype?: PosterLayoutArchetype,
  splitRatio: number = DEFAULT_SPLIT_RATIO
): PosterLayoutConfig {
  const resolvedArchetype = archetype ?? getDefaultArchetypeForCount(slots.length);
  return {
    version: 1,
    archetype: resolvedArchetype,
    split_ratio: clampSplitRatio(splitRatio),
    slots,
    grid_gap: 'none',
    text_overlays: [],
    canvas_background: 'black',
  };
}

function getSplitAxisGrid(count: number, clamped: number, vertical: boolean): { gridTemplateColumns: string; gridTemplateRows: string } {
  const remaining = 100 - clamped;
  if (count <= 1) return { gridTemplateColumns: '100%', gridTemplateRows: '100%' };
  if (count === 2) {
    const splitTrack = `minmax(0, ${clamped}fr) minmax(0, ${remaining}fr)`;
    return vertical
      ? { gridTemplateColumns: splitTrack, gridTemplateRows: '100%' }
      : { gridTemplateColumns: '100%', gridTemplateRows: splitTrack };
  }
  const evenTrack = `repeat(${count}, minmax(0, 1fr))`;
  return vertical
    ? { gridTemplateColumns: evenTrack, gridTemplateRows: '100%' }
    : { gridTemplateColumns: '100%', gridTemplateRows: evenTrack };
}

function getHeroGridStyle(count: number, clamped: number, heroLeft: boolean): { gridTemplateColumns: string; gridTemplateRows: string } {
  const remaining = 100 - clamped;
  if (count <= 1) return { gridTemplateColumns: '100%', gridTemplateRows: '100%' };
  const splitTrack = `minmax(0, ${clamped}fr) minmax(0, ${remaining}fr)`;
  if (count === 2) {
    return heroLeft
      ? { gridTemplateColumns: splitTrack, gridTemplateRows: '100%' }
      : { gridTemplateColumns: '100%', gridTemplateRows: splitTrack };
  }
  const subTracks = Array(count - 1).fill('minmax(0, 1fr)').join(' ');
  return heroLeft
    ? { gridTemplateColumns: splitTrack, gridTemplateRows: subTracks }
    : { gridTemplateColumns: subTracks, gridTemplateRows: splitTrack };
}

function getGrid4Style(count: number): { gridTemplateColumns: string; gridTemplateRows: string } {
  if (count <= 2) return { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: '100%' };
  if (count <= 4) return { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' };
  const cols = count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  return { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` };
}

/**
 * Returns CSS grid template styles based on layout archetype, split ratio, and total slot count.
 */
export function getArchetypeGridStyle(
  archetype: PosterLayoutArchetype,
  splitRatio: number,
  slotCount: number = 2
): { gridTemplateColumns: string; gridTemplateRows: string } {
  const count = Math.max(1, slotCount);
  const clamped = clampSplitRatio(splitRatio);

  if (archetype === 'freeform' || archetype === 'single') {
    return { gridTemplateColumns: '100%', gridTemplateRows: '100%' };
  }
  if (archetype === 'split_vertical') return getSplitAxisGrid(count, clamped, true);
  if (archetype === 'split_horizontal') return getSplitAxisGrid(count, clamped, false);
  if (archetype === 'hero_left_2_right') return getHeroGridStyle(count, clamped, true);
  if (archetype === 'hero_top_2_bottom') return getHeroGridStyle(count, clamped, false);
  if (archetype === 'grid_4') return getGrid4Style(count);
  return getGrid4Style(count);
}

/**
 * Returns explicit grid placement styles for each slot inside a layout archetype.
 */
export function getSlotCellPlacement(
  archetype: PosterLayoutArchetype,
  index: number,
  totalSlots: number
): { gridColumn?: string; gridRow?: string } {
  const count = Math.max(1, totalSlots);
  if (count <= 1) return { gridColumn: '1', gridRow: '1' };

  if (archetype === 'hero_left_2_right') {
    if (index === 0) return { gridColumn: '1', gridRow: `1 / span ${Math.max(1, count - 1)}` };
    return { gridColumn: '2', gridRow: `${index}` };
  }
  if (archetype === 'hero_top_2_bottom') {
    if (index === 0) return { gridColumn: `1 / span ${Math.max(1, count - 1)}`, gridRow: '1' };
    return { gridColumn: `${index}`, gridRow: '2' };
  }
  if (archetype === 'grid_4' && count === 3 && index === 0) {
    return { gridColumn: '1 / span 2', gridRow: '1' };
  }
  return {};
}

