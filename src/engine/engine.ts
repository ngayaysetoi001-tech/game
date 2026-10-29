// Logic game thuần (không phụ thuộc giao diện). Mọi hàm hành động nhận state cũ
// và trả về state mới; thời gian (`now`, ms) và hàm ngẫu nhiên (`rng`) được truyền
// vào để test được một cách tất định.

import { KIEP_FAIL_LOSS, KIEP_GRADE_NAMES, hasKiep, runKiep } from './kiep';
import { ENHANCE_COST, ENHANCE_MAX, ENHANCE_RATES } from './gear';
import {
  BUILDINGS,
  HERBS,
  RECIPES,
  YIELD,
  type BuildingId,
  type HerbId,
  type Job,
  type Plot,
  type RecipeId,
  bandOfRealm,
  buildingCap,
  buildingCost,
  craftTimeMultAt,
  gradeChancesAt,
  growSeconds,
  growthMultAt,
  herbsOfBand,
  maxBatchAt,
  newDwelling,
  plotCountAt,
  seedCost,
  sellPrice,
  yieldBonusAt,
} from './dwelling';
import { QUESTS, QUEST_BY_ID, QUEST_TIER, type QuestDef } from './quests';
import {
  NATALS,
  NATAL_MAX_LEVEL,
  NATAL_STAGES,
  NATAL_UNLOCK_LEVEL,
  type NatalId,
  natalExpFromItem,
  natalExpNeeded,
  natalStage,
} from './natal';
import {
  GRADE_COST,
  MAIN_CARRY_OVER,
  SUB_SLOTS,
  TECHS,
  type TechId,
  mainTechId,
} from './techniques';
import {
  AUTO_CLIMB_SECONDS,
  BAG_LIMIT,
  BASE_RATE,
  BASE_STONE_RATE,
  BREAK_PILL_BONUS_BY_GRADE,
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
  TOWER_BOSS_FRAGMENTS,
  OFFLINE_CAP_HOURS,
  PATHS,
  PATH_UNLOCK_LEVEL,
  type PathId,
  PILLS,
  type PillId,
  REALMS,
  ROOT_TIERS,
  SECLUSIONS,
  SLOTS,
  type SeclusionId,
  STARTING_STONES,
  TIERS,
  TU_KHI_SECONDS_BY_GRADE,
  emptyPills,
  pillLabel,
  floorStones,
  pathLevelCap,
  techCost,
} from './data';
import {
  BOSS_FRAGMENT_BUNDLES,
  PLAYER_SKILLS,
  SKILLS,
  SKILL_MAX_LEVEL,
  type SkillId,
  skillCost,
  skillSlots,
} from './skills';
import {
  charMods,
  combatPower,
  cultivationBonus,
  enemyFor,
  isBossFloor,
  itemName,
  itemPlus,
  itemScore,
  itemSellPrice,
  playerStats,
  rollItem,
  simulateBattle,
  stoneBonus,
  zoneOf,
} from './combat';
import {
  MAX_LEVEL,
  type AutoSettings,
  type GameState,
  type Item,
  type Stats,
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
export * from './skills';
export * from './gear';
export * from './techniques';
export * from './natal';
export * from './quests';
export * from './dwelling';
export * from './kiep';

// ---------- Tốc độ ----------

/** Tốc độ tu luyện gốc (không tính bế quan / lịch luyện / thương thế) */
export function baseRate(s: GameState): number {
  return BASE_RATE * REALMS[realmOf(s)].rateMult * ROOT_TIERS[s.root.tier].rateMult * cultivationBonus(s);
}

export function cultivationRate(s: GameState, time: number): number {
  let rate = baseRate(s);
  if (s.seclusion && time < s.seclusion.end) rate *= seclusionDef(s.seclusion.id).rateMult * (1 + charMods(s).seclusion);
  if (s.farming) rate *= FARM_CULTIVATION_MULT;
  if (isInjured(s, time)) rate *= INJURY_RATE_MULT;
  return rate;
}

export function stoneRate(s: GameState): number {
  return BASE_STONE_RATE * 2 ** realmOf(s) * stoneBonus(s);
}

export function seclusionDef(id: SeclusionId) {
  return SECLUSIONS.find((d) => d.id === id)!;
}

function injure(s: GameState, time: number, seconds: number) {
  const mult = s.path ? PATHS[s.path].injuryMult : 1;
  s.injuryUntil = Math.max(s.injuryUntil, time + seconds * mult * 1000);
  if (s.auto.heal && s.pills.hoiXuan > 0) {
    s.pills.hoiXuan--;
    s.injuryUntil = 0;
    addLog(s, time, `Tự phục dụng ${PILLS.hoiXuan.name}, thương thế lành hẳn (còn ${s.pills.hoiXuan} viên).`);
  }
}

// ---------- Tạo game ----------

function defaultAuto(): AutoSettings {
  return { climb: false, equip: false, sell: false, reclusion: false, heal: false, devour: false, garden: false };
}

function emptyStats(): Stats {
  return {
    battlesWon: 0,
    battlesLost: 0,
    breakthroughs: 0,
    breakthroughFails: 0,
    seclusions: 0,
    itemsFound: 0,
    planted: 0,
    harvested: 0,
    crafted: 0,
    crafted3: 0,
    craftedBreak: 0,
  };
}

export function newGame(name: string, root: SpiritRoot, now: number): GameState {
  const s: GameState = {
    version: 9,
    name: name.trim() || 'Vô Danh',
    root,
    level: 0,
    cultivation: 0,
    stones: STARTING_STONES,
    pills: emptyPills(),
    failBonus: 0,
    injuryUntil: 0,
    seclusion: null,
    log: [],
    lastTick: now,
    createdAt: now,
    path: null,
    gear: { weapon: null, armor: null, pendant: null, ring: null, boots: null },
    bag: [],
    fragments: 0,
    floor: 0,
    farming: null,
    nextItemId: 1,
    lastBattle: null,
    auto: defaultAuto(),
    stats: emptyStats(),
    climbBlockedPower: 0,
    nextClimbAt: now,
    skills: {},
    loadout: [],
    techs: { dan_khi: 0 },
    mainTech: null,
    subTechs: ['dan_khi'],
    natal: null,
    quests: { claimed: [] },
    dwelling: newDwelling(),
    kiep: {},
    lastKiep: null,
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
    // Tự khiêu chiến đúng hẹn (kiểm tra trước khi dời hẹn kế tiếp)
    if (s.auto.climb && s.nextClimbAt <= t) {
      const ready = autoClimbStatus(s, t).kind === 'ready';
      s.nextClimbAt = t + AUTO_CLIMB_SECONDS * 1000;
      if (ready) fight(s, t, rng, true);
    }
    // Chia nhỏ tại các mốc làm thay đổi tốc độ (hết bế quan, hết thương thế)
    let next = now;
    if (s.seclusion && s.seclusion.end > t) next = Math.min(next, s.seclusion.end);
    if (s.injuryUntil > t) next = Math.min(next, s.injuryUntil);
    if (s.auto.climb && s.nextClimbAt > t) next = Math.min(next, s.nextClimbAt);
    if (s.dwelling.job && s.dwelling.job.end > t) next = Math.min(next, s.dwelling.job.end);
    if (s.auto.garden) {
      for (const plot of s.dwelling.plots) if (plot && plot.end > t) next = Math.min(next, plot.end);
    }
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
    dwellingStep(s, t, rng);
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
  herbs: number;
  pillsMade: number;
  floors: number;
  battlesWon: number;
  battlesLost: number;
  seclusions: number;
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
  const capStart = now - (OFFLINE_CAP_HOURS + charMods(prev).offline) * 3600_000;
  if (s.lastTick < capStart) {
    // Dời mọi mốc thời gian theo để bế quan / thương thế không "trôi" mất phần bị cắt
    const shift = capStart - s.lastTick;
    s.lastTick = capStart;
    if (s.seclusion) {
      s.seclusion.start += shift;
      s.seclusion.end += shift;
    }
    if (s.injuryUntil > 0) s.injuryUntil += shift;
    for (const plot of s.dwelling.plots) {
      if (plot) {
        plot.start += shift;
        plot.end += shift;
      }
    }
    if (s.dwelling.job) {
      s.dwelling.job.start += shift;
      s.dwelling.job.end += shift;
    }
  }
  const seconds = Math.max(0, (now - s.lastTick) / 1000);
  const before = {
    total: totalCultivation(s.level, s.cultivation),
    stones: s.stones,
    level: s.level,
    items: s.nextItemId,
    fragments: s.fragments,
    floor: s.floor,
    stats: { ...s.stats },
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
      herbs: s.stats.harvested - before.stats.harvested,
      pillsMade: s.stats.crafted - before.stats.crafted,
      floors: s.floor - before.floor,
      battlesWon: s.stats.battlesWon - before.stats.battlesWon,
      battlesLost: s.stats.battlesLost - before.stats.battlesLost,
      seclusions: s.stats.seclusions - before.stats.seclusions,
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
    breakPillBonus(s, pills);
  return Math.min(MAX_BREAK_CHANCE, chance);
}

/** Phá Cảnh Đan dùng khi đột phá: phẩm cao trước */
const BREAK_PILLS: PillId[] = ['phaCanh3', 'phaCanh2', 'phaCanh'];

export function breakPillTotal(s: GameState): number {
  return BREAK_PILLS.reduce((a, id) => a + s.pills[id], 0);
}

/** Chọn n viên (tối đa MAX_BREAK_PILLS) từ kho, phẩm cao trước */
export function breakPillPlan(s: GameState, n: number): { id: PillId; count: number }[] {
  let left = Math.max(0, Math.min(n, MAX_BREAK_PILLS));
  const plan: { id: PillId; count: number }[] = [];
  for (const id of BREAK_PILLS) {
    const take = Math.min(left, s.pills[id]);
    if (take > 0) {
      plan.push({ id, count: take });
      left -= take;
    }
  }
  return plan;
}

export function breakPillBonus(s: GameState, n: number): number {
  return breakPillPlan(s, n).reduce((a, p) => a + p.count * BREAK_PILL_BONUS_BY_GRADE[PILLS[p.id].grade], 0);
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

function succeedBreakthrough(s: GameState, now: number) {
  s.cultivation = 0;
  s.level++;
  s.failBonus = 0;
  s.stats.breakthroughs++;
  addLog(s, now, `Thiên địa chấn động! Đột phá thành công, bước vào ${levelName(s.level)}.`, 'good');
  if (s.level === PATH_UNLOCK_LEVEL && !s.path) {
    addLog(s, now, 'Đạo cơ đã thành, có thể chọn hướng tu trong mục Nhân Vật.', 'good');
  }
}

export function breakthrough(prev: GameState, pillsWanted: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canBreakthrough(s)) return s;
  const pills = Math.max(0, Math.min(pillsWanted, breakPillTotal(s), MAX_BREAK_PILLS));
  const chance = breakthroughChance(s, pills);
  for (const p of breakPillPlan(s, pills)) s.pills[p.id] -= p.count;
  const realmIdx = levelInfo(s.level + 1).realm;
  const targetRealm = REALMS[realmIdx].name;
  if (rng() < chance) {
    if (!hasKiep(realmIdx)) {
      succeedBreakthrough(s, now);
    } else {
      const k = runKiep(s, realmIdx, now, rng);
      s.lastKiep = k;
      if (k.pass) {
        s.kiep[realmIdx] = Math.max(s.kiep[realmIdx] ?? 0, k.grade!);
        addLog(
          s,
          now,
          `Thiên Kiếp giáng ${k.bolts} đạo lôi, ${s.name} vượt qua với ${Math.round(k.hp[k.hp.length - 1] * 100)}% khí huyết: kiếp ${KIEP_GRADE_NAMES[k.grade!]}, thể chất tăng vĩnh viễn.`,
          'good',
        );
        succeedBreakthrough(s, now);
      } else {
        s.cultivation *= 1 - KIEP_FAIL_LOSS;
        s.stats.breakthroughFails++;
        injure(s, now, INJURY_SECONDS * 2);
        addLog(
          s,
          now,
          `Thiên Kiếp quá mạnh: ngã xuống ở đạo lôi thứ ${k.hp.length}/${k.bolts}, trọng thương, mất ${KIEP_FAIL_LOSS * 100}% tu vi. Hãy tăng khí huyết, phòng thủ rồi thử lại.`,
          'bad',
        );
      }
    }
  } else {
    const loss = s.path ? PATHS[s.path].failLoss : PATHS.kiem.failLoss;
    s.cultivation *= 1 - loss;
    s.failBonus = Math.min(FAIL_BONUS_MAX, s.failBonus + FAIL_BONUS_STEP);
    s.stats.breakthroughFails++;
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
  s.stats.seclusions++;
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
  if (s.auto.reclusion) {
    if (isBottleneck(s.level) && s.cultivation >= requiredFor(s.level)) {
      addLog(s, time, 'Tu vi đã đầy bình cảnh, ngừng tự bế quan để chuẩn bị đột phá.');
    } else {
      s.seclusion = { id: sec.id, start: time, end: time + def.minutes * 60_000, gained: 0 };
      addLog(s, time, `Tự bế quan lại: ${def.name}.`);
    }
  }
}

// ---------- Bí cảnh ----------

export function canChallenge(s: GameState): boolean {
  return s.seclusion === null;
}

type Stash = 'kept' | 'equipped' | 'sold' | 'full' | 'devoured';

const STASH_NOTE: Record<Stash, string> = {
  kept: '',
  equipped: ' (đã tự trang bị)',
  sold: ' (kém hơn, đã tự bán)',
  full: ' (túi đầy, đã bán)',
  devoured: ' (kém hơn, đã luyện hóa cho bản mệnh)',
};

function isBetter(s: GameState, it: Item): boolean {
  const eq = s.gear[it.slot];
  return !eq || itemScore(it) > itemScore(eq);
}

/** Cất vào túi, túi đầy thì bán */
function stash(s: GameState, it: Item): Stash {
  if (s.bag.length >= BAG_LIMIT) {
    s.stones += itemSellPrice(it);
    return 'full';
  }
  s.bag.push(it);
  return 'kept';
}

/** Món không dùng tới: luyện hóa cho bản mệnh nếu bật, không thì bán nếu bật tự bán. null = không công tắc nào bật */
function disposeSpare(s: GameState, it: Item, time: number): 'devoured' | 'sold' | null {
  if (s.auto.devour && canDevour(s)) {
    gainNatalExp(s, itemDevourExp(it), time);
    return 'devoured';
  }
  if (s.auto.sell) {
    s.stones += itemSellPrice(it);
    return 'sold';
  }
  return null;
}

/** Xử lý trang bị vừa nhặt theo các công tắc tự trang bị / tự bán / tự luyện hóa */
function addItem(s: GameState, it: Item, time: number): Stash {
  s.stats.itemsFound++;
  if (s.auto.equip && isBetter(s, it)) {
    const old = s.gear[it.slot];
    s.gear[it.slot] = it;
    if (old && !disposeSpare(s, old, time)) stash(s, old);
    return 'equipped';
  }
  if (isWorse(s, it)) {
    const how = disposeSpare(s, it, time);
    if (how) return how;
  }
  return stash(s, it);
}

function newItem(s: GameState, floor: number, boss: boolean, rng: Rng): Item {
  return rollItem(floor, boss, rng, s.nextItemId++);
}

export function challengeFloor(prev: GameState, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canChallenge(s)) return s;
  fight(s, now, rng, false);
  return s;
}

/** Đánh tầng kế tiếp (mutate s). auto = do tự khiêu chiến gọi. */
function fight(s: GameState, now: number, rng: Rng, auto: boolean) {
  const floor = s.floor + 1;
  const enemy = enemyFor(floor);
  const player = playerStats(s, now);
  const result = simulateBattle(player, enemy, rng);
  s.lastBattle = {
    floor,
    enemy: enemy.name,
    win: result.win,
    lines: result.lines,
    time: now,
    events: result.events,
    maxHpP: player.hp,
    maxHpE: enemy.hp,
  };
  if (result.win) {
    const boss = isBossFloor(floor);
    s.floor = floor;
    const stones = floorStones(floor) * stoneBonus(s);
    const fragments = boss ? 3 : 1;
    s.stones += stones;
    s.fragments += fragments;
    const it = newItem(s, floor, boss, rng);
    const result = addItem(s, it, now);
    s.stats.battlesWon++;
    if (boss) {
      const bundle = (BOSS_FRAGMENT_BUNDLES[floor] ?? 0) + (floor > MAX_FLOOR ? TOWER_BOSS_FRAGMENTS : 0);
      s.fragments += bundle;
      if (bundle) addLog(s, now, `${enemy.name} để lại ${bundle} trang tàn quyển công pháp.`, 'good');
    }
    s.climbBlockedPower = 0;
    addLog(
      s,
      now,
      `${auto ? '[Tự động] ' : ''}Vượt tầng ${floor} ${zoneOf(floor).name}, hạ ${enemy.name}. Nhận ${formatNumber(stones)} linh thạch, ${fragments} tàn quyển, ${TIERS[it.tier].name} ${itemName(it)}${STASH_NOTE[result]}.`,
      'good',
    );
    if (boss) {
      grantEarnedSkills(s, now);
      grantEarnedTechs(s, now);
    }
  } else {
    s.stats.battlesLost++;
    // Không thử lại cho tới khi mạnh hơn lúc thua
    s.climbBlockedPower = combatPower(player);
    injure(s, now, DEFEAT_INJURY_SECONDS);
    addLog(
      s,
      now,
      `${auto ? '[Tự động] ' : ''}Bại trận trước ${enemy.name} ở tầng ${floor}, bị thương phải rút lui.${auto ? ' Tạm dừng tự khiêu chiến tới khi chiến lực tăng.' : ''}`,
      'bad',
    );
  }
}

export type AutoClimbStatus =
  | { kind: 'off' | 'seclusion' | 'ready' }
  | { kind: 'injured'; seconds: number }
  | { kind: 'blocked'; power: number; need: number }
  | { kind: 'waiting'; seconds: number };

/** Tình trạng tự khiêu chiến, để engine quyết định và giao diện hiển thị */
export function autoClimbStatus(s: GameState, now: number): AutoClimbStatus {
  if (!s.auto.climb) return { kind: 'off' };
  if (s.seclusion) return { kind: 'seclusion' };
  if (isInjured(s, now)) return { kind: 'injured', seconds: (s.injuryUntil - now) / 1000 };
  const power = combatPower(playerStats(s, now));
  if (s.climbBlockedPower > 0 && power <= s.climbBlockedPower) {
    return { kind: 'blocked', power, need: s.climbBlockedPower };
  }
  if (s.nextClimbAt > now) return { kind: 'waiting', seconds: (s.nextClimbAt - now) / 1000 };
  return { kind: 'ready' };
}

export function setAuto(prev: GameState, key: keyof AutoSettings, value: boolean, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  s.auto[key] = value;
  // Bật tự khiêu chiến thì thử ngay ở nhịp kế tiếp
  if (key === 'climb' && value) s.nextClimbAt = now;
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
  s.stones += floorStones(floor) * FARM_STONE_SHARE * stoneBonus(s);
  if (rng() < FARM_FRAGMENT_CHANCE) s.fragments++;
  if (rng() < FARM_ITEM_CHANCE) {
    // Lịch luyện ở tầng thủ lĩnh rơi đồ tốt như thủ lĩnh
    const it = newItem(s, floor, isBossFloor(floor), rng);
    const result = addItem(s, it, time);
    // Chỉ ghi nhật ký đồ tốt hoặc vừa tự trang bị, để không bị spam
    if (it.tier >= 2 || result === 'equipped') {
      addLog(s, time, `Lịch luyện nhặt được ${TIERS[it.tier].name} ${itemName(it)}${STASH_NOTE[result]}!`, it.tier >= 2 ? 'good' : 'info');
    }
  }
}

// ---------- Trang bị ----------

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

/** Trang bị trong túi không mạnh hơn đồ đang mặc cùng ô */
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
  addLog(s, now, `Bán ${s.bag.length - keep.length} trang bị cũ, thu ${formatNumber(total)} linh thạch.`);
  s.bag = keep;
  s.stones += total;
  return s;
}

// ---------- Cường hóa ----------

export function findItem(s: GameState, id: number): Item | undefined {
  return SLOTS.map((slot) => s.gear[slot]).find((it) => it?.id === id) ?? s.bag.find((it) => it.id === id);
}

export function enhanceCost(it: Item): number {
  return floorStones(it.floor) * ENHANCE_COST * (itemPlus(it) + 1);
}

export function enhanceChance(it: Item): number {
  return ENHANCE_RATES[itemPlus(it)] ?? 0;
}

export function canEnhance(s: GameState, it: Item): boolean {
  return itemPlus(it) < ENHANCE_MAX && s.stones >= enhanceCost(it);
}

/** Thất bại chỉ mất linh thạch, trang bị giữ nguyên cấp */
export function enhanceItem(prev: GameState, id: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const it = findItem(s, id);
  if (!it || !canEnhance(s, it)) return s;
  s.stones -= enhanceCost(it);
  const name = `${itemName(it)} (${TIERS[it.tier].name})`;
  if (rng() < enhanceChance(it)) {
    it.plus = itemPlus(it) + 1;
    addLog(s, now, `Cường hóa thành công! ${name} lên +${it.plus}.`, 'good');
  } else {
    addLog(s, now, `Cường hóa ${name} thất bại, mất linh thạch nhưng trang bị vẫn giữ +${itemPlus(it)}.`, 'bad');
  }
  return s;
}

// ---------- Động phủ ----------

export function buildingLevel(s: GameState, id: BuildingId): number {
  return s.dwelling.levels[id];
}

export function buildingLevelCap(s: GameState): number {
  return buildingCap(realmOf(s));
}

export function buildingUnlocked(s: GameState, id: BuildingId): boolean {
  return realmOf(s) >= BUILDINGS[id].unlockRealm;
}

export function buildingNextCost(s: GameState, id: BuildingId): number {
  return buildingCost(id, buildingLevel(s, id) + 1);
}

export function canUpgradeBuilding(s: GameState, id: BuildingId): boolean {
  return (
    buildingUnlocked(s, id) && buildingLevel(s, id) < buildingLevelCap(s) && s.stones >= buildingNextCost(s, id)
  );
}

export function upgradeBuilding(prev: GameState, id: BuildingId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canUpgradeBuilding(s, id)) return s;
  s.stones -= buildingNextCost(s, id);
  s.dwelling.levels[id]++;
  addLog(s, now, `${BUILDINGS[id].name} lên cấp ${s.dwelling.levels[id]}.`, 'good');
  return s;
}

export function plotCount(s: GameState): number {
  return plotCountAt(s.dwelling.levels.linh_dien);
}

/** Hai loại thảo dược trồng được ở cảnh giới hiện tại: phổ thông và hiếm */
export function plantableHerbs(s: GameState): HerbId[] {
  const h = herbsOfBand(bandOfRealm(realmOf(s)));
  return [h.common, h.rare];
}

export function growMs(s: GameState, herb: HerbId): number {
  return growSeconds(herb) * growthMultAt(s.dwelling.levels.linh_dien) * 1000;
}

export function herbCount(s: GameState, id: HerbId): number {
  return s.dwelling.herbs[id] ?? 0;
}

export function canPlant(s: GameState, idx: number, herb: HerbId): boolean {
  return (
    idx >= 0 && idx < plotCount(s) && !s.dwelling.plots[idx] && plantableHerbs(s).includes(herb) && s.stones >= seedCost(herb)
  );
}

function plantInto(s: GameState, idx: number, herb: HerbId, time: number) {
  s.stones -= seedCost(herb);
  s.dwelling.plots[idx] = { herb, start: time, end: time + growMs(s, herb) };
  s.stats.planted++;
}

export function plantHerb(prev: GameState, idx: number, herb: HerbId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canPlant(s, idx, herb)) return s;
  plantInto(s, idx, herb, now);
  return s;
}

