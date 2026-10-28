// Nhiệm vụ chủ tuyến: một chuỗi mục tiêu ngắn dạy dần từng hệ thống, mỗi nhiệm vụ có thưởng.
// Điều kiện hoàn thành tính thẳng từ trạng thái game (không cần theo dõi riêng); chỉ lưu những nhiệm vụ đã nhận thưởng.

import type { PillId } from './data';
import { SLOTS } from './data';
import { itemPlus, setCounts } from './combat';
import { type GameState, levelInfo } from './state';

export type TabId = 'cultivate' | 'dungeon' | 'dwelling' | 'character' | 'shop';
export type CharSub = 'overview' | 'technique' | 'skills' | 'gear';

/** Nơi dẫn người chơi tới để làm nhiệm vụ / gợi ý */
export interface GoTo {
  tab: TabId;
  sub?: CharSub;
}

export interface Reward {
  /** Tính theo đơn vị cảnh giới của nhiệm vụ: thực nhận = stones × 2^QUEST_TIER[id], không phụ thuộc lúc nhận */
  stones?: number;
  fragments?: number;
  pills?: Partial<Record<PillId, number>>;
}

export interface QuestDef {
  id: string;
  title: string;
  desc: string;
  go: GoTo;
  done: (s: GameState) => boolean;
  /** Tiến độ hiển thị khi chưa xong */
  progress?: (s: GameState) => string;
  reward: Reward;
}

const realm = (s: GameState) => levelInfo(s.level).realm;
const ratio = (cur: number, goal: number) => `${Math.min(cur, goal)}/${goal}`;
const hasGear = (s: GameState) => SLOTS.some((slot) => s.gear[slot]);
const anyPlus = (s: GameState) =>
  Math.max(0, ...SLOTS.map((slot) => (s.gear[slot] ? itemPlus(s.gear[slot]!) : 0)), ...s.bag.map(itemPlus));

export interface QuestState {
  /** Mã các nhiệm vụ đã nhận thưởng */
  claimed: string[];
}

