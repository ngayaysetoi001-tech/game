import { useMemo, useState } from 'react';
import { MAX_BREAK_PILLS, PILLS, REALMS, SECLUSIONS } from '../../engine/data';
import {
  KIEP_BONUS_BY_GRADE,
  KIEP_GRADE_NAMES,
  MAX_LEVEL,
  breakthrough,
  estimateKiep,
  hasKiep,
  kiepMods,
  playerStats,
  breakPillTotal,
  breakthroughChance,
  canBreakthrough,
  cancelSeclusion,
  cultivationRate,
  formatDuration,
  formatNumber,
  gateFloorFor,
  isBottleneck,
  levelInfo,
  requiredFor,
  seclusionDef,
  startSeclusion,
  type GameState,
  stoneRate,
} from '../../engine/engine';
import type { TabProps } from '../GameScreen';
import CultivationScene from '../scenes/CultivationScene';
import AutoToggle from '../AutoToggle';
import QuestPanel from '../QuestPanel';

export default function CultivateTab(props: TabProps) {
  const { state: s } = props;
  const req = requiredFor(s.level);
  const pct = Math.min(100, (s.cultivation / req) * 100);
  const rate = cultivationRate(s, s.lastTick);

  return (
    <>
      <section className="card">
        <CultivationScene s={s} />
        <div className="bar">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
          <div className="bar-text">
            {formatNumber(s.cultivation)} / {formatNumber(req)} tu vi
          </div>
        </div>
        <div className="stats">
          <span>
            Tu vi <b>{formatNumber(rate)}</b>/s
          </span>
          <span>
            Linh thạch +{formatNumber(stoneRate(s))}/s
          </span>
        </div>
        <BreakthroughPanel {...props} />
      </section>
      <TribulationCard s={s} />
      <QuestPanel {...props} />
      <SeclusionPanel {...props} />
      <LogPanel {...props} />
    </>
  );
}

function BreakthroughPanel({ state: s, act, goTo }: TabProps) {
  const [pills, setPills] = useState(0);
  if (!isBottleneck(s.level)) return null;

  const full = s.cultivation >= requiredFor(s.level);
  if (s.level === MAX_LEVEL) {
    return (
      <p className="notice">
        {full ? 'Đã đạt đỉnh phong nhân giới. Phi Thăng sẽ mở ở bản sau.' : 'Cảnh giới cuối cùng: tích đủ tu vi để chạm tới đỉnh phong.'}
      </p>
    );
  }

  const next = REALMS[levelInfo(s.level + 1).realm].name;
  const gate = gateFloorFor(s);
  const gateMsg =
    s.floor < gate ? (
      <p className="notice">
        Muốn đột phá {next} phải vượt Bí Cảnh tầng {gate} (hiện tại: tầng {s.floor}).{' '}
        <button className="link" onClick={() => goTo('dungeon')}>
          Tới Bí Cảnh
        </button>
      </p>
    ) : null;
  if (!full)
    return (
      <>
        <p className="notice">Bình cảnh: tích đầy tu vi để đột phá {next}.</p>
        {gateMsg}
      </>
    );
  if (gateMsg) return gateMsg;
  if (s.seclusion) return <p className="notice">Đang bế quan, xuất quan rồi mới đột phá {next} được.</p>;

  const total = breakPillTotal(s);
  const usable = Math.min(pills, total, MAX_BREAK_PILLS);
  const chance = breakthroughChance(s, usable);
  return (
    <div className="breakthrough">
      <div className="row">
        <span>{PILLS.phaCanh.name}:</span>
        <button className="small-btn" disabled={usable <= 0} onClick={() => setPills(usable - 1)}>
          −
        </button>
        <b>{usable}</b>
        <button
          className="small-btn"
          disabled={usable >= Math.min(total, MAX_BREAK_PILLS)}
          onClick={() => setPills(usable + 1)}
        >
          +
        </button>
        <span className="muted small">(có {total}, phẩm cao dùng trước)</span>
      </div>
      {hasKiep(levelInfo(s.level + 1).realm) && <KiepPreview s={s} realm={levelInfo(s.level + 1).realm} />}
      <button
        className="primary big"
        disabled={!canBreakthrough(s)}
        onClick={() => {
          act((st, now, rng) => breakthrough(st, usable, now, rng));
          setPills(0);
        }}
      >
        Đột phá {next} · {Math.round(chance * 100)}%
      </button>
    </div>
  );
}

