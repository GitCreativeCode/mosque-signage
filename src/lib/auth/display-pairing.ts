'use server';

/**
 * Display Pairing & Device Authorization Server Actions
 * MosqueSignage (TV)
 */

import crypto from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db/client';
import { displayPairingCodesTable, settingsTable } from '@/lib/db/schema';
import { getVenueSettingsCore } from '@/lib/actions/settings';
import { requireAdminAuth, checkAdminAuth } from '@/lib/actions/auth';
import { eventBus } from '@/lib/events/event-bus';
import {
  DISPLAY_COOKIE_MAX_AGE_MS,
  DISPLAY_COOKIE_NAME,
  createDisplaySessionToken,
  generateRandomPairingCode,
  hashPairingCode,
  isLocalhostIp,
  normalizePairingCode,
  verifyDisplaySessionToken,
} from './display-tokens';

export async function resolveClientIp(): Promise<string> {
  const isTrustedProxy = process.env.TRUST_PROXY_HEADERS === 'true';
  if (!isTrustedProxy) {
    // When direct (no trusted reverse proxy), client-controlled headers cannot be trusted.
    // Default safely to a remote LAN client identifier so pairing is strictly enforced.
    return 'lan-client';
  }

  try {
    const headerStore = await headers();
    const cfIp = headerStore.get('cf-connecting-ip')?.trim();
    if (cfIp) return cfIp;

    const forwarded = headerStore.get('x-forwarded-for');
    if (forwarded) {
      const first = forwarded.split(',')[0]?.trim();
      if (first) return first;
    }
    const realIp = headerStore.get('x-real-ip');
    if (realIp) return realIp.trim();
  } catch {
    // headers() throws in non-request test contexts
    return '127.0.0.1';
  }
  return 'lan-client';
}

export async function isLocalhostRequest(): Promise<boolean> {
  const ip = await resolveClientIp();
  return isLocalhostIp(ip);
}

export async function verifyCurrentDisplaySession(): Promise<boolean> {
  const settings = await getVenueSettingsCore();

  // 1. If pairing is not required, display is open
  if (settings.display_access_mode !== 'pairing_required') {
    return true;
  }

  // 2. Localhost TV bypass
  if (settings.display_allow_localhost && (await isLocalhostRequest())) {
    return true;
  }

  // 3. Admin session bypass
  const { authenticated: isAdmin } = await checkAdminAuth();
  if (isAdmin) {
    return true;
  }

  // 4. Paired-TV session cookie check
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(DISPLAY_COOKIE_NAME)?.value;
    const currentVersion = settings.display_session_version ?? 1;
    return verifyDisplaySessionToken(token, currentVersion);
  } catch {
    return false;
  }
}

export async function generateDisplayPairingCode(): Promise<{ code: string; expiresAt: string }> {
  await requireAdminAuth();
  const code = generateRandomPairingCode();
  const codeHash = hashPairingCode(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes TTL

  await db.insert(displayPairingCodesTable).values({
    id: crypto.randomUUID(),
    code_hash: codeHash,
    created_at: now.toISOString(),
    expires_at: expiresAt,
    consumed_at: null,
  });

  return { code, expiresAt };
}

export async function redeemDisplayPairingCode(
  rawCode: string
): Promise<{ success: boolean; error?: string }> {
  const normalized = normalizePairingCode(rawCode);
  if (normalized.length !== 6) {
    return { success: false, error: 'Pairing code must be 6 characters.' };
  }

  const codeHash = hashPairingCode(normalized);
  const rows = await db
    .select()
    .from(displayPairingCodesTable)
    .where(and(eq(displayPairingCodesTable.code_hash, codeHash)));

  const entry = rows[0];
  if (!entry || entry.consumed_at) {
    return { success: false, error: 'Invalid or already used pairing code.' };
  }

  if (new Date(entry.expires_at).getTime() < Date.now()) {
    return { success: false, error: 'This pairing code has expired.' };
  }

  const nowIso = new Date().toISOString();
  await db
    .update(displayPairingCodesTable)
    .set({ consumed_at: nowIso })
    .where(eq(displayPairingCodesTable.id, entry.id));

  const settings = await getVenueSettingsCore();
  const currentVersion = settings.display_session_version ?? 1;
  const token = createDisplaySessionToken(currentVersion);

  try {
    const cookieStore = await cookies();
    cookieStore.set(DISPLAY_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(DISPLAY_COOKIE_MAX_AGE_MS / 1000), // 1 year in seconds
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
      console.error('Failed to write display session cookie:', err);
    }
  }

  return { success: true };
}

export async function revokeAllPairedDisplays(): Promise<void> {
  await requireAdminAuth();
  await db
    .update(settingsTable)
    .set({
      display_session_version: sql`${settingsTable.display_session_version} + 1`,
      updated_at: new Date().toISOString(),
    })
    .where(eq(settingsTable.id, 'global'));

  eventBus.emitEvent('SETTINGS_UPDATED', {
    timestamp: new Date().toISOString(),
  });
}
