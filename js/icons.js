// Biểu tượng pixel 16x16 cho trang bị, đan dược, bí kíp. Vẽ bằng code rồi tự viền.
import { mix } from './sprite.js';

export const IW = 16;
const I_OUT = '#22161a';
const idark = (c, t) => mix(c, '#1a1020', t);
const ilite = (c, t) => mix(c, '#fff6e2', t);

// màu theo phẩm: lưỡi, khảm, vầng sáng
const I_STEEL = ['#8f969c', '#c3ccd5', '#d4c4f5', '#ffe39a', '#ff7a5a'];
const I_GUARD = ['#8a6a3a', '#b08d3a', '#c9ced8', '#f0c64a', '#ffd24a'];
const I_GLOW = [null, null, '#b48cff', '#ffcf3d', '#ff3b2f'];
const I_CLOTH = ['#6d7f9a', '#8a4f4a', '#5f7d5a', '#7d6a9a', '#9a7a4a', '#4f7f86', '#86566f'];

/** Màu áo của một món y phục, cố định theo món */
export function armorColor(it) {
  if (it.col) return it.col;
  return I_CLOTH[Math.abs(it.id * 7 + (it.n || '').length) % I_CLOTH.length];
}

/** Loại hình của món: kiem/dao/thuong/quat, dao_bao/chien_giap/phap_y/ho_tam, ngoc_boi/gioi_chi/ho_phu/linh_chau */
export function iconKind(it) {
  if (it.slot === 'vu_khi') return it.wt || 'kiem';
  const n = it.n || '';
  if (it.slot === 'ao') return /Giáp/.test(n) ? (/Hộ Tâm/.test(n) ? 'ho_tam' : 'chien_giap') : /Pháp Y/.test(n) ? 'phap_y' : 'dao_bao';
  return /Giới Chỉ/.test(n) ? 'gioi_chi' : /Hộ Phù/.test(n) ? 'ho_phu' : /Linh Châu/.test(n) ? 'linh_chau' : 'ngoc_boi';
}

function canvasBuf() {
  const px = new Array(IW * IW).fill(null);
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < IW && y >= 0 && y < IW) px[y * IW + x] = c; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  const line = (x0, y0, x1, y1, c) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
  };
  const ell = (cx, cy, rx, ry, fn) => {
    for (let y = 0; y < IW; y++) for (let x = 0; x < IW; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) { const c = fn(x, y, d); if (c) set(x, y, c); }
    }
  };
  return { px, set, rect, line, ell };
}

