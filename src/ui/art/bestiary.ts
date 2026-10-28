// Ngoại hình từng loại quái: dạng cơ thể + màu + chi tiết. Tên khớp với ZONES trong data.ts.

export type Archetype = 'beast' | 'bulky' | 'serpent' | 'bat' | 'bird' | 'insect' | 'humanoid' | 'ghost' | 'eldritch';

export interface MonsterLook {
  type: Archetype;
  /** Màu mắt / linh quang */
  eye: string;
  /** Màu pha vào thân mực */
  tint: string;
  horns?: boolean;
  spikes?: boolean;
  tails?: number;
  weapon?: 'halberd' | 'sword' | 'chain' | 'cauldron' | 'claws';
  eyes?: number;
  crown?: boolean;
  /** Vết nứt phát sáng (khôi lỗi, tượng đá) */
  cracks?: boolean;
}

const GREEN = '#9be37a';
const RED = '#ff4a3d';
const FIRE = '#ffae3d';
const VIOLET = '#c48cff';
const BLUE = '#7fd0ff';
const GHOST = '#a6f5c8';
const GOLD = '#ffd66b';

export const BESTIARY: Record<string, MonsterLook> = {
  // Hắc Phong Lâm
  'Thanh Lang': { type: 'beast', eye: GREEN, tint: '#3d5040' },
  'Độc Phong': { type: 'insect', eye: GREEN, tint: '#5a5a2a' },
  'Hắc Hùng': { type: 'bulky', eye: FIRE, tint: '#2c2622' },
  'Thanh Lang Đầu Lĩnh': { type: 'beast', eye: GREEN, tint: '#2f4a38', spikes: true },
  'Lang Vương': { type: 'beast', eye: GOLD, tint: '#3a4a4a', spikes: true, horns: true },
  // Huyết Sắc Cấm Địa
  'Huyết Bức': { type: 'bat', eye: RED, tint: '#4a2424' },
  'Thi Khôi': { type: 'humanoid', eye: GREEN, tint: '#3c3a30', weapon: 'claws' },
  'Huyết Mãng': { type: 'serpent', eye: GOLD, tint: '#5a2020' },
  'Huyết Thi': { type: 'humanoid', eye: RED, tint: '#4a2020', weapon: 'claws' },
  'Huyết Mãng Vương': { type: 'serpent', eye: GOLD, tint: '#6a1818', horns: true },
  // Vạn Yêu Cốc
  'Hỏa Hồ': { type: 'beast', eye: FIRE, tint: '#6a3418', tails: 1 },
  'Thiết Bối Viên': { type: 'bulky', eye: FIRE, tint: '#3a3a40', spikes: true },
  'Lôi Ưng': { type: 'bird', eye: BLUE, tint: '#2c3448' },
  'Tam Vĩ Yêu Hồ': { type: 'beast', eye: VIOLET, tint: '#5a3048', tails: 3 },
  'Yêu Cốc Chi Chủ': { type: 'beast', eye: GOLD, tint: '#6a2a18', tails: 6, horns: true },
  // Cổ Ma Chiến Trường
  'Ma Binh': { type: 'humanoid', eye: RED, tint: '#2e2830', weapon: 'halberd' },
  'Oán Hồn': { type: 'ghost', eye: RED, tint: '#3a3440' },
  'Cốt Ma': { type: 'humanoid', eye: VIOLET, tint: '#4a4640', weapon: 'claws', horns: true },
  'Ma Tướng': { type: 'humanoid', eye: RED, tint: '#3a1e28', weapon: 'halberd', horns: true },
  'Cổ Ma Thống Lĩnh': { type: 'humanoid', eye: RED, tint: '#40141c', weapon: 'sword', horns: true, crown: true },
  // Thiên Lôi Hải
  'Hải Yêu': { type: 'serpent', eye: BLUE, tint: '#1e3a48' },
  'Phong Bạo Linh': { type: 'ghost', eye: BLUE, tint: '#3a5260' },
  'Lôi Giao': { type: 'serpent', eye: BLUE, tint: '#24304e', horns: true },
  'Lôi Linh Cự Thú': { type: 'bulky', eye: BLUE, tint: '#22304a', horns: true },
  'Lôi Giao Vương': { type: 'serpent', eye: GOLD, tint: '#1c2a5a', horns: true, spikes: true },
  // U Minh Giới
  'U Hồn': { type: 'ghost', eye: GHOST, tint: '#2e4038' },
  'Minh Xà': { type: 'serpent', eye: GHOST, tint: '#1e2e28' },
  'Quỷ Tướng': { type: 'humanoid', eye: GHOST, tint: '#1e2a26', weapon: 'halberd', horns: true },
  'Câu Hồn Sứ': { type: 'ghost', eye: GHOST, tint: '#24302c', weapon: 'chain' },
  'U Minh Quỷ Đế': { type: 'humanoid', eye: GHOST, tint: '#14201c', weapon: 'chain', horns: true, crown: true },
  // Thái Cổ Tiên Phủ
  'Khôi Lỗi Hộ Pháp': { type: 'bulky', eye: GOLD, tint: '#5a4a2a', cracks: true },
  'Kiếm Linh': { type: 'ghost', eye: BLUE, tint: '#4a5a6a', weapon: 'sword' },
  'Tiên Phủ Thủ Vệ': { type: 'humanoid', eye: GOLD, tint: '#4a3e22', weapon: 'halberd' },
  'Đan Lô Khí Linh': { type: 'ghost', eye: FIRE, tint: '#5a3a1e', weapon: 'cauldron' },
  'Tiên Phủ Khí Linh': { type: 'ghost', eye: GOLD, tint: '#6a5420', weapon: 'sword', crown: true },
  // Hỗn Độn Hư Không
  'Hư Không Thú': { type: 'eldritch', eye: VIOLET, tint: '#2a2040', eyes: 3 },
  'Hỗn Độn Ma': { type: 'eldritch', eye: RED, tint: '#301830', eyes: 5 },
  'Thiên Ngoại Tà Ma': { type: 'eldritch', eye: GHOST, tint: '#1e2a3a', eyes: 7 },
  'Phệ Tinh Trùng': { type: 'insect', eye: VIOLET, tint: '#2a1e40' },
  'Hỗn Độn Cổ Thần': { type: 'eldritch', eye: GOLD, tint: '#2a1030', eyes: 9, crown: true },
};

const ARCHETYPES: Archetype[] = ['beast', 'bulky', 'serpent', 'bat', 'bird', 'insect', 'humanoid', 'ghost', 'eldritch'];

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Quái chưa có trong bảng vẫn có ngoại hình ổn định theo tên */
export function lookFor(name: string): MonsterLook {
  return BESTIARY[name] ?? { type: ARCHETYPES[hashString(name) % ARCHETYPES.length], eye: RED, tint: '#3a3330' };
}
