/**
 * Pure Poster Schedule Window Filtering & Transition Timing
 * MosqueSignage (TV)
 */

import { calculatePosterStatus } from '@/lib/engine/index';
import type { Poster } from '@/types/index';

export interface PublicActivePostersFilterResult {
  readonly activePosters: Poster[];
  readonly nextTransitionAt: string | null;
}

export function filterPublicActivePosters(
  posters: readonly Poster[],
  now: Date = new Date()
): PublicActivePostersFilterResult {
  const activePosters: Poster[] = [];
  let earliestFutureTransitionMs = Infinity;
  const nowMs = now.getTime();

  for (const poster of posters) {
    if (!poster.is_active) continue;
    const status = calculatePosterStatus(poster, now);
    if (status === 'ACTIVE') {
      activePosters.push(poster);
      if (poster.end_at) {
        const endMs = new Date(poster.end_at).getTime();
        if (endMs > nowMs && endMs < earliestFutureTransitionMs) {
          earliestFutureTransitionMs = endMs;
        }
      }
    } else if (status === 'UPCOMING') {
      const startMs = new Date(poster.start_at).getTime();
      if (startMs > nowMs && startMs < earliestFutureTransitionMs) {
        earliestFutureTransitionMs = startMs;
      }
    }
  }

  const nextTransitionAt = Number.isFinite(earliestFutureTransitionMs)
    ? new Date(earliestFutureTransitionMs).toISOString()
    : null;

  return { activePosters, nextTransitionAt };
}

