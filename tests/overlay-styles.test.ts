import { describe, it, expect } from 'vitest';
import {
  getRgbaBg,
  resolveFontClass,
  resolveTextSizeClass,
  resolveOverlayBgClass,
  resolveTextClasses,
  BADGE_VARIANT_STYLES,
  RIBBON_BADGE_STYLES,
} from '@/lib/posters/overlay-styles';
import type { PosterTextOverlay } from '@/types/index';

describe('Overlay Styles & Tailwind Resolvers', () => {
  describe('getRgbaBg', () => {
    it('correctly converts 6-digit hex colors with custom opacity', () => {
      expect(getRgbaBg('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
      expect(getRgbaBg('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
      expect(getRgbaBg('#064e3b', 0.9)).toBe('rgba(6, 78, 59, 0.9)');
    });

    it('handles transparent and non-hex color values gracefully', () => {
      expect(getRgbaBg('transparent', 0.5)).toBe('transparent');
      expect(getRgbaBg('rgb(10, 20, 30)', 0.5)).toBe('rgb(10, 20, 30)');
    });
  });

  describe('resolveFontClass', () => {
    it('maps font variants to expected Tailwind utility classes', () => {
      expect(resolveFontClass('serif')).toBe('font-serif');
      expect(resolveFontClass('mono')).toBe('font-mono');
      expect(resolveFontClass('traditional')).toBe('font-serif tracking-wider');
      expect(resolveFontClass('sans')).toBe('font-sans');
      expect(resolveFontClass(undefined)).toBe('font-sans');
    });
  });

  describe('resolveTextSizeClass', () => {
    it('maps text sizes to proper responsive Tailwind typography scales', () => {
      expect(resolveTextSizeClass('sm')).toBe('text-sm');
      expect(resolveTextSizeClass('base')).toBe('text-base sm:text-lg');
      expect(resolveTextSizeClass('lg')).toBe('text-xl');
      expect(resolveTextSizeClass('xl')).toBe('text-2xl');
      expect(resolveTextSizeClass('2xl')).toBe('text-3xl');
      expect(resolveTextSizeClass('3xl')).toBe('text-4xl');
      expect(resolveTextSizeClass(undefined)).toBe('text-base sm:text-lg');
    });
  });

  describe('resolveOverlayBgClass', () => {
    const base: PosterTextOverlay = {
      id: 'ov-1',
      text: 'Bismillah',
      position: 'center',
      z_index: 10,
    };

    it('returns transparent config when style or color is transparent', () => {
      const res = resolveOverlayBgClass({ ...base, bg_style: 'transparent' });
      expect(res.isTransparent).toBe(true);
      expect(res.customBgColor).toBe('transparent');
      expect(res.bgClass).toContain('bg-transparent');
    });

    it('preserves custom background colors with backdrop filter border', () => {
      const res = resolveOverlayBgClass({ ...base, bg_color: '#15803d' });
      expect(res.isTransparent).toBe(false);
      expect(res.customBgColor).toBe('#15803d');
      expect(res.bgClass).toContain('border border-white/20');
    });

    it('resolves preset styles (glass, emerald, gold)', () => {
      expect(resolveOverlayBgClass({ ...base, bg_style: 'glass' }).bgClass).toContain('bg-slate-900/80');
      expect(resolveOverlayBgClass({ ...base, bg_style: 'emerald' }).bgClass).toContain('bg-emerald-950/90');
      expect(resolveOverlayBgClass({ ...base, bg_style: 'gold' }).bgClass).toContain('bg-black/90');
      expect(resolveOverlayBgClass(base).bgClass).toContain('bg-black/85');
    });
  });

  describe('resolveTextClasses', () => {
    const base: PosterTextOverlay = {
      id: 'ov-2',
      text: 'Alhamdulillah',
      position: 'top_banner',
      z_index: 20,
    };

    it('resolves combined classes for the studio editor canvas', () => {
      const res = resolveTextClasses({ ...base, font_family: 'traditional', font_size: 'xl', text_align: 'left' });
      expect(res.fontFamilyClass).toBe('font-serif tracking-wider');
      expect(res.fontSizeClass).toBe('text-lg sm:text-xl');
      expect(res.textAlignClass).toBe('text-left');
    });
  });

  describe('Badge Constants', () => {
    it('defines rich gradients and ribbon borders for all supported variants', () => {
      const variants = ['red', 'gold', 'emerald', 'blue', 'purple', 'amber'] as const;
      for (const v of variants) {
        expect(BADGE_VARIANT_STYLES[v]).toBeDefined();
        expect(RIBBON_BADGE_STYLES[v]).toBeDefined();
      }
    });
  });
});