/** Gieo cùng một loại vào mọi ô trống, tới khi hết linh thạch */
export function plantAll(prev: GameState, herb: HerbId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  for (let i = 0; i < plotCount(s); i++) if (canPlant(s, i, herb)) plantInto(s, i, herb, now);
  return s;
}

export function plotReady(s: GameState, idx: number, time: number): boolean {
  const p = s.dwelling.plots[idx];
  return !!p && time >= p.end;
}

export function readyPlots(s: GameState, time: number): number {
  return s.dwelling.plots.filter((p, i) => i < plotCount(s) && p && time >= p.end).length;
}

/** Thu hoạch một ô đã chín; trả số thảo dược nhận được */
function harvestInto(s: GameState, plot: Plot, rng: Rng): number {
  let n = YIELD[0] + Math.floor(rng() * (YIELD[1] - YIELD[0] + 1));
  if (rng() < yieldBonusAt(s.dwelling.levels.linh_dien)) n++;
  s.dwelling.herbs[plot.herb] = herbCount(s, plot.herb) + n;
  s.stats.harvested += n;
  return n;
}

export function harvestPlot(prev: GameState, idx: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const plot = s.dwelling.plots[idx];
  if (!plot || now < plot.end) return s;
  harvestInto(s, plot, rng);
  s.dwelling.plots[idx] = null;
  return s;
}

