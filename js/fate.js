// Giai đoạn 1 (bản 5): Thiên mệnh mỗi kiếp, Túc địch, cây Hồn lực vĩnh viễn.
import { REALMS, PLANES } from './data.js';

/** Cảnh giới tính trong giới đang ở (0 = cảnh giới đầu tiên của giới) */
const PP = (g) => g.P || g.s.draft;
const loc = (g) => g.P.realm - (PLANES[g.P.plane || 0].base || 0);
const lr = (g, i) => REALMS[(PLANES[PP(g).plane || 0].base || 0) + i].n;

// done(g): đã đạt. until: hạn tuổi (quá hạn là trượt). need(g): có được bốc ra không.
export const DESTINIES = [
  { id: 'truc_co', n: 'Thiếu niên đắc đạo', desc: (g) => `Lên ${lr(g, 2)} trước 40 tuổi`, hl: 15, until: 40, done: (g) => loc(g) >= 2 },
  { id: 'kim_dan', n: 'Kết đan thành tựu', desc: (g) => `Đạt ${lr(g, 3)} trước 120 tuổi`, hl: 30, until: 120, done: (g) => loc(g) >= 3 },
  { id: 'nguyen_anh', n: 'Nguyên thần xuất khiếu', desc: (g) => `Đạt ${lr(g, 4)}`, hl: 45, done: (g) => loc(g) >= 4, need: (g) => (g.s.bestRealm ?? 0) >= 2 },
  { id: 'hoa_than', n: 'Hóa thần nhập thánh', desc: (g) => `Đạt ${lr(g, 5)}`, hl: 70, done: (g) => loc(g) >= 5, need: (g) => (g.s.bestRealm ?? 0) >= 4 },
  { id: 'thien_kieu', n: 'Thiên kiêu đệ nhất', desc: () => 'Đứng đầu Bảng Thiên Kiêu', hl: 40, done: (g) => g.P.dao && g._rank === 1 },
  { id: 'thap', n: 'Leo tận mây xanh', desc: () => 'Vượt tầng 200 của tháp', hl: 30, done: (g) => g.towerBest() >= 200 },
  { id: 'khai_tong', n: 'Khai tông lập phái', desc: () => 'Lập một tông môn của riêng mình', hl: 40, done: (g) => !!g.P.flags.chuongMon },
  { id: 'dao_lu', n: 'Một đời một người', desc: () => 'Kết thành đạo lữ', hl: 20, done: (g) => g.known().some(({ r }) => r.tag === 'dao_lu') },
  { id: 'tri_ky', n: 'Bằng hữu bốn phương', desc: () => 'Có 3 người thân thiết (từ 50)', hl: 20, done: (g) => g.known().filter(({ r }) => r.v >= 50).length >= 3 },
  { id: 'tuc_dich', n: 'Nợ máu phải trả', desc: () => 'Hạ Túc địch trong trận quyết chiến', hl: 50, done: (g) => !!(g.P.nemesis && g.P.nemesis.won) },
  { id: 'truong_tho', n: 'Trường sinh bất lão', desc: () => 'Sống tới 400 tuổi', hl: 30, done: (g) => g.P.age >= 400, need: (g) => (g.s.bestRealm ?? 0) >= 3 },
  { id: 'danh_vong', n: 'Danh chấn thiên hạ', desc: () => 'Danh vọng đạt 80', hl: 30, done: (g) => g.P.fame >= 80 },
  { id: 'than_khi', n: 'Bảo vật hộ thân', desc: () => 'Mặc một món đồ Cực phẩm trở lên đã cường hóa +5', hl: 30, done: (g) => Object.values(g.P.eq || {}).some((it) => it && it.q >= 3 && (it.plus || 0) >= 5) },
  { id: 'phi_thang', n: 'Phá toái hư không', desc: (g) => `Phi thăng ${PLANES[PP(g).plane || 0].next || 'thượng giới'}`, hl: 150, done: (g) => !!g.P.ascended || g.P.flags.ascendedFrom !== undefined, need: (g) => (g.s.bestRealm ?? 0) >= 7 },
  { id: 'co_nhan', n: 'Nối lại duyên xưa', desc: () => 'Thân thiết lại (từ 50) với một người quen kiếp trước', hl: 30, done: (g) => g.known().some(({ r }) => r.cn && r.v >= 50), need: (g) => g.s.souls.some((b) => b.alive && g.s.rel[b.id] && g.s.rel[b.id].cn && g.s.rel[b.id].cn.v > 0) },
];
// Thiên mệnh kéo kỳ ngộ liên quan tới gần hơn, gặp người nhiều hơn
export const DESTINY_EV = { khai_tong: ['khai_tong'], dao_lu: ['dao_lu', 'song_tu', 'duyen_no'], thien_kieu: ['thien_kieu_chien', 'loi_dai'], danh_vong: ['cuu_nguoi', 'thien_kieu_chien', 'loi_dai'], co_nhan: ['co_nhan_gap_lai', 'duyen_no'] };
export const DESTINY_SOCIAL = new Set(['dao_lu', 'tri_ky', 'co_nhan']);
export const DESTINY_MAP = Object.fromEntries(DESTINIES.map((d) => [d.id, d]));

// Cây Hồn lực: mua bằng Hồn lực, giữ mãi qua mọi kiếp. cost: giá từng cấp.
export const PERKS = [
  { id: 'tu', n: 'Đạo tâm kiên cố', ic: '☯', per: 'Tu luyện +10%', cost: [40, 90, 180], fx: (l) => ({ gainMul: 1 + 0.1 * l }) },
  { id: 'chien', n: 'Sát phạt quyết đoán', ic: '⚔', per: 'Chiến đấu +8%', cost: [40, 90, 180], fx: (l) => ({ fightMul: 1 + 0.08 * l }) },
  { id: 'tho', n: 'Thọ nguyên sâu dày', ic: '⏳', per: 'Thọ nguyên +10%', cost: [30, 70, 150], fx: (l) => ({ lifeMul: 1 + 0.1 * l }) },
  { id: 'menh', n: 'Nhìn thấu thiên cơ', ic: '📜', per: 'Mỗi cấp bốc thêm 1 lá Thiên mệnh để chọn', cost: [60, 150], fx: () => ({}) },
  { id: 'nho', n: 'Ký ức tiền kiếp', ic: '◈', per: 'Nhập đạo được thêm 2 ngộ đạo điểm', cost: [30, 70], fx: () => ({}) },
  { id: 'dan', n: 'Túi đan tổ truyền', ic: '💊', per: 'Mỗi kiếp bắt đầu có thêm 2 Hồi Xuân Đan', cost: [20, 50], fx: () => ({}) },
  { id: 'tui', n: 'Càn khôn đại', ic: '🎒', per: 'Túi trữ vật +4 ô', cost: [30, 70], fx: () => ({}) },
  { id: 'tuc', n: 'Biết người biết ta', ic: '👁', per: 'Trận với Túc địch +10%, thưởng thắng Túc địch +50%', cost: [50], fx: () => ({}) },
];
export const PERK_MAP = Object.fromEntries(PERKS.map((p) => [p.id, p]));
export const perkLv = (s, id) => (s.perks && s.perks[id]) || 0;
/** Gộp hiệu ứng mọi Hồn lực đã mua thành một "thiên phú" ẩn */
export function perkFx(s) {
  const fx = {};
  for (const p of PERKS) {
    const l = perkLv(s, p.id);
    if (!l) continue;
    for (const [k, v] of Object.entries(p.fx(l))) fx[k] = (fx[k] || 1) * v;
  }
  return fx;
}
