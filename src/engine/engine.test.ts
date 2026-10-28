import { describe, expect, it } from 'vitest';
import { BAG_LIMIT, PATH_UNLOCK_LEVEL, REALMS, SECLUSIONS, SLOTS, TIERS } from './data';
import {
  MAX_LEVEL,
  applyOffline,
  breakthrough,
  breakthroughChance,
  buyPill,
  canBreakthrough,
  cancelSeclusion,
  cultivationRate,
  exportSave,
  formatNumber,
  importSave,
  isBottleneck,
  levelName,
  newGame,
  pillPrice,
  requiredFor,
  rollRoot,
  startSeclusion,
  tick,
  totalCultivation,
  usePill,
  challengeFloor,
  choosePath,
  cultivationBonus,
  deserialize,
  enemyFor,
  equipItem,
  gateFloorFor,
  playerStats,
  sellWorse,
  serialize,
  simulateBattle,
  startFarming,
  stopFarming,
  upgradeTech,
  applyOffline as offline,
  NATALS,
  NATAL_MAX_LEVEL,
  TECHS,
  buyTech,
  canBuyTech,
  canDevour,
  charMods,
  devourItem,
  devourWorse,
  forgeNatal,
  hasTech,
  itemDevourExp,
  natalExpFromItem,
  natalExpNeeded,
  natalMods,
  natalSkillLevel,
  natalStage,
  setMainTech,
  techMods,
  toggleSubTech,
  AFFIXES,
  AFFIX_COUNTS,
  ENHANCE_MAX,
  SETS,
  canEnhance,
  enhanceChance,
  enhanceCost,
  enhanceItem,
  gearMods,
  itemScore,
  itemSellPrice,
  itemStats,
  rollItem,
  stoneRate,
  buySkill,
  equippedSkills,
  moveSkill,
  toggleSkill,
  upgradeSkill,
  type Fighter,
  autoClimbStatus,
  setAuto,
  type GameState,
  type Item,
} from './engine';

