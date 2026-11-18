'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/lib/faq/faq-types';

export interface FaqAccordionListProps {
  readonly items: readonly FaqItem[];
  readonly expandedSlug: string | null;
  readonly onToggle: (slug: string) => void;
  readonly onResetFilters: () => void;
}

export function FaqAccordionList({
  items,
  expandedSlug,
  onToggle,
  onResetFilters,
}: FaqAccordionListProps) {
  if (items.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-center text-xs text-[var(--admin-text-muted)] space-y-2">
        <p className="font-medium text-[var(--admin-text-secondary)]">No questions match your current filter.</p>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-green-700 dark:text-green-400 hover:underline cursor-pointer font-semibold"
        >
          Reset filter and show all
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const isExpanded = expandedSlug === item.slug;
        return (
          <div key={item.slug} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden shadow-xs transition-colors">
            <button
              type="button"
              onClick={() => onToggle(item.slug)}
              aria-expanded={isExpanded}
              className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
            >
              <h3 className="text-sm font-semibold text-[var(--admin-text-primary)] leading-snug">{item.question}</h3>
              <div className={`text-[var(--admin-text-muted)] transition-transform duration-250 shrink-0 ${isExpanded ? 'rotate-180 text-[var(--admin-text-primary)]' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <div className={`grid transition-[grid-template-rows] duration-250 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="px-4 sm:px-5 pb-5 pt-1 space-y-3 border-t border-[var(--admin-border)]/50 bg-[var(--admin-surface)]/40">
                  <p className="text-xs sm:text-sm text-[var(--admin-text-secondary)] leading-relaxed">{item.shortAnswer}</p>
                  <div className="pt-1">
                    <Link
                      href={`/faq/${item.slug}`}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-green-700 dark:text-green-400 hover:underline underline-offset-4 transition group cursor-pointer"
                    >
                      <span>Read detailed article &amp; diagrams</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

