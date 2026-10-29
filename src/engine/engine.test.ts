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
  BUILDINGS,
  HERBS,
  RECIPES,
  breakPillBonus,
  breakPillPlan,
  buildingCost,
  canPlant,
  canStartJob,
  canUpgradeBuilding,
  dwellingMods,
  growMs,
  harvestAll,
  harvestPlot,
  jobSeconds,
  herbCount,
  maxCraftable,
  plantAll,
  plantHerb,
  plantableHerbs,
  plotCount,
  readyPlots,
  sellHerb,
  startJob,
  upgradeBuilding,
  canUsePill,
  claimAllQuests,
  claimQuest,
  claimableQuests,
  currentQuest,
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
import { advise } from './guide';

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
    expect(s.version).toBe(11);
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
    expect(s.version).toBe(11);
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
    expect(s.version).toBe(11);
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

describe('quests', () => {
  const claimIds = (s: GameState) => s.quests.claimed;

  it('a new character has nothing to claim and its first quest is the current goal', () => {
    const s = fresh();
    expect(claimableQuests(s)).toHaveLength(0);
    expect(currentQuest(s)?.id).toBe('nhap_mon');
  });

  it('quests complete from state; stone rewards scale with the quest tier, not with when it is claimed', () => {
    const s = { ...fresh(), level: 2 };
    expect(claimableQuests(s).map((q) => q.id)).toEqual(['nhap_mon']);
    const early = claimQuest(s, 'nhap_mon', T0, always(0));
    expect(early.stones).toBe(s.stones + 60);
    expect(claimIds(early)).toEqual(['nhap_mon']);
    // để dành đến Hóa Thần mới nhận vẫn chỉ được đúng 60
    const late = { ...s, level: 21 };
    expect(claimQuest(late, 'nhap_mon', T0, always(0)).stones).toBe(late.stones + 60);
    // nhiệm vụ nhắm tới Kim Đan (tier 2) thưởng ×4
    expect(claimQuest({ ...s, level: 13 }, 'kim_dan', T0, always(0)).stones).toBe(s.stones + 400 * 4);
  });

  it('a quest can only be claimed once and only when done', () => {
    let s = { ...fresh(), level: 2 };
    s = claimQuest(s, 'nhap_mon', T0, always(0));
    expect(claimQuest(s, 'nhap_mon', T0, always(0)).stones).toBe(s.stones);
    expect(claimQuest(fresh(), 'tang_1', T0, always(0)).quests.claimed).toEqual([]);
    expect(claimQuest(fresh(), 'khong_co', T0, always(0)).quests.claimed).toEqual([]);
  });

  it('rewards can include fragments and pills; claim-all takes everything that is done', () => {
    let s = { ...fresh(), level: 9, floor: 3, stats: { ...fresh().stats, seclusions: 1 } };
    const ids = claimableQuests(s).map((q) => q.id);
    expect(ids).toEqual(expect.arrayContaining(['nhap_mon', 'be_quan', 'tang_1', 'tang_3', 'truc_co']));
    s = claimAllQuests(s, T0, always(0));
    expect(claimableQuests(s)).toHaveLength(0);
    expect(s.pills.tuKhi).toBe(1);
    expect(s.pills.phaCanh).toBe(1);
    expect(s.fragments).toBeGreaterThanOrEqual(2 + 4);
    expect(s.log[0].kind).toBe('good');
  });

  it('the current goal skips finished quests and moves on after claiming', () => {
    const s = { ...fresh(), level: 2, floor: 1 };
    expect(currentQuest(s)?.id).toBe('be_quan');
    expect(currentQuest(claimAllQuests(s, T0, always(0)))?.id).toBe('be_quan');
  });

  it('conditions read the right state: gear, techniques, sets, natal, floors', () => {
    const base = { ...fresh(), level: 9 };
    const has = (s: GameState, id: string) => claimableQuests(s).some((q) => q.id === id);
    expect(has(base, 'mac_do')).toBe(false);
    expect(has({ ...base, gear: { ...base.gear, weapon: { id: 1, slot: 'weapon', tier: 0, floor: 1 } } }, 'mac_do')).toBe(true);
    expect(has({ ...base, techs: { dan_khi: 1 } }, 'dan_khi')).toBe(true);
    expect(has({ ...base, bag: [{ id: 1, slot: 'ring', tier: 0, floor: 1, plus: 3 }] }, 'cuong_hoa')).toBe(true);
    const pair = { ...base, gear: { ...base.gear, weapon: { id: 1, slot: 'weapon', tier: 0, floor: 1 }, armor: { id: 2, slot: 'armor', tier: 0, floor: 2 } } };
    expect(has(pair as GameState, 'hop_bo')).toBe(true);
    expect(has(forgeNatal(base, 'ho_lo', T0, always(0)), 'ban_menh')).toBe(true);
  });

  it('v6 saves get an empty quest log and can claim what they already earned', () => {
    const v7 = { ...fresh(), level: 10, floor: 3 };
    const v6: Record<string, unknown> = JSON.parse(serialize(v7));
    delete v6.quests;
    v6.version = 6;
    const s = deserialize(JSON.stringify(v6))!;
    expect(s.version).toBe(11);
    expect(s.quests.claimed).toEqual([]);
    expect(claimableQuests(s).length).toBeGreaterThan(3);
  });
});

