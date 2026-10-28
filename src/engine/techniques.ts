// Thư viện công pháp: 1 công pháp chính (theo hướng tu) + 2 công pháp phụ (dùng chung),
// chia bốn phẩm cấp Hoàng / Huyền / Địa / Thiên.

import type { PathId } from './data';
import type { Mods } from './gear';

export const GRADE_NAMES = ['Hoàng Cấp', 'Huyền Cấp', 'Địa Cấp', 'Thiên Cấp'];
/** Hệ số chi phí nâng cấp theo phẩm cấp */
export const GRADE_COST = [1, 1.3, 1.7, 2.2];
export const SUB_SLOTS = 2;
/** Học công pháp chính mới thì bắt đầu ở bằng chừng này tầng của công pháp chính cũ (không mất trắng) */
export const MAIN_CARRY_OVER = 0.5;

export type Grade = 0 | 1 | 2 | 3;
export type MainTechId = `${PathId}_${Grade}`;
export type SubTechId =
  | 'dan_khi'
  | 'quy_tuc'
  | 'tu_linh'
  | 'than_thuc'
  | 'liem_tuc'
  | 'kim_chung'
  | 'phan_chan'
  | 'phe_huyet'
  | 'thien_co'
  | 'can_khon';
export type TechId = MainTechId | SubTechId;

export type TechSource =
  | { kind: 'start' }
  /** Học ngay khi chọn hướng tu */
  | { kind: 'path' }
  | { kind: 'shop'; price: number; realm: number }
  | { kind: 'boss'; floor: number };

export interface TechDef {
  id: TechId;
  name: string;
  grade: Grade;
  kind: 'main' | 'sub';
  /** Công pháp chính chỉ dùng được với đúng hướng tu */
  path: PathId | null;
  /** Hiệu ứng mỗi tầng */
  perLevel: Mods;
  /** Giới hạn tầng của công pháp phụ (công pháp chính giới hạn theo cảnh giới) */
  maxLevel?: number;
  source: TechSource;
}

const scale = (m: Mods, k: number): Mods =>
  Object.fromEntries(Object.entries(m).map(([key, v]) => [key, Math.round((v as number) * k * 10000) / 10000])) as Mods;

const MAIN_BASE: Record<PathId, Mods> = {
  kiem: { atkPct: 0.08, crit: 0.01 },
  the: { hpPct: 0.1, defPct: 0.08, atkPct: 0.03 },
  phap: { cultivation: 0.06, atkPct: 0.04 },
};
const MAIN_MULT = [1, 1.3, 1.6, 2];
/** Phẩm cao thêm chỉ số riêng cho từng hướng tu */
const MAIN_EXTRA: Record<PathId, Mods[]> = {
  kiem: [{}, { spd: 0.4 }, { spd: 0.4, lifesteal: 0.003 }, { spd: 0.6, lifesteal: 0.005 }],
  the: [{}, { thorns: 0.01 }, { thorns: 0.012, dodge: 0.003 }, { thorns: 0.015, dodge: 0.004, lifesteal: 0.003 }],
  phap: [{}, { crit: 0.004 }, { crit: 0.005, stones: 0.01 }, { crit: 0.007, stones: 0.015, spd: 0.3 }],
};
const MAIN_NAMES: Record<PathId, string[]> = {
  kiem: ['Thanh Liên Kiếm Quyết', 'Tử Điện Kiếm Điển', 'Ngự Kiếm Chân Kinh', 'Hỗn Nguyên Kiếm Kinh'],
  the: ['Kim Cương Bất Hoại Thể', 'Thiết Cốt Luyện Thân Quyết', 'Bất Diệt Kim Thân', 'Cửu Chuyển Huyền Công'],
  phap: ['Ngũ Hành Linh Quyết', 'Âm Dương Hóa Sinh Quyết', 'Tử Vi Tinh Đẩu Kinh', 'Thái Ất Lôi Pháp'],
};
const MAIN_SOURCE: TechSource[] = [
  { kind: 'path' },
  { kind: 'shop', price: 15_000, realm: 2 },
  { kind: 'boss', floor: 30 },
  { kind: 'boss', floor: 40 },
];

