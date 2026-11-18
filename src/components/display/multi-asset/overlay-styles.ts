/**
 * Pure Tailwind Class Lookup Helpers for Multi-Asset Text Overlays & Badges
 * MosqueSignage (TV)
 */

import type { BadgeVariant, PosterTextOverlay, TextOverlayFont } from '@/types/index';

export function resolveFontClass(font?: TextOverlayFont): string {
  if (font === 'serif') return 'font-serif';
  if (font === 'mono') return 'font-mono';
  if (font === 'traditional') return 'font-serif tracking-wider';
  return 'font-sans';
}

export function resolveTextSizeClass(size?: PosterTextOverlay['font_size']): string {
  const map: Record<NonNullable<PosterTextOverlay['font_size']>, string> = {
    sm: 'text-sm',
    base: 'text-base sm:text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-4xl',
  };
  return size ? map[size] ?? map.base : map.base;
}

export function resolveOverlayBgClass(overlay: PosterTextOverlay): {
  bgClass: string;
  isTransparent: boolean;
  customBgColor: string | undefined;
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

