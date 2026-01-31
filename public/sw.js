const CACHE_NAME = 'ecohaaul-v1'
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/offline.html',
]

// Install event - cache essential assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE)
    }).then(function() {
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      )
    }).then(function() {
      return self.clients.claim()
    })
  )
})

// Fetch event - implement offline fallback
self.addEventListener('fetch', function(event) {
  // Skip API calls - let them fail naturally so offline sync can handle them
  if (event.request.url.includes('/api/') && event.request.method !== 'GET') {
    return
  }

  // Cache-first strategy for GET requests
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        if (response) {
          return response
        }

        return fetch(event.request).then(function(response) {
          // Don't cache if not a success response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Clone the response before caching
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache)
          })

          return response
        }).catch(function() {
          // Return offline page or cached response
          return caches.match('/offline.html')
        })
      })
    )
  }
})

// Push notification event
self.addEventListener('push', function(event) {
  if (!event.data) return

  let notificationData = {}
  try {
    notificationData = event.data.json()
  } catch (e) {
    notificationData = {
      title: 'EcoHaul',
      body: event.data.text(),
    }
  }

  const title = notificationData.title || 'EcoHaul'
  const options = {
    body: notificationData.body || '',
    icon: '/pristine.jpg',
    badge: '/icon-192x192.png',
    tag: notificationData.type || 'notification',
    requireInteraction: notificationData.type === 'payroll',
    data: notificationData.data || {},
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Background sync for offline operations
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(
      self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'SYNC_QUEUE' })
        })
      })
    )
  }
})

