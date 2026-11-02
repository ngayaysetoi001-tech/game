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
  const hasSword = o.realm >= 1 && !child && r.chance(0.6);
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
  if (hasSword) {
    for (let i = 0; i < 12; i++) set(20 + i * 0.5 | 0, 22 - i, i < 3 ? '#8a6a2e' : i === 3 ? '#e2c46a' : '#d6dde6');
    for (let i = 4; i < 12; i++) set(21 + i * 0.5 | 0, 22 - i, '#a9b3c0');
    rect(20, 19, 23, 19, '#e2c46a');
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

  // ---------- viền ngoài ----------
  const filled = px.slice();
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    if (filled[y * SW + x]) continue;
    const n = (xx, yy) => xx >= 0 && xx < SW && yy >= 0 && yy < SH && filled[yy * SW + xx];
    if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) px[y * SW + x] = OUT;
  }

  let aura = o.asc ? '#fff2c4' : AURA[Math.min(o.realm || 0, AURA.length - 1)];
  if (o.dead && !o.asc) aura = null;
  return { px, aura, realm: o.realm || 0, seed: o.seed };
}

/** Vẽ lên canvas kích thước SW x SH */
export function drawSprite(canvas, o) {
  const s = buildSprite(o);
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
    if (s.realm >= 4) {
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
  const key = [o.seed, o.g, ageBand, o.realm, o.robe, o.dead ? 1 : 0, o.asc ? 1 : 0].join('|');
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
