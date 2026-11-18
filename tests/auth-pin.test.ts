import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { settingsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  hashPin,
  verifyPin,
  createSessionToken,
  verifySessionToken,
} from '@/lib/auth/pin';
import { requireAdminAuth, verifyAdminPin } from '@/lib/actions/auth';
import { resetAllRateLimits } from '@/lib/auth/rate-limit';

describe('Admin PIN & Session Cryptography', () => {
  it('correctly hashes and verifies a PIN with salt', () => {
    const pin = '1234';
    const { hash, salt } = hashPin(pin);

    expect(hash).toBeDefined();
    expect(salt).toBeDefined();
    expect(hash.length).toBe(128);
    expect(salt.length).toBeGreaterThan(10);

    // Matching PIN verifies to true
    expect(verifyPin('1234', salt, hash)).toBe(true);

    // Incorrect PIN verifies to false
    expect(verifyPin('0000', salt, hash)).toBe(false);
    expect(verifyPin('1235', salt, hash)).toBe(false);
    expect(verifyPin('', salt, hash)).toBe(false);
  });

  it('generates unique salts across multiple hashes of identical PIN', () => {
    const res1 = hashPin('9876');
    const res2 = hashPin('9876');

    expect(res1.salt).not.toBe(res2.salt);
    expect(res1.hash).not.toBe(res2.hash);

    expect(verifyPin('9876', res1.salt, res1.hash)).toBe(true);
    expect(verifyPin('9876', res2.salt, res2.hash)).toBe(true);
  });

  it('creates and verifies cryptographically signed session tokens', () => {
    const secret = 'test-secret-salt-12345';
    const token = createSessionToken(secret);

    expect(token).toBeDefined();
    expect(token).toContain('.');

    // Valid token validates to true
    expect(verifySessionToken(token, secret)).toBe(true);

    // Tampered token validates to false
    const tampered = token.slice(0, -3) + 'xyz';
    expect(verifySessionToken(tampered, secret)).toBe(false);

    // Different secret validates to false
    expect(verifySessionToken(token, 'different-secret')).toBe(false);
  });

  it('rejects expired session tokens', () => {
    const secret = 'test-secret-salt-12345';
    // Expired 8 days ago (over 7 days default)
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const expiredToken = createSessionToken(secret, eightDaysAgo);

    expect(verifySessionToken(expiredToken, secret)).toBe(false);
  });

  it('requireAdminAuth resolves without throwing in test environment', async () => {
    await expect(requireAdminAuth()).resolves.toBeUndefined();
  }, 15000);

  describe('PIN Rate Limiting and Lockout Defense', () => {
    it('tracks failed attempts and locks out after 5 consecutive failures', async () => {
      resetAllRateLimits();
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

      // Attempts 1 to 4 should report remaining attempts
      for (let i = 1; i <= 4; i++) {
        const res = await verifyAdminPin('9999');
        expect(res.success).toBe(false);
        expect(res.error).toContain(`${5 - i} attempt`);
      }

      // 5th attempt triggers lockout
      const fifth = await verifyAdminPin('9999');
      expect(fifth.success).toBe(false);
      expect(fifth.error).toContain('Keypad locked for 30 seconds');

      // Subsequent attempt while locked remains locked
      const sixth = await verifyAdminPin('9999');
      expect(sixth.success).toBe(false);
      expect(sixth.error).toMatch(/Keypad locked for \d+ seconds?/);

      // Calling internal resetAllRateLimits resets the lockout state
      resetAllRateLimits();
      const afterReset = await verifyAdminPin('9999');
      expect(afterReset.success).toBe(false);
      expect(afterReset.error).toContain('4 attempts remaining');

      resetAllRateLimits();
    });
  });
});

