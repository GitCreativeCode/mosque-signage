'use client';

import React, { useState } from 'react';
import type { CanvasBackgroundPreset } from '@/types/index';
import { CANVAS_BACKGROUNDS_REGISTRY } from '@/lib/posters/layout-engine';

interface StudioLayoutBackgroundPickerProps {
  readonly canvasBackground: CanvasBackgroundPreset;
  readonly canvasBackgroundCustom: string;
  readonly onChangeBackground: (bg: CanvasBackgroundPreset) => void;
  readonly onChangeBackgroundCustom?: ((custom: string) => void) | undefined;
}

/** Preset swatch grid and custom Solid/Gradient picker for canvas background. */
export function StudioLayoutBackgroundPicker({
  canvasBackground,
  canvasBackgroundCustom,
  onChangeBackground,
  onChangeBackgroundCustom,
}: StudioLayoutBackgroundPickerProps) {
  const isCustom = canvasBackground === 'custom';
  const isGradient = isCustom && (canvasBackgroundCustom.includes('gradient') || canvasBackgroundCustom.includes('linear-gradient'));
  const [customMode, setCustomMode] = useState<'solid' | 'gradient'>(isGradient ? 'gradient' : 'solid');
  const [solidColor, setSolidColor] = useState<string>(isCustom && !isGradient ? canvasBackgroundCustom || '#0f172a' : '#0f172a');
  const [gradStart, setGradStart] = useState<string>('#064e3b');
  const [gradEnd, setGradEnd] = useState<string>('#0f172a');
  const [gradDir, setGradDir] = useState<string>('135deg');

  const applySolid = (hex: string) => {
    setSolidColor(hex);
    onChangeBackground('custom');
    onChangeBackgroundCustom?.(hex);
  };

  const applyGradient = (start: string, end: string, dir: string) => {
    const val = `linear-gradient(${dir}, ${start}, ${end})`;
    onChangeBackground('custom');
    onChangeBackgroundCustom?.(val);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-3">
      <div className="flex items-center justify-between">
        <span className="block text-xs font-bold text-[var(--admin-text-secondary)]">Canvas Background</span>
        {isCustom && (
          <span className="text-[10px] font-mono text-[var(--admin-text-muted)] truncate max-w-[130px]">
            {isGradient ? 'Gradient' : solidColor}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CANVAS_BACKGROUNDS_REGISTRY.map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => onChangeBackground(bg.id)}
            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
              canvasBackground === bg.id
                ? 'border-amber-400 bg-[var(--admin-card)] text-[var(--admin-text-primary)] ring-1 ring-amber-400 shadow-sm'
                : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
            }`}
          >
            <div className="w-6 h-6 rounded-lg border border-white/10 shrink-0 shadow-inner" style={bg.previewBackground} />
            <span className="text-xs font-bold text-[var(--admin-text-primary)] truncate">{bg.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-2 border-t border-[var(--admin-border)]/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[var(--admin-text-muted)]">Custom Color or Gradient</span>
          <div className="flex items-center gap-1 bg-[var(--admin-card)] p-0.5 rounded-lg border border-[var(--admin-border)]">
            <button
              type="button"
              onClick={() => {
                setCustomMode('solid');
                applySolid(solidColor);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                customMode === 'solid' && isCustom
                  ? 'bg-amber-400 text-black shadow-xs font-bold'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
              }`}
            >
              Solid
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomMode('gradient');
                applyGradient(gradStart, gradEnd, gradDir);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                customMode === 'gradient' && isCustom
                  ? 'bg-amber-400 text-black shadow-xs font-bold'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
              }`}
            >
              Gradient
            </button>
          </div>
        </div>

        {customMode === 'solid' ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={solidColor}
              onChange={(e) => applySolid(e.target.value)}
              className="w-8 h-8 rounded-lg border border-[var(--admin-border)] bg-transparent cursor-pointer p-0.5 shrink-0"
              title="Pick Solid Color"
            />
            <input
              type="text"
              value={solidColor}
              onChange={(e) => applySolid(e.target.value)}
              placeholder="#0f172a"
              className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-xs font-mono text-[var(--admin-text-primary)] focus:outline-none focus:border-amber-400"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="color"
                  value={gradStart}
                  onChange={(e) => {
                    setGradStart(e.target.value);
                    applyGradient(e.target.value, gradEnd, gradDir);
                  }}
                  className="w-7 h-7 rounded-lg border border-[var(--admin-border)] bg-transparent cursor-pointer p-0.5"
                  title="Gradient Start Color"
                />
                <span className="text-[10px] text-[var(--admin-text-muted)] font-mono">{gradStart}</span>
              </div>
              <span className="text-[10px] text-[var(--admin-text-muted)]">➔</span>
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="color"
                  value={gradEnd}
                  onChange={(e) => {
                    setGradEnd(e.target.value);
                    applyGradient(gradStart, e.target.value, gradDir);
                  }}
                  className="w-7 h-7 rounded-lg border border-[var(--admin-border)] bg-transparent cursor-pointer p-0.5"
                  title="Gradient End Color"
                />
                <span className="text-[10px] text-[var(--admin-text-muted)] font-mono">{gradEnd}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-1 text-[10px]">
              {(['135deg', 'to bottom', 'to right'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setGradDir(d);
                    applyGradient(gradStart, gradEnd, d);
                  }}
                  className={`flex-1 py-1 rounded border text-center transition cursor-pointer ${
                    gradDir === d && isGradient
                      ? 'border-amber-400 bg-amber-400/20 text-amber-300 font-bold'
                      : 'border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)]'
                  }`}
                >
                  {d === '135deg' ? 'Diagonal' : d === 'to bottom' ? 'Vertical' : 'Horizontal'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