export function harvestAll(prev: GameState, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const total: Partial<Record<HerbId, number>> = {};
  for (let i = 0; i < s.dwelling.plots.length; i++) {
    const plot = s.dwelling.plots[i];
    if (!plot || now < plot.end) continue;
    total[plot.herb] = (total[plot.herb] ?? 0) + harvestInto(s, plot, rng);
    s.dwelling.plots[i] = null;
  }
  const parts = (Object.entries(total) as [HerbId, number][]).map(([id, n]) => `${n} ${HERBS[id].name}`);
  if (parts.length) addLog(s, now, `Thu hoạch linh điền: ${parts.join(', ')}.`);
  return s;
}

/** Cây chín thì tự thu hoạch và gieo lại (nếu đủ linh thạch mua hạt) */
function dwellingStep(s: GameState, t: number, rng: Rng) {
  const d = s.dwelling;
  if (d.job && d.job.end <= t) finishJob(s, t, rng);
  if (!s.auto.garden) return;
  for (let i = 0; i < d.plots.length; i++) {
    let plot = d.plots[i];
    while (plot && plot.end <= t) {
      const herb = plot.herb;
      const at = plot.end;
      harvestInto(s, plot, rng);
      d.plots[i] = null;
      if (i < plotCount(s) && s.stones >= seedCost(herb)) {
        // gieo lại ngay lúc cây chín để chu kỳ không bị trôi
        s.stones -= seedCost(herb);
        d.plots[i] = { herb, start: at, end: at + growMs(s, herb) };
        s.stats.planted++;
      }
      plot = d.plots[i];
    }
  }
}

