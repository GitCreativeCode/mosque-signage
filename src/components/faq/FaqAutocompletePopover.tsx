'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { FaqCategory, FaqSearchResult } from '@/lib/faq/faq-types';

export interface FaqAutocompletePopoverProps {
  readonly query: string;
  readonly searchResults: readonly FaqSearchResult[];
  readonly categoryMap: ReadonlyMap<string, FaqCategory>;
  readonly onSelect: () => void;
}

export function FaqAutocompletePopover({
  query,
  searchResults,
  categoryMap,
  onSelect,
}: FaqAutocompletePopoverProps) {
  return (
    <div
      role="listbox"
      className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-xl z-50 overflow-hidden divide-y divide-[var(--admin-border)]/50"
    >
      <div className="px-4 py-2 bg-[var(--admin-surface)] text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)] flex items-center justify-between">
        <span>Matching Suggestions</span>
        <span className="font-mono text-green-700 dark:text-green-400">
          {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
        </span>
      </div>

      {searchResults.length === 0 ? (
        <div className="p-5 text-center text-xs text-[var(--admin-text-muted)]">
          No matching answers found for &ldquo;{query}&rdquo;.
        </div>
      ) : (
        searchResults.map(({ item, matchSnippet }) => {
          const cat = categoryMap.get(item.categoryId);
          return (
            <Link
              key={item.slug}
              href={`/faq/${item.slug}`}
              onClick={onSelect}
              className="block p-3.5 hover:bg-[var(--admin-surface)] transition group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-semibold text-green-700 dark:text-green-400">
                  {cat?.title.split('&')[0]?.trim() || item.categoryId}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--admin-text-muted)] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-semibold text-[var(--admin-text-primary)] group-hover:underline underline-offset-2">
                {item.question}
              </p>
              <p className="text-[11px] text-[var(--admin-text-muted)] line-clamp-1 mt-0.5">
                {matchSnippet}
              </p>
            </Link>
          );
        })
      )}
    </div>
  );
}
