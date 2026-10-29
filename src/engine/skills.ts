// Dữ liệu võ kỹ / thần thông của người chơi và chiêu thức của quái.

import type { PathId } from './data';

export type SkillId =
  | 'kiem_pha_thien'
  | 'kiem_phan_quang'
  | 'kiem_y'
  | 'kiem_van_kiem'
  | 'the_ba_vuong'
  | 'the_kim_cuong'
  | 'the_huyet_khi'
  | 'the_thien_cuong'
  | 'phap_liet_hoa'
  | 'phap_bang_phong'
  | 'phap_chuong_tam_loi'
  | 'phap_ngu_loi'
  | 'chung_lang_ba'
  | 'chung_thanh_tam'
  | 'chung_hap_tinh'
  | 'm_hu_trang'
  | 'm_doc_nha'
  | 'm_huyet_hap'
  | 'm_thiet_bich'
  | 'm_yeu_hoa'
  | 'm_ma_dao'
  | 'm_pha_giap'
  | 'm_loi_bao'
  | 'm_cau_hon'
  | 'm_kiem_khi'
  | 'm_hon_don'
  | 'm_phe_hu'
  | 'n_phi_kiem'
  | 'n_ho_lo'
  | 'n_linh_chung'
  | 'n_tran_an'
  | 'n_hon_phan'
  | 'n_phong_quat';

/**
 * Hiệu ứng của một chiêu ở cấp 1. Các con số (trừ thời gian, số đòn, hồi chiêu) tăng
 * theo cấp: ×(1 + SKILL_LEVEL_POWER × (cấp − 1)); xác suất choáng cộng SKILL_LEVEL_CHANCE mỗi cấp.
 */
export interface SkillEffect {
  /** Hệ số sát thương mỗi đòn so với đòn thường */
  dmg?: number;
  hits?: number;
  /** Cộng thêm xác suất bạo kích cho chiêu này */
  crit?: number;
  /** Phần sát thương gây ra được hồi thành khí huyết */
  lifesteal?: number;
  /** Xác suất làm đối thủ mất lượt kế tiếp */
  stun?: number;
  /** Thiêu đốt / trúng độc: mỗi lượt của đối thủ mất (công người dùng × pct) */
  burn?: { pct: number; turns: number };
  /** Giảm tốc độ đối thủ */
  slow?: { pct: number; turns: number };
  /** Giảm thủ đối thủ */
  armorBreak?: { pct: number; turns: number };
  /** Tăng công bản thân */
  atkBuff?: { pct: number; turns: number };
  /** Tăng né tránh bản thân */
  dodge?: { pct: number; turns: number };
  /** Khiên = % khí huyết tối đa */
  shield?: number;
  /** Hồi % khí huyết tối đa (chỉ dùng khi còn dưới 60%) */
  heal?: number;
  /** Giải hiệu ứng xấu và miễn nhiễm trong 2 lượt (chỉ dùng khi đang dính hiệu ứng xấu) */
  cleanse?: boolean;
}

export type SkillSource =
  | { kind: 'path' } // học ngay khi chọn hướng tu
  | { kind: 'boss'; floor: number } // thủ lĩnh tầng này rơi bí tịch
  | { kind: 'shop'; price: number; realm: number } // Tàng Kinh Các
  | { kind: 'monster' }
  | { kind: 'natal' }; // chiêu của bản mệnh pháp bảo

export interface SkillDef {
  id: SkillId;
  name: string;
  /** null = ai cũng học được */
  path: PathId | null;
  /** Số lượt của bản thân phải chờ trước khi dùng lại */
  cooldown: number;
  effect: SkillEffect;
  source: SkillSource;
}

export const SKILL_LEVEL_POWER = 0.1;
export const SKILL_LEVEL_CHANCE = 0.02;
export const SKILL_MAX_LEVEL = 10;
/** Dùng hồi máu khi khí huyết dưới mức này */
export const HEAL_THRESHOLD = 0.6;
export const CLEANSE_IMMUNE_TURNS = 2;

/** Số ô võ kỹ theo đại cảnh giới (chỉ số REALMS): Trúc Cơ 1, Kim Đan 2, Nguyên Anh trở lên 3 */
export function skillSlots(realm: number): number {
  return Math.max(0, Math.min(3, realm));
}

/** Chi phí nâng võ kỹ từ cấp n lên n+1 */
export function skillCost(level: number, realm: number) {
  return { fragments: 2 * level, stones: 80 * level * 2 ** realm };
}

/** Thủ lĩnh tầng cao không còn bí tịch mới thì rơi gói tàn quyển */
export const BOSS_FRAGMENT_BUNDLES: Record<number, number> = { 30: 10, 35: 15, 40: 20 };

