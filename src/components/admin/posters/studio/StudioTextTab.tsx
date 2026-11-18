'use client';

import React from 'react';
import type { PosterTextOverlay } from '@/types/index';
import { Plus, RotateCw, Trash2 } from 'lucide-react';
import { StudioTextStyleControls } from './StudioTextStyleControls';

interface StudioTextTabProps {
  readonly textOverlays: PosterTextOverlay[];
  readonly onAddBanner: () => void;
  readonly onDeleteBanner: (index: number) => void;
  readonly onPatchOverlay: (index: number, patch: Partial<PosterTextOverlay>) => void;
  readonly onEyeDropper: (index: number) => void;
  readonly onBgEyeDropper: (index: number) => void;
}

/** Inspector tab for rectangular text banners, typography, colors, rotation, and X/Y placement. */
export function StudioTextTab({
  textOverlays,
  onAddBanner,
  onDeleteBanner,
  onPatchOverlay,
  onEyeDropper,
  onBgEyeDropper,
}: StudioTextTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">Text Banners</h3>
          <p className="text-[11px] text-[var(--admin-text-muted)]">Rectangular captions, titles, or Hadith overlays</p>
        </div>
        <button
          type="button"
          onClick={onAddBanner}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 opacity-70" />
          Add Banner
        </button>
      </div>

      {textOverlays.length === 0 ? (
        <div className="p-4 rounded-2xl bg-[var(--admin-surface)] border border-dashed border-[var(--admin-border)] text-center text-xs text-[var(--admin-text-muted)]">
          No text overlays added yet. Click &quot;Add Banner&quot; above to create high-contrast rectangular text.
        </div>
      ) : (
        <div className="space-y-3">
          {textOverlays.map((ov, ovIdx) => (
            <div key={ov.id} className="p-3.5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--admin-text-primary)]">Banner #{ovIdx + 1}</span>
                <button type="button" onClick={() => onDeleteBanner(ovIdx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer" title="Delete banner">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                value={ov.text}
                onChange={(e) => onPatchOverlay(ovIdx, { text: e.target.value })}
                placeholder="Type banner message..."
                className="w-full px-3 py-1.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:border-[var(--admin-tab-active-border)]"
              />

              <StudioTextStyleControls
                overlay={ov}
                overlayIndex={ovIdx}
                onPatchOverlay={onPatchOverlay}
                onEyeDropper={onEyeDropper}
                onBgEyeDropper={onBgEyeDropper}
              />

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-[var(--admin-text-secondary)]">
                  <span className="flex items-center gap-1"><RotateCw className="w-3 h-3 opacity-70" /><span>Rotation</span></span>
                  <div className="flex items-center gap-1 font-mono">
                    <span>{ov.rotation || 0}°</span>
                    {ov.rotation ? (
                      <button type="button" onClick={() => onPatchOverlay(ovIdx, { rotation: 0 })} className="text-[9px] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] underline cursor-pointer">
                        Reset
                      </button>
                    ) : null}
                  </div>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={ov.rotation || 0}
                  onChange={(e) => onPatchOverlay(ovIdx, { rotation: parseInt(e.target.value, 10) })}
                  className="w-full accent-[var(--admin-btn-primary-bg)] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--admin-text-secondary)] mb-1">
                    <span>Vertical (Y)</span><span className="font-mono">{ov.pos_y ?? 15}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={ov.pos_y ?? 15}
                    onChange={(e) => onPatchOverlay(ovIdx, { pos_y: parseInt(e.target.value, 10), position: 'custom' })}
                    className="w-full accent-[var(--admin-btn-primary-bg)] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--admin-text-secondary)] mb-1">
                    <span>Horizontal (X)</span><span className="font-mono">{ov.pos_x ?? 50}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={ov.pos_x ?? 50}
                    onChange={(e) => onPatchOverlay(ovIdx, { pos_x: parseInt(e.target.value, 10) })}
                    className="w-full accent-[var(--admin-btn-primary-bg)] cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[var(--admin-text-muted)] italic pt-0.5">
                💡 Tip: You can also click and drag this text directly anywhere on the canvas with your mouse.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

