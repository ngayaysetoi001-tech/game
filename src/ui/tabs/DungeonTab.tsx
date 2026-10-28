import { useMemo, useState } from 'react';
import {
  FARM_CULTIVATION_MULT,
  FARM_FRAGMENT_CHANCE,
  FARM_ITEM_CHANCE,
  FARM_STONE_SHARE,
  MAX_FLOOR,
  floorStones,
} from '../../engine/data';
import {
  canChallenge,
  challengeFloor,
  combatPower,
  enemyFor,
  formatDuration,
  formatNumber,
  isBossFloor,
  playerStats,
  simulateBattle,
  startFarming,
  stopFarming,
  zoneOf,
  type Fighter,
} from '../../engine/engine';
import type { TabProps } from '../GameScreen';
import BattleStage from '../scenes/BattleStage';

const ESTIMATE_RUNS = 100;

function estimateWin(p: Fighter, e: Fighter): number {
  let w = 0;
  for (let i = 0; i < ESTIMATE_RUNS; i++) if (simulateBattle(p, e, Math.random).win) w++;
  return w / ESTIMATE_RUNS;
}

export default function DungeonTab(props: TabProps) {
  const { state: s, act } = props;
  const [playing, setPlaying] = useState(false);
  const next = Math.min(s.floor + 1, MAX_FLOOR);
  const cleared = s.floor >= MAX_FLOOR;
  const player = playerStats(s, s.lastTick);
  const enemy = enemyFor(next);
  // Chỉ tính lại khi chỉ số thay đổi, không phải mỗi nhịp đồng hồ
  const key = `${Math.round(player.hp)}|${Math.round(player.atk)}|${Math.round(player.def)}|${player.spd}|${player.crit}|${next}`;
  const chance = useMemo(() => estimateWin(player, enemy), [key]);
  const zone = zoneOf(next);
  const boss = isBossFloor(next);

  return (
    <>
      <section className="card">
        <div className="row spread">
          <h2>{zone.name}</h2>
          <span className="muted small">
            Đã vượt {s.floor}/{MAX_FLOOR} tầng
          </span>
        </div>
        <div className="bar thin">
          <div className="bar-fill" style={{ width: `${(s.floor / MAX_FLOOR) * 100}%` }} />
        </div>
        <BattleStage s={s} onPlaying={setPlaying} />

        {cleared ? (
          <p className="notice">Đã chinh phục toàn bộ bí cảnh. Bí cảnh mới sẽ mở ở bản sau.</p>
        ) : (
          <>
            <div className={`enemy ${boss ? 'boss' : ''}`}>
              <div className="row spread">
                <div>
                  <div className="muted small">Tầng {next}</div>
                  <div className="enemy-name">
                    {enemy.name} {boss && <span className="tag bad">Thủ lĩnh</span>}
                  </div>
                </div>
                <div className={`chance ${chance >= 0.7 ? 'good' : chance >= 0.3 ? 'mid' : 'bad'}`}>
                  <div className="small muted">Thắng ước tính</div>
                  <b>{Math.round(chance * 100)}%</b>
                </div>
              </div>
              <table className="versus">
                <thead>
                  <tr>
                    <th />
                    <th>Ngươi</th>
                    <th>Đối thủ</th>
                  </tr>
                </thead>
                <tbody>
                  <StatRow label="Khí huyết" a={player.hp} b={enemy.hp} />
                  <StatRow label="Công" a={player.atk} b={enemy.atk} />
                  <StatRow label="Thủ" a={player.def} b={enemy.def} />
                  <StatRow label="Tốc độ" a={player.spd} b={enemy.spd} />
                  <StatRow label="Chiến lực" a={combatPower(player)} b={combatPower(enemy)} />
                </tbody>
              </table>
            </div>
            <button
              className="primary big"
              disabled={!canChallenge(s) || playing}
              onClick={() => act(challengeFloor)}
            >
              Khiêu chiến tầng {next}
            </button>
            {s.seclusion && <p className="muted small">Đang bế quan, không thể chiến đấu.</p>}
            {chance < 0.3 && (
              <p className="notice">
                Đối thủ quá mạnh. Hãy lịch luyện ở tầng đã vượt để nhặt pháp bảo, dùng tàn quyển tu luyện công
                pháp, hoặc tu luyện lên cảnh giới cao hơn.
              </p>
            )}
            <p className="muted small">
              Thắng: {formatNumber(floorStones(next))} linh thạch, {boss ? 3 : 1} tàn quyển, 1 pháp bảo
              {boss ? ' (từ Linh Phẩm trở lên)' : ''}. Thua: bị thương 2 phút.
            </p>
          </>
        )}
      </section>

      {s.lastBattle && <BattleReport {...props} />}
      <FarmingPanel {...props} />
    </>
  );
}

