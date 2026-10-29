// Động phủ: linh điền (trồng thảo dược), đan phòng (luyện đan), tụ linh trận và linh mạch (tăng thu nhập).

import type { PillId } from './data';

export type BuildingId = 'linh_dien' | 'dan_phong' | 'tu_linh' | 'linh_mach';
export const BUILDING_IDS: BuildingId[] = ['linh_dien', 'dan_phong', 'tu_linh', 'linh_mach'];

export interface BuildingDef {
  id: BuildingId;
  name: string;
  desc: string;
  /** Cảnh giới (chỉ số REALMS) tối thiểu để xây */
  unlockRealm: number;
  /** Linh thạch để lên cấp 1; mỗi cấp sau nhân BUILDING_COST_GROWTH */
  baseCost: number;
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  linh_dien: {
    id: 'linh_dien',
    name: 'Linh Điền',
    desc: 'Trồng thảo dược. Thêm ô trồng, cây chín nhanh hơn và thu hoạch được nhiều hơn.',
    unlockRealm: 0,
    baseCost: 150,
  },
  dan_phong: {
    id: 'dan_phong',
    name: 'Đan Phòng',
    desc: 'Luyện đan từ thảo dược. Luyện nhanh hơn, được luyện nhiều viên một lần và dễ ra đan phẩm cao.',
    unlockRealm: 0,
    baseCost: 400,
  },
  tu_linh: {
    id: 'tu_linh',
    name: 'Tụ Linh Trận',
    desc: 'Tụ linh khí quanh động phủ, tăng tốc độ tu luyện mọi lúc (cả khi offline).',
    unlockRealm: 0,
    baseCost: 300,
  },
  linh_mach: {
    id: 'linh_mach',
    name: 'Linh Mạch',
    desc: 'Dẫn mạch khoáng linh thạch, tăng linh thạch kiếm được từ mọi nguồn.',
    unlockRealm: 1,
    baseCost: 500,
  },
};

export const MAX_BUILDING_LEVEL = 10;
export const BUILDING_COST_GROWTH = 1.9;
export const MAX_PLOTS = 7;

/** Cấp công trình tối đa theo cảnh giới */
export function buildingCap(realm: number): number {
  return Math.min(MAX_BUILDING_LEVEL, 2 + realm);
}

export function buildingCost(id: BuildingId, nextLevel: number): number {
  return Math.round(BUILDINGS[id].baseCost * BUILDING_COST_GROWTH ** (nextLevel - 1));
}

// ---- Hiệu ứng công trình theo cấp ----
export const plotCountAt = (level: number) => (level <= 0 ? 0 : 2 + Math.floor(level / 2));
/** Hệ số thời gian cây chín: cấp 10 còn 64% */
export const growthMultAt = (level: number) => 1 - 0.04 * Math.max(0, level - 1);
/** Xác suất mỗi lần thu hoạch được thêm 1 thảo dược */
export const yieldBonusAt = (level: number) => 0.05 * Math.max(0, level - 1);
export const craftTimeMultAt = (level: number) => 1 - 0.05 * Math.max(0, level - 1);
export const maxBatchAt = (level: number) => (level <= 0 ? 0 : 3 + level);
/** Tỉ lệ ra đan phẩm cao hơn; còn lại là Hạ Phẩm */
export const gradeChancesAt = (level: number) => ({
  top: Math.min(0.4, 0.02 + 0.035 * Math.max(0, level - 1)),
  mid: Math.min(0.5, 0.15 + 0.04 * Math.max(0, level - 1)),
});
export const cultivationBonusAt = (level: number) => 0.06 * level;
export const stoneBonusAt = (level: number) => 0.08 * level;

// ---- Thảo dược ----
export type HerbId =
  | 'linh_thao'
  | 'thanh_tam'
  | 'huyet_sam'
  | 'ket_dan'
  | 'tu_linh_chi'
  | 'ngoc_tuy'
  | 'cuu_diep'
  | 'thien_huong'
  | 'hoan_hon'
  | 'hon_nguyen';

export interface HerbDef {
  id: HerbId;
  name: string;
  /** Bậc 0..4, mỗi bậc ứng với 2 đại cảnh giới */
  band: number;
  /** Loại hiếm: lâu chín hơn, dùng cho đan quý */
  rare: boolean;
  color: string;
}

