// Chiến đấu theo lượt có võ kỹ, trạng thái và trang bị.
// Thuần logic: trả về danh sách lượt để giao diện diễn lại.

// ---------- Võ kỹ ----------
// wep: binh khí hợp (null = tay không / mọi binh khí). mp: linh lực tốn (tối đa 100).
// kind: 'atk' tấn công, 'shield' hộ thể, 'heal' hồi phục, 'buff' tăng thế
export const SKILLS = {
  quyen: { n: 'Quyền cước', tier: 0, kind: 'atk', wep: null, cls: 'the', mp: 0, mult: 1, desc: 'Đòn đánh thường, không tốn linh lực.' },
  // Kiếm
  luu_van: { n: 'Lưu Vân Kiếm Pháp', tier: 1, kind: 'atk', wep: 'kiem', mp: 20, mult: 0.75, hits: 2, desc: 'Kiếm pháp. Hai nhát liền như mây trôi.' },
  kinh_hong: { n: 'Kinh Hồng Nhất Kiếm', tier: 2, kind: 'atk', wep: 'kiem', mp: 40, mult: 2.2, crit: 0.25, desc: 'Kiếm pháp. Một kiếm duy nhất, tỉ lệ bạo kích +25%.' },
  van_kiem: { n: 'Vạn Kiếm Triều Tông', tier: 3, kind: 'atk', wep: 'kiem', mp: 70, mult: 0.62, hits: 5, desc: 'Kiếm pháp. Năm đạo kiếm khí cùng lúc.' },
  // Đao
  liet_hoa: { n: 'Liệt Hỏa Đao Pháp', tier: 1, kind: 'atk', wep: 'dao', mp: 25, mult: 1.3, burn: 3, desc: 'Đao pháp. Thiêu đốt địch 3 lượt.' },
  pha_son: { n: 'Phá Sơn Trảm', tier: 2, kind: 'atk', wep: 'dao', mp: 35, mult: 1.6, armorBreak: 3, desc: 'Đao pháp. Phá giáp: thủ của địch -40% trong 3 lượt.' },
  // Thương
  truy_hon: { n: 'Truy Hồn Thương', tier: 1, kind: 'atk', wep: 'thuong', mp: 30, mult: 1.5, pierce: true, desc: 'Thương pháp. Xuyên giáp, bỏ qua phần lớn phòng thủ.' },
  bach_dieu: { n: 'Bách Điểu Thương', tier: 2, kind: 'atk', wep: 'thuong', mp: 35, mult: 0.62, hits: 3, desc: 'Thương pháp. Ba mũi thương như chim vỡ tổ.' },
  // Quạt
  thanh_phong: { n: 'Thanh Phong Phiến', tier: 1, kind: 'atk', wep: 'quat', mp: 20, mult: 1.2, evade: 2, desc: 'Phiến pháp. Gió cuốn thân, né tránh +35% trong 2 lượt.' },
  me_hon: { n: 'Mê Hồn Phiến Ảnh', tier: 2, kind: 'atk', wep: 'quat', mp: 35, mult: 1.0, stun: 0.5, desc: 'Phiến pháp. 50% làm địch choáng 1 lượt.' },
  // Chưởng, ấn (tay không cũng dùng được)
  han_bang: { n: 'Hàn Băng Chưởng', tier: 1, kind: 'atk', wep: null, cls: 'phap', mp: 25, mult: 1.3, stun: 0.35, stunName: 'đóng băng', desc: 'Chưởng pháp. 35% đóng băng địch 1 lượt.' },
  tran_nhac: { n: 'Trấn Nhạc Ấn', tier: 2, kind: 'atk', wep: null, cls: 'phap', mp: 40, mult: 1.8, stun: 0.3, desc: 'Ấn pháp. Đè xuống như núi, 30% choáng.' },
  huyet_anh: { n: 'Huyết Ảnh Trảo', tier: 2, kind: 'atk', wep: null, cls: 'ma', mp: 30, mult: 1.4, drain: 0.5, desc: 'Ma công. Hút 50% sát thương thành sinh lực.' },
  ngu_loi: { n: 'Ngũ Lôi Chính Pháp', tier: 3, kind: 'atk', wep: null, cls: 'phap', mp: 60, mult: 2.8, desc: 'Lôi pháp. Năm đạo sấm giáng xuống một chỗ.' },
  // Hộ thể, hồi phục
  huyen_vu: { n: 'Huyền Vũ Hộ Thể', tier: 1, kind: 'shield', wep: null, cls: 'ho', mp: 30, shield: 0.25, desc: 'Khiên linh lực bằng 25% sinh lực tối đa.' },
  hoi_nguyen: { n: 'Hồi Nguyên Quyết', tier: 1, kind: 'heal', wep: null, cls: 'ho', mp: 35, heal: 0.25, desc: 'Hồi 25% sinh lực tối đa.' },
  kim_cang: { n: 'Kim Cang Bất Hoại', tier: 3, kind: 'shield', wep: null, cls: 'ho', mp: 55, shield: 0.4, thorns: 3, desc: 'Khiên 40% sinh lực, phản 30% sát thương trong 3 lượt.' },
  // Tuyệt học của từng con đường tu hành (path: chỉ có được khi chọn con đường đó)
  nhat_kiem: { n: 'Nhất Kiếm Đoạn Giang', tier: 3, path: 'kiem', kind: 'atk', wep: 'kiem', mp: 60, mult: 2.5, crit: 0.2, desc: 'Tuyệt học Kiếm tu. Một kiếm chém đứt dòng sông, bạo kích +20%.' },
  ba_the: { n: 'Bá Thể Quyền', tier: 3, path: 'the', kind: 'atk', wep: null, cls: 'the', mp: 40, mult: 1.5, hits: 2, armorBreak: 2, desc: 'Tuyệt học Thể tu. Hai quyền liền, phá giáp địch 2 lượt.' },
  cuu_thien: { n: 'Cửu Thiên Lôi Ấn', tier: 3, path: 'phap', kind: 'atk', wep: null, cls: 'phap', mp: 50, mult: 2.4, stun: 0.35, desc: 'Tuyệt học Pháp tu. Ấn sấm chín tầng trời, 35% làm choáng.' },
  dai_bi: { n: 'Đại Bi Kim Thân', tier: 3, path: 'phat', kind: 'shield', wep: null, cls: 'ho', mp: 50, shield: 0.3, heal: 0.12, desc: 'Tuyệt học Phật tu. Khiên 30% sinh lực và hồi 12% sinh lực.' },
  huyet_hai: { n: 'Huyết Hải Ma Công', tier: 3, path: 'ma', kind: 'atk', wep: null, cls: 'ma', mp: 50, mult: 1.8, drain: 0.6, burn: 3, burnName: 'huyết độc', desc: 'Tuyệt học Ma tu. Hút 60% sát thương thành sinh lực, gây huyết độc 3 lượt.' },
  van_thu: { n: 'Vạn Thú Triều Bái', tier: 3, path: 'ngu_thu', kind: 'atk', wep: null, cls: 'thu', mp: 55, mult: 0.55, hits: 4, desc: 'Tuyệt học Ngự thú tu. Linh thú cùng bầy thú hoang lao vào cắn xé 4 lần.' },
};
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
};