// ---- Luyện đan ----

export function recipeNeeds(s: GameState, id: RecipeId) {
  const band = herbsOfBand(bandOfRealm(realmOf(s)));
  const r = RECIPES[id];
  return { common: band.common, rare: band.rare, nCommon: r.common, nRare: r.rare };
}

export function maxBatch(s: GameState): number {
  return maxBatchAt(s.dwelling.levels.dan_phong);
}

/** Số viên tối đa luyện được một lần theo thảo dược đang có và giới hạn Đan Phòng */
export function maxCraftable(s: GameState, id: RecipeId): number {
  const need = recipeNeeds(s, id);
  const byCommon = need.nCommon ? Math.floor(herbCount(s, need.common) / need.nCommon) : Infinity;
  const byRare = need.nRare ? Math.floor(herbCount(s, need.rare) / need.nRare) : Infinity;
  return Math.max(0, Math.min(maxBatch(s), byCommon, byRare));
}

export function jobSeconds(s: GameState, id: RecipeId, count: number): number {
  return RECIPES[id].seconds * count * craftTimeMultAt(s.dwelling.levels.dan_phong);
}

export function canStartJob(s: GameState, id: RecipeId, count: number): boolean {
  return !s.dwelling.job && count >= 1 && count <= maxCraftable(s, id);
}

