import type { ReactNode } from 'react';
import { HERBS, type BuildingId, type HerbId } from '../../engine/dwelling';
import { INK } from './palette';
import { Art } from './registry';

const COLORS: Record<BuildingId, string> = {
  linh_dien: '#7fcf8a',
  dan_phong: '#ff9a3d',
  tu_linh: '#ffd66b',
  linh_mach: '#6fb2ff',
};

/** Biểu tượng công trình động phủ, cùng kiểu khung với biểu tượng trang bị */
export function BuildingIcon({ id, level, size = 40 }: { id: BuildingId; level?: number; size?: number }) {
  const c = COLORS[id];
  return (
    <Art k={`buildings/${id}`} alt="" className="art-icon">
      <svg className="art-icon" style={{ color: c, width: size, height: size }} viewBox="0 0 40 40" aria-hidden="true">
        <rect x={1} y={1} width={38} height={38} rx={8} fill={INK.dark} stroke={c} strokeOpacity={0.7} />
        <rect x={1} y={1} width={38} height={38} rx={8} fill={c} opacity={0.12} />
        {id === 'linh_dien' && (
          <g>
            <ellipse cx={20} cy={31} rx={13} ry={4} fill="#6b4a2c" />
            {[11, 20, 29].map((x, i) => (
              <g key={x}>
                <path d={`M${x},31 L${x},${22 - i % 2 * 3}`} stroke={c} strokeWidth={2} strokeLinecap="round" />
                <path d={`M${x},${25 - i % 2 * 3} Q${x - 6},${21 - i % 2 * 3} ${x - 6},${16 - i % 2 * 3} Q${x},${19 - i % 2 * 3} ${x},${25 - i % 2 * 3} Z`} fill={c} />
                <path d={`M${x},${23 - i % 2 * 3} Q${x + 6},${19 - i % 2 * 3} ${x + 6},${14 - i % 2 * 3} Q${x},${17 - i % 2 * 3} ${x},${23 - i % 2 * 3} Z`} fill={c} opacity={0.85} />
              </g>
            ))}
          </g>
        )}
        {id === 'dan_phong' && (
          <g>
            <path d="M12,15 H28 L30,20 Q31,29 25,31 H15 Q9,29 10,20 Z" fill="#3a2f26" stroke={c} strokeWidth={1.6} />
            <path d="M10,15 H30" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
            <path d="M14,31 L13,35 M26,31 L27,35" stroke={c} strokeWidth={2} strokeLinecap="round" />
            <path d="M9,17 Q6,17 6,20 M31,17 Q34,17 34,20" fill="none" stroke={c} strokeWidth={1.6} />
            <path d="M20,6 Q23,10 20,13 Q17,10 20,6 Z" fill={c} />
            <path d="M15,8 Q17,10 15,12 M25,8 Q27,10 25,12" fill="none" stroke={c} strokeWidth={1.2} opacity={0.7} />
          </g>
        )}
        {id === 'tu_linh' && (
          <g>
            <circle cx={20} cy={20} r={13} fill="none" stroke={c} strokeWidth={1.8} />
            <path d="M20,8 L30.5,26 H9.5 Z M20,32 L9.5,14 H30.5 Z" fill="none" stroke={c} strokeWidth={1.6} />
            <circle cx={20} cy={20} r={3.4} fill="#fff" />
            <circle cx={20} cy={20} r={5.6} fill="none" stroke="#fff" strokeOpacity={0.5} />
          </g>
        )}
        {id === 'linh_mach' && (
          <g>
            <path d="M9,32 L13,17 L18,32 Z" fill={c} opacity={0.75} />
            <path d="M15,32 L21,8 L27,32 Z" fill={c} />
            <path d="M24,32 L28,15 L32,32 Z" fill={c} opacity={0.85} />
            <path d="M21,8 L18,22 L21,32" fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.6} />
            <path d="M6,34 H34" stroke="#6b4a2c" strokeWidth={2} strokeLinecap="round" />
          </g>
        )}
        {level !== undefined && (
          <g>
            <circle cx={32} cy={32} r={level >= 10 ? 7 : 6} fill={INK.dark} stroke={c} strokeWidth={1.2} />
            <text x={32} y={35} textAnchor="middle" fontSize={level >= 10 ? 8 : 9} fontWeight={700} fill={c} fontFamily="system-ui, sans-serif">
              {level}
            </text>
          </g>
        )}
      </svg>
    </Art>
  );
}

/**
 * Cây thảo dược theo giai đoạn: 0 mầm, 1 đang lớn, 2 chín (phổ thông ra bông phát sáng, hiếm ra nấm linh chi).
 * Khung 64×64, mặt đất ở y≈54.
 */
export function HerbPlant({ id, stage, size = 64 }: { id: HerbId; stage: 0 | 1 | 2; size?: number }): ReactNode {
  const h = HERBS[id];
  const c = h.color;
  return (
    <Art k={`herbs/${id}`} alt="" className="art-icon">
      <svg viewBox="0 0 64 64" style={{ width: size, height: size }} aria-hidden="true">
        <ellipse cx={32} cy={55} rx={20} ry={5} fill="#5a3f27" />
        <ellipse cx={32} cy={53.5} rx={17} ry={3.6} fill="#7a5632" />
        {stage === 0 && (
          <g fill={c}>
            <path d="M32,52 Q27,48 25,42 Q31,43 32,52 Z" />
            <path d="M32,52 Q37,48 39,42 Q33,43 32,52 Z" opacity={0.85} />
            <path d="M32,52 V46" stroke={c} strokeWidth={1.6} />
          </g>
        )}
        {stage >= 1 && (
          <g>
            <path d="M32,53 V28" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
            <path d="M32,46 Q22,44 18,36 Q28,37 32,46 Z" fill={c} />
            <path d="M32,40 Q42,38 46,30 Q36,31 32,40 Z" fill={c} opacity={0.9} />
            <path d="M32,34 Q24,31 22,24 Q30,25 32,34 Z" fill={c} opacity={0.8} />
            {stage === 1 && <path d="M32,30 Q36,26 34,20 Q30,24 32,30 Z" fill={c} opacity={0.7} />}
          </g>
        )}
        {stage === 2 && !h.rare && (
          <g>
            <circle cx={32} cy={22} r={9} fill={c} opacity={0.28} />
            <circle cx={32} cy={22} r={4.6} fill={c} />
            <circle cx={25} cy={26} r={2.6} fill="#fff" opacity={0.9} />
            <circle cx={40} cy={28} r={2.2} fill="#fff" opacity={0.8} />
            <circle cx={32} cy={22} r={1.8} fill="#fff" />
          </g>
        )}
        {stage === 2 && h.rare && (
          <g>
            <circle cx={32} cy={20} r={13} fill={c} opacity={0.25} />
            <path d="M20,24 Q20,10 32,10 Q44,10 44,24 Q38,20 32,20 Q26,20 20,24 Z" fill={c} />
            <path d="M24,16 Q32,12 40,16" fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.7} />
            <path d="M32,20 V30" stroke="#fff" strokeWidth={2.2} opacity={0.7} strokeLinecap="round" />
          </g>
        )}
      </svg>
    </Art>
  );
}
