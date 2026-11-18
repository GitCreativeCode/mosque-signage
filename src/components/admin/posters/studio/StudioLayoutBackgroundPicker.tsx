'use client';

import React from 'react';
import type { CanvasBackgroundPreset } from '@/types/index';
import { CANVAS_BACKGROUNDS_REGISTRY } from '@/lib/posters/layout-engine';

interface StudioLayoutBackgroundPickerProps {
  readonly canvasBackground: CanvasBackgroundPreset;
  readonly canvasBackgroundCustom: string;
  readonly onChangeBackground: (bg: CanvasBackgroundPreset) => void;
}

/** Preset swatch grid for canvas background fills and sacred Islamic geometric patterns. */
export function StudioLayoutBackgroundPicker({
  canvasBackground,
  canvasBackgroundCustom,
  onChangeBackground,
}: StudioLayoutBackgroundPickerProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="block text-xs font-bold text-[var(--admin-text-secondary)]">
          Canvas Background &amp; Sacred Patterns
        </span>
        {canvasBackground === 'custom' && (
          <span className="text-[10px] font-mono text-[var(--admin-text-muted)]">
            {canvasBackgroundCustom || '#000000'}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {CANVAS_BACKGROUNDS_REGISTRY.map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => onChangeBackground(bg.id)}
            className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              canvasBackground === bg.id
                ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] ring-1 ring-[var(--admin-tab-active-border)] shadow-sm'
                : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
            }`}
            title={bg.description}
          >
            <div className="w-full h-7 rounded-lg border border-white/10 shrink-0 shadow-inner" style={bg.previewBackground} />
            <span className="text-[10px] font-semibold truncate w-full text-center">{bg.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

