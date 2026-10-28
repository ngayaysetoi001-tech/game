import { useState } from 'react';
import {
  applyOffline,
  combatPower,
  cultivationBonus,
  MOD_LABELS,
  charMods,
  formatMod,
  exportSave,
  formatNumber,
  importSave,
  levelInfo,
  playerStats,
} from '../../engine/engine';
import type { TabProps } from '../GameScreen';
import Cultivator from '../art/Cultivator';
import Landscape from '../art/Landscape';
import { HOME_THEME, REALM_AURA } from '../art/palette';
import { Art } from '../art/registry';
import SkillsPanel from './SkillsPanel';
import NatalPanel from './NatalPanel';
import TechniquesPanel from './TechPanels';
import { BagPanel, GearPanel, SetPanel } from './GearPanels';

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
      {sub === 'technique' && <TechniquesPanel {...props} />}
      {sub === 'skills' && <SkillsPanel {...props} />}
      {sub === 'gear' && (
        <>
          <NatalPanel {...props} />
          <GearPanel {...props} />
          <SetPanel {...props} />
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
  // Hiệu ứng từ pháp bảo và bộ trang bị, chỉ hiện khi có
  const m = charMods(s);
  for (const k of ['lifesteal', 'thorns', 'dodge', 'stunHit', 'burnHit', 'stones', 'seclusion', 'offline'] as const) {
    if (m[k] > 0) rows.push([MOD_LABELS[k], formatMod(k, m[k])]);
  }
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
