import { describe, it, expect, beforeEach } from 'vitest';
import {
  DISPLAY_COOKIE_NAME,
  createDisplaySessionToken,
  generateRandomPairingCode,
  hashPairingCode,
  isLocalhostIp,
  normalizePairingCode,
  verifyDisplaySessionToken,
} from '@/lib/auth/display-tokens';
import {
  generateDisplayPairingCode,
  redeemDisplayPairingCode,
  revokeAllPairedDisplays,
} from '@/lib/auth/display-pairing';
import { db } from '@/lib/db/client';
import { settingsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Display Pairing & Paired-TV Session Subsystem', () => {
  describe('Pure Display Token Cryptography', () => {
    it('normalizes pairing codes by stripping hyphens and converting to uppercase', () => {
      expect(normalizePairingCode(' k7m-9x2 ')).toBe('K7M9X2');
      expect(normalizePairingCode('ab-cd-ef')).toBe('ABCDEF');
    });

    it('generates random 6-character codes strictly from the unambiguous charset', () => {
      for (let i = 0; i < 20; i++) {
        const code = generateRandomPairingCode();
        expect(code).toHaveLength(6);
        expect(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code)).toBe(true);
      }
    });

    it('hashes pairing codes deterministically using SHA-256', () => {
      const h1 = hashPairingCode('K7M9X2');
      const h2 = hashPairingCode('K7M9X2');
      const h3 = hashPairingCode('DIFFERENT');
      expect(h1).toBe(h2);
      expect(h1).not.toBe(h3);
      expect(h1).toHaveLength(64);
    });

    it('signs and verifies display session tokens with session version checking', () => {
      const token = createDisplaySessionToken(1);
      expect(verifyDisplaySessionToken(token, 1)).toBe(true);

      // Fails if version differs (revocation)
      expect(verifyDisplaySessionToken(token, 2)).toBe(false);

      // Fails if tampered
      const tampered = token.replace(/^1/, '2');
      expect(verifyDisplaySessionToken(tampered, 1)).toBe(false);

      // Fails if malformed
      expect(verifyDisplaySessionToken('invalid.token', 1)).toBe(false);
      expect(verifyDisplaySessionToken(null, 1)).toBe(false);
    });

    it('rejects expired display tokens exceeding 1-year max age window', () => {
      const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
      const expiredToken = createDisplaySessionToken(1, undefined, twoYearsAgo);
      expect(verifyDisplaySessionToken(expiredToken, 1)).toBe(false);
    });
  });

  describe('Localhost TV Bypass Detection', () => {
    it('correctly identifies loopback addresses for zero-maintenance local TVs', () => {
      expect(isLocalhostIp('127.0.0.1')).toBe(true);
      expect(isLocalhostIp('::1')).toBe(true);
      expect(isLocalhostIp('::ffff:127.0.0.1')).toBe(true);
      expect(isLocalhostIp('localhost')).toBe(true);
      expect(isLocalhostIp('127.0.0.99')).toBe(true);

      // Non-local addresses must NOT bypass
      expect(isLocalhostIp('192.168.1.150')).toBe(false);
      expect(isLocalhostIp('10.0.0.5')).toBe(false);
      expect(isLocalhostIp('172.16.0.2')).toBe(false);
      expect(isLocalhostIp('8.8.8.8')).toBe(false);
      expect(isLocalhostIp(null)).toBe(false);
    });
  });

  describe('Single-Use Code Redemption & Instant Revocation', () => {
    it('generates a single-use code that succeeds once and fails closed on replay', async () => {
      const { code } = await generateDisplayPairingCode();
      expect(code).toHaveLength(6);

      // First redemption: succeeds
      const firstRes = await redeemDisplayPairingCode(code);
      expect(firstRes.success).toBe(true);

      // Replay attempt with same code: fails closed
      const secondRes = await redeemDisplayPairingCode(code);
      expect(secondRes.success).toBe(false);
      expect(secondRes.error).toContain('already used');
    });

    it('fails closed on unknown or invalid pairing code', async () => {
      const badRes = await redeemDisplayPairingCode('ZZZZZZ');
      expect(badRes.success).toBe(false);
      expect(badRes.error).toContain('Invalid');
    });

    it('revoking all paired displays increments display_session_version and invalidates tokens', async () => {
      const settingsBefore = (await db.select().from(settingsTable).where(eq(settingsTable.id, 'global')))[0];
      const versionBefore = settingsBefore?.display_session_version ?? 1;

      // Issue token with current version
      const token = createDisplaySessionToken(versionBefore);
      expect(verifyDisplaySessionToken(token, versionBefore)).toBe(true);

      // Revoke all
      await revokeAllPairedDisplays();

      const settingsAfter = (await db.select().from(settingsTable).where(eq(settingsTable.id, 'global')))[0];
      const versionAfter = settingsAfter?.display_session_version ?? 1;
      expect(versionAfter).toBe(versionBefore + 1);

      // Previously issued token is now invalid against current version
      expect(verifyDisplaySessionToken(token, versionAfter)).toBe(false);
    });
  });
});
