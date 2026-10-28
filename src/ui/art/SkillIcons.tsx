import type { ReactNode } from 'react';
import { SKILLS, type SkillId, type TechId } from '../../engine/engine';
import { INK } from './palette';
import { Art } from './registry';

// Biểu tượng võ kỹ và công pháp: cùng kiểu khung vuông bo góc với biểu tượng pháp bảo.
// - Võ kỹ: khung màu theo hệ chiêu thức, vòng tròn bên trong, số cấp ở góc dưới phải, số thứ tự ưu tiên ở góc trên trái.
// - Công pháp: khung màu theo phẩm cấp (Hoàng, Huyền, Địa, Thiên), số chấm ở đáy = phẩm cấp, số tầng ở góc trên phải.
// Có ảnh thật tại skills/<id> hoặc techs/<id> trong src/assets/art thì dùng ảnh.

type Motif =
  | 'slash'
  | 'triple'
  | 'swordup'
  | 'fan'
  | 'fist'
  | 'shield'
  | 'heal'
  | 'quake'
  | 'flame'
  | 'ice'
  | 'bolt'
  | 'bolts'
  | 'wave'
  | 'lotus'
  | 'vortex'
  | 'moon'
  | 'fang'
  | 'claw'
  | 'ghost'
  | 'eye'
  | 'gourd'
  | 'bell'
  | 'mountain'
  | 'bagua'
  | 'breath'
  | 'formation'
  | 'leaf'
  | 'recoil'
  | 'drop'
  | 'stars'
  | 'taiji';

const W = '#eef2f6';
const D = INK.dark;

function line(d: string, c: string, w = 2.4, o = 1) {
  return <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />;
}

/** Nét vẽ có quầng sáng màu c bên dưới, nét trắng bên trên */
function glow(d: string, c: string, w = 2.2) {
  return (
    <>
      {line(d, c, w + 2.6, 0.4)}
      {line(d, W, w)}
    </>
  );
}

