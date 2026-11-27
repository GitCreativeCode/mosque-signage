/**
 * Pure 1080p Base Viewport Scale & Overscan Compensator
 * MosqueSignage (TV)
 */

export const DISPLAY_BASE_WIDTH = 1920;
export const DISPLAY_BASE_HEIGHT = 1080;
export const SMALL_SCREEN_BREAKPOINT = 768;
export const COMPACT_ADMIN_BREAKPOINT = 1024;

/**
 * Returns true on phone-sized viewports (< 768px wide) or short landscape phone viewports
 * (< 500px tall and < 960px wide) where Multi-Asset Studio and 16:9 TV scale are unusable.
 */
export function isSmallScreenViewport(windowWidth: number, windowHeight: number): boolean {
  if (windowWidth <= 0 || windowHeight <= 0) return false;
  if (windowWidth < SMALL_SCREEN_BREAKPOINT) return true;
  return windowHeight < 500 && windowWidth < 960;
}

/**
 * Returns true below the `lg` (1024px) breakpoint where the desktop 3-zone topbar collapses
 * into the mobile/tablet hamburger drawer.
 */
export function isCompactAdminViewport(windowWidth: number): boolean {
  if (windowWidth <= 0) return false;
  return windowWidth < COMPACT_ADMIN_BREAKPOINT;
}

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