/** Dựng biểu tượng. o: { kind, q, col, seed } */
export function buildIcon(o) {
  const { px, set, rect, line, ell } = canvasBuf();
  const q = o.q || 0;
  const steel = I_STEEL[q], steelL = ilite(steel, 0.5), steelD = idark(steel, 0.25);
  const guard = I_GUARD[q], wood = '#7a5230', woodD = '#553820';
  const col = o.col || '#6d7f9a', colL = ilite(col, 0.3), colD = idark(col, 0.3);
  const trim = q >= 4 ? '#ff5a3a' : q >= 3 ? '#f0c64a' : q >= 2 ? '#d9e2f0' : ilite(col, 0.55);
  const k = o.kind;

  if (k === 'kiem') {
    line(4, 11, 13, 2, steel);
    line(5, 11, 14, 2, steelD);
    line(4, 10, 12, 2, steelL);
    set(14, 1, steelL);
    line(2, 9, 6, 13, guard);
    set(4, 11, idark(guard, 0.2));
    line(1, 14, 3, 12, wood);
    set(0, 15, guard);
    if (q >= 2) set(4, 11, q >= 4 ? '#ffd24a' : q >= 3 ? '#e2413a' : '#a77bff');
  } else if (k === 'dao') {
    for (let t = 0; t < 3; t++) line(4 + t, 11 + t * 0.4, 12 + t * 0.6, 2 + t, t === 0 ? steelD : t === 1 ? steel : steelL);
    set(13, 1, steel); set(14, 2, steelL); set(14, 3, steelL);
    rect(2, 11, 4, 13, guard);
    line(0, 15, 2, 13, wood);
    set(1, 15, woodD);
  } else if (k === 'thuong') {
    line(1, 15, 11, 5, wood);
    line(2, 15, 12, 5, woodD);
    set(12, 4, steelD); set(13, 3, steel); set(14, 2, steelL); set(15, 1, steelL);
    set(12, 3, steel); set(13, 4, steel); set(13, 2, steelL); set(14, 3, steelD);
    set(10, 5, '#c0392b'); set(11, 6, '#c0392b'); set(9, 6, '#a5302a'); set(10, 7, '#a5302a'); set(9, 8, '#c0392b');
  } else if (k === 'quat') {
    const paper = q >= 4 ? '#ffb38a' : q >= 3 ? '#fbe7a6' : q >= 2 ? '#eee4fb' : '#f3e6c4';
    for (let a = 0; a <= 24; a++) {
      const ang = Math.PI * (1.08 + (a / 24) * 0.84);
      const c = a % 4 === 0 ? (q >= 2 ? '#9a7fd0' : '#b89a5a') : a % 2 ? paper : ilite(paper, 0.2);
      for (let r = 2; r <= 7.5; r += 0.5) set(8 + Math.cos(ang) * r, 13 + Math.sin(ang) * r, c);
    }
    for (let a = 0; a <= 40; a++) { const ang = Math.PI * (1.08 + (a / 40) * 0.84); set(8 + Math.cos(ang) * 7.6, 13 + Math.sin(ang) * 7.6, q >= 3 ? '#e2413a' : '#b0413e'); }
    rect(7, 12, 8, 14, guard);
  } else if (k === 'dao_bao' || k === 'phap_y') {
    rect(4, 3, 11, 4, col);
    for (let y = 5; y <= 13; y++) { const w = 3 + Math.floor((y - 5) / 3); rect(8 - w - 1, y, 7 + w + 1, y, col); set(8 - w - 1, y, colL); set(7 + w + 1, y, colD); }
    rect(1, 4, 3, 9, col); rect(12, 4, 14, 9, colD); rect(1, 9, 3, 9, trim); rect(12, 9, 14, 9, trim);
    line(6, 3, 9, 7, trim); rect(7, 3, 8, 3, '#f1ead9');
    rect(4, 8, 11, 8, idark(col, 0.45));
    rect(3, 14, 12, 14, trim);
    if (k === 'phap_y') { ell(8, 11, 2.2, 2.2, (x, y, d) => (d > 0.45 ? trim : col)); set(8, 11, trim); }
  } else if (k === 'chien_giap') {
    const m = q >= 4 ? '#d8452f' : q >= 3 ? '#d8b44a' : q >= 2 ? '#c4b4e0' : '#8f969c';
    rect(4, 3, 11, 12, m);
    for (let y = 5; y <= 11; y += 2) rect(4, y, 11, y, idark(m, 0.3));
    rect(4, 3, 4, 12, ilite(m, 0.3));
    ell(3, 4, 2.5, 2, () => ilite(m, 0.15)); ell(12, 4, 2.5, 2, () => idark(m, 0.1));
    rect(5, 13, 10, 14, col);
    rect(7, 2, 8, 2, idark(m, 0.4));
  } else if (k === 'ho_tam') {
    rect(4, 3, 11, 13, col); rect(4, 3, 4, 13, colL); rect(11, 3, 11, 13, colD);
    rect(2, 3, 3, 6, colD); rect(12, 3, 13, 6, colD);
    ell(7.5, 8, 3.2, 3.2, (x, y, d) => (d > 0.6 ? guard : d < 0.15 ? steelL : steel));
    set(6, 7, '#ffffff');
  } else if (k === 'ngoc_boi') {
    const jade = q >= 4 ? '#ff5a3a' : q >= 3 ? '#f3d35a' : q >= 2 ? '#c9a8ff' : '#6fbf8f';
    line(8, 0, 8, 3, '#c0392b');
    ell(8, 8, 5, 5, (x, y, d) => (d < 0.12 ? null : d > 0.75 ? idark(jade, 0.2) : x + y < 14 ? ilite(jade, 0.35) : jade));
    line(8, 13, 8, 15, '#c0392b'); set(7, 15, '#c0392b'); set(9, 15, '#c0392b');
  } else if (k === 'gioi_chi') {
    const band = q >= 4 ? '#f0c64a' : q >= 2 ? '#d9e2f0' : '#d0a040';
    ell(8, 10, 5, 4, (x, y, d) => (d > 0.5 ? (y < 10 ? ilite(band, 0.3) : band) : null));
    const gem = q >= 4 ? '#ff2a1a' : q >= 3 ? '#e2413a' : q >= 2 ? '#a77bff' : q >= 1 ? '#5fbf7f' : '#a08060';
    ell(8, 5, 2.5, 2.2, (x, y, d) => (d < 0.3 ? ilite(gem, 0.5) : gem));
  } else if (k === 'ho_phu') {
    const paper = q >= 4 ? '#ff9a7a' : q >= 3 ? '#ffe48a' : '#f1d77a';
    rect(4, 1, 11, 14, paper); rect(4, 1, 11, 1, '#c0392b'); rect(4, 14, 11, 14, '#c0392b');
    line(8, 3, 8, 12, '#b0302a'); line(6, 5, 10, 5, '#b0302a'); line(6, 8, 10, 10, '#b0302a'); line(10, 8, 6, 10, '#b0302a');
    set(11, 2, idark(paper, 0.2));
  } else if (k === 'linh_chau') {
    const orb = q >= 4 ? '#ff4d3a' : q >= 3 ? '#ffcf3d' : q >= 2 ? '#b48cff' : q >= 1 ? '#a77bd8' : '#7fa0b0';
    ell(8, 7, 5.2, 5.2, (x, y, d) => (d < 0.08 ? '#ffffff' : x + y < 12 ? ilite(orb, 0.35) : d > 0.7 ? idark(orb, 0.25) : orb));
    set(6, 5, '#ffffff');
    rect(5, 12, 10, 13, guard); rect(4, 14, 11, 14, idark(guard, 0.3));
  } else if (k === 'dan') {
    // bình đan (hồ lô)
    const c = o.col || '#c0392b';
    ell(8, 11, 4.5, 4, (x, y, d) => (x < 7 && y < 11 ? ilite(c, 0.35) : d > 0.7 ? idark(c, 0.25) : c));
    ell(8, 5.5, 2.6, 2.4, (x, y) => (x < 8 ? ilite(c, 0.35) : c));
    rect(7, 1, 9, 2, '#8a6a3a'); rect(6, 8, 10, 8, '#e2c46a');
  } else if (k === 'thoi') {
    // thỏi kim loại
    const c = o.col || '#9aa3ab';
    for (let y = 6; y <= 11; y++) { const i = y - 6; rect(2 + Math.floor(i / 2), y, 13 - Math.floor(i / 2), y, y === 6 ? ilite(c, 0.45) : y > 9 ? idark(c, 0.3) : c); }
    for (let y = 9; y <= 13; y++) rect(1 + Math.floor((y - 9) / 2), y, 8 - Math.floor((y - 9) / 2), y, y === 9 ? ilite(c, 0.4) : y > 11 ? idark(c, 0.35) : c);
    set(4, 7, '#ffffff'); set(3, 10, '#ffffff');
  } else if (k === 'hach') {
    // lõi tròn có vân
    const c = o.col || '#c0503a';
    ell(8, 8, 5.5, 5.5, (x, y, d) => (d < 0.1 ? ilite(c, 0.7) : x + y < 13 ? ilite(c, 0.3) : d > 0.72 ? idark(c, 0.35) : c));
    line(5, 9, 10, 6, idark(c, 0.45)); set(6, 5, '#ffffff');
  } else if (k === 'mat') {
    // cụm tinh thể
    const c = o.col || '#8fd3ff';
    const crystal = (cx, top, w, h) => { for (let y = top; y <= top + h; y++) { const hw = y < top + 2 ? (y - top) : w; for (let x = cx - hw; x <= cx + hw; x++) set(x, y, x < cx ? ilite(c, 0.35) : x === cx ? c : idark(c, 0.25)); } };
    crystal(8, 1, 2, 12); crystal(4, 6, 1, 8); crystal(12, 5, 1, 9);
    rect(2, 14, 13, 14, idark(c, 0.55)); set(7, 3, '#ffffff');
  } else if (k === 'bi_kip') {
    rect(2, 3, 13, 12, '#e9dcbc');
    rect(2, 3, 2, 12, '#b89a6a'); rect(13, 3, 13, 12, '#b89a6a');
    rect(1, 2, 1, 13, wood); rect(14, 2, 14, 13, wood);
    for (const y of [5, 7, 9]) line(4, y, 11, y, '#5a4a3a');
    rect(9, 10, 11, 11, '#c0392b');
  }

  // viền
  const filled = px.slice();
  for (let y = 0; y < IW; y++) for (let x = 0; x < IW; x++) {
    if (filled[y * IW + x]) continue;
    const n = (xx, yy) => xx >= 0 && xx < IW && yy >= 0 && yy < IW && filled[yy * IW + xx];
    if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) px[y * IW + x] = I_OUT;
  }
  return { px, glow: I_GLOW[q] };
}

