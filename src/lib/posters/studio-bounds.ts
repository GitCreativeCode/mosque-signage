import type { PosterLayoutArchetype } from '@/types/index';
import type { StudioSceneState } from './studio-types';
import { clampTextScale, resolveNumericFontSize } from './overlay-styles';

export interface BoxBound {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export type LayerAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export function makeCenteredBox(cx: number, cy: number, w: number, h: number): BoxBound {
  return { left: cx - w / 2, top: cy - h / 2, right: cx + w / 2, bottom: cy + h / 2 };
}

function getStickerRatio(type: string): number {
  if (type === 'fanous') return 64 / 140;
  if (type === 'mihrab_arch') return 84 / 112;
  if (type === 'bismillah') return 240 / 36;
  if (type === 'alhamdulillah') return 170 / 42;
  if (type === 'mashaallah') return 160 / 42;
  if (type === 'subhanallah') return 150 / 42;
  if (type === 'tasbih') return 64 / 96;
  if (type === 'badge_custom') return 220 / 48;
  return 1;
}

/** Computes aggregate bounding box across multi-selected canvas layers (% coordinates). */
export function computeSelectionGroupBounds(
  selectedKeys: readonly string[],
  archetype: PosterLayoutArchetype,
  scene: StudioSceneState,
  canvasEl?: HTMLElement | null,
): { left: number; top: number; width: number; height: number } | null {
  if (selectedKeys.length <= 1) return null;

  if (typeof window !== 'undefined' && canvasEl) {
    const cRect = canvasEl.getBoundingClientRect();
    if (cRect.width > 0 && cRect.height > 0) {
      const domBoxes: BoxBound[] = [];
      for (const key of selectedKeys) {
        const id = key.split(':')[1];
        if (!id) continue;
        const el = canvasEl.querySelector<HTMLElement>(`[data-layer-id="${id}"]`);
        if (el) {
          const r = el.getBoundingClientRect();
          domBoxes.push({
            left: ((r.left - cRect.left) / cRect.width) * 100,
            top: ((r.top - cRect.top) / cRect.height) * 100,
            right: ((r.right - cRect.left) / cRect.width) * 100,
            bottom: ((r.bottom - cRect.top) / cRect.height) * 100,
          });
        }
      }
      if (domBoxes.length >= 2) {
        const minL = Math.min(...domBoxes.map((b) => b.left));
        const maxR = Math.max(...domBoxes.map((b) => b.right));
        const minT = Math.min(...domBoxes.map((b) => b.top));
        const maxB = Math.max(...domBoxes.map((b) => b.bottom));
        return {
          left: Math.max(0, Math.round(minL * 10) / 10),
          top: Math.max(0, Math.round(minT * 10) / 10),
          width: Math.max(2, Math.round((maxR - minL) * 10) / 10),
          height: Math.max(2, Math.round((maxB - minT) * 10) / 10),
        };
      }
    }
  }

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
      const ratio = getStickerRatio(stk.type);
      const hPct = (stk.width_percent * (16 / 9)) / ratio;
      bounds.push(makeCenteredBox(stk.pos_x, stk.pos_y, stk.width_percent, hPct));
    }
  });
  scene.textOverlays.forEach((t) => {
    if (selectedKeys.includes(`text:${t.id}`)) {
      const lines = (t.text || '').split('\n');
      const lineCount = lines.length || 1;
      const longestLine = Math.max(...lines.map((l) => l.length), 5);
      const fontPx = resolveNumericFontSize(t.font_size);
      const sx = clampTextScale(t.scale_x);
      const sy = clampTextScale(t.scale_y);
      const charW = (fontPx * 0.62 / 1920) * 100;
      const lineH = (fontPx * 1.35 / 1080) * 100;
      const estW = (t.box_fit === 'hug_lines' ? Math.min(90, Math.max(6, longestLine * charW + 2)) : t.width_percent ?? Math.min(90, Math.max(8, longestLine * charW + 3))) * sx;
      const estH = Math.max(4, lineCount * lineH + 1.5) * sy;
      bounds.push(makeCenteredBox(t.pos_x ?? 50, t.pos_y ?? 50, estW, estH));
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

/** Batch aligns multiple selected layers to aggregate edges or center axes. */
export function alignSelectedLayersState(
  scene: StudioSceneState,
  selectedKeys: readonly string[],
  archetype: PosterLayoutArchetype,
  alignment: LayerAlignment,
): StudioSceneState {
  const group = computeSelectionGroupBounds(selectedKeys, archetype, scene);
  if (!group) return scene;

  const centerX = Math.round((group.left + group.width / 2) * 10) / 10;
  const centerY = Math.round((group.top + group.height / 2) * 10) / 10;
  const rightX = Math.round((group.left + group.width) * 10) / 10;
  const bottomY = Math.round((group.top + group.height) * 10) / 10;

  const patchX = (currW: number): number => {
    if (alignment === 'left') return Math.round((group.left + currW / 2) * 10) / 10;
    if (alignment === 'center') return centerX;
    if (alignment === 'right') return Math.round((rightX - currW / 2) * 10) / 10;
    return -1;
  };

  const patchY = (currH: number): number => {
    if (alignment === 'top') return Math.round((group.top + currH / 2) * 10) / 10;
    if (alignment === 'middle') return centerY;
    if (alignment === 'bottom') return Math.round((bottomY - currH / 2) * 10) / 10;
    return -1;
  };

  const isXAlign = alignment === 'left' || alignment === 'center' || alignment === 'right';

  return {
    ...scene,
    slots: scene.slots.map((s) => {
      if (!selectedKeys.includes(`slot:${s.id}`) || s.is_locked) return s;
      const w = s.width_percent ?? 40;
      const h = s.height_percent ?? 40;
      return {
        ...s,
        pos_x: isXAlign ? patchX(w) : s.pos_x,
        pos_y: !isXAlign ? patchY(h) : s.pos_y,
      };
    }),
    stickers: scene.stickers.map((s) => {
      if (!selectedKeys.includes(`sticker:${s.id}`) || s.is_locked) return s;
      return {
        ...s,
        pos_x: isXAlign ? patchX(s.width_percent) : s.pos_x,
        pos_y: !isXAlign ? patchY(s.height_percent) : s.pos_y,
      };
    }),
    textOverlays: scene.textOverlays.map((t) => {
      if (!selectedKeys.includes(`text:${t.id}`) || t.is_locked) return t;
      const w = t.width_mode === 'custom' && t.width_percent ? t.width_percent : 40;
      return {
        ...t,
        pos_x: isXAlign ? patchX(w) : t.pos_x,
        pos_y: !isXAlign ? patchY(10) : t.pos_y,
      };
    }),
    compoundLayers: scene.compoundLayers.map((c) => {
      if (!selectedKeys.includes(`compound:${c.id}`) || c.is_locked) return c;
      return {
        ...c,
        pos_x: isXAlign ? patchX(c.width_percent) : c.pos_x,
        pos_y: !isXAlign ? patchY(c.height_percent) : c.pos_y,
      };
    }),
  };
}