function SeclusionPanel({ state: s, act }: TabProps) {
  const sec = s.seclusion;
  if (sec) {
    const def = seclusionDef(sec.id);
    const pct = ((s.lastTick - sec.start) / (sec.end - sec.start)) * 100;
    return (
      <section className="card">
        <h2>{def.name}</h2>
        <div className="bar thin">
          <div className="bar-fill seclusion" style={{ width: `${pct}%` }} />
        </div>
        <div className="stats">
          <span>Còn lại {formatDuration((sec.end - s.lastTick) / 1000)}</span>
          <span>Đã thu {formatNumber(sec.gained)} tu vi</span>
        </div>
        <button onClick={() => act(cancelSeclusion)}>Xuất quan sớm (mất cơ duyên)</button>
        <AutoToggle s={s} act={act} k="reclusion" label="Tự bế quan lại khi kết thúc">
          Dừng khi tu vi đầy bình cảnh để bạn đột phá.
        </AutoToggle>
      </section>
    );
  }
  return (
    <section className="card">
      <h2>Bế Quan</h2>
      <p className="muted small">
        Tăng tốc độ tu luyện, chạy cả khi offline. Xuất quan đúng hạn có thể gặp cơ duyên… hoặc tâm ma. Khi bế quan
        không thể chiến đấu hay lịch luyện.
      </p>
      {s.farming && <p className="notice">Đang lịch luyện ở Bí Cảnh. Kết thúc lịch luyện trước khi bế quan.</p>}
      <div className="grid3">
        {SECLUSIONS.map((d) => (
          <button
            key={d.id}
            disabled={!!s.farming}
            onClick={() => act((st, now, rng) => startSeclusion(st, d.id, now, rng))}
          >
            <b>{d.name}</b>
            <span className="small">
              {d.minutes >= 60 ? `${d.minutes / 60} giờ` : `${d.minutes} phút`} · ×{d.rateMult}
            </span>
          </button>
        ))}
      </div>
      <AutoToggle s={s} act={act} k="reclusion" label="Tự bế quan lại khi kết thúc">
        Dừng khi tu vi đầy bình cảnh để bạn đột phá.
      </AutoToggle>
    </section>
  );
}

function LogPanel({ state: s }: TabProps) {
  return (
    <section className="card">
      <h2>Nhật Ký Tu Tiên</h2>
      <ul className="log">
        {s.log.map((l, i) => (
          <li key={`${l.time}-${i}`} className={l.kind}>
            <span className="time">
              {new Date(l.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {l.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

function KiepPreview({ s, realm }: { s: GameState; realm: number }) {
  const p = playerStats(s, s.lastTick);
  const key = `${Math.round(p.hp)}|${Math.round(p.def)}|${p.dodge ?? 0}|${realm}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const e = useMemo(() => estimateKiep(s, realm, s.lastTick), [key]);
  const tone = e.pass >= 0.85 ? 'good' : e.pass >= 0.4 ? 'mid' : 'bad';
  return (
    <div className="kiep-preview">
      <div className="row spread">
        <span>
          ⚡ Thiên Kiếp: <b>{e.bolts}</b> đạo lôi
        </span>
        <span className={`chance ${tone}`}>
          Vượt kiếp ~<b>{Math.round(e.pass * 100)}%</b>
        </span>
      </div>
      <p className="muted small">
        Sau khi đột phá thành công, sét đánh xuống từng đạo. Khí huyết và phòng thủ càng cao càng dễ sống; còn nhiều khí
        huyết thì kiếp phẩm cao, thể chất tăng vĩnh viễn nhiều hơn. Ngã xuống thì mất 40% tu vi và trọng thương.
        {s.injuryUntil > s.lastTick && ' Đang bị thương nên chỉ số giảm, nên dưỡng thương trước.'}
      </p>
    </div>
  );
}

function TribulationCard({ s }: { s: GameState }) {
  const done = Object.entries(s.kiep).sort((a, b) => Number(a[0]) - Number(b[0]));
  const k = s.lastKiep;
  if (!done.length && !k) return null;
  const bonus = kiepMods(s);
  return (
    <section className="card">
      <h2>Thiên Kiếp</h2>
      {k && (
        <div className="kiep-report">
          <div className="small">
            {REALMS[k.realm].name}: {k.pass ? `vượt qua · kiếp ${KIEP_GRADE_NAMES[k.grade!]}` : 'ngã xuống'}
          </div>
          <div className="kiep-bolts">
            {Array.from({ length: k.bolts }, (_, i) => {
              const v = k.hp[i];
              return (
                <div key={i} className={`kiep-bolt ${v === undefined ? 'unreached' : v <= 0 ? 'dead' : ''}`}>
                  <div className="kiep-hp" style={{ height: `${Math.round((v ?? 0) * 100)}%` }} />
                  <span>⚡{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <>
          <p className="small">
            Đã độ kiếp:{' '}
            {done.map(([r, g]) => (
              <span key={r} className="tag good" style={{ marginRight: 4 }}>
                {REALMS[Number(r)].name} · {KIEP_GRADE_NAMES[g]} (+{Math.round(KIEP_BONUS_BY_GRADE[g] * 100)}%)
              </span>
            ))}
          </p>
          <p className="muted small">
            Thể chất vĩnh viễn: khí huyết và phòng thủ +{Math.round(bonus.hpPct * 100)}%, công +
            {Math.round(bonus.atkPct * 100)}%.
          </p>
        </>
      )}
    </section>
  );
}
