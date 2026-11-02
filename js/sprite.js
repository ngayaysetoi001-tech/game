// Nhân vật pixel 32x40 dựng bằng code: ghép lớp tóc, mặt, áo, phụ kiện,
// rồi tự viền và tỏa hào quang. Cùng seed thì cùng gương mặt.
import { Rng } from './rng.js';

export const SW = 32;
export const SH = 40;

const OUT = '#22161a';
const SKINS = ['#f6d7b8', '#efc49f', '#dcab82', '#c48d66'];
const HAIRS = ['#2a2026', '#3a2721', '#55331f', '#1e2233', '#4b3524'];
const CLOTH = ['#75685a', '#596b7e', '#62724f', '#7d5c4a', '#6d5e7c', '#8a7a5c'];
// màu hào quang theo cảnh giới (0 = không có)
const AURA = [null, '#9cc7ee', '#86d69a', '#f0c75a', '#c39af0', '#f07a5f', '#69e0d8', '#fff2c4'];

const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const dark = (c, t) => mix(c, '#1a1020', t);
const lite = (c, t) => mix(c, '#fff6e2', t);

/**
 * o: { seed, g: 'nam'|'nu', age, life, realm, robe (màu tông môn hoặc null), dead, asc }
 * Trả về { px: mảng màu SW*SH (null = trống), aura: màu hoặc null, glow: độ mạnh }
 */