const S = (def: SkillDef) => def;

export const SKILLS: Record<SkillId, SkillDef> = {
  // --- Kiếm Tu ---
  kiem_pha_thien: S({ id: 'kiem_pha_thien', name: 'Phá Thiên Nhất Kiếm', path: 'kiem', cooldown: 3, effect: { dmg: 2.2 }, source: { kind: 'path' } }),
  kiem_phan_quang: S({ id: 'kiem_phan_quang', name: 'Kiếm Ảnh Phân Quang', path: 'kiem', cooldown: 4, effect: { dmg: 0.75, hits: 3 }, source: { kind: 'boss', floor: 5 } }),
  kiem_y: S({ id: 'kiem_y', name: 'Kiếm Ý Ngưng Tụ', path: 'kiem', cooldown: 6, effect: { atkBuff: { pct: 0.4, turns: 3 } }, source: { kind: 'boss', floor: 15 } }),
  kiem_van_kiem: S({ id: 'kiem_van_kiem', name: 'Vạn Kiếm Quy Tông', path: 'kiem', cooldown: 6, effect: { dmg: 0.6, hits: 5, crit: 0.2 }, source: { kind: 'boss', floor: 25 } }),
  // --- Thể Tu ---
  the_ba_vuong: S({ id: 'the_ba_vuong', name: 'Bá Vương Quyền', path: 'the', cooldown: 3, effect: { dmg: 1.6, stun: 0.3 }, source: { kind: 'path' } }),
  the_kim_cuong: S({ id: 'the_kim_cuong', name: 'Kim Cương Hộ Thể', path: 'the', cooldown: 6, effect: { shield: 0.3 }, source: { kind: 'boss', floor: 5 } }),
  the_huyet_khi: S({ id: 'the_huyet_khi', name: 'Huyết Khí Phục Hồi', path: 'the', cooldown: 5, effect: { heal: 0.2 }, source: { kind: 'boss', floor: 15 } }),
  the_thien_cuong: S({ id: 'the_thien_cuong', name: 'Thiên Cương Chấn', path: 'the', cooldown: 5, effect: { dmg: 1.8, armorBreak: { pct: 0.4, turns: 3 } }, source: { kind: 'boss', floor: 25 } }),
  // --- Pháp Tu ---
  phap_liet_hoa: S({ id: 'phap_liet_hoa', name: 'Liệt Hỏa Phần Thiên', path: 'phap', cooldown: 4, effect: { dmg: 1.7, burn: { pct: 0.35, turns: 3 } }, source: { kind: 'path' } }),
  phap_bang_phong: S({ id: 'phap_bang_phong', name: 'Băng Phong Thuật', path: 'phap', cooldown: 4, effect: { dmg: 1.2, slow: { pct: 0.35, turns: 3 } }, source: { kind: 'boss', floor: 5 } }),
  phap_chuong_tam_loi: S({ id: 'phap_chuong_tam_loi', name: 'Chưởng Tâm Lôi', path: 'phap', cooldown: 4, effect: { dmg: 2.4, crit: 0.25 }, source: { kind: 'boss', floor: 15 } }),
  phap_ngu_loi: S({ id: 'phap_ngu_loi', name: 'Ngũ Lôi Oanh Đỉnh', path: 'phap', cooldown: 6, effect: { dmg: 0.9, hits: 3, stun: 0.25 }, source: { kind: 'boss', floor: 25 } }),
  // --- Chung ---
  chung_lang_ba: S({ id: 'chung_lang_ba', name: 'Lăng Ba Vi Bộ', path: null, cooldown: 6, effect: { dodge: { pct: 0.3, turns: 3 } }, source: { kind: 'shop', price: 400, realm: 1 } }),
  chung_thanh_tam: S({ id: 'chung_thanh_tam', name: 'Thanh Tâm Quyết', path: null, cooldown: 5, effect: { cleanse: true }, source: { kind: 'boss', floor: 10 } }),
  chung_hap_tinh: S({ id: 'chung_hap_tinh', name: 'Hấp Tinh Đại Pháp', path: null, cooldown: 4, effect: { dmg: 1.4, lifesteal: 0.5 }, source: { kind: 'boss', floor: 20 } }),
  // --- Chiêu của quái ---
  m_hu_trang: S({ id: 'm_hu_trang', name: 'Hú Trăng', path: null, cooldown: 5, effect: { atkBuff: { pct: 0.35, turns: 3 } }, source: { kind: 'monster' } }),
  m_doc_nha: S({ id: 'm_doc_nha', name: 'Độc Nha', path: null, cooldown: 3, effect: { dmg: 1.2, burn: { pct: 0.25, turns: 3 } }, source: { kind: 'monster' } }),
  m_huyet_hap: S({ id: 'm_huyet_hap', name: 'Huyết Hấp', path: null, cooldown: 4, effect: { dmg: 1.3, lifesteal: 0.6 }, source: { kind: 'monster' } }),
  m_thiet_bich: S({ id: 'm_thiet_bich', name: 'Thiết Bích', path: null, cooldown: 6, effect: { shield: 0.18 }, source: { kind: 'monster' } }),
  m_yeu_hoa: S({ id: 'm_yeu_hoa', name: 'Yêu Hỏa', path: null, cooldown: 4, effect: { dmg: 1.6, burn: { pct: 0.3, turns: 2 } }, source: { kind: 'monster' } }),
  m_ma_dao: S({ id: 'm_ma_dao', name: 'Ma Đao Trảm', path: null, cooldown: 3, effect: { dmg: 2 }, source: { kind: 'monster' } }),
  m_pha_giap: S({ id: 'm_pha_giap', name: 'Phá Giáp Trảo', path: null, cooldown: 4, effect: { dmg: 1.2, armorBreak: { pct: 0.35, turns: 3 } }, source: { kind: 'monster' } }),
  m_loi_bao: S({ id: 'm_loi_bao', name: 'Lôi Bạo', path: null, cooldown: 4, effect: { dmg: 1.5, stun: 0.35 }, source: { kind: 'monster' } }),
  m_cau_hon: S({ id: 'm_cau_hon', name: 'Câu Hồn', path: null, cooldown: 4, effect: { dmg: 1.2, slow: { pct: 0.35, turns: 3 } }, source: { kind: 'monster' } }),
  m_kiem_khi: S({ id: 'm_kiem_khi', name: 'Kiếm Khí Tung Hoành', path: null, cooldown: 4, effect: { dmg: 0.8, hits: 3 }, source: { kind: 'monster' } }),
  m_hon_don: S({ id: 'm_hon_don', name: 'Hỗn Độn Chi Nhãn', path: null, cooldown: 4, effect: { dmg: 1.8, stun: 0.3 }, source: { kind: 'monster' } }),
  m_phe_hu: S({ id: 'm_phe_hu', name: 'Phệ Hư', path: null, cooldown: 4, effect: { dmg: 1.3, lifesteal: 0.5 }, source: { kind: 'monster' } }),
  // --- Chiêu của pháp bảo ---
  n_phi_kiem: S({ id: 'n_phi_kiem', name: 'Phi Kiếm Trảm', path: null, cooldown: 4, effect: { dmg: 1.4, crit: 0.12 }, source: { kind: 'natal' } }),
  n_ho_lo: S({ id: 'n_ho_lo', name: 'Hồ Lô Thu Hồn', path: null, cooldown: 4, effect: { dmg: 1, lifesteal: 0.6 }, source: { kind: 'natal' } }),
  n_tran_an: S({ id: 'n_tran_an', name: 'Trấn Sơn Áp Đỉnh', path: null, cooldown: 4, effect: { dmg: 1.5, armorBreak: { pct: 0.25, turns: 3 } }, source: { kind: 'natal' } }),
  n_hon_phan: S({ id: 'n_hon_phan', name: 'Vạn Hồn Phệ Thể', path: null, cooldown: 4, effect: { dmg: 0.9, burn: { pct: 0.35, turns: 3 } }, source: { kind: 'natal' } }),
  n_phong_quat: S({ id: 'n_phong_quat', name: 'Thanh Phong Kích', path: null, cooldown: 5, effect: { dmg: 1, dodge: { pct: 0.3, turns: 2 }, atkBuff: { pct: 0.2, turns: 2 } }, source: { kind: 'natal' } }),
  n_linh_chung: S({ id: 'n_linh_chung', name: 'Chung Âm Chấn Hồn', path: null, cooldown: 5, effect: { dmg: 1, stun: 0.35, slow: { pct: 0.25, turns: 2 } }, source: { kind: 'natal' } }),
};

