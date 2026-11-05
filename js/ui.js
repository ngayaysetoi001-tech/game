// Giao diện trình duyệt. Mọi luật chơi nằm trong core.js.
import { APP_VERSION } from './version.js';
import { Game, woundLv, WOUND_N, REALMS, ACTIONS, PILLS, LEGACIES, THE_MAP, THE_CHAT, TITLES, TITLE_MAP, HL_PRICE, HL_REROLL, PATHS, clamp, planStepText } from './core.js';
import { STAT_NAMES, PERSONALITIES, TITLE_TIER_N, MAPS, MAP_MAP, DIFF, MATS, DEFAULT_MAP, realmLabel, subN, PLANES, mapsOf, WORLD_DIFF, mythMatOf, planeOf, THEME_BG, BOSS_KITS, TOWER_THEMES, TOWER_SHOP, TAM_PHAP, TAM_PHAP_IDS, NGHE, PHU, PLAN_TEMPLATES, PLAN_STEP_ACTS, PLAN_COND, PATH_BAR_N } from './data.js';
import { drawSprite, spriteURL, botSeed } from './sprite.js';
import { SKILLS, BEAST_SKILLS, TACTICS, WEAPON_TYPES, turnText, PATH_RES, PATH_SKILLS, SKILL_MAX, skillLvMul } from './combat.js';
import { DESTINY_MAP, PERKS, perkLv, CHAPTER_MAP, BRANCH_MAP } from './fate.js';
import { heroArt, heroStandArt, heroFilter, meditateArt, skillArt, monsterArt, needFlip, uiIcon } from './art.js';
import { SLOTS, QUALITY, itemLine, TT_MAP, isSealed, isSuppressed, gearStats, itemName, PLUS_MAX, AFFIX } from './items.js';
import { iconURL, itemIconOpts, armorColor, PILL_COLORS, ICON_TOKEN_RE, matIconOpts, skillIconOpts } from './icons.js';

const SAVE_KEY = 'tkps.save.v1';
const SPEEDS = [1, 2, 4, 8, 16];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => Math.floor(n).toLocaleString('vi-VN');

let g = null;
let speed = 1;
let paused = false;
// hỏi người chơi: all = hỏi mọi kỳ ngộ (từ 8× vẫn hỏi), big = chỉ hỏi việc lớn (từ 8× tự quyết mọi việc tự quyết được), max = tự quyết hết những gì tự quyết được
let askMode = 'big';
const ASK = { all: 'Hỏi tất cả', big: 'Hỏi việc lớn', max: 'Tự quyết hết' };
const ASK_NEXT = { all: 'big', big: 'max', max: 'all' };
const ASK_TIP = { all: 'Kỳ ngộ nào cũng hỏi ngươi', big: 'Việc nhỏ tự quyết, chỉ hỏi đột phá, đạo đồ, chuyện quan hệ, sống chết, cơ duyên lớn. Từ 8× tự quyết mọi việc tự quyết được.', max: 'Tự quyết mọi việc tự quyết được, chỉ hỏi đột phá, đạo đồ và chuyện quan hệ' };
function shouldAuto() {
  if (!g.playing || !g.s.pending) return false;
  if (askMode === 'max') return g.canAuto();
  if (askMode === 'big') return speed >= AUTO_SPEED && !paused ? g.canAuto() : g.canAutoMinor();
  return false;
}
let battleView = 'big'; // xem diễn lại trận: all | big | off
const BATTLE_VIEW = { all: 'Luôn xem', big: 'Chỉ trận lớn', off: 'Không xem' };
// trận trong tháp (cả khi chạy nhanh): all = trùm và tinh anh, boss = chỉ trùm, off = không xem
let towerView = 'all';
const TOWER_VIEW = { all: 'Trùm và tinh anh', boss: 'Chỉ trùm', off: 'Không xem' };
const AUTO_SPEED = 8;
let tab = 'log';
let acc = 0;
let lastT = performance.now();
let dirty = true;
let lastSave = 0;

// ---------- Lưu ----------
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      g = Game.load(raw);
      const ui = g.s.ui || {};
      speed = SPEEDS.includes(ui.speed) ? ui.speed : ui.speed > 16 ? 16 : 1;
      askMode = ASK[ui.ask] ? ui.ask : ui.auto === false ? 'all' : 'big';
      battleView = BATTLE_VIEW[ui.battle] ? ui.battle : 'big';
      towerView = TOWER_VIEW[ui.tower] ? ui.tower : 'all';
      return;
    }
  } catch (e) {
    console.warn('Không đọc được bản lưu, tạo thế giới mới.', e);
  }
  g = Game.create();
}
function save() {
  try {
    g.s.ui = { speed, ask: askMode, battle: battleView, tower: towerView };
    localStorage.setItem(SAVE_KEY, g.save());
  } catch (e) {
    /* hết chỗ hoặc chế độ riêng tư: chơi tiếp không lưu */
  }
  lastSave = performance.now();
}

// ---------- Chân dung pixel ----------
function drawPortrait(canvas, p, opts = {}) {
  const wep = p.eq && p.eq.vu_khi ? p.eq.vu_khi.wt : null;
  drawSprite(canvas, { seed: p.look || 1, g: p.g, age: p.age, life: opts.life, realm: p.realm || 0, robe: opts.robe || null, dead: opts.dead, asc: opts.asc, wep });
}
const sectRobe = (sectId) => {
  const sc = sectId ? g.sect(sectId) : null;
  return sc ? sc.color : null;
};
/** Ảnh nhỏ của một bot */
const botAvatar = (b) => `<img class="avatar" alt="" src="${spriteURL({ seed: botSeed(b), g: b.g, age: b.age, life: b.life, realm: b.realm, robe: sectRobe(b.sect), wep: b.realm >= 1 ? g.botWep(b) : null })}">`;
const robeOf = sectRobe;
/** Màu áo người chơi: y phục đang mặc, không có thì màu tông môn */
const playerRobe = (P) => (P.eq && P.eq.ao ? armorColor(P.eq.ao) : sectRobe(P.sect));
const SLOT_KIND = { vu_khi: 'kiem', ao: 'dao_bao', phu_kien: 'ngoc_boi' };
const icoImg = (o, cls = '') => `<img class="ico ${cls}" alt="" src="${iconURL(o)}">`;
const itemIco = (it) => icoImg(itemIconOpts(it), `q${it.q}`);
/** Biểu tượng kỹ năng (cả chiêu yêu thú) */
const skIco = (id, cls = '') => { const a = skillArt(id); if (a) return `<img class="ico art ${cls}" alt="" src="${a}">`; const sk = SKILLS[id] || BEAST_SKILLS[id]; if (!sk) return ''; const o = skillIconOpts(id, sk); return icoImg(o, `q${o.q} ${cls}`); };
/** Tranh cho một bên giao chiến / chân dung: { src, filter } hoặc null */
function artOf(look) {
  if (!look) return null;
  if (look.type === 'beast') return monsterArt(look.name, look.seed || 1);
  if (look.path) return { src: heroArt(look.path, look.g), filter: heroFilter(look.path, look.g) };
  return null;
}
function setArt(img, a, canvas, want = null) {
  if (a && a.src) { img.src = a.src; img.style.filter = a.filter || ''; img.style.setProperty('--sx', want && needFlip(a.src, want) ? -1 : 1); img.hidden = false; if (canvas) canvas.hidden = true; }
  else { img.hidden = true; if (canvas) canvas.hidden = false; }
}

/** Chỉ thay DOM khi nội dung đổi, để nút không bị dựng lại giữa lúc đang chạm */
function setHTML(el, html) {
  if (el._h !== html) {
    el._h = html;
    el.innerHTML = html;
  }
}

// ---------- Màn hình ----------
function show(id) {
  for (const s of ['scr-birth', 'scr-play', 'scr-dead']) $(s).hidden = s !== id;
  document.body.classList.toggle('inPlay', id === 'scr-play');
}
function render() {
  const er = g.era();
  $('worldYear').textContent = `Năm ${fmt(g.s.year)} · ${PLANES[g.plane].n}${er && er.e.id !== 'thai_binh' ? ` · ${er.e.ic} ${er.e.n}` : ''}${g.s.diff && g.s.diff !== 'thuong' ? ` · ${WORLD_DIFF[g.s.diff].n}` : ''}`;
  const ph = g.s.phase;
  if (ph === 'birth') renderBirth();
  else if (ph === 'play' || (ph === 'dead' && g.s.pending)) renderPlay();
  else renderDead();
  dirty = false;
}

function statGrid(st) {
  return Object.keys(STAT_NAMES).map((k) => `<button class="statCell" data-stat="${k}"><span>${STAT_NAMES[k]}</span> <b>${st[k]}</b> <i>?</i></button>`).join('');
}

// ---------- Giải thích chỉ số ----------
const sg = (x, d = 0) => `${x >= 0 ? '+' : ''}${(Math.round(x * 10 ** d) / 10 ** d).toLocaleString('vi-VN')}`;
const pc = (x) => `${sg(x * 100)}%`;
/** Nội dung giải thích một chỉ số theo đúng giá trị hiện tại */
function statInfo(k, P) {
  const v = P.stats ? P.stats[k] : 0;
  const playing = g.playing && g.P === P;
  const d = v - 50;
  const L = {
    can: {
      n: 'Căn cốt', val: v, about: 'Thể chất trời sinh: xương cốt, khí huyết. 50 là người thường.',
      now: [`Thọ nguyên ${pc(d / 250)}`, `Sức chiến đấu ${pc(d / 200)}`, 'Dễ thắng các phép thử sức bền: đấu rượu, rút kiếm ở kiếm trủng, đỡ sét lôi kiếp cho người khác'],
      up: ['Lúc nhỏ theo đom đóm tìm được suối nước ấm, cơn sốt được đạo sĩ cho uống bùa', 'Cốt Linh Quả ở hội đấu giá, Huyết Sâm ở vườn thuốc, ăn trứng yêu thú', 'Tàn niệm "Thân thể kiếp trước" (+15)', 'Thể chất Thiết Cốt Thể; xuất thân con nhà nông'],
    },
    ngo: {
      n: 'Ngộ tính', val: v, about: 'Độ sáng dạ: hiểu công pháp nhanh hay chậm.',
      now: [`Tốc độ tu luyện ${pc(d / 200)}`, `Tỉ lệ đột phá ${pc(d / 250)}`, 'Dễ thành công khi nhận truyền thừa, phá huyết trận, tham ngộ ngọc giản, luyện đan, thi vào tông môn, tự minh oan'],
      up: ['Tiền bối chỉ điểm, quan sát lôi kiếp, xem lôi đài, giấc mộng nồi kê', 'Ngộ Đạo Trà ở hội đấu giá; nhận truyền thừa', 'Tàn niệm "Ký ức đạo pháp" (+15); thiên phú Đại khí vãn thành (+4 mỗi lần đột phá)'],
    },
    tam: {
      n: 'Tâm tính', val: v, about: 'Sự vững vàng của đạo tâm.',
      now: [`Tỉ lệ đột phá ${pc(d / 300)}`, `Nguy cơ chết khi đột phá hỏng (từ Kim Đan) ${pc(-d / 1000)}`, `Đối diện tâm ma thành công ~${Math.round(Math.min(97, (0.4 + v / 150) * 100))}%`],
      up: ['Tĩnh Tâm Đan ở Tụ Bảo Lâu', 'Vượt tâm ma, lập mộ cho người thân, tha thứ, ngắm hoàng hôn lúc tuổi già', 'Tàn niệm "Tâm như chỉ thủy" (+15)'],
    },
    co: {
      n: 'Cơ duyên', val: v, about: 'Vận may và duyên phận với trời đất.',
      now: [`Tỉ lệ đột phá ${pc(d / 400)}`, `Bỏ chạy thoát ${pc(d / 150)}`, `Linh thạch khi mưu sinh ${pc(d / 200)}`, `Nguy cơ mất mạng khi thua trận ${pc(-d / 400)}`, 'Dễ may mắn ở hang động, bí cảnh, cổ mộ, kho báu, sòng bạc, đột nhập trại cướp'],
      up: ['Lịch luyện (15% mỗi năm +1)', 'Thả linh thú về rừng, bái kiếm trủng, ngọc lông hồ ly', 'Tàn niệm "Dư âm cơ duyên" (+15); thiên phú Sinh giờ hoàng đạo (+12)'],
    },
  };
  if (L[k]) return L[k];
  if (k === 'tinh') {
    const t = P.tinh;
    const helpers = playing ? g.breakHelpers().length : 0;
    return {
      n: 'Hữu tình / Vô tình', val: `${t > 0 ? '+' : ''}${t}`, about: 'Con đường của ngươi: sống vì người hay bỏ hết tình cảm. Từ 30 là Hữu tình, từ -30 trở xuống là Vô tình.',
      now: t >= 30 ? [`Bạn bè thân (thân thiết từ 50, cảnh giới không thấp hơn ngươi) hộ pháp khi đột phá, mỗi người +4%, tối đa 4 người. Hiện có ${helpers} người: ${pc(helpers * 0.04)}`, `Thân thiết tăng ${pc(t / 200)} khi gặp gỡ`]
        : t <= -30 ? ['Tu luyện +20%', 'Đột phá +6%', `Thân thiết tăng ${pc(t / 200)} khi gặp gỡ`, t <= -50 ? 'Từ Kim Đan, tôn xưng đổi sang ma đạo (Ma Quân, Ma Tôn)' : 'Tới -50 thì từ Kim Đan tôn xưng đổi sang ma đạo']
          : ['Chưa nghiêng về bên nào, chưa có tác dụng đặc biệt', `Thân thiết tăng ${pc(t / 200)} khi gặp gỡ`],
      up: ['Hữu tình tăng: gặp gỡ, cứu người, chữa dịch, giải cứu dân làng, tha thứ, kết nghĩa, có đạo lữ', 'Vô tình tăng: bỏ mặc người gặp nạn, cướp của, đánh lén, học lén ma trận, chém tâm ma bằng sát niệm', 'Đạt 70 hoặc -70 mở danh hiệu riêng'],
    };
  }
  if (k === 'path' && P.path && PATHS[P.path]) {
    const pa = PATHS[P.path];
    return { n: pa.n, val: '', about: `${pa.tag}. ${pa.desc}`, now: [...pa.good.map((x) => `Mạnh: ${x}`), ...pa.bad.map((x) => `Yếu: ${x}`)], up: ['Kỹ năng: Túi trữ vật → Kỹ năng', 'Mỗi kiếp được chuyển tu một lần'], upTitle: 'Ghi chú' };
  }
  if (k === 'pill') return { n: 'Hồi Xuân Đan', val: String(P.pills.hoi_xuan || 0), about: 'Đan chữa thương, tự uống khi trọng thương.', now: ['Giữ mạng khi lịch luyện, vượt tháp'], up: ['Mua ở Tụ Bảo Lâu', 'Luyện đan (nghề phụ)', 'Phần thưởng kỳ ngộ'] };
  if (k === 'money') return { n: 'Linh thạch', val: fmt(P.money), about: 'Tiền tệ của giới tu tiên.', now: ['Mua đan dược, pháp khí, bí kíp ở Tụ Bảo Lâu; đấu giá; chuộc người; cược', 'Có 5.000 mở danh hiệu Phú Giáp Nhất Phương'], up: ['Mưu sinh (tăng theo cảnh giới và cơ duyên)', 'Hộ tống thương đội, đầu tư thương hội, linh mạch, kho báu, bán đồ thừa'] };
  if (k === 'fame') return { n: 'Danh vọng', val: fmt(P.fame), about: 'Tiếng tăm trên giang hồ.', now: ['Giúp tự minh oan khi bị vu cáo', 'Đạt 50 và 200 mở danh hiệu'], up: ['Thắng trận, đột phá, cứu người, thắng lôi đài, hạ yêu vương, trừ huyết trận'] };
  if (k === 'tuvi') return { n: 'Tu vi', val: playing ? `${fmt(P.tuvi)}/${fmt(g.need())}` : '-', about: 'Công lực tích lũy ở cảnh giới hiện tại. Đầy thì có thể đột phá. Phần màu cam cuối thanh là tu vi chưa vững (có từ vượt tháp, lịch luyện): tu luyện sẽ củng cố. Đột phá khi còn nhiều tu vi chưa vững thì tỉ lệ giảm tới 30%.', now: playing ? [`Mỗi năm tu luyện được khoảng ${fmt(g.gain())} tu vi`, `Chưa vững: ${fmt(P.loose || 0)} (${Math.round(((P.loose || 0) / Math.max(1, g.need())) * 100)}% tu vi cần)`, `Tỉ lệ đột phá hiện tại ~${Math.round(g.breakChance() * 100)}%`, ...g.brkMods().map((x) => `${x.n}: ${pc(x.v)} đột phá`)] : [], up: ['Tu luyện (đủ, củng cố căn cơ), bế quan (x1,6, củng cố rất nhanh; tử quan từ 50 năm x2)', 'Vượt tháp, lịch luyện cho tu vi chưa vững', 'Linh căn, ngộ tính, tông môn (+20%), thể chất, Vô tình, thần thông, đạo lộ'] };
  if (k.startsWith('f_') && playing) {
    const F = g.playerFighter();
    const gs = gearStats(P.eq || {}, P.realm);
    const X = {
      f_atk: ['Công', fmt(F.atk), 'Sát thương mỗi đòn trước khi trừ thủ của địch.', [`Từ trang bị: +${fmt(gs.atk || 0)}`, 'Kỹ năng nhân thêm theo hệ số của chiêu'], ['Vũ khí tốt, cường hóa, thăng cấp', 'Cảnh giới, nấc nhỏ, căn cốt, thể chất, con đường tu hành']],
      f_def: ['Thủ', fmt(F.def), 'Giảm sát thương nhận vào. Thủ càng cao so với công của địch thì càng ít đau.', [`Từ trang bị: +${fmt(gs.def || 0)}`], ['Y phục, phụ kiện tốt, cường hóa', 'Bất Hoại Kim Thân (Thể Tu)']],
      f_hp: ['Sinh lực trong trận', fmt(F.maxHp), 'Lượng máu tối đa trong một trận. Vào trận theo % sinh lực đang có.', [`Từ trang bị: +${fmt(gs.hp || 0)}`], ['Y phục, phụ kiện', 'Thể Tu']],
      f_crit: ['Bạo kích', `${Math.round(F.crit * 100)}%`, 'Xác suất đòn gây sát thương x1,7.', ['Kiếm có sẵn +5%'], ['Dòng Bạo kích trên trang bị (dẫn liệu Lôi tinh, Kiếm hồn...)', 'Kiếm Tâm Thông Minh (Kiếm Tu)']],
      f_dodge: ['Né', `${Math.round(F.dodge * 100)}%`, 'Xác suất tránh hẳn một đòn.', ['Né gốc 5%'], ['Dòng Né tránh trên trang bị', 'Đạp Vân Bộ (Kiếm Tu)']],
    }[k];
    if (X) return { n: X[0], val: X[1], about: X[2], now: X[3], up: X[4] };
  }
  if (k === 'sat') return { n: 'Sát khí', val: playing ? Math.round(P.sat) : '-', about: 'Tích tụ khi vượt tháp, lịch luyện, chiến đấu. Vùng càng khó tích càng nhanh.', now: [`Từ ${g.satLine(50)}: tu vi từ chiến đấu -20%`, `Từ ${g.satLine(70)}: đột phá -10%, dễ gặp tâm ma`, '100: tẩu hỏa nhập ma (trọng thương, mất 20% tu vi)', 'Tinh Thần Lực xả sát khí nhanh hơn 30%'], up: ['Tu luyện (xả nhanh nhất), mưu sinh (ít)', 'Đạo lữ song tu, Ngưng Thần Đan (-40)'], upTitle: 'Cách giảm' };
  if (k === 'hp') { const w = woundLv(P.hp); return { n: 'Thương thế', val: WOUND_N[w], about: 'Bị thương do yêu thú, hiểm địa, kỳ ngộ. Nặng quá thì mất mạng.', now: [w === 0 ? 'Khỏe mạnh: chiến đấu bình thường' : `Đang ${WOUND_N[w].toLowerCase()}: sức chiến đấu x${(0.5 + P.hp / 200).toFixed(2)}`, w >= 2 ? 'Trọng thương: tu luyện chậm, lịch luyện tự rút về vùng dễ' : 'Trọng thương thì tu luyện chậm, lịch luyện tự rút về vùng dễ', 'Nguy kịch: tự uống Hồi Xuân Đan nếu có'], up: ['Tu luyện dưỡng thương nhanh nhất, Mưu sinh vừa, Lịch luyện gần như không hồi', 'Hồi Xuân Đan', 'Thể chất, thần thông hồi phục'] }; }
  if (k === 'tho') return { n: 'Thọ nguyên', val: playing ? `${P.age}/${g.lifespan()}` : '-', about: 'Hết thọ là tọa hóa.', now: ['Mỗi lần đột phá lên cảnh giới mới thì thọ nguyên tăng mạnh', 'Căn cốt cao thì sống lâu hơn'], up: ['Đột phá cảnh giới', 'Diên Thọ Đan (+5%, mỗi cảnh giới một viên)', 'Tìm thuốc trường sinh lúc tuổi già, Huyền Quy, thể chất, thần thông Trường Sinh'] };
  return null;
}
function openStat(k, P = g.P || g.s.draft) {
  const x = statInfo(k, P);
  if (!x) return;
  const li = (a) => a.map((t) => `<li>${esc(t)}</li>`).join('');
  openSheet(`<h2>${esc(x.n)} <span class="statVal">${esc(String(x.val))}</span></h2>
    <p class="intro">${esc(x.about)}</p>
    ${x.now.length ? `<h3>Tác dụng hiện tại</h3><ul class="statList">${li(x.now)}</ul>` : ''}
    <h3>${esc(x.upTitle || 'Cách tăng')}</h3><ul class="statList up">${li(x.up)}</ul>`);
}

const TIER_N = ['Thường', 'Khá', 'Hiếm', 'Truyền thuyết', 'Thần thoại'];
/** Khối thể chất + thiên phú cho màn đầu thai */
function traitBlock() {
  const ts = g.traits().filter((t) => !t.cond && !t.tt && !t.path);
  const P0 = g.P || g.s.draft;
  const the2 = P0 && P0.the2 ? THE_MAP[P0.the2] : null;
  const [the, ...rest] = ts;
  const tps = rest.filter((t) => t !== the2);
  const the2Card = the2 ? `<div class="trait t${the2.tier}"><div class="row"><b>${esc(the2.n)}</b><span class="meta">Thể chất cộng thêm · ${TIER_N[the2.tier]}</span></div><div class="meta">${esc(the2.desc)}</div></div>` : '';
  return `<div class="traits">
    <div class="trait t${the.tier}"><div class="row"><b>${esc(the.n)}${g.s.phase === 'birth' && the.tier && !(g.s.seenThe || []).includes(the.id) ? ' <span class="newTag">Mới!</span>' : ''}</b><span class="meta">Thể chất${the.tier ? ' · ' + TIER_N[the.tier] : ''}</span></div><div class="meta">${esc(the.desc)}</div></div>
    ${the2Card}
    ${tps.length ? tps.map((t) => `<div class="trait t${t.tier}"><div class="row"><b>${esc(t.n)}</b><span class="meta">Thiên phú · ${TIER_N[t.tier]}</span></div><div class="meta">${esc(t.desc)}</div></div>`).join('') : '<div class="meta">Không có thiên phú gì đặc biệt.</div>'}
  </div>`;
}
function openTraits() {
  openSheet(`<h2>Thể chất và thiên phú</h2>${traitBlock()}`);
}

