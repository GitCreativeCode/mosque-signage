import { eventBus, type SignageEventEnvelope } from '@/lib/events/event-bus';
import { verifyCurrentDisplaySession } from '@/lib/auth/display-pairing';
import {
  getActiveSseConnectionCount,
  incrementActiveSseConnections,
  decrementActiveSseConnections,
} from '@/lib/events/sse-connections';

export const dynamic = 'force-dynamic';

const DEFAULT_MAX_SSE_CONNECTIONS = 25;

function getMaxSseConnections(): number {
  const parsed = parseInt(process.env.MAX_SSE_CONNECTIONS || '', 10);
  return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_MAX_SSE_CONNECTIONS : parsed;
}

/**
 * Server-Sent Events (SSE) Route Handler for Kiosk Displays
 * Endpoint: /api/sse/display
 */
export async function GET(): Promise<Response> {
  const isAuthorized = await verifyCurrentDisplaySession();
  if (!isAuthorized) {
    return new Response('Unauthorized: Display session required.', { status: 401 });
  }

  if (getActiveSseConnectionCount() >= getMaxSseConnections()) {
    return new Response('Service Unavailable: Maximum SSE display connections reached.', {
      status: 503,
      headers: {
        'Retry-After': '30',
        'Content-Type': 'text/plain',
      },
    });
  }

  incrementActiveSseConnections();
  let hasDecremented = false;
  const decrement = () => {
    if (!hasDecremented) {
      hasDecremented = true;
      decrementActiveSseConnections();
    }
  };

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial Connection Handshake Event
      const initialPayload = JSON.stringify({
        status: 'CONNECTED',
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`event: handshake\ndata: ${initialPayload}\n\n`));

      // 2. Subscribe to In-Process Event Bus
      unsubscribe = eventBus.subscribeAll((envelope: SignageEventEnvelope) => {
        try {
          const eventMessage = `event: ${envelope.type}\ndata: ${JSON.stringify(envelope.payload)}\n\n`;
          controller.enqueue(encoder.encode(eventMessage));
        } catch (err) {
          console.error('Error forwarding SSE message:', err);
        }
      });

      // 3. 30-Second Heartbeat Ping (: ping\n\n) to maintain persistent NAT/proxy connections
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          // Stream likely closed by client
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          if (unsubscribe) unsubscribe();
          decrement();
        }
      }, 30000);
    },
    cancel() {
      // Cleanup subscriber and timers on client disconnect
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (unsubscribe) unsubscribe();
      decrement();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering (Nginx)
    },
  });
}