describe('advice', () => {
  const kinds = (s: GameState, chance: number | null = null) => advise(s, chance).map((a) => a.text);

  it('says to break through when the bar is full, and to xuất quan when in seclusion', () => {
    expect(kinds(atFirstBottleneck())[0]).toContain('đột phá Trúc Cơ');
    const secluded = { ...atFirstBottleneck(), seclusion: { id: 'short' as const, start: T0, end: T0 + 1e6, gained: 0 } };
    expect(advise(secluded, null)[0].go?.tab).toBe('cultivate');
    expect(kinds(secluded)[0]).toContain('xuất quan');
  });

  it('explains a blocked breakthrough and uses the win chance to choose the advice', () => {
    const blocked = { ...atFirstBottleneck(), floor: 1 };
    expect(kinds(blocked, 0.1)[0]).toContain('quá mạnh');
    expect(kinds(blocked, 0.9)[0]).toContain('Khiêu chiến tầng 2');
    expect(advise(blocked, 0.5)[0].go?.tab).toBe('dungeon');
  });

  it('points at choices and resources: path, natal, better gear, upgrades', () => {
    const t9 = { ...fresh(), level: 9 };
    expect(kinds(t9).join(' ')).toContain('hướng tu');
    expect(kinds(t9).join(' ')).toContain('bản mệnh');
    const upgrade = { ...fresh(), level: 3, bag: [{ id: 1, slot: 'weapon' as const, tier: 1, floor: 2 }] };
    expect(advise(upgrade, null)[0].go).toEqual({ tab: 'character', sub: 'gear' });
    const rich = choosePath({ ...fresh(), level: 12, stones: 1e6, fragments: 99 }, 'kiem', T0, always(0));
    expect(advise({ ...rich, seclusion: { id: 'short', start: T0, end: T0 + 1e6, gained: 0 } }, null).some((a) => a.go?.sub === 'skills' || a.go?.sub === 'technique' || a.go?.tab === 'shop')).toBe(true);
  });

  it('nudges idle characters and automation, never returns more than two lines, never empty', () => {
    const idle = { ...fresh(), floor: 2 };
    expect(kinds(idle, 0.95).join(' ')).toContain('Tự động khiêu chiến');
    expect(kinds(idle, null).join(' ')).toContain('rảnh');
    for (const s of [fresh(), idle, atFirstBottleneck(), { ...fresh(), level: 20, floor: 40 }]) {
      const a = advise(s, 0.5);
      expect(a.length).toBeGreaterThan(0);
      expect(a.length).toBeLessThanOrEqual(2);
    }
  });
});

