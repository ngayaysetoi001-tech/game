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
import { NATALS, SKILLS, SUB_SLOTS, TECHS, natalSkillLevel, natalStage, skillSlotCount, techLevel } from '../../engine/engine';
import NatalIcon from '../art/NatalIcon';
import { SkillIcon, TechIcon } from '../art/SkillIcons';
import SkillsPanel from './SkillsPanel';
import NatalPanel from './NatalPanel';
import TechniquesPanel from './TechPanels';
import { BagPanel, GearPanel, SetPanel } from './GearPanels';

type Sub = 'overview' | 'technique' | 'skills' | 'gear' | 'treasure';

const SUBS: { id: Sub; label: string }[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'technique', label: 'Công Pháp' },
  { id: 'skills', label: 'Võ Kỹ' },
  { id: 'gear', label: 'Trang Bị' },
  { id: 'treasure', label: 'Pháp Bảo' },
];

// Giữ mục con đang xem khi chuyển tab qua lại
let lastSub: Sub = 'overview';

/** Mở tab Nhân Vật ở một mục con cụ thể (dùng cho nút "Đi tới" của nhiệm vụ và gợi ý) */
export function openCharacterSub(sub: Sub) {
  lastSub = sub;
}

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
          <LoadoutStrip s={props.state} onGo={setSub} />
          <StatsSummary {...props} />
          <SettingsPanel {...props} />
        </>
      )}
      {sub === 'technique' && <TechniquesPanel {...props} />}
      {sub === 'skills' && <SkillsPanel {...props} />}
      {sub === 'treasure' && <NatalPanel {...props} />}
      {sub === 'gear' && (
        <>
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
  // Hiệu ứng từ trang bị và bộ trang bị, chỉ hiện khi có
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
    ['Trang bị nhặt được', `${st.itemsFound}`],
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

/** Một lượt thấy công pháp, võ kỹ và bản mệnh đang dùng; chạm vào nhóm để mở mục tương ứng */
function LoadoutStrip({ s, onGo }: { s: TabProps['state']; onGo: (sub: Sub) => void }) {
  const slots = skillSlotCount(s);
  const main = s.mainTech ? TECHS[s.mainTech] : null;
  const subs = s.subTechs.map((id) => TECHS[id]);
  return (
    <section className="card">
      <h2>Đang Trang Bị</h2>
      <div className="loadout">
        <button className="loadout-group" onClick={() => onGo('technique')} aria-label="Mở mục Công Pháp">
          <span className="label">Công pháp</span>
          <span className="loadout-icons">
            <span className="slot">
              {main ? <TechIcon id={main.id} grade={main.grade} level={techLevel(s, main.id)} /> : <span className="slot-empty">chính</span>}
              <span className="slot-cap">{main ? main.name : 'Chưa chọn'}</span>
            </span>
            {Array.from({ length: SUB_SLOTS }, (_, i) => {
              const d = subs[i];
              return (
                <span className="slot" key={i}>
                  {d ? <TechIcon id={d.id} grade={d.grade} level={techLevel(s, d.id)} /> : <span className="slot-empty">phụ</span>}
                  <span className="slot-cap">{d ? d.name : 'Trống'}</span>
                </span>
              );
            })}
          </span>
        </button>
        <button className="loadout-group" onClick={() => onGo('skills')} aria-label="Mở mục Võ Kỹ">
          <span className="label">Võ kỹ</span>
          <span className="loadout-icons">
            {[0, 1, 2].map((i) => {
              const id = s.loadout[i];
              const open = i < slots;
              return (
                <span className="slot" key={i}>
                  {id && open ? (
                    <SkillIcon id={id} level={s.skills[id]} order={i + 1} />
                  ) : (
                    <span className="slot-empty">{open ? 'trống' : 'khóa'}</span>
                  )}
                  <span className="slot-cap">{id && open ? SKILLS[id].name : open ? 'Trống' : 'Chưa mở'}</span>
                </span>
              );
            })}
          </span>
        </button>
        <button className="loadout-group" onClick={() => onGo('treasure')} aria-label="Mở mục Pháp Bảo">
          <span className="label">Pháp bảo</span>
          <span className="loadout-icons">
            {s.natal ? (
              <>
                <span className="slot">
                  <span className="natal-thumb">
                    <NatalIcon id={s.natal.id} stage={natalStage(s.natal.level)} />
                  </span>
                  <span className="slot-cap">{NATALS[s.natal.id].name}</span>
                </span>
                <span className="slot">
                  <SkillIcon id={NATALS[s.natal.id].skillId} level={natalSkillLevel(s.natal.level, s.natal.refine ?? 0)} />
                  <span className="slot-cap">{SKILLS[NATALS[s.natal.id].skillId].name}</span>
                </span>
              </>
            ) : (
              <span className="slot">
                <span className="slot-empty">chưa</span>
                <span className="slot-cap">Chưa luyện</span>
              </span>
            )}
          </span>
        </button>
      </div>
    </section>
  );
}