const HERB_NAMES: [string, string, string, string][] = [
  ['linh_thao', 'Linh Thảo', 'thanh_tam', 'Thanh Tâm Thảo'],
  ['huyet_sam', 'Huyết Sâm', 'ket_dan', 'Kết Đan Thảo'],
  ['tu_linh_chi', 'Tử Linh Chi', 'ngoc_tuy', 'Ngọc Tủy Chi'],
  ['cuu_diep', 'Cửu Diệp Linh Chi', 'thien_huong', 'Thiên Hương Quả'],
  ['hoan_hon', 'Hoàn Hồn Thảo', 'hon_nguyen', 'Hỗn Nguyên Quả'],
];
const HERB_COLORS = ['#7fcf8a', '#7fe0c8', '#e5654b', '#f0c35a', '#c08cff', '#a8e4ff', '#8fe39a', '#ffb04a', '#d9a6ff', '#fff3c4'];

export const HERBS: Record<HerbId, HerbDef> = Object.fromEntries(
  HERB_NAMES.flatMap(([a, an, b, bn], band) => [
    [a, { id: a, name: an, band, rare: false, color: HERB_COLORS[band * 2] }],
    [b, { id: b, name: bn, band, rare: true, color: HERB_COLORS[band * 2 + 1] }],
  ]),
) as Record<HerbId, HerbDef>;

export const HERB_IDS = Object.keys(HERBS) as HerbId[];

/** Thảo dược phổ thông và hiếm của một bậc */
export function herbsOfBand(band: number): { common: HerbId; rare: HerbId } {
  const [a, , b] = HERB_NAMES[Math.min(band, HERB_NAMES.length - 1)];
  return { common: a as HerbId, rare: b as HerbId };
}

/** Bậc thảo dược theo cảnh giới của người chơi */
export const bandOfRealm = (realm: number) => Math.min(4, Math.floor(realm / 2));

/** Thời gian chín ở cấp Linh Điền 1 (giây), tăng 25% mỗi bậc */
export function growSeconds(id: HerbId): number {
  const h = HERBS[id];
  return Math.round((h.rare ? 40 : 12) * 60 * 1.25 ** h.band);
}

export function seedCost(id: HerbId): number {
  const h = HERBS[id];
  return (h.rare ? 30 : 12) * 4 ** h.band;
}

export const sellPrice = (id: HerbId) => Math.round(seedCost(id) * 0.6);

/** Số thảo dược mỗi lần thu hoạch (chưa tính thưởng cấp Linh Điền) */
export const YIELD: [number, number] = [1, 2];

// ---- Công thức luyện đan ----
export type RecipeId = 'tuKhi' | 'phaCanh' | 'hoiXuan';

export interface RecipeDef {
  id: RecipeId;
  name: string;
  /** Số thảo dược phổ thông và hiếm của bậc hiện tại cho mỗi viên */
  common: number;
  rare: number;
  /** Giây luyện mỗi viên ở Đan Phòng cấp 1 */
  seconds: number;
  /** Đan ra theo phẩm Hạ / Trung / Thượng (Hồi Xuân Đan chỉ có một phẩm) */
  pills: [PillId, PillId, PillId];
}

export const RECIPES: Record<RecipeId, RecipeDef> = {
  tuKhi: { id: 'tuKhi', name: 'Tụ Khí Đan', common: 8, rare: 0, seconds: 90, pills: ['tuKhi', 'tuKhi2', 'tuKhi3'] },
  phaCanh: { id: 'phaCanh', name: 'Phá Cảnh Đan', common: 4, rare: 3, seconds: 300, pills: ['phaCanh', 'phaCanh2', 'phaCanh3'] },
  hoiXuan: { id: 'hoiXuan', name: 'Hồi Xuân Đan', common: 2, rare: 1, seconds: 120, pills: ['hoiXuan', 'hoiXuan', 'hoiXuan'] },
};
export const RECIPE_IDS = Object.keys(RECIPES) as RecipeId[];

// ---- Trạng thái lưu trong GameState ----
export interface Plot {
  herb: HerbId;
  start: number;
  end: number;
}

export interface Job {
  recipe: RecipeId;
  count: number;
  start: number;
  end: number;
}

export interface DwellingState {
  levels: Record<BuildingId, number>;
  /** Luôn có MAX_PLOTS phần tử; chỉ plotCountAt(level) ô đầu dùng được */
  plots: (Plot | null)[];
  herbs: Partial<Record<HerbId, number>>;
  job: Job | null;
}

export function newDwelling(): DwellingState {
  return {
    levels: { linh_dien: 1, dan_phong: 0, tu_linh: 0, linh_mach: 0 },
    plots: Array.from({ length: MAX_PLOTS }, () => null),
    herbs: {},
    job: null,
  };
}
