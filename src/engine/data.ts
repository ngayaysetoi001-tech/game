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
  /** Phải vượt qua tầng Bí Cảnh này mới được đột phá VÀO cảnh giới này */
  gateFloor: number;
}

const FOUR_STAGES = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn'];

export const REALMS: RealmDef[] = [
  {
    name: 'Luyện Khí',
    stages: Array.from({ length: 9 }, (_, i) => `Tầng ${i + 1}`),
    baseReq: 28,
    rateMult: 1,
    breakChance: 1,
    gateFloor: 0,
  },
  { name: 'Trúc Cơ', stages: FOUR_STAGES, baseReq: 1_300, rateMult: 3, breakChance: 0.6, gateFloor: 3 },
  { name: 'Kim Đan', stages: FOUR_STAGES, baseReq: 12_000, rateMult: 9, breakChance: 0.5, gateFloor: 5 },
  { name: 'Nguyên Anh', stages: FOUR_STAGES, baseReq: 95_000, rateMult: 27, breakChance: 0.4, gateFloor: 10 },
  { name: 'Hóa Thần', stages: FOUR_STAGES, baseReq: 700_000, rateMult: 81, breakChance: 0.35, gateFloor: 15 },
  { name: 'Luyện Hư', stages: FOUR_STAGES, baseReq: 4.2e6, rateMult: 243, breakChance: 0.3, gateFloor: 20 },
  { name: 'Hợp Thể', stages: FOUR_STAGES, baseReq: 2.3e7, rateMult: 729, breakChance: 0.25, gateFloor: 25 },
  { name: 'Đại Thừa', stages: FOUR_STAGES, baseReq: 1.15e8, rateMult: 2_187, breakChance: 0.2, gateFloor: 30 },
  { name: 'Độ Kiếp', stages: FOUR_STAGES, baseReq: 5.7e8, rateMult: 6_561, breakChance: 0.15, gateFloor: 35 },
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
export type PillFamily = 'tuKhi' | 'phaCanh' | 'hoiXuan';
export type PillId = 'tuKhi' | 'tuKhi2' | 'tuKhi3' | 'phaCanh' | 'phaCanh2' | 'phaCanh3' | 'hoiXuan';

export const PILL_GRADE_NAMES = ['Hạ Phẩm', 'Trung Phẩm', 'Thượng Phẩm'];
/** Tụ Khí Đan: số giây tu luyện nhận được theo phẩm */
export const TU_KHI_SECONDS_BY_GRADE = [300, 480, 720];
/** Phá Cảnh Đan: tỉ lệ đột phá cộng thêm theo phẩm */
export const BREAK_PILL_BONUS_BY_GRADE = [BREAK_PILL_BONUS, 0.22, 0.3];

export interface PillDef {
  id: PillId;
  family: PillFamily;
  grade: 0 | 1 | 2;
  name: string;
  desc: string;
  /** Giá = basePrice × priceGrowth^(chỉ số cảnh giới); null = không bán, chỉ luyện được */
  basePrice: number | null;
  priceGrowth: number;
}

const tuKhiDesc = (sec: number) => `Dùng ngay: nhận lượng tu vi bằng ${sec / 60} phút tu luyện.`;
const phaCanhDesc = (bonus: number) =>
  `Dùng khi đột phá đại cảnh giới: +${Math.round(bonus * 100)}% tỉ lệ (tối đa ${MAX_BREAK_PILLS} viên, phẩm cao dùng trước).`;

export const PILLS: Record<PillId, PillDef> = {
  tuKhi: { id: 'tuKhi', family: 'tuKhi', grade: 0, name: 'Tụ Khí Đan', desc: tuKhiDesc(TU_KHI_SECONDS_BY_GRADE[0]), basePrice: 50, priceGrowth: 2 },
  tuKhi2: { id: 'tuKhi2', family: 'tuKhi', grade: 1, name: 'Tụ Khí Đan', desc: tuKhiDesc(TU_KHI_SECONDS_BY_GRADE[1]), basePrice: null, priceGrowth: 2 },
  tuKhi3: { id: 'tuKhi3', family: 'tuKhi', grade: 2, name: 'Tụ Khí Đan', desc: tuKhiDesc(TU_KHI_SECONDS_BY_GRADE[2]), basePrice: null, priceGrowth: 2 },
  phaCanh: { id: 'phaCanh', family: 'phaCanh', grade: 0, name: 'Phá Cảnh Đan', desc: phaCanhDesc(BREAK_PILL_BONUS_BY_GRADE[0]), basePrice: 120, priceGrowth: 5 },
  phaCanh2: { id: 'phaCanh2', family: 'phaCanh', grade: 1, name: 'Phá Cảnh Đan', desc: phaCanhDesc(BREAK_PILL_BONUS_BY_GRADE[1]), basePrice: null, priceGrowth: 5 },
  phaCanh3: { id: 'phaCanh3', family: 'phaCanh', grade: 2, name: 'Phá Cảnh Đan', desc: phaCanhDesc(BREAK_PILL_BONUS_BY_GRADE[2]), basePrice: null, priceGrowth: 5 },
  hoiXuan: { id: 'hoiXuan', family: 'hoiXuan', grade: 0, name: 'Hồi Xuân Đan', desc: 'Chữa khỏi thương thế ngay lập tức.', basePrice: 30, priceGrowth: 2 },
};

export const PILL_IDS = Object.keys(PILLS) as PillId[];

export function emptyPills(): Record<PillId, number> {
  return Object.fromEntries(PILL_IDS.map((id) => [id, 0])) as Record<PillId, number>;
}

/** Tên đan kèm phẩm: "Tụ Khí Đan · Trung Phẩm" (Hồi Xuân Đan không chia phẩm) */
export function pillLabel(id: PillId): string {
  const p = PILLS[id];
  return p.family === 'hoiXuan' ? p.name : `${p.name} · ${PILL_GRADE_NAMES[p.grade]}`;
}

export const TU_KHI_SECONDS = TU_KHI_SECONDS_BY_GRADE[0];

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

// =====================================================================
// Giai đoạn 1: chiến đấu, bí cảnh, pháp bảo, công pháp
// =====================================================================

/** Chỉ số gốc nhân với SCALE^cấp — dùng chung cho người chơi, quái và pháp bảo */
export const POWER_SCALE = 1.2;
export const BASE_STATS = { hp: 100, atk: 15, def: 5, spd: 100 };

/** Bị thương: chỉ số chiến đấu giảm */
export const INJURY_COMBAT_MULT = 0.8;
/** Thua trong bí cảnh bị thương bao lâu */
export const DEFEAT_INJURY_SECONDS = 120;
export const CRIT_DAMAGE = 1.8;
/** Quá số lượt này mà chưa phân thắng bại thì tính là thua */
export const MAX_BATTLE_ACTIONS = 150;

// --- Bí cảnh ---
export const MAX_FLOOR = 40;
export const BOSS_EVERY = 5;
export const BOSS_MULT = { hp: 3, atk: 1.15, def: 1.2 };

/** "Cấp tương đương" của quái ở tầng f, để so với cấp người chơi */
/**
 * "Cấp tương đương" của quái ở tầng f, để so với cấp người chơi.
 * Ba tầng đầu được giảm để nhân vật mới có thể lấy món pháp bảo đầu tiên.
 */
export function floorLevel(floor: number): number {
  return 9.5 + (floor >= 4 ? 1 : 0) + 0.8 * floor - Math.max(0, 4 - floor) * 2 + 0.1 * Math.max(0, floor - 5);
}

export interface Zone {
  name: string;
  enemies: string[];
  boss: string;
}

export const ZONES: Zone[] = [
  { name: 'Hắc Phong Lâm', enemies: ['Thanh Lang', 'Độc Phong', 'Hắc Hùng', 'Thanh Lang Đầu Lĩnh'], boss: 'Lang Vương' },
  { name: 'Huyết Sắc Cấm Địa', enemies: ['Huyết Bức', 'Thi Khôi', 'Huyết Mãng', 'Huyết Thi'], boss: 'Huyết Mãng Vương' },
  { name: 'Vạn Yêu Cốc', enemies: ['Hỏa Hồ', 'Thiết Bối Viên', 'Lôi Ưng', 'Tam Vĩ Yêu Hồ'], boss: 'Yêu Cốc Chi Chủ' },
  { name: 'Cổ Ma Chiến Trường', enemies: ['Ma Binh', 'Oán Hồn', 'Cốt Ma', 'Ma Tướng'], boss: 'Cổ Ma Thống Lĩnh' },
  { name: 'Thiên Lôi Hải', enemies: ['Hải Yêu', 'Phong Bạo Linh', 'Lôi Giao', 'Lôi Linh Cự Thú'], boss: 'Lôi Giao Vương' },
  { name: 'U Minh Giới', enemies: ['U Hồn', 'Minh Xà', 'Quỷ Tướng', 'Câu Hồn Sứ'], boss: 'U Minh Quỷ Đế' },
  { name: 'Thái Cổ Tiên Phủ', enemies: ['Khôi Lỗi Hộ Pháp', 'Kiếm Linh', 'Tiên Phủ Thủ Vệ', 'Đan Lô Khí Linh'], boss: 'Tiên Phủ Khí Linh' },
  { name: 'Hỗn Độn Hư Không', enemies: ['Hư Không Thú', 'Hỗn Độn Ma', 'Thiên Ngoại Tà Ma', 'Phệ Tinh Trùng'], boss: 'Hỗn Độn Cổ Thần' },
];

/** Linh thạch khi vượt tầng lần đầu; lịch luyện mỗi phút nhận FARM_STONE_SHARE phần này */
export function floorStones(floor: number): number {
  return 30 * 2 ** (floor / 5);
}
export const FARM_TICK_SECONDS = 60;
export const FARM_STONE_SHARE = 0.3;
export const FARM_ITEM_CHANCE = 0.15;
export const FARM_FRAGMENT_CHANCE = 0.25;
/** Lịch luyện thì tu luyện chậm lại */
export const FARM_CULTIVATION_MULT = 0.5;

// --- Pháp bảo ---
export type Slot = 'weapon' | 'armor' | 'pendant' | 'ring' | 'boots';
export const SLOTS: Slot[] = ['weapon', 'armor', 'pendant', 'ring', 'boots'];
export const SLOT_NAMES: Record<Slot, string> = {
  weapon: 'Vũ Khí',
  armor: 'Hộ Giáp',
  pendant: 'Linh Bội',
  ring: 'Giới Chỉ',
  boots: 'Hài',
};

export interface TierDef {
  name: string;
  mult: number;
  /** Trọng số rơi thường */
  weight: number;
  /** Trọng số rơi từ thủ lĩnh (và khi lịch luyện ở tầng thủ lĩnh) */
  bossWeight: number;
  /** Linh bội: % tốc độ tu luyện */
  cultivation: number;
}

export const TIERS: TierDef[] = [
  { name: 'Phàm Phẩm', mult: 1, weight: 60, bossWeight: 0, cultivation: 0.02 },
  { name: 'Linh Phẩm', mult: 1.5, weight: 28, bossWeight: 50, cultivation: 0.04 },
  { name: 'Bảo Phẩm', mult: 2.2, weight: 10, bossWeight: 34, cultivation: 0.07 },
  { name: 'Tiên Phẩm', mult: 3.5, weight: 2, bossWeight: 10, cultivation: 0.12 },
  { name: 'Thần Phẩm', mult: 5.5, weight: 0, bossWeight: 6, cultivation: 0.18 },
];

export interface ItemBase {
  hp: number;
  atk: number;
  def: number;
  /** Bạo kích cộng thẳng, chỉ nhân hệ số phẩm (không theo tầng) */
  crit?: number;
  /** Tốc độ cộng thẳng, chỉ nhân hệ số phẩm (không theo tầng) */
  spd?: number;
}

/** Hp / Công / Thủ = giá trị dưới đây × SCALE^cấp tầng × hệ số phẩm */
export const ITEM_STATS: Record<Slot, ItemBase> = {
  weapon: { hp: 0, atk: 6, def: 0 },
  armor: { hp: 40, atk: 0, def: 3 },
  pendant: { hp: 25, atk: 0, def: 0 },
  ring: { hp: 0, atk: 3, def: 0, crit: 0.012 },
  boots: { hp: 15, atk: 0, def: 1.5, spd: 2 },
};

export const ITEM_NAMES: Record<Slot, string[]> = {
  weapon: ['Thiết Kiếm', 'Thanh Phong Kiếm', 'Tử Điện Kiếm', 'Tru Tiên Kiếm', 'Hồng Mông Kiếm'],
  armor: ['Bố Y', 'Linh Văn Giáp', 'Huyền Quy Giáp', 'Thiên Tàm Bảo Y', 'Cửu Thiên Huyền Giáp'],
  pendant: ['Ngọc Bội', 'Tụ Linh Bội', 'Càn Khôn Bội', 'Hỗn Nguyên Châu', 'Thái Cực Đồ'],
  ring: ['Thiết Giới', 'Linh Ngọc Giới', 'Huyền Băng Giới', 'Chân Long Giới', 'Hỗn Độn Giới'],
  boots: ['Vải Hài', 'Phi Vân Ngoa', 'Truy Phong Ngoa', 'Đạp Tiên Ngoa', 'Xích Tiêu Ngoa'],
};

export const BAG_LIMIT = 30;

// --- Công pháp ---
/** Chọn hướng tu khi đạt cấp này (Trúc Cơ Sơ Kỳ) */
export const PATH_UNLOCK_LEVEL = 9;
/** Linh căn hợp hệ thì hiệu quả mỗi cấp ×AFFINITY_MULT */
export const AFFINITY_MULT = 1.25;

export type PathId = 'kiem' | 'the' | 'phap';

export interface PathDef {
  id: PathId;
  name: string;
  desc: string;
  elements: Element[];
  baseCrit: number;
  spd: number;
  /** Thể tu: giảm thời gian bị thương và tu vi mất khi đột phá hỏng */
  injuryMult: number;
  failLoss: number;
}

export const PATHS: Record<PathId, PathDef> = {
  kiem: {
    id: 'kiem',
    name: 'Kiếm Tu',
    desc: 'Công cao, ra đòn nhanh, dễ bạo kích. Vượt bí cảnh nhanh nhất.',
    elements: ['Kim', 'Phong'],
    baseCrit: 0.1,
    spd: 15,
    injuryMult: 1,
    failLoss: FAIL_CULTIVATION_LOSS,
  },
  the: {
    id: 'the',
    name: 'Thể Tu',
    desc: 'Khí huyết và phòng thủ dày. Bị thương nhẹ hơn, đột phá hỏng chỉ mất 15% tu vi.',
    elements: ['Thổ', 'Băng'],
    baseCrit: 0.05,
    spd: 0,
    injuryMult: 0.5,
    failLoss: 0.15,
  },
  phap: {
    id: 'phap',
    name: 'Pháp Tu',
    desc: 'Tu luyện nhanh hơn, pháp thuật uy lực. Lên cảnh giới nhanh nhất.',
    elements: ['Hỏa', 'Thủy', 'Mộc', 'Lôi'],
    baseCrit: 0.05,
    spd: 0,
    injuryMult: 1,
    failLoss: FAIL_CULTIVATION_LOSS,
  },
};

/** Giới hạn cấp công pháp hướng tu theo cảnh giới */
export function pathLevelCap(realm: number): number {
  return 2 + 2 * realm;
}

/** Chi phí nâng công pháp từ cấp n lên n+1 */
export function techCost(level: number, realm: number): { fragments: number; stones: number } {
  return { fragments: level, stones: 50 * level * 2 ** realm };
}

// =====================================================================
// Tiện ích tự động
// =====================================================================

/** Tự khiêu chiến mỗi bao nhiêu giây */
export const AUTO_CLIMB_SECONDS = 20;
