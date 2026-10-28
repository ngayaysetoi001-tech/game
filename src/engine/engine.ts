// Logic game thuần (không phụ thuộc giao diện). Mọi hàm hành động nhận state cũ
// và trả về state mới; thời gian (`now`, ms) và hàm ngẫu nhiên (`rng`) được truyền
// vào để test được một cách tất định.

import {
  BASE_RATE,
  BASE_STONE_RATE,
  BASIC_ELEMENTS,
  BREAK_PILL_BONUS,
  type Element,
  FAIL_BONUS_MAX,
  FAIL_BONUS_STEP,
  FAIL_CULTIVATION_LOSS,
  INJURY_RATE_MULT,
  INJURY_SECONDS,
  LOG_LIMIT,
  MAX_BREAK_CHANCE,
  MAX_BREAK_PILLS,
  OFFLINE_CAP_HOURS,
  PILLS,
  type PillId,
  REALMS,
  ROOT_TIERS,
  SECLUSIONS,
  type SeclusionId,
  STAGE_GROWTH,
  STARTING_STONES,
  TU_KHI_SECONDS,
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

export interface GameState {
  version: 1;
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
  const totalWeight = ROOT_TIERS.reduce((a, t) => a + t.weight, 0);
  let r = rng() * totalWeight;
  let tier = ROOT_TIERS.length - 1;
  for (let i = 0; i < ROOT_TIERS.length; i++) {
    r -= ROOT_TIERS[i].weight;
    if (r < 0) {
      tier = i;
      break;
    }
  }
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

// ---------- Tốc độ ----------

/** Tốc độ tu luyện gốc (không tính bế quan / thương thế) */
export function baseRate(s: GameState): number {
  return BASE_RATE * REALMS[LEVELS[s.level].realm].rateMult * ROOT_TIERS[s.root.tier].rateMult;
}

export function isInjured(s: GameState, time: number): boolean {
  return s.injuryUntil > time;
}

export function cultivationRate(s: GameState, time: number): number {
  let rate = baseRate(s);
  if (s.seclusion && time < s.seclusion.end) rate *= seclusionDef(s.seclusion.id).rateMult;
  if (isInjured(s, time)) rate *= INJURY_RATE_MULT;
  return rate;
}

export function stoneRate(s: GameState): number {
  return BASE_STONE_RATE * 2 ** LEVELS[s.level].realm;
}

export function seclusionDef(id: SeclusionId) {
  return SECLUSIONS.find((d) => d.id === id)!;
}

// ---------- Tạo game ----------

export function newGame(name: string, root: SpiritRoot, now: number): GameState {
  const s: GameState = {
    version: 1,
    name: name.trim() || 'Vô Danh',
    root,
    level: 0,
    cultivation: 0,
    stones: STARTING_STONES,
    pills: { tuKhi: 0, phaCanh: 0, hoiXuan: 0 },
    failBonus: 0,
    injuryUntil: 0,
    seclusion: null,
    log: [],
    lastTick: now,
    createdAt: now,
  };
  addLog(s, now, `${s.name} bước lên con đường tu tiên với ${rootName(root)} (${root.elements.join(', ')}).`, 'good');
  return s;
}

// ---------- Vòng lặp thời gian ----------

function clone(s: GameState): GameState {
  return structuredClone(s);
}

function addLog(s: GameState, time: number, text: string, kind: LogEntry['kind'] = 'info') {
  s.log.unshift({ time, text, kind });
  if (s.log.length > LOG_LIMIT) s.log.length = LOG_LIMIT;
}

/** Cộng tu vi, tự lên tầng nhỏ, dừng ở bình cảnh. Trả về lượng thực sự nhận được. */
function gainCultivation(s: GameState, amount: number, time: number): number {
  s.cultivation += amount;
  let wasted = 0;
  for (;;) {
    const req = requiredFor(s.level);
    if (isBottleneck(s.level)) {
      if (s.cultivation > req) {
        wasted = s.cultivation - req;
        s.cultivation = req;
      }
      break;
    }
    if (s.cultivation < req) break;
    s.cultivation -= req;
    s.level++;
    addLog(s, time, `Tu vi tinh tiến, đạt ${levelName(s.level)}.`);
  }
  return amount - wasted;
}

/** Tiến thời gian từ s.lastTick đến now (mutate s) */
function advance(s: GameState, now: number, rng: Rng) {
  let t = s.lastTick;
  while (t < now) {
    // Chia nhỏ tại các mốc làm thay đổi tốc độ (hết bế quan, hết thương thế)
    let next = now;
    if (s.seclusion && s.seclusion.end > t) next = Math.min(next, s.seclusion.end);
    if (s.injuryUntil > t) next = Math.min(next, s.injuryUntil);
    const dt = (next - t) / 1000;
    const gained = gainCultivation(s, cultivationRate(s, t) * dt, next);
    s.stones += stoneRate(s) * dt;
    if (s.seclusion) s.seclusion.gained += gained;
    t = next;
    if (s.seclusion && s.seclusion.end <= t) finishSeclusion(s, t, rng);
  }
  s.lastTick = Math.max(s.lastTick, now);
}

export function tick(prev: GameState, now: number, rng: Rng): GameState {
  if (now <= prev.lastTick) return prev;
  const s = clone(prev);
  advance(s, now, rng);
  return s;
}

/** Bắt đầu một hành động: clone + cập nhật thời gian tới now */
function begin(prev: GameState, now: number, rng: Rng): GameState {
  const s = clone(prev);
  advance(s, now, rng);
  return s;
}

export interface OfflineSummary {
  seconds: number;
  cultivation: number;
  stones: number;
  levelsGained: number;
  /** Tu vi đã đầy ở bình cảnh, phần dư bị lãng phí */
  capped: boolean;
}

/** Gọi khi mở game: tính bù thời gian vắng mặt (tối đa OFFLINE_CAP_HOURS) */
export function applyOffline(
  prev: GameState,
  now: number,
  rng: Rng,
): { state: GameState; summary: OfflineSummary } {
  const s = clone(prev);
  const capStart = now - OFFLINE_CAP_HOURS * 3600_000;
  if (s.lastTick < capStart) {
    // Dời mọi mốc thời gian theo để bế quan / thương thế không "trôi" mất phần bị cắt
    const shift = capStart - s.lastTick;
    s.lastTick = capStart;
    if (s.seclusion) {
      s.seclusion.start += shift;
      s.seclusion.end += shift;
    }
    if (s.injuryUntil > 0) s.injuryUntil += shift;
  }
  const seconds = Math.max(0, (now - s.lastTick) / 1000);
  const before = { total: totalCultivation(s.level, s.cultivation), stones: s.stones, level: s.level };
  advance(s, now, rng);
  return {
    state: s,
    summary: {
      seconds,
      cultivation: totalCultivation(s.level, s.cultivation) - before.total,
      stones: s.stones - before.stones,
      levelsGained: s.level - before.level,
      capped: isBottleneck(s.level) && s.cultivation >= requiredFor(s.level),
    },
  };
}

// ---------- Đột phá ----------

export function breakthroughChance(s: GameState, pills: number): number {
  const target = REALMS[LEVELS[Math.min(s.level + 1, MAX_LEVEL)].realm];
  const chance =
    target.breakChance +
    ROOT_TIERS[s.root.tier].breakBonus +
    s.failBonus +
    Math.min(pills, MAX_BREAK_PILLS) * BREAK_PILL_BONUS;
  return Math.min(MAX_BREAK_CHANCE, chance);
}

export function canBreakthrough(s: GameState): boolean {
  return (
    s.level < MAX_LEVEL &&
    isBottleneck(s.level) &&
    s.cultivation >= requiredFor(s.level) &&
    s.seclusion === null
  );
}

export function breakthrough(prev: GameState, pillsWanted: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canBreakthrough(s)) return s;
  const pills = Math.max(0, Math.min(pillsWanted, s.pills.phaCanh, MAX_BREAK_PILLS));
  const chance = breakthroughChance(s, pills);
  s.pills.phaCanh -= pills;
  const targetRealm = REALMS[LEVELS[s.level + 1].realm].name;
  if (rng() < chance) {
    s.cultivation = 0;
    s.level++;
    s.failBonus = 0;
    addLog(s, now, `Thiên địa chấn động! Đột phá thành công, bước vào ${levelName(s.level)}.`, 'good');
  } else {
    s.cultivation *= 1 - FAIL_CULTIVATION_LOSS;
    s.failBonus = Math.min(FAIL_BONUS_MAX, s.failBonus + FAIL_BONUS_STEP);
    s.injuryUntil = now + INJURY_SECONDS * 1000;
    addLog(
      s,
      now,
      `Đột phá ${targetRealm} thất bại, kinh mạch bị tổn thương, mất ${FAIL_CULTIVATION_LOSS * 100}% tu vi. Lần sau +${Math.round(s.failBonus * 100)}% tỉ lệ.`,
      'bad',
    );
  }
  return s;
}

// ---------- Bế quan ----------

export function startSeclusion(prev: GameState, id: SeclusionId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (s.seclusion) return s;
  const def = seclusionDef(id);
  s.seclusion = { id, start: now, end: now + def.minutes * 60_000, gained: 0 };
  addLog(s, now, `Bắt đầu ${def.name} (${def.minutes} phút, tốc độ ×${def.rateMult}).`);
  return s;
}

export function cancelSeclusion(prev: GameState, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!s.seclusion) return s;
  addLog(s, now, `Xuất quan sớm, bỏ lỡ cơ duyên cuối kỳ bế quan.`);
  s.seclusion = null;
  return s;
}

