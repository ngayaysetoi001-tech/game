import { useId } from 'react';
import type { PathId } from '../../engine/data';
import { INK, PATH_COLORS } from './palette';

export interface CultivatorProps {
  pose: 'sit' | 'stand';
  path: PathId | null;
  aura: string;
  /** 0..1, độ lớn hào quang (theo cảnh giới) */
  power?: number;
  className?: string;
}

/**
 * Tu sĩ vẽ theo lối bóng mực: thân áo đen loang, điểm màu ở dải lụa, đai lưng, pháp khí.
 * Khung 100×120, chân chạm y≈112. Dáng đứng quay sang phải (về phía đối thủ).
 */
export default function Cultivator({ pose, path, aura, power = 0.3, className = '' }: CultivatorProps) {
  const id = useId().replace(/:/g, '');
  const accent = PATH_COLORS[path ?? 'none'];
  const robe = `url(#${id}-robe)`;
  const auraR = 34 + power * 18;

  return (
    <svg className={`art-cultivator ${className}`} viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-aura`}>
          <stop offset="0" stopColor={aura} stopOpacity={0.75} />
          <stop offset="0.5" stopColor={aura} stopOpacity={0.25} />
          <stop offset="1" stopColor={aura} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-robe`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={INK.mid} />
          <stop offset="1" stopColor={INK.dark} />
        </linearGradient>
        <radialGradient id={`${id}-orb`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.4" stopColor={accent} />
          <stop offset="1" stopColor={accent} stopOpacity={0} />
        </radialGradient>
      </defs>

      <circle className="art-aura" cx={50} cy={pose === 'sit' ? 68 : 60} r={auraR} fill={`url(#${id}-aura)`} />

      {pose === 'sit' ? <Sitting path={path} accent={accent} robe={robe} orb={`url(#${id}-orb)`} /> : <Standing path={path} accent={accent} robe={robe} orb={`url(#${id}-orb)`} />}
    </svg>
  );
}

interface PartProps {
  path: PathId | null;
  accent: string;
  robe: string;
  orb: string;
}

function Sitting({ path, accent, robe, orb }: PartProps) {
  const broad = path === 'the' ? 1.12 : 1;
  return (
    <g>
      {/* Dải lụa bay phía sau */}
      <g className="art-sway" fill="none" stroke={accent} strokeWidth={1.8} strokeLinecap="round" opacity={0.85}>
        <path d="M40,74 Q22,70 14,56 Q10,48 4,46" />
        <path d="M60,74 Q78,70 86,58 Q90,50 97,50" />
      </g>
      {path === 'kiem' && (
        <g>
          <line x1={34} y1={40} x2={70} y2={84} stroke="#d9e4ee" strokeWidth={2.2} />
          <line x1={34} y1={40} x2={70} y2={84} stroke={accent} strokeWidth={4} opacity={0.25} />
          <line x1={37} y1={50} x2={45} y2={43} stroke={INK.dark} strokeWidth={2.5} />
        </g>
      )}
      <g transform={`translate(50,0) scale(${broad},1) translate(-50,0)`}>
        {/* Thân áo ngồi kiết già */}
        <path fill={robe} d="M43,52 Q50,48 57,52 L63,72 Q79,86 85,100 Q66,109 50,107 Q34,109 15,100 Q21,86 37,72 Z" />
        {/* Tay áo ôm lấy đầu gối */}
        <path fill={robe} d="M42,56 Q30,72 34,88 Q44,92 50,90 Q56,92 66,88 Q70,72 58,56 Z" opacity={0.9} />
      </g>
      <path d="M46,52 L50,62 L54,52" fill="none" stroke="#e9dfcc" strokeWidth={1.2} />
      <path d="M38,77 Q50,81 62,77" fill="none" stroke={accent} strokeWidth={2} />
      {path === 'the' && (
        <g fill="none" stroke={accent} strokeWidth={2}>
          <path d="M33,82 Q36,86 40,86" />
          <path d="M67,82 Q64,86 60,86" />
        </g>
      )}
      {/* Tay kết ấn */}
      <ellipse cx={50} cy={89} rx={6} ry={3} fill="#e9dfcc" opacity={0.9} />
      {path === 'phap' && <circle className="art-pulse" cx={50} cy={80} r={6} fill={orb} />}
      {/* Đầu, búi tóc, trâm */}
      <path d="M44,42 Q38,52 41,60 L45,52 Z" fill={INK.dark} />
      <circle cx={50} cy={41} r={8.5} fill={INK.dark} />
      <circle cx={50} cy={30.5} r={4.6} fill={INK.dark} />
      <line x1={43} y1={30} x2={58} y2={28} stroke={accent} strokeWidth={1.3} />
    </g>
  );
}

function Standing({ path, accent, robe, orb }: PartProps) {
  return (
    <g>
      <g className="art-sway" fill="none" stroke={accent} strokeWidth={1.8} strokeLinecap="round" opacity={0.85}>
        <path d="M42,62 Q24,62 16,72 Q10,80 2,80" />
        <path d="M44,66 Q30,74 24,90 Q20,98 12,102" />
      </g>
      {/* Thân áo dài */}
      <path fill={robe} d="M42,34 Q48,30 55,34 L60,62 Q64,90 72,112 L26,112 Q33,90 37,62 Z" />
      <path d="M45,34 L49,44 L53,34" fill="none" stroke="#e9dfcc" strokeWidth={1.1} />
      <path d="M38,60 Q48,63 59,60" fill="none" stroke={accent} strokeWidth={2} />
      {path === 'the' ? (
        <g>
          <path fill={robe} d="M52,38 Q66,40 76,48 L73,54 Q62,48 52,48 Z" />
          <circle cx={78} cy={50} r={5} fill={INK.dark} />
          <circle className="art-pulse" cx={78} cy={50} r={9} fill="none" stroke={accent} strokeWidth={1.5} />
        </g>
      ) : (
        <path fill={robe} d="M52,38 Q64,40 72,46 L69,51 Q60,47 51,48 Z" />
      )}
      {path === 'kiem' && (
        <g>
          <line x1={72} y1={48} x2={99} y2={22} stroke={accent} strokeWidth={5} opacity={0.25} />
          <line x1={72} y1={48} x2={99} y2={22} stroke="#e4edf5" strokeWidth={2} />
          <line x1={68} y1={44} x2={76} y2={52} stroke={INK.dark} strokeWidth={2.4} />
        </g>
      )}
      {path === 'phap' && <circle className="art-pulse" cx={78} cy={42} r={7} fill={orb} />}
      {path === null && <ellipse cx={72} cy={49} rx={3} ry={2.2} fill="#e9dfcc" />}
      {/* Đầu */}
      <path d="M42,22 Q36,34 39,44 L44,34 Z" fill={INK.dark} />
      <circle cx={48} cy={24} r={7.5} fill={INK.dark} />
      <circle cx={47} cy={14.5} r={4.2} fill={INK.dark} />
      <line x1={41} y1={14} x2={55} y2={12} stroke={accent} strokeWidth={1.2} />
    </g>
  );
}
