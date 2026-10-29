// Pháp bảo: bản mệnh pháp bảo lớn lên cùng nhân vật; từ Hóa Thần mở thêm ô pháp bảo phụ. Luyện hóa trang bị thừa để lên cấp.

import type { Mods } from './gear';
import type { SkillId } from './skills';

export type NatalId = 'phi_kiem' | 'ho_lo' | 'linh_chung' | 'tran_an' | 'hon_phan' | 'phong_quat';

export interface NatalState {
  id: NatalId;
  level: number;
  exp: number;
  /** Số lần tế luyện (0..REFINE_MAX); save cũ không có */
  refine?: number;
}

export interface NatalDef {
  id: NatalId;
  name: string;
  role: string;
  desc: string;
  skillId: SkillId;
  /** Cộng thêm mỗi cấp */
  perLevel: Mods;
  /** Thưởng thêm khi tiến hóa lên Linh Khí, Bảo Khí, Tiên Khí (cộng dồn) */
  stageBonus: [Mods, Mods, Mods];
}

export const NATAL_MAX_LEVEL = 30;
export const NATAL_STAGES = ['Phàm Khí', 'Linh Khí', 'Bảo Khí', 'Tiên Khí'];
/** Cấp bắt đầu của từng giai đoạn */
export const NATAL_STAGE_LEVELS = [1, 10, 20, 30];
/** Mở khóa khi đạt cấp này (Trúc Cơ Sơ Kỳ) */
export const NATAL_UNLOCK_LEVEL = 9;

export const NATALS: Record<NatalId, NatalDef> = {
  phi_kiem: {
    id: 'phi_kiem',
    name: 'Thanh Hồng Phi Kiếm',
    role: 'Công kích',
    desc: 'Phi kiếm theo thân, tăng công. Chiêu bản mệnh chém một nhát lớn, dễ bạo kích.',
    skillId: 'n_phi_kiem',
    perLevel: { atkPct: 0.008 },
    stageBonus: [{ crit: 0.03 }, { atkPct: 0.05 }, { spd: 4, crit: 0.03 }],
  },
  ho_lo: {
    id: 'ho_lo',
    name: 'Càn Khôn Hồ Lô',
    role: 'Bền bỉ',
    desc: 'Hồ lô thu nạp linh khí, tăng khí huyết và tu luyện. Chiêu bản mệnh hút máu đối thủ.',
    skillId: 'n_ho_lo',
    perLevel: { hpPct: 0.01, cultivation: 0.003 },
    stageBonus: [{ defPct: 0.04 }, { hpPct: 0.05, cultivation: 0.03 }, { lifesteal: 0.03 }],
  },
  linh_chung: {
    id: 'linh_chung',
    name: 'Trấn Hồn Linh Chung',
    role: 'Khống chế',
    desc: 'Chuông trấn hồn, tăng thủ và né tránh. Chiêu bản mệnh gây choáng và làm chậm đối thủ.',
    skillId: 'n_linh_chung',
    perLevel: { defPct: 0.008, dodge: 0.0015 },
    stageBonus: [{ hpPct: 0.04 }, { dodge: 0.03 }, { thorns: 0.04 }],
  },
  tran_an: {
    id: 'tran_an',
    name: 'Trấn Nhạc Ấn',
    role: 'Phá giáp',
    desc: 'Ấn nặng như núi, tăng công và thủ. Chiêu giáng ấn đập mạnh và làm đối thủ yếu giáp.',
    skillId: 'n_tran_an',
    perLevel: { atkPct: 0.005, defPct: 0.005 },
    stageBonus: [{ defPct: 0.04 }, { atkPct: 0.05 }, { hpPct: 0.05, crit: 0.03 }],
  },
  hon_phan: {
    id: 'hon_phan',
    name: 'Vạn Hồn Phiên',
    role: 'Thiêu đốt',
    desc: 'Phiên cờ thu hồn, tăng công. Chiêu bản mệnh thiêu đốt đối thủ nhiều lượt.',
    skillId: 'n_hon_phan',
    perLevel: { atkPct: 0.006, crit: 0.001 },
    stageBonus: [{ burnHit: 0.04 }, { atkPct: 0.05 }, { burnHit: 0.04, lifesteal: 0.02 }],
  },
  phong_quat: {
    id: 'phong_quat',
    name: 'Thanh Phong Quạt',
    role: 'Tốc độ',
    desc: 'Quạt lướt gió, tăng tốc và né tránh. Chiêu bản mệnh tăng công và né của bản thân trong vài lượt.',
    skillId: 'n_phong_quat',
    perLevel: { spd: 0.25, dodge: 0.002 },
    stageBonus: [{ spd: 3 }, { dodge: 0.03 }, { spd: 4, crit: 0.04 }],
  },
};