/** Đài Luân Hồi: tiêu Hồn Lực đổi thể chất ở màn đầu thai */
function altar(P) {
  const hl = g.s.honLuc || 0;
  const seen = (g.s.seenThe || []).filter((id) => THE_MAP[id] && THE_MAP[id].tier > 0).length;
  const t2 = P.the2 ? THE_MAP[P.the2] : null;
  const rr = [[0, 'Gieo lại thể chất'], [2, 'Bảo đảm Hiếm trở lên'], [3, 'Bảo đảm Truyền thuyết trở lên']];
  return `<div class="altar">
    <div class="row"><b>Đài Luân Hồi</b><span class="hl">Hồn Lực <b>${fmt(hl)}</b></span></div>
    <button class="btn primary perkBtn" id="perkBtn">🌀 Cây Hồn lực<small>Sức mạnh giữ mãi qua mọi kiếp · đã mở ${PERKS.reduce((m, p) => m + perkLv(g.s, p.id), 0)}/${PERKS.reduce((m, p) => m + p.cost.length, 0)}</small></button>
    <div class="meta">Hồn Lực tích từ các kiếp trước. Dùng để thêm một thể chất đã từng thức tỉnh, hoặc gieo lại thể chất chính.</div>
    <div class="altarRow">
      ${t2 ? `<button class="btn ghost" id="pickThe2">Đổi thể chất cộng thêm</button><button class="btn ghost" id="dropThe2">Bỏ (hoàn ${HL_PRICE[t2.tier]})</button>`
        : `<button class="btn" id="pickThe2" ${seen ? '' : 'disabled'}>＋ Thể chất cộng thêm<small>${seen ? `Chọn từ ${seen} thể chất đã thức tỉnh` : 'Chưa thức tỉnh thể chất nào'}</small></button>`}
    </div>
    <div class="altarRow three">${rr.map(([t, n]) => `<button class="btn ghost" data-rt="${t}" ${hl < HL_REROLL[t] ? 'disabled' : ''}>${n}<small>${HL_REROLL[t]} Hồn Lực</small></button>`).join('')}</div>
  </div>`;
}
function openThe2() {
  const draw = () => {
    const P = g.s.draft;
    const hl = g.s.honLuc || 0;
    const refund = P.the2 ? HL_PRICE[THE_MAP[P.the2].tier] : 0;
    const seen = new Set(g.s.seenThe || []);
    const list = THE_CHAT.filter((t) => t.tier > 0).sort((a, b) => b.tier - a.tier);
    openSheet(`<h2>Thể chất cộng thêm</h2>
      <p class="intro">Hồn Lực: <b>${fmt(hl)}</b>${refund ? ` (đổi thì được hoàn ${refund})` : ''}. Chỉ chọn được thể chất đã từng thức tỉnh. Thể chất cộng thêm phát huy đủ 100% nhưng chỉ trong kiếp này. Hai thể chất cộng lại tối đa tu luyện +80%, chiến đấu +70%, đột phá +15%.</p>
      <div class="list">${list.map((t) => {
        const own = seen.has(t.id);
        const price = HL_PRICE[t.tier];
        const isMain = t.id === P.the, isCur = t.id === P.the2;
        const can = own && !isMain && !isCur && hl + refund >= price;
        const why = !own ? 'Chưa từng thức tỉnh' : isMain ? 'Đang là thể chất chính' : isCur ? 'Đang chọn' : '';
        return `<div class="trait t${t.tier} ${own ? '' : 'lockT'}"><div class="row"><b>${own ? esc(t.n) : '???'}</b><span class="meta">${TIER_N[t.tier]} · ${price} Hồn Lực</span></div>
          <div class="meta">${own ? esc(t.desc) : 'Thức tỉnh thể chất này ở một kiếp nào đó để mở khóa.'}</div>
          <div class="row btnRow">${why ? `<span class="meta">${why}</span>` : `<button class="btn ghost" data-b2="${t.id}" ${can ? '' : 'disabled'}>Chọn · ${price}</button>`}</div></div>`;
      }).join('')}</div>`, () => {
      $('sheetBody').querySelectorAll('[data-b2]').forEach((b) => { b.onclick = () => { g.buyThe2(b.dataset.b2); save(); dirty = true; draw(); }; });
    });
  };
  draw();
}

/** Chọn giới để đầu thai (chỉ hiện khi đã từng phi thăng lên Linh giới) */
function planePick(P) {
  if (!g.s.unlock || !g.s.unlock[1]) return '';
  const cur = P.plane || 0;
  return `<div class="altar"><div class="row"><b>Đầu thai ở đâu?</b></div>
    <div class="opts">${PLANES.filter((pl) => pl.id === 0 || g.s.unlock[pl.id]).map((pl) => `<button class="btn ${cur === pl.id ? 'on' : 'ghost'}" data-bp="${pl.id}">${pl.n}</button>`).join('')}</div>
    <div class="meta">${cur ? 'Sinh ra làm dân bản địa Linh giới: bắt đầu ở Luyện Linh, thọ nguyên dài, quái mạnh. Hồn Lực cuối kiếp x2.' : 'Phàm giới: bắt đầu từ Phàm Nhân, dễ hơn. Muốn lên lại Linh giới thì phải phi thăng.'}</div></div>`;
}
function renderBirth() {
  show('scr-birth');
  const P = g.s.draft;
  const leg = g.s.legacy ? LEGACIES.find((l) => l.id === g.s.legacy.id) : null;
  const first = g.s.lives.length === 0;
  $('scr-birth').innerHTML = `
    ${first ? `<p class="intro">Thế giới này đã tồn tại ${fmt(g.s.year)} năm. Bốn mươi linh hồn đang tu luyện, kết thù, kết nghĩa, chết đi rồi đầu thai. Giờ đến lượt ngươi.</p>` : `<p class="intro">Linh hồn ngươi trôi dạt ${g.s.lives.length ? fmt(g.s.year - g.s.lives[g.s.lives.length - 1].year) : 0} năm rồi lại tìm về nhân gian. Kiếp thứ ${P.lifeNo}.</p>`}
    <div class="card fate">
      <div class="head">
        <canvas class="portrait" id="birthPortrait" width="32" height="40"></canvas>
        <div class="who">
          <h1>${esc(P.name)}</h1>
          <div class="sub">${P.g === 'nu' ? 'Nữ' : 'Nam'} · ${esc(P.originN)}</div>
          <div class="realm">${esc(P.root.n)}</div>
        </div>
      </div>
      ${traitBlock()}
      <div class="grid">${statGrid(P.stats)}<div><span>Linh thạch</span> <b>${fmt(P.money)}</b></div>${P.dao ? '<div><span>Gia truyền</span> <b>Đã nhập đạo</b></div>' : ''}</div>
      ${leg ? `<div class="legacyNote">Tàn niệm kiếp trước: ${esc(leg.n)}. ${esc(leg.desc)}</div>` : ''}
      ${P.flags.thanKhi ? Object.values(P.eq).filter((it) => it && it.q >= 4).map((it) => itemCard(it)).join('') : ''}
      ${destinyPick(P)}
      ${planePick(P)}
      ${altar(P)}
      <div class="btns">
        <button class="btn ghost" id="rerollBtn" ${g.s.rerolls <= 0 ? 'disabled' : ''}>Gieo lại (${g.s.rerolls})</button>
        <button class="btn primary" id="startBtn">Đầu thai</button>
      </div>
    </div>`;
  drawPortrait($('birthPortrait'), { ...P, age: 20 }, { life: 100 });
  $('rerollBtn').onclick = () => { g.reroll(); save(); dirty = true; };
  $('scr-birth').querySelectorAll('[data-rt]').forEach((b) => { b.onclick = () => { g.rerollThe(+b.dataset.rt); save(); dirty = true; }; });
  if ($('pickThe2')) $('pickThe2').onclick = openThe2;
  if ($('dropThe2')) $('dropThe2').onclick = () => { g.dropThe2(); save(); dirty = true; };
  $('scr-birth').querySelectorAll('[data-bp]').forEach((b) => { b.onclick = () => { g.setBirthPlane(+b.dataset.bp); save(); dirty = true; }; });
  $('startBtn').onclick = () => { g.start(); paused = false; tab = 'log'; save(); dirty = true; };
  $('scr-birth').querySelectorAll('[data-dst]').forEach((b) => { b.onclick = () => { g.pickDestiny(b.dataset.dst); save(); dirty = true; }; });
  $('perkBtn').onclick = openPerks;
}
/** Nhãn được/mất của một lựa chọn, từ các lần chạy thử */
function pvTags(a) {
  if (!a.runs) return '';
  const R = a.runs;
  const tag = (k, up, down) => { const x = a.d[k]; if (!x) return ''; const u = x.up / R, d = x.down / R; if (u >= 0.5 && d < 0.2) return `<i class="pv up">${up}</i>`; if (d >= 0.5 && u < 0.2) return `<i class="pv dn">${down}</i>`; if (u + d >= 0.5) return `<i class="pv mix">${up.split(' ')[0]} ±</i>`; return ''; };
  const t = [
    tag('tuvi', '☯ Tu vi ↑', '☯ Tu vi ↓'), tag('money', '💎 Linh thạch ↑', '💎 Linh thạch ↓'), tag('fame', '📣 Danh vọng ↑', '📣 Danh vọng ↓'),
    tag('st', '✦ Chỉ số ↑', '✦ Chỉ số ↓'), tag('sp', '◈ Ngộ đạo ↑', ''), tag('items', '🎁 Được đồ', '🎁 Mất đồ'), tag('rel', '♥ Thân thiết ↑', '✕ Kết thù'), tag('life', '⏳ Thọ ↑', ''),
  ].filter(Boolean);
  const hurt = a.hurt / R, dead = a.dead / R;
  if (hurt >= 0.15) t.push(`<i class="pv dn">🩸 Bị thương ~${Math.round(hurt * 100)}%</i>`);
  if (dead > 0) t.push(`<i class="pv dead">☠ Có thể chết</i>`);
  return t.length ? `<span class="pvTags">${t.join('')}</span>` : '';
}
/** Bốc lá Thiên mệnh lúc đầu thai */
function destinyPick(P) {
  const ids = P.destinyOpts || [];
  if (!ids.length) return '';
  const cur = P.destiny && P.destiny.id;
  return `<div class="fatePick"><div class="row"><b>📜 Thiên mệnh kiếp này</b><span class="meta">chọn 1 lá</span></div>
    <div class="fateCards">${ids.map((id) => { const d = DESTINY_MAP[id]; return `<button class="fateCard ${cur === id ? 'on' : ''}" data-dst="${id}"><b>${esc(d.n)}</b><span>${esc(d.desc(g))}</span><em>+${d.hl} Hồn lực${d.until ? ` · hạn ${d.until} tuổi` : ''}</em></button>`; }).join('')}</div></div>`;
}
/** Cây Hồn lực: mua sức mạnh vĩnh viễn */
function openPerks() {
  const draw = (msg = '') => {
    const hl = g.s.honLuc || 0;
    openSheet(`<h2>🌀 Cây Hồn lực</h2><p class="intro">Hồn lực còn <b>${fmt(hl)}</b>. Có được mỗi khi một kiếp kết thúc (cảnh giới, Thiên mệnh, Túc địch, danh hiệu...). Đã mua là giữ mãi qua mọi kiếp.</p>
      ${msg ? `<p class="forgeMsg">${esc(msg)}</p>` : ''}
      <div class="perkList">${PERKS.map((p) => { const l = perkLv(g.s, p.id); const c = g.perkCost(p.id); return `<div class="perk ${l ? 'has' : ''}"><span class="pIc">${p.ic}</span><div class="pBody"><b>${esc(p.n)}</b> <span class="pLv">${'◆'.repeat(l)}${'◇'.repeat(p.cost.length - l)}</span><div class="meta">${esc(p.per)}${p.cost.length > 1 ? ' (mỗi cấp)' : ''}</div></div>${c === null ? '<span class="meta pos">Tối đa</span>' : `<button class="btn ${hl >= c ? 'primary' : 'ghost'} sm" data-perk="${p.id}" ${hl >= c ? '' : 'disabled'}>${c} HL</button>`}</div>`; }).join('')}</div>`, () => {
      $('sheetBody').querySelectorAll('[data-perk]').forEach((b) => { b.onclick = () => { const p = PERKS.find((x) => x.id === b.dataset.perk); const ok = g.buyPerk(p.id); save(); dirty = true; draw(ok ? `Đã mở ${p.n} cấp ${perkLv(g.s, p.id)}.` : 'Không đủ Hồn lực.'); }; });
    });
  };
  draw();
}
/** Thiên mệnh đang theo */
function openFate() {
  const st = g.destinyState();
  if (!st) return;
  const N = g.nemesis();
  openSheet(`<h2>📜 Thiên mệnh</h2>
    <div class="fateCard on big"><b>${esc(st.d.n)}</b><span>${esc(st.d.desc(g))}</span><em>${st.done ? '✓ Đã hoàn thành' : st.failed ? '✕ Không thành' : `Đang theo${st.d.until ? ` · hạn ${st.d.until} tuổi (còn ${Math.max(0, st.d.until - g.P.age)} năm)` : ''}`} · +${st.d.hl} Hồn lực khi kiếp kết thúc</em></div>
    <p class="intro">Hồn lực dùng ở Cây Hồn lực lúc đầu thai để mạnh dần qua các kiếp.</p>
    ${N ? `<h3>⚔ Túc địch</h3>${nemCard(N)}` : ''}`);
}
function openChapter() {
  const ch = g.chapter();
  if (!ch) return;
  openSheet(`<h2>📖 Chương hiện tại</h2>
    <div class="fateCard on big"><b>${ch.c.ic} ${esc(ch.c.n)}</b><span>${esc(ch.c.desc)}</span><em>Từ ${ch.C.from} đến ${ch.C.until} tuổi · còn ${ch.left} năm</em></div>
    <p class="intro">Hết chương sẽ được chọn chương mới. ${ch.c.lock ? 'Đang tử quan nên không đổi việc được.' : 'Tự đổi việc khác là bỏ dở chương, mất hiệu ứng.'}</p>
    <div class="row btnRow"><button class="btn ghost" id="chBreak">${ch.c.lock ? '🚪 Xuất quan sớm' : '✕ Dừng chương'} (mất hiệu ứng)</button></div>`, () => {
    $('chBreak').onclick = () => { g.breakChapter(); save(); dirty = true; $('sheet').hidden = true; };
  });
}
function nemCard({ n, b }) {
  const stg = ['Chưa chạm mặt', 'Đã tranh cơ duyên', 'Thù đã sâu', 'Chờ quyết chiến'][Math.min(3, n.stage || 0)];
  return `<div class="item nemCard"><div class="row"><b>${esc(b.name)}</b><span class="meta">${esc(REALMS[b.realm].n)} · ${b.age} tuổi</span></div>
    <div class="meta">${n.won ? '✓ Ngươi đã hạ hắn trong trận quyết chiến.' : `${stg}${n.losses ? ` · ngươi đã thua ${n.losses} lần` : ''}.`}${n.old ? ' Kẻ thù từ kiếp trước.' : ''}</div>
    <div class="meta">Hắn lớn lên cùng ngươi: ngươi lên cảnh giới nào, hắn cũng không kém bao xa. Gặp ba lần, lần cuối là quyết chiến (có thể mất mạng).</div></div>`;
}


function bar(label, val, max, color, text, key, ticks = 0, loose = 0) {
  const w = clamp((val / Math.max(1, max)) * 100, 0, 100);
  // tu vi chưa vững: phần cuối thanh màu khác
  const lw = loose > 0 ? clamp((loose / Math.max(1, max)) * 100, 0, w) : 0;
  // vạch chia cảnh giới nhỏ trên thanh tu vi
  const tk = ticks > 1 ? Array.from({ length: ticks - 1 }, (_, i) => `<i class="tick" style="left:${((i + 1) * 100) / ticks}%"></i>`).join('') : '';
  return `<div class="bar" data-stat="${key}" role="button" tabindex="0"><span class="bl">${label}</span><div class="track"><div class="fill" style="width:${w}%;background:${color}"></div>${lw ? `<div class="fill loose" style="left:${w - lw}%;width:${lw}%"></div>` : ''}${tk}<span class="num">${text}</span></div></div>`;
}

