import { useState } from 'react';
import { PILLS, type PillId } from '../engine/data';
import {
  QUESTS,
  claimAllQuests,
  claimQuest,
  claimableQuests,
  currentQuest,
  formatNumber,
  isQuestClaimed,
  questReward,
  type GameState,
  type GoTo,
  type QuestDef,
} from '../engine/engine';
import { advise } from '../engine/guide';
import type { TabProps } from './GameScreen';
import { openCharacterSub } from './tabs/CharacterTab';
import { useNextFloorChance } from './winChance';

/** Dẫn người chơi tới đúng tab (và mục con của tab Nhân Vật) */
function useGo(goTo: TabProps['goTo']) {
  return (g: GoTo) => {
    if (g.sub) openCharacterSub(g.sub);
    goTo(g.tab);
    window.scrollTo({ top: 0 });
  };
}

function RewardChips({ s, q }: { s: GameState; q: QuestDef }) {
  const r = questReward(s, q);
  return (
    <span className="reward-chips">
      {r.stones > 0 && <span className="reward-chip">{formatNumber(r.stones)} linh thạch</span>}
      {r.fragments > 0 && <span className="reward-chip">{r.fragments} tàn quyển</span>}
      {(Object.entries(r.pills) as [PillId, number][]).map(([id, n]) => (
        <span key={id} className="reward-chip">
          {n} {PILLS[id].name}
        </span>
      ))}
    </span>
  );
}

export default function QuestPanel({ state: s, act, goTo }: TabProps) {
  const go = useGo(goTo);
  const [open, setOpen] = useState(false);
  const chance = useNextFloorChance(s);
  const advice = advise(s, chance);
  const claimable = claimableQuests(s);
  const current = currentQuest(s);
  const claimed = QUESTS.filter((q) => isQuestClaimed(s, q.id)).length;

  return (
    <section className="card">
      <h2>Việc Nên Làm</h2>
      {advice.map((a, i) => (
        <div key={i} className={`advice ${a.tone}`}>
          <span>{a.text}</span>
          {a.go && (
            <button className="small-btn" onClick={() => go(a.go!)}>
              {a.goLabel ?? 'Đi tới'}
            </button>
          )}
        </div>
      ))}

      <h2 className="sub-h">Nhiệm Vụ</h2>
      {claimable.length > 1 && (
        <button className="primary" onClick={() => act(claimAllQuests)}>
          Nhận thưởng tất cả ({claimable.length})
        </button>
      )}
      {claimable.map((q) => (
        <div key={q.id} className="quest done">
          <div className="quest-main">
            <b>✓ {q.title}</b>
            <div className="small muted">{q.desc}</div>
            <RewardChips s={s} q={q} />
          </div>
          <button className="primary" onClick={() => act((st, now, rng) => claimQuest(st, q.id, now, rng))}>
            Nhận
          </button>
        </div>
      ))}
      {current && (
        <div className="quest">
          <div className="quest-main">
            <b>{current.title}</b>
            <div className="small muted">{current.desc}</div>
            {current.progress && <div className="small">Tiến độ: {current.progress(s)}</div>}
            <RewardChips s={s} q={current} />
          </div>
          <button onClick={() => go(current.go)}>Đi tới</button>
        </div>
      )}
      {!current && claimable.length === 0 && (
        <p className="notice">Đã hoàn thành mọi nhiệm vụ hiện có. Nhiệm vụ mới sẽ mở ở các bản sau.</p>
      )}

      <button className="link" onClick={() => setOpen(!open)}>
        {open ? 'Ẩn danh sách' : `Tất cả nhiệm vụ (${claimed}/${QUESTS.length})`}
      </button>
      {open && (
        <ol className="quest-list">
          {QUESTS.map((q) => {
            const isClaimed = isQuestClaimed(s, q.id);
            const done = q.done(s);
            return (
              <li key={q.id} className={isClaimed ? 'claimed' : done ? 'ready' : ''}>
                <span className="mark">{isClaimed ? '✓' : done ? '●' : '○'}</span>
                <span>
                  <b>{q.title}</b> <span className="muted small">{q.desc}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
