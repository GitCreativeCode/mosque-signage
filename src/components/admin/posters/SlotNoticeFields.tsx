'use client';

import React from 'react';
import type { PosterSlotMedia, TextOverlayFont } from '@/types/index';
import { ThemeSelector } from './ThemeSelector';

export interface SlotNoticeFieldsProps {
  readonly slot: PosterSlotMedia;
  readonly onUpdateSlot: (updated: PosterSlotMedia) => void;
}

export function SlotNoticeFields({ slot, onUpdateSlot }: SlotNoticeFieldsProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
          Notice Headline
        </label>
        <input
          type="text"
          value={slot.notice_headline ?? ''}
          onChange={(e) => onUpdateSlot({ ...slot, notice_headline: e.target.value })}
          placeholder="e.g. Community Halaqah"
          className="w-full px-3 py-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:border-[var(--admin-tab-active-border)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-[10px] text-[var(--admin-text-muted)] mb-1">Headline Font</label>
          <select
            value={slot.notice_font ?? 'sans'}
            onChange={(e) => onUpdateSlot({ ...slot, notice_font: e.target.value as TextOverlayFont })}
            className="w-full px-2 py-1.5 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs"
          >
            <option value="sans">Clean Sans-Serif</option>
            <option value="serif">Dignified Serif</option>
            <option value="traditional">Traditional Islamic</option>
            <option value="mono">Monospace</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-[var(--admin-text-muted)] mb-1">Alignment</label>
          <div className="grid grid-cols-3 gap-1">
            {(['left', 'center', 'right'] as const).map((align) => {
              const isSelected = align === 'center' ? !slot.notice_align || slot.notice_align === 'center' : slot.notice_align === align;
              return (
                <button
                  key={align}
                  type="button"
                  onClick={() => onUpdateSlot({ ...slot, notice_align: align })}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)]'
                      : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                  }`}
                  title={`${align.charAt(0).toUpperCase() + align.slice(1)} Align`}
                >
                  {align === 'center' ? 'Mid' : align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">Notice Details</label>
        <textarea
          rows={2}
          value={slot.notice_description ?? ''}
          onChange={(e) => onUpdateSlot({ ...slot, notice_description: e.target.value })}
          placeholder="Program timing, location, or details..."
          className="w-full px-3 py-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:border-[var(--admin-tab-active-border)]"
        />
      </div>

      <div>
        <ThemeSelector
          selectedTheme={slot.notice_theme ?? 'emerald'}
          onSelectTheme={(theme) => onUpdateSlot({ ...slot, notice_theme: theme })}
        />
      </div>
    </div>
  );
}

