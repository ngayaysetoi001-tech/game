import { useState } from 'react';
import { MAX_BREAK_PILLS, PILLS, REALMS, ROOT_TIERS, SECLUSIONS, type PillId } from '../engine/data';
import {
  MAX_LEVEL,
  applyOffline,
  breakthrough,
  breakthroughChance,
  buyPill,
  canBreakthrough,
  canUsePill,
  cancelSeclusion,
  cultivationRate,
  exportSave,
  formatDuration,
  formatNumber,
  importSave,
  isBottleneck,
  isInjured,
  levelInfo,
  levelName,
  pillPrice,
  requiredFor,
  rootName,
  seclusionDef,
  startSeclusion,
  stoneRate,
  usePill,
  type GameState,
} from '../engine/engine';
import type { Action } from './App';
import { Elements } from './Elements';

interface Props {
  state: GameState;
  act: (fn: Action) => void;
  replace: (s: GameState | null) => void;
}

export default function GameScreen({ state: s, act, replace }: Props) {
  const now = s.lastTick;
  const req = requiredFor(s.level);
  const pct = Math.min(100, (s.cultivation / req) * 100);
  const rate = cultivationRate(s, now);

  return (
    <>
      <header className="card header">
        <div>
          <div className="name">{s.name}</div>
          <div className="realm">{levelName(s.level)}</div>
        </div>
        <div className="root">
          <div className="small muted">{rootName(s.root)}</div>
          <Elements elements={s.root.elements} />
        </div>
      </header>

      <section className="card">
        <div className="bar">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
          <div className="bar-text">
            {formatNumber(s.cultivation)} / {formatNumber(req)} tu vi
          </div>
        </div>
        <div className="stats">
          <span>
            Tu vi: <b>{formatNumber(rate)}</b>/s
            {s.seclusion && <span className="tag good">bế quan ×{seclusionDef(s.seclusion.id).rateMult}</span>}
            {isInjured(s, now) && (
              <span className="tag bad">thương thế {formatDuration((s.injuryUntil - now) / 1000)}</span>
            )}
          </span>
          <span>
            Linh thạch: <b>{formatNumber(s.stones)}</b> (+{formatNumber(stoneRate(s))}/s)
          </span>
        </div>
        <BreakthroughPanel s={s} act={act} />
      </section>

      <SeclusionPanel s={s} act={act} />
      <ShopPanel s={s} act={act} />
      <LogPanel s={s} />
      <SettingsPanel s={s} replace={replace} />
    </>
  );
}

function BreakthroughPanel({ s, act }: { s: GameState; act: Props['act'] }) {
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
  if (!full) return <p className="notice">Bình cảnh: tích đầy tu vi để đột phá {next}.</p>;
  if (s.seclusion) return <p className="notice">Đang bế quan, xuất quan rồi mới đột phá {next} được.</p>;

  const usable = Math.min(pills, s.pills.phaCanh, MAX_BREAK_PILLS);
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
          disabled={usable >= Math.min(s.pills.phaCanh, MAX_BREAK_PILLS)}
          onClick={() => setPills(usable + 1)}
        >
          +
        </button>
        <span className="muted small">(có {s.pills.phaCanh})</span>
      </div>
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

function SeclusionPanel({ s, act }: { s: GameState; act: Props['act'] }) {
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
          <span>Còn lại: {formatDuration((sec.end - s.lastTick) / 1000)}</span>
          <span>Đã thu: {formatNumber(sec.gained)} tu vi</span>
        </div>
        <button onClick={() => act(cancelSeclusion)}>Xuất quan sớm (mất cơ duyên)</button>
      </section>
    );
  }
  return (
    <section className="card">
      <h2>Bế Quan</h2>
      <p className="muted small">
        Tăng tốc độ tu luyện, chạy cả khi offline. Xuất quan đúng hạn có thể gặp cơ duyên… hoặc tâm ma.
      </p>
      <div className="grid3">
        {SECLUSIONS.map((d) => (
          <button key={d.id} onClick={() => act((st, now, rng) => startSeclusion(st, d.id, now, rng))}>
            <b>{d.name}</b>
            <span className="small">
              {d.minutes >= 60 ? `${d.minutes / 60} giờ` : `${d.minutes} phút`} · ×{d.rateMult}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ShopPanel({ s, act }: { s: GameState; act: Props['act'] }) {
  const ids = Object.keys(PILLS) as PillId[];
  return (
    <section className="card">
      <h2>Phường Thị</h2>
      {ids.map((id) => {
        const price = pillPrice(s, id);
        return (
          <div key={id} className="shop-item">
            <div>
              <div>
                <b>{PILLS[id].name}</b> <span className="muted small">× {s.pills[id]}</span>
              </div>
              <div className="muted small">{PILLS[id].desc}</div>
            </div>
            <div className="shop-actions">
              <button
                disabled={s.stones < price}
                onClick={() => act((st, now, rng) => buyPill(st, id, now, rng))}
              >
                Mua {formatNumber(price)}
              </button>
              {id !== 'phaCanh' && (
                <button
                  disabled={!canUsePill(s, id, s.lastTick)}
                  onClick={() => act((st, now, rng) => usePill(st, id, now, rng))}
                >
                  Dùng
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function LogPanel({ s }: { s: GameState }) {
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

function SettingsPanel({ s, replace }: { s: GameState; replace: Props['replace'] }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <section className="card">
      <h2>Thiết Lập</h2>
      <p className="muted small">
        Tự động lưu mỗi 5 giây. Linh căn: {rootName(s.root)} (×{ROOT_TIERS[s.root.tier].rateMult}).
      </p>
      <textarea
        rows={3}
        value={code}
        placeholder="Mã lưu game"
        onChange={(e) => setCode(e.target.value)}
      />
      <div className="row">
        <button
          onClick={() => {
            const c = exportSave(s);
            setCode(c);
            navigator.clipboard?.writeText(c).then(
              () => setMsg('Đã sao chép mã lưu.'),
              () => setMsg('Hãy tự sao chép mã ở trên.'),
            );
          }}
        >
          Xuất
        </button>
        <button
          onClick={() => {
            const loaded = importSave(code);
            if (!loaded) return setMsg('Mã lưu không hợp lệ.');
            // tính bù thời gian từ lần lưu cuối của mã này (vẫn giới hạn 12 giờ)
            replace(applyOffline(loaded, Date.now(), Math.random).state);
            setMsg('Đã nhập mã lưu.');
          }}
        >
          Nhập
        </button>
        <button
          className="danger"
          onClick={() => {
            if (confirm('Tán công trùng tu? Toàn bộ tiến độ sẽ mất.')) replace(null);
          }}
        >
          Xóa dữ liệu
        </button>
      </div>
      {msg && <p className="small muted">{msg}</p>}
    </section>
  );
}
