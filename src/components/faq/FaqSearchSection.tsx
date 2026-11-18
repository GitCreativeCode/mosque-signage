'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import type { FaqCategory, FaqItem } from '@/lib/faq/faq-types';
import { searchFaqItems } from '@/lib/faq/faq-search';
import { FaqAutocompletePopover } from './FaqAutocompletePopover';
import { FaqAccordionList } from './FaqAccordionList';

export interface FaqSearchSectionProps {
  readonly items: readonly FaqItem[];
  readonly categories: readonly FaqCategory[];
  readonly activeCategory?: string | undefined;
}

export function FaqSearchSection({ items, categories, activeCategory = 'all' }: FaqSearchSectionProps) {
  const [query, setQuery] = useState('');
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchParams = useSearchParams();
  const urlCategory = searchParams?.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || activeCategory);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (urlCategory) setSelectedCategory(urlCategory);
    else if (activeCategory) setSelectedCategory(activeCategory);
  }, [urlCategory, activeCategory]);

  const searchResults = useMemo(() => searchFaqItems(query, items, 6), [query, items]);

  const visibleAccordionItems = useMemo(() => {
    let list = items.filter((item) => item.isAccordion);
    if (selectedCategory !== 'all') list = list.filter((item) => item.categoryId === selectedCategory);
    if (query.trim().length > 1) {
      const matched = new Set(searchFaqItems(query, items, 20).map((r) => r.item.slug));
      list = list.filter((item) => matched.has(item.slug));
    }
    return list;
  }, [items, selectedCategory, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categoryMap = useMemo(() => new Map(categories.map((cat) => [cat.id, cat])), [categories]);

  return (
    <div className="space-y-10">
      <div className="max-w-2xl mx-auto space-y-4" ref={searchContainerRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--admin-text-muted)]">
            <Search className="w-4 h-4 text-[var(--admin-text-muted)]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsDropdownOpen(true); }}
            onFocus={() => { if (query.trim().length > 1) setIsDropdownOpen(true); }}
            placeholder="Search questions or keywords..."
            className="w-full pl-11 pr-11 py-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 dark:focus:ring-green-500/30 dark:focus:border-green-500 transition-colors"
            aria-label="Search FAQ"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setIsDropdownOpen(false); }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isDropdownOpen && query.trim().length > 1 && (
            <FaqAutocompletePopover
              query={query}
              searchResults={searchResults}
              categoryMap={categoryMap}
              onSelect={() => setIsDropdownOpen(false)}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[var(--admin-text-primary)] text-[var(--admin-bg)]'
                : 'bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] border border-[var(--admin-border)]'
            }`}
          >
            All Questions
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[var(--admin-text-primary)] text-[var(--admin-bg)]'
                  : 'bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] border border-[var(--admin-border)]'
              }`}
            >
              {cat.title.split('&')[0]?.trim()}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Common Questions</h2>
        <FaqAccordionList
          items={visibleAccordionItems}
          expandedSlug={expandedSlug}
          onToggle={(slug) => setExpandedSlug(expandedSlug === slug ? null : slug)}
          onResetFilters={() => { setQuery(''); setSelectedCategory('all'); }}
        />
      </section>
    </div>
  );
}
