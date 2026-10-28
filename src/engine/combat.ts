// Chỉ số chiến đấu, quái bí cảnh, pháp bảo và mô phỏng trận đấu.

import {
  AFFINITY_MULT,
  BASE_STATS,
  BASE_TECH,
  BOSS_EVERY,
  BOSS_MIN_TIER,
  BOSS_MULT,
  CRIT_DAMAGE,
  INJURY_COMBAT_MULT,
  ITEM_NAMES,
  ITEM_STATS,
  MAX_BATTLE_ACTIONS,
  PATHS,
  POWER_SCALE,
  SLOTS,
  TIERS,
  ZONES,
  floorLevel,
  floorStones,
} from './data';
import { type GameState, type Item, type Rng, formatNumber, isInjured, weightedPick } from './state';

export interface Fighter {
  name: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;
}

// ---------- Công pháp ----------

/** Linh căn có hệ hợp với hướng tu đã chọn */
export function hasAffinity(s: GameState): boolean {
  if (!s.path) return false;
  const els = PATHS[s.path].elements;
  return s.root.elements.some((e) => els.includes(e));
}

/** Phần trăm cộng thêm từ công pháp hướng tu cho một chỉ số */
export function pathBonus(s: GameState, key: 'hp' | 'atk' | 'def' | 'rate' | 'crit'): number {
  if (!s.path) return 0;
  const per = PATHS[s.path].perLevel[key] ?? 0;
  return per * s.tech.path * (hasAffinity(s) ? AFFINITY_MULT : 1);
}

/** Hệ số tốc độ tu luyện từ linh bội + công pháp */
export function cultivationBonus(s: GameState): number {
  const pendant = s.gear.pendant ? itemStats(s.gear.pendant).cultivation : 0;
  return 1 + pendant + pathBonus(s, 'rate');
}

// ---------- Nhân vật ----------

export function playerStats(s: GameState, time: number): Fighter {
  const b = POWER_SCALE ** s.level;
  const base = 1 + BASE_TECH.perLevel * s.tech.base;
  const gear = { hp: 0, atk: 0, def: 0 };
  for (const slot of SLOTS) {
    const it = s.gear[slot];
    if (!it) continue;
    const st = itemStats(it);
    gear.hp += st.hp;
    gear.atk += st.atk;
    gear.def += st.def;
  }
  const injured = isInjured(s, time) ? INJURY_COMBAT_MULT : 1;
  const path = s.path ? PATHS[s.path] : null;
  return {
    name: s.name,
    hp: (BASE_STATS.hp * b + gear.hp) * base * (1 + pathBonus(s, 'hp')) * injured,
    atk: (BASE_STATS.atk * b + gear.atk) * base * (1 + pathBonus(s, 'atk')) * injured,
    def: (BASE_STATS.def * b + gear.def) * base * (1 + pathBonus(s, 'def')) * injured,
    spd: BASE_STATS.spd + (path?.spd ?? 0),
    crit: (path?.baseCrit ?? 0.05) + pathBonus(s, 'crit'),
  };
}

/** Một con số tóm tắt sức mạnh, chỉ để hiển thị */
export function combatPower(f: Fighter): number {
  return Math.round(Math.sqrt(f.hp * f.atk * (1 + f.crit * (CRIT_DAMAGE - 1))) * (f.spd / 100) + f.def * 2);
}

// ---------- Bí cảnh ----------

export function isBossFloor(floor: number): boolean {
  return floor % BOSS_EVERY === 0;
}

export function zoneOf(floor: number) {
  return ZONES[Math.min(ZONES.length - 1, Math.floor((floor - 1) / BOSS_EVERY))];
}

export function enemyFor(floor: number): Fighter {
  const zone = zoneOf(floor);
  const boss = isBossFloor(floor);
  const e = POWER_SCALE ** floorLevel(floor);
  return {
    name: boss ? zone.boss : zone.enemies[(floor - 1) % BOSS_EVERY],
    hp: BASE_STATS.hp * e * (boss ? BOSS_MULT.hp : 1),
    atk: BASE_STATS.atk * e * (boss ? BOSS_MULT.atk : 1),
    def: BASE_STATS.def * e * (boss ? BOSS_MULT.def : 1),
    spd: 95 + floor / 2,
    crit: 0.05,
  };
}

// ---------- Trận đấu ----------

function damage(a: Fighter, d: Fighter, rng: Rng): { dmg: number; crit: boolean } {
  const crit = rng() < a.crit;
  const dmg = ((a.atk * a.atk) / (a.atk + d.def)) * (0.9 + 0.2 * rng()) * (crit ? CRIT_DAMAGE : 1);
  return { dmg, crit };
}

/**
 * Đánh theo thanh hành động: mỗi nhịp cộng tốc độ, đủ 100 thì ra đòn.
 * Người chơi ra đòn trước khi hai bên bằng nhau.
 */
export function simulateBattle(p: Fighter, e: Fighter, rng: Rng): { win: boolean; lines: string[] } {
  const hp = { p: p.hp, e: e.hp };
  const gauge = { p: 0, e: 0 };
  const lines: string[] = [];
  let actions = 0;
  while (actions < MAX_BATTLE_ACTIONS) {
    gauge.p += p.spd;
    gauge.e += e.spd;
    while (gauge.p >= 100 || gauge.e >= 100) {
      const playerTurn = gauge.p >= gauge.e;
      const [atk, def, key] = playerTurn ? ([p, e, 'e'] as const) : ([e, p, 'p'] as const);
      gauge[playerTurn ? 'p' : 'e'] -= 100;
      const { dmg, crit } = damage(atk, def, rng);
      hp[key] = Math.max(0, hp[key] - dmg);
      actions++;
      lines.push(
        `${atk.name} ${playerTurn ? 'xuất chiêu' : 'tấn công'}${crit ? ' — BẠO KÍCH' : ''}: −${formatNumber(dmg)} (${def.name} còn ${formatNumber(hp[key])})`,
      );
      if (hp.e <= 0) {
        lines.push(`${e.name} gục ngã. Thắng!`);
        return { win: true, lines };
      }
      if (hp.p <= 0) {
        lines.push(`${p.name} trọng thương, phải rút lui.`);
        return { win: false, lines };
      }
    }
  }
  lines.push('Giằng co quá lâu, linh lực cạn kiệt, đành rút lui.');
  return { win: false, lines };
}

// ---------- Pháp bảo ----------

export function rollItem(floor: number, boss: boolean, rng: Rng, id: number): Item {
  const slot = SLOTS[Math.floor(rng() * SLOTS.length)];
  const tier = weightedPick(
    TIERS.map((t, i) => (boss && i < BOSS_MIN_TIER ? 0 : t.weight)),
    rng,
  );
  return { id, slot, tier, floor };
}

export function itemStats(it: Item) {
  const k = POWER_SCALE ** floorLevel(it.floor) * TIERS[it.tier].mult;
  const base = ITEM_STATS[it.slot];
  return {
    hp: base.hp * k,
    atk: base.atk * k,
    def: base.def * k,
    cultivation: it.slot === 'pendant' ? TIERS[it.tier].cultivation : 0,
  };
}

export function itemName(it: Item): string {
  return ITEM_NAMES[it.slot][it.tier];
}

/** Điểm so sánh giữa các pháp bảo cùng ô */
export function itemScore(it: Item): number {
  const st = itemStats(it);
  return st.hp / BASE_STATS.hp + st.atk / BASE_STATS.atk + st.def / BASE_STATS.def + st.cultivation * 20;
}

export function itemSellPrice(it: Item): number {
  return floorStones(it.floor) * 0.2 * TIERS[it.tier].mult;
}
