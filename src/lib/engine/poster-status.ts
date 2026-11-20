/**
 * Pure Poster Runtime Status & Active Schedule Filters
 * MosqueSignage (TV)
 */

import type { Poster, PosterStatus } from '@/types/index';
import { isTimeInRecurringWindow, parseRecurringSchedule } from '@/lib/posters/recurring-schedule';

export type PosterRecurringSubStatus = 'CONTINUOUS' | 'ACTIVE_NOW' | 'STANDBY';

/**
 * Pure function: Computes runtime macro status of a poster relative to the injected 'now' timestamp.
 */
export function calculatePosterStatus(poster: Poster, now: Date): PosterStatus {
  if (poster.is_active === false) {
    return 'ARCHIVED';
  }
  const nowMs = now.getTime();
  const startMs = new Date(poster.start_at).getTime();

  if (nowMs < startMs) {
    return 'UPCOMING';
  }
  if (poster.end_at !== null && poster.end_at !== undefined) {
    const endMs = new Date(poster.end_at).getTime();
    if (nowMs > endMs) {
      return 'EXPIRED';
    }
  }
  return 'ACTIVE';
}

/**
 * Pure function: Computes recurring sub-status for an active poster (Continuous, Active Now, or Standby).
 */
export function getPosterRecurringSubStatus(
  poster: Poster,
  now: Date,
  timezone: string = 'UTC'
): PosterRecurringSubStatus {
  if (!poster.recurring_schedule) return 'CONTINUOUS';
  const rules = parseRecurringSchedule(poster.recurring_schedule);
  if (!rules || rules.length === 0) return 'CONTINUOUS';

  return isTimeInRecurringWindow(rules, now, timezone) ? 'ACTIVE_NOW' : 'STANDBY';
}

/**
 * Pure function: Filters all posters to those whose scheduling interval encompasses `now`,
 * verifying both the master date range and recurring weekly time windows.
 */
export function getActivePosters(
  allPosters: readonly Poster[],
  now: Date,
  timezone: string = 'UTC'
): Poster[] {
  const nowMs = now.getTime();

  return allPosters.filter((poster) => {
    if (poster.is_active === false) return false;
    const startMs = new Date(poster.start_at).getTime();
    if (startMs > nowMs) return false;
    if (poster.end_at !== null && poster.end_at !== undefined) {
      if (nowMs > new Date(poster.end_at).getTime()) return false;
    }

    if (poster.recurring_schedule) {
      const rules = parseRecurringSchedule(poster.recurring_schedule);
      if (rules && rules.length > 0) {
        return isTimeInRecurringWindow(rules, now, timezone);
      }
    }

    return true;
  });
}
