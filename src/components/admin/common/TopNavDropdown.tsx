'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { TopNavMenuPanel } from './TopNavMenuPanel';

export interface DropdownMenuItem {
  readonly id: string;
  readonly label: string;
  readonly badge?: string | undefined;
  readonly isDefault?: boolean | undefined;
  readonly isActive?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly onClick: () => void;
}

export interface TopNavDropdownProps {
  readonly label: string;
  readonly buttonId?: string | undefined;
  readonly items: readonly DropdownMenuItem[];
  readonly isActive?: boolean | undefined;
  readonly defaultAction?: (() => void) | undefined;
  readonly align?: 'left' | 'right' | undefined;
  readonly badge?: React.ReactNode | undefined;
  readonly isOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onMouseLeave?: (() => void) | undefined;
}

export function TopNavDropdown({
  label,
  buttonId,
  items,
  isActive = false,
  defaultAction,
  align = 'left',
  badge,
  isOpen: isOpenProp,
  onOpenChange,
  onMouseEnter: onMouseEnterProp,
  onMouseLeave: onMouseLeaveProp,
}: TopNavDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isMenuOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (onMouseEnterProp) { onMouseEnterProp(); return; }
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setInternalOpen(true);
    onOpenChange?.(true);
  };

  const handleMouseLeave = () => {
    if (onMouseLeaveProp) { onMouseLeaveProp(); return; }
    timerRef.current = setTimeout(() => {
      setInternalOpen(false);
      onOpenChange?.(false);
    }, 120);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setInternalOpen(false);
        onOpenChange?.(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInternalOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isMenuOpen, onOpenChange]);

  const handleToggle = () => {
    const next = !isMenuOpen;
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  const hasSplitAction = typeof defaultAction === 'function';

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-flex items-center"
    >
      {hasSplitAction ? (
        <div
          className={`h-8 inline-flex items-center rounded-lg border font-semibold text-xs whitespace-nowrap transition-colors duration-150 hover:underline hover:decoration-2 hover:decoration-[var(--admin-tab-active-border)] hover:underline-offset-4 ${
            isActive
              ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] shadow-sm text-[var(--admin-text-primary)]'
              : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
          }`}
        >
          <button
            id={buttonId}
            type="button"
            onClick={defaultAction}
            className="h-full pl-3 pr-1 text-xs font-semibold transition cursor-pointer inline-flex items-center space-x-1 active:scale-[0.98]"
            aria-label={`${label} (default view)`}
          >
            <span>{label}</span>
            {badge}
          </button>
          <button
            type="button"
            onClick={handleToggle}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label={`Open ${label} menu`}
            className="h-full pr-2 pl-0.5 text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer inline-flex items-center rounded-r-lg"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label={`Open ${label} menu`}
          className={`h-8 px-3 text-xs font-semibold rounded-lg transition-colors duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center space-x-1.5 border whitespace-nowrap hover:underline hover:decoration-2 hover:decoration-[var(--admin-tab-active-border)] hover:underline-offset-4 ${
            isActive
              ? 'border-[var(--admin-tab-active-border)] text-[var(--admin-text-primary)] bg-[var(--admin-card)] shadow-sm'
              : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
          }`}
        >
          <span>{label}</span>
          {badge}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      )}

      {isMenuOpen && (
        <TopNavMenuPanel
          label={label}
          items={items}
          align={align}
          onItemSelect={(item) => {
            if (item.disabled) return;
            item.onClick();
            setInternalOpen(false);
            onOpenChange?.(false);
          }}
        />
      )}
    </div>
  );
}
