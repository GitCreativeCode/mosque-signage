import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PRAYER_DISCLAIMER_PERMANENT_KEY,
  PRAYER_DISCLAIMER_SESSION_KEY,
  PRAYER_DISCLAIMER_EVENT,
  isPrayerDisclaimerDismissed,
  dismissPrayerDisclaimer,
  resetPrayerDisclaimer,
} from '@/components/admin/prayer/PrayerCalculationDisclaimer';

describe('Prayer Calculation Disclaimer Unit Suite', () => {
  let localStore: Record<string, string> = {};
  let sessionStore: Record<string, string> = {};
  let dispatchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStore = {};
    sessionStore = {};
    dispatchSpy = vi.fn();

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((k: string) => localStore[k] ?? null),
      setItem: vi.fn((k: string, v: string) => { localStore[k] = v; }),
      removeItem: vi.fn((k: string) => { delete localStore[k]; }),
    });

    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((k: string) => sessionStore[k] ?? null),
      setItem: vi.fn((k: string, v: string) => { sessionStore[k] = v; }),
      removeItem: vi.fn((k: string) => { delete sessionStore[k]; }),
    });

    vi.stubGlobal('window', {
      dispatchEvent: dispatchSpy,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defines the canonical storage keys and sync event name', () => {
    expect(PRAYER_DISCLAIMER_PERMANENT_KEY).toBe('ms_prayer_disclaimer_dismissed_permanent');
    expect(PRAYER_DISCLAIMER_SESSION_KEY).toBe('ms_prayer_disclaimer_dismissed_session');
    expect(PRAYER_DISCLAIMER_EVENT).toBe('ms-prayer-disclaimer-dismissed');
  });

  it('reports not dismissed when storage is empty', () => {
    expect(isPrayerDisclaimerDismissed()).toBe(false);
  });

  it('records session dismissal and triggers sync event when dismissed temporarily', () => {
    dismissPrayerDisclaimer(false);
    expect(sessionStore[PRAYER_DISCLAIMER_SESSION_KEY]).toBe('true');
    expect(localStore[PRAYER_DISCLAIMER_PERMANENT_KEY]).toBeUndefined();
    expect(isPrayerDisclaimerDismissed()).toBe(true);
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('records permanent dismissal and triggers sync event when dismissed permanently', () => {
    dismissPrayerDisclaimer(true);
    expect(localStore[PRAYER_DISCLAIMER_PERMANENT_KEY]).toBe('true');
    expect(isPrayerDisclaimerDismissed()).toBe(true);
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('clears both session and permanent dismissals upon factory reset', () => {
    localStore[PRAYER_DISCLAIMER_PERMANENT_KEY] = 'true';
    sessionStore[PRAYER_DISCLAIMER_SESSION_KEY] = 'true';
    expect(isPrayerDisclaimerDismissed()).toBe(true);

    resetPrayerDisclaimer();

    expect(localStore[PRAYER_DISCLAIMER_PERMANENT_KEY]).toBeUndefined();
    expect(sessionStore[PRAYER_DISCLAIMER_SESSION_KEY]).toBeUndefined();
    expect(isPrayerDisclaimerDismissed()).toBe(false);
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
