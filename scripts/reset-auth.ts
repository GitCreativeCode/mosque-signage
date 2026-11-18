import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { hashPin, hashSecret } from '@/lib/auth/crypto';
import { validatePassword, validateUsername } from '@/lib/auth/credentials';
import { settingsTable, authRateLimitsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { db } from '@/lib/db/client';

export interface ResetPinOptions { readonly dbOverride?: unknown; }
export interface ResetPinResult { readonly success: boolean; readonly pin: string; readonly error?: string; }
export interface ResetPasswordResult { readonly success: boolean; readonly username: string; readonly error?: string; }

/**
 * Core function to reset the Admin PIN and restore PIN mode in SQLite.
 */
export async function resetPinCore(
  newPin: string = '1234',
  options?: ResetPinOptions
): Promise<ResetPinResult> {
  const cleanPin = (newPin || '1234').trim();

  if (!/^\d{4,8}$/.test(cleanPin)) {
    return {
      success: false,
      pin: cleanPin,
      error: 'PIN must be between 4 and 8 digits (numeric only).',
    };
  }

  const { hash, salt } = hashPin(cleanPin);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetDb = (options?.dbOverride as any) ?? (await import('@/lib/db/client')).db;
    const nowIso = new Date().toISOString();

    const existing = await targetDb
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.id, 'global'));

    if (existing.length === 0) {
      await targetDb.insert(settingsTable).values({
        id: 'global',
        mosque_name: 'Islamic Community Center',
        ticker_text: 'Welcome to Islamic Community Center',
        timezone: 'America/Toronto',
        auth_mode: 'pin',
        admin_pin_hash: hash,
        admin_pin_salt: salt,
        admin_password_hash: null,
        admin_password_salt: null,
        updated_at: nowIso,
      });
    } else {
      await targetDb
        .update(settingsTable)
        .set({
          auth_mode: 'pin',
          admin_pin_hash: hash,
          admin_pin_salt: salt,
          admin_password_hash: null,
          admin_password_salt: null,
          updated_at: nowIso,
        })
        .where(eq(settingsTable.id, 'global'));
    }

    try {
      await targetDb.delete(authRateLimitsTable);
    } catch {
      // Ignore if table doesn't exist in isolated mocks
    }

    return { success: true, pin: cleanPin };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, pin: cleanPin, error: `Failed to update database: ${msg}` };
  }
}

/**
 * Core function to reset the Admin Password and Username in SQLite.
 */
export async function resetPasswordCore(
  newUsername: string,
  newPassword: string,
  options?: ResetPinOptions
): Promise<ResetPasswordResult> {
  const userErr = validateUsername(newUsername);
  if (userErr) return { success: false, username: newUsername, error: userErr };

  const passErr = validatePassword(newPassword);
  if (passErr) return { success: false, username: newUsername, error: passErr };

  const { hash, salt } = hashSecret(newPassword);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetDb = (options?.dbOverride as any) ?? (await import('@/lib/db/client')).db;
    const nowIso = new Date().toISOString();

    await targetDb
      .update(settingsTable)
      .set({
        auth_mode: 'password',
        admin_username: newUsername.trim(),
        admin_password_hash: hash,
        admin_password_salt: salt,
        updated_at: nowIso,
      })
      .where(eq(settingsTable.id, 'global'));

    try {
      await targetDb.delete(authRateLimitsTable);
    } catch {
      // Ignore in mock DBs
    }

    return { success: true, username: newUsername.trim() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, username: newUsername, error: `Failed to update database: ${msg}` };
  }
}

/**
 * Interactive command-line recovery interface for administrators.
 */
export async function runInteractiveCli(): Promise<void> {
  const args = process.argv.slice(2);
  const yesFlag = args.includes('--yes') || args.includes('-y');
  const pinIndex = args.indexOf('--pin');
  const pinFromArg = pinIndex !== -1 && args[pinIndex + 1] ? args[pinIndex + 1] : undefined;

  if (yesFlag) {
    const chosenPin = pinFromArg || '1234';
    const res = await resetPinCore(chosenPin);
    if (!res.success) {
      console.error(`\n[ERROR] ${res.error}\n`);
      process.exitCode = 1;
      return;
    }
    console.log(`\n[SUCCESS] Auth mode set to PIN. Admin PIN reset to: ${res.pin}\n`);
    return;
  }

  if (!process.stdin.isTTY) {
    console.error('\n[ERROR] Non-interactive environment detected. Use --yes flag.\n');
    process.exitCode = 1;
    return;
  }

  const { db } = await import('@/lib/db/client');
  const settingsRows = await db.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
  const currentSettings = settingsRows[0];
  const currentMode = currentSettings?.auth_mode ?? 'pin';
  const currentUsername = currentSettings?.admin_username ?? 'admin';

  const rl = readline.createInterface({ input, output });
  let isDone = false;

  const handleInterrupt = () => {
    if (!isDone) {
      isDone = true;
      console.log('\n\n[CANCELED] Operation aborted by user.\n');
      try { rl.close(); } catch {}
      process.exit(0);
    }
  };

  rl.on('close', handleInterrupt);
  process.on('SIGINT', handleInterrupt);

  try {
    console.log('\n==================================================');
    console.log('       Mosque Signage - Admin Auth Recovery');
    console.log('==================================================\n');

    if (currentMode === 'password') {
      console.log('Current Auth Mode: Username + Password');
      console.log(`Current Username : ${currentUsername}\n`);
      console.log('1. Change Admin Password (keep username)');
      console.log('2. Change both Username and Password');
      console.log('3. Switch back to PIN Mode (sets PIN 1234)');
      console.log('4. Cancel and exit\n');

      const choice = (await rl.question('Select an option (1-4): ')).trim();

      if (choice === '1' || choice === '2') {
        let username = currentUsername;
        if (choice === '2') {
          const uInput = (await rl.question(`Enter new username (press Enter for '${currentUsername}'): `)).trim();
          if (uInput) username = uInput;
        }

        const pInput = (await rl.question('Enter new password (min 8 chars, uppercase, number & symbol): ')).trim();
        const res = await resetPasswordCore(username, pInput);
        if (!res.success) {
          console.error(`\n[ERROR] ${res.error}\n`);
          process.exitCode = 1;
        } else {
          console.log(`\n[SUCCESS] Password updated for '${res.username}'. Rate limits cleared.\n`);
        }
      } else if (choice === '3') {
        const res = await resetPinCore('1234');
        console.log(`\n[SUCCESS] Switched to PIN Mode. Default PIN set to: ${res.pin}\n`);
      } else {
        console.log('\nOperation canceled.\n');
      }
    } else {
      console.log('Current Auth Mode: 4-8 Digit Numeric PIN\n');
      const pinInput = (await rl.question('Enter new 4-8 digit PIN (press Enter for "1234"): ')).trim();
      const chosen = pinInput === '' ? '1234' : pinInput;
      const res = await resetPinCore(chosen);
      if (!res.success) {
        console.error(`\n[ERROR] ${res.error}\n`);
        process.exitCode = 1;
      } else {
        console.log(`\n[SUCCESS] Admin PIN reset to: ${res.pin}. Rate limits cleared.\n`);
      }
    }
  } finally {
    isDone = true;
    process.removeListener('SIGINT', handleInterrupt);
    rl.close();
  }
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/reset-auth.ts');
if (isMain) {
  runInteractiveCli().catch((err) => {
    console.error('Fatal error resetting auth:', err);
    process.exit(1);
  });
}

