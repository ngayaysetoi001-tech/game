// Chiến đấu theo lượt có võ kỹ, trạng thái và trang bị.
// Thuần logic: trả về danh sách lượt để giao diện diễn lại.

// ---------- Võ kỹ ----------
// wep: binh khí hợp (null = tay không / mọi binh khí). mp: linh lực tốn (tối đa 100).
// kind: 'atk' tấn công, 'shield' hộ thể, 'heal' hồi phục, 'buff' tăng thế
export const SKILLS = {
  quyen: { n: 'Quyền cước', tier: 0, kind: 'atk', wep: null, cls: 'the', mp: 0, mult: 1, desc: 'Đòn đánh thường, không tốn linh lực.' },
  // ===== Kiếm tu: Kiếm ý 0-10, đủ thì tung Tru Tiên Nhất Kiếm =====
  kiem_1: { n: 'Ngự Kiếm Quyết', path: 'kiem', slot: 'co', kind: 'atk', wep: 'kiem', cls: 'kiem', mp: 0, mult: 1.2, fly: 0.4, realm: 0, desc: 'Đòn cơ bản. Chém 120% công, bản mệnh phi kiếm chém theo 40% (cấp 10: 70%). +2 Kiếm ý.' },
  kiem_2: { n: 'Phi Kiếm Liên Hoàn', path: 'kiem', slot: 'c1', kind: 'atk', wep: 'kiem', cls: 'kiem', mp: 30, mult: 0.4, hits: 5, critCharge: true, realm: 2, desc: '5 phi kiếm, mỗi thanh 40% công, bạo kích riêng. Mỗi lần bạo kích +1 Kiếm ý.' },
  kiem_3: { cd: 2, n: 'Phong Lôi Kiếm Quyết', path: 'kiem', slot: 'c2', kind: 'atk', wep: 'kiem', cls: 'kiem', mp: 35, mult: 1.5, stun: 0.4, armorBreak: 3, realm: 3, desc: '150% công, 40% choáng, Phá giáp 3 lượt (thủ địch -40%).' },
  kiem_4: { cd: 2, n: 'Vạn Kiếm Quy Tông', path: 'kiem', slot: 'chot', kind: 'atk', wep: 'kiem', cls: 'kiem', mp: 55, mult: 0.95, hits: 3, defStack: 0.1, combo: 'armor', realm: 5, desc: '3 đợt kiếm rơi, mỗi đợt 95% công, đợt sau thủ địch yếu thêm 10%. Liên kích: địch đang Phá giáp thì +40%.' },
  kiem_5: { n: 'Tru Tiên Nhất Kiếm', path: 'kiem', slot: 'ult', kind: 'atk', wep: 'kiem', cls: 'kiem', mp: 0, mult: 6, ignoreDef: 0.5, combo: 'armor', comboMul: 1.5, clearCombo: true, realm: 3, desc: 'Tuyệt kỹ, tự tung khi Kiếm ý đủ 10: 600% công, bỏ qua 50% thủ. Địch đang Phá giáp: +50% và chém tan giáp.' },
  kiem_6: { n: 'Kiếm Tâm Thông Minh', path: 'kiem', slot: 'p1', kind: 'passive', realm: 2, pas: { crit: 0.12, critPerCharge: 0.05 }, desc: 'Bị động. Bạo kích +12%. Mỗi điểm Kiếm ý: sát thương bạo kích +5%.' },
  kiem_7: { n: 'Đạp Vân Bộ', path: 'kiem', slot: 'p2', kind: 'passive', realm: 4, pas: { dodge: 0.08, first: true, dodgeCharge: true }, desc: 'Bị động. Né +8%, luôn ra tay trước lượt đầu, né được đòn thì +1 Kiếm ý.' },
  kiem_8: { n: 'Kiếm Ý Hộ Thể', path: 'kiem', slot: 'p3', kind: 'passive', realm: 6, pas: { startShield: 0.2, rf: 0.15 }, desc: 'Bị động. Vào trận có khiên kiếm khí 20% sinh lực, phản 15% sát thương nhận vào.' },
  // ===== Thể tu: Nộ huyết 0-100 (bị đánh +6, đánh trúng +4), chiêu mạnh tốn máu =====
  the_1: { n: 'Bách Lôi Quyền', path: 'the', slot: 'co', kind: 'atk', wep: 'quyen', cls: 'the', mp: 0, mult: 0.6, hits: 2, dizzy: 2, realm: 0, desc: 'Đòn cơ bản. 2 quyền, mỗi quyền 60% công, gây Choáng váng 2 lượt (địch ra đòn yếu 10%).' },
  the_2: { cd: 1, n: 'Đoạn Kim Chưởng', path: 'the', slot: 'c1', kind: 'atk', wep: 'quyen', cls: 'the', mp: 0, hpCost: 0.05, mult: 2, pierce: true, shieldBreak: 2, dizzy: 2, realm: 2, desc: 'Tốn 5% máu. 200% công, xuyên giáp, đánh vào khiên gấp đôi. Gây Choáng váng.' },
  the_3: { cd: 1, n: 'Hắc Hổ Đào Tâm', path: 'the', slot: 'c2', kind: 'atk', wep: 'quyen', cls: 'the', mp: 0, hpCost: 0.04, mult: 1.8, exec: [0.35, 2], healHit: 0.1, realm: 3, desc: 'Tốn 4% máu. 180% công, gấp đôi khi địch dưới 35% máu. Trúng thì hồi 10% máu.' },
  the_4: { cd: 3, n: 'Chưởng Tâm Lôi', path: 'the', slot: 'chot', kind: 'atk', wep: 'quyen', cls: 'the', mp: 0, hpCost: 0.1, mult: 2.4, stun: 1, combo: 'dizzy', realm: 5, desc: 'Tốn 10% máu. 240% công, choáng chắc chắn 1 lượt. Liên kích: địch đang Choáng váng thì +40%.' },
  the_5: { n: 'Thái Sơn Áp Đỉnh', path: 'the', slot: 'ult', kind: 'atk', wep: 'quyen', cls: 'the', mp: 0, mult: 4.5, defAdd: 0.6, stun: 1, combo: 'dizzy', realm: 3, desc: 'Tuyệt kỹ, tự tung khi Nộ huyết đủ 100: 450% công cộng thêm 60% thủ của mình, choáng 1 lượt.' },
  the_6: { n: 'Kim Cương Nộ Mục', path: 'the', slot: 'p1', kind: 'passive', realm: 2, pas: { ragePerCharge: 0.03, lowHpAtk: 0.3 }, desc: 'Bị động. Mỗi 10 Nộ huyết: công +3%. Dưới 30% máu: công +30%.' },
  the_7: { n: 'Huyền Quy Tế Thể', path: 'the', slot: 'p2', kind: 'passive', realm: 4, pas: { regenTurn: 0.02, defPct: 0.12 }, desc: 'Bị động. Hồi 2% máu mỗi lượt, thủ +12%. Từ cấp 5 miễn choáng, đóng băng.' },
  the_8: { n: 'Bất Hoại Kim Thân', path: 'the', slot: 'p3', kind: 'passive', realm: 6, pas: { dmgRed: 0.12, rf: 0.2 }, desc: 'Bị động. Giảm 12% mọi sát thương, phản 20%. Cấp 10: Bất Diệt, gục một lần thì đứng dậy với 40% máu.' },
  // ===== Tinh thần lực: Thần thức 0-100 (mỗi lượt +6, mỗi chiêu +20), sát thương chuẩn, khống chế =====
  phu_1: { n: 'Thần Niệm Phù', path: 'tinh', slot: 'co', kind: 'atk', wep: 'phap', cls: 'tinh', mp: 0, mult: 0.7, trueDmg: true, burn: 2, burnName: 'thiêu hồn', realm: 0, desc: 'Đòn cơ bản. 70% công sát thương chuẩn (bỏ qua thủ), thiêu hồn 2 lượt.' },
  phu_2: { cd: 1, n: 'Lôi Niệm Chấn Hồn', path: 'tinh', slot: 'c1', kind: 'atk', wep: 'phap', cls: 'tinh', mp: 30, mult: 1.6, trueDmg: true, stun: 0.35, mpDrainS: 15, realm: 2, desc: '160% sát thương chuẩn, 35% choáng, rút 15 linh lực của địch.' },
  phu_3: { cd: 3, n: 'Băng Phách Phong Hồn', path: 'tinh', slot: 'c2', kind: 'atk', wep: 'phap', cls: 'tinh', mp: 30, mult: 1.3, confuse: 2, realm: 3, desc: '130% công, địch Loạn thần 2 lượt: mỗi lượt 50% mất lượt.' },
  phu_4: { cd: 3, n: 'Ngũ Hành Mê Hồn Trận', path: 'tinh', slot: 'chot', kind: 'atk', wep: 'phap', cls: 'tinh', mp: 50, mult: 1.2, trueDmg: true, chaos: 0.45, combo: 'confuse', realm: 5, desc: '120% sát thương chuẩn, 45% làm địch hỗn loạn tự đánh mình. Liên kích: địch đang Loạn thần thì +40%.' },
  phu_5: { n: 'Thiên Lôi Thần Phạt', path: 'tinh', slot: 'ult', kind: 'atk', wep: 'phap', cls: 'tinh', mp: 0, mult: 4, trueDmg: true, combo: 'confuse', realm: 3, desc: 'Tuyệt kỹ, tự tung khi Thần thức đầy 100: 400% sát thương chuẩn. Từ Hợp Thể có phân thần đánh thêm một lần 50%.' },
  phu_6: { n: 'Linh Phù Hộ Thần', path: 'tinh', slot: 'p1', kind: 'passive', realm: 2, pas: { startShield: 0.12, foresee: 4 }, desc: 'Bị động. Vào trận có khiên 12% sinh lực. Tiên tri: cứ 4 đòn của địch thì né chắc chắn 1 đòn.' },
  phu_7: { n: 'Tĩnh Tâm Minh Thần', path: 'tinh', slot: 'p2', kind: 'passive', realm: 4, pas: { immuneMind: true, mpRegen: 4, chargeTurn: 3 }, desc: 'Bị động. Miễn hỗn loạn, loạn thần. Thần thức, linh lực hồi nhanh hơn. Ngoài trận: đột phá +6%, kỳ ngộ hiện tỉ lệ thật.' },
  phu_8: { n: 'Liên Tâm Hồi Thần', path: 'tinh', slot: 'p3', kind: 'passive', realm: 6, pas: { regenTurn: 0.025 }, desc: 'Bị động. Hồi 2,5% máu mỗi lượt. Nghề phụ mạnh hơn 2 cấp.' },
};
// thanh tài nguyên của từng đường
export const PATH_RES = { kiem: { n: 'Kiếm ý', max: 10, col: '#8fd3ff' }, the: { n: 'Nộ huyết', max: 100, col: '#e0503a' }, tinh: { n: 'Thần thức', max: 100, col: '#b48cff' } };
export const PATH_SKILLS = { kiem: [], the: [], tinh: [] };
for (const [id, sk] of Object.entries(SKILLS)) if (sk.path) PATH_SKILLS[sk.path].push(id);
export const SKILL_MAX = (id) => (SKILLS[id].slot === 'ult' ? 5 : 10);
/** Hệ số theo cấp kỹ năng: chiêu +8%/cấp, tuyệt kỹ +15%/cấp, bị động +10%/cấp */
export const skillLvMul = (id, lv = 1) => 1 + (SKILLS[id].slot === 'ult' ? 0.15 : SKILLS[id].kind === 'passive' ? 0.1 : 0.08) * (Math.max(1, lv) - 1);
/** Chỉ số cộng thêm từ các kỹ năng bị động đã mở (theo cấp) */
export function pathPassives(path, lvs) {
  const g = {};
  for (const id of PATH_SKILLS[path] || []) {
    const sk = SKILLS[id];
    const lv = lvs[id];
    if (sk.kind !== 'passive' || !lv) continue;
    const m = skillLvMul(id, lv);
    for (const k in sk.pas) g[k] = typeof sk.pas[k] === 'number' && !['foresee', 'chargeTurn'].includes(k) ? (g[k] || 0) + sk.pas[k] * m : sk.pas[k];
    if (id === 'the_7' && lv >= 5) g.immuneStun = true;
    if (id === 'the_8' && lv >= 10) g.lastStand = true;
  }
  return g;
}
// trường phái của chiêu: theo binh khí, hoặc cls với chiêu tay không / hộ thể
export const skillCls = (sk) => sk.cls || sk.wep || 'the';
export const SKILL_IDS = Object.keys(SKILLS);

