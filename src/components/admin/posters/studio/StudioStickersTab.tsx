'use client';

import React from 'react';
import type { IslamicStickerType, PosterCanvasSticker } from '@/types/index';
import { ISLAMIC_STICKERS_REGISTRY } from '@/lib/posters/layout-engine';
import { IslamicStickerGraphic } from '@/components/common/IslamicStickerGraphic';
import { StudioSelectedStickerEditor } from './StudioSelectedStickerEditor';

type BadgeVariant = 'red' | 'gold' | 'emerald' | 'blue' | 'purple' | 'amber';

interface StudioStickersTabProps {
  readonly stickers: PosterCanvasSticker[];
  readonly selectedStickerIndex: number | null;
  readonly selectedLayerKeys?: readonly string[] | undefined;
  readonly customBadgeText?: string | undefined;
  readonly customBadgeVariant?: BadgeVariant | undefined;
  readonly setCustomBadgeText?: ((v: string) => void) | undefined;
  readonly setCustomBadgeVariant?: ((v: BadgeVariant) => void) | undefined;
  readonly onUpdateSticker: (index: number, next: PosterCanvasSticker) => void;
  readonly onDeleteSticker: (index: number) => void;
  readonly onAddIslamicSticker: (type: IslamicStickerType) => void;
  readonly onAddBadgeSticker?: ((text: string, variant: BadgeVariant) => void) | undefined;
}

/** Inspector tab for Islamic stickers, mosque announcement ribbons, and custom badge builder. */
export function StudioStickersTab({
  stickers,
  selectedStickerIndex,
  selectedLayerKeys,
  customBadgeText,
  customBadgeVariant,
  setCustomBadgeText,
  setCustomBadgeVariant,
  onUpdateSticker,
  onDeleteSticker,
  onAddIslamicSticker,
  onAddBadgeSticker,
}: StudioStickersTabProps) {
  const isMultiSelected = (selectedLayerKeys?.length ?? 0) > 1;
  const activeSticker = !isMultiSelected && selectedStickerIndex !== null ? stickers[selectedStickerIndex] : undefined;

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
          <span className="text-[11px] font-bold text-[var(--admin-text-secondary)]">Sacred Mosque &amp; Event Stickers</span>
          <div className="space-y-2">
            {ISLAMIC_STICKERS_REGISTRY.map((stk) => (
              <button
                key={stk.id}
                type="button"
                onClick={() => onAddIslamicSticker(stk.id)}
                className="w-full p-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--admin-tab-active-border)] text-left flex items-center gap-3 transition-all group cursor-pointer shadow-xs"
                title={stk.description}
              >
                <div className="w-11 h-11 shrink-0 p-1.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] flex items-center justify-center">
                  <IslamicStickerGraphic type={stk.id} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[var(--admin-text-primary)] block">
                    {stk.label}
                  </span>
                  <span className="text-[10px] text-[var(--admin-text-muted)] block line-clamp-1">
                    {stk.description}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[var(--admin-text-secondary)] group-hover:text-[var(--admin-text-primary)] shrink-0 px-2.5 py-1 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)]">
                  + Add
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

