/**
 * Pure Admin Credential Validation & Loading Helpers
 * MosqueSignage (TV)
 */

import { eq } from 'drizzle-orm';
import type { db as dbType } from '../db/client';
import { settingsTable } from '../db/schema';
import {
  constantTimeStringEqual,
  hashPin,
  hashSecret,
  isLegacySha256Hash,
  verifyDummyPasswordTimingDefense,
  verifyPin,
  verifySecret,
} from './crypto';

export interface AdminAuthSettings {
  auth_mode: 'pin' | 'password';
  admin_username: string;
  admin_password_hash: string | null;
  admin_password_salt: string | null;
  admin_pin_hash: string;
  admin_pin_salt: string;
  session_version: number;
}

export function validateNumericPin(pin: string, label: string = 'PIN'): string | null {
  const clean = typeof pin === 'string' ? pin.trim() : '';
  if (clean.length < 4 || clean.length > 8 || !/^\d+$/.test(clean)) {
    return `${label} must be between 4 and 8 digits (numeric only).`;
  }
  return null;
}

export function validateUsername(username: string): string | null {
  const clean = typeof username === 'string' ? username.trim() : '';
  if (!clean || clean.length < 3 || clean.length > 50) {
    return 'Username must be between 3 and 50 characters.';
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(clean)) {
    return 'Username can only contain alphanumeric characters, underscores, dots, or hyphens.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  const clean = typeof password === 'string' ? password : '';
  if (clean.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(clean)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[a-z]/.test(clean)) {
    return 'Password must contain at least one lowercase letter (a-z).';
  }
  if (!/[0-9]/.test(clean)) {
    return 'Password must contain at least one number (0-9).';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(clean)) {
    return 'Password must contain at least one special symbol (!@#$%^&* etc.).';
  }
  return null;
}

export async function loadOrSeedAdminAuthSettings(
  database: typeof dbType
): Promise<AdminAuthSettings> {
  const rows = await database.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
  const row = rows[0];

  let pinHash = row?.admin_pin_hash;
  let pinSalt = row?.admin_pin_salt;

  if (!pinHash || !pinSalt) {
    const def = hashPin('1234');
    pinHash = def.hash;
    pinSalt = def.salt;
    await database
      .update(settingsTable)
      .set({ admin_pin_hash: pinHash, admin_pin_salt: pinSalt })
      .where(eq(settingsTable.id, 'global'));
  }

  return {
    auth_mode: (row?.auth_mode as 'pin' | 'password') ?? 'pin',
    admin_username: row?.admin_username?.trim() || 'admin',
    admin_password_hash: row?.admin_password_hash ?? null,
    admin_password_salt: row?.admin_password_salt ?? null,
    admin_pin_hash: pinHash,
    admin_pin_salt: pinSalt,
    session_version: row?.session_version ?? 1,
  };
}

export interface CredentialVerificationResult {
  valid: boolean;
  error?: string;
  actionWord: 'Keypad' | 'Login';
  upgradePinRequired?: boolean;
}

export function evaluateAdminCredentials(
  auth: AdminAuthSettings,
  input: { username?: string; password?: string; pin?: string },
  isPublicMode: boolean
): CredentialVerificationResult {
  if (auth.auth_mode === 'password') {
    const username = input.username?.trim();
    const password = input.password;
    if (!username || !password) {
      return { valid: false, error: 'Please enter your username and password.', actionWord: 'Login' };
    }
    if (!constantTimeStringEqual(username, auth.admin_username)) {
      verifyDummyPasswordTimingDefense(password);
      return { valid: false, actionWord: 'Login' };
    }
    if (!auth.admin_password_hash || !auth.admin_password_salt) {
      return {
        valid: false,
        error: 'Password authentication is not configured yet. Please configure it in settings.',
        actionWord: 'Login',
      };
    }
    const isValid = verifySecret(password, auth.admin_password_salt, auth.admin_password_hash);
    return { valid: isValid, actionWord: 'Login' };
  }

  const pin = input.pin?.trim();
  if (!pin) {
    return { valid: false, error: 'Please enter a PIN.', actionWord: 'Keypad' };
  }
  if (isPublicMode && pin === '1234') {
    return {
      valid: false,
      error: "Default factory PIN '1234' is disabled in public access mode. Please set a custom PIN or username and password.",
      actionWord: 'Keypad',
    };
  }
  const isValid = verifyPin(pin, auth.admin_pin_salt, auth.admin_pin_hash);
  const upgradeRequired = isValid && isLegacySha256Hash(auth.admin_pin_hash);
  return { valid: isValid, actionWord: 'Keypad', upgradePinRequired: upgradeRequired };
}

export function buildCredentialUpdatePatch(
  auth: AdminAuthSettings,
  input: {
    currentSecret: string;
    newAuthMode: 'pin' | 'password';
    newUsername?: string | undefined;
    newPassword?: string | undefined;
    newPin?: string | undefined;
  },
  isPublicMode: boolean,
  nowIso: string,
  newVersion: number
): { patch?: Record<string, unknown>; error?: string } {
  const currentSecret = input.currentSecret?.trim() ?? '';
  if (!currentSecret) {
    return { error: 'Please enter your current credential.' };
  }

  if (auth.auth_mode === 'password') {
    if (!auth.admin_password_hash || !auth.admin_password_salt) {
      return { error: 'Current password is not set.' };
    }
    if (!verifySecret(currentSecret, auth.admin_password_salt, auth.admin_password_hash)) {
      return { error: 'Current password is incorrect' };
    }
  } else if (!verifyPin(currentSecret, auth.admin_pin_salt, auth.admin_pin_hash)) {
    return { error: 'Current PIN is incorrect' };
  }

  if (input.newAuthMode === 'password') {
    const usernameErr = validateUsername(input.newUsername ?? '');
    if (usernameErr) return { error: usernameErr };
    const passwordErr = validatePassword(input.newPassword ?? '');
    if (passwordErr) return { error: passwordErr };

    const { salt, hash } = hashSecret(input.newPassword!);
    return {
      patch: {
        auth_mode: 'password',
        admin_username: input.newUsername!.trim(),
        admin_password_hash: hash,
        admin_password_salt: salt,
        session_version: newVersion,
        updated_at: nowIso,
      },
    };
  }

  if (isPublicMode) {
    return { error: 'PIN mode cannot be enabled when PUBLIC_ACCESS_MODE is active.' };
  }
  const pinErr = validateNumericPin(input.newPin ?? '', 'New PIN');
  if (pinErr) return { error: pinErr };

  const { salt, hash } = hashPin(input.newPin!.trim());
  return {
    patch: {
      auth_mode: 'pin',
      admin_pin_hash: hash,
      admin_pin_salt: salt,
      session_version: newVersion,
      updated_at: nowIso,
    },
  };
}
