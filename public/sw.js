// YAARO Production Service Worker
// Version: 1.0.0
// Caches essential static assets and provides offline fallback.
// STRICT SECURITY POLICY: Never caches Supabase auth tokens, private API endpoints, or payment transactions.

const CACHE_NAME = 'yaaro-pwa-v1'
const STATIC_ASSETS = [
  '/offline',
  '/favicon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
]

// Install Event: Pre-cache offline shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// Activate Event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch Event: Intelligent routing
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // 1. Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // 2. SECURITY RULE: Strictly bypass caching for sensitive auth & database endpoints
  if (
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/api/auth') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('razorpay.com')
  ) {
    return
  }

  // 3. Navigation Requests: Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline').then((cached) => {
          return cached || new Response('Offline - YAARO', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
          })
        })
      })
    )
    return
  }

  // 4. Static Assets (fonts, images, icons): Cache-first with stale-while-revalidate
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return networkResponse
        }).catch(() => cached)

        return cached || fetchPromise
      })
    )
    return
  }
})
