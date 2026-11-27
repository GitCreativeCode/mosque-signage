'use client';

import React, { useState, useEffect } from 'react';
import { Minus, Plus, RotateCcw, Info, X } from 'lucide-react';
import type { PosterLayoutArchetype } from '@/types/index';
import type { StudioSceneState } from '@/lib/posters/studio-types';

interface StudioCanvasBottomBarProps {
  readonly scene: StudioSceneState;
  readonly archetype: PosterLayoutArchetype;
  readonly durationSeconds?: number | undefined;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  readonly maxPanX: number;
  readonly onSetPanXDirect: (px: number) => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onSetZoomLevel: (z: number) => void;
  readonly onResetViewport: () => void;
  readonly hasSelectedEntity: boolean;
  readonly onDeselectAll: () => void;
}

function getArchetypeLabel(arch: PosterLayoutArchetype): string {
  switch (arch) {
    case 'freeform': return 'Freeform';
    case 'split_vertical': return 'Split V';
    case 'split_horizontal': return 'Split H';
    case 'grid_4': return '2×2 Grid';
    case 'hero_left_2_right': return 'Hero Left';
    case 'hero_top_2_bottom': return 'Hero Top';
    case 'masonry_flow': return 'Masonry';
    case 'single':
    default: return 'Single';
  }
}

