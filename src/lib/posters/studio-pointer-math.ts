import type { MultiResizeSession, ResizeSession } from './studio-types';
import {
  TEXT_FONT_SIZE_DEFAULT,
  clampTextFontSize,
  clampTextScale,
} from './overlay-styles';

/** Calculates upright floating quick-actions pill coordinates anchored to rotated visual bounds. */
export function getUprightActionCoords(
  posX: number,
  posY: number,
  widthPct: number,
  heightPct: number,
  rotDeg: number = 0,
): { readonly leftPct: number; readonly topPct: number; readonly isNearTop: boolean } {
  const rad = (rotDeg * Math.PI) / 180;
  const visualHalfH = (widthPct * Math.abs(Math.sin(rad)) + heightPct * Math.abs(Math.cos(rad))) / 2;
  const visualTop = posY - visualHalfH;
  const isNearTop = visualTop < 14;
  return {
    leftPct: posX,
    topPct: isNearTop ? posY + visualHalfH + 1.5 : visualTop - 1.5,
    isNearTop,
  };
}

/** Computes updated multi-selection bounding box dimensions from pointer deltas (% canvas). */
export function computeMultiGroupResizeBox(
  session: MultiResizeSession,
  deltaX: number,
  deltaY: number,
): { readonly newLeft: number; readonly newTop: number; readonly newWidth: number; readonly newHeight: number } {
  const { handle, initialGroup } = session;
  let newLeft = initialGroup.left;
  let newTop = initialGroup.top;
  let newWidth = initialGroup.width;
  let newHeight = initialGroup.height;

  if (handle === 'e' || handle === 'se' || handle === 'ne') newWidth = Math.max(5, initialGroup.width + deltaX);
  if (handle === 'w' || handle === 'sw' || handle === 'nw') {
    newWidth = Math.max(5, initialGroup.width - deltaX);
    newLeft = initialGroup.left + (initialGroup.width - newWidth);
  }
  if (handle === 's' || handle === 'se' || handle === 'sw') newHeight = Math.max(5, initialGroup.height + deltaY);
  if (handle === 'n' || handle === 'ne' || handle === 'nw') {
    newHeight = Math.max(5, initialGroup.height - deltaY);
    newTop = initialGroup.top + (initialGroup.height - newHeight);
  }
  return { newLeft, newTop, newWidth, newHeight };
}

/** Computes resized center & percentage dimensions for 8-point element transform handles. */
export function computeSingleElementResize(
  session: ResizeSession,
  deltaX: number,
  deltaY: number,
  rectRatio: number,
  isProportional: boolean,
): { readonly pos_x: number; readonly pos_y: number; readonly width_percent: number; readonly height_percent: number } {
  const { handle, initialX, initialY, initialW, initialH, aspectRatio } = session;
  let newW = initialW;
  let newH = initialH;
  let newX = initialX;
  let newY = initialY;

  if (handle === 'e') {
    newW = Math.max(5, Math.min(100, initialW + deltaX));
    newX = initialX + (newW - initialW) / 2;
  } else if (handle === 'w') {
    newW = Math.max(5, Math.min(100, initialW - deltaX));
    newX = initialX - (newW - initialW) / 2;
  } else if (handle === 's') {
    newH = Math.max(5, Math.min(100, initialH + deltaY));
    newY = initialY + (newH - initialH) / 2;
  } else if (handle === 'n') {
    newH = Math.max(5, Math.min(100, initialH - deltaY));
    newY = initialY - (newH - initialH) / 2;
  } else if (isProportional) {
    const useX = Math.abs(deltaX) >= Math.abs(deltaY * rectRatio);
    const signX = handle === 'se' || handle === 'ne' ? 1 : -1;
    const signY = handle === 'se' || handle === 'sw' ? 1 : -1;
    const dominant = useX ? deltaX * signX : deltaY * signY * aspectRatio;
    newW = Math.max(5, Math.min(100, initialW + dominant));
    newH = Math.max(5, Math.min(100, newW / aspectRatio));
    newX = initialX + (signX * (newW - initialW)) / 2;
    newY = initialY + (signY * (newH - initialH)) / 2;
  } else {
    const signX = handle === 'se' || handle === 'ne' ? 1 : -1;
    const signY = handle === 'se' || handle === 'sw' ? 1 : -1;
    newW = Math.max(5, Math.min(100, initialW + deltaX * signX));
    newH = Math.max(5, Math.min(100, initialH + deltaY * signY));
    newX = initialX + (signX * (newW - initialW)) / 2;
    newY = initialY + (signY * (newH - initialH)) / 2;
  }

  return {
    pos_x: Math.max(0, Math.min(100, Math.round(newX))),
    pos_y: Math.max(0, Math.min(100, Math.round(newY))),
    width_percent: Math.max(5, Math.min(100, Math.round(newW))),
    height_percent: Math.max(5, Math.min(100, Math.round(newH))),
  };
}

