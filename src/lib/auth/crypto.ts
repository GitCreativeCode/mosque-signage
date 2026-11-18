/**
 * Pure Cryptographic & Session Token Helpers
 * MosqueSignage (TV)
 *
 * Intentionally free of database imports so migrations and tests can hash/verify
 * PINs and session tokens without introducing a cycle through src/lib/db/client.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const PBKDF2_ITERATIONS = 100_000;
const SHA512_KEYLEN = 64;
const LEGACY_SHA256_KEYLEN = 32;

let cachedSessionSecret: string | null = null;

/**
 * Resolves the signing secret for admin session tokens.
 * Priority:
 * 1. process.env.ADMIN_SESSION_SECRET or process.env.SESSION_SECRET
 * 2. Cached in-memory secret
 * 3. Secret persisted in data/.session_secret
 * 4. Fresh cryptographically generated 32-byte hex secret
 */
export function getSessionSecret(): string {
  const envSecret = process.env.ADMIN_SESSION_SECRET ?? process.env.SESSION_SECRET;
  if (envSecret && envSecret.trim().length >= 16) {
    return envSecret.trim();
  }
  if (cachedSessionSecret) return cachedSessionSecret;

  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    const secretPath = path.join(dataDir, '.session_secret');
    if (fs.existsSync(secretPath)) {
      const persisted = fs.readFileSync(secretPath, 'utf-8').trim();
      if (persisted.length >= 32) {
        cachedSessionSecret = persisted;
        return persisted;
      }
    }
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, generated, { encoding: 'utf-8', mode: 0o600 });
    cachedSessionSecret = generated;
    return generated;
  } catch {
    const fallback = crypto.randomBytes(32).toString('hex');
    cachedSessionSecret = fallback;
    return fallback;
  }
}

/**
 * Resets the in-memory cached session secret (for isolated unit tests).
 */
export function resetCachedSessionSecret(): void {
  cachedSessionSecret = null;
}

/**
 * Returns true if a stored PIN hash is a legacy 32-byte (64-hex-char) PBKDF2-SHA256 digest.
 */
export function isLegacySha256Hash(expectedHash: string): boolean {
  return expectedHash.length === LEGACY_SHA256_KEYLEN * 2;
}

/**
 * Hashes a trimmed admin PIN with a cryptographic salt using PBKDF2 (100,000 iterations).
 * Uses SHA-512 (64-byte digest) for all new hashes; supports legacy SHA-256 only during verification.
 */
export function hashPin(
  pin: string,
  existingSalt?: string,
  algorithm: 'sha512' | 'sha256' = 'sha512'
): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const keylen = algorithm === 'sha512' ? SHA512_KEYLEN : LEGACY_SHA256_KEYLEN;
  const hash = crypto
    .pbkdf2Sync(pin.trim(), salt, PBKDF2_ITERATIONS, keylen, algorithm)
    .toString('hex');
  return { hash, salt };
}

/**
 * Performs a constant-time verification of a PIN against a stored salt and hex digest.
 * Accepts both current 128-char SHA-512 hashes and legacy 64-char SHA-256 hashes.
 */
export function verifyPin(pin: string, salt: string, expectedHash: string): boolean {
  if (!pin || !salt || !expectedHash) return false;
  const algorithm = isLegacySha256Hash(expectedHash)
    ? 'sha256'
    : expectedHash.length === SHA512_KEYLEN * 2
      ? 'sha512'
      : null;
  if (!algorithm) return false;

  try {
    const { hash } = hashPin(pin, salt, algorithm);
    const actual = Buffer.from(hash, 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export const hashSecret = hashPin;
export const verifySecret = verifyPin;

export function constantTimeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

const DUMMY_SALT = '0123456789abcdef0123456789abcdef';
const DUMMY_HASH = hashPin('dummy_timing_defense_seed', DUMMY_SALT).hash;

export function verifyDummyPasswordTimingDefense(password: string): void {
  verifyPin(password, DUMMY_SALT, DUMMY_HASH);
}

/**
 * Creates an HMAC-SHA256 signed session token for the admin cookie.
 * Formats as `timestamp.version.signature` where version tracks session revocation.
 */
export function createSessionToken(
  secret: string = getSessionSecret(),
  timestampOverride?: number,
  sessionVersion: number = 1
): string {
  const timestamp = (timestampOverride ?? Date.now()).toString();
  const versionStr = sessionVersion.toString();
  const payload = `${timestamp}.${versionStr}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function parseSessionToken(token: string | null | undefined): {
  timestamp: number;
  sessionVersion: number;
} | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length === 3) {
    const tsStr = parts[0];
    const verStr = parts[1];
    if (tsStr && verStr) {
      const ts = parseInt(tsStr, 10);
      const ver = parseInt(verStr, 10);
      if (!Number.isNaN(ts) && ts > 0 && !Number.isNaN(ver) && ver > 0) {
        return { timestamp: ts, sessionVersion: ver };
      }
    }
  }
  if (parts.length === 2) {
    const tsStr = parts[0];
    if (tsStr) {
      const ts = parseInt(tsStr, 10);
      if (!Number.isNaN(ts) && ts > 0) {
        return { timestamp: ts, sessionVersion: 1 };
      }
    }
  }
  return null;
}

/**
 * Verifies a signed session token signature, age window, and optional session version.
 */
export function verifySessionToken(
  token: string | null | undefined,
  secret: string = getSessionSecret(),
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000,
  expectedSessionVersion?: number
): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2 && parts.length !== 3) return false;

  let timestampStr: string;
  let tokenVersion: number | null = null;
  let signature: string;
  let payloadToSign: string;

  if (parts.length === 3) {
    const [ts, ver, sig] = parts;
    if (!ts || !ver || !sig) return false;
    timestampStr = ts;
    tokenVersion = parseInt(ver, 10);
    signature = sig;
    payloadToSign = `${ts}.${ver}`;
  } else {
    const [ts, sig] = parts;
    if (!ts || !sig) return false;
    timestampStr = ts;
    signature = sig;
    payloadToSign = ts;
  }

  const parsedTimestamp = parseInt(timestampStr, 10);
  if (Number.isNaN(parsedTimestamp) || parsedTimestamp <= 0) return false;
  if (tokenVersion !== null && (Number.isNaN(tokenVersion) || tokenVersion <= 0)) {
    return false;
  }

  if (expectedSessionVersion !== undefined) {
    if (tokenVersion !== null) {
      if (tokenVersion !== expectedSessionVersion) return false;
    } else if (expectedSessionVersion !== 1) {
      return false;
    }
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
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

