const CACHE_NAME = "cargoo-shell-v7";
const APP_SHELL = ["/auth", "/manifest.webmanifest?v=2", "/favicon.svg?v=5", "/icons/icon-192.png?v=4", "/icons/icon-512.png?v=4"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));

      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/auth", preloadResponse.clone());
            return preloadResponse;
          }

          const response = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          await cache.put("/auth", response.clone());
          return response;
        } catch (_error) {
          const cachedPage = await caches.match("/auth");
          return cachedPage || Response.error();
        }
      })(),
    );
    return;
  }

  if (url.origin === self.location.origin && APP_SHELL.includes(url.pathname + url.search)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request, { cache: "no-cache" })
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_error) {}

  const title = data.title || "Cargoo";
  const options = {
    body: data.body || "Tienes una actualizacion sobre una ruta o entrega.",
    icon: "/icons/icon-192.png?v=4",
    tag: data.tag || "cargoo-notification",
    data: { url: data.url || "/auth" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/auth", self.location.origin).toString();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((client) => "focus" in client);

      if (existing) {
        existing.focus();
        if ("navigate" in existing) {
          return existing.navigate(targetUrl);
        }
        return existing;
      }

      return clients.openWindow(targetUrl);
    }),
  );
});