export function buildSprite(o) {
  const r = new Rng((o.seed >>> 0) || 1);
  const px = new Array(SW * SH).fill(null);
  const female = o.g === 'nu';
  const child = o.age < 12;
  const life = o.life || 80;
  const elder = o.age >= 50 && o.age > life * 0.7;
  const greying = !elder && o.age >= 40 && o.age > life * 0.5;
  const oy = child ? 4 : 0;

  const set = (x, y, c) => { y += oy; if (x >= 0 && x < SW && y >= 0 && y < SH) px[y * SW + x] = c; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };

  const skin = SKINS[r.int(0, SKINS.length - 1)];
  const skinS = dark(skin, 0.18);
  let hair = HAIRS[r.int(0, HAIRS.length - 1)];
  if (elder) hair = '#e4e0d8';
  else if (greying) hair = mix(hair, '#a9a49c', 0.55);
  const hairL = lite(hair, 0.25);
  const hairD = dark(hair, 0.25);
  const base = o.robe ? mix(o.robe, '#857a6c', 0.3) : CLOTH[r.int(0, CLOTH.length - 1)];
  const robe = base;
  const robeL = lite(robe, 0.22);
  const robeD = dark(robe, 0.28);
  const belt = o.robe ? dark(o.robe, 0.35) : dark(robe, 0.45);
  const trim = o.robe ? lite(o.robe, 0.45) : lite(robe, 0.4);
  const inner = '#f1ead9';

  const stylesM = child ? ['ngan', 'chom'] : ['bui', 'bui', 'dai', 'ngan'];
  const stylesF = child ? ['song', 'chom'] : ['dai', 'song', 'duoi', 'buinu'];
  const style = r.pick(female ? stylesF : stylesM);
  const bigEyes = female || child;

  // ---------- lớp sau: tóc dài, đuôi tóc, kiếm ----------
  if (style === 'dai') {
    rect(8, 9, 23, female ? 30 : 26, hairD);
    rect(9, 9, 22, female ? 29 : 25, hair);
  }
  if (style === 'duoi') {
    rect(21, 6, 25, 9, hair);
    for (let y = 9; y <= 27; y++) rect(23 + (y > 18 ? 1 : 0), y, 25 + (y > 18 ? 1 : 0), y, y % 3 === 0 ? hairL : hair);
  }

  // ---------- thân ----------
  const top = 21;
  const len = child ? 9 : 14; // số hàng của áo
  for (let i = 0; i <= len; i++) {
    const y = top + i;
    const t = i / len;
    let hw = Math.round(5.5 + t * (female ? 4 : 3));
    if (i < 2) hw = female ? 6 : 7; // vai
    const x0 = 16 - hw, x1 = 15 + hw;
    rect(x0, y, x1, y, robe);
    set(x0, y, robeL);
    rect(x1 - 1, y, x1, y, robeD);
  }
  // tay áo rộng
  const armTop = top + 1, armBot = top + (child ? 6 : 10);
  for (let y = armTop; y <= armBot; y++) {
    const wide = y > armBot - 4 ? 1 : 0;
    rect(7 - wide, y, 9, y, robe);
    set(7 - wide, y, robeL);
    rect(22, y, 24 + wide, y, robeD);
  }
  rect(6, armBot, 9, armBot, trim);
  rect(22, armBot, 25, armBot, trim);
  rect(7, armBot + 1, 8, armBot + 1, skin);
  rect(23, armBot + 1, 24, armBot + 1, skinS);
  // cổ áo giao lĩnh
  rect(14, top, 17, top, inner);
  rect(15, top + 1, 16, top + 1, inner);
  for (let k = 0; k < 6; k++) set(13 + k, top + k, trim);
  for (let k = 0; k < 2; k++) set(18 - k, top + k, trim);
  // thắt lưng
  const by = top + (child ? 5 : 7);
  const bw = child ? 6 : 7;
  rect(16 - bw, by, 15 + bw, by + 1, belt);
  rect(17, by + 2, 17, by + 4, belt);
  rect(18, by + 2, 18, by + 3, dark(belt, 0.2));
  if (o.robe) set(16, by, lite(o.robe, 0.6)); // khóa đai tông môn
  // viền gấu áo
  const hemY = top + len;
  for (let x = 0; x < SW; x++) if (px[(hemY + oy) * SW + x] && px[(hemY + oy) * SW + x] !== OUT) set(x, hemY, trim);
  // giày
  rect(12, hemY + 1, 14, hemY + 2, '#3b2b2c');
  rect(17, hemY + 1, 19, hemY + 2, '#3b2b2c');
  // cổ
  rect(15, 20, 16, 20, skinS);

  // ---------- binh khí cầm tay phải ----------
  const hy = armBot + 1; // ngang bàn tay
  const steel = '#dbe2ea', steelD = '#9aa5b2', gold = '#e2c46a', wood = '#7a5230';
  if (o.wep === 'kiem') {
    rect(26, hy - 12, 26, hy - 1, steel);
    rect(27, hy - 11, 27, hy - 1, steelD);
    set(26, hy - 13, '#f4f7fa');
    rect(25, hy, 28, hy, gold);
    rect(26, hy + 1, 26, hy + 2, wood);
  } else if (o.wep === 'dao') {
    rect(26, hy - 10, 26, hy - 1, steelD);
    rect(27, hy - 10, 28, hy - 1, steel);
    set(28, hy - 11, steel); set(27, hy - 11, steel);
    rect(25, hy, 28, hy, '#8a6a2e');
    rect(26, hy + 1, 26, hy + 3, wood);
  } else if (o.wep === 'thuong') {
    rect(26, 4, 26, hemY + 1, wood);
    rect(26, 0, 26, 2, steel); set(25, 2, steelD); set(27, 2, steelD);
    set(25, 3, '#c0392b'); set(27, 3, '#c0392b'); set(26, 3, '#c0392b'); set(26, 5, '#c0392b');
  } else if (o.wep === 'quat') {
    for (let k = 0; k <= 5; k++) for (let dx = -k; dx <= k; dx++) set(26 + dx, hy - 1 - k, (dx + k) % 2 ? '#c9a24a' : '#f3e6c4');
    rect(21, hy - 6, 31, hy - 6, '#b0413e');
    set(26, hy, wood);
  }

  // ---------- đầu ----------
  for (let y = 7; y <= 19; y++) {
    const inset = y === 7 || y === 19 ? 2 : y === 8 || y === 18 ? 1 : 0;
    rect(9 + inset, y, 22 - inset, y, skin);
    rect(21 - inset, y, 22 - inset, y, skinS);
  }
  rect(11, 19, 20, 19, skinS);
  set(8, 13, skin); set(8, 14, skin); set(23, 13, skinS); set(23, 14, skinS);

  // mặt
  const eye = o.dead ? '#6d6466' : '#2b1d2a';
  if (o.dead) {
    rect(11, 14, 13, 14, eye); rect(18, 14, 20, 14, eye);
  } else if (elder) {
    rect(11, 14, 13, 14, eye); rect(18, 14, 20, 14, eye);
  } else {
    const eh = bigEyes ? 2 : 1;
    rect(12, 13, 13, 13 + eh, eye); rect(18, 13, 19, 13 + eh, eye);
    set(12, 13, '#ffffff'); set(18, 13, '#ffffff');
  }
  // lông mày
  const brow = elder ? '#e4e0d8' : hairD;
  if (female) { rect(12, 11, 13, 11, brow); rect(18, 11, 19, 11, brow); }
  else { rect(11, 11, 13, 11, brow); rect(18, 11, 20, 11, brow); }
  if (elder) { set(10, 12, brow); set(21, 12, brow); }
  // má, miệng
  if ((female || child) && !o.dead) { set(11, 16, '#ec9f8f'); set(20, 16, '#ec9f8f'); }
  rect(15, 17, 16, 17, o.dead ? '#8c7f7f' : '#b0584e');

  // ---------- tóc phía trước ----------
  // chỏm đầu
  for (let y = 5; y <= 10; y++) {
    const inset = y === 5 ? 3 : y === 6 ? 1 : 0;
    rect(9 + inset, y, 22 - inset, y, hair);
  }
  rect(11, 6, 15, 6, hairL);
  rect(10, 7, 12, 7, hairL);
  // mái
  if (female || child) {
    for (let x = 9; x <= 22; x++) {
      set(x, 11, hair);
      if (x % 2 === 0 && x > 9 && x < 22) set(x, 12, hair);
    }
  } else {
    for (let x = 9; x <= 22; x++) if (x !== 15 && x !== 16) set(x, 10, hair);
    set(14, 11, hair); set(17, 11, hair);
  }
  // hai bên thái dương
  const sideLen = style === 'dai' ? 22 : female ? 16 : 13;
  for (let y = 10; y <= sideLen; y++) { set(9, y, hair); set(22, y, hairD); }
  if (style === 'dai' || female) for (let y = 11; y <= sideLen - 2; y++) { set(8, y, hairD); set(23, y, hairD); }

  if (style === 'bui') {
    rect(13, 1, 18, 4, hair);
    rect(14, 0, 17, 0, hair);
    rect(14, 1, 15, 2, hairL);
    rect(11, 3, 20, 3, '#d9b45a'); // trâm
    set(10, 3, '#f3dc8e');
  }
  if (style === 'buinu') {
    rect(12, 1, 19, 4, hair);
    rect(13, 1, 15, 2, hairL);
    rect(19, 2, 21, 4, '#d9b45a');
    set(21, 1, '#e86f7c'); set(22, 2, '#e86f7c'); // hoa cài
  }
  if (style === 'song') {
    rect(6, 3, 10, 7, hair); rect(7, 3, 8, 4, hairL);
    rect(21, 3, 25, 7, hair); rect(22, 3, 23, 4, hairL);
    set(10, 6, '#e86f7c'); set(21, 6, '#e86f7c');
  }
  if (style === 'duoi') {
    rect(19, 3, 23, 6, hair); rect(20, 3, 21, 4, hairL);
    rect(18, 6, 19, 6, '#d9b45a');
  }
  if (style === 'chom') {
    rect(14, 2, 17, 5, hair); rect(15, 2, 15, 3, hairL);
  }
  // râu khi về già (nam)
  if (elder && !female) {
    rect(12, 17, 19, 18, '#e4e0d8');
    rect(13, 19, 18, 21, '#e4e0d8');
    rect(14, 22, 17, 24, '#e4e0d8');
    rect(15, 25, 16, 26, '#d4d0c8');
  }

  outline(px);

  let aura = o.asc ? '#fff2c4' : AURA[Math.min(o.realm || 0, AURA.length - 1)];
  if (o.dead && !o.asc) aura = null;
  return { px, aura, realm: o.realm || 0, seed: o.seed };
}

