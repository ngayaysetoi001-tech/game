import type { Element } from '../engine/data';

const COLORS: Record<Element, string> = {
  Kim: '#e8c55a',
  Mộc: '#5fbf6a',
  Thủy: '#4fa3e0',
  Hỏa: '#e5654b',
  Thổ: '#b58552',
  Lôi: '#b58cff',
  Phong: '#7fe0c8',
  Băng: '#a8e4ff',
};

export function Elements({ elements }: { elements: Element[] }) {
  return (
    <span className="elements">
      {elements.map((e) => (
        <span key={e} className="element" style={{ borderColor: COLORS[e], color: COLORS[e] }}>
          {e}
        </span>
      ))}
    </span>
  );
}
