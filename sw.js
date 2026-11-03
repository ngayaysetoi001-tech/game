// Cho game mở được khi không có mạng (cài ra Màn hình chính).
// Có mạng: luôn lấy bản mới nhất từ máy chủ (bỏ qua bộ nhớ đệm của trình duyệt), rồi lưu lại.
// Mất mạng: dùng bản đã lưu.
const CACHE = 'tkps-v3';
const SHELL = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/rng.js', 'js/version.js', 'js/data.js', 'js/items.js', 'js/combat.js', 'js/sprite.js', 'js/icons.js',
  'js/events4.js', 'js/events3.js', 'js/events2.js', 'js/events.js', 'js/core.js', 'js/ui.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // tệp số phiên bản: không bao giờ lấy từ bộ nhớ
  if (url.pathname.endsWith('version.json')) { e.respondWith(fetch(req, { cache: 'no-store' })); return; }
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(req, { ignoreSearch: true });
      return hit || new Response('Đang ngoại tuyến', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