describe('động phủ: công trình', () => {
  it('a new character starts with Linh Điền cấp 1 (2 ô), nothing else built, and empty stores', () => {
    const s = fresh();
    expect(s.dwelling.levels).toEqual({ linh_dien: 1, dan_phong: 0, tu_linh: 0, linh_mach: 0 });
    expect(plotCount(s)).toBe(2);
    expect(s.dwelling.plots).toHaveLength(7);
    expect(Object.keys(s.pills)).toHaveLength(7);
    expect(s.auto.garden).toBe(false);
  });

  it('upgrades cost stones, are capped by the realm and gated by unlock realm', () => {
    let s = { ...fresh(), stones: 1e9 };
    expect(canUpgradeBuilding(s, 'linh_mach')).toBe(false); // cần Trúc Cơ
    s = upgradeBuilding(s, 'tu_linh', T0, always(0));
    expect(s.dwelling.levels.tu_linh).toBe(1);
    expect(s.stones).toBe(1e9 - buildingCost('tu_linh', 1));
    s = upgradeBuilding(s, 'tu_linh', T0, always(0));
    expect(s.dwelling.levels.tu_linh).toBe(2);
    expect(canUpgradeBuilding(s, 'tu_linh')).toBe(false); // Luyện Khí: tối đa cấp 2
    const trucCo = { ...s, level: 9 };
    expect(canUpgradeBuilding(trucCo, 'tu_linh')).toBe(true);
    expect(canUpgradeBuilding(trucCo, 'linh_mach')).toBe(true);
    expect(canUpgradeBuilding({ ...s, stones: 1 }, 'dan_phong')).toBe(false);
    expect(buildingCost('dan_phong', 3)).toBeGreaterThan(buildingCost('dan_phong', 2));
    expect(BUILDINGS.linh_dien.unlockRealm).toBe(0);
  });

  it('Tụ Linh Trận and Linh Mạch raise cultivation and stone income', () => {
    const s = fresh();
    s.dwelling.levels.tu_linh = 3;
    s.dwelling.levels.linh_mach = 2;
    const m = dwellingMods(s);
    expect(m.cultivation).toBeCloseTo(0.18);
    expect(m.stones).toBeCloseTo(0.16);
    expect(cultivationBonus(s)).toBeCloseTo(1.18);
    expect(stoneRate(s) / stoneRate(fresh())).toBeCloseTo(1.16);
  });
});

