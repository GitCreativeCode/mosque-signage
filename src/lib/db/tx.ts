/**
 * Serialized SQLite Transaction Helper
 * MosqueSignage (TV)
 */

import type { db } from './client';

let txQueue: Promise<unknown> = Promise.resolve();

type DrizzleTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Serializes async Drizzle transactions over sqlite-proxy so overlapping actions
 * never interleave nested BEGIN statements on the shared connection.
 */
export function runSerializedTransaction<T>(
  targetDb: typeof db,
  fn: (tx: DrizzleTx) => Promise<T>
): Promise<T> {
  const next = txQueue.then(() => {
    if (typeof (targetDb as { transaction?: unknown }).transaction === 'function') {
      return targetDb.transaction(fn, { behavior: 'immediate' });
    }
    return fn(targetDb as unknown as DrizzleTx);
  });
  txQueue = next.catch(() => undefined);
  return next;
}

