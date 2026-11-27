'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Columns, FileText, Plus, Upload } from 'lucide-react';
import { useIsSmallScreen } from '@/hooks/useIsSmallScreen';

export interface AddContentDropdownProps {
  readonly onCreateNotice?: (() => void) | undefined;
  readonly onUploadPoster?: (() => void) | undefined;
  readonly onOpenStudio: () => void;
}

interface CreationOption {
  readonly id: 'upload' | 'notice' | 'studio';
  readonly label: string;
  readonly icon: React.ComponentType<{ readonly className?: string; readonly 'aria-hidden'?: boolean | 'true' | 'false' }>;
  readonly description: string;
  readonly disabledBadge?: string | undefined;
  readonly action?: (() => void) | undefined;
}

export function AddContentDropdown({
  onCreateNotice,
  onUploadPoster,
  onOpenStudio,
}: AddContentDropdownProps) {
  const { isSmallScreen } = useIsSmallScreen();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleMouseEnterDropdown = () => {
    clearCloseTimer();
    setIsOpen(true);
  };

  const handleMouseLeaveDropdown = () => {
    clearHoverTimer();
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveTooltipId(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      clearHoverTimer();
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveTooltipId(null);
        clearHoverTimer();
        clearCloseTimer();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveTooltipId(null);
        clearHoverTimer();
        clearCloseTimer();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMouseEnterItem = (id: string) => {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => {
      setActiveTooltipId(id);
    }, 300);
  };

  const handleMouseLeaveItem = () => {
    clearHoverTimer();
    setActiveTooltipId(null);
  };

  const handleSelectItem = (action?: () => void) => {
    clearCloseTimer();
    clearHoverTimer();
    setIsOpen(false);
    setActiveTooltipId(null);
    action?.();
  };

  const options: readonly CreationOption[] = [
    {
      id: 'upload',
      label: 'Upload Poster',
      icon: Upload,
      description: 'Upload flyer images (.png, .jpg, .webp) or video announcements up to 60s.',
      action: onUploadPoster,
    },
    {
      id: 'notice',
      label: 'Create Notice',
      icon: FileText,
      description: 'Generate high-contrast 16:9 vector SVG text announcements with templates.',
      action: onCreateNotice,
    },
    {
      id: 'studio',
      label: 'Multi-Asset Studio',
      icon: Columns,
      description: isSmallScreen
        ? 'Requires a tablet or computer screen to compose split-screen layouts.'
        : 'Compose custom split-screen layouts, stickers, and ribbon overlays.',
      disabledBadge: isSmallScreen ? 'Tablet / PC' : undefined,
      action: isSmallScreen ? undefined : onOpenStudio,
    },
  ];

  return (
    <div
      ref={dropdownRef}
      onMouseEnter={handleMouseEnterDropdown}
      onMouseLeave={handleMouseLeaveDropdown}
      className="relative inline-block text-left"
    >
      <button
        id="btn-add-content"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Add Content"
        className="h-9 px-3.5 rounded-lg bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Add Content</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-80 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="btn-add-content"
          className="absolute right-0 top-full mt-1.5 w-[min(228px,calc(100vw-2rem))] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isTooltipVisible = activeTooltipId === opt.id;
              const isDisabled = !opt.action;

              return (
                <div key={opt.id} className="relative group">
                  <button
                    type="button"
                    role="menuitem"
                    aria-disabled={isDisabled || undefined}
                    disabled={isDisabled}
                    onClick={() => handleSelectItem(opt.action)}
                    onMouseEnter={() => handleMouseEnterItem(opt.id)}
                    onMouseLeave={handleMouseLeaveItem}
                    title={isDisabled && opt.disabledBadge ? opt.description : undefined}
                    className={`w-full text-left px-3 py-2.5 sm:py-2 rounded-lg text-xs transition flex items-center justify-between gap-2 border ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed border-transparent text-[var(--admin-text-muted)]'
                        : 'cursor-pointer border-transparent text-[var(--admin-text-primary)] hover:bg-[var(--admin-menu-hover-bg)] hover:text-[var(--admin-menu-hover-text)] focus:outline-none focus:bg-[var(--admin-menu-hover-bg)]'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-green-700 dark:text-green-400 group-hover:text-green-800 dark:group-hover:text-green-300 transition-colors shrink-0" aria-hidden="true" />
                      <span className="font-medium truncate">{opt.label}</span>
                    </span>
                    {opt.disabledBadge && (
                      <span className="px-1.5 py-0.5 rounded bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)] shrink-0">
                        {opt.disabledBadge}
                      </span>
                    )}
                  </button>

                  {isTooltipVisible && (
                    <div
                      role="tooltip"
                      className="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-52 p-2.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl text-left pointer-events-none z-50 animate-in fade-in slide-in-from-right-1 duration-150 hidden sm:block"
                    >
                      <div className="text-[11px] font-semibold text-[var(--admin-text-primary)] mb-0.5">
                        {opt.label}
                      </div>
                      <div className="text-[10px] leading-tight text-[var(--admin-text-muted)]">
                        {opt.description}
                      </div>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 rotate-45 bg-[var(--admin-surface)] border-t border-r border-[var(--admin-border)]"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
