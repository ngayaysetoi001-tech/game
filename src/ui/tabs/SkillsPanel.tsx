import {
  PLAYER_SKILLS,
  SKILLS,
  SKILL_MAX_LEVEL,
  canUpgradeSkill,
  describeSkill,
  formatNumber,
  moveSkill,
  skillSlotCount,
  skillUpgradeCost,
  toggleSkill,
  upgradeSkill,
  type SkillDef,
  type SkillId,
} from '../../engine/engine';
import { REALMS, PATHS } from '../../engine/data';
import type { TabProps } from '../GameScreen';

function sourceText(def: SkillDef): string {
  switch (def.source.kind) {
    case 'path':
      return `Học ngay khi chọn ${def.path ? PATHS[def.path].name : 'hướng tu'}`;
    case 'boss':
      return `Bí tịch rơi từ thủ lĩnh tầng ${def.source.floor}`;
    case 'shop':
      return `Tàng Kinh Các (Phường Thị), từ ${REALMS[def.source.realm].name}`;
    default:
      return '';
  }
}

export default function SkillsPanel({ state: s, act }: TabProps) {
  const slots = skillSlotCount(s);
  const learned = PLAYER_SKILLS.filter((d) => s.skills[d.id]);
  const spare = learned.filter((d) => !s.loadout.includes(d.id));
  const locked = PLAYER_SKILLS.filter((d) => !s.skills[d.id] && (!d.path || d.path === s.path));

  return (
    <>
      <section className="card">
        <h2>Võ Kỹ Mang Theo</h2>
        <p className="muted small">
          Trong trận, mỗi lượt tự dùng võ kỹ đầu tiên đã hồi chiêu (theo thứ tự dưới đây), không có thì đánh thường.
          {slots === 0 ? ' Đạt Trúc Cơ để mở ô võ kỹ đầu tiên.' : ` Đang mở ${slots}/3 ô (Trúc Cơ 1, Kim Đan 2, Nguyên Anh 3).`}
        </p>
        {s.loadout.length === 0 && <p className="notice">Chưa mang võ kỹ nào.</p>}
        {s.loadout.map((id, i) => (
          <SkillRow key={id} id={id} {...{ s, act }} index={i} active={i < slots} total={s.loadout.length} />
        ))}
      </section>

      {spare.length > 0 && (
        <section className="card">
          <h2>Đã Học</h2>
          {spare.map((d) => (
            <SkillRow key={d.id} id={d.id} {...{ s, act }} />
          ))}
        </section>
      )}

      {locked.length > 0 && (
        <section className="card">
          <h2>Chưa Học</h2>
          {locked.map((d) => (
            <div key={d.id} className="skill-row locked">
              <div className="skill-main">
                <b>{d.name}</b>
                <div className="small muted">{describeSkill(d, 1)}</div>
                <div className="small">{sourceText(d)}</div>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

function SkillRow({
  id,
  s,
  act,
  index,
  active,
  total,
}: Pick<TabProps, 'act'> & { id: SkillId; s: TabProps['state']; index?: number; active?: boolean; total?: number }) {
  const def = SKILLS[id];
  const lv = s.skills[id] ?? 1;
  const cost = skillUpgradeCost(s, id);
  const equipped = index !== undefined;
  const full = s.loadout.length >= 3;
  return (
    <div className={`skill-row ${equipped && !active ? 'inactive' : ''}`}>
      {equipped && <span className="skill-order">{index! + 1}</span>}
      <div className="skill-main">
        <div>
          <b>{def.name}</b> <span className="muted small">cấp {lv}/{SKILL_MAX_LEVEL}</span>
          {equipped && !active && <span className="tag bad">ô chưa mở</span>}
        </div>
        <div className="small muted">{describeSkill(def, lv)}</div>
        <div className="skill-actions">
          {equipped ? (
            <>
              <button disabled={index === 0} aria-label="Ưu tiên trước" onClick={() => act((st, now, rng) => moveSkill(st, id, -1, now, rng))}>
                ▲
              </button>
              <button
                disabled={index === total! - 1}
                aria-label="Ưu tiên sau"
                onClick={() => act((st, now, rng) => moveSkill(st, id, 1, now, rng))}
              >
                ▼
              </button>
              <button onClick={() => act((st, now, rng) => toggleSkill(st, id, now, rng))}>Cất</button>
            </>
          ) : (
            <button disabled={full} onClick={() => act((st, now, rng) => toggleSkill(st, id, now, rng))}>
              {full ? 'Đã đủ 3 võ kỹ' : 'Mang theo'}
            </button>
          )}
          <button disabled={!canUpgradeSkill(s, id)} onClick={() => act((st, now, rng) => upgradeSkill(st, id, now, rng))}>
            {lv >= SKILL_MAX_LEVEL ? 'Tối đa' : `Luyện · ${cost.fragments} quyển, ${formatNumber(cost.stones)} LT`}
          </button>
        </div>
      </div>
    </div>
  );
}
