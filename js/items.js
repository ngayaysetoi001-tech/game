// Trang bị: vũ khí, y phục, phụ kiện. Sinh ngẫu nhiên theo cảnh giới và phẩm.
import { SOCKETS } from './gear2.js';
import { REALMS, planeOf } from './data.js';

export const SLOTS = { vu_khi: 'Vũ khí', ao: 'Y phục', phu_kien: 'Phụ kiện' };
export const QUALITY = [
  { n: 'Hạ phẩm', m: 1.0 },
  { n: 'Trung phẩm', m: 1.35 },
  { n: 'Thượng phẩm', m: 1.8 },
  { n: 'Cực phẩm', m: 2.5 },
  { n: 'Thần thoại', m: 3.6 },
];
// tên riêng cho đồ Thần thoại
const MYTH_PREFIX = ['Hồng Mông', 'Thái Sơ', 'Cửu U', 'Diệt Thế', 'Chư Thiên', 'Thái Cổ', 'Hỗn Nguyên', 'Vạn Kiếp'];
const PREFIX = ['Thanh Phong', 'Lưu Hỏa', 'Hàn Thiết', 'Tử Điện', 'Bích Hải', 'Huyền Minh', 'Kinh Lôi', 'Tàn Dương', 'Vân Văn', 'Long Lân', 'Thu Thủy', 'Xích Viêm', 'Bạch Hồng', 'U Lan', 'Phá Quân', 'Trích Tinh'];
let wepBias = null;
/** Loại binh khí ưu tiên khi đồ rơi (theo con đường của người chơi) */
export function setWepBias(w) { wepBias = w; }
const WEP_NOUNS = ['Quyền Sáo', 'Pháp Ấn', 'Kiếm', 'Đao', 'Thương', 'Phiến'];
/** Đổi tên binh khí sang loại khác (bỏ danh từ cũ ở cuối tên) */
export function wepName(n, wt) {
  let base = n;
  for (const w of WEP_NOUNS) if (base.endsWith(' ' + w)) { base = base.slice(0, -w.length - 1); break; }
  return `${base} ${NOUN[wt]}`;
}
const NOUN = {
  kiem: 'Kiếm', quyen: 'Quyền Sáo', phap: 'Pháp Ấn',
  ao: ['Đạo Bào', 'Chiến Giáp', 'Pháp Y', 'Hộ Tâm Giáp'],
  phu_kien: ['Ngọc Bội', 'Giới Chỉ', 'Hộ Phù', 'Linh Châu'],
};
// thuộc tính đặc biệt của đồ Thượng phẩm trở lên
export const AFFIX = [
  { k: 'ls', v: 0.08, t: 'Hút máu 8%' },
  { k: 'crit', v: 0.1, t: 'Bạo kích +10%' },
  { k: 'rf', v: 0.12, t: 'Phản chấn 12%' },
  { k: 'dodge', v: 0.08, t: 'Né tránh +8%' },
  { k: 'sp', v: 4, t: 'Thân pháp +4' },
];

