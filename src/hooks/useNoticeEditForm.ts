'use client';

import { useState, useEffect, useRef } from 'react';
import type { PosterWithStatus, NoticeTheme, QrPosition } from '@/types/index';
import { toLocalDatetimeString, fromLocalDatetimeString } from '@/lib/utils/time';

interface NoticeSnapshot {
  readonly headline: string;
  readonly description: string;
  readonly theme: NoticeTheme;
  readonly hasQr: boolean;
  readonly qrUrl: string;
  readonly qrLabel: string;
  readonly qrPosition: QrPosition;
  readonly duration: number;
  readonly isIndefinite: boolean;
  readonly startAt: string;
  readonly endAt: string;
  readonly recurringSchedule: string | null;
}

interface UseNoticeEditFormParams {
  readonly poster: PosterWithStatus;
  readonly onClose: () => void;
  readonly onUpdated: () => void;
  readonly onDirtyChange?: ((isDirty: boolean) => void) | undefined;
}

function isNoticeSnapshotDirty(snap: NoticeSnapshot | null, current: NoticeSnapshot): boolean {
  if (!snap) return false;
  return (
    current.headline.trim() !== snap.headline.trim() ||
    current.description.trim() !== snap.description.trim() ||
    current.theme !== snap.theme ||
    current.hasQr !== snap.hasQr ||
    (current.hasQr && current.qrUrl.trim() !== snap.qrUrl.trim()) ||
    (current.hasQr && current.qrLabel.trim() !== snap.qrLabel.trim()) ||
    (current.hasQr && current.qrPosition !== snap.qrPosition) ||
    current.duration !== snap.duration ||
    current.isIndefinite !== snap.isIndefinite ||
    current.startAt !== snap.startAt ||
    (!current.isIndefinite && current.endAt !== snap.endAt) ||
    current.recurringSchedule !== snap.recurringSchedule
  );
}

function validateNoticeFields(headline: string, description: string, isIndefinite: boolean, endAt: string): string | null {
  if (!headline.trim()) return 'Please provide a headline for the notice.';
  if (!description.trim()) return 'Please provide notice details.';
  if (!isIndefinite && !endAt) return 'Please select an expiration end date, or check "Run indefinitely".';
  return null;
}

/** Manages announcement notice loading, dirty snapshot diffing, validation, and submission. */
export function useNoticeEditForm({ poster, onClose, onUpdated, onDirtyChange }: UseNoticeEditFormParams) {
  const [headline, setHeadline] = useState(poster.title);
  const [description, setDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<NoticeTheme>('sapphire');
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  const [hasQr, setHasQr] = useState<boolean>(Boolean(poster.qr_url && poster.qr_url.trim().length > 0));
  const [qrUrl, setQrUrl] = useState<string>(poster.qr_url ?? '');
  const [qrLabel, setQrLabel] = useState<string>(poster.qr_label ?? 'Scan to Learn More');
  const [qrPosition, setQrPosition] = useState<QrPosition>(poster.qr_position ?? 'bottom-left');
  const [duration, setDuration] = useState<number>(poster.duration_seconds || 15);

  const [isIndefinite, setIsIndefinite] = useState<boolean>(poster.end_at === null || poster.end_at === undefined);
  const [recurringSchedule, setRecurringSchedule] = useState<string | null>(poster.recurring_schedule ?? null);
  const [startAt, setStartAt] = useState<string>(() => toLocalDatetimeString(poster.start_at));
  const [endAt, setEndAt] = useState<string>(() =>
    toLocalDatetimeString(poster.end_at ?? Date.now() + 14 * 86400000),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialSnapshotRef = useRef<NoticeSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { getAnnouncementDetails } = await import('@/lib/actions/announcements');
        const details = await getAnnouncementDetails(poster.id);
        if (!isMounted) return;
        const loadedHeadline = details?.headline ?? poster.title;
        const loadedDescription = details?.description ?? '';
        const loadedTheme = details?.theme ?? 'sapphire';
        if (details?.headline) setHeadline(details.headline);
        if (details?.description) setDescription(details.description);
        if (details?.theme) setSelectedTheme(details.theme);
        initialSnapshotRef.current = {
          headline: loadedHeadline, description: loadedDescription, theme: loadedTheme,
          hasQr, qrUrl, qrLabel, qrPosition, duration, isIndefinite, startAt, endAt,
          recurringSchedule: poster.recurring_schedule ?? null,
        };
      } catch (err) {
        console.warn('Could not read existing announcement details:', err);
        if (isMounted) {
          initialSnapshotRef.current = {
            headline, description, theme: selectedTheme,
            hasQr, qrUrl, qrLabel, qrPosition, duration, isIndefinite, startAt, endAt,
            recurringSchedule: poster.recurring_schedule ?? null,
          };
        }
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [poster.id]);

  const isDirty = isNoticeSnapshotDirty(initialSnapshotRef.current, {
    headline, description, theme: selectedTheme,
    hasQr, qrUrl, qrLabel, qrPosition, duration, isIndefinite, startAt, endAt,
    recurringSchedule,
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validateNoticeFields(headline, description, isIndefinite, endAt);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { updateAnnouncementSlide } = await import('@/lib/actions/announcements');
      await updateAnnouncementSlide({
        id: poster.id,
        headline: headline.trim(),
        description: description.trim(),
        theme: selectedTheme,
        start_at: fromLocalDatetimeString(startAt),
        end_at: isIndefinite ? null : fromLocalDatetimeString(endAt),
        duration_seconds: duration,
        qr_url: hasQr && qrUrl.trim() ? qrUrl.trim() : undefined,
        qr_label: hasQr && qrLabel.trim() ? qrLabel.trim() : undefined,
        qr_position: hasQr ? qrPosition : undefined,
        recurring_schedule: recurringSchedule,
      });
      onDirtyChange?.(false);
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    headline, setHeadline, description, setDescription, selectedTheme, setSelectedTheme,
    isLoadingDetails, hasQr, setHasQr, qrUrl, setQrUrl, qrLabel, setQrLabel,
    qrPosition, setQrPosition, duration, setDuration, isIndefinite, setIsIndefinite,
    recurringSchedule, setRecurringSchedule,
    startAt, setStartAt, endAt, setEndAt, isSubmitting, error, handleSubmit,
  };
}

