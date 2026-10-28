// Logic game thuần (không phụ thuộc giao diện). Mọi hàm hành động nhận state cũ
// và trả về state mới; thời gian (`now`, ms) và hàm ngẫu nhiên (`rng`) được truyền
// vào để test được một cách tất định.

import {
  BAG_LIMIT,
  BASE_RATE,
  BASE_STONE_RATE,
  BASE_TECH,
  BREAK_PILL_BONUS,
  DEFEAT_INJURY_SECONDS,
  FAIL_BONUS_MAX,
  FAIL_BONUS_STEP,
  FARM_CULTIVATION_MULT,
  FARM_FRAGMENT_CHANCE,
  FARM_ITEM_CHANCE,
  FARM_STONE_SHARE,
  FARM_TICK_SECONDS,
  INJURY_RATE_MULT,
  INJURY_SECONDS,
  MAX_BREAK_CHANCE,
  MAX_BREAK_PILLS,
  MAX_FLOOR,
  OFFLINE_CAP_HOURS,
  PATHS,
  PATH_UNLOCK_LEVEL,
  type PathId,
  PILLS,
  type PillId,
  REALMS,
  ROOT_TIERS,
  SECLUSIONS,
  type SeclusionId,
  STARTING_STONES,
  TIERS,
  TU_KHI_SECONDS,
  floorStones,
  pathLevelCap,
  techCost,
} from './data';
import {
  cultivationBonus,
  enemyFor,
  isBossFloor,
  itemName,
  itemScore,
  itemSellPrice,
  playerStats,
  rollItem,
  simulateBattle,
  zoneOf,
} from './combat';
import {
  MAX_LEVEL,
  type GameState,
  type Item,
  type Rng,
  type SpiritRoot,
  addLog,
  formatNumber,
  isBottleneck,
  isInjured,
  levelInfo,
  levelName,
  realmOf,
  requiredFor,
  rootName,
  totalCultivation,
} from './state';

export * from './state';
export * from './combat';

// ---------- Tốc độ ----------

/** Tốc độ tu luyện gốc (không tính bế quan / lịch luyện / thương thế) */
export function baseRate(s: GameState): number {
  return BASE_RATE * REALMS[realmOf(s)].rateMult * ROOT_TIERS[s.root.tier].rateMult * cultivationBonus(s);
}

export function cultivationRate(s: GameState, time: number): number {
  let rate = baseRate(s);
  if (s.seclusion && time < s.seclusion.end) rate *= seclusionDef(s.seclusion.id).rateMult;
  if (s.farming) rate *= FARM_CULTIVATION_MULT;
  if (isInjured(s, time)) rate *= INJURY_RATE_MULT;
  return rate;
}

export function stoneRate(s: GameState): number {
  return BASE_STONE_RATE * 2 ** realmOf(s);
}

export function seclusionDef(id: SeclusionId) {
  return SECLUSIONS.find((d) => d.id === id)!;
}

function injure(s: GameState, time: number, seconds: number) {
  const mult = s.path ? PATHS[s.path].injuryMult : 1;
  s.injuryUntil = Math.max(s.injuryUntil, time + seconds * mult * 1000);
}

// ---------- Tạo game ----------

export function newGame(name: string, root: SpiritRoot, now: number): GameState {
  const s: GameState = {
    version: 2,
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
    path: null,
    tech: { base: 0, path: 0 },
    gear: { weapon: null, armor: null, pendant: null },
    bag: [],
    fragments: 0,
    floor: 0,
    farming: null,
    nextItemId: 1,
    lastBattle: null,
  };
  addLog(s, now, `${s.name} bước lên con đường tu tiên với ${rootName(root)} (${root.elements.join(', ')}).`, 'good');
  return s;
}

// ---------- Vòng lặp thời gian ----------

