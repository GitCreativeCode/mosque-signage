import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { annualSchedulesTable } from '@/lib/db/schema';
import { hasConfiguredAnnualSchedule } from '@/lib/actions/prayers';
import type { SidebarMode } from '@/types/index';

describe('Display Settings Warning & Confirmation Logic', () => {
  beforeEach(async () => {
    await db.delete(annualSchedulesTable);
  });

  describe('hasConfiguredAnnualSchedule', () => {
    it('returns false when annual_schedules table is empty', async () => {
      const hasSchedule = await hasConfiguredAnnualSchedule();
      expect(hasSchedule).toBe(false);
    });

    it('returns true when at least one annual schedule row is present', async () => {
      await db.insert(annualSchedulesTable).values({
        id: 'ann-1',
        date: '2026-10-17',
        fajr_adhan: '05:30',
        fajr_iqamah: '05:55',
        updated_at: new Date().toISOString(),
      });

      const hasSchedule = await hasConfiguredAnnualSchedule();
      expect(hasSchedule).toBe(true);
    });
  });

  describe('hasPrayerTiming & Warning Banner Visibility Evaluation', () => {
    function evaluateDisplayWarning(
      latitude: number | null | undefined,
      longitude: number | null | undefined,
      hasAnnualSchedule: boolean,
      sidebarMode: SidebarMode,
      showMiniPrayerPill: boolean
    ): { hasPrayerTiming: boolean; showDisplayWarningBanner: boolean } {
      const hasCoordinates =
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude);
      const hasPrayerTiming = hasCoordinates || hasAnnualSchedule;
      const showDisplayWarningBanner =
        !hasPrayerTiming && (sidebarMode !== 'hidden' || showMiniPrayerPill);

      return { hasPrayerTiming, showDisplayWarningBanner };
    }

    it('shows warning banner when coordinates are null and drawer mode is selected', () => {
      const res = evaluateDisplayWarning(null, null, false, 'drawer', false);
      expect(res.hasPrayerTiming).toBe(false);
      expect(res.showDisplayWarningBanner).toBe(true);
    });

    it('shows warning banner when coordinates are null and always_open mode is selected', () => {
      const res = evaluateDisplayWarning(null, null, false, 'always_open', false);
      expect(res.hasPrayerTiming).toBe(false);
      expect(res.showDisplayWarningBanner).toBe(true);
    });

    it('shows warning banner when poster only is selected but mini pill is turned on', () => {
      const res = evaluateDisplayWarning(null, null, false, 'hidden', true);
      expect(res.hasPrayerTiming).toBe(false);
      expect(res.showDisplayWarningBanner).toBe(true);
    });

    it('suppresses warning banner when poster only is selected and mini pill is off', () => {
      const res = evaluateDisplayWarning(null, null, false, 'hidden', false);
      expect(res.hasPrayerTiming).toBe(false);
      expect(res.showDisplayWarningBanner).toBe(false);
    });

    it('suppresses warning banner when valid GPS coordinates are provided', () => {
      const res = evaluateDisplayWarning(43.589, -79.6441, false, 'drawer', true);
      expect(res.hasPrayerTiming).toBe(true);
      expect(res.showDisplayWarningBanner).toBe(false);
    });

    it('suppresses warning banner when annual CSV schedule is configured even without coordinates', () => {
      const res = evaluateDisplayWarning(null, null, true, 'always_open', true);
      expect(res.hasPrayerTiming).toBe(true);
      expect(res.showDisplayWarningBanner).toBe(false);
    });
  });

  describe('Preset Intercept & Confirmation Gatekeeper', () => {
    function evaluatePresetSelection(
      targetMode: SidebarMode,
      currentMode: SidebarMode,
      hasPrayerTiming: boolean
    ): { shouldConfirm: boolean; appliedMode: SidebarMode | null } {
      if (targetMode !== 'hidden' && targetMode !== currentMode && !hasPrayerTiming) {
        return { shouldConfirm: true, appliedMode: null };
      }
      return { shouldConfirm: false, appliedMode: targetMode };
    }

    it('requires confirmation when selecting periodic drawer without prayer timing', () => {
      const result = evaluatePresetSelection('drawer', 'hidden', false);
      expect(result.shouldConfirm).toBe(true);
      expect(result.appliedMode).toBeNull();
    });

    it('requires confirmation when selecting always pinned split-screen without prayer timing', () => {
      const result = evaluatePresetSelection('always_open', 'hidden', false);
      expect(result.shouldConfirm).toBe(true);
      expect(result.appliedMode).toBeNull();
    });

    it('allows switching to poster only without confirmation even without prayer timing', () => {
      const result = evaluatePresetSelection('hidden', 'drawer', false);
      expect(result.shouldConfirm).toBe(false);
      expect(result.appliedMode).toBe('hidden');
    });

    it('does not trigger confirmation if clicking the preset that is already active', () => {
      const result = evaluatePresetSelection('drawer', 'drawer', false);
      expect(result.shouldConfirm).toBe(false);
      expect(result.appliedMode).toBe('drawer');
    });

    it('applies preset immediately without confirmation when prayer timing is configured', () => {
      const result = evaluatePresetSelection('drawer', 'hidden', true);
      expect(result.shouldConfirm).toBe(false);
      expect(result.appliedMode).toBe('drawer');
    });
  });

  describe('Mini Prayer Pill Toggle Intercept & Confirmation Gatekeeper', () => {
    function evaluateMiniPillToggle(
      nextValue: boolean,
      hasPrayerTiming: boolean
    ): { shouldConfirm: boolean; appliedValue: boolean | null } {
      if (nextValue && !hasPrayerTiming) {
        return { shouldConfirm: true, appliedValue: null };
      }
      return { shouldConfirm: false, appliedValue: nextValue };
    }

    it('requires confirmation when toggling mini pill on without prayer timing', () => {
      const result = evaluateMiniPillToggle(true, false);
      expect(result.shouldConfirm).toBe(true);
      expect(result.appliedValue).toBeNull();
    });

    it('toggles off immediately without confirmation regardless of prayer timing status', () => {
      const result = evaluateMiniPillToggle(false, false);
      expect(result.shouldConfirm).toBe(false);
      expect(result.appliedValue).toBe(false);
    });

    it('toggles on immediately without confirmation when prayer timing is configured', () => {
      const result = evaluateMiniPillToggle(true, true);
      expect(result.shouldConfirm).toBe(false);
      expect(result.appliedValue).toBe(true);
    });
  });
});