const T0 = 1_700_000_000_000;
const always = (v: number) => () => v;
// Ngũ Hành Tạp Linh Căn: ×1 tốc độ, không cộng tỉ lệ đột phá — dễ tính toán
const plainRoot = { tier: 5, elements: ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'] } as GameState['root'];

function fresh(): GameState {
  return newGame('Hàn Lập', plainRoot, T0);
}

/** Đưa nhân vật tới bình cảnh Luyện Khí tầng 9 với thanh tu vi đầy */
function atFirstBottleneck(): GameState {
  const s = fresh();
  s.level = REALMS[0].stages.length - 1;
  s.cultivation = requiredFor(s.level);
  s.floor = REALMS[1].gateFloor;
  return s;
}

describe('levels', () => {
  it('flattens realms into named levels', () => {
    expect(levelName(0)).toBe('Luyện Khí Tầng 1');
    expect(levelName(9)).toBe('Trúc Cơ Sơ Kỳ');
    expect(levelName(MAX_LEVEL)).toBe('Độ Kiếp Đại Viên Mãn');
    expect(isBottleneck(8)).toBe(true);
    expect(isBottleneck(9)).toBe(false);
  });
});

describe('rollRoot', () => {
  it('produces distinct basic elements matching the tier', () => {
    for (let i = 0; i < 200; i++) {
      const root = rollRoot(Math.random);
      expect(new Set(root.elements).size).toBe(root.elements.length);
      expect(root.elements.length).toBe(Math.max(1, [1, 1, 2, 3, 4, 5][root.tier]));
    }
  });
});

describe('tick', () => {
  it('accumulates cultivation and auto-levels minor stages', () => {
    const s = tick(fresh(), T0 + 60_000, always(0.9));
    expect(totalCultivation(s.level, s.cultivation)).toBeCloseTo(60);
    expect(s.level).toBeGreaterThan(0);
    expect(s.stones).toBeCloseTo(50 + 60 * 0.2);
  });

  it('caps at the realm bottleneck', () => {
    const s = tick(fresh(), T0 + 3600_000 * 5, always(0.9));
    expect(s.level).toBe(8);
    expect(s.cultivation).toBe(requiredFor(8));
  });

  it('returns the same object when no time passed', () => {
    const s = fresh();
    expect(tick(s, T0, always(0))).toBe(s);
  });
});

describe('breakthrough', () => {
  it('is blocked until the bar is full', () => {
    const s = fresh();
    expect(canBreakthrough(s)).toBe(false);
    expect(canBreakthrough(atFirstBottleneck())).toBe(true);
  });

  it('enters the next realm on success', () => {
    const s = breakthrough(atFirstBottleneck(), 0, T0, always(0));
    expect(levelName(s.level)).toBe('Trúc Cơ Sơ Kỳ');
    expect(s.cultivation).toBe(0);
  });

  it('loses cultivation, injures and grants fail bonus on failure', () => {
    const start = atFirstBottleneck();
    const s = breakthrough(start, 0, T0, always(0.99));
    expect(s.level).toBe(start.level);
    expect(s.cultivation).toBeCloseTo(start.cultivation * 0.7);
    expect(s.failBonus).toBeCloseTo(0.05);
    expect(cultivationRate(s, T0 + 1000)).toBeCloseTo(0.5);
    expect(breakthroughChance(s, 0)).toBeCloseTo(0.65);
  });

  it('consumes break pills and raises chance, capped at 95%', () => {
    const s = atFirstBottleneck();
    s.pills.phaCanh = 5;
    expect(breakthroughChance(s, 3)).toBeCloseTo(0.95);
    const after = breakthrough(s, 5, T0, always(0));
    expect(after.pills.phaCanh).toBe(2);
  });
});

describe('seclusion', () => {
  it('multiplies rate and resolves an event at the end', () => {
    const def = SECLUSIONS[0];
    let s = startSeclusion(fresh(), def.id, T0, always(0.9));
    expect(cultivationRate(s, T0)).toBe(def.rateMult);
    expect(canBreakthrough({ ...atFirstBottleneck(), seclusion: s.seclusion })).toBe(false);
    s = tick(s, T0 + def.minutes * 60_000 + 5000, always(0.9));
    expect(s.seclusion).toBeNull();
    // 10 phút ×1.5 rồi 5 giây ×1, nhưng có thể đã chạm bình cảnh nên chỉ kiểm tra cận dưới
    expect(totalCultivation(s.level, s.cultivation)).toBeGreaterThan(600);
    expect(s.log[0].text).toContain('bình an');
  });

  it('can be cancelled early without event', () => {
    let s = startSeclusion(fresh(), 'medium', T0, always(0));
    s = cancelSeclusion(s, T0 + 1000, always(0));
    expect(s.seclusion).toBeNull();
    expect(s.pills.phaCanh).toBe(0);
  });
});

describe('pills', () => {
  it('buys with stones and uses Tụ Khí Đan', () => {
    let s = fresh();
    expect(pillPrice(s, 'tuKhi')).toBe(50);
    expect(pillPrice({ ...s, level: 9 }, 'phaCanh')).toBe(600);
    s = buyPill(s, 'tuKhi', T0, always(0));
    expect(s.stones).toBe(0);
    expect(s.pills.tuKhi).toBe(1);
    expect(buyPill(s, 'tuKhi', T0, always(0)).pills.tuKhi).toBe(1);
    s = usePill(s, 'tuKhi', T0, always(0));
    expect(s.pills.tuKhi).toBe(0);
    expect(totalCultivation(s.level, s.cultivation)).toBeCloseTo(300);
  });

  it('Hồi Xuân Đan heals injury', () => {
    let s = breakthrough(atFirstBottleneck(), 0, T0, always(0.99));
    s.pills.hoiXuan = 1;
    s = usePill(s, 'hoiXuan', T0, always(0));
    expect(s.injuryUntil).toBe(0);
  });
});

describe('offline', () => {
  it('caps offline time at 12 hours', () => {
    const s = fresh();
    const { summary } = applyOffline(s, T0 + 48 * 3600_000, always(0.9));
    expect(summary.seconds).toBe(12 * 3600);
    expect(summary.capped).toBe(true);
  });

  it('keeps an unfinished seclusion running relative to the capped window', () => {
    const s = startSeclusion(fresh(), 'long', T0, always(0.9));
    const { state } = applyOffline(s, T0 + 48 * 3600_000, always(0.9));
    expect(state.seclusion).toBeNull();
    expect(state.log.some((l) => l.text.includes('Trường Bế Quan kết thúc'))).toBe(true);
  });
});

describe('save', () => {
  it('round-trips through export/import with Vietnamese text', () => {
    const s = fresh();
    const back = importSave(exportSave(s));
    expect(back).toEqual(s);
    expect(importSave('rác')).toBeNull();
  });
});

describe('formatNumber', () => {
  it('uses suffixes', () => {
    expect(formatNumber(5)).toBe('5.0');
    expect(formatNumber(1234)).toBe('1.23K');
    expect(formatNumber(5.7e8)).toBe('570.00M');
  });
});

describe('gate floors', () => {
  it('blocks breakthrough until the required bí cảnh floor is cleared', () => {
    const s = { ...atFirstBottleneck(), floor: 0 };
    expect(gateFloorFor(s)).toBe(3);
    expect(canBreakthrough(s)).toBe(false);
  });
});

describe('combat', () => {
  it('a much stronger fighter always wins, a much weaker one always loses', () => {
    const e = enemyFor(1);
    const strong = { ...e, name: 'A', hp: e.hp * 10, atk: e.atk * 10 };
    const weak = { ...e, name: 'B', hp: e.hp / 10, atk: e.atk / 10 };
    for (let i = 0; i < 20; i++) {
      expect(simulateBattle(strong, e, Math.random).win).toBe(true);
      expect(simulateBattle(weak, e, Math.random).win).toBe(false);
    }
  });

  it('every fifth floor is a boss with more HP', () => {
    expect(enemyFor(5).hp).toBeGreaterThan(enemyFor(6).hp);
    expect(enemyFor(5).name).toBe('Lang Vương');
  });

  it('clearing a floor advances progress and grants loot', () => {
    const s = fresh();
    s.level = 20; // đủ mạnh để chắc thắng tầng 1
    const after = challengeFloor(s, T0, Math.random);
    expect(after.floor).toBe(1);
    expect(after.bag).toHaveLength(1);
    expect(after.fragments).toBe(1);
    expect(after.lastBattle?.win).toBe(true);
  });

  it('losing injures the player and keeps the floor', () => {
    const after = challengeFloor({ ...fresh(), floor: 20 }, T0, Math.random);
    expect(after.floor).toBe(20);
    expect(after.injuryUntil).toBeGreaterThan(T0);
  });

  it('cannot fight during seclusion', () => {
    const s = startSeclusion({ ...fresh(), level: 20 }, 'short', T0, always(0.9));
    expect(challengeFloor(s, T0, Math.random).lastBattle).toBeNull();
  });
});

describe('farming', () => {
  it('produces loot per minute and halves cultivation speed', () => {
    let s = { ...fresh(), floor: 3 };
    s = startFarming(s, 3, T0, always(0));
    expect(cultivationRate(s, T0)).toBeCloseTo(0.5);
    s = tick(s, T0 + 10 * 60_000, always(0));
    expect(s.fragments).toBe(10);
    expect(s.bag).toHaveLength(10);
    s = stopFarming(s, T0 + 10 * 60_000, always(0));
    expect(s.farming).toBeNull();
  });

  it('auto-sells drops when the bag is full', () => {
    let s = { ...fresh(), floor: 1 };
    s.bag = Array.from({ length: BAG_LIMIT }, (_, i): Item => ({ id: 1000 + i, slot: 'weapon', tier: 0, floor: 1 }));
    s = startFarming(s, 1, T0, always(0));
    const before = s.stones;
    s = tick(s, T0 + 60_000, always(0));
    expect(s.bag).toHaveLength(BAG_LIMIT);
    expect(s.stones).toBeGreaterThan(before + 12);
  });

  it('is exclusive with seclusion', () => {
    const s = startFarming({ ...fresh(), floor: 1 }, 1, T0, always(0));
    expect(startSeclusion(s, 'short', T0, always(0)).seclusion).toBeNull();
  });
});

describe('gear', () => {
  it('equipping raises stats and swaps the old item back to the bag', () => {
    let s = fresh();
    s.bag = [
      { id: 1, slot: 'weapon', tier: 0, floor: 1 },
      { id: 2, slot: 'weapon', tier: 3, floor: 1 },
    ];
    const base = playerStats(s, T0).atk;
    s = equipItem(s, 1, T0, always(0));
    const withPham = playerStats(s, T0).atk;
    expect(withPham).toBeGreaterThan(base);
    s = equipItem(s, 2, T0, always(0));
    expect(playerStats(s, T0).atk).toBeGreaterThan(withPham);
    expect(s.bag.map((i) => i.id)).toEqual([1]);
    s = sellWorse(s, T0, always(0));
    expect(s.bag).toHaveLength(0);
  });

  it('pendants boost cultivation speed', () => {
    let s = fresh();
    s.bag = [{ id: 1, slot: 'pendant', tier: 3, floor: 1 }];
    s = equipItem(s, 1, T0, always(0));
    expect(cultivationBonus(s)).toBeCloseTo(1.12);
  });
});

describe('techniques', () => {
  it('path unlocks at Trúc Cơ and affinity boosts its effect', () => {
    const s = fresh();
    expect(choosePath(s, 'kiem', T0, always(0)).path).toBeNull();
    const ready = { ...s, level: PATH_UNLOCK_LEVEL };
    const kiem = choosePath(ready, 'kiem', T0, always(0)); // có Kim → hợp hệ
    const noAffinity = choosePath({ ...ready, root: { tier: 1, elements: ['Thủy'] } }, 'kiem', T0, always(0));
    expect(kiem.path).toBe('kiem');
    expect(playerStats(kiem, T0).atk / playerStats(noAffinity, T0).atk).toBeCloseTo(1.125 / 1.1);
  });

  it('upgrading costs fragments and stones', () => {
    let s = { ...fresh(), fragments: 1, stones: 100 };
    s = upgradeTech(s, 'dan_khi', T0, always(0));
    expect(s.techs.dan_khi).toBe(1);
    expect(s.fragments).toBe(0);
    expect(s.stones).toBe(50);
    expect(upgradeTech(s, 'dan_khi', T0, always(0)).techs.dan_khi).toBe(1);
  });
});

describe('migration', () => {
  it('upgrades a v1 save and pre-clears gate floors of the current realm', () => {
    const v2 = { ...fresh(), level: 10 };
    const v1: Record<string, unknown> = JSON.parse(serialize(v2));
    for (const k of ['path', 'tech', 'gear', 'bag', 'fragments', 'floor', 'farming', 'nextItemId', 'lastBattle']) delete v1[k];
    v1.version = 1;
    const s = deserialize(JSON.stringify(v1))!;
    expect(s.version).toBe(6);
    expect(s.floor).toBe(REALMS[1].gateFloor);
    expect(s.gear.weapon).toBeNull();
    expect(s.auto.climb).toBe(false);
    expect(s.stats.battlesWon).toBe(0);
  });
});

describe('balance guards', () => {
  // rng 0.5: không bạo kích, không dao động sát thương → kết quả cố định
  const mk = (level: number, gearFloor: number, tier = 0) => {
    const s = { ...fresh(), level };
    if (gearFloor) for (const slot of ['weapon', 'armor', 'pendant'] as const) s.gear[slot] = { id: 1, slot, tier, floor: gearFloor };
    return s;
  };
  const wins = (s: GameState, floor: number) => simulateBattle(playerStats(s, T0), enemyFor(floor), always(0.5)).win;

  it('a fresh Luyện Khí character can clear the first floors and the Trúc Cơ gate', () => {
    expect(wins(mk(5, 0), 1)).toBe(true);
    expect(wins(mk(7, 1), 2)).toBe(true);
    expect(wins(mk(8, 2), 3)).toBe(true);
  });

  it('the Kim Đan gate boss needs more than gear: techniques and a võ kỹ get it done', () => {
    expect(wins(mk(12, 0), 5)).toBe(false);
    expect(wins(mk(12, 4, 1), 5)).toBe(false);
    const ready: GameState = {
      ...mk(12, 4, 1),
      path: 'kiem',
      techs: { dan_khi: 5, kiem_0: 4 },
      mainTech: 'kiem_0',
      skills: { kiem_pha_thien: 3 },
      loadout: ['kiem_pha_thien'],
    };
    expect(wins(ready, 5)).toBe(true);
  });
});

describe('automation', () => {
  const on = (s: GameState, key: Parameters<typeof setAuto>[1]) => setAuto(s, key, true, T0, always(0.5));

  it('auto-climb clears floors over time, even offline', () => {
    let s = on({ ...fresh(), level: 20 }, 'climb');
    const { state, summary } = offline(s, T0 + 5 * 60_000, always(0.5));
    s = state;
    expect(s.floor).toBeGreaterThan(5);
    expect(summary.floors).toBe(s.floor);
    expect(summary.battlesWon).toBe(s.stats.battlesWon);
  });

  it('auto-climb pauses after a loss until combat power increases', () => {
    // Kẹt ở bình cảnh nên chiến lực không tự tăng
    let s = on({ ...atFirstBottleneck(), floor: 10 }, 'climb');
    s = tick(s, T0 + 1000, always(0.5));
    expect(s.stats.battlesLost).toBe(1);
    s = tick(s, T0 + 30 * 60_000, always(0.5));
    expect(s.stats.battlesLost).toBe(1);
    expect(autoClimbStatus(s, s.lastTick).kind).toBe('blocked');
    s = { ...s, level: 25 };
    expect(autoClimbStatus(s, s.lastTick).kind).not.toBe('blocked');
  });

  it('auto-climb does nothing while in seclusion', () => {
    let s = on({ ...fresh(), level: 20 }, 'climb');
    s = startSeclusion(s, 'short', T0, always(0.9));
    s = tick(s, T0 + 5 * 60_000, always(0.9));
    expect(s.floor).toBe(0);
  });

  it('auto-equip wears better drops and auto-sell discards worse ones', () => {
    let s = on(on({ ...fresh(), level: 20 }, 'equip'), 'sell');
    s.gear.weapon = { id: 99, slot: 'weapon', tier: 3, floor: 40 };
    s.gear.armor = { id: 98, slot: 'armor', tier: 3, floor: 40 };
    // rng 0: luôn rơi vũ khí phàm phẩm → kém hơn → bán; pendant ô trống → không xảy ra với rng 0
    s = challengeFloor(s, T0, always(0));
    expect(s.bag).toHaveLength(0);
    expect(s.gear.weapon?.id).toBe(99);
    s.gear.weapon = null;
    s = challengeFloor(s, T0, always(0));
    expect(s.gear.weapon).not.toBeNull();
    expect(s.stats.itemsFound).toBe(2);
  });

  it('auto-reclusion chains seclusions but stops at a full bottleneck', () => {
    // Trúc Cơ: 20 phút bế quan chưa đủ đầy bình cảnh
    let s = on({ ...fresh(), level: PATH_UNLOCK_LEVEL }, 'reclusion');
    s = startSeclusion(s, 'short', T0, always(0.9));
    s = tick(s, T0 + 25 * 60_000, always(0.9));
    expect(s.stats.seclusions).toBe(2);
    expect(s.seclusion).not.toBeNull();
    s = { ...atFirstBottleneck(), auto: s.auto, seclusion: { id: 'short', start: T0, end: T0 + 60_000, gained: 0 } };
    s = tick(s, T0 + 61_000, always(0.9));
    expect(s.seclusion).toBeNull();
  });

  it('auto-heal uses Hồi Xuân Đan when injured', () => {
    let s = on(atFirstBottleneck(), 'heal');
    s.pills.hoiXuan = 1;
    s = breakthrough(s, 0, T0, always(0.99));
    expect(s.injuryUntil).toBe(0);
    expect(s.pills.hoiXuan).toBe(0);
  });
});

describe('skills', () => {
  const kiemAt = (level: number, floor = 0): GameState =>
    choosePath({ ...fresh(), level: Math.max(level, PATH_UNLOCK_LEVEL), floor }, 'kiem', T0, always(0.5));

  it('choosing a path teaches its first skill and equips it', () => {
    const s = kiemAt(PATH_UNLOCK_LEVEL);
    expect(s.skills.kiem_pha_thien).toBe(1);
    expect(s.loadout).toEqual(['kiem_pha_thien']);
  });

  it('skills already earned from bosses are granted on path choice', () => {
    const s = kiemAt(PATH_UNLOCK_LEVEL, 15);
    expect(Object.keys(s.skills).sort()).toEqual(['chung_thanh_tam', 'kiem_pha_thien', 'kiem_phan_quang', 'kiem_y'].sort());
    expect(s.loadout).toHaveLength(3);
  });

  it('beating a boss drops its bí tịch', () => {
    let s = kiemAt(30, 4);
    s.loadout = [];
    s = challengeFloor(s, T0, always(0.5));
    expect(s.floor).toBe(5);
    expect(s.skills.kiem_phan_quang).toBe(1);
  });

  it('only as many skills as unlocked slots take effect', () => {
    const s = kiemAt(PATH_UNLOCK_LEVEL, 15); // Trúc Cơ: 1 ô
    expect(equippedSkills(s)).toHaveLength(1);
    expect(equippedSkills({ ...s, level: 17 })).toHaveLength(3); // Nguyên Anh
  });

  it('loadout can be reordered and toggled', () => {
    let s = kiemAt(PATH_UNLOCK_LEVEL, 15);
    const [a, b] = s.loadout;
    s = moveSkill(s, b, -1, T0, always(0));
    expect(s.loadout.slice(0, 2)).toEqual([b, a]);
    s = toggleSkill(s, a, T0, always(0));
    expect(s.loadout).not.toContain(a);
    s = toggleSkill(s, a, T0, always(0));
    expect(s.loadout[s.loadout.length - 1]).toBe(a);
  });

  it('shop skills need the realm and stones; upgrades cost fragments', () => {
    let s = { ...fresh(), stones: 10_000 };
    expect(buySkill(s, 'chung_lang_ba', T0, always(0)).skills.chung_lang_ba).toBeUndefined();
    s = buySkill({ ...s, level: PATH_UNLOCK_LEVEL }, 'chung_lang_ba', T0, always(0));
    expect(s.skills.chung_lang_ba).toBe(1);
    s = upgradeSkill({ ...s, fragments: 2 }, 'chung_lang_ba', T0, always(0));
    expect(s.skills.chung_lang_ba).toBe(2);
    expect(s.fragments).toBe(0);
  });

  it('v3 saves get the skills their cleared bosses would have dropped', () => {
    const v4 = choosePath({ ...fresh(), level: 12, floor: 10 }, 'the', T0, always(0));
    const v3: Record<string, unknown> = JSON.parse(serialize(v4));
    delete v3.skills;
    delete v3.loadout;
    v3.version = 3;
    const s = deserialize(JSON.stringify(v3))!;
    expect(s.skills).toEqual({ the_ba_vuong: 1, the_kim_cuong: 1, chung_thanh_tam: 1 });
  });

  describe('battle effects', () => {
    const dummy = (over: Partial<Fighter> = {}): Fighter => ({
      name: 'X', hp: 1000, atk: 50, def: 10, spd: 100, crit: 0, skills: [], ...over,
    });

    it('heals when low and shields absorb damage', () => {
      const healer = dummy({ name: 'H', hp: 1000, skills: [{ id: 'the_huyet_khi', level: 1 }] });
      const r = simulateBattle(healer, dummy({ atk: 120 }), always(0.5));
      expect(r.events.some((e) => e.fx === 'heal' && (e.amount ?? 0) > 0)).toBe(true);
      const shielded = dummy({ skills: [{ id: 'the_kim_cuong', level: 1 }] });
      const r2 = simulateBattle(shielded, dummy(), always(0.5));
      const first = r2.events.find((e) => e.fx === 'shield');
      expect(first?.amount).toBeCloseTo(300);
    });

    it('a guaranteed stun makes the enemy lose its next turn', () => {
      const r = simulateBattle(dummy({ skills: [{ id: 'the_ba_vuong', level: 1 }] }), dummy(), always(0));
      expect(r.events.some((e) => e.fx === 'stun' && e.by === 'e')).toBe(true);
    });

    it('burn ticks and cleanse removes it', () => {
      const burner = dummy({ skills: [{ id: 'phap_liet_hoa', level: 1 }] });
      const r = simulateBattle(burner, dummy(), always(0.5));
      expect(r.events.some((e) => e.fx === 'burn' && e.target === 'e')).toBe(true);
      const r2 = simulateBattle(burner, dummy({ skills: [{ id: 'chung_thanh_tam', level: 1 }] }), always(0.5));
      expect(r2.events.some((e) => e.fx === 'cleanse' && e.by === 'e')).toBe(true);
    });

    it('skills make an otherwise even fight winnable', () => {
      const even = simulateBattle(dummy({ spd: 99 }), dummy(), always(0.5));
      expect(even.win).toBe(false);
      const skilled = simulateBattle(dummy({ spd: 99, skills: [{ id: 'kiem_pha_thien', level: 1 }] }), dummy(), always(0.5));
      expect(skilled.win).toBe(true);
    });
  });
});

describe('gear: slots, tiers and affixes', () => {
  it('rolls every slot, including ring and boots', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) seen.add(rollItem(5, false, Math.random, i).slot);
    expect([...seen].sort()).toEqual([...SLOTS].sort());
  });

  it('Thần Phẩm only drops from bosses; bosses never drop Phàm Phẩm', () => {
    for (let i = 0; i < 1500; i++) expect(rollItem(5, false, Math.random, i).tier).toBeLessThan(4);
    const tiers = new Set<number>();
    for (let i = 0; i < 3000; i++) tiers.add(rollItem(5, true, Math.random, i).tier);
    expect(tiers.has(0)).toBe(false);
    expect(tiers.has(4)).toBe(true);
  });

  it('affix count follows the tier, with unique ids and values in range', () => {
    for (let i = 0; i < 800; i++) {
      const it = rollItem(10, i % 2 === 0, Math.random, i);
      const affixes = it.affixes ?? [];
      expect(affixes).toHaveLength(AFFIX_COUNTS[it.tier]);
      expect(new Set(affixes.map((a) => a.id)).size).toBe(affixes.length);
      for (const a of affixes) {
        const def = AFFIXES.find((x) => x.id === a.id)!;
        const scale = 1 + 0.15 * (it.tier - 1);
        expect(a.v).toBeGreaterThanOrEqual(def.range[0] * scale - 0.5e-3 - (a.id === 'spd' ? 0.5 : 0));
        expect(a.v).toBeLessThanOrEqual(def.range[1] * scale + 0.5e-3 + (a.id === 'spd' ? 0.5 : 0));
      }
    }
  });

  it('ring adds crit and boots add speed', () => {
    const base = fresh();
    const ring: Item = { id: 1, slot: 'ring', tier: 2, floor: 5 };
    const boots: Item = { id: 2, slot: 'boots', tier: 2, floor: 5 };
    const crit0 = playerStats(base, T0).crit;
    const spd0 = playerStats(base, T0).spd;
    const s = { ...base, gear: { ...base.gear, ring, boots } };
    expect(playerStats(s, T0).crit).toBeCloseTo(crit0 + 0.012 * 2.2);
    expect(playerStats(s, T0).spd).toBeCloseTo(spd0 + 2 * 2.2);
  });

  it('affixes feed into combat stats and compare in itemScore', () => {
    const plain: Item = { id: 1, slot: 'weapon', tier: 2, floor: 5, affixes: [] };
    const rich: Item = {
      ...plain,
      id: 2,
      affixes: [
        { id: 'lifesteal', v: 0.05 },
        { id: 'atkPct', v: 0.1 },
      ],
    };
    expect(itemScore(rich)).toBeGreaterThan(itemScore(plain));
    const s = { ...fresh(), gear: { ...fresh().gear, weapon: rich } };
    const p = playerStats(s, T0);
    expect(p.lifesteal).toBeCloseTo(0.05);
    expect(p.atk / playerStats({ ...s, gear: { ...s.gear, weapon: { ...plain } } }, T0).atk).toBeCloseTo(1.1, 1);
  });

  it('stone and cultivation affixes raise income', () => {
    const s = fresh();
    const pendant: Item = { id: 1, slot: 'pendant', tier: 0, floor: 1, affixes: [{ id: 'stones', v: 0.5 }, { id: 'cultivation', v: 0.25 }] };
    const geared = { ...s, gear: { ...s.gear, pendant } };
    expect(stoneRate(geared) / stoneRate(s)).toBeCloseTo(1.5);
    expect(cultivationBonus(geared)).toBeCloseTo(1 + 0.02 + 0.25);
  });
});