function Glyph({ m, c }: { m: Motif; c: string }): ReactNode {
  switch (m) {
    case 'slash':
      return (
        <g>
          <path d="M9,29 Q11,12 31,9 Q18,15 14,32 Z" fill={c} opacity={0.9} />
          {glow('M12,30 L29,11', c)}
          {line('M9,27 L14,32', c, 2.8)}
        </g>
      );
    case 'triple':
      return (
        <g>
          {glow('M9,25 L23,10', c)}
          {glow('M13,31 L31,13', c)}
          {glow('M21,33 L33,21', c)}
        </g>
      );
    case 'swordup':
      return (
        <g>
          <path d="M20,6 L23.5,10 V25 H16.5 V10 Z" fill={W} />
          {line('M12.5,25 H27.5', c, 3)}
          {line('M20,25 V33', c, 2.6)}
          {line('M8,17 L11,13.5 L14,17', c, 1.8)}
          {line('M26,17 L29,13.5 L32,17', c, 1.8)}
          {line('M8,23 L11,19.5 L14,23', c, 1.8, 0.7)}
          {line('M26,23 L29,19.5 L32,23', c, 1.8, 0.7)}
        </g>
      );
    case 'fan':
      return (
        <g>
          {glow('M20,32 L7.8,17.4', c, 1.6)}
          {glow('M20,32 L13.5,14.1', c, 1.6)}
          {glow('M20,32 L20,11', c, 1.6)}
          {glow('M20,32 L26.5,14.1', c, 1.6)}
          {glow('M20,32 L32.2,17.4', c, 1.6)}
          <circle cx={20} cy={32} r={2.6} fill={c} />
        </g>
      );
    case 'fist':
      return (
        <g>
          <path d="M12,17 h16 a3,3 0 0 1 3,3 v7 a3,3 0 0 1 -3,3 h-16 a3,3 0 0 1 -3,-3 v-7 a3,3 0 0 1 3,-3 z" fill={c} />
          {line('M16,17 V23 M20,17 V23 M24,17 V23', D, 1.3, 0.6)}
          {line('M13,28 H27', D, 1.3, 0.35)}
          {line('M7,9 L11,13 M33,9 L29,13 M20,5 V10', W, 2)}
        </g>
      );
    case 'shield':
      return (
        <g>
          <path d="M20,6 L32,10 V21 Q32,30 20,35 Q8,30 8,21 V10 Z" fill={c} opacity={0.95} />
          <path d="M20,12 L27,14.5 V21 Q27,26 20,29.5 Z" fill={W} opacity={0.4} />
          {line('M20,12 V29', D, 1.2, 0.4)}
        </g>
      );
    case 'heal':
      return (
        <g>
          <path d="M20,5 Q31,17 31,24 A11,11 0 0 1 9,24 Q9,17 20,5 Z" fill={c} />
          {line('M20,18 V30 M14,24 H26', W, 3)}
        </g>
      );
    case 'quake':
      return (
        <g>
          <path d="M5,33 L15,15 L21,25 L26,18 L35,33 Z" fill={c} />
          {line('M20,33 L18,28 L21.5,24.5 L19,20', W, 1.8)}
          {line('M20,5 V10 M11,8 L13.5,11.5 M29,8 L26.5,11.5', W, 2)}
        </g>
      );
    case 'flame':
      return (
        <g>
          <path d="M20,4 Q24,12 29,16 Q35,23 29,31 Q24,36 20,36 Q14,36 10,31 Q5,23 12,16 Q14,21 17,21 Q15,12 20,4 Z" fill={c} />
          <path d="M20,19 Q24,25 22.5,31 Q20,33.5 17.5,31 Q16,25 20,19 Z" fill={W} opacity={0.85} />
        </g>
      );
    case 'ice':
      return (
        <g>
          {line('M20,6 V34 M8,13 L32,27 M8,27 L32,13', c, 2.6)}
          {line('M16,9 L20,13 L24,9 M16,31 L20,27 L24,31', W, 1.4, 0.8)}
          <circle cx={20} cy={20} r={3.4} fill={W} />
        </g>
      );
    case 'bolt':
      return (
        <g>
          <path d="M24,4 L10,22 H19 L16,36 L31,16 H22.5 Z" fill={c} />
          <path d="M24,4 L10,22 H19 L16,36 L31,16 H22.5 Z" fill="none" stroke={W} strokeWidth={1.1} strokeLinejoin="round" />
        </g>
      );
    case 'bolts':
      return (
        <g>
          <path d="M9,17 Q9,10 16,10 Q19,5 25,8.5 Q32,9 32,16 Q32,21 26,21 H12 Q7,21 9,17 Z" fill={W} opacity={0.88} />
          {line('M14,22.5 L11,29 H15 L12.5,35', c, 2.4)}
          {line('M21.5,22.5 L18.5,29 H22.5 L20,35', c, 2.4)}
          {line('M29,22.5 L26,29 H30 L27.5,35', c, 2.4)}
        </g>
      );
    case 'wave':
      return (
        <g>
          {line('M6,14 q3.2,-4.4 6.4,0 t6.4,0 t6.4,0 t6.4,0', c, 2.6)}
          {line('M6,21.5 q3.2,-4.4 6.4,0 t6.4,0 t6.4,0 t6.4,0', W, 2.2, 0.9)}
          {line('M6,29 q3.2,-4.4 6.4,0 t6.4,0 t6.4,0 t6.4,0', c, 2.6)}
        </g>
      );
    case 'lotus':
      return (
        <g>
          <path d="M20,8 Q27,17 20,28 Q13,17 20,8 Z" fill={c} />
          <path d="M20,28 Q8,26 7,14 Q17,14 20,28 Z" fill={c} opacity={0.75} />
          <path d="M20,28 Q32,26 33,14 Q23,14 20,28 Z" fill={c} opacity={0.75} />
          {line('M9,32 Q20,37 31,32', W, 2)}
        </g>
      );
    case 'vortex':
      return (
        <g>
          {line('M20,20 C22,18 25,20 24,23 C23,27 17,27 15,22 C13,16 19,11 25,13 C32,16 32,26 26,30 C19,34 10,30 8,22', c, 2.6)}
          <circle cx={20} cy={20} r={2.2} fill={W} />
        </g>
      );
    case 'moon':
      return (
        <g>
          <path d="M25,6 A14,14 0 1 0 33,27 A11,11 0 1 1 25,6 Z" fill={c} />
          <circle cx={29} cy={12} r={1.6} fill={W} />
          <circle cx={33} cy={19} r={1.1} fill={W} opacity={0.8} />
        </g>
      );
    case 'fang':
      return (
        <g>
          <path d="M7,10 H33 V16 H7 Z" fill={c} />
          <path d="M11,16 H16 L13.5,30 Z M24,16 H29 L26.5,30 Z" fill={W} />
          <path d="M20,22 q3.2,4.4 0,8 q-3.2,-3.6 0,-8 Z" fill={c} />
        </g>
      );
    case 'claw':
      return (
        <g>
          {glow('M10,7 Q12,20 18,33', c, 2.4)}
          {glow('M17.5,5 Q19.5,18 25.5,31', c, 2.4)}
          {glow('M25,4 Q27,16 33,28', c, 2.4)}
        </g>
      );
    case 'ghost':
      return (
        <g>
          <path d="M20,6 Q31,6 31,18 V33 L27,29.5 L23.5,33.5 L20,29.5 L16.5,33.5 L13,29.5 L9,33 V18 Q9,6 20,6 Z" fill={c} opacity={0.92} />
          <circle cx={15} cy={17} r={2.4} fill={D} />
          <circle cx={25} cy={17} r={2.4} fill={D} />
          <ellipse cx={20} cy={24} rx={2.2} ry={3} fill={D} opacity={0.7} />
        </g>
      );
    case 'eye':
      return (
        <g>
          <path d="M4,20 Q20,5 36,20 Q20,35 4,20 Z" fill={W} opacity={0.92} />
          <circle cx={20} cy={20} r={7} fill={c} />
          <circle cx={20} cy={20} r={3} fill={D} />
          <circle cx={22} cy={18} r={1.1} fill={W} />
        </g>
      );
    case 'gourd':
      return (
        <g>
          <circle cx={20} cy={13.5} r={6} fill={c} />
          <circle cx={20} cy={27} r={9} fill={c} />
          <rect x={17} y={17} width={6} height={5} fill={c} />
          {line('M16,8.5 Q20,5 24,8.5', D, 1.6, 0.6)}
          {line('M20,5.5 V3.5', W, 1.8)}
          <ellipse cx={16.5} cy={26} rx={2.2} ry={3.6} fill={W} opacity={0.45} />
        </g>
      );
    case 'bell':
      return (
        <g>
          <path d="M20,7 Q9,9 9,22 L6,29 H34 L31,22 Q31,9 20,7 Z" fill={c} />
          {line('M13,15 Q20,11 27,15', W, 1.6, 0.6)}
          <circle cx={20} cy={32} r={2.6} fill={W} />
          {line('M20,7 V4', W, 2)}
        </g>
      );
    case 'mountain':
      return (
        <g>
          <path d="M5,33 L15,14 L21,24 L26.5,17 L35,33 Z" fill={c} />
          <path d="M15,14 L11.5,21 L15,19.5 L18,22 Z" fill={W} opacity={0.8} />
          <circle cx={30} cy={10} r={3.4} fill={W} opacity={0.9} />
        </g>
      );
    case 'bagua':
      return (
        <g>
          <circle cx={20} cy={20} r={13} fill="none" stroke={c} strokeWidth={2.2} />
          {line('M20,5.5 V9 M20,31 V34.5 M5.5,20 H9 M31,20 H34.5 M9.8,9.8 L12.3,12.3 M27.7,27.7 L30.2,30.2 M30.2,9.8 L27.7,12.3 M12.3,27.7 L9.8,30.2', c, 1.8)}
          <circle cx={20} cy={20} r={6} fill={W} />
          <path d="M20,14 A6,6 0 0 1 20,26 A3,3 0 0 1 20,20 A3,3 0 0 0 20,14 Z" fill={D} />
        </g>
      );
    case 'breath':
      return (
        <g>
          {line('M7,14 Q19,5 28,12 Q34,18 26,22', c, 2.6)}
          {line('M10,24 Q18,19 24,26 Q28,31 21,33', W, 2.2, 0.9)}
          {line('M7,32 Q12,28 16,30', c, 2, 0.7)}
        </g>
      );
    case 'formation':
      return (
        <g>
          <circle cx={20} cy={20} r={13.5} fill="none" stroke={c} strokeWidth={1.8} opacity={0.8} />
          {line('M20,7 L31,26 H9 Z M20,33 L9,14 H31 Z', c, 2)}
          <circle cx={20} cy={20} r={2.4} fill={W} />
        </g>
      );
    case 'leaf':
      return (
        <g>
          <path d="M7,31 Q6,11 31,8 Q33,29 12,33 Z" fill={c} />
          {line('M9,31 L27,12', W, 1.6, 0.85)}
          {line('M16,24 L15,17 M21,19 L24,24', W, 1.2, 0.6)}
        </g>
      );
    case 'recoil':
      return (
        <g>
          {line('M30,13 A11.5,11.5 0 1 0 31,27', c, 3)}
          <path d="M32,30 L35,21 L26,24 Z" fill={c} />
          <circle cx={20} cy={20} r={3.2} fill={W} />
        </g>
      );
    case 'drop':
      return (
        <g>
          <path d="M20,5 Q31,17 31,24 A11,11 0 0 1 9,24 Q9,17 20,5 Z" fill={c} />
          <ellipse cx={15.5} cy={24} rx={2.4} ry={4} fill={W} opacity={0.5} />
        </g>
      );
    case 'stars':
      return (
        <g>
          {line('M9,27 L15,14 L24,20 L30,8 L32,29', c, 1.6, 0.9)}
          {[
            [9, 27],
            [15, 14],
            [24, 20],
            [30, 8],
            [32, 29],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={2.8} fill={W} />
          ))}
        </g>
      );
    case 'taiji':
      return (
        <g>
          <circle cx={20} cy={20} r={13.5} fill={W} />
          <path d="M20,6.5 A13.5,13.5 0 0 1 20,33.5 A6.75,6.75 0 0 1 20,20 A6.75,6.75 0 0 0 20,6.5 Z" fill={D} />
          <circle cx={20} cy={13.2} r={2.1} fill={D} />
          <circle cx={20} cy={26.8} r={2.1} fill={W} />
          <circle cx={20} cy={20} r={13.5} fill="none" stroke={c} strokeWidth={1.6} />
        </g>
      );
  }
}

