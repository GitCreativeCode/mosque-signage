'use client';

import type { MultiDragSession, MultiResizeSession, DragBoundsStart, ResizeHandle, ResizeSession, StudioSceneState } from '@/lib/posters/studio-types';
import type { PosterLayoutArchetype } from '@/types/index';

interface UseStudioPointerDownHandlersParams {
  readonly scene: StudioSceneState;
  readonly archetype: PosterLayoutArchetype;
  readonly selectedLayerKeys: readonly string[];
  readonly groupBounds: { left: number; top: number; width: number; height: number } | null;
  readonly isItemLocked: (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) => boolean;
  readonly toggleLayerSelection: (key: string) => void;
  readonly selectSlot: (idx: number | null) => void;
  readonly selectSticker: (idx: number | null) => void;
  readonly selectText: (idx: number | null) => void;
  readonly selectCompound: (id: string | null) => void;
  readonly setMultiDragStart: (s: MultiDragSession | null) => void;
  readonly setMultiResizeSession: (s: MultiResizeSession | null) => void;
  readonly setResizingSession: (s: ResizeSession | null) => void;
  readonly setDraggingFreeformSlotId: (id: string | null) => void;
  readonly setFreeformDragStart: (s: DragBoundsStart | null) => void;
  readonly setDraggingStickerId: (id: string | null) => void;
  readonly setStickerDragStart: (s: DragBoundsStart | null) => void;
  readonly setDraggingCompoundId: (id: string | null) => void;
  readonly setCompoundDragStart: (s: { mouseX: number; mouseY: number; initialX: number; initialY: number } | null) => void;
  readonly setDraggingTextId: (id: string | null) => void;
  readonly setTextDragStart: (s: { mouseX: number; mouseY: number; initialX: number; initialY: number } | null) => void;
}

const tryCapture = (el: EventTarget | null, id: number) => {
  try { (el as HTMLElement)?.setPointerCapture(id); } catch {}
};

