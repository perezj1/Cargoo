const CACHE_PREFIX = "cargoo-shell-";
const CACHE_NAME = "cargoo-shell-v10";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_error) {}

  const title = data.title || "Cargoo";
  const options = {
    body: data.body || "Tienes una actualizacion sobre una ruta o entrega.",
    icon: "/icons/icon-192.png?v=5",
    tag: data.tag || "cargoo-notification",
    data: { url: data.url || "/auth?source=notification" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/auth?source=notification", self.location.origin).toString();

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
