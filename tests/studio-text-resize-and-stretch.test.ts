import { describe, it, expect } from 'vitest';
import {
  TEXT_FONT_SIZE_DEFAULT,
  TEXT_FONT_SIZE_MAX,
  TEXT_FONT_SIZE_MIN,
  TEXT_STRETCH_MAX,
  TEXT_STRETCH_MIN,
  clampTextFontSize,
  clampTextScale,
  resolveNumericFontSize,
  resolveTextClasses,
  resolveTextFontSizeCss,
} from '@/lib/posters/overlay-styles';
import { computeTextElementResize } from '@/lib/posters/studio-pointer-math';
import { computeSelectionGroupBounds } from '@/lib/posters/studio-bounds';
import { selectEditableContents } from '@/components/admin/posters/studio/StudioTextBannerItem';
import type { ResizeSession, StudioSceneState } from '@/lib/posters/studio-types';

describe('Numeric Font Size & Stretch Helpers', () => {
  it('clamps font size within 1080p broadcast bounds (14-240 px)', () => {
    expect(clampTextFontSize(4)).toBe(TEXT_FONT_SIZE_MIN);
    expect(clampTextFontSize(14)).toBe(14);
    expect(clampTextFontSize(63.6)).toBe(64);
    expect(clampTextFontSize(400)).toBe(TEXT_FONT_SIZE_MAX);
    expect(clampTextFontSize(Number.NaN)).toBe(TEXT_FONT_SIZE_DEFAULT);
  });

  it('resolves legacy size presets and numeric values to canonical pixels and cqw', () => {
    expect(resolveNumericFontSize(undefined)).toBe(40);
    expect(resolveNumericFontSize('sm')).toBe(24);
    expect(resolveNumericFontSize('base')).toBe(32);
    expect(resolveNumericFontSize('lg')).toBe(40);
    expect(resolveNumericFontSize('xl')).toBe(48);
    expect(resolveNumericFontSize('2xl')).toBe(60);
    expect(resolveNumericFontSize('3xl')).toBe(72);
    expect(resolveNumericFontSize(120)).toBe(120);
    expect(resolveNumericFontSize(999)).toBe(240);

    expect(resolveTextFontSizeCss(192)).toBe('10.0000cqw');
    expect(resolveTextFontSizeCss(40)).toBe('2.0833cqw');

    const resolved = resolveTextClasses({ id: 't1', text: 'Test', position: 'center', z_index: 10, font_size: 96, scale_x: 1.5, scale_y: 0.8 });
    expect(resolved.fontSizePx).toBe(96);
    expect(resolved.fontSizeCss).toBe('5.0000cqw');
    expect(resolved.scaleX).toBe(1.5);
    expect(resolved.scaleY).toBe(0.8);
  });

  it('clamps horizontal and vertical stretch multipliers within 0.25x-4.0x', () => {
    expect(clampTextScale(undefined)).toBe(1);
    expect(clampTextScale(Number.NaN)).toBe(1);
    expect(clampTextScale(0.05)).toBe(TEXT_STRETCH_MIN);
    expect(clampTextScale(1.756)).toBe(1.76);
    expect(clampTextScale(10)).toBe(TEXT_STRETCH_MAX);
  });
});