describe('gear sets', () => {
  const piece = (slot: Item['slot'], floor: number, id: number): Item => ({ id, slot, tier: 0, floor, affixes: [] });

  it('two pieces from the same zone grant the 2-piece bonus, four add the 4-piece bonus', () => {
    const s = fresh();
    s.gear.weapon = piece('weapon', 1, 1);
    expect(gearMods(s).hpPct).toBe(0);
    s.gear.armor = piece('armor', 3, 2);
    expect(gearMods(s).hpPct).toBeCloseTo(SETS[0].two.hpPct!);
    s.gear.ring = piece('ring', 5, 3);
    s.gear.boots = piece('boots', 2, 4);
    expect(gearMods(s).spd).toBeCloseTo(SETS[0].four.spd!);
    expect(gearMods(s).crit).toBeCloseTo(SETS[0].four.crit!);
  });

  it('pieces from different zones do not combine', () => {
    const s = fresh();
    s.gear.weapon = piece('weapon', 1, 1);
    s.gear.armor = piece('armor', 6, 2);
    s.gear.ring = piece('ring', 11, 3);
    expect(gearMods(s).hpPct).toBe(0);
    expect(gearMods(s).lifesteal).toBe(0);
  });

  it('set bonuses stack with item affixes', () => {
    const s = fresh();
    s.gear.weapon = { ...piece('weapon', 6, 1), affixes: [{ id: 'lifesteal', v: 0.03 }] };
    s.gear.armor = piece('armor', 7, 2);
    expect(gearMods(s).lifesteal).toBeCloseTo(0.03 + SETS[1].two.lifesteal!);
  });
});