/** Trong túi có món mặc vào mạnh hơn từ 10% (tính lại khi túi, đồ, cảnh giới đổi) */
let sgKey = '', sgVal = false;
function strongerGear() {
  const P = g.P;
  if (!P.dao) return false;
  const key = [P.realm, P.bag.length, P.bag.map((x) => x.id + '.' + (x.plus || 0) + '.' + x.lv).join(','), Object.values(P.eq).map((x) => (x ? x.id + '.' + (x.plus || 0) + '.' + x.lv : '-')).join(','), P.loadout.join()].join('|');
  if (key !== sgKey) { sgKey = key; sgVal = P.bag.some((x) => g.swapGain(x) >= 0.1); }
  return sgVal;
}
function renderPlay() {
  show('scr-play');
  const P = g.P;
  const life = g.lifespan();
  const sc = P.sect ? g.sect(P.sect) : null;
  drawPortrait($('portrait'), P, { life, robe: playerRobe(P), dead: g.s.phase === 'dead' });
  setArt($('portraitArt'), P.closed > 0 && P.dao ? { src: meditateArt(P.g) } : PATHS[P.path] ? { src: heroStandArt(P.path, P.g) } : null, $('portrait'));
  const ttl = P.title && TITLE_MAP[P.title] ? TITLE_MAP[P.title] : null;
  const need = g.need();
  // khung ảnh: viền theo cảnh giới, sáng lên khi tu vi viên mãn
  const rt = Math.min(4, Math.floor((P.realm % 10) / 2) + (P.plane || 0));
  $('hudPic').dataset.rt = P.dao ? rt : 0;
  $('hudPic').classList.toggle('full', !!P.dao && P.tuvi >= need);
  const pIco = PATHS[P.path] ? `<span class="pathIco" title="${esc(PATHS[P.path].n)}">${PATH_ICO[P.path] || ''}</span>` : '';
  setHTML($('hudLine'), `<span class="hl1"><b class="hudName">${esc(P.name)}</b><span class="realm">${esc(g.subRealmName())}</span><span class="more">›</span></span><span class="hl2">${ttl ? `<span class="ttl t${ttl.tier} mini"><span>${esc(ttl.n)}</span></span>` : ''}<span class="meta">${P.age} tuổi${sc ? ` · ${esc(sc.name)}` : ''}</span>${pIco}</span>`);
  setHTML($('bars'),
    bar('Tu vi', P.tuvi, need, 'var(--tuvi)', P.dao ? `${fmt(P.tuvi)}/${fmt(need)}` : '-', 'tuvi', subN(P.realm), P.loose || 0) +
    bar('Thọ', P.age, life, 'var(--life)', `${P.age}/${life}`, 'tho'));
  const act = g.effectiveAction();
  const mp = act === 'lich_luyen' ? MAP_MAP[P.map] || g.defaultMap() : null;
  const doing = act === 'lon_len' ? (P.age < 6 ? 'Còn nhỏ, cứ lớn lên đã' : 'Chưa nhập đạo, chưa thể tu luyện')
    : act === 'vuot_thap' ? `🗼 ${PLANES[g.plane].tower} · tầng ${g.towerState().f}/1000`
    : `${ACTIONS[act].icon} ${ACTIONS[act].n}${mp ? ` · ${DIFF[mp.d].ic} ${mp.n}` : ''}${mp && P.flags.retreated && MAP_MAP[P.mapGoal] ? ` (dưỡng thương, hồi 80 về ${MAP_MAP[P.mapGoal].n})` : ''}`;
  const nPill = P.pills.hoi_xuan || 0;
  const warn = [];
  if (P.flags.neck && P.flags.neck.realm === P.realm) warn.push(`<button class="hudWarn" data-hw="neck">⛓ Bình cảnh nhỏ · ${Math.max(0, P.flags.neck.until - P.age)} năm</button>`);
  if (g.s.opt && g.s.opt.autoEquip === false && g.skillMismatch().length) warn.push('<button class="hudWarn" data-hw="wep">⚠ Binh khí không hợp đạo</button>');
  if (g.s.opt.autoEquip === false && strongerGear()) warn.push('<button class="hudWarn" data-hw="gear">⚠ Có đồ mạnh hơn</button>');
  if (g.atPlaneTop() && P.tuvi >= g.need() && !(P.tokens && P.tokens[P.plane])) warn.push(`<button class="hudWarn" data-hw="tower">🗼 Cần ${PLANES[P.plane].token}</button>`);
  // chip trạng thái: tháp, sát khí, lịch trình
  const chips = [];
  const wl = woundLv(P.hp);
  if (wl) chips.push(`<button class="hudChip wound w${wl}" data-stat="hp">🩸 ${WOUND_N[wl]}</button>`);
  chips.push(...warn);
  const chp = g.chapter();
  if (chp) chips.push(`<button class="hudChip chap ${chp.c.lock ? 'lock' : ''}" data-hw="chap" title="${esc(chp.c.desc)}">${chp.c.ic} còn ${chp.left} năm</button>`);
  const ds = g.destinyState();
  if (ds) chips.push(`<button class="hudChip fate ${ds.done ? 'ok' : ds.failed ? 'bad' : ''}" data-hw="fate" title="${esc(ds.d.n)}: ${esc(ds.d.desc(g))}">📜 ${ds.done ? '✓' : ds.failed ? '✕' : esc(ds.d.n)}</button>`);
  const nm = g.nemesis();
  if (nm && !nm.n.won) chips.push(`<button class="hudChip nem" data-hw="fate" title="Túc địch">⚔ ${esc(nm.b.name)}</button>`);
  if (g.s.opt.autoPill && P.dao) chips.push(nPill ? `<button class="hudChip" data-stat="pill" title="Hồi Xuân Đan, tự uống khi trọng thương">💊 ${nPill}</button>` : '<button class="hudChip noPill" data-stat="pill" title="Hết Hồi Xuân Đan, mua ở Tụ Bảo">💊 hết đan</button>');
  chips.push(`<button class="hudChip" data-stat="money" title="Linh thạch">💎 ${fmtShort(P.money)}</button>`);
  if (P.dao && (g.towerState().f > 0 || P.action === 'vuot_thap')) chips.push(`<button class="hudChip" data-hw="tower" title="Tầng tháp">🗼 ${g.towerState().f}</button>`);
  if (P.sat >= 1) chips.push(`<button class="hudChip sat ${P.sat >= g.satLine(70) ? 'hi' : P.sat >= g.satLine(50) ? 'mid' : ''}" data-stat="sat">☠ ${Math.round(P.sat)}</button>`);
  if (P.plan) chips.push(`<button class="hudChip plan ${P.plan.on ? 'on' : ''}" data-hw="plan">📅 ${P.plan.on ? `${P.plan.i + 1}/${P.plan.steps.length}` : 'dừng'}</button>`);
  if (P.towerWait && !(P.plan && P.plan.on)) chips.push(`<button class="hudChip wait" data-hw="tower">⏳ chờ tầng ${P.towerWait.f}</button>`);
  setHTML($('hudChips'), chips.join(''));
  // dòng trạng thái chỉ hiện khi nút việc làm chưa nói hết (còn nhỏ, chưa nhập đạo, đang lui dưỡng thương)
  const note = act === 'lon_len' || (mp && P.flags.retreated) ? doing : '';
  setHTML($('hudSub'), note ? `<span>${esc(note)}</span>` : '');

  const canBreak = g.canBreak();
  setHTML($('breakRow'), canBreak ? '<button class="btn primary breakBtn wide" data-do="break">⚡ Tu vi viên mãn · Đột phá</button>' : '');
  setHTML($('speed'),
    `<div class="seg"><button class="sp ${paused ? 'on' : ''}" data-sp="0" aria-label="${paused ? 'Chạy tiếp' : 'Tạm dừng'}">${paused ? '<i class="ic-play"></i>' : '<i class="ic-pause"></i>'}</button>` +
    SPEEDS.map((s) => `<button class="sp ${!paused && s === speed ? 'on' : ''}" data-sp="${s}">${s}×</button>`).join('') + '</div>' +
    `<button class="btn sp auto ask-${askMode}" data-do="auto" aria-label="${esc(ASK[askMode])}" title="${esc(ASK[askMode])}: ${esc(ASK_TIP[askMode])} Bấm để đổi.">${ASK_ICO[askMode]}</button>`);

  let html = '';
  {
    html = Object.entries(ACTIONS).map(([id, a]) => {
      const ok = g.actionOk(id);
      const why = P.age < a.minAge ? `Từ ${a.minAge} tuổi` : a.needDao && !P.dao ? 'Cần nhập đạo' : a.desc;
      const m = id === 'lich_luyen' && ok ? MAP_MAP[P.map] || g.defaultMap() : null;
      if (id === 'vuot_thap') return `<button class="btn act ${P.action === id ? 'on' : ''}" data-act="${id}" data-tip="${esc(ok ? `${a.desc} Đang ở tầng ${g.towerState().f}. Bấm để xem tháp.` : why)}" ${ok ? '' : 'disabled'}>${uiIcon('thap', a.icon)}<span>Tháp</span>${ok && g.towerState().f > 0 ? `<small>Tầng ${g.towerState().f}</small>` : ''}</button>`;
      const sub = m ? `${DIFF[m.d].ic} ${esc(m.n)}` : id === 'muu_sinh' && P.nghe ? `${NGHE[P.nghe.id].icon} cấp ${P.nghe.lv}` : '';
      return `<button class="btn act ${P.action === id ? 'on' : ''}" data-act="${id}" data-tip="${esc(m ? `${a.desc} Đang chọn: ${m.n} (${DIFF[m.d].n}). Bấm để đổi vùng.` : why)}" ${ok ? '' : 'disabled'}>${uiIcon(id, a.icon)}<span>${a.n}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
    }).join('');
  }
  setHTML($('actions'), html);
  setHTML($('utils'), `
      <button class="btn ut" data-do="bag" data-tip="Trang bị, kỹ năng, chiến thuật, đan, nguyên liệu">${uiIcon('hanh_trang', '🎒')}<span>Hành trang</span></button>
      <button class="btn ut" data-do="forge" data-tip="${g.forgeOpen() ? 'Cường hóa, thăng cấp, tẩy luyện, rèn mới' : 'Mở từ 12 tuổi'}" ${g.forgeOpen() ? '' : 'disabled'}>${uiIcon('lo_ren', '⚒')}<span>Lò rèn</span></button>
      <button class="btn ut" data-do="shop" data-tip="Đan dược, pháp khí, bí kíp" ${P.age < 10 ? 'disabled' : ''}>${uiIcon('tu_bao', '🏮')}<span>Tụ Bảo</span></button>
      <button class="btn ut" data-do="more" data-tip="Nhân vật, danh hiệu, cài đặt">${uiIcon('them', '⋯')}<span>Thêm</span></button>`);

  const tabs = [['log', 'Nhật ký'], ['rel', 'Quan hệ'], ['world', 'Thiên hạ'], ['rank', 'Bảng'], ['lives', 'Kiếp']];
  setHTML($('tabs'), tabs.map(([id, n]) => `<button class="${tab === id ? 'on' : ''}" data-tab="${id}">${n}</button>`).join(''));
  const compactEv = document.body.classList.contains('evOpen') && matchMedia('(max-height: 760px) and (max-width: 899px)').matches;
  setHTML($('tabbody'), compactEv && tab !== 'log' ? renderTab('log') : renderTab());
  renderEvent();
}

/** Bảng Nhân vật: ảnh lớn, trang bị, chỉ số, thể chất (trước đây nằm ở màn chính) */
function openChar() {
  const P = g.P;
  if (!P) return;
  const sc = P.sect ? g.sect(P.sect) : null;
  const hon = g.honorific();
  const ttl = P.title && TITLE_MAP[P.title] ? TITLE_MAP[P.title] : null;
  const tinh = P.tinh >= 30 ? 'Hữu tình' : P.tinh <= -30 ? 'Vô tình' : 'Trung dung';
  openSheet(`<div class="hero">
      <div class="charPic"><canvas class="portrait" id="charPortrait" width="32" height="40"></canvas><img id="charArt" class="art" alt="" hidden></div>
      <div class="who">
        ${ttl ? `<button class="ttl t${ttl.tier}" id="ttlBtn"><span>${esc(ttl.n)}</span></button>` : ''}
        <h2 class="charName">${esc(P.name)}</h2>
        ${hon ? `<div class="daohieu">${esc(hon)}</div>` : ''}
        <div class="sub">${P.age} tuổi · Kiếp ${P.lifeNo} · ${esc(P.root.n)}</div>
        <div class="sub"><span class="realm">${esc(g.subRealmName())}</span>${P.path && PATHS[P.path] ? ` · <button class="pathTag" data-stat="path">${esc(PATHS[P.path].n)}</button>` : ''}${P.dao ? '' : ' · chưa nhập đạo'}${sc ? ` · ${esc(sc.name)}` : P.dao ? ' · tán tu' : ''}</div>
        <button class="eqStrip" id="eqStrip" aria-label="Mở hành trang">${Object.keys(SLOTS).map((sl) => (P.eq && P.eq[sl] ? itemIco(P.eq[sl]) : icoImg({ kind: SLOT_KIND[sl], faded: true }, 'empty'))).join('')}</button>
      </div></div>
    <h3>Chỉ số · chạm để xem giải thích</h3>
    <div class="stats">${Object.keys(STAT_NAMES).map((k) => `<button class="chip chipBtn" data-stat="${k}">${STAT_NAMES[k]} <b>${P.stats[k]}</b></button>`).join('')}
      <button class="chip chipBtn" data-stat="tinh">${tinh} <b>${P.tinh > 0 ? '+' : ''}${P.tinh}</b></button>
      <button class="chip chipBtn" data-stat="money">Linh thạch <b>${fmt(P.money)}</b></button>
      <button class="chip chipBtn" data-stat="fame">Danh vọng <b>${fmt(P.fame)}</b></button>
      ${P.flags.pet ? `<span class="chip">Linh thú: ${esc(P.flags.pet)}</span>` : ''}</div>
    <h3>Thể chất, thiên phú</h3>
    <button class="chip chipBtn" id="traitChip">${esc(g.traits().filter((t) => !t.cond && !t.tt && !t.path).map((t) => t.n).join(' · '))} ›</button>
    <div class="row btnRow"><button class="btn ghost" id="charTitles">🏅 Danh hiệu (${P.titles.length})</button><button class="btn ghost" id="charBag">🎒 Hành trang</button></div>`, () => {
    drawPortrait($('charPortrait'), P, { life: g.lifespan(), robe: playerRobe(P) });
    setArt($('charArt'), P.closed > 0 && P.dao ? { src: meditateArt(P.g) } : PATHS[P.path] ? { src: heroStandArt(P.path, P.g) } : null, $('charPortrait'));
    $('eqStrip').onclick = () => openBag('eq');
    $('charBag').onclick = () => openBag('eq');
    $('charTitles').onclick = openTitles;
    $('traitChip').onclick = openTraits;
    if ($('ttlBtn')) $('ttlBtn').onclick = openTitles;
  });
}
function openMore() {
  const P = g.P;
  openSheet(`<h2>Thêm</h2><div class="list">
    <button class="btn" id="moChar">👤 Nhân vật<small>Chỉ số, thể chất, trang bị đang mang</small></button>
    <button class="btn" id="moTitles">🏅 Danh hiệu<small>${P.titles.length ? `Đã có ${P.titles.length}` : 'Chưa có'}</small></button>
    <button class="btn" id="moSocial">☕ Quan hệ, trợ chiến<small>Đạo lữ, bạn thân trợ chiến, hộ pháp lôi kiếp</small></button>
    <button class="btn" id="moPlan">📅 Lịch trình tự động<small>${P.plan ? (P.plan.on ? 'Đang chạy' : 'Đang dừng') : 'Tự đổi việc theo vòng: leo tháp, tu luyện, lịch luyện...'}</small></button>
    <button class="btn" id="moSet">⚙ Cài đặt<small>Tự mặc, xử lý đồ, đan, tháp, xem trận, giao diện</small></button>
    <button class="btn" id="moMenu">❓ Hướng dẫn, bản lưu<small>Cách chơi, cập nhật, xuất nhập bản lưu, thế giới mới</small></button></div>`, () => {
    $('moSet').onclick = () => openBag('set');
    $('moChar').onclick = openChar;
    $('moTitles').onclick = openTitles;
    $('moPlan').onclick = openPlan;
    $('moSocial').onclick = openSocial;
    $('moMenu').onclick = () => $('menuBtn').onclick();
  });
}

// lọc nhật ký
let logFilter = 'all';
const IMPORTANT_RE = /Tin dữ|thần khí|Thần khí|Đột phá thành công|Giang hồ bắt đầu gọi|danh hiệu|ngã xuống|Bình cảnh nhỏ|phi thăng|đoạt được/;
const LOG_FILTER = {
  all: { n: 'Tất cả', test: () => true },
  ev: { n: 'Kỳ ngộ', test: (l) => !!l.h },
  fight: { n: 'Chiến đấu', test: (l) => /Giao đấu|hạ được|đánh bại|đánh chết|Nghênh chiến/.test(l.t + (l.c || '')) },
  big: { n: 'Quan trọng', test: (l) => l.tone === 'big' || IMPORTANT_RE.test(l.t) || (l.h && /Bình cảnh|Ngã rẽ|Đạo hiệu|Tâm ma|Truyền thừa|Bí cảnh/.test(l.h)) },
};
const PATH_ICO = { kiem: '⚔', the: '🛡', tinh: '👁' };
const ASK_ICO = { all: '🔔', big: '🛎', max: '🔕' };
/** Số gọn: 1.098 / 12,5k / 3,2tr */
function fmtShort(n) {
  n = Math.floor(n);
  if (n < 100000) return fmt(n);
  if (n < 1e8) return (n / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'k';
  return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'tr';
}
/** Biểu tượng nhỏ đầu dòng nhật ký theo loại */
/** Nhật ký: số sinh lực ẩn đi, đổi thành chữ thương thế */
const woundText = (t) => t.replace(/Sinh lực -(\d+)/g, 'Bị thương').replace(/sinh lực -(\d+)/g, 'bị thương').replace(/Sinh lực \+(\d+)/g, 'Hồi phục thương thế').replace(/sinh lực \+(\d+)/g, 'hồi phục thương thế').replace(/[Ss]inh lực (hồi )?đầy/g, 'thương thế lành hẳn');
function logIco(l) {
  const t = l.t + ' ' + (l.c || '');
  if (/Đột phá|đột phá|phi thăng|Phi thăng|lôi kiếp/.test(t)) return '⚡';
  if (LOG_FILTER.fight.test(l) || /\bTháp\b|vượt tầng|leo tầng/.test(t)) return '⚔';
  if (l.h) return '✦';
  if (/danh hiệu/.test(t)) return '🏅';
  if (/Tâm pháp .* lên tầng|lĩnh ngộ|Lĩnh ngộ|kỹ năng/.test(t)) return '☯';
  if (/linh thạch|nhặt được|bán |phân giải/.test(t)) return '◈';
  if (l.tone === 'big') return '★';
  if (l.tone === 'bad') return '✕';
  if (l.tone === 'good') return '✓';
  return '·';
}
function renderTab(t = tab) {
  if (t === 'log') {
    const all = g.s.log.slice(-160).reverse();
    const items0 = (logFilter === 'all' ? all : all.filter((l) => LOG_FILTER[logFilter].test(l))).slice(0, 80);
    // gộp các dòng ngắn liền nhau cùng tuổi, cùng loại (vd. ba danh hiệu cùng năm) thành một dòng
    const items = [];
    for (const l of items0) {
      const last = items[items.length - 1];
      if (last && !l.h && !last.h && last.a === l.a && last.tone === l.tone && l.t.length < 110 && last.t.length < 260 && logIco(last) === logIco(l)) last.t = `${l.t} · ${last.t}`;
      else items.push(l.h ? l : { ...l });
    }
    const bar = `<div class="logFilter">${Object.entries(LOG_FILTER).map(([k, f]) => `<button class="${logFilter === k ? 'on' : ''}" data-lf="${k}">${f.n}</button>`).join('')}</div>`;
    const n = g.s.log.length;
    const fresh = performance.now() < freshUntil ? freshFrom : Infinity;
    return bar + (items.length ? '' : '<p class="empty">Chưa có dòng nào trong mục này.</p>') + `<ul class="log">${items.map((l, i) => {
      const idx = n - 1 - i;
      const cls = `${l.tone}${idx >= fresh ? ' fresh' : ''}`;
      const ic = `<i class="lic">${logIco(l)}</i>`;
      if (l.h) return `<li class="${cls}">${ic}<span class="age">${l.a} tuổi</span><b class="evH">${esc(l.h)}</b>${l.c ? `<span class="evC">→ ${esc(l.c)}</span>` : ''}<div class="evR">${rich(woundText(l.t))}</div></li>`;
      return `<li class="${cls}">${ic}<span class="age">${l.a} tuổi</span>${rich(woundText(l.t))}</li>`;
    }).join('')}</ul>`;
  }
  if (tab === 'rel') {
    const list = g.known().sort((a, b) => Math.abs(b.r.v) - Math.abs(a.r.v) || (b.r.tag ? 1 : 0) - (a.r.tag ? 1 : 0));
    if (!list.length) return '<p class="empty">Ngươi chưa quen ai. Mưu sinh ở trấn là dễ gặp người nhất; lịch luyện, tu luyện trong tông môn hay leo tháp cũng có thể quen biết.</p>';
    return `<div class="list">${list.map(({ b, r }) => {
      const cls = r.v >= 20 || ['huynh_de', 'dao_lu', 'su_phu', 'de_tu'].includes(r.tag) ? 'pos' : r.v <= -20 || r.tag === 'thu' ? 'neg' : '';
      const sc = b.sect ? g.sect(b.sect) : null;
      const seen = g.thas('seePast') && b.prevName && !r.past.length ? `<div class="meta">Tiền kiếp: ${esc(b.prevName)} · đã luân hồi ${b.lives - 1} lần</div>` : '';
      const past = r.past.length ? `<div class="meta">Kiếp trước: ${esc(r.past[r.past.length - 1].name)}</div>` : seen;
      const bt = THE_MAP[b.the];
      const theTxt = bt && bt.id !== 'pham' ? ` · <span class="t${bt.tier}c">${esc(bt.n)}</span>` : '';
      const bh = g.botHonorific(b);
      return `<div class="item withAv">${botAvatar(b)}<div class="body"><div class="row"><b>${esc(b.name)}${bh ? ` <span class="dhSmall">${esc(bh)}</span>` : ''}</b><span class="tag ${cls}">${esc(g.relLabel(r))} ${r.v > 0 ? '+' : ''}${r.v}</span></div>
        <div class="meta">${realmLabel(b.realm, b.tuvi)} · ${b.age} tuổi · ${PERSONALITIES[b.pers].n}${sc ? ` · ${esc(sc.name)}` : ''}${theTxt}</div>${botWhere(b)}${past}</div></div>`;
    }).join('')}</div>`;
  }
  if (tab === 'world') {
    const ss = g.aliveSects().map((sc) => {
      const m = g.members(sc.id);
      const lead = m.sort((a, b) => b.realm - a.realm || b.tuvi - a.tuvi)[0];
      return `<div class="item"><div class="row"><b><span class="sectDot" style="background:${sc.color}"></span>${esc(sc.name)}</b><span class="meta">${m.length} đệ tử</span></div>
        <div class="meta">${lead ? `Mạnh nhất: ${esc(lead.name)} (${REALMS[lead.realm].n})` : 'Không còn ai'} · Lập năm ${fmt(sc.founded)}${g.playing && g.P.sect === sc.id ? ' · Tông môn của ngươi' : ''}</div></div>`;
    }).join('');
    const pl = g.plane;
    const ch = g.s.chron.filter((c) => (c.pl ?? 0) === pl || c.imp >= 3).slice(-60).reverse();
    const er = g.era();
    return `${er ? `<div class="eraCard"><b>${er.e.ic} Thời ${esc(er.e.n)}</b><span>${esc(er.e.desc)}</span><em>Từ năm ${fmt(er.from)} · còn khoảng ${fmt(Math.max(0, er.until - g.s.year))} năm</em></div>` : ''}<h3>Tông môn · ${PLANES[pl].n}</h3><div class="list">${ss || '<p class="empty">Thiên hạ không còn tông môn nào.</p>'}</div>
      <h3>Thiên hạ ký sự · ${PLANES[pl].n}</h3><ul class="log">${ch.map((c) => `<li class="${c.imp >= 3 ? 'big' : ''}"><span class="age">Năm ${fmt(c.y)}${(c.pl ?? 0) !== pl ? ` · ${PLANES[c.pl ?? 0].n}` : ''}</span>${esc(c.t)}</li>`).join('') || '<li class="empty">Thiên hạ thái bình.</li>'}</ul>`;
  }
  if (tab === 'rank') {
    const rk = g.ranking(20);
    const tw = g.towerRanking(10);
    const towerBoard = `<h3>Bảng ${PLANES[g.plane].tower}</h3><div class="list">${tw.map((x, i) => `<div class="item ${x.me ? 'me' : ''}"><div class="row"><b>${i + 1}. ${esc(x.name)}${x.me ? ' (ngươi)' : ''}</b><span class="meta">Tầng ${x.f}/1000 · ${realmLabel(x.realm, x.tuvi)}</span></div></div>`).join('') || '<p class="empty">Chưa ai leo tháp.</p>'}</div>`;
    return `<h3>Bảng Thiên Kiêu · ${PLANES[g.plane].n}</h3><div class="list">${rk.map((x, i) => {
      const sc = x.sect ? g.sect(x.sect) : null;
      const P = g.P;
      const av = x.me
        ? `<img class="avatar" alt="" src="${spriteURL({ seed: P.look, g: P.g, age: P.age, life: g.lifespan(), realm: P.realm, robe: playerRobe(P), wep: P.eq && P.eq.vu_khi ? P.eq.vu_khi.wt : null })}">`
        : botAvatar(g.soul(x.id));
      const xh = x.me ? g.honorific() : g.botHonorific(g.soul(x.id));
      const leader = sc && !x.me ? g.members(sc.id).sort((a, b) => b.realm - a.realm || b.tuvi - a.tuvi)[0] : null;
      const badge = i === 0 ? '<span class="tag gold">Bảng thủ</span>' : leader && leader.id === x.id ? '<span class="tag">Chưởng môn</span>' : '';
      return `<div class="item withAv ${x.me ? 'me' : ''}">${av}<div class="body"><div class="row"><b>${i + 1}. ${esc(x.name)}${x.me ? ' (ngươi)' : ''}${xh ? ` <span class="dhSmall">${esc(xh)}</span>` : ''}</b><span class="meta">${realmLabel(x.realm, x.prog * REALMS[x.realm].need)}</span></div>
        <div class="meta">${x.age} tuổi${sc ? ` · ${esc(sc.name)}` : ' · tán tu'} ${badge}</div>${x.me ? '' : botWhere(g.soul(x.id))}</div></div>`;
    }).join('')}</div>${towerBoard}`;
  }
  if (tab === 'lives') return '<h3>Các kiếp đã qua</h3>' + livesList() + `<details class="more codexBox"><summary>📜 Sổ sưu tầm qua các kiếp (danh hiệu, thể chất)</summary>${titleCodex()}${codex()}</details>`;
  return '';
}

/** Danh hiệu lục: mọi danh hiệu linh hồn này từng được xưng tụng */
function titleCodex() {
  const seen = new Set(g.s.seenTitles || []);
  const got = TITLES.filter((t) => seen.has(t.id)).length;
  return `<h3>Danh hiệu lục · ${got}/${TITLES.length}</h3><div class="codex">${TITLES.map((t) => seen.has(t.id)
    ? `<span class="cx t${t.tier === 1 ? 0 : t.tier}" title="${esc(t.cond)}">${esc(t.n)}</span>`
    : `<span class="cx locked" title="${esc(t.cond)}">??? · ${esc(t.cond)}</span>`).join('')}</div>`;
}

/** Sổ thể chất: những thể chất linh hồn này từng thức tỉnh */
function codex() {
  const seen = new Set(g.s.seenThe || []);
  const list = THE_CHAT.filter((t) => t.tier > 0);
  const got = list.filter((t) => seen.has(t.id)).length;
  return `<h3>Sổ thể chất · ${got}/${list.length}</h3><div class="codex">${list.map((t) => seen.has(t.id)
    ? `<span class="cx t${t.tier}" title="${esc(t.desc)}">${esc(t.n)}</span>`
    : `<span class="cx locked t${t.tier}">${TIER_N[t.tier]} · ???</span>`).join('')}</div>`;
}

function livesList() {
  const ls = g.s.lives.slice().reverse();
  if (!ls.length) return '<p class="empty">Đây là kiếp đầu tiên.</p>';
  return `<div class="list">${ls.map((l) => `<div class="item"><div class="row"><b>Kiếp ${l.no}: ${esc(l.name)}${l.dh ? ` <span class="dhSmall">${esc(l.dh)}</span>` : ''}</b><span class="meta">${l.age} tuổi</span></div>
    ${l.title ? `<div class="meta">「${esc(l.title)}」${l.nTitles > 1 ? ` và ${l.nTitles - 1} danh hiệu khác` : ''}</div>` : ''}
    <div class="meta">${REALMS[l.realm].n}${l.sect ? ` · ${esc(l.sect)}` : ''} · ${esc(l.cause)}</div></div>`).join('')}</div>`;
}

function renderDead() {
  show('scr-dead');
  const d = g.s.deadInfo;
  if (!d) return;
  const l = d.rec;
  const bonds = g.s.souls.filter((b) => b.alive && g.s.rel[b.id] && g.s.rel[b.id].cn);
  const fr = bonds.filter((b) => g.s.rel[b.id].cn.v > 0).length;
  const en = bonds.length - fr;
  $('scr-dead').innerHTML = `
    <div class="card fate">
      <div class="head">
        <canvas class="portrait" id="deadPortrait" width="32" height="40"></canvas>
        <div class="who">
          <h1>${esc(l.name)}</h1>
          <div class="sub">Kiếp ${l.no} · hưởng thọ ${l.age} tuổi</div>
          <div class="realm">${l.asc ? 'Phi thăng' : REALMS[l.realm].n}</div>
        </div>
      </div>
      <div>${esc(l.name)} ${esc(l.cause)}.</div>
      ${d.last ? `<div class="lastMoment"><b>${esc(d.last.h)}</b> <span class="evC">→ ${esc(d.last.c)}</span><div class="evR">${rich(d.last.t)}</div></div>` : ''}
      <div class="meta">${fr ? `${fr} người vẫn nhớ ngươi.` : ''} ${en ? `${en} kẻ thù vẫn chưa quên.` : ''} Thế giới vẫn tiếp tục khi ngươi vắng mặt.</div>
    </div>
    ${d.hl ? `<div class="altar hlGain"><div class="row"><b>Hồn Lực</b><span class="hl">+${fmt(d.hl.total)} · tổng <b>${fmt(g.s.honLuc || 0)}</b></span></div>
      ${d.hl.lines.length ? `<ul class="statList">${d.hl.lines.map((x) => `<li>${esc(x.t)}: +${x.n}</li>`).join('')}</ul>` : '<div class="meta">Kiếp này quá ngắn, linh hồn chưa kịp tích được gì.</div>'}
      <div class="meta">Dùng ở Đài Luân Hồi khi đầu thai để thêm thể chất.</div></div>` : ''}
    <h3>Chọn một tàn niệm mang sang kiếp sau</h3>
    <div class="legacies">${d.options.map((id) => {
      const x = LEGACIES.find((q) => q.id === id);
      if (id === 'than_khi' && d.myth) {
        const it = d.myth;
        return `<button class="btn legMyth" data-leg="${id}"><span class="legRow">${itemIco(it)}<span><b>${esc(x.n)}</b><small>Mang <span class="q4">${esc(it.n)}</span> (${esc(REALMS[it.lv].n)}) sang kiếp sau. Phải tu lại tới ${esc(REALMS[it.lv].n)} mới mở hết sức mạnh${it.tt && TT_MAP[it.tt] ? ` và thần thông ${esc(TT_MAP[it.tt].n)}` : ''}.</small></span></span></button>`;
      }
      return `<button class="btn" data-leg="${id}"><b>${esc(x.n)}</b><small>${esc(x.desc)}</small></button>`;
    }).join('')}</div>
    <h3>Sổ kiếp</h3>${livesList()}${codex()}`;
  drawPortrait($('deadPortrait'), { ...g.P, age: l.age }, { life: g.lifespan(), robe: playerRobe(g.P), dead: !l.asc, asc: l.asc });
  $('scr-dead').querySelectorAll('[data-leg]').forEach((b) => {
    b.onclick = () => { g.chooseLegacy(b.dataset.leg); save(); dirty = true; window.scrollTo(0, 0); };
  });
}

/** Kỳ ngộ hiện ngay trong vùng giữa (không phủ màn hình), dải điều khiển dưới vẫn dùng được */
function renderEvent() {
  const p = g.s.pending;
  const v = g.eventView();
  const fighting = !!(p && v && v.done && p.battles && p.bi < p.battles.length);
  if (fighting && !bt) startBattle(p.battles[p.bi], p.fast);
  $('battle').hidden = !bt;
  const ask = !!(v && !v.done);
  // chọn đạo lộ: màn riêng, không dùng thẻ kỳ ngộ
  const pick = ask && p.id === 'dao_do' && !bt;
  renderPathPick(pick);
  const showCard = ask && !bt && !pick;
  $('evPanel').hidden = !showCard;
  document.body.classList.toggle('evOpen', showCard || !!bt);
  if (!showCard) return;
  const P = g.P;
  const mp = g.curMap();
  setHTML($('evKicker'), `Kỳ ngộ · ${P ? P.age : ''} tuổi${mp ? ` · ${DIFF[mp.d].ic} ${esc(mp.n)}` : ''}${P && woundLv(P.hp) ? ` · <span class="${P.hp < 40 ? 'lowHp' : ''}">🩸 ${WOUND_N[woundLv(P.hp)].toLowerCase()}</span>` : ''}`);
  $('evTitle').textContent = v.title;
  setHTML($('evText'), rich(v.text));
  const pv = g.s.pending && g.s.pending.id !== 'chuong' ? g.choicePreview() : null;
  const ACT_N = { tu_luyen: '☯ Tu luyện', lich_luyen: '⛰ Lịch luyện', muu_sinh: '⚖ Mưu sinh', vuot_thap: '🗼 Tháp' };
  const cards = g.s.pending && g.s.pending.id === 'chuong' ? (g.s.pending.data.cards || []) : null;
  setHTML($('evChoices'), cards
    ? cards.map((id, i) => { const c = CHAPTER_MAP[id]; return `<button class="btn chapCard" data-ch="${i}"><span class="chIc">${c.ic}</span><span class="chT"><b>${esc(c.n)}</b><span>${esc(c.desc)}</span><em>${ACT_N[c.act]}${c.lock ? ' · khóa 10 năm' : ''}</em></span></button>`; }).join('')
    : v.choices.map((c, i) => `<button class="btn" data-ch="${i}"><span class="chNo">${i + 1}</span><span class="chT">${esc(c)}${pv && pv[i] ? pvTags(pv[i]) : ''}</span></button>`).join(''));
}
// ---------- Màn chọn đạo lộ ----------
let ppShown = false;
function renderPathPick(on) {
  let el = $('pathPick');
  if (!on) { if (el) el.hidden = true; ppShown = false; return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'pathPick';
    el.className = 'pathPick';
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.pp) { const i = Object.keys(PATHS).indexOf(b.dataset.pp); el.hidden = true; ppShown = false; pickChoice(i); }
      if (b.dataset.pt) { const res = g.trialPath(b.dataset.pt); el.hidden = true; startBattle(res, false, () => { ppShown = false; dirty = true; }); }
    });
  }
  if (ppShown && !el.hidden) return;
  ppShown = true;
  const P = g.P;
  const sug = g.pathSuggest()[0];
  const sc = g.pathScores();
  el.innerHTML = `<div class="ppBox"><h2>Chọn đạo lộ</h2>
    <p class="intro">${P.flags.pathReset ? 'Pháp tắc thiên địa đổi thay, con đường cũ không còn. ' : ''}Mỗi đường một bộ 8 kỹ năng riêng (chiêu, tuyệt kỹ, bị động), mở dần theo cảnh giới. Chọn đúng đường hợp thiên tư được thêm 3 ngộ đạo điểm. Mỗi kiếp được chuyển tu một lần.</p>
    <div class="ppCards">${Object.entries(PATHS).map(([id, pa]) => `<div class="ppCard ${id === sug ? 'sug' : ''} pp_${id}">
      ${id === sug ? '<span class="ppSug">Hợp thiên tư nhất</span>' : ''}
      <img class="ppHero" alt="" src="${heroStandArt(id, P.g)}" style="filter:${heroFilter(id, P.g) || 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))'}">
      <h3>${pa.icon} ${esc(pa.n)}</h3><div class="ppTag">${esc(pa.tag)}</div>
      <div class="ppBars">${Object.entries(pa.bars).map(([k, v]) => `<div><span>${PATH_BAR_N[k]}</span><i>${'<b></b>'.repeat(v)}${'<u></u>'.repeat(5 - v)}</i></div>`).join('')}</div>
      <div class="ppSk">${PATH_SKILLS[id].map((k) => skIco(k)).join('')}</div>
      <ul class="ppGood">${pa.good.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <ul class="ppBad">${pa.bad.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="meta">Thanh ${esc(pa.res)} · binh khí: ${WEAPON_TYPES[pa.wep].n.toLowerCase()} · thiên tư ${Math.round(sc[id])}</div>
      <div class="row btnRow"><button class="btn ghost" data-pt="${id}">⚔ Thử đạo</button><button class="btn primary" data-pp="${id}">Chọn ${esc(pa.n)}</button></div>
    </div>`).join('')}</div></div>`;
  el.hidden = false;
}

/** Chọn xong: kết quả vào nhật ký, diễn trận nếu cần, rồi chạy tiếp ngay */
function pickChoice(i) {
  const p = g.s.pending;
  if (!p || p.result !== undefined) return;
  const hp0 = g.P ? g.P.hp : 0;
  g.choose(i);
  if (p.result === undefined) return;
  if (p.battles) { p.battles = p.battles.filter(wantBattle); p.bi = 0; }
  if (!p.battles || !p.battles.length) g.dismiss();
  if (g.playing && g.P.hp < 25 && g.P.hp < hp0) g.toast('Ngươi bị thương nguy kịch. Nên tu luyện dưỡng thương.', 'Nguy kịch', 0);
  markFresh();
  save();
  dirty = true;
}
function wantBattle(res) {
  if (wantTower(res)) return true;
  if (battleView === 'off') return false;
  if (!paused && speed >= AUTO_SPEED) return false;
  return battleView === 'all' || res.big || res.died;
}
/** Trận mốc trong tháp: diễn cả khi chạy nhanh (chạy nhanh thì diễn tốc độ cao) */
function wantTower(res) {
  if (!res.tower || towerView === 'off') return false;
  return res.tower === 'boss' || towerView === 'all';
}
const fastNow = () => !paused && speed >= AUTO_SPEED;
$('evChoices').addEventListener('click', (e) => { const b = e.target.closest('[data-ch]'); if (b) pickChoice(+b.dataset.ch); });
// dòng nhật ký mới sáng lên một lúc
let freshFrom = 0, freshUntil = 0;
function markFresh() { freshFrom = Math.min(freshFrom || Infinity, g.s.log.length - 1); freshUntil = performance.now() + 2600; }

/** Chữ có mã biểu tượng: thoát HTML rồi thay mã bằng ảnh */
function rich(t) {
  return esc(t).replace(ICON_TOKEN_RE, (m, kind, q, col) => (kind.startsWith('art_') ? `<img class="ico inl art" alt="" src="${skillArt(kind.slice(4))}">` : `<img class="ico inl q${q}" alt="" src="${iconURL({ kind, q: +q, col: col === '-' ? null : col })}">`));
}

// ---------- Diễn lại trận đấu ----------
let bt = null;
let btFast = false;
function lookOf(l) {
  return l.type === 'beast' ? { type: 'beast', seed: l.seed, realm: l.realm, name: l.name } : { ...l };
}
function setGauge(el, v, max) {
  const w = clamp((v / Math.max(1, max)) * 100, 0, 100);
  el.querySelector('i').style.width = w + '%';
  const sp = el.querySelector('span');
  if (sp) sp.textContent = `${fmt(Math.max(0, v))}/${fmt(max)}`;
}
function floatText(side, text, cls) {
  const host = $(side === 'a' ? 'fA' : 'fB');
  const el = document.createElement('span');
  el.className = 'float ' + cls;
  el.textContent = text;
  el.style.left = 30 + Math.random() * 40 + '%';
  host.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}
function startBattle(res, fast = false, onClose = null) {
  bt = { res, i: 0, timer: null, closeT: null, fast: btFast || fast || (!!res.tower && fastNow()), done: false, onClose };
  $('battle').hidden = false;
  $('btTitle').textContent = res.label || `${res.a.name} ⚔ ${res.b.name}`;
  const arena = $('battle').querySelector('.arena');
  arena.classList.toggle('isBoss', !!res.boss);
  arena.classList.toggle('isTower', !!res.tower);
  arena.classList.remove('rage');
  arena.style.setProperty('--stageBg', res.bg || '');
  $('btPhase').hidden = !res.phases;
  if (res.phases) setHTML($('btPhase'), Array.from({ length: res.phases }, (_, i) => `<i class="${i + 1 < res.phase ? 'done' : i + 1 === res.phase ? 'cur' : ''}">${i + 1}</i>`).join(''));
  for (const [side, f] of [['A', res.a], ['B', res.b]]) {
    const box = $('f' + side);
    box.querySelectorAll('.float').forEach((x) => x.remove());
    box.classList.remove('lunge', 'hit', 'down');
    drawSprite(box.querySelector('canvas'), lookOf(f.look));
    // quái: lật theo hướng gốc để nhìn về phía nhân vật; người (ngươi, bot) giữ như ban đầu: bên trái không lật, bên phải lật
    setArt(box.querySelector('img.art'), artOf(f.look), box.querySelector('canvas'), f.look && f.look.type === 'beast' ? 'L' : null);
    if (f.look && f.look.type !== 'beast') box.querySelector('img.art').style.setProperty('--sx', side === 'B' ? -1 : 1);
    box.querySelector('.fname').textContent = f.name;
    const chg = box.querySelector('.gauge.ch');
    chg.hidden = !f.chMax;
    if (f.chMax) { chg.querySelector('i').style.background = PATH_RES[f.path].col; chg.dataset.max = f.chMax; chg.dataset.n = PATH_RES[f.path].n; setCh(chg, 0); }
  }
  const aHp0 = Math.round((res.a.maxHp * (res.a.hp0 ?? 100)) / 100);
  setGauge($('fA').querySelector('.hp'), aHp0, res.a.maxHp);
  setGauge($('fB').querySelector('.hp'), res.b.maxHp, res.b.maxHp);
  setGauge($('fA').querySelector('.mp'), 100, 100);
  setGauge($('fB').querySelector('.mp'), 100, 100);
  $('btLog').innerHTML = '';
  $('btBanner').textContent = '';
  $('btRound').textContent = '';
  $('btNext').textContent = 'Bỏ qua';
  $('btFast').classList.toggle('on', bt.fast);
  // trùm: màn giới thiệu; giai đoạn sau: nổi giận
  let delay = bt.fast ? 250 : 500;
  if (res.intro) {
    $('btBanner').innerHTML = `<b>${esc(res.intro.n)}</b><small>${esc(res.intro.th)}${res.intro.mech ? ` · ${esc(res.intro.mech)}` : ''}</small>`;
    $('btBanner').className = 'banner show big intro';
    delay = bt.fast ? 900 : 1700;
  } else if (res.rage) {
    arena.classList.add('rage');
    $('btBanner').textContent = `Giai đoạn ${res.phase} · Nổi giận!`;
    $('btBanner').className = 'banner show big rageB';
    delay = bt.fast ? 700 : 1300;
  }
  bt.timer = setTimeout(stepBattle, delay);
}
function setCh(el, v) {
  const max = +el.dataset.max || 1;
  el.querySelector('i').style.width = clamp((v / max) * 100, 0, 100) + '%';
  el.querySelector('span').textContent = `${el.dataset.n} ${v}/${max}`;
  el.classList.toggle('full', v >= max);
}
function applySnap(t) {
  const r = bt.res;
  if (r.a.chMax && t.aCh !== undefined) setCh($('fA').querySelector('.gauge.ch'), t.aCh);
  if (r.b.chMax && t.bCh !== undefined) setCh($('fB').querySelector('.gauge.ch'), t.bCh);
  setGauge($('fA').querySelector('.hp'), t.aHp, r.a.maxHp);
  setGauge($('fB').querySelector('.hp'), t.bHp, r.b.maxHp);
  setGauge($('fA').querySelector('.mp'), t.aMp, 100);
  setGauge($('fB').querySelector('.mp'), t.bMp, 100);
  $('fA').classList.toggle('shielded', t.aSh > 0);
  $('fB').classList.toggle('shielded', t.bSh > 0);
}
function stepBattle() {
  if (!bt || bt.done) return;
  const r = bt.res;
  const t = r.turns[bt.i];
  if (!t) return endBattle();
  const me = t.side === 'a' ? $('fA') : $('fB');
  const foe = t.side === 'a' ? 'b' : 'a';
  $('btRound').textContent = `Hiệp ${t.round}`;
  if (t.dot) floatText(t.side, `-${t.dot.dmg}`, 'dot');
  if (t.stunned) floatText(t.side, t.stunned, 'status');
  if (t.skill) {
    const big = t.skill !== 'quyen' && t.skill !== 'can_xe';
    $('btBanner').innerHTML = `${skIco(t.skill, 'inl')}${t.ult ? 'Tuyệt kỹ · ' : ''}${esc(t.skillN)}`;
    $('btBanner').className = 'banner show ' + (big ? 'big ' : '') + (t.ult ? 'ult ' : '') + (t.side === 'a' ? 'left' : 'right');
    if (t.ult) { const ar = $('battle').querySelector('.arena'); ar.classList.remove('ultFx'); void ar.offsetWidth; ar.classList.add('ultFx'); }
    me.classList.remove('lunge'); void me.offsetWidth; me.classList.add('lunge');
    const foeEl = $(foe === 'a' ? 'fA' : 'fB');
    setTimeout(() => {
      if (t.hits.some((h) => !h.miss)) { foeEl.classList.remove('hit'); void foeEl.offsetWidth; foeEl.classList.add('hit'); }
      t.hits.forEach((h, k) => setTimeout(() => floatText(foe, h.miss ? 'Né!' : `-${h.dmg}`, h.miss ? 'miss' : h.crit ? 'crit' : 'dmg'), k * 120));
      if (t.heal) floatText(t.side, `+${t.heal}`, 'heal');
      if (t.shield) floatText(t.side, `Khiên ${t.shield}`, 'shield');
      if (t.drain) floatText(t.side, `+${t.drain}`, 'heal');
      if (t.applied) floatText(foe, t.applied, 'status');
      if (t.self) floatText(t.side, t.self, 'status');
      applySnap(t);
    }, bt.fast ? 120 : 260);
  } else applySnap(t);
  const li = document.createElement('li');
  li.className = t.side === 'a' ? 'mine' : 'theirs';
  li.textContent = turnText(t, r.a.name, r.b.name);
  $('btLog').prepend(li);
  while ($('btLog').children.length > 6) $('btLog').lastChild.remove();
  bt.i++;
  bt.timer = setTimeout(stepBattle, bt.fast ? (fastNow() && bt.res.tower ? 150 : 420) : 900);
}
function endBattle() {
  clearTimeout(bt.timer);
  bt.done = true;
  const r = bt.res;
  const last = r.turns[r.turns.length - 1];
  if (last) applySnap(last);
  (r.win ? $('fB') : $('fA')).classList.add('down');
  $('btBanner').textContent = r.win ? 'Thắng!' : 'Bại...';
  $('btBanner').className = 'banner show big result ' + (r.win ? 'win' : 'lose');
  $('btNext').textContent = 'Đóng';
  // đánh xong tự đóng, không bắt bấm
  bt.closeT = setTimeout(closeBattle, bt.fast ? (fastNow() ? 500 : 900) : 1600);
}
function closeBattle() {
  if (!bt) return;
  clearTimeout(bt.timer);
  clearTimeout(bt.closeT);
  $('battle').hidden = true;
  const cb = bt.onClose;
  bt = null;
  if (cb) { cb(); save(); dirty = true; return; }
  const p = g.s.pending;
  if (p && p.battles) {
    p.bi++;
    if (p.bi >= p.battles.length) { g.dismiss(); markFresh(); }
  }
  save();
  dirty = true;
}
$('btNext').onclick = closeBattle;
$('btFast').onclick = () => {
  if (!bt) return;
  bt.fast = btFast = !btFast;
  $('btFast').classList.toggle('on', bt.fast);
};

// ---------- Bảng phụ ----------
function openSheet(html, bind) {
  const card = $('sheet').querySelector('.card');
  const fresh = $('sheet').hidden;
  const keep = card.scrollTop;
  if ($('tip')) $('tip').hidden = true;
  $('sheetClose').hidden = false;
  $('sheetBody').onclick = null;
  $('sheetBody').innerHTML = html;
  $('sheet').hidden = false;
  // mở mới thì lên đầu, vẽ lại (bấm Đeo, Mua...) thì giữ chỗ đang xem
  card.scrollTop = fresh ? 0 : keep;
  if (bind) bind();
}
$('sheetClose').onclick = () => { $('sheet').hidden = true; dirty = true; };
$('sheetX').onclick = () => { $('sheet').hidden = true; dirty = true; };
// chạm ra ngoài bảng cũng đóng
$('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) { $('sheet').hidden = true; dirty = true; } });

const qCls = (q) => `q${q}`;
function itemCard(it, btns) {
  const wt = it.wt ? ` · ${WEAPON_TYPES[it.wt].n}` : '';
  return `<div class="item withIco">${itemIco(it)}<div class="body"><div class="row"><b class="${qCls(it.q)}">${esc(itemName(it))}</b><span class="meta">${QUALITY[it.q].n} · ${SLOTS[it.slot]}${wt}</span></div>
    <div class="meta">${esc(itemLine(it))}</div>${ttLine(it)}${btns ? `<div class="row btnRow">${btns}</div>` : ''}</div></div>`;
}
/** Dòng thần thông của đồ Thần thoại */
function ttLine(it) {
  const tt = it.tt && TT_MAP[it.tt];
  if (!tt) return '';
  const sealed = g.P && isSealed(it, g.P.realm);
  return `<div class="ttLine ${sealed ? 'sealed' : ''}"><span class="ttName">✦ ${esc(tt.n)}</span> ${esc(tt.t)}${sealed ? ' <b>(đang phong ấn)</b>' : ''}</div>`;
}
/** Thần khí kén chủ: cảnh giới chưa đủ */
function sealLine(it) {
  if (!g.P || !isSealed(it, g.P.realm)) return '';
  const e = gearStats({ x: it }, g.P.realm);
  const now = [e.atk ? `Công +${Math.round(e.atk)}` : '', e.def ? `Thủ +${Math.round(e.def)}` : '', e.hp ? `Sinh lực +${Math.round(e.hp)}` : ''].filter(Boolean).join(' · ');
  return `<div class="sealLine">🔒 Thần khí kén chủ: cần ${REALMS[it.lv].n} mới phát huy toàn bộ, thần thông bị khóa. Hiện bị áp chế theo cảnh giới của ngươi, chỉ phát huy: <b>${now}</b>.</div>`;
}

const stripTok = (t) => String(t).replace(ICON_TOKEN_RE, '');
const matIco = (k) => icoImg(matIconOpts(k, MATS[k]), `q${Math.min(4, MATS[k].q)}`);
/** Hàng nguyên liệu đang có */
function matChips(P) {
  const ks = Object.keys(MATS).filter((k) => (P.mats[k] || 0) > 0);
  if (!ks.length) return '<p class="empty">Chưa có nguyên liệu. Phân giải đồ thừa hoặc lịch luyện để nhặt.</p>';
  return `<div class="mats">${ks.map((k) => `<span class="mat" title="${esc(MATS[k].desc)}">${matIco(k)}<span>${MATS[k].n}</span><b>${fmt(P.mats[k])}</b></span>`).join('')}</div>`;
}
/** Chi phí dạng chữ, đánh dấu phần còn thiếu */
function costText(c) {
  const P = g.P;
  return Object.entries(c).map(([k, n]) => {
    const have = k === 'money' ? P.money : P.mats[k] || 0;
    const name = k === 'money' ? 'linh thạch' : MATS[k].n;
    return `<span class="${have < n ? 'lack' : ''}">${fmt(n)} ${name}</span>`;
  }).join(' · ');
}
/** Bot đang lịch luyện ở đâu, có thần khí không */
function botWhere(b) {
  if (!b) return '';
  if ((b.plane || 0) !== g.plane) return `<div class="meta">✦ Đang ở ${PLANES[b.plane || 0].n}</div>`;
  const m = b.map && MAP_MAP[b.map];
  const tt = b.gq >= 4 && b.tt && TT_MAP[b.tt] ? ` · <span class="ttName">✦ thần khí 「${esc(TT_MAP[b.tt].n)}」</span>` : '';
  return m || tt ? `<div class="meta">${m ? `⛰ Đang lịch luyện ở ${esc(m.n)} <span class="diff d${m.d}">${DIFF[m.d].n}</span>` : ''}${tt}</div>` : '';
}
/** Nút bật tắt tự uống, tự mua Hồi Xuân Đan */
function pillOpts() {
  const o = g.s.opt;
  return `<div class="row btnRow"><button class="btn ${o.autoPill ? 'on' : 'ghost'}" data-opt="autoPill">💊 Tự uống Hồi Xuân Đan khi trọng thương: ${o.autoPill ? 'bật' : 'tắt'}</button>
    <button class="btn ${o.autoBuyPill ? 'on' : 'ghost'}" data-opt="autoBuyPill" ${o.autoPill ? '' : 'disabled'}>Hết đan thì tự mua (${fmt(g.pillPrice('hoi_xuan'))}/viên): ${o.autoBuyPill ? 'bật' : 'tắt'}</button></div>`;
}
function bindPillOpts(redraw) {
  $('sheetBody').querySelectorAll('[data-opt]').forEach((b) => { b.onclick = () => { g.s.opt[b.dataset.opt] = !g.s.opt[b.dataset.opt]; save(); dirty = true; redraw(); }; });
}
const oddsCls = (p) => (p >= 0.8 ? 'o0' : p >= 0.55 ? 'o1' : p >= 0.3 ? 'o2' : p >= 0.12 ? 'o3' : 'o4');

// ---------- Tháp 1000 tầng ----------
function openTower() {
  const draw = (msg = '') => {
    const P = g.P;
    const pl = g.plane;
    const PL = PLANES[pl];
    const T = g.towerState();
    const nf = Math.min(1000, T.f + 1);
    const th = g.floorTheme(pl, nf);
    const kind = g.floorKind(nf);
    const boss = kind === 'boss' || kind === 'final';
    const m = boss ? g.bossMonster(pl, nf, 0, true) : g.towerMonster(pl, nf, { pick: (a) => a[0], range: () => 1, int: (a) => a, chance: () => false });
    const p = T.f >= 1000 ? 1 : g.floorOdds(nf);
    const { r } = g.floorRealm(pl, nf);
    const nb = Math.min(1000, Math.ceil(nf / 100) * 100);
    const kit = BOSS_KITS[g.themeIdx(nb)];
    const coin = P.towerCoin || 0;
    const resume = g.s.opt.towerResume !== false;
    // tháp pixel: 10 khu, đánh dấu tầng đang ở
    const segs = TOWER_THEMES[pl].map((t, i) => {
      const lo = i * 100 + 1, hi = (i + 1) * 100;
      const st = T.f >= hi ? 'done' : T.f + 1 >= lo ? 'cur' : '';
      const fill = st === 'cur' ? Math.round(((T.f - lo + 1) / 100) * 100) : 0;
      return `<div class="tseg ${st}" style="--c:${THEME_BG[i]}"><span class="tsn">${hi}</span><b>${esc(t.n)}</b><span class="tsb">${esc(i === 9 ? 'Tháp chủ' : t.boss)}</span>${st === 'cur' ? `<i class="tmark" style="left:${fill}%"></i>` : ''}</div>`;
    }).reverse().join('');
    openSheet(`<h2>🗼 ${PL.tower}</h2>
      <div class="towerWrap"><div class="towerPix"><div class="tcap"></div>${segs}<div class="tbase"></div></div>
      <div class="towerSide">
        <div class="cstats col"><span>Tầng <b>${T.f}</b>/1000</span><span>Kỷ lục <b>${g.s.towerBest[pl] || 0}</b></span><span>Tháp tệ <b>${fmt(coin)}</b></span>${T.recall ? `<span>Hồi ức: tới tầng <b>${T.recall}</b></span>` : ''}<span>${P.tokens && P.tokens[pl] ? `<b>Đã có ${PL.token}</b>` : `Chưa có ${PL.token}`}</span></div>
        ${T.f < 1000 ? `<div class="item"><div class="row"><b>Tầng ${nf} · ${esc(th.n)}</b><span class="meta">ngang ${REALMS[r].n}${kind === 'elite' ? ' · tinh anh' : kind === 'boss' ? ' · trùm' : kind === 'final' ? ' · Tháp chủ' : ''}</span></div>
          <div class="meta">${esc(m.n)}</div>
          <div class="odds ${oddsCls(p)}">Thắng ~${Math.round(p * 100)}%${boss ? ` (cả ${g.bossPhases(nf)} giai đoạn)` : ''}${woundLv(P.hp) ? ` · 🩸 ${WOUND_N[woundLv(P.hp)].toLowerCase()}` : ''}</div></div>` : '<p class="intro"><b>Đã vượt hết 1000 tầng.</b></p>'}
      </div></div>
      ${P.towerWait ? `<p class="forgeMsg">⏳ Đang tu luyện chờ đủ sức vượt tầng ${P.towerWait.f}${resume ? `, tỉ lệ thắng đạt ${P.towerWait.boss ? 75 : 60}% sẽ tự quay lại` : ''}.</p>` : ''}
      ${msg ? `<p class="forgeMsg">${rich(msg)}</p>` : ''}
      <div class="row btnRow">${T.f < 1000 ? `<button class="btn ${P.action === 'vuot_thap' ? 'on' : 'primary'}" data-climb="1">${P.action === 'vuot_thap' ? '🗼 Đang vượt tháp mỗi lượt' : '🗼 Vượt tháp mỗi lượt'}</button>` : ''}
        <button class="btn ghost" data-sweep="1" ${T.f >= 50 && P.age - T.sweptAt >= 10 ? '' : 'disabled'}>Quét tầng đã qua${T.f < 50 ? ' (từ 50)' : P.age - T.sweptAt < 10 ? ` (${10 - (P.age - T.sweptAt)} năm)` : ''}</button></div>
      <h3>Trùm kế tiếp · tầng ${nb}</h3>
      <div class="item"><div class="row"><b>${esc(nb >= 1000 ? `${PL.tower} chi chủ` : g.floorTheme(pl, nb).boss)}</b><span class="meta">${nb >= 1000 ? '3 giai đoạn · có thể mất mạng' : `2 giai đoạn · ${nb < 500 ? 'thua chỉ trọng thương' : 'có thể mất mạng'}`}</span></div><div class="meta">Cơ chế: ${esc(kit.mech)}. Tự đánh khi chắc thắng từ 75%, thấp hơn thì luôn dừng lại hỏi.</div></div>
      <details class="more"><summary>ⓘ Giải thích</summary><p class="intro">Mỗi 10 tầng có tinh anh (rương đồ), mỗi 100 tầng có trùm (đồ Cực phẩm, ngộ đạo điểm, từ tầng 500 có thể ra Thần thoại). Đôi khi gặp tầng đặc biệt: thương nhân, thử thách liên hoàn, đối thủ leo tháp, người kẹt trong tháp, bia ngộ đạo... Vượt tháp tích sát khí, tu vi có được chưa vững.</p></details>
      <h3>Tháp thương điếm · ${fmt(coin)} Tháp tệ</h3>
      <div class="grid5 shopGrid">${TOWER_SHOP.map((x) => {
        const ic = x.pill ? icoImg({ kind: 'dan', q: x.pill[0] === 'pha_canh' ? 2 : 0, col: PILL_COLORS[x.pill[0]] }) : x.mats ? icoImg({ kind: 'thoi', q: 1 }) : x.book ? icoImg({ kind: 'bi_kip', q: 2 }) : icoImg({ kind: 'tam', q: 2 });
        return `<button class="tile shopTile" data-tb="${x.id}" ${coin < x.price ? 'disabled' : ''}>${ic}<span class="tn">${esc(x.n)}</span><span class="tp">${x.price} 🪙</span></button>`;
      }).join('')}</div>
      <h3>Bảng ${PL.tower}</h3><div class="list">${g.towerRanking(10).map((x, i) => `<div class="item ${x.me ? 'me' : ''}"><div class="row"><b>${i + 1}. ${esc(x.name)}${x.me ? ' (ngươi)' : ''}</b><span class="meta">Tầng ${x.f} · ${realmLabel(x.realm, x.tuvi)}</span></div></div>`).join('')}</div>`, () => {
      $('sheetBody').querySelectorAll('[data-climb]').forEach((b) => { b.onclick = () => { g.manualAction('vuot_thap'); save(); dirty = true; $('sheet').hidden = true; }; });
      $('sheetBody').querySelectorAll('[data-sweep]').forEach((b) => { b.onclick = () => { const t = g.sweepTower(); save(); dirty = true; draw(t || ''); }; });
      $('sheetBody').querySelectorAll('[data-tb]').forEach((b) => { b.onclick = () => { const t = g.towerBuy(b.dataset.tb); save(); dirty = true; draw(t || 'Không đủ Tháp tệ.'); }; });
    });
  };
  draw();
}

// ---------- Mưu sinh: nghề phụ ----------
function openWork() {
  const draw = (msg = '') => {
    const P = g.P;
    const n = P.nghe;
    const cur = n ? NGHE[n.id] : null;
    const extra = n && n.id === 'thuong_nhan' ? `<div class="row btnRow"><button class="btn ghost" data-sn="1" ${P.sanNghiep < 5 && P.money >= g.sanNghiepPrice() ? '' : 'disabled'}>🏠 Mua sản nghiệp (${P.sanNghiep}/5) · ${fmt(g.sanNghiepPrice())}</button></div>` : '';
    const phu = Object.entries(PHU).map(([k, x]) => `<span class="mat">${icoImg({ kind: 'ho_phu', q: k === 'truyen_tong' ? 3 : 1 })}<span>${x.n}</span><b>${P.phu[k] || 0}</b></span>`).join('');
    openSheet(`<h2>⚖ Mưu sinh</h2>
      <p class="intro">Mưu sinh kiếm linh thạch, xả chút sát khí. Chọn một nghề: nghề lên cấp (1-9) chỉ khi mưu sinh. Đổi nghề thì mất một nửa cấp.</p>
      ${cur ? `<div class="item"><div class="row"><b>${cur.icon} ${cur.n} · cấp ${n.lv}/9</b><span class="meta">${n.lv < 9 ? `${n.xp}/${6 + n.lv * 6} năm` : 'đã đại thành'}</span></div><div class="meta">${esc(cur.desc)}</div>${extra}</div>` : '<p class="forgeMsg">Chưa có nghề: mưu sinh chỉ ra linh thạch.</p>'}
      ${msg ? `<p class="forgeMsg">${esc(msg)}</p>` : ''}
      <div class="row btnRow"><button class="btn ${P.action === 'muu_sinh' ? 'on' : 'primary'}" data-go="1">${P.action === 'muu_sinh' ? '⚖ Đang mưu sinh' : '⚖ Mưu sinh mỗi lượt'}</button></div>
      <h3>Chọn nghề</h3><div class="list">${Object.entries(NGHE).map(([k, x]) => `<button class="btn ${n && n.id === k ? 'on' : ''}" data-ng="${k}">${x.icon} ${x.n}<small>${esc(x.desc)}</small></button>`).join('')}</div>
      <h3>Phù trong người</h3><div class="mats">${phu}</div>
      <details class="more"><summary>ⓘ Giải thích</summary><p class="intro">Phù, Bạo Khí Đan tự dùng khi vào trận lớn (trùm tháp, vùng chủ, lôi kiếp). Truyền Tống Phù tự cháy khi sắp mất mạng.</p></details>`, () => {
      $('sheetBody').querySelectorAll('[data-ng]').forEach((b) => { b.onclick = () => { g.chooseNghe(b.dataset.ng); save(); dirty = true; draw(`Đã chọn nghề ${NGHE[b.dataset.ng].n}.`); }; });
      $('sheetBody').querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => { g.manualAction('muu_sinh'); save(); dirty = true; $('sheet').hidden = true; }; });
      $('sheetBody').querySelectorAll('[data-sn]').forEach((b) => { b.onclick = () => { const t = g.buySanNghiep(); save(); dirty = true; draw(t || ''); }; });
    });
  };
  draw();
}

// ---------- Kết giao ----------
function openSocial() {
  const P = g.P;
  const al = g.allyCands();
  const hp = g.hoPhapCand();
  const lu = g.daoLu();
  const owe = g.known().filter(({ r }) => r.owe);
  openSheet(`<h2>☕ Quan hệ</h2>
    <p class="intro">Không còn việc Kết giao riêng: ngươi quen người khi Mưu sinh ở trấn (dễ gặp nhất) và khi Lịch luyện trên đường. Bạn thân giúp ngươi trong những trận lớn.</p>
    <ul class="statList">
      <li>Trợ chiến (thân từ 50, cùng giới, cảnh giới không kém quá một bậc): mời vào trận trùm tháp, vùng chủ. Mỗi người 10 năm một lần, xong thì ngươi nợ ân tình (kết giao để trả). ${al.length ? `Có thể mời: <b>${al.slice(0, 4).map((x) => esc(x.b.name)).join(', ')}</b>.` : 'Hiện chưa có ai.'}</li>
      <li>Hộ pháp lôi kiếp (thân từ 70 hoặc đạo lữ, huynh đệ, sư đồ): đỡ thay một đợt lôi kiếp. ${hp ? `Có thể nhờ <b>${esc(hp.b.name)}</b>.` : 'Hiện chưa có ai.'}</li>
      <li>Đạo lữ song tu: tu luyện +25%, củng cố căn cơ nhanh hơn, xả sát khí. ${lu ? `Đạo lữ: <b>${esc(lu.name)}</b>.` : 'Chưa có đạo lữ.'}</li>
      ${owe.length ? `<li>Đang nợ ân tình: ${owe.map((x) => esc(x.b.name)).join(', ')}.</li>` : ''}
    </ul>`);
}

// ---------- Lịch trình tự động ----------
let planDraft = null;
function openPlan() {
  const draw = (msg = '') => {
    const P = g.P;
    const pl = P.plan;
    if (!planDraft) planDraft = pl ? pl.steps.map((x) => ({ ...x })) : PLAN_TEMPLATES[0].steps.map((x) => ({ ...x }));
    const row = (x, i) => `<div class="planRow"><b>${i + 1}</b>
      <select data-pa="${i}">${Object.entries(PLAN_STEP_ACTS).map(([k, n]) => `<option value="${k}" ${x.a === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      ${x.a === 'be_quan' ? '<span class="meta">trong</span>' : `<select data-pk="${i}">${Object.entries(PLAN_COND).map(([k, n]) => `<option value="${k}" ${x.k === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`}
      <input type="number" min="0" max="300" inputmode="numeric" data-pv="${i}" value="${x.v}"><span class="meta">${x.a === 'be_quan' || x.k === 'y' ? 'năm' : ''}</span>
      <button class="btn ghost sm" data-pdel="${i}" ${planDraft.length > 1 ? '' : 'disabled'}>✕</button></div>`;
    openSheet(`<h2>📅 Lịch trình tự động</h2>
      <details class="more"><summary>ⓘ Giải thích</summary><p class="intro">Tự đổi việc theo vòng. Dừng khi có chuyện lớn: thua trùm tháp, nguy kịch mà hết đan, tẩu hỏa nhập ma, tu vi viên mãn mà chưa thể đột phá. Tự bấm đổi việc cũng dừng lịch trình.</p></details>
      ${pl ? `<div class="item ${pl.on ? 'me' : ''}"><div class="row"><b>${pl.on ? '▶ Đang chạy' : '⏸ Đang dừng'}</b><span class="meta">Bước ${pl.i + 1}/${pl.steps.length}</span></div><div class="meta">${pl.steps.map((x, i) => (i === pl.i ? `<b>${esc(planStepText(x))}</b>` : esc(planStepText(x)))).join(' → ')}</div>
        <div class="row btnRow">${pl.on ? '<button class="btn ghost" id="plStop">⏸ Dừng</button>' : '<button class="btn primary" id="plRes">▶ Chạy tiếp</button>'}<button class="btn ghost" id="plDel">Xóa lịch trình</button></div></div>` : ''}
      ${msg ? `<p class="forgeMsg">${esc(msg)}</p>` : ''}
      <h3>Mẫu</h3><div class="list">${PLAN_TEMPLATES.map((t) => `<button class="btn" data-tpl="${t.id}">${t.n}<small>${esc(t.desc)}</small></button>`).join('')}</div>
      <h3>Tự soạn (tối đa 5 bước, lặp lại)</h3>
      <div class="planEd">${planDraft.map(row).join('')}</div>
      <div class="row btnRow"><button class="btn ghost" id="plAdd" ${planDraft.length < 5 ? '' : 'disabled'}>+ Thêm bước</button><button class="btn primary" id="plGo">▶ Chạy lịch trình này</button></div>`, () => {
      const B = $('sheetBody');
      B.querySelectorAll('[data-tpl]').forEach((b) => { b.onclick = () => { planDraft = PLAN_TEMPLATES.find((t) => t.id === b.dataset.tpl).steps.map((x) => ({ ...x })); draw(); }; });
      B.querySelectorAll('[data-pa]').forEach((el) => { el.onchange = () => { const x = planDraft[+el.dataset.pa]; x.a = el.value; if (x.a === 'be_quan') { x.k = 'y'; x.v = Math.max(10, x.v); } draw(); }; });
      B.querySelectorAll('[data-pk]').forEach((el) => { el.onchange = () => { planDraft[+el.dataset.pk].k = el.value; draw(); }; });
      B.querySelectorAll('[data-pv]').forEach((el) => { el.onchange = () => { planDraft[+el.dataset.pv].v = clamp(Math.round(+el.value || 0), 0, 300); }; });
      B.querySelectorAll('[data-pdel]').forEach((b) => { b.onclick = () => { planDraft.splice(+b.dataset.pdel, 1); draw(); }; });
      $('plAdd').onclick = () => { planDraft.push({ a: 'tu_luyen', k: 'y', v: 5 }); draw(); };
      $('plGo').onclick = () => { if (g.setPlan(planDraft.map((x) => ({ ...x })))) { save(); dirty = true; $('sheet').hidden = true; } else draw('Lịch trình chưa hợp lệ.'); };
      if ($('plStop')) $('plStop').onclick = () => { g.planStop(''); save(); dirty = true; draw(); };
      if ($('plRes')) $('plRes').onclick = () => { g.planResume(); save(); dirty = true; $('sheet').hidden = true; };
      if ($('plDel')) $('plDel').onclick = () => { g.P.plan = null; save(); dirty = true; draw(); };
    });
  };
  planDraft = null;
  draw();
}

// ---------- Bản đồ lịch luyện ----------
function openMaps() {
  const draw = (confirmId = null) => {
    const P = g.P;
    const cur = P.action === 'lich_luyen' ? P.map : null;
    if (confirmId) {
      const m = MAP_MAP[confirmId];
      const p = g.mapOdds(m.id);
      openSheet(`<h2>${DIFF[m.d].ic} ${esc(m.n)}</h2>
        <div class="mapWarn d${m.d}"><b>${DIFF[m.d].n}</b> · thắng yêu thú ~${Math.round(p * 100)}% · thua thì nguy hiểm tính mạng ~${Math.round(g.mapRisk(m.id) * 100)}%</div>
        <p class="intro">${esc(m.desc)}</p>
        <p class="intro">Yêu thú ở đây mạnh gấp ${String(m.pow).replace('.', ',')} lần tu sĩ cùng cảnh giới. Đồ rơi nhiều và tốt hơn (x${String(m.loot).replace('.', ',')}), mỗi món có ${String(m.myth * 100).replace('.', ',')}% là Thần thoại. Ngoài yêu thú còn có tai họa của chính vùng đất này.</p>
        <p class="intro"><b>Ngươi chắc chắn muốn vào?</b></p>
        <div class="row btnRow"><button class="btn primary" data-go="${m.id}">Vào ${esc(m.n)}</button><button class="btn ghost" data-back="1">Thôi</button></div>`, bind);
      return;
    }
    const cards = mapsOf(g.plane).map((m) => {
      const p = g.mapOdds(m.id);
      const risk = g.mapRisk(m.id);
      const bs = g.botsIn(m.id);
      const known = bs.filter((b) => g.s.rel[b.id] && g.s.rel[b.id].met);
      return `<button class="mapCard mapRow d${m.d} ${cur === m.id ? 'on' : ''}" data-map="${m.id}">
        <div class="mr1"><b>${esc(m.n)}</b><span class="diff d${m.d}">${DIFF[m.d].ic} ${DIFF[m.d].n}</span><span class="odds ${oddsCls(p)}">thắng ~${Math.round(p * 100)}%</span></div>
        <div class="mr2">${matIco(m.mat)} ${MATS[m.mat].n}${m.myth ? ` · Thần thoại ${String(m.myth * 100).replace('.', ',')}%` : ''}${m.haz ? ' · ⚠ tai họa' : ''}${bs.length ? ` · 👤 ${bs.length}${known.length ? ` (quen ${known.length})` : ''}` : ''}${cur === m.id ? ' · <b>đang ở đây</b>' : ''}${p < 0.8 ? ` · <span class="neg">tử ~${Math.round(risk * 100)}%</span>` : ''}</div>
      </button>`;
    }).join('');
    openSheet(`<h2>Chọn vùng lịch luyện</h2>
      <p class="intro">Vùng càng khó, đồ càng tốt và càng dễ chết. ${g.plane ? `Các vùng của ${PLANES[g.plane].n}.` : ''}</p>
      <details class="more"><summary>Giải thích thêm</summary><p class="intro">Độ khó tính theo cảnh giới hiện tại: yêu thú cùng cảnh giới nhưng mạnh hơn theo độ khó, đồ rơi hợp cảnh giới của ngươi. Đồ Thần thoại chỉ có từ vùng Khó. Tỉ lệ thắng tính theo trang bị, kỹ năng và thương thế. Tu sĩ khác cũng chọn vùng theo sức và tính cách; cùng vùng dễ chạm mặt, hạ kẻ mang thần khí thì đoạt được. Trọng thương thì tự lui (đổi ở Cài đặt).</p></details>
      ${P.flags.retreated && MAP_MAP[P.mapGoal] ? `<p class="forgeMsg">Đang tạm lui về ${g.defaultMap().n} dưỡng thương, lành rồi quay lại ${esc(MAP_MAP[P.mapGoal].n)}.</p>` : ''}
      <div class="list">${cards}</div>`, bind);
  };
  const pick = (id) => { g.setMap(id); save(); $('sheet').hidden = true; dirty = true; };
  const bind = () => {
    $('sheetBody').querySelectorAll('[data-map]').forEach((b) => { b.onclick = () => { const m = MAP_MAP[b.dataset.map]; if (m.d >= 3 && g.P.map !== m.id) draw(m.id); else pick(m.id); }; });
    $('sheetBody').querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => pick(b.dataset.go); });
    $('sheetBody').querySelectorAll('[data-back]').forEach((b) => { b.onclick = () => draw(); });
    $('sheetBody').querySelectorAll('[data-retreat]').forEach((b) => { b.onclick = () => { g.s.opt.retreat = !g.s.opt.retreat; save(); draw(); }; });
    bindPillOpts(() => draw());
  };
  draw();
}

// ---------- Lò rèn ----------
let forgeTab = 'cuong';
let forgeSel = { slot: 'vu_khi', wt: 'kiem', cat: '', myth: false };
let forgePick = null;
function openForge() {
  const draw = (msg = '') => {
    const P = g.P;
    const all = [...Object.values(P.eq).filter(Boolean).map((it) => ({ it, on: true })), ...P.bag.map((it) => ({ it, on: false }))];
    const mark = (x) => (x.on ? '<span class="tag gold">Đang mang</span>' : '');
    // lưới ô chọn đồ + thẻ chi tiết của món đang chọn (cùng kiểu túi trữ vật)
    const pick = (list, card) => {
      if (!list.length) return '';
      const cur = list.find((x) => x.it.id === forgePick);
      return `<div class="grid5">${list.map((x) => `<button class="tile q${x.it.q} ${x.it.id === forgePick ? 'sel' : ''}" data-fp="${x.it.id}">${itemIco(x.it)}${x.it.plus ? `<span class="bdg plus">+${x.it.plus}</span>` : ''}${x.on ? '<span class="bdg up">✓</span>' : ''}<span class="tn">${esc(itemName(x.it))}</span></button>`).join('')}</div>${cur ? `<div class="itemPop forgePop" id="itemPop"><i class="ipArrow"></i><button class="ipX" data-ipx="1" aria-label="Đóng">✕</button>${card(cur)}</div>` : ''}`;
    };
    let body = '';
    if (forgeTab === 'cuong') {
      body = `<details class="more"><summary>ⓘ Giải thích</summary><p class="intro">Mỗi cấp +8% công, thủ, sinh lực, tối đa +${PLUS_MAX}. Từ +5 có thể thất bại. Lên +8 trở lên mà thất bại thì tụt một cấp. Không bao giờ vỡ đồ.${g.ngheLv('luyen_khi') ? ` Luyện khí sư: rẻ hơn ${g.ngheLv('luyen_khi') * 4}%.` : ''}</p></details>` +
        pick(all, (x) => {
          const it = x.it;
          if ((it.plus || 0) >= PLUS_MAX) return itemCard(it, `${mark(x)}<span class="meta">Đã cường hóa tối đa</span>`);
          const c = g.enhanceCost(it);
          const p = g.enhanceChance(it);
          return itemCard(it, `${mark(x)}<button class="btn primary sm" data-enh="${it.id}" ${g.canPay(c) ? '' : 'disabled'}>⚒ +${(it.plus || 0) + 1} · ${Math.round(p * 100)}% · lực chiến ${pctS(g.improveGain(it, { ...it, plus: (it.plus || 0) + 1 }))}</button><div class="cost">${costText(c)}</div>`);
        });
    } else if (forgeTab === 'thang') {
      const list = all.filter((x) => x.it.lv < P.realm).sort((a, b) => g.effScore(g.upgradedClone(b.it)) - g.effScore(g.upgradedClone(a.it)));
      body = `<p class="intro">Kéo món đồ lên cấp ${REALMS[P.realm].n}. Giữ nguyên phẩm, cường hóa, các dòng và thần thông.</p>` +
        (pick(list, (x) => { const c = g.upgradeCost(x.it); return itemCard(x.it, `${mark(x)}<button class="btn ghost" data-up="${x.it.id}" ${g.canPay(c) ? '' : 'disabled'}>Thăng lên ${REALMS[P.realm].n} · lực chiến khi mặc ${pctS(g.improveGain(x.it, g.upgradedClone(x.it)))}</button><div class="cost">${costText(c)}</div>${x.on ? '' : `<div class="meta">So với đồ đang mặc sau khi thăng: ${pctS(g.swapGain(g.upgradedClone(x.it)))}</div>`}`); }) || '<p class="empty">Không có món nào thấp hơn cảnh giới hiện tại.</p>');
    } else if (forgeTab === 'tay') {
      const list = all.filter((x) => x.it.q >= 2 && x.it.affix && x.it.affix.length);
      body = `<details class="more"><summary>ⓘ Giải thích</summary><p class="intro">Đổi một dòng thuộc tính của đồ Thượng phẩm trở lên. Tẩy ngẫu nhiên tốn Linh tinh. Thêm 2 dẫn liệu thì chắc chắn ra dòng của dẫn liệu đó.</p></details>` +
        (pick(list, (x) => {
          const it = x.it;
          const rows = it.affix.map((k, i) => {
            const a = AFFIX.find((y) => y.k === k);
            const c = g.rerollCost(it);
            const cats = Object.keys(MATS).filter((m) => MATS[m].aff && MATS[m].aff !== k && !it.affix.includes(MATS[m].aff) && (P.mats[m] || 0) > 0);
            return `<div class="affRow"><span>${esc(a.t)}</span><button class="btn ghost" data-rr="${it.id}:${i}" ${g.canPay(c) ? '' : 'disabled'}>Tẩy ngẫu nhiên</button>${cats.map((m) => { const c2 = g.rerollCost(it, m); const t = AFFIX.find((y) => y.k === MATS[m].aff).t; return `<button class="btn ghost" data-rr="${it.id}:${i}:${m}" ${g.canPay(c2) ? '' : 'disabled'}>→ ${esc(t)} (${MATS[m].n} x2)</button>`; }).join('')}</div>`;
          }).join('');
          return itemCard(it, `${mark(x)}<div class="cost">${costText(g.rerollCost(it))} mỗi lần</div>${rows}`);
        }) || '<p class="empty">Chưa có món Thượng phẩm trở lên.</p>');
    } else {
      const S = forgeSel;
      const cats = Object.keys(MATS).filter((m) => MATS[m].aff);
      const c = g.forgeCost(S.myth, S.cat || null);
      body = `<details class="more"><summary>ⓘ Giải thích</summary><p class="intro">Rèn một món mới cấp ${REALMS[P.realm].n}. Phẩm gieo ngẫu nhiên nhưng dễ ra Thượng, Cực phẩm hơn đồ rơi, tay nghề càng cao càng tốt. Rèn thần khí cần 3 ${MATS[mythMatOf(g.plane)].n}: ~${Math.round(g.forgeMythChance() * 100)}% ra Thần thoại, còn lại chắc chắn Cực phẩm.</p></details>
        <h3>Loại đồ</h3><div class="opts">${Object.entries(SLOTS).map(([k, n]) => `<button class="btn ${S.slot === k ? 'on' : 'ghost'}" data-fs="${k}">${n}</button>`).join('')}</div>
        ${S.slot === 'vu_khi' ? `<div class="opts">${Object.entries(WEAPON_TYPES).filter(([k]) => k !== 'tay').map(([k, w]) => `<button class="btn ${S.wt === k ? 'on' : 'ghost'}" data-fw="${k}">${w.n}</button>`).join('')}</div>` : ''}
        <h3>Dẫn liệu (tùy chọn)</h3><div class="opts wide2"><button class="btn ${!S.cat ? 'on' : 'ghost'}" data-fc="">Không</button>${cats.map((m) => `<button class="btn ${S.cat === m ? 'on' : 'ghost'}" data-fc="${m}">${matIco(m)} ${MATS[m].n} → ${esc(AFFIX.find((y) => y.k === MATS[m].aff).t)}</button>`).join('')}</div>
        <h3>Lò</h3><div class="opts"><button class="btn ${!S.myth ? 'on' : 'ghost'}" data-fm="0">Lò thường</button><button class="btn ${S.myth ? 'on' : 'ghost'}" data-fm="1">Lò thần khí (3 ${MATS[mythMatOf(g.plane)].n})</button></div>
        <div class="cost">${costText(c)}</div>
        <button class="btn primary wide" data-forge="1" ${g.canPay(c) ? '' : 'disabled'}>⚒ Rèn</button>`;
    }
    if (forgeTab === 'thang') forgeTab = 'cuong';
    const tabs = [['cuong', 'Cường hóa'], ['tay', 'Tẩy luyện'], ['moi', 'Rèn mới']];
    openSheet(`<h2>Lò rèn</h2>
      <p class="intro">Tay nghề rèn: <b>${P.forge || 0}/100</b> (+${Math.round(g.forgeBonus() * 100)}% tỉ lệ thành công)${P.path === 'tinh' ? ', Tinh Thần Lực được cộng thêm' : ''}. Linh thạch: <b>${fmt(P.money)}</b>.</p>
      ${matChips(P)}
      <div class="row btnRow"><button class="btn ghost" data-iron="1" ${P.money >= g.ironPrice() ? '' : 'disabled'}>Mua ${10 * (1 + P.realm)} Tinh thiết · ${fmt(g.ironPrice())}</button></div>
      ${msg ? `<p class="forgeMsg">${rich(msg)}</p>` : ''}
      <div class="ftabs">${tabs.map(([k, n]) => `<button class="btn ${forgeTab === k ? 'on' : 'ghost'}" data-ft="${k}">${n}</button>`).join('')}</div>
      <div class="list">${body}</div>`, () => {
      const q = (sel, fn) => $('sheetBody').querySelectorAll(sel).forEach((b) => { b.onclick = () => { const m = fn(b); save(); draw(typeof m === 'string' ? m : ''); dirty = true; }; });
      q('[data-ft]', (b) => { forgeTab = b.dataset.ft; });
      q('[data-fp]', (b) => { forgePick = forgePick === +b.dataset.fp ? null : +b.dataset.fp; });
      bindPop(() => { forgePick = null; }, draw);
      q('[data-iron]', () => g.buyIron());
      q('[data-enh]', (b) => g.enhance(+b.dataset.enh));
      q('[data-up]', (b) => g.upgrade(+b.dataset.up));
      q('[data-rr]', (b) => { const [id, i, m] = b.dataset.rr.split(':'); return g.rerollAffix(+id, +i, m || null); });
      q('[data-fs]', (b) => { forgeSel.slot = b.dataset.fs; });
      q('[data-fw]', (b) => { forgeSel.wt = b.dataset.fw; });
      q('[data-fc]', (b) => { forgeSel.cat = b.dataset.fc; });
      q('[data-fm]', (b) => { forgeSel.myth = b.dataset.fm === '1'; });
      q('[data-forge]', () => g.forgeNew(forgeSel.slot, forgeSel.wt, forgeSel.cat || null, forgeSel.myth));
    });
  };
  draw();
}

/** Nút cường hóa, thăng cấp ngay trên một món (Hành trang) */
function forgeBtns(it) {
  if (!g.forgeOpen()) return '';
  const P = g.P;
  let h = '';
  const worn = Object.values(P.eq).includes(it);
  // đồ đang mặc: tăng bao nhiêu lực chiến; đồ trong túi: so với đồ đang mặc
  const gainOf = (cl) => (worn ? g.improveGain(it, cl) : g.swapGain(cl));
  const tail = worn ? '' : ' so với đồ đang mặc';
  if ((it.plus || 0) < PLUS_MAX) {
    const c = g.enhanceCost(it);
    const p = g.enhanceChance(it);
    const ge = gainOf({ ...it, plus: (it.plus || 0) + 1 });
    h += `<button class="btn ghost" data-enh="${it.id}" ${g.canPay(c) ? '' : 'disabled'}>⚒ +${(it.plus || 0) + 1} · ${Math.round(p * 100)}% · ${pctS(ge)}${tail}</button>`;
    h += `<div class="cost">Cường hóa: ${costText(c)}</div>`;
  }
  return h;
}
// ---------- Túi trữ vật ----------
const BAG_TABS = [['eq', 'Trang bị', { kind: 'kiem', q: 2 }], ['cp', 'Kỹ năng', { kind: 'bi_kip', q: 2 }], ['dan', 'Đan, phù', { kind: 'dan', q: 0, col: '#c0392b' }], ['nl', 'Nguyên liệu', { kind: 'mat', q: 2, col: '#8fd3ff' }], ['set', 'Cài đặt', { kind: 'cog', q: 0 }]];
const STAT_ICO = { atk: 'st_atk', def: 'st_def', hp: 'st_hp', crit: 'st_crit', dodge: 'st_dodge' };
const WEP_ICO = { kiem: 'kiem', dao: 'dao', thuong: 'thuong', quat: 'quat' };
const bag = { tab: 'eq', sel: null, slot: 'all', sort: 'power', filt: '', multi: false, picked: new Set(), confirm: null, trial: 'map', trialRes: null };
let undoUntil = 0;
const pctS = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(Math.round(x * 100))}%`;
/** So sánh một món với món đang mang cùng ô: lực chiến thật, từng chỉ số, thăng cấp, phong ấn, đánh thử */
function compareLine(it) {
  const P = g.P;
  const cur = P.eq[it.slot];
  const isEq = cur && cur.id === it.id;
  const out = [];
  const v0 = g.combatValue();
  if (!isEq) {
    const gn = g.swapGain(it);
    out.push(`<div class="pw">Lực chiến khi mặc: <b>${fmt(v0)}</b> → <b class="${gn > 0.005 ? 'pos' : gn < -0.005 ? 'neg' : ''}">${fmt(v0 * (1 + gn))} (${pctS(gn)})</b></div>`);
    if (it.slot === 'vu_khi') {
      const L = g.loadoutFor(it.wt);
      if (L.join() !== P.loadout.join()) {
        const gr = g.swapGain(it, true);
        if (gr > gn + 0.01) out.push(`<div class="pw">Mặc + xếp lại kỹ năng hợp ${WEAPON_TYPES[it.wt].n.toLowerCase()}: <b class="${gr > 0 ? 'pos' : 'neg'}">${pctS(gr)}</b> <button class="btn ghost sm" data-eqrl="${it.id}">Mặc + xếp võ kỹ</button></div>`);
      }
    }
    if (cur) {
      const a = gearStats({ x: it }, P.realm), b = gearStats({ x: cur }, P.realm);
      const parts = [['atk', 'Công'], ['def', 'Thủ'], ['hp', 'Sinh lực'], ['crit', 'Bạo kích', 100], ['dodge', 'Né', 100], ['ls', 'Hút máu', 100], ['sp', 'Tốc']].map(([k, n, m = 1]) => {
        const d = ((a[k] || 0) - (b[k] || 0)) * m;
        if (Math.abs(d) < (m > 1 ? 0.5 : 1)) return '';
        return `<span class="${d > 0 ? 'pos' : 'neg'}">${n} ${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}${m > 1 ? '%' : ''} ${d > 0 ? '▲' : '▼'}</span>`;
      }).filter(Boolean);
      if (parts.length) out.push(`<div>So với ${esc(itemName(cur))}: ${parts.join(' · ')}</div>`);
      const tt = (x) => (x.tt && TT_MAP[x.tt] && !isSealed(x, P.realm) ? TT_MAP[x.tt].n : null);
      if (tt(it) !== tt(cur) && (tt(it) || tt(cur))) out.push(`<div>Thần thông: ${tt(cur) ? `mất 「${esc(tt(cur))}」` : ''}${tt(cur) && tt(it) ? ', ' : ''}${tt(it) ? `được 「${esc(tt(it))}」` : ''} (đã tính vào lực chiến)</div>`);
    }
  }
  // đánh thử
  const T = { map: 'Quái vùng đang đi', tower: 'Tầng tháp kế', boss: 'Trùm tháp kế' };
  const tr = bag.trialRes && bag.trialRes.id === it.id && bag.trialRes.t === bag.trial ? bag.trialRes : null;
  out.push(`<div class="trial"><div class="chips">${Object.entries(T).map(([k, n]) => `<button class="chip ${bag.trial === k ? 'on' : ''}" data-trt="${k}">${n}</button>`).join('')}</div>
    <button class="btn ghost sm" data-trial="${it.id}">⚔ Đánh thử</button>${tr ? `<span class="trRes">${isEq ? `Tỉ lệ thắng: <b>${Math.round(tr.now * 100)}%</b>` : `Đang mặc <b>${Math.round(tr.now * 100)}%</b> → mặc món này <b class="${tr.with > tr.now ? 'pos' : tr.with < tr.now ? 'neg' : ''}">${Math.round(tr.with * 100)}%</b>${tr.rl !== null ? ` · xếp lại võ kỹ <b>${Math.round(tr.rl * 100)}%</b>` : ''}`} (sinh lực ${P.hp}/100)</span>` : ''}</div>`);
  return `<div class="cmp">${out.join('')}</div>`;
}
/** Khung popup nhỏ cạnh ô (dùng chung cho đồ, kỹ năng, đan phù) */
const popBox = (ico, title, meta, body, btns) => `<div class="itemPop" id="itemPop"><i class="ipArrow"></i>
    <div class="ipHead">${ico}<div class="ipT">${title}<span class="meta">${meta}</span></div><button class="ipX" data-ipx="1" aria-label="Đóng">✕</button></div>
    ${body}${btns ? `<div class="ipBtns">${btns}</div>` : ''}</div>`;
/** Popup nhỏ cạnh món đồ: tên, chỉ số, so sánh lực chiến, các nút gọn */
function itemPop(it, isEq) {
  const P = g.P;
  const wt = it.wt ? ` · ${WEAPON_TYPES[it.wt].n}` : '';
  const cf = (k) => bag.confirm === `${k}:${it.id}`;
  const cur = P.eq[it.slot];
  let cmp = '';
  if (!isEq) {
    const gn = g.swapGain(it);
    cmp = `<div class="ipPow">Lực chiến <b class="${gn > 0.005 ? 'pos' : gn < -0.005 ? 'neg' : ''}">${pctS(gn)}</b>${cur ? ` so với ${esc(itemName(cur))}` : ''}</div>`;
    if (cur) {
      const a = gearStats({ x: it }, P.realm), b = gearStats({ x: cur }, P.realm);
      const parts = [['atk', 'Công'], ['def', 'Thủ'], ['hp', 'Máu'], ['crit', 'Bạo', 100], ['dodge', 'Né', 100], ['ls', 'Hút', 100], ['sp', 'Tốc']].map(([k, n, m = 1]) => {
        const d = ((a[k] || 0) - (b[k] || 0)) * m;
        if (Math.abs(d) < (m > 1 ? 0.5 : 1)) return '';
        return `<span class="${d > 0 ? 'pos' : 'neg'}">${n} ${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}${m > 1 ? '%' : ''}</span>`;
      }).filter(Boolean);
      if (parts.length) cmp += `<div class="ipDiff">${parts.join(' ')}</div>`;
    }
  }
  const btns = [];
  btns.push(isEq ? `<button class="btn ghost sm" data-un="${it.slot}">Tháo</button>` : `<button class="btn primary sm" data-eq="${it.id}">Mang</button>`);
  btns.push(`<button class="btn ghost sm" data-lock="${it.id}" title="${it.lock ? 'Mở khóa' : 'Khóa'}">${it.lock ? '🔓' : '🔒'}</button>`);
  if (!isEq && !it.lock) btns.push(`<button class="btn ${cf('sell') ? 'danger' : 'ghost'} sm" data-sell="${it.id}" title="Bán">${cf('sell') ? 'Bấm lại để bán' : `💰${fmtShort(it.val)}`}</button>`);
  if (!isEq) btns.push(`<button class="btn ${cf('salv') ? 'danger' : 'ghost'} sm" data-salv="${it.id}" title="Phân giải">${cf('salv') ? 'Bấm lại' : '♻'}</button>`);
  if (g.forgeOpen() && (it.plus || 0) < PLUS_MAX) {
    const c = g.enhanceCost(it);
    btns.push(`<button class="btn ghost sm" data-enh="${it.id}" ${g.canPay(c) ? '' : 'disabled'} title="Cường hóa: ${esc(stripTok(costText(c)))}">⚒+${(it.plus || 0) + 1} <small>${Math.round(g.enhanceChance(it) * 100)}%</small></button>`);
  }
  return `<div class="itemPop" id="itemPop"><i class="ipArrow"></i>
    <div class="ipHead">${itemIco(it)}<div class="ipT"><b class="${qCls(it.q)}">${esc(itemName(it))}</b><span class="meta">${QUALITY[it.q].n} · ${SLOTS[it.slot]}${wt}${isEq ? ' · đang mặc' : ''}</span></div><button class="ipX" data-ipx="1" aria-label="Đóng">✕</button></div>
    <div class="ipLine">${esc(itemLine(it))}</div>${ttLine(it)}${cmp}
    <div class="ipBtns">${btns.join('')}</div></div>`;
}
/** Đặt popup ngay dưới (hoặc trên) ô đồ đang chọn */
function placeItemPop() {
  const pop = $('itemPop');
  if (!pop) return;
  const B = $('sheetBody');
  const tile = B.querySelector('.tile.sel[data-it], .tile.sel[data-skt], .tile.sel[data-pl], .tile.sel[data-mt], .tile.sel[data-ps], .tile.sel[data-fp]');
  if (!tile) { pop.remove(); return; }
  const card = $('sheet').querySelector('.card');
  const br = B.getBoundingClientRect(), tr = tile.getBoundingClientRect(), cr = card.getBoundingClientRect();
  const w = Math.min(300, br.width - 8);
  pop.style.width = `${w}px`;
  const h = pop.offsetHeight;
  const cx = tr.left + tr.width / 2 - br.left;
  const left = Math.max(4, Math.min(br.width - w - 4, cx - w / 2));
  const below = tr.bottom + 8 + h <= cr.bottom || tr.top - 8 - h < cr.top;
  const top = below ? tr.bottom - br.top + 8 : tr.top - br.top - 8 - h;
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
  pop.classList.toggle('up', !below);
  pop.querySelector('.ipArrow').style.left = `${Math.max(14, Math.min(w - 14, cx - left))}px`;
  const pr = pop.getBoundingClientRect();
  if (pr.bottom > cr.bottom) card.scrollTop += pr.bottom - cr.bottom + 8;
  else if (pr.top < cr.top) card.scrollTop -= cr.top - pr.top + 8;
}
/** Gắn popup cho một bảng: đặt vị trí, nút ✕ và chạm chỗ trống thì đóng (clear rồi vẽ lại) */
function bindPop(clear, redraw) {
  const B = $('sheetBody');
  placeItemPop();
  const x = B.querySelector('[data-ipx]');
  if (x) x.onclick = (e) => { e.stopPropagation(); clear(); redraw(); };
  B.onclick = (e) => { if ($('itemPop') && !e.target.closest('button, .itemPop, select, input')) { clear(); redraw(); } };
}
function itemTile(it, extra = '') {
  const P = g.P;
  const on = Object.values(P.eq).includes(it);
  const better = !on && g.betterThanEquipped(it);
  const upb = false;
  const pin = false;
  return `<button class="tile q${it.q} ${bag.sel === it.id ? 'sel' : ''} ${bag.multi && bag.picked.has(it.id) ? 'picked' : ''}" data-it="${it.id}" ${extra}>${itemIco(it)}${it.plus ? `<span class="bdg plus">+${it.plus}</span>` : ''}${better ? '<span class="bdg up">▲</span>' : upb ? '<span class="bdg upc" title="Thăng cấp lên sẽ tốt hơn">⬆</span>' : pin ? '<span class="bdg pinb">📌</span>' : ''}${it.lock ? '<span class="bdg lk">🔒</span>' : ''}${isSealed(it, P.realm) ? '<span class="bdg lock">⛓</span>' : ''}${isSuppressed(it, P.realm) ? '<span class="bdg sup">⚠</span>' : ''}<span class="tn">${esc(itemName(it))}</span></button>`;
}
function slotTile(sl) {
  const it = g.P.eq[sl];
  if (it) return `<div class="dollSlot"><span class="meta">${SLOTS[sl]}</span>${itemTile(it)}</div>`;
  return `<div class="dollSlot"><span class="meta">${SLOTS[sl]}</span><button class="tile empty" data-emp="${sl}">${icoImg({ kind: SLOT_KIND[sl], faded: true }, 'empty')}<span class="tn">Trống</span></button></div>`;
}
function bagEq() {
  const P = g.P;
  const F = g.playerFighter();
  const sel = bag.sel !== null ? g.findItem(bag.sel) : null;
  const isEq = sel && Object.values(P.eq).includes(sel);
  // túi xếp theo phẩm rồi theo lực chiến khi mặc
  const sv = new Map(P.bag.map((x) => [x.id, g.swapGain(x)]));
  const list = P.bag.slice().sort((a, b) => b.q - a.q || sv.get(b.id) - sv.get(a.id));
  const tt = [...new Set(Object.values(P.eq).filter((x) => x && x.tt).map((x) => x.tt))];
  const canBest = ['vu_khi', 'ao', 'phu_kien'].some((sl) => P.bag.some((x) => x.slot === sl && g.betterThanEquipped(x)));
  const stats = [['atk', 'Công', fmt(F.atk)], ['def', 'Thủ', fmt(F.def)], ['hp', 'Sinh lực', fmt(F.maxHp)], ['crit', 'Bạo kích', `${Math.round(F.crit * 100)}%`], ['dodge', 'Né', `${Math.round(F.dodge * 100)}%`]];
  const lockB = sel ? `<button class="btn ghost" data-lock="${sel.id}">${sel.lock ? '🔓 Mở khóa' : '🔒 Khóa'}</button>` : '';
  const cf = (k) => bag.confirm === `${k}:${sel.id}`;
  const sellB = sel && !isEq ? (sel.lock ? '<span class="meta">Đã khóa: không bán, phân giải được</span>'
    : `<button class="btn ${cf('sell') ? 'danger' : 'ghost'}" data-sell="${sel.id}">${cf('sell') ? `Bấm lần nữa để bán ${QUALITY[sel.q].n}` : `💰 Bán · ${fmt(sel.val)}`}</button><button class="btn ${cf('salv') ? 'danger' : 'ghost'}" data-salv="${sel.id}" title="${esc(stripTok(g.matText(g.salvageYield(sel))))}">${cf('salv') ? 'Bấm lần nữa để phân giải' : '♻ Phân giải'}</button>`) : '';
  const detail = sel ? itemPop(sel, isEq) : '';
  const picked = [...bag.picked].filter((id) => P.bag.some((x) => x.id === id));
  const cap = g.bagCap();
  const emptyCells = Array.from({ length: Math.max(0, cap - list.length) }, () => '<div class="tile cell"></div>').join('');
  const spare = [0, 1, 2].map(() => '<div class="dollSlot"><div class="tile spare"><span class="tn">Sắp có</span></div></div>').join('');
  return `<div class="doll doll2"><div class="dollCol">${slotTile('vu_khi')}${slotTile('ao')}${slotTile('phu_kien')}</div><div class="dollFig"><canvas id="dollCv" width="32" height="40"></canvas><img id="dollArt" class="art" alt="" hidden></div><div class="dollCol">${spare}</div></div>
    <div class="statIcons">${stats.map(([k, n, v]) => `<button class="si" data-stat="f_${k}">${icoImg({ kind: STAT_ICO[k] })}<span>${n}</span><b>${v}</b></button>`).join('')}</div>
    ${tt.length ? `<div class="ttActive">Thần thông: ${tt.map((id) => `<span class="ttName">✦ ${esc(TT_MAP[id].n)}</span>`).join(' ')}</div>` : ''}
    ${detail}
    <div class="bagHead"><b>Túi ${P.bag.length}/${cap}</b><span class="bagBtns">${canBest ? '<button class="btn primary sm" data-best="1">✨ Mặc tốt nhất</button>' : ''}${bag.multi ? '' : '<button class="btn ghost sm" data-multi="1" title="Chọn nhiều để bán, phân giải">☑</button>'}</span></div>
    ${bag.multi ? `<div class="multiBar"><b>☑ Đang chọn để bán / phân giải · ${picked.length} món</b>
      <div class="row btnRow"><button class="btn ghost sm" data-pall="1">Chọn hết đồ kém</button><button class="btn ghost sm" data-msalv="1" ${picked.length ? '' : 'disabled'}>♻ Phân giải ${picked.length}</button><button class="btn ghost sm" data-msell="1" ${picked.length ? '' : 'disabled'}>💰 Bán ${picked.length}</button><button class="btn primary sm" data-multi="1">Xong</button></div></div>` : ''}
    <div class="grid5 bagGrid">${list.map((it) => itemTile(it)).join('')}${emptyCells}</div>`;
}
function bagCp() {
  const P = g.P;
  const pa = PATHS[P.path];
  const TAC_ICO = { cuong_cong: 'st_atk', can_bang: 'tam', phong_thu: 'st_def' };
  const tac = `<h3>Chiến thuật</h3><div class="tacCards">${Object.entries(TACTICS).map(([k, t]) => `<button class="tile tac ${P.tactic === k ? 'sel' : ''}" data-tc="${k}">${icoImg({ kind: TAC_ICO[k] })}<b>${t.n}</b><span class="tn">${t.desc}</span></button>`).join('')}</div>`;
  if (!pa) return `<p class="empty">Chưa chọn đạo lộ. Nhập đạo (6 tuổi) sẽ được chọn Kiếm Tu, Thể Tu hoặc Tinh Thần Lực.</p>${tac}`;
  const lv = g.skillLvs();
  const ids = PATH_SKILLS[P.path];
  const SLOT_N = { co: 'Đòn cơ bản', c1: 'Chiêu', c2: 'Chiêu', chot: 'Chiêu chốt', ult: 'Tuyệt kỹ', p1: 'Bị động', p2: 'Bị động', p3: 'Bị động' };
  const tile = (id) => {
    const sk = SKILLS[id];
    const open = !!lv[id];
    const L = (P.skLv && P.skLv[id]) || 1;
    const up = open && L < SKILL_MAX(id) && (P.sp || 0) >= g.skillCost(id);
    return `<button class="tile sk ${sk.slot === 'ult' ? 'ultT' : sk.kind === 'passive' ? 'pasT' : ''} ${bag.sel === id ? 'sel' : ''} ${open ? '' : 'locked'}" data-skt="${id}">${skIco(id)}${open ? `<span class="bdg plus">${L}</span>` : '<span class="bdg lk">🔒</span>'}${up ? '<span class="bdg up">▲</span>' : ''}<span class="tn">${esc(sk.n)}</span></button>`;
  };
  const col = (slots) => ids.filter((id) => slots.includes(SKILLS[id].slot)).map(tile).join('');
  const sel = typeof bag.sel === 'string' && ids.includes(bag.sel) ? bag.sel : null;
  let detail = '';
  if (sel) {
    const sk = SKILLS[sel];
    const L = (P.skLv && P.skLv[sel]) || 1;
    const open = !!lv[sel];
    const max = SKILL_MAX(sel);
    const c = g.skillCost(sel);
    const need = sk.realm >= 10 ? '' : REALMS[Math.max(0, sk.realm || 0)].n;
    const info = `${sk.kind === 'passive' ? `Hiệu lực x${skillLvMul(sel, L).toFixed(2)}` : `Sức chiêu x${skillLvMul(sel, L).toFixed(2)}`}${sk.mp ? ` · linh lực ${sk.mp}` : ''}${sk.hpCost ? ` · đốt ${Math.round(sk.hpCost * 100)}% máu` : ''}${sk.cd ? ` · hồi ${sk.cd} lượt` : ''}`;
    detail = popBox(skIco(sel), `<b>${esc(sk.n)}</b>`, `${SLOT_N[sk.slot]}${open ? ` · cấp ${L}/${max}` : ` · mở ở ${need}`}`,
      `<div class="ipLine">${esc(sk.desc)}</div><div class="ipPow">${info}</div>`,
      open && L < max ? `<button class="btn primary sm" data-sku="${sel}" ${(P.sp || 0) >= c ? '' : 'disabled'}>◈ Lên cấp ${L + 1} <small>${c} điểm</small></button>` : open ? '<span class="meta pos">Đã tối đa</span>' : '');
  }
  const mism = g.skillMismatch().length;
  const others = Object.keys(PATHS).filter((k) => k !== P.path);
  return `<div class="pathHead"><img class="pathPic" alt="" src="${heroStandArt(P.path, P.g)}"><div><b>${pa.icon} ${esc(pa.n)}</b><div class="meta">${esc(pa.tag)} · thanh ${esc(pa.res)}</div><div class="spBox">◈ Ngộ đạo điểm: <b>${P.sp || 0}</b></div>${P.branch && BRANCH_MAP[P.branch] ? `<div class="meta">Nhánh: <b>${BRANCH_MAP[P.branch].ic} ${esc(BRANCH_MAP[P.branch].n)}</b> · ${esc(BRANCH_MAP[P.branch].desc)}</div>` : '<div class="meta">Tới Kim Đan sẽ chọn nhánh đạo lộ.</div>'}</div></div>
    ${mism ? `<p class="forgeMsg">⚠ ${esc(pa.n)} cần ${WEAPON_TYPES[pa.wep].n.toLowerCase()}: binh khí đang cầm làm chiêu yếu đi.</p>` : ''}
    <div class="skTree"><div class="skCol"><h4>Chiêu thức</h4>${col(['co', 'c1', 'c2', 'chot'])}</div><div class="skCol"><h4>Tuyệt kỹ</h4>${col(['ult'])}</div><div class="skCol"><h4>Bị động</h4>${col(['p1', 'p2', 'p3'])}</div></div>
    ${detail}
    <details class="more"><summary>ⓘ Giải thích</summary><p class="intro">Ngộ đạo điểm có từ: đột phá (+5), lên nấc nhỏ (+1), trùm tháp, tông môn, Bia ngộ đạo, kỳ ngộ, ngọc giản ở Tụ Bảo Lâu và Tháp thương điếm.</p></details>
    ${tac}
    <h3>Chuyển tu</h3>
    ${P.flags.changedPath ? '<p class="meta">Kiếp này đã chuyển tu một lần.</p>' : `<p class="intro">Mỗi kiếp được đổi đạo lộ một lần: mất 50% tu vi, kỹ năng đường cũ về cấp 1, hoàn lại một nửa ngộ đạo điểm đã dùng.</p><div class="row btnRow">${others.map((k) => `<button class="btn ${bag.confirm === `cp:${k}` ? 'danger' : 'ghost'}" data-cpath="${k}">${bag.confirm === `cp:${k}` ? `Bấm lần nữa: chuyển sang ${PATHS[k].n}` : `${PATHS[k].icon} Chuyển sang ${PATHS[k].n}`}</button>`).join('')}</div>`}`;
}
function bagDan() {
  const P = g.P;
  const sel = typeof bag.sel === 'string' && (PILLS[bag.sel] || PHU[bag.sel]) ? bag.sel : null;
  const tiles = Object.entries(PILLS).map(([id, p]) => `<button class="tile ${sel === id ? 'sel' : ''} ${(P.pills[id] || 0) ? '' : 'dim'}" data-pl="${id}">${icoImg({ kind: 'dan', q: id === 'dien_tho' || id === 'pha_canh' ? 2 : id === 'bao_khi' ? 3 : 0, col: PILL_COLORS[id] })}<span class="bdg cnt">${P.pills[id] || 0}</span><span class="tn">${esc(p.n)}</span></button>`).join('');
  const phu = Object.entries(PHU).map(([k, x]) => `<button class="tile ${sel === k ? 'sel' : ''} ${(P.phu[k] || 0) ? '' : 'dim'}" data-pl="${k}">${icoImg({ kind: 'ho_phu', q: k === 'truyen_tong' ? 3 : 1 })}<span class="bdg cnt">${P.phu[k] || 0}</span><span class="tn">${esc(x.n)}</span></button>`).join('');
  let detail = '';
  const ps = bag.sel && PILLS[bag.sel] ? PILLS[bag.sel] : null;
  const fs = bag.sel && PHU[bag.sel] ? PHU[bag.sel] : null;
  if (ps) {
    const id = bag.sel;
    const st = id === 'dien_tho' ? (P.dienTho[P.realm] ? `<div class="sealLine">Đã dùng ở ${REALMS[P.realm].n}, lên cảnh giới mới mới hấp thu được.</div>` : '<div class="meta pos">Cảnh giới này chưa dùng.</div>') : id === 'bao_khi' && P.flags.baoKhi ? '<div class="meta pos">Dược lực đang chờ trận lớn kế tiếp.</div>' : '';
    const ico = icoImg({ kind: 'dan', q: id === 'dien_tho' || id === 'pha_canh' ? 2 : id === 'bao_khi' ? 3 : 0, col: PILL_COLORS[id] });
    detail = popBox(ico, `<b>${esc(ps.n)}</b>`, `Đan dược · có ${P.pills[id] || 0}`, `<div class="ipLine">${esc(ps.desc)}</div>${st}`,
      `${id === 'pha_canh' ? '<span class="meta">Dùng khi đột phá</span>' : `<button class="btn primary sm" data-use="${id}" ${(P.pills[id] || 0) ? '' : 'disabled'}>Dùng</button>`}${!ps.craft ? '<button class="btn ghost sm" data-goshop="1">🏮 Mua thêm</button>' : ''}`);
  } else if (fs) detail = popBox(icoImg({ kind: 'ho_phu', q: bag.sel === 'truyen_tong' ? 3 : 1 }), `<b>${esc(fs.n)}</b>`, `Phù · có ${P.phu[bag.sel] || 0}`, `<div class="ipLine">${esc(fs.desc)} Phù sư vẽ được (Mưu sinh).</div>`, '');
  return `${detail}<h3>Đan dược</h3><div class="grid5">${tiles}</div><h3>Phù</h3><div class="grid5">${phu}</div>`;
}
function bagNl() {
  const P = g.P;
  const groups = [['Cơ bản', (k, m) => !m.aff && !RARE_MATS_UI.has(k) && m.q < 3], ['Dẫn liệu (tẩy luyện, rèn ra dòng chọn sẵn)', (k, m) => !!m.aff], ['Hiếm', (k, m) => !m.aff && (RARE_MATS_UI.has(k) || m.q >= 3)]];
  const sel = typeof bag.sel === 'string' && MATS[bag.sel] ? bag.sel : null;
  const tile = (k) => `<button class="tile q${Math.min(4, MATS[k].q)} ${sel === k ? 'sel' : ''} ${(P.mats[k] || 0) ? '' : 'dim'}" data-mt="${k}">${matIco(k)}<span class="bdg cnt">${fmt(P.mats[k] || 0)}</span><span class="tn">${esc(MATS[k].n)}</span></button>`;
  const detail = sel ? popBox(matIco(sel), `<b>${esc(MATS[sel].n)}</b>`, `Nguyên liệu · có ${fmt(P.mats[sel] || 0)}`, `<div class="ipLine">${esc(MATS[sel].desc)}</div>`, '') : '';
  return `${detail}${groups.map(([n, f]) => { const ks = Object.keys(MATS).filter((k) => f(k, MATS[k]) && ((P.mats[k] || 0) > 0 || MATS[k].plane === undefined || (MATS[k].plane || 0) <= g.plane)); return ks.length ? `<h3>${n}</h3><div class="grid5">${ks.map(tile).join('')}</div>` : ''; }).join('')}
    <div class="row btnRow"><button class="btn primary" data-goforge="" ${g.forgeOpen() ? '' : 'disabled'}>⚒ Tới Lò rèn</button></div>`;
}
function bagSet() {
  const o = g.s.opt;
  const P = g.P;
  const tg = (k, label, on, attr = 'data-opt2') => `<button class="btn ${on ? 'on' : 'ghost'} setT" ${attr}="${k}"><span>${label}</span><b>${on ? 'bật' : 'tắt'}</b></button>`;
  const ex = g.bagExpandCost();
  return `<div class="setList">
    <h3>Trang bị</h3>
    ${tg('autoEquip', 'Nhặt được đồ mạnh hơn thì tự mặc', o.autoEquip !== false)}
    <div class="item"><b>Nhặt đồ thì tự xử lý theo phẩm</b><div class="meta">Đồ khóa, Thần thoại luôn được giữ.</div>
      <div class="qRules">${[0, 1, 2, 3].map((q) => `<div class="qRule"><span class="q${q}">${QUALITY[q].n}</span>${[['keep', 'Giữ'], ['sell', 'Bán'], ['salv', 'Phân giải']].map(([k, n]) => `<button class="btn sm ${g.qRule(q) === k ? 'on' : 'ghost'}" data-qr="${q}:${k}">${n}</button>`).join('')}</div>`).join('')}</div></div>
    <button class="btn ${o.autoSalvage ? 'on' : 'ghost'} setT" data-opt2="autoSalvage"><span>Túi đầy thì</span><b>${o.autoSalvage ? 'phân giải món kém' : 'bán món kém'}</b></button>
    ${ex ? `<div class="item"><b>Mở rộng túi: ${g.bagCap()} → ${g.bagCap() + 8} ô</b><div class="row btnRow"><button class="btn ghost sm" data-bx="money" ${P.money >= ex.money ? '' : 'disabled'}>${fmt(ex.money)} linh thạch</button><button class="btn ghost sm" data-bx="coin" ${(P.towerCoin || 0) >= ex.coin ? '' : 'disabled'}>${ex.coin} Tháp tệ</button></div></div>` : ''}
    <div class="row btnRow"><button class="btn ghost sm" data-salvall="1" ${P.bag.some((x) => x.q <= 1) ? '' : 'disabled'}>♻ Phân giải hết Hạ, Trung phẩm</button><button class="btn ghost sm" data-salvall2="1" ${P.bag.some(weakItem) ? '' : 'disabled'}>♻ Phân giải đồ yếu hơn đồ đang mặc</button></div>
    <h3>Đan dược, thương thế</h3>
    ${tg('autoPill', '💊 Trọng thương thì tự uống Hồi Xuân Đan', !!o.autoPill)}
    ${tg('autoBuyPill', `Hết đan thì tự mua (${fmt(g.pillPrice('hoi_xuan'))}/viên)`, !!o.autoBuyPill)}
    ${tg('autoBaoKhi', 'Trận lớn tự uống Bạo Khí Đan', o.autoBaoKhi !== false)}
    ${tg('retreat', 'Lịch luyện trọng thương thì tự lui về vùng dễ', !!o.retreat)}
    <h3>Kỹ năng, tháp</h3>
    ${tg('autoSkill', 'Có ngộ đạo điểm thì tự nâng kỹ năng', o.autoSkill !== false)}
    ${tg('towerResume', 'Thua tháp thì tu luyện, đủ sức tự leo lại', o.towerResume !== false)}
    ${tg('chapters', 'Mỗi 10 năm chọn Chương mới', o.chapters !== false)}
    <h3>Xem trận</h3>
    <div class="meta">Trận thường</div><div class="opts">${Object.entries(BATTLE_VIEW).map(([k, n]) => `<button class="btn sm ${battleView === k ? 'on' : 'ghost'}" data-bv="${k}">${n}</button>`).join('')}</div>
    <div class="meta">Trong tháp</div><div class="opts">${Object.entries(TOWER_VIEW).map(([k, n]) => `<button class="btn sm ${towerView === k ? 'on' : 'ghost'}" data-tv="${k}">${n}</button>`).join('')}</div>
    <p class="meta">Từ ${AUTO_SPEED}× trận thường luôn bỏ qua, kết quả vẫn ghi vào nhật ký.</p>
    <h3>Giao diện</h3>
    <button class="btn ghost" data-theme="1">🌓 Đổi giao diện sáng / tối</button>
  </div>`;
}
const RARE_MATS_UI = new Set(['than_hon', 'dao_van_thach', 'linh_tuy']);
/** Đồ kém: tự chọn để bán, phân giải hàng loạt */
const weakItem = (x) => x.q <= 2 && !x.lock && !g.betterThanEquipped(x);
function openBag(tabId) {
  if (tabId) { bag.tab = tabId; bag.sel = null; }
  bag.multi = false; bag.picked.clear(); bag.confirm = null;
  const draw = (msg = '') => {
    const P = g.P;
    const body = { eq: bagEq, cp: bagCp, dan: bagDan, nl: bagNl, set: bagSet }[bag.tab]();
    openSheet(`<h2>Túi trữ vật</h2>
      <div class="bagTabs">${BAG_TABS.map(([k, n, ic]) => `<button class="bt ${bag.tab === k ? 'on' : ''}" data-bt="${k}" aria-label="${n}">${icoImg(ic)}<span>${n}</span></button>`).join('')}</div>
      ${msg ? `<p class="forgeMsg">${rich(msg)}${g.s.undo && performance.now() < undoUntil ? ' <button class="btn ghost sm" data-undo="1">↶ Hoàn tác</button>' : ''}</p>` : ''}
      ${body}`, () => {
      const B = $('sheetBody');
      $('sheetClose').hidden = true;
      const cv = $('dollCv');
      if (cv) { drawPortrait(cv, P, { life: g.lifespan(), robe: playerRobe(P) }); setArt($('dollArt'), PATHS[P.path] ? { src: heroStandArt(P.path, P.g), filter: heroFilter(P.path, P.g) } : null, cv); }
      const q = (sel, fn) => B.querySelectorAll(sel).forEach((b) => { b.onclick = () => { const cf0 = bag.confirm; const m = fn(b); if (bag.confirm === cf0) bag.confirm = null; save(); dirty = true; draw(typeof m === 'string' ? m : ''); }; });
      // bán, phân giải: đồ Cực phẩm trở lên phải bấm hai lần; xong thì có Hoàn tác trong 10 giây
      const undoable = (fn) => { g.undoStart(); const m = fn(); if (g.undoEnd()) undoUntil = performance.now() + 10000; return m; };
      const twice = (k, it, fn) => { if (it && it.q >= 3 && bag.confirm !== `${k}:${it.id}`) { bag.confirm = `${k}:${it.id}`; return ''; } bag.confirm = null; bag.sel = null; return undoable(fn); };
      q('[data-undo]', () => g.undoLast() || '');
      q('[data-bv]', (b) => { battleView = b.dataset.bv; });
      q('[data-tv]', (b) => { towerView = b.dataset.tv; });
      q('[data-theme]', () => { const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = nx; try { localStorage.setItem('tkps.theme', nx); } catch (e) { /* bỏ qua */ } });
      q('[data-ipx]', () => { bag.sel = null; });
      if (bag.tab !== 'set') {
        placeItemPop();
        // chạm chỗ trống trong túi thì đóng popup
        B.onclick = (e) => { if (bag.sel != null && !e.target.closest('button, .itemPop, select, input')) { bag.sel = null; draw(); } };
      } else B.onclick = null;
      q('[data-lock]', (b) => g.toggleLock(+b.dataset.lock));
      q('[data-qr]', (b) => { const [qq, k] = b.dataset.qr.split(':'); g.s.opt.qRule = { ...(g.s.opt.qRule || {}), [qq]: k }; });
      q('[data-bx]', (b) => g.expandBag(b.dataset.bx) || 'Không đủ.');
      q('[data-eqrl]', (b) => { g.equip(+b.dataset.eqrl, true); g.autoLoadout(); return `Đã mặc và xếp kỹ năng: ${g.P.loadout.map((id) => SKILLS[id].n).join(', ')}.`; });
      q('[data-trt]', (b) => { bag.trial = b.dataset.trt; });
      q('[data-trial]', (b) => {
        const it = g.findItem(+b.dataset.trial);
        const isEq = Object.values(P.eq).includes(it);
        const now = g.trialOdds(bag.trial);
        const eq = { ...P.eq, [it.slot]: it };
        const w = isEq ? now : g.trialOdds(bag.trial, eq);
        const L = it.slot === 'vu_khi' && !isEq ? g.loadoutFor(it.wt) : null;
        const rl = L && L.join() !== P.loadout.join() ? g.trialOdds(bag.trial, eq, L) : null;
        bag.trialRes = { id: it.id, t: bag.trial, now, with: w, rl };
      });
      q('[data-bt]', (b) => { bag.tab = b.dataset.bt; bag.sel = null; bag.multi = false; bag.picked.clear(); });
      q('[data-it]', (b) => {
        const id = +b.dataset.it;
        const it = P.bag.find((x) => x.id === id);
        if (bag.multi && it) { if (it.lock) return `${itemName(it)} đã khóa, không chọn được.`; if (bag.picked.has(id)) bag.picked.delete(id); else bag.picked.add(id); return; }
        bag.sel = bag.sel === id ? null : id; bag.trialRes = null;
      });
      q('[data-emp]', (b) => { bag.slot = b.dataset.emp; bag.sel = null; return P.bag.some((x) => x.slot === b.dataset.emp) ? '' : `Chưa có ${SLOTS[b.dataset.emp].toLowerCase()} trong túi. Mua ở Tụ Bảo Lâu, rèn ở Lò rèn, hoặc vượt tháp, lịch luyện để nhặt.`; });
      q('[data-fs]', (b) => { bag.slot = b.dataset.fs; });
      q('[data-so]', (b) => { bag.sort = b.dataset.so; });
      q('[data-multi]', () => { bag.multi = !bag.multi; bag.picked.clear(); bag.sel = null; });
      q('[data-pall]', () => { for (const it of P.bag) if (weakItem(it)) bag.picked.add(it.id); });
      q('[data-msalv]', () => { const ids = [...bag.picked]; bag.picked.clear(); bag.multi = false; return undoable(() => { const out = ids.map((id) => g.salvage(id)).filter(Boolean); return out.length ? `Phân giải ${out.length} món.` : ''; }); });
      q('[data-msell]', () => { const ids = [...bag.picked]; bag.picked.clear(); bag.multi = false; return undoable(() => `Bán ${ids.length} món được ${fmt(ids.reduce((m, id) => m + (g.sell(id) || 0), 0))} linh thạch.`); });
      q('[data-un]', (b) => { g.unequip(b.dataset.un); });
      q('[data-eq]', (b) => { const it = g.findItem(+b.dataset.eq); const gp = g.swapGain(it); g.equip(+b.dataset.eq, true); return `Đã mặc ${itemName(it)} (lực chiến ${pctS(gp)}).`; });
      q('[data-sell]', (b) => { const it = g.findItem(+b.dataset.sell); return twice('sell', it, () => `Bán được ${g.sell(it.id)} linh thạch.`); });
      q('[data-salv]', (b) => { const it = g.findItem(+b.dataset.salv); return twice('salv', it, () => `Phân giải được: ${g.salvage(it.id)}.`); });
      q('[data-salvall2]', () => undoable(() => { const ids = P.bag.filter(weakItem).map((x) => x.id); ids.forEach((id) => g.salvage(id)); return `Phân giải ${ids.length} món.`; }));
      q('[data-salvall]', () => undoable(() => g.salvageAll(1)));
      q('[data-best]', () => { const v0 = g.combatValue(); const n = g.equipBest(); return n ? `Đã thay ${n} món, lực chiến ${pctS(g.combatValue() / v0 - 1)}.` : 'Đồ đang mang đã là tốt nhất.'; });
      q('[data-enh]', (b) => g.enhance(+b.dataset.enh) || 'Không đủ nguyên liệu.');
      q('[data-up]', (b) => g.upgrade(+b.dataset.up) || 'Không đủ nguyên liệu.');
      q('[data-skt]', (b) => { bag.sel = bag.sel === b.dataset.skt ? null : b.dataset.skt; });
      q('[data-sku]', (b) => g.upgradeSkill(b.dataset.sku) || 'Chưa đủ ngộ đạo điểm.');
      q('[data-cpath]', (b) => { const k = b.dataset.cpath; if (bag.confirm !== `cp:${k}`) { bag.confirm = `cp:${k}`; return ''; } bag.confirm = null; bag.sel = null; return g.changePath(k) || ''; });
      q('[data-hs]', () => 'Chạm một kỹ năng bên dưới rồi chọn ô để đặt vào.');
      q('[data-put]', (b) => { g.setSkillSlot(+b.dataset.put, bag.sel); });
      q('[data-rm]', () => { g.toggleSkill(bag.sel); });
      q('[data-autosk]', () => (g.autoLoadout() ? `Đã xếp: ${g.P.loadout.map((id) => SKILLS[id].n).join(', ')}.` : 'Bộ kỹ năng đang mang đã hợp nhất rồi.'));
      q('[data-tc]', (b) => g.setTactic(b.dataset.tc));
            q('[data-pl]', (b) => { bag.sel = bag.sel === b.dataset.pl ? null : b.dataset.pl; });
      q('[data-mt]', (b) => { bag.sel = bag.sel === b.dataset.mt ? null : b.dataset.mt; });
      q('[data-use]', (b) => g.usePill(b.dataset.use) || '');
      q('[data-opt2]', (b) => { const k = b.dataset.opt2; g.s.opt[k] = k === 'towerResume' || k === 'autoBaoKhi' || k === 'autoSkill' || k === 'autoEquip' || k === 'chapters' ? g.s.opt[k] === false : !g.s.opt[k]; if (k === 'autoPill' && !g.s.opt.autoPill) g.s.opt.autoBuyPill = false; if (k === 'autoSkill' && g.s.opt.autoSkill !== false) g.autoSpendSP(); });
      bindPillOpts(draw);
      B.querySelectorAll('[data-goshop]').forEach((b) => { b.onclick = openShop; });
      B.querySelectorAll('[data-goforge]').forEach((b) => { b.onclick = () => { const [sl, wt] = b.dataset.goforge.split(':'); if (sl) { forgeTab = 'moi'; forgeSel.slot = sl; if (wt) forgeSel.wt = wt; } openForge(); }; });
    });
  };
  draw();
}

/** Ô danh hiệu riêng: đã đạt (đeo một cái) và chưa đạt (hiện điều kiện) */
function titleCard(t, state) {
  const stars = '★'.repeat(t.tier) + '☆'.repeat(4 - t.tier);
  const btn = state === 'on' ? '<button class="btn on" data-ti="">Đang đeo</button>'
    : state === 'got' ? `<button class="btn ghost" data-ti="${t.id}">Đeo</button>` : '';
  return `<div class="tcard t${t.tier} ${state}">
    <div class="tseal" aria-hidden="true">${stars}</div>
    <div class="body"><div class="row"><b class="tname"><span>${esc(t.n)}</span></b><span class="meta">${TITLE_TIER_N[t.tier]}</span></div>
      <div class="meta">${state === 'lock' ? 'Điều kiện: ' : ''}${esc(t.cond)} · Khi đeo: ${esc(t.bonus)}</div>
      ${btn ? `<div class="row btnRow">${btn}</div>` : ''}</div></div>`;
}
function openTitles() {
  const draw = () => {
    const P = g.P;
    const got = TITLES.filter((t) => P.titles.includes(t.id)).sort((a, b) => b.tier - a.tier);
    const lock = TITLES.filter((t) => !P.titles.includes(t.id)).sort((a, b) => a.tier - b.tier);
    const cur = P.title ? TITLE_MAP[P.title] : null;
    openSheet(`<h2>Danh hiệu</h2>
      <details class="more"><summary>ⓘ Giải thích</summary><p class="intro">Giang hồ xưng tụng theo việc ngươi làm trong kiếp này. Đeo một danh hiệu để nhận lợi ích, danh hiệu sẽ hiện phía trên tên. Kiếp sau phải làm lại từ đầu.</p></details>
      ${cur ? `<div class="tcur"><span class="meta">Đang đeo</span><span class="ttl t${cur.tier} big"><span>${esc(cur.n)}</span></span></div>` : ''}
      <h3>Đã đạt · ${got.length}/${TITLES.length}</h3>
      <div class="list">${got.map((t) => titleCard(t, P.title === t.id ? 'on' : 'got')).join('') || '<p class="empty">Chưa có danh hiệu nào.</p>'}</div>
      <h3>Chưa đạt</h3>
      <div class="list">${lock.map((t) => titleCard(t, 'lock')).join('')}</div>`, () => {
      $('sheetBody').querySelectorAll('[data-ti]').forEach((b) => { b.onclick = () => { g.setTitle(b.dataset.ti || null); save(); draw(); dirty = true; }; });
    });
  };
  draw();
}

// ---------- Thông báo danh hiệu mới ----------
let toastBusy = false;
function showToasts() {
  const q = g.s.toasts;
  if (toastBusy || !q || !q.length) return;
  const t = q.shift();
  toastBusy = true;
  const el = $('toast');
  el.className = `toast t${t.tier}`;
  el.innerHTML = t.msg
    ? `<b class="tHead">${esc(t.head || 'Tin mới')}</b><span class="toastMsg">${rich(t.msg)}</span>`
    : `<b class="tHead">🏅 Danh hiệu mới</b><span class="ttl t${t.tier} mini"><span>${esc(t.n)}</span></span><span class="meta">${esc(t.bonus)}</span>`;
  el.hidden = false;
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.hidden = true; toastBusy = false; }, 400); }, 2600);
}

let shopSel = null;
function openShop() {
  shopSel = null;
  const draw = (msg = '') => {
    const P = g.P;
    const ids = Object.keys(PILLS).filter((id) => !PILLS[id].craft);
    const st = g.shopStock();
    const bought = P.shopBought || [];
    const sg = g.sageStock();
    const pIco = (id) => icoImg({ kind: 'dan', q: id === 'dien_tho' || id === 'pha_canh' ? 2 : 0, col: PILL_COLORS[id] });
    let pop = '';
    if (shopSel && PILLS[shopSel]) {
      const p = PILLS[shopSel], price = g.pillPrice(shopSel), n = P.pills[shopSel] || 0;
      pop = popBox(pIco(shopSel), `<b>${esc(p.n)}</b>`, `Đan dược · có ${n}`, `<div class="ipLine">${esc(p.desc)}</div>`,
        `<button class="btn primary sm" data-buy="${shopSel}" ${P.money < price ? 'disabled' : ''}>Mua · ${fmtShort(price)}</button>${shopSel !== 'pha_canh' ? `<button class="btn ghost sm" data-use="${shopSel}" ${n ? '' : 'disabled'}>Dùng</button>` : '<span class="meta">Dùng khi đột phá</span>'}`);
    } else if (shopSel && shopSel.startsWith('g:')) {
      const it = st.gear.find((x) => x.key === shopSel.slice(2));
      if (it) {
        const sold = bought.includes(it.key);
        const gn = g.swapGain(it);
        const wt = it.wt ? ` · ${WEAPON_TYPES[it.wt].n}` : '';
        pop = popBox(itemIco(it), `<b class="${qCls(it.q)}">${esc(itemName(it))}</b>`, `${QUALITY[it.q].n} · ${SLOTS[it.slot]}${wt}`,
          `<div class="ipLine">${esc(itemLine(it))}</div>${ttLine(it)}<div class="ipPow">Lực chiến khi mặc <b class="${gn > 0.005 ? 'pos' : gn < -0.005 ? 'neg' : ''}">${pctS(gn)}</b></div>`,
          sold ? '<span class="meta">Đã bán hết</span>' : `<button class="btn primary sm" data-bg="${it.key}" ${P.money < it.price ? 'disabled' : ''}>Mua · ${fmtShort(it.price)}</button>`);
      }
    } else if (shopSel === 'sage') {
      pop = popBox(icoImg({ kind: 'bi_kip', q: 3 }), '<b>Ngọc giản ngộ đạo</b>', `Còn ${sg.left}/2 · đổi hàng mỗi 5 năm`, '<div class="ipLine">Đọc xong được 3 ngộ đạo điểm (◈) để nâng kỹ năng.</div>',
        `<button class="btn primary sm" data-sage="1" ${sg.left && P.money >= sg.price ? '' : 'disabled'}>Mua · ${fmtShort(sg.price)}</button>`);
    }
    const tile = (key, ico, name, price, extra = '', cls = '') => `<button class="tile shopTile ${cls} ${shopSel === key ? 'sel' : ''}" data-ps="${key}">${ico}${extra}<span class="tn">${esc(name)}</span><span class="tp">${price}</span></button>`;
    const pills = ids.map((id) => tile(id, pIco(id), PILLS[id].n, fmtShort(g.pillPrice(id)), `<span class="bdg cnt">${P.pills[id] || 0}</span>`)).join('');
    const gear = st.gear.map((it) => tile(`g:${it.key}`, itemIco(it), itemName(it), bought.includes(it.key) ? 'Hết' : fmtShort(it.price), g.betterThanEquipped(it) && !bought.includes(it.key) ? '<span class="bdg up">▲</span>' : '', `q${it.q} ${bought.includes(it.key) ? 'dim' : ''}`)).join('');
    const sage = tile('sage', icoImg({ kind: 'bi_kip', q: 3 }), 'Ngọc giản', fmtShort(sg.price), `<span class="bdg cnt">${sg.left}</span>`, sg.left ? '' : 'dim');
    openSheet(`<h2>Tụ Bảo Lâu</h2><p class="intro">💎 <b>${fmt(P.money)}</b> linh thạch${g.ngheLv('thuong_nhan') ? ` · Thương nhân giảm ${g.ngheLv('thuong_nhan') * 3}%` : ''}. Pháp khí, ngọc giản đổi hàng mỗi 5 năm.</p>
      ${msg ? `<p class="forgeMsg">${esc(msg)}</p>` : ''}
      <h3>Đan dược</h3><div class="grid5 shopGrid">${pills}</div>
      <h3>Pháp khí</h3><div class="grid5 shopGrid">${gear}</div>
      <h3>Ngọc giản</h3><div class="grid5 shopGrid">${sage}</div>
      ${pop}`, () => {
      const B = $('sheetBody');
      B.querySelectorAll('[data-ps]').forEach((b) => { b.onclick = () => { shopSel = shopSel === b.dataset.ps ? null : b.dataset.ps; draw(); }; });
      B.querySelectorAll('[data-buy]').forEach((b) => { b.onclick = () => { const id = b.dataset.buy; const n0 = P.pills[id] || 0; g.buy(id); save(); draw((P.pills[id] || 0) > n0 ? `Đã mua 1 ${PILLS[id].n}.` : 'Không đủ linh thạch.'); }; });
      B.querySelectorAll('[data-bg]').forEach((b) => { b.onclick = () => { const m = g.buyGear(b.dataset.bg); shopSel = null; save(); draw(m || ''); }; });
      B.querySelectorAll('[data-sage]').forEach((b) => { b.onclick = () => { const m = g.buySage(); save(); draw(m || ''); }; });
      B.querySelectorAll('[data-use]').forEach((b) => { b.onclick = () => { const m = g.usePill(b.dataset.use); save(); draw(m || ''); }; });
      bindPop(() => { shopSel = null; }, draw);
    });
  };
  draw();
}
function openClose() {
  const P = g.P;
  openSheet(`<h2>Bế quan</h2><img class="medPic" alt="" src="${meditateArt(P.g)}"><p class="intro">Phong bế động phủ, tu vi tăng gấp 1,6 lần, gần như không gặp kỳ ngộ. Thời gian trôi nhanh gấp ba. Có chút rủi ro tẩu hỏa. Tu vi viên mãn thì tự xuất quan.</p>
    <ul class="statList"><li>Bế quan đủ 10 năm: lần đột phá kế tiếp +15%, xuất quan sinh lực đầy, sát khí tan hết, căn cơ vững chắc.</li><li>Tử quan (50 năm trở lên): tu vi x2, xuất quan 50% đốn ngộ (ngộ đạo điểm +4).</li></ul>
    <div class="cstats"><span>Sát khí <b>${Math.round(P.sat || 0)}</b></span><span>Chưa vững <b>${fmt(P.loose || 0)}</b></span>${P.brkBonus ? `<span>Đang có <b>+15%</b> đột phá</span>` : ''}</div>
    <div class="list">${[5, 10, 20, 50, 100].map((y) => `<button class="btn" data-y="${y}">${y >= 50 ? 'Tử quan' : 'Bế quan'} ${y} năm${y >= 10 ? `<small>${y >= 50 ? 'x2 tu vi, có thể đốn ngộ' : '+15% đột phá, xả sạch sát khí'}</small>` : ''}</button>`).join('')}</div>`, () => {
    $('sheetBody').querySelectorAll('[data-y]').forEach((b) => {
      b.onclick = () => { g.closeDoor(+b.dataset.y); $('sheet').hidden = true; paused = false; save(); dirty = true; };
    });
  });
}

$('menuBtn').onclick = () => {
  openSheet(`<h2>Trăm Kiếp Phù Sinh</h2>
    <p class="intro">Mỗi năm chọn một việc. Kỳ ngộ sẽ tự tìm tới. Tu vi đầy thì đột phá. Chết rồi thì đầu thai, mang theo một tàn niệm.</p>
    <p class="intro">Bốn mươi linh hồn khác cũng sống trong thế giới này. Họ tu luyện, kết thù, lập tông môn, chết đi rồi đầu thai như ngươi. Người từng thân với ngươi có thể nhận ra ngươi ở kiếp sau. Kẻ thù cũng vậy.</p>
    <p class="intro">Hữu tình: bạn bè hộ pháp khi ngươi đột phá. Vô tình: tu nhanh hơn, đột phá vững hơn, nhưng cô độc.</p>
    ${fsInfo()}
    <h3>Phiên bản</h3>
    <p class="intro">Đang chạy bản <b>${APP_VERSION}</b>.${newVersion ? ` Có bản mới <b>${newVersion}</b>.` : ''}</p>
    <div class="row btnRow"><button class="btn ghost" id="checkUpd">🔄 Kiểm tra cập nhật</button>${newVersion ? '<button class="btn primary" id="doUpd">Cập nhật ngay</button>' : ''}</div>
    <p class="intro" id="updMsg"></p>
    <h3>Bản lưu</h3>
    <p class="intro">Chuyển thế giới đang chơi sang trang khác hoặc máy khác: Xuất ra một đoạn mã rồi Nhập ở bên kia.</p>
    <div class="row btnRow"><button class="btn ghost" id="exportBtn">📤 Xuất bản lưu</button><button class="btn ghost" id="importBtn">📥 Nhập bản lưu</button></div>
    <div class="list">${canFullscreen() ? `<button class="btn" id="fsBtn">${document.fullscreenElement ? 'Thoát toàn màn hình' : '⛶ Toàn màn hình'}</button>` : ''}<button class="btn" id="newWorld">Tạo thế giới mới (xóa bản lưu)</button></div>`, () => {
    $('checkUpd').onclick = async () => { $('updMsg').textContent = 'Đang kiểm tra...'; $('updMsg').textContent = await checkUpdate(true); if (newVersion && !$('doUpd')) $('menuBtn').onclick(); };
    if ($('doUpd')) $('doUpd').onclick = applyUpdate;
    $('exportBtn').onclick = openExport;
    $('importBtn').onclick = openImport;
    if ($('fsBtn')) $('fsBtn').onclick = () => { toggleFullscreen(); $('sheet').hidden = true; };
    $('newWorld').onclick = openNewWorld;
  });
};

// Chạm chỉ số để xem giải thích. Dùng pointerdown vì chỉ số được vẽ lại liên tục khi thời gian trôi.
let statTap = null;
for (const id of ['bars', 'scr-birth', 'sheetBody', 'hudChips']) {
  $(id).addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-stat]');
    statTap = b ? { k: b.dataset.stat, x: e.clientX, y: e.clientY } : null;
  });
  $(id).addEventListener('pointerup', (e) => {
    const b = e.target.closest('[data-stat]');
    const t = statTap;
    statTap = null;
    // chỉ mở khi nhấc tay đúng chỉ số đã chạm và không phải đang vuốt cuộn
    if (!t || !b || b.dataset.stat !== t.k || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12) return;
    openStat(t.k, g.s.phase === 'birth' ? g.s.draft : g.P);
  });
  $(id).addEventListener('keydown', (e) => {
    const b = e.target.closest('[data-stat]');
    if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openStat(b.dataset.stat, g.s.phase === 'birth' ? g.s.draft : g.P); }
  });
}