describe('động phủ: linh điền', () => {
  const herb = (s: GameState) => plantableHerbs(s)[0];

  it('only herbs of the current band can be planted, in unlocked plots, with enough stones', () => {
    const s = { ...fresh(), stones: 100 };
    expect(plantableHerbs(s)).toEqual(['linh_thao', 'thanh_tam']);
    expect(plantableHerbs({ ...s, level: 13 })).toEqual(['huyet_sam', 'ket_dan']); // Kim Đan: bậc 1
    expect(canPlant(s, 0, 'linh_thao')).toBe(true);
    expect(canPlant(s, 2, 'linh_thao')).toBe(false); // chỉ 2 ô
    expect(canPlant(s, 0, 'huyet_sam')).toBe(false);
    expect(canPlant({ ...s, stones: 1 }, 0, 'linh_thao')).toBe(false);
  });

  it('planting costs seeds; the crop is not harvestable until it is ripe', () => {
    let s = { ...fresh(), stones: 100 };
    s = plantHerb(s, 0, herb(s), T0, always(0));
    expect(s.stones).toBe(100 - 12);
    expect(s.dwelling.plots[0]?.herb).toBe('linh_thao');
    expect(readyPlots(s, T0 + 60_000)).toBe(0);
    expect(harvestPlot(s, 0, T0 + 60_000, always(0)).dwelling.plots[0]).not.toBeNull();
    expect(canPlant(s, 0, herb(s))).toBe(false); // ô đã có cây
  });

  it('harvesting adds herbs (more at higher Linh Điền level) and frees the plot', () => {
    let s = { ...fresh(), stones: 100 };
    s = plantHerb(s, 0, herb(s), T0, always(0));
    const ripe = T0 + growMs(s, 'linh_thao') + 1;
    const h = harvestPlot(s, 0, ripe, always(0));
    expect(h.dwelling.plots[0]).toBeNull();
    expect(herbCount(h, 'linh_thao')).toBe(1); // rng 0: số thấp nhất, cấp 1 chưa có thưởng
    expect(h.stats.harvested).toBe(1);
    // Linh Điền cấp 10 có thưởng +1 thảo dược (rng 0 luôn trúng xác suất thưởng)
    let high = { ...fresh(), stones: 100 };
    high.dwelling.levels.linh_dien = 10;
    high = plantHerb(high, 0, herb(high), T0, always(0));
    expect(herbCount(harvestPlot(high, 0, T0 + growMs(high, 'linh_thao') + 1, always(0)), 'linh_thao')).toBe(2);
  });

  it('growth gets faster with Linh Điền level and slower for higher bands', () => {
    const s = fresh();
    const base = growMs(s, 'linh_thao');
    expect(base).toBe(12 * 60 * 1000);
    const l10 = { ...s, dwelling: { ...s.dwelling, levels: { ...s.dwelling.levels, linh_dien: 10 } } };
    expect(growMs(l10, 'linh_thao')).toBeCloseTo(base * 0.64);
    expect(growMs(s, 'huyet_sam')).toBeCloseTo(base * 1.25);
    expect(growMs(s, 'thanh_tam')).toBeGreaterThan(growMs(s, 'linh_thao') * 3);
  });

  it('plantAll fills every free plot and harvestAll collects every ripe one', () => {
    let s = { ...fresh(), stones: 1000 };
    s.dwelling.levels.linh_dien = 6; // 5 ô
    s = plantAll(s, 'linh_thao', T0, always(0));
    expect(s.dwelling.plots.filter(Boolean)).toHaveLength(5);
    expect(s.stones).toBe(1000 - 5 * 12);
    s = harvestAll(s, T0 + 3600_000, always(0));
    expect(s.dwelling.plots.filter(Boolean)).toHaveLength(0);
    expect(herbCount(s, 'linh_thao')).toBeGreaterThanOrEqual(5);
    expect(s.log[0].text).toContain('Thu hoạch linh điền');
  });

  it('auto garden harvests and replants every cycle, offline too', () => {
    let s = { ...fresh(), stones: 1e5, auto: { ...fresh().auto, garden: true } };
    s = plantAll(s, 'linh_thao', T0, always(0.5));
    const { state } = offline(s, T0 + 3 * 3600_000, always(0.5));
    // mỗi ô chín 15 lần trong 3 giờ (12 phút/vòng), 2 ô
    expect(state.stats.harvested).toBeGreaterThanOrEqual(25);
    expect(state.stats.planted).toBeGreaterThanOrEqual(28);
    expect(state.dwelling.plots.filter(Boolean)).toHaveLength(2);
    expect(state.stones).toBeLessThan(1e5 + 3 * 3600 * stoneRate(s));
  });

  it('without auto garden ripe crops just wait, and auto garden stops replanting when seeds are unaffordable', () => {
    let s = { ...fresh(), stones: 100 };
    s = plantAll(s, 'linh_thao', T0, always(0));
    const idle = tick(s, T0 + 3600_000, always(0));
    expect(idle.stats.harvested).toBe(0);
    expect(readyPlots(idle, idle.lastTick)).toBe(2);
    const broke = { ...s, stones: 0, auto: { ...s.auto, garden: true } };
    broke.stats.harvested = 0;
    const after = tick(broke, T0 + 15 * 60_000, always(0));
    expect(after.stats.harvested).toBeGreaterThan(0);
    expect(after.dwelling.plots.filter(Boolean).length).toBeLessThanOrEqual(2);
  });

  it('long absences do not lose growth time: timers are shifted with the offline cap', () => {
    let s = { ...fresh(), stones: 1e5, auto: { ...fresh().auto, garden: true } };
    s = plantAll(s, 'linh_thao', T0, always(0.5));
    const { state } = offline(s, T0 + 30 * 3600_000, always(0.5));
    // chỉ tính 12 giờ: tối đa 2 ô × 60 vòng, không phải 150 vòng
    expect(state.stats.harvested).toBeGreaterThan(100);
    expect(state.stats.harvested).toBeLessThan(2 * 60 * 3);
  });

  it('herbs can be sold for stones', () => {
    let s = fresh();
    s.dwelling.herbs.linh_thao = 10;
    s = sellHerb(s, 'linh_thao', 4, T0, always(0));
    expect(herbCount(s, 'linh_thao')).toBe(6);
    expect(s.stones).toBe(fresh().stones + 4 * Math.round(12 * 0.6));
    expect(sellHerb(s, 'linh_thao', 99, T0, always(0)).dwelling.herbs.linh_thao).toBe(0);
    expect(HERBS.linh_thao.band).toBe(0);
  });
});

