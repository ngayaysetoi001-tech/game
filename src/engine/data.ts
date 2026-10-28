// Dữ liệu tĩnh của game. Muốn cân bằng lại chỉ số thì sửa ở đây.

export interface RealmDef {
  name: string;
  stages: string[];
  /** Tu vi cần cho tầng đầu tiên của cảnh giới; mỗi tầng sau ×STAGE_GROWTH */
  baseReq: number;
  /** Hệ số tốc độ tu luyện khi ở cảnh giới này */
  rateMult: number;
  /** Tỉ lệ thành công cơ bản khi đột phá VÀO cảnh giới này */
  breakChance: number;
}

const FOUR_STAGES = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn'];

export const REALMS: RealmDef[] = [
  {
    name: 'Luyện Khí',
    stages: Array.from({ length: 9 }, (_, i) => `Tầng ${i + 1}`),
    baseReq: 28,
    rateMult: 1,
    breakChance: 1,
  },
  { name: 'Trúc Cơ', stages: FOUR_STAGES, baseReq: 1_300, rateMult: 3, breakChance: 0.6 },
  { name: 'Kim Đan', stages: FOUR_STAGES, baseReq: 12_000, rateMult: 9, breakChance: 0.5 },
  { name: 'Nguyên Anh', stages: FOUR_STAGES, baseReq: 95_000, rateMult: 27, breakChance: 0.4 },
  { name: 'Hóa Thần', stages: FOUR_STAGES, baseReq: 700_000, rateMult: 81, breakChance: 0.35 },
  { name: 'Luyện Hư', stages: FOUR_STAGES, baseReq: 4.2e6, rateMult: 243, breakChance: 0.3 },
  { name: 'Hợp Thể', stages: FOUR_STAGES, baseReq: 2.3e7, rateMult: 729, breakChance: 0.25 },
  { name: 'Đại Thừa', stages: FOUR_STAGES, baseReq: 1.15e8, rateMult: 2_187, breakChance: 0.2 },
  { name: 'Độ Kiếp', stages: FOUR_STAGES, baseReq: 5.7e8, rateMult: 6_561, breakChance: 0.15 },
];

export const STAGE_GROWTH = 1.3;

/** Tu vi / giây khi chưa tính hệ số nào */
export const BASE_RATE = 1;
/** Linh thạch / giây ở Luyện Khí, nhân đôi mỗi cảnh giới */
export const BASE_STONE_RATE = 0.2;
export const STARTING_STONES = 50;

/** Tối đa bao nhiêu giờ offline được tính */
export const OFFLINE_CAP_HOURS = 12;

// --- Đột phá ---
export const MAX_BREAK_CHANCE = 0.95;
export const BREAK_PILL_BONUS = 0.15;
export const MAX_BREAK_PILLS = 3;
/** Mất bao nhiêu phần tu vi khi đột phá thất bại */
export const FAIL_CULTIVATION_LOSS = 0.3;
/** Mỗi lần thất bại cộng thêm tỉ lệ cho lần sau (tích lũy kinh nghiệm) */
export const FAIL_BONUS_STEP = 0.05;
export const FAIL_BONUS_MAX = 0.25;
export const INJURY_SECONDS = 300;
export const INJURY_RATE_MULT = 0.5;

// --- Linh căn ---
export type Element = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ' | 'Lôi' | 'Phong' | 'Băng';
export const BASIC_ELEMENTS: Element[] = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
export const VARIANT_ELEMENTS: Element[] = ['Lôi', 'Phong', 'Băng'];

export interface RootTier {
  name: string;
  /** Số nguyên tố; 0 = dị linh căn (1 nguyên tố biến dị) */
  count: number;
  weight: number;
  rateMult: number;
  breakBonus: number;
}

export const ROOT_TIERS: RootTier[] = [
  { name: 'Dị Linh Căn', count: 0, weight: 3, rateMult: 2.5, breakBonus: 0.05 },
  { name: 'Thiên Linh Căn', count: 1, weight: 5, rateMult: 3, breakBonus: 0.1 },
  { name: 'Song Linh Căn', count: 2, weight: 14, rateMult: 2, breakBonus: 0.05 },
  { name: 'Tam Linh Căn', count: 3, weight: 28, rateMult: 1.5, breakBonus: 0 },
  { name: 'Tứ Linh Căn', count: 4, weight: 30, rateMult: 1.2, breakBonus: 0 },
  { name: 'Ngũ Hành Tạp Linh Căn', count: 5, weight: 20, rateMult: 1, breakBonus: 0 },
];

export const ROOT_REROLLS = 3;

// --- Đan dược ---
export type PillId = 'tuKhi' | 'phaCanh' | 'hoiXuan';

export interface PillDef {
  id: PillId;
  name: string;
  desc: string;
  /** Giá = basePrice × priceGrowth^(chỉ số cảnh giới); linh thạch kiếm được chỉ tăng ×2 mỗi cảnh giới */
  basePrice: number;
  priceGrowth: number;
}

export const PILLS: Record<PillId, PillDef> = {
  tuKhi: {
    id: 'tuKhi',
    name: 'Tụ Khí Đan',
    desc: 'Dùng ngay: nhận lượng tu vi bằng 5 phút tu luyện.',
    basePrice: 50,
    priceGrowth: 2,
  },
  phaCanh: {
    id: 'phaCanh',
    name: 'Phá Cảnh Đan',
    desc: `Dùng khi đột phá đại cảnh giới: +${BREAK_PILL_BONUS * 100}% tỉ lệ (tối đa ${MAX_BREAK_PILLS} viên).`,
    basePrice: 120,
    priceGrowth: 5,
  },
  hoiXuan: {
    id: 'hoiXuan',
    name: 'Hồi Xuân Đan',
    desc: 'Chữa khỏi thương thế ngay lập tức.',
    basePrice: 30,
    priceGrowth: 2,
  },
};

export const TU_KHI_SECONDS = 300;

// --- Bế quan ---
export type SeclusionId = 'short' | 'medium' | 'long';

export interface SeclusionDef {
  id: SeclusionId;
  name: string;
  minutes: number;
  rateMult: number;
}

export const SECLUSIONS: SeclusionDef[] = [
  { id: 'short', name: 'Tiểu Bế Quan', minutes: 10, rateMult: 1.5 },
  { id: 'medium', name: 'Bế Quan', minutes: 60, rateMult: 2 },
  { id: 'long', name: 'Trường Bế Quan', minutes: 480, rateMult: 2.5 },
];

export const LOG_LIMIT = 60;
