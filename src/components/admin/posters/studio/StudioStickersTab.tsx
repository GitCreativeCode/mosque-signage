'use client';

import React from 'react';
import type { IslamicStickerType, PosterCanvasSticker } from '@/types/index';
import { ISLAMIC_STICKERS_REGISTRY, MOSQUE_BADGES_REGISTRY } from '@/lib/posters/layout-engine';
import { IslamicStickerGraphic } from '@/components/common/IslamicStickerGraphic';
import { Plus } from 'lucide-react';
import { StudioSelectedStickerEditor } from './StudioSelectedStickerEditor';

type BadgeVariant = 'red' | 'gold' | 'emerald' | 'blue' | 'purple' | 'amber';

interface StudioStickersTabProps {
  readonly stickers: PosterCanvasSticker[];
  readonly selectedStickerIndex: number | null;
  readonly customBadgeText: string;
  readonly customBadgeVariant: BadgeVariant;
  readonly setCustomBadgeText: (v: string) => void;
  readonly setCustomBadgeVariant: (v: BadgeVariant) => void;
  readonly onUpdateSticker: (index: number, next: PosterCanvasSticker) => void;
  readonly onDeleteSticker: (index: number) => void;
  readonly onAddIslamicSticker: (type: IslamicStickerType) => void;
  readonly onAddBadgeSticker: (text: string, variant: BadgeVariant) => void;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  gold: 'bg-amber-400 text-black',
  red: 'bg-rose-600 text-white',
  blue: 'bg-blue-600 text-white',
  purple: 'bg-purple-600 text-white',
  amber: 'bg-amber-600 text-white',
  emerald: 'bg-emerald-600 text-white',
};

/** Inspector tab for Islamic stickers, mosque announcement ribbons, and custom badge builder. */
export function StudioStickersTab({
  stickers,
  selectedStickerIndex,
  customBadgeText,
  customBadgeVariant,
  setCustomBadgeText,
  setCustomBadgeVariant,
  onUpdateSticker,
  onDeleteSticker,
  onAddIslamicSticker,
  onAddBadgeSticker,
}: StudioStickersTabProps) {
  const activeSticker = selectedStickerIndex !== null ? stickers[selectedStickerIndex] : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] mb-1">
          Islamic Stickers & Badges
        </h3>
        <p className="text-[11px] text-[var(--admin-text-muted)] mb-3">
          Add liturgical Islamic stickers, crescents, lanterns, and announcement ribbons that float above any layout
        </p>

        {activeSticker && selectedStickerIndex !== null && (
          <StudioSelectedStickerEditor
            sticker={activeSticker}
            stickerIndex={selectedStickerIndex}
            onUpdateSticker={onUpdateSticker}
            onDeleteSticker={onDeleteSticker}
          />
        )}

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[var(--admin-text-secondary)]">Sacred Mosque & Event Stickers</span>
          <div className="grid grid-cols-2 gap-2">
            {ISLAMIC_STICKERS_REGISTRY.map((stk) => (
              <button
                key={stk.id}
                type="button"
                onClick={() => onAddIslamicSticker(stk.id)}
                className="p-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--admin-tab-active-border)] text-left flex items-center gap-2.5 transition-all group cursor-pointer shadow-sm"
                title={stk.description}
              >
                <div className="w-10 h-10 shrink-0 p-1 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] flex items-center justify-center">
                  <IslamicStickerGraphic type={stk.id} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[var(--admin-text-primary)] block truncate">{stk.label}</span>
                  <span className="text-[10px] text-[var(--admin-text-muted)] block truncate">Click to add</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <span className="text-[11px] font-bold text-[var(--admin-text-secondary)]">Mosque Announcement Ribbons</span>
          <div className="grid grid-cols-2 gap-2">
            {MOSQUE_BADGES_REGISTRY.map((badge) => (
              <button
                key={badge.id}
                type="button"
                onClick={() => onAddBadgeSticker(badge.text, badge.variant)}
                className="p-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--admin-tab-active-border)] text-left flex flex-col justify-between transition-all group cursor-pointer shadow-sm"
              >
                <span className="text-xs font-bold text-[var(--admin-text-primary)]">{badge.label}</span>
                <span className={`mt-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-center truncate ${VARIANT_CLASSES[badge.variant]}`}>
                  {badge.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-3">
          <span className="text-xs font-bold text-[var(--admin-text-secondary)] block">Custom Ribbon Creator</span>
          <input
            type="text"
            value={customBadgeText}
            onChange={(e) => setCustomBadgeText(e.target.value)}
            placeholder="e.g. SPECIAL WORKSHOP"
            className="w-full px-3 py-1.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs uppercase"
          />
          <div className="grid grid-cols-6 gap-1.5">
            {(['emerald', 'gold', 'red', 'blue', 'purple', 'amber'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setCustomBadgeVariant(v)}
                className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  customBadgeVariant === v ? 'ring-2 ring-white scale-105 shadow' : 'opacity-70 hover:opacity-100'
                } ${VARIANT_CLASSES[v]}`}
              >
                {v.slice(0, 3)}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!customBadgeText.trim()}
            onClick={() => customBadgeText.trim() && onAddBadgeSticker(customBadgeText.trim().toUpperCase(), customBadgeVariant)}
            className="w-full py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Ribbon to Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
}

