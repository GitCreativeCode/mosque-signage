/**
 * Client-Side Inter-Tab & Inter-Window Broadcast Synchronization Channel
 * MosqueSignage (TV)
 *
 * Facilitates instantaneous (<5ms), zero-network inter-window synchronization
 * between standalone PWA windows and browser tabs on the same origin (localhost or LAN).
 *
 * Utilizes a triple-redundant client synchronization strategy:
 * 1. BroadcastChannel API ('mosque-signage-sync') for modern cross-tab/PWA message passing.
 * 2. Window CustomEvents ('mosque:signage-sync') for in-window component communication.
 * 3. LocalStorage storage events for fallback cross-window dispatch across isolation boundaries.
 */

export type SignageBroadcastType =
  | 'POSTERS_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'PRAYERS_UPDATED'
  | 'RELOAD_DISPLAY'
  | 'TEST_DRAWER'
  | 'TOGGLE_SIMULATOR'
  | 'POWER_STATE_CHANGED';

export interface SignageBroadcastMessage {
  readonly type: SignageBroadcastType;
  readonly timestamp: string;
  readonly action?: 'create' | 'update' | 'delete' | 'refresh' | 'reorder' | undefined;
  readonly posterId?: string | undefined;
  readonly durationSeconds?: number | undefined;
  readonly powerState?: 'ON' | 'STANDBY' | undefined;
  readonly senderId?: string | undefined;
}

const BROADCAST_CHANNEL_NAME = 'mosque-signage-sync';
const STORAGE_SYNC_KEY = 'mosque_signage_sync_ping';

// Generate unique window session identifier to prevent self-echo loops
const WINDOW_SESSION_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `win-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Broadcasts a synchronization event to all open tabs, windows, and standalone PWAs.
 */
export function broadcastSignageEvent(
  event: Omit<SignageBroadcastMessage, 'timestamp' | 'senderId'> & {
    timestamp?: string;
    senderId?: string;
  }
): void {
  if (typeof window === 'undefined') return;

  const fullMessage: SignageBroadcastMessage = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
    senderId: WINDOW_SESSION_ID,
  };

  // 1. BroadcastChannel: Instantaneous zero-network IPC between tabs and standalone PWA
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage(fullMessage);
      channel.close();
    }
  } catch (err) {
    console.warn('[Sync] BroadcastChannel postMessage failed:', err);
  }

  // 2. In-Window CustomEvent: Broadcast to components within the current window
  try {
    window.dispatchEvent(
      new CustomEvent<SignageBroadcastMessage>('mosque:signage-sync', {
        detail: fullMessage,
      })
    );
  } catch (err) {
    console.warn('[Sync] Window dispatchEvent failed:', err);
  }

  // 3. LocalStorage StorageEvent: Cross-window dispatch fallback
  try {
    localStorage.setItem(
      STORAGE_SYNC_KEY,
      JSON.stringify({
        ...fullMessage,
        _nonce: Date.now(),
      })
    );
  } catch {
    // LocalStorage quota or access exception silently handled
  }
}

/**
 * Subscribes to client-side synchronization events across all tabs, windows, and PWAs.
 * Automatically deduplicates events arriving via multiple parallel transports.
 *
 * @param listener Callback invoked when a synchronization event arrives.
 * @returns Unsubscribe cleanup function.
 */
export function subscribeSignageBroadcast(
  listener: (message: SignageBroadcastMessage) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Event deduplication cache: stores message signatures for 200ms
  const processedSignatures = new Set<string>();

  const handleMessage = (msg: SignageBroadcastMessage) => {
    if (!msg || !msg.type) return;

    // Build signature to deduplicate events received from both BroadcastChannel and storage
    const signature = `${msg.type}:${msg.timestamp}:${msg.action ?? ''}:${msg.posterId ?? ''}`;
    if (processedSignatures.has(signature)) return;

    processedSignatures.add(signature);
    setTimeout(() => {
      processedSignatures.delete(signature);
    }, 250);

    listener(msg);
  };

  let broadcastChannel: BroadcastChannel | null = null;

  // 1. Listen via BroadcastChannel API
  if ('BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannel.onmessage = (event: MessageEvent<SignageBroadcastMessage>) => {
        if (event.data) {
          handleMessage(event.data);
        }
      };
    } catch (err) {
      console.warn('[Sync] Failed to open BroadcastChannel listener:', err);
    }
  }

  // 2. Listen via LocalStorage storage event
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== STORAGE_SYNC_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as SignageBroadcastMessage;
      // Discard self-sent storage events
      if (parsed.senderId === WINDOW_SESSION_ID) return;
      handleMessage(parsed);
    } catch {
      // JSON parse error silently handled
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // 3. Listen via Window CustomEvent (for same-window intra-component updates)
  const handleCustomEvent = (event: Event) => {
    const customEvt = event as CustomEvent<SignageBroadcastMessage>;
    if (customEvt.detail) {
      handleMessage(customEvt.detail);
    }
  };
  window.addEventListener('mosque:signage-sync', handleCustomEvent);

  // Return comprehensive cleanup function
  return () => {
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('mosque:signage-sync', handleCustomEvent);
  };
}

