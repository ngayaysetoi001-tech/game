import { PATHS, ZONES, type PathId, type PillId, SLOTS } from '../../engine/data';
import { NATAL_IDS } from '../../engine/natal';
import { PLAYER_SKILLS, SKILLS, SUB_TECHS, MAIN_TECHS, type SkillId } from '../../engine/engine';
import { SkillIcon, TechIcon } from './SkillIcons';
import Cultivator from './Cultivator';
import { ItemIcon, PillIcon } from './Icons';
import NatalIcon from './NatalIcon';
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
          {SLOTS.flatMap((slot) => [0, 1, 2, 3, 4].map((t) => <ItemIcon key={`${slot}${t}`} slot={slot} tier={t} />))}
          {(['tuKhi', 'phaCanh', 'hoiXuan'] as PillId[]).map((id) => (
            <PillIcon key={id} id={id} />
          ))}
        </div>
      </section>
      <section className="card">
        <h2>Bản mệnh pháp bảo</h2>
        <div className="row">
          {NATAL_IDS.flatMap((id) =>
            [0, 1, 2, 3].map((st) => (
              <span key={`${id}${st}`} className="natal-thumb">
                <NatalIcon id={id} stage={st} />
              </span>
            )),
          )}
        </div>
      </section>
      <section className="card">
        <h2>Võ kỹ người chơi</h2>
        <div className="icon-grid">
          {PLAYER_SKILLS.map((d, i) => (
            <figure key={d.id}>
              <SkillIcon id={d.id} level={i + 1} order={i < 3 ? i + 1 : undefined} size={48} />
              <figcaption>{d.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>Chiêu của quái và bản mệnh</h2>
        <div className="icon-grid">
          {(Object.keys(SKILLS) as SkillId[])
            .filter((id) => SKILLS[id].source.kind === 'monster' || SKILLS[id].source.kind === 'natal')
            .map((id) => (
              <figure key={id}>
                <SkillIcon id={id} size={48} />
                <figcaption>{SKILLS[id].name}</figcaption>
              </figure>
            ))}
        </div>
      </section>
      <section className="card">
        <h2>Công pháp</h2>
        <div className="icon-grid">
          {[...MAIN_TECHS, ...SUB_TECHS].map((d) => (
            <figure key={d.id}>
              <TechIcon id={d.id} grade={d.grade} level={d.grade + 3} size={48} />
              <figcaption>{d.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
