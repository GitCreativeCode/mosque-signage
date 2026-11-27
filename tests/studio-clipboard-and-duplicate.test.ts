import { describe, it, expect } from 'vitest';
import { duplicateLayerInScene } from '@/lib/posters/studio-layers';
import type { StudioSceneState } from '@/lib/posters/studio-types';

function createTestScene(): StudioSceneState {
  return {
    slots: [
      { id: 's1', is_locked: false, asset_path: '/img1.jpg', type: 'image', fit_mode: 'contain', frame_style: 'none', pos_x: 20, pos_y: 20 },
    ],
    stickers: [
      { id: 'stk1', is_locked: false, type: 'bismillah', pos_x: 30, pos_y: 30, width_percent: 15, height_percent: 15, z_index: 10 },
    ],
    textOverlays: [
      { id: 't1', is_locked: false, text: 'Salam World', position: 'center', pos_x: 50, pos_y: 50, z_index: 20 },
    ],
    compoundLayers: [
      { id: 'c1', is_locked: false, label: 'Badge', pos_x: 40, pos_y: 40, width_percent: 20, height_percent: 20, z_index: 15, merged_children: {} },
    ],
    folders: [],
    rootOrder: ['slot:s1', 'compound:c1', 'sticker:stk1', 'text:t1'],
  };
}

describe('Studio Ctrl+D Duplication via ID (without itemIdx)', () => {
  it('duplicates text overlay by ID alone when itemIdx is undefined', () => {
    const scene = createTestScene();
    const res = duplicateLayerInScene(scene, { type: 'text', id: 't1' });
    expect(res).not.toBeNull();
    expect(res?.nextScene.textOverlays.length).toBe(2);
    expect(res?.newId).toMatch(/^text-/);
    const duplicated = res?.nextScene.textOverlays.find((t) => t.id === res.newId);
    expect(duplicated?.text).toBe('Salam World');
    expect(duplicated?.pos_x).toBe(54); // +4% offset
    expect(duplicated?.pos_y).toBe(54);
    expect(res?.nextScene.rootOrder).toContain(`text:${res?.newId}`);
    // Duplicate is placed OVER (before in rootOrder -> higher z-index) the original
    const newIdx = res!.nextScene.rootOrder.indexOf(`text:${res!.newId}`);
    const oldIdx = res!.nextScene.rootOrder.indexOf('text:t1');
    expect(newIdx).toBeLessThan(oldIdx);
  });

  it('duplicates sticker by ID alone when itemIdx is undefined', () => {
    const scene = createTestScene();
    const res = duplicateLayerInScene(scene, { type: 'sticker', id: 'stk1' });
    expect(res).not.toBeNull();
    expect(res?.nextScene.stickers.length).toBe(2);
    const duplicated = res?.nextScene.stickers.find((s) => s.id === res.newId);
    expect(duplicated?.type).toBe('bismillah');
    expect(duplicated?.pos_x).toBe(34); // +4% offset
  });

  it('duplicates slot by ID alone when itemIdx is undefined', () => {
    const scene = createTestScene();
    const res = duplicateLayerInScene(scene, { type: 'slot', id: 's1' });
    expect(res).not.toBeNull();
    expect(res?.nextScene.slots.length).toBe(2);
    const duplicated = res?.nextScene.slots.find((s) => s.id === res.newId);
    expect(duplicated?.asset_path).toBe('/img1.jpg');
    expect(duplicated?.pos_x).toBe(24);
  });

  it('duplicates compound layer by ID alone', () => {
    const scene = createTestScene();
    const res = duplicateLayerInScene(scene, { type: 'compound', id: 'c1' });
    expect(res).not.toBeNull();
    expect(res?.nextScene.compoundLayers.length).toBe(2);
    const duplicated = res?.nextScene.compoundLayers.find((c) => c.id === res.newId);
    expect(duplicated?.label).toBe('Badge');
    expect(duplicated?.pos_x).toBe(44);
  });

  it('supports sequential multi-selection duplication of mixed layer types', () => {
    const scene = createTestScene();
    const selectedKeys = ['sticker:stk1', 'text:t1'];
    let currentScene = scene;
    const newKeys: string[] = [];

    for (const key of selectedKeys) {
      const [rawType, id] = key.split(':');
      if (!rawType || !id) continue;
      if (rawType !== 'slot' && rawType !== 'sticker' && rawType !== 'text' && rawType !== 'compound') continue;
      const res = duplicateLayerInScene(currentScene, { type: rawType, id });
      expect(res).not.toBeNull();
      currentScene = res!.nextScene;
      newKeys.push(`${rawType}:${res!.newId}`);
    }

    expect(newKeys.length).toBe(2);
    expect(currentScene.stickers.length).toBe(2);
    expect(currentScene.textOverlays.length).toBe(2);
    expect(currentScene.rootOrder).toContain(newKeys[0]!);
    expect(currentScene.rootOrder).toContain(newKeys[1]!);
    expect(newKeys[0]).not.toBe('sticker:stk1');
    expect(newKeys[1]).not.toBe('text:t1');
  });
});