export function startJob(prev: GameState, id: RecipeId, count: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canStartJob(s, id, count)) return s;
  const need = recipeNeeds(s, id);
  s.dwelling.herbs[need.common] = herbCount(s, need.common) - need.nCommon * count;
  if (need.nRare) s.dwelling.herbs[need.rare] = herbCount(s, need.rare) - need.nRare * count;
  s.dwelling.job = { recipe: id, count, start: now, end: now + jobSeconds(s, id, count) * 1000 };
  addLog(s, now, `Bắt đầu luyện ${count} viên ${RECIPES[id].name}.`);
  return s;
}

function finishJob(s: GameState, time: number, rng: Rng) {
  const job = s.dwelling.job as Job;
  s.dwelling.job = null;
  const chances = gradeChancesAt(s.dwelling.levels.dan_phong);
  const made = [0, 0, 0];
  for (let i = 0; i < job.count; i++) {
    const r = rng();
    const grade = r < chances.top ? 2 : r < chances.top + chances.mid ? 1 : 0;
    s.pills[RECIPES[job.recipe].pills[grade]]++;
    made[job.recipe === 'hoiXuan' ? 0 : grade]++;
    s.stats.crafted++;
    if (grade === 2 && job.recipe !== 'hoiXuan') s.stats.crafted3++;
    if (job.recipe === 'phaCanh') s.stats.craftedBreak++;
  }
  const detail =
    job.recipe === 'hoiXuan' ? '' : ` (Hạ ${made[0]}, Trung ${made[1]}, Thượng ${made[2]})`;
  addLog(s, time, `Luyện xong ${job.count} viên ${RECIPES[job.recipe].name}${detail}.`, 'good');
}

