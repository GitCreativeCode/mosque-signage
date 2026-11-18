'use client';

import React from 'react';
import type { NoticeTheme } from '@/types/index';
import { ThemeSelector } from './ThemeSelector';

interface NoticeCoreFieldsProps {
  readonly selectedTheme: NoticeTheme;
  readonly onSelectTheme: (theme: NoticeTheme) => void;
  readonly headline: string;
  readonly onChangeHeadline: (val: string) => void;
  readonly description: string;
  readonly onChangeDescription: (val: string) => void;
  readonly disabled?: boolean | undefined;
}

/** Shared liturgical theme, headline, and body inputs for notice slide editors. */
export function NoticeCoreFields({
  selectedTheme,
  onSelectTheme,
  headline,
  onChangeHeadline,
  description,
  onChangeDescription,
  disabled = false,
}: NoticeCoreFieldsProps) {
  return (
    <>
      <ThemeSelector
        selectedTheme={selectedTheme}
        onSelectTheme={onSelectTheme}
        disabled={disabled}
      />

      <div>
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1.5">
          Notice Headline
        </label>
        <input
          type="text"
          required
          value={headline}
          onChange={(e) => onChangeHeadline(e.target.value)}
          placeholder="e.g., Join Mosque Official WhatsApp Community"
          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] text-sm"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1.5">
          Notice Message
        </label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="Stay up to date with prayer schedule shifts, emergency weather notices, and community programs directly on your phone."
          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] text-sm leading-relaxed"
          disabled={disabled}
        />
      </div>
    </>
  );
}

