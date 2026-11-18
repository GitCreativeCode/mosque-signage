/**
 * Persistent SQLite & In-Memory Per-Client and Appliance Rate Limiter
 * MosqueSignage (TV)
 */

import { sqlite } from '../db/client';

const MAX_FAILED_ATTEMPTS = 5;
const GLOBAL_MAX_FAILED_ATTEMPTS = 10;
const GLOBAL_LOCKOUT_MS = 30 * 1000;
const GLOBAL_KEY = 'global:appliance';

export const BACKOFF_TIER_DURATIONS_MS: readonly number[] = [
  30 * 1000, // Tier 1: 30s
  2 * 60 * 1000, // Tier 2: 2m
  15 * 60 * 1000, // Tier 3: 15m
  60 * 60 * 1000, // Tier 4+: 60m
];

interface MemoryRecord {
  count: number;
  tier: number;
  lockedUntil: number | null;
}

const memoryStore = new Map<string, MemoryRecord>();

function readRateLimit(key: string): {
  count: number;
  tier: number;
  lockedUntil: number | null;
} {
  try {
    const row = sqlite
      .prepare('SELECT failed_attempts, lockout_tier, locked_until FROM auth_rate_limits WHERE client_key = ?')
      .get(key) as { failed_attempts: number; lockout_tier: number; locked_until: number | null } | undefined;
    if (row) {
      return {
        count: row.failed_attempts,
        tier: row.lockout_tier,
        lockedUntil: row.locked_until,
      };
    }
  } catch {
    // SQLite query failed or table not yet available; fall back to memory
  }
  const mem = memoryStore.get(key);
  return {
    count: mem?.count ?? 0,
    tier: mem?.tier ?? 0,
    lockedUntil: mem?.lockedUntil ?? null,
  };
}

function writeRateLimit(
  key: string,
  count: number,
  tier: number,
  lockedUntil: number | null,
  nowMs: number
): void {
  try {
    sqlite
      .prepare(
        `INSERT INTO auth_rate_limits (client_key, failed_attempts, lockout_tier, locked_until, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(client_key) DO UPDATE SET
           failed_attempts = excluded.failed_attempts,
           lockout_tier = excluded.lockout_tier,
           locked_until = excluded.locked_until,
           updated_at = excluded.updated_at`
      )
      .run(key, count, tier, lockedUntil, nowMs);
  } catch {
    // Fall back to memory
  }
  memoryStore.set(key, { count, tier, lockedUntil });
}

function deleteRateLimit(key: string): void {
  try {
    sqlite.prepare('DELETE FROM auth_rate_limits WHERE client_key = ?').run(key);
  } catch {
    // Fall back to memory
  }
  memoryStore.delete(key);
}

export function resetAllRateLimits(): void {
  try {
    sqlite.prepare('DELETE FROM auth_rate_limits').run();
  } catch {
    // Fall back to memory
  }
  memoryStore.clear();
}

export function getTierDurationMs(tier: number): number {
  const index = Math.max(0, Math.min(tier - 1, BACKOFF_TIER_DURATIONS_MS.length - 1));
  return BACKOFF_TIER_DURATIONS_MS[index] ?? 30 * 1000;
}

export function formatTierDuration(tier: number): string {
  switch (tier) {
    case 1:
      return '30 seconds';
    case 2:
      return '2 minutes';
    case 3:
      return '15 minutes';
    default:
      return '60 minutes';
  }
}

export function getLockoutError(
  clientKey: string,
  nowMs: number,
  includeGlobal: boolean,
  actionWord: 'Keypad' | 'Action' | 'Login' = 'Keypad'
): string | null {
  if (includeGlobal) {
    const gRecord = readRateLimit(GLOBAL_KEY);
    if (gRecord.lockedUntil && gRecord.lockedUntil > nowMs) {
      const secs = Math.ceil((gRecord.lockedUntil - nowMs) / 1000);
      return `Too many failed attempts. ${actionWord} locked for ${secs} second${secs === 1 ? '' : 's'}.`;
    }
  }

  const record = readRateLimit(clientKey);
  if (record.lockedUntil && record.lockedUntil > nowMs) {
    const secs = Math.ceil((record.lockedUntil - nowMs) / 1000);
    return `Too many failed attempts. ${actionWord} locked for ${secs} second${secs === 1 ? '' : 's'}.`;
  }

  return null;
}

export function recordFailedPinAttempt(
  clientKey: string,
  nowMs: number,
  trackGlobal: boolean,
  actionWord: 'Keypad' | 'Action' | 'Login' = 'Keypad',
  prefix: string = 'Incorrect PIN. Please try again'
): string {
  if (trackGlobal) {
    const gRecord = readRateLimit(GLOBAL_KEY);
    const gPrev = gRecord.lockedUntil && gRecord.lockedUntil <= nowMs ? 0 : gRecord.count;
    const gCount = gPrev + 1;
    const gLocked = gCount >= GLOBAL_MAX_FAILED_ATTEMPTS ? nowMs + GLOBAL_LOCKOUT_MS : null;
    writeRateLimit(GLOBAL_KEY, gCount, gLocked ? 1 : 0, gLocked, nowMs);
  }

  const current = readRateLimit(clientKey);
  const isPostLockout = Boolean(current.lockedUntil && current.lockedUntil <= nowMs);

  let newCount: number;
  let newTier: number;
  let newLockedUntil: number | null = null;

  if (isPostLockout) {
    // Client previously locked out, now failing again -> increment backoff tier
    newCount = current.count + 1;
    newTier = Math.min(current.tier + 1, BACKOFF_TIER_DURATIONS_MS.length);
    newLockedUntil = nowMs + getTierDurationMs(newTier);
    writeRateLimit(clientKey, newCount, newTier, newLockedUntil, nowMs);
    return `Too many failed attempts. ${actionWord} locked for ${formatTierDuration(newTier)}.`;
  }

  newCount = current.count + 1;
  if (newCount >= MAX_FAILED_ATTEMPTS) {
    newTier = 1;
    newLockedUntil = nowMs + getTierDurationMs(1);
    writeRateLimit(clientKey, newCount, newTier, newLockedUntil, nowMs);
    return `Too many failed attempts. ${actionWord} locked for 30 seconds.`;
  }

  writeRateLimit(clientKey, newCount, current.tier, null, nowMs);
  const remaining = MAX_FAILED_ATTEMPTS - newCount;
  const suffix = `(${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`;
  return `${prefix} ${suffix}.`.replace('..', '.');
}

export function clearClientRateLimit(clientKey: string, clearGlobal: boolean): void {
  deleteRateLimit(clientKey);
  if (clearGlobal) {
    deleteRateLimit(GLOBAL_KEY);
  }
}
