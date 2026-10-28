import { useState } from 'react';
import {
  NATALS,
  NATAL_IDS,
  NATAL_MAX_LEVEL,
  NATAL_STAGES,
  NATAL_STAGE_LEVELS,
  NATAL_UNLOCK_LEVEL,
  SKILLS,
  canDevour,
  canForgeNatal,
  describeMods,
  describeSkill,
  devourWorse,
  forgeNatal,
  formatNumber,
  isWorse,
  itemDevourExp,
  levelName,
  natalExpNeeded,
  natalMods,
  natalSkillLevel,
  natalStage,
  type NatalId,
} from '../../engine/engine';
import type { TabProps } from '../GameScreen';
import AutoToggle from '../AutoToggle';
import NatalIcon from '../art/NatalIcon';
import { SkillIcon } from '../art/SkillIcons';

export default function NatalPanel({ state: s, act }: TabProps) {
  const [pick, setPick] = useState<NatalId | null>(null);

  if (!s.natal) {
    if (!canForgeNatal(s)) {
      return (
        <section className="card">
          <h2>Bản Mệnh Pháp Bảo</h2>
          <p className="notice">
            Đạt {levelName(NATAL_UNLOCK_LEVEL)} để luyện bản mệnh pháp bảo: một pháp bảo lớn lên cùng bạn, có chiêu riêng trong
            trận và nuốt pháp bảo thừa để mạnh lên.
          </p>
        </section>
      );
    }
    return (
      <section className="card">
        <h2>Bản Mệnh Pháp Bảo</h2>
        <p className="small">Chọn một pháp bảo bản mệnh. Lựa chọn này không thể thay đổi.</p>
        <div className="paths">
          {NATAL_IDS.map((id) => {
            const d = NATALS[id];
            return (
              <button key={id} className={`path ${pick === id ? 'picked' : ''}`} onClick={() => setPick(id)}>
                <span className="natal-thumb">
                  <NatalIcon id={id} stage={0} />
                </span>
                <span className="path-text">
                  <span className="row spread">
                    <b>{d.name}</b>
                    <span className="tag good">{d.role}</span>
                  </span>
                  <span className="small">{d.desc}</span>
                  <span className="small muted">Mỗi cấp: {describeMods(d.perLevel)}</span>
                  <span className="small muted">
                    Chiêu 【{SKILLS[d.skillId].name}】: {describeSkill(SKILLS[d.skillId], 1)}
                  </span>
                </span>
              </button>
            );
          })}
          {pick && (
            <button className="primary" onClick={() => act((st, now, rng) => forgeNatal(st, pick, now, rng))}>
              Luyện thành bản mệnh: {NATALS[pick].name}
            </button>
          )}
        </div>
      </section>
    );
  }

  const n = s.natal;
  const def = NATALS[n.id];
  const stage = natalStage(n.level);
  const max = n.level >= NATAL_MAX_LEVEL;
  const need = natalExpNeeded(n.level);
  const skill = SKILLS[def.skillId];
  const worse = s.bag.filter((it) => isWorse(s, it));
  const worseExp = worse.reduce((a, it) => a + itemDevourExp(it), 0);

  return (
    <section className="card">
      <div className="natal-head">
        <span className="natal-thumb big">
          <NatalIcon id={n.id} stage={stage} className="natal-float" />
        </span>
        <div>
          <h2>{def.name}</h2>
          <div className="small">
            <span className={`stage stage-${stage}`}>{NATAL_STAGES[stage]}</span>{' '}
            <span className="muted">
              cấp {n.level}/{NATAL_MAX_LEVEL} · {def.role}
            </span>
          </div>
        </div>
      </div>

      <div className="bar thin">
        <div className="bar-fill" style={{ width: `${max ? 100 : Math.min(100, (n.exp / need) * 100)}%` }} />
      </div>
      <div className="small muted">
        {max ? 'Đã đạt cấp tối đa.' : `Kinh nghiệm ${formatNumber(n.exp)} / ${formatNumber(need)}. Luyện hóa pháp bảo thừa để tăng.`}
      </div>
      <div className="small">Đang cộng thêm: {describeMods(natalMods(s))}</div>

      <div className="natal-skill-row">
        <SkillIcon id={def.skillId} level={natalSkillLevel(n.level)} />
        <div className="natal-skill">
          <b>Chiêu bản mệnh 【{skill.name}】</b>{' '}
          <span className="muted small">cấp {natalSkillLevel(n.level)}/10 · luôn ưu tiên dùng trước</span>
          <div className="small muted">{describeSkill(skill, natalSkillLevel(n.level))}</div>
        </div>
      </div>

      <div className="natal-stages">
        {NATAL_STAGES.slice(1).map((name, i) => {
          const on = stage > i;
          return (
            <div key={name} className={`small ${on ? 'set-on' : 'muted'}`}>
              {on ? '✓' : '○'} {name} (cấp {NATAL_STAGE_LEVELS[i + 1]}): {describeMods(def.stageBonus[i])}
            </div>
          );
        })}
      </div>

      <AutoToggle s={s} act={act} k="devour" label="Tự luyện hóa pháp bảo kém hơn khi nhặt được">
        Thay cho tự bán: pháp bảo kém hơn đồ đang dùng được nuốt để bản mệnh lên cấp.
      </AutoToggle>
      <button disabled={!canDevour(s) || worse.length === 0} onClick={() => act(devourWorse)}>
        Luyện hóa {worse.length} món kém hơn · +{formatNumber(worseExp)} kinh nghiệm
      </button>
    </section>
  );
}
