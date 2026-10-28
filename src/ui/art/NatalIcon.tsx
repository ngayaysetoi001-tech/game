import type { NatalId } from '../../engine/engine';
import { INK } from './palette';
import { Art } from './registry';

/** Màu theo giai đoạn tiến hóa: Phàm, Linh, Bảo, Tiên Khí */
export const NATAL_STAGE_COLORS = ['#cfc6b4', '#7fcf8a', '#6fb2ff', '#ffb04a'];

/** Bản mệnh pháp bảo vẽ bằng SVG; có ảnh thật tại natal/<id> thì dùng ảnh */
export default function NatalIcon({ id, stage, className = '' }: { id: NatalId; stage: number; className?: string }) {
  const c = NATAL_STAGE_COLORS[stage];
  return (
    <Art k={`natal/${id}`} alt="" className={`natal-icon ${className}`}>
      <svg className={`natal-icon stage-${stage} ${className}`} viewBox="0 0 80 80" aria-hidden="true" style={{ color: c }}>
        <circle cx={40} cy={40} r={36} fill="currentColor" opacity={0.1} />
        {stage >= 2 && <circle cx={40} cy={40} r={37} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.5} strokeDasharray="3 4" />}
        {stage >= 3 && (
          <g fill="currentColor">
            <circle cx={12} cy={22} r={1.6} />
            <circle cx={68} cy={18} r={1.3} />
            <circle cx={70} cy={58} r={1.6} />
            <circle cx={10} cy={60} r={1.2} />
          </g>
        )}
        {id === 'phi_kiem' && (
          <g>
            <path d="M18,62 L56,18 L62,16 L60,22 L24,64 Z" fill="#e6ecf0" />
            <path d="M18,62 L56,18" stroke="currentColor" strokeWidth={1.2} />
            <path d="M16,52 L30,66" stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
            <path d="M18,62 L10,70" stroke={INK.mid} strokeWidth={4} strokeLinecap="round" />
            <path d="M8,72 L12,68" stroke="#b8382c" strokeWidth={2} />
          </g>
        )}
        {id === 'ho_lo' && (
          <g>
            <path d="M34,14 Q40,8 46,14 L45,22 Q58,26 58,42 Q58,52 50,55 Q64,60 62,68 Q58,74 40,74 Q22,74 18,68 Q16,60 30,55 Q22,52 22,42 Q22,26 35,22 Z" fill="currentColor" opacity={0.9} />
            <path d="M34,14 Q40,8 46,14 L45,22 L35,22 Z" fill={INK.dark} opacity={0.55} />
            <path d="M40,6 L40,12" stroke={INK.mid} strokeWidth={1.5} />
            <path d="M26,49 L54,49" stroke={INK.dark} strokeWidth={1.4} opacity={0.5} strokeDasharray="2 3" />
            <ellipse cx={32} cy={36} rx={3} ry={5} fill="#fff" opacity={0.5} />
          </g>
        )}
        {id === 'linh_chung' && (
          <g>
            <path d="M36,12 L44,12 L44,18 L36,18 Z" fill={INK.mid} />
            <path d="M40,18 Q22,20 20,44 L16,58 L64,58 L60,44 Q58,20 40,18 Z" fill="currentColor" opacity={0.92} />
            <path d="M14,58 Q40,66 66,58 L66,62 Q40,70 14,62 Z" fill={INK.dark} opacity={0.65} />
            <path d="M28,30 Q40,26 52,30" fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.5} />
            <circle cx={40} cy={64} r={4} fill={INK.dark} />
          </g>
        )}
      </svg>
    </Art>
  );
}
