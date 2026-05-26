const CACHE_NAME = 'guruku-cache-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.svg'
];

// Helper to check if request is a navigation request (like / or /login or /index.html)
const isNavigationRequest = (request) => {
  return request.mode === 'navigate' || 
         request.url.endsWith('/') || 
         request.url.includes('/index.html');
};

// Helper to check if request belongs to dynamic API/Firebase/external connections
const isDynamicRequest = (request) => {
  return request.url.includes('firestore.googleapis.com') ||
         request.url.includes('firebase') ||
         request.url.includes('googleapis.com') ||
         request.url.includes('/api/') ||
         request.url.includes('google');
};

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for previous SW to close
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Caching static assets failed during install:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Claim all active clients immediately
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting legacy service worker cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Always skip interception for dynamic external/database requests
  if (isDynamicRequest(event.request)) {
    return;
  }

  // Network-First strategy for HTML and Navigation requests
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache the fresh HTML page in case we go offline later
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Network failed (offline), serve the cached index/root page
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Fallback to checking any cached index or root
            return caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // Stale-While-Revalidate or Cache-First for general assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignore background sync failures */});
        
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Cache newly discovered assets (like images, fonts)
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return networkResponse;
      }).catch((err) => {
        // Network offline, return whatever matching asset we might have or let it fail
        return caches.match(event.request);
      });
    })
  );
});
