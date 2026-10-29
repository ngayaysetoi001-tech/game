// Gợi ý "việc nên làm tiếp": đọc trạng thái game và chỉ ra 1–2 việc đáng làm nhất lúc này.
// Thuần hàm, không đổi trạng thái. Tỉ lệ thắng tầng kế tiếp do giao diện tính (mô phỏng) rồi truyền vào.

import { REALMS, SLOT_NAMES } from './data';
import {
  PLAYER_SKILLS,
  SKILLS,
  TECHS,
  breakthroughChance,
  MAX_LEVEL,
  estimateKiep,
  hasKiep,
  canBreakthrough,
  canBuyTech,
  canChoosePath,
  canForgeNatal,
  canLearnFromShop,
  canUpgradeSkill,
  canUpgradeTech,
  breakPillTotal,
  buildingLevel,
  canUpgradeBuilding,
  maxCraftable,
  plotCount,
  readyPlots,
  seedCost,
  plantableHerbs,
  gateFloorFor,
  isBottleneck,
  itemScore,
  levelInfo,
  requiredFor,
  skillSlotCount,
  type GameState,
  type GoTo,
} from './engine';

export interface Advice {
  text: string;
  go?: GoTo;
  goLabel?: string;
  tone: 'good' | 'warn' | 'info';
}

const MAX_ADVICE = 2;

