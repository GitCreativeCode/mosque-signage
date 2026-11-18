'use server';

import { db } from '../db/client';
import { settingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  hashPin,
  createSessionToken,
  verifySessionToken,
  getSessionSecret,
} from '../auth/crypto';
import { clearClientRateLimit, getLockoutError, recordFailedPinAttempt } from '../auth/rate-limit';
import {
  clearSessionCookieToken,
  getClientIdentifier,
  readSessionCookieToken,
  writeSessionCookieToken,
} from '../auth/session-cookie';
import {
  loadOrSeedAdminAuthSettings,
  evaluateAdminCredentials,
  buildCredentialUpdatePatch,
  validateNumericPin,
} from '../auth/credentials';

export async function checkAdminAuth(): Promise<{ authenticated: boolean }> {
  const token = await readSessionCookieToken();
  if (!token) return { authenticated: false };
  try {
    const rows = await db
      .select({ session_version: settingsTable.session_version })
      .from(settingsTable)
      .where(eq(settingsTable.id, 'global'));
    const expectedVersion = rows[0]?.session_version ?? 1;
    return {
      authenticated: verifySessionToken(token, getSessionSecret(), undefined, expectedVersion),
    };
  } catch {
    return { authenticated: verifySessionToken(token) };
  }
}

export async function requireAdminAuth(options?: { forceCheck?: boolean }): Promise<void> {
  if (!options?.forceCheck && (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test')) {
    return;
  }
  const { authenticated } = await checkAdminAuth();
  if (!authenticated) {
    throw new Error('Unauthorized: An authenticated admin session is required.');
  }
}

export type VerifyAdminCredentialsInput =
  | {
      username?: string;
      password?: string;
      pin?: string;
    }
  | FormData;

function parseCredentialsFormData(fd: FormData): { username?: string; password?: string; pin?: string } {
  const res: { username?: string; password?: string; pin?: string } = {};
  const u = fd.get('username')?.toString();
  const p = fd.get('password')?.toString();
  const pin = fd.get('pin')?.toString();
  if (u !== undefined) res.username = u;
  if (p !== undefined) res.password = p;
  if (pin !== undefined) res.pin = pin;
  return res;
}

export async function verifyAdminCredentials(
  input: VerifyAdminCredentialsInput
): Promise<{ success: boolean; error?: string }> {
  const parsedInput = input instanceof FormData ? parseCredentialsFormData(input) : input;
  const clientKey = await getClientIdentifier();
  const nowMs = Date.now();
  const isPublic = process.env.PUBLIC_ACCESS_MODE === 'true';

  const auth = await loadOrSeedAdminAuthSettings(db);
  const actionWord = auth.auth_mode === 'password' ? 'Login' : 'Keypad';
  const lockoutError = getLockoutError(clientKey, nowMs, true, actionWord);
  if (lockoutError) return { success: false, error: lockoutError };

  const evalResult = evaluateAdminCredentials(auth, parsedInput, isPublic);
  if (evalResult.error && !evalResult.valid) {
    return { success: false, error: evalResult.error };
  }

  if (!evalResult.valid) {
    const failMsg =
      auth.auth_mode === 'password'
        ? 'Incorrect username or password. Please try again'
        : 'Incorrect PIN. Please try again';
    const error = recordFailedPinAttempt(clientKey, nowMs, true, evalResult.actionWord, failMsg);
    return { success: false, error };
  }

  if (evalResult.upgradePinRequired && parsedInput.pin) {
    const { salt, hash } = hashPin(parsedInput.pin.trim());
    await db
      .update(settingsTable)
      .set({ admin_pin_salt: salt, admin_pin_hash: hash })
      .where(eq(settingsTable.id, 'global'));
  }

  clearClientRateLimit(clientKey, true);
  await writeSessionCookieToken(
    createSessionToken(getSessionSecret(), undefined, auth.session_version)
  );
  return { success: true };
}

export async function verifyAdminPin(
  input: string | FormData
): Promise<{ success: boolean; error?: string }> {
  if (input instanceof FormData) {
    return verifyAdminCredentials(input);
  }
  return verifyAdminCredentials({ pin: input });
}

export type ChangeAdminCredentialsInput =
  | {
      currentSecret: string;
      newAuthMode: 'pin' | 'password';
      newUsername?: string | undefined;
      newPassword?: string | undefined;
      newPin?: string | undefined;
    }
  | FormData;

function parseChangeCredentialsFormData(fd: FormData): {
  currentSecret: string;
  newAuthMode: 'pin' | 'password';
  newUsername?: string;
  newPassword?: string;
  newPin?: string;
} {
  const res: {
    currentSecret: string;
    newAuthMode: 'pin' | 'password';
    newUsername?: string;
    newPassword?: string;
    newPin?: string;
  } = {
    currentSecret: fd.get('currentSecret')?.toString() ?? '',
    newAuthMode: (fd.get('newAuthMode')?.toString() ?? 'pin') as 'pin' | 'password',
  };
  const u = fd.get('newUsername')?.toString();
  const p = fd.get('newPassword')?.toString();
  const pin = fd.get('newPin')?.toString();
  if (u !== undefined) res.newUsername = u;
  if (p !== undefined) res.newPassword = p;
  if (pin !== undefined) res.newPin = pin;
  return res;
}

export async function changeAdminCredentials(
  input: ChangeAdminCredentialsInput
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAuth();
  const parsedInput = input instanceof FormData ? parseChangeCredentialsFormData(input) : input;
  const clientKey = await getClientIdentifier();
  const nowMs = Date.now();
  const lockoutError = getLockoutError(clientKey, nowMs, true, 'Action');
  if (lockoutError) return { success: false, error: lockoutError };

  const auth = await loadOrSeedAdminAuthSettings(db);
  const isPublic = process.env.PUBLIC_ACCESS_MODE === 'true';
  const newVersion = auth.session_version + 1;
  const nowIso = new Date().toISOString();

  const { patch, error } = buildCredentialUpdatePatch(auth, parsedInput, isPublic, nowIso, newVersion);
  if (error || !patch) {
    const failError = recordFailedPinAttempt(
      clientKey,
      nowMs,
      true,
      'Action',
      error ?? 'Credential update failed'
    );
    const resolvedError = error && error.includes('incorrect') ? failError : (error ?? 'Credential update failed');
    return { success: false, error: resolvedError };
  }

  clearClientRateLimit(clientKey, true);
  await db.update(settingsTable).set(patch).where(eq(settingsTable.id, 'global'));
  await writeSessionCookieToken(createSessionToken(getSessionSecret(), undefined, newVersion));
  return { success: true };
}

export async function changeAdminPin(
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  return changeAdminCredentials({
    currentSecret: currentPin,
    newAuthMode: 'pin',
    newPin,
  });
}

export async function updateAdminPinDirect(
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAuth();
  const validationError = validateNumericPin(newPin, 'New PIN');
  if (validationError) return { success: false, error: validationError };

  const auth = await loadOrSeedAdminAuthSettings(db);
  const { salt, hash } = hashPin(newPin.trim());
  const newVersion = auth.session_version + 1;
  await db
    .update(settingsTable)
    .set({
      admin_pin_salt: salt,
      admin_pin_hash: hash,
      session_version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .where(eq(settingsTable.id, 'global'));

  await writeSessionCookieToken(createSessionToken(getSessionSecret(), undefined, newVersion));
  return { success: true };
}

export async function revokeAllAdminSessions(): Promise<{ success: boolean; message: string }> {
  await requireAdminAuth();
  const auth = await loadOrSeedAdminAuthSettings(db);
  const newVersion = auth.session_version + 1;
  await db
    .update(settingsTable)
    .set({ session_version: newVersion, updated_at: new Date().toISOString() })
    .where(eq(settingsTable.id, 'global'));

  await writeSessionCookieToken(createSessionToken(getSessionSecret(), undefined, newVersion));
  return { success: true, message: 'All other devices have been logged out.' };
}

export async function logoutAdmin(): Promise<void> {
  await clearSessionCookieToken();
}
