'use client';

import React from 'react';
import type { PosterLayoutArchetype, SlotFitMode } from '@/types/index';
import type { LayerItemTarget, SelectedEntity, StudioSceneState } from '@/lib/posters/studio-types';
import { getUprightActionCoords } from '@/lib/posters/studio-pointer-math';
import { ChevronDown, ChevronUp, Copy, FlipHorizontal, FlipVertical, Lock, RotateCw, Trash2, Ungroup, Unlock } from 'lucide-react';

interface StudioUprightActionsBarProps {
  readonly scene: StudioSceneState;
  readonly archetype: PosterLayoutArchetype;
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedCount: number;
  readonly isItemLocked: (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) => boolean;
  readonly onMoveUp: (target: LayerItemTarget) => void;
  readonly onMoveDown: (target: LayerItemTarget) => void;
  readonly onToggleLock: (target: LayerItemTarget) => void;
  readonly onDuplicate: (target: LayerItemTarget) => void;
  readonly onDelete: (target: LayerItemTarget) => void;
  readonly onUnmergeCompound: (id: string) => void;
  readonly onPatchEntity: (entity: SelectedEntity, patch: { flip_x?: boolean; flip_y?: boolean; rotation?: number; fit_mode?: SlotFitMode }) => void;
}

interface ResolvedActionTarget {
  readonly target: LayerItemTarget;
  readonly locked: boolean;
  readonly isLockedOwn: boolean;
  readonly coords: { leftPct: number; topPct: number; isNearTop: boolean };
  readonly activeAccentClass: string;
  readonly flipX: boolean;
  readonly flipY: boolean;
  readonly rotation: number;
  readonly supportsFlip: boolean;
  readonly slotFitMode?: SlotFitMode | undefined;
  readonly isCompound?: boolean | undefined;
}

function resolveActionTarget(
  scene: StudioSceneState,
  archetype: PosterLayoutArchetype,
  entity: SelectedEntity,
  isItemLocked: StudioUprightActionsBarProps['isItemLocked'],
): ResolvedActionTarget | null {
  if (entity.type === 'slot') {
    if (archetype !== 'freeform') return null;
    const idx = scene.slots.findIndex((s) => s.id === entity.id);
    const s = idx !== -1 ? scene.slots[idx] : undefined;
    if (!s || s.is_hidden) return null;
    return {
      target: { type: 'slot', id: s.id, itemIdx: idx }, locked: isItemLocked(s), isLockedOwn: Boolean(s.is_locked),
      coords: getUprightActionCoords(s.pos_x ?? 50, s.pos_y ?? 50, s.width_percent ?? 40, s.height_percent ?? 40, s.rotation ?? 0),
      activeAccentClass: 'text-amber-400 bg-white/10', flipX: Boolean(s.flip_x), flipY: Boolean(s.flip_y),
      rotation: s.rotation ?? 0, supportsFlip: true,
      slotFitMode: s.type !== 'notice' && s.type !== 'badge' ? (s.fit_mode ?? 'contain') : undefined,
    };
  }
  if (entity.type === 'sticker') {
    const idx = scene.stickers.findIndex((st) => st.id === entity.id);
    const stk = idx !== -1 ? scene.stickers[idx] : undefined;
    if (!stk || stk.is_hidden) return null;
    return {
      target: { type: 'sticker', id: stk.id, itemIdx: idx }, locked: isItemLocked(stk), isLockedOwn: Boolean(stk.is_locked),
      coords: getUprightActionCoords(stk.pos_x, stk.pos_y, stk.width_percent, stk.height_percent, stk.rotation ?? 0),
      activeAccentClass: 'text-amber-400 bg-white/10', flipX: Boolean(stk.flip_x), flipY: Boolean(stk.flip_y),
      rotation: stk.rotation ?? 0, supportsFlip: true,
    };
  }
  if (entity.type === 'compound') {
    const comp = scene.compoundLayers.find((c) => c.id === entity.id);
    if (!comp || comp.is_hidden) return null;
    return {
      target: { type: 'compound', id: comp.id }, locked: isItemLocked(comp), isLockedOwn: Boolean(comp.is_locked),
      coords: getUprightActionCoords(comp.pos_x, comp.pos_y, comp.width_percent, comp.height_percent, comp.rotation ?? 0),
      activeAccentClass: 'text-indigo-400 bg-white/10', flipX: Boolean(comp.flip_x), flipY: Boolean(comp.flip_y),
      rotation: comp.rotation ?? 0, supportsFlip: true, isCompound: true,
    };
  }
  const idx = scene.textOverlays.findIndex((t) => t.id === entity.id);
  const ov = idx !== -1 ? scene.textOverlays[idx] : undefined;
  if (!ov || ov.is_hidden) return null;
  const topPct = ov.pos_y !== undefined ? ov.pos_y : ov.position === 'top_banner' ? 12 : 85;
  const leftPct = ov.pos_x !== undefined ? ov.pos_x : 50;
  const widthPct = ov.width_mode === 'custom' && ov.width_percent ? ov.width_percent : 40;
  return {
    target: { type: 'text', id: ov.id, itemIdx: idx }, locked: isItemLocked(ov), isLockedOwn: Boolean(ov.is_locked),
    coords: getUprightActionCoords(leftPct, topPct, widthPct, 10, ov.rotation ?? 0),
    activeAccentClass: 'text-cyan-400 bg-white/10', flipX: false, flipY: false,
    rotation: ov.rotation ?? 0, supportsFlip: false,
  };
}

