const CACHE_NAME = 'mowed-cache-v1';
const DYNAMIC_CACHE_NAME = 'mowed-dynamic-cache-v1';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/js/chunk-vendors.js',
  '/manifest.json',
  '/img/icons/android-chrome-192x192.png',
  '/img/icons/android-chrome-512x512.png',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(APP_SHELL_ASSETS);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cacheResponse) => {
      // Return cached response if found
      if (cacheResponse) {
        // Fetch and cache update in background
        fetchAndUpdateCache(event.request);
        return cacheResponse;
      }

      // If not in cache, fetch from network
      return fetchAndUpdateCache(event.request);
    })
  );
});

// Helper function to fetch and update cache
function fetchAndUpdateCache(request) {
  return fetch(request).then((networkResponse) => {
    // Check if we received a valid response
    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
      return networkResponse;
    }

    // Clone the response as it can only be consumed once
    const responseToCache = networkResponse.clone();

    caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
      cache.put(request, responseToCache);
    });

    return networkResponse;
  }).catch(() => {
    // If fetch fails, return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
  });
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-solve-queue') {
    event.waitUntil(syncSolveQueue());
  }
});

async function syncSolveQueue() {
  try {
    const db = await openDB();
    const offlineQueue = await db.getAll('offlineQueue');
    
    for (const action of offlineQueue) {
      try {
        const response = await fetch('/api/solve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action),
        });

        if (response.ok) {
          await db.delete('offlineQueue', action.id);
        } else {
          console.error('Failed to sync action:', action);
        }
      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncSolveQueue:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MOWED_DB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
    };
  });
}
