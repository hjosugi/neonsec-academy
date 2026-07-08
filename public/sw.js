// NeonSec Academy service worker — runtime caching for offline use.
// The app is fully client-side, so caching the shell + hashed assets is enough.
const CACHE = 'neonsec-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network-first, fall back to the cached app shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(req)
          const cache = await caches.open(CACHE)
          cache.put(req, net.clone())
          return net
        } catch {
          const cache = await caches.open(CACHE)
          return (
            (await cache.match(req)) ||
            (await cache.match('./')) ||
            (await cache.match('index.html')) ||
            Response.error()
          )
        }
      })(),
    )
    return
  }

  // Static assets: cache-first, then network (and populate the cache).
  event.respondWith(
    (async () => {
      const cached = await caches.match(req)
      if (cached) return cached
      try {
        const net = await fetch(req)
        if (net.ok) {
          const cache = await caches.open(CACHE)
          cache.put(req, net.clone())
        }
        return net
      } catch {
        return cached || Response.error()
      }
    })(),
  )
})