describe('động phủ: đan phòng', () => {
  const lab = (extra: Partial<GameState> = {}): GameState => {
    const s = { ...fresh(), ...extra };
    s.dwelling.levels.dan_phong = 1;
    s.dwelling.herbs = { linh_thao: 40, thanh_tam: 20 };
    return s;
  };

  it('needs the building and enough herbs of the current band, and respects the batch limit', () => {
    expect(canStartJob(fresh(), 'tuKhi', 1)).toBe(false);
    const s = lab();
    expect(maxCraftable(s, 'tuKhi')).toBe(4); // 40/8=5 nhưng Đan Phòng cấp 1 tối đa 4 viên
    expect(maxCraftable(s, 'phaCanh')).toBe(4); // 40/4=10, 20/3=6, trần 4
    expect(canStartJob(s, 'tuKhi', 5)).toBe(false);
    expect(canStartJob({ ...lab(), dwelling: { ...lab().dwelling, herbs: { linh_thao: 7 } } }, 'tuKhi', 1)).toBe(false);
    expect(RECIPES.phaCanh.rare).toBe(3);
  });

  it('starting a job consumes herbs and blocks a second one', () => {
    let s = startJob(lab(), 'phaCanh', 2, T0, always(0));
    expect(herbCount(s, 'linh_thao')).toBe(40 - 8);
    expect(herbCount(s, 'thanh_tam')).toBe(20 - 6);
    expect(s.dwelling.job?.count).toBe(2);
    expect(canStartJob(s, 'tuKhi', 1)).toBe(false);
    s = startJob(s, 'tuKhi', 1, T0, always(0));
    expect(s.dwelling.job?.recipe).toBe('phaCanh');
  });

  it('the pills are delivered when the job finishes, even offline, with quality from the roll', () => {
    let s = startJob(lab(), 'tuKhi', 3, T0, always(0)); // rng 0 → mọi viên Thượng Phẩm
    expect(s.pills.tuKhi3).toBe(0);
    s = tick(s, T0 + 60_000, always(0));
    expect(s.dwelling.job).not.toBeNull();
    const done = offline(s, T0 + 3600_000, always(0)).state;
    expect(done.dwelling.job).toBeNull();
    expect(done.pills.tuKhi3).toBe(3);
    expect(done.stats.crafted).toBe(3);
    expect(done.stats.crafted3).toBe(3);
    const low = offline(startJob(lab(), 'tuKhi', 3, T0, always(0.99)), T0 + 3600_000, always(0.99)).state;
    expect(low.pills.tuKhi).toBe(3);
    expect(low.pills.tuKhi3).toBe(0);
    expect(low.log.find((l) => l.text.includes('Luyện xong'))?.text).toContain('Hạ 3, Trung 0, Thượng 0');
  });

  it('higher Đan Phòng levels craft faster and make better pills more often', () => {
    const a = lab();
    const b = lab();
    b.dwelling.levels.dan_phong = 10;
    expect(jobSeconds(b, 'tuKhi', 2)).toBeLessThan(jobSeconds(a, 'tuKhi', 2) * 0.6);
    expect(maxCraftable({ ...b, dwelling: { ...b.dwelling, herbs: { linh_thao: 999 } } }, 'tuKhi')).toBe(13);
    // cấp 10: Thượng 33.5%, Trung 51% → rng 0.5 rơi vào Trung Phẩm
    const mid = startJob(b, 'tuKhi', 1, T0, always(0.5));
    expect(offline(mid, T0 + 3600_000, always(0.5)).state.pills.tuKhi2).toBe(1);
  });

  it('Hồi Xuân Đan has a single grade', () => {
    const done = offline(startJob(lab(), 'hoiXuan', 2, T0, always(0)), T0 + 3600_000, always(0)).state;
    expect(done.pills.hoiXuan).toBe(2);
  });
});