function clone(s: GameState): GameState {
  return structuredClone(s);
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
    if (s.farming) {
      s.farming.carry += dt;
      while (s.farming.carry >= FARM_TICK_SECONDS) {
        s.farming.carry -= FARM_TICK_SECONDS;
        farmLoot(s, next, rng);
      }
    }
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
  items: number;
  fragments: number;
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
  const before = {
    total: totalCultivation(s.level, s.cultivation),
    stones: s.stones,
    level: s.level,
    items: s.nextItemId,
    fragments: s.fragments,
  };
  advance(s, now, rng);
  return {
    state: s,
    summary: {
      seconds,
      cultivation: totalCultivation(s.level, s.cultivation) - before.total,
      stones: s.stones - before.stones,
      levelsGained: s.level - before.level,
      items: s.nextItemId - before.items,
      fragments: s.fragments - before.fragments,
      capped: isBottleneck(s.level) && s.cultivation >= requiredFor(s.level),
    },
  };
}

// ---------- Đột phá ----------

export function breakthroughChance(s: GameState, pills: number): number {
  const target = REALMS[levelInfo(Math.min(s.level + 1, MAX_LEVEL)).realm];
  const chance =
    target.breakChance +
    ROOT_TIERS[s.root.tier].breakBonus +
    s.failBonus +
    Math.min(pills, MAX_BREAK_PILLS) * BREAK_PILL_BONUS;
  return Math.min(MAX_BREAK_CHANCE, chance);
}

/** Tầng bí cảnh cần vượt để đột phá lên cảnh giới kế tiếp (0 nếu không cần) */
export function gateFloorFor(s: GameState): number {
  if (s.level >= MAX_LEVEL) return 0;
  return REALMS[levelInfo(s.level + 1).realm].gateFloor;
}

export function canBreakthrough(s: GameState): boolean {
  return (
    s.level < MAX_LEVEL &&
    isBottleneck(s.level) &&
    s.cultivation >= requiredFor(s.level) &&
    s.seclusion === null &&
    s.floor >= gateFloorFor(s)
  );
}

export function breakthrough(prev: GameState, pillsWanted: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canBreakthrough(s)) return s;
  const pills = Math.max(0, Math.min(pillsWanted, s.pills.phaCanh, MAX_BREAK_PILLS));
  const chance = breakthroughChance(s, pills);
  s.pills.phaCanh -= pills;
  const targetRealm = REALMS[levelInfo(s.level + 1).realm].name;
  if (rng() < chance) {
    s.cultivation = 0;
    s.level++;
    s.failBonus = 0;
    addLog(s, now, `Thiên địa chấn động! Đột phá thành công, bước vào ${levelName(s.level)}.`, 'good');
    if (s.level === PATH_UNLOCK_LEVEL && !s.path) {
      addLog(s, now, 'Đạo cơ đã thành, có thể chọn hướng tu trong mục Nhân Vật.', 'good');
    }
  } else {
    const loss = s.path ? PATHS[s.path].failLoss : PATHS.kiem.failLoss;
    s.cultivation *= 1 - loss;
    s.failBonus = Math.min(FAIL_BONUS_MAX, s.failBonus + FAIL_BONUS_STEP);
    injure(s, now, INJURY_SECONDS);
    addLog(
      s,
      now,
      `Đột phá ${targetRealm} thất bại, kinh mạch bị tổn thương, mất ${Math.round(loss * 100)}% tu vi. Lần sau +${Math.round(s.failBonus * 100)}% tỉ lệ.`,
      'bad',
    );
  }
  return s;
}

// ---------- Bế quan ----------

export function startSeclusion(prev: GameState, id: SeclusionId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (s.seclusion || s.farming) return s;
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
  } else if (r < 0.25) {
    const got = gainCultivation(s, sec.gained * 0.2, time);
    addLog(s, time, `Cơ duyên! Lĩnh ngộ thêm một tầng đạo lý, nhận ${formatNumber(got)} tu vi.`, 'good');
  } else if (r < 0.37) {
    const stones = def.minutes * 60 * stoneRate(s) * 0.5;
    s.stones += stones;
    addLog(s, time, `Phát hiện mạch khoáng nhỏ trong động phủ, nhận ${formatNumber(stones)} linh thạch.`, 'good');
  } else if (r < 0.47) {
    s.pills.phaCanh++;
    addLog(s, time, `Nhặt được một viên ${PILLS.phaCanh.name} do tiền bối để lại!`, 'good');
  } else if (r < 0.57) {
    const n = Math.max(1, Math.round(def.minutes / 30));
    s.fragments += n;
    addLog(s, time, `Trong lúc tĩnh tọa ngộ ra ${n} trang tàn quyển công pháp.`, 'good');
  } else {
    addLog(s, time, 'Xuất quan bình an.');
  }
}

