import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sqlite } from '@/lib/db/client';
import {
  getLockoutError,
  recordFailedPinAttempt,
  resetAllRateLimits,
  getTierDurationMs,
  formatTierDuration,
} from '@/lib/auth/rate-limit';
import { getClientIdentifier, isHttpsRequest } from '@/lib/auth/session-cookie';

let mockHeaderStore = new Map<string, string>();

vi.mock('next/headers', () => {
  return {
    cookies: async () => ({
      get: () => undefined,
      set: () => {},
      delete: () => {},
    }),
    headers: async () => ({
      get: (headerName: string) => {
        return mockHeaderStore.get(headerName.toLowerCase()) ?? null;
      },
    }),
  };
});

describe('Persistent SQLite Rate Limiting & Proxy Trust (Plan 2)', () => {
  beforeEach(() => {
    mockHeaderStore.clear();
    resetAllRateLimits();
    delete process.env.TRUST_PROXY_HEADERS;
    delete process.env.COOKIE_SECURE;
  });

  describe('Exponential Backoff Lockout Progression', () => {
    it('accurately defines progressive backoff tiers (30s -> 2m -> 15m -> 60m)', () => {
      expect(getTierDurationMs(1)).toBe(30 * 1000);
      expect(getTierDurationMs(2)).toBe(120 * 1000);
      expect(getTierDurationMs(3)).toBe(15 * 60 * 1000);
      expect(getTierDurationMs(4)).toBe(60 * 60 * 1000);

      expect(formatTierDuration(1)).toBe('30 seconds');
      expect(formatTierDuration(2)).toBe('2 minutes');
      expect(formatTierDuration(3)).toBe('15 minutes');
      expect(formatTierDuration(4)).toBe('60 minutes');
    });

    it('persists failed attempts to auth_rate_limits SQLite table and progresses tiers', () => {
      const clientKey = 'ip:192.168.1.50';
      const nowMs = 1700000000000;

      // 4 failed attempts: no lockout yet
      for (let i = 1; i <= 4; i++) {
        const msg = recordFailedPinAttempt(clientKey, nowMs, false, 'Login');
        expect(msg).toContain(`${5 - i} attempt`);
        expect(getLockoutError(clientKey, nowMs, false, 'Login')).toBeNull();
      }

      // Check SQLite table directly
      const row4 = sqlite
        .prepare('SELECT failed_attempts, lockout_tier, locked_until FROM auth_rate_limits WHERE client_key = ?')
        .get(clientKey) as { failed_attempts: number; lockout_tier: number; locked_until: number | null };
      expect(row4.failed_attempts).toBe(4);
      expect(row4.locked_until).toBeNull();

      // 5th failed attempt: triggers Tier 1 (30s) lockout
      const fifthMsg = recordFailedPinAttempt(clientKey, nowMs, false, 'Login');
      expect(fifthMsg).toContain('locked for 30 seconds');

      const lockedError = getLockoutError(clientKey, nowMs + 1000, false, 'Login');
      expect(lockedError).toMatch(/locked for \d+ seconds/);

      // Advance time by 31 seconds (Tier 1 expired)
      const afterTier1Ms = nowMs + 31 * 1000;
      expect(getLockoutError(clientKey, afterTier1Ms, false, 'Login')).toBeNull();

      // Next failure progresses to Tier 2 (2 minutes)
      const sixthMsg = recordFailedPinAttempt(clientKey, afterTier1Ms, false, 'Login');
      expect(sixthMsg).toContain('locked for 2 minutes');

      // Verify in SQLite
      const row6 = sqlite
        .prepare('SELECT failed_attempts, lockout_tier, locked_until FROM auth_rate_limits WHERE client_key = ?')
        .get(clientKey) as { failed_attempts: number; lockout_tier: number; locked_until: number | null };
      expect(row6.failed_attempts).toBe(6);
      expect(row6.lockout_tier).toBe(2);
      expect(row6.locked_until).toBe(afterTier1Ms + 120 * 1000);

      // Advance time by 121 seconds (Tier 2 expired)
      const afterTier2Ms = afterTier1Ms + 121 * 1000;
      expect(getLockoutError(clientKey, afterTier2Ms, false, 'Login')).toBeNull();

      // Next failure progresses to Tier 3 (15 minutes)
      const seventhMsg = recordFailedPinAttempt(clientKey, afterTier2Ms, false, 'Login');
      expect(seventhMsg).toContain('locked for 15 minutes');
    });
  });

  describe('Explicit Proxy Trust Boundaries (TRUST_PROXY_HEADERS)', () => {
    it('refuses spoofed X-Forwarded-For headers when TRUST_PROXY_HEADERS is unset', async () => {
      // Attacker sends forged X-Forwarded-For
      mockHeaderStore.set('x-forwarded-for', '203.0.113.195');
      const client = await getClientIdentifier();

      // Must NOT trust the header; returns default-client
      expect(client).toBe('default-client');
    });

    it('trusts CF-Connecting-IP and X-Forwarded-For when TRUST_PROXY_HEADERS=true', async () => {
      process.env.TRUST_PROXY_HEADERS = 'true';

      mockHeaderStore.set('x-forwarded-for', '198.51.100.42, 10.0.0.1');
      const clientFromForwarded = await getClientIdentifier();
      expect(clientFromForwarded).toBe('ip:198.51.100.42');

      // CF-Connecting-IP takes highest precedence
      mockHeaderStore.set('cf-connecting-ip', '198.51.100.99');
      const clientFromCf = await getClientIdentifier();
      expect(clientFromCf).toBe('ip:198.51.100.99');
    });

    it('determines HTTPS via x-forwarded-proto only when TRUST_PROXY_HEADERS=true', async () => {
      mockHeaderStore.set('x-forwarded-proto', 'https');

      // Without trust, forwarded proto is ignored
      process.env.TRUST_PROXY_HEADERS = 'false';
      expect(await isHttpsRequest()).toBe(false);

      // With trust enabled, forwarded proto is respected
      process.env.TRUST_PROXY_HEADERS = 'true';
      expect(await isHttpsRequest()).toBe(true);
    });
  });
});
