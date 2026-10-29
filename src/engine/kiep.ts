// Thiên Kiếp: khi đột phá lên Kim Đan trở đi, sét đánh xuống từng đạo; sống sót mới đột phá thành công.

import { REALMS } from './data';
import { enemyFor, playerStats } from './combat';
import { levelInfo, type GameState } from './state';

/** Cảnh giới (chỉ số REALMS) đầu tiên có Thiên Kiếp */
export const FIRST_KIEP_REALM = 2;

/** Thất bại khi độ kiếp mất phần tu vi này */
export const KIEP_FAIL_LOSS = 0.4;
export const KIEP_GRADE_NAMES = ['Hạ Phẩm', 'Trung Phẩm', 'Thượng Phẩm', 'Cực Phẩm'];
/** Bonus vĩnh viễn mỗi lần độ kiếp theo phẩm: khí huyết và phòng thủ; công bằng một nửa */
export const KIEP_BONUS_BY_GRADE = [0.02, 0.035, 0.055, 0.08];
/** Phần khí huyết còn lại tối thiểu để đạt phẩm 1, 2, 3 */
export const KIEP_GRADE_THRESHOLDS = [0.2, 0.45, 0.7];

export interface KiepReport {
  /** Cảnh giới đích (chỉ số REALMS) */
  realm: number;
  pass: boolean;
  /** Khí huyết còn lại (phần của tối đa) sau từng đạo lôi; dừng ở đạo làm ngã */
  hp: number[];
  bolts: number;
  /** Phẩm độ kiếp, chỉ có khi vượt qua */
  grade: number | null;
}

/** Cảnh giới đích khi đột phá từ bình cảnh hiện tại */
export const kiepRealmOf = (s: GameState): number => levelInfo(s.level + 1).realm;

/** Đột phá lên cảnh giới này có Thiên Kiếp không */
export const hasKiep = (realm: number) => realm >= FIRST_KIEP_REALM;

/** Số đạo lôi: Kim Đan 4 đạo, tăng dần tới 7 đạo ở Độ Kiếp */
export const kiepBoltCount = (realm: number) => 3 + Math.ceil(realm / 2);

export function kiepBolts(realm: number): number[] {
  const atk = enemyFor(REALMS[realm].gateFloor).atk;
  return Array.from({ length: kiepBoltCount(realm) }, (_, i) => atk * (1.8 + 0.28 * Math.min(i, 3) + 0.09 * Math.max(0, i - 3)));
}

export function kiepGrade(hpFrac: number): number {
  return KIEP_GRADE_THRESHOLDS.filter((t) => hpFrac >= t).length;
}

/** Mô phỏng một lần độ kiếp bằng chỉ số hiện tại */
export function runKiep(s: GameState, realm: number, now: number, rng: () => number): KiepReport {
  const p = playerStats(s, now);
  const bolts = kiepBolts(realm);
  let hp = p.hp;
  const hist: number[] = [];
  for (const a of bolts) {
    if (rng() >= (p.dodge ?? 0)) hp -= ((a * a) / (a + p.def)) * (0.9 + 0.2 * rng());
    hist.push(Math.max(0, hp / p.hp));
    if (hp <= 0) return { realm, pass: false, hp: hist, bolts: bolts.length, grade: null };
  }
  return { realm, pass: true, hp: hist, bolts: bolts.length, grade: kiepGrade(hp / p.hp) };
}

/** Ước tính cho giao diện: tỉ lệ vượt kiếp và phẩm kỳ vọng (mô phỏng nhanh) */
export function estimateKiep(s: GameState, realm: number, now: number, runs = 100) {
  let pass = 0;
  const grades = [0, 0, 0, 0];
  for (let i = 0; i < runs; i++) {
    const r = runKiep(s, realm, now, Math.random);
    if (r.pass) {
      pass++;
      grades[r.grade!]++;
    }
  }
  return { bolts: kiepBoltCount(realm), pass: pass / runs, grades: grades.map((g) => g / runs) };
}

/** Bonus vĩnh viễn từ các Thiên Kiếp đã qua */
export function kiepMods(s: GameState) {
  let v = 0;
  for (const g of Object.values(s.kiep)) v += KIEP_BONUS_BY_GRADE[g];
  return { hpPct: v, defPct: v, atkPct: v / 2 };
}
