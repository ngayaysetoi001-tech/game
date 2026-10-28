import { useState } from 'react';
import {
  canBreakthrough,
  canChoosePath,
  canForgeNatal,
  readyPlots,
  claimableQuests,
  isInjured,
  itemScore,
  levelName,
  rootName,
  formatDuration,
  formatNumber,
  type GameState,
  type TabId,
} from '../engine/engine';
import type { Action } from './App';
import { Elements } from './Elements';
import CultivateTab from './tabs/CultivateTab';
import DungeonTab from './tabs/DungeonTab';
import CharacterTab from './tabs/CharacterTab';
import ShopTab from './tabs/ShopTab';
import DwellingTab from './tabs/DwellingTab';
import Toasts from './Toasts';

export type Tab = TabId;

export interface TabProps {
  state: GameState;
  act: (fn: Action) => void;
  replace: (s: GameState | null) => void;
  goTo: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'cultivate', label: 'Tu Luyện' },
  { id: 'dungeon', label: 'Bí Cảnh' },
  { id: 'dwelling', label: 'Động Phủ' },
  { id: 'character', label: 'Nhân Vật' },
  { id: 'shop', label: 'Phường Thị' },
];

/** Có pháp bảo trong túi mạnh hơn đồ đang dùng (hoặc ô đang trống) */
function hasUpgrade(s: GameState): boolean {
  return s.bag.some((it) => {
    const eq = s.gear[it.slot];
    return !eq || itemScore(it) > itemScore(eq);
  });
}

export default function GameScreen({ state: s, act, replace }: Omit<TabProps, 'goTo'>) {
  const [tab, setTab] = useState<Tab>('cultivate');
  const now = s.lastTick;
  const badges: Record<Tab, boolean> = {
    cultivate: canBreakthrough(s) || claimableQuests(s).length > 0,
    dungeon: false,
    dwelling: !s.auto.garden && readyPlots(s, now) > 0,
    character: canChoosePath(s) || canForgeNatal(s) || hasUpgrade(s),
    shop: false,
  };
  const props: TabProps = { state: s, act, replace, goTo: setTab };

  return (
    <>
      <header className="card header">
        <div className="header-top">
          <div>
            <div className="name">{s.name}</div>
            <div className="realm">{levelName(s.level)}</div>
          </div>
          <div className="root">
            <div className="small muted">{rootName(s.root)}</div>
            <Elements elements={s.root.elements} />
          </div>
        </div>
        <div className="resources">
          <span>
            Linh thạch <b>{formatNumber(s.stones)}</b>
          </span>
          <span>
            Tàn quyển <b>{s.fragments}</b>
          </span>
          {s.seclusion && <span className="tag good">Bế quan</span>}
          {s.farming && <span className="tag good">Lịch luyện tầng {s.farming.floor}</span>}
          {isInjured(s, now) && (
            <span className="tag bad">Thương thế {formatDuration((s.injuryUntil - now) / 1000)}</span>
          )}
        </div>
      </header>

      <Toasts s={s} />
      {tab === 'cultivate' && <CultivateTab {...props} />}
      {tab === 'dungeon' && <DungeonTab {...props} />}
      {tab === 'dwelling' && <DwellingTab {...props} />}
      {tab === 'character' && <CharacterTab {...props} />}
      {tab === 'shop' && <ShopTab {...props} />}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => {
              setTab(t.id);
              window.scrollTo({ top: 0 });
            }}
          >
            {t.label}
            {badges[t.id] && <span className="dot" aria-label="có việc cần làm" />}
          </button>
        ))}
      </nav>
    </>
  );
}
