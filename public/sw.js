// sw.js - Portfolio Service Worker VA.0
const VERSION = 'VA.8';
const CACHE_PREFIX = 'vikash-portfolio';
const PRECACHE_NAME = `${CACHE_PREFIX}-precache-v${VERSION}-SINGULARITY`;
const RUNTIME_NAME = `${CACHE_PREFIX}-runtime-v${VERSION}`;
const IS_LOCALHOST = ['localhost', '127.0.0.1', '::1'].includes(self.location.hostname);

const CORE_ASSETS = [
  './index.html',
  './privacy.html',
  './terms.html',
  './store.html',
  './admin.html',
  './css/index.css',
  './css/store.css',
  './css/admin.css',
  './css/cyber-heart.css',
  './assets/cyber-heart-core.webp',
  './js/inline_script.js',
  './js/cyber-heart.js',
  './js/button-effects.js',
  './js/admin_panel.js',
  './js/store_data.js',
  './favicon.svg',
  './manifest.json',
];

const API_PATH_PREFIXES = [
  '/api', // support reverse-proxy deployments
  '/system_status',
];

function isApiPath(pathname) {
  return API_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isApiRequest(request, requestUrl) {
  // Only treat fetch/XHR style requests as API (avoid matching scripts/styles/fonts).
  if (request.destination) return false;
  return isApiPath(requestUrl.pathname);
}

function canCache(request, response) {
  if (!response) return false;
  if (request.method !== 'GET') return false;

  // Opaque responses have status 0; only cache them for known subresources.
  if (response.type === 'opaque') {
    return ['script', 'style', 'font'].includes(request.destination);
  }

  return (
    response.status === 200 &&
    (response.type === 'basic' || response.type === 'cors')
  );
}

async function matchCachedResponse(request) {
  const runtime = await caches.open(RUNTIME_NAME);
  const runtimeMatch = await runtime.match(request);
  if (runtimeMatch) return runtimeMatch;

  const precache = await caches.open(PRECACHE_NAME);
  return precache.match(request);
}

self.addEventListener('install', (event) => {
  if (IS_LOCALHOST) {
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    (async () => {
      console.log('[SW] Installing Portfolio Worker...');

      const cache = await caches.open(PRECACHE_NAME);
      await cache.addAll(
        CORE_ASSETS.map((url) => new Request(url, { cache: 'reload' }))
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  if (IS_LOCALHOST) {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX))
            .map((key) => caches.delete(key))
        );
        await self.registration.unregister();
        await self.clients.claim();
      })()
    );
    return;
  }

  event.waitUntil(
    (async () => {
      const expected = new Set([PRECACHE_NAME, RUNTIME_NAME]);
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !expected.has(key))
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (IS_LOCALHOST) return;

  const { request } = event;

  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') return;

  // Chromium: avoid "only-if-cached can only be used with same-origin" errors.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  const url = new URL(request.url);

  // API Strategy: network-only (no cache)
  if (isApiRequest(request, url)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (err) {
          // Gracefully handle offline/backend outages to avoid unhandled rejections.
          return new Response(
            JSON.stringify({
              error: 'offline',
              message: 'Backend unreachable',
              details: err?.message || 'network error',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      })()
    );
    return;
  }

  // Navigation Strategy: network-first, fallback to cached shell
  if (request.mode === 'navigate') {
    if (isApiPath(url.pathname)) {
      event.respondWith(
        (async () => {
          try {
            return await fetch(request);
          } catch (err) {
            return new Response(
              JSON.stringify({
                error: 'offline',
                message: 'Backend unreachable',
                details: err?.message || 'network error',
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        })()
      );
      return;
    }

    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          return (await matchCachedResponse(new Request('./index.html'))) || Response.error();
        }
      })()
    );
    return;
  }

  // Static Asset Strategy: cache-first, update-in-background for same-origin.
  event.respondWith(
    (async () => {
      const cached = await matchCachedResponse(request);
      if (cached) {
        if (url.origin === self.location.origin) {
          event.waitUntil(
            (async () => {
              try {
                const res = await fetch(request);
                if (canCache(request, res)) {
                  const runtime = await caches.open(RUNTIME_NAME);
                  await runtime.put(request, res.clone());
                }
              } catch {
                // ignore
              }
            })()
          );
        }
        return cached;
      }

      try {
        const res = await fetch(request);
        if (canCache(request, res)) {
          const runtime = await caches.open(RUNTIME_NAME);
          await runtime.put(request, res.clone());
        }
        return res;
      } catch {
        return Response.error();
      }
    })()
  );
});
