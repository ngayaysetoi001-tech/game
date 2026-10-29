import { useState } from 'react';
import { ROOT_REROLLS, ROOT_TIERS } from '../engine/data';
import { newGame, rollRoot, rootName, type GameState } from '../engine/engine';
import { Elements } from './Elements';

export default function CreateScreen({ onCreate }: { onCreate: (s: GameState) => void }) {
  const [name, setName] = useState('');
  const [root, setRoot] = useState(() => rollRoot(Math.random));
  const [rerolls, setRerolls] = useState(ROOT_REROLLS);
  const tier = ROOT_TIERS[root.tier];

  return (
    <section className="card create">
      <h1>Tu Tiên Nhàn Rỗi</h1>
      <p className="muted">Một niệm nhập đạo, vạn năm tiêu dao.</p>

      <label className="field">
        <span>Đạo hiệu</span>
        <input
          value={name}
          maxLength={20}
          placeholder="Vô Danh"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className="root-box">
        <div className="muted">Linh căn trời ban</div>
        <div className="root-name">{rootName(root)}</div>
        <Elements elements={root.elements} />
        <div className="muted small">
          Tốc độ tu luyện ×{tier.rateMult}
          {tier.breakBonus > 0 && ` · Đột phá +${tier.breakBonus * 100}%`}
        </div>
      </div>

      <div className="row">
        <button
          disabled={rerolls <= 0}
          onClick={() => {
            setRoot(rollRoot(Math.random));
            setRerolls((r) => r - 1);
          }}
        >
          Nghịch thiên cải mệnh ({rerolls})
        </button>
        <button className="primary" onClick={() => onCreate(newGame(name, root, Date.now()))}>
          Bước vào tiên đồ
        </button>
      </div>
    </section>
  );
}
