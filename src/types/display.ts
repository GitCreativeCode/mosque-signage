/**
 * Kiosk Display Choreography State Contracts
 * MosqueSignage (TV)
 */

import type { Poster, QrPosition } from './poster';
import type { JummahShift } from './prayer';
import type { DateDisplayMode } from './settings';

export type DrawerType = 'DAILY_PRAYER' | 'JUMMAH' | null;

export interface MiniPillState {
  readonly prayer_name: string;
  readonly time_display: string;
  readonly minutes_remaining: number;
  readonly seconds_remaining?: number | undefined;
  readonly target_iso?: string | undefined;
  readonly status: 'COUNTDOWN' | 'STARTING_NOW';
}

export interface QrCardState {
  readonly url: string;
  readonly label: string;
  readonly position?: QrPosition | undefined;
}

export interface HeaderState {
  readonly hijri_date: string;
  readonly gregorian_date?: string | undefined;
  readonly date_format?: DateDisplayMode | undefined;
  readonly clock_time: string;
  readonly ticker: string;
  readonly is_clock_unsynchronized?: boolean | undefined;
}

export interface DisplayState {
  readonly active_poster: Poster | null;
  readonly is_drawer_open: boolean;
  readonly drawer_type: DrawerType;
  readonly mini_pill: MiniPillState | null;
  readonly next_prayer?: MiniPillState | null | undefined;
  readonly qr_card: QrCardState | null;
  readonly header: HeaderState;
  readonly resolved_jummah_shifts?: readonly JummahShift[] | undefined;
}

