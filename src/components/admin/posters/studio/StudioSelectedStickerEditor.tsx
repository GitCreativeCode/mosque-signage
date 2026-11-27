'use client';

import React from 'react';
import type { PosterCanvasSticker } from '@/types/index';
import { FlipHorizontal, FlipVertical, RotateCw, Star, Tag, Trash2 } from 'lucide-react';
import { StudioNumericInput } from './StudioNumericInput';

interface StudioSelectedStickerEditorProps {
  readonly sticker: PosterCanvasSticker;
  readonly stickerIndex: number;
  readonly onUpdateSticker: (index: number, next: PosterCanvasSticker) => void;
  readonly onDeleteSticker: (index: number) => void;
}

const BADGE_VARIANTS = ['emerald', 'gold', 'red', 'blue', 'purple', 'amber'] as const;

const VARIANT_CLASSES: Record<(typeof BADGE_VARIANTS)[number], string> = {
  gold: 'bg-amber-400 text-black',
  red: 'bg-rose-600 text-white',
  blue: 'bg-blue-600 text-white',
  purple: 'bg-purple-600 text-white',
  amber: 'bg-amber-600 text-white',
  emerald: 'bg-emerald-600 text-white',
};

const TINT_PRESETS = [
  { label: 'Crisp White', hex: '#ffffff' },
  { label: 'Mosque Emerald', hex: '#10b981' },
  { label: 'Regal Gold', hex: '#f59e0b' },
] as const;

/** In-place customization panel for the currently selected Islamic sticker or announcement ribbon. */
export function StudioSelectedStickerEditor({
  sticker,
  stickerIndex,
  onUpdateSticker,
  onDeleteSticker,
}: StudioSelectedStickerEditorProps) {
  const isRibbon = sticker.type === 'badge_custom';

  return (
    <div className="p-3 rounded-2xl bg-[var(--admin-surface)] border border-amber-500/40 space-y-2.5 mb-4 shadow-sm animate-in fade-in duration-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
          {isRibbon ? <Tag className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
          <span>{isRibbon ? 'Edit Selected Ribbon' : 'Customize Selected Sticker'}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdateSticker(stickerIndex, { ...sticker, flip_x: !sticker.flip_x })}
            className={`p-1 rounded-lg border text-xs cursor-pointer ${
              sticker.flip_x
                ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white'
            }`}
            title="Flip Horizontal"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateSticker(stickerIndex, { ...sticker, flip_y: !sticker.flip_y })}
            className={`p-1 rounded-lg border text-xs cursor-pointer ${
              sticker.flip_y
                ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white'
            }`}
            title="Flip Vertical"
          >
            <FlipVertical className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSticker(stickerIndex)}
            className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isRibbon ? (
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] text-[var(--admin-text-muted)] mb-1">Ribbon Text (In-Place Edit)</label>
            <input
              type="text"
              value={sticker.badge_text || ''}
              onChange={(e) => onUpdateSticker(stickerIndex, { ...sticker, badge_text: e.target.value.toUpperCase() })}
              placeholder="RIBBON TEXT..."
              className="w-full px-3 py-1.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-xs text-[var(--admin-text-primary)] font-bold uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--admin-text-muted)] mb-1">Color Variant</label>
            <div className="grid grid-cols-6 gap-1">
              {BADGE_VARIANTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onUpdateSticker(stickerIndex, { ...sticker, badge_variant: v })}
                  className={`py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    (sticker.badge_variant || 'emerald') === v ? 'ring-2 ring-white scale-105 shadow' : 'opacity-70 hover:opacity-100'
                  } ${VARIANT_CLASSES[v]}`}
                >
                  {v.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <span className="text-[10px] text-[var(--admin-text-muted)] block">Liturgical Color Presets & Custom Tint</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {TINT_PRESETS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => onUpdateSticker(stickerIndex, { ...sticker, color_override: c.hex })}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 cursor-pointer ${
                  sticker.color_override?.toLowerCase() === c.hex.toLowerCase()
                    ? 'border-amber-400 bg-[var(--admin-card)] text-white shadow'
                    : 'border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: c.hex }} />
                <span>{c.label}</span>
              </button>
            ))}
            <input
              type="color"
              value={sticker.color_override || '#fbbf24'}
              onChange={(e) => onUpdateSticker(stickerIndex, { ...sticker, color_override: e.target.value })}
              className="w-7 h-7 rounded-lg border border-[var(--admin-border)] bg-transparent cursor-pointer p-0.5"
              title="Custom Color Picker"
            />
          </div>
        </div>
      )}

      <div className="space-y-1 pt-2 border-t border-[var(--admin-border)]/50">
        <div className="flex items-center justify-between text-[10px] text-[var(--admin-text-secondary)]">
          <span className="flex items-center gap-1 font-semibold">
            <RotateCw className="w-3 h-3 opacity-70" />
            <span>Rotation</span>
          </span>
          <div className="flex items-center gap-1 font-mono">
            <StudioNumericInput
              min={-180}
              max={180}
              value={sticker.rotation ?? 0}
              onChange={(val) => onUpdateSticker(stickerIndex, { ...sticker, rotation: val })}
              className="w-10 text-center font-bold bg-[var(--admin-card)] border border-[var(--admin-border)] rounded py-0.5 px-1 text-[10px] text-[var(--admin-text-primary)]"
            />
            <span className="text-[10px] text-[var(--admin-text-muted)]">°</span>
            {(sticker.rotation ?? 0) !== 0 && (
              <button
                type="button"
                onClick={() => onUpdateSticker(stickerIndex, { ...sticker, rotation: 0 })}
                className="text-[9px] text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={sticker.rotation ?? 0}
          onChange={(e) => onUpdateSticker(stickerIndex, { ...sticker, rotation: parseInt(e.target.value, 10) })}
          className="w-full accent-amber-400 cursor-pointer"
        />
      </div>
    </div>
  );
}

