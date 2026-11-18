'use client';

import React from 'react';
import type { PosterTextOverlay, TextOverlayFont, TextOverlaySize } from '@/types/index';
import { DEFAULT_RECTANGLE_COLORS, DEFAULT_TEXT_COLORS } from '@/lib/posters/studio-types';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Pipette, Slash, Underline } from 'lucide-react';

interface StudioTextStyleControlsProps {
  readonly overlay: PosterTextOverlay;
  readonly overlayIndex: number;
  readonly onPatchOverlay: (index: number, patch: Partial<PosterTextOverlay>) => void;
  readonly onEyeDropper: (index: number) => void;
  readonly onBgEyeDropper: (index: number) => void;
}

/** Font, formatting, alignment, and text/rectangle color swatches with eyedropper controls. */
export function StudioTextStyleControls({
  overlay,
  overlayIndex,
  onPatchOverlay,
  onEyeDropper,
  onBgEyeDropper,
}: StudioTextStyleControlsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-[10px] text-[var(--admin-text-muted)] mb-1">Font Family</label>
          <select
            value={overlay.font_family || 'sans'}
            onChange={(e) => onPatchOverlay(overlayIndex, { font_family: e.target.value as TextOverlayFont })}
            className="w-full px-2 py-1.5 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs"
          >
            <option value="sans">Clean Sans-Serif</option>
            <option value="serif">Dignified Serif</option>
            <option value="traditional">Traditional Islamic</option>
            <option value="mono">Monospace</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-[var(--admin-text-muted)] mb-1">Font Size</label>
          <select
            value={overlay.font_size || 'lg'}
            onChange={(e) => onPatchOverlay(overlayIndex, { font_size: e.target.value as TextOverlaySize })}
            className="w-full px-2 py-1.5 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs"
          >
            <option value="sm">Small</option>
            <option value="base">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large</option>
            <option value="2xl">2X Headline</option>
            <option value="3xl">3X Hero</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          {[
            { active: overlay.is_bold ?? true, title: 'Toggle Bold', key: 'is_bold' as const, Icon: Bold },
            { active: Boolean(overlay.is_italic), title: 'Toggle Italic', key: 'is_italic' as const, Icon: Italic },
            { active: Boolean(overlay.is_underline), title: 'Toggle Underline', key: 'is_underline' as const, Icon: Underline },
          ].map(({ active, title, key, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onPatchOverlay(overlayIndex, { [key]: !active })}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                active
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm'
                  : 'border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)]'
              }`}
              title={title}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {(['left', 'center', 'right'] as const).map((al) => {
            const AlignIcon = al === 'left' ? AlignLeft : al === 'center' ? AlignCenter : AlignRight;
            return (
              <button
                key={al}
                type="button"
                onClick={() => onPatchOverlay(overlayIndex, { text_align: al })}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                  (overlay.text_align || 'center') === al
                    ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm'
                    : 'border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)]'
                }`}
                title={`Align ${al}`}
              >
                <AlignIcon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <label className="block text-[10px] text-[var(--admin-text-muted)] mb-1.5">Text Color & Eye Dropper</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DEFAULT_TEXT_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => onPatchOverlay(overlayIndex, { text_color: c.hex })}
                style={{ backgroundColor: c.hex }}
                className={`w-5 h-5 rounded-lg border border-black/25 shadow-sm transition-transform cursor-pointer ${
                  (overlay.text_color || '#ffffff').toLowerCase() === c.hex.toLowerCase()
                    ? 'scale-125 ring-2 ring-[var(--admin-tab-active-border)]'
                    : 'hover:scale-110'
                }`}
                title={c.label}
              />
            ))}
            <button
              type="button"
              onClick={() => onEyeDropper(overlayIndex)}
              className="w-6 h-6 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-text-primary)] hover:border-[var(--admin-tab-active-border)] transition-colors cursor-pointer shadow-sm"
              title="Pick Color with Eye Dropper"
            >
              <Pipette className="w-3 h-3" />
            </button>
            <input
              type="color"
              value={overlay.text_color || '#ffffff'}
              onChange={(e) => onPatchOverlay(overlayIndex, { text_color: e.target.value })}
              className="w-6 h-6 rounded-lg border border-[var(--admin-border)] cursor-pointer p-0 bg-transparent"
              title="Custom Color Palette"
            />
            <span className="font-mono text-[10px] text-[var(--admin-text-secondary)] ml-auto">{overlay.text_color || '#ffffff'}</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="block text-[10px] text-[var(--admin-text-muted)]">Rectangle Color & Eye Dropper</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DEFAULT_RECTANGLE_COLORS.map((c) => {
              const isTrans = c.hex === 'transparent';
              const isSelected = isTrans
                ? overlay.bg_color === 'transparent' || overlay.bg_style === 'transparent'
                : overlay.bg_style !== 'transparent' && (overlay.bg_color || '').toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() =>
                    onPatchOverlay(overlayIndex, isTrans ? { bg_color: 'transparent', bg_style: 'transparent' } : { bg_color: c.hex, bg_style: 'dark' })
                  }
                  style={isTrans ? undefined : { backgroundColor: c.hex }}
                  className={`w-5 h-5 rounded-lg border shadow-sm transition-transform cursor-pointer flex items-center justify-center ${
                    isTrans ? 'bg-transparent border-dashed border-rose-400 text-rose-500' : 'border-black/25'
                  } ${isSelected ? 'scale-125 ring-2 ring-[var(--admin-tab-active-border)]' : 'hover:scale-110'}`}
                  title={c.label}
                >
                  {isTrans && <Slash className="w-3 h-3 stroke-[2.5]" />}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onBgEyeDropper(overlayIndex)}
              className="w-6 h-6 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-text-primary)] hover:border-[var(--admin-tab-active-border)] transition-colors cursor-pointer shadow-sm"
              title="Pick Rectangle Color with Eye Dropper"
            >
              <Pipette className="w-3 h-3" />
            </button>
            <input
              type="color"
              value={overlay.bg_color && overlay.bg_color !== 'transparent' ? overlay.bg_color : '#0f172a'}
              onChange={(e) => onPatchOverlay(overlayIndex, { bg_color: e.target.value, bg_style: 'dark' })}
              className="w-6 h-6 rounded-lg border border-[var(--admin-border)] cursor-pointer p-0 bg-transparent"
              title="Custom Rectangle Color"
            />
            <span className="font-mono text-[10px] text-[var(--admin-text-secondary)] ml-auto">
              {overlay.bg_color === 'transparent' || overlay.bg_style === 'transparent' ? 'Transparent' : overlay.bg_color || 'Charcoal'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

