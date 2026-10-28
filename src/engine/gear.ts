// Dữ liệu thuộc tính phụ, bộ trang bị theo khu bí cảnh và cường hóa.

/** Cộng thêm cho nhân vật từ pháp bảo. Tỉ lệ ghi dạng thập phân (0.05 = 5%); spd là số cộng thẳng. */
export interface Mods {
  hpPct?: number;
  atkPct?: number;
  defPct?: number;
  crit?: number;
  spd?: number;
  /** Hút máu: phần sát thương gây ra được hồi lại */
  lifesteal?: number;
  /** Phản đòn: phần sát thương nhận vào dội ngược lại kẻ tấn công */
  thorns?: number;
  /** Né tránh */
  dodge?: number;
  /** Tốc độ tu luyện */
  cultivation?: number;
  /** Linh thạch kiếm được */
  stones?: number;
  /** Xác suất mỗi đòn trúng làm đối thủ choáng */
  stunHit?: number;
  /** Mỗi đòn trúng thiêu đốt: sát thương mỗi lượt = công × giá trị này, 2 lượt */
  burnHit?: number;
}

export type ModKey = keyof Mods;

export const MOD_KEYS: ModKey[] = [
  'hpPct',
  'atkPct',
  'defPct',
  'crit',
  'spd',
  'lifesteal',
  'thorns',
  'dodge',
  'cultivation',
  'stones',
  'stunHit',
  'burnHit',
];

export const MOD_LABELS: Record<ModKey, string> = {
  hpPct: 'Khí huyết',
  atkPct: 'Công',
  defPct: 'Thủ',
  crit: 'Bạo kích',
  spd: 'Tốc độ',
  lifesteal: 'Hút máu',
  thorns: 'Phản đòn',
  dodge: 'Né tránh',
  cultivation: 'Tu luyện',
  stones: 'Linh thạch',
  stunHit: 'Choáng mỗi đòn',
  burnHit: 'Thiêu đốt mỗi đòn',
};

export function formatMod(key: ModKey, v: number): string {
  if (key === 'spd') return `+${Math.round(v)}`;
  const pct = v * 100;
  return `+${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

export function describeMods(m: Mods): string {
  return MOD_KEYS.filter((k) => m[k]).map((k) => `${MOD_LABELS[k]} ${formatMod(k, m[k]!)}`).join(', ');
}

// ---------- Thuộc tính phụ ngẫu nhiên ----------

export type AffixId = ModKey;

/** Khoảng giá trị ở Linh Phẩm; phẩm cao hơn nhân thêm AFFIX_TIER_SCALE mỗi bậc */
export const AFFIXES: { id: AffixId; range: [number, number]; /** điểm khi so sánh pháp bảo */ score: number }[] = [
  { id: 'lifesteal', range: [0.02, 0.05], score: 6 },
  { id: 'thorns', range: [0.04, 0.08], score: 3 },
  { id: 'dodge', range: [0.02, 0.05], score: 5 },
  { id: 'crit', range: [0.02, 0.05], score: 5 },
  { id: 'atkPct', range: [0.04, 0.09], score: 4 },
  { id: 'hpPct', range: [0.05, 0.1], score: 2.5 },
  { id: 'defPct', range: [0.05, 0.1], score: 2 },
  { id: 'spd', range: [2, 5], score: 0.03 },
  { id: 'cultivation', range: [0.03, 0.06], score: 10 },
  { id: 'stones', range: [0.05, 0.12], score: 1.5 },
];

export const AFFIX_TIER_SCALE = 0.15;
/** Số dòng thuộc tính phụ theo phẩm (chỉ số trong TIERS) */
export const AFFIX_COUNTS = [0, 1, 2, 3, 3];

// ---------- Bộ trang bị theo khu bí cảnh ----------

export interface SetDef {
  name: string;
  two: Mods;
  four: Mods;
}

/** Cùng thứ tự ZONES: pháp bảo rơi ở khu nào thì thuộc bộ của khu đó */
export const SETS: SetDef[] = [
  { name: 'Thanh Lang', two: { hpPct: 0.06 }, four: { spd: 4, crit: 0.03 } },
  { name: 'Huyết Ma', two: { lifesteal: 0.03 }, four: { burnHit: 0.15 } },
  { name: 'Yêu Hồ', two: { atkPct: 0.05 }, four: { dodge: 0.05, crit: 0.05 } },
  { name: 'Cổ Ma', two: { defPct: 0.08 }, four: { thorns: 0.1 } },
  { name: 'Lôi Đình', two: { crit: 0.04 }, four: { stunHit: 0.08 } },
  { name: 'U Minh', two: { dodge: 0.04 }, four: { lifesteal: 0.04, thorns: 0.06 } },
  { name: 'Tiên Phủ', two: { cultivation: 0.08, stones: 0.12 }, four: { hpPct: 0.06, atkPct: 0.06, defPct: 0.06 } },
  { name: 'Hỗn Độn', two: { atkPct: 0.06, hpPct: 0.06 }, four: { stunHit: 0.06, burnHit: 0.2, lifesteal: 0.04 } },
];

// ---------- Cường hóa ----------

export const ENHANCE_MAX = 10;
/** Tỉ lệ thành công khi cường hóa từ +n lên +(n+1) */
export const ENHANCE_RATES = [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.45, 0.35, 0.25, 0.15];
/** Mỗi cấp cộng thêm vào chỉ số gốc của pháp bảo */
export const ENHANCE_BONUS = 0.08;
/** Chi phí = linh thạch thưởng tầng của pháp bảo × hệ số × (n+1). Thất bại mất chi phí, pháp bảo giữ nguyên. */
export const ENHANCE_COST = 0.4;
/** Bán pháp bảo đã cường hóa được thêm mỗi cấp */
export const ENHANCE_SELL_BONUS = 0.3;
