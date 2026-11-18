/**
 * Pure Display Pairing Token Cryptography & Code Generators
 * MosqueSignage (TV)
 *
 * Zero database imports; pure HMAC and hashing operations.
 */

import crypto from 'node:crypto';
import { getSessionSecret } from './crypto';

export const DISPLAY_COOKIE_NAME = 'ms_display_session';
export const DISPLAY_PAIRING_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const DISPLAY_PAIRING_CODE_LENGTH = 6;
export const DISPLAY_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year (Paired-TV Mode)

const LOCALHOST_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']);

export function isLocalhostIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const clean = ip.trim().toLowerCase();
  return LOCALHOST_IPS.has(clean) || clean.startsWith('127.');
}

export function normalizePairingCode(rawCode: string): string {
  return rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function hashPairingCode(normalizedCode: string): string {
  return crypto.createHash('sha256').update(normalizedCode).digest('hex');
}

export function generateRandomPairingCode(): string {
  const bytes = crypto.randomBytes(DISPLAY_PAIRING_CODE_LENGTH);
  let result = '';
  for (let i = 0; i < DISPLAY_PAIRING_CODE_LENGTH; i++) {
    const byte = bytes[i] ?? 0;
    result += DISPLAY_PAIRING_CODE_CHARS[byte % DISPLAY_PAIRING_CODE_CHARS.length];
  }
  return result;
}

export function createDisplaySessionToken(
  sessionVersion: number,
  secret: string = getSessionSecret(),
  timestampOverride?: number
): string {
  const timestamp = (timestampOverride ?? Date.now()).toString();
  const versionStr = sessionVersion.toString();
  const payload = `${timestamp}.${versionStr}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyDisplaySessionToken(
  token: string | null | undefined,
  expectedVersion: number,
  secret: string = getSessionSecret(),
  maxAgeMs: number = DISPLAY_COOKIE_MAX_AGE_MS
): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [timestamp, versionStr, signature] = parts;
  if (!timestamp || !versionStr || !signature) return false;

  const parsedTimestamp = parseInt(timestamp, 10);
  const parsedVersion = parseInt(versionStr, 10);
  if (Number.isNaN(parsedTimestamp) || Number.isNaN(parsedVersion)) return false;
  if (parsedVersion !== expectedVersion) return false;

  const payload = `${timestamp}.${versionStr}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    const actual = Buffer.from(signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      return false;
    }
  } catch {
    return false;
  }

  const age = Date.now() - parsedTimestamp;
  return age >= 0 && age < maxAgeMs;
}
