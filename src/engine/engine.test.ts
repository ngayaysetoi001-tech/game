import { describe, expect, it } from 'vitest';
import { REALMS, SECLUSIONS } from './data';
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
  type GameState,
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
