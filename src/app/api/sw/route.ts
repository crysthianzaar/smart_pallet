import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const swContent = `
// SmartPallet Service Worker
const CACHE_NAME = 'smartpallet-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // TODO: Implement offline sync logic
  console.log('Background sync triggered');
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do SmartPallet',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
  };

  event.waitUntil(
    self.registration.showNotification('SmartPallet', options)
  );
});
`;

  return new Response(swContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
    },
  });
}
