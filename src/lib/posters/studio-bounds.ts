import type { PosterLayoutArchetype } from '@/types/index';
import type { StudioSceneState } from './studio-types';

export interface BoxBound {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export function makeCenteredBox(cx: number, cy: number, w: number, h: number): BoxBound {
  return { left: cx - w / 2, top: cy - h / 2, right: cx + w / 2, bottom: cy + h / 2 };
}

/** Computes aggregate bounding box across multi-selected canvas layers (% coordinates). */
export function computeSelectionGroupBounds(
  selectedKeys: readonly string[],
  archetype: PosterLayoutArchetype,
  scene: StudioSceneState,
): { left: number; top: number; width: number; height: number } | null {
  if (selectedKeys.length <= 1) return null;
  const bounds: BoxBound[] = [];

  if (archetype === 'freeform') {
    scene.slots.forEach((s) => {
      if (selectedKeys.includes(`slot:${s.id}`)) {
        bounds.push(makeCenteredBox(s.pos_x ?? 50, s.pos_y ?? 50, s.width_percent ?? 40, s.height_percent ?? 40));
      }
    });
  }
  scene.stickers.forEach((stk) => {
    if (selectedKeys.includes(`sticker:${stk.id}`)) {
      bounds.push(makeCenteredBox(stk.pos_x, stk.pos_y, stk.width_percent, stk.height_percent));
    }
  });
  scene.textOverlays.forEach((t) => {
    if (selectedKeys.includes(`text:${t.id}`)) {
      const w = t.width_mode === 'custom' && t.width_percent ? t.width_percent : 40;
      bounds.push(makeCenteredBox(t.pos_x ?? 50, t.pos_y ?? 50, w, 10));
    }
  });
  scene.compoundLayers.forEach((c) => {
    if (selectedKeys.includes(`compound:${c.id}`)) {
      bounds.push(makeCenteredBox(c.pos_x, c.pos_y, c.width_percent, c.height_percent));
    }
  });

  if (bounds.length < 2) return null;
  const minL = Math.min(...bounds.map((b) => b.left));
  const maxR = Math.max(...bounds.map((b) => b.right));
  const minT = Math.min(...bounds.map((b) => b.top));
  const maxB = Math.max(...bounds.map((b) => b.bottom));
  return {
    left: Math.max(0, minL),
    top: Math.max(0, minT),
    width: Math.max(4, maxR - minL),
    height: Math.max(4, maxB - minT),
  };
}

