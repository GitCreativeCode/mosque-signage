import { describe, it, expect } from 'vitest';
import type { PosterWithStatus, PosterLayoutConfig } from '@/types/index';
import { getPosterTypeInfo } from '@/lib/posters/poster-type-info';
import { getUprightActionCoords } from '@/lib/posters/studio-pointer-math';
import { buildStudioLayerItems, getVisibleOrderedLayerKeys } from '@/lib/posters/studio-layer-items';
import {
  clampSplitRatio,
  getDefaultArchetypeForCount,
  createDefaultLayoutConfig,
  validateLayoutConfig,
  getArchetypeGridStyle,
  FRAME_STYLES_REGISTRY,
} from '@/lib/posters/layout-engine';

describe('Multi-Asset Poster System & Studio Invariants', () => {
  it('correctly categorizes multi-asset posters in getPosterTypeInfo', () => {
    const compositePoster: PosterWithStatus = {
      id: 'multi-poster-1',
      title: 'Weekend Program & Gala',
      image_path: '/uploads/flyer1.webp',
      media_type: 'composite',
      layout_config: JSON.stringify({
        version: 1,
        archetype: 'split_vertical',
        split_ratio: 60,
        slots: [
          {
            id: 'slot-1',
            type: 'image',
            asset_path: '/uploads/flyer1.webp',
            fit_mode: 'contain',
            frame_style: 'islamic_matting',
          },
          {
            id: 'slot-2',
            type: 'video',
            asset_path: '/uploads/teaser.mp4',
            fit_mode: 'cover',
            frame_style: 'clean_border',
          },
        ],
        text_overlays: [],
      }),
      start_at: '2026-11-01T00:00:00.000Z',
      end_at: null,
      duration_seconds: 20,
      status: 'ACTIVE',
      created_at: '2026-11-01T00:00:00.000Z',
    };

    const typeInfo = getPosterTypeInfo(compositePoster);
    expect(typeInfo.type).toBe('composite');
    expect(typeInfo.label).toBe('Multi-Asset');
  });

  it('maintains backwards compatibility for classic single image, video, and notice posters', () => {
    const imagePoster: PosterWithStatus = {
      id: 'img-1',
      title: 'Simple Image',
      image_path: '/uploads/simple.webp',
      media_type: 'image',
      start_at: '2026-11-01T00:00:00.000Z',
      end_at: null,
      duration_seconds: 15,
      status: 'ACTIVE',
      created_at: '2026-11-01T00:00:00.000Z',
    };
    expect(getPosterTypeInfo(imagePoster).type).toBe('image');

    const videoPoster: PosterWithStatus = {
      id: 'vid-1',
      title: 'Simple Video',
      image_path: '/uploads/clip.mp4',
      media_type: 'video',
      video_loop_count: 2,
      start_at: '2026-11-01T00:00:00.000Z',
      end_at: null,
      duration_seconds: 30,
      status: 'ACTIVE',
      created_at: '2026-11-01T00:00:00.000Z',
    };
    expect(getPosterTypeInfo(videoPoster).type).toBe('video');
    expect(getPosterTypeInfo(videoPoster).label).toBe('Video (2x)');

    const noticePoster: PosterWithStatus = {
      id: 'not-1',
      title: 'Notice SVG',
      image_path: '/uploads/announcement-123.svg',
      media_type: 'image',
      start_at: '2026-11-01T00:00:00.000Z',
      end_at: null,
      duration_seconds: 15,
      status: 'ACTIVE',
      created_at: '2026-11-01T00:00:00.000Z',
    };
    expect(getPosterTypeInfo(noticePoster).type).toBe('notice');
  });

  it('guarantees round-trip serialization and deserialization of layout configurations', () => {
    const originalConfig: PosterLayoutConfig = {
      version: 1,
      archetype: 'hero_left_2_right',
      split_ratio: 65,
      slots: [
        {
          id: 'slot-a',
          type: 'image',
          asset_path: '/uploads/hero.webp',
          fit_mode: 'contain',
          frame_style: 'gold_emerald_trim',
        },
        {
          id: 'slot-b',
          type: 'notice',
          asset_path: '',
          notice_headline: 'Registration Open',
          notice_description: 'Early bird registration closes Friday',
          notice_theme: 'amber',
          fit_mode: 'cover',
          frame_style: 'card_shadow',
        },
      ],
      text_overlays: [
        {
          id: 'banner-1',
          text: 'Annual Quran Competition',
          style: 'announcement_banner',
          position: 'top_banner',
          z_index: 20,
        },
      ],
      canvas_background: 'black',
    };

    const serialized = JSON.stringify(originalConfig);
    const parsed = JSON.parse(serialized);

    const validation = validateLayoutConfig(parsed);
    expect(validation.valid).toBe(true);
    expect(parsed.archetype).toBe('hero_left_2_right');
    expect(parsed.split_ratio).toBe(65);
    expect(parsed.slots).toHaveLength(2);
    expect(parsed.text_overlays).toHaveLength(1);
    expect(parsed.text_overlays[0].text).toBe('Annual Quran Competition');
  });

  it('clamps splitter ratios to avoid invisible zero-width or zero-height partitions', () => {
    expect(clampSplitRatio(5)).toBe(20);
    expect(clampSplitRatio(98)).toBe(80);
    expect(clampSplitRatio(42.6)).toBe(43);
  });

  it('guarantees round-trip serialization of freeform canvas layouts with custom frames and badges', () => {
    const freeformConfig: PosterLayoutConfig = {
      version: 1,
      archetype: 'freeform',
      split_ratio: 50,
      canvas_background: 'mashrabiya',
      slots: [
        {
          id: 'freeform-1',
          type: 'image',
          asset_path: '/uploads/flyer.webp',
          fit_mode: 'contain',
          frame_style: 'custom',
          custom_frame_url: '/uploads/frames/golden-arch.png',
          pos_x: 35,
          pos_y: 48,
          width_percent: 50,
          height_percent: 75,
          rotation: 0,
          z_index: 2,
          badge_text: 'TONIGHT',
          badge_variant: 'gold',
        },
        {
          id: 'badge-sticker',
          type: 'badge',
          asset_path: '',
          fit_mode: 'contain',
          frame_style: 'none',
          badge_text: 'FREE DINNER',
          badge_variant: 'emerald',
          pos_x: 75,
          pos_y: 25,
          width_percent: 32,
          height_percent: 16,
          z_index: 3,
        },
      ],
      text_overlays: [],
    };

    const serialized = JSON.stringify(freeformConfig);
    const parsed = JSON.parse(serialized);

    const validation = validateLayoutConfig(parsed);
    expect(validation.valid).toBe(true);
    expect(parsed.archetype).toBe('freeform');
    expect(parsed.canvas_background).toBe('mashrabiya');
    expect(parsed.slots[0].frame_style).toBe('custom');
    expect(parsed.slots[0].custom_frame_url).toBe('/uploads/frames/golden-arch.png');
    expect(parsed.slots[0].badge_text).toBe('TONIGHT');
    expect(parsed.slots[1].type).toBe('badge');
  });

  it('guarantees round-trip serialization of independent floating stickers layer across any layout', () => {
    const layoutWithStickers: PosterLayoutConfig = {
      version: 1,
      archetype: 'grid_4',
      split_ratio: 50,
      grid_gap: 'subtle',
      canvas_background: 'islamic_star',
      slots: [
        {
          id: 'slot-1',
          type: 'image',
          asset_path: '/uploads/flyer1.webp',
          fit_mode: 'contain_blur',
          frame_style: 'islamic_matting',
        },
      ],
      stickers: [
        {
          id: 'stk-fanous',
          type: 'fanous',
          pos_x: 22,
          pos_y: 20,
          width_percent: 16,
          height_percent: 25,
          rotation: -5,
          z_index: 30,
        },
        {
          id: 'stk-moon',
          type: 'crescent_moon',
          pos_x: 82,
          pos_y: 18,
          width_percent: 18,
          height_percent: 22,
          rotation: 12,
          z_index: 31,
        },
        {
          id: 'stk-ribbon',
          type: 'badge_custom',
          badge_text: 'COMMUNITY IFTAR',
          badge_variant: 'gold',
          pos_x: 50,
          pos_y: 12,
          width_percent: 38,
          height_percent: 15,
          rotation: 0,
          z_index: 32,
        },
      ],
      text_overlays: [],
    };

    const serialized = JSON.stringify(layoutWithStickers);
    const parsed: PosterLayoutConfig = JSON.parse(serialized);

    const validation = validateLayoutConfig(parsed);
    expect(validation.valid).toBe(true);
    expect(parsed.stickers).toHaveLength(3);
    expect(parsed.stickers?.[0]?.type).toBe('fanous');
    expect(parsed.stickers?.[1]?.type).toBe('crescent_moon');
    expect(parsed.stickers?.[2]?.badge_text).toBe('COMMUNITY IFTAR');
    expect(parsed.slots[0]?.fit_mode).toBe('contain_blur');
  });

  it('calculates upright action bar coordinates correctly across 0°, 90°, and 180° rotations', () => {
    const center0 = getUprightActionCoords(50, 50, 40, 40, 0);
    expect(center0.leftPct).toBe(50);
    expect(center0.isNearTop).toBe(false);
    expect(center0.topPct).toBeCloseTo(50 - 20 - 1.5, 2);

    // 90° rotated item: visualHalfH becomes widthPct/2 = 30
    const center90 = getUprightActionCoords(50, 50, 60, 40, 90);
    expect(center90.leftPct).toBe(50);
    expect(center90.isNearTop).toBe(false);
    expect(center90.topPct).toBeCloseTo(50 - 30 - 1.5, 2);

    // 180° upside-down item: visualHalfH MUST remain positive (using |cos(pi)| = 1) above item
    const center180 = getUprightActionCoords(50, 50, 40, 30, 180);
    expect(center180.isNearTop).toBe(false);
    expect(center180.topPct).toBeCloseTo(50 - 15 - 1.5, 2);

    // Near top edge item (posY=10, h=20): visualTop = 0 < 14 -> flips below item
    const topItem = getUprightActionCoords(50, 10, 40, 20, 0);
    expect(topItem.isNearTop).toBe(true);
    expect(topItem.topPct).toBeCloseTo(10 + 10 + 1.5, 2);
  });

  it('computes exact visual slice using production buildStudioLayerItems and getVisibleOrderedLayerKeys', () => {
    const scene = {
      slots: [
        { id: 'a', type: 'image' as const, asset_path: '/a.webp', original_filename: 'a.webp', fit_mode: 'contain' as const, frame_style: 'none' as const },
        { id: 'b', type: 'image' as const, asset_path: '/b.webp', original_filename: 'b.webp', fit_mode: 'contain' as const, frame_style: 'none' as const, layer_folder_id: 'f1' },
        { id: 'c', type: 'image' as const, asset_path: '/c.webp', original_filename: 'c.webp', fit_mode: 'contain' as const, frame_style: 'none' as const },
      ],
      stickers: [],
      textOverlays: [],
      compoundLayers: [],
      folders: [{ id: 'f1', name: 'Folder 1', is_collapsed: false, child_keys: ['slot:b'] }],
      rootOrder: ['slot:a', 'folder:f1', 'slot:c'],
    };

    const items = buildStudioLayerItems(scene);
    const expanded = getVisibleOrderedLayerKeys(scene, items);
    expect(expanded.visibleKeys).toEqual(['slot:a', 'folder:f1', 'slot:b', 'slot:c']);

    const collapsedScene = {
      ...scene,
      folders: [{ id: 'f1', name: 'Folder 1', is_collapsed: true, child_keys: ['slot:b'] }],
    };
    const collapsed = getVisibleOrderedLayerKeys(collapsedScene, items);
    expect(collapsed.visibleKeys).toEqual(['slot:a', 'folder:f1', 'slot:c']);
  });
});

