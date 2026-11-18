import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  broadcastSignageEvent,
  subscribeSignageBroadcast,
  type SignageBroadcastMessage,
} from '@/lib/events/broadcast-channel';

interface GlobalSyncTarget {
  window?: unknown;
  localStorage?: unknown;
  BroadcastChannel?: unknown;
}

type SyncListener = (event: { key?: string; newValue?: string; type?: string; data?: unknown }) => void;

describe('Dual-Layer BroadcastChannel Synchronization Client', () => {
  const globalTarget = globalThis as unknown as GlobalSyncTarget;
  const originalWindow = globalTarget.window;
  const originalLocalStorage = globalTarget.localStorage;
  const originalBroadcastChannel = globalTarget.BroadcastChannel;

  let mockBroadcastChannelInstances: MockBroadcastChannel[] = [];
  let storageListeners: SyncListener[] = [];
  let customEventListeners: SyncListener[] = [];
  let mockStorage: Map<string, string>;

  class MockBroadcastChannel {
    name: string;
    onmessage: ((ev: { data: unknown }) => void) | null = null;
    constructor(name: string) {
      this.name = name;
      mockBroadcastChannelInstances.push(this);
    }
    postMessage(data: unknown) {
      mockBroadcastChannelInstances.forEach((inst) => {
        if (inst !== this && inst.onmessage) {
          inst.onmessage({ data });
        }
      });
    }
    close() {
      const idx = mockBroadcastChannelInstances.indexOf(this);
      if (idx !== -1) mockBroadcastChannelInstances.splice(idx, 1);
    }
  }

  beforeEach(() => {
    mockBroadcastChannelInstances = [];
    storageListeners = [];
    customEventListeners = [];
    mockStorage = new Map<string, string>();

    const mockWindow = {
      addEventListener: (evt: string, fn: SyncListener) => {
        if (evt === 'storage') storageListeners.push(fn);
        if (evt === 'mosque:signage-sync') customEventListeners.push(fn);
      },
      removeEventListener: (evt: string, fn: SyncListener) => {
        if (evt === 'storage') {
          storageListeners = storageListeners.filter((f) => f !== fn);
        }
        if (evt === 'mosque:signage-sync') {
          customEventListeners = customEventListeners.filter((f) => f !== fn);
        }
      },
      dispatchEvent: (evt: { type: string }) => {
        if (evt.type === 'mosque:signage-sync') {
          customEventListeners.forEach((fn) => fn(evt));
        }
        return true;
      },
    };

    const mockLocalStorage = {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, val: string) => {
        mockStorage.set(key, val);
        storageListeners.forEach((fn) => fn({ key, newValue: val }));
      },
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
    };

    globalTarget.window = mockWindow;
    globalTarget.localStorage = mockLocalStorage;
    globalTarget.BroadcastChannel = MockBroadcastChannel;
  });

  afterEach(() => {
    globalTarget.window = originalWindow;
    globalTarget.localStorage = originalLocalStorage;
    globalTarget.BroadcastChannel = originalBroadcastChannel;
  });

  it('broadcasts POSTERS_UPDATED event across instances', () => {
    const received: SignageBroadcastMessage[] = [];
    const unsubscribe = subscribeSignageBroadcast((msg) => {
      received.push(msg);
    });

    broadcastSignageEvent({
      type: 'POSTERS_UPDATED',
      action: 'create',
      posterId: 'p-1',
    });

    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[0]?.type).toBe('POSTERS_UPDATED');
    expect(received[0]?.action).toBe('create');
    expect(received[0]?.posterId).toBe('p-1');

    unsubscribe();
  });

  it('broadcasts SETTINGS_UPDATED event across instances', () => {
    const received: SignageBroadcastMessage[] = [];
    const unsubscribe = subscribeSignageBroadcast((msg) => {
      received.push(msg);
    });

    broadcastSignageEvent({
      type: 'SETTINGS_UPDATED',
    });

    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[0]?.type).toBe('SETTINGS_UPDATED');

    unsubscribe();
  });

  it('broadcasts PRAYERS_UPDATED event across instances', () => {
    const received: SignageBroadcastMessage[] = [];
    const unsubscribe = subscribeSignageBroadcast((msg) => {
      received.push(msg);
    });

    broadcastSignageEvent({
      type: 'PRAYERS_UPDATED',
    });

    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[0]?.type).toBe('PRAYERS_UPDATED');

    unsubscribe();
  });

  it('deduplicates identical events received via parallel transports within debounce window', () => {
    const received: SignageBroadcastMessage[] = [];
    const unsubscribe = subscribeSignageBroadcast((msg) => {
      received.push(msg);
    });

    const timestamp = '2026-11-06T18:00:00.000Z';
    // Simultaneous dispatch via both customEvent and storage
    broadcastSignageEvent({
      type: 'POSTERS_UPDATED',
      action: 'refresh',
      timestamp,
    });

    // Despite multiple transports firing, subscriber receives exactly 1 deduplicated event
    expect(received.length).toBe(1);

    unsubscribe();
  });

  it('cleans up all listeners and closes channel on unsubscribe', () => {
    const received: SignageBroadcastMessage[] = [];
    const unsubscribe = subscribeSignageBroadcast((msg) => {
      received.push(msg);
    });

    unsubscribe();

    broadcastSignageEvent({
      type: 'RELOAD_DISPLAY',
    });

    expect(received).toHaveLength(0);
    expect(mockBroadcastChannelInstances).toHaveLength(0);
  });
});
