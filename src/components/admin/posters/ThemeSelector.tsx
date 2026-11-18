'use client';

import React from 'react';
import type { NoticeTheme } from '@/types/index';
import {
  LITURGICAL_THEME_LIST,
  type LiturgicalThemeConfig,
} from '@/lib/posters/notice-themes';

export interface ThemeSelectorProps {
  readonly selectedTheme: NoticeTheme;
  readonly onSelectTheme: (theme: NoticeTheme) => void;
  readonly disabled?: boolean;
}

export function ThemeSelector({
  selectedTheme,
  onSelectTheme,
  disabled = false,
}: ThemeSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-2">
        Color Theme
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {LITURGICAL_THEME_LIST.map((t: LiturgicalThemeConfig) => {
          const isSelected = selectedTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTheme(t.id)}
              className={`flex items-center space-x-2.5 p-2 rounded-xl border text-left transition-all duration-150 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] ring-1 ring-[var(--admin-tab-active-border)] shadow-sm'
                  : 'border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] hover:border-[var(--admin-tab-active-border)]/50'
              } ${disabled ? 'opacity-50 !cursor-not-allowed' : ''}`}
            >
              <div
                className="w-4 h-4 rounded-full border border-black/15 dark:border-white/20 shrink-0 shadow-inner"
                style={{ background: t.borderAccent }}
              />
              <span
                className={`text-xs truncate ${
                  isSelected
                    ? 'font-bold text-[var(--admin-text-primary)]'
                    : 'font-medium text-[var(--admin-text-secondary)]'
                }`}
              >
                {t.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
