// Bản mệnh pháp bảo: một pháp bảo lớn lên cùng nhân vật. Luyện hóa pháp bảo thừa để lên cấp.

import type { Mods } from './gear';
import type { SkillId } from './skills';

export type NatalId = 'phi_kiem' | 'ho_lo' | 'linh_chung';

export interface NatalState {
  id: NatalId;
  level: number;
  exp: number;
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

/** Kinh nghiệm bản mệnh nhận được khi luyện hóa một pháp bảo */
export function natalExpFromItem(tierMult: number, floor: number, plus: number): number {
  return Math.round(12 * tierMult ** 1.6 * 1.12 ** floor * (1 + 0.5 * plus));
}

/** Chiêu bản mệnh mạnh lên theo cấp: tối đa cấp chiêu 10 */
export function natalSkillLevel(level: number): number {
  return Math.min(10, 1 + Math.floor((level - 1) / 3));
}
