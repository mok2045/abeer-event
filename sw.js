const CACHE = "abeer-v1";
const ASSETS = ["./", "./index.html", "./assets/css/styles.css", "./assets/js/store.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith("api.php") || url.pathname.endsWith("data.json")) { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => { if (e.request.method === "GET" && res.ok && url.origin === location.origin) { caches.open(CACHE).then((c) => c.put(e.request, res.clone())); } return res; }).catch(() => cached)));
});