// ---------- Thần thông: dòng chỉ đồ Thần thoại mới có ----------
// gear: chỉ số trong trận (cộng vào gearStats), fx: hiệu ứng ngoài trận (dùng chung hệ với thể chất)
export const THAN_THONG = {
  vu_khi: [
    { id: 'sat_phat', n: 'Sát Phạt', t: 'Mỗi trận thắng được tu vi bằng 3 năm tu luyện.', fx: { winTuvi: 3 } },
    { id: 'pha_thien', n: 'Phá Thiên', t: 'Xuyên 50% phòng thủ của địch.', gear: { pierce: 0.5 } },
    { id: 'lien_hoan', n: 'Liên Hoàn', t: '25% ra thêm một đòn sau mỗi chiêu.', gear: { combo: 0.25 } },
    { id: 'huyet_te', n: 'Huyết Tế', t: 'Hút máu 20%.', gear: { ls: 0.2 } },
    { id: 'doan_menh', n: 'Đoạn Mệnh', t: 'Địch dưới 30% sinh lực thì sát thương x1,8.', gear: { execute: 1.8 } },
    { id: 'tien_phat', n: 'Tiên Phát Chế Nhân', t: 'Luôn ra tay trước, đòn đầu tiên chắc chắn bạo kích.', gear: { first: true } },
    { id: 'kinh_loi', n: 'Kinh Lôi', t: 'Mỗi đòn trúng có 15% làm địch choáng.', gear: { stunHit: 0.15 } },
    { id: 'tuyet_sat', n: 'Tuyệt Sát', t: 'Bạo kích +10%, sát thương bạo kích x2,5 thay vì x1,7.', gear: { crit: 0.1, critDmg: 2.5 } },
    { id: 'thon_linh', n: 'Thôn Linh', t: 'Mỗi đòn trúng nuốt 10 linh lực của địch về mình.', gear: { mpDrain: 10 } },
    { id: 'ma_than', n: 'Ma Thần Phụ Thể', t: 'Công +40%, nhưng chịu đòn +15%.', gear: { atkPct: 0.4, takenPct: 0.15 } },
  ],
  ao: [
    { id: 'ho_menh', n: 'Hộ Mệnh', t: 'Mỗi kiếp chết thay một lần, sống lại với nửa sinh lực.', fx: { deathSave: true } },
    { id: 'bat_hoai', n: 'Bất Hoại', t: 'Mọi sát thương ngoài trận -25%.', fx: { hurtMul: 0.75 } },
    { id: 'van_phap', n: 'Vạn Pháp Bất Xâm', t: 'Miễn choáng, đóng băng, thiêu đốt, trúng độc, phá giáp.', gear: { immune: true } },
    { id: 'truong_sinh', n: 'Trường Sinh', t: 'Thọ nguyên +15%.', fx: { lifeMul: 1.15 } },
    { id: 'bat_tu', n: 'Bất Tử Thân', t: 'Mỗi trận một lần, gục xuống thì đứng dậy với 30% sinh lực.', gear: { lastStand: true } },
    { id: 'huyen_quang', n: 'Huyền Quang Hộ Thể', t: 'Vào trận đã có khiên bằng 30% sinh lực.', gear: { startShield: 0.3 } },
    { id: 'phan_thien', n: 'Phản Thiên', t: 'Phản lại 30% sát thương nhận vào.', gear: { rf: 0.3 } },
    { id: 'kim_cuong', n: 'Kim Cương Bất Diệt', t: 'Giảm 25% mọi sát thương nhận trong trận.', gear: { dmgRed: 0.25 } },
    { id: 'sinh_sinh', n: 'Sinh Sinh Bất Tức', t: 'Mỗi lượt hồi 6% sinh lực, ngoài trận hồi gấp đôi.', gear: { regenTurn: 0.06 }, fx: { regenMul: 2 } },
    { id: 'an_than', n: 'Ẩn Thân', t: 'Né tránh +25%, bỏ chạy dễ thoát hơn 30%.', gear: { dodge: 0.25 }, fx: { flee: 0.3 } },
  ],
  phu_kien: [
    { id: 'ngo_dao', n: 'Ngộ Đạo', t: 'Tu luyện +25%.', fx: { gainMul: 1.25 } },
    { id: 'thien_co', n: 'Thiên Cơ', t: 'Đột phá +8%.', fx: { brk: 0.08 } },
    { id: 'khi_van', n: 'Khí Vận Hộ Thân', t: 'Kỳ ngộ xuất hiện nhiều hơn 30%.', fx: { eventRate: 1.3 } },
    { id: 'tu_linh', n: 'Tụ Linh', t: 'Tu luyện hiệu quả gấp rưỡi.', fx: { closedMul: 1.5 } },
    { id: 'chieu_tai', n: 'Chiêu Tài', t: 'Mưu sinh kiếm gấp đôi.', fx: { moneyMul: 2 } },
    { id: 'van_duyen', n: 'Vạn Duyên', t: 'Thân thiết tăng nhanh 50%.', fx: { relMul: 1.5 } },
    { id: 'duoc_vuong', n: 'Dược Vương', t: 'Đan dược hiệu quả gấp đôi.', fx: { pillMul: 2 } },
    { id: 'linh_tuyen', n: 'Linh Tuyền', t: 'Linh lực trong trận hồi gấp đôi.', gear: { mpRegen: 12 } },
    { id: 'thien_nhan', n: 'Thiên Nhãn', t: 'Nhìn thấu tiền kiếp người khác, bạo kích +10%.', gear: { crit: 0.1 }, fx: { seePast: true } },
    { id: 'nghich_thien', n: 'Nghịch Thiên', t: 'Từ Kim Đan trở đi, đột phá +12%.', fx: { brkLate: 0.12 } },
    { id: 'tam_ma_bat_sinh', n: 'Tâm Ma Bất Sinh', t: 'Tâm ma không bao giờ tìm đến.', fx: { evW: { tam_ma: 0 } } },
    { id: 'phong_than', n: 'Phong Thần', t: 'Hồi sinh lực ngoài trận gấp ba, thọ +5%.', fx: { regenMul: 3, lifeMul: 1.05 } },
  ],
};
export const TT_MAP = Object.fromEntries(Object.values(THAN_THONG).flat().map((t) => [t.id, t]));

