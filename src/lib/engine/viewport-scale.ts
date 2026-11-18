/**
 * Pure 1080p Base Viewport Scale & Overscan Compensator
 * MosqueSignage (TV)
 */

export const DISPLAY_BASE_WIDTH = 1920;
export const DISPLAY_BASE_HEIGHT = 1080;

/**
 * Computes uniform aspect-fit scale factor for a 1920x1080 base canvas with overscan safe-zone margin.
 */
export function calculateViewportScale(
  windowWidth: number,
  windowHeight: number,
  overscanMarginPercent: number = 0
): number {
  const scaleX = windowWidth / DISPLAY_BASE_WIDTH;
  const scaleY = windowHeight / DISPLAY_BASE_HEIGHT;
  const fitScale = Math.min(scaleX, scaleY);

  const clampedMargin = Math.max(0, Math.min(10, overscanMarginPercent));
  const marginFactor = clampedMargin / 100;
  const effectiveScale = fitScale * (1 - marginFactor);

  return effectiveScale > 0 ? effectiveScale : 1;
}

