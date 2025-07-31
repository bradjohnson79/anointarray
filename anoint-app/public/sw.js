/**
 * Service Worker for ANOINT Array
 * Provides caching and offline functionality
 * Based on PerfProbe scaling recommendations
 */

const CACHE_NAME = 'anoint-array-v1.0.0'
const OFFLINE_PAGE = '/offline.html'

// Resources to cache immediately
const PRECACHE_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
]

// API endpoints to cache with different strategies
const API_CACHE_CONFIG = {
  products: {
    pattern: /\/rest\/v1\/products/,
    strategy: 'cacheFirst',
    maxAge: 5 * 60 * 1000 // 5 minutes
  },
  shipping: {
    pattern: /\/functions\/v1\/get-rates/,
    strategy: 'networkFirst',
    maxAge: 60 * 60 * 1000 // 1 hour
  },
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|svg|woff2?)$/,
    strategy: 'cacheFirst',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching resources')
        return cache.addAll(PRECACHE_RESOURCES)
      })
      .then(() => {
        console.log('[SW] Installation complete')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('[SW] Activation complete')
        return self.clients.claim()
      })
      .catch(error => {
        console.error('[SW] Activation failed:', error)
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }
  
  // Handle different types of requests
  if (url.pathname === '/') {
    // Home page - network first with fast fallback
    event.respondWith(handleHomePage(request))
  } else if (matchesPattern(url, API_CACHE_CONFIG.products.pattern)) {
    // Products API - cache first
    event.respondWith(handleCacheFirst(request, 'products-cache'))
  } else if (matchesPattern(url, API_CACHE_CONFIG.shipping.pattern)) {
    // Shipping API - network first
    event.respondWith(handleNetworkFirst(request, 'shipping-cache'))
  } else if (matchesPattern(url, API_CACHE_CONFIG.static.pattern)) {
    // Static assets - cache first
    event.respondWith(handleCacheFirst(request, 'static-cache'))
  } else if (url.pathname.startsWith('/products') || 
             url.pathname.startsWith('/cart') ||
             url.pathname.startsWith('/about')) {
    // App pages - network first with offline fallback
    event.respondWith(handleAppPages(request))
  } else {
    // Default strategy
    event.respondWith(handleDefault(request))
  }
})

// Strategy: Cache First (for static assets and products)
async function handleCacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url)
      // Return cached version immediately
      fetchAndCache(request, cache) // Update cache in background
      return cachedResponse
    }
    
    console.log('[SW] Cache miss, fetching:', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.error('[SW] Cache first failed:', error)
    return await handleOfflineFallback(request)
  }
}

// Strategy: Network First (for dynamic content)
async function handleNetworkFirst(request, cacheName) {
  try {
    console.log('[SW] Network first:', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    return await handleOfflineFallback(request)
  }
}

// Handle home page with fast network timeout
async function handleHomePage(request) {
  try {
    // Try network with 2 second timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 2000)
      )
    ])
    
    if (networkResponse.ok) {
      const cache = await caches.open('pages-cache')
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('[SW] Home page network failed, trying cache')
    const cache = await caches.open('pages-cache')
    const cachedResponse = await cache.match(request)
    
    return cachedResponse || await handleOfflineFallback(request)
  }
}

// Handle app pages (products, cart, etc.)
async function handleAppPages(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open('pages-cache')
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    const cache = await caches.open('pages-cache')
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE)
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Default handling
async function handleDefault(request) {
  try {
    return await fetch(request)
  } catch (error) {
    const cache = await caches.open(CACHE_NAME)
    return await cache.match(request) || await handleOfflineFallback(request)
  }
}

// Background cache update
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
    }
  } catch (error) {
    console.log('[SW] Background cache update failed:', error)
  }
}

// Offline fallback
async function handleOfflineFallback(request) {
  if (request.mode === 'navigate') {
    return caches.match(OFFLINE_PAGE)
  }
  
  // Return minimal response for API requests
  if (request.url.includes('/api/') || request.url.includes('/functions/')) {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature requires an internet connection' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  return new Response('Offline', { status: 503 })
}

// Utility function to match URL patterns
function matchesPattern(url, pattern) {
  if (pattern instanceof RegExp) {
    return pattern.test(url.pathname + url.search)
  }
  return url.pathname.includes(pattern)
}

// Handle background sync for failed requests
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCartData())
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics())
  }
})

// Sync cart data when back online
async function syncCartData() {
  try {
    console.log('[SW] Syncing cart data...')
    // This would integrate with your cart context
    // For now, just log that we're ready to sync
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({ type: 'CART_SYNC_READY' })
    })
  } catch (error) {
    console.error('[SW] Cart sync failed:', error)
  }
}

// Sync analytics when back online
async function syncAnalytics() {
  try {
    console.log('[SW] Syncing analytics...')
    // Send any queued analytics events
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({ type: 'ANALYTICS_SYNC_READY' })
    })
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error)
  }
}

// Push notification handling (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/badge-icon.png',
      data: data.data,
      actions: data.actions,
      requireInteraction: data.requireInteraction
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  const data = event.notification.data
  let url = '/'
  
  if (data && data.url) {
    url = data.url
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Message handling from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting()
        break
      case 'CACHE_UPDATE':
        handleCacheUpdate(event.data.payload)
        break
      case 'CLEAR_CACHE':
        handleClearCache(event.data.payload)
        break
    }
  }
})

// Handle cache updates from main thread
async function handleCacheUpdate(payload) {
  try {
    const cache = await caches.open(payload.cacheName || CACHE_NAME)
    if (payload.urls && Array.isArray(payload.urls)) {
      await cache.addAll(payload.urls)
    }
  } catch (error) {
    console.error('[SW] Cache update failed:', error)
  }
}

// Handle cache clearing
async function handleClearCache(payload) {
  try {
    if (payload.cacheName) {
      await caches.delete(payload.cacheName)
    } else {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
  } catch (error) {
    console.error('[SW] Cache clear failed:', error)
  }
}

console.log('[SW] Service worker script loaded')