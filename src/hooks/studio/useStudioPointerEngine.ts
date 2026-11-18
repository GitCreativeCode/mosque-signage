'use client';

import { useState, useMemo } from 'react';
import type { PosterLayoutArchetype } from '@/types/index';
import type {
  DragBoundsStart,
  MultiDragSession,
  MultiResizeSession,
  ResizeSession,
  StudioSceneState,
} from '@/lib/posters/studio-types';
import { computeSelectionGroupBounds } from '@/lib/posters/studio-compound';
import {
  computeMultiGroupResizeBox,
  computeSingleElementResize,
  mapDragDeltaPatch,
  mapRelBoxPatch,
} from '@/lib/posters/studio-pointer-math';
import { useStudioPointerDownHandlers } from './useStudioPointerDownHandlers';

interface UseStudioPointerEngineParams {
  readonly scene: StudioSceneState;
  readonly archetype: PosterLayoutArchetype;
  readonly isAspectLocked: boolean;
  readonly selectedLayerKeys: readonly string[];
  readonly canvasRef: React.RefObject<HTMLDivElement | null>;
  readonly isItemLocked: (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) => boolean;
  readonly toggleLayerSelection: (key: string) => void;
  readonly selectSlot: (idx: number | null) => void;
  readonly selectSticker: (idx: number | null) => void;
  readonly selectText: (idx: number | null) => void;
  readonly selectCompound: (id: string | null) => void;
  readonly setSlots: React.Dispatch<React.SetStateAction<StudioSceneState['slots']>>;
  readonly setStickers: React.Dispatch<React.SetStateAction<StudioSceneState['stickers']>>;
  readonly setTextOverlays: React.Dispatch<React.SetStateAction<StudioSceneState['textOverlays']>>;
  readonly setCompoundLayers: React.Dispatch<React.SetStateAction<StudioSceneState['compoundLayers']>>;
  readonly commitSlots: (slots: StudioSceneState['slots']) => void;
  readonly recordStudioSnapshot: (
    s: StudioSceneState['slots'],
    stk?: StudioSceneState['stickers'],
    t?: StudioSceneState['textOverlays'],
    c?: StudioSceneState['compoundLayers'],
    f?: StudioSceneState['folders'],
    r?: string[],
  ) => void;
  readonly isDirtyRef: React.MutableRefObject<boolean>;
}

const tryRelease = (el: EventTarget | null, id: number) => {
  try { (el as HTMLElement)?.releasePointerCapture(id); } catch {}
};