export function sellHerb(prev: GameState, id: HerbId, n: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const have = herbCount(s, id);
  const sold = Math.max(0, Math.min(n, have));
  if (!sold) return s;
  s.dwelling.herbs[id] = have - sold;
  s.stones += sold * sellPrice(id);
  return s;
}

// ---------- Nhiệm vụ ----------

export function isQuestClaimed(s: GameState, id: string): boolean {
  return s.quests.claimed.includes(id);
}

/** Nhiệm vụ đã hoàn thành nhưng chưa nhận thưởng */
export function claimableQuests(s: GameState): QuestDef[] {
  return QUESTS.filter((q) => !isQuestClaimed(s, q.id) && q.done(s));
}

/** Nhiệm vụ kế tiếp chưa xong (theo thứ tự chuỗi), để làm mục tiêu hiện tại */
export function currentQuest(s: GameState): QuestDef | null {
  return QUESTS.find((q) => !isQuestClaimed(s, q.id) && !q.done(s)) ?? null;
}

/** Thưởng thực nhận: linh thạch nhân theo cảnh giới của nhiệm vụ (không đổi dù nhận sớm hay muộn) */
export function questReward(_s: GameState, q: QuestDef) {
  return {
    stones: Math.round((q.reward.stones ?? 0) * 2 ** (QUEST_TIER[q.id] ?? 0)),
    fragments: q.reward.fragments ?? 0,
    pills: q.reward.pills ?? {},
  };
}

function applyQuest(s: GameState, q: QuestDef, now: number) {
  const r = questReward(s, q);
  s.stones += r.stones;
  s.fragments += r.fragments;
  const parts: string[] = [];
  if (r.stones) parts.push(`${formatNumber(r.stones)} linh thạch`);
  if (r.fragments) parts.push(`${r.fragments} tàn quyển`);
  for (const [id, n] of Object.entries(r.pills) as [PillId, number][]) {
    s.pills[id] += n;
    parts.push(`${n} ${PILLS[id].name}`);
  }
  s.quests.claimed.push(q.id);
  addLog(s, now, `Hoàn thành nhiệm vụ 【${q.title}】: nhận ${parts.join(', ')}.`, 'good');
}

export function claimQuest(prev: GameState, id: string, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const q = QUEST_BY_ID[id];
  if (!q || isQuestClaimed(s, id) || !q.done(s)) return s;
  applyQuest(s, q, now);
  return s;
}

export function claimAllQuests(prev: GameState, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  for (const q of claimableQuests(s)) applyQuest(s, q, now);
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
  addLog(s, now, `Chọn con đường ${PATHS[path].name}.`, 'good');
  grantEarnedSkills(s, now);
  grantEarnedTechs(s, now);
  return s;
}

export function techLevel(s: GameState, id: TechId): number {
  return s.techs[id] ?? 0;
}

export function hasTech(s: GameState, id: TechId): boolean {
  return s.techs[id] !== undefined;
}

/** Công pháp chính giới hạn tầng theo cảnh giới; công pháp phụ theo từng công pháp */
export function techCap(s: GameState, id: TechId): number {
  const def = TECHS[id];
  return def.kind === 'main' ? pathLevelCap(realmOf(s)) : def.maxLevel!;
}

export function techUpgradeCost(s: GameState, id: TechId) {
  const c = techCost(techLevel(s, id) + 1, realmOf(s));
  const k = GRADE_COST[TECHS[id].grade];
  return { fragments: Math.ceil(c.fragments * k), stones: Math.ceil(c.stones * k) };
}

export function canUpgradeTech(s: GameState, id: TechId): boolean {
  if (!hasTech(s, id) || techLevel(s, id) >= techCap(s, id)) return false;
  const cost = techUpgradeCost(s, id);
  return s.fragments >= cost.fragments && s.stones >= cost.stones;
}

export function upgradeTech(prev: GameState, id: TechId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canUpgradeTech(s, id)) return s;
  const cost = techUpgradeCost(s, id);
  s.fragments -= cost.fragments;
  s.stones -= cost.stones;
  s.techs[id] = techLevel(s, id) + 1;
  addLog(s, now, `${TECHS[id].name} đạt tầng ${s.techs[id]}.`);
  return s;
}

/** Học công pháp. Công pháp chính mới thay thế công pháp chính cũ và kế thừa một nửa số tầng. */
function learnTech(s: GameState, id: TechId, time: number, how: string) {
  const def = TECHS[id];
  if (def.kind === 'main') {
    const cur = s.mainTech ? techLevel(s, s.mainTech) : 0;
    s.techs[id] = Math.max(1, Math.min(techCap(s, id), Math.floor(cur * MAIN_CARRY_OVER)));
    s.mainTech = id;
  } else {
    s.techs[id] = def.source.kind === 'start' ? 0 : 1;
    if (s.subTechs.length < SUB_SLOTS) s.subTechs.push(id);
  }
  addLog(s, time, `${how} công pháp 【${def.name}】.`, 'good');
}

function earnedTech(s: GameState, id: TechId): boolean {
  const def = TECHS[id];
  if (def.path && def.path !== s.path) return false;
  if (def.source.kind === 'path') return true;
  if (def.source.kind === 'boss') return s.floor >= def.source.floor;
  return false;
}