// ---------- Bí cảnh ----------

export function canChallenge(s: GameState): boolean {
  return s.floor < MAX_FLOOR && s.seclusion === null;
}

/** Cất pháp bảo vào túi; túi đầy thì tự bán. Trả về true nếu cất được. */
function addItem(s: GameState, it: Item): boolean {
  if (s.bag.length >= BAG_LIMIT) {
    s.stones += itemSellPrice(it);
    return false;
  }
  s.bag.push(it);
  return true;
}

function newItem(s: GameState, floor: number, boss: boolean, rng: Rng): Item {
  return rollItem(floor, boss, rng, s.nextItemId++);
}

export function challengeFloor(prev: GameState, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canChallenge(s)) return s;
  const floor = s.floor + 1;
  const enemy = enemyFor(floor);
  const result = simulateBattle(playerStats(s, now), enemy, rng);
  s.lastBattle = { floor, enemy: enemy.name, win: result.win, lines: result.lines, time: now };
  if (result.win) {
    const boss = isBossFloor(floor);
    s.floor = floor;
    const stones = floorStones(floor);
    const fragments = boss ? 3 : 1;
    s.stones += stones;
    s.fragments += fragments;
    const it = newItem(s, floor, boss, rng);
    const kept = addItem(s, it);
    addLog(
      s,
      now,
      `Vượt tầng ${floor} ${zoneOf(floor).name}, hạ ${enemy.name}. Nhận ${formatNumber(stones)} linh thạch, ${fragments} tàn quyển, ${TIERS[it.tier].name} ${itemName(it)}${kept ? '' : ' (túi đầy, đã bán)'}.`,
      'good',
    );
  } else {
    injure(s, now, DEFEAT_INJURY_SECONDS);
    addLog(s, now, `Bại trận trước ${enemy.name} ở tầng ${floor}, bị thương phải rút lui.`, 'bad');
  }
  return s;
}

export function startFarming(prev: GameState, floor: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (s.seclusion || s.farming || floor < 1 || floor > s.floor) return s;
  s.farming = { floor, start: now, carry: 0 };
  addLog(s, now, `Bắt đầu lịch luyện ở tầng ${floor} ${zoneOf(floor).name}.`);
  return s;
}

export function stopFarming(prev: GameState, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!s.farming) return s;
  addLog(s, now, `Kết thúc lịch luyện sau ${Math.round((now - s.farming.start) / 60_000)} phút.`);
  s.farming = null;
  return s;
}

function farmLoot(s: GameState, time: number, rng: Rng) {
  const floor = s.farming!.floor;
  s.stones += floorStones(floor) * FARM_STONE_SHARE;
  if (rng() < FARM_FRAGMENT_CHANCE) s.fragments++;
  if (rng() < FARM_ITEM_CHANCE) {
    const it = newItem(s, floor, false, rng);
    const kept = addItem(s, it);
    // Chỉ ghi nhật ký đồ tốt để không bị spam
    if (it.tier >= 2) {
      addLog(s, time, `Lịch luyện nhặt được ${TIERS[it.tier].name} ${itemName(it)}${kept ? '' : ' (túi đầy, đã bán)'}!`, 'good');
    }
  }
}

// ---------- Pháp bảo ----------

export function equipItem(prev: GameState, id: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const idx = s.bag.findIndex((it) => it.id === id);
  if (idx < 0) return s;
  const [it] = s.bag.splice(idx, 1);
  const old = s.gear[it.slot];
  s.gear[it.slot] = it;
  if (old) s.bag.push(old);
  return s;
}

export function sellItem(prev: GameState, id: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const idx = s.bag.findIndex((it) => it.id === id);
  if (idx < 0) return s;
  s.stones += itemSellPrice(s.bag[idx]);
  s.bag.splice(idx, 1);
  return s;
}

