import { useState } from 'react';
import { BAG_LIMIT, BASE_TECH, PATHS, PATH_UNLOCK_LEVEL, SLOTS, SLOT_NAMES, TIERS, type PathId } from '../../engine/data';
import {
  applyOffline,
  canUpgradeTech,
  choosePath,
  combatPower,
  cultivationBonus,
  equipItem,
  exportSave,
  formatNumber,
  hasAffinity,
  importSave,
  isWorse,
  itemName,
  itemScore,
  itemSellPrice,
  itemStats,
  levelInfo,
  levelName,
  pathBonus,
  playerStats,
  sellItem,
  sellWorse,
  techMaxLevel,
  techUpgradeCost,
  upgradeTech,
  type GameState,
  type Item,
  type TechKind,
} from '../../engine/engine';
import type { TabProps } from '../GameScreen';
import Cultivator from '../art/Cultivator';
import { ItemIcon } from '../art/Icons';
import Landscape from '../art/Landscape';
import { HOME_THEME, REALM_AURA } from '../art/palette';
import { Art } from '../art/registry';
import AutoToggle from '../AutoToggle';
import SkillsPanel from './SkillsPanel';

type Sub = 'overview' | 'technique' | 'skills' | 'gear';

const SUBS: { id: Sub; label: string }[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'technique', label: 'Công Pháp' },
  { id: 'skills', label: 'Võ Kỹ' },
  { id: 'gear', label: 'Pháp Bảo' },
];

// Giữ mục con đang xem khi chuyển tab qua lại
let lastSub: Sub = 'overview';

