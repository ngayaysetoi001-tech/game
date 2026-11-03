// Cho game mở được khi không có mạng (cài ra Màn hình chính).
// Cách làm: trả bản đã lưu ngay cho nhanh, đồng thời tải bản mới ở nền để lần mở sau dùng.
const CACHE = 'tkps-v1';
const SHELL = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/rng.js', 'js/data.js', 'js/items.js', 'js/combat.js', 'js/sprite.js', 'js/icons.js',
  'js/events2.js', 'js/events.js', 'js/core.js', 'js/ui.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then((res) => { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response('Đang ngoại tuyến', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
