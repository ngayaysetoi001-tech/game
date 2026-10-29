import { useState } from 'react';
import { PILLS, PILL_IDS, REALMS, pillLabel } from '../../engine/data';
import {
  BUILDINGS,
  BUILDING_IDS,
  HERBS,
  HERB_IDS,
  MAX_BUILDING_LEVEL,
  MAX_PLOTS,
  RECIPES,
  RECIPE_IDS,
  buildingLevel,
  buildingLevelCap,
  buildingNextCost,
  buildingUnlocked,
  canPlant,
  canStartJob,
  canUpgradeBuilding,
  craftTimeMultAt,
  cultivationBonusAt,
  dwellingMods,
  formatDuration,
  formatNumber,
  gradeChancesAt,
  growMs,
  growthMultAt,
  harvestAll,
  harvestPlot,
  herbCount,
  jobSeconds,
  maxBatch,
  maxBatchAt,
  maxCraftable,
  plantAll,
  plantHerb,
  plantableHerbs,
  plotCount,
  plotCountAt,
  readyPlots,
  recipeNeeds,
  seedCost,
  sellHerb,
  sellPrice,
  startJob,
  stoneBonusAt,
  upgradeBuilding,
  yieldBonusAt,
  type BuildingId,
  type GameState,
  type HerbId,
  type RecipeId,
} from '../../engine/engine';
import type { TabProps } from '../GameScreen';
import AutoToggle from '../AutoToggle';
import { BuildingIcon, HerbPlant } from '../art/DwellingIcons';
import { PillIcon } from '../art/Icons';
import Landscape from '../art/Landscape';
import { HOME_THEME } from '../art/palette';

const pct = (v: number) => `${Math.round(v * 100)}%`;

function effectText(id: BuildingId, lv: number): string {
  if (lv <= 0) return 'Chưa xây.';
  switch (id) {
    case 'linh_dien':
      return `${plotCountAt(lv)} ô trồng · cây chín nhanh hơn ${pct(1 - growthMultAt(lv))} · ${pct(yieldBonusAt(lv))} xác suất thêm 1 thảo dược`;
    case 'dan_phong': {
      const g = gradeChancesAt(lv);
      return `Tối đa ${maxBatchAt(lv)} viên mỗi lần · luyện nhanh hơn ${pct(1 - craftTimeMultAt(lv))} · đan Trung ${pct(g.mid)}, Thượng ${pct(g.top)}`;
    }
    case 'tu_linh':
      return `Tốc độ tu luyện +${pct(cultivationBonusAt(lv))}`;
    case 'linh_mach':
      return `Linh thạch kiếm được +${pct(stoneBonusAt(lv))}`;
  }
}

export default function DwellingTab(props: TabProps) {
  return (
    <>
      <Banner s={props.state} />
      <BuildingsPanel {...props} />
      <GardenPanel {...props} />
      <AlchemyPanel {...props} />
      <StockPanel {...props} />
    </>
  );
}

function Banner({ s }: { s: GameState }) {
  const m = dwellingMods(s);
  return (
    <div className="scene dwelling-banner">
      <Landscape theme={HOME_THEME} seed={9} />
      <div className="banner-text">
        <h2>Động Phủ của {s.name}</h2>
        <div className="reward-chips">
          <span className="reward-chip">Tu luyện +{pct(m.cultivation)}</span>
          <span className="reward-chip">Linh thạch +{pct(m.stones)}</span>
        </div>
      </div>
    </div>
  );
}

