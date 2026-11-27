/**
 * Pure Styling & Tailwind Class Utilities for Text Overlays & Badges
 * MosqueSignage (TV)
 */

import type { BadgeVariant, PosterTextOverlay, TextOverlayFont, TextOverlaySize, TextOverlaySizePreset } from '@/types/index';

export const TEXT_FONT_SIZE_MIN = 14;
export const TEXT_FONT_SIZE_MAX = 240;
export const TEXT_FONT_SIZE_DEFAULT = 40;
export const TEXT_STRETCH_MIN = 0.25;
export const TEXT_STRETCH_MAX = 4.0;

export const LEGACY_FONT_SIZE_PX_MAP: Record<TextOverlaySizePreset, number> = {
  sm: 24,
  base: 32,
  lg: 40,
  xl: 48,
  '2xl': 60,
  '3xl': 72,
};

/** Clamps numeric text overlay font size within 1080p broadcast bounds (14-240 px). */
export function clampTextFontSize(value: number): number {
  if (!Number.isFinite(value)) return TEXT_FONT_SIZE_DEFAULT;
  return Math.max(TEXT_FONT_SIZE_MIN, Math.min(TEXT_FONT_SIZE_MAX, Math.round(value)));
}

/** Resolves legacy size presets or numeric font sizes to canonical 1080p broadcast pixels. */
export function resolveNumericFontSize(size?: TextOverlaySize): number {
  if (typeof size === 'number') return clampTextFontSize(size);
  if (size && size in LEGACY_FONT_SIZE_PX_MAP) {
    return LEGACY_FONT_SIZE_PX_MAP[size];
  }
  return TEXT_FONT_SIZE_DEFAULT;
}

/** Converts 1080p reference font size to container-query width units (100cqw == 1920px). */
export function resolveTextFontSizeCss(size?: TextOverlaySize): string {
  const px = resolveNumericFontSize(size);
  return `${(px / 19.2).toFixed(4)}cqw`;
}

/** Clamps horizontal/vertical text stretch multiplier within safe visual bounds (0.25x-4.0x). */
export function clampTextScale(scale?: number): number {
  if (scale === undefined || !Number.isFinite(scale)) return 1;
  const clamped = Math.max(TEXT_STRETCH_MIN, Math.min(TEXT_STRETCH_MAX, scale));
  return Math.round(clamped * 100) / 100;
}