/** Học mọi công pháp đã đủ điều kiện (chọn hướng tu, hạ thủ lĩnh, nâng save) mà chưa học */
function grantEarnedTechs(s: GameState, time: number) {
  for (const id of Object.keys(TECHS) as TechId[]) {
    if (hasTech(s, id) || !earnedTech(s, id)) continue;
    learnTech(s, id, time, TECHS[id].source.kind === 'boss' ? 'Thu được bí kíp' : 'Lĩnh ngộ');
  }
}

export function setMainTech(prev: GameState, id: TechId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const def = TECHS[id];
  if (!hasTech(s, id) || def.kind !== 'main' || def.path !== s.path || s.mainTech === id) return s;
  s.mainTech = id;
  addLog(s, now, `Đổi công pháp chính sang 【${def.name}】 (tầng ${techLevel(s, id)}).`);
  return s;
}

/** Cất công pháp phụ đang dùng, hoặc mang vào ô trống (tối đa SUB_SLOTS) */
export function toggleSubTech(prev: GameState, id: TechId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!hasTech(s, id) || TECHS[id].kind !== 'sub') return s;
  const i = s.subTechs.indexOf(id);
  if (i >= 0) s.subTechs.splice(i, 1);
  else if (s.subTechs.length < SUB_SLOTS) s.subTechs.push(id);
  return s;
}

export function canBuyTech(s: GameState, id: TechId): boolean {
  const def = TECHS[id];
  if (def.source.kind !== 'shop' || hasTech(s, id)) return false;
  if (def.path && def.path !== s.path) return false;
  return realmOf(s) >= def.source.realm && s.stones >= def.source.price;
}

export function buyTech(prev: GameState, id: TechId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canBuyTech(s, id)) return s;
  s.stones -= (TECHS[id].source as { price: number }).price;
  learnTech(s, id, now, 'Mua bí kíp, học được');
  return s;
}

// ---------- Bản mệnh pháp bảo ----------

export function canForgeNatal(s: GameState): boolean {
  return !s.natal && s.level >= NATAL_UNLOCK_LEVEL;
}

export function forgeNatal(prev: GameState, id: NatalId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canForgeNatal(s)) return s;
  s.natal = { id, level: 1, exp: 0 };
  addLog(s, now, `Luyện thành bản mệnh pháp bảo 【${NATALS[id].name}】.`, 'good');
  return s;
}

export function canDevour(s: GameState): boolean {
  return !!s.natal && s.natal.level < NATAL_MAX_LEVEL;
}

export function itemDevourExp(it: Item): number {
  return natalExpFromItem(TIERS[it.tier].mult, it.floor, itemPlus(it));
}

/** Cộng kinh nghiệm bản mệnh, tự lên cấp; chỉ ghi nhật ký khi lên cấp */
function gainNatalExp(s: GameState, amount: number, time: number) {
  const n = s.natal;
  if (!n) return;
  n.exp += amount;
  while (n.level < NATAL_MAX_LEVEL && n.exp >= natalExpNeeded(n.level)) {
    n.exp -= natalExpNeeded(n.level);
    n.level++;
    const evolved = natalStage(n.level) > natalStage(n.level - 1);
    addLog(
      s,
      time,
      evolved
        ? `${NATALS[n.id].name} tiến hóa thành ${NATAL_STAGES[natalStage(n.level)]} (cấp ${n.level})!`
        : `${NATALS[n.id].name} đạt cấp ${n.level}.`,
      evolved ? 'good' : 'info',
    );
  }
  if (n.level >= NATAL_MAX_LEVEL) n.exp = 0;
}

export function devourItem(prev: GameState, id: number, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const idx = s.bag.findIndex((it) => it.id === id);
  if (idx < 0 || !canDevour(s)) return s;
  const [it] = s.bag.splice(idx, 1);
  gainNatalExp(s, itemDevourExp(it), now);
  return s;
}

/** Luyện hóa mọi trang bị trong túi kém hơn đồ đang dùng */
export function devourWorse(prev: GameState, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canDevour(s)) return s;
  const keep: Item[] = [];
  let total = 0;
  let count = 0;
  for (const it of s.bag) {
    if (canDevour(s) && isWorse(s, it)) {
      const exp = itemDevourExp(it);
      total += exp;
      count++;
      gainNatalExp(s, exp, now);
    } else keep.push(it);
  }
  if (!count) return s;
  addLog(s, now, `Luyện hóa ${count} trang bị kém hơn, bản mệnh nhận ${formatNumber(total)} kinh nghiệm.`);
  s.bag = keep;
  return s;
}

// ---------- Võ kỹ ----------

/** Võ kỹ đáng lẽ đã có: của hướng tu, hoặc bí tịch từ thủ lĩnh đã hạ */
function earned(s: GameState, id: SkillId): boolean {
  const def = SKILLS[id];
  if (def.path && def.path !== s.path) return false;
  if (def.source.kind === 'path') return true;
  if (def.source.kind === 'boss') return s.floor >= def.source.floor;
  return false;
}

/** Học mọi võ kỹ đã đủ điều kiện mà chưa học (sau khi hạ thủ lĩnh, chọn hướng tu, nâng save) */
function grantEarnedSkills(s: GameState, time: number) {
  for (const def of PLAYER_SKILLS) {
    if (s.skills[def.id] || !earned(s, def.id)) continue;
    learn(s, def.id, time, def.source.kind === 'boss' ? 'Thu được bí tịch' : 'Lĩnh ngộ');
  }
}

function learn(s: GameState, id: SkillId, time: number, how: string) {
  s.skills[id] = 1;
  if (s.loadout.length < 3) s.loadout.push(id);
  addLog(s, time, `${how} võ kỹ 【${SKILLS[id].name}】.`, 'good');
}

export function skillSlotCount(s: GameState): number {
  return skillSlots(realmOf(s));
}

export function canLearnFromShop(s: GameState, id: SkillId): boolean {
  const src = SKILLS[id].source;
  return src.kind === 'shop' && !s.skills[id] && realmOf(s) >= src.realm && s.stones >= src.price;
}