/** Upright floating quick-action bar positioned above/below any selected canvas layer. */
export function StudioUprightActionsBar(props: StudioUprightActionsBarProps) {
  if (props.selectedCount !== 1 || !props.selectedEntity) return null;
  const resolved = resolveActionTarget(props.scene, props.archetype, props.selectedEntity, props.isItemLocked);
  if (!resolved) return null;
  const { target, locked, isLockedOwn, coords, activeAccentClass, flipX, flipY, rotation, supportsFlip, slotFitMode, isCompound } = resolved;
  const nextFit: SlotFitMode = slotFitMode === 'contain' ? 'contain_blur' : slotFitMode === 'contain_blur' ? 'cover' : 'contain';

  return (
    <div
      style={{ position: 'absolute', left: `${coords.leftPct}%`, top: `${coords.topPct}%`, transform: `translate(-50%, ${coords.isNearTop ? '0%' : '-100%'})`, zIndex: 1000 }}
      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/90 backdrop-blur-md border border-white/20 shadow-2xl pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button type="button" disabled={locked} onClick={() => props.onMoveUp(target)} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Bring Forward"><ChevronUp className="w-3.5 h-3.5" /></button>
      <button type="button" disabled={locked} onClick={() => props.onMoveDown(target)} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Send Backward"><ChevronDown className="w-3.5 h-3.5" /></button>
      <div className="w-[1px] h-3.5 bg-white/20 my-auto" />
      <button type="button" onClick={() => props.onToggleLock(target)} className={`p-1 rounded-lg hover:bg-white/10 cursor-pointer ${isLockedOwn ? activeAccentClass : 'text-white/80 hover:text-white'}`} title={isLockedOwn ? 'Unlock Layer' : 'Lock Layer'}>
        {isLockedOwn ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
      </button>
      {supportsFlip && (
        <>
          <button type="button" disabled={locked} onClick={() => props.onPatchEntity(props.selectedEntity!, { flip_x: !flipX })} className={`p-1 rounded-lg hover:bg-white/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${flipX ? activeAccentClass : 'text-white/80 hover:text-white'}`} title="Flip Horizontal"><FlipHorizontal className="w-3.5 h-3.5" /></button>
          <button type="button" disabled={locked} onClick={() => props.onPatchEntity(props.selectedEntity!, { flip_y: !flipY })} className={`p-1 rounded-lg hover:bg-white/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${flipY ? activeAccentClass : 'text-white/80 hover:text-white'}`} title="Flip Vertical"><FlipVertical className="w-3.5 h-3.5" /></button>
        </>
      )}
      <button type="button" disabled={locked} onClick={() => props.onPatchEntity(props.selectedEntity!, { rotation: (rotation + 90) % 360 })} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Rotate 90° Clockwise"><RotateCw className="w-3.5 h-3.5" /></button>
      {slotFitMode && (
        <button type="button" disabled={locked} onClick={() => props.onPatchEntity(props.selectedEntity!, { fit_mode: nextFit })} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-300 hover:bg-white/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title={`Fit Mode: ${slotFitMode}. Click to switch.`}>
          {slotFitMode === 'contain' ? 'Fit (Clean)' : slotFitMode === 'contain_blur' ? 'Fit (Blur)' : 'Fill'}
        </button>
      )}
      {isCompound && (
        <button type="button" disabled={locked} onClick={() => props.onUnmergeCompound(target.id)} className="px-2 py-0.5 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Unmerge into independent layers">
          <Ungroup className="w-3.5 h-3.5" /><span>Unmerge</span>
        </button>
      )}
      <div className="w-[1px] h-3.5 bg-white/20 my-auto" />
      <button type="button" disabled={locked} onClick={() => props.onDuplicate(target)} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Duplicate Layer"><Copy className="w-3.5 h-3.5" /></button>
      <button type="button" disabled={locked} onClick={() => props.onDelete(target)} className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Delete Layer"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
}

