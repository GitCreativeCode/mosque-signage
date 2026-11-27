'use client';

import React from 'react';
import type { VenueSettingsCategory } from '@/types/index';

const CATEGORIES: ReadonlyArray<{ readonly key: VenueSettingsCategory; readonly label: string }> = [
  { key: 'IDENTITY', label: 'Mosque Profile & Ticker' },
  { key: 'ASTRONOMY', label: 'Calculation & Hijri Calendar' },
  { key: 'DISPLAY', label: 'Display Timings & Behaviors' },
  { key: 'MAINTENANCE', label: 'Remote Appliance Controls' },
  { key: 'SECURITY', label: 'Security & Authentication' },
];

export interface VenueSettingsTabHeaderProps {
  readonly activeCategory: VenueSettingsCategory;
  readonly onCategoryChange: (cat: VenueSettingsCategory) => void;
}

export function VenueSettingsTabHeader({
  activeCategory,
  onCategoryChange,
}: VenueSettingsTabHeaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--admin-text-primary)]">Settings</h2>
        <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
          Configure mosque identity, astronomical prayer calculation, display timing behaviors, security, and hardware automation.
        </p>
      </div>

      <div className="border-b border-[var(--admin-border)]">
        <nav className="flex space-x-5 sm:space-x-6 -mb-px overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => onCategoryChange(cat.key)}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat.key
                  ? 'border-[var(--admin-tab-active-border)] text-[var(--admin-text-primary)]'
                  : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-border)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

