/* Service worker stub: cache only same-origin static files. Never cache data fetches. */
const STATIC = ["/", "/index.html", "/app.css", "/app.js", "/manifest.json"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("desk-static-v1").then((c) => c.addAll(STATIC)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let gist/data requests bypass the SW
  event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request)));
});
