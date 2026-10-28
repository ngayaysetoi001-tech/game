import { PILLS, type PillId } from '../../engine/data';
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
import type { TabProps } from '../GameScreen';
import { PillIcon } from '../art/Icons';
import AutoToggle from '../AutoToggle';

export default function ShopTab(props: TabProps) {
  return (
    <>
      <PillShop {...props} />
      <SkillShop {...props} />
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

function PillShop({ state: s, act }: TabProps) {
  const ids = Object.keys(PILLS) as PillId[];
  return (
    <section className="card">
      <h2>Phường Thị</h2>
      <p className="muted small">Giá đan dược tăng theo cảnh giới.</p>
      {ids.map((id) => {
        const price = pillPrice(s, id);
        return (
          <div key={id} className="shop-item">
            <PillIcon id={id} />
            <div className="shop-text">
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
      <AutoToggle s={s} act={act} k="heal" label="Tự dùng Hồi Xuân Đan khi bị thương">
        Hữu ích khi bật tự động khiêu chiến: không phải chờ hết thương mới tu luyện bình thường.
      </AutoToggle>
    </section>
  );
}