/**
 * Gieo phẩm cho đồ rơi. loot: hệ số thu hoạch (vùng càng khó càng dễ ra đồ tốt),
 * myth: tỉ lệ ra Thần thoại. Đồ Thần thoại chỉ rơi ở vùng lịch luyện từ Khó trở lên nên mặc định 0.
 */
export function rollQuality(r, loot = 1, myth = 0) {
  if (myth > 0 && r.chance(myth)) return 4;
  const w = [60, 28 * loot, 9.6 * loot ** 1.5, 2 * loot ** 2];
  return r.weighted([0, 1, 2, 3], (x) => w[x]);
}
/** Hệ số cường hóa: mỗi cấp +8% công, thủ, sinh lực */
export const plusMul = (it) => 1 + 0.15 * ((it && it.plus) || 0);
/** Bản 5.5: sinh lực của đồ ×3 cho khớp máu nền mới */
export const HP_MUL = 3;
export const PLUS_MAX = 10;
/** Tên hiển thị kèm cấp cường hóa */
export const itemName = (it) => (it.plus ? `${it.n} +${it.plus}` : it.n);
/** Giá bán lại theo cảnh giới, phẩm, cường hóa */
export const itemVal = (it) => Math.round(20 * (1 + it.lv * 1.5) * QUALITY[it.q].m * QUALITY[it.q].m * (1 + 0.15 * (it.plus || 0)));

/** Sinh một món. r: Rng, lv: cảnh giới, q: phẩm (0 Hạ - 4 Thần thoại) hoặc null để gieo */
export function makeItem(r, id, lv, q = null, slot = null) {
  lv = Math.max(0, Math.min(REALMS.length - 1, lv));
  if (q === null) q = rollQuality(r);
  slot = slot || r.pick(['vu_khi', 'vu_khi', 'ao', 'phu_kien']);
  const pow = REALMS[lv].pow;
  const m = QUALITY[q].m * r.range(0.9, 1.1);
  const it = { id, slot, q, lv, n: '', atk: 0, def: 0, hp: 0, affix: [], sock: Array(SOCKETS[q] || 0).fill(null) };
  const pre = q >= 4 ? r.pick(MYTH_PREFIX) : r.pick(PREFIX);
  if (slot === 'vu_khi') {
    // binh khí rơi ra 70% đúng loại của con đường đang đi
    it.wt = wepBias && r.chance(0.7) ? wepBias : r.pick(['kiem', 'quyen', 'phap']);
    it.n = `${pre} ${NOUN[it.wt]}`;
    it.atk = Math.round(3 * pow * m);
  } else if (slot === 'ao') {
    it.n = `${pre} ${r.pick(NOUN.ao)}`;
    it.def = Math.round(1.6 * pow * m);
    it.hp = Math.round(12 * pow * m);
  } else {
    it.n = `${pre} ${r.pick(NOUN.phu_kien)}`;
    it.hp = Math.round(8 * pow * m);
    it.atk = Math.round(1 * pow * m);
  }
  const nAff = q >= 4 ? 3 : q >= 3 ? 2 : q >= 2 ? 1 : 0;
  const pool = AFFIX.slice();
  for (let i = 0; i < nAff; i++) {
    const a = pool.splice(r.int(0, pool.length - 1), 1)[0];
    it.affix.push(a.k);
    it[a.k] = (it[a.k] || 0) + a.v;
  }
  if (q >= 4) it.tt = r.pick(THAN_THONG[slot]).id;
  it.val = itemVal(it);
  return it;
}