export default function CharacterTab(props: TabProps) {
  const [sub, setSub] = useState<Sub>(lastSub);
  lastSub = sub;
  return (
    <>
      <div className="subtabs" role="tablist">
        {SUBS.map((t) => (
          <button key={t.id} role="tab" aria-selected={sub === t.id} className={sub === t.id ? 'active' : ''} onClick={() => setSub(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {sub === 'overview' && (
        <>
          <StatsPanel {...props} />
          <StatsSummary {...props} />
          <SettingsPanel {...props} />
        </>
      )}
      {sub === 'technique' && <TechniquePanel {...props} />}
      {sub === 'skills' && <SkillsPanel {...props} />}
      {sub === 'gear' && (
        <>
          <GearPanel {...props} />
          <BagPanel {...props} />
        </>
      )}
    </>
  );
}

function StatsPanel({ state: s }: TabProps) {
  const p = playerStats(s, s.lastTick);
  const rows: [string, string][] = [
    ['Khí huyết', formatNumber(p.hp)],
    ['Công', formatNumber(p.atk)],
    ['Thủ', formatNumber(p.def)],
    ['Tốc độ', formatNumber(p.spd)],
    ['Bạo kích', `${Math.round(p.crit * 100)}%`],
    ['Tu luyện', `+${Math.round((cultivationBonus(s) - 1) * 100)}%`],
  ];
  const realm = levelInfo(s.level).realm;
  return (
    <section className="card">
      <div className="scene portrait">
        <Landscape theme={HOME_THEME} seed={5} />
        <div className="scene-figure stand">
          <Art k={`cultivator/${s.path ?? 'none'}-stand`} alt={s.name}>
            <Cultivator pose="stand" path={s.path} aura={REALM_AURA[realm]} power={realm / 8} />
          </Art>
        </div>
      </div>
      <div className="row spread">
        <h2>Chiến lực {formatNumber(combatPower(p))}</h2>
      </div>
      <dl className="stat-grid">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TechRow({ s, kind, act }: { s: GameState; kind: TechKind; act: TabProps['act'] }) {
  const level = s.tech[kind];
  const max = techMaxLevel(s, kind);
  const cost = techUpgradeCost(s, kind);
  const name = kind === 'base' ? BASE_TECH.name : PATHS[s.path!].technique;
  const effect =
    kind === 'base'
      ? `Khí huyết, Công, Thủ +${Math.round(BASE_TECH.perLevel * level * 100)}%`
      : describePath(s);
  return (
    <div className="tech-row">
      <div>
        <div>
          <b>{name}</b> <span className="muted small">tầng {level}/{max}</span>
        </div>
        <div className="small muted">{effect}</div>
      </div>
      <button
        disabled={!canUpgradeTech(s, kind)}
        onClick={() => act((st, now, rng) => upgradeTech(st, kind, now, rng))}
      >
        {level >= max ? 'Tối đa' : `Tu luyện · ${cost.fragments} quyển, ${formatNumber(cost.stones)} LT`}
      </button>
    </div>
  );
}

function describePath(s: GameState): string {
  const parts: string[] = [];
  const pct = (v: number) => `+${Math.round(v * 100)}%`;
  if (pathBonus(s, 'atk')) parts.push(`Công ${pct(pathBonus(s, 'atk'))}`);
  if (pathBonus(s, 'hp')) parts.push(`Khí huyết ${pct(pathBonus(s, 'hp'))}`);
  if (pathBonus(s, 'def')) parts.push(`Thủ ${pct(pathBonus(s, 'def'))}`);
  if (pathBonus(s, 'rate')) parts.push(`Tu luyện ${pct(pathBonus(s, 'rate'))}`);
  if (pathBonus(s, 'crit')) parts.push(`Bạo kích ${pct(pathBonus(s, 'crit'))}`);
  if (hasAffinity(s)) parts.push('hợp linh căn ×1.25');
  return parts.join(' · ');
}

function TechniquePanel({ state: s, act }: TabProps) {
  return (
    <section className="card">
      <h2>Công Pháp</h2>
      <p className="muted small">Dùng tàn quyển (rơi từ Bí Cảnh, bế quan) và linh thạch để tu luyện công pháp.</p>
      <TechRow s={s} kind="base" act={act} />
      {s.path ? (
        <TechRow s={s} kind="path" act={act} />
      ) : s.level >= PATH_UNLOCK_LEVEL ? (
        <PathChooser s={s} act={act} />
      ) : (
        <p className="notice">Đạt {levelName(PATH_UNLOCK_LEVEL)} để chọn hướng tu: Kiếm Tu, Thể Tu hoặc Pháp Tu.</p>
      )}
    </section>
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
                {p.technique} · hệ {p.elements.join('/')}
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

function ItemLine({ it }: { it: Item }) {
  const st = itemStats(it);
  const parts: string[] = [];
  if (st.atk) parts.push(`Công +${formatNumber(st.atk)}`);
  if (st.def) parts.push(`Thủ +${formatNumber(st.def)}`);
  if (st.hp) parts.push(`Khí huyết +${formatNumber(st.hp)}`);
  if (st.cultivation) parts.push(`Tu luyện +${Math.round(st.cultivation * 100)}%`);
  return (
    <div>
      <div className={`tier-${it.tier}`}>
        <b>{itemName(it)}</b> <span className="small">{TIERS[it.tier].name}</span>
      </div>
      <div className="small muted">
        {parts.join(' · ')} · tầng {it.floor}
      </div>
    </div>
  );
}

function GearPanel({ state: s }: TabProps) {
  return (
    <section className="card">
      <h2>Pháp Bảo Đang Dùng</h2>
      {SLOTS.map((slot) => {
        const it = s.gear[slot];
        return (
          <div key={slot} className="item-row">
            <span className="slot-label muted small">{SLOT_NAMES[slot]}</span>
            {it ? (
              <>
                <ItemIcon slot={slot} tier={it.tier} />
                <ItemLine it={it} />
              </>
            ) : (
              <span className="muted small">Trống</span>
            )}
          </div>
        );
      })}
    </section>
  );
}

function BagPanel({ state: s, act }: TabProps) {
  const items = [...s.bag].sort((a, b) => a.slot.localeCompare(b.slot) || itemScore(b) - itemScore(a));
  const worse = s.bag.filter((it) => isWorse(s, it)).length;
  return (
    <section className="card">
      <div className="row spread">
        <h2>
          Túi Đồ{' '}
          <span className="muted small">
            {s.bag.length}/{BAG_LIMIT}
          </span>
        </h2>
        <button disabled={worse === 0} onClick={() => act(sellWorse)}>
          Bán {worse} món kém hơn
        </button>
      </div>
      <AutoToggle s={s} act={act} k="equip" label="Tự dùng pháp bảo tốt hơn khi nhặt được" />
      <AutoToggle s={s} act={act} k="sell" label="Tự bán pháp bảo kém hơn khi nhặt được" />
      {items.length === 0 && <p className="muted small">Túi trống. Vượt Bí Cảnh hoặc lịch luyện để nhặt pháp bảo.</p>}
      {s.bag.length >= BAG_LIMIT && <p className="notice">Túi đã đầy, pháp bảo nhặt thêm sẽ tự động bán.</p>}
      {items.map((it) => {
        const eq = s.gear[it.slot];
        const better = !eq || itemScore(it) > itemScore(eq);
        return (
          <div key={it.id} className="item-row">
            <span className="slot-label muted small">
              {SLOT_NAMES[it.slot]}
              {better && <span className="up"> ▲</span>}
            </span>
            <ItemIcon slot={it.slot} tier={it.tier} />
            <ItemLine it={it} />
            <div className="item-actions">
              <button onClick={() => act((st, now, rng) => equipItem(st, it.id, now, rng))}>Dùng</button>
              <button onClick={() => act((st, now, rng) => sellItem(st, it.id, now, rng))}>
                Bán {formatNumber(itemSellPrice(it))}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function SettingsPanel({ state: s, replace }: TabProps) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <section className="card">
      <h2>Thiết Lập</h2>
      <p className="muted small">Tự động lưu mỗi 5 giây. Dùng mã lưu để chuyển sang máy hoặc trình duyệt khác.</p>
      <textarea
        id="save-code"
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
        {confirmReset ? (
          <>
            <button className="danger" onClick={() => replace(null)}>
              Xác nhận xóa toàn bộ
            </button>
            <button onClick={() => setConfirmReset(false)}>Hủy</button>
          </>
        ) : (
          <button className="danger" onClick={() => setConfirmReset(true)}>
            Xóa dữ liệu
          </button>
        )}
      </div>
      {msg && <p className="small muted">{msg}</p>}
    </section>
  );
}

function StatsSummary({ state: s }: TabProps) {
  const st = s.stats;
  const days = (s.lastTick - s.createdAt) / 86_400_000;
  const rows: [string, string][] = [
    ['Tu hành', days >= 1 ? `${Math.floor(days)} ngày` : `${Math.max(1, Math.round(days * 24))} giờ`],
    ['Tầng bí cảnh', `${s.floor}`],
    ['Trận thắng / thua', `${st.battlesWon} / ${st.battlesLost}`],
    ['Đột phá thành / bại', `${st.breakthroughs} / ${st.breakthroughFails}`],
    ['Lần bế quan', `${st.seclusions}`],
    ['Pháp bảo nhặt được', `${st.itemsFound}`],
  ];
  return (
    <section className="card">
      <h2>Thống Kê</h2>
      <dl className="stat-grid two">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
