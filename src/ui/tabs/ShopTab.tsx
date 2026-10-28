import { PILLS, type PillId } from '../../engine/data';
import { buyPill, canUsePill, formatNumber, pillPrice, usePill } from '../../engine/engine';
import type { TabProps } from '../GameScreen';

export default function ShopTab({ state: s, act }: TabProps) {
  const ids = Object.keys(PILLS) as PillId[];
  return (
    <section className="card">
      <h2>Phường Thị</h2>
      <p className="muted small">Giá đan dược tăng theo cảnh giới.</p>
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
