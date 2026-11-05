// Bản 5.4: khảm ngọc và trân thú đi theo.

// ---------- Ngọc khảm ----------
// stat: chỉ số được cộng. pm: cộng vào hệ số % (atkPct, defPct, hpPct); còn lại cộng vào chỉ số trận (crit, dodge, ls).
// per[lv-1]: giá trị ở cấp 1..5. Ghép 3 viên cùng loại cùng cấp thành 1 viên cấp trên.
export const GEMS = {
  hong: { n: 'Hồng Ngọc', stat: 'atkPct', pm: true, t: 'Công', per: [0.03, 0.06, 0.1, 0.15, 0.22], col: '#e0484d' },
  lam: { n: 'Lam Ngọc', stat: 'defPct', pm: true, t: 'Thủ', per: [0.04, 0.08, 0.13, 0.19, 0.27], col: '#4a7fe0' },
  luc: { n: 'Lục Ngọc', stat: 'hpPct', pm: true, t: 'Sinh lực', per: [0.04, 0.08, 0.13, 0.19, 0.27], col: '#3fb56a' },
  hoang: { n: 'Hoàng Ngọc', stat: 'crit', t: 'Bạo kích', per: [0.02, 0.04, 0.065, 0.095, 0.13], col: '#e0b33c' },
  tu: { n: 'Tử Ngọc', stat: 'dodge', t: 'Né tránh', per: [0.015, 0.03, 0.05, 0.075, 0.1], col: '#a060e0' },
  hac: { n: 'Hắc Ngọc', stat: 'ls', t: 'Hút máu', per: [0.015, 0.03, 0.05, 0.075, 0.1], col: '#6b6f7a' },
};
export const GEM_IDS = Object.keys(GEMS);
export const GEM_MAX = 5;
export const GEM_LV_N = ['', 'Sơ', 'Trung', 'Thượng', 'Cực', 'Thiên'];
/** Số lỗ khảm theo phẩm: Hạ 0, Trung 1, Thượng 1, Cực 2, Thần thoại 3 */
export const SOCKETS = [0, 1, 1, 2, 3];
export const gemKey = (id, lv) => `${id}:${lv}`;
export const parseGem = (k) => { const [id, lv] = String(k).split(':'); return { id, lv: +lv, g: GEMS[id] }; };
export const gemName = (k) => { const { id, lv, g } = parseGem(k); return g ? `${g.n} ${GEM_LV_N[lv] || lv}` : k; };
export const gemText = (k) => { const { lv, g } = parseGem(k); if (!g) return ''; const v = g.per[lv - 1]; return `${g.t} +${Math.round(v * 1000) / 10}%`; };
/** Cộng hiệu ứng mọi viên ngọc đang khảm trên bộ đồ */
export function gemBonus(eq) {
  const pm = {}, gear = {};
  for (const k in eq) {
    const it = eq[k];
    for (const gk of (it && it.sock) || []) {
      if (!gk) continue;
      const { lv, g } = parseGem(gk);
      if (!g) continue;
      const v = g.per[lv - 1] || 0;
      if (g.pm) pm[g.stat] = (pm[g.stat] || 0) + v; else gear[g.stat] = (gear[g.stat] || 0) + v;
    }
  }
  return { pm, gear };
}

// ---------- Trân thú ----------
// tier 0 thường, 1 hiếm, 2 truyền thuyết. pm/gear/fx: cộng mỗi cấp (1..10).
export const PETS = {
  tieu_ho: { n: 'Tiểu Hổ', tier: 0, t: 'Công +4%/cấp', pm: { atkPct: 0.04 } },
  van_ho: { n: 'Vân Hồ', tier: 0, t: 'Né +0,6%/cấp, kỳ ngộ +2%/cấp', gear: { dodge: 0.006 }, fx: { eventRate: 0.02 } },
  quy_giap: { n: 'Quy Giáp', tier: 0, t: 'Thủ +6%/cấp', pm: { defPct: 0.06 } },
  kim_thiem: { n: 'Kim Thiềm', tier: 0, t: 'Linh thạch +6%/cấp', fx: { moneyMul: 0.06 } },
  bang_ly: { n: 'Băng Ly', tier: 1, t: 'Giảm sát thương nhận 0,8%/cấp, sinh lực +2%/cấp', gear: { dmgRed: 0.008 }, pm: { hpPct: 0.02 } },
  linh_hac: { n: 'Linh Hạc', tier: 1, t: 'Thọ nguyên +1%/cấp, sinh lực +3%/cấp', fx: { lifeMul: 0.01 }, pm: { hpPct: 0.03 } },
  kim_ho: { n: 'Kim Hổ', tier: 1, t: 'Công +5%/cấp, bạo kích +0,5%/cấp', pm: { atkPct: 0.05 }, gear: { crit: 0.005 } },
  hoa_phuong: { n: 'Hỏa Phượng', tier: 2, t: 'Công +4%/cấp, hồi máu mỗi lượt', pm: { atkPct: 0.04 }, gear: { regenTurn: 0.003 } },
  ky_lan: { n: 'Kỳ Lân', tier: 2, t: 'Công, thủ, sinh lực +3,5%/cấp', pm: { atkPct: 0.035, defPct: 0.035, hpPct: 0.035 } },
  thanh_long: { n: 'Thanh Long', tier: 2, t: 'Công +6%/cấp, sinh lực +4%/cấp', pm: { atkPct: 0.06, hpPct: 0.04 } },
};
export const PET_IDS = Object.keys(PETS);
export const PET_MAX = 10;
export const PET_TIER_N = ['Thường', 'Hiếm', 'Truyền thuyết'];
/** Thú hạch cần để lên cấp kế tiếp */
export const petNeed = (lv) => 3 + lv * 3;
/** Hiệu ứng của trân thú ở cấp lv */
export function petBonus(pet) {
  const pm = {}, gear = {}, fx = {};
  const d = pet && PETS[pet.id];
  if (!d) return { pm, gear, fx };
  const l = pet.lv || 1;
  for (const k in d.pm || {}) pm[k] = d.pm[k] * l;
  for (const k in d.gear || {}) gear[k] = d.gear[k] * l;
  for (const k in d.fx || {}) fx[k] = 1 + d.fx[k] * l;
  return { pm, gear, fx };
}