const PATH_IDS: PathId[] = ['kiem', 'the', 'phap'];

export const mainTechId = (path: PathId, grade: number): MainTechId => `${path}_${grade as Grade}`;

const mains: TechDef[] = PATH_IDS.flatMap((path) =>
  ([0, 1, 2, 3] as Grade[]).map(
    (grade): TechDef => ({
      id: mainTechId(path, grade),
      name: MAIN_NAMES[path][grade],
      grade,
      kind: 'main',
      path,
      perLevel: sumMods(scale(MAIN_BASE[path], MAIN_MULT[grade]), MAIN_EXTRA[path][grade]),
      source: MAIN_SOURCE[grade],
    }),
  ),
);

function sumMods(a: Mods, b: Mods): Mods {
  const out: Mods = { ...a };
  for (const [k, v] of Object.entries(b)) out[k as keyof Mods] = (out[k as keyof Mods] ?? 0) + (v as number);
  return out;
}

const sub = (
  id: SubTechId,
  name: string,
  grade: Grade,
  maxLevel: number,
  perLevel: Mods,
  source: TechSource,
): TechDef => ({ id, name, grade, kind: 'sub', path: null, perLevel, maxLevel, source });

const subs: TechDef[] = [
  sub('dan_khi', 'Dẫn Khí Quyết', 0, 5, { hpPct: 0.04, atkPct: 0.04, defPct: 0.04 }, { kind: 'start' }),
  sub('quy_tuc', 'Quy Tức Công', 0, 8, { offline: 0.5 }, { kind: 'shop', price: 600, realm: 1 }),
  sub('tu_linh', 'Tụ Linh Trận Pháp', 0, 6, { seclusion: 0.04 }, { kind: 'shop', price: 900, realm: 1 }),
  sub('than_thuc', 'Thần Thức Quyết', 1, 7, { crit: 0.012, spd: 0.8 }, { kind: 'shop', price: 8_000, realm: 2 }),
  sub('liem_tuc', 'Liễm Tức Thuật', 1, 7, { dodge: 0.01 }, { kind: 'shop', price: 8_000, realm: 2 }),
  sub('kim_chung', 'Kim Chung Tráo', 1, 7, { hpPct: 0.03, defPct: 0.04 }, { kind: 'boss', floor: 10 }),
  sub('phan_chan', 'Phản Chấn Quyết', 2, 9, { thorns: 0.012, defPct: 0.02 }, { kind: 'boss', floor: 20 }),
  sub('phe_huyet', 'Phệ Huyết Công', 2, 9, { lifesteal: 0.006 }, { kind: 'boss', floor: 25 }),
  sub('thien_co', 'Thiên Cơ Diễn Toán', 3, 10, { stones: 0.03, cultivation: 0.02 }, { kind: 'boss', floor: 35 }),
  sub('can_khon', 'Càn Khôn Đại Pháp', 3, 10, { hpPct: 0.03, atkPct: 0.03, defPct: 0.03 }, { kind: 'boss', floor: 40 }),
];

export const TECHS: Record<TechId, TechDef> = Object.fromEntries([...mains, ...subs].map((t) => [t.id, t])) as Record<
  TechId,
  TechDef
>;

export const MAIN_TECHS = mains;
export const SUB_TECHS = subs;

/** Công pháp chính của một hướng tu, từ thấp đến cao */
export const mainTechsOf = (path: PathId): TechDef[] => mains.filter((t) => t.path === path);

/** Tổng hiệu ứng của một công pháp ở một tầng (affinity chỉ áp cho công pháp chính) */
export function techEffect(def: TechDef, level: number, affinity = 1): Mods {
  return scale(def.perLevel, level * affinity);
}