// ---------- Bảng tra: mỗi võ kỹ / công pháp một họa tiết và một màu ----------

const SKILL_NAMES = Object.fromEntries(Object.values(SKILLS).map((d) => [d.id, d.name])) as Record<SkillId, string>;

const SKILL_ICONS: Record<SkillId, { m: Motif; c: string }> = {
  kiem_pha_thien: { m: 'slash', c: '#7fc8ff' },
  kiem_phan_quang: { m: 'triple', c: '#9fd0ff' },
  kiem_y: { m: 'swordup', c: '#ffd66b' },
  kiem_van_kiem: { m: 'fan', c: '#7fc8ff' },
  the_ba_vuong: { m: 'fist', c: '#e0a050' },
  the_kim_cuong: { m: 'shield', c: '#6fb2ff' },
  the_huyet_khi: { m: 'heal', c: '#7fcf8a' },
  the_thien_cuong: { m: 'quake', c: '#e0a050' },
  phap_liet_hoa: { m: 'flame', c: '#ff7a3d' },
  phap_bang_phong: { m: 'ice', c: '#a8e4ff' },
  phap_chuong_tam_loi: { m: 'bolt', c: '#c08cff' },
  phap_ngu_loi: { m: 'bolts', c: '#c08cff' },
  chung_lang_ba: { m: 'wave', c: '#7fe0c8' },
  chung_thanh_tam: { m: 'lotus', c: '#f08aa8' },
  chung_hap_tinh: { m: 'vortex', c: '#d04b6a' },
  m_hu_trang: { m: 'moon', c: '#e8e0c0' },
  m_doc_nha: { m: 'fang', c: '#9be37a' },
  m_huyet_hap: { m: 'fang', c: '#e04a4a' },
  m_thiet_bich: { m: 'shield', c: '#aab4bd' },
  m_yeu_hoa: { m: 'flame', c: '#ff9a3d' },
  m_ma_dao: { m: 'slash', c: '#c8404c' },
  m_pha_giap: { m: 'claw', c: '#c9b98f' },
  m_loi_bao: { m: 'bolt', c: '#b58cff' },
  m_cau_hon: { m: 'ghost', c: '#a6f5c8' },
  m_kiem_khi: { m: 'triple', c: '#9fd0ff' },
  m_hon_don: { m: 'eye', c: '#c48cff' },
  m_phe_hu: { m: 'vortex', c: '#a66bff' },
  n_phi_kiem: { m: 'slash', c: '#7fc8ff' },
  n_ho_lo: { m: 'gourd', c: '#e0a050' },
  n_linh_chung: { m: 'bell', c: '#ffd66b' },
};

