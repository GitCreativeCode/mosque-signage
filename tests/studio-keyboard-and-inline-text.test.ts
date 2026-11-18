import { describe, it, expect } from 'vitest';
import { deleteLayerKeysFromScene } from '@/lib/posters/studio-layers';
import { isLayerKeyLocked } from '@/lib/posters/studio-zindex';
import { resolveKeysToDelete } from '@/hooks/studio/useStudioKeyboardShortcuts';
import { resolveTextClasses } from '@/components/admin/posters/studio/StudioCanvasTextLayer';
import type { StudioSceneState } from '@/lib/posters/studio-types';
import type { PosterTextOverlay, PosterSlotMedia, PosterCanvasSticker, PosterCompoundLayer } from '@/types/index';
import { OFFICIAL_RELEASE_HISTORY, APP_VERSION } from '@/lib/system/version';

function createMockScene(): StudioSceneState {
  const slots: PosterSlotMedia[] = [
    { id: 's1', is_locked: false, asset_path: '/img1.jpg', type: 'image', fit_mode: 'contain', frame_style: 'none' },
    { id: 's2', is_locked: true, asset_path: '/img2.jpg', type: 'image', fit_mode: 'contain', frame_style: 'none' },
  ];
  const stickers: PosterCanvasSticker[] = [
    { id: 'stk1', is_locked: false, type: 'bismillah', pos_x: 10, pos_y: 10, width_percent: 10, height_percent: 10, z_index: 10 },
    { id: 'stk2', is_locked: true, type: 'mosque', pos_x: 20, pos_y: 20, width_percent: 10, height_percent: 10, z_index: 20 },
    { id: 'stk3', is_locked: false, layer_folder_id: 'f_locked', type: 'islamic_star', pos_x: 30, pos_y: 30, width_percent: 10, height_percent: 10, z_index: 30 },
  ];
  const textOverlays: PosterTextOverlay[] = [
    { id: 't1', is_locked: false, text: 'Welcome to the Mosque', position: 'center', z_index: 10 },
    { id: 't2', is_locked: true, text: 'Locked Announcement', position: 'center', z_index: 20 },
    { id: 't3', is_locked: false, layer_folder_id: 'f_locked', text: 'Text in locked folder', position: 'center', z_index: 30 },
  ];
  const compoundLayers: PosterCompoundLayer[] = [
    { id: 'c1', is_locked: false, label: 'Unlocked Compound', pos_x: 10, pos_y: 10, width_percent: 20, height_percent: 20, z_index: 10, merged_children: {} },
    { id: 'c2', is_locked: true, label: 'Locked Compound', pos_x: 20, pos_y: 20, width_percent: 20, height_percent: 20, z_index: 20, merged_children: {} },
  ];

  return {
    slots,
    stickers,
    textOverlays,
    compoundLayers,
    folders: [
      { id: 'f_open', name: 'Open Folder', is_locked: false, child_keys: [] },
      { id: 'f_locked', name: 'Locked Folder', is_locked: true, child_keys: ['sticker:stk3', 'text:t3'] },
    ],
    rootOrder: ['slot:s1', 'slot:s2', 'sticker:stk1', 'sticker:stk2', 'text:t1', 'text:t2', 'compound:c1', 'compound:c2', 'folder:f_open', 'folder:f_locked'],
  };
}

describe('Poster Studio Locked Layer Safeguard (Delete / Backspace)', () => {
  it('correctly identifies locked layer keys directly and via parent folder', () => {
    const scene = createMockScene();
    expect(isLayerKeyLocked('slot:s1', scene)).toBe(false);
    expect(isLayerKeyLocked('slot:s2', scene)).toBe(true);

    expect(isLayerKeyLocked('sticker:stk1', scene)).toBe(false);
    expect(isLayerKeyLocked('sticker:stk2', scene)).toBe(true);
    expect(isLayerKeyLocked('sticker:stk3', scene)).toBe(true);

    expect(isLayerKeyLocked('text:t1', scene)).toBe(false);
    expect(isLayerKeyLocked('text:t2', scene)).toBe(true);
    expect(isLayerKeyLocked('text:t3', scene)).toBe(true);

    expect(isLayerKeyLocked('compound:c1', scene)).toBe(false);
    expect(isLayerKeyLocked('compound:c2', scene)).toBe(true);

    expect(isLayerKeyLocked('folder:f_open', scene)).toBe(false);
    expect(isLayerKeyLocked('folder:f_locked', scene)).toBe(true);
  });

  it('preserves directly locked items when deleting by key', () => {
    const scene = createMockScene();
    const next = deleteLayerKeysFromScene(scene, ['slot:s2', 'sticker:stk2', 'text:t2', 'compound:c2']);
    expect(next).toBe(scene);
    expect(next.slots.some((s) => s.id === 's2')).toBe(true);
    expect(next.stickers.some((stk) => stk.id === 'stk2')).toBe(true);
    expect(next.textOverlays.some((t) => t.id === 't2')).toBe(true);
    expect(next.compoundLayers.some((c) => c.id === 'c2')).toBe(true);
  });

  it('preserves children inside a locked folder when attempting to delete them', () => {
    const scene = createMockScene();
    const next = deleteLayerKeysFromScene(scene, ['sticker:stk3', 'text:t3', 'folder:f_locked']);
    expect(next).toBe(scene);
    expect(next.stickers.some((stk) => stk.id === 'stk3')).toBe(true);
    expect(next.textOverlays.some((t) => t.id === 't3')).toBe(true);
    expect(next.folders.some((f) => f.id === 'f_locked')).toBe(true);
  });

  it('safely deletes only unlocked items when given a mixed selection', () => {
    const scene = createMockScene();
    const next = deleteLayerKeysFromScene(scene, ['sticker:stk1', 'sticker:stk2', 'text:t1', 'text:t2']);

    expect(next.stickers.some((stk) => stk.id === 'stk1')).toBe(false);
    expect(next.textOverlays.some((t) => t.id === 't1')).toBe(false);

    expect(next.stickers.some((stk) => stk.id === 'stk2')).toBe(true);
    expect(next.textOverlays.some((t) => t.id === 't2')).toBe(true);
  });

  it('deleting an unlocked folder lifts locked children to root level without deleting them', () => {
    const scene: StudioSceneState = {
      slots: [],
      stickers: [{ id: 'stk_child', is_locked: true, layer_folder_id: 'f_unlocked', type: 'islamic_star', pos_x: 0, pos_y: 0, width_percent: 10, height_percent: 10, z_index: 10 }],
      textOverlays: [],
      compoundLayers: [],
      folders: [{ id: 'f_unlocked', name: 'Unlocked Folder', is_locked: false, child_keys: ['sticker:stk_child'] }],
      rootOrder: ['folder:f_unlocked'],
    };

    const next = deleteLayerKeysFromScene(scene, ['folder:f_unlocked']);
    expect(next.folders.some((f) => f.id === 'f_unlocked')).toBe(false);
    const child = next.stickers.find((s) => s.id === 'stk_child');
    expect(child).toBeDefined();
    expect(child?.layer_folder_id).toBeUndefined();
  });

  it('resolveKeysToDelete correctly prioritizes selectedLayerKeys over selectedEntity and slotIndex', () => {
    const scene = createMockScene();
    const fromLayerKeys = resolveKeysToDelete(scene, ['sticker:stk1', 'text:t1'], { type: 'slot', id: 's1' }, 0);
    expect(fromLayerKeys).toEqual(['sticker:stk1', 'text:t1']);

    const fromEntity = resolveKeysToDelete(scene, [], { type: 'compound', id: 'c1' }, 0);
    expect(fromEntity).toEqual(['compound:c1']);

    const fromSlotIndex = resolveKeysToDelete(scene, [], null, 0);
    expect(fromSlotIndex).toEqual(['slot:s1']);

    const empty = resolveKeysToDelete(scene, [], null, null);
    expect(empty).toEqual([]);
  });
});

