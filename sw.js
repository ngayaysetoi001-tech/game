// Cho game mở được khi không có mạng (cài ra Màn hình chính).
// Có mạng: luôn lấy bản mới nhất từ máy chủ (bỏ qua bộ nhớ đệm của trình duyệt), rồi lưu lại.
// Mất mạng: dùng bản đã lưu.
const CACHE = 'tkps-v7';
const SHELL = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/rng.js', 'js/version.js', 'js/data.js', 'js/items.js', 'js/combat.js', 'js/sprite.js', 'js/icons.js',
  'js/gear2.js', 'js/fate.js', 'js/events5.js', 'js/events4.js', 'js/events3.js', 'js/events2.js', 'js/events.js', 'js/core.js', 'js/ui.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'js/art.js',
  // <art>
  'assets/heroes/kiem.webp', 'assets/heroes/kiem_dung.webp', 'assets/heroes/kiem_nu.webp', 'assets/heroes/kiem_nu_dung.webp', 'assets/heroes/meditate.webp', 'assets/heroes/meditate_nu.webp', 'assets/heroes/phu.webp', 'assets/heroes/phu_dung.webp', 'assets/heroes/phu_nu.webp', 'assets/heroes/phu_nu_dung.webp', 'assets/heroes/the.webp', 'assets/heroes/the_dung.webp', 'assets/heroes/the_nu.webp', 'assets/heroes/the_nu_dung.webp', 'assets/monsters/bang_hoang.webp', 'assets/monsters/bang_xa.webp', 'assets/monsters/bang_yeu.webp', 'assets/monsters/cu_kinh.webp', 'assets/monsters/cuu_vi_ho.webp', 'assets/monsters/da_tru.webp', 'assets/monsters/doc_hat.webp', 'assets/monsters/dung_nham_thu.webp', 'assets/monsters/hac_thi.webp', 'assets/monsters/hai_yeu.webp', 'assets/monsters/hau_yeu.webp', 'assets/monsters/hoa_van_bao.webp', 'assets/monsters/hoang_tuyen_quy.webp', 'assets/monsters/hon_don_de_quan.webp', 'assets/monsters/hon_don_linh.webp', 'assets/monsters/hon_don_thu.webp', 'assets/monsters/hu_anh.webp', 'assets/monsters/hu_khong_thu.webp', 'assets/monsters/hu_trung.webp', 'assets/monsters/hu_xa.webp', 'assets/monsters/huyet_buc.webp', 'assets/monsters/huyet_lang.webp', 'assets/monsters/huyet_ma.webp', 'assets/monsters/huyet_sa.webp', 'assets/monsters/kiem_khach.webp', 'assets/monsters/kim_giap_quy.webp', 'assets/monsters/kim_si_bang.webp', 'assets/monsters/lang_vuong.webp', 'assets/monsters/linh_phuong.webp', 'assets/monsters/linh_to.webp', 'assets/monsters/loc_than.webp', 'assets/monsters/loi_bao.webp', 'assets/monsters/loi_ky_lan.webp', 'assets/monsters/ma_long.webp', 'assets/monsters/ma_thi.webp', 'assets/monsters/ma_vien.webp', 'assets/monsters/moc_linh.webp', 'assets/monsters/moc_yeu.webp', 'assets/monsters/mong_yeu.webp', 'assets/monsters/soi_yeu.webp', 'assets/monsters/song_dau_ung.webp', 'assets/monsters/thach_cu_nhan.webp', 'assets/monsters/thai_co_ma_than.webp', 'assets/monsters/thap_linh.webp', 'assets/monsters/thien_binh.webp', 'assets/monsters/thiet_hung.webp', 'assets/monsters/tinh_thu.webp', 'assets/monsters/u_hon.webp', 'assets/monsters/xa_yeu.webp', 'assets/monsters/xuong_giap.webp', 'assets/skills/kiem_1.webp', 'assets/skills/kiem_2.webp', 'assets/skills/kiem_3.webp', 'assets/skills/kiem_4.webp', 'assets/skills/kiem_5.webp', 'assets/skills/kiem_6.webp', 'assets/skills/kiem_7.webp', 'assets/skills/kiem_8.webp', 'assets/skills/phu_1.webp', 'assets/skills/phu_2.webp', 'assets/skills/phu_3.webp', 'assets/skills/phu_4.webp', 'assets/skills/phu_5.webp', 'assets/skills/phu_6.webp', 'assets/skills/phu_7.webp', 'assets/skills/phu_8.webp', 'assets/skills/the_1.webp', 'assets/skills/the_2.webp', 'assets/skills/the_3.webp', 'assets/skills/the_4.webp', 'assets/skills/the_5.webp', 'assets/skills/the_6.webp', 'assets/skills/the_7.webp', 'assets/skills/the_8.webp', 'assets/ui/nut_be_quan.webp', 'assets/ui/nut_hanh_trang.webp', 'assets/ui/nut_ket_giao.webp', 'assets/ui/nut_lich_luyen.webp', 'assets/ui/nut_lo_ren.webp', 'assets/ui/nut_muu_sinh.webp', 'assets/ui/nut_thap.webp', 'assets/ui/nut_them.webp', 'assets/ui/nut_tu_bao.webp', 'assets/ui/nut_tu_luyen.webp', 'assets/pets/bang_ly.webp', 'assets/pets/hoa_phuong.webp', 'assets/pets/kim_ho.webp', 'assets/pets/kim_thiem.webp', 'assets/pets/ky_lan.webp', 'assets/pets/linh_hac.webp', 'assets/pets/quy_giap.webp', 'assets/pets/thanh_long.webp', 'assets/pets/tieu_ho.webp', 'assets/pets/van_ho.webp',
  // </art>
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
