const CACHE_NAME = 'anoint-array-v1'
const STATIC_CACHE = 'anoint-static-v1'
const DYNAMIC_CACHE = 'anoint-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/anoint-array-seal.png',
  '/logo-desktop.png',
  '/logo-mobile.png'
]

// Routes to cache for offline access
const CACHED_ROUTES = [
  '/',
  '/login',
  '/products',
  '/anoint-array',
  '/about',
  '/contact'
]

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Install Event')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching Static Assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
      .catch(error => console.error('Service Worker: Cache failed', error))
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activate Event')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE
          )
          .map(cacheName => {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip external requests
  if (url.origin !== location.origin) return

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone response for caching
          const responseClone = response.clone()
          
          // Cache successful responses
          if (response.status === 200) {
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone))
          }
          
          return response
        })
        .catch(() => {
          // Try to get from cache
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse
              }
              
              // Fallback to offline page
              return caches.match('/offline.html')
            })
        })
    )
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses for short time
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                // Set cache expiry headers
                const headers = new Headers(responseClone.headers)
                headers.set('sw-cache-timestamp', Date.now().toString())
                const cachedResponse = new Response(responseClone.body, {
                  status: responseClone.status,
                  statusText: responseClone.statusText,
                  headers: headers
                })
                cache.put(request, cachedResponse)
              })
          }
          return response
        })
        .catch(() => {
          // Check cache for API responses (max 5 minutes old)
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                const timestamp = cachedResponse.headers.get('sw-cache-timestamp')
                if (timestamp && (Date.now() - parseInt(timestamp)) < 300000) {
                  return cachedResponse
                }
              }
              
              // Return error response for failed API calls
              return new Response(
                JSON.stringify({ 
                  error: 'Offline - Please check your connection',
                  offline: true 
                }), 
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              )
            })
        })
    )
    return
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, responseClone))
            }
            return response
          })
      })
      .catch(() => {
        // Return offline fallback for failed requests
        if (request.destination === 'image') {
          return caches.match('/icons/icon-192x192.png')
        }
        return caches.match('/offline.html')
      })
  )
})

// Background sync for form submissions
self.addEventListener('sync', event => {
  console.log('Service Worker: Background Sync', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync operations
      syncData()
    )
  }
})

// Push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push Event', event)
  
  const options = {
    body: event.data ? event.data.text() : 'ANOINT Array notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('ANOINT Array', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification Click', event)
  
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Helper function for background sync
async function syncData() {
  try {
    // Sync any pending data
    const pendingRequests = await getPendingRequests()
    
    for (const request of pendingRequests) {
      try {
        await fetch(request.url, request.options)
        await removePendingRequest(request.id)
      } catch (error) {
        console.error('Background sync failed for request:', request, error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Helper functions for managing pending requests
async function getPendingRequests() {
  // Implementation depends on storage strategy (IndexedDB)
  return []
}

async function removePendingRequest(id) {
  // Implementation depends on storage strategy (IndexedDB)
  return true
}