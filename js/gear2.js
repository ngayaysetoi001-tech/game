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

// ---------- Bản 5.5: Pháp bảo ----------
// Mỗi kiếp đeo 1 món. Cấp luyện hóa 1..10, mỗi cấp mạnh thêm 12% (pm, gear, hiệu ứng trận). Chết là mất.
// pb: hiệu ứng trong trận — shield: máu dưới 30% hiện khiên (% máu, 1 lần); every/mult/pierce: cứ N lượt đánh thêm;
// stun: lượt đầu có tỉ lệ làm choáng; last: không chết 1 lần. fx: ngoài trận.
export const PHAP_BAO = {
  hon_nguyen_chung: { n: 'Hỗn Nguyên Chung', t: 'Máu dưới 30%: hiện khiên 25% máu (1 lần mỗi trận). Thủ +6%', pm: { defPct: 0.06 }, pb: { shield: 0.25 } },
  ho_than_phu: { n: 'Hộ Thân Phù', t: 'Đòn chí mạng không làm chết, đứng dậy với 20% máu (1 lần mỗi trận). Sinh lực +5%', pm: { hpPct: 0.05 }, pb: { last: 0.2 } },
  that_tinh_kiem: { n: 'Thất Tinh Kiếm', t: 'Cứ 4 lượt chém thêm một đòn 150% công. Công +5%', pm: { atkPct: 0.05 }, pb: { every: 4, mult: 1.5, hitN: 'Thất Tinh kiếm khí' } },
  van_loi_an: { n: 'Vạn Lôi Ấn', t: 'Cứ 3 lượt giáng lôi 80% công, xuyên giáp', pm: {}, pb: { every: 3, mult: 0.8, pierce: true, hitN: 'Vạn Lôi giáng thế' } },
  phong_loi_phien: { n: 'Phong Lôi Phiến', t: 'Lượt đầu 40% làm địch choáng. Né +4%', gear: { dodge: 0.04 }, pb: { stun: 0.4 } },
  huyet_sat_chau: { n: 'Huyết Sát Châu', t: 'Hút máu 6%, máu dưới 30% thì công +25%', gear: { ls: 0.06, lowHpAtk: 0.25 } },
  huyen_vu_an: { n: 'Huyền Vũ Ấn', t: 'Giảm sát thương nhận 10%, thủ +8%', gear: { dmgRed: 0.1 }, pm: { defPct: 0.08 } },
  can_khon_dinh: { n: 'Càn Khôn Đỉnh', t: 'Thủ +15%, phản đòn 10%', pm: { defPct: 0.15 }, gear: { rf: 0.1 } },
  tinh_ha_binh: { n: 'Tinh Hà Bình', t: 'Hồi 3% máu mỗi lượt, sinh lực +6%', gear: { regenTurn: 0.03 }, pm: { hpPct: 0.06 } },
  tu_linh_binh: { n: 'Tụ Linh Bình', t: 'Linh lực hồi nhanh; ngoài trận tu luyện +8%', gear: { mpRegen: 6 }, fx: { gainMul: 0.08 } },
  thien_co_la_ban: { n: 'Thiên Cơ La Bàn', t: 'Né +5%; ngoài trận kỳ ngộ +12%, đột phá +3%', gear: { dodge: 0.05 }, fx: { eventRate: 0.12, brk: 0.03 } },
};
export const PB_IDS = Object.keys(PHAP_BAO);
export const PB_MAX = 10;
const pbK = (lv) => 1 + 0.12 * ((lv || 1) - 1);
/** Hiệu ứng pháp bảo đang đeo ở cấp lv: pm, gear (cộng vào chỉ số trận), fight (hiệu ứng trong trận), fx (ngoài trận) */
export function pbBonus(id, lv) {
  const d = PHAP_BAO[id];
  const pm = {}, gear = {}, fx = {};
  if (!d) return { pm, gear, fx, fight: null };
  const k = pbK(lv);
  for (const x in d.pm || {}) pm[x] = d.pm[x] * k;
  for (const x in d.gear || {}) gear[x] = d.gear[x] * k;
  for (const x in d.fx || {}) fx[x] = x === 'brk' ? d.fx[x] * k : 1 + d.fx[x] * k;
  const fight = d.pb ? { ...d.pb, n: d.n } : null;
  if (fight) { if (fight.shield) fight.shield *= k; if (fight.mult) fight.mult *= k; if (fight.stun) fight.stun = Math.min(0.8, fight.stun * k); if (fight.last) fight.last = Math.min(0.5, fight.last * k); }
  return { pm, gear, fx, fight };
}
/** Chi phí luyện hóa lên cấp kế tiếp */
export const pbCost = (lv, realm) => ({ money: Math.round(150 * lv * (1 + realm)), linh_tinh: 2 * lv });