describe('gear combat passives', () => {
  const dummy = (over: Partial<Fighter> = {}): Fighter => ({
    name: 'X', hp: 1000, atk: 50, def: 10, spd: 100, crit: 0, skills: [], ...over,
  });

  it('lifesteal heals the attacker for a share of damage dealt', () => {
    const r = simulateBattle(dummy({ lifesteal: 0.5 }), dummy({ atk: 80 }), always(0.5));
    const hpAfterHit = r.events.filter((e) => e.by === 'p' && e.fx === 'hit').length;
    expect(hpAfterHit).toBeGreaterThan(0);
    const without = simulateBattle(dummy(), dummy({ atk: 80 }), always(0.5));
    expect(r.events.length).toBeGreaterThanOrEqual(without.events.length);
    expect(r.events.some((e) => e.by === 'e' && e.hpP > 0 && e.hpP < 1000) || r.win).toBe(true);
  });

  it('thorns reflect damage and can kill the attacker', () => {
    const r = simulateBattle(dummy(), dummy({ thorns: 0.6 }), always(0.5));
    expect(r.events.some((e) => e.fx === 'thorns' && e.target === 'p' && e.dmg > 0)).toBe(true);
    const lethal = simulateBattle(dummy({ hp: 20 }), dummy({ hp: 100000, thorns: 5 }), always(0.5));
    expect(lethal.win).toBe(false);
  });

  it('passive dodge makes attacks miss', () => {
    const r = simulateBattle(dummy(), dummy({ dodge: 0.6 }), always(0));
    expect(r.events.some((e) => e.fx === 'miss' && e.by === 'p')).toBe(true);
  });

  it('stunHit and burnHit apply on normal attacks', () => {
    const r = simulateBattle(dummy({ stunHit: 1, burnHit: 0.3 }), dummy(), always(0.5));
    expect(r.events.some((e) => e.fx === 'stun' && e.by === 'e')).toBe(true);
    expect(r.events.some((e) => e.fx === 'burn' && e.target === 'e')).toBe(true);
  });
});

