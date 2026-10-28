// Kiểu dữ liệu, tra cứu cảnh giới và các hàm tiện ích dùng chung cho toàn engine.

import type { AffixId } from './gear';
import type { NatalState } from './natal';
import type { SkillId } from './skills';
import type { TechId } from './techniques';
import {
  BASIC_ELEMENTS,
  type Element,
  LOG_LIMIT,
  type PathId,
  type PillId,
  REALMS,
  ROOT_TIERS,
  type SeclusionId,
  type Slot,
  STAGE_GROWTH,
  VARIANT_ELEMENTS,
} from './data';

export type Rng = () => number;

export interface SpiritRoot {
  tier: number; // chỉ số trong ROOT_TIERS
  elements: Element[];
}

export interface Seclusion {
  id: SeclusionId;
  start: number;
  end: number;
  gained: number;
}

export interface LogEntry {
  time: number;
  text: string;
  kind: 'info' | 'good' | 'bad';
}

export interface ItemAffix {
  id: AffixId;
  v: number;
}

export interface Item {
  id: number;
  slot: Slot;
  tier: number;
  /** Tầng bí cảnh rơi ra, quyết định chỉ số và bộ trang bị */
  floor: number;
  /** Thuộc tính phụ ngẫu nhiên; save cũ không có */
  affixes?: ItemAffix[];
  /** Cấp cường hóa 0..10; save cũ không có */
  plus?: number;
}

export interface Farming {
  floor: number;
  start: number;
  /** Số giây đã tích lũy chưa đủ một lượt nhận thưởng */
  carry: number;
}

/** Một đòn đánh trong trận, dùng để phát lại hoạt ảnh */
export interface BattleEvent {
  /** 'p' = người chơi ra đòn, 'e' = đối thủ ra đòn */
  by: 'p' | 'e';
  /** Bên chịu tác dụng; save cũ không có (mặc định là bên kia) */
  target?: 'p' | 'e';
  dmg: number;
  crit: boolean;
  /** Tên võ kỹ nếu đòn này là chiêu thức */
  skill?: string;
  fx?: 'hit' | 'miss' | 'burn' | 'thorns' | 'stun' | 'heal' | 'shield' | 'buff' | 'cleanse';
  /** Lượng hồi máu / khiên */
  amount?: number;
  /** Khí huyết còn lại của hai bên sau đòn này */
  hpP: number;
  hpE: number;
}

export interface BattleReport {
  floor: number;
  enemy: string;
  win: boolean;
  lines: string[];
  time: number;
  /** Có từ bản thêm hình ảnh; save cũ không có */
  events?: BattleEvent[];
  maxHpP?: number;
  maxHpE?: number;
}

/** Các công tắc tự động hóa; chạy cả khi offline */
export interface AutoSettings {
  /** Tự khiêu chiến tầng kế tiếp */
  climb: boolean;
  /** Tự dùng pháp bảo mới nhặt nếu mạnh hơn */
  equip: boolean;
  /** Tự bán pháp bảo mới nhặt nếu kém hơn đồ đang dùng */
  sell: boolean;
  /** Bế quan xong tự bế quan lại cùng loại */
  reclusion: boolean;
  /** Pháp bảo kém hơn nhặt được thì luyện hóa cho bản mệnh (ưu tiên hơn tự bán) */
  devour: boolean;
  /** Bị thương thì tự dùng Hồi Xuân Đan */
  heal: boolean;
}

export interface Stats {
  battlesWon: number;
  battlesLost: number;
  breakthroughs: number;
  breakthroughFails: number;
  seclusions: number;
  itemsFound: number;
}