describe('đan phẩm chất', () => {
  it('Phá Cảnh Đan: best grades first, bonuses add up, capped at 95% overall', () => {
    const s = atFirstBottleneck();
    s.pills = { ...s.pills, phaCanh: 2, phaCanh2: 1, phaCanh3: 1 };
    expect(breakPillPlan(s, 3)).toEqual([
      { id: 'phaCanh3', count: 1 },
      { id: 'phaCanh2', count: 1 },
      { id: 'phaCanh', count: 1 },
    ]);
    expect(breakPillBonus(s, 3)).toBeCloseTo(0.3 + 0.22 + 0.15);
    expect(breakPillBonus(s, 1)).toBeCloseTo(0.3);
    expect(breakthroughChance(s, 3)).toBeCloseTo(0.95); // 0.6 + 0.67 vượt trần
  });

  it('breakthrough consumes the best pills first', () => {
    const s = atFirstBottleneck();
    s.pills = { ...s.pills, phaCanh: 2, phaCanh3: 1 };
    const after = breakthrough(s, 2, T0, always(0));
    expect(after.pills.phaCanh3).toBe(0);
    expect(after.pills.phaCanh).toBe(1);
  });

  it('Tụ Khí Đan gives more tu vi at higher grades; Phá Cảnh Đan cannot be eaten; crafted-only pills are not for sale', () => {
    const base = { ...fresh(), level: 3 };
    base.pills = { ...base.pills, tuKhi: 1, tuKhi3: 1, phaCanh2: 1 };
    const t = (id: 'tuKhi' | 'tuKhi3') => totalCultivation(usePill(base, id, T0, always(0)).level, usePill(base, id, T0, always(0)).cultivation) - totalCultivation(base.level, base.cultivation);
    expect(t('tuKhi3') / t('tuKhi')).toBeCloseTo(720 / 300, 3);
    expect(canUsePill(base, 'phaCanh2', T0)).toBe(false);
    expect(pillPrice(base, 'tuKhi3')).toBe(Infinity);
    expect(buyPill({ ...base, stones: 1e9 }, 'phaCanh3', T0, always(0)).pills.phaCanh3).toBe(0);
    expect(buyPill({ ...base, stones: 1e9 }, 'phaCanh', T0, always(0)).pills.phaCanh).toBe(1);
    expect(pillPrice(base, 'tuKhi')).toBe(50 * 2 ** 0);
  });
});

describe('động phủ: save', () => {
  it('v7 saves gain a default dwelling, all pill keys, new stats and the garden switch', () => {
    const v8 = fresh();
    const v7: Record<string, unknown> = JSON.parse(serialize(v8));
    for (const k of ['dwelling']) delete v7[k];
    v7.version = 7;
    v7.pills = { tuKhi: 2, phaCanh: 1, hoiXuan: 0 };
    delete (v7.stats as Record<string, unknown>).planted;
    delete (v7.auto as Record<string, unknown>).garden;
    const s = deserialize(JSON.stringify(v7))!;
    expect(s.version).toBe(11);
    expect(s.dwelling.levels.linh_dien).toBe(1);
    expect(s.pills.tuKhi).toBe(2);
    expect(s.pills.phaCanh3).toBe(0);
    expect(s.stats.planted).toBe(0);
    expect(s.auto.garden).toBe(false);
  });
});

describe('Vô Cực Tháp', () => {
  it('tầng sau 40 vẫn khiêu chiến được và quái mạnh dần', async () => {
    const { floorStones, MAX_FLOOR, towerFloor } = await import('./data');
    const s = { ...fresh(), floor: 40 };
    expect(challengeFloor(s, T0, Math.random).lastBattle?.floor).toBe(41);
    expect(enemyFor(45).hp).toBeGreaterThan(enemyFor(41).hp);
    expect(enemyFor(41).hp).toBeGreaterThan(enemyFor(40).hp / 3 * 0.9);
    expect(towerFloor(MAX_FLOOR + 7)).toBe(7);
    expect(towerFloor(12)).toBe(0);
    // linh thạch tăng tuyến tính, không nhân đôi
    expect(floorStones(60)).toBeCloseTo(floorStones(40) * 3);
  });

  it('nhiệm vụ tháp theo tầng', async () => {
    const { QUESTS } = await import('./quests');
    const q = QUESTS.find((x) => x.id === 'thap_5')!;
    expect(q.done({ ...fresh(), floor: 44 })).toBe(false);
    expect(q.done({ ...fresh(), floor: 45 })).toBe(true);
  });
});

