import { PATHS, ZONES, type PathId, type PillId, SLOTS } from '../../engine/data';
import Cultivator from './Cultivator';
import { ItemIcon, PillIcon } from './Icons';
import Landscape from './Landscape';
import Monster from './Monster';
import { CAVE_THEME, HOME_THEME, REALM_AURA, ZONE_THEMES } from './palette';

const DARK = new Set(['ghost', 'void', 'cave']);

/** Xem toàn bộ hình vẽ một lượt: mở trang với #gallery */
export default function Gallery() {
  const paths: (PathId | null)[] = [null, ...(Object.keys(PATHS) as PathId[])];
  return (
    <>
      <section className="card">
        <h2>Nhân vật</h2>
        <div className="gallery">
          {paths.flatMap((p, i) =>
            (['sit', 'stand'] as const).map((pose) => (
              <figure key={`${p}-${pose}`}>
                <Landscape theme={pose === 'sit' ? HOME_THEME : CAVE_THEME} seed={3} />
                <Cultivator pose={pose} path={p} aura={REALM_AURA[i * 2]} power={i / 3} />
                <figcaption>
                  {p ? PATHS[p].name : 'Chưa chọn'} · {pose === 'sit' ? 'tu luyện' : 'chiến đấu'}
                </figcaption>
              </figure>
            )),
          )}
        </div>
      </section>
      {ZONES.map((z, zi) => (
        <section className="card" key={z.name}>
          <h2>{z.name}</h2>
          <div className="gallery">
            {[...z.enemies, z.boss].map((name, i) => (
              <figure key={name}>
                <Landscape theme={ZONE_THEMES[zi]} seed={zi + 1} />
                <Monster name={name} boss={i === 4} darkBackdrop={DARK.has(ZONE_THEMES[zi].feature)} />
                <figcaption>{name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <section className="card">
        <h2>Pháp bảo & đan dược</h2>
        <div className="row">
          {SLOTS.flatMap((slot) => [0, 1, 2, 3].map((t) => <ItemIcon key={`${slot}${t}`} slot={slot} tier={t} />))}
          {(['tuKhi', 'phaCanh', 'hoiXuan'] as PillId[]).map((id) => (
            <PillIcon key={id} id={id} />
          ))}
        </div>
      </section>
    </>
  );
}