// Chiêu của yêu thú
export const BEAST_SKILLS = {
  can_xe: { n: 'Cắn xé', kind: 'atk', mp: 0, mult: 1 },
  doc_nha: { n: 'Độc nha', kind: 'atk', mp: 25, mult: 1.1, burn: 3, burnName: 'trúng độc' },
  cuong_bao: { n: 'Cuồng bạo', kind: 'buff', mp: 30, rage: 3 },
  vay_giap: { n: 'Vảy giáp', kind: 'shield', mp: 30, shield: 0.2 },
  gam_thet: { n: 'Gầm thét', kind: 'atk', mp: 35, mult: 1.2, stun: 0.3 },
  // bản 5.4: chiêu theo họ yêu thú
  xe_xac: { n: 'Xé xác', kind: 'atk', mp: 0, mult: 0.75, hits: 2, burn: 2, burnName: 'chảy máu' },
  vo_moi: { n: 'Vồ mồi', kind: 'atk', mp: 30, mult: 1.6, exec: [0.35, 1.6] },
  phun_doc: { n: 'Phun độc', kind: 'atk', mp: 25, mult: 0.9, burn: 4, burnName: 'trúng độc', armorBreak: 2 },
  xuyen_giap: { n: 'Xuyên giáp', kind: 'atk', mp: 30, mult: 1.4, pierce: true },
  thach_giap: { n: 'Thạch giáp', kind: 'shield', mp: 30, shield: 0.35, thorns: 2 },
  choang_vang: { n: 'Húc choáng', kind: 'atk', mp: 25, mult: 1.1, dizzy: 2 },
  phong_dao: { n: 'Phong đao', kind: 'atk', mp: 30, mult: 0.4, hits: 4 },
  loi_kich: { n: 'Lôi kích', kind: 'atk', mp: 35, mult: 1.3, stun: 0.45, stunName: 'tê liệt' },
  hoa_phun: { n: 'Phun lửa', kind: 'atk', mp: 35, mult: 1.2, burn: 4, burnName: 'thiêu đốt' },
  bang_tho: { n: 'Hàn băng thổ tức', kind: 'atk', mp: 35, mult: 1, stun: 0.5, stunName: 'đóng băng' },
  hut_hon: { n: 'Hút hồn', kind: 'atk', mp: 30, mult: 1.2, drain: 0.6 },
  me_hoac: { n: 'Mê hoặc', kind: 'atk', mp: 35, mult: 0.8, confuse: 2 },
  long_tuc: { n: 'Long tức', kind: 'atk', mp: 55, mult: 2.4, ignoreDef: 0.3 },
  liem_thuong: { n: 'Liếm vết thương', kind: 'heal', mp: 30, heal: 0.18 },
  // chiêu riêng của trùm tháp
  b_trieu_thi: { n: 'Triệu hồi cương thi', kind: 'shield', mp: 35, shield: 0.3 },
  b_thi_doc: { n: 'Thi độc trảo', kind: 'atk', mp: 25, mult: 1.15, burn: 3, burnName: 'thi độc' },
  b_bang_phong: { n: 'Băng phong vạn lý', kind: 'atk', mp: 35, mult: 1.1, stun: 0.6, stunName: 'đóng băng' },
  b_han_khi: { n: 'Hàn khí thấu xương', kind: 'atk', mp: 20, mult: 0.6, hits: 2 },
  b_viem_nguc: { n: 'Viêm ngục', kind: 'atk', mp: 35, mult: 1.3, burn: 4, burnName: 'thiêu đốt' },
  b_hoa_bao: { n: 'Hỏa bạo', kind: 'atk', mp: 45, mult: 1.9 },
  b_quy_hut: { n: 'Quỷ hút hồn', kind: 'atk', mp: 30, mult: 1.3, drain: 0.7 },
  b_am_phong: { n: 'Âm phong', kind: 'atk', mp: 20, mult: 0.9, burn: 2, burnName: 'âm hàn' },
  b_kiem_vuc: { n: 'Kiếm vực', kind: 'shield', mp: 40, shield: 0.2, thorns: 3 },
  b_van_kiem: { n: 'Vạn kiếm quy tông', kind: 'atk', mp: 45, mult: 0.45, hits: 5 },
  b_ma_bao: { n: 'Ma diễm bạo phát', kind: 'buff', mp: 30, rage: 3 },
  b_pha_giap: { n: 'Phá giáp ma trảo', kind: 'atk', mp: 30, mult: 1.3, armorBreak: 3 },
  b_lien_quyen: { n: 'Liên hoàn bá quyền', kind: 'atk', mp: 30, mult: 0.5, hits: 3 },
  b_hu_bo: { n: 'Hư không bộ', kind: 'atk', mp: 25, mult: 1.0, evade: 2 },
  b_khong_tram: { n: 'Không gian trảm', kind: 'atk', mp: 40, mult: 1.5, pierce: true },
};