export function advise(s: GameState, winChance: number | null): Advice[] {
  const out: Advice[] = [];
  const add = (a: Advice) => {
    if (out.length < MAX_ADVICE) out.push(a);
  };
  const realm = levelInfo(s.level).realm;
  const nextRealm = REALMS[Math.min(realm + 1, REALMS.length - 1)].name;
  const full = isBottleneck(s.level) && s.cultivation >= requiredFor(s.level);
  const gate = gateFloorFor(s);
  const nextFloor = s.floor + 1;
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  // 1. Đột phá
  const kiepRealm = isBottleneck(s.level) && s.level < MAX_LEVEL ? levelInfo(s.level + 1).realm : 0;
  const kiep = canBreakthrough(s) && hasKiep(kiepRealm) ? estimateKiep(s, kiepRealm, s.lastTick) : null;
  if (kiep && kiep.pass < 0.5) {
    add({
      tone: 'warn',
      text: `Đột phá ${nextRealm} có Thiên Kiếp ${kiep.bolts} đạo lôi, bạn chỉ vượt được ~${pct(kiep.pass)}. Nên tăng khí huyết, phòng thủ (pháp bảo, công pháp, bản mệnh) trước.`,
      go: { tab: 'character' },
      goLabel: 'Tăng chỉ số',
    });
  }
  if (canBreakthrough(s)) {
    add({
      tone: 'good',
      text: `Tu vi đã đầy bình cảnh: có thể đột phá ${nextRealm} (tỉ lệ ${pct(breakthroughChance(s, 0))}${kiep ? `, Thiên Kiếp vượt ~${pct(kiep.pass)}` : ''}).`,
      go: { tab: 'cultivate' },
      goLabel: 'Đột phá',
    });
  } else if (full && s.seclusion && s.floor >= gate) {
    add({ tone: 'warn', text: `Tu vi đã đầy: xuất quan để đột phá ${nextRealm}.`, go: { tab: 'cultivate' }, goLabel: 'Xuất quan' });
  } else if (full && s.floor < gate) {
    let text = `Tu vi đã đầy nhưng muốn đột phá ${nextRealm} phải vượt Bí Cảnh tầng ${gate} (đang ở tầng ${s.floor}).`;
    if (winChance !== null) {
      text +=
        winChance < 0.3
          ? ` Tầng ${nextFloor} còn quá mạnh (thắng ~${pct(winChance)}): lịch luyện ở tầng đã vượt để nhặt pháp bảo, nâng công pháp và võ kỹ.`
          : ` Khiêu chiến tầng ${nextFloor} (thắng ~${pct(winChance)}).`;
    }
    add({ tone: 'warn', text, go: { tab: 'dungeon' }, goLabel: 'Tới Bí Cảnh' });
  }

  // 2. Lựa chọn quan trọng chưa làm
  if (canChoosePath(s)) {
    add({
      tone: 'good',
      text: `Đã đạt Trúc Cơ: chọn hướng tu để học công pháp chính và võ kỹ.`,
      go: { tab: 'character', sub: 'technique' },
      goLabel: 'Chọn hướng tu',
    });
  }
  if (canForgeNatal(s)) {
    add({
      tone: 'good',
      text: 'Có thể luyện bản mệnh pháp bảo: một pháp bảo lớn lên cùng bạn và có chiêu riêng trong trận.',
      go: { tab: 'character', sub: 'gear' },
      goLabel: 'Luyện bản mệnh',
    });
  }

  // 3. Tài nguyên đang chờ dùng
  const better = s.bag.find((it) => {
    const eq = s.gear[it.slot];
    return !eq || itemScore(it) > itemScore(eq);
  });
  if (better) {
    add({
      tone: 'info',
      text: `Trong túi có ${SLOT_NAMES[better.slot]} tốt hơn đồ đang dùng${s.gear[better.slot] ? '' : ' (ô đang trống)'}.`,
      go: { tab: 'character', sub: 'gear' },
      goLabel: 'Xem pháp bảo',
    });
  }
  const skillUp = s.loadout.find((id) => canUpgradeSkill(s, id));
  if (skillUp) {
    add({
      tone: 'info',
      text: `Đủ tàn quyển và linh thạch để luyện võ kỹ 【${SKILLS[skillUp].name}】.`,
      go: { tab: 'character', sub: 'skills' },
      goLabel: 'Luyện võ kỹ',
    });
  }
  const techUp = [s.mainTech, ...s.subTechs].find((id) => id && canUpgradeTech(s, id));
  if (techUp) {
    add({
      tone: 'info',
      text: `Đủ tàn quyển và linh thạch để tu luyện công pháp 【${TECHS[techUp].name}】.`,
      go: { tab: 'character', sub: 'technique' },
      goLabel: 'Tu luyện công pháp',
    });
  }
  const buySkill = PLAYER_SKILLS.find((d) => canLearnFromShop(s, d.id));
  const buyTech = Object.values(TECHS).find((d) => canBuyTech(s, d.id));
  if (buySkill || buyTech) {
    add({
      tone: 'info',
      text: `Có thể mua bí kíp 【${(buySkill ?? buyTech)!.name}】 ở Phường Thị.`,
      go: { tab: 'shop' },
      goLabel: 'Tới Phường Thị',
    });
  }
  const freeSlots = skillSlotCount(s) - s.loadout.length;
  if (freeSlots > 0 && PLAYER_SKILLS.some((d) => s.skills[d.id] && !s.loadout.includes(d.id))) {
    add({
      tone: 'info',
      text: 'Còn ô võ kỹ trống: mang thêm võ kỹ đã học để chiến đấu mạnh hơn.',
      go: { tab: 'character', sub: 'skills' },
      goLabel: 'Mang võ kỹ',
    });
  }

  // 3b. Động phủ
  const ripe = readyPlots(s, s.lastTick);
  if (!s.auto.garden && ripe > 0) {
    add({
      tone: 'info',
      text: `Linh điền có ${ripe} ô đã chín: thu hoạch thảo dược (hoặc bật Tự thu hoạch để khỏi phải bấm).`,
      go: { tab: 'dwelling' },
      goLabel: 'Thu hoạch',
    });
  }
  const planted = s.dwelling.plots.filter((p, i) => p && i < plotCount(s)).length;
  if (planted < plotCount(s) && s.stones >= seedCost(plantableHerbs(s)[0])) {
    add({
      tone: 'info',
      text: `Linh điền còn ${plotCount(s) - planted} ô trống: gieo hạt để có thảo dược luyện đan.`,
      go: { tab: 'dwelling' },
      goLabel: 'Gieo hạt',
    });
  }
  if (isBottleneck(s.level) && breakPillTotal(s) < 3 && !s.dwelling.job && maxCraftable(s, 'phaCanh') >= 1) {
    add({
      tone: 'info',
      text: 'Đủ thảo dược để luyện Phá Cảnh Đan, giúp đột phá dễ hơn.',
      go: { tab: 'dwelling' },
      goLabel: 'Luyện đan',
    });
  }
  const unbuilt = (['dan_phong', 'tu_linh', 'linh_mach'] as const).find((id) => buildingLevel(s, id) === 0 && canUpgradeBuilding(s, id));
  if (unbuilt) {
    const names = { dan_phong: 'Đan Phòng để luyện đan', tu_linh: 'Tụ Linh Trận để tu luyện nhanh hơn', linh_mach: 'Linh Mạch để kiếm thêm linh thạch' };
    add({ tone: 'info', text: `Đủ linh thạch xây ${names[unbuilt]}.`, go: { tab: 'dwelling' }, goLabel: 'Xây dựng' });
  }

  // 4. Tận dụng thời gian
  if (winChance !== null && winChance >= 0.7 && !s.auto.climb && !s.seclusion) {
    add({
      tone: 'info',
      text: `Bạn thắng chắc tầng ${nextFloor} (~${pct(winChance)}): bật Tự động khiêu chiến để leo tầng cả khi vắng mặt.`,
      go: { tab: 'dungeon' },
      goLabel: 'Bật tự động',
    });
  }
  if (!s.seclusion && !s.farming && !full) {
    add({
      tone: 'info',
      text:
        s.floor > 0
          ? 'Nhân vật đang rảnh: bế quan để tu vi tăng nhanh, hoặc lịch luyện để nhặt pháp bảo và tàn quyển (cả hai chạy khi offline).'
          : 'Nhân vật đang rảnh: bế quan để tu vi tăng nhanh (chạy cả khi offline).',
      go: { tab: 'cultivate' },
      goLabel: 'Bế quan',
    });
  }

  if (!out.length) {
    add({ tone: 'info', text: 'Mọi thứ đang ổn. Cứ để game chạy: tu vi, linh thạch và pháp bảo sẽ tự tăng.' });
  }
  return out;
}