export interface GameState {
  version: 6;
  name: string;
  root: SpiritRoot;
  /** Chỉ số tầng đã "trải phẳng" qua mọi cảnh giới */
  level: number;
  cultivation: number;
  stones: number;
  pills: Record<PillId, number>;
  /** Tỉ lệ cộng thêm tích lũy từ các lần đột phá thất bại */
  failBonus: number;
  injuryUntil: number;
  seclusion: Seclusion | null;
  log: LogEntry[];
  lastTick: number;
  createdAt: number;
  // --- giai đoạn 1 ---
  path: PathId | null;
  gear: Record<Slot, Item | null>;
  bag: Item[];
  fragments: number;
  /** Tầng bí cảnh cao nhất đã vượt (0 = chưa vượt tầng nào) */
  floor: number;
  farming: Farming | null;
  nextItemId: number;
  lastBattle: BattleReport | null;
  // --- tiện ích ---
  auto: AutoSettings;
  stats: Stats;
  /** Chiến lực lúc tự khiêu chiến thua; chỉ thử lại khi chiến lực vượt mức này */
  climbBlockedPower: number;
  /** Thời điểm (ms) lần tự khiêu chiến kế tiếp */
  nextClimbAt: number;
  // --- võ kỹ ---
  /** Võ kỹ đã học và cấp */
  skills: Partial<Record<SkillId, number>>;
  /** Võ kỹ mang theo, theo thứ tự ưu tiên */
  loadout: SkillId[];
  // --- thư viện công pháp ---
  /** Công pháp đã học và tầng (có mặt trong bảng = đã học, kể cả tầng 0) */
  techs: Partial<Record<TechId, number>>;
  /** Công pháp chính đang dùng */
  mainTech: TechId | null;
  /** Công pháp phụ đang dùng (tối đa 2) */
  subTechs: TechId[];
  // --- bản mệnh pháp bảo ---
  natal: NatalState | null;
}

// ---------- Tầng / cảnh giới ----------

interface LevelInfo {
  realm: number;
  stage: number;
}

const LEVELS: LevelInfo[] = REALMS.flatMap((r, realm) =>
  r.stages.map((_, stage) => ({ realm, stage })),
);

export const MAX_LEVEL = LEVELS.length - 1;

export function levelInfo(level: number): LevelInfo {
  return LEVELS[level];
}

export function realmOf(s: GameState): number {
  return LEVELS[s.level].realm;
}

export function levelName(level: number): string {
  const { realm, stage } = LEVELS[level];
  return `${REALMS[realm].name} ${REALMS[realm].stages[stage]}`;
}

export function requiredFor(level: number): number {
  const { realm, stage } = LEVELS[level];
  return REALMS[realm].baseReq * STAGE_GROWTH ** stage;
}

/** Tầng cuối của một cảnh giới: muốn lên tiếp phải đột phá thủ công */
export function isBottleneck(level: number): boolean {
  const { realm, stage } = LEVELS[level];
  return stage === REALMS[realm].stages.length - 1;
}

/** Tổng tu vi tích lũy từ đầu, dùng để so sánh tiến độ */
export function totalCultivation(level: number, cultivation: number): number {
  let sum = cultivation;
  for (let i = 0; i < level; i++) sum += requiredFor(i);
  return sum;
}

// ---------- Linh căn ----------

export function rollRoot(rng: Rng): SpiritRoot {
  const tier = weightedPick(
    ROOT_TIERS.map((t) => t.weight),
    rng,
  );
  const count = ROOT_TIERS[tier].count;
  if (count === 0) {
    return { tier, elements: [VARIANT_ELEMENTS[Math.floor(rng() * VARIANT_ELEMENTS.length)]] };
  }
  const pool = [...BASIC_ELEMENTS];
  const elements: Element[] = [];
  for (let i = 0; i < count; i++) {
    elements.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return { tier, elements };
}

export function rootName(root: SpiritRoot): string {
  return ROOT_TIERS[root.tier].name;
}

// ---------- Tiện ích ----------

export function isInjured(s: GameState, time: number): boolean {
  return s.injuryUntil > time;
}

export function addLog(s: GameState, time: number, text: string, kind: LogEntry['kind'] = 'info') {
  s.log.unshift({ time, text, kind });
  if (s.log.length > LOG_LIMIT) s.log.length = LOG_LIMIT;
}

/** Chọn ngẫu nhiên theo trọng số, trả về chỉ số */
export function weightedPick(weights: number[], rng: Rng): number {
  const total = weights.reduce((a, w) => a + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '∞';
  const abs = Math.abs(n);
  if (abs < 1000) return abs < 10 ? n.toFixed(1) : Math.floor(n).toString();
  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier >= SUFFIXES.length) return n.toExponential(2);
  return (n / 1000 ** tier).toFixed(2) + SUFFIXES[tier];
}

export function formatDuration(seconds: number): string {
  const sec = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  const pad = (x: number) => x.toString().padStart(2, '0');
  return h > 0 ? `${h}g ${pad(m)}p ${pad(ss)}s` : `${m}p ${pad(ss)}s`;
}
