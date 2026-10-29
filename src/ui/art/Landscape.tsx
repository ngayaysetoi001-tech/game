import { useId, useMemo } from 'react';
import { INK, type SceneTheme } from './palette';

// Khung tranh 400×240; preserveAspectRatio "slice" để phủ kín mọi kích thước khung.
const W = 400;
const H = 240;

/** PRNG nhỏ có seed để mỗi khu luôn ra cùng một bức tranh */
export function seeded(seed: number) {
  let a = seed * 9301 + 49297;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Đường sống núi mềm: các đỉnh ngẫu nhiên nối bằng đường cong bậc hai */
function ridge(rng: () => number, base: number, amp: number, peaks: number): string {
  const pts: [number, number][] = [];
  const step = W / peaks;
  for (let i = -1; i <= peaks + 1; i++) {
    const x = i * step + (rng() - 0.5) * step * 0.6;
    const y = base - amp * (0.35 + rng() * 0.65) * (i % 2 === 0 ? 1 : 0.45);
    pts.push([x, y]);
  }
  let d = `M${pts[0][0]},${H} L${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += ` Q${x0 + (x1 - x0) / 2},${Math.min(y0, y1) - 6} ${x1},${y1}`;
  }
  d += ` L${pts[pts.length - 1][0]},${H} Z`;
  return d;
}

function Pine({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill={INK.dark}>
      <path d="M-1,0 L1,0 L0.6,-34 L-0.6,-34 Z" />
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={(i % 2 ? 4 : -4) * (1 - i * 0.15)} cy={-10 - i * 7} rx={10 - i * 2} ry={2.4} opacity={0.9} />
      ))}
    </g>
  );
}

function Features({ theme, rng }: { theme: SceneTheme; rng: () => number }) {
  switch (theme.feature) {
    case 'pines':
      return (
        <g>
          <Pine x={34} y={206} s={1.1} />
          <Pine x={52} y={214} s={0.8} />
          <Pine x={362} y={210} s={1} />
        </g>
      );
    case 'blood':
      return (
        <g stroke={INK.dark} strokeWidth={2} fill="none" strokeLinecap="round">
          <path d="M40,220 L44,170 M44,190 L30,176 M44,180 L58,166" />
          <path d="M360,224 L356,184 M356,198 L370,186" />
        </g>
      );
    case 'canyon':
      return (
        <g fill={INK.dark} opacity={0.85}>
          <path d="M0,40 L40,60 L52,240 L0,240 Z" />
          <path d="M400,30 L352,70 L338,240 L400,240 Z" />
        </g>
      );
    case 'ruins':
      return (
        <g fill={INK.dark} opacity={0.8}>
          <rect x={46} y={150} width={10} height={70} />
          <rect x={40} y={146} width={22} height={6} />
          <rect x={330} y={170} width={10} height={50} transform="rotate(8 335 195)" />
          <path d="M80,222 L130,214 L128,222 Z" />
        </g>
      );
    case 'sea':
      return (
        <g fill="none" stroke={INK.mid} strokeWidth={1.4} opacity={0.75} strokeLinecap="round">
          {Array.from({ length: 7 }, (_, i) => {
            const y = 196 + i * 7;
            const off = (i % 2) * 20;
            return <path key={i} d={`M${-off},${y} ` + 'q20,-6 40,0 '.repeat(12)} />;
          })}
        </g>
      );
    case 'ghost':
      return (
        <g>
          {[60, 120, 300, 350].map((x, i) => (
            <g key={x} className="art-bob" style={{ animationDelay: `${i * 0.7}s` }}>
              <circle cx={x} cy={90 + (i % 2) * 30} r={9} fill="#9fe3b8" opacity={0.18} />
              <circle cx={x} cy={90 + (i % 2) * 30} r={3} fill="#c9f5d8" opacity={0.85} />
            </g>
          ))}
        </g>
      );
    case 'palace':
      return (
        <g fill={INK.dark} opacity={0.7}>
          <path d="M290,104 L340,104 L332,96 L298,96 Z M300,96 L330,96 L326,88 L304,88 Z" />
          <rect x={304} y={104} width={22} height={14} />
          <path d="M70,126 L104,126 L98,120 L76,120 Z" />
          <rect x={78} y={126} width={18} height={10} />
        </g>
      );
    case 'void':
      return (
        <g>
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={rng() * W} cy={rng() * 150} r={rng() * 1.2 + 0.3} fill="#e9dcff" opacity={0.4 + rng() * 0.5} />
          ))}
          <ellipse cx={200} cy={70} rx={120} ry={18} fill="none" stroke="#c79bff" strokeWidth={1} opacity={0.35} />
        </g>
      );
    case 'cave':
      return (
        <g fill={INK.dark}>
          <path d="M0,0 L400,0 L400,240 L360,240 Q370,120 300,60 Q200,10 100,60 Q30,120 40,240 L0,240 Z" />
          {[70, 120, 170, 240, 290, 330].map((x, i) => (
            <path key={x} d={`M${x - 6},40 L${x},${62 + (i % 3) * 10} L${x + 6},40 Z`} />
          ))}
        </g>
      );
  }
}

export default function Landscape({ theme, seed }: { theme: SceneTheme; seed: number }) {
  const id = useId().replace(/:/g, '');
  const layers = useMemo(() => {
    const rng = seeded(seed);
    return [
      { d: ridge(rng, 120, 60, 5), t: 0 },
      { d: ridge(rng, 160, 70, 4), t: 0.45 },
      { d: ridge(rng, 205, 60, 6), t: 1 },
    ];
  }, [seed]);
  const featureRng = useMemo(() => seeded(seed + 7), [seed]);
  const mix = (t: number) => (t === 0 ? theme.ink[0] : t === 1 ? theme.ink[1] : `color-mix(in srgb, ${theme.ink[0]}, ${theme.ink[1]} ${t * 100}%)`);

  return (
    <svg className="art-landscape" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.paper[0]} />
          <stop offset="1" stopColor={theme.paper[1]} />
        </linearGradient>
        {layers.map((l, i) => (
          <linearGradient key={i} id={`${id}-m${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mix(l.t)} stopOpacity={0.95} />
            <stop offset="0.55" stopColor={mix(l.t)} stopOpacity={0.35} />
            <stop offset="1" stopColor={mix(l.t)} stopOpacity={0} />
          </linearGradient>
        ))}
        {/* Viền mực loang: làm méo nhẹ đường nét bằng nhiễu */}
        <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="7" />
        </filter>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={`url(#${id}-paper)`} />
      <circle cx={318} cy={58} r={22} fill={theme.sun} opacity={0.8} />
      <g filter={`url(#${id}-ink)`}>
        {layers.map((l, i) => (
          <path key={i} d={l.d} fill={`url(#${id}-m${i})`} />
        ))}
      </g>
      <g filter={`url(#${id}-blur)`} fill={theme.mist}>
        <g className="art-drift">
          <ellipse cx={120} cy={150} rx={140} ry={14} opacity={0.7} />
          <ellipse cx={330} cy={182} rx={120} ry={12} opacity={0.6} />
        </g>
        <g className="art-drift slow">
          <ellipse cx={260} cy={118} rx={110} ry={10} opacity={0.55} />
        </g>
      </g>
      <Features theme={theme} rng={featureRng} />
      {/* Ấn triện góc tranh */}
      <g transform="translate(372,206)">
        <rect width={18} height={18} rx={2} fill={INK.seal} opacity={0.85} />
        <text x={9} y={13.5} textAnchor="middle" fontSize={12} fill="#f3e6d6" fontFamily="'Noto Serif SC', 'Songti SC', serif">
          仙
        </text>
      </g>
    </svg>
  );
}
