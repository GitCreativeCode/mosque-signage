'use client';

import { useState, useMemo, useRef } from 'react';
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
  computeTextElementResize,
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
    actionLabel?: string,
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
  const [textDragStart, setTextDragStart] = useState<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
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
  const hasMovedRef = useRef(false);

  const groupBounds = useMemo(
    () => computeSelectionGroupBounds(selectedLayerKeys, archetype, scene, canvasRef.current),
    [selectedLayerKeys, archetype, scene, canvasRef.current],
  );

  const pointerDown = useStudioPointerDownHandlers({
    scene, archetype, selectedLayerKeys, groupBounds, isItemLocked,
    toggleLayerSelection, selectSlot, selectSticker, selectText, selectCompound,
    setMultiDragStart, setMultiResizeSession, setResizingSession,
    setDraggingFreeformSlotId, setFreeformDragStart,
    setDraggingStickerId, setStickerDragStart,
    setDraggingCompoundId, setCompoundDragStart, setDraggingTextId, setTextDragStart,
  });

  const resetPointerSessions = () => {
    hasMovedRef.current = false;
    setDraggingTextId(null); setTextDragStart(null); setDraggingFreeformSlotId(null); setFreeformDragStart(null);
    setDraggingStickerId(null); setStickerDragStart(null); setDraggingCompoundId(null);
    setCompoundDragStart(null); setResizingSession(null); setMultiDragStart(null);
    setMultiResizeSession(null); setIsSnappedCenterX(false); setIsSnappedCenterY(false);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (multiResizeSession) {
      hasMovedRef.current = true;
      const box = computeMultiGroupResizeBox(multiResizeSession, ((e.clientX - multiResizeSession.mouseX) / rect.width) * 100, ((e.clientY - multiResizeSession.mouseY) / rect.height) * 100);
      if (multiResizeSession.initialSlots.length > 0) setSlots((p) => p.map((s) => ({ ...s, ...mapRelBoxPatch(multiResizeSession.initialSlots, box, s.id) })));
      if (multiResizeSession.initialStickers.length > 0) setStickers((p) => p.map((s) => ({ ...s, ...mapRelBoxPatch(multiResizeSession.initialStickers, box, s.id) })));
      if (multiResizeSession.initialTexts.length > 0) setTextOverlays((p) => p.map((t) => { const b = mapRelBoxPatch(multiResizeSession.initialTexts, box, t.id); return b ? { ...t, pos_x: b.pos_x, pos_y: b.pos_y, width_mode: 'custom' as const, width_percent: b.width_percent } : t; }));
      if (multiResizeSession.initialCompounds.length > 0) setCompoundLayers((p) => p.map((c) => ({ ...c, ...mapRelBoxPatch(multiResizeSession.initialCompounds, box, c.id) })));
      isDirtyRef.current = true;
      return;
    }
    if (multiDragStart) {
      hasMovedRef.current = true;
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
      hasMovedRef.current = true;
      const deltaX = ((e.clientX - resizingSession.mouseX) / rect.width) * 100;
      const deltaY = ((e.clientY - resizingSession.mouseY) / rect.height) * 100;
      const rectRatio = rect.height / rect.width;
      if (resizingSession.type === 'text') {
        const textDims = computeTextElementResize(resizingSession, deltaX, deltaY, rectRatio, e.altKey);
        setTextOverlays((p) => p.map((t) => (t.id === resizingSession.id ? { ...t, ...textDims } : t)));
      } else {
        const dims = computeSingleElementResize(resizingSession, deltaX, deltaY, rectRatio, e.shiftKey ? !isAspectLocked : isAspectLocked);
        if (resizingSession.type === 'slot') setSlots((p) => p.map((s) => (s.id === resizingSession.id ? { ...s, ...dims } : s)));
        else if (resizingSession.type === 'sticker') setStickers((p) => p.map((s) => (s.id === resizingSession.id ? { ...s, ...dims } : s)));
        else setCompoundLayers((p) => p.map((c) => (c.id === resizingSession.id ? { ...c, ...dims } : c)));
      }
      isDirtyRef.current = true;
      return;
    }
    if (draggingTextId && textDragStart) {
      hasMovedRef.current = true;
      let nx = Math.max(0, Math.min(100, Math.round((textDragStart.initialX + ((e.clientX - textDragStart.mouseX) / rect.width) * 100) * 10) / 10));
      let ny = Math.max(0, Math.min(100, Math.round((textDragStart.initialY + ((e.clientY - textDragStart.mouseY) / rect.height) * 100) * 10) / 10));
      const sx = Math.abs(nx - 50) <= 1.5;
      const sy = Math.abs(ny - 50) <= 1.5;
      if (sx) nx = 50;
      if (sy) ny = 50;
      setIsSnappedCenterX(sx);
      setIsSnappedCenterY(sy);
      setTextOverlays((p) => p.map((t) => (t.id === draggingTextId ? { ...t, pos_x: nx, pos_y: ny } : t)));
      isDirtyRef.current = true;
      return;
    }
    if (draggingFreeformSlotId && freeformDragStart) {
      hasMovedRef.current = true;
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
      hasMovedRef.current = true;
      const nx = Math.max(5, Math.min(95, Math.round(stickerDragStart.initialX + ((e.clientX - stickerDragStart.mouseX) / rect.width) * 100)));
      const ny = Math.max(5, Math.min(95, Math.round(stickerDragStart.initialY + ((e.clientY - stickerDragStart.mouseY) / rect.height) * 100)));
      setStickers((p) => p.map((s) => (s.id === draggingStickerId ? { ...s, pos_x: nx, pos_y: ny } : s)));
      isDirtyRef.current = true;
      return;
    }
    if (draggingCompoundId && compoundDragStart) {
      hasMovedRef.current = true;
      const nx = Math.max(5, Math.min(95, Math.round(compoundDragStart.initialX + ((e.clientX - compoundDragStart.mouseX) / rect.width) * 100)));
      const ny = Math.max(5, Math.min(95, Math.round(compoundDragStart.initialY + ((e.clientY - compoundDragStart.mouseY) / rect.height) * 100)));
      setCompoundLayers((p) => p.map((c) => (c.id === draggingCompoundId ? { ...c, pos_x: nx, pos_y: ny } : c)));
      isDirtyRef.current = true;
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    let shouldRecordSnapshot = false;
    let label = 'Edit Canvas';
    if (multiDragStart || multiResizeSession) {
      tryRelease(e.target, e.pointerId);
      label = multiResizeSession ? 'Resize Selected Layers' : 'Move Selected Layers';
      setMultiDragStart(null); setMultiResizeSession(null);
      shouldRecordSnapshot = true;
    }
    if (resizingSession) {
      tryRelease(e.target, e.pointerId);
      label = 'Resize Layer';
      setResizingSession(null);
      shouldRecordSnapshot = true;
    }
    if (draggingTextId) {
      tryRelease(e.target, e.pointerId);
      label = 'Move Text';
      setDraggingTextId(null);
      setTextDragStart(null);
      setIsSnappedCenterX(false);
      setIsSnappedCenterY(false);
      shouldRecordSnapshot = true;
    }
    if (draggingFreeformSlotId) {
      tryRelease(e.target, e.pointerId); setDraggingFreeformSlotId(null); setFreeformDragStart(null);
      setIsSnappedCenterX(false); setIsSnappedCenterY(false);
      label = 'Move Slot';
      shouldRecordSnapshot = true;
    }
    if (draggingStickerId) {
      tryRelease(e.target, e.pointerId); setDraggingStickerId(null); setStickerDragStart(null);
      label = 'Move Sticker';
      shouldRecordSnapshot = true;
    }
    if (draggingCompoundId) {
      tryRelease(e.target, e.pointerId); setDraggingCompoundId(null); setCompoundDragStart(null);
      label = 'Move Compound';
      shouldRecordSnapshot = true;
    }
    if (shouldRecordSnapshot && hasMovedRef.current) {
      recordStudioSnapshot(scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers, scene.folders, scene.rootOrder, label);
    }
    hasMovedRef.current = false;
  };

  return {
    draggingTextId, draggingFreeformSlotId, draggingStickerId, draggingCompoundId,
    isSnappedCenterX, isSnappedCenterY, groupBounds, resetPointerSessions,
    ...pointerDown, handleCanvasPointerMove, handleCanvasPointerUp,
  };
}
