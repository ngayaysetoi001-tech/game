import { useId, type ReactNode } from 'react';
import { INK } from './palette';
import { hashString, lookFor, type MonsterLook } from './bestiary';
import { seeded } from './Landscape';

// Khung 120×100, mặt đất y≈94, quái quay sang trái (về phía người chơi).

interface Paint {
  body: string;
  look: MonsterLook;
  rim: string;
}

const METAL = '#cfd6dc';

function Eye({ x, y, color, r = 1.8 }: { x: number; y: number; color: string; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 2.4} fill={color} opacity={0.3} />
      <circle cx={x} cy={y} r={r} fill={color} />
    </g>
  );
}

function Horns({ x, y, color = INK.dark }: { x: number; y: number; color?: string }) {
  return (
    <g fill={color}>
      <path d={`M${x - 4},${y} Q${x - 10},${y - 12} ${x - 4},${y - 20} Q${x - 4},${y - 10} ${x + 1},${y - 1} Z`} />
      <path d={`M${x + 4},${y} Q${x + 8},${y - 12} ${x + 15},${y - 18} Q${x + 9},${y - 8} ${x + 8},${y + 1} Z`} />
    </g>
  );
}

function Crown({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <path
      d={`M${x - 10},${y} L${x - 8},${y - 9} L${x - 4},${y - 3} L${x},${y - 12} L${x + 4},${y - 3} L${x + 8},${y - 9} L${x + 10},${y} Z`}
      fill={color}
      opacity={0.9}
    />
  );
}

function Spikes({ from, to, y }: { from: number; to: number; y: number }) {
  const n = 5;
  const step = (to - from) / n;
  return (
    <g fill={INK.dark}>
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={`M${from + i * step},${y + 2} L${from + i * step + step / 2},${y - 8} L${from + (i + 1) * step},${y + 2} Z`} />
      ))}
    </g>
  );
}

function Beast({ body, look, rim }: Paint) {
  const tails = look.tails ?? 0;
  return (
    <g stroke={rim} strokeWidth={0.7}>
      {tails > 0
        ? Array.from({ length: tails }, (_, i) => (
            <path
              key={i}
              fill={body}
              transform={`rotate(${(i - (tails - 1) / 2) * 16} 96 58)`}
              d="M96,58 Q112,50 118,30 Q124,46 110,58 Q104,64 98,64 Z"
            />
          ))
        : <path fill={body} d="M96,58 Q110,52 115,38 Q110,56 98,64 Z" />}
      <path fill={body} d="M84,64 L80,93 L86,93 L91,66 Z M94,62 L96,93 L102,93 L101,62 Z" />
      <path fill={body} d="M50,62 L45,93 L51,93 L57,64 Z M59,64 L59,93 L65,93 L65,64 Z" />
      <ellipse cx={74} cy={58} rx={28} ry={13} fill={body} />
      <path fill={body} d="M58,50 Q48,40 40,39 L26,45 L23,50 L38,55 Q47,59 57,66 Z" />
      <path fill={body} d="M39,40 L41,27 L48,40 Z M45,41 L50,29 L53,44 Z" />
      {look.spikes && <Spikes from={60} to={94} y={47} />}
      {look.horns && <Horns x={44} y={38} />}
      <path d="M25,50 L37,52" stroke={INK.dark} strokeWidth={1} />
      <path d="M28,50 L29,53 L31,50 M32,51 L33,54 L35,51" fill="#eee" stroke="none" />
      <Eye x={36} y={45} color={look.eye} />
    </g>
  );
}

function Bulky({ body, look, rim }: Paint) {
  return (
    <g stroke={rim} strokeWidth={0.7}>
      <path fill={body} d="M34,94 Q26,58 50,40 Q74,26 96,40 Q112,56 104,94 Z" />
      {look.spikes && <Spikes from={58} to={98} y={38} />}
      <path fill={body} d="M42,52 Q24,68 27,92 L41,92 Q38,72 54,60 Z" />
      <circle cx={42} cy={40} r={13} fill={body} />
      {!look.horns && <path fill={body} d="M31,30 a4,4 0 1,1 7,-3 Z M47,27 a4,4 0 1,1 7,3 Z" />}
      {look.horns && <Horns x={42} y={30} />}
      <path d="M33,46 Q40,50 47,46" fill="none" stroke={INK.dark} strokeWidth={1.2} />
      <Eye x={37} y={39} color={look.eye} />
      <Eye x={46} y={39} color={look.eye} />
      {look.cracks && (
        <path d="M70,50 L76,62 L72,72 M88,58 L84,70" fill="none" stroke={look.eye} strokeWidth={1} opacity={0.7} />
      )}
    </g>
  );
}

