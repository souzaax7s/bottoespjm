const CACHE_NAME = 'botoes-pjm-v1'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/manifest.webmanifest',
        '/icons/pjm-icon.svg',
        '/icons/pjm-maskable.svg'
      ])
    })
  )

  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    })
  )

  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME)
      const cachedResponse = await cache.match(event.request)

      if (cachedResponse) {
        return cachedResponse
      }

      if (event.request.mode === 'navigate') {
        return cache.match(OFFLINE_URL)
      }

      return Response.error()
    })
  )
})
