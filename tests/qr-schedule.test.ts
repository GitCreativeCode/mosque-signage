import { describe, it, expect } from 'vitest';
import {
  isPosterQrActive,
  getQrScheduleStatus,
  validateQrSchedule,
} from '@/lib/posters/qr-schedule';

describe('QR Code Scheduling Engine', () => {
  const baseNow = new Date('2026-11-23T12:00:00.000Z');

  describe('validateQrSchedule', () => {
    it('passes when no dates are set', () => {
      expect(validateQrSchedule()).toEqual({ valid: true });
      expect(validateQrSchedule(null, null)).toEqual({ valid: true });
    });

    it('passes when only start date or only end date is set', () => {
      expect(validateQrSchedule('2026-11-23T10:00:00.000Z', null)).toEqual({ valid: true });
      expect(validateQrSchedule(null, '2026-11-25T10:00:00.000Z')).toEqual({ valid: true });
    });

    it('passes when end date is strictly after start date', () => {
      const res = validateQrSchedule(
        '2026-11-23T10:00:00.000Z',
        '2026-11-23T14:00:00.000Z'
      );
      expect(res).toEqual({ valid: true });
    });

    it('fails when end date is before or equal to start date', () => {
      const resEqual = validateQrSchedule(
        '2026-11-23T10:00:00.000Z',
        '2026-11-23T10:00:00.000Z'
      );
      expect(resEqual.valid).toBe(false);

      const resBefore = validateQrSchedule(
        '2026-11-23T12:00:00.000Z',
        '2026-11-23T10:00:00.000Z'
      );
      expect(resBefore.valid).toBe(false);
      expect(resBefore.error).toContain('must be after start time');
    });
  });

  describe('isPosterQrActive', () => {
    it('returns false when subject has no qr_url', () => {
      expect(isPosterQrActive(null, baseNow)).toBe(false);
      expect(isPosterQrActive({ qr_url: '' }, baseNow)).toBe(false);
      expect(isPosterQrActive({ qr_url: '   ' }, baseNow)).toBe(false);
    });

    it('returns true when qr_url is present and no schedule dates are set', () => {
      expect(isPosterQrActive({ qr_url: 'https://example.com' }, baseNow)).toBe(true);
    });

    it('returns false when start_at is in the future', () => {
      expect(
        isPosterQrActive(
          {
            qr_url: 'https://example.com',
            qr_start_at: '2026-11-23T14:00:00.000Z',
          },
          baseNow
        )
      ).toBe(false);
    });

    it('returns true when start_at has passed and no end_at is set', () => {
      expect(
        isPosterQrActive(
          {
            qr_url: 'https://example.com',
            qr_start_at: '2026-11-23T10:00:00.000Z',
          },
          baseNow
        )
      ).toBe(true);
    });

    it('returns true when now is inside start_at and end_at window', () => {
      expect(
        isPosterQrActive(
          {
            qr_url: 'https://example.com',
            qr_start_at: '2026-11-23T10:00:00.000Z',
            qr_end_at: '2026-11-23T14:00:00.000Z',
          },
          baseNow
        )
      ).toBe(true);
    });

    it('returns false when now is at or past end_at', () => {
      expect(
        isPosterQrActive(
          {
            qr_url: 'https://example.com',
            qr_end_at: '2026-11-23T12:00:00.000Z',
          },
          baseNow
        )
      ).toBe(false);

      expect(
        isPosterQrActive(
          {
            qr_url: 'https://example.com',
            qr_end_at: '2026-11-23T11:59:59.000Z',
          },
          baseNow
        )
      ).toBe(false);
    });
  });

  describe('getQrScheduleStatus', () => {
    it('returns NO_QR when subject is empty', () => {
      const res = getQrScheduleStatus(null, baseNow);
      expect(res.status).toBe('NO_QR');
      expect(res.isActive).toBe(false);
      expect(res.label).toBe('No QR Code');
    });

    it('returns informative missing link status when schedule dates exist without qr_url', () => {
      const res = getQrScheduleStatus(
        {
          qr_url: '',
          qr_start_at: '2026-11-23T10:00:00.000Z',
        },
        baseNow
      );
      expect(res.status).toBe('NO_QR');
      expect(res.isActive).toBe(false);
      expect(res.label).toBe('Not active — Missing link');
      expect(res.shortBadge).toBe('No Link');
      expect(res.color).toBe('amber');
    });

    it('returns ALWAYS_ACTIVE when no dates are set', () => {
      const res = getQrScheduleStatus({ qr_url: 'https://example.com' }, baseNow);
      expect(res.status).toBe('ALWAYS_ACTIVE');
      expect(res.isActive).toBe(true);
      expect(res.color).toBe('emerald');
    });

    it('returns SCHEDULED_UPCOMING when start date is in the future', () => {
      const res = getQrScheduleStatus(
        {
          qr_url: 'https://example.com',
          qr_start_at: '2026-11-24T10:00:00.000Z',
        },
        baseNow
      );
      expect(res.status).toBe('SCHEDULED_UPCOMING');
      expect(res.isActive).toBe(false);
      expect(res.color).toBe('amber');
      expect(res.label).toContain('Scheduled: Unlocks');
    });

    it('returns SCHEDULED_EXPIRED when end date is in the past', () => {
      const res = getQrScheduleStatus(
        {
          qr_url: 'https://example.com',
          qr_end_at: '2026-11-22T10:00:00.000Z',
        },
        baseNow
      );
      expect(res.status).toBe('SCHEDULED_EXPIRED');
      expect(res.isActive).toBe(false);
      expect(res.color).toBe('slate');
      expect(res.label).toContain('Ended:');
    });

    it('returns SCHEDULED_ACTIVE when inside the window', () => {
      const res = getQrScheduleStatus(
        {
          qr_url: 'https://example.com',
          qr_start_at: '2026-11-23T10:00:00.000Z',
          qr_end_at: '2026-11-23T18:00:00.000Z',
        },
        baseNow
      );
      expect(res.status).toBe('SCHEDULED_ACTIVE');
      expect(res.isActive).toBe(true);
      expect(res.color).toBe('blue');
      expect(res.label).toContain('Active: Available until');
    });
  });
});

