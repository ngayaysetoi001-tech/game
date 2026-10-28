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
import {
  CLEANSE_IMMUNE_TURNS,
  ENEMY_SKILLS,
  HEAL_THRESHOLD,
  SKILLS,
  SKILL_LEVEL_CHANCE,
  SKILL_LEVEL_POWER,
  type SkillDef,
  type SkillId,
  enemySkillLevel,
  skillSlots,
} from './skills';
import { type BattleEvent, type GameState, type Item, type Rng, formatNumber, isInjured, levelInfo, weightedPick } from './state';

export interface Fighter {
  name: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;
  /** Võ kỹ theo thứ tự ưu tiên */
  skills: { id: SkillId; level: number }[];
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
    skills: equippedSkills(s),
  };
}

/** Võ kỹ đang dùng (đã cắt theo số ô mở được ở cảnh giới hiện tại) */
export function equippedSkills(s: GameState): { id: SkillId; level: number }[] {
  return s.loadout
    .slice(0, skillSlots(levelInfo(s.level).realm))
    .filter((id) => (s.skills[id] ?? 0) > 0)
    .map((id) => ({ id, level: s.skills[id]! }));
}

/** Một con số tóm tắt sức mạnh, chỉ để hiển thị */
export function combatPower(f: Fighter): number {
  // Mỗi võ kỹ cộng khoảng 8% (tăng theo cấp) để chiến lực phản ánh cả chiêu thức
  const skillMult = 1 + f.skills.reduce((a, sk) => a + 0.08 * (1 + SKILL_LEVEL_POWER * (sk.level - 1)), 0);
  return Math.round((Math.sqrt(f.hp * f.atk * (1 + f.crit * (CRIT_DAMAGE - 1))) * (f.spd / 100) + f.def * 2) * skillMult);
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
  const name = boss ? zone.boss : zone.enemies[(floor - 1) % BOSS_EVERY];
  return {
    name,
    hp: BASE_STATS.hp * e * (boss ? BOSS_MULT.hp : 1),
    atk: BASE_STATS.atk * e * (boss ? BOSS_MULT.atk : 1),
    def: BASE_STATS.def * e * (boss ? BOSS_MULT.def : 1),
    spd: 95 + floor / 2,
    crit: 0.05,
    skills: (ENEMY_SKILLS[name] ?? []).map((id) => ({ id, level: enemySkillLevel(floor) })),
  };
}

// ---------- Trận đấu ----------

export interface BattleResult {
  win: boolean;
  lines: string[];
  events: BattleEvent[];
}

interface Side {
  key: 'p' | 'e';
  f: Fighter;
  hp: number;
  shield: number;
  gauge: number;
  cds: number[];
  atkBuff: number;
  atkBuffT: number;
  dodge: number;
  dodgeT: number;
  immuneT: number;
  burn: number;
  burnT: number;
  slow: number;
  slowT: number;
  armor: number;
  armorT: number;
  stunned: boolean;
}

function makeSide(key: 'p' | 'e', f: Fighter): Side {
  return {
    key,
    f,
    hp: f.hp,
    shield: 0,
    gauge: 0,
    cds: f.skills.map(() => 0),
    atkBuff: 0,
    atkBuffT: 0,
    dodge: 0,
    dodgeT: 0,
    immuneT: 0,
    burn: 0,
    burnT: 0,
    slow: 0,
    slowT: 0,
    armor: 0,
    armorT: 0,
    stunned: false,
  };
}

const power = (level: number) => 1 + SKILL_LEVEL_POWER * (level - 1);
const hasDebuff = (x: Side) => x.burnT > 0 || x.slowT > 0 || x.armorT > 0 || x.stunned;

/** Chiêu có đáng dùng lúc này không (hồi máu chỉ khi máu thấp, buff chỉ khi chưa có…) */
function usable(def: SkillDef, me: Side): boolean {
  const e = def.effect;
  if (e.heal && me.hp >= me.f.hp * HEAL_THRESHOLD) return false;
  if (e.shield && !e.dmg && me.shield > 0) return false;
  if (e.atkBuff && !e.dmg && me.atkBuffT > 0) return false;
  if (e.dodge && !e.dmg && me.dodgeT > 0) return false;
  if (e.cleanse && !e.dmg && !hasDebuff(me)) return false;
  return true;
}

function absorb(target: Side, dmg: number) {
  const blocked = Math.min(target.shield, dmg);
  target.shield -= blocked;
  target.hp = Math.max(0, target.hp - (dmg - blocked));
}

/**
 * Đánh theo thanh hành động: mỗi nhịp cộng tốc độ, đủ 100 thì ra đòn.
 * Mỗi lượt tự dùng võ kỹ đầu tiên (theo thứ tự ưu tiên) đã hồi chiêu và đáng dùng,
 * nếu không có thì đánh thường. Người chơi ra đòn trước khi hai bên bằng nhau.
 */
