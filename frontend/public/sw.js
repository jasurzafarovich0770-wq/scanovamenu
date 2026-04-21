// Service Worker for caching and offline support
const CACHE_NAME = 'restaurant-qr-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache failed:', error);
      })
  );
});

// Fetch event - Skip caching for development files
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip Vite development files
  if (url.pathname.includes('@vite') || 
      url.pathname.includes('@react-refresh') || 
      url.pathname.includes('?t=') ||
      url.pathname.includes('.tsx') ||
      url.pathname.includes('.ts') ||
      url.pathname.includes('src/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(() => {
        // Fallback for offline
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});