export const WEAPON_TYPES = {
  kiem: { n: 'Kiếm', crit: 0.05 },
  quyen: { n: 'Quyền sáo', atk: 0.1 },
  phap: { n: 'Pháp khí', mpRegen: 3 },
};

export const TACTICS = {
  cuong_cong: { n: 'Cuồng công', desc: 'Dồn linh lực vào sát chiêu mạnh nhất.' },
  can_bang: { n: 'Cân bằng', desc: 'Đánh khi có lợi, hồi và thủ khi cần.' },
  phong_thu: { n: 'Phòng thủ', desc: 'Ưu tiên hộ thể và hồi phục, giữ linh lực.' },
};

const findSkill = (id) => SKILLS[id] || BEAST_SKILLS[id];

/**
 * Tạo một bên giao chiến.
 * o: { name, pw, hpPct, skills, wep, tactic, gear, beast, look, path, lv (cấp kỹ năng), mindless }
 */
// bản 5.5: máu ×3 (60 → 180 mỗi điểm sức mạnh) để trận dài 10–15 hiệp, thấy rõ diễn biến.
// Trận dài hơn nên mọi hiệu ứng hồi máu theo % mỗi lượt / mỗi chiêu bị giảm theo HEAL_SCALE.
export const HP_BASE = 180;
export const HEAL_SCALE = 0.45;
export function fighter(o) {
  const gear = { ...(o.gear || {}) };
  const wt = o.wep ? WEAPON_TYPES[o.wep] : null;
  const pm = o.pm || {};
  const lv = o.lv || {};
  // bị động của đường tu cộng vào như trang bị
  const pas = o.path ? pathPassives(o.path, lv) : {};
  for (const k in pas) gear[k] = typeof pas[k] === 'number' && typeof gear[k] !== 'boolean' ? (gear[k] || 0) + pas[k] : pas[k];
  const maxHp = (HP_BASE * o.pw + (gear.hp || 0)) * (1 + (pm.hpPct || 0));
  const res = o.path ? PATH_RES[o.path] : null;
  const ult = o.path ? (o.skills || []).find((id) => SKILLS[id] && SKILLS[id].slot === 'ult') : null;
  return {
    name: o.name, beast: !!o.beast, look: o.look || null,
    maxHp, hp: Math.max(1, maxHp * (o.hpPct ?? 1)),
    atk: (10 * o.pw * (1 + (wt && wt.atk ? wt.atk : 0)) + (gear.atk || 0)) * (1 + (gear.atkPct || 0) + (pm.atkPct || 0) + (!o.wep ? pm.unarmedAtk || 0 : 0)),
    def: (4 * o.pw + (gear.def || 0)) * (1 + (pm.defPct || 0) + (gear.defPct || 0)),
    crit: 0.05 + (gear.crit || 0) + (wt && wt.crit ? wt.crit : 0) + (o.wep === 'kiem' ? pm.kiemCrit || 0 : 0),
    dodge: 0.05 + (gear.dodge || 0) + (wt && wt.dodge ? wt.dodge : 0),
    ls: (gear.ls || 0) + (pm.ls || 0), rf: gear.rf || 0,
    pierce: (gear.pierce || 0) + (wt && wt.pierce ? wt.pierce : 0),
    spd: 10 + (gear.sp || 0) + (o.spd || 0),
    mp: 100, wep: o.wep || null, pb: o.pb || null, pbN: 0, pbSh: false,
    skills: (o.skills && o.skills.length ? o.skills : ['quyen']).filter((id) => findSkill(id) && findSkill(id).kind !== 'passive' && id !== ult).slice(0, 6),
    tactic: o.tactic || 'can_bang',
    st: { burn: 0, burnDmg: 0, burnName: '', stun: false, stunName: '', shield: Math.round(maxHp * (gear.startShield || 0)), shieldT: gear.startShield ? 99 : 0, armor: 0, evade: 0, rage: 0, thorns: 0, dizzy: 0, confuse: 0, chaos: false },
    // thần thông từ đồ Thần thoại
    atkPct: gear.atkPct || 0, takenPct: gear.takenPct || 0, dmgRed: gear.dmgRed || 0,
    combo: gear.combo || 0, execute: gear.execute || 0, first: !!gear.first, firstCrit: !!(o.gear && o.gear.first),
    stunHit: gear.stunHit || 0, critDmg: gear.critDmg || 1.7, mpDrain: gear.mpDrain || 0,
    immune: !!gear.immune, lastStand: !!gear.lastStand, usedLS: false, regenTurn: gear.regenTurn || 0, mpRegen: (gear.mpRegen || 0) + ((o.pm && o.pm.mpRegen) || 0) + (wt && wt.mpRegen ? wt.mpRegen : 0),
    clsMul: (o.pm && o.pm.cls) || {},
    // đường tu: thanh tài nguyên, tuyệt kỹ, cấp kỹ năng
    path: o.path || null, lv, ult, ch: 0, chMax: res ? res.max : 0, twin: !!o.twin,
    critPerCharge: gear.critPerCharge || 0, dodgeCharge: !!gear.dodgeCharge, ragePerCharge: gear.ragePerCharge || 0, lowHpAtk: gear.lowHpAtk || 0,
    immuneStun: !!gear.immuneStun, immuneMind: !!gear.immuneMind, foresee: gear.foresee || 0, seen: 0, chargeTurn: gear.chargeTurn || 0,
    mindless: !!o.mindless, cdl: {},
    fly: o.path === 'kiem' && lv.kiem_1 ? 0.4 + 0.0333 * (lv.kiem_1 - 1) : 0,
  };
}