const TECH_ICONS: Record<TechId, { m: Motif; c: string }> = {
  kiem_0: { m: 'swordup', c: '#7fc8ff' },
  kiem_1: { m: 'swordup', c: '#7fc8ff' },
  kiem_2: { m: 'swordup', c: '#7fc8ff' },
  kiem_3: { m: 'swordup', c: '#7fc8ff' },
  the_0: { m: 'mountain', c: '#e0a050' },
  the_1: { m: 'mountain', c: '#e0a050' },
  the_2: { m: 'mountain', c: '#e0a050' },
  the_3: { m: 'mountain', c: '#e0a050' },
  phap_0: { m: 'bagua', c: '#c08cff' },
  phap_1: { m: 'bagua', c: '#c08cff' },
  phap_2: { m: 'bagua', c: '#c08cff' },
  phap_3: { m: 'bagua', c: '#c08cff' },
  dan_khi: { m: 'breath', c: '#7fe0c8' },
  quy_tuc: { m: 'moon', c: '#e8e0c0' },
  tu_linh: { m: 'formation', c: '#ffd66b' },
  than_thuc: { m: 'eye', c: '#c48cff' },
  liem_tuc: { m: 'leaf', c: '#7fcf8a' },
  kim_chung: { m: 'bell', c: '#e0a050' },
  phan_chan: { m: 'recoil', c: '#ff9a5c' },
  phe_huyet: { m: 'drop', c: '#e04a4a' },
  thien_co: { m: 'stars', c: '#6fb2ff' },
  can_khon: { m: 'taiji', c: '#ffd66b' },
};

