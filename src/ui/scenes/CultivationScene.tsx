import { useEffect, useRef, useState } from 'react';
import { REALMS } from '../../engine/data';
import { KIEP_GRADE_NAMES, formatDuration, isInjured, levelInfo, natalStage, seclusionDef, type GameState } from '../../engine/engine';
import Cultivator from '../art/Cultivator';
import NatalIcon from '../art/NatalIcon';
import Landscape from '../art/Landscape';
import Particles, { prefersReducedMotion } from '../art/Particles';
import { CAVE_THEME, HOME_THEME, REALM_AURA } from '../art/palette';
import { Art } from '../art/registry';
import { FigureAura, OneShotFx, SceneMist } from '../art/SceneMotion';
import { hasArt } from '../art/registry';

type Fx = { kind: 'break' | 'stage' | 'fail'; id: number; text: string; flash?: boolean; art: string };

/** Tranh động phủ: tu sĩ ngồi thiền, linh khí xoáy vào, hiệu ứng khi lên tầng / đột phá */
export default function CultivationScene({ s }: { s: GameState }) {
  const realm = levelInfo(s.level).realm;
  const now = s.lastTick;
  const injured = isInjured(s, now);
  const secluded = !!s.seclusion;
  const aura = REALM_AURA[realm];

  let intensity = 0.3 + realm * 0.04;
  if (secluded) intensity = 0.55 + seclusionDef(s.seclusion!.id).rateMult * 0.15;
  if (s.farming) intensity *= 0.5;
  if (injured) intensity *= 0.4;

  const fx = useBreakthroughFx(s);

  return (
    <div className={`scene cultivate-scene ${injured ? 'injured' : ''}`}>
      <Art k={secluded ? 'scenes/be-quan' : 'scenes/dong-phu'} alt="" className="scene-bg" motion="kenburns">
        <Landscape theme={secluded ? CAVE_THEME : HOME_THEME} seed={secluded ? 11 : 3} />
      </Art>
      <SceneMist k={secluded ? 'scenes/be-quan' : 'scenes/dong-phu'} />
      <Particles color={injured ? '#e47a64' : aura} intensity={intensity} cy={0.66} />
      <FigureAura k={`cultivator/${s.path ?? 'none'}-sit`} color={injured ? '#e47a64' : aura} />
      <div className="scene-figure sit">
        <Art k={`cultivator/${s.path ?? 'none'}-sit`} alt={s.name} motion="breathe">
          <Cultivator pose="sit" path={s.path} aura={injured ? '#e47a64' : aura} power={realm / 8} />
        </Art>
      </div>
      {s.natal && (
        <div className="scene-natal">
          <NatalIcon id={s.natal.id} stage={natalStage(s.natal.level)} className="natal-float" />
        </div>
      )}
      {secluded && (
        <div className="scene-chip">
          {seclusionDef(s.seclusion!.id).name} · còn {formatDuration((s.seclusion!.end - now) / 1000)}
        </div>
      )}
      {s.farming && <div className="scene-chip">Đang lịch luyện ở bí cảnh</div>}
      {fx && <FxLayer key={fx.id} fx={fx} color={aura} />}
    </div>
  );
}

/** So sánh với lần render trước để biết vừa lên tầng, đột phá thành công hay thất bại */
function useBreakthroughFx(s: GameState): Fx | null {
  const prev = useRef({ level: s.level, failBonus: s.failBonus, kiep: s.lastKiep });
  const [fx, setFx] = useState<Fx | null>(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = { level: s.level, failBonus: s.failBonus, kiep: s.lastKiep };
    let next: Fx | null = null;
    const kiep = s.lastKiep !== p.kiep ? s.lastKiep : null;
    if (kiep && !kiep.pass) {
      next = { kind: 'fail', id: Date.now(), text: `Thiên Kiếp: ngã ở đạo lôi ${kiep.hp.length}/${kiep.bolts}`, flash: true, art: 'kiep-fail' };
    } else if (s.level > p.level) {
      const realmUp = levelInfo(s.level).realm > levelInfo(p.level).realm;
      next = realmUp
        ? {
            kind: 'break',
            id: Date.now(),
            text: kiep?.pass ? `Vượt Thiên Kiếp · ${KIEP_GRADE_NAMES[kiep.grade!]}` : `Đột phá ${REALMS[levelInfo(s.level).realm].name}!`,
            flash: !!kiep,
            art: kiep?.pass ? 'kiep-pass' : 'breakthrough',
          }
        : { kind: 'stage', id: Date.now(), text: 'Tu vi tinh tiến', art: 'stage-up' };
    } else if (s.failBonus > p.failBonus) {
      next = { kind: 'fail', id: Date.now(), text: 'Đột phá thất bại', art: 'break-fail' };
    }
    if (!next) return;
    setFx(next);
    const t = setTimeout(() => setFx(null), next.kind === 'stage' ? 1400 : 2600);
    return () => clearTimeout(t);
  }, [s.level, s.failBonus, s.lastKiep]);

  return fx;
}

function FxLayer({ fx, color }: { fx: Fx; color: string }) {
  const still = prefersReducedMotion();
  return (
    <div className={`fx fx-${fx.kind} ${still ? 'still' : ''}`} aria-live="polite">
      {fx.flash && !still && <div className="scene-flash" />}
      <OneShotFx k={`fx/${fx.art}`} />
      {fx.kind === 'break' && !hasArt(`fx/${fx.art}`) && (
        <svg className="fx-bolts" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
          {['M30,0 L36,14 L31,16 L42,34 L38,35 L50,50', 'M70,0 L64,12 L69,15 L58,32 L62,33 L50,50', 'M50,0 L47,18 L53,20 L50,50'].map((d) => (
            <path key={d} d={d} fill="none" stroke="#fff" strokeWidth={1.2} style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
          ))}
        </svg>
      )}
      {fx.kind === 'fail' && (
        <svg className="fx-cracks" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M50,40 L40,30 L42,22 L30,12 M50,40 L62,32 L60,24 L74,16 M50,40 L48,52 L56,60" fill="none" stroke="#ff5a4a" strokeWidth={0.8} />
        </svg>
      )}
      {fx.kind === 'stage' && <div className="fx-ring" style={{ borderColor: color }} />}
      <div className="fx-text">{fx.text}</div>
    </div>
  );
}