export function drawIcon(canvas, o) {
  const s = buildIcon(o);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, IW, IW);
  if (s.glow) {
    ctx.fillStyle = s.glow;
    for (let y = 0; y < IW; y++) for (let x = 0; x < IW; x++) {
      if (s.px[y * IW + x]) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < IW && yy >= 0 && yy < IW && s.px[yy * IW + xx]) { near = true; break; }
      }
      if (near) { ctx.globalAlpha = 0.45; ctx.fillRect(x, y, 1, 1); }
      else if (o.q >= 4) {
        for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < IW && yy >= 0 && yy < IW && s.px[yy * IW + xx]) { near = true; break; } }
        if (near) { ctx.globalAlpha = 0.22; ctx.fillRect(x, y, 1, 1); }
      }
    }
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < s.px.length; i++) {
    if (!s.px[i]) continue;
    ctx.fillStyle = s.px[i];
    ctx.fillRect(i % IW, (i / IW) | 0, 1, 1);
  }
  if (o.faded) {
    const img = ctx.getImageData(0, 0, IW, IW);
    for (let i = 0; i < img.data.length; i += 4) { img.data[i + 3] *= 0.22; }
    ctx.putImageData(img, 0, 0);
  }
}

const iconCache = new Map();
export function iconURL(o) {
  const key = [o.kind, o.q || 0, o.col || '', o.faded ? 1 : 0].join('|');
  let url = iconCache.get(key);
  if (!url) {
    const c = document.createElement('canvas');
    c.width = IW; c.height = IW;
    drawIcon(c, o);
    url = c.toDataURL();
    iconCache.set(key, url);
  }
  return url;
}

/** Biểu tượng của một món trang bị */
export const itemIconOpts = (it) => ({ kind: iconKind(it), q: it.q, col: it.slot === 'ao' ? armorColor(it) : null });

export const PILL_COLORS = { hoi_xuan: '#c0392b', pha_canh: '#8e5bd0', dien_tho: '#d8a83c', tinh_tam: '#4f8fd6' };

/** Mã nhúng biểu tượng vào chữ (giao diện thay bằng ảnh, nơi khác bỏ qua) */
export const matIconOpts = (id, m) => ({ kind: id === 'tinh_thiet' ? 'thoi' : m.aff === 'ls' || m.aff === 'dodge' ? 'hach' : 'mat', q: Math.min(4, m.q), col: m.col });
export const iconToken = (o) => `[[i|${o.kind}|${o.q || 0}|${o.col || '-'}]]`;
export const itemToken = (it) => iconToken(itemIconOpts(it));
export const ICON_TOKEN_RE = /\[\[i\|(\w+)\|(\d)\|(#[0-9a-fA-F]{6}|-)\]\]/g;
export const stripIconTokens = (s) => String(s).replace(ICON_TOKEN_RE, '');