/** Tổng chỉ số từ các món đang mặc */
/** Thần khí kén chủ: đồ Thần thoại cao cảnh giới hơn chủ thì bị phong ấn */
// đồ không phân cảnh giới nữa: không còn phong ấn, áp chế
/** Thần khí mang từ kiếp trước: phong ấn tới khi tu lại tới cảnh giới cũ */
export const isSealed = (it, realm) => !!(it && it.sealTo !== undefined && realm !== undefined && realm < it.sealTo);
/** Đồ hạ giới đang bị áp chế ở giới trên */
export const isSuppressed = () => false;

export function gearStats(eq, realm) {
  const g = { atk: 0, def: 0, hp: 0, crit: 0, dodge: 0, ls: 0, rf: 0, sp: 0 };
  const seen = new Set();
  for (const k in eq) {
    const it = eq[k];
    if (!it) continue;
    const sealed = isSealed(it, realm);
    // đồ hạ giới mang lên giới trên bị pháp tắc áp chế, chỉ còn 20% (dòng % còn một nửa) cho tới khi linh hóa
    const low = realm !== undefined && planeOf(it.lv) < planeOf(realm);
    const pm = plusMul(it) * (low ? 0.2 : 1);
    if (sealed) {
      // bị áp chế: công, thủ, sinh lực ép về cảnh giới của chủ rồi còn một nửa; dòng % còn một nửa
      const k2 = 0.5 * pm * REALMS[Math.max(0, realm)].pow / REALMS[it.lv].pow;
      for (const s in g) g[s] += (it[s] || 0) * (s === 'atk' || s === 'def' || s === 'hp' ? k2 : 0.5) * (s === 'hp' ? HP_MUL : 1);
      continue;
    }
    for (const s in g) g[s] += (it[s] || 0) * (s === 'atk' || s === 'def' || s === 'hp' ? pm : low ? 0.5 : 1) * (s === 'hp' ? HP_MUL : 1);
    // thần thông trùng nhau chỉ tính một lần
    const tt = it.tt && TT_MAP[it.tt];
    if (tt && tt.gear && !seen.has(tt.id)) {
      seen.add(tt.id);
      for (const s in tt.gear) g[s] = typeof tt.gear[s] === 'number' ? (g[s] || 0) + tt.gear[s] : tt.gear[s];
    }
  }
  return g;
}

/** Một dòng mô tả chỉ số */
export function itemLine(it) {
  const p = [];
  const pm = plusMul(it);
  if (it.atk) p.push(`Công +${Math.round(it.atk * pm)}`);
  if (it.def) p.push(`Thủ +${Math.round(it.def * pm)}`);
  if (it.hp) p.push(`Sinh lực +${Math.round(it.hp * pm * HP_MUL)}`);
  for (const k of it.affix || []) {
    const a = AFFIX.find((x) => x.k === k);
    if (a) p.push(a.t);
  }
  return p.join(' · ');
}

/** Điểm ước lượng sức mạnh để so sánh hai món cùng ô */
export function itemScore(it) {
  if (!it) return 0;
  const pm = plusMul(it);
  return ((it.atk || 0) * 3 + (it.def || 0) * 4 + (it.hp || 0) * 0.5) * pm + ((it.crit || 0) + (it.ls || 0) + (it.rf || 0) + (it.dodge || 0)) * 40 * (1 + it.lv * 1.5) + (it.sp || 0) * 3;
}