export const NATAL_IDS = Object.keys(NATALS) as NatalId[];

export function natalStage(level: number): number {
  let st = 0;
  NATAL_STAGE_LEVELS.forEach((l, i) => {
    if (level >= l) st = i;
  });
  return st;
}

/** Kinh nghiệm để lên từ cấp `level` lên `level + 1` */
export function natalExpNeeded(level: number): number {
  return Math.round(60 * 1.22 ** (level - 1));
}

/** Kinh nghiệm bản mệnh nhận được khi luyện hóa một trang bị */
export function natalExpFromItem(tierMult: number, floor: number, plus: number): number {
  return Math.round(12 * tierMult ** 1.6 * 1.12 ** floor * (1 + 0.5 * plus));
}

/** Chiêu bản mệnh mạnh lên theo cấp: tối đa cấp chiêu 10 */
export function natalSkillLevel(level: number, refine = 0): number {
  return Math.min(10, 1 + Math.floor((level - 1) / 3) + (refine >= 3 ? 1 : 0) + (refine >= 5 ? 1 : 0));
}

// ---------- Tế luyện: dùng Linh Tài rơi từ thủ lĩnh để nâng phẩm chất ----------

export const REFINE_MAX = 5;
export const REFINE_NAMES = ['Chưa tế luyện', 'Sơ Luyện', 'Tinh Luyện', 'Thượng Luyện', 'Đại Thành', 'Viên Mãn'];
/** Mỗi lần tế luyện tăng chừng này phần chỉ số của chính pháp bảo đó */
export const REFINE_BONUS = 0.15;
/** Linh Tài để tế luyện từ lần thứ r lên r+1 */
export const refineCost = (r: number) => [3, 6, 10, 15, 22][r] ?? Infinity;
/** Cấp pháp bảo tối thiểu để tế luyện từ lần thứ r lên r+1 */
export const refineLevelReq = (r: number) => 5 * (r + 1);
export const refineOf = (n: { refine?: number }) => n.refine ?? 0;
/** Linh Tài thủ lĩnh tầng f rơi ra */
export const bossMaterials = (floor: number) => 1 + Math.floor(floor / 10);
/** Xác suất mỗi phút lịch luyện nhặt được Linh Tài (số lượng như thủ lĩnh) */
export const FARM_MATERIAL_CHANCE = 0.06;

// ---------- Pháp bảo phụ và cộng hưởng ----------

/** Cảnh giới (chỉ số REALMS) mở ô pháp bảo phụ thứ nhất và thứ hai */
export const TREASURE_UNLOCK_REALMS = [4, 6];
export const MAX_TREASURES = TREASURE_UNLOCK_REALMS.length;
/** Pháp bảo phụ chỉ có chừng này phần chỉ số của bản mệnh */
export const TREASURE_SCALE = 0.6;
/** Linh thạch luyện một pháp bảo phụ = chừng này giờ thu nhập; thêm tàn quyển */
export const TREASURE_COST_HOURS = 2;
export const TREASURE_COST_FRAGMENTS = 20;

export interface Resonance {
  ids: [NatalId, NatalId];
  name: string;
  desc: string;
  mods: Mods;
}

/** Có đủ hai pháp bảo của cặp (bản mệnh hay phụ đều được) thì nhận thêm */
export const RESONANCES: Resonance[] = [
  { ids: ['phi_kiem', 'phong_quat'], name: 'Phong Kiếm Hợp Bích', desc: 'Kiếm theo gió, gió thêm sắc kiếm.', mods: { crit: 0.05, spd: 6 } },
  { ids: ['ho_lo', 'linh_chung'], name: 'Thủ Hộ Song Bảo', desc: 'Hồ lô nạp khí, chuông trấn thân.', mods: { hpPct: 0.06, defPct: 0.06 } },
  { ids: ['tran_an', 'hon_phan'], name: 'Âm Dương Ấn Phiên', desc: 'Ấn nén hồn, phiên đốt hồn.', mods: { atkPct: 0.07, burnHit: 0.04 } },
];