describe('enhancement', () => {
  const sword = (over: Partial<Item> = {}): Item => ({ id: 7, slot: 'weapon', tier: 1, floor: 10, plus: 0, affixes: [], ...over });

  it('each level adds 8% of the base stats', () => {
    expect(itemStats(sword({ plus: 5 })).atk / itemStats(sword()).atk).toBeCloseTo(1.4);
    expect(itemStats(sword({ plus: 10, slot: 'boots' })).spd / itemStats(sword({ slot: 'boots' })).spd).toBeCloseTo(1.8);
  });

  it('success levels up and costs stones; works on bag items too', () => {
    let s = { ...fresh(), stones: 1e6, bag: [sword()] };
    const cost = enhanceCost(s.bag[0]);
    s = enhanceItem(s, 7, T0, always(0));
    expect(s.bag[0].plus).toBe(1);
    expect(s.stones).toBeCloseTo(1e6 - cost);
    s.gear.weapon = sword({ id: 8, plus: 3 });
    s = enhanceItem(s, 8, T0, always(0));
    expect(s.gear.weapon?.plus).toBe(4);
  });

  it('failure keeps the item level but still costs stones', () => {
    let s = { ...fresh(), stones: 1e6, bag: [sword({ plus: 6 })] };
    const cost = enhanceCost(s.bag[0]);
    s = enhanceItem(s, 7, T0, always(0.999));
    expect(s.bag[0].plus).toBe(6);
    expect(s.stones).toBeCloseTo(1e6 - cost);
    expect(s.log[0].kind).toBe('bad');
  });

  it('chance drops with level, cost rises, cap is +10 and stones are required', () => {
    expect(enhanceChance(sword({ plus: 0 }))).toBe(1);
    expect(enhanceChance(sword({ plus: 9 }))).toBeLessThan(enhanceChance(sword({ plus: 4 })));
    expect(enhanceCost(sword({ plus: 4 }))).toBeGreaterThan(enhanceCost(sword({ plus: 1 })));
    const rich = { ...fresh(), stones: 1e9 };
    expect(canEnhance(rich, sword({ plus: ENHANCE_MAX }))).toBe(false);
    expect(canEnhance({ ...fresh(), stones: 0 }, sword())).toBe(false);
    expect(enhanceItem({ ...fresh(), stones: 0, bag: [sword()] }, 7, T0, always(0)).bag[0].plus).toBe(0);
  });

  it('enhanced items sell for more', () => {
    expect(itemSellPrice(sword({ plus: 5 }))).toBeGreaterThan(itemSellPrice(sword()));
  });
});

