// Trang bị: vũ khí, y phục, phụ kiện. Sinh ngẫu nhiên theo cảnh giới và phẩm.
import { REALMS } from './data.js';

export const SLOTS = { vu_khi: 'Vũ khí', ao: 'Y phục', phu_kien: 'Phụ kiện' };
export const QUALITY = [
  { n: 'Hạ phẩm', m: 1.0 },
  { n: 'Trung phẩm', m: 1.35 },
  { n: 'Thượng phẩm', m: 1.8 },
  { n: 'Cực phẩm', m: 2.5 },
];
const PREFIX = ['Thanh Phong', 'Lưu Hỏa', 'Hàn Thiết', 'Tử Điện', 'Bích Hải', 'Huyền Minh', 'Kinh Lôi', 'Tàn Dương', 'Vân Văn', 'Long Lân', 'Thu Thủy', 'Xích Viêm', 'Bạch Hồng', 'U Lan', 'Phá Quân', 'Trích Tinh'];
const NOUN = {
  kiem: 'Kiếm', dao: 'Đao', thuong: 'Thương', quat: 'Phiến',
  ao: ['Đạo Bào', 'Chiến Giáp', 'Pháp Y', 'Hộ Tâm Giáp'],
  phu_kien: ['Ngọc Bội', 'Giới Chỉ', 'Hộ Phù', 'Linh Châu'],
};
// thuộc tính đặc biệt của đồ Thượng phẩm trở lên
const AFFIX = [
  { k: 'ls', v: 0.08, t: 'Hút máu 8%' },
  { k: 'crit', v: 0.1, t: 'Bạo kích +10%' },
  { k: 'rf', v: 0.12, t: 'Phản chấn 12%' },
  { k: 'dodge', v: 0.08, t: 'Né tránh +8%' },
  { k: 'sp', v: 4, t: 'Thân pháp +4' },
];

/** Sinh một món. r: Rng, lv: cảnh giới, q: phẩm (0-3) hoặc null để gieo */
export function makeItem(r, id, lv, q = null, slot = null) {
  lv = Math.max(0, Math.min(REALMS.length - 1, lv));
  if (q === null) q = r.weighted([0, 1, 2, 3], (x) => [60, 28, 10, 2][x]);
  slot = slot || r.pick(['vu_khi', 'vu_khi', 'ao', 'phu_kien']);
  const pow = REALMS[lv].pow;
  const m = QUALITY[q].m * r.range(0.9, 1.1);
  const it = { id, slot, q, lv, n: '', atk: 0, def: 0, hp: 0, affix: [] };
  const pre = r.pick(PREFIX);
  if (slot === 'vu_khi') {
    it.wt = r.pick(['kiem', 'dao', 'thuong', 'quat']);
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
  const nAff = q >= 3 ? 2 : q >= 2 ? 1 : 0;
  const pool = AFFIX.slice();
  for (let i = 0; i < nAff; i++) {
    const a = pool.splice(r.int(0, pool.length - 1), 1)[0];
    it.affix.push(a.k);
    it[a.k] = (it[a.k] || 0) + a.v;
  }
  it.val = Math.round(20 * (1 + lv * 1.5) * QUALITY[q].m * QUALITY[q].m);
  return it;
}

/** Tổng chỉ số từ các món đang mặc */
export function gearStats(eq) {
  const g = { atk: 0, def: 0, hp: 0, crit: 0, dodge: 0, ls: 0, rf: 0, sp: 0 };
  for (const k in eq) {
    const it = eq[k];
    if (!it) continue;
    for (const s in g) g[s] += it[s] || 0;
  }
  return g;
}

/** Một dòng mô tả chỉ số */
export function itemLine(it) {
  const p = [];
  if (it.atk) p.push(`Công +${it.atk}`);
  if (it.def) p.push(`Thủ +${it.def}`);
  if (it.hp) p.push(`Sinh lực +${it.hp}`);
  for (const k of it.affix || []) {
    const a = AFFIX.find((x) => x.k === k);
    if (a) p.push(a.t);
  }
  return p.join(' · ');
}

/** Điểm ước lượng sức mạnh để so sánh hai món cùng ô */
export function itemScore(it) {
  if (!it) return 0;
  return (it.atk || 0) * 3 + (it.def || 0) * 4 + (it.hp || 0) * 0.5 + ((it.crit || 0) + (it.ls || 0) + (it.rf || 0) + (it.dodge || 0)) * 40 * (1 + it.lv * 1.5) + (it.sp || 0) * 3;
}
