'use client';

import React from 'react';
import type { DropdownMenuItem } from './TopNavDropdown';

export interface TopNavMenuPanelProps {
  readonly label: string;
  readonly items: readonly DropdownMenuItem[];
  readonly align: 'left' | 'right';
  readonly onItemSelect: (item: DropdownMenuItem) => void;
}

export function TopNavMenuPanel({
  label,
  items,
  align,
  onItemSelect,
}: TopNavMenuPanelProps) {
  return (
    <div
      role="menu"
      aria-label={label}
      className={`absolute top-full mt-1 min-w-[210px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      <div className="space-y-0.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => onItemSelect(item)}
            className={`w-full text-left px-3.5 py-2 rounded-lg text-xs transition flex items-center justify-between border ${
              item.disabled
                ? 'opacity-40 cursor-not-allowed border-transparent text-[var(--admin-text-muted)] pointer-events-none'
                : item.isActive
                ? 'cursor-pointer border-[var(--admin-menu-active-border)] bg-[var(--admin-menu-active-bg)] text-[var(--admin-menu-active-text)] font-semibold shadow-sm'
                : 'cursor-pointer border-transparent text-[var(--admin-text-secondary)] hover:bg-[var(--admin-menu-hover-bg)] hover:text-[var(--admin-menu-hover-text)] focus:outline-none focus:bg-[var(--admin-menu-hover-bg)] focus:text-[var(--admin-menu-hover-text)]'
            }`}
          >
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ml-2 ${
                  item.isActive
                    ? 'bg-[var(--admin-card)] border-[var(--admin-menu-active-border)] text-[var(--admin-menu-active-text)]'
                    : 'bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-muted)]'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