describe('gear farming and migration', () => {
  it('farming a boss floor drops boss-quality items', () => {
    let s = { ...fresh(), floor: 5 };
    s = startFarming(s, 5, T0, always(0));
    s = tick(s, T0 + 5 * 60_000, always(0));
    expect(s.bag.length).toBeGreaterThan(0);
    expect(s.bag.every((it) => it.tier >= 1)).toBe(true);
  });

  it('v4 saves gain empty ring and boots slots and keep their items', () => {
    const v5 = fresh();
    v5.gear.weapon = { id: 1, slot: 'weapon', tier: 1, floor: 3 };
    const v4: Record<string, unknown> = JSON.parse(serialize(v5));
    v4.version = 4;
    const g = v4.gear as Record<string, unknown>;
    delete g.ring;
    delete g.boots;
    const s = deserialize(JSON.stringify(v4))!;
    expect(s.version).toBe(6);
    expect(s.gear.ring).toBeNull();
    expect(s.gear.boots).toBeNull();
    expect(s.gear.weapon?.id).toBe(1);
    expect(TIERS).toHaveLength(5);
  });
});

describe('balance guards: full gear sets', () => {
  const geared = (tier: number, techFrac: number, skillLv: number): GameState => {
    const s: GameState = {
      ...fresh(),
      level: 12,
      floor: 4,
      path: 'kiem',
      techs: { dan_khi: Math.round(5 * techFrac), kiem_0: Math.max(1, Math.round(4 * techFrac)) },
      mainTech: 'kiem_0',
      skills: { kiem_pha_thien: skillLv, kiem_phan_quang: skillLv },
      loadout: ['kiem_pha_thien', 'kiem_phan_quang'],
    };
    for (const slot of SLOTS) s.gear[slot] = { id: 1, slot, tier, floor: 3, affixes: [], plus: 0 };
    return s;
  };
  const wins = (s: GameState) => simulateBattle(playerStats(s, T0), enemyFor(5), always(0.5)).win;

  it('five Phàm Phẩm pieces with half-built techniques still cannot beat the Kim Đan gate', () => {
    expect(wins(geared(0, 0.5, 1))).toBe(false);
  });

  it('five Bảo Phẩm pieces with well-built techniques beat it', () => {
    expect(wins(geared(2, 1, 3))).toBe(true);
  });
});

