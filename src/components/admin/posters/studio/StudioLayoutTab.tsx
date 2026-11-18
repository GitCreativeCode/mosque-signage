'use client';

import React from 'react';
import type { CanvasBackgroundPreset, LayoutGridGap, PosterLayoutArchetype, PosterSlotMedia } from '@/types/index';
import { assignFreeformDefaults, clampSplitRatio } from '@/lib/posters/layout-engine';
import { Columns, LayoutGrid, Maximize2, RotateCcw, Rows } from 'lucide-react';
import { StudioLayoutBackgroundPicker } from './StudioLayoutBackgroundPicker';

interface StudioLayoutTabProps {
  readonly archetype: PosterLayoutArchetype;
  readonly canvasBackground: CanvasBackgroundPreset;
  readonly canvasBackgroundCustom: string;
  readonly gridGap: LayoutGridGap;
  readonly splitRatio: number;
  readonly slots: PosterSlotMedia[];
  readonly onChangeArchetype: (arch: PosterLayoutArchetype) => void;
  readonly onEnableFreeform: (updatedSlots: PosterSlotMedia[]) => void;
  readonly onChangeBackground: (bg: CanvasBackgroundPreset) => void;
  readonly onChangeGridGap: (gap: LayoutGridGap) => void;
  readonly onToggleAllFitCover: () => void;
  readonly onChangeSplitRatio: (ratio: number) => void;
}

const ARCHETYPE_OPTIONS: ReadonlyArray<{
  readonly id: PosterLayoutArchetype;
  readonly label: string;
  readonly desc: string;
  readonly fullSpan?: boolean;
  readonly Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'split_vertical', label: 'Split Columns', desc: 'Side-by-side columns', Icon: Columns },
  { id: 'split_horizontal', label: 'Split Rows', desc: 'Stacked row banners', Icon: Rows },
  { id: 'hero_left_2_right', label: 'Hero Left', desc: 'Hero left + stack right', Icon: LayoutGrid },
  { id: 'hero_top_2_bottom', label: 'Hero Top', desc: 'Hero top + split bottom', Icon: LayoutGrid },
  { id: 'grid_4', label: 'Equal Grid (Quadrants)', desc: 'Balanced grid rectangles', fullSpan: true, Icon: LayoutGrid },
];

const GAP_OPTIONS: ReadonlyArray<{ readonly id: LayoutGridGap; readonly label: string }> = [
  { id: 'none', label: '0px' }, { id: 'subtle', label: '4px' }, { id: 'normal', label: '8px' }, { id: 'spacious', label: '16px' },
];

const RATIO_PRESETS = [
  { label: '50/50', val: 50 }, { label: '60/40', val: 60 }, { label: '70/30', val: 70 }, { label: '40/60', val: 40 },
] as const;

/** Inspector tab for partition archetypes, freeform mode, backgrounds, grid gap, and split ratio. */
export function StudioLayoutTab({
  archetype, canvasBackground, canvasBackgroundCustom, gridGap, splitRatio, slots,
  onChangeArchetype, onEnableFreeform, onChangeBackground, onChangeGridGap, onToggleAllFitCover, onChangeSplitRatio,
}: StudioLayoutTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] mb-1">Multi-Asset Layouts</h3>
        <p className="text-[11px] text-[var(--admin-text-muted)] mb-3">Select how your media items partition the 16:9 canvas</p>
        <div className="grid grid-cols-2 gap-2">
          {ARCHETYPE_OPTIONS.map(({ id, label, desc, fullSpan, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChangeArchetype(id)}
              className={`${fullSpan ? 'col-span-2 ' : ''}flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                archetype === id
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] shadow-sm ring-1 ring-[var(--admin-tab-active-border)]'
                  : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:border-[var(--admin-tab-active-border)]/60'
              }`}
            >
              <Icon className="w-4 h-4 opacity-80 mb-1" />
              <span className="font-bold text-xs">{label}</span>
              <span className="text-[10px] text-[var(--admin-text-muted)]">{desc}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => onEnableFreeform(slots.map((s, i) => assignFreeformDefaults(s, i, slots.length)))}
            className={`col-span-2 flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              archetype === 'freeform'
                ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] shadow-sm ring-1 ring-[var(--admin-tab-active-border)]'
                : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:border-[var(--admin-tab-active-border)]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20"><Maximize2 className="w-4 h-4" /></div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">Freeform Canvas</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500">Free Transform</span>
                </div>
                <span className="text-[10px] text-[var(--admin-text-muted)] block">Drag, resize, rotate &amp; layer cards freely</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <StudioLayoutBackgroundPicker canvasBackground={canvasBackground} canvasBackgroundCustom={canvasBackgroundCustom} onChangeBackground={onChangeBackground} />

      <div className="p-3.5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-2.5">
        <span className="block text-xs font-bold text-[var(--admin-text-secondary)]">Grid Gap &amp; Edge Spacing</span>
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          {GAP_OPTIONS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChangeGridGap(g.id)}
              className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                gridGap === g.id ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm' : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onToggleAllFitCover}
          className="w-full mt-1 py-1.5 px-2.5 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 opacity-70" />
          <span>Fill All Cells (Eliminate Dead Black Bars)</span>
        </button>
      </div>

      {slots.length === 2 && (
        <div className="p-3.5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--admin-text-secondary)]">Split Ratio</span>
            <span className="font-mono font-bold text-[var(--admin-text-primary)]">{splitRatio}% / {100 - splitRatio}%</span>
          </div>
          <input type="range" min={20} max={80} value={splitRatio} onChange={(e) => onChangeSplitRatio(clampSplitRatio(parseInt(e.target.value, 10)))} className="w-full accent-[var(--admin-btn-primary-bg)] cursor-pointer" />
          <div className="flex items-center gap-1.5 pt-1">
            {RATIO_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChangeSplitRatio(p.val)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                  splitRatio === p.val ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm' : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface)]'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button type="button" onClick={() => onChangeSplitRatio(50)} className="p-1 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]" title="Reset to 50%">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
