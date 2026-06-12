/* عبير إيفنت — Service Worker (تخزين مؤقت بسيط للعمل دون اتصال) */
const CACHE = "abeer-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./assets/css/styles.css?v=3",
  "./assets/js/store.js?v=3",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // لا تخزّن طلبات الـ API أو البيانات — اجلبها دائماً حديثة
  if (url.pathname.endsWith("api.php") || url.pathname.endsWith("data.json")) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // باقي الملفات: من الكاش أولاً ثم الشبكة
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      if (e.request.method === "GET" && res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => cached))
  );
});