function BuildingsPanel({ state: s, act }: TabProps) {
  const cap = buildingLevelCap(s);
  return (
    <section className="card">
      <h2>Công Trình</h2>
      <p className="muted small">
        Cấp công trình tối đa theo cảnh giới (hiện tại {cap}/{MAX_BUILDING_LEVEL}).
      </p>
      {BUILDING_IDS.map((id) => {
        const def = BUILDINGS[id];
        const lv = buildingLevel(s, id);
        const unlocked = buildingUnlocked(s, id);
        const maxed = lv >= MAX_BUILDING_LEVEL;
        const capped = !maxed && lv >= cap;
        return (
          <div key={id} className="shop-item building">
            <BuildingIcon id={id} level={lv} />
            <div className="shop-text">
              <b>{def.name}</b> <span className="muted small">cấp {lv}/{MAX_BUILDING_LEVEL}</span>
              <div className="small muted">{def.desc}</div>
              <div className="small">{effectText(id, lv)}</div>
            </div>
            <div className="shop-actions">
              {!unlocked ? (
                <button disabled>Cần {REALMS[def.unlockRealm].name}</button>
              ) : maxed ? (
                <button disabled>Tối đa</button>
              ) : capped ? (
                <button disabled>Cần cảnh giới cao hơn</button>
              ) : (
                <button disabled={!canUpgradeBuilding(s, id)} onClick={() => act((st, now, rng) => upgradeBuilding(st, id, now, rng))}>
                  {lv === 0 ? 'Xây' : `Cấp ${lv + 1}`} · {formatNumber(buildingNextCost(s, id))}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function GardenPanel({ state: s, act }: TabProps) {
  const [pick, setPick] = useState<HerbId | null>(null);
  const plantable = plantableHerbs(s);
  const herb = pick && plantable.includes(pick) ? pick : plantable[0];
  const now = s.lastTick;
  const plots = plotCount(s);
  const ripe = readyPlots(s, now);
  const free = Array.from({ length: plots }, (_, i) => i).filter((i) => !s.dwelling.plots[i]).length;

  return (
    <section className="card">
      <h2>Linh Điền</h2>
      <AutoToggle s={s} act={act} k="garden" label="Tự thu hoạch và gieo lại">
        Cây chín thì tự thu hoạch và gieo lại cùng loại (cần đủ linh thạch mua hạt), kể cả khi offline.
      </AutoToggle>

      <div className="herb-pick">
        {plantable.map((id) => (
          <button key={id} className={`herb-opt ${herb === id ? 'picked' : ''}`} onClick={() => setPick(id)}>
            <HerbPlant id={id} stage={2} size={44} />
            <span className="herb-info">
              <b>{HERBS[id].name}</b>
              <span className="small muted">{HERBS[id].rare ? 'Hiếm' : 'Phổ thông'}</span>
              <span className="small muted">
                Hạt {formatNumber(seedCost(id))} · chín {formatDuration(growMs(s, id) / 1000)}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="row">
        <button disabled={free === 0 || s.stones < seedCost(herb)} onClick={() => act((st, n, rng) => plantAll(st, herb, n, rng))}>
          Gieo {HERBS[herb].name} vào {free} ô trống
        </button>
        <button className="primary" disabled={ripe === 0} onClick={() => act(harvestAll)}>
          Thu hoạch tất cả ({ripe})
        </button>
      </div>

      <div className="plots">
        {Array.from({ length: MAX_PLOTS }, (_, i) => {
          const plot = s.dwelling.plots[i];
          if (i >= plots) {
            return (
              <div key={i} className="plot locked">
                <span className="small muted">Nâng Linh Điền để mở</span>
              </div>
            );
          }
          if (!plot) {
            return (
              <div key={i} className="plot empty">
                <button disabled={!canPlant(s, i, herb)} onClick={() => act((st, n, rng) => plantHerb(st, i, herb, n, rng))}>
                  Gieo
                </button>
              </div>
            );
          }
          const p = Math.min(1, (now - plot.start) / (plot.end - plot.start));
          const ready = now >= plot.end;
          const stage = ready ? 2 : p < 0.34 ? 0 : 1;
          return (
            <div key={i} className={`plot ${ready ? 'ready' : 'growing'}`}>
              <HerbPlant id={plot.herb} stage={stage} size={56} />
              <div className="small">{HERBS[plot.herb].name}</div>
              {ready ? (
                <button className="primary" onClick={() => act((st, n, rng) => harvestPlot(st, i, n, rng))}>
                  Thu hoạch
                </button>
              ) : (
                <>
                  <div className="bar thin">
                    <div className="bar-fill" style={{ width: `${p * 100}%` }} />
                  </div>
                  <div className="small muted">{formatDuration((plot.end - now) / 1000)}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AlchemyPanel({ state: s, act }: TabProps) {
  const [counts, setCounts] = useState<Partial<Record<RecipeId, number>>>({});
  const lv = buildingLevel(s, 'dan_phong');
  const job = s.dwelling.job;
  const now = s.lastTick;

  if (lv === 0) {
    return (
      <section className="card">
        <h2>Đan Phòng</h2>
        <p className="notice">Xây Đan Phòng ở mục Công Trình để luyện đan từ thảo dược.</p>
      </section>
    );
  }

  if (job) {
    const p = Math.min(1, (now - job.start) / (job.end - job.start));
    return (
      <section className="card">
        <h2>Đan Phòng</h2>
        <p>
          Đang luyện <b>{job.count}</b> viên <b>{RECIPES[job.recipe].name}</b>. Đan ra lò sẽ tự vào kho, kể cả khi bạn
          vắng mặt.
        </p>
        <div className="bar thin">
          <div className="bar-fill seclusion" style={{ width: `${p * 100}%` }} />
        </div>
        <div className="small muted">Còn {formatDuration((job.end - now) / 1000)}</div>
      </section>
    );
  }

  const g = gradeChancesAt(lv);
  return (
    <section className="card">
      <h2>Đan Phòng</h2>
      <p className="muted small">
        Mỗi lần luyện tối đa {maxBatch(s)} viên. Phẩm đan ngẫu nhiên: Trung {pct(g.mid)}, Thượng {pct(g.top)}, còn lại Hạ Phẩm. Công thức dùng thảo dược
        của cảnh giới hiện tại.
      </p>
      {RECIPE_IDS.map((id) => {
        const r = RECIPES[id];
        const need = recipeNeeds(s, id);
        const max = maxCraftable(s, id);
        const n = Math.max(1, Math.min(counts[id] ?? 1, Math.max(1, max)));
        return (
          <div key={id} className="recipe">
            <PillIcon id={r.pills[0]} />
            <div className="recipe-main">
              <b>{r.name}</b>
              <div className="small muted">
                Mỗi viên: {need.nCommon}× {HERBS[need.common].name} (có {herbCount(s, need.common)})
                {need.nRare > 0 && (
                  <>
                    {' '}
                    + {need.nRare}× {HERBS[need.rare].name} (có {herbCount(s, need.rare)})
                  </>
                )}
              </div>
              <div className="small muted">{formatDuration(jobSeconds(s, id, 1))} mỗi viên</div>
              <div className="row stepper">
                <button className="small-btn" disabled={n <= 1} onClick={() => setCounts({ ...counts, [id]: n - 1 })}>
                  −
                </button>
                <b>{n}</b>
                <button className="small-btn" disabled={n >= max} onClick={() => setCounts({ ...counts, [id]: n + 1 })}>
                  +
                </button>
                <button
                  className="primary"
                  disabled={!canStartJob(s, id, n)}
                  onClick={() => act((st, nw, rng) => startJob(st, id, n, nw, rng))}
                >
                  {max === 0 ? 'Thiếu thảo dược' : `Luyện ${n} viên · ${formatDuration(jobSeconds(s, id, n))}`}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function StockPanel({ state: s, act }: TabProps) {
  const herbs = HERB_IDS.filter((id) => herbCount(s, id) > 0);
  const pills = PILL_IDS.filter((id) => s.pills[id] > 0);
  return (
    <section className="card">
      <h2>Kho</h2>
      <h3 className="stock-h">Thảo dược</h3>
      {herbs.length === 0 && <p className="muted small">Chưa có thảo dược. Gieo hạt ở Linh Điền.</p>}
      {herbs.map((id) => {
        const n = herbCount(s, id);
        return (
          <div key={id} className="stock-row">
            <HerbPlant id={id} stage={2} size={40} />
            <div className="stock-main">
              <b>{HERBS[id].name}</b> <span className="muted small">× {n}</span>
            </div>
            <div className="item-actions">
              <button onClick={() => act((st, now, rng) => sellHerb(st, id, 1, now, rng))}>Bán 1 · +{sellPrice(id)}</button>
              <button onClick={() => act((st, now, rng) => sellHerb(st, id, n, now, rng))}>Bán hết · +{formatNumber(n * sellPrice(id))}</button>
            </div>
          </div>
        );
      })}
      <h3 className="stock-h">Đan dược</h3>
      {pills.length === 0 && <p className="muted small">Chưa có đan dược. Luyện ở Đan Phòng hoặc mua ở Phường Thị.</p>}
      {pills.map((id) => (
        <div key={id} className="stock-row">
          <PillIcon id={id} />
          <div className="stock-main">
            <b>{PILLS[id].name}</b>
            {PILLS[id].family !== 'hoiXuan' && <span className={`grade grade-${PILLS[id].grade}`}>{pillLabel(id).split(' · ')[1]}</span>}{' '}
            <span className="muted small">× {s.pills[id]}</span>
          </div>
        </div>
      ))}
      <p className="muted small">Dùng Tụ Khí Đan và Hồi Xuân Đan ở Phường Thị. Phá Cảnh Đan tự dùng khi đột phá.</p>
    </section>
  );
}