// Gắn sự kiện một lần (ủy quyền), không gắn lại mỗi lần vẽ
$('speed').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.do === 'break') { g.openBreak(); dirty = true; return; }
  if (b.dataset.do === 'auto') {
    askMode = ASK_NEXT[askMode];
    $('tip').textContent = `${ASK[askMode]}: ${ASK_TIP[askMode]}`; $('tip').hidden = false; clearTimeout(tipHide); tipHide = setTimeout(closeTip, 3500);
    if (shouldAuto()) { g.autoResolve(wantTower); markFresh(); }
    save(); dirty = true; return;
  }
  const v = +b.dataset.sp;
  if (v === 0) paused = !paused;
  else { speed = v; paused = false; }
  dirty = true;
});
// Bấm giữ nút việc làm, tiện ích: hiện mô tả ngắn
let tipTimer = null, tipShown = false, tipHide = null;
function closeTip() { clearTimeout(tipHide); $('tip').hidden = true; }
function hideTip() { clearTimeout(tipTimer); tipTimer = null; if (!$('tip').hidden) { clearTimeout(tipHide); tipHide = setTimeout(closeTip, 1500); } }
for (const id of ['actions', 'utils']) {
  $(id).addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-tip]');
    tipShown = false;
    clearTimeout(tipTimer);
    if (!b) return;
    tipTimer = setTimeout(() => { tipShown = true; $('tip').textContent = b.dataset.tip; $('tip').hidden = false; clearTimeout(tipHide); tipHide = setTimeout(closeTip, 4000); }, 450);
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) $(id).addEventListener(ev, hideTip);
  $(id).addEventListener('contextmenu', (e) => { if (e.target.closest('[data-tip]')) e.preventDefault(); });
}
$('hudPic').onclick = openChar;
$('hudLine').onclick = openChar;
$('breakRow').addEventListener('click', (e) => { if (e.target.closest('[data-do="break"]')) { g.openBreak(); dirty = true; } });
function dockClick(e) {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  // vừa bấm giữ để xem mô tả thì không tính là bấm
  if (tipShown) { tipShown = false; return; }
  if (b.dataset.do === 'more') { openMore(); return; }
  const chL = g.chapter();
  if (b.dataset.act && chL && chL.c.lock && b.dataset.act !== chL.c.act) { g.manualAction(b.dataset.act); dirty = true; return; }
  if (b.dataset.act === 'lich_luyen') openMaps();
  else if (b.dataset.act === 'vuot_thap') openTower();
  else if (b.dataset.act === 'muu_sinh') openWork();
  else if (b.dataset.act) { g.manualAction(b.dataset.act); save(); }
  else if (b.dataset.do === 'forge') openForge();
  else if (b.dataset.do === 'shop') openShop();
  else if (b.dataset.do === 'bag') openBag();
  else if (b.dataset.do === 'titles') openTitles();
  else if (b.dataset.do === 'openDoor') g.openDoor();
  dirty = true;
}
$('actions').addEventListener('click', dockClick);
$('utils').addEventListener('click', dockClick);
$('tabbody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lf]');
  if (b) { logFilter = b.dataset.lf; dirty = true; }
});
function hwClick(e) {
  const b = e.target.closest('[data-hw]');
  if (!b) return;
  if (b.dataset.hw === 'fate') openFate();
  else if (b.dataset.hw === 'chap') openChapter();
  else if (b.dataset.hw === 'wep') openBag('cp');
  else if (b.dataset.hw === 'gear') openBag('eq');
  else if (b.dataset.hw === 'tower') openTower();
  else if (b.dataset.hw === 'plan') openPlan();
  else openSheet(`<h2>⛓ Bình cảnh nhỏ</h2><p class="intro">Tu vi đang kẹt ở ${esc(g.subRealmName())}. Còn khoảng ${Math.max(0, g.P.flags.neck.until - g.P.age)} năm sẽ tự thông. Uống Tĩnh Tâm Đan (Tụ Bảo Lâu) để phá ngay. Ngộ tính cao thì dễ bỗng ngộ ra sớm.</p>
    <div class="row btnRow"><button class="btn primary" id="neckPill" ${(g.P.pills.tinh_tam || 0) > 0 ? '' : 'disabled'}>Uống Tĩnh Tâm Đan (có ${g.P.pills.tinh_tam || 0})</button><button class="btn ghost" id="neckShop">🏮 Tụ Bảo Lâu</button></div>`, () => {
    $('neckPill').onclick = () => { g.usePill('tinh_tam'); save(); $('sheet').hidden = true; dirty = true; };
    $('neckShop').onclick = openShop;
  });
}
$('hudSub').addEventListener('click', hwClick);
$('hudChips').addEventListener('click', hwClick);
$('tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b && b.dataset.tab) { tab = b.dataset.tab; dirty = true; }
});