function StatRow({ label, a, b }: { label: string; a: number; b: number }) {
  return (
    <tr>
      <td className="muted">{label}</td>
      <td className={a >= b ? 'up' : 'down'}>{formatNumber(a)}</td>
      <td>{formatNumber(b)}</td>
    </tr>
  );
}

function BattleReport({ state: s }: TabProps) {
  const [open, setOpen] = useState(false);
  const b = s.lastBattle!;
  return (
    <section className="card">
      <div className="row spread">
        <h2>Chiến báo</h2>
        <span className={`tag ${b.win ? 'good' : 'bad'}`}>{b.win ? 'Thắng' : 'Bại'}</span>
      </div>
      <p className="small">
        Tầng {b.floor} · {b.enemy} · {b.lines.length - 1} chiêu
      </p>
      {open ? (
        <ol className="battle-lines">
          {b.lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      ) : (
        <p className="small muted">{b.lines[b.lines.length - 1]}</p>
      )}
      <button onClick={() => setOpen(!open)}>{open ? 'Thu gọn' : 'Xem diễn biến'}</button>
    </section>
  );
}

function FarmingPanel({ state: s, act }: TabProps) {
  // null = luôn chọn tầng cao nhất đã vượt
  const [floor, setFloor] = useState<number | null>(null);
  const chosen = Math.min(floor ?? s.floor, s.floor);

  if (s.farming) {
    const f = s.farming;
    return (
      <section className="card">
        <h2>Đang lịch luyện</h2>
        <p className="small">
          Tầng {f.floor} · {zoneOf(f.floor).name} · đã {formatDuration((s.lastTick - f.start) / 1000)}
        </p>
        <FarmRates floor={f.floor} />
        <button onClick={() => act(stopFarming)}>Kết thúc lịch luyện</button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Lịch Luyện</h2>
      <p className="muted small">
        Treo máy ở một tầng đã vượt để kiếm linh thạch, tàn quyển và pháp bảo, kể cả khi offline. Trong lúc lịch
        luyện, tốc độ tu luyện ×{FARM_CULTIVATION_MULT}.
      </p>
      {s.floor === 0 ? (
        <p className="notice">Vượt tầng 1 để mở lịch luyện.</p>
      ) : (
        <>
          <div className="row">
            <label htmlFor="farm-floor">Tầng</label>
            <select id="farm-floor" value={chosen} onChange={(e) => setFloor(Number(e.target.value))}>
              {Array.from({ length: s.floor }, (_, i) => s.floor - i).map((f) => (
                <option key={f} value={f}>
                  {f} · {zoneOf(f).name}
                </option>
              ))}
            </select>
          </div>
          <FarmRates floor={chosen} />
          <button
            className="primary"
            disabled={!!s.seclusion}
            onClick={() => act((st, now, rng) => startFarming(st, chosen, now, rng))}
          >
            Bắt đầu lịch luyện
          </button>
          {s.seclusion && <p className="muted small">Đang bế quan, không thể lịch luyện.</p>}
        </>
      )}
    </section>
  );
}

function FarmRates({ floor }: { floor: number }) {
  return (
    <p className="small">
      Mỗi phút: {formatNumber(floorStones(floor) * FARM_STONE_SHARE)} linh thạch · {FARM_FRAGMENT_CHANCE * 100}%
      tàn quyển · {FARM_ITEM_CHANCE * 100}% pháp bảo
    </p>
  );
}