export const WEAPON_TYPES = {
  kiem: { n: 'Kiếm', crit: 0.05 },
  dao: { n: 'Đao', atk: 0.1 },
  thuong: { n: 'Thương', pierce: 0.15 },
  quat: { n: 'Phiến', dodge: 0.05 },
};

export const TACTICS = {
  cuong_cong: { n: 'Cuồng công', desc: 'Dồn linh lực vào sát chiêu mạnh nhất.' },
  can_bang: { n: 'Cân bằng', desc: 'Đánh khi có lợi, hồi và thủ khi cần.' },
  phong_thu: { n: 'Phòng thủ', desc: 'Ưu tiên hộ thể và hồi phục, giữ linh lực.' },
};

const findSkill = (id) => SKILLS[id] || BEAST_SKILLS[id];

/**
 * Tạo một bên giao chiến.
 * o: { name, pw, hpPct, skills, wep, tactic, gear: { atk, def, hp, crit, dodge, ls, rf, pierce, sp }, beast, look }
 */
export function fighter(o) {
  const gear = o.gear || {};
  const wt = o.wep ? WEAPON_TYPES[o.wep] : null;
  const pm = o.pm || {};
  const maxHp = (60 * o.pw + (gear.hp || 0)) * (1 + (pm.hpPct || 0));
  return {
    name: o.name, beast: !!o.beast, look: o.look || null,
    maxHp, hp: Math.max(1, maxHp * (o.hpPct ?? 1)),
    atk: (10 * o.pw * (1 + (wt && wt.atk ? wt.atk : 0)) + (gear.atk || 0)) * (1 + (gear.atkPct || 0) + (pm.atkPct || 0) + (!o.wep ? pm.unarmedAtk || 0 : 0)),
    def: (4 * o.pw + (gear.def || 0)) * (1 + (pm.defPct || 0)),
    crit: 0.05 + (gear.crit || 0) + (wt && wt.crit ? wt.crit : 0) + (o.wep === 'kiem' ? pm.kiemCrit || 0 : 0),
    dodge: 0.05 + (gear.dodge || 0) + (wt && wt.dodge ? wt.dodge : 0),
    ls: (gear.ls || 0) + (pm.ls || 0), rf: gear.rf || 0,
    pierce: (gear.pierce || 0) + (wt && wt.pierce ? wt.pierce : 0),
    spd: 10 + (gear.sp || 0) + (o.spd || 0),
    mp: 100, wep: o.wep || null,
    skills: (o.skills && o.skills.length ? o.skills : ['quyen']).slice(0, 4),
    tactic: o.tactic || 'can_bang',
    st: { burn: 0, burnDmg: 0, burnName: '', stun: false, stunName: '', shield: Math.round(maxHp * (gear.startShield || 0)), shieldT: gear.startShield ? 99 : 0, armor: 0, evade: 0, rage: 0, thorns: 0 },
    // thần thông từ đồ Thần thoại
    atkPct: gear.atkPct || 0, takenPct: gear.takenPct || 0, dmgRed: gear.dmgRed || 0,
    combo: gear.combo || 0, execute: gear.execute || 0, first: !!gear.first, firstCrit: !!gear.first,
    stunHit: gear.stunHit || 0, critDmg: gear.critDmg || 1.7, mpDrain: gear.mpDrain || 0,
    immune: !!gear.immune, lastStand: !!gear.lastStand, usedLS: false, regenTurn: gear.regenTurn || 0, mpRegen: (gear.mpRegen || 0) + ((o.pm && o.pm.mpRegen) || 0),
    // con đường tu hành: hệ số theo trường phái chiêu
    clsMul: (o.pm && o.pm.cls) || {},
  };
}