describe('Thiên Kiếp', () => {
  const geared = (tier: number): GameState => {
    const s: GameState = {
      ...fresh(),
      level: 12,
      floor: 5,
      path: 'kiem',
      techs: { dan_khi: 5, kiem_0: 4 },
      mainTech: 'kiem_0',
      skills: { kiem_pha_thien: 3, kiem_phan_quang: 3 },
      loadout: ['kiem_pha_thien', 'kiem_phan_quang'],
    };
    for (const slot of SLOTS) s.gear[slot] = { id: 1, slot, tier, floor: 3, affixes: [], plus: 0 };
    s.cultivation = requiredFor(s.level);
    return s;
  };

  it('Luyện Khí → Trúc Cơ không có thiên kiếp; Kim Đan trở đi thì có', async () => {
    const { hasKiep } = await import('./kiep');
    expect(hasKiep(1)).toBe(false);
    expect(hasKiep(2)).toBe(true);
  });

  it('an under-geared character falls to the lightning and loses cultivation without ranking up', () => {
    const s = geared(0);
    s.gear.weapon = null;
    s.gear.armor = null;
    const after = breakthrough(s, 0, T0, always(0));
    expect(after.level).toBe(12);
    expect(after.lastKiep?.pass).toBe(false);
    expect(after.cultivation).toBeLessThan(s.cultivation);
    expect(after.log[0].text).toContain('Thiên Kiếp');
  });

  it('a well-built character passes, ranks up and keeps a permanent bonus', () => {
    const s = geared(2);
    const before = playerStats(s, T0).hp;
    const after = breakthrough(s, 0, T0, always(0.1));
    expect(after.level).toBe(13);
    expect(after.lastKiep?.pass).toBe(true);
    expect(after.kiep[2]).toBeGreaterThanOrEqual(0);
    const hp = playerStats({ ...after, level: 12, injuryUntil: 0 }, T0).hp;
    expect(hp).toBeGreaterThan(before);
  });

  it('the breakthrough roll still has to succeed before the lightning falls', () => {
    const after = breakthrough(geared(2), 0, T0, always(0.99));
    expect(after.lastKiep).toBeNull();
    expect(after.level).toBe(12);
  });

  it('v8 saves gain an empty tribulation record', () => {
    const v8: Record<string, unknown> = JSON.parse(serialize(fresh()));
    delete v8.kiep;
    delete v8.lastKiep;
    v8.version = 8;
    const s = deserialize(JSON.stringify(v8))!;
    expect(s.kiep).toEqual({});
    expect(s.lastKiep).toBeNull();
  });
});

