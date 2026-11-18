import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { settingsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  createSessionToken,
  verifySessionToken,
  getSessionSecret,
  parseSessionToken,
  hashSecret,
} from '@/lib/auth/crypto';
import {
  checkAdminAuth,
  verifyAdminCredentials,
  changeAdminCredentials,
  revokeAllAdminSessions,
} from '@/lib/actions/auth';
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

describe('Public Domain Hardening & Dual-Mode Auth (Plan 2)', () => {
  beforeEach(async () => {
    mockCookieStore.clear();
    mockHeaderStore.clear();
    resetAllRateLimits();
    delete process.env.PUBLIC_ACCESS_MODE;
    process.env.TRUST_PROXY_HEADERS = 'true';

    // Reset database settings to default PIN mode with version 1
    const { hash, salt } = hashSecret('1234');
    await db
      .update(settingsTable)
      .set({
        auth_mode: 'pin',
        admin_username: 'admin',
        admin_password_hash: null,
        admin_password_salt: null,
        admin_pin_hash: hash,
        admin_pin_salt: salt,
        session_version: 1,
      })
      .where(eq(settingsTable.id, 'global'));
  });

  describe('Session Versioning & Immediate Multi-Device Revocation', () => {
    it('creates 3-part versioned session tokens and parses version accurately', () => {
      const secret = getSessionSecret();
      const now = Date.now();
      const token = createSessionToken(secret, now, 2);

      const parsed = parseSessionToken(token);
      expect(parsed).toEqual({
        timestamp: now,
        sessionVersion: 2,
      });

      // Validates when expected version matches
      expect(verifySessionToken(token, secret, undefined, 2)).toBe(true);

      // Rejects when expected version does not match
      expect(verifySessionToken(token, secret, undefined, 1)).toBe(false);
      expect(verifySessionToken(token, secret, undefined, 3)).toBe(false);
    });

    it('immediately invalidates existing active sessions when session_version increments', async () => {
      const secret = getSessionSecret();
      const v1Token = createSessionToken(secret, Date.now(), 1);
      mockCookieStore.set('mosque_admin_session', v1Token);

      const before = await checkAdminAuth();
      expect(before.authenticated).toBe(true);

      // Increment version via revokeAllAdminSessions
      const revokeRes = await revokeAllAdminSessions();
      expect(revokeRes.success).toBe(true);

      // The new cookie in mockCookieStore has been updated to version 2
      const updatedCookie = mockCookieStore.get('mosque_admin_session');
      const parsedUpdated = parseSessionToken(updatedCookie);
      expect(parsedUpdated?.sessionVersion).toBe(2);

      // A device holding the old v1Token is now rejected
      mockCookieStore.set('mosque_admin_session', v1Token);
      const after = await checkAdminAuth();
      expect(after.authenticated).toBe(false);
    });
  });

  describe('Dual-Mode Authentication & Public Access Protections', () => {
    it('rejects default factory PIN "1234" when PUBLIC_ACCESS_MODE is enabled', async () => {
      process.env.PUBLIC_ACCESS_MODE = 'true';

      const res = await verifyAdminCredentials({ pin: '1234' });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Default factory PIN '1234' is disabled in public access mode");
    });

    it('switches to Username + Password mode and enforces 8+ char complex password policy', async () => {
      // Must be authenticated to change credentials
      mockCookieStore.set(
        'mosque_admin_session',
        createSessionToken(getSessionSecret(), Date.now(), 1)
      );

      // Attempting too-short password (< 8 chars) is rejected
      const shortRes = await changeAdminCredentials({
        currentSecret: '1234',
        newAuthMode: 'password',
        newUsername: 'masjid_admin',
        newPassword: 'short',
      });
      expect(shortRes.success).toBe(false);
      expect(shortRes.error).toContain('at least 8 characters');

      // Attempting password without uppercase is rejected
      const noUpperRes = await changeAdminCredentials({
        currentSecret: '1234',
        newAuthMode: 'password',
        newUsername: 'masjid_admin',
        newPassword: 'password123!',
      });
      expect(noUpperRes.success).toBe(false);
      expect(noUpperRes.error).toContain('uppercase letter');

      // Attempting password without number is rejected
      const noNumRes = await changeAdminCredentials({
        currentSecret: '1234',
        newAuthMode: 'password',
        newUsername: 'masjid_admin',
        newPassword: 'Password!',
      });
      expect(noNumRes.success).toBe(false);
      expect(noNumRes.error).toContain('number');

      // Attempting password without special character is rejected
      const noSpecialRes = await changeAdminCredentials({
        currentSecret: '1234',
        newAuthMode: 'password',
        newUsername: 'masjid_admin',
        newPassword: 'Password123',
      });
      expect(noSpecialRes.success).toBe(false);
      expect(noSpecialRes.error).toContain('special symbol');

      // Valid 8+ char complex password succeeds
      const goodRes = await changeAdminCredentials({
        currentSecret: '1234',
        newAuthMode: 'password',
        newUsername: 'masjid_admin',
        newPassword: 'Secure1!',
      });
      expect(goodRes.success).toBe(true);

      // Verify settings DB row was updated
      const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
      expect(rows[0]?.auth_mode).toBe('password');
      expect(rows[0]?.admin_username).toBe('masjid_admin');
      expect(rows[0]?.admin_password_hash).toBeDefined();

      // Clear cookie to simulate logging in fresh
      mockCookieStore.clear();

      // Wrong username triggers timing defense and fails
      const wrongUser = await verifyAdminCredentials({
        username: 'wrong_user',
        password: 'Secure1!',
      });
      expect(wrongUser.success).toBe(false);
      expect(wrongUser.error).toContain('Incorrect username or password');

      // Wrong password fails
      const wrongPass = await verifyAdminCredentials({
        username: 'masjid_admin',
        password: 'WrongPassword123!',
      });
      expect(wrongPass.success).toBe(false);

      // Correct username and password succeeds and writes session cookie
      const validLogin = await verifyAdminCredentials({
        username: 'masjid_admin',
        password: 'Secure1!',
      });
      expect(validLogin.success).toBe(true);
      expect(mockCookieStore.has('mosque_admin_session')).toBe(true);
    });

    it('refuses reverting to PIN mode when PUBLIC_ACCESS_MODE is enabled', async () => {
      // Configure password mode first
      const { hash, salt } = hashSecret('LongSecurePassword123!');
      await db
        .update(settingsTable)
        .set({
          auth_mode: 'password',
          admin_username: 'superadmin',
          admin_password_hash: hash,
          admin_password_salt: salt,
          session_version: 2,
        })
        .where(eq(settingsTable.id, 'global'));

      mockCookieStore.set(
        'mosque_admin_session',
        createSessionToken(getSessionSecret(), Date.now(), 2)
      );
      process.env.PUBLIC_ACCESS_MODE = 'true';

      const revertRes = await changeAdminCredentials({
        currentSecret: 'LongSecurePassword123!',
        newAuthMode: 'pin',
        newPin: '5678',
      });

      expect(revertRes.success).toBe(false);
      expect(revertRes.error).toContain(
        'PIN mode cannot be enabled when PUBLIC_ACCESS_MODE is active'
      );
    });
  });

  afterAll(async () => {
    delete process.env.PUBLIC_ACCESS_MODE;
    const { hash, salt } = hashSecret('1234');
    await db
      .update(settingsTable)
      .set({
        auth_mode: 'pin',
        admin_username: 'admin',
        admin_password_hash: null,
        admin_password_salt: null,
        admin_pin_hash: hash,
        admin_pin_salt: salt,
        session_version: 1,
      })
      .where(eq(settingsTable.id, 'global'));
  });
});