/** Hệ số khi dùng chiêu không hợp binh khí */
function wepFit(f, sk) {
  return !sk.wep || sk.wep === f.wep ? 1 : 0.6;
}

function choose(f, foe, r) {
  let best = null, bestS = -1;
  const hpP = f.hp / f.maxHp;
  for (const id of f.skills) {
    const sk = findSkill(id);
    if (!sk || sk.mp > f.mp) continue;
    let s = 0;
    if (sk.kind === 'atk') {
      s = (sk.mult || 1) * (sk.hits || 1) * wepFit(f, sk);
      if (sk.stun) s += 0.5;
      if (sk.burn) s += 0.4;
      if (sk.armorBreak && !foe.st.armor) s += 0.5;
      if (sk.drain && hpP < 0.6) s += 0.6;
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

function hit(att, def, sk, r, ev) {
  const fit = wepFit(att, sk);
  let atk = att.atk * (att.st.rage ? 1.5 : 1);
  let d = def.def * (def.st.armor ? 0.6 : 1) * (1 - Math.min(0.8, (sk.pierce ? 0.7 : 0) + att.pierce));
  if (r.chance(def.dodge + (def.st.evade ? 0.35 : 0))) { ev.hits.push({ miss: true }); return 0; }
  let dmg = atk * (sk.mult || 1) * fit * r.range(0.9, 1.1) * (1 - d / (d + atk * 1.5));
  if (att.execute && def.hp / def.maxHp < 0.3) { dmg *= att.execute; ev.execute = true; }
  const crit = att.firstCrit || r.chance(att.crit + (sk.crit || 0));
  att.firstCrit = false;
  if (crit) dmg *= att.critDmg;
  dmg *= (att.clsMul[skillCls(sk)] || 1) * (1 + def.takenPct) * (1 - def.dmgRed);
  dmg = Math.max(1, Math.round(dmg));
  let absorbed = 0;
  if (def.st.shield > 0) {
    absorbed = Math.min(def.st.shield, dmg);
    def.st.shield -= absorbed;
  }
  const real = dmg - absorbed;
  def.hp = Math.max(0, def.hp - real);
  if (def.hp <= 0 && def.lastStand && !def.usedLS) { def.usedLS = true; def.hp = Math.round(def.maxHp * 0.3); ev.lastStand = true; }
  if (att.mpDrain && real > 0) { const m = Math.min(def.mp, att.mpDrain); def.mp -= m; att.mp = Math.min(100, att.mp + m); }
  ev.hits.push({ dmg: real, crit, absorbed });
  const thorn = def.st.thorns ? 0.3 : 0;
  const reflect = Math.round(real * (def.rf + thorn));
  if (reflect > 0) { att.hp = Math.max(0, att.hp - reflect); ev.reflect = (ev.reflect || 0) + reflect; }
  const drain = Math.round(real * ((sk.drain || 0) + att.ls));
  if (drain > 0) { att.hp = Math.min(att.maxHp, att.hp + drain); ev.drain = (ev.drain || 0) + drain; }
  return real;
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
  const snap = () => ({ aHp: Math.round(A.hp), bHp: Math.round(B.hp), aMp: Math.round(A.mp), bMp: Math.round(B.mp), aSh: Math.round(A.st.shield), bSh: Math.round(B.st.shield) });
  let round = 0;
  while (A.hp > 0 && B.hp > 0 && round < 14) {
    round++;
    const aFirst = A.first && !B.first ? true : B.first && !A.first ? false : A.spd + r.range(-3, 3) >= B.spd + r.range(-3, 3);
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
      for (const k of ['armor', 'evade', 'rage', 'thorns']) if (f.st[k] > 0) f.st[k]--;
      if (f.st.shieldT > 0 && --f.st.shieldT === 0) f.st.shield = 0;
      f.mp = Math.min(100, f.mp + 12 + f.mpRegen);
      if (f.regenTurn && f.hp < f.maxHp) { const h = Math.round(f.maxHp * f.regenTurn); f.hp = Math.min(f.maxHp, f.hp + h); ev.regen = h; }
      if (f.st.stun) {
        f.st.stun = false;
        ev.stunned = f.st.stunName || 'choáng';
        Object.assign(ev, snap());
        turns.push(ev);
        continue;
      }
      const id = choose(f, foe, r);
      const sk = findSkill(id);
      f.mp -= sk.mp;
      ev.skill = id;
      ev.skillN = sk.n;
      ev.misfit = sk.wep && sk.wep !== f.wep;
      if (sk.kind === 'atk') {
        for (let i = 0; i < (sk.hits || 1) && foe.hp > 0; i++) hit(f, foe, sk, r, ev);
        // Liên Hoàn: thêm một đòn
        if (f.combo && foe.hp > 0 && r.chance(f.combo)) { hit(f, foe, { mult: 0.8 }, r, ev); ev.combo = true; }
        const landed = ev.hits.some((h) => !h.miss && h.dmg > 0);
        if (landed && foe.hp > 0 && !foe.immune && f.stunHit && r.chance(f.stunHit)) { foe.st.stun = true; foe.st.stunName = 'choáng vì sấm'; ev.applied = 'choáng vì sấm'; }
        if (landed && foe.hp > 0 && foe.immune && (sk.burn || sk.stun)) ev.applied = 'miễn nhiễm';
        if (landed && foe.hp > 0 && !foe.immune) {
          if (sk.burn) { foe.st.burn = sk.burn; foe.st.burnDmg = f.atk * 0.15; foe.st.burnName = sk.burnName || 'thiêu đốt'; ev.applied = foe.st.burnName; }
          if (sk.armorBreak) { foe.st.armor = sk.armorBreak; ev.applied = 'phá giáp'; }
          if (sk.stun && r.chance(sk.stun)) { foe.st.stun = true; foe.st.stunName = sk.stunName || 'choáng'; ev.applied = foe.st.stunName; }
        }
        if (sk.evade) { f.st.evade = sk.evade; ev.self = 'thân pháp'; }
      } else if (sk.kind === 'heal') {
        const h = Math.round(f.maxHp * sk.heal * (f.clsMul.ho || 1));
        f.hp = Math.min(f.maxHp, f.hp + h);
        ev.heal = h;
      } else if (sk.kind === 'shield') {
        f.st.shield = Math.round(f.maxHp * sk.shield * (f.clsMul.ho || 1));
        f.st.shieldT = 4;
        if (sk.heal) { const h = Math.round(f.maxHp * sk.heal * (f.clsMul.ho || 1)); f.hp = Math.min(f.maxHp, f.hp + h); ev.heal = h; }
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
  const sum = (f) => ({ name: f.name, maxHp: Math.round(f.maxHp), beast: f.beast, look: f.look, wep: f.wep });
  return { a: { ...sum(A), hp0: turns.length ? null : Math.round(A.hp) }, b: sum(B), aStart: null, turns, win, aHpPct: A.hp / A.maxHp, rounds: round };
}

/** Một câu mô tả lượt đánh (dùng cho nhật ký trận) */
export function turnText(t, aName, bName) {
  const who = t.side === 'a' ? aName : bName;
  const foe = t.side === 'a' ? bName : aName;
  const parts = [];
  if (t.dot) parts.push(`${who} bị ${t.dot.name}, mất ${t.dot.dmg}.`);
  if (t.stunned) { parts.push(`${who} bị ${t.stunned}, không ra tay được.`); return parts.join(' '); }
  if (!t.skill) return parts.join(' ');
  let s = `${who} dùng ${t.skillN}${t.misfit ? ' (không hợp binh khí)' : ''}`;
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
  if (t.execute) s += ' Đoạn Mệnh!';
  if (t.lastStand) s += ` ${foe} gục xuống rồi đứng dậy, Bất Tử Thân!`;
  if (t.regen) s = `Hồi ${t.regen} sinh lực. ` + s;
  parts.push(s);
  return parts.join(' ');
}
