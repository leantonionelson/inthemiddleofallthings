// Service Worker for "In the Middle of All Things"
const CACHE_NAME = 'middle-app-v2';
const STATIC_CACHE = 'middle-static-v2';
const DYNAMIC_CACHE = 'middle-dynamic-v2';
const OFFLINE_CACHE = 'middle-offline-v2';
const AUDIO_CACHE = 'middle-audio-v2';
const VIDEO_CACHE = 'middle-video-v2';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/logo.png'
];

// Audio files to cache for offline use
const AUDIO_FILES = [
  '/media/audio/chapters/',
  '/media/audio/meditations/',
  '/media/audio/stories/'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      // Initialize offline cache
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('Offline cache initialized');
        return cache;
      }),
      // Initialize audio cache
      caches.open(AUDIO_CACHE).then((cache) => {
        console.log('Audio cache initialized');
        return cache;
      }),
      // Initialize video cache and preload background videos
      caches.open(VIDEO_CACHE).then(async (cache) => {
        console.log('Video cache initialized');
        // Preload background videos during install
        try {
          const videoUrls = ['/media/bg.mp4', '/media/bg-desktop.mp4'];
          await Promise.all(
            videoUrls.map(async (url) => {
              try {
                const response = await fetch(url);
                if (response.ok) {
                  await cache.put(url, response.clone());
                  console.log('Precached video:', url);
                }
              } catch (error) {
                console.warn('Failed to precache video:', url, error);
              }
            })
          );
        } catch (error) {
          console.warn('Video precaching failed:', error);
        }
        return cache;
      })
    ])
    .then(() => {
      console.log('Service Worker installed');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('Service Worker installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== OFFLINE_CACHE && 
                cacheName !== AUDIO_CACHE &&
                cacheName !== VIDEO_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    handleFetch(request)
  );
});

// Enhanced fetch handler with offline support
async function handleFetch(request) {
  const url = new URL(request.url);
  
  // Handle video files with special caching (CacheFirst strategy)
  if (url.pathname.match(/\/media\/bg.*\.mp4$/i)) {
    return handleVideoFetch(request);
  }
  
  // Handle audio files with special caching
  if (url.pathname.startsWith('/media/audio/')) {
    return handleAudioFetch(request);
  }
  
  // Handle offline content
  if (url.pathname.startsWith('/offline/')) {
    return handleOfflineFetch(request);
  }
  
  // Handle regular requests
  return handleRegularFetch(request);
}

// Handle video file requests - CacheFirst strategy for instant loading
async function handleVideoFetch(request) {
  const videoCache = await caches.open(VIDEO_CACHE);
  const cachedVideo = await videoCache.match(request);
  
  if (cachedVideo) {
    // Return cached video immediately
    return cachedVideo;
  }
  
  // Try network and cache for future use
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful video responses
      const responseToCache = response.clone();
      await videoCache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    // If network fails and no cache, return error
    return new Response('Video not available', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Handle audio file requests
async function handleAudioFetch(request) {
  // Try audio cache first
  const audioCache = await caches.open(AUDIO_CACHE);
  const cachedAudio = await audioCache.match(request);
  
  if (cachedAudio) {
    return cachedAudio;
  }
  
  // Try offline cache
  const offlineCache = await caches.open(OFFLINE_CACHE);
  const cachedOffline = await offlineCache.match(request);
  
  if (cachedOffline) {
    return cachedOffline;
  }
  
  // Try network
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful audio responses
      const responseToCache = response.clone();
      await audioCache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    // Return offline indicator for audio
    return new Response('Audio not available offline', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Handle offline content requests
async function handleOfflineFetch(request) {
  const offlineCache = await caches.open(OFFLINE_CACHE);
  const cached = await offlineCache.match(request);
  
  if (cached) {
    return cached;
  }
  
  // Try network
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      await offlineCache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    return new Response('Content not available offline', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Handle regular requests
async function handleRegularFetch(request) {
  // Try static cache first
  const staticCache = await caches.open(STATIC_CACHE);
  const cachedStatic = await staticCache.match(request);
  
  if (cachedStatic) {
    return cachedStatic;
  }
  
  // Try dynamic cache
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  const cachedDynamic = await dynamicCache.match(request);
  
  if (cachedDynamic) {
    return cachedDynamic;
  }
  
  // Try network
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      await dynamicCache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    // Return offline indicator for other requests
    return new Response('Content not available offline', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions when connection is restored
      handleBackgroundSync()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New content available',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/pwa-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('In the Middle of All Things', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Sync any offline data when connection is restored
    console.log('Handling background sync...');
    
    // You can add specific sync logic here, such as:
    // - Upload saved highlights
    // - Sync reading progress
    // - Update user preferences
    
    return Promise.resolve();
  } catch (error) {
    console.error('Background sync failed:', error);
    return Promise.reject(error);
  }
}

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Acknowledge the message if a port is provided
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: 'SKIP_WAITING_ACK' });
    }
    self.skipWaiting();
  }
});