/** Kết thúc bế quan đúng hạn và tung sự kiện ngẫu nhiên */
function finishSeclusion(s: GameState, time: number, rng: Rng) {
  const sec = s.seclusion!;
  const def = seclusionDef(sec.id);
  s.seclusion = null;
  addLog(s, time, `${def.name} kết thúc, thu được ${formatNumber(sec.gained)} tu vi.`);
  const r = rng();
  if (r < 0.05) {
    const loss = Math.min(s.cultivation, sec.gained * 0.1);
    s.cultivation -= loss;
    addLog(s, time, `Tâm ma quấy nhiễu khi xuất quan, hao tổn ${formatNumber(loss)} tu vi.`, 'bad');
  } else if (r < 0.3) {
    const got = gainCultivation(s, sec.gained * 0.2, time);
    addLog(s, time, `Cơ duyên! Lĩnh ngộ thêm một tầng đạo lý, nhận ${formatNumber(got)} tu vi.`, 'good');
  } else if (r < 0.45) {
    const stones = def.minutes * 60 * stoneRate(s) * 0.5;
    s.stones += stones;
    addLog(s, time, `Phát hiện mạch khoáng nhỏ trong động phủ, nhận ${formatNumber(stones)} linh thạch.`, 'good');
  } else if (r < 0.55) {
    s.pills.phaCanh++;
    addLog(s, time, `Nhặt được một viên ${PILLS.phaCanh.name} do tiền bối để lại!`, 'good');
  } else {
    addLog(s, time, 'Xuất quan bình an.');
  }
}

