import { useState } from 'react';
import {
  NATALS,
  NATAL_IDS,
  NATAL_MAX_LEVEL,
  NATAL_STAGES,
  NATAL_STAGE_LEVELS,
  NATAL_UNLOCK_LEVEL,
  REFINE_BONUS,
  REFINE_MAX,
  REFINE_NAMES,
  refineCost,
  refineLevelReq,
  refineOf,
  canRefine,
  refineTreasure,
  RESONANCES,
  SKILLS,
  TREASURE_UNLOCK_REALMS,
  activeResonances,
  canDevour,
  canForgeNatal,
  canForgeTreasure,
  describeMods,
  describeSkill,
  devourWorse,
  forgeNatal,
  forgeTreasure,
  formatNumber,
  isWorse,
  itemDevourExp,
  levelName,
  natalExpNeeded,
  natalSkillLevel,
  natalStage,
  ownedTreasures,
  setFeed,
  treasureCost,
  treasureSlots,
  type NatalId,
  type NatalState,
} from '../../engine/engine';
import { REALMS } from '../../engine/data';
import type { TabProps } from '../GameScreen';
import AutoToggle from '../AutoToggle';
import NatalIcon from '../art/NatalIcon';
import { SkillIcon } from '../art/SkillIcons';

function NatalChoices({ ids, pick, setPick }: { ids: NatalId[]; pick: NatalId | null; setPick: (id: NatalId) => void }) {
  return (
    <div className="paths">
      {ids.map((id) => {
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
    </div>
  );
}

function TreasureCard({
  n,
  label,
  feeding,
  onFeed,
  canFeed,
  materials,
  canRefineNow,
  onRefine,
}: {
  n: NatalState;
  label: string;
  feeding: boolean;
  onFeed: () => void;
  canFeed: boolean;
  materials: number;
  canRefineNow: boolean;
  onRefine: () => void;
}) {
  const refine = refineOf(n);
  const def = NATALS[n.id];
  const stage = natalStage(n.level);
  const max = n.level >= NATAL_MAX_LEVEL;
  const need = natalExpNeeded(n.level);
  const skill = SKILLS[def.skillId];
  return (
    <section className="card">
      <div className="natal-head">
        <span className="natal-thumb big">
          <NatalIcon id={n.id} stage={stage} className="natal-float" />
        </span>
        <div>
          <div className="small muted">{label}</div>
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
        {max ? 'Đã đạt cấp tối đa.' : `Kinh nghiệm ${formatNumber(n.exp)} / ${formatNumber(need)}.`}
      </div>

      <div className="natal-skill-row">
        <SkillIcon id={def.skillId} level={natalSkillLevel(n.level, refine)} />
        <div className="natal-skill">
          <b>Chiêu 【{skill.name}】</b> <span className="muted small">cấp {natalSkillLevel(n.level, refine)}/10</span>
          <div className="small muted">{describeSkill(skill, natalSkillLevel(n.level, refine))}</div>
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
      <div className="small">
        <b>Tế luyện:</b> {REFINE_NAMES[refine]} ({refine}/{REFINE_MAX}) · chỉ số riêng +{Math.round(REFINE_BONUS * refine * 100)}%
        {refine >= 3 ? ' · chiêu mạnh thêm' : ''}
      </div>
      {refine < REFINE_MAX && (
        <button disabled={!canRefineNow} onClick={onRefine}>
          Tế luyện lên {REFINE_NAMES[refine + 1]} · {refineCost(refine)} Linh Tài (có {materials})
          {n.level < refineLevelReq(refine) ? ` · cần cấp ${refineLevelReq(refine)}` : ''}
        </button>
      )}
      {canFeed && (
        <button className={feeding ? 'primary' : ''} disabled={feeding || max} onClick={onFeed}>
          {feeding ? 'Đang nhận kinh nghiệm luyện hóa' : max ? 'Đã đầy cấp' : 'Nuôi pháp bảo này'}
        </button>
      )}
    </section>
  );
}

export default function NatalPanel({ state: s, act }: TabProps) {
  const [pick, setPick] = useState<NatalId | null>(null);
  const [pickAux, setPickAux] = useState<NatalId | null>(null);

  if (!s.natal) {
    if (!canForgeNatal(s)) {
      return (
        <section className="card">
          <h2>Pháp Bảo</h2>
          <p className="notice">
            Đạt {levelName(NATAL_UNLOCK_LEVEL)} để luyện bản mệnh pháp bảo: một pháp bảo lớn lên cùng bạn, có chiêu riêng trong
            trận và nuốt trang bị thừa để mạnh lên. Từ {REALMS[TREASURE_UNLOCK_REALMS[0]].name} mở thêm ô pháp bảo phụ.
          </p>
        </section>
      );
    }
    return (
      <section className="card">
        <h2>Bản Mệnh Pháp Bảo</h2>
        <p className="small">Chọn một pháp bảo bản mệnh. Lựa chọn này không thể thay đổi.</p>
        <NatalChoices ids={NATAL_IDS} pick={pick} setPick={setPick} />
        {pick && (
          <button className="primary" onClick={() => act((st, now, rng) => forgeNatal(st, pick, now, rng))}>
            Luyện thành bản mệnh: {NATALS[pick].name}
          </button>
        )}
      </section>
    );
  }

  const owned = ownedTreasures(s);
  const slots = treasureSlots(s);
  const free = NATAL_IDS.filter((id) => !owned.some((n) => n.id === id));
  const cost = treasureCost(s);
  const resonances = activeResonances(s);
  const worse = s.bag.filter((it) => isWorse(s, it));
  const worseExp = worse.reduce((a, it) => a + itemDevourExp(it), 0);
  const feedIdx = Math.min(s.feed, owned.length - 1);

  return (
    <>
      {owned.map((n, i) => (
        <TreasureCard
          key={n.id}
          n={n}
          label={i === 0 ? 'Bản mệnh pháp bảo · đủ chỉ số, chiêu ưu tiên trước' : `Pháp bảo phụ ${i} · ${Math.round(0.6 * 100)}% chỉ số`}
          feeding={feedIdx === i}
          canFeed={owned.length > 1}
          materials={s.materials}
          canRefineNow={canRefine(s, i)}
          onRefine={() => act((st, now, rng) => refineTreasure(st, i, now, rng))}
          onFeed={() => act((st, now, rng) => setFeed(st, i, now, rng))}
        />
      ))}

      <section className="card">
        <h2>Pháp Bảo Phụ</h2>
        {slots === 0 ? (
          <p className="notice">
            Đạt {REALMS[TREASURE_UNLOCK_REALMS[0]].name} để mở ô pháp bảo phụ thứ nhất, {REALMS[TREASURE_UNLOCK_REALMS[1]].name} để mở
            ô thứ hai. Pháp bảo phụ có thêm chiêu riêng và cộng hưởng với bản mệnh.
          </p>
        ) : s.treasures.length >= slots ? (
          <p className="muted small">
            {slots >= TREASURE_UNLOCK_REALMS.length
              ? 'Đã luyện đủ pháp bảo phụ.'
              : `Ô kế tiếp mở ở ${REALMS[TREASURE_UNLOCK_REALMS[slots]].name}.`}
          </p>
        ) : (
          <>
            <p className="small">
              Luyện thêm một pháp bảo phụ (chưa trùng loại đang có): {formatNumber(cost.stones)} linh thạch và {cost.fragments} tàn quyển.
            </p>
            <NatalChoices ids={free} pick={pickAux} setPick={setPickAux} />
            {pickAux && (
              <button
                className="primary"
                disabled={!canForgeTreasure(s)}
                onClick={() => act((st, now, rng) => forgeTreasure(st, pickAux, now, rng))}
              >
                Luyện {NATALS[pickAux].name}
                {!canForgeTreasure(s) && ' (chưa đủ linh thạch hoặc tàn quyển)'}
              </button>
            )}
          </>
        )}
      </section>

      <section className="card">
        <h2>Cộng Hưởng</h2>
        <p className="muted small">Có đủ hai pháp bảo của một cặp (bản mệnh hay phụ đều được) thì nhận thêm chỉ số.</p>
        {RESONANCES.map((r) => {
          const on = resonances.includes(r);
          return (
            <div key={r.name} className={`small ${on ? 'set-on' : 'muted'}`}>
              {on ? '✓' : '○'} 【{r.name}】 {NATALS[r.ids[0]].name} + {NATALS[r.ids[1]].name}: {describeMods(r.mods)}
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>Luyện Hóa</h2>
        <p className="small">Linh Tài: <b>{s.materials}</b> (thủ lĩnh bí cảnh và tháp rơi, lịch luyện thỉnh thoảng nhặt được)</p>
        <AutoToggle s={s} act={act} k="devour" label="Tự luyện hóa trang bị kém hơn khi nhặt được">
          Thay cho tự bán: trang bị kém hơn đồ đang dùng được nuốt để {owned.length > 1 ? 'pháp bảo đang nuôi' : 'bản mệnh'} lên cấp.
        </AutoToggle>
        <button disabled={!canDevour(s) || worse.length === 0} onClick={() => act(devourWorse)}>
          Luyện hóa {worse.length} món kém hơn · +{formatNumber(worseExp)} kinh nghiệm
        </button>
      </section>
    </>
  );
}
