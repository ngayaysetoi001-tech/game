import { useMemo } from 'react';
import { MAX_FLOOR } from '../engine/data';
import { enemyFor, playerStats, simulateBattle, type GameState } from '../engine/engine';

const RUNS = 100;

/** Tỉ lệ thắng ước tính tầng bí cảnh kế tiếp (mô phỏng nhanh), null khi đã hết bí cảnh. Chỉ tính lại khi chỉ số đổi. */
export function useNextFloorChance(s: GameState): number | null {
  const next = s.floor + 1;
  const p = playerStats(s, s.lastTick);
  const key = `${Math.round(p.hp)}|${Math.round(p.atk)}|${Math.round(p.def)}|${p.spd}|${p.crit}|${p.skills.map((k) => k.id + k.level).join()}|${next}`;
  return useMemo(() => {
    if (next > MAX_FLOOR) return null;
    const e = enemyFor(next);
    let w = 0;
    for (let i = 0; i < RUNS; i++) if (simulateBattle(p, e, Math.random).win) w++;
    return w / RUNS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