export function buySkill(prev: GameState, id: SkillId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canLearnFromShop(s, id)) return s;
  const src = SKILLS[id].source as { price: number };
  s.stones -= src.price;
  learn(s, id, now, 'Mua bí tịch, học được');
  return s;
}

export function skillUpgradeCost(s: GameState, id: SkillId) {
  return skillCost(s.skills[id] ?? 1, realmOf(s));
}

export function canUpgradeSkill(s: GameState, id: SkillId): boolean {
  const lv = s.skills[id] ?? 0;
  if (lv <= 0 || lv >= SKILL_MAX_LEVEL) return false;
  const cost = skillUpgradeCost(s, id);
  return s.fragments >= cost.fragments && s.stones >= cost.stones;
}

export function upgradeSkill(prev: GameState, id: SkillId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canUpgradeSkill(s, id)) return s;
  const cost = skillUpgradeCost(s, id);
  s.fragments -= cost.fragments;
  s.stones -= cost.stones;
  s.skills[id] = (s.skills[id] ?? 1) + 1;
  addLog(s, now, `【${SKILLS[id].name}】 đạt cấp ${s.skills[id]}.`);
  return s;
}

/** Mang võ kỹ vào ô cuối, hoặc cất ra; tối đa 3 (ô chưa mở thì chưa có tác dụng) */
export function toggleSkill(prev: GameState, id: SkillId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!s.skills[id]) return s;
  const i = s.loadout.indexOf(id);
  if (i >= 0) s.loadout.splice(i, 1);
  else if (s.loadout.length < 3) s.loadout.push(id);
  return s;
}

/** Đổi thứ tự ưu tiên: dir = −1 lên trước, +1 xuống sau */
export function moveSkill(prev: GameState, id: SkillId, dir: -1 | 1, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const i = s.loadout.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= s.loadout.length) return s;
  [s.loadout[i], s.loadout[j]] = [s.loadout[j], s.loadout[i]];
  return s;
}

// ---------- Đan dược ----------

export function pillPrice(s: GameState, id: PillId): number {
  const base = PILLS[id].basePrice;
  return base === null ? Infinity : base * PILLS[id].priceGrowth ** realmOf(s);
}

export function buyPill(prev: GameState, id: PillId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  const price = pillPrice(s, id);
  if (!Number.isFinite(price) || s.stones < price) return s;
  s.stones -= price;
  s.pills[id]++;
  return s;
}

export function canUsePill(s: GameState, id: PillId, now: number): boolean {
  if (s.pills[id] <= 0) return false;
  const family = PILLS[id].family;
  if (family === 'tuKhi') return !(isBottleneck(s.level) && s.cultivation >= requiredFor(s.level));
  if (family === 'hoiXuan') return isInjured(s, now);
  return false; // Phá Cảnh Đan dùng qua nút đột phá
}

export function usePill(prev: GameState, id: PillId, now: number, rng: Rng): GameState {
  const s = begin(prev, now, rng);
  if (!canUsePill(s, id, now)) return s;
  s.pills[id]--;
  if (PILLS[id].family === 'tuKhi') {
    const got = gainCultivation(s, baseRate(s) * TU_KHI_SECONDS_BY_GRADE[PILLS[id].grade], now);
    addLog(s, now, `Phục dụng ${pillLabel(id)}, nhận ${formatNumber(got)} tu vi.`);
  } else if (PILLS[id].family === 'hoiXuan') {
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

/** Nâng save bản cũ lên bản hiện tại, từng bước một */
function migrate(raw: Record<string, unknown>): GameState | null {
  let s = raw;
  if (s.version === 1) {
    // Save MVP: chưa có chiến đấu. Cho vượt sẵn các tầng chặn cảnh giới đã đạt để không bị kẹt.
    const realm = levelInfo(s.level as number)?.realm ?? 0;
    s = {
      ...s,
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
    };
  }
  if (s.version === 2) {
    s = {
      ...s,
      version: 3,
      auto: defaultAuto(),
      stats: emptyStats(),
      climbBlockedPower: 0,
      nextClimbAt: s.lastTick,
    };
  }
  if (s.version === 3) {
    const g = { ...s, version: 4, skills: {}, loadout: [], log: [...(s.log as GameState['log'])] } as unknown as GameState;
    grantEarnedSkills(g, g.lastTick);
    s = g as unknown as Record<string, unknown>;
  }
  if (s.version === 4) {
    s = { ...s, version: 5, gear: { ...(s.gear as object), ring: null, boots: null } };
  }
  if (s.version === 5) {
    // Công pháp cũ: tech.base → Dẫn Khí Quyết, tech.path → công pháp chính Hoàng Cấp của hướng tu
    const old = (s.tech as { base: number; path: number } | undefined) ?? { base: 0, path: 0 };
    const path = s.path as PathId | null;
    const techs: GameState['techs'] = { dan_khi: old.base };
    let mainTech: TechId | null = null;
    if (path) {
      mainTech = mainTechId(path, 0);
      techs[mainTech] = Math.max(1, old.path);
    }
    const { tech: _old, ...rest } = s;
    void _old;
    const g = {
      ...rest,
      version: 6,
      techs,
      mainTech,
      subTechs: ['dan_khi'],
      natal: null,
      auto: { ...(s.auto as object), devour: false },
      log: [...(s.log as GameState['log'])],
    } as unknown as GameState;
    grantEarnedTechs(g, g.lastTick);
    s = g as unknown as Record<string, unknown>;
  }
  if (s.version === 6) {
    s = { ...s, version: 7, quests: { claimed: [] } };
  }
  if (s.version === 7) {
    s = {
      ...s,
      version: 8,
      dwelling: newDwelling(),
      pills: { ...emptyPills(), ...(s.pills as object) },
      stats: { ...emptyStats(), ...(s.stats as object) },
      auto: { ...(s.auto as object), garden: false },
    };
  }
  if (s.version === 8) {
    s = { ...s, version: 9, kiep: {}, lastKiep: null };
  }
  return s.version === 9 ? (s as unknown as GameState) : null;
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
