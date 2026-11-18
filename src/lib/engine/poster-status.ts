/**
 * Pure Poster Runtime Status & Active Schedule Filters
 * MosqueSignage (TV)
 */

import type { Poster, PosterStatus } from '@/types/index';

/**
 * Pure function: Computes runtime status of a poster relative to the injected 'now' timestamp.
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
 * Pure function: Filters all posters to those whose scheduling interval encompasses `now`.
 */
export function getActivePosters(allPosters: readonly Poster[], now: Date): Poster[] {
  const nowMs = now.getTime();

  return allPosters.filter((poster) => {
    if (poster.is_active === false) return false;
    const startMs = new Date(poster.start_at).getTime();
    if (startMs > nowMs) return false;
    if (poster.end_at === null || poster.end_at === undefined) return true;
    return nowMs <= new Date(poster.end_at).getTime();
  });
}