/** Hệ số khi dùng chiêu không hợp binh khí */
function wepFit(f, sk) {
  if (!sk.wep || sk.wep === f.wep) return 1;
  if (sk.wep === 'quyen' && !f.wep) return 1;
  if (sk.wep === 'phap') return 0.85;
  return 0.6;
}
const skMul = (f, id) => (f.lv && f.lv[id] ? skillLvMul(id, f.lv[id]) : 1);
function gainCh(f, n) {
  if (!f.chMax) return;
  f.ch = Math.min(f.chMax, f.ch + n);
}

function choose(f, foe, r) {
  let best = null, bestS = -1;
  const hpP = f.hp / f.maxHp;
  for (const id of f.skills) {
    const sk = findSkill(id);
    if (!sk || sk.mp > f.mp || sk.kind === 'passive') continue;
    if (sk.hpCost && hpP < sk.hpCost * 2.5) continue;
    if (sk.cd && f.cdl[id] > 0) continue;
    let s = 0;
    if (sk.kind === 'atk') {
      s = (sk.mult || 1) * (sk.hits || 1) * wepFit(f, sk) * skMul(f, id);
      if (sk.stun) s += 0.5;
      if (sk.burn) s += 0.4;
      if (sk.confuse && !foe.st.confuse && !foe.mindless && !foe.immuneMind) s += 0.8;
      if (sk.chaos && !foe.mindless && !foe.immuneMind) s += 0.6;
      if (sk.combo && foe.st[sk.combo]) s *= 1.4;
      if (sk.armorBreak && !foe.st.armor) s += 0.5;
      if (sk.exec && foe.hp / foe.maxHp < sk.exec[0]) s *= sk.exec[1];
      if (sk.drain && hpP < 0.6) s += 0.6;
      if (sk.trueDmg && foe.mindless) s *= 0.5;
      if (f.tactic === 'cuong_cong') s *= 1.3;
      if (f.tactic === 'phong_thu' && sk.mp > 0) s *= 0.8;
    } else if (sk.kind === 'heal') {
      s = hpP < 0.45 ? 3 : hpP < 0.7 ? 1 : 0;
      if (f.tactic === 'phong_thu') s *= 1.6;
    } else if (sk.kind === 'shield') {
      s = f.st.shield > 0 ? 0 : hpP < 0.75 ? 1.8 : 0.8;
      if (f.tactic === 'phong_thu') s *= 1.6;
      if (f.tactic === 'cuong_cong') s *= 0.5;
    } else if (sk.kind === 'buff') {
      s = f.st.rage ? 0 : 1.6;
    }
    s *= r.range(0.85, 1.15);
    if (s > bestS) { bestS = s; best = id; }
  }
  return best || (f.beast ? 'can_xe' : 'quyen');
}