export const QUESTS: QuestDef[] = [
  {
    id: 'nhap_mon',
    title: 'Nhập môn',
    desc: 'Tu luyện tới Luyện Khí Tầng 3.',
    go: { tab: 'cultivate' },
    done: (s) => s.level >= 2,
    progress: (s) => `Tầng ${ratio(s.level + 1, 3)}`,
    reward: { stones: 60 },
  },
  {
    id: 'be_quan',
    title: 'Tĩnh tọa',
    desc: 'Hoàn thành một lần bế quan (Tiểu Bế Quan 10 phút là đủ).',
    go: { tab: 'cultivate' },
    done: (s) => s.stats.seclusions >= 1,
    progress: (s) => ratio(s.stats.seclusions, 1),
    reward: { stones: 40, pills: { tuKhi: 1 } },
  },
  {
    id: 'tang_1',
    title: 'Thử sức',
    desc: 'Vượt tầng 1 của Bí Cảnh.',
    go: { tab: 'dungeon' },
    done: (s) => s.floor >= 1,
    progress: (s) => ratio(s.floor, 1),
    reward: { fragments: 2 },
  },
  {
    id: 'mac_do',
    title: 'Khoác pháp bảo',
    desc: 'Mặc món pháp bảo đầu tiên (nhặt được khi vượt Bí Cảnh).',
    go: { tab: 'character', sub: 'gear' },
    done: hasGear,
    reward: { stones: 100 },
  },
  {
    id: 'dan_khi',
    title: 'Dẫn khí nhập thể',
    desc: 'Tu luyện Dẫn Khí Quyết lên tầng 1 bằng tàn quyển.',
    go: { tab: 'character', sub: 'technique' },
    done: (s) => (s.techs.dan_khi ?? 0) >= 1,
    reward: { fragments: 3 },
  },
  {
    id: 'gieo_hat',
    title: 'Gieo hạt giống',
    desc: 'Gieo cây đầu tiên ở Linh Điền (tab Động Phủ). Cây chín cả khi bạn vắng mặt.',
    go: { tab: 'dwelling' },
    done: (s) => s.stats.planted >= 1,
    reward: { stones: 60 },
  },
  {
    id: 'thu_hoach',
    title: 'Thu hoạch',
    desc: 'Thu hoạch 10 thảo dược. Bật Tự thu hoạch để cây tự chín rồi tự gieo lại.',
    go: { tab: 'dwelling' },
    done: (s) => s.stats.harvested >= 10,
    progress: (s) => ratio(s.stats.harvested, 10),
    reward: { stones: 100 },
  },
  {
    id: 'tang_3',
    title: 'Cửa ải Trúc Cơ',
    desc: 'Vượt Bí Cảnh tầng 3, điều kiện để đột phá Trúc Cơ.',
    go: { tab: 'dungeon' },
    done: (s) => s.floor >= 3,
    progress: (s) => ratio(s.floor, 3),
    reward: { pills: { phaCanh: 1 } },
  },
  {
    id: 'truc_co',
    title: 'Trúc Cơ',
    desc: 'Đột phá lên Trúc Cơ.',
    go: { tab: 'cultivate' },
    done: (s) => realm(s) >= 1,
    reward: { stones: 200, fragments: 4 },
  },
  {
    id: 'huong_tu',
    title: 'Chọn đạo',
    desc: 'Chọn hướng tu: Kiếm Tu, Thể Tu hoặc Pháp Tu.',
    go: { tab: 'character', sub: 'technique' },
    done: (s) => s.path !== null,
    reward: { fragments: 5 },
  },
  {
    id: 'vo_ky',
    title: 'Tâm đắc võ kỹ',
    desc: 'Mang theo võ kỹ đầu tiên (học ngay khi chọn hướng tu).',
    go: { tab: 'character', sub: 'skills' },
    done: (s) => s.loadout.length >= 1,
    reward: { fragments: 3 },
  },
  {
    id: 'ban_menh',
    title: 'Bản mệnh',
    desc: 'Luyện một bản mệnh pháp bảo (mở ở Trúc Cơ).',
    go: { tab: 'character', sub: 'gear' },
    done: (s) => s.natal !== null,
    reward: { stones: 150, fragments: 3 },
  },
  {
    id: 'xay_dan_phong',
    title: 'Đan Phòng',
    desc: 'Xây Đan Phòng để luyện đan từ thảo dược.',
    go: { tab: 'dwelling' },
    done: (s) => s.dwelling.levels.dan_phong >= 1,
    reward: { stones: 150 },
  },
  {
    id: 'luyen_dan',
    title: 'Viên đan đầu tiên',
    desc: 'Luyện xong một viên đan.',
    go: { tab: 'dwelling' },
    done: (s) => s.stats.crafted >= 1,
    reward: { fragments: 3 },
  },
  {
    id: 'nhat_do',
    title: 'Nhặt nhạnh',
    desc: 'Nhặt được 15 pháp bảo (lịch luyện treo máy ở tầng đã vượt rất hiệu quả).',
    go: { tab: 'dungeon' },
    done: (s) => s.stats.itemsFound >= 15,
    progress: (s) => ratio(s.stats.itemsFound, 15),
    reward: { stones: 200 },
  },
  {
    id: 'cuong_hoa',
    title: 'Tôi luyện',
    desc: 'Cường hóa một pháp bảo lên +3.',
    go: { tab: 'character', sub: 'gear' },
    done: (s) => anyPlus(s) >= 3,
    progress: (s) => `+${Math.min(anyPlus(s), 3)}/+3`,
    reward: { stones: 300 },
  },
  {
    id: 'tang_5',
    title: 'Hạ Lang Vương',
    desc: 'Vượt Bí Cảnh tầng 5, thủ lĩnh đầu tiên và cũng là cửa ải Kim Đan.',
    go: { tab: 'dungeon' },
    done: (s) => s.floor >= 5,
    progress: (s) => ratio(s.floor, 5),
    reward: { fragments: 6, pills: { phaCanh: 1 } },
  },
  {
    id: 'pha_canh_dan',
    title: 'Tự tay luyện Phá Cảnh Đan',
    desc: 'Luyện một viên Phá Cảnh Đan (cần cả thảo dược hiếm).',
    go: { tab: 'dwelling' },
    done: (s) => s.stats.craftedBreak >= 1,
    reward: { stones: 300 },
  },
  {
    id: 'kim_dan',
    title: 'Kết đan',
    desc: 'Đột phá lên Kim Đan.',
    go: { tab: 'cultivate' },
    done: (s) => realm(s) >= 2,
    reward: { stones: 400, fragments: 6 },
  },
  {
    id: 'hop_bo',
    title: 'Hợp bộ',
    desc: 'Mặc 2 món pháp bảo cùng bộ (cùng khu bí cảnh) để nhận thêm thuộc tính.',
    go: { tab: 'character', sub: 'gear' },
    done: (s) => Math.max(...setCounts(s)) >= 2,
    reward: { stones: 400 },
  },
  {
    id: 'tu_linh_tran',
    title: 'Tụ Linh Trận',
    desc: 'Xây Tụ Linh Trận để tu luyện nhanh hơn mọi lúc.',
    go: { tab: 'dwelling' },
    done: (s) => s.dwelling.levels.tu_linh >= 1,
    reward: { stones: 200 },
  },
  {
    id: 'hai_phu',
    title: 'Hai công pháp phụ',
    desc: 'Mang theo 2 công pháp phụ.',
    go: { tab: 'character', sub: 'technique' },
    done: (s) => s.subTechs.length >= 2,
    progress: (s) => ratio(s.subTechs.length, 2),
    reward: { fragments: 6 },
  },
  {
    id: 'dan_thuong_pham',
    title: 'Thượng Phẩm',
    desc: 'Luyện được một viên đan Thượng Phẩm (nâng Đan Phòng để dễ ra phẩm cao).',
    go: { tab: 'dwelling' },
    done: (s) => s.stats.crafted3 >= 1,
    reward: { fragments: 6 },
  },
  {
    id: 'ban_menh_10',
    title: 'Bản mệnh lớn dần',
    desc: 'Luyện hóa pháp bảo thừa để bản mệnh đạt cấp 10 (tiến hóa lên Linh Khí).',
    go: { tab: 'character', sub: 'gear' },
    done: (s) => (s.natal?.level ?? 0) >= 10,
    progress: (s) => ratio(s.natal?.level ?? 0, 10),
    reward: { stones: 500, fragments: 8 },
  },
  {
    id: 'tang_10',
    title: 'Nửa chặng đầu',
    desc: 'Vượt Bí Cảnh tầng 10.',
    go: { tab: 'dungeon' },
    done: (s) => s.floor >= 10,
    progress: (s) => ratio(s.floor, 10),
    reward: { stones: 500, pills: { phaCanh: 1 } },
  },
  {
    id: 'dong_phu_hung_thinh',
    title: 'Động phủ hưng thịnh',
    desc: 'Nâng tổng cấp các công trình động phủ lên 12.',
    go: { tab: 'dwelling' },
    done: (s) => Object.values(s.dwelling.levels).reduce((a, b) => a + b, 0) >= 12,
    progress: (s) => ratio(Object.values(s.dwelling.levels).reduce((a, b) => a + b, 0), 12),
    reward: { stones: 500 },
  },
  {
    id: 'nguyen_anh',
    title: 'Nguyên Anh',
    desc: 'Đột phá lên Nguyên Anh.',
    go: { tab: 'cultivate' },
    done: (s) => realm(s) >= 3,
    reward: { stones: 600, fragments: 8 },
  },
  {
    id: 'ba_vo_ky',
    title: 'Ba chiêu hợp nhất',
    desc: 'Mang đủ 3 võ kỹ (mở ô thứ 3 ở Nguyên Anh).',
    go: { tab: 'character', sub: 'skills' },
    done: (s) => s.loadout.length >= 3,
    progress: (s) => ratio(s.loadout.length, 3),
    reward: { fragments: 8 },
  },
  {
    id: 'tang_20',
    title: 'Bí cảnh sâu thẳm',
    desc: 'Vượt Bí Cảnh tầng 20.',
    go: { tab: 'dungeon' },
    done: (s) => s.floor >= 20,
    progress: (s) => ratio(s.floor, 20),
    reward: { stones: 800, fragments: 10 },
  },
  {
    id: 'hoa_than',
    title: 'Hóa Thần',
    desc: 'Đột phá lên Hóa Thần.',
    go: { tab: 'cultivate' },
    done: (s) => realm(s) >= 4,
    reward: { stones: 800, fragments: 10 },
  },
  {
    id: 'tang_30',
    title: 'Vạn Yêu Cốc đã lùi bước',
    desc: 'Vượt Bí Cảnh tầng 30.',
    go: { tab: 'dungeon' },
    done: (s) => s.floor >= 30,
    progress: (s) => ratio(s.floor, 30),
    reward: { stones: 1000, fragments: 12 },
  },
  {
    id: 'do_kiep',
    title: 'Độ Kiếp',
    desc: 'Đột phá lên Độ Kiếp, cảnh giới cuối cùng của nhân giới.',
    go: { tab: 'cultivate' },
    done: (s) => realm(s) >= 8,
    reward: { stones: 1500, fragments: 15 },
  },
  {
    id: 'tang_40',
    title: 'Chinh phục bí cảnh',
    desc: 'Vượt Bí Cảnh tầng 40.',
    go: { tab: 'dungeon' },
    done: (s) => s.floor >= 40,
    progress: (s) => ratio(s.floor, 40),
    reward: { stones: 3000, fragments: 30 },
  },
];

/** Cảnh giới mà nhiệm vụ nhắm tới (chỉ số REALMS), quyết định hệ số thưởng linh thạch; mặc định 0 */
export const QUEST_TIER: Record<string, number> = {
  truc_co: 1,
  pha_canh_dan: 1,
  tu_linh_tran: 1,
  dong_phu_hung_thinh: 3,
  huong_tu: 1,
  vo_ky: 1,
  ban_menh: 1,
  nhat_do: 1,
  cuong_hoa: 1,
  tang_5: 1,
  kim_dan: 2,
  hop_bo: 2,
  hai_phu: 2,
  ban_menh_10: 2,
  tang_10: 2,
  nguyen_anh: 3,
  ba_vo_ky: 3,
  tang_20: 3,
  hoa_than: 4,
  tang_30: 5,
  do_kiep: 7,
  tang_40: 7,
};

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
