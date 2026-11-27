'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface StudioCanvasViewportState {
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  readonly maxPanX: number;
  readonly isSpacePressed: boolean;
  readonly isPanning: boolean;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly resetViewport: () => void;
  readonly setZoomLevel: (z: number) => void;
  readonly setPanXDirect: (targetPanX: number) => void;
  readonly viewportStyle: React.CSSProperties;
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
}

function computePanLimits(el: HTMLDivElement | null, z: number): { readonly maxX: number; readonly maxY: number } {
  if (!el || z <= 1.0) return { maxX: 0, maxY: 0 };
  const w = el.clientWidth || 960;
  const h = el.clientHeight || 540;
  const maxX = Math.max(0, Math.round((w * (z - 1)) / 2));
  const maxY = Math.max(0, Math.round((h * (z - 1)) / 2));
  return { maxX, maxY };
}

/**
 * Handles cursor-anchored zoom (50% to 200%), Spacebar + Drag, Middle-Click drag,
 * and Alt+Scroll horizontal panning for the live 16:9 stage preview canvas.
 */
export function useStudioCanvasViewport(): StudioCanvasViewportState {
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number } | null>(null);

  const zoomIn = useCallback(() => {
    setZoom((prev) => {
      const nextZoom = Math.min(2.0, Number((prev + 0.1).toFixed(2)));
      const { maxX, maxY } = computePanLimits(containerRef.current, nextZoom);
      setPanX((px) => Math.max(-maxX, Math.min(maxX, px)));
      setPanY((py) => Math.max(-maxY, Math.min(maxY, py)));
      return nextZoom;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const nextZoom = Math.max(0.5, Number((prev - 0.1).toFixed(2)));
      const { maxX, maxY } = computePanLimits(containerRef.current, nextZoom);
      setPanX((px) => Math.max(-maxX, Math.min(maxX, px)));
      setPanY((py) => Math.max(-maxY, Math.min(maxY, py)));
      return nextZoom;
    });
  }, []);

  const resetViewport = useCallback(() => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  }, []);

  const setZoomLevel = useCallback((z: number) => {
    const nextZoom = Math.min(2.0, Math.max(0.5, Number(z.toFixed(2))));
    const { maxX, maxY } = computePanLimits(containerRef.current, nextZoom);
    setZoom(nextZoom);
    setPanX((px) => Math.max(-maxX, Math.min(maxX, px)));
    setPanY((py) => Math.max(-maxY, Math.min(maxY, py)));
  }, []);

  const setPanXDirect = useCallback((targetPanX: number) => {
    const { maxX } = computePanLimits(containerRef.current, zoom);
    setPanX(Math.max(-maxX, Math.min(maxX, targetPanX)));
  }, [zoom]);

  // Spacebar toggle for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement | null)?.isContentEditable) return;
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Cursor-anchored wheel zooming & scroll panning
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const cursorX = e.clientX - rect.left - rect.width / 2;
        const cursorY = e.clientY - rect.top - rect.height / 2;
        const delta = e.deltaY < 0 ? 0.08 : -0.08;

        setZoom((prevZoom) => {
          const nextZoom = Math.min(2.0, Math.max(0.5, Number((prevZoom + delta).toFixed(2))));
          const { maxX, maxY } = computePanLimits(el, nextZoom);
          if (nextZoom !== prevZoom) {
            const scaleDiff = nextZoom / prevZoom;
            setPanX((px) => Math.max(-maxX, Math.min(maxX, px - (cursorX - px) * (scaleDiff - 1))));
            setPanY((py) => Math.max(-maxY, Math.min(maxY, py - (cursorY - py) * (scaleDiff - 1))));
          } else {
            setPanX((px) => Math.max(-maxX, Math.min(maxX, px)));
            setPanY((py) => Math.max(-maxY, Math.min(maxY, py)));
          }
          return nextZoom;
        });
        return;
      }

      if (e.altKey) {
        e.preventDefault();
        setZoom((curZoom) => {
          const { maxX } = computePanLimits(el, curZoom);
          setPanX((prev) => Math.max(-maxX, Math.min(maxX, prev - e.deltaY * 0.8)));
          return curZoom;
        });
        return;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Pointer event listeners for space+drag and middle-click drag
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (isSpacePressed || e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY, startPanX: panX, startPanY: panY };
        el.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!panStartRef.current) return;
      const { maxX, maxY } = computePanLimits(el, zoom);
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanX(Math.max(-maxX, Math.min(maxX, panStartRef.current.startPanX + dx)));
      setPanY(Math.max(-maxY, Math.min(maxY, panStartRef.current.startPanY + dy)));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (panStartRef.current) {
        panStartRef.current = null;
        setIsPanning(false);
        try { el.releasePointerCapture(e.pointerId); } catch {}
      }
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isSpacePressed, panX, panY]);

  const viewportStyle: React.CSSProperties = {
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: 'center center',
    transition: !isPanning && zoom === 1.0 && panX === 0 && panY === 0 ? 'transform 0.15s ease-out' : undefined,
  };

  const maxPanX = computePanLimits(containerRef.current, zoom).maxX;

  return {
    zoom,
    panX,
    panY,
    maxPanX,
    isSpacePressed,
    isPanning,
    zoomIn,
    zoomOut,
    resetViewport,
    setZoomLevel,
    setPanXDirect,
    viewportStyle,
    containerRef,
  };
}