function Serpent({ body, look, rim }: Paint) {
  const d = 'M116,90 Q84,98 74,80 Q64,60 86,54 Q106,48 94,32 Q84,20 64,26';
  return (
    <g>
      <path d={d} fill="none" stroke={rim} strokeWidth={15} strokeLinecap="round" />
      <path d={d} fill="none" stroke={body} strokeWidth={13} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={9} strokeDasharray="2 5" />
      {look.spikes && <path d={d} fill="none" stroke={INK.dark} strokeWidth={3} strokeDasharray="1 6" transform="translate(0,-7)" />}
      <path fill={body} stroke={rim} strokeWidth={0.7} d="M68,20 Q52,13 37,21 Q30,26 34,32 Q48,35 68,32 Z" />
      <path fill={INK.dark} d="M36,30 Q46,40 62,33 Z" />
      <path d="M35,28 L27,30 M27,30 L23,27 M27,30 L23,33" stroke="#d33" strokeWidth={1} fill="none" />
      {look.horns && (
        <g>
          <path fill={INK.dark} d="M58,20 Q62,6 74,3 Q66,12 64,21 Z" />
          <path d="M38,29 Q28,40 16,36 M42,31 Q36,44 24,46" stroke={INK.dark} strokeWidth={1} fill="none" />
        </g>
      )}
      <Eye x={47} y={22} color={look.eye} />
    </g>
  );
}

function Bat({ body, look, rim }: Paint) {
  return (
    <g stroke={rim} strokeWidth={0.7} className="art-flap">
      <path fill={body} d="M58,46 Q38,20 10,26 Q18,36 15,46 Q26,42 30,53 Q40,48 46,58 Z" />
      <path fill={body} d="M74,46 Q94,20 116,26 Q108,36 111,46 Q100,42 96,53 Q86,48 80,58 Z" />
      <ellipse cx={66} cy={54} rx={10} ry={15} fill={body} />
      <circle cx={66} cy={37} r={8} fill={body} />
      <path fill={body} d="M59,34 L58,24 L63,31 Z M73,34 L74,24 L69,31 Z" />
      <path d="M63,42 L64,46 L65,42 M67,42 L68,46 L69,42" fill="#eee" stroke="none" />
      <Eye x={62} y={36} color={look.eye} r={1.6} />
      <Eye x={70} y={36} color={look.eye} r={1.6} />
    </g>
  );
}

function Bird({ body, look, rim }: Paint) {
  return (
    <g stroke={rim} strokeWidth={0.7}>
      <path fill={body} opacity={0.8} d="M70,46 Q86,14 112,6 Q98,30 92,48 Z" />
      <path fill={body} d="M78,62 L106,76 L100,67 L110,64 Z" />
      <ellipse cx={64} cy={58} rx={17} ry={10} fill={body} transform="rotate(-15 64 58)" />
      <path fill={body} className="art-flap" d="M62,52 Q42,20 14,10 Q30,30 34,44 Q22,40 16,44 Q36,58 58,62 Z" />
      <circle cx={46} cy={48} r={7.5} fill={body} />
      <path d="M40,45 L28,50 L40,53 Z" fill={GOLDISH} />
      <path d="M62,66 L60,80 M68,66 L70,80" stroke={INK.dark} strokeWidth={1.6} />
      <path d="M36,24 L42,30 L38,32 L46,40" fill="none" stroke={look.eye} strokeWidth={1.4} opacity={0.9} />
      <Eye x={45} y={46} color={look.eye} r={1.5} />
    </g>
  );
}

const GOLDISH = '#d9a93a';

