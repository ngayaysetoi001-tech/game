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
  if (it.slot === 'vu_khi') return { quyen: 'quyen_sao', phap: 'phap_an' }[it.wt] || it.wt || 'kiem';
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
// ---------- Biểu tượng võ kỹ ----------
// [hình, màu hệ] theo từng chiêu; phẩm (khung, vầng sáng) theo tier, tuyệt học con đường tu hành = 4
const SKILL_ICON = {
  quyen: ['sk_quyen', '#c9a27a'],
  luu_van: ['sk_kiem', '#9fd8ff'], kinh_hong: ['sk_kiem', '#eae2ff'], van_kiem: ['sk_vankiem', '#8fb8ff'],
  liet_hoa: ['sk_dao', '#ff7a2a'], pha_son: ['sk_dao', '#c8a060'],
  truy_hon: ['sk_thuong', '#9b7bff'], bach_dieu: ['sk_thuong', '#6fd0a0'],
  thanh_phong: ['sk_quat', '#7fd08a'], me_hon: ['sk_quat', '#c58cff'],
  han_bang: ['sk_chuong', '#8fe0ff'], tran_nhac: ['sk_an', '#c8a060'], huyet_anh: ['sk_trao', '#d0303a'], ngu_loi: ['sk_loi', '#ffe066'],
  huyen_vu: ['sk_khien', '#4fa8a0'], hoi_nguyen: ['sk_hoi', '#6fd07a'], kim_cang: ['sk_khien', '#f0c64a'],
  nhat_kiem: ['sk_kiem', '#5fc0ff'], ba_the: ['sk_quyen', '#ff8a3a'], cuu_thien: ['sk_loi', '#c08cff'], dai_bi: ['sk_sen', '#f0c64a'], huyet_hai: ['sk_giot', '#c0182a'], van_thu: ['sk_thu', '#d0925a'],
  can_xe: ['sk_trao', '#e0d6c4'], doc_nha: ['sk_giot', '#7fd04a'], cuong_bao: ['sk_no', '#ff5030'], vay_giap: ['sk_khien', '#8a9a6a'], gam_thet: ['sk_gam', '#e0c080'],
};
/** Tùy chọn vẽ biểu tượng cho một võ kỹ (sk: định nghĩa trong SKILLS hoặc BEAST_SKILLS) */
export function skillIconOpts(id, sk = {}) {
  const [kind, col] = SKILL_ICON[id] || ['sk_quyen', '#c9a27a'];
  return { kind, q: sk.path ? 4 : Math.min(3, sk.tier ?? 1), col };
}
export const skillToken = (id, sk) => (/^(kiem|the|phu)_\d$/.test(id) ? `[[i|art_${id}|0|-]]` : iconToken(skillIconOpts(id, sk)));
// vũ khí làm nền cho chiêu binh khí
const SK_WEP = { sk_kiem: 'kiem', sk_dao: 'dao', sk_thuong: 'thuong', sk_quat: 'quat' };
function drawSkill(k, o, { px, set, rect, line, ell }) {
  const col = o.col || '#c9a27a', colL = ilite(col, 0.45), colD = idark(col, 0.3);
  const skin = '#e8b48a', skinD = '#b8845a';
  const arc = (cx, cy, r, a0, a1, c) => { for (let a = a0; a <= a1; a += 4) { const t = (a * Math.PI) / 180; set(cx + Math.cos(t) * r, cy + Math.sin(t) * r, c); } };
  if (SK_WEP[k]) {
    // vẽ binh khí phẩm trung rồi phủ khí của hệ lên
    const base = buildIcon({ kind: SK_WEP[k], q: 1 }).px;
    for (let i = 0; i < base.length; i++) if (base[i] && base[i] !== I_OUT) px[i] = base[i];
    if (k === 'sk_kiem') { arc(8, 8, 7, 200, 290, col); arc(8, 8, 5.6, 210, 280, colL); set(14, 13, colL); set(12, 15, col); }
    if (k === 'sk_dao') { for (const [x, y] of [[13, 6], [14, 4], [12, 3], [15, 7], [13, 1]]) { set(x, y, col); set(x, y + 1, colD); } set(14, 3, colL); }
    if (k === 'sk_thuong') { for (const y of [9, 11, 13]) line(1, y - 3, 4, y - 6, y === 11 ? colL : col); set(15, 0, colL); }
    if (k === 'sk_quat') { arc(8, 13, 9, 200, 340, col); arc(8, 13, 10.4, 215, 300, colL); }
  } else if (k === 'sk_vankiem') {
    for (const [x, y0] of [[3, 3], [8, 1], [13, 3]]) { line(x, y0, x, y0 + 8, '#dfe6ee'); set(x + 1, y0 + 2, '#9aa3ab'); set(x - 1, y0 + 9, col); set(x + 1, y0 + 9, col); set(x, y0 + 9, colD); set(x, y0 + 10, '#7a5230'); set(x, y0 - 1, colL); }
    arc(8, 18, 9, 225, 315, col);
  } else if (k === 'sk_quyen') {
    rect(4, 5, 10, 11, skin); rect(4, 5, 10, 5, skinD); for (const x of [6, 8]) line(x, 5, x, 7, skinD); rect(3, 8, 4, 11, skinD); rect(5, 12, 9, 13, col);
    line(12, 4, 14, 2, col); line(12, 8, 15, 8, colL); line(12, 12, 14, 14, col);
  } else if (k === 'sk_chuong') {
    ell(8, 8, 7.6, 7.6, (x, y, d) => (d > 0.78 ? col : null));
    rect(5, 7, 10, 12, skin); for (const [x, t] of [[5, 3], [7, 2], [9, 3]]) rect(x, t, x, 6, skin); rect(11, 6, 11, 9, skin); rect(5, 12, 10, 12, skinD);
    set(7, 9, colL); set(8, 10, colL);
  } else if (k === 'sk_an') {
    rect(6, 0, 9, 2, '#8a6a3a'); rect(3, 3, 12, 12, col); rect(4, 4, 11, 11, colD); rect(5, 5, 10, 10, col);
    line(7, 6, 7, 9, colL); line(6, 7, 9, 7, colL); line(9, 8, 9, 10, colL); set(12, 3, colL);
  } else if (k === 'sk_khien') {
    for (let y = 2; y <= 14; y++) { const h = y < 9 ? 5 : Math.max(0, 5 - (y - 8)); for (let x = 8 - h; x <= 7 + h; x++) set(x, y, x < 8 ? colL : col); }
    for (let y = 2; y <= 14; y++) { const h = y < 9 ? 5 : Math.max(0, 5 - (y - 8)); set(8 - h, y, colD); set(7 + h, y, colD); }
    rect(3, 2, 12, 2, colD); rect(7, 6, 8, 9, '#ffffff');
  } else if (k === 'sk_hoi') {
    ell(8, 10, 4.6, 4.6, (x, y) => (x + y < 16 ? colL : col)); for (let y = 2; y <= 6; y++) { const w = Math.round((y - 2) * 0.8); rect(8 - w, y, 8 + w, y, col); }
    rect(7, 8, 8, 12, '#ffffff'); rect(6, 9, 9, 11, '#ffffff'); rect(7, 9, 8, 11, '#ffffff');
  } else if (k === 'sk_loi') {
    const pts = [[11, 0], [5, 8], [9, 8], [4, 15]];
    for (let i = 0; i < pts.length - 1; i++) { const [a, b] = pts[i], [c2, d2] = pts[i + 1]; line(a, b, c2, d2, col); line(a + 1, b, c2 + 1, d2, colL); }
    rect(5, 8, 9, 8, col); set(12, 1, colL); set(2, 6, colL); set(13, 11, col);
  } else if (k === 'sk_trao') {
    for (const [x0, y0, x1, y1] of [[3, 2, 8, 13], [6, 1, 11, 12], [9, 1, 14, 11]]) { line(x0, y0, x1, y1, col); line(x0 + 1, y0, x1 + 1, y1, colD); set(x0, y0, colL); }
  } else if (k === 'sk_sen') {
    ell(4.5, 10, 2.2, 3.6, () => colD); ell(11.5, 10, 2.2, 3.6, () => colD); ell(6.5, 9, 2.2, 4.2, () => col); ell(9.5, 9, 2.2, 4.2, () => col); ell(8, 8, 2, 4.6, () => colL);
    rect(3, 13, 12, 13, '#5f9a5a'); rect(5, 14, 10, 14, '#3f7a3a'); set(8, 2, '#ffffff');
  } else if (k === 'sk_giot') {
    ell(8, 10, 4.8, 4.8, (x, y) => (x + y < 15 ? colL : col)); for (let y = 2; y <= 6; y++) { const w = Math.round((y - 2) * 0.9); rect(8 - w, y, 8 + w, y, col); }
    set(6, 9, '#ffffff'); set(6, 10, colL); line(4, 15, 12, 15, colD);
  } else if (k === 'sk_thu') {
    ell(8, 11, 3.8, 3.2, () => col); for (const [x, y] of [[3.5, 6.5], [6.5, 4], [9.5, 4], [12.5, 6.5]]) ell(x, y, 1.6, 2, () => colL);
    set(7, 10, colL); set(8, 10, colL);
  } else if (k === 'sk_no') {
    for (let a = 0; a < 360; a += 45) { const t = (a * Math.PI) / 180; line(8, 8, 8 + Math.cos(t) * 7, 8 + Math.sin(t) * 7, a % 90 ? colL : col); }
    ell(8, 8, 3, 3, (x, y, d) => (d < 0.35 ? '#ffffff' : colL));
  } else if (k === 'sk_gam') {
    rect(1, 6, 3, 10, colD); for (const r of [4, 7, 10]) arc(2, 8, r, -50, 50, r === 7 ? colL : col);
  }
}

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
  } else if (k === 'quyen_sao') {
    // hộ thủ quyền sáo
    const m = q >= 4 ? '#ff6a3a' : q >= 3 ? '#f0c64a' : q >= 2 ? '#c4b4e0' : '#9aa3ab';
    rect(3, 5, 12, 12, m); rect(3, 5, 12, 5, ilite(m, 0.4)); rect(3, 12, 12, 12, idark(m, 0.35));
    for (const x of [4, 6, 8, 10]) { rect(x, 3, x + 1, 5, ilite(m, 0.2)); set(x, 3, ilite(m, 0.6)); }
    rect(5, 13, 10, 15, '#7a5230'); rect(11, 7, 13, 10, idark(m, 0.2));
  } else if (k === 'phap_an') {
    // pháp ấn: khối ngọc có núm
    const jade = q >= 4 ? '#ff5a3a' : q >= 3 ? '#f3d35a' : q >= 2 ? '#b48cff' : '#6fbf8f';
    rect(3, 8, 12, 14, jade); rect(3, 8, 12, 8, ilite(jade, 0.4)); rect(3, 14, 12, 14, idark(jade, 0.35));
    ell(8, 5, 3, 3, (x, y, d) => (d > 0.6 ? idark(jade, 0.2) : ilite(jade, 0.25)));
    line(5, 10, 10, 10, idark(jade, 0.5)); line(5, 12, 10, 12, idark(jade, 0.5)); line(7, 9, 7, 13, idark(jade, 0.5));
  } else if (k === 'st_atk') {
    // nắm đấm / lưỡi kiếm chéo
    line(3, 12, 12, 3, '#e2e8ee'); line(4, 12, 13, 3, '#9aa3ab'); line(3, 3, 12, 12, '#e2e8ee'); line(3, 4, 12, 13, '#9aa3ab');
    rect(2, 12, 4, 14, '#c9a040'); rect(11, 12, 13, 14, '#c9a040'); set(13, 2, '#ffffff'); set(2, 2, '#ffffff');
  } else if (k === 'st_def') {
    const c = '#5f86c0';
    for (let y = 2; y <= 13; y++) { const w = y < 9 ? 5 : 5 - (y - 8); rect(8 - w, y, 7 + w, y, y === 2 ? ilite(c, 0.4) : c); set(8 - w, y, ilite(c, 0.35)); set(7 + w, y, idark(c, 0.3)); }
    line(8, 3, 8, 12, '#d8b44a'); line(4, 6, 11, 6, '#d8b44a');
  } else if (k === 'st_hp') {
    const c = '#d63c3c';
    ell(5.5, 6, 3, 3, () => c); ell(10.5, 6, 3, 3, () => c);
    for (let y = 6; y <= 13; y++) { const w = Math.max(0, 6 - (y - 7)); rect(8 - w, y, 7 + w, y, c); }
    set(4, 5, '#ffb0b0'); set(5, 4, '#ffb0b0');
  } else if (k === 'st_crit') {
    const c = '#ffcf3d';
    line(8, 1, 8, 15, c); line(1, 8, 15, 8, c); line(3, 3, 13, 13, ilite(c, 0.3)); line(13, 3, 3, 13, ilite(c, 0.3));
    ell(8, 8, 2.5, 2.5, () => '#ffffff');
  } else if (k === 'st_dodge') {
    // lông vũ
    const c = '#7fd0c0';
    line(3, 14, 12, 2, idark(c, 0.4));
    for (let i = 0; i < 9; i++) { line(4 + i, 12 - i * 1.2, 7 + i, 13 - i * 1.2, i % 2 ? c : ilite(c, 0.3)); line(4 + i, 12 - i * 1.2, 3 + i, 9 - i * 1.2, i % 2 ? ilite(c, 0.2) : c); }
  } else if (k === 'cog') {
    const c = '#a8b0b8';
    ell(8, 8, 5.5, 5.5, (x, y, d) => (d < 0.18 ? null : d > 0.75 ? idark(c, 0.2) : c));
    for (const [x, y] of [[8, 1], [8, 15], [1, 8], [15, 8], [3, 3], [13, 13], [13, 3], [3, 13]]) rect(x - 1, y - 1, x, y, c);
  } else if (k === 'thap') {
    const c = '#b89060';
    for (let i = 0; i < 5; i++) { const y = 13 - i * 3; const w = 6 - i; rect(8 - w, y - 1, 7 + w, y, i % 2 ? c : idark(c, 0.2)); rect(8 - w - 1, y - 2, 7 + w + 1, y - 2, '#7a3a2a'); }
    rect(7, 0, 8, 1, '#ffcf3d');
  } else if (k === 'sat') {
    const c = '#d8d0c8';
    ell(8, 6.5, 5, 5, (x, y, d) => (d > 0.8 ? idark(c, 0.2) : c));
    rect(5, 11, 11, 13, c); rect(5, 6, 7, 8, '#a01818'); rect(9, 6, 11, 8, '#a01818'); set(8, 9, '#3a2a2a');
    for (const x of [6, 8, 10]) set(x, 13, '#3a2a2a');
  } else if (k === 'tam') {
    // âm dương
    ell(8, 8, 6.5, 6.5, (x, y) => (x < 8 ? '#f3ead8' : '#2a2238'));
    ell(8, 4.7, 3.2, 3.2, () => '#f3ead8'); ell(8, 11.3, 3.2, 3.2, () => '#2a2238');
    ell(8, 4.7, 1, 1, () => '#2a2238'); ell(8, 11.3, 1, 1, () => '#f3ead8');
  } else if (k.startsWith('sk_')) {
    drawSkill(k, o, { px, set, rect, line, ell });
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

export const PILL_COLORS = { hoi_xuan: '#c0392b', pha_canh: '#8e5bd0', dien_tho: '#d8a83c', tinh_tam: '#4f8fd6', ngung_than: '#3fae9a', bao_khi: '#e06a1c' };

/** Mã nhúng biểu tượng vào chữ (giao diện thay bằng ảnh, nơi khác bỏ qua) */
export const matIconOpts = (id, m) => ({ kind: id === 'tinh_thiet' ? 'thoi' : m.aff === 'ls' || m.aff === 'dodge' ? 'hach' : 'mat', q: Math.min(4, m.q), col: m.col });
export const iconToken = (o) => `[[i|${o.kind}|${o.q || 0}|${o.col || '-'}]]`;
export const itemToken = (it) => iconToken(itemIconOpts(it));
export const ICON_TOKEN_RE = /\[\[i\|(\w+)\|(\d)\|(#[0-9a-fA-F]{6}|-)\]\]/g;
export const stripIconTokens = (s) => String(s).replace(ICON_TOKEN_RE, '');
