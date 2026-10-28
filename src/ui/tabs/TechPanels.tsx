import { useState, type ReactNode } from 'react';
import { AFFINITY_MULT, PATHS, PATH_UNLOCK_LEVEL, REALMS, type PathId } from '../../engine/data';
import {
  GRADE_NAMES,
  SUB_SLOTS,
  SUB_TECHS,
  canUpgradeTech,
  choosePath,
  describeMods,
  formatNumber,
  hasAffinity,
  hasTech,
  levelName,
  mainTechsOf,
  setMainTech,
  techCap,
  techEffect,
  techLevel,
  techUpgradeCost,
  toggleSubTech,
  upgradeTech,
  type GameState,
  type TechDef,
  type TechId,
} from '../../engine/engine';
import type { TabProps } from '../GameScreen';
import Cultivator from '../art/Cultivator';
import { REALM_AURA } from '../art/palette';

function sourceText(def: TechDef): string {
  const src = def.source;
  switch (src.kind) {
    case 'start':
      return 'Có sẵn từ đầu';
    case 'path':
      return 'Học ngay khi chọn hướng tu';
    case 'shop':
      return `Mua ở Tàng Kinh Các (Phường Thị), từ ${REALMS[src.realm].name}, ${formatNumber(src.price)} linh thạch`;
    case 'boss':
      return `Bí kíp rơi từ thủ lĩnh tầng ${src.floor}`;
  }
}

function GradeTag({ grade }: { grade: number }) {
  return <span className={`grade grade-${grade}`}>{GRADE_NAMES[grade]}</span>;
}

/** Hiệu ứng của công pháp ở tầng hiện tại (công pháp chính hợp linh căn được nhân thêm) */
function effectText(s: GameState, def: TechDef): string {
  const lv = techLevel(s, def.id);
  const aff = def.kind === 'main' && hasAffinity(s) ? AFFINITY_MULT : 1;
  const total = lv > 0 ? describeMods(techEffect(def, lv, aff)) : '';
  const per = describeMods(def.perLevel);
  const parts = [total ? `Hiện tại: ${total}` : 'Chưa có hiệu ứng', `mỗi tầng: ${per}`];
  if (aff > 1) parts.push(`hợp linh căn ×${AFFINITY_MULT}`);
  return parts.join(' · ');
}

function UpgradeButton({ s, act, id }: { s: GameState; act: TabProps['act']; id: TechId }) {
  const lv = techLevel(s, id);
  const cap = techCap(s, id);
  const cost = techUpgradeCost(s, id);
  return (
    <button disabled={!canUpgradeTech(s, id)} onClick={() => act((st, now, rng) => upgradeTech(st, id, now, rng))}>
      {lv >= cap ? 'Tối đa' : `Tu luyện · ${cost.fragments} quyển, ${formatNumber(cost.stones)} LT`}
    </button>
  );
}

function TechRow({
  s,
  act,
  def,
  children,
}: Pick<TabProps, 'act'> & { s: GameState; def: TechDef; children?: ReactNode }) {
  const learned = hasTech(s, def.id);
  return (
    <div className={`tech-card ${learned ? '' : 'locked'}`}>
      <div>
        <b>{def.name}</b> <GradeTag grade={def.grade} />
        {learned && (
          <span className="muted small">
            {' '}
            tầng {techLevel(s, def.id)}/{techCap(s, def.id)}
          </span>
        )}
      </div>
      <div className="small muted">{effectText(s, def)}</div>
      {!learned && <div className="small">{sourceText(def)}</div>}
      <div className="skill-actions">
        {learned && <UpgradeButton s={s} act={act} id={def.id} />}
        {children}
      </div>
    </div>
  );
}

