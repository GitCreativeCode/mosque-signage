import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BETA_ACKNOWLEDGED_KEY,
  BETA_RESET_EVENT,
  triggerBetaNoticeReset,
} from '@/components/common/BetaNoticeModal';

describe('Beta Notice Modal Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('defines the correct storage key and reset event', () => {
    expect(BETA_ACKNOWLEDGED_KEY).toBe('ms_beta_acknowledged');
    expect(BETA_RESET_EVENT).toBe('ms-beta-reset');
  });

  it('evaluates acknowledgement state accurately', () => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
    };

    expect(mockStorage.getItem(BETA_ACKNOWLEDGED_KEY)).toBeNull();
    mockStorage.setItem(BETA_ACKNOWLEDGED_KEY, 'true');
    expect(mockStorage.getItem(BETA_ACKNOWLEDGED_KEY)).toBe('true');
  });

  it('clears localStorage and dispatches reset event when triggerBetaNoticeReset is invoked', () => {
    const store: Record<string, string> = { [BETA_ACKNOWLEDGED_KEY]: 'true' };
    const removeItemSpy = vi.fn((key: string) => {
      delete store[key];
    });
    const dispatchSpy = vi.fn();

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: removeItemSpy,
    });
    vi.stubGlobal('window', {
      dispatchEvent: dispatchSpy,
    });

    triggerBetaNoticeReset();

    expect(removeItemSpy).toHaveBeenCalledWith(BETA_ACKNOWLEDGED_KEY);
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('hydrates posters and settings immediately after PIN unlock on fresh browsers without requiring a refresh', () => {
    const dashboardSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/admin/AdminDashboard.tsx'),
      'utf8'
    );
    const liveSyncSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/hooks/useAdminLiveSync.ts'),
      'utf8'
    );

    expect(dashboardSrc).toContain('useAdminLiveSync(initialSettings, initialPosters, initialIsAuthenticated)');
    expect(dashboardSrc).toContain('sync.hydrateAfterAuth()');
    expect(liveSyncSrc).toContain('setPosters([...initialPosters])');
    expect(liveSyncSrc).toContain('setSettings(initialSettings)');
  });

  it('syncs Jummah shifts when server props refresh after authentication', () => {
    const jummahSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/hooks/useJummahShiftsManager.ts'),
      'utf8'
    );

    expect(jummahSrc).toContain('setShifts([...initialJummahShifts])');
  });
});
