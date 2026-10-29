import type { ReactNode } from 'react';
import { PILLS, type PillFamily, type PillId, type Slot } from '../../engine/data';
import { INK, TIER_COLORS } from './palette';
import { Art } from './registry';

function Frame({ color, glow, children }: { color: string; glow: boolean; children: ReactNode }) {
  return (
    <svg className={`art-icon ${glow ? 'glow' : ''}`} viewBox="0 0 40 40" aria-hidden="true" style={{ color }}>
      <rect x={1} y={1} width={38} height={38} rx={8} fill={INK.dark} stroke={color} strokeOpacity={0.6} />
      <rect x={1} y={1} width={38} height={38} rx={8} fill={color} opacity={0.1} />
      {children}
    </svg>
  );
}

export function ItemIcon({ slot, tier }: { slot: Slot; tier: number }) {
  const c = TIER_COLORS[tier];
  return (
    <Art k={`items/${slot}-${tier}`} alt="" className="art-icon">
      <Frame color={c} glow={tier >= 2}>
        {slot === 'weapon' && (
          <g>
            <path d="M10,30 L29,9 L32,8 L31,11 L12,32 Z" fill="#e6ecf0" />
            <path d="M10,30 L29,9" stroke={c} strokeWidth={1} />
            <path d="M8,26 L14,32" stroke={c} strokeWidth={2.4} strokeLinecap="round" />
            <path d="M10,30 L6,34" stroke={INK.mid} strokeWidth={2.6} strokeLinecap="round" />
          </g>
        )}
        {slot === 'armor' && (
          <g>
            <path d="M13,9 L20,12 L27,9 L33,14 L29,19 L28,32 L12,32 L11,19 L7,14 Z" fill={c} opacity={0.85} />
            <path d="M17,11 L20,18 L23,11" fill="none" stroke={INK.dark} strokeWidth={1.2} />
            <path d="M12,24 L28,24" stroke={INK.dark} strokeWidth={1.4} />
          </g>
        )}
        {slot === 'ring' && (
          <g>
            <circle cx={20} cy={24} r={8} fill="none" stroke={c} strokeWidth={3} />
            <path d="M16,15 L20,9 L24,15 L20,19 Z" fill="#fff" opacity={0.92} />
            <path d="M16,15 L20,19 L24,15" fill="none" stroke={c} strokeWidth={1} />
          </g>
        )}
        {slot === 'boots' && (
          <g>
            <path d="M14,9 L23,9 L23,21 L31,25 Q34,27 32,31 L11,31 L11,24 Z" fill={c} opacity={0.88} />
            <path d="M11,28 L32,28" stroke={INK.dark} strokeWidth={1.4} />
            <path d="M14,13 L23,13" stroke={INK.dark} strokeWidth={1} />
          </g>
        )}
        {slot === 'pendant' && (
          <g>
            <path d="M20,4 L20,10" stroke={c} strokeWidth={1} />
            <circle cx={20} cy={19} r={9} fill={c} opacity={0.9} />
            <circle cx={20} cy={19} r={3.2} fill={INK.dark} />
            <path d="M20,28 L18,36 M20,28 L22,36 M20,28 L20,37" stroke="#b8382c" strokeWidth={1} />
          </g>
        )}
      </Frame>
    </Art>
  );
}

const PILL_COLORS: Record<PillFamily, string> = {
  tuKhi: '#7fcf8a',
  phaCanh: '#f0c35a',
  hoiXuan: '#f08aa8',
};

/** Đan dược: màu theo loại, số chấm ở đáy = phẩm (Hạ không chấm, Trung 1 chấm, Thượng 2 chấm) */
export function PillIcon({ id }: { id: PillId }) {
  const def = PILLS[id];
  const c = PILL_COLORS[def.family];
  return (
    <Art k={`pills/${id}`} alt="" className="art-icon">
      <Frame color={c} glow={def.family === 'phaCanh' || def.grade >= 1}>
        <circle cx={20} cy={20} r={10} fill={c} />
        <circle cx={20} cy={20} r={10} fill="none" stroke={INK.dark} strokeOpacity={0.4} strokeDasharray="2 3" />
        <ellipse cx={16.5} cy={16} rx={3.5} ry={2.2} fill="#fff" opacity={0.7} />
        {Array.from({ length: def.grade }, (_, i) => (
          <circle key={i} cx={20 - (def.grade - 1) * 3 + i * 6} cy={34} r={1.8} fill={c} />
        ))}
      </Frame>
    </Art>
  );
}