function hit(att, def, sk, r, ev, extra = {}) {
  const fit = wepFit(att, sk);
  let atk = att.atk * (att.st.rage ? 1.5 : 1);
  if (att.ragePerCharge) atk *= 1 + Math.floor(att.ch / 10) * att.ragePerCharge;
  if (att.lowHpAtk && att.hp / att.maxHp < 0.3) atk *= 1 + att.lowHpAtk;
  if (att.st.dizzy) atk *= 0.9;
  const pierceX = (sk.pierce ? 0.7 : 0) + att.pierce + (extra.pierce || 0) + (sk.ignoreDef || 0);
  const trueD = !!sk.trueDmg;
  let d = trueD ? 0 : def.def * (def.st.armor ? 0.6 : 1) * (1 - Math.min(0.85, pierceX));
  // tiên tri: cứ vài đòn thì né chắc chắn một đòn
  if (def.foresee && ++def.seen % def.foresee === 0) { ev.hits.push({ miss: true, foresee: true }); return 0; }
  if (r.chance(def.dodge + (def.st.evade ? 0.35 : 0))) {
    ev.hits.push({ miss: true });
    if (def.dodgeCharge) gainCh(def, 1);
    return 0;
  }
  let base = atk + (sk.defAdd ? att.def * sk.defAdd : 0);
  let dmg = base * (sk.mult || 1) * fit * (extra.mul || 1) * r.range(0.9, 1.1) * (1 - d / (d + base * 1.5));
  if (trueD && def.mindless) dmg *= 0.5;
  if (att.execute && def.hp / def.maxHp < 0.3) { dmg *= att.execute; ev.execute = true; }
  if (sk.exec && def.hp / def.maxHp < sk.exec[0]) { dmg *= sk.exec[1]; ev.execute = true; }
  const crit = att.firstCrit || r.chance(att.crit + (sk.crit || 0));
  att.firstCrit = false;
  if (crit) dmg *= att.critDmg + att.critPerCharge * att.ch;
  dmg *= (att.clsMul[skillCls(sk)] || 1) * (1 + def.takenPct) * (1 - def.dmgRed);
  dmg = Math.max(1, Math.round(dmg));
  let absorbed = 0;
  if (def.st.shield > 0 && !trueD) {
    const sb = sk.shieldBreak || 1;
    absorbed = Math.min(def.st.shield, dmg * sb) / sb;
    def.st.shield -= absorbed * sb;
    absorbed = Math.round(absorbed);
  }
  const real = dmg - absorbed;
  def.hp = Math.max(0, def.hp - real);
  if (def.hp <= 0 && def.lastStand && !def.usedLS) { def.usedLS = true; def.hp = Math.round(def.maxHp * (def.path === 'the' ? 0.4 : 0.3)); ev.lastStand = true; }
  else if (def.hp <= 0 && def.pb && def.pb.last && !def.pbLast) { def.pbLast = true; def.hp = Math.round(def.maxHp * def.pb.last); ev.lastStand = true; ev.pbSave = def.pb.n; }
  if (att.mpDrain && real > 0) { const m = Math.min(def.mp, att.mpDrain); def.mp -= m; att.mp = Math.min(100, att.mp + m); }
  ev.hits.push({ dmg: real, crit, absorbed });
  // nộ huyết của Thể tu: bị đánh +8, đánh trúng +4
  if (real > 0 && def.path === 'the') gainCh(def, 6);
  if (real > 0 && att.path === 'the') gainCh(att, 4);
  if (crit && sk.critCharge) gainCh(att, 1);
  const thorn = def.st.thorns ? 0.3 : 0;
  const reflect = Math.round(real * (def.rf + thorn));
  if (reflect > 0) { att.hp = Math.max(0, att.hp - reflect); ev.reflect = (ev.reflect || 0) + reflect; }
  const drain = Math.round(real * ((sk.drain || 0) + att.ls));
  if (drain > 0) { att.hp = Math.min(att.maxHp, att.hp + drain); ev.drain = (ev.drain || 0) + drain; }
  return real;
}