/** Docked bottom status bar connected to the bottom of the studio stage. */
export function StudioCanvasBottomBar(props: StudioCanvasBottomBarProps) {
  const { zoom, panX, maxPanX, onSetPanXDirect, onZoomIn, onZoomOut, onSetZoomLevel, onResetViewport, hasSelectedEntity, onDeselectAll, scene, archetype } = props;
  const zoomPct = Math.round(zoom * 100);
  const [inputValue, setInputValue] = useState<string>(String(zoomPct));
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const isDefaultView = zoom === 1.0 && panX === 0 && props.panY === 0;

  useEffect(() => {
    setInputValue(String(zoomPct));
  }, [zoomPct]);

  const commitZoomInput = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed)) {
      setInputValue(String(zoomPct));
      return;
    }
    const clamped = Math.min(200, Math.max(50, parsed));
    onSetZoomLevel(clamped / 100);
    setInputValue(String(clamped));
  };

  const isDraggingTrack = React.useRef(false);
  const dragStartRef = React.useRef<{ clientX: number; startPanX: number } | null>(null);

  const thumbWidthPct = Math.max(15, Math.min(75, Math.round((1 / zoom) * 100)));
  const availableTrackPct = 100 - thumbWidthPct;
  const panFraction = maxPanX > 0 ? (panX + maxPanX) / (2 * maxPanX) : 0.5;
  const thumbLeftPct = panFraction * availableTrackPct;

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (maxPanX <= 0 || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const trackEl = e.currentTarget;
    trackEl.setPointerCapture(e.pointerId);
    isDraggingTrack.current = true;
    const rect = trackEl.getBoundingClientRect();
    const thumbWidthPx = (thumbWidthPct / 100) * rect.width;
    const availableTrackPx = Math.max(1, rect.width - thumbWidthPx);
    const isThumb = (e.target as HTMLElement).getAttribute('data-thumb') === 'true';

    if (isThumb) {
      dragStartRef.current = { clientX: e.clientX, startPanX: panX };
    } else {
      const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left - thumbWidthPx / 2) / availableTrackPx));
      const targetPan = Math.round(-maxPanX + clickRatio * (2 * maxPanX));
      onSetPanXDirect(targetPan);
      dragStartRef.current = { clientX: e.clientX, startPanX: targetPan };
    }
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingTrack.current || !dragStartRef.current || maxPanX <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const thumbWidthPx = (thumbWidthPct / 100) * rect.width;
    const availableTrackPx = Math.max(1, rect.width - thumbWidthPx);
    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaPan = (deltaX / availableTrackPx) * (2 * maxPanX);
    const newPan = Math.max(-maxPanX, Math.min(maxPanX, Math.round(dragStartRef.current.startPanX + deltaPan)));
    onSetPanXDirect(newPan);
  };

  const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingTrack.current) {
      isDraggingTrack.current = false;
      dragStartRef.current = null;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    }
  };

  return (
    <div className="w-full border-t border-[var(--admin-border)] bg-[var(--admin-card)]/95 backdrop-blur-md px-4 py-2 relative select-none flex items-center justify-between gap-3 text-xs z-30">
      {/* Top Edge Horizontal Scroll Track when zoomed in */}
      {zoom > 1.0 && maxPanX > 0 && (
        <div
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerUp}
          onPointerCancel={handleTrackPointerUp}
          title="Drag thumb or click track to scroll canvas horizontally"
          className="absolute top-0 left-0 right-0 h-2 bg-black/60 hover:h-2.5 transition-all cursor-pointer group touch-none"
        >
          <div
            data-thumb="true"
            style={{ left: `${thumbLeftPct}%`, width: `${thumbWidthPct}%` }}
            className="absolute top-0 bottom-0 bg-amber-400 rounded-full group-hover:bg-amber-300 transition-colors shadow-xs"
          />
        </div>
      )}

      {/* Bottom Left: Interactive Clamped Numeric Zoom Input & Reset */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-lg p-0.5 shadow-2xs text-[11px]">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 0.5}
            title="Zoom Out (Ctrl + Scroll Down)"
            aria-label="Zoom Out"
            className="p-1 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-card)] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </button>
          <div className="flex items-center px-1 font-mono">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={commitZoomInput}
              onKeyDown={(e) => { if (e.key === 'Enter') commitZoomInput(); }}
              aria-label="Zoom percentage"
              className="w-8 text-center font-bold bg-transparent border-0 p-0 text-[11px] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] rounded"
            />
            <span className="text-[10px] text-[var(--admin-text-muted)] ml-0.5">%</span>
          </div>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 2.0}
            title="Zoom In (Ctrl + Scroll Up)"
            aria-label="Zoom In"
            className="p-1 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-card)] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
          {!isDefaultView && (
            <button
              type="button"
              onClick={onResetViewport}
              title="Reset View to 100% (or hold Space to pan)"
              aria-label="Reset View to 100%"
              className="flex items-center gap-1 px-1.5 py-0.5 text-amber-400 hover:text-amber-300 font-semibold text-[10px] transition cursor-pointer ml-0.5"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
        <span className="hidden md:inline-block text-[10px] text-[var(--admin-text-muted)]">
          Space+Drag to Pan • Ctrl+Scroll to Zoom
        </span>
      </div>

      {/* Bottom Right: Selection Clear & Information "(i)" Popover */}
      <div className="relative flex items-center gap-2">
        {hasSelectedEntity && (
          <button
            type="button"
            onClick={onDeselectAll}
            className="px-2 py-1 rounded-md bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] border border-[var(--admin-border)] text-[10px] font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer shadow-2xs"
          >
            Deselect (Esc)
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowInfo((prev) => !prev)}
          title="Slide Specifications & Technical Summary"
          aria-label="Slide Information"
          className={`w-7 h-7 rounded-full flex items-center justify-center border transition cursor-pointer shadow-2xs ${
            showInfo
              ? 'bg-amber-500 text-slate-950 border-yellow-300 font-bold'
              : 'bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-amber-400 border-[var(--admin-border)]'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        {showInfo && (
          <div className="absolute bottom-11 right-0 w-72 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl shadow-2xl p-3 z-50 text-[11px] animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--admin-border)]">
              <span className="font-bold text-[var(--admin-text-primary)]">Slide Specifications</span>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="p-1 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 text-[var(--admin-text-secondary)]">
              <div className="flex justify-between">
                <span className="text-[var(--admin-text-muted)]">Canvas Resolution:</span>
                <span className="font-mono font-semibold text-[var(--admin-text-primary)]">1920 × 1080 FHD (16:9)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--admin-text-muted)]">Layout Archetype:</span>
                <span className="font-semibold text-amber-400">{getArchetypeLabel(archetype)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--admin-text-muted)]">Screen Dwell Time:</span>
                <span className="font-semibold text-[var(--admin-text-primary)]">{props.durationSeconds ?? 15}s</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[var(--admin-border)]/60">
                <span className="text-[var(--admin-text-muted)]">Active Layers:</span>
                <span className="font-mono text-[var(--admin-text-primary)]">
                  {scene.slots.length}M • {scene.textOverlays.length}T • {scene.stickers.length}S
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