/** Võ kỹ người chơi có thể học (không gồm chiêu của quái) */
export const PLAYER_SKILLS: SkillDef[] = Object.values(SKILLS).filter((s) => s.source.kind !== 'monster' && s.source.kind !== 'natal');

/**
 * Chiêu thức của quái theo tên. Bốn tầng đầu không có chiêu để người mới làm quen;
 * thủ lĩnh có 2 chiêu.
 */
export const ENEMY_SKILLS: Record<string, SkillId[]> = {
  'Hắc Hùng': [],
  'Thanh Lang Đầu Lĩnh': [],
  'Lang Vương': ['m_hu_trang'],
  'Huyết Bức': ['m_huyet_hap'],
  'Thi Khôi': ['m_pha_giap'],
  'Huyết Mãng': ['m_doc_nha'],
  'Huyết Thi': ['m_huyet_hap'],
  'Huyết Mãng Vương': ['m_doc_nha', 'm_huyet_hap'],
  'Hỏa Hồ': ['m_yeu_hoa'],
  'Thiết Bối Viên': ['m_thiet_bich'],
  'Lôi Ưng': ['m_loi_bao'],
  'Tam Vĩ Yêu Hồ': ['m_yeu_hoa'],
  'Yêu Cốc Chi Chủ': ['m_yeu_hoa', 'm_hu_trang'],
  'Ma Binh': ['m_ma_dao'],
  'Oán Hồn': ['m_cau_hon'],
  'Cốt Ma': ['m_pha_giap'],
  'Ma Tướng': ['m_ma_dao'],
  'Cổ Ma Thống Lĩnh': ['m_ma_dao', 'm_pha_giap'],
  'Hải Yêu': ['m_doc_nha'],
  'Phong Bạo Linh': ['m_cau_hon'],
  'Lôi Giao': ['m_loi_bao'],
  'Lôi Linh Cự Thú': ['m_thiet_bich'],
  'Lôi Giao Vương': ['m_loi_bao', 'm_thiet_bich'],
  'U Hồn': ['m_cau_hon'],
  'Minh Xà': ['m_doc_nha'],
  'Quỷ Tướng': ['m_pha_giap'],
  'Câu Hồn Sứ': ['m_cau_hon'],
  'U Minh Quỷ Đế': ['m_cau_hon', 'm_huyet_hap'],
  'Khôi Lỗi Hộ Pháp': ['m_thiet_bich'],
  'Kiếm Linh': ['m_kiem_khi'],
  'Tiên Phủ Thủ Vệ': ['m_thiet_bich'],
  'Đan Lô Khí Linh': ['m_yeu_hoa'],
  'Tiên Phủ Khí Linh': ['m_kiem_khi', 'm_thiet_bich'],
  'Hư Không Thú': ['m_phe_hu'],
  'Hỗn Độn Ma': ['m_hon_don'],
  'Thiên Ngoại Tà Ma': ['m_hon_don'],
  'Phệ Tinh Trùng': ['m_phe_hu'],
  'Hỗn Độn Cổ Thần': ['m_hon_don', 'm_phe_hu'],
};