// Bàn phím: 1-9 chọn phương án, Space tạm dừng/chạy, Esc đóng bảng
document.addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, textarea, select')) return;
  if (e.key === 'Escape' && !$('sheet').hidden) { $('sheet').hidden = true; dirty = true; return; }
  if (!$('sheet').hidden || !g.playing) return;
  if (!$('evPanel').hidden && /^[1-9]$/.test(e.key)) {
    const b = $('evChoices').querySelector(`[data-ch="${+e.key - 1}"]`);
    if (b) { e.preventDefault(); pickChoice(+e.key - 1); }
    return;
  }
  if (e.key === ' ' && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); paused = !paused; dirty = true; }
});

// ---------- Thế giới mới: chọn độ khó ----------
function openNewWorld() {
  let pick = 'thuong';
  const draw = () => openSheet(`<h2>Tạo thế giới mới</h2>
    <p class="intro"><b>Thế giới hiện tại sẽ bị xóa</b> (cả Sổ kiếp và Hồn Lực). Muốn giữ thì vào Thêm → Hướng dẫn, bản lưu → Xuất bản lưu trước.</p>
    <h3>Độ khó</h3><div class="list">${Object.entries(WORLD_DIFF).map(([k, d]) => `<button class="btn ${pick === k ? 'on' : ''}" data-wd="${k}">${d.n}<small>${esc(d.desc)}</small></button>`).join('')}</div>
    <div class="row btnRow"><button class="btn primary" id="nwGo">Xóa và tạo thế giới ${WORLD_DIFF[pick].n}</button><button class="btn ghost" id="nwBack">Thôi</button></div>`, () => {
    $('sheetBody').querySelectorAll('[data-wd]').forEach((b) => { b.onclick = () => { pick = b.dataset.wd; draw(); }; });
    $('nwBack').onclick = () => { $('sheet').hidden = true; };
    $('nwGo').onclick = () => { g = Game.create(undefined, pick); paused = false; save(); $('sheet').hidden = true; dirty = true; };
  });
  draw();
}