/** Ra một chiêu (cả tuyệt kỹ, phân thần) */
function cast(f, foe, id, r, ev, k = 1) {
  const sk = findSkill(id);
  const m = skMul(f, id) * k;
  const comboOn = sk.combo && foe.st[sk.combo] > 0;
  const mul = m * (comboOn ? sk.comboMul || 1.4 : 1);
  if (comboOn) ev.comboHit = true;
  const before = ev.hits.length;
  for (let i = 0; i < (sk.hits || 1) && foe.hp > 0; i++) hit(f, foe, sk, r, ev, { mul, pierce: sk.defStack ? sk.defStack * i : 0 });
  if (comboOn && sk.clearCombo) foe.st[sk.combo] = 0;
  const landed = ev.hits.slice(before).some((h) => !h.miss && h.dmg > 0);
  if (landed && sk.healHit) { const h = Math.round(f.maxHp * sk.healHit * HEAL_SCALE); f.hp = Math.min(f.maxHp, f.hp + h); ev.heal = (ev.heal || 0) + h; }
  if (landed && sk.mpDrainS) { const d = Math.min(foe.mp, sk.mpDrainS); foe.mp -= d; ev.applied = ev.applied || 'mất linh lực'; }
  return landed;
}

/**
 * Đánh đến khi một bên gục, tối đa 14 hiệp (rồi so % sinh lực).
 * Trả về { a, b (tóm tắt hai bên), turns, win (a thắng?), aHpPct, rounds }
 */