export function simulateBattle(pf: Fighter, ef: Fighter, rng: Rng): BattleResult {
  const P = makeSide('p', pf);
  const E = makeSide('e', ef);
  const lines: string[] = [];
  const events: BattleEvent[] = [];
  let actions = 0;

  const push = (by: Side, target: Side, ev: Partial<BattleEvent>) =>
    events.push({ by: by.key, target: target.key, dmg: 0, crit: false, hpP: P.hp, hpE: E.hp, ...ev });

  /** Ra một lượt; trả về true nếu trận đã kết thúc */
  const act = (me: Side, foe: Side): boolean => {
    actions++;
    // Thiêu đốt / độc phát tác đầu lượt
    if (me.burnT > 0) {
      me.burnT--;
      absorb(me, me.burn);
      push(foe, me, { dmg: me.burn, fx: 'burn' });
      lines.push(`${me.f.name} bị thiêu đốt: −${formatNumber(me.burn)}`);
      if (me.hp <= 0) return true;
    }
    const endTurn = () => {
      me.cds = me.cds.map((c) => Math.max(0, c - 1));
      for (const k of ['atkBuffT', 'dodgeT', 'immuneT', 'slowT', 'armorT'] as const) me[k] = Math.max(0, me[k] - 1);
    };
    if (me.stunned) {
      me.stunned = false;
      push(me, me, { fx: 'stun' });
      lines.push(`${me.f.name} bị choáng, mất lượt.`);
      endTurn();
      return false;
    }

    let idx = -1;
    for (let i = 0; i < me.f.skills.length; i++) {
      if (me.cds[i] === 0 && usable(SKILLS[me.f.skills[i].id], me)) {
        idx = i;
        break;
      }
    }
    const def = idx >= 0 ? SKILLS[me.f.skills[idx].id] : null;
    const lv = idx >= 0 ? me.f.skills[idx].level : 1;
    const pw = power(lv);
    const e = def?.effect ?? { dmg: 1 };
    const skill = def?.name;
    if (def) lines.push(`${me.f.name} thi triển 【${def.name}】`);

    if (e.cleanse) {
      me.burnT = me.slowT = me.armorT = 0;
      me.stunned = false;
      me.immuneT = CLEANSE_IMMUNE_TURNS + 1;
      push(me, me, { fx: 'cleanse', skill });
    }
    if (e.heal) {
      const amount = Math.min(me.f.hp - me.hp, me.f.hp * e.heal * pw);
      me.hp += amount;
      push(me, me, { fx: 'heal', amount, skill });
      lines.push(`${me.f.name} hồi ${formatNumber(amount)} khí huyết.`);
    }
    if (e.shield) {
      me.shield = me.f.hp * e.shield * pw;
      push(me, me, { fx: 'shield', amount: me.shield, skill });
    }
    if (e.atkBuff) {
      me.atkBuff = e.atkBuff.pct * pw;
      me.atkBuffT = e.atkBuff.turns + 1;
      push(me, me, { fx: 'buff', skill });
    }
    if (e.dodge) {
      me.dodge = e.dodge.pct * pw;
      me.dodgeT = e.dodge.turns + 1;
      push(me, me, { fx: 'buff', skill });
    }

    if (e.dmg) {
      const atk = me.f.atk * (1 + (me.atkBuffT > 0 ? me.atkBuff : 0));
      const def2 = foe.f.def * (1 - (foe.armorT > 0 ? foe.armor : 0));
      let landed = false;
      for (let h = 0; h < (e.hits ?? 1); h++) {
        if (foe.dodgeT > 0 && rng() < foe.dodge) {
          push(me, foe, { fx: 'miss', skill });
          lines.push(`${foe.f.name} né được.`);
          continue;
        }
        landed = true;
        const crit = rng() < me.f.crit + (e.crit ?? 0);
        const dmg = ((atk * atk) / (atk + def2)) * (0.9 + 0.2 * rng()) * e.dmg * (def ? pw : 1) * (crit ? CRIT_DAMAGE : 1);
        absorb(foe, dmg);
        if (e.lifesteal) me.hp = Math.min(me.f.hp, me.hp + dmg * e.lifesteal * pw);
        push(me, foe, { dmg, crit, fx: 'hit', skill });
        lines.push(
          `${me.f.name} ${def ? 'đánh trúng' : me.key === 'p' ? 'xuất chiêu' : 'tấn công'}${crit ? ' — BẠO KÍCH' : ''}: −${formatNumber(dmg)} (${foe.f.name} còn ${formatNumber(foe.hp)})`,
        );
        if (foe.hp <= 0) return true;
      }
      // Hiệu ứng xấu chỉ bám khi có ít nhất một đòn trúng và đối thủ không miễn nhiễm
      if (landed && foe.immuneT === 0) {
        if (e.burn) {
          foe.burn = atk * e.burn.pct * pw;
          foe.burnT = e.burn.turns;
        }
        if (e.slow) {
          foe.slow = Math.min(0.8, e.slow.pct * pw);
          foe.slowT = e.slow.turns;
        }
        if (e.armorBreak) {
          foe.armor = Math.min(0.8, e.armorBreak.pct * pw);
          foe.armorT = e.armorBreak.turns;
        }
        if (e.stun && rng() < e.stun + SKILL_LEVEL_CHANCE * (lv - 1)) {
          foe.stunned = true;
          lines.push(`${foe.f.name} bị choáng!`);
        }
      }
    }
    if (idx >= 0) me.cds[idx] = def!.cooldown + 1;
    endTurn();
    return false;
  };

  while (actions < MAX_BATTLE_ACTIONS) {
    P.gauge += P.f.spd * (P.slowT > 0 ? 1 - P.slow : 1);
    E.gauge += E.f.spd * (E.slowT > 0 ? 1 - E.slow : 1);
    while (P.gauge >= 100 || E.gauge >= 100) {
      const [me, foe] = P.gauge >= E.gauge ? [P, E] : [E, P];
      me.gauge -= 100;
      if (act(me, foe) || P.hp <= 0 || E.hp <= 0) {
        const win = E.hp <= 0;
        lines.push(win ? `${E.f.name} gục ngã. Thắng!` : `${P.f.name} trọng thương, phải rút lui.`);
        return { win, lines, events };
      }
      if (actions >= MAX_BATTLE_ACTIONS) break;
    }
  }
  lines.push('Giằng co quá lâu, linh lực cạn kiệt, đành rút lui.');
  return { win: false, lines, events };
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
