/**
 * Pure Poster Schedule Window Filtering & Transition Timing
 * MosqueSignage (TV)
 */

import { calculatePosterStatus } from '@/lib/engine/index';
import type { Poster } from '@/types/index';
import {
  getNextRecurringTransition,
  isTimeInRecurringWindow,
  parseRecurringSchedule,
} from './recurring-schedule';

export interface PublicActivePostersFilterResult {
  readonly activePosters: Poster[];
  readonly nextTransitionAt: string | null;
}

export function filterPublicActivePosters(
  posters: readonly Poster[],
  now: Date = new Date(),
  timezone: string = 'UTC'
): PublicActivePostersFilterResult {
  const activePosters: Poster[] = [];
  let earliestFutureTransitionMs = Number.POSITIVE_INFINITY;
  const nowMs = now.getTime();

  for (const poster of posters) {
    if (!poster.is_active) continue;
    const status = calculatePosterStatus(poster, now);

    if (status === 'ACTIVE') {
      let isWindowActive = true;
      if (poster.recurring_schedule) {
        const rules = parseRecurringSchedule(poster.recurring_schedule);
        if (rules && rules.length > 0) {
          isWindowActive = isTimeInRecurringWindow(rules, now, timezone);

          const nextRecTrans = getNextRecurringTransition(rules, now, timezone);
          if (nextRecTrans) {
            const nextRecMs = nextRecTrans.getTime();
            if (nextRecMs > nowMs && nextRecMs < earliestFutureTransitionMs) {
              earliestFutureTransitionMs = nextRecMs;
            }
          }
        }
      }

      if (isWindowActive) {
        activePosters.push(poster);
      }

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
