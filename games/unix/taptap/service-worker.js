// service-worker.js
const CACHE_NAME = 'taptap-cache-v1';
const urlsToCache = [
  '/games/unix/taptap/',
  '/games/unix/taptap/index.html',
  '/games/unix/taptap/style.css',
  '/games/unix/taptap/js/habibiScript.js',
  '/games/unix/taptap/favicons/android-chrome-192x192.png',
  '/games/unix/taptap/favicons/android-chrome-512x512.png',
  '/games/unix/taptap/images/backgroundPattern.svg',
  '/games/unix/taptap/images/pauseIconSmall.svg',
  '/games/unix/taptap/images/tapsIcon.svg',
  '/games/unix/taptap/sounds/mp3/circleAppear.mp3',
  '/games/unix/taptap/sounds/mp3/touchBlue.mp3',
  '/games/unix/taptap/sounds/mp3/touchRed.mp3',
  '/games/unix/taptap/sounds/mp3/levelPassed.mp3',
  '/games/unix/taptap/sounds/mp3/levelLost.mp3',
  '/games/unix/taptap/sounds/mp3/buttonTap.mp3',
  '/games/unix/taptap/sounds/mp3/delayCount.mp3',
  '/games/unix/taptap/sounds/mp3/timeAlmostUp.mp3',
  '/games/unix/taptap/sounds/ogg/circleAppear.ogg',
  '/games/unix/taptap/sounds/ogg/touchBlue.ogg',
  '/games/unix/taptap/sounds/ogg/touchRed.ogg',
  '/games/unix/taptap/sounds/ogg/levelPassed.ogg',
  '/games/unix/taptap/sounds/ogg/levelLost.ogg',
  '/games/unix/taptap/sounds/ogg/buttonTap.ogg',
  '/games/unix/taptap/sounds/ogg/delayCount.ogg',
  '/games/unix/taptap/sounds/ogg/timeAlmostUp.ogg'
];

// Install event: Cache assets with error handling
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Fetch each URL individually to handle failures
      return Promise.all(
        urlsToCache.map(url => {
          return fetch(url).then(response => {
            if (!response.ok) {
              console.error(`Failed to cache ${url}: ${response.statusText}`);
              return null; // Skip failed assets
            }
            return cache.put(url, response);
          }).catch(error => {
            console.error(`Failed to fetch ${url}: ${error.message}`);
            return null; // Skip failed assets
          });
        })
      ).then(() => {
        console.log('Caching completed');
      });
    }).catch(error => {
      console.error('Cache open failed:', error);
    })
  );
});

// Fetch event: Serve cached assets or fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(networkResponse => {
        if (event.request.url.includes('leaderboard.php')) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      return caches.match('/games/unix/taptap/index.html');
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});