/** Tìm võ kỹ theo tên (nhật ký trận đấu chỉ ghi tên chiêu) */
export function skillIdByName(name: string): SkillId | undefined {
  return (Object.keys(SKILL_ICONS) as SkillId[]).find((id) => SKILL_NAMES[id] === name);
}

/** Màu khung theo phẩm cấp, khớp với nhãn .grade-N */
export const GRADE_COLORS = ['#c9b98f', '#7fcf8a', '#6fb2ff', '#ffb04a'];

const sizeStyle = (size: number) => ({ width: size, height: size });

function Badge({ x, y, text, color, fill = D }: { x: number; y: number; text: string; color: string; fill?: string }) {
  const long = text.length > 1;
  return (
    <g>
      <circle cx={x} cy={y} r={long ? 7 : 6} fill={fill} stroke={color} strokeWidth={1.2} />
      <text x={x} y={y + 3} textAnchor="middle" fontSize={long ? 8 : 9} fontWeight={700} fill={color} fontFamily="system-ui, sans-serif">
        {text}
      </text>
    </g>
  );
}

export function SkillIcon({
  id,
  level,
  order,
  size = 40,
  dim = false,
}: {
  id: SkillId;
  level?: number;
  /** Thứ tự ưu tiên trong ô võ kỹ (1, 2, 3) */
  order?: number;
  size?: number;
  dim?: boolean;
}) {
  const { m, c } = SKILL_ICONS[id];
  return (
    <Art k={`skills/${id}`} alt="" className="art-icon">
      <svg
        className={`art-icon skill-icon ${dim ? 'dim' : ''}`}
        style={{ color: c, ...sizeStyle(size) }}
        viewBox="0 0 40 40"
        aria-hidden="true"
      >
        <rect x={1} y={1} width={38} height={38} rx={8} fill={D} stroke={c} strokeOpacity={0.7} />
        <rect x={1} y={1} width={38} height={38} rx={8} fill={c} opacity={0.12} />
        <circle cx={20} cy={20} r={16.5} fill="none" stroke={c} strokeOpacity={0.3} />
        <Glyph m={m} c={c} />
        {level !== undefined && <Badge x={32} y={32} text={String(level)} color={c} />}
        {order !== undefined && <Badge x={8} y={8} text={String(order)} color="#1a140a" fill="#d8b25a" />}
      </svg>
    </Art>
  );
}

export function TechIcon({
  id,
  grade,
  level,
  size = 40,
  dim = false,
}: {
  id: TechId;
  grade: number;
  level?: number;
  size?: number;
  dim?: boolean;
}) {
  const { m, c } = TECH_ICONS[id];
  const g = GRADE_COLORS[grade];
  return (
    <Art k={`techs/${id}`} alt="" className="art-icon">
      <svg
        className={`art-icon tech-icon ${grade >= 3 ? 'glow' : ''} ${dim ? 'dim' : ''}`}
        style={{ color: g, ...sizeStyle(size) }}
        viewBox="0 0 40 40"
        aria-hidden="true"
      >
        <rect x={1} y={1} width={38} height={38} rx={8} fill={D} stroke={g} strokeWidth={1.6} strokeOpacity={0.85} />
        <rect x={1} y={1} width={38} height={38} rx={8} fill={g} opacity={0.1} />
        {/* Hai trục cuộn trên và dưới: nhận ra ngay là công pháp, khác với võ kỹ */}
        <rect x={6} y={3.5} width={28} height={2.6} rx={1.3} fill={g} opacity={0.75} />
        <rect x={6} y={33.9} width={28} height={2.6} rx={1.3} fill={g} opacity={0.75} />
        <g transform="translate(20,20) scale(0.82) translate(-20,-20)">
          <Glyph m={m} c={c} />
        </g>
        {/* Phẩm cấp: số chấm */}
        {Array.from({ length: grade + 1 }, (_, i) => (
          <circle key={i} cx={20 - grade * 2.6 + i * 5.2} cy={31.4} r={1.35} fill={g} />
        ))}
        {level !== undefined && <Badge x={32} y={8} text={String(level)} color={g} />}
      </svg>
    </Art>
  );
}
