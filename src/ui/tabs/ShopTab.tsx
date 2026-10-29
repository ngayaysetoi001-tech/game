import { PILLS, PILL_IDS, PILL_GRADE_NAMES } from '../../engine/data';
import {
  PLAYER_SKILLS,
  buyPill,
  buySkill,
  canLearnFromShop,
  canUsePill,
  describeSkill,
  formatNumber,
  pillPrice,
  realmOf,
  usePill,
} from '../../engine/engine';
import { REALMS } from '../../engine/data';
import { GRADE_NAMES, TECHS, buyTech, canBuyTech, describeMods, hasTech, type TechDef } from '../../engine/engine';
import type { TabProps } from '../GameScreen';
import { PillIcon } from '../art/Icons';
import { SkillIcon, TechIcon } from '../art/SkillIcons';
import AutoToggle from '../AutoToggle';

export default function ShopTab(props: TabProps) {
  return (
    <>
      <PillShop {...props} />
      <SkillShop {...props} />
      <TechShop {...props} />
    </>
  );
}

function SkillShop({ state: s, act }: TabProps) {
  const items = PLAYER_SKILLS.filter((d) => d.source.kind === 'shop');
  return (
    <section className="card">
      <h2>Tàng Kinh Các</h2>
      <p className="muted small">Bí tịch võ kỹ dùng chung cho mọi hướng tu.</p>
      {items.map((d) => {
        const src = d.source as { price: number; realm: number };
        const owned = !!s.skills[d.id];
        const lockedRealm = realmOf(s) < src.realm;
        return (
          <div key={d.id} className="shop-item">
            <SkillIcon id={d.id} dim={!owned && lockedRealm} />
            <div className="shop-text">
              <b>{d.name}</b>
              <div className="muted small">{describeSkill(d, 1)}</div>
              {lockedRealm && <div className="small">Cần đạt {REALMS[src.realm].name}</div>}
            </div>
            <div className="shop-actions">
              <button disabled={!canLearnFromShop(s, d.id)} onClick={() => act((st, now, rng) => buySkill(st, d.id, now, rng))}>
                {owned ? 'Đã học' : `Học ${formatNumber(src.price)}`}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function TechShop({ state: s, act }: TabProps) {
  const items = Object.values(TECHS).filter(
    (d: TechDef) => d.source.kind === 'shop' && (!d.path || d.path === s.path),
  );
  return (
    <section className="card">
      <h2>Công Pháp Bí Kíp</h2>
      <p className="muted small">
        Công pháp chính cùng hướng tu và công pháp phụ dùng chung. Học xong vào mục Công Pháp để mang theo và tu luyện.
      </p>
      {items.map((d) => {
        const src = d.source as { price: number; realm: number };
        const owned = hasTech(s, d.id);
        const lockedRealm = realmOf(s) < src.realm;
        return (
          <div key={d.id} className="shop-item">
            <TechIcon id={d.id} grade={d.grade} dim={!owned && lockedRealm} />
            <div className="shop-text">
              <b>{d.name}</b> <span className={`grade grade-${d.grade}`}>{GRADE_NAMES[d.grade]}</span>
              <div className="muted small">
                {d.kind === 'main' ? 'Công pháp chính · ' : 'Công pháp phụ · '}mỗi tầng: {describeMods(d.perLevel)}
              </div>
              {lockedRealm && <div className="small">Cần đạt {REALMS[src.realm].name}</div>}
            </div>
            <div className="shop-actions">
              <button disabled={!canBuyTech(s, d.id)} onClick={() => act((st, now, rng) => buyTech(st, d.id, now, rng))}>
                {owned ? 'Đã học' : `Học ${formatNumber(src.price)}`}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function PillShop({ state: s, act }: TabProps) {
  // Chỉ hiện đan có bán, hoặc đan đang có trong kho (đan phẩm cao chỉ luyện được ở Đan Phòng)
  const ids = PILL_IDS.filter((id) => PILLS[id].basePrice !== null || s.pills[id] > 0);
  return (
    <section className="card">
      <h2>Phường Thị</h2>
      <p className="muted small">
        Giá đan dược tăng theo cảnh giới. Đan Trung và Thượng Phẩm chỉ luyện được ở Đan Phòng (tab Động Phủ).
      </p>
      {ids.map((id) => {
        const price = pillPrice(s, id);
        const buyable = Number.isFinite(price);
        return (
          <div key={id} className="shop-item">
            <PillIcon id={id} />
            <div className="shop-text">
              <div>
                <b>{PILLS[id].name}</b>{' '}
                {PILLS[id].family !== 'hoiXuan' && (
                  <span className={`grade grade-${PILLS[id].grade}`}>{PILL_GRADE_NAMES[PILLS[id].grade]}</span>
                )}{' '}
                <span className="muted small">× {s.pills[id]}</span>
              </div>
              <div className="muted small">{PILLS[id].desc}</div>
            </div>
            <div className="shop-actions">
              {buyable && (
                <button
                  disabled={s.stones < price}
                  onClick={() => act((st, now, rng) => buyPill(st, id, now, rng))}
                >
                  Mua {formatNumber(price)}
                </button>
              )}
              {PILLS[id].family !== 'phaCanh' && (
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
      <AutoToggle s={s} act={act} k="heal" label="Tự dùng Hồi Xuân Đan khi bị thương">
        Hữu ích khi bật tự động khiêu chiến: không phải chờ hết thương mới tu luyện bình thường.
      </AutoToggle>
    </section>
  );
}
