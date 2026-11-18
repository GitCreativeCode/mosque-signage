import { describe, it, expect, beforeEach } from 'vitest';
import {
  SignageEventBus,
  type SignageEventEnvelope,
  type PostersUpdatedPayload,
  type SettingsUpdatedPayload,
  type PrayersUpdatedPayload,
} from '@/lib/events/event-bus';

describe('Real-Time SignageEventBus Engine', () => {
  let bus: SignageEventBus;

  beforeEach(() => {
    bus = new SignageEventBus();
  });

  it('broadcasts POSTERS_UPDATED event to subscribers', () => {
    const received: PostersUpdatedPayload[] = [];
    const unsubscribe = bus.subscribe('POSTERS_UPDATED', (payload) => {
      received.push(payload);
    });

    const nowIso = new Date().toISOString();
    bus.emitEvent('POSTERS_UPDATED', {
      timestamp: nowIso,
      action: 'create',
      posterId: 'poster-123',
    });

    expect(received).toHaveLength(1);
    expect(received[0]?.action).toBe('create');
    expect(received[0]?.posterId).toBe('poster-123');
    expect(received[0]?.timestamp).toBe(nowIso);

    // Test unsubscribe cleanup
    unsubscribe();
    bus.emitEvent('POSTERS_UPDATED', {
      timestamp: new Date().toISOString(),
      action: 'delete',
    });
    expect(received).toHaveLength(1); // Did not receive second event
  });

  it('broadcasts SETTINGS_UPDATED event with partial payload support', () => {
    const received: SettingsUpdatedPayload[] = [];
    bus.subscribe('SETTINGS_UPDATED', (payload) => {
      received.push(payload);
    });

    bus.emitEvent('SETTINGS_UPDATED', {
      timestamp: new Date().toISOString(),
      venueName: 'Main Prayer Hall',
      hijriOffset: 1,
    });

    expect(received).toHaveLength(1);
    expect(received[0]?.venueName).toBe('Main Prayer Hall');
    expect(received[0]?.hijriOffset).toBe(1);
  });

  it('broadcasts PRAYERS_UPDATED event for Iqamah shifts', () => {
    const received: PrayersUpdatedPayload[] = [];
    bus.subscribe('PRAYERS_UPDATED', (payload) => {
      received.push(payload);
    });

    bus.emitEvent('PRAYERS_UPDATED', {
      timestamp: new Date().toISOString(),
      prayer: 'dhuhr',
      iqamahTime: '13:30',
    });

    expect(received).toHaveLength(1);
    expect(received[0]?.prayer).toBe('dhuhr');
    expect(received[0]?.iqamahTime).toBe('13:30');
  });

  it('delivers all event types to wildcard subscribeAll listeners', () => {
    const envelopes: SignageEventEnvelope[] = [];
    const unsubscribe = bus.subscribeAll((envelope) => {
      envelopes.push(envelope);
    });

    bus.emitEvent('POSTERS_UPDATED', {
      timestamp: '2026-10-17T12:00:00Z',
      action: 'refresh',
    });

    bus.emitEvent('SETTINGS_UPDATED', {
      timestamp: '2026-10-17T12:01:00Z',
      tickerText: 'New Ticker',
    });

    bus.emitEvent('PRAYERS_UPDATED', {
      timestamp: '2026-10-17T12:02:00Z',
      prayer: 'maghrib',
    });

    expect(envelopes).toHaveLength(3);
    expect(envelopes[0]?.type).toBe('POSTERS_UPDATED');
    expect(envelopes[1]?.type).toBe('SETTINGS_UPDATED');
    expect(envelopes[2]?.type).toBe('PRAYERS_UPDATED');

    unsubscribe();
    expect(bus.getListenerCount('*')).toBe(0);
  });

  it('correctly tracks active listener counts and supports global cleanup', () => {
    expect(bus.getListenerCount('POSTERS_UPDATED')).toBe(0);

    const sub1 = bus.subscribe('POSTERS_UPDATED', () => {});
    const sub2 = bus.subscribe('POSTERS_UPDATED', () => {});
    expect(bus.getListenerCount('POSTERS_UPDATED')).toBe(2);

    sub1();
    expect(bus.getListenerCount('POSTERS_UPDATED')).toBe(1);

    bus.removeAllListeners();
    expect(bus.getListenerCount('POSTERS_UPDATED')).toBe(0);
    sub2(); // Safe to invoke cleanup after removeAllListeners
  });

  it('broadcasts RELOAD_DISPLAY event to subscribers', () => {
    let received = false;
    bus.subscribe('RELOAD_DISPLAY', (payload) => {
      received = true;
      expect(payload.reason).toContain('hard reload');
    });

    bus.emitEvent('RELOAD_DISPLAY', {
      timestamp: new Date().toISOString(),
      reason: 'Admin requested hard reload',
    });

    expect(received).toBe(true);
  });

  it('broadcasts TEST_DRAWER event with duration to subscribers', () => {
    let receivedDuration = 0;
    bus.subscribe('TEST_DRAWER', (payload) => {
      receivedDuration = payload.durationSeconds ?? 0;
    });

    bus.emitEvent('TEST_DRAWER', {
      timestamp: new Date().toISOString(),
      durationSeconds: 15,
    });

    expect(receivedDuration).toBe(15);
  });
});