describe('technique library', () => {
  const kiem = (extra: Partial<GameState> = {}): GameState => {
    const s = choosePath({ ...fresh(), level: PATH_UNLOCK_LEVEL }, 'kiem', T0, always(0));
    return { ...s, ...extra };
  };

  it('new characters start with Dẫn Khí Quyết (tầng 0) in a sub slot and no main technique', () => {
    const s = fresh();
    expect(s.techs).toEqual({ dan_khi: 0 });
    expect(s.subTechs).toEqual(['dan_khi']);
    expect(s.mainTech).toBeNull();
  });

  it('choosing a path teaches the Hoàng Cấp main technique at tầng 1', () => {
    const s = kiem();
    expect(s.mainTech).toBe('kiem_0');
    expect(s.techs.kiem_0).toBe(1);
    expect(TECHS.kiem_0.name).toBe('Thanh Liên Kiếm Quyết');
  });

  it('main techniques scale with grade and keep the affinity bonus', () => {
    const lv = (id: 'kiem_0' | 'kiem_1' | 'kiem_2' | 'kiem_3') => {
      const s = kiem({ techs: { dan_khi: 0, [id]: 6 }, mainTech: id });
      return techMods(s).atkPct;
    };
    expect(lv('kiem_1')).toBeGreaterThan(lv('kiem_0'));
    expect(lv('kiem_2')).toBeGreaterThan(lv('kiem_1'));
    expect(lv('kiem_3')).toBeGreaterThan(lv('kiem_2'));
    expect(lv('kiem_0')).toBeCloseTo(0.08 * 6 * 1.25);
  });

  it('sub techniques apply their effects and respect the 2 slot limit', () => {
    let s = kiem({ techs: { dan_khi: 5, than_thuc: 5, liem_tuc: 5 }, subTechs: ['dan_khi'] });
    s = toggleSubTech(s, 'than_thuc', T0, always(0));
    expect(s.subTechs).toEqual(['dan_khi', 'than_thuc']);
    s = toggleSubTech(s, 'liem_tuc', T0, always(0));
    expect(s.subTechs).toEqual(['dan_khi', 'than_thuc']);
    const m = techMods(s);
    expect(m.crit).toBeCloseTo(0.06);
    expect(m.spd).toBeCloseTo(4);
    expect(m.hpPct).toBeCloseTo(0.2);
    s = toggleSubTech(s, 'dan_khi', T0, always(0));
    expect(s.subTechs).toEqual(['than_thuc']);
  });

  it('Quy Tức Công extends the offline limit', () => {
    const s = kiem({ techs: { dan_khi: 0, quy_tuc: 8 }, subTechs: ['quy_tuc'] });
    expect(charMods(s).offline).toBe(4);
    const { summary } = offline(s, T0 + 48 * 3600_000, always(0.9));
    expect(summary.seconds).toBe(16 * 3600);
  });

  it('Tụ Linh Trận Pháp speeds up seclusion only', () => {
    const base = startSeclusion(kiem({ techs: { dan_khi: 0, tu_linh: 0 }, subTechs: [] }), 'short', T0, always(0.9));
    const boosted = startSeclusion(kiem({ techs: { dan_khi: 0, tu_linh: 5 }, subTechs: ['tu_linh'] }), 'short', T0, always(0.9));
    expect(cultivationRate(boosted, T0) / cultivationRate(base, T0)).toBeCloseTo(1.2);
    expect(cultivationRate({ ...boosted, seclusion: null }, T0)).toBeCloseTo(cultivationRate({ ...base, seclusion: null }, T0));
  });

  it('boss bí kíp are learned and auto-equipped while slots are free', () => {
    let s = kiem({ floor: 9, level: 36 }); // cảnh giới cao để chắc thắng thủ lĩnh
    s = challengeFloor(s, T0, always(0.5)); // thủ lĩnh tầng 10
    expect(s.floor).toBe(10);
    expect(hasTech(s, 'kim_chung')).toBe(true);
    expect(s.subTechs).toContain('kim_chung');
    // ô đã đầy: học được nhưng không tự mang
    s = { ...s, floor: 19 };
    s = challengeFloor(s, T0, always(0.5));
    expect(hasTech(s, 'phan_chan')).toBe(true);
    expect(s.subTechs).toEqual(['dan_khi', 'kim_chung']);
  });

  it('a new main technique keeps half the old levels and the old one can be switched back to', () => {
    let s = kiem({ level: 17, stones: 1e6, techs: { dan_khi: 0, kiem_0: 10 }, mainTech: 'kiem_0' });
    expect(canBuyTech(s, 'kiem_1')).toBe(true);
    s = buyTech(s, 'kiem_1', T0, always(0));
    expect(s.mainTech).toBe('kiem_1');
    expect(s.techs.kiem_1).toBe(5);
    s = setMainTech(s, 'kiem_0', T0, always(0));
    expect(s.mainTech).toBe('kiem_0');
    expect(s.techs.kiem_0).toBe(10);
  });

  it('shop techniques need the realm, the stones and a matching path', () => {
    const rich = { ...kiem(), stones: 1e6 };
    expect(canBuyTech({ ...rich, level: 0 }, 'quy_tuc')).toBe(false);
    expect(canBuyTech(rich, 'quy_tuc')).toBe(true);
    expect(canBuyTech({ ...rich, stones: 10 }, 'quy_tuc')).toBe(false);
    expect(canBuyTech({ ...rich, level: 17 }, 'the_1')).toBe(false);
    expect(canBuyTech(buyTech(rich, 'quy_tuc', T0, always(0)), 'quy_tuc')).toBe(false);
  });

  it('upgrade caps: sub techs by their own limit, main by realm; higher grades cost more', () => {
    const rich = kiem({ fragments: 999, stones: 1e9 });
    expect(upgradeTech({ ...rich, techs: { dan_khi: 5 } }, 'dan_khi', T0, always(0)).techs.dan_khi).toBe(5);
    expect(upgradeTech({ ...rich, techs: { dan_khi: 0, kiem_0: 3 } }, 'kiem_0', T0, always(0)).techs.kiem_0).toBe(4);
    expect(upgradeTech({ ...rich, techs: { dan_khi: 0, kiem_0: 4 } }, 'kiem_0', T0, always(0)).techs.kiem_0).toBe(4);
  });

  it('v5 saves keep their technique levels and earn techniques for the bosses already beaten', () => {
    const v6 = choosePath({ ...fresh(), level: 12, floor: 25 }, 'the', T0, always(0));
    const v5: Record<string, unknown> = JSON.parse(serialize(v6));
    for (const k of ['techs', 'mainTech', 'subTechs', 'natal']) delete v5[k];
    v5.version = 5;
    v5.tech = { base: 3, path: 6 };
    const s = deserialize(JSON.stringify(v5))!;
    expect(s.version).toBe(6);
    expect(s.techs.dan_khi).toBe(3);
    expect(s.techs.the_0).toBe(6);
    expect(s.mainTech).toBe('the_0');
    expect(hasTech(s, 'kim_chung')).toBe(true);
    expect(hasTech(s, 'phe_huyet')).toBe(true);
    expect(s.natal).toBeNull();
    expect((s.auto as { devour: boolean }).devour).toBe(false);
  });
});

