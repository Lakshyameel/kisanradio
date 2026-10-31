const STATIC_CACHE_NAME = "kishanvaani-static-v1";
const API_CACHE_NAME = "kishanvaani-api-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
];

// Install Event: Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup legacy caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== API_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Listen for messages from client (e.g., clear caches on logout)
self.addEventListener("message", (event) => {
  if (event.data && (event.data.type === "CLEAR_API_CACHE" || event.data.type === "LOGOUT")) {
    event.waitUntil(caches.delete(API_CACHE_NAME));
  }
});

// Paths that must NEVER be cached by the service worker to prevent cross-user data leakage
const PRIVATE_API_PATTERNS = [
  "/api/v1/auth",
  "/api/v1/bookmarks",
  "/api/v1/history",
  "/api/v1/admin",
  "/api/v1/users",
  "/api/v1/notifications",
  "/expert/my",
  "/community/my",
];

function isPrivateRequest(request, url) {
  // If authorization header exists, it's user-specific and must not be cached in a shared cache
  if (request.headers.get("Authorization")) return true;
  return PRIVATE_API_PATTERNS.some((pattern) => url.pathname.includes(pattern));
}

// Fetch Event: Network-First with Cache Fallback for public APIs, Cache-First for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Handle API requests
  if (url.pathname.startsWith("/api/v1/")) {
    // Never cache private/authenticated requests
    if (isPrivateRequest(request, url)) {
      return; // Fall through to standard network fetch without SW caching
    }

    // Only cache safe GET requests for public data (Mandi, Weather, News, Crop Calendar)
    if (request.method === "GET") {
      event.respondWith(
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(API_CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(async () => {
            // Offline fallback from API cache
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return 503 Service Unavailable when offline and nothing is cached
            return new Response(
              JSON.stringify({ offline: true, items: [], error: "Network offline and no cached data available" }),
              {
                status: 503,
                statusText: "Service Unavailable",
                headers: { "Content-Type": "application/json" },
              }
            );
          })
      );
      return;
    }
  }

  // 2. Handle navigation requests (SPA routing)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedIndex = await caches.match("/index.html");
        return cachedIndex || caches.match("/");
      })
    );
    return;
  }

  // 3. Static assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
