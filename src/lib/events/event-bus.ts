import { EventEmitter } from 'node:events';

export type SignageEventType =
  | 'POSTERS_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'PRAYERS_UPDATED'
  | 'RELOAD_DISPLAY'
  | 'TEST_DRAWER'
  | 'TOGGLE_SIMULATOR'
  | 'POWER_STATE_CHANGED'
  | 'AUDIO_MUTE_DISPATCHED';

export interface PostersUpdatedPayload {
  readonly timestamp: string;
  readonly action?: 'create' | 'update' | 'delete' | 'refresh' | undefined;
  readonly posterId?: string | undefined;
}

export interface SettingsUpdatedPayload {
  readonly timestamp: string;
  readonly venueName?: string | undefined;
  readonly tickerText?: string | undefined;
  readonly hijriOffset?: number | undefined;
}

export interface PrayersUpdatedPayload {
  readonly timestamp: string;
  readonly prayer?: string | undefined;
  readonly iqamahTime?: string | undefined;
}

export interface ReloadDisplayPayload {
  readonly timestamp: string;
  readonly reason?: string | undefined;
}

export interface TestDrawerPayload {
  readonly timestamp: string;
  readonly durationSeconds?: number | undefined;
}

export interface ToggleSimulatorPayload {
  readonly timestamp: string;
}

export interface PowerStateChangedPayload {
  readonly timestamp: string;
  readonly state: 'ON' | 'STANDBY';
  readonly method?: string | undefined;
  readonly reason?: string | undefined;
}

export interface AudioMuteDispatchedPayload {
  readonly timestamp: string;
  readonly action: 'MUTE' | 'UNMUTE';
  readonly protocol: string;
  readonly host: string;
  readonly success: boolean;
  readonly message: string;
}

export interface SignageEventPayloadMap {
  POSTERS_UPDATED: PostersUpdatedPayload;
  SETTINGS_UPDATED: SettingsUpdatedPayload;
  PRAYERS_UPDATED: PrayersUpdatedPayload;
  RELOAD_DISPLAY: ReloadDisplayPayload;
  TEST_DRAWER: TestDrawerPayload;
  TOGGLE_SIMULATOR: ToggleSimulatorPayload;
  POWER_STATE_CHANGED: PowerStateChangedPayload;
  AUDIO_MUTE_DISPATCHED: AudioMuteDispatchedPayload;
}


export interface SignageEventEnvelope<K extends SignageEventType = SignageEventType> {
  readonly type: K;
  readonly payload: SignageEventPayloadMap[K];
}

/**
 * In-Process Real-Time Event Bus
 * Facilitates instant, brokerless SSE broadcast synchronization from `/admin` to `/display`.
 */
export class SignageEventBus {
  private readonly emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    // Allow up to 100 concurrent SSE subscribers without Node memory leak warnings
    this.emitter.setMaxListeners(100);
  }

  /**
   * Broadcast an event to all active display subscribers.
   */
  public emitEvent<K extends SignageEventType>(type: K, payload: SignageEventPayloadMap[K]): void {
    const envelope: SignageEventEnvelope<K> = { type, payload };
    this.emitter.emit(type, payload);
    this.emitter.emit('*', envelope);
  }

  /**
   * Subscribe to a specific event type. Returns an unsubscribe cleanup function.
   */
  public subscribe<K extends SignageEventType>(
    type: K,
    listener: (payload: SignageEventPayloadMap[K]) => void
  ): () => void {
    this.emitter.on(type, listener);
    return () => {
      this.emitter.off(type, listener);
    };
  }

  /**
   * Subscribe to all broadcast events. Returns an unsubscribe cleanup function.
   */
  public subscribeAll(listener: (envelope: SignageEventEnvelope) => void): () => void {
    this.emitter.on('*', listener);
    return () => {
      this.emitter.off('*', listener);
    };
  }

  /**
   * Returns current active listener count for diagnostics.
   */
  public getListenerCount(type?: SignageEventType | '*'): number {
    return this.emitter.listenerCount(type ?? '*');
  }

  /**
   * Removes all listeners (useful for test isolation).
   */
  public removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

// Preserve singleton across Next.js dev server reloads
const globalForEvents = globalThis as unknown as {
  __signageEventBus?: SignageEventBus | undefined;
};

export const eventBus: SignageEventBus =
  globalForEvents.__signageEventBus ?? new SignageEventBus();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.__signageEventBus = eventBus;
}