export function battle(A, B, r) {
  const turns = [];
  // phong độ hôm nay: cho phép kẻ yếu hơn đôi chút vẫn có cửa lật kèo
  A.atk *= r.range(0.78, 1.22);
  B.atk *= r.range(0.78, 1.22);
  const snap = () => ({ aHp: Math.round(A.hp), bHp: Math.round(B.hp), aMp: Math.round(A.mp), bMp: Math.round(B.mp), aSh: Math.round(A.st.shield), bSh: Math.round(B.st.shield), aCh: A.ch, bCh: B.ch });
  let round = 0;
  while (A.hp > 0 && B.hp > 0 && round < 40) {
    round++;
    const aFirst = A.first && !B.first ? true : B.first && !A.first ? false : A.spd * (A.st.confuse ? 0.7 : 1) + r.range(-3, 3) >= B.spd * (B.st.confuse ? 0.7 : 1) + r.range(-3, 3);
    const order = aFirst ? [[A, B, 'a'], [B, A, 'b']] : [[B, A, 'b'], [A, B, 'a']];
    for (const [f, foe, side] of order) {
      if (f.hp <= 0 || foe.hp <= 0) break;
      const ev = { side, round, hits: [] };
      // trạng thái đầu lượt
      if (f.st.burn > 0) {
        const bd = Math.max(1, Math.round(f.st.burnDmg));
        f.hp = Math.max(0, f.hp - bd);
        f.st.burn--;
        ev.dot = { dmg: bd, name: f.st.burnName };
        if (f.hp <= 0) { Object.assign(ev, snap()); ev.skill = null; turns.push(ev); break; }
      }
      for (const k of ['armor', 'evade', 'rage', 'thorns', 'dizzy', 'stunImm']) if (f.st[k] > 0) f.st[k]--;
      for (const k in f.cdl) if (f.cdl[k] > 0) f.cdl[k]--;
      if (f.st.shieldT > 0 && --f.st.shieldT === 0) f.st.shield = 0;
      f.mp = Math.min(100, f.mp + 12 + f.mpRegen);
      if (f.path === 'tinh') gainCh(f, 6 + f.chargeTurn);
      if (f.regenTurn && f.hp < f.maxHp) { const h = Math.round(f.maxHp * f.regenTurn * HEAL_SCALE); f.hp = Math.min(f.maxHp, f.hp + h); ev.regen = h; }
      // pháp bảo
      if (f.pb) {
        const pb = f.pb;
        if (pb.shield && !f.pbSh && f.hp / f.maxHp < 0.3) { f.pbSh = true; const sh = Math.round(f.maxHp * pb.shield); f.st.shield += sh; f.st.shieldT = 99; ev.pb = `${pb.n} ngân vang, hiện khiên ${sh}`; }
        if (pb.stun && round === 1 && !foe.immune && r.chance(pb.stun)) { foe.st.stun = true; foe.st.stunName = 'choáng'; ev.pb = `${pb.n} quạt ra cuồng phong, ${foe.name} bị choáng`; }
        if (pb.every && ++f.pbN % pb.every === 0) {
          const d = pb.pierce ? 0 : foe.def * 0.6;
          const dmg = Math.max(1, Math.round(f.atk * pb.mult * (1 - d / (d + f.atk * 1.5)) * r.range(0.9, 1.1) * (1 - (foe.dmgRed || 0))));
          foe.hp = Math.max(0, foe.hp - dmg);
          ev.pb = `${pb.hitN || pb.n}: ${foe.name} mất ${dmg}`;
          if (foe.hp <= 0) { Object.assign(ev, snap()); ev.skill = null; turns.push(ev); break; }
        }
      }
      if (f.st.stun) {
        f.st.stun = false;
        // vừa bị choáng thì kháng choáng 2 lượt, không bị khóa mãi
        f.st.stunImm = 2;
        ev.stunned = f.st.stunName || 'choáng';
        Object.assign(ev, snap());
        turns.push(ev);
        continue;
      }
      if (f.st.confuse > 0) {
        f.st.confuse--;
        if (r.chance(0.5)) { ev.stunned = 'loạn thần'; Object.assign(ev, snap()); turns.push(ev); continue; }
      }
      if (f.st.chaos) {
        // hỗn loạn: tự đánh mình
        f.st.chaos = false;
        const d = Math.max(1, Math.round(f.atk * 0.6 * r.range(0.9, 1.1)));
        f.hp = Math.max(1, f.hp - d);
        ev.self = `hỗn loạn tự đánh mình ${d}`;
        Object.assign(ev, snap());
        turns.push(ev);
        continue;
      }
      // tuyệt kỹ: thanh tài nguyên đầy thì tự tung
      const ultNow = f.ult && f.ch >= f.chMax;
      const id = ultNow ? f.ult : choose(f, foe, r);
      const sk = findSkill(id);
      if (!ultNow) f.mp -= sk.mp;
      if (sk.cd && !ultNow) f.cdl[id] = sk.cd + 1;
      if (sk.hpCost) { const c = Math.round(f.maxHp * sk.hpCost); f.hp = Math.max(1, f.hp - c); ev.hpCost = c; }
      ev.skill = id;
      ev.skillN = sk.n;
      if (ultNow) { ev.ult = true; f.ch = 0; }
      ev.misfit = sk.wep && wepFit(f, sk) < 1;
      if (sk.kind === 'atk') {
        const landed = cast(f, foe, id, r, ev);
        if (ultNow && f.twin && foe.hp > 0) { cast(f, foe, id, r, ev, 0.5); ev.twin = true; }
        // Liên Hoàn: thêm một đòn
        if (f.combo && foe.hp > 0 && r.chance(f.combo)) { hit(f, foe, { mult: 0.8 }, r, ev); ev.combo = true; }
        // bản mệnh phi kiếm chém theo
        if (f.fly && foe.hp > 0 && f.path === 'kiem' && !sk.beast) { hit(f, foe, { mult: f.fly, cls: 'kiem', wep: 'kiem' }, r, ev); ev.fly = true; }
        if (landed && f.path === 'kiem' && sk.path === 'kiem' && !ultNow) gainCh(f, 3 + (ev.hits.some((h) => h.crit) ? 2 : 0)); // bản 5.6: trận dài nên Kiếm ý tích nhanh hơn
        if (f.path === 'tinh' && sk.path === 'tinh' && !ultNow) gainCh(f, 20);
        const mind = !foe.mindless && !foe.immuneMind;
        if (landed && foe.hp > 0 && !foe.immune && !foe.st.stunImm && f.stunHit && r.chance(f.stunHit)) { foe.st.stun = true; foe.st.stunName = 'choáng vì sấm'; ev.applied = 'choáng vì sấm'; }
        if (landed && foe.hp > 0 && foe.immune && (sk.burn || sk.stun)) ev.applied = 'miễn nhiễm';
        if (landed && foe.hp > 0 && !foe.immune) {
          if (sk.burn) { foe.st.burn = sk.burn; foe.st.burnDmg = f.atk * 0.3; foe.st.burnName = sk.burnName || 'thiêu đốt'; ev.applied = foe.st.burnName; }
          if (sk.armorBreak) { foe.st.armor = sk.armorBreak; ev.applied = 'phá giáp'; }
          if (sk.dizzy) { foe.st.dizzy = sk.dizzy; ev.applied = ev.applied || 'choáng váng'; }
          if (sk.stun && !foe.immuneStun && !foe.st.stunImm && r.chance(sk.stun)) { foe.st.stun = true; foe.st.stunName = sk.stunName || 'choáng'; ev.applied = foe.st.stunName; }
          if (sk.confuse) { if (mind) { foe.st.confuse = sk.confuse; ev.applied = 'loạn thần'; } else ev.applied = foe.mindless ? 'vô hồn, miễn' : 'miễn'; }
          if (sk.chaos && mind && r.chance(sk.chaos)) { foe.st.chaos = true; ev.applied = 'hỗn loạn'; }
        }
        if (sk.evade) { f.st.evade = sk.evade; ev.self = 'thân pháp'; }
      } else if (sk.kind === 'heal') {
        const h = Math.round(f.maxHp * sk.heal * HEAL_SCALE * (f.clsMul.ho || 1));
        f.hp = Math.min(f.maxHp, f.hp + h);
        ev.heal = h;
      } else if (sk.kind === 'shield') {
        f.st.shield = Math.round(f.maxHp * sk.shield * (f.clsMul.ho || 1));
        f.st.shieldT = 4;
        if (sk.heal) { const h = Math.round(f.maxHp * sk.heal * HEAL_SCALE * (f.clsMul.ho || 1)); f.hp = Math.min(f.maxHp, f.hp + h); ev.heal = h; }
        if (sk.thorns) f.st.thorns = sk.thorns;
        ev.shield = f.st.shield;
      } else if (sk.kind === 'buff') {
        f.st.rage = sk.rage;
        ev.self = 'cuồng bạo';
      }
      Object.assign(ev, snap());
      turns.push(ev);
    }
  }
  const win = B.hp <= 0 ? true : A.hp <= 0 ? false : A.hp / A.maxHp >= B.hp / B.maxHp;
  const sum = (f) => ({ name: f.name, maxHp: Math.round(f.maxHp), beast: f.beast, look: f.look, wep: f.wep, path: f.path, chMax: f.chMax });
  return { a: { ...sum(A), hp0: turns.length ? null : Math.round(A.hp) }, b: sum(B), aStart: null, turns, win, aHpPct: A.hp / A.maxHp, rounds: round };
}