/** Converts 6-digit hex or transparent strings to rgba() css values with opacity. */
export function getRgbaBg(color: string, opacity: number = 1.0): string {
  if (color === 'transparent') return 'transparent';
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

export function resolveFontClass(font?: TextOverlayFont): string {
  if (font === 'serif') return 'font-serif';
  if (font === 'mono') return 'font-mono';
  if (font === 'traditional') return 'font-serif tracking-wider';
  return 'font-sans';
}

export function resolveTextSizeClass(size?: PosterTextOverlay['font_size']): string {
  const map: Record<TextOverlaySizePreset, string> = {
    sm: 'text-sm',
    base: 'text-base sm:text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-4xl',
  };
  if (typeof size === 'string' && size in map) return map[size];
  return map.base;
}

export function resolveOverlayBgClass(overlay: PosterTextOverlay): {
  readonly bgClass: string;
  readonly isTransparent: boolean;
  readonly customBgColor: string | undefined;
} {
  const isTransparent = overlay.bg_color === 'transparent' || overlay.bg_style === 'transparent';
  const customBgColor = isTransparent ? 'transparent' : overlay.bg_color;

  if (isTransparent) return { bgClass: 'bg-transparent border-0 shadow-none', isTransparent, customBgColor };
  if (customBgColor) return { bgClass: 'border border-white/20 shadow-2xl backdrop-blur-md', isTransparent, customBgColor };

  const styleMap: Record<string, string> = {
    glass: 'bg-slate-900/80 backdrop-blur-md border border-white/20',
    emerald: 'bg-emerald-950/90 border border-emerald-400/50',
    gold: 'bg-black/90 border border-amber-400/60',
  };
  return {
    bgClass: (overlay.bg_style && styleMap[overlay.bg_style]) || 'bg-black/85 backdrop-blur-md border border-white/20',
    isTransparent,
    customBgColor,
  };
}

export function resolveTextClasses(ov: PosterTextOverlay) {
  const fontFamilyClass =
    ov.font_family === 'serif' ? 'font-serif'
    : ov.font_family === 'mono' ? 'font-mono'
    : ov.font_family === 'traditional' ? 'font-serif tracking-wider' : 'font-sans';
  const fontSizeClass =
    ov.font_size === 'sm' ? 'text-xs' : ov.font_size === 'lg' ? 'text-base sm:text-lg'
    : ov.font_size === 'xl' ? 'text-lg sm:text-xl' : ov.font_size === '2xl' ? 'text-xl sm:text-2xl'
    : ov.font_size === '3xl' ? 'text-2xl sm:text-3xl' : 'text-sm';
  const isTransparentBg = ov.bg_color === 'transparent' || ov.bg_style === 'transparent';
  const customBgColor = isTransparentBg ? 'transparent' : ov.bg_color;
  const bgClass = isTransparentBg ? 'bg-transparent border-0 shadow-none'
    : customBgColor ? 'border border-white/20 shadow-2xl backdrop-blur-md'
    : ov.bg_style === 'glass' ? 'bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-2xl'
    : ov.bg_style === 'emerald' ? 'bg-emerald-950/90 border border-emerald-400/50 shadow-2xl'
    : ov.bg_style === 'gold' ? 'bg-black/90 border border-amber-400/60 shadow-2xl'
    : 'bg-black/85 backdrop-blur-md border border-white/20 shadow-2xl';
  const fontSizePx = resolveNumericFontSize(ov.font_size);
  const fontSizeCss = resolveTextFontSizeCss(ov.font_size);
  const scaleX = clampTextScale(ov.scale_x);
  const scaleY = clampTextScale(ov.scale_y);
  const textAlignClass = ov.text_align === 'left' ? 'text-left' : ov.text_align === 'right' ? 'text-right' : 'text-center';
  return { fontFamilyClass, fontSizeClass, fontSizePx, fontSizeCss, scaleX, scaleY, isTransparentBg, customBgColor, bgClass, textAlignClass };
}

export const BADGE_VARIANT_STYLES: Record<BadgeVariant, string> = {
  red: 'bg-gradient-to-r from-rose-700 to-red-600 border-red-400 text-white shadow-[0_0_25px_rgba(225,29,72,0.6)]',
  gold: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-yellow-200 text-slate-950 font-black shadow-[0_0_25px_rgba(234,179,8,0.7)]',
  emerald: 'bg-gradient-to-r from-emerald-800 to-green-600 border-emerald-400 text-white shadow-[0_0_25px_rgba(16,185,129,0.6)]',
  blue: 'bg-gradient-to-r from-blue-700 to-cyan-600 border-blue-400 text-white shadow-[0_0_25px_rgba(59,130,246,0.6)]',
  purple: 'bg-gradient-to-r from-purple-800 to-indigo-600 border-purple-400 text-white shadow-[0_0_25px_rgba(168,85,247,0.6)]',
  amber: 'bg-gradient-to-r from-amber-700 to-orange-600 border-amber-400 text-white shadow-[0_0_25px_rgba(245,158,11,0.6)]',
};

export const RIBBON_BADGE_STYLES: Record<BadgeVariant, string> = {
  red: 'bg-rose-600 text-white border border-rose-400',
  gold: 'bg-amber-400 text-slate-950 font-black border border-yellow-200',
  blue: 'bg-sky-600 text-white border border-sky-300',
  purple: 'bg-purple-600 text-white border border-purple-300',
  amber: 'bg-orange-600 text-white border border-orange-300',
  emerald: 'bg-emerald-600 text-white border border-emerald-300',
};

