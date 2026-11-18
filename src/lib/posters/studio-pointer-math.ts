import type { MultiResizeSession, ResizeSession } from './studio-types';

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
