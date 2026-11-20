/**
 * Shared in-memory SSE active connection tracker and bounding guards.
 * MosqueSignage (TV)
 */

let activeConnections = 0;

export function getActiveSseConnectionCount(): number {
  return activeConnections;
}

export function incrementActiveSseConnections(): number {
  activeConnections++;
  return activeConnections;
}

export function decrementActiveSseConnections(): number {
  activeConnections = Math.max(0, activeConnections - 1);
  return activeConnections;
}

export function resetActiveSseConnectionCount(): void {
  activeConnections = 0;
}