/** Orchestrates pointer move/up geometry updates, snap guides, and multi-select group transforms. */
export function useStudioPointerEngine(params: UseStudioPointerEngineParams) {
  const {
    scene, archetype, isAspectLocked, selectedLayerKeys, canvasRef, isItemLocked,
    toggleLayerSelection, selectSlot, selectSticker, selectText, selectCompound,
    setSlots, setStickers, setTextOverlays, setCompoundLayers,
    commitSlots, recordStudioSnapshot, isDirtyRef,
  } = params;

  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [draggingFreeformSlotId, setDraggingFreeformSlotId] = useState<string | null>(null);
  const [freeformDragStart, setFreeformDragStart] = useState<DragBoundsStart | null>(null);
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const [stickerDragStart, setStickerDragStart] = useState<DragBoundsStart | null>(null);
  const [draggingCompoundId, setDraggingCompoundId] = useState<string | null>(null);
  const [compoundDragStart, setCompoundDragStart] = useState<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  const [resizingSession, setResizingSession] = useState<ResizeSession | null>(null);
  const [multiDragStart, setMultiDragStart] = useState<MultiDragSession | null>(null);
  const [multiResizeSession, setMultiResizeSession] = useState<MultiResizeSession | null>(null);
  const [isSnappedCenterX, setIsSnappedCenterX] = useState(false);
  const [isSnappedCenterY, setIsSnappedCenterY] = useState(false);

  const groupBounds = useMemo(
    () => computeSelectionGroupBounds(selectedLayerKeys, archetype, scene),
    [selectedLayerKeys, archetype, scene],
  );

  const pointerDown = useStudioPointerDownHandlers({
    scene, archetype, selectedLayerKeys, groupBounds, isItemLocked,
    toggleLayerSelection, selectSlot, selectSticker, selectText, selectCompound,
    setMultiDragStart, setMultiResizeSession, setResizingSession,
    setDraggingFreeformSlotId, setFreeformDragStart,
    setDraggingStickerId, setStickerDragStart,
    setDraggingCompoundId, setCompoundDragStart, setDraggingTextId,
  });

  const resetPointerSessions = () => {
    setDraggingTextId(null); setDraggingFreeformSlotId(null); setFreeformDragStart(null);
    setDraggingStickerId(null); setStickerDragStart(null); setDraggingCompoundId(null);
    setCompoundDragStart(null); setResizingSession(null); setMultiDragStart(null);
    setMultiResizeSession(null); setIsSnappedCenterX(false); setIsSnappedCenterY(false);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (multiResizeSession) {
      const box = computeMultiGroupResizeBox(multiResizeSession, ((e.clientX - multiResizeSession.mouseX) / rect.width) * 100, ((e.clientY - multiResizeSession.mouseY) / rect.height) * 100);
      if (multiResizeSession.initialSlots.length > 0) setSlots((p) => p.map((s) => ({ ...s, ...mapRelBoxPatch(multiResizeSession.initialSlots, box, s.id) })));
      if (multiResizeSession.initialStickers.length > 0) setStickers((p) => p.map((s) => ({ ...s, ...mapRelBoxPatch(multiResizeSession.initialStickers, box, s.id) })));
      if (multiResizeSession.initialTexts.length > 0) setTextOverlays((p) => p.map((t) => { const b = mapRelBoxPatch(multiResizeSession.initialTexts, box, t.id); return b ? { ...t, pos_x: b.pos_x, pos_y: b.pos_y, width_mode: 'custom' as const, width_percent: b.width_percent } : t; }));
      if (multiResizeSession.initialCompounds.length > 0) setCompoundLayers((p) => p.map((c) => ({ ...c, ...mapRelBoxPatch(multiResizeSession.initialCompounds, box, c.id) })));
      isDirtyRef.current = true;
      return;
    }
    if (multiDragStart) {
      const dx = ((e.clientX - multiDragStart.mouseX) / rect.width) * 100;
      const dy = ((e.clientY - multiDragStart.mouseY) / rect.height) * 100;
      if (multiDragStart.initialSlots.length > 0) setSlots((p) => p.map((s) => ({ ...s, ...mapDragDeltaPatch(multiDragStart.initialSlots, dx, dy, s.id) })));
      if (multiDragStart.initialStickers.length > 0) setStickers((p) => p.map((s) => ({ ...s, ...mapDragDeltaPatch(multiDragStart.initialStickers, dx, dy, s.id) })));
      if (multiDragStart.initialTexts.length > 0) setTextOverlays((p) => p.map((t) => ({ ...t, ...mapDragDeltaPatch(multiDragStart.initialTexts, dx, dy, t.id) })));
      if (multiDragStart.initialCompounds.length > 0) setCompoundLayers((p) => p.map((c) => ({ ...c, ...mapDragDeltaPatch(multiDragStart.initialCompounds, dx, dy, c.id) })));
      isDirtyRef.current = true;
      return;
    }
    if (resizingSession) {
      const dims = computeSingleElementResize(resizingSession, ((e.clientX - resizingSession.mouseX) / rect.width) * 100, ((e.clientY - resizingSession.mouseY) / rect.height) * 100, rect.height / rect.width, e.shiftKey ? !isAspectLocked : isAspectLocked);
      if (resizingSession.type === 'slot') setSlots((p) => p.map((s) => (s.id === resizingSession.id ? { ...s, ...dims } : s)));
      else if (resizingSession.type === 'sticker') setStickers((p) => p.map((s) => (s.id === resizingSession.id ? { ...s, ...dims } : s)));
      else if (resizingSession.type === 'compound') setCompoundLayers((p) => p.map((c) => (c.id === resizingSession.id ? { ...c, ...dims } : c)));
      else setTextOverlays((p) => p.map((t) => (t.id === resizingSession.id ? { ...t, pos_x: dims.pos_x, pos_y: dims.pos_y, width_mode: 'custom' as const, width_percent: dims.width_percent } : t)));
      isDirtyRef.current = true;
      return;
    }
    if (draggingTextId) {
      const posX = Math.max(5, Math.min(95, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      const posY = Math.max(5, Math.min(95, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
      setTextOverlays((p) => p.map((t) => (t.id === draggingTextId ? { ...t, pos_x: posX, pos_y: posY } : t)));
      isDirtyRef.current = true;
      return;
    }
    if (draggingFreeformSlotId && freeformDragStart) {
      let nx = Math.max(5, Math.min(95, Math.round(freeformDragStart.initialX + ((e.clientX - freeformDragStart.mouseX) / rect.width) * 100)));
      let ny = Math.max(5, Math.min(95, Math.round(freeformDragStart.initialY + ((e.clientY - freeformDragStart.mouseY) / rect.height) * 100)));
      const sx = Math.abs(nx - 50) <= 2.0;
      const sy = Math.abs(ny - 50) <= 2.0;
      if (sx) nx = 50; if (sy) ny = 50;
      setIsSnappedCenterX(sx); setIsSnappedCenterY(sy);
      setSlots((p) => p.map((s) => (s.id === draggingFreeformSlotId ? { ...s, pos_x: nx, pos_y: ny } : s)));
      isDirtyRef.current = true;
      return;
    }
    if (draggingStickerId && stickerDragStart) {
      const nx = Math.max(5, Math.min(95, Math.round(stickerDragStart.initialX + ((e.clientX - stickerDragStart.mouseX) / rect.width) * 100)));
      const ny = Math.max(5, Math.min(95, Math.round(stickerDragStart.initialY + ((e.clientY - stickerDragStart.mouseY) / rect.height) * 100)));
      setStickers((p) => p.map((s) => (s.id === draggingStickerId ? { ...s, pos_x: nx, pos_y: ny } : s)));
      isDirtyRef.current = true;
      return;
    }
    if (draggingCompoundId && compoundDragStart) {
      const nx = Math.max(5, Math.min(95, Math.round(compoundDragStart.initialX + ((e.clientX - compoundDragStart.mouseX) / rect.width) * 100)));
      const ny = Math.max(5, Math.min(95, Math.round(compoundDragStart.initialY + ((e.clientY - compoundDragStart.mouseY) / rect.height) * 100)));
      setCompoundLayers((p) => p.map((c) => (c.id === draggingCompoundId ? { ...c, pos_x: nx, pos_y: ny } : c)));
      isDirtyRef.current = true;
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    let shouldRecordSnapshot = false;
    if (multiDragStart || multiResizeSession) {
      tryRelease(e.target, e.pointerId); setMultiDragStart(null); setMultiResizeSession(null);
      shouldRecordSnapshot = true;
    }
    if (resizingSession) {
      tryRelease(e.target, e.pointerId);
      setResizingSession(null);
      shouldRecordSnapshot = true;
    }
    if (draggingTextId) {
      tryRelease(e.target, e.pointerId);
      setDraggingTextId(null);
      shouldRecordSnapshot = true;
    }
    if (draggingFreeformSlotId) {
      tryRelease(e.target, e.pointerId); setDraggingFreeformSlotId(null); setFreeformDragStart(null);
      setIsSnappedCenterX(false); setIsSnappedCenterY(false);
      shouldRecordSnapshot = true;
    }
    if (draggingStickerId) {
      tryRelease(e.target, e.pointerId); setDraggingStickerId(null); setStickerDragStart(null);
      shouldRecordSnapshot = true;
    }
    if (draggingCompoundId) {
      tryRelease(e.target, e.pointerId); setDraggingCompoundId(null); setCompoundDragStart(null);
      shouldRecordSnapshot = true;
    }
    if (shouldRecordSnapshot) {
      recordStudioSnapshot(scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers, scene.folders, scene.rootOrder);
    }
  };

  return {
    draggingTextId, draggingFreeformSlotId, draggingStickerId, draggingCompoundId,
    isSnappedCenterX, isSnappedCenterY, groupBounds, resetPointerSessions,
    ...pointerDown, handleCanvasPointerMove, handleCanvasPointerUp,
  };
}
