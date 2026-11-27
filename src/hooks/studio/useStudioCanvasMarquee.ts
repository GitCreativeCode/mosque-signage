'use client';

import { useState } from 'react';
import type { PosterLayoutArchetype } from '@/types/index';
import type { StudioSceneState } from '@/lib/posters/studio-types';

interface UseStudioCanvasMarqueeParams {
  readonly scene: StudioSceneState;
  readonly archetype: PosterLayoutArchetype;
  readonly canvasRef: React.RefObject<HTMLDivElement | null>;
  readonly isPanningOrSpace: boolean;
  readonly onCanvasPointerMove: (e: React.PointerEvent) => void;
  readonly onCanvasPointerUp: (e: React.PointerEvent) => void;
  readonly onSelectMultipleKeys?: ((keys: string[]) => void) | undefined;
  readonly onDeselectAll: () => void;
  readonly handleStagePointerDown: (e: React.PointerEvent) => void;
}

export function useStudioCanvasMarquee({
  scene,
  archetype,
  canvasRef,
  isPanningOrSpace,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onSelectMultipleKeys,
  onDeselectAll,
  handleStagePointerDown,
}: UseStudioCanvasMarqueeParams) {
  const [marqueeSession, setMarqueeSession] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    handleStagePointerDown(e);
    if (e.button !== 0 || isPanningOrSpace) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-studio-layer="true"], [data-resize-handle="true"], button, input, textarea, a, select')) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMarqueeSession({ startX: x, startY: y, currentX: x, currentY: y });
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    onCanvasPointerMove(e);
    if (marqueeSession && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setMarqueeSession((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
    onCanvasPointerUp(e);
    if (!marqueeSession) return;
    const x1 = Math.min(marqueeSession.startX, marqueeSession.currentX);
    const x2 = Math.max(marqueeSession.startX, marqueeSession.currentX);
    const y1 = Math.min(marqueeSession.startY, marqueeSession.currentY);
    const y2 = Math.max(marqueeSession.startY, marqueeSession.currentY);
    setMarqueeSession(null);
    if (Math.abs(x2 - x1) <= 1.5 && Math.abs(y2 - y1) <= 1.5) return;

    const hits: string[] = [];
    for (const stk of scene.stickers) {
      const w = stk.width_percent || 20;
      const h = stk.height_percent || 20;
      if (stk.pos_x + w / 2 > x1 && stk.pos_x - w / 2 < x2 && stk.pos_y + h / 2 > y1 && stk.pos_y - h / 2 < y2) {
        hits.push(`sticker:${stk.id}`);
      }
    }
    for (const t of scene.textOverlays) {
      const w = t.width_mode === 'custom' && t.width_percent ? t.width_percent : 40;
      const px = t.pos_x ?? 50;
      const py = t.pos_y ?? 50;
      if (px + w / 2 > x1 && px - w / 2 < x2 && py + 5 > y1 && py - 5 < y2) {
        hits.push(`text:${t.id}`);
      }
    }
    if (archetype === 'freeform') {
      for (const s of scene.slots) {
        const w = s.width_percent ?? 50;
        const h = s.height_percent ?? 50;
        const px = s.pos_x ?? 50;
        const py = s.pos_y ?? 50;
        if (px + w / 2 > x1 && px - w / 2 < x2 && py + h / 2 > y1 && py - h / 2 < y2) {
          hits.push(`slot:${s.id}`);
        }
      }
    }
    for (const c of scene.compoundLayers) {
      const w = c.width_percent || 40;
      const h = c.height_percent || 40;
      if (c.pos_x + w / 2 > x1 && c.pos_x - w / 2 < x2 && c.pos_y + h / 2 > y1 && c.pos_y - h / 2 < y2) {
        hits.push(`compound:${c.id}`);
      }
    }
    if (hits.length > 0) {
      onSelectMultipleKeys?.(hits);
    } else {
      onDeselectAll();
    }
  };

  return { marqueeSession, handleCanvasPointerDown, handleStagePointerMove, handleStagePointerUp };
}

