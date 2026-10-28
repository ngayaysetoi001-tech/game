import { describe, expect, it } from 'vitest';
import { BAG_LIMIT, PATH_UNLOCK_LEVEL, REALMS, SECLUSIONS } from './data';
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
    s = upgradeTech(s, 'base', T0, always(0));
    expect(s.tech.base).toBe(1);
    expect(s.fragments).toBe(0);
    expect(s.stones).toBe(50);
    expect(upgradeTech(s, 'base', T0, always(0)).tech.base).toBe(1);
  });
});

describe('migration', () => {
  it('upgrades a v1 save and pre-clears gate floors of the current realm', () => {
    const v2 = { ...fresh(), level: 10 };
    const v1: Record<string, unknown> = JSON.parse(serialize(v2));
    for (const k of ['path', 'tech', 'gear', 'bag', 'fragments', 'floor', 'farming', 'nextItemId', 'lastBattle']) delete v1[k];
    v1.version = 1;
    const s = deserialize(JSON.stringify(v1))!;
    expect(s.version).toBe(2);
    expect(s.floor).toBe(REALMS[1].gateFloor);
    expect(s.gear.weapon).toBeNull();
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

  it('the Kim Đan gate boss needs gear plus techniques', () => {
    expect(wins(mk(12, 0), 5)).toBe(false);
    expect(wins(mk(12, 4, 1), 5)).toBe(false);
    const ready = { ...mk(12, 4, 1), path: 'kiem' as const, tech: { base: 3, path: 2 } };
    expect(wins(ready, 5)).toBe(true);
  });
});
