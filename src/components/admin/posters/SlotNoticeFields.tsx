'use client';

import React, { useRef, useEffect } from 'react';
import type { NoticeTheme, PosterSlotMedia, TextOverlayFont } from '@/types/index';
import { AlignCenter, AlignLeft, AlignRight, Italic, Underline } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

export interface SlotNoticeFieldsProps {
  readonly slot: PosterSlotMedia;
  readonly onUpdateSlot: (updated: PosterSlotMedia) => void;
}

export function SlotNoticeFields({ slot, onUpdateSlot }: SlotNoticeFieldsProps) {
  const committedThemeRef = useRef<NoticeTheme>(slot.notice_theme ?? 'emerald');

  useEffect(() => {
    committedThemeRef.current = slot.notice_theme ?? 'emerald';
  }, [slot.id]);

  const handleHoverTheme = (hoverTheme: NoticeTheme | null) => {
    onUpdateSlot({
      ...slot,
      notice_theme: hoverTheme ?? committedThemeRef.current,
    });
  };

  const handleSelectTheme = (theme: NoticeTheme) => {
    committedThemeRef.current = theme;
    onUpdateSlot({
      ...slot,
      notice_theme: theme,
    });
  };

  const hAlign = slot.notice_headline_align || 'center';
  const dAlign = slot.notice_align || 'center';

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">Notice Headline</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateSlot({ ...slot, notice_headline_italic: !slot.notice_headline_italic })}
              className={`p-1 rounded-md border text-xs cursor-pointer ${
                slot.notice_headline_italic
                  ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                  : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white'
              }`}
              title="Italic Headline"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateSlot({ ...slot, notice_headline_underline: !slot.notice_headline_underline })}
              className={`p-1 rounded-md border text-xs cursor-pointer ${
                slot.notice_headline_underline
                  ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                  : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white'
              }`}
              title="Underline Headline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <input
          type="text"
          value={slot.notice_headline ?? ''}
          onChange={(e) => onUpdateSlot({ ...slot, notice_headline: e.target.value })}
          placeholder="e.g. Community Halaqah"
          className="w-full px-3 py-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:border-amber-400"
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
          <label className="block text-[10px] text-[var(--admin-text-muted)] mb-1">Headline Align</label>
          <div className="grid grid-cols-3 gap-1">
            {(['left', 'center', 'right'] as const).map((al) => {
              const Icon = al === 'left' ? AlignLeft : al === 'center' ? AlignCenter : AlignRight;
              return (
                <button
                  key={al}
                  type="button"
                  onClick={() => onUpdateSlot({ ...slot, notice_headline_align: al })}
                  className={`py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer ${
                    hAlign === al
                      ? 'border-amber-400 bg-[var(--admin-card)] text-amber-400'
                      : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                  }`}
                  title={`Headline ${al}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">Notice Details</label>
          <div className="flex items-center gap-1">
            {(['left', 'center', 'right'] as const).map((al) => {
              const Icon = al === 'left' ? AlignLeft : al === 'center' ? AlignCenter : AlignRight;
              return (
                <button
                  key={al}
                  type="button"
                  onClick={() => onUpdateSlot({ ...slot, notice_align: al })}
                  className={`p-1 rounded border transition-all cursor-pointer ${
                    dAlign === al
                      ? 'border-amber-400 bg-[var(--admin-card)] text-amber-400'
                      : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white'
                  }`}
                  title={`Details ${al}`}
                >
                  <Icon className="w-3 h-3" />
                </button>
              );
            })}
          </div>
        </div>
        <textarea
          rows={2}
          value={slot.notice_description ?? ''}
          onChange={(e) => onUpdateSlot({ ...slot, notice_description: e.target.value })}
          placeholder="Program timing, location, or details..."
          className="w-full px-3 py-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:border-amber-400"
        />
      </div>

      <div>
        <ThemeSelector
          selectedTheme={slot.notice_theme ?? 'emerald'}
          onSelectTheme={handleSelectTheme}
          onHoverTheme={handleHoverTheme}
        />
      </div>
    </div>
  );
}
