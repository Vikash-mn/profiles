// sw.js - Neural Service Worker VA.0
const VERSION = 'VA.0';
const CACHE_PREFIX = 'vikash-neural';
const PRECACHE_NAME = `${CACHE_PREFIX}-precache-v${VERSION}-SINGULARITY`;
const RUNTIME_NAME = `${CACHE_PREFIX}-runtime-v${VERSION}`;
const IS_LOCALHOST = ['localhost', '127.0.0.1', '::1'].includes(self.location.hostname);

const CORE_ASSETS = [
  './index.html',
  './store.html',
  './admin.html',
  './css/index.css',
  './css/store.css',
  './css/admin.css',
  './js/neural-core.js',
  './manifest.json',
];
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css',
  'https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js',
  'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.min.js',
  'https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.8.0/lib/xterm-addon-web-links.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
];

const API_PATH_PREFIXES = [
  '/api', // support reverse-proxy deployments
  '/advanced_deterministic',
  '/chat',
  '/train_memory',
  '/sync_knowledge',
  '/quantum',
  '/system_status',
  '/memory',
  '/determinism_test',
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
      console.log('[SW] Installing Neural Worker...');

      const cache = await caches.open(PRECACHE_NAME);
      await cache.addAll(
        CORE_ASSETS.map((url) => new Request(url, { cache: 'reload' }))
      );

      const results = await Promise.allSettled(
        CDN_ASSETS.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
          } catch {
            // Some CDNs don't send CORS headers; fall back to opaque caching.
            await cache.add(new Request(url, { mode: 'no-cors', cache: 'reload' }));
          }
        })
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length) {
        console.warn(
          `[SW] Precached core assets; ${failures.length} CDN assets failed.`
        );
      }

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
