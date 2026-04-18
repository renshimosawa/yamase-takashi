const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.png",
  "/yamasekun_base.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          return caches.match("/offline.html");
        }),
    );
    return;
  }

  if (requestUrl.pathname.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.destination === "style" || request.destination === "script") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, `images-${CACHE_VERSION}`));
    return;
  }
});

function staleWhileRevalidate(request) {
  return caches.match(request).then((cachedResponse) => {
    const fetchPromise = fetch(request).then((networkResponse) => {
      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, networkResponse.clone());
      });
      return networkResponse;
    });

    return cachedResponse || fetchPromise;
  });
}

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    }),
  );
}

function normalizeNotificationLink(rawLink) {
  if (typeof rawLink !== "string" || rawLink.trim().length === 0) {
    return "/";
  }

  try {
    const normalizedUrl = new URL(rawLink, self.location.origin);
    if (normalizedUrl.origin !== self.location.origin) {
      return "/";
    }

    return `${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}`;
  } catch {
    return "/";
  }
}

self.addEventListener("push", (event) => {
  const fallbackTitle = "新しい投稿があります";
  const fallbackBody = "アプリを開いて最新の投稿を確認してください。";

  let payload = null;
  let rawText = "";

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      try {
        rawText = event.data.text();
      } catch (textError) {
        console.error("Failed to read push payload", textError);
      }
      console.error("Failed to parse push payload as JSON", error);
    }
  }

  let normalized = payload ?? {};
  const fcmMessage =
    normalized &&
    typeof normalized === "object" &&
    normalized.data &&
    typeof normalized.data === "object" &&
    normalized.data.FCM_MSG &&
    typeof normalized.data.FCM_MSG === "string"
      ? normalized.data.FCM_MSG
      : null;

  if (fcmMessage) {
    try {
      normalized = JSON.parse(fcmMessage);
    } catch (error) {
      console.error("Failed to parse nested FCM_MSG payload", error);
    }
  }

  const notification =
    normalized && typeof normalized === "object"
      ? normalized.notification
      : null;
  const data =
    normalized && typeof normalized === "object" ? normalized.data : null;
  const rawLink =
    (data && typeof data === "object" && data.link) ||
    (normalized &&
      typeof normalized === "object" &&
      normalized.fcmOptions &&
      typeof normalized.fcmOptions === "object" &&
      normalized.fcmOptions.link) ||
    "/";
  const link = normalizeNotificationLink(rawLink);

  const title =
    (notification && notification.title) ||
    (data && typeof data === "object" && data.title) ||
    fallbackTitle;
  const body =
    (notification && notification.body) ||
    (data && typeof data === "object" && data.body) ||
    rawText ||
    fallbackBody;
  const icon =
    (notification && notification.icon) ||
    (data && typeof data === "object" && data.icon) ||
    "/favicon.png";
  const badge =
    (notification && notification.badge) ||
    (data && typeof data === "object" && data.badge) ||
    "/favicon.png";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { link },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = normalizeNotificationLink(event.notification?.data?.link || "/");
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(link);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(link);
        }
        return undefined;
      }),
  );
});