/** Encapsulates canvas pointer-down selection, multi-drag, and resize session initiation. */
export function useStudioPointerDownHandlers(p: UseStudioPointerDownHandlersParams) {
  const handleMultiDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    tryCapture(e.currentTarget, e.pointerId);
    p.setMultiDragStart({
      mouseX: e.clientX, mouseY: e.clientY,
      initialSlots: (p.archetype === 'freeform' ? p.scene.slots : []).filter((s) => p.selectedLayerKeys.includes(`slot:${s.id}`) && !p.isItemLocked(s)).map((s) => ({ id: s.id, x: s.pos_x ?? 50, y: s.pos_y ?? 50 })),
      initialStickers: p.scene.stickers.filter((stk) => p.selectedLayerKeys.includes(`sticker:${stk.id}`) && !p.isItemLocked(stk)).map((stk) => ({ id: stk.id, x: stk.pos_x, y: stk.pos_y })),
      initialTexts: p.scene.textOverlays.filter((t) => p.selectedLayerKeys.includes(`text:${t.id}`) && !p.isItemLocked(t)).map((t) => ({ id: t.id, x: t.pos_x ?? 50, y: t.pos_y ?? 50 })),
      initialCompounds: p.scene.compoundLayers.filter((c) => p.selectedLayerKeys.includes(`compound:${c.id}`) && !p.isItemLocked(c)).map((c) => ({ id: c.id, x: c.pos_x, y: c.pos_y })),
    });
  };

  const handleStartMultiResizing = (e: React.PointerEvent, handle: ResizeHandle) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (!p.groupBounds) return;
    tryCapture(e.target, e.pointerId);
    const gb = p.groupBounds;
    const rel = (x: number, y: number, w: number, h: number) => ({
      relX: (x - gb.left) / gb.width, relY: (y - gb.top) / gb.height, relW: w / gb.width, relH: h / gb.height,
    });
    p.setMultiResizeSession({
      handle, mouseX: e.clientX, mouseY: e.clientY, initialGroup: { ...gb },
      initialSlots: (p.archetype === 'freeform' ? p.scene.slots : []).filter((s) => p.selectedLayerKeys.includes(`slot:${s.id}`) && !p.isItemLocked(s)).map((s) => ({ id: s.id, ...rel(s.pos_x ?? 50, s.pos_y ?? 50, s.width_percent ?? 40, s.height_percent ?? 40) })),
      initialStickers: p.scene.stickers.filter((stk) => p.selectedLayerKeys.includes(`sticker:${stk.id}`) && !p.isItemLocked(stk)).map((stk) => ({ id: stk.id, ...rel(stk.pos_x, stk.pos_y, stk.width_percent, stk.height_percent) })),
      initialTexts: p.scene.textOverlays.filter((t) => p.selectedLayerKeys.includes(`text:${t.id}`) && !p.isItemLocked(t)).map((t) => ({ id: t.id, ...rel(t.pos_x ?? 50, t.pos_y ?? 50, t.width_mode === 'custom' && t.width_percent ? t.width_percent : 40, 10) })),
      initialCompounds: p.scene.compoundLayers.filter((c) => p.selectedLayerKeys.includes(`compound:${c.id}`) && !p.isItemLocked(c)).map((c) => ({ id: c.id, ...rel(c.pos_x, c.pos_y, c.width_percent, c.height_percent) })),
    });
  };

  const handleStartResizing = (
    e: React.PointerEvent,
    type: ResizeSession['type'],
    id: string,
    handle: ResizeHandle,
    init: {
      pos_x: number;
      pos_y: number;
      width_percent: number;
      height_percent: number;
      font_size?: number | undefined;
      scale_x?: number | undefined;
      scale_y?: number | undefined;
      rotation?: number | undefined;
    },
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const locked = type === 'slot' ? p.isItemLocked(p.scene.slots.find((s) => s.id === id))
      : type === 'sticker' ? p.isItemLocked(p.scene.stickers.find((s) => s.id === id))
      : type === 'compound' ? p.isItemLocked(p.scene.compoundLayers.find((c) => c.id === id))
      : p.isItemLocked(p.scene.textOverlays.find((t) => t.id === id));
    if (locked) return;
    tryCapture(e.target, e.pointerId);
    const w = init.width_percent || 40;
    const h = init.height_percent || 40;
    p.setResizingSession({
      type,
      id,
      handle,
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: init.pos_x ?? 50,
      initialY: init.pos_y ?? 50,
      initialW: w,
      initialH: h,
      aspectRatio: Math.max(0.05, w / Math.max(1, h)),
      initialFontSize: init.font_size,
      initialScaleX: init.scale_x,
      initialScaleY: init.scale_y,
      rotation: init.rotation,
    });
  };

  const handleFreeformSlotPointerDown = (e: React.PointerEvent, slotId: string, idx: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (e.shiftKey) { p.toggleLayerSelection(`slot:${slotId}`); return; }
    if (p.selectedLayerKeys.length > 1 && p.selectedLayerKeys.includes(`slot:${slotId}`)) { handleMultiDragStart(e); return; }
    p.selectSlot(idx);
    const s = p.scene.slots[idx];
    if (!s || p.isItemLocked(s)) return;
    tryCapture(e.currentTarget, e.pointerId);
    p.setDraggingFreeformSlotId(slotId);
    p.setFreeformDragStart({ mouseX: e.clientX, mouseY: e.clientY, initialX: s.pos_x ?? 50, initialY: s.pos_y ?? 50, initialW: s.width_percent ?? 40, initialH: s.height_percent ?? 40 });
  };

  const handleStickerPointerDown = (e: React.PointerEvent, stk: StudioSceneState['stickers'][number], idx: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (e.shiftKey) { p.toggleLayerSelection(`sticker:${stk.id}`); return; }
    if (p.selectedLayerKeys.length > 1 && p.selectedLayerKeys.includes(`sticker:${stk.id}`)) { handleMultiDragStart(e); return; }
    p.selectSticker(idx);
    if (p.isItemLocked(stk)) return;
    tryCapture(e.currentTarget, e.pointerId);
    p.setDraggingStickerId(stk.id);
    p.setStickerDragStart({ mouseX: e.clientX, mouseY: e.clientY, initialX: stk.pos_x, initialY: stk.pos_y, initialW: stk.width_percent, initialH: stk.height_percent });
  };

  const handleCompoundPointerDown = (e: React.PointerEvent, compoundId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const c = p.scene.compoundLayers.find((cp) => cp.id === compoundId);
    if (e.shiftKey) { p.toggleLayerSelection(`compound:${compoundId}`); return; }
    if (p.selectedLayerKeys.length > 1 && p.selectedLayerKeys.includes(`compound:${compoundId}`)) { handleMultiDragStart(e); return; }
    p.selectCompound(compoundId);
    if (!c || p.isItemLocked(c)) return;
    tryCapture(e.currentTarget, e.pointerId);
    p.setDraggingCompoundId(compoundId);
    p.setCompoundDragStart({ mouseX: e.clientX, mouseY: e.clientY, initialX: c.pos_x, initialY: c.pos_y });
  };

  const handleTextPointerDown = (e: React.PointerEvent, textId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const idx = p.scene.textOverlays.findIndex((t) => t.id === textId);
    if (idx === -1) return;
    if (e.shiftKey) { p.toggleLayerSelection(`text:${textId}`); return; }
    if (p.selectedLayerKeys.length > 1 && p.selectedLayerKeys.includes(`text:${textId}`)) { handleMultiDragStart(e); return; }
    p.selectText(idx);
    const ov = p.scene.textOverlays[idx];
    if (!ov || p.isItemLocked(ov)) return;
    tryCapture(e.currentTarget, e.pointerId);
    p.setDraggingTextId(textId);
    p.setTextDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: ov.pos_x ?? 50,
      initialY: ov.pos_y !== undefined ? ov.pos_y : ov.position === 'top_banner' ? 12 : 85,
    });
  };

  return {
    handleMultiDragStart, handleStartMultiResizing, handleStartResizing,
    handleFreeformSlotPointerDown, handleStickerPointerDown, handleCompoundPointerDown, handleTextPointerDown,
  };
}