function PathChooser({ s, act }: { s: GameState; act: TabProps['act'] }) {
  const [pick, setPick] = useState<PathId | null>(null);
  return (
    <div className="paths">
      <p className="small">Chọn hướng tu. Lựa chọn này không thể thay đổi.</p>
      {(Object.keys(PATHS) as PathId[]).map((id) => {
        const p = PATHS[id];
        const affinity = s.root.elements.some((e) => p.elements.includes(e));
        return (
          <button key={id} className={`path ${pick === id ? 'picked' : ''}`} onClick={() => setPick(id)}>
            <span className="path-figure">
              <Cultivator pose="stand" path={id} aura={REALM_AURA[1]} power={0.1} />
            </span>
            <span className="path-text">
              <span className="row spread">
                <b>{p.name}</b>
                {affinity && <span className="tag good">Hợp linh căn</span>}
              </span>
              <span className="small">{p.desc}</span>
              <span className="small muted">
                {mainTechsOf(id)[0].name} · hệ {p.elements.join('/')}
              </span>
            </span>
          </button>
        );
      })}
      {pick && (
        <button className="primary" onClick={() => act((st, now, rng) => choosePath(st, pick, now, rng))}>
          Xác nhận tu {PATHS[pick].name}
        </button>
      )}
    </div>
  );
}

export default function TechniquesPanel({ state: s, act, goTo }: TabProps) {
  const subs = SUB_TECHS;
  const learnedSubs = subs.filter((d) => hasTech(s, d.id));
  const unlearnedSubs = subs.filter((d) => !hasTech(s, d.id));

  return (
    <>
      <section className="card">
        <h2>Công Pháp Chính</h2>
        <p className="muted small">
          Mỗi hướng tu có 4 công pháp chính từ Hoàng đến Thiên Cấp. Học công pháp chính mới sẽ kế thừa một nửa số tầng của
          công pháp cũ, và công pháp cũ vẫn giữ nguyên tầng để đổi lại.
        </p>
        {s.path ? (
          mainTechsOf(s.path).map((def) => (
            <TechRow key={def.id} s={s} act={act} def={def}>
              {hasTech(s, def.id) && s.mainTech !== def.id && (
                <button onClick={() => act((st, now, rng) => setMainTech(st, def.id, now, rng))}>Dùng làm chính</button>
              )}
              {s.mainTech === def.id && <span className="tag good">Đang dùng</span>}
              {!hasTech(s, def.id) && def.source.kind === 'shop' && (
                <button className="link" onClick={() => goTo('shop')}>
                  Tới Phường Thị
                </button>
              )}
            </TechRow>
          ))
        ) : s.level >= PATH_UNLOCK_LEVEL ? (
          <PathChooser s={s} act={act} />
        ) : (
          <p className="notice">Đạt {levelName(PATH_UNLOCK_LEVEL)} để chọn hướng tu: Kiếm Tu, Thể Tu hoặc Pháp Tu.</p>
        )}
      </section>

      <section className="card">
        <h2>
          Công Pháp Phụ{' '}
          <span className="muted small">
            {s.subTechs.length}/{SUB_SLOTS} ô
          </span>
        </h2>
        <p className="muted small">Mang tối đa {SUB_SLOTS} công pháp phụ, dùng chung cho mọi hướng tu.</p>
        {learnedSubs.map((def) => {
          const on = s.subTechs.includes(def.id);
          return (
            <TechRow key={def.id} s={s} act={act} def={def}>
              <button
                disabled={!on && s.subTechs.length >= SUB_SLOTS}
                onClick={() => act((st, now, rng) => toggleSubTech(st, def.id, now, rng))}
              >
                {on ? 'Cất' : s.subTechs.length >= SUB_SLOTS ? 'Đã đủ ô' : 'Mang theo'}
              </button>
              {on && <span className="tag good">Đang dùng</span>}
            </TechRow>
          );
        })}
      </section>

      {unlearnedSubs.length > 0 && (
        <section className="card">
          <h2>Chưa Học</h2>
          {unlearnedSubs.map((def) => (
            <TechRow key={def.id} s={s} act={act} def={def}>
              {def.source.kind === 'shop' && (
                <button className="link" onClick={() => goTo('shop')}>
                  Tới Phường Thị
                </button>
              )}
            </TechRow>
          ))}
        </section>
      )}
    </>
  );
}