/** Pháp bảo trong túi không mạnh hơn đồ đang mặc cùng ô */
export function isWorse(s: GameState, it: Item): boolean {
  const eq = s.gear[it.slot];
  return !!eq && itemScore(it) <= itemScore(eq);
}

export function sellWorse(prev: GameState, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const keep: Item[] = [];
  let total = 0;
  for (const it of s.bag) {
    if (isWorse(s, it)) total += itemSellPrice(it);
    else keep.push(it);
  }
  if (keep.length === s.bag.length) return s;
  addLog(s, now, `Bán ${s.bag.length - keep.length} pháp bảo cũ, thu ${formatNumber(total)} linh thạch.`);
  s.bag = keep;
  s.stones += total;
  return s;
}

// ---------- Công pháp ----------

export function canChoosePath(s: GameState): boolean {
  return !s.path && s.level >= PATH_UNLOCK_LEVEL;
}

export function choosePath(prev: GameState, path: PathId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canChoosePath(s)) return s;
  s.path = path;
  s.tech.path = 1;
  addLog(s, now, `Chọn con đường ${PATHS[path].name}, bắt đầu tu luyện ${PATHS[path].technique}.`, 'good');
  return s;
}

export type TechKind = 'base' | 'path';

export function techMaxLevel(s: GameState, kind: TechKind): number {
  return kind === 'base' ? BASE_TECH.maxLevel : pathLevelCap(realmOf(s));
}

export function techUpgradeCost(s: GameState, kind: TechKind) {
  return techCost(s.tech[kind] + 1, realmOf(s));
}

export function canUpgradeTech(s: GameState, kind: TechKind): boolean {
  if (kind === 'path' && !s.path) return false;
  if (s.tech[kind] >= techMaxLevel(s, kind)) return false;
  const cost = techUpgradeCost(s, kind);
  return s.fragments >= cost.fragments && s.stones >= cost.stones;
}

export function upgradeTech(prev: GameState, kind: TechKind, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canUpgradeTech(s, kind)) return s;
  const cost = techUpgradeCost(s, kind);
  s.fragments -= cost.fragments;
  s.stones -= cost.stones;
  s.tech[kind]++;
  const name = kind === 'base' ? BASE_TECH.name : PATHS[s.path!].technique;
  addLog(s, now, `${name} đạt tầng ${s.tech[kind]}.`);
  return s;
}

// ---------- Đan dược ----------

export function pillPrice(s: GameState, id: PillId): number {
  return PILLS[id].basePrice * PILLS[id].priceGrowth ** realmOf(s);
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

/** Nâng save bản cũ lên bản hiện tại */
function migrate(raw: Record<string, unknown>): GameState | null {
  if (raw.version === 1) {
    // Save MVP: chưa có chiến đấu. Cho vượt sẵn các tầng chặn cảnh giới đã đạt để không bị kẹt.
    const level = raw.level as number;
    const realm = levelInfo(level)?.realm ?? 0;
    return {
      ...(raw as object),
      version: 2,
      path: null,
      tech: { base: 0, path: 0 },
      gear: { weapon: null, armor: null, pendant: null },
      bag: [],
      fragments: 0,
      floor: REALMS[realm].gateFloor,
      farming: null,
      nextItemId: 1,
      lastBattle: null,
    } as unknown as GameState;
  }
  return raw.version === 2 ? (raw as unknown as GameState) : null;
}

export function deserialize(raw: string): GameState | null {
  try {
    const s = migrate(JSON.parse(raw));
    if (!s || typeof s.level !== 'number' || typeof s.lastTick !== 'number') return null;
    if (s.level < 0 || s.level > MAX_LEVEL || !ROOT_TIERS[s.root?.tier]) return null;
    return s;
  } catch {
    return null;
  }
}

/** Chuỗi base64 (hỗ trợ tiếng Việt) để sao lưu / chuyển máy */
export function exportSave(s: GameState): string {
  const bytes = new TextEncoder().encode(serialize(s));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
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
