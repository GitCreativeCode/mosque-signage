import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { settingsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  requireAdminAuth,
  checkAdminAuth,
  verifyAdminPin,
} from '@/lib/actions/auth';
import * as authActions from '@/lib/actions/auth';
import { createSessionToken, getSessionSecret, hashPin } from '@/lib/auth/pin';
import { resetAllRateLimits } from '@/lib/auth/rate-limit';

let mockCookieStore = new Map<string, string>();
let mockHeaderStore = new Map<string, string>();

vi.mock('next/headers', () => {
  return {
    cookies: async () => ({
      get: (name: string) => {
        const val = mockCookieStore.get(name);
        return val ? { name, value: val } : undefined;
      },
      set: (name: string, value: string) => {
        mockCookieStore.set(name, value);
      },
      delete: (name: string) => {
        mockCookieStore.delete(name);
      },
    }),
    headers: async () => ({
      get: (headerName: string) => {
        return mockHeaderStore.get(headerName.toLowerCase()) ?? null;
      },
    }),
  };
});

describe('Server Action Auth Guards & Session Enforcement', () => {
  beforeEach(async () => {
    mockCookieStore.clear();
    mockHeaderStore.clear();
    resetAllRateLimits();
    process.env.TRUST_PROXY_HEADERS = 'true';
    const { hash, salt } = hashPin('1234');
    await db
      .update(settingsTable)
      .set({
        auth_mode: 'pin',
        admin_pin_hash: hash,
        admin_pin_salt: salt,
        session_version: 1,
      })
      .where(eq(settingsTable.id, 'global'));
  });

  describe('requireAdminAuth Guard', () => {
    it('throws Unauthorized error when forceCheck is true and no session cookie is present', async () => {
      await expect(requireAdminAuth({ forceCheck: true })).rejects.toThrow(
        'Unauthorized: An authenticated admin session is required.'
      );
    });

    it('bypasses check in test environment when forceCheck is omitted or false', async () => {
      await expect(requireAdminAuth()).resolves.toBeUndefined();
      await expect(requireAdminAuth({ forceCheck: false })).resolves.toBeUndefined();
    });

    it('resolves successfully when a valid authenticated session cookie is present with forceCheck', async () => {
      const validToken = createSessionToken();
      mockCookieStore.set('mosque_admin_session', validToken);

      await expect(requireAdminAuth({ forceCheck: true })).resolves.toBeUndefined();
    });
  });

  describe('checkAdminAuth Session Validation', () => {
    it('returns false when no session cookie exists', async () => {
      const res = await checkAdminAuth();
      expect(res.authenticated).toBe(false);
    });

    it('returns true when a valid session token is stored in cookie', async () => {
      const token = createSessionToken();
      mockCookieStore.set('mosque_admin_session', token);

      const res = await checkAdminAuth();
      expect(res.authenticated).toBe(true);
    });

    it('returns false for tampered session token signature', async () => {
      const token = createSessionToken();
      const tampered = token.slice(0, -4) + 'abcd';
      mockCookieStore.set('mosque_admin_session', tampered);

      const res = await checkAdminAuth();
      expect(res.authenticated).toBe(false);
    });

    it('returns false for an expired session token', async () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const expiredToken = createSessionToken(getSessionSecret(), eightDaysAgo);
      mockCookieStore.set('mosque_admin_session', expiredToken);

      const res = await checkAdminAuth();
      expect(res.authenticated).toBe(false);
    });

    it('returns false for token signed with a foreign secret', async () => {
      const foreignToken = createSessionToken('completely-different-foreign-secret');
      mockCookieStore.set('mosque_admin_session', foreignToken);

      const res = await checkAdminAuth();
      expect(res.authenticated).toBe(false);
    });
  });

  describe('Brute-Force & Lockout Defenses', () => {
    it('locks out single client IP after 5 consecutive failures', async () => {
      mockHeaderStore.set('x-forwarded-for', '192.168.1.101');

      for (let i = 1; i <= 4; i++) {
        const res = await verifyAdminPin('0000');
        expect(res.success).toBe(false);
        expect(res.error).toContain(`${5 - i} attempt`);
      }

      const fifth = await verifyAdminPin('0000');
      expect(fifth.success).toBe(false);
      expect(fifth.error).toContain('Keypad locked for 30 seconds');

      // Subsequent attempt from the same client IP remains locked
      const sixth = await verifyAdminPin('0000');
      expect(sixth.success).toBe(false);
      expect(sixth.error).toMatch(/Keypad locked for \d+ seconds?/);
    });

    it('triggers global appliance-wide lockout after 10 cumulative failures across spoofed IPs', async () => {
      // 2 failures each from 4 different IPs (8 total)
      for (let clientIdx = 1; clientIdx <= 4; clientIdx++) {
        mockHeaderStore.set('x-forwarded-for', `10.0.0.${clientIdx}`);
        for (let attempt = 1; attempt <= 2; attempt++) {
          const res = await verifyAdminPin('0000');
          expect(res.success).toBe(false);
        }
      }

      // 9th attempt from a new IP
      mockHeaderStore.set('x-forwarded-for', '10.0.0.99');
      const ninth = await verifyAdminPin('0000');
      expect(ninth.success).toBe(false);
      expect(ninth.error).toContain('4 attempts remaining');

      // 10th attempt triggers global lockout
      mockHeaderStore.set('x-forwarded-for', '10.0.0.100');
      const tenth = await verifyAdminPin('0000');
      expect(tenth.success).toBe(false);

      // Now a completely unattempted IP is also locked out due to global threshold
      mockHeaderStore.set('x-forwarded-for', '172.16.0.50');
      const lockedGlobal = await verifyAdminPin('0000');
      expect(lockedGlobal.success).toBe(false);
      expect(lockedGlobal.error).toMatch(/Keypad locked for \d+ seconds?/);
    });

    it('resets lockout state via internal resetAllRateLimits and does not expose public resetPinRateLimit RPC', async () => {
      expect('resetPinRateLimit' in authActions).toBe(false);
      mockHeaderStore.set('x-forwarded-for', '192.168.1.200');

      for (let i = 1; i <= 5; i++) {
        await verifyAdminPin('0000');
      }

      const locked = await verifyAdminPin('0000');
      expect(locked.error).toMatch(/Keypad locked/);

      resetAllRateLimits();

      const unlocked = await verifyAdminPin('0000');
      expect(unlocked.error).toContain('4 attempts remaining');
    });
  });
});

