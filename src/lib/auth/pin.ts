/**
 * Database-Backed Admin PIN Verification & Auth Re-Exports
 * MosqueSignage (TV)
 */

import { db } from '../db/client';
import { settingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPin, verifyPin } from './crypto';

export {
  PBKDF2_ITERATIONS,
  getSessionSecret,
  resetCachedSessionSecret,
  isLegacySha256Hash,
  hashPin,
  verifyPin,
  createSessionToken,
  verifySessionToken,
} from './crypto';

/**
 * Validates the entered admin PIN against SQLite settings without creating a session.
 * Internal library function (NOT an exposed Server Action).
 */
export async function verifyAdminPinOnly(pin: string): Promise<boolean> {
  if (!pin || typeof pin !== 'string') return false;

  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
  const row = rows[0];

  let salt = row?.admin_pin_salt;
  let hash = row?.admin_pin_hash;

  if (!hash || !salt) {
    const def = hashPin('1234');
    salt = def.salt;
    hash = def.hash;
  }

  return verifyPin(pin.trim(), salt, hash);
}