describe('Interactive Canvas Text Resize & Stretch Math', () => {
  const baseSession: ResizeSession = {
    type: 'text',
    id: 'txt-1',
    handle: 'se',
    mouseX: 0,
    mouseY: 0,
    initialX: 50,
    initialY: 50,
    initialW: 20,
    initialH: 10,
    aspectRatio: 2,
    initialFontSize: 40,
    initialScaleX: 1,
    initialScaleY: 1,
    rotation: 0,
  };

  it('scales font_size proportionally on corner drag while preserving stretch and pinning opposite corner', () => {
    const res = computeTextElementResize({ ...baseSession, handle: 'se', initialScaleX: 1.5, initialScaleY: 0.75 }, 10, 5, 9 / 16);
    expect(res.font_size).toBe(60);
    expect(res.scale_x).toBe(1.5);
    expect(res.scale_y).toBe(0.75);
    expect(res.pos_x).toBe(55);
    expect(res.pos_y).toBe(52.5);
  });

  it('caps font_size at max limit (240 px) on aggressive outward corner drag', () => {
    const res = computeTextElementResize({ ...baseSession, handle: 'se', initialFontSize: 160 }, 80, 40, 9 / 16);
    expect(res.font_size).toBe(240);
  });

  it('stretches scale_x on east/west edge drag without changing font_size or scale_y', () => {
    const east = computeTextElementResize({ ...baseSession, handle: 'e' }, 10, 0, 9 / 16);
    expect(east.scale_x).toBe(1.5);
    expect(east.scale_y).toBe(1);
    expect(east.font_size).toBe(40);
    expect(east.pos_x).toBe(55);
    expect(east.pos_y).toBe(50);

    const west = computeTextElementResize({ ...baseSession, handle: 'w' }, -10, 0, 9 / 16);
    expect(west.scale_x).toBe(1.5);
    expect(west.pos_x).toBe(45);
  });

  it('stretches scale_y on north/south edge drag without changing font_size or scale_x', () => {
    const south = computeTextElementResize({ ...baseSession, handle: 's' }, 0, 10, 9 / 16);
    expect(south.scale_y).toBe(2);
    expect(south.scale_x).toBe(1);
    expect(south.font_size).toBe(40);
    expect(south.pos_y).toBe(55);

    const north = computeTextElementResize({ ...baseSession, handle: 'n' }, 0, -5, 9 / 16);
    expect(north.scale_y).toBe(1.5);
    expect(north.pos_y).toBe(47.5);
  });

  it('projects drag deltas onto local rotated axes when text is rotated 90 degrees', () => {
    const res = computeTextElementResize({ ...baseSession, handle: 'e', rotation: 90 }, 0, 10, 9 / 16);
    expect(res.scale_x).toBeGreaterThan(1);
    expect(res.scale_y).toBe(1);
    expect(res.pos_y).toBeGreaterThan(50);
  });

  it('scales and stretches symmetrically from center when scaleFromCenter (Alt) is enabled', () => {
    const corner = computeTextElementResize({ ...baseSession, handle: 'se' }, 10, 5, 9 / 16, true);
    expect(corner.font_size).toBe(80);
    expect(corner.pos_x).toBe(50);
    expect(corner.pos_y).toBe(50);

    const edge = computeTextElementResize({ ...baseSession, handle: 'e' }, 5, 0, 9 / 16, true);
    expect(edge.scale_x).toBe(1.5);
    expect(edge.pos_x).toBe(50);
    expect(edge.pos_y).toBe(50);
  });
});

describe('Text Overlay Group Bounds Estimation', () => {
  it('incorporates numeric font_size and stretch scales into non-DOM bounds fallback', () => {
    const scene: StudioSceneState = {
      slots: [],
      stickers: [],
      compoundLayers: [],
      folders: [],
      rootOrder: ['text:t1', 'text:t2'],
      textOverlays: [
        { id: 't1', text: 'First Line\nSecond Line', position: 'center', z_index: 10, pos_x: 50, pos_y: 50, font_size: 80, scale_x: 2, scale_y: 1.5, box_fit: 'hug_lines' },
        { id: 't2', text: 'Anchor', position: 'center', z_index: 11, pos_x: 20, pos_y: 20, font_size: 24, scale_x: 1, scale_y: 1, box_fit: 'block' },
      ],
    };
    const bounds = computeSelectionGroupBounds(['text:t1', 'text:t2'], 'single', scene);
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThan(40);
    expect(bounds!.height).toBeGreaterThan(30);
  });

  it('safely handles selectEditableContents when DOM is absent or element is null', () => {
    expect(selectEditableContents(null)).toBe(false);
    expect(selectEditableContents(undefined)).toBe(false);
  });
});
