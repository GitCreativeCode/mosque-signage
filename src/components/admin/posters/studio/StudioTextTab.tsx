'use client';

import React from 'react';
import type { PosterTextOverlay } from '@/types/index';
import { Plus, RotateCw, Trash2, Edit3, ChevronDown, ChevronRight } from 'lucide-react';
import { StudioTextStyleControls } from './StudioTextStyleControls';
import { StudioTextStretchControls } from './StudioTextStretchControls';
import { StudioNumericInput } from './StudioNumericInput';

interface StudioTextTabProps {
  readonly textOverlays: PosterTextOverlay[];
  readonly selectedTextId?: string | null | undefined;
  readonly onSelectText?: ((id: string) => void) | undefined;
  readonly onAddBanner: () => void;
  readonly onDeleteBanner: (index: number) => void;
  readonly onPatchOverlay: (index: number, patch: Partial<PosterTextOverlay>) => void;
  readonly onEyeDropper: (index: number) => void;
  readonly onBgEyeDropper: (index: number) => void;
}

/** Inspector tab for rectangular text banners, conditionally expanding styles for selected text. */
export function StudioTextTab({
  textOverlays,
  selectedTextId,
  onSelectText,
  onAddBanner,
  onDeleteBanner,
  onPatchOverlay,
  onEyeDropper,
  onBgEyeDropper,
}: StudioTextTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--admin-border)]/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
            Text Banners
          </h3>
          <button
            type="button"
            onClick={onAddBanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Banner</span>
          </button>
        </div>
        <p className="text-[11px] text-[var(--admin-text-muted)] pt-0.5">
          Lower-thirds, titles, Hadith quotes, or event captions
        </p>
      </div>

      {textOverlays.length === 0 ? (
        <div className="p-4 rounded-2xl bg-[var(--admin-surface)] border border-dashed border-[var(--admin-border)] text-center text-xs text-[var(--admin-text-muted)]">
          No text overlays added yet. Click &quot;Add Banner&quot; above to create high-contrast rectangular text.
        </div>
      ) : (
        <div className="space-y-2.5">
          {textOverlays.map((ov, ovIdx) => {
            const isSelected = selectedTextId === ov.id;

            if (!isSelected) {
              return (
                <div
                  key={ov.id}
                  onClick={() => onSelectText?.(ov.id)}
                  className="p-2.5 rounded-xl bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] border border-[var(--admin-border)] flex items-center justify-between gap-2 cursor-pointer transition select-none group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--admin-text-muted)] group-hover:text-amber-400 shrink-0" />
                    <span className="text-[11px] font-bold text-amber-400 shrink-0">#{ovIdx + 1}</span>
                    <span className="text-xs text-[var(--admin-text-primary)] truncate font-medium">
                      {ov.text ? ov.text.replace(/\n/g, ' ') : '(Empty banner)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectText?.(ov.id);
                      }}
                      className="p-1 text-[var(--admin-text-muted)] hover:text-amber-400 cursor-pointer"
                      title="Edit banner styles"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBanner(ovIdx);
                      }}
                      className="p-1 text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Delete banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={ov.id} className="p-3.5 rounded-2xl bg-[var(--admin-surface)] border-2 border-amber-400/80 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-[var(--admin-text-primary)]">Banner #{ovIdx + 1} (Selected)</span>
                  </div>
                  <button type="button" onClick={() => onDeleteBanner(ovIdx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer" title="Delete banner">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <textarea
                  value={ov.text}
                  onChange={(e) => onPatchOverlay(ovIdx, { text: e.target.value })}
                  placeholder="Type banner message (Enter for new row)..."
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:border-amber-400 resize-y min-h-[44px]"
                />

                <StudioTextStyleControls
                  overlay={ov}
                  overlayIndex={ovIdx}
                  onPatchOverlay={onPatchOverlay}
                  onEyeDropper={onEyeDropper}
                  onBgEyeDropper={onBgEyeDropper}
                />

                <StudioTextStretchControls
                  overlay={ov}
                  overlayIndex={ovIdx}
                  onPatchOverlay={onPatchOverlay}
                />

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-[var(--admin-text-secondary)]">
                    <span className="flex items-center gap-1 font-semibold"><RotateCw className="w-3 h-3 opacity-70" /><span>Rotation</span></span>
                    <div className="flex items-center gap-1 font-mono">
                      <StudioNumericInput
                        min={-180}
                        max={180}
                        value={ov.rotation ?? 0}
                        onChange={(val) => onPatchOverlay(ovIdx, { rotation: val })}
                        className="w-10 text-center font-bold bg-[var(--admin-card)] border border-[var(--admin-border)] rounded py-0.5 px-1 text-[10px] text-[var(--admin-text-primary)]"
                      />
                      <span className="text-[10px] text-[var(--admin-text-muted)]">°</span>
                      {(ov.rotation ?? 0) !== 0 && (
                        <button type="button" onClick={() => onPatchOverlay(ovIdx, { rotation: 0 })} className="text-[9px] text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer ml-1">
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={ov.rotation || 0}
                    onChange={(e) => onPatchOverlay(ovIdx, { rotation: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--admin-text-secondary)] mb-1">
                      <span>Vertical (Y)</span>
                      <div className="flex items-center gap-0.5 font-mono">
                        <StudioNumericInput
                          min={5}
                          max={95}
                          value={ov.pos_y ?? 15}
                          onChange={(val) => onPatchOverlay(ovIdx, { pos_y: val, position: 'custom' })}
                          className="w-8 text-center font-bold bg-[var(--admin-card)] border border-[var(--admin-border)] rounded py-0.5 px-0.5 text-[10px] text-[var(--admin-text-primary)]"
                        />
                        <span className="text-[10px] text-[var(--admin-text-muted)]">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={ov.pos_y ?? 15}
                      onChange={(e) => onPatchOverlay(ovIdx, { pos_y: parseInt(e.target.value, 10), position: 'custom' })}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--admin-text-secondary)] mb-1">
                      <span>Horizontal (X)</span>
                      <div className="flex items-center gap-0.5 font-mono">
                        <StudioNumericInput
                          min={5}
                          max={95}
                          value={ov.pos_x ?? 50}
                          onChange={(val) => onPatchOverlay(ovIdx, { pos_x: val })}
                          className="w-8 text-center font-bold bg-[var(--admin-card)] border border-[var(--admin-border)] rounded py-0.5 px-0.5 text-[10px] text-[var(--admin-text-primary)]"
                        />
                        <span className="text-[10px] text-[var(--admin-text-muted)]">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={ov.pos_x ?? 50}
                      onChange={(e) => onPatchOverlay(ovIdx, { pos_x: parseInt(e.target.value, 10) })}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {!selectedTextId && (
            <p className="text-[11px] text-[var(--admin-text-muted)] text-center py-1 italic">
              💡 Click any banner card above or click a banner on the canvas to expand typography and style controls.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