function Insect({ body, look, rim }: Paint) {
  return (
    <g stroke={rim} strokeWidth={0.7}>
      <g className="art-flap">
        <ellipse cx={62} cy={34} rx={16} ry={7} fill="#fff" opacity={0.28} transform="rotate(-30 62 34)" />
        <ellipse cx={72} cy={36} rx={13} ry={6} fill="#fff" opacity={0.22} transform="rotate(-50 72 36)" />
      </g>
      <path d="M54,62 L48,78 M60,63 L58,80 M66,62 L68,78" stroke={INK.dark} strokeWidth={1.4} />
      <ellipse cx={82} cy={58} rx={19} ry={11} fill={body} />
      <path d="M76,48 L74,68 M84,47 L83,69 M92,49 L92,67" stroke={look.eye} strokeWidth={2} opacity={0.45} />
      <path d="M100,56 L112,59 L100,62 Z" fill={INK.dark} />
      <circle cx={60} cy={55} r={9} fill={body} />
      <circle cx={46} cy={53} r={7} fill={body} />
      <path d="M44,47 Q40,36 32,34 M48,47 Q48,36 42,30" stroke={INK.dark} strokeWidth={1} fill="none" />
      <Eye x={43} y={52} color={look.eye} r={1.7} />
    </g>
  );
}

function Humanoid({ body, look, rim }: Paint) {
  const zombie = look.weapon === 'claws';
  const lean = zombie ? 'rotate(-8 60 94)' : undefined;
  return (
    <g stroke={rim} strokeWidth={0.7} transform={lean}>
      <path fill={body} opacity={0.75} d="M60,30 Q82,42 86,94 L50,94 Z" />
      <path fill={body} d="M52,70 L48,94 L55,94 L58,72 Z M62,70 L64,94 L71,94 L68,70 Z" />
      <path fill={body} d="M48,34 Q60,28 72,34 L70,72 L50,72 Z" />
      <ellipse cx={48} cy={36} rx={8} ry={5} fill={body} />
      <ellipse cx={72} cy={36} rx={8} ry={5} fill={body} />
      {look.weapon === 'halberd' && (
        <g>
          <line x1={40} y1={94} x2={36} y2={6} stroke={INK.dark} strokeWidth={2.4} />
          <path d="M36,8 Q20,14 25,30 Q31,20 38,20 Z" fill={METAL} />
          <path d="M48,40 Q40,46 38,54" stroke={body} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      )}
      {look.weapon === 'sword' && (
        <g>
          <path d="M42,52 L10,16 L15,13 L47,48 Z" fill={METAL} />
          <line x1={38} y1={54} x2={48} y2={44} stroke={INK.dark} strokeWidth={3} />
          <path d="M48,40 Q42,46 42,50" stroke={body} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      )}
      {look.weapon === 'claws' && (
        <g stroke={body} strokeWidth={5} strokeLinecap="round" fill="none">
          <path d="M50,42 Q38,46 28,44" />
          <path d="M52,48 Q40,54 30,54" />
          <path d="M27,42 L22,40 M27,45 L22,46 M29,53 L24,52 M29,56 L24,58" stroke={INK.dark} strokeWidth={1.2} />
        </g>
      )}
      {look.weapon === 'chain' && (
        <path d="M48,42 Q30,60 36,80 Q40,92 28,94" stroke={METAL} strokeWidth={1.8} strokeDasharray="3 2" fill="none" />
      )}
      <circle cx={60} cy={22} r={8.5} fill={body} />
      {look.horns && <Horns x={60} y={16} />}
      {look.crown && <Crown x={60} y={12} color={look.eye} />}
      <path d="M53,22 L58,23 M62,23 L66,22" stroke={look.eye} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={56} cy={22.5} r={4} fill={look.eye} opacity={0.2} />
    </g>
  );
}

function Ghost({ body, look, rim }: Paint) {
  return (
    <g stroke={rim} strokeWidth={0.7}>
      {look.weapon === 'sword' && (
        <g className="art-bob">
          <line x1={26} y1={76} x2={44} y2={14} stroke={look.eye} strokeWidth={5} opacity={0.25} />
          <line x1={26} y1={76} x2={44} y2={14} stroke={METAL} strokeWidth={2} />
          <line x1={27} y1={62} x2={35} y2={66} stroke={INK.dark} strokeWidth={2.4} />
        </g>
      )}
      {look.weapon === 'cauldron' && (
        <g>
          <path d="M22,66 Q22,84 38,84 Q54,84 54,66 Z" fill={INK.dark} />
          <path d="M26,84 L24,92 M50,84 L52,92" stroke={INK.dark} strokeWidth={2.4} />
          <ellipse cx={38} cy={66} rx={16} ry={3} fill={look.eye} opacity={0.6} />
        </g>
      )}
      {look.weapon === 'chain' && (
        <path d="M44,52 Q26,62 30,80 Q34,92 22,92" stroke={METAL} strokeWidth={1.8} strokeDasharray="3 2" fill="none" />
      )}
      <path
        fill={body}
        opacity={0.92}
        d="M62,14 Q84,16 82,42 Q80,64 98,84 Q76,78 72,90 Q62,76 50,88 Q52,68 44,48 Q40,18 62,14 Z"
      />
      {look.crown && <Crown x={62} y={16} color={look.eye} />}
      <ellipse cx={56} cy={34} rx={3} ry={4} fill={look.eye} />
      <ellipse cx={68} cy={34} rx={3} ry={4} fill={look.eye} />
      <ellipse cx={62} cy={46} rx={3} ry={5} fill={INK.dark} />
    </g>
  );
}

