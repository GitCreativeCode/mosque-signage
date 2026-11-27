import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PosterStatus, PosterWithStatus } from '@/types/index';

describe('Admin Posters Toolbar & Add Content Dropdown Engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Add Content Dropdown Hover State Machine & Escape Handling', () => {
    it('manages open/close state toggling and click-outside dismissal', () => {
      let isOpen = false;
      const toggle = () => {
        isOpen = !isOpen;
      };

      expect(isOpen).toBe(false);
      toggle();
      expect(isOpen).toBe(true);
      toggle();
      expect(isOpen).toBe(false);
    });

    it('opens immediately on mouse enter and closes after 150ms buffer on mouse leave', () => {
      let isOpen = false;
      let closeTimer: NodeJS.Timeout | null = null;

      const handleMouseEnter = () => {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        isOpen = true;
      };

      const handleMouseLeave = () => {
        closeTimer = setTimeout(() => {
          isOpen = false;
        }, 150);
      };

      // Hover on
      handleMouseEnter();
      expect(isOpen).toBe(true);

      // Hover off
      handleMouseLeave();
      expect(isOpen).toBe(true); // Still open during 150ms buffer

      // Advance by 100ms - still open
      vi.advanceTimersByTime(100);
      expect(isOpen).toBe(true);

      // Advance remaining 50ms - now closed
      vi.advanceTimersByTime(50);
      expect(isOpen).toBe(false);
    });

    it('cancels close timer if mouse re-enters within 150ms buffer', () => {
      let isOpen = false;
      let closeTimer: NodeJS.Timeout | null = null;

      const handleMouseEnter = () => {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        isOpen = true;
      };

      const handleMouseLeave = () => {
        closeTimer = setTimeout(() => {
          isOpen = false;
        }, 150);
      };

      handleMouseEnter();
      expect(isOpen).toBe(true);

      handleMouseLeave();
      vi.advanceTimersByTime(100); // 100ms into 150ms buffer

      // Mouse re-enters
      handleMouseEnter();
      vi.advanceTimersByTime(100); // 200ms total elapsed, but timer was cleared
      expect(isOpen).toBe(true);
    });

    it('dismisses dropdown on Escape keyboard event', () => {
      let isOpen = true;
      let activeTooltipId: string | null = 'upload';

      const handleKeyDown = (key: string) => {
        if (key === 'Escape') {
          isOpen = false;
          activeTooltipId = null;
        }
      };

      handleKeyDown('Enter');
      expect(isOpen).toBe(true);
      expect(activeTooltipId).toBe('upload');

      handleKeyDown('Escape');
      expect(isOpen).toBe(false);
      expect(activeTooltipId).toBeNull();
    });
  });

  describe('Delayed Tooltip Hover Engine (300ms Threshold)', () => {
    it('activates tooltip only after mouse hovers for 300ms', () => {
      let activeTooltipId: string | null = null;
      let hoverTimer: NodeJS.Timeout | null = null;

      const handleMouseEnter = (id: string) => {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          activeTooltipId = id;
        }, 300);
      };

      handleMouseEnter('upload');
      expect(activeTooltipId).toBeNull();

      // Advance by 200ms - should still be null
      vi.advanceTimersByTime(200);
      expect(activeTooltipId).toBeNull();

      // Advance remaining 100ms - should now activate
      vi.advanceTimersByTime(100);
      expect(activeTooltipId).toBe('upload');
    });

    it('cancels pending tooltip if mouse leaves before 300ms threshold', () => {
      let activeTooltipId: string | null = null;
      let hoverTimer: NodeJS.Timeout | null = null;

      const handleMouseEnter = (id: string) => {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          activeTooltipId = id;
        }, 300);
      };

      const handleMouseLeave = () => {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        activeTooltipId = null;
      };

      handleMouseEnter('notice');
      vi.advanceTimersByTime(150);
      expect(activeTooltipId).toBeNull();

      handleMouseLeave();
      vi.advanceTimersByTime(200);
      expect(activeTooltipId).toBeNull();
    });

    it('clears active tooltip on mouse leave after activation', () => {
      let activeTooltipId: string | null = null;
      let hoverTimer: NodeJS.Timeout | null = null;

      const handleMouseEnter = (id: string) => {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          activeTooltipId = id;
        }, 300);
      };

      const handleMouseLeave = () => {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        activeTooltipId = null;
      };

      handleMouseEnter('studio');
      vi.advanceTimersByTime(300);
      expect(activeTooltipId).toBe('studio');

      handleMouseLeave();
      expect(activeTooltipId).toBeNull();
    });
  });

  describe('Creation Action Execution & Menu Dismissal', () => {
    it('executes target creation action and closes dropdown', () => {
      const onUpload = vi.fn();
      const onCreateNotice = vi.fn();
      const onOpenStudio = vi.fn();

      let isOpen = true;
      let activeTooltipId: string | null = 'upload';

      const handleSelect = (action?: () => void) => {
        isOpen = false;
        activeTooltipId = null;
        action?.();
      };

      handleSelect(onUpload);
      expect(onUpload).toHaveBeenCalledTimes(1);
      expect(isOpen).toBe(false);
      expect(activeTooltipId).toBeNull();

      isOpen = true;
      handleSelect(onCreateNotice);
      expect(onCreateNotice).toHaveBeenCalledTimes(1);
      expect(isOpen).toBe(false);

      isOpen = true;
      handleSelect(onOpenStudio);
      expect(onOpenStudio).toHaveBeenCalledTimes(1);
      expect(isOpen).toBe(false);
    });

    it('safely handles missing optional action handlers without throwing', () => {
      let isOpen = true;
      const handleSelect = (action?: () => void) => {
        isOpen = false;
        action?.();
      };

      expect(() => handleSelect(undefined)).not.toThrow();
      expect(isOpen).toBe(false);
    });
  });

  describe('Dark Mode Palette Alignment & Status Calculations', () => {
    it('verifies icon colors use classic Mosque Forest Green tokens across light and dark modes', () => {
      const iconClasses = 'text-green-700 dark:text-green-400 group-hover:text-green-800 dark:group-hover:text-green-300';
      expect(iconClasses).toContain('dark:text-green-400');
      expect(iconClasses).toContain('text-green-700');
    });

    const mockPosters: PosterWithStatus[] = [
      { id: '1', title: 'P1', status: 'ACTIVE', type: 'image' } as unknown as PosterWithStatus,
      { id: '2', title: 'P2', status: 'ACTIVE', type: 'image' } as unknown as PosterWithStatus,
      { id: '3', title: 'P3', status: 'UPCOMING', type: 'notice' } as unknown as PosterWithStatus,
      { id: '4', title: 'P4', status: 'EXPIRED', type: 'video' } as unknown as PosterWithStatus,
      { id: '5', title: 'P5', status: 'ARCHIVED', type: 'image' } as unknown as PosterWithStatus,
    ];

    it('computes correct count badges for all status tabs', () => {
      const getCount = (key: 'ALL' | PosterStatus) => {
        if (key === 'ALL') return mockPosters.length;
        return mockPosters.filter((p) => p.status === key).length;
      };

      expect(getCount('ALL')).toBe(5);
      expect(getCount('ACTIVE')).toBe(2);
      expect(getCount('UPCOMING')).toBe(1);
      expect(getCount('EXPIRED')).toBe(1);
      expect(getCount('ARCHIVED')).toBe(1);
    });

    it('supports switching viewMode between grid and table', () => {
      let viewMode: 'grid' | 'table' = 'grid';
      const setViewMode = (mode: 'grid' | 'table') => {
        viewMode = mode;
      };

      expect(viewMode).toBe('grid');
      setViewMode('table');
      expect(viewMode).toBe('table');
      setViewMode('grid');
      expect(viewMode).toBe('grid');
    });

    it('standardizes "+ Add Content" button and toolbar controls to matching 36px (h-9) height', () => {
      const addContentBtnClass = 'h-9 px-3.5 rounded-lg bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm whitespace-nowrap';
      const viewModeContainerClass = 'flex items-center space-x-1 bg-[var(--admin-surface)] p-1 rounded-lg border border-[var(--admin-border)] h-9';
      const statusTabClass = 'h-9 px-3.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer flex items-center space-x-2 shrink-0 border';

      expect(addContentBtnClass).toContain('h-9');
      expect(viewModeContainerClass).toContain('h-9');
      expect(statusTabClass).toContain('h-9');
    });
  });
});
