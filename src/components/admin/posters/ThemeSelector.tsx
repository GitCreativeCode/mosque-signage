'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { NoticeTheme } from '@/types/index';
import {
  LITURGICAL_THEME_LIST,
  type LiturgicalThemeConfig,
} from '@/lib/posters/notice-themes';
import { Check, ChevronDown } from 'lucide-react';

export interface ThemeSelectorProps {
  readonly selectedTheme: NoticeTheme;
  readonly onSelectTheme: (theme: NoticeTheme) => void;
  readonly onHoverTheme?: ((theme: NoticeTheme | null) => void) | undefined;
  readonly disabled?: boolean;
}

/** Prominent custom dropdown with color swatch circle and live hover canvas preview. */
export function ThemeSelector({
  selectedTheme,
  onSelectTheme,
  onHoverTheme,
  disabled = false,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme =
    LITURGICAL_THEME_LIST.find((t) => t.id === selectedTheme) ?? LITURGICAL_THEME_LIST[0]!;

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        onHoverTheme?.(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick, true);
    return () => document.removeEventListener('pointerdown', handleOutsideClick, true);
  }, [isOpen, onHoverTheme]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1.5">
        Color Theme
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer bg-[var(--admin-card)] shadow-xs ${
          isOpen
            ? 'border-amber-400 ring-2 ring-amber-400/40'
            : 'border-[var(--admin-border)] hover:border-amber-400/60'
        } ${disabled ? 'opacity-50 !cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-inner"
            style={{ background: activeTheme.borderAccent }}
          />
          <span className="text-xs font-bold text-[var(--admin-text-primary)] truncate">
            {activeTheme.name}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--admin-text-muted)] transition-transform shrink-0 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          onMouseLeave={() => onHoverTheme?.(null)}
          className="absolute left-0 right-0 top-full mt-1.5 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl shadow-2xl p-1.5 z-50 space-y-1 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
        >
          {LITURGICAL_THEME_LIST.map((t: LiturgicalThemeConfig) => {
            const isSelected = selectedTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onMouseEnter={() => onHoverTheme?.(t.id)}
                onClick={() => {
                  onSelectTheme(t.id);
                  onHoverTheme?.(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 text-[var(--admin-text-primary)] font-bold'
                    : 'hover:bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-inner"
                    style={{ background: t.borderAccent }}
                  />
                  <span className="text-xs truncate">{t.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
