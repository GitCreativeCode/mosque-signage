'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NoticeTheme, QrPosition } from '@/types/index';
import { toLocalDatetimeString, fromLocalDatetimeString } from '@/lib/utils/time';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';

function getDefaultEndLocalString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return toLocalDatetimeString(d);
}

function validateAnnouncementForm(
  headline: string,
  description: string,
  isIndefinite: boolean,
  endAt: string,
): string | null {
  if (!headline.trim()) return 'Please provide a headline for the notice.';
  if (!description.trim()) return 'Please provide notice details.';
  if (!isIndefinite && !endAt) return 'Please select an expiration end date, or check "Run indefinitely".';
  return null;
}

/** State and submission controller for creating standalone notice announcement slides. */
export function useAnnouncementSlideModal(
  isOpen: boolean,
  onClose: () => void,
  onCreated: () => void,
) {
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<NoticeTheme>('sapphire');
  const [hasQr, setHasQr] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrLabel, setQrLabel] = useState('Scan to Join');
  const [qrPosition, setQrPosition] = useState<QrPosition>('bottom-left');
  const [qrStartAt, setQrStartAt] = useState<string | null>(null);
  const [qrEndAt, setQrEndAt] = useState<string | null>(null);
  const [duration, setDuration] = useState(15);
  const [isIndefinite, setIsIndefinite] = useState(true);
  const [recurringSchedule, setRecurringSchedule] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [startAt, setStartAt] = useState<string>(() => toLocalDatetimeString(new Date()));
  const [endAt, setEndAt] = useState<string>(getDefaultEndLocalString);

  useEffect(() => {
    if (!isOpen) return;
    setHeadline('');
    setDescription('');
    setSelectedTheme('sapphire');
    setHasQr(false);
    setQrUrl('');
    setQrLabel('Scan to Join');
    setQrPosition('bottom-left');
    setQrStartAt(null);
    setQrEndAt(null);
    setDuration(15);
    setIsIndefinite(true);
    setRecurringSchedule(null);
    setStartAt(toLocalDatetimeString(new Date()));
    setEndAt(getDefaultEndLocalString());
    setError(null);
    setIsSubmitting(false);
    setShowDiscardConfirm(false);
  }, [isOpen]);

  const isDirty =
    headline.trim().length > 0 ||
    description.trim().length > 0 ||
    (hasQr && qrUrl.trim().length > 0);

  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleForceClose = () => {
    setShowDiscardConfirm(false);
    setHeadline('');
    setDescription('');
    setQrUrl('');
    setHasQr(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validateAnnouncementForm(headline, description, isIndefinite, endAt);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { createAnnouncementSlide } = await import('@/lib/actions/announcements');
      await createAnnouncementSlide({
        headline: headline.trim(),
        description: description.trim(),
        theme: selectedTheme,
        qr_url: hasQr && qrUrl.trim() ? qrUrl.trim() : undefined,
        qr_label: hasQr && qrLabel.trim() ? qrLabel.trim() : undefined,
        qr_position: hasQr ? qrPosition : undefined,
        qr_start_at: hasQr ? qrStartAt : null,
        qr_end_at: hasQr ? qrEndAt : null,
        start_at: fromLocalDatetimeString(startAt),
        end_at: isIndefinite ? null : fromLocalDatetimeString(endAt),
        duration_seconds: duration,
        recurring_schedule: recurringSchedule,
      });
      broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'create' });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate notice slide.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    headline, setHeadline, description, setDescription, selectedTheme, setSelectedTheme,
    hasQr, setHasQr, qrUrl, setQrUrl, qrLabel, setQrLabel, qrPosition, setQrPosition,
    qrStartAt, setQrStartAt, qrEndAt, setQrEndAt,
    duration, setDuration, isIndefinite, setIsIndefinite, recurringSchedule, setRecurringSchedule,
    startAt, setStartAt, endAt, setEndAt, isSubmitting, error, showDiscardConfirm, setShowDiscardConfirm,
    showStudioModal, setShowStudioModal, handleRequestClose, handleForceClose, handleSubmit,
  };
}