function Eldritch({ body, look, rim, seed }: Paint & { seed: number }) {
  const rng = seeded(seed);
  const n = look.eyes ?? 3;
  const eyes = Array.from({ length: n }, (_, i) => ({
    x: 40 + rng() * 50,
    y: 38 + rng() * 34,
    r: i === 0 ? 4.5 : 1.6 + rng() * 2.4,
  }));
  return (
    <g stroke={rim} strokeWidth={0.7}>
      <g fill="none" stroke={body} strokeWidth={4} strokeLinecap="round" className="art-sway">
        <path d="M40,84 Q30,92 16,90" />
        <path d="M56,88 Q52,96 44,98" />
        <path d="M76,88 Q82,96 92,96" />
        <path d="M96,80 Q108,88 116,82" />
      </g>
      <path fill={body} d="M28,84 Q16,44 58,26 Q100,14 106,56 Q110,88 70,90 Z" />
      {look.crown && <Crown x={64} y={24} color={look.eye} />}
      {eyes.map((e, i) => (
        <g key={i}>
          <circle cx={e.x} cy={e.y} r={e.r * 1.9} fill={look.eye} opacity={0.22} />
          <circle cx={e.x} cy={e.y} r={e.r} fill={look.eye} />
          <ellipse cx={e.x} cy={e.y} rx={e.r * 0.25} ry={e.r * 0.8} fill={INK.dark} />
        </g>
      ))}
      <path d="M44,78 L48,72 L52,78 L56,72 L60,78 L64,72 L68,78" fill="none" stroke="#eee" strokeWidth={1} opacity={0.7} />
    </g>
  );
}

export interface MonsterProps {
  name: string;
  boss?: boolean;
  /** Nền tối (U Minh, Hỗn Độn…) cần viền sáng hơn để quái không chìm vào tranh */
  darkBackdrop?: boolean;
  className?: string;
}

export default function Monster({ name, boss = false, darkBackdrop = false, className = '' }: MonsterProps) {
  const id = useId().replace(/:/g, '');
  const look = lookFor(name);
  const paint: Paint = {
    body: `url(#${id}-body)`,
    look,
    rim: darkBackdrop ? 'rgba(235,225,205,0.45)' : 'rgba(255,255,255,0.18)',
  };
  const bodies: Record<MonsterLook['type'], ReactNode> = {
    beast: <Beast {...paint} />,
    bulky: <Bulky {...paint} />,
    serpent: <Serpent {...paint} />,
    bat: <Bat {...paint} />,
    bird: <Bird {...paint} />,
    insect: <Insect {...paint} />,
    humanoid: <Humanoid {...paint} />,
    ghost: <Ghost {...paint} />,
    eldritch: <Eldritch {...paint} seed={hashString(name)} />,
  };
  const floating = ['bat', 'bird', 'insect', 'ghost'].includes(look.type);

  return (
    <svg className={`art-monster ${className}`} viewBox="0 0 120 100" aria-label={name} role="img">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor={look.tint} />
          <stop offset="1" stopColor={INK.dark} />
        </linearGradient>
        <radialGradient id={`${id}-aura`}>
          <stop offset="0" stopColor={look.eye} stopOpacity={0.45} />
          <stop offset="1" stopColor={look.eye} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={64} cy={95} rx={34} ry={4} fill={INK.dark} opacity={0.25} />
      {boss && <ellipse className="art-aura" cx={64} cy={56} rx={58} ry={46} fill={`url(#${id}-aura)`} />}
      <g className={floating ? 'art-bob' : 'art-breathe'}>
        <g transform={boss ? 'translate(64,94) scale(1.1) translate(-64,-94)' : undefined}>{bodies[look.type]}</g>
      </g>
    </svg>
  );
}
