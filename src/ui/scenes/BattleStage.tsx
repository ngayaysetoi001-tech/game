import { useEffect, useState } from 'react';
import {
  zoneOf,
  enemyFor,
  formatNumber,
  isBossFloor,
  levelInfo,
  playerStats,
  type BattleReport,
  type GameState,
} from '../../engine/engine';
import Cultivator from '../art/Cultivator';
import Landscape from '../art/Landscape';
import Monster from '../art/Monster';
import { prefersReducedMotion } from '../art/Particles';
import { REALM_AURA, ZONE_THEMES } from '../art/palette';
import { Art, slugify } from '../art/registry';
import { ZONES } from '../../engine/data';

const STEP_MS = 420;
/** Trận dài thì phát nhanh hơn, tổng không quá chừng này */
const MAX_PLAYBACK_MS = 9000;
/** Chỉ phát lại trận vừa đánh (không phát trận đánh lúc offline) */
const FRESH_MS = 5000;
const BANNER_MS = 1800;
const DARK_FEATURES = new Set(['ghost', 'void']);

// Ghi nhớ trận đã phát để chuyển tab qua lại không phát lại
let lastPlayed = 0;

type Phase = { kind: 'idle' } | { kind: 'play'; step: number } | { kind: 'done' };

export default function BattleStage({ s, onPlaying }: { s: GameState; onPlaying: (p: boolean) => void }) {
  const battle = s.lastBattle;
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  // Trận mới (vừa bấm khiêu chiến) → phát lại từng đòn
  useEffect(() => {
    if (!battle?.events?.length || battle.time <= lastPlayed) return;
    lastPlayed = battle.time;
    if (Date.now() - battle.time > FRESH_MS) return;
    if (prefersReducedMotion()) {
      setPhase({ kind: 'done' });
      return;
    }
    setPhase({ kind: 'play', step: 0 });
  }, [battle?.time, battle?.events?.length]);

  useEffect(() => {
    onPlaying(phase.kind === 'play');
    if (phase.kind === 'play') {
      const total = battle?.events?.length ?? 0;
      const t = setTimeout(
        () => setPhase(phase.step + 1 >= total ? { kind: 'done' } : { kind: 'play', step: phase.step + 1 }),
        Math.min(STEP_MS, MAX_PLAYBACK_MS / total),
      );
      return () => clearTimeout(t);
    }
    if (phase.kind === 'done') {
      const t = setTimeout(() => setPhase({ kind: 'idle' }), BANNER_MS);
      return () => clearTimeout(t);
    }
  }, [phase, battle?.events?.length, onPlaying]);

  const showing = phase.kind !== 'idle' && battle?.events?.length ? battle : null;
  const floor = showing ? showing.floor : Math.min(s.floor + 1, 40);
  const zoneIdx = Math.min(ZONES.length - 1, Math.floor((floor - 1) / 5));
  const theme = ZONE_THEMES[zoneIdx];
  const enemyName = showing ? showing.enemy : enemyFor(floor).name;
  const player = playerStats(s, s.lastTick);

  const view = showing ? frameOf(showing, phase) : null;
  const hpP = view ? view.hpP / (showing!.maxHpP ?? player.hp) : 1;
  const hpE = view ? view.hpE / (showing!.maxHpE ?? enemyFor(floor).hp) : 1;
  const ev = view?.event;

  const playerCls = ['fighter', 'hero'];
  const enemyCls = ['fighter', 'foe'];
  const cls = (side: 'p' | 'e') => (side === 'p' ? playerCls : enemyCls);
  // Save cũ không có target/fx: coi như đòn đánh vào bên kia
  const fx = ev?.fx ?? 'hit';
  const target = ev ? (ev.target ?? (ev.by === 'p' ? 'e' : 'p')) : 'e';
  if (ev) {
    if (fx === 'hit' || fx === 'miss') cls(ev.by).push('lunge');
    if (fx === 'hit') cls(target).push(ev.crit ? 'hit crit' : 'hit');
    if (fx === 'miss') cls(target).push('dodge');
    if (fx === 'burn' || fx === 'thorns') cls(target).push('hit burn');
    if (fx === 'stun') cls(target).push('stunned');
    if (fx === 'heal' || fx === 'shield' || fx === 'buff' || fx === 'cleanse') cls(ev.by).push(`cast cast-${fx}`);
  }
  if (phase.kind === 'done' && showing) (showing.win ? enemyCls : playerCls).push('defeated');

  return (
    <div className="scene battle-scene">
      <Art k={`scenes/${slugify(zoneOf(floor).name)}`} alt="" className="scene-bg">
        <Landscape theme={theme} seed={zoneIdx + 1} />
      </Art>

      <div className="hp-bars">
        <HpBar label={s.name} ratio={hpP} side="left" />
        <HpBar label={`${enemyName}${isBossFloor(floor) ? ' ★' : ''}`} ratio={hpE} side="right" />
      </div>

      <div className={playerCls.join(' ')} key={`p-${view?.key ?? 'idle'}`}>
        <Art k={`cultivator/${s.path ?? 'none'}-stand`} alt={s.name}>
          <Cultivator pose="stand" path={s.path} aura={REALM_AURA[levelInfo(s.level).realm]} power={0.2} />
        </Art>
      </div>
      <div className={enemyCls.join(' ')} key={`e-${view?.key ?? 'idle'}`}>
        <Art k={`monsters/${slugify(enemyName)}`} alt={enemyName}>
          <Monster name={enemyName} boss={isBossFloor(floor)} darkBackdrop={DARK_FEATURES.has(theme.feature)} />
        </Art>
      </div>

      {ev && (
        <div key={view!.key} className={`dmg ${target === 'e' ? 'on-enemy' : 'on-player'} fx-${fx} ${ev.crit ? 'crit' : ''}`}>
          {fx === 'hit' && (
            <>
              {ev.crit && <small>Bạo kích </small>}−{formatNumber(ev.dmg)}
            </>
          )}
          {fx === 'burn' && <>−{formatNumber(ev.dmg)}</>}
          {fx === 'thorns' && <>Phản đòn −{formatNumber(ev.dmg)}</>}
          {fx === 'miss' && 'Né!'}
          {fx === 'stun' && 'Choáng'}
          {fx === 'heal' && <>+{formatNumber(ev.amount ?? 0)}</>}
          {fx === 'shield' && <>Khiên {formatNumber(ev.amount ?? 0)}</>}
          {fx === 'buff' && 'Tăng lực'}
          {fx === 'cleanse' && 'Thanh tâm'}
        </div>
      )}
      {view?.shout && (
        <div key={`s-${view.key}`} className={`skill-shout ${view.shout.side === 'p' ? 'left' : 'right'}`}>
          {view.shout.name}
        </div>
      )}

      {phase.kind === 'done' && showing && (
        <div className={`banner ${showing.win ? 'win' : 'lose'}`}>{showing.win ? 'Thắng' : 'Bại'}</div>
      )}
      {phase.kind === 'play' && (
        <button className="skip" onClick={() => setPhase({ kind: 'done' })}>
          Bỏ qua
        </button>
      )}
    </div>
  );
}

function frameOf(b: BattleReport, phase: Phase) {
  const events = b.events!;
  const i = phase.kind === 'play' ? phase.step : events.length - 1;
  const e = events[i];
  const prev = events[i - 1];
  // Hô tên chiêu ở đòn đầu tiên của mỗi lần thi triển
  const shout =
    phase.kind === 'play' && e.skill && !(prev && prev.skill === e.skill && prev.by === e.by)
      ? { name: e.skill, side: e.by }
      : undefined;
  return { hpP: e.hpP, hpE: e.hpE, event: phase.kind === 'play' ? e : undefined, key: `${b.time}-${i}`, shout };
}

function HpBar({ label, ratio, side }: { label: string; ratio: number; side: 'left' | 'right' }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className={`hp ${side}`}>
      <div className="hp-label">{label}</div>
      <div className="hp-track">
        <div className="hp-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