/**
 * Computes Photoshop/Canva-style resize & stretch for text banners:
 * - Corner handles (nw/ne/sw/se) scale numeric font_size smoothly along the corner diagonal.
 * - Side edge handles (w/e, n/s) stretch scale_x or scale_y (0.25x-4.0x) without collapsing text.
 * - Holding Alt (scaleFromCenter) anchors the center instead of the opposite edge/corner.
 */
export function computeTextElementResize(
  session: ResizeSession,
  deltaX: number,
  deltaY: number,
  rectRatio: number,
  scaleFromCenter: boolean = false,
): {
  readonly pos_x: number;
  readonly pos_y: number;
  readonly font_size: number;
  readonly scale_x: number;
  readonly scale_y: number;
} {
  const { handle, initialX, initialY, initialW, initialH } = session;
  const initialFontSize = session.initialFontSize ?? TEXT_FONT_SIZE_DEFAULT;
  const initialScaleX = clampTextScale(session.initialScaleX);
  const initialScaleY = clampTextScale(session.initialScaleY);
  const safeRatio = Math.max(0.05, rectRatio);
  const rad = ((session.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const ux = deltaX;
  const uy = deltaY * safeRatio;
  const localDx = ux * cos + uy * sin;
  const localDy = (-ux * sin + uy * cos) / safeRatio;
  const mult = scaleFromCenter ? 2 : 1;

  let nextFontSize = initialFontSize;
  let nextScaleX = initialScaleX;
  let nextScaleY = initialScaleY;
  let localShiftX = 0;
  let localShiftY = 0;

  if (handle === 'e' || handle === 'w') {
    const signX = handle === 'e' ? 1 : -1;
    const targetW = Math.max(1.5, initialW + localDx * signX * mult);
    nextScaleX = clampTextScale(initialScaleX * (targetW / Math.max(0.5, initialW)));
    const actualW = initialW * (nextScaleX / initialScaleX);
    localShiftX = scaleFromCenter ? 0 : (signX * (actualW - initialW)) / 2;
  } else if (handle === 'n' || handle === 's') {
    const signY = handle === 's' ? 1 : -1;
    const targetH = Math.max(1.5, initialH + localDy * signY * mult);
    nextScaleY = clampTextScale(initialScaleY * (targetH / Math.max(0.5, initialH)));
    const actualH = initialH * (nextScaleY / initialScaleY);
    localShiftY = scaleFromCenter ? 0 : (signY * (actualH - initialH)) / 2;
  } else {
    const signX = handle === 'se' || handle === 'ne' ? 1 : -1;
    const signY = handle === 'se' || handle === 'sw' ? 1 : -1;
    const wInit = Math.max(0.5, initialW);
    const hInit = Math.max(0.5, initialH * safeRatio);
    const dx = localDx * mult;
    const dy = localDy * safeRatio * mult;
    const denom = wInit * wInit + hInit * hInit;
    const rawFactor = Math.max(0.1, 1 + (dx * signX * wInit + dy * signY * hInit) / denom);
    nextFontSize = clampTextFontSize(initialFontSize * rawFactor);
    const actualFactor = nextFontSize / Math.max(1, initialFontSize);
    const actualW = initialW * actualFactor;
    const actualH = initialH * actualFactor;
    localShiftX = scaleFromCenter ? 0 : (signX * (actualW - initialW)) / 2;
    localShiftY = scaleFromCenter ? 0 : (signY * (actualH - initialH)) / 2;
  }

  const shiftCanvasX = localShiftX * cos - localShiftY * safeRatio * sin;
  const shiftCanvasY = (localShiftX * sin + localShiftY * safeRatio * cos) / safeRatio;

  return {
    pos_x: Math.max(0, Math.min(100, Math.round((initialX + shiftCanvasX) * 10) / 10)),
    pos_y: Math.max(0, Math.min(100, Math.round((initialY + shiftCanvasY) * 10) / 10)),
    font_size: nextFontSize,
    scale_x: nextScaleX,
    scale_y: nextScaleY,
  };
}

export function mapRelBoxPatch(
  list: ReadonlyArray<{ id: string; relX: number; relY: number; relW: number; relH: number }>,
  box: { readonly newLeft: number; readonly newTop: number; readonly newWidth: number; readonly newHeight: number },
  id: string,
) {
  const init = list.find((it) => it.id === id);
  if (!init) return null;
  return {
    pos_x: Math.round(box.newLeft + init.relX * box.newWidth),
    pos_y: Math.round(box.newTop + init.relY * box.newHeight),
    width_percent: Math.max(2, Math.round(init.relW * box.newWidth)),
    height_percent: Math.max(2, Math.round(init.relH * box.newHeight)),
  };
}

export function mapDragDeltaPatch(
  list: ReadonlyArray<{ id: string; x: number; y: number }>,
  dx: number,
  dy: number,
  id: string,
) {
  const init = list.find((it) => it.id === id);
  if (!init) return null;
  return {
    pos_x: Math.max(0, Math.min(100, Math.round(init.x + dx))),
    pos_y: Math.max(0, Math.min(100, Math.round(init.y + dy))),
  };
}
