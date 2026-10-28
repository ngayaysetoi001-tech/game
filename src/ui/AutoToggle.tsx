import type { ReactNode } from 'react';
import type { AutoSettings } from '../engine/engine';
import { setAuto } from '../engine/engine';
import type { TabProps } from './GameScreen';

/** Công tắc bật/tắt một tính năng tự động, đặt ngay cạnh phần nó điều khiển */
export default function AutoToggle({
  s,
  act,
  k,
  label,
  children,
}: Pick<TabProps, 'act'> & { s: TabProps['state']; k: keyof AutoSettings; label: string; children?: ReactNode }) {
  const id = `auto-${k}`;
  const on = s.auto[k];
  return (
    <div className="auto-toggle">
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={on}
          onChange={(e) => {
            const v = e.target.checked;
            act((st, now, rng) => setAuto(st, k, v, now, rng));
          }}
        />
        <span className="switch" aria-hidden="true" />
        <span>{label}</span>
      </label>
      {children && <div className="small muted">{children}</div>}
    </div>
  );
}
