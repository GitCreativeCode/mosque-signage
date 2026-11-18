/**
 * MosqueSignage Kiosk Display Service Worker
 * Version: 1.0.1 (Production Resilient)
 * Strategy: Stale-While-Revalidate for static assets, Network-First for navigation,
 * and direct bypass for SSE, dynamic Server Actions, and Turbopack dev runtime.
 */

const CACHE_NAME = 'mosque-signage-v7';

const STATIC_PRECACHE = [
  '/',
  '/display',
  '/manifest.json',
  '/icon-192.png',
  '/icon-maskable-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

// 1. Install Phase: Cache critical display shell & assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Non-fatal precache warning:', err);
      });
    })
  );
});

// 2. Activate Phase: Clean legacy caches and claim active clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Purging outdated cache:', name);
              return caches.delete(name);
            })
        );
      }),
    ])
  );
});

// 3. Fetch Phase: Autonomous offline display handling with bulletproof error safety
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Bypass non-HTTP protocols (e.g., chrome-extension://, ws://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 2. Always bypass non-GET requests (Server Actions, mutations)
  if (request.method !== 'GET') {
    return;
  }

  // 3. Always bypass dynamic SSE streams and mutation APIs
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 4. Always bypass Next.js internal bundles and Turbopack HMR runtime
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/__turbopack') ||
    url.pathname.startsWith('/__next') ||
    url.pathname.includes('turbopack')
  ) {
    return;
  }

  // 5. Navigation requests: Network-First with Universal 200 OK Offline Fallback
  // Crucial: Chromium PWA Installability requires status 200 OK on offline simulation checks!
  if (request.mode === 'navigate') {
    // In local development, bypass navigation interception so dev server routing/reloads are never hijacked
    const isLocalDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (isLocalDev) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          // 1. Try to serve exact cached page
          const cached = await caches.match(request);
          if (cached) return cached;

          // 2. Only serve pre-cached /display if the navigation was actually targeting /display or /
          if (url.pathname === '/display' || url.pathname === '/') {
            const displayFallback = await caches.match('/display');
            if (displayFallback) return displayFallback;
          }

          // 3. Universal 200 OK offline shell fallback for other routes (/admin, /faq, etc.)
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <title>MosqueSignage Offline</title>
                <style>
                  body { background: #020617; color: #fff; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                  h1 { font-size: 26px; margin-bottom: 8px; color: #22c55e; }
                  p { color: #94a3b8; font-size: 15px; max-width: 440px; line-height: 1.5; }
                </style>
              </head>
              <body>
                <div>
                  <h1>MosqueSignage Local Offline Shell</h1>
                  <p>Appliance is currently offline. Standalone display or administrative access will synchronize automatically once reconnected.</p>
                </div>
              </body>
            </html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        })
    );
    return;
  }

  // 6. Static Assets (uploads, images, fonts, scripts, styles): Stale-While-Revalidate
  // Invariant: Never resolve with undefined, always return a valid Response
  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        }
        return networkResponse;
      } catch {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Bulletproof: If network fails and not in cache, return 404 Response instead of undefined
        return new Response(null, { status: 404, statusText: 'Not Found' });
      }
    })
  );
});