/** Tự viền đen quanh dáng */
function outline(px) {
  const filled = px.slice();
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    if (filled[y * SW + x]) continue;
    const n = (xx, yy) => xx >= 0 && xx < SW && yy >= 0 && yy < SH && filled[yy * SW + xx];
    if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) px[y * SW + x] = OUT;
  }
}

const BEAST_COL = ['#7a6a58', '#5b6b4a', '#8a4b3a', '#4a5a7a', '#6a4a6a', '#9a8a4a', '#4a4446', '#a89880', '#3f6b6b', '#8a6a3a'];
/** Yêu thú: dáng bốn chân, rắn hoặc chim tùy tên. o: { seed, realm, name } */
export function buildBeast(o) {
  const r = new Rng((o.seed >>> 0) || 1);
  const px = new Array(SW * SH).fill(null);
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < SW && y >= 0 && y < SH) px[y * SW + x] = c; };
  const ell = (cx, cy, rx, ry, c, cD) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) set(x, y, cD && y > cy + ry * 0.35 ? cD : y < cy - ry * 0.5 ? dark(c, 0.15) : c);
    }
  };
  const col = BEAST_COL[r.int(0, BEAST_COL.length - 1)];
  const belly = lite(col, 0.35);
  const name = o.name || '';
  const eye = (o.realm || 0) >= 3 ? '#ff4b3a' : '#f2d04a';
  const kind = /Xà|Giao|Long|Trùng/.test(name) ? 'snake' : /Ưng|Bằng|Bức|Nha/.test(name) ? 'bird' : 'quad';
  if (kind === 'snake') {
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = 4 + t * 24;
      const y = 26 + Math.sin(t * Math.PI * 2.2) * 5 + t * 4;
      ell(x, y, 2.6 - t * 1.2, 2.6 - t * 1.2, col, belly);
    }
    ell(5, 19, 4, 3.2, col);
    for (let y = 21; y <= 25; y++) set(5, y, col);
    set(3, 18, eye); set(1, 20, '#c0392b'); set(0, 21, '#c0392b');
    if (/Long|Giao/.test(name)) { set(4, 14, '#e8dcc0'); set(4, 15, '#e8dcc0'); set(7, 14, '#e8dcc0'); set(7, 15, '#e8dcc0'); }
  } else if (kind === 'bird') {
    ell(17, 25, 7, 5, col, belly);
    ell(9, 19, 3.5, 3.2, col);
    set(5, 19, '#e2a33a'); set(4, 20, '#e2a33a'); set(5, 20, '#c78a2a');
    set(8, 18, eye);
    for (let k = 0; k < 9; k++) for (let j = 0; j <= k; j++) set(15 + k, 22 - j - Math.floor(k / 2), k % 3 === 0 ? dark(col, 0.3) : col);
    for (let i = 0; i < 5; i++) { set(25 + i, 26 + (i % 2), dark(col, 0.2)); }
    for (let y = 30; y <= 34; y++) { set(14, y, '#c78a2a'); set(19, y, '#c78a2a'); }
    set(13, 35, '#c78a2a'); set(15, 35, '#c78a2a'); set(18, 35, '#c78a2a'); set(20, 35, '#c78a2a');
  } else {
    ell(18, 28, 10, 5.5, col, belly);
    ell(8, 23, 5, 4, col);
    for (let y = 24; y <= 25; y++) for (let x = 2; x <= 4; x++) set(x, y, dark(col, 0.1));
    set(2, 24, '#2a1d1d');
    for (let y = 17; y <= 19; y++) { set(6, y, dark(col, 0.2)); set(10, y, dark(col, 0.2)); }
    set(7, 19, col); set(9, 19, col);
    if ((o.realm || 0) >= 3) { for (let y = 14; y <= 17; y++) { set(5, y, '#e8dcc0'); set(11, y, '#e8dcc0'); } }
    set(6, 22, eye);
    set(4, 26, '#f4f4f4');
    for (const x of [10, 14, 21, 25]) for (let y = 32; y <= 37; y++) { set(x, y, dark(col, 0.15)); set(x + 1, y, dark(col, 0.25)); }
    for (let i = 0; i < 8; i++) set(28 + Math.min(2, i / 3), 27 - i, i > 5 ? belly : col);
  }
  outline(px);
  const aura = (o.realm || 0) >= 2 ? '#e0644f' : null;
  return { px, aura, realm: o.realm || 0, seed: o.seed, beast: true };
}