// ---------- Xuất / nhập bản lưu ----------
const SAVE_TAG = 'TKPS1:';
function exportCode() {
  save();
  const raw = g.save();
  return SAVE_TAG + btoa(unescape(encodeURIComponent(raw)));
}
function decodeSave(text) {
  const t = String(text || '').trim();
  if (t.startsWith(SAVE_TAG)) return decodeURIComponent(escape(atob(t.slice(SAVE_TAG.length).replace(/\s+/g, ''))));
  if (t.startsWith('{')) return t;
  throw new Error('Mã không đúng định dạng');
}
function openExport() {
  const code = exportCode();
  openSheet(`<h2>📤 Xuất bản lưu</h2>
    <p class="intro">Đoạn mã dưới đây chứa cả thế giới: kiếp đang chơi, các kiếp trước, Hồn Lực, bốn mươi linh hồn. Chép lại rồi dán ở mục Nhập bản lưu của trang kia. Mã dài ${fmt(code.length)} ký tự.</p>
    <textarea class="saveBox" id="saveOut" readonly>${esc(code)}</textarea>
    <div class="row btnRow"><button class="btn primary" id="copySave">Chép mã</button>${document.querySelector('link[rel="manifest"]') ? '<button class="btn ghost" id="dlSave">Tải về thành tệp</button>' : ''}</div>
    <p class="intro" id="saveMsg"></p>`, () => {
    $('copySave').onclick = async () => {
      try { await navigator.clipboard.writeText(code); $('saveMsg').textContent = 'Đã chép. Giờ mở trang kia, vào ☰ → Nhập bản lưu, rồi dán.'; }
      catch (e) { const t = $('saveOut'); t.focus(); t.select(); $('saveMsg').textContent = 'Trình duyệt không cho chép tự động. Đã bôi đen sẵn, hãy bấm giữ rồi chọn Sao chép.'; }
    };
    if ($('dlSave')) $('dlSave').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
      a.download = `tram-kiep-${g.s.year}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
  });
}
function openImport() {
  openSheet(`<h2>📥 Nhập bản lưu</h2>
    <p class="intro">Dán đoạn mã đã xuất (bắt đầu bằng ${SAVE_TAG}). <b>Thế giới hiện tại ở trang này sẽ bị thay thế.</b> Muốn giữ thì Xuất nó ra trước.</p>
    <textarea class="saveBox" id="saveIn" placeholder="${SAVE_TAG}..."></textarea>
    <div class="row btnRow"><button class="btn ghost" id="pasteSave">Dán từ bộ nhớ tạm</button><button class="btn primary" id="doImport">Nhập và thay thế</button></div>
    <p class="intro" id="saveMsg"></p>`, () => {
    $('pasteSave').onclick = async () => { try { $('saveIn').value = await navigator.clipboard.readText(); } catch (e) { $('saveMsg').textContent = 'Trình duyệt không cho đọc bộ nhớ tạm, hãy bấm giữ vào ô rồi chọn Dán.'; } };
    $('doImport').onclick = () => {
      let ng;
      try { ng = Game.load(decodeSave($('saveIn').value)); if (!ng.s || !ng.s.souls) throw new Error('thiếu dữ liệu'); }
      catch (e) { $('saveMsg').textContent = `Không đọc được mã: ${e.message}. Hãy chép lại cho đủ, không thiếu ký tự nào.`; return; }
      if (!confirm('Thay thế thế giới hiện tại bằng bản vừa dán?')) return;
      g = ng;
      const ui = g.s.ui || {};
      speed = SPEEDS.includes(ui.speed) ? ui.speed : ui.speed > 16 ? 16 : 1;
      askMode = ASK[ui.ask] ? ui.ask : 'big';
      battleView = BATTLE_VIEW[ui.battle] ? ui.battle : 'big';
      towerView = TOWER_VIEW[ui.tower] ? ui.tower : 'all';
      paused = true;
      save();
      $('sheet').hidden = true;
      dirty = true;
    };
  });
}

// ---------- Toàn màn hình ----------
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
// iPhone không cho trang web tự bật toàn màn hình, chỉ cách cài ra Màn hình chính
const canFullscreen = () => !isStandalone() && !!(document.documentElement.requestFullscreen) && document.fullscreenEnabled !== false;
function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  } catch (e) { /* bỏ qua */ }
}
function fsInfo() {
  if (isStandalone()) return '';
  return `<p class="intro"><b>Chơi toàn màn hình:</b> mở game ở trang riêng của nó (không qua khung xem của Claude), rồi bấm nút Chia sẻ của Safari, chọn <b>Thêm vào MH chính</b>. Mở game từ biểu tượng đó là toàn màn hình, không còn thanh trên dưới.${canFullscreen() ? ' Trên Android và máy tính có thể bấm nút Toàn màn hình bên dưới.' : ''}</p>`;
}

// ---------- Vòng lặp ----------
/** Có kỳ ngộ: nhật ký chỉ hiện khi còn đủ chỗ (từ 120px), không thì ẩn hẳn để khỏi bị ép thành một khe */
function fitEv() {
  const B = document.body;
  if (!B.classList.contains('evOpen') || $('evPanel').hidden) { B.classList.remove('evTight'); return; }
  if (!B.classList.contains('evTight')) { if ($('tabbody').clientHeight < 120) B.classList.add('evTight'); return; }
  const gap = $('dock').getBoundingClientRect().top - $('evPanel').getBoundingClientRect().bottom;
  if (gap > 120 + 90) B.classList.remove('evTight'); // 90: chỗ cho hàng tab và hàng lọc
}
function frame(t) {
  const dt = Math.min(250, t - lastT);
  lastT = t;
  // kết quả còn treo (bản lưu cũ, hoặc tự quyết lúc đang diễn trận) thì đóng luôn
  const pp = g.s.pending;
  if (pp && pp.result !== undefined && !bt && !(pp.battles && pp.bi < pp.battles.length)) { g.dismiss(); dirty = true; }
  if (freshUntil && t > freshUntil) { freshUntil = 0; freshFrom = 0; dirty = true; }
  const sheetOpen = !$('sheet').hidden;
  // tốc độ cao: kỳ ngộ nhỏ tự quyết để không bị hộp câu hỏi chặn liên tục
  if (!bt && shouldAuto()) {
    g.autoResolve(wantTower);
    markFresh();
    dirty = true;
  }
  // trận tinh anh trong tháp (đánh trong lúc trôi năm): diễn lại rồi chạy tiếp
  if (!bt && g.s.replay && g.s.replay.length && !g.s.pending) {
    const r = g.s.replay.shift();
    if (g.playing && wantTower(r) && !sheetOpen) startBattle(r, false, () => {});
  }
  if (g.playing && !paused && !g.s.pending && !sheetOpen && !bt) {
    const yearMs = 1000 / speed;
    acc += dt;
    let n = 0;
    while (acc >= yearMs && n < 8) {
      acc -= yearMs;
      n++;
      g.tick();
      dirty = true;
      if (g.s.pending && shouldAuto()) { g.autoResolve(wantTower); markFresh(); }
      if (!g.playing || g.s.pending || (g.s.replay && g.s.replay.some(wantTower))) { acc = 0; break; }
    }
  } else acc = 0;
  if (g.s.alert && g.playing) {
    const a = g.s.alert;
    g.s.alert = null;
    paused = true;
    openSheet(`<h2>⚠ ${esc(a.title)}</h2><p class="intro">${esc(a.text)}</p>
      <div class="row btnRow"><button class="btn primary" id="alMaps">Đổi vùng lịch luyện</button><button class="btn ghost" id="alStay">Cứ ở lại</button></div>`, () => {
      $('alMaps').onclick = () => { openMaps(); };
      $('alStay').onclick = () => { $('sheet').hidden = true; paused = false; dirty = true; };
    });
    dirty = true;
  }
  if (dirty) render();
  if (g.s.toasts && g.s.toasts.length) showToasts();
  if (t - lastSave > 5000) save();
  fitEv();
  requestAnimationFrame(frame);
}

try {
  const th = localStorage.getItem('tkps.theme');
  if (th) document.documentElement.dataset.theme = th;
} catch (e) { /* bỏ qua */ }
// chơi không cần mạng: chỉ khi chạy từ trang riêng (có manifest), không đăng ký ở bản gộp một tệp
const STANDALONE_SITE = !!document.querySelector('link[rel="manifest"]') && (location.protocol === 'https:' || location.hostname === 'localhost');
if ('serviceWorker' in navigator && STANDALONE_SITE) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ---------- Cập nhật ----------
// So số phiên bản đang chạy với version.json trên máy chủ. Có bản mới thì hiện thanh Cập nhật.
let newVersion = null;
async function checkUpdate(manual = false) {
  if (!STANDALONE_SITE) return manual ? 'Bản trong khung Claude tự cập nhật khi có bản mới, chỉ cần tải lại trang.' : null;
  try {
    const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    const { v } = await r.json();
    if (v && v !== APP_VERSION) {
      newVersion = v;
      $('updText').textContent = `Có bản mới (${v})`;
      $('updBar').hidden = false;
      return `Có bản mới ${v}.`;
    }
    return 'Đang dùng bản mới nhất.';
  } catch (e) {
    return 'Không kiểm tra được (có thể đang mất mạng).';
  }
}
async function applyUpdate() {
  $('updBtn').disabled = true;
  $('updText').textContent = 'Đang tải bản mới...';
  save();
  try {
    if ('serviceWorker' in navigator) for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.update().catch(() => {});
    if (window.caches) for (const k of await caches.keys()) await caches.delete(k);
  } catch (e) { /* bỏ qua */ }
  location.reload();
}
$('updBtn').onclick = applyUpdate;
$('updX').onclick = () => { $('updBar').hidden = true; };
if (STANDALONE_SITE) {
  setTimeout(() => checkUpdate(), 1500);
  setInterval(() => checkUpdate(), 10 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
}
load();
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
render();
requestAnimationFrame(frame);