describe('Studio Canvas Text Layer Styling & Typography', () => {
  it('resolves font family classes correctly', () => {
    const base: PosterTextOverlay = { id: 't-test', text: 'Sample', position: 'center', z_index: 10 };
    expect(resolveTextClasses({ ...base, font_family: 'serif' }).fontFamilyClass).toBe('font-serif');
    expect(resolveTextClasses({ ...base, font_family: 'mono' }).fontFamilyClass).toBe('font-mono');
    expect(resolveTextClasses({ ...base, font_family: 'traditional' }).fontFamilyClass).toBe('font-serif tracking-wider');
    expect(resolveTextClasses({ ...base, font_family: 'sans' }).fontFamilyClass).toBe('font-sans');
  });

  it('resolves font sizes correctly', () => {
    const base: PosterTextOverlay = { id: 't-test', text: 'Sample', position: 'center', z_index: 10 };
    expect(resolveTextClasses({ ...base, font_size: 'sm' }).fontSizeClass).toBe('text-xs');
    expect(resolveTextClasses({ ...base, font_size: 'lg' }).fontSizeClass).toBe('text-base sm:text-lg');
    expect(resolveTextClasses({ ...base, font_size: 'xl' }).fontSizeClass).toBe('text-lg sm:text-xl');
    expect(resolveTextClasses({ ...base, font_size: '2xl' }).fontSizeClass).toBe('text-xl sm:text-2xl');
    expect(resolveTextClasses({ ...base, font_size: '3xl' }).fontSizeClass).toBe('text-2xl sm:text-3xl');
    expect(resolveTextClasses({ ...base, font_size: 'base' }).fontSizeClass).toBe('text-sm');
  });

  it('resolves transparent and custom background styles correctly', () => {
    const base: PosterTextOverlay = { id: 't-test', text: 'Sample', position: 'center', z_index: 10 };
    const trans = resolveTextClasses({ ...base, bg_style: 'transparent' });
    expect(trans.isTransparentBg).toBe(true);
    expect(trans.bgClass).toContain('bg-transparent');

    const emerald = resolveTextClasses({ ...base, bg_style: 'emerald' });
    expect(emerald.isTransparentBg).toBe(false);
    expect(emerald.bgClass).toContain('bg-emerald-950/90');

    const custom = resolveTextClasses({ ...base, bg_color: '#3b82f6' });
    expect(custom.customBgColor).toBe('#3b82f6');
  });
});

describe('Release Registry & Versioning Metadata', () => {
  it('correctly reports v0.1.1 as current release with Nov 18, 2026 date', () => {
    expect(APP_VERSION).toBe('0.1.1');
    expect(OFFICIAL_RELEASE_HISTORY.length).toBeGreaterThanOrEqual(2);

    const latest = OFFICIAL_RELEASE_HISTORY[0]!;
    expect(latest.version).toBe('0.1.1');
    expect(latest.date).toBe('November 18, 2026');
    expect(latest.isCurrent).toBe(true);
    expect(latest.title).toContain('v0.1.1');
    expect(latest.category).toBe('patch');

    const previous = OFFICIAL_RELEASE_HISTORY[1]!;
    expect(previous.version).toBe('0.1.0');
    expect(previous.date).toBe('November 18, 2026');
    expect(previous.isCurrent).toBe(false);
  });
});