/** Vẽ lên canvas kích thước SW x SH. o.type = 'beast' vẽ yêu thú. */
export function drawSprite(canvas, o) {
  const s = o.type === 'beast' ? buildBeast(o) : buildSprite(o);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SW, SH);
  if (s.aura) {
    // vầng sáng tỏa ra từ dáng người, mạnh dần theo cảnh giới
    const reach = s.realm >= 5 ? 3 : 2;
    const base = 0.12 + Math.min(s.realm, 7) * 0.04;
    ctx.fillStyle = s.aura;
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      if (s.px[y * SW + x]) continue;
      let d = 99;
      for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < SW && yy >= 0 && yy < SH && s.px[yy * SW + xx]) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
      }
      if (d <= reach) {
        ctx.globalAlpha = base * (1 - (d - 1) / reach);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // vòng hào quang sau đầu từ Nguyên Anh
    if (s.realm >= 4 && !s.beast) {
      ctx.globalAlpha = 0.85;
      for (let a = 0; a < 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const x = Math.round(15.5 + Math.cos(t) * 10), y = Math.round(11 + Math.sin(t) * 9);
        if (x >= 0 && x < SW && y >= 0 && y < SH && !s.px[y * SW + x]) ctx.fillRect(x, y, 1, 1);
      }
    }
    // đốm linh khí lơ lửng từ Trúc Cơ
    if (s.realm >= 2) {
      const r = new Rng((s.seed ^ 0x5bd1e995) >>> 0);
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < 3 + s.realm; i++) {
        const x = r.int(1, SW - 2), y = r.int(2, SH - 6);
        if (!s.px[y * SW + x]) ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < s.px.length; i++) {
    const c = s.px[i];
    if (!c) continue;
    ctx.fillStyle = c;
    ctx.fillRect(i % SW, (i / SW) | 0, 1, 1);
  }
  if (o.dead && !o.asc) {
    const img = ctx.getImageData(0, 0, SW, SH);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = img.data[i] * 0.3 + img.data[i + 1] * 0.59 + img.data[i + 2] * 0.11;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    }
    ctx.putImageData(img, 0, 0);
  }
}

const cache = new Map();
/** Ảnh nhỏ cho danh sách, có bộ nhớ đệm */
export function spriteURL(o) {
  const ageBand = o.age < 12 ? 'c' : o.age >= 50 && o.age > (o.life || 80) * 0.7 ? 'e' : o.age >= 40 && o.age > (o.life || 80) * 0.5 ? 'm' : 'a';
  const key = [o.type || 'h', o.seed, o.g, ageBand, o.realm, o.robe, o.wep || '', o.dead ? 1 : 0, o.asc ? 1 : 0].join('|');
  let url = cache.get(key);
  if (!url) {
    const c = document.createElement('canvas');
    c.width = SW; c.height = SH;
    drawSprite(c, o);
    url = c.toDataURL();
    if (cache.size > 400) cache.clear();
    cache.set(key, url);
  }
  return url;
}

/** seed ổn định cho một kiếp của bot */
export const botSeed = (b) => (b.id * 9973 + b.lives * 7919) >>> 0;
