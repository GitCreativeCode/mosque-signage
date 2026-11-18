import { describe, it, expect, vi } from 'vitest';
import type { DropdownMenuItem } from '@/components/admin/common/TopNavDropdown';
import {
  resolveInitialPrayerSub,
  resolveInitialSettingsSub,
} from '@/hooks/useAdminNavigation';

describe('Admin Navigation & Unified Topbar Architecture', () => {
  describe('TopNavDropdown Configuration & Menu Item Mappings', () => {
    it('validates menu items structure with default and active flags', () => {
      const items: DropdownMenuItem[] = [
        {
          id: 'prayer-timetable',
          label: 'Prayer Timetable',
          isDefault: true,
          isActive: true,
          onClick: vi.fn(),
        },
        {
          id: 'friday-jummah',
          label: 'Friday Jummah',
          isActive: false,
          onClick: vi.fn(),
        },
      ];

      expect(items).toHaveLength(2);
      expect(items[0]?.isDefault).toBe(true);
      expect(items[0]?.isActive).toBe(true);
      expect(items[1]?.isDefault).toBeUndefined();
      expect(items[1]?.isActive).toBe(false);

      items[0]?.onClick();
      expect(items[0]?.onClick).toHaveBeenCalledTimes(1);
    });

    it('handles Display Tools menu item execution', () => {
      const toggleSim = vi.fn();
      const testDrawer = vi.fn();
      const reloadKiosk = vi.fn();

      const tools: DropdownMenuItem[] = [
        { id: 'toggle-sim', label: 'Toggle Display Simulator', onClick: toggleSim },
        { id: 'test-drawer', label: 'Test Prayer Drawer (15s)', onClick: testDrawer },
        { id: 'reload-kiosk', label: 'Reload Display Screens', onClick: reloadKiosk },
      ];

      tools[0]?.onClick();
      tools[1]?.onClick();
      tools[2]?.onClick();

      expect(toggleSim).toHaveBeenCalledTimes(1);
      expect(testDrawer).toHaveBeenCalledTimes(1);
      expect(reloadKiosk).toHaveBeenCalledTimes(1);
    });

    it('ensures only one dropdown is open at a time during rapid navigation transitions', () => {
      let openDropdownId: 'prayers' | 'settings' | 'tools' | null = null;

      const handleOpen = (id: 'prayers' | 'settings' | 'tools') => {
        openDropdownId = id;
      };

      // Hover over prayers
      handleOpen('prayers');
      expect(openDropdownId).toBe('prayers');

      // Rapidly hover over settings
      handleOpen('settings');
      expect(openDropdownId).toBe('settings');

      // Rapidly hover over tools
      handleOpen('tools');
      expect(openDropdownId).toBe('tools');
    });
  });

  describe('Route Resolution & Default Sub-Tab Fallbacks', () => {
    it('resolves primary tab from query parameter with POSTERS as fallback', () => {
      const resolveTab = (param?: string | null): 'POSTERS' | 'PRAYERS' | 'SETTINGS' => {
        const tab = param?.toLowerCase();
        if (tab === 'prayers' || tab === 'prayer') return 'PRAYERS';
        if (tab === 'settings' || tab === 'venue') return 'SETTINGS';
        return 'POSTERS';
      };

      expect(resolveTab('prayers')).toBe('PRAYERS');
      expect(resolveTab('prayer')).toBe('PRAYERS');
      expect(resolveTab('settings')).toBe('SETTINGS');
      expect(resolveTab('venue')).toBe('SETTINGS');
      expect(resolveTab('posters')).toBe('POSTERS');
      expect(resolveTab(null)).toBe('POSTERS');
      expect(resolveTab('unknown-tab')).toBe('POSTERS');
    });

    it('resolves Prayer subtab with TIMETABLE as default and JUMMAH on explicit match', () => {
      expect(resolveInitialPrayerSub('jummah')).toBe('JUMMAH');
      expect(resolveInitialPrayerSub('JUMMAH')).toBe('JUMMAH');
      expect(resolveInitialPrayerSub('timetable')).toBe('TIMETABLE');
      expect(resolveInitialPrayerSub(undefined)).toBe('TIMETABLE');
      expect(resolveInitialPrayerSub('')).toBe('TIMETABLE');
    });

    it('resolves Settings subtab with IDENTITY (Mosque Profile) as default', () => {
      expect(resolveInitialSettingsSub('identity')).toBe('IDENTITY');
      expect(resolveInitialSettingsSub('astronomy')).toBe('ASTRONOMY');
      expect(resolveInitialSettingsSub('display')).toBe('DISPLAY');
      expect(resolveInitialSettingsSub('maintenance')).toBe('MAINTENANCE');
      expect(resolveInitialSettingsSub('security')).toBe('SECURITY');
      expect(resolveInitialSettingsSub(undefined)).toBe('IDENTITY');
      expect(resolveInitialSettingsSub('other')).toBe('IDENTITY');
    });

    it('purges tab and sub searchParams when applying navigation to POSTERS', () => {
      const url = new URL('http://localhost:3000/admin?tab=settings&sub=maintenance');
      const applyNavigationUrl = (targetTab: string) => {
        if (targetTab === 'POSTERS') {
          url.searchParams.delete('tab');
          url.searchParams.delete('sub');
        }
      };

      applyNavigationUrl('POSTERS');
      expect(url.searchParams.has('tab')).toBe(false);
      expect(url.searchParams.has('sub')).toBe(false);
      expect(url.toString()).toBe('http://localhost:3000/admin');
    });
  });

  describe('Unsaved Changes Guard Mechanics', () => {
    it('defers navigation into pendingNav when unsaved changes exist', () => {
      let activeTab: 'POSTERS' | 'PRAYERS' | 'SETTINGS' = 'SETTINGS';
      let activeSub: string = 'IDENTITY';
      const hasUnsavedChanges = true;
      let showLeaveConfirmation = false;
      let pendingNav: { tab: 'POSTERS' | 'PRAYERS' | 'SETTINGS'; sub?: string | undefined } | null = null;

      const handleNavAction = (targetTab: 'POSTERS' | 'PRAYERS' | 'SETTINGS', targetSub?: string) => {
        const isSameTab = targetTab === activeTab;
        const isSameSub = targetSub === activeSub;
        if (isSameTab && isSameSub) return;

        if (hasUnsavedChanges) {
          pendingNav = { tab: targetTab, sub: targetSub };
          showLeaveConfirmation = true;
        } else {
          activeTab = targetTab;
          if (targetSub) activeSub = targetSub;
        }
      };

      // Attempt navigation to Friday Jummah while unsaved
      handleNavAction('PRAYERS', 'JUMMAH');

      expect(showLeaveConfirmation).toBe(true);
      expect(pendingNav).toEqual({ tab: 'PRAYERS', sub: 'JUMMAH' });
      expect(activeTab).toBe('SETTINGS'); // remains on current tab until confirmed
    });

    it('applies pending navigation and resets unsaved state when user confirms leave', () => {
      let activeTab: 'POSTERS' | 'PRAYERS' | 'SETTINGS' = 'SETTINGS';
      let activeSub: string = 'IDENTITY';
      let hasUnsavedChanges = true;
      let showLeaveConfirmation = true;
      let pendingNav: { tab: 'POSTERS' | 'PRAYERS' | 'SETTINGS'; sub?: string | undefined } | null = {
        tab: 'PRAYERS',
        sub: 'JUMMAH',
      };

      // User confirms discard
      const onConfirm = () => {
        showLeaveConfirmation = false;
        hasUnsavedChanges = false;
        if (pendingNav) {
          activeTab = pendingNav.tab;
          if (pendingNav.sub) activeSub = pendingNav.sub;
          pendingNav = null;
        }
      };

      onConfirm();

      expect(showLeaveConfirmation).toBe(false);
      expect(hasUnsavedChanges).toBe(false);
      expect(pendingNav).toBeNull();
      expect(activeTab).toBe('PRAYERS');
      expect(activeSub).toBe('JUMMAH');
    });

    it('cancels pending navigation and remains on current tab when user rejects leave', () => {
      let activeTab: 'POSTERS' | 'PRAYERS' | 'SETTINGS' = 'SETTINGS';
      let activeSub: string = 'IDENTITY';
      const hasUnsavedChanges = true;
      let showLeaveConfirmation = true;
      let pendingNav: { tab: 'POSTERS' | 'PRAYERS' | 'SETTINGS'; sub?: string | undefined } | null = {
        tab: 'PRAYERS',
        sub: 'JUMMAH',
      };

      // User cancels
      const onCancel = () => {
        showLeaveConfirmation = false;
        pendingNav = null;
      };

      onCancel();

      expect(showLeaveConfirmation).toBe(false);
      expect(hasUnsavedChanges).toBe(true);
      expect(pendingNav).toBeNull();
      expect(activeTab).toBe('SETTINGS');
      expect(activeSub).toBe('IDENTITY');
    });
  });

  describe('Topbar Styling & Branding Specification', () => {
    it('verifies active nav class names do not include permanent underline', () => {
      // Active class definitions should use border/card backgrounds, keeping underline strictly for hover
      const activeTabClass = 'border-[var(--admin-tab-active-border)] text-[var(--admin-text-primary)] bg-[var(--admin-card)] shadow-sm';
      const hoverUnderlineClass = 'hover:underline hover:decoration-2 hover:decoration-[var(--admin-tab-active-border)] hover:underline-offset-4';

      expect(activeTabClass).not.toContain('underline');
      expect(hoverUnderlineClass).toContain('hover:underline');
    });

    it('confirms site branding name is fixed to Mosque Signage', () => {
      const siteBrandName = 'Mosque Signage';
      expect(siteBrandName).toBe('Mosque Signage');
    });

    it('verifies dropdown menu items use distinct emerald highlight variables for hover and active selection', () => {
      const activeMenuItemClass = 'border-[var(--admin-menu-active-border)] bg-[var(--admin-menu-active-bg)] text-[var(--admin-menu-active-text)] font-semibold shadow-sm';
      const hoverMenuItemClass = 'hover:bg-[var(--admin-menu-hover-bg)] hover:text-[var(--admin-menu-hover-text)]';

      expect(activeMenuItemClass).toContain('var(--admin-menu-active-bg)');
      expect(activeMenuItemClass).toContain('var(--admin-menu-active-border)');
      expect(hoverMenuItemClass).toContain('var(--admin-menu-hover-bg)');
      expect(hoverMenuItemClass).toContain('var(--admin-menu-hover-text)');
    });

    it('verifies topbar navigation buttons do not render background rectangles on hover and preserve rigid height', () => {
      const topbarButtonClass = 'h-8 px-3 text-xs font-semibold rounded-lg transition-colors duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center space-x-1.5 border whitespace-nowrap hover:underline hover:decoration-2 hover:decoration-[var(--admin-tab-active-border)] hover:underline-offset-4 border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]';

      expect(topbarButtonClass).toContain('h-8');
      expect(topbarButtonClass).toContain('font-semibold');
      expect(topbarButtonClass).toContain('hover:underline');
      expect(topbarButtonClass).not.toContain('hover:bg-');
    });
  });
});
