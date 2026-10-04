const CACHE_NAME = "mines-game-v2";

// On install, just cache the root index and manifest. No dev-only TSX files!
const PRE_CACHE = [
  "/",
  "/index.html",
  "/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE).catch(err => {
        console.warn("Pre-cache failed: ", err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network first, falling back to cache
self.addEventListener("fetch", (e) => {
  // Only handle GET requests and same-origin
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API routes and APK downloads entirely
  if (e.request.url.includes("/api/") || e.request.url.includes("/bot") || e.request.url.endsWith(".apk")) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If it's a valid response, cache a clone for offline use
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is offline/fails
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
        });
      })
  );
});
