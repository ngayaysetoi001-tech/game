import { BAG_LIMIT, SLOTS, SLOT_NAMES, TIERS } from '../../engine/data';
import {
  ENHANCE_MAX,
  MOD_LABELS,
  SETS,
  canDevour,
  canEnhance,
  devourItem,
  itemDevourExp,
  describeMods,
  enhanceChance,
  enhanceCost,
  enhanceItem,
  equipItem,
  formatMod,
  formatNumber,
  isWorse,
  itemName,
  itemPlus,
  itemScore,
  itemSellPrice,
  itemSetIndex,
  itemStats,
  sellItem,
  sellWorse,
  setCounts,
  type GameState,
  type Item,
} from '../../engine/engine';
import type { TabProps } from '../GameScreen';
import AutoToggle from '../AutoToggle';
import { ItemIcon } from '../art/Icons';

const SET_SIZE = SLOTS.length;

export function ItemLine({ it, worn, better }: { it: Item; worn?: number[]; better?: boolean }) {
  const st = itemStats(it);
  const parts: string[] = [];
  if (st.atk) parts.push(`Công +${formatNumber(st.atk)}`);
  if (st.def) parts.push(`Thủ +${formatNumber(st.def)}`);
  if (st.hp) parts.push(`Khí huyết +${formatNumber(st.hp)}`);
  if (st.crit) parts.push(`Bạo kích +${(st.crit * 100).toFixed(1)}%`);
  if (st.spd) parts.push(`Tốc độ +${st.spd.toFixed(1)}`);
  if (st.cultivation) parts.push(`Tu luyện +${Math.round(st.cultivation * 100)}%`);
  const idx = itemSetIndex(it);
  const plus = itemPlus(it);
  return (
    <div className="item-line">
      <div className="small muted">
        {SLOT_NAMES[it.slot]}
        {better && <span className="up"> ▲ tốt hơn đồ đang dùng</span>}
      </div>
      <div className={`tier-${it.tier}`}>
        <b>
          {itemName(it)}
          {plus > 0 && <span className="plus"> +{plus}</span>}
        </b>{' '}
        <span className="small">{TIERS[it.tier].name}</span>
      </div>
      <div className="small muted">{parts.join(' · ')}</div>
      {(it.affixes ?? []).map((a) => (
        <div key={a.id} className="small affix">
          {MOD_LABELS[a.id]} {formatMod(a.id, a.v)}
        </div>
      ))}
      <div className="small muted">
        <span className="set-tag">
          Bộ {SETS[idx].name}
          {worn ? ` ${worn[idx]}/${SET_SIZE}` : ''}
        </span>{' '}
        · tầng {it.floor}
      </div>
    </div>
  );
}

function EnhanceButton({ s, it, act }: { s: GameState; it: Item; act: TabProps['act'] }) {
  const plus = itemPlus(it);
  if (plus >= ENHANCE_MAX) return <button disabled>Tối đa +{ENHANCE_MAX}</button>;
  return (
    <button disabled={!canEnhance(s, it)} onClick={() => act((st, now, rng) => enhanceItem(st, it.id, now, rng))}>
      Cường hóa +{plus + 1} · {Math.round(enhanceChance(it) * 100)}% · {formatNumber(enhanceCost(it))} LT
    </button>
  );
}

export function GearPanel({ state: s, act }: TabProps) {
  const worn = setCounts(s);
  return (
    <section className="card">
      <h2>Trang Bị Đang Dùng</h2>
      <p className="muted small">
        Cường hóa tối đa +{ENHANCE_MAX}: mỗi cấp +8% chỉ số gốc. Thất bại chỉ mất linh thạch, trang bị giữ nguyên cấp.
      </p>
      {SLOTS.map((slot) => {
        const it = s.gear[slot];
        return (
          <div key={slot} className="item-row">
            {it ? (
              <>
                <ItemIcon slot={slot} tier={it.tier} />
                <ItemLine it={it} worn={worn} />
                <div className="item-actions">
                  <EnhanceButton s={s} it={it} act={act} />
                </div>
              </>
            ) : (
              <span className="muted small item-empty">{SLOT_NAMES[slot]}: trống</span>
            )}
          </div>
        );
      })}
    </section>
  );
}

export function SetPanel({ state: s }: TabProps) {
  const counts = setCounts(s);
  const present = SETS.map((set, i) => ({ set, i, n: counts[i] })).filter((x) => x.n > 0);
  return (
    <section className="card">
      <h2>Bộ Trang Bị</h2>
      <p className="muted small">
        Trang bị rơi ở cùng một khu bí cảnh hợp thành một bộ. Mặc 2 món hoặc 4 món cùng bộ để nhận thêm thuộc tính. Lịch
        luyện đúng khu để gom đủ bộ.
      </p>
      {present.length === 0 && <p className="muted small">Chưa mặc trang bị nào.</p>}
      {present.map(({ set, i, n }) => (
        <div key={set.name} className="set-block">
          <div>
            <b>Bộ {set.name}</b> <span className="muted small">{n}/{SET_SIZE} món · tầng {i * 5 + 1}–{i * 5 + 5}</span>
          </div>
          <div className={`small ${n >= 2 ? 'set-on' : 'muted'}`}>2 món: {describeMods(set.two)}</div>
          <div className={`small ${n >= 4 ? 'set-on' : 'muted'}`}>4 món: {describeMods(set.four)}</div>
        </div>
      ))}
    </section>
  );
}

export function BagPanel({ state: s, act }: TabProps) {
  const items = [...s.bag].sort((a, b) => a.slot.localeCompare(b.slot) || itemScore(b) - itemScore(a));
  const worse = s.bag.filter((it) => isWorse(s, it)).length;
  const worn = setCounts(s);
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
      <AutoToggle s={s} act={act} k="equip" label="Tự dùng trang bị tốt hơn khi nhặt được" />
      <AutoToggle s={s} act={act} k="sell" label="Tự bán trang bị kém hơn khi nhặt được" />
      {items.length === 0 && <p className="muted small">Túi trống. Vượt Bí Cảnh hoặc lịch luyện để nhặt trang bị.</p>}
      {s.bag.length >= BAG_LIMIT && <p className="notice">Túi đã đầy, trang bị nhặt thêm sẽ tự động bán.</p>}
      {items.map((it) => {
        const eq = s.gear[it.slot];
        const better = !eq || itemScore(it) > itemScore(eq);
        return (
          <div key={it.id} className="item-row">
            <ItemIcon slot={it.slot} tier={it.tier} />
            <ItemLine it={it} worn={worn} better={better} />
            <div className="item-actions">
              <button onClick={() => act((st, now, rng) => equipItem(st, it.id, now, rng))}>Dùng</button>
              <button onClick={() => act((st, now, rng) => sellItem(st, it.id, now, rng))}>
                Bán {formatNumber(itemSellPrice(it))}
              </button>
              <EnhanceButton s={s} it={it} act={act} />
              {canDevour(s) && (
                <button onClick={() => act((st, now, rng) => devourItem(st, it.id, now, rng))}>
                  Luyện hóa +{formatNumber(itemDevourExp(it))}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