/** Một câu mô tả lượt đánh (dùng cho nhật ký trận) */
export function turnText(t, aName, bName) {
  const who = t.side === 'a' ? aName : bName;
  const foe = t.side === 'a' ? bName : aName;
  const parts = [];
  if (t.dot) parts.push(`${who} bị ${t.dot.name}, mất ${t.dot.dmg}.`);
  if (t.pb) parts.push(`✦ ${t.pb}.`);
  if (t.stunned) { parts.push(`${who} bị ${t.stunned}, không ra tay được.`); return parts.join(' '); }
  if (!t.skill) return parts.join(' ');
  let s = `${who} ${t.ult ? 'tung tuyệt kỹ' : 'dùng'} ${t.skillN}${t.misfit ? ' (không hợp binh khí)' : ''}${t.hpCost ? ` (đốt ${t.hpCost} máu)` : ''}`;
  if (t.hits.length) {
    const hs = t.hits.map((h) => (h.miss ? 'trượt' : `${h.dmg}${h.crit ? ' bạo kích' : ''}`));
    s += `: ${hs.join(', ')}`;
  }
  if (t.heal) s += `, hồi ${t.heal} sinh lực`;
  if (t.shield) s += `, dựng khiên ${t.shield}`;
  if (t.self) s += `, ${t.self}`;
  s += '.';
  if (t.applied) s += ` ${foe} bị ${t.applied}.`;
  if (t.drain) s += ` Hút ${t.drain} sinh lực.`;
  if (t.reflect) s += ` Bị phản ${t.reflect}.`;
  if (t.combo) s += ' Liên hoàn thêm một đòn!';
  if (t.comboHit) s += ' Liên kích!';
  if (t.fly) s += ' Phi kiếm chém theo.';
  if (t.twin) s += ' Phân thần đánh thêm một lần!';
  if (t.hits.some((h) => h.foresee)) s += ' Bị tiên tri né trước.';
  if (t.execute) s += ' Đoạn Mệnh!';
  if (t.lastStand) s += ` ${foe} gục xuống rồi đứng dậy, Bất Tử Thân!`;
  if (t.regen) s = `Hồi ${t.regen} sinh lực. ` + s;
  parts.push(s);
  return parts.join(' ');
}