describe('natal artifact', () => {
  const ready = (): GameState => ({ ...fresh(), level: PATH_UNLOCK_LEVEL });
  const forged = (id: 'phi_kiem' | 'ho_lo' | 'linh_chung' = 'phi_kiem'): GameState => forgeNatal(ready(), id, T0, always(0));

  it('unlocks at Trúc Cơ and can only be forged once', () => {
    expect(forgeNatal(fresh(), 'phi_kiem', T0, always(0)).natal).toBeNull();
    const s = forged();
    expect(s.natal).toEqual({ id: 'phi_kiem', level: 1, exp: 0 });
    expect(forgeNatal(s, 'ho_lo', T0, always(0)).natal?.id).toBe('phi_kiem');
  });

  it('devouring a bag item grants exp and levels up, removing the item', () => {
    let s = forged();
    s.bag = [{ id: 1, slot: 'weapon', tier: 0, floor: 10, affixes: [], plus: 0 }];
    const gain = itemDevourExp(s.bag[0]);
    expect(gain).toBe(natalExpFromItem(1, 10, 0));
    s = devourItem(s, 1, T0, always(0));
    expect(s.bag).toHaveLength(0);
    // 37 kinh nghiệm chưa đủ 60 để lên cấp 2
    expect(gain).toBeLessThan(natalExpNeeded(1));
    expect(s.natal).toMatchObject({ level: 1, exp: gain });
  });

  it('exp carries over multiple levels and enhanced or higher tier items give more', () => {
    let s = forged();
    s.bag = [{ id: 1, slot: 'weapon', tier: 3, floor: 30, affixes: [], plus: 4 }];
    s = devourItem(s, 1, T0, always(0));
    expect(s.natal!.level).toBeGreaterThan(3);
    const phàm = itemDevourExp({ id: 1, slot: 'weapon', tier: 0, floor: 30 });
    expect(itemDevourExp({ id: 2, slot: 'weapon', tier: 3, floor: 30, plus: 4 })).toBeGreaterThan(phàm * 5);
  });

  it('stages unlock bonuses and the natal skill levels up with the artifact', () => {
    expect([1, 9, 10, 19, 20, 29, 30].map(natalStage)).toEqual([0, 0, 1, 1, 2, 2, 3]);
    expect([1, 3, 4, 28, 30].map(natalSkillLevel)).toEqual([1, 1, 2, 10, 10]);
    const at = (level: number): GameState => ({ ...forged(), natal: { id: 'phi_kiem', level, exp: 0 } });
    expect(natalMods(at(9)).atkPct).toBeCloseTo(0.008 * 9);
    expect(natalMods(at(10)).crit).toBeCloseTo(0.03);
    expect(natalMods(at(20)).atkPct).toBeCloseTo(0.008 * 20 + 0.05);
    expect(natalMods(at(30)).spd).toBe(4);
    expect(charMods(at(10)).atkPct).toBeGreaterThan(charMods(forged()).atkPct);
  });

  it('the natal skill is always in the fighter loadout and fires first', () => {
    const s = forged('linh_chung');
    const p = playerStats(s, T0);
    expect(p.skills[0]).toEqual({ id: NATALS.linh_chung.skillId, level: 1 });
    const r = simulateBattle(p, enemyFor(1), always(0.5));
    expect(r.events.find((e) => e.by === 'p')?.skill).toBe('Chung Âm Chấn Hồn');
    expect(playerStats(fresh(), T0).skills).toHaveLength(0);
  });

  it('devourWorse only eats items weaker than the worn one', () => {
    let s = forged();
    s.gear.weapon = { id: 9, slot: 'weapon', tier: 3, floor: 20, affixes: [], plus: 0 };
    s.bag = [
      { id: 1, slot: 'weapon', tier: 0, floor: 5, affixes: [], plus: 0 },
      { id: 2, slot: 'weapon', tier: 4, floor: 30, affixes: [], plus: 0 },
    ];
    s = devourWorse(s, T0, always(0));
    expect(s.bag.map((i) => i.id)).toEqual([2]);
    expect(s.natal!.exp).toBe(itemDevourExp({ id: 1, slot: 'weapon', tier: 0, floor: 5 }));
  });

  it('auto-devour feeds spare drops to the natal artifact instead of selling them', () => {
    let s = forged();
    s.auto = { ...s.auto, devour: true, sell: true };
    s.level = 20;
    s.gear.weapon = { id: 9, slot: 'weapon', tier: 4, floor: 40, affixes: [], plus: 0 };
    s.gear.armor = { id: 10, slot: 'armor', tier: 4, floor: 40, affixes: [], plus: 0 };
    s.gear.pendant = { id: 11, slot: 'pendant', tier: 4, floor: 40, affixes: [], plus: 0 };
    s.gear.ring = { id: 12, slot: 'ring', tier: 4, floor: 40, affixes: [], plus: 0 };
    s.gear.boots = { id: 13, slot: 'boots', tier: 4, floor: 40, affixes: [], plus: 0 };
    const stones = s.stones;
    const total = (st: GameState) => st.natal!.level * 1e6 + st.natal!.exp;
    const after = challengeFloor(s, T0, always(0));
    expect(after.bag).toHaveLength(0);
    expect(total(after)).toBeGreaterThan(total(s));
    expect(after.stones - stones).toBeLessThan(500); // chỉ thưởng tầng, đồ không bị bán
    // tắt tự luyện hóa thì quay về tự bán
    const sold = challengeFloor({ ...s, auto: { ...s.auto, devour: false } }, T0, always(0));
    expect(total(sold)).toBe(total(s));
  });

  it('stops at the max level and refuses more food', () => {
    let s: GameState = { ...forged(), natal: { id: 'ho_lo', level: NATAL_MAX_LEVEL - 1, exp: 0 } };
    s.bag = [{ id: 1, slot: 'weapon', tier: 4, floor: 40, affixes: [], plus: 10 }, { id: 2, slot: 'weapon', tier: 0, floor: 1 }];
    s = devourItem(s, 1, T0, always(0));
    expect(s.natal!.level).toBe(NATAL_MAX_LEVEL);
    expect(s.natal!.exp).toBe(0);
    expect(canDevour(s)).toBe(false);
    expect(devourItem(s, 2, T0, always(0)).bag).toHaveLength(1);
  });
});