// ---------- Đan dược ----------

export function pillPrice(s: GameState, id: PillId): number {
  return PILLS[id].basePrice * PILLS[id].priceGrowth ** LEVELS[s.level].realm;
}

export function buyPill(prev: GameState, id: PillId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const price = pillPrice(s, id);
  if (s.stones < price) return s;
  s.stones -= price;
  s.pills[id]++;
  return s;
}

export function canUsePill(s: GameState, id: PillId, now: number): boolean {
  if (s.pills[id] <= 0) return false;
  if (id === 'tuKhi') return !(isBottleneck(s.level) && s.cultivation >= requiredFor(s.level));
  if (id === 'hoiXuan') return isInjured(s, now);
  return false; // Phá Cảnh Đan dùng qua nút đột phá
}

export function usePill(prev: GameState, id: PillId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canUsePill(s, id, now)) return s;
  s.pills[id]--;
  if (id === 'tuKhi') {
    const got = gainCultivation(s, baseRate(s) * TU_KHI_SECONDS, now);
    addLog(s, now, `Phục dụng ${PILLS.tuKhi.name}, nhận ${formatNumber(got)} tu vi.`);
  } else if (id === 'hoiXuan') {
    s.injuryUntil = 0;
    addLog(s, now, `Phục dụng ${PILLS.hoiXuan.name}, thương thế lành hẳn.`, 'good');
  }
  return s;
}

// ---------- Lưu / tải ----------

export const SAVE_KEY = 'tu-tien-nhan-roi:save';

export function serialize(s: GameState): string {
  return JSON.stringify(s);
}

export function deserialize(raw: string): GameState | null {
  try {
    const s = JSON.parse(raw) as GameState;
    if (s?.version !== 1 || typeof s.level !== 'number' || typeof s.lastTick !== 'number') return null;
    if (s.level < 0 || s.level > MAX_LEVEL || !ROOT_TIERS[s.root?.tier]) return null;
    return s;
  } catch {
    return null;
  }
}

/** Chuỗi base64 (hỗ trợ tiếng Việt) để sao lưu / chuyển máy */
export function exportSave(s: GameState): string {
  const bytes = new TextEncoder().encode(serialize(s));
  return btoa(String.fromCharCode(...bytes));
}

export function importSave(code: string): GameState | null {
  try {
    const bin = atob(code.trim());
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return deserialize(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

// ---------- Định dạng ----------

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
