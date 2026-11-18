/**
 * Runtime Validation for Multi-Asset Layout Config Payloads
 * MosqueSignage (TV)
 */

import type { PosterLayoutArchetype } from '@/types/index';
import { isSafeAssetPath } from '@/lib/utils/url-safety';

export interface LayoutValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

const VALID_ARCHETYPES: readonly PosterLayoutArchetype[] = [
  'single',
  'split_vertical',
  'split_horizontal',
  'hero_left_2_right',
  'hero_top_2_bottom',
  'grid_4',
  'masonry_flow',
  'freeform',
];

const VALID_SLOT_TYPES = new Set(['image', 'video', 'notice', 'badge']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateSlots(slots: unknown): LayoutValidationResult {
  if (!Array.isArray(slots)) {
    return { valid: false, error: 'slots must be an array.' };
  }
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!isRecord(slot)) return { valid: false, error: `Slot at index ${i} is invalid.` };
    if (typeof slot['id'] !== 'string' || !slot['id']) {
      return { valid: false, error: `Slot at index ${i} missing id.` };
    }
    if (!VALID_SLOT_TYPES.has(String(slot['type']))) {
      return { valid: false, error: `Slot ${slot['id']} has invalid type: ${String(slot['type'])}` };
    }
    if (typeof slot['asset_path'] !== 'string') {
      return { valid: false, error: `Slot ${slot['id']} missing asset_path string.` };
    }
    if (slot['asset_path'] && !isSafeAssetPath(slot['asset_path'])) {
      return { valid: false, error: `Slot ${slot['id']} contains an unsafe asset_path.` };
    }
    if (
      typeof slot['custom_frame_url'] === 'string' &&
      slot['custom_frame_url'] &&
      !isSafeAssetPath(slot['custom_frame_url'])
    ) {
      return { valid: false, error: `Slot ${slot['id']} contains an unsafe custom_frame_url.` };
    }
  }
  return { valid: true };
}

function validateStickers(stickers: unknown): LayoutValidationResult {
  if (stickers === undefined) return { valid: true };
  if (!Array.isArray(stickers)) return { valid: false, error: 'stickers must be an array.' };
  for (let i = 0; i < stickers.length; i++) {
    const st = stickers[i];
    if (!isRecord(st) || typeof st['id'] !== 'string') {
      return { valid: false, error: `Sticker at index ${i} is invalid.` };
    }
  }
  return { valid: true };
}

function validateFolders(folders: unknown): LayoutValidationResult {
  if (folders === undefined) return { valid: true };
  if (!Array.isArray(folders)) return { valid: false, error: 'folders must be an array.' };
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    if (!isRecord(folder) || typeof folder['id'] !== 'string' || typeof folder['name'] !== 'string') {
      return { valid: false, error: `Folder at index ${i} is invalid.` };
    }
  }
  return { valid: true };
}

function validateCompoundLayers(layers: unknown): LayoutValidationResult {
  if (layers === undefined) return { valid: true };
  if (!Array.isArray(layers)) return { valid: false, error: 'compound_layers must be an array.' };
  for (let i = 0; i < layers.length; i++) {
    const comp = layers[i];
    if (!isRecord(comp) || typeof comp['id'] !== 'string' || typeof comp['label'] !== 'string') {
      return { valid: false, error: `Compound layer at index ${i} is invalid.` };
    }
  }
  return { valid: true };
}

function validateRootOrder(rootOrder: unknown): LayoutValidationResult {
  if (rootOrder === undefined) return { valid: true };
  if (!Array.isArray(rootOrder)) return { valid: false, error: 'root_order must be an array.' };
  for (let i = 0; i < rootOrder.length; i++) {
    if (typeof rootOrder[i] !== 'string') {
      return { valid: false, error: `root_order entry at index ${i} must be a string.` };
    }
  }
  return { valid: true };
}

/**
 * Validates untrusted layout configuration JSON payloads.
 */
export function validateLayoutConfig(config: unknown): LayoutValidationResult {
  if (!isRecord(config)) {
    return { valid: false, error: 'Layout configuration must be a valid JSON object.' };
  }
  if (config['version'] !== 1) {
    return { valid: false, error: 'Unsupported layout configuration version.' };
  }
  const archetype = config['archetype'];
  if (typeof archetype !== 'string' || !VALID_ARCHETYPES.includes(archetype as PosterLayoutArchetype)) {
    return { valid: false, error: `Invalid layout archetype: ${String(archetype)}` };
  }
  if (typeof config['split_ratio'] !== 'number' || Number.isNaN(config['split_ratio'])) {
    return { valid: false, error: 'split_ratio must be a valid number.' };
  }

  const checks: LayoutValidationResult[] = [
    validateSlots(config['slots']),
    validateStickers(config['stickers']),
    validateFolders(config['folders']),
    validateCompoundLayers(config['compound_layers']),
    validateRootOrder(config['root_order']),
  ];
  return checks.find((check) => !check.valid) ?? { valid: true };
}

