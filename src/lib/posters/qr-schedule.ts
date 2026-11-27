/**
 * Pure Deterministic QR Code Scheduling Engine
 * MosqueSignage (TV)
 */

export type QrScheduleStatus =
  | 'NO_QR'
  | 'ALWAYS_ACTIVE'
  | 'SCHEDULED_ACTIVE'
  | 'SCHEDULED_UPCOMING'
  | 'SCHEDULED_EXPIRED';

export interface QrScheduleStatusInfo {
  readonly status: QrScheduleStatus;
  readonly isActive: boolean;
  readonly label: string;
  readonly shortBadge: string;
  readonly color: 'emerald' | 'amber' | 'slate' | 'blue';
}

export interface QrScheduleSubject {
  readonly qr_url?: string | null | undefined;
  readonly qr_start_at?: string | null | undefined;
  readonly qr_end_at?: string | null | undefined;
}

function safeParseDate(iso?: string | null | undefined): Date | null {
  if (!iso || typeof iso !== 'string' || iso.trim().length === 0) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Validates that qr_end_at is strictly after qr_start_at if both are set.
 */
export function validateQrSchedule(
  qrStartAt?: string | null | undefined,
  qrEndAt?: string | null | undefined
): { readonly valid: boolean; readonly error?: string } {
  const start = safeParseDate(qrStartAt);
  const end = safeParseDate(qrEndAt);
  if (start && end && end.getTime() <= start.getTime()) {
    return { valid: false, error: 'QR schedule end time must be after start time' };
  }
  return { valid: true };
}

/**
 * Determines whether a poster's QR code should be rendered at the given point in time.
 * If no dates are set, defaults to active as long as qr_url is present.
 */
export function isPosterQrActive(
  subject: QrScheduleSubject | null | undefined,
  now: Date = new Date()
): boolean {
  if (!subject?.qr_url || subject.qr_url.trim().length === 0) return false;

  const nowMs = now.getTime();
  const start = safeParseDate(subject.qr_start_at);
  if (start && nowMs < start.getTime()) return false;

  const end = safeParseDate(subject.qr_end_at);
  if (end && nowMs >= end.getTime()) return false;

  return true;
}

function formatQrDate(date: Date, timezone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

/**
 * Evaluates the detailed operational status and UI badge telemetry for a poster's QR schedule.
 */
export function getQrScheduleStatus(
  subject: QrScheduleSubject | null | undefined,
  now: Date,
  timezone?: string
): QrScheduleStatusInfo {
  if (!subject?.qr_url || subject.qr_url.trim().length === 0) {
    const hasDates = Boolean(subject?.qr_start_at || subject?.qr_end_at);
    return {
      status: 'NO_QR',
      isActive: false,
      label: hasDates ? 'Not active — Missing link' : 'No QR Code',
      shortBadge: hasDates ? 'No Link' : 'None',
      color: hasDates ? 'amber' : 'slate',
    };
  }

  const start = safeParseDate(subject.qr_start_at);
  const end = safeParseDate(subject.qr_end_at);

  if (!start && !end) {
    return {
      status: 'ALWAYS_ACTIVE',
      isActive: true,
      label: 'Always Active (While slide is showing)',
      shortBadge: 'Active',
      color: 'emerald',
    };
  }

  const nowMs = now.getTime();

  if (start && nowMs < start.getTime()) {
    const formattedStart = formatQrDate(start, timezone);
    return {
      status: 'SCHEDULED_UPCOMING',
      isActive: false,
      label: `Scheduled: Unlocks ${formattedStart}`,
      shortBadge: `Starts ${formattedStart}`,
      color: 'amber',
    };
  }

  if (end && nowMs >= end.getTime()) {
    const formattedEnd = formatQrDate(end, timezone);
    return {
      status: 'SCHEDULED_EXPIRED',
      isActive: false,
      label: `Ended: ${formattedEnd}`,
      shortBadge: 'Ended',
      color: 'slate',
    };
  }

  // Active within window
  if (end) {
    const formattedEnd = formatQrDate(end, timezone);
    return {
      status: 'SCHEDULED_ACTIVE',
      isActive: true,
      label: `Active: Available until ${formattedEnd}`,
      shortBadge: `Until ${formattedEnd}`,
      color: 'blue',
    };
  }

  return {
    status: 'SCHEDULED_ACTIVE',
    isActive: true,
    label: 'Active (Scheduled)',
    shortBadge: 'Active',
    color: 'emerald',
  };
}