/** Cấp chiêu của quái theo tầng */
export function enemySkillLevel(floor: number): number {
  return 1 + Math.floor(floor / 8);
}

/** Mô tả hiệu ứng ở một cấp, dùng cho giao diện */
export function describeSkill(def: SkillDef, level: number): string {
  const pw = 1 + SKILL_LEVEL_POWER * (level - 1);
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const e = def.effect;
  const parts: string[] = [];
  if (e.dmg) parts.push(`${e.hits && e.hits > 1 ? `${e.hits} đòn × ` : ''}${pct(e.dmg * pw)} sát thương`);
  if (e.crit) parts.push(`+${pct(e.crit)} bạo kích`);
  if (e.lifesteal) parts.push(`hút ${pct(e.lifesteal * pw)} máu`);
  if (e.stun) parts.push(`${pct(e.stun + SKILL_LEVEL_CHANCE * (level - 1))} gây choáng`);
  if (e.burn) parts.push(`thiêu đốt ${pct(e.burn.pct * pw)} công × ${e.burn.turns} lượt`);
  if (e.slow) parts.push(`giảm ${pct(e.slow.pct * pw)} tốc độ ${e.slow.turns} lượt`);
  if (e.armorBreak) parts.push(`phá ${pct(e.armorBreak.pct * pw)} thủ ${e.armorBreak.turns} lượt`);
  if (e.atkBuff) parts.push(`+${pct(e.atkBuff.pct * pw)} công ${e.atkBuff.turns} lượt`);
  if (e.dodge) parts.push(`+${pct(e.dodge.pct * pw)} né tránh ${e.dodge.turns} lượt`);
  if (e.shield) parts.push(`khiên ${pct(e.shield * pw)} khí huyết`);
  if (e.heal) parts.push(`hồi ${pct(e.heal * pw)} khí huyết khi dưới ${pct(HEAL_THRESHOLD)}`);
  if (e.cleanse) parts.push(`giải hiệu ứng xấu, miễn nhiễm ${CLEANSE_IMMUNE_TURNS} lượt`);
  parts.push(`hồi chiêu ${def.cooldown} lượt`);
  return parts.join(' · ');
}