describe('pháp bảo phụ', () => {
  const withNatal = (level: number): GameState => {
    const s = { ...fresh(), level, natal: { id: 'phi_kiem' as const, level: 5, exp: 0 } };
    s.stones = 1e12;
    s.fragments = 100;
    return s;
  };
  const hoaThan = REALMS.slice(0, 4).reduce((a, r) => a + r.stages.length, 0);

  it('ô phụ mở từ Hóa Thần và cần bản mệnh trước', async () => {
    const { treasureSlots, canForgeTreasure } = await import('./engine');
    expect(treasureSlots(withNatal(hoaThan - 1))).toBe(0);
    expect(treasureSlots(withNatal(hoaThan))).toBe(1);
    expect(canForgeTreasure(withNatal(hoaThan))).toBe(true);
    expect(canForgeTreasure({ ...withNatal(hoaThan), natal: null })).toBe(false);
  });

  it('luyện pháp bảo phụ tốn linh thạch và tàn quyển, không trùng loại, không vượt số ô', async () => {
    const { forgeTreasure, treasureCost } = await import('./engine');
    const s = withNatal(hoaThan);
    const c = treasureCost(s);
    const a = forgeTreasure(s, 'phong_quat', T0, always(0));
    expect(a.treasures).toHaveLength(1);
    expect(a.stones).toBe(s.stones - c.stones);
    expect(a.fragments).toBe(s.fragments - c.fragments);
    expect(forgeTreasure(a, 'ho_lo', T0, always(0)).treasures).toHaveLength(1); // hết ô
    expect(forgeTreasure(s, 'phi_kiem', T0, always(0)).treasures).toHaveLength(0); // trùng bản mệnh
  });

  it('pháp bảo phụ cộng chỉ số giảm, cộng hưởng khi đủ cặp', async () => {
    const { natalMods, activeResonances, forgeTreasure } = await import('./engine');
    const solo = withNatal(hoaThan);
    const duo = forgeTreasure(solo, 'phong_quat', T0, always(0));
    expect(activeResonances(solo)).toHaveLength(0);
    expect(activeResonances(duo).map((r) => r.name)).toEqual(['Phong Kiếm Hợp Bích']);
    expect(natalMods(duo).crit).toBeGreaterThan(natalMods(solo).crit + 0.04);
    const other = forgeTreasure(solo, 'ho_lo', T0, always(0));
    expect(activeResonances(other)).toHaveLength(0);
  });

  it('chiêu của pháp bảo phụ vào trận sau chiêu bản mệnh; kinh nghiệm theo ô được chọn', async () => {
    const { forgeTreasure, equippedSkills, setFeed, devourWorse } = await import('./engine');
    let s = forgeTreasure(withNatal(hoaThan), 'ho_lo', T0, always(0));
    expect(equippedSkills(s).map((k) => k.id).slice(0, 2)).toEqual(['n_phi_kiem', 'n_ho_lo']);
    s.bag = [{ id: 1, slot: 'weapon', tier: 0, floor: 10, affixes: [], plus: 0 }];
    s.gear.weapon = { id: 2, slot: 'weapon', tier: TIERS.length - 1, floor: 30, affixes: [], plus: 0 };
    s = setFeed(s, 1, T0, always(0));
    s = devourWorse(s, T0, always(0));
    expect(s.treasures[0].exp + s.treasures[0].level).toBeGreaterThan(1);
    expect(s.natal!.level).toBe(5);
  });

  it('v9 saves gain an empty treasure list', () => {
    const v9: Record<string, unknown> = JSON.parse(serialize(fresh()));
    delete v9.treasures;
    delete v9.feed;
    v9.version = 9;
    const s = deserialize(JSON.stringify(v9))!;
    expect(s.treasures).toEqual([]);
    expect(s.feed).toBe(0);
  });
});

describe('tế luyện pháp bảo', () => {
  const base = (level: number, mats: number): GameState => ({
    ...fresh(),
    level: 12,
    natal: { id: 'phi_kiem', level, exp: 0 },
    materials: mats,
  });

  it('cần đủ cấp và Linh Tài, tốn Linh Tài, tăng chỉ số và nâng cấp chiêu ở lần 3', async () => {
    const { canRefine, refineTreasure, natalMods, refineCost, natalSkillLevel } = await import('./engine');
    expect(canRefine(base(4, 99), 0)).toBe(false); // chưa đủ cấp
    expect(canRefine(base(5, refineCost(0) - 1), 0)).toBe(false); // thiếu Linh Tài
    const s0 = base(30, 100);
    const s1 = refineTreasure(s0, 0, T0, always(0));
    expect(s1.natal!.refine).toBe(1);
    expect(s1.materials).toBe(100 - refineCost(0));
    expect(natalMods(s1).atkPct).toBeCloseTo(natalMods(s0).atkPct * 1.15, 5);
    expect(natalSkillLevel(10, 3)).toBe(natalSkillLevel(10, 0) + 1);
  });

  it('thủ lĩnh rơi Linh Tài, tối đa 5 lần tế luyện, save v10 có materials', async () => {
    const { bossMaterials, canRefine } = await import('./engine');
    expect(bossMaterials(5)).toBe(1);
    expect(bossMaterials(40)).toBe(5);
    expect(canRefine({ ...base(30, 999), natal: { id: 'phi_kiem', level: 30, exp: 0, refine: 5 } }, 0)).toBe(false);
    const v10: Record<string, unknown> = JSON.parse(serialize(fresh()));
    delete v10.materials;
    v10.version = 10;
    expect(deserialize(JSON.stringify(v10))!.materials).toBe(0);
  });
});
