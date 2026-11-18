import { describe, it, expect } from 'vitest';
import {
  clampSplitRatio,
  getDefaultArchetypeForCount,
  createDefaultLayoutConfig,
  validateLayoutConfig,
  getArchetypeGridStyle,
  getSlotCellPlacement,
  FRAME_STYLES_REGISTRY,
  assignFreeformDefaults,
  MIN_SPLIT_RATIO,
  MAX_SPLIT_RATIO,
  DEFAULT_SPLIT_RATIO,
} from '@/lib/posters/layout-engine';
import type { PosterSlotMedia } from '@/types/index';

describe('Layout Engine & Divider Clamping', () => {
  it('clamps split ratios within safe bounds', () => {
    expect(clampSplitRatio(50)).toBe(50);
    expect(clampSplitRatio(10)).toBe(MIN_SPLIT_RATIO);
    expect(clampSplitRatio(95)).toBe(MAX_SPLIT_RATIO);
    expect(clampSplitRatio(NaN)).toBe(DEFAULT_SPLIT_RATIO);
    expect(clampSplitRatio(Infinity)).toBe(DEFAULT_SPLIT_RATIO);
  });

  it('determines the optimal archetype for asset counts', () => {
    expect(getDefaultArchetypeForCount(0)).toBe('single');
    expect(getDefaultArchetypeForCount(1)).toBe('single');
    expect(getDefaultArchetypeForCount(2)).toBe('split_vertical');
    expect(getDefaultArchetypeForCount(3)).toBe('hero_left_2_right');
    expect(getDefaultArchetypeForCount(4)).toBe('grid_4');
    expect(getDefaultArchetypeForCount(5)).toBe('masonry_flow');
    expect(getDefaultArchetypeForCount(8)).toBe('masonry_flow');
  });

  it('provides all 6 registered frame styles with valid CSS classes', () => {
    const keys = Object.keys(FRAME_STYLES_REGISTRY);
    expect(keys).toContain('none');
    expect(keys).toContain('clean_border');
    expect(keys).toContain('islamic_matting');
    expect(keys).toContain('gold_emerald_trim');
    expect(keys).toContain('card_shadow');
    expect(keys).toContain('polaroid');

    for (const key of keys) {
      const meta = FRAME_STYLES_REGISTRY[key as keyof typeof FRAME_STYLES_REGISTRY];
      expect(meta.id).toBe(key);
      expect(meta.label).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.containerClasses).toBeDefined();
      expect(meta.innerClasses).toBeDefined();
    }
  });

  it('creates valid default layout configurations', () => {
    const mockSlots: PosterSlotMedia[] = [
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
        video_duration_seconds: 15,
        video_loop_count: 2,
      },
    ];

    const config = createDefaultLayoutConfig(mockSlots);
    expect(config.version).toBe(1);
    expect(config.archetype).toBe('split_vertical');
    expect(config.split_ratio).toBe(50);
    expect(config.slots.length).toBe(2);

    const validation = validateLayoutConfig(config);
    expect(validation.valid).toBe(true);
  });

  it('validates corrupted and malformed layout configs safely', () => {
    expect(validateLayoutConfig(null).valid).toBe(false);
    expect(validateLayoutConfig('not-an-object').valid).toBe(false);
    expect(validateLayoutConfig({ version: 2 }).valid).toBe(false);
    expect(validateLayoutConfig({ version: 1, archetype: 'invalid_arch' }).valid).toBe(false);
    expect(validateLayoutConfig({ version: 1, archetype: 'grid_4', split_ratio: '50' }).valid).toBe(false);
    expect(
      validateLayoutConfig({
        version: 1,
        archetype: 'grid_4',
        split_ratio: 50,
        slots: [{ id: '', type: 'image' }],
      }).valid
    ).toBe(false);
  });

  it('computes grid styles according to archetype and split ratio', () => {
    const vStyle = getArchetypeGridStyle('split_vertical', 60);
    expect(vStyle.gridTemplateColumns).toBe('minmax(0, 60fr) minmax(0, 40fr)');
    expect(vStyle.gridTemplateRows).toBe('100%');

    const hStyle = getArchetypeGridStyle('split_horizontal', 70);
    expect(hStyle.gridTemplateColumns).toBe('100%');
    expect(hStyle.gridTemplateRows).toBe('minmax(0, 70fr) minmax(0, 30fr)');

    const grid4Style = getArchetypeGridStyle('grid_4', 50, 4);
    expect(grid4Style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(grid4Style.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))');

    const singleStyle = getArchetypeGridStyle('single', 50, 1);
    expect(singleStyle.gridTemplateColumns).toBe('100%');
  });

  it('generates multi-column and multi-row tracks for 3+ slots without overflow', () => {
    // 3 slots split_vertical with split ratio 50
    const v3 = getArchetypeGridStyle('split_vertical', 50, 3);
    expect(v3.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(v3.gridTemplateRows).toBe('100%');

    // 4 slots split_vertical with split ratio 40
    const v4 = getArchetypeGridStyle('split_vertical', 40, 4);
    expect(v4.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');

    // 3 slots split_horizontal with split ratio 60
    const h3 = getArchetypeGridStyle('split_horizontal', 60, 3);
    expect(h3.gridTemplateColumns).toBe('100%');
    expect(h3.gridTemplateRows).toBe('repeat(3, minmax(0, 1fr))');

    // hero_left_2_right with 3 slots
    const hero3 = getArchetypeGridStyle('hero_left_2_right', 60, 3);
    expect(hero3.gridTemplateColumns).toBe('minmax(0, 60fr) minmax(0, 40fr)');
    expect(hero3.gridTemplateRows).toBe('minmax(0, 1fr) minmax(0, 1fr)');
  });

  it('calculates proper slot cell spans for hero archetypes', () => {
    // hero_left_2_right with 3 slots
    const heroLeft0 = getSlotCellPlacement('hero_left_2_right', 0, 3);
    expect(heroLeft0.gridColumn).toBe('1');
    expect(heroLeft0.gridRow).toBe('1 / span 2');

    const heroLeft1 = getSlotCellPlacement('hero_left_2_right', 1, 3);
    expect(heroLeft1.gridColumn).toBe('2');
    expect(heroLeft1.gridRow).toBe('1');

    // hero_top_2_bottom with 3 slots
    const heroTop0 = getSlotCellPlacement('hero_top_2_bottom', 0, 3);
    expect(heroTop0.gridColumn).toBe('1 / span 2');
    expect(heroTop0.gridRow).toBe('1');

    const heroTop1 = getSlotCellPlacement('hero_top_2_bottom', 1, 3);
    expect(heroTop1.gridColumn).toBe('1');
    expect(heroTop1.gridRow).toBe('2');
  });

  it('validates freeform layout configs with badges and custom frames', () => {
    const freeformConfig = {
      version: 1,
      archetype: 'freeform',
      split_ratio: 50,
      canvas_background: 'islamic_star',
      slots: [
        {
          id: 'slot-1',
          type: 'image',
          asset_path: '/uploads/flyer.webp',
          fit_mode: 'contain',
          frame_style: 'custom',
          custom_frame_url: '/uploads/frames/ornate.png',
          pos_x: 35,
          pos_y: 50,
          width_percent: 45,
          height_percent: 75,
          rotation: 0,
          z_index: 1,
          badge_text: 'SPECIAL GUEST',
          badge_variant: 'amber',
        },
        {
          id: 'slot-2',
          type: 'badge',
          asset_path: '',
          fit_mode: 'contain',
          frame_style: 'none',
          badge_text: 'FREE ADMISSION',
          badge_variant: 'emerald',
          pos_x: 75,
          pos_y: 30,
          width_percent: 30,
          height_percent: 15,
          z_index: 2,
        },
      ],
      text_overlays: [],
    };

    const res = validateLayoutConfig(freeformConfig);
    expect(res.valid).toBe(true);
  });

  it('assigns ergonomic defaults for freeform mode', () => {
    const rawSlot: PosterSlotMedia = {
      id: 'slot-test',
      type: 'image',
      asset_path: '/uploads/img.jpg',
      fit_mode: 'contain',
      frame_style: 'clean_border',
    };

    const slot1of2 = assignFreeformDefaults(rawSlot, 0, 2);
    expect(slot1of2.pos_x).toBe(32);
    expect(slot1of2.pos_y).toBe(50);
    expect(slot1of2.width_percent).toBe(44);
    expect(slot1of2.height_percent).toBe(78);

    const slot2of2 = assignFreeformDefaults(rawSlot, 1, 2);
    expect(slot2of2.pos_x).toBe(68);
  });

  it('validates layouts with floating Islamic stickers and contain_blur fit mode', () => {
    const layoutWithStickers = {
      version: 1,
      archetype: 'split_vertical',
      split_ratio: 50,
      canvas_background: 'mashrabiya',
      slots: [
        {
          id: 'slot-1',
          type: 'image',
          asset_path: '/uploads/flyer1.webp',
          fit_mode: 'contain_blur',
          frame_style: 'islamic_matting',
        },
        {
          id: 'slot-2',
          type: 'image',
          asset_path: '/uploads/flyer2.webp',
          fit_mode: 'contain',
          frame_style: 'clean_border',
        },
      ],
      stickers: [
        {
          id: 'stk-1',
          type: 'fanous',
          pos_x: 20,
          pos_y: 25,
          width_percent: 16,
          height_percent: 25,
          rotation: 0,
          z_index: 30,
        },
        {
          id: 'stk-2',
          type: 'crescent_moon',
          pos_x: 80,
          pos_y: 20,
          width_percent: 18,
          height_percent: 22,
          rotation: 15,
          z_index: 31,
        },
        {
          id: 'stk-3',
          type: 'badge_custom',
          badge_text: 'RAMADAN KAREEM',
          badge_variant: 'gold',
          pos_x: 50,
          pos_y: 15,
          width_percent: 36,
          height_percent: 14,
          z_index: 32,
        },
      ],
      text_overlays: [],
    };

    const res = validateLayoutConfig(layoutWithStickers);
    expect(res.valid).toBe(true);
  });

  it('provides 7 sacred Islamic sticker presets in ISLAMIC_STICKERS_REGISTRY', async () => {
    const { ISLAMIC_STICKERS_REGISTRY } = await import('@/lib/posters/layout-engine');
    expect(ISLAMIC_STICKERS_REGISTRY.length).toBe(7);
    const ids = ISLAMIC_STICKERS_REGISTRY.map((s) => s.id);
    expect(ids).toContain('fanous');
    expect(ids).toContain('crescent_moon');
    expect(ids).toContain('mosque');
    expect(ids).toContain('islamic_star');
    expect(ids).toContain('bismillah');
    expect(ids).toContain('kaaba');
    expect(ids).toContain('tasbih');
    expect(ids).not.toContain('badge_custom');
  });

  it('validates layouts with folders and compound layers', async () => {
    const layoutWithFoldersAndCompounds = {
      version: 1,
      archetype: 'freeform',
      split_ratio: 50,
      slots: [],
      text_overlays: [],
      folders: [
        {
          id: 'folder-1',
          name: 'Header Graphics',
          is_collapsed: false,
          is_locked: true,
          z_index: 80,
          child_keys: ['slot:slot-1', 'sticker:stk-1'],
        },
      ],
      compound_layers: [
        {
          id: 'compound-1',
          label: 'Title Badge Combo',
          pos_x: 50,
          pos_y: 20,
          width_percent: 40,
          height_percent: 15,
          z_index: 10,
          merged_children: {},
        },
      ],
      root_order: ['folder:folder-1', 'compound:compound-1'],
    };
    const res = validateLayoutConfig(layoutWithFoldersAndCompounds);
    expect(res.valid).toBe(true);
  });

  it('rejects invalid root_order formats', () => {
    const invalidRoot1 = {
      version: 1,
      archetype: 'freeform',
      split_ratio: 50,
      slots: [],
      root_order: 'not-an-array',
    };
    expect(validateLayoutConfig(invalidRoot1).valid).toBe(false);

    const invalidRoot2 = {
      version: 1,
      archetype: 'freeform',
      split_ratio: 50,
      slots: [],
      root_order: [123, 456],
    };
    expect(validateLayoutConfig(invalidRoot2).valid).toBe(false);
  });

  it('provides rich previewBackground for all presets in CANVAS_BACKGROUNDS_REGISTRY', async () => {
    const { CANVAS_BACKGROUNDS_REGISTRY, getCanvasBackgroundProps } = await import(
      '@/lib/posters/layout-engine'
    );
    expect(CANVAS_BACKGROUNDS_REGISTRY.length).toBeGreaterThanOrEqual(9);

    for (const bg of CANVAS_BACKGROUNDS_REGISTRY) {
      expect(bg.previewBackground).toBeDefined();
      const hasColorOrImage =
        Boolean(bg.previewBackground.backgroundColor) ||
        Boolean(bg.previewBackground.backgroundImage);
      expect(hasColorOrImage).toBe(true);

      const props = getCanvasBackgroundProps(bg.id);
      expect(props.style).toBeDefined();
    }
  });

  it('computes proportional non-overflowing grid tracks for 5 to 10 slots across grid_4 and masonry_flow', () => {
    for (const archetype of ['grid_4', 'masonry_flow'] as const) {
      const style5 = getArchetypeGridStyle(archetype, 50, 5);
      expect(style5.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
      expect(style5.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))');

      const style8 = getArchetypeGridStyle(archetype, 50, 8);
      expect(style8.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
      expect(style8.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))');
      expect(style8.gridTemplateColumns).not.toContain('280px');
      expect(style8.gridTemplateRows).not.toContain('200px');

      const style10 = getArchetypeGridStyle(archetype, 50, 10);
      expect(style10.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
      expect(style10.gridTemplateRows).toBe('repeat(3, minmax(0, 1fr))');
    }
  });

  it('isolates 8-image MiniCompositeThumbnail stacking context and elevates PosterGridCard placement arrows', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MiniCompositeThumbnail } = await import('@/components/admin/posters/MiniCompositeThumbnail');
    const fs = await import('node:fs');
    const path = await import('node:path');

    const eightSlots = Array.from({ length: 8 }, (_, idx) => ({
      id: `slot-${idx + 1}`,
      type: 'image' as const,
      asset_path: `/uploads/flyer-${idx + 1}.webp`,
      fit_mode: 'cover' as const,
      frame_style: 'none' as const,
      z_index: (8 - idx) * 10,
    }));

    const gridMarkup = renderToStaticMarkup(
      React.createElement(MiniCompositeThumbnail, {
        layoutConfig: JSON.stringify({
          version: 1,
          archetype: 'grid_4',
          split_ratio: 50,
          slots: eightSlots,
        }),
        posterTitle: 'Eight Image Equal Grid',
        fallbackImagePath: '/uploads/flyer-1.webp',
      })
    );

    expect(gridMarkup).toContain('isolate');
    expect(gridMarkup).toContain('overflow-hidden');
    expect(gridMarkup).toMatch(/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    expect(gridMarkup).toMatch(/grid-template-rows:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(gridMarkup).not.toContain('280px');

    const freeformMarkup = renderToStaticMarkup(
      React.createElement(MiniCompositeThumbnail, {
        layoutConfig: JSON.stringify({
          version: 1,
          archetype: 'freeform',
          split_ratio: 50,
          slots: eightSlots.map((s, idx) => ({ ...s, pos_x: 10 + idx * 10, pos_y: 50, width_percent: 20, height_percent: 40 })),
        }),
        posterTitle: 'Eight Image Freeform',
        fallbackImagePath: '/uploads/flyer-1.webp',
      })
    );
    expect(freeformMarkup).toContain('isolate');
    expect(freeformMarkup).toMatch(/z-index:\s*80/);

    const gridCardSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/admin/posters/PosterGridCard.tsx'),
      'utf8'
    );
    expect(gridCardSource).toContain('relative isolate bg-[var(--admin-card)]');
    expect(gridCardSource).toContain('relative isolate aspect-video');
    expect(gridCardSource).toContain('bottom-2.5 left-2.5 z-20 flex items-center');
    expect(gridCardSource).toContain('top-2.5 left-2.5 z-20 bg-black/80');
    expect(gridCardSource).toContain('top-2.5 right-2.5 z-20 bg-black/80');

    const sequenceRowSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/admin/posters/PosterSequenceRow.tsx'),
      'utf8'
    );
    expect(sequenceRowSource).toContain('relative isolate w-20 h-12');
  });
});

