// Giao diện trình duyệt. Mọi luật chơi nằm trong core.js.
import { Game, REALMS, ACTIONS, PILLS, LEGACIES, THE_MAP, THE_CHAT, TITLES, TITLE_MAP, HL_PRICE, HL_REROLL, PATHS, clamp } from './core.js';
import { STAT_NAMES, PERSONALITIES, TITLE_TIER_N, MAPS, MAP_MAP, DIFF, MATS, DEFAULT_MAP, realmLabel, subN } from './data.js';
import { drawSprite, spriteURL, botSeed } from './sprite.js';
import { SKILLS, TACTICS, WEAPON_TYPES, turnText } from './combat.js';
import { SLOTS, QUALITY, itemLine, TT_MAP, isSealed, gearStats, itemName, PLUS_MAX, AFFIX } from './items.js';
import { iconURL, itemIconOpts, armorColor, PILL_COLORS, ICON_TOKEN_RE, matIconOpts } from './icons.js';

const SAVE_KEY = 'tkps.save.v1';
const SPEEDS = [1, 2, 4, 8, 16, 32];
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
      speed = SPEEDS.includes(ui.speed) ? ui.speed : 1;
      askMode = ASK[ui.ask] ? ui.ask : ui.auto === false ? 'all' : 'big';
      battleView = BATTLE_VIEW[ui.battle] ? ui.battle : 'big';
      return;
    }
  } catch (e) {
    console.warn('Không đọc được bản lưu, tạo thế giới mới.', e);
  }
  g = Game.create();
}
function save() {
  try {
    g.s.ui = { speed, ask: askMode, battle: battleView };
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
  $('worldYear').textContent = `Năm ${fmt(g.s.year)} Thiên Nguyên`;
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
      now: t >= 30 ? [`Bạn bè thân (thân thiết từ 50, cảnh giới không thấp hơn ngươi) hộ pháp khi đột phá, mỗi người +4%, tối đa 4 người. Hiện có ${helpers} người: ${pc(helpers * 0.04)}`, `Thân thiết tăng ${pc(t / 200)} khi kết giao`]
        : t <= -30 ? ['Tu luyện +20%', 'Đột phá +6%', `Thân thiết tăng ${pc(t / 200)} khi kết giao`, t <= -50 ? 'Từ Kim Đan, tôn xưng đổi sang ma đạo (Ma Quân, Ma Tôn)' : 'Tới -50 thì từ Kim Đan tôn xưng đổi sang ma đạo']
          : ['Chưa nghiêng về bên nào, chưa có tác dụng đặc biệt', `Thân thiết tăng ${pc(t / 200)} khi kết giao`],
      up: ['Hữu tình tăng: kết giao, cứu người, chữa dịch, giải cứu dân làng, tha thứ, kết nghĩa, có đạo lữ', 'Vô tình tăng: bỏ mặc người gặp nạn, cướp của, đánh lén, học lén ma trận, chém tâm ma bằng sát niệm', 'Đạt 70 hoặc -70 mở danh hiệu riêng'],
    };
  }
  if (k === 'path' && P.path && PATHS[P.path]) {
    const pa = PATHS[P.path];
    return { n: pa.n, val: '', about: 'Con đường tu hành chọn khi lên Trúc Cơ, theo suốt kiếp này.', now: [pa.desc, `Tuyệt học: ${SKILLS[pa.skill].n}. ${SKILLS[pa.skill].desc}`], up: ['Kiếp sau lên Trúc Cơ sẽ được chọn lại'], upTitle: 'Ghi chú' };
  }
  if (k === 'money') return { n: 'Linh thạch', val: fmt(P.money), about: 'Tiền tệ của giới tu tiên.', now: ['Mua đan dược, pháp khí, bí kíp ở Tụ Bảo Lâu; đấu giá; chuộc người; cược', 'Có 5.000 mở danh hiệu Phú Giáp Nhất Phương'], up: ['Mưu sinh (tăng theo cảnh giới và cơ duyên)', 'Hộ tống thương đội, đầu tư thương hội, linh mạch, kho báu, bán đồ thừa'] };
  if (k === 'fame') return { n: 'Danh vọng', val: fmt(P.fame), about: 'Tiếng tăm trên giang hồ.', now: ['Giúp tự minh oan khi bị vu cáo', 'Đạt 50 và 200 mở danh hiệu'], up: ['Thắng trận, đột phá, cứu người, thắng lôi đài, hạ yêu vương, trừ huyết trận'] };
  if (k === 'tuvi') return { n: 'Tu vi', val: playing ? `${fmt(P.tuvi)}/${fmt(g.need())}` : '-', about: 'Công lực tích lũy ở cảnh giới hiện tại. Đầy thì có thể đột phá.', now: playing ? [`Mỗi năm tu luyện được khoảng ${fmt(g.gain())} tu vi`, `Tỉ lệ đột phá hiện tại ~${Math.round(g.breakChance() * 100)}%`] : [], up: ['Tu luyện (đủ), bế quan (x1,6), các việc khác (25-35%)', 'Linh căn, ngộ tính, tông môn (+20%), thể chất, Vô tình, thần thông'] };
  if (k === 'hp') return { n: 'Sinh lực', val: `${P.hp}/100`, about: 'Về 0 là chết.', now: [`Sức chiến đấu x${(0.5 + P.hp / 200).toFixed(2)} (sinh lực càng thấp càng yếu)`, P.hp < 30 ? 'Dưới 30: tu luyện chậm 40%' : 'Dưới 30 thì tu luyện chậm 40%', 'Vào trận với đúng lượng sinh lực đang có'], up: ['Tự hồi 4 mỗi năm (bế quan 6)', 'Hồi Xuân Đan (+40)', 'Thể chất, thần thông hồi phục'] };
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
  $('startBtn').onclick = () => { g.start(); paused = false; tab = 'log'; save(); dirty = true; };
}

function bar(label, val, max, color, text, key, ticks = 0) {
  const w = clamp((val / Math.max(1, max)) * 100, 0, 100);
  // vạch chia cảnh giới nhỏ trên thanh tu vi
  const tk = ticks > 1 ? Array.from({ length: ticks - 1 }, (_, i) => `<i class="tick" style="left:${((i + 1) * 100) / ticks}%"></i>`).join('') : '';
  return `<div class="bar" data-stat="${key}" role="button" tabindex="0"><span>${label} <i class="qm">?</i></span><div class="track"><div class="fill" style="width:${w}%;background:${color}"></div>${tk}</div><span class="num">${text}</span></div>`;
}

function renderPlay() {
  show('scr-play');
  const P = g.P;
  const life = g.lifespan();
  const sc = P.sect ? g.sect(P.sect) : null;
  drawPortrait($('portrait'), P, { life, robe: playerRobe(P), dead: g.s.phase === 'dead' });
  const ttl = P.title && TITLE_MAP[P.title] ? TITLE_MAP[P.title] : null;
  setHTML($('hudLine'), `${ttl ? `<span class="ttl t${ttl.tier} mini"><span>${esc(ttl.n)}</span></span>` : ''}<b class="hudName">${esc(P.name)}</b> <span class="realm">${esc(g.subRealmName())}</span><span class="meta"> · ${P.age} tuổi${sc ? ` · ${esc(sc.name)}` : ''}</span><span class="more">›</span>`);
  const need = g.need();
  setHTML($('bars'),
    bar('Tu vi', P.tuvi, need, 'var(--tuvi)', P.dao ? `${fmt(P.tuvi)}/${fmt(need)}` : '-', 'tuvi', subN(P.realm)) +
    bar('Sinh lực', P.hp, 100, 'var(--hp)', `${P.hp}/100`, 'hp') +
    bar('Thọ', P.age, life, 'var(--life)', `${P.age}/${life}`, 'tho'));
  const act = g.effectiveAction();
  const mp = act === 'lich_luyen' ? MAP_MAP[P.map] || MAP_MAP[DEFAULT_MAP] : null;
  const doing = P.closed > 0 ? `🕯 Bế quan, còn ${P.closed} năm`
    : act === 'lon_len' ? (P.age < 6 ? 'Còn nhỏ, cứ lớn lên đã' : 'Chưa nhập đạo, chưa thể tu luyện')
    : `${ACTIONS[act].icon} ${ACTIONS[act].n}${mp ? ` · ${DIFF[mp.d].ic} ${mp.n}` : ''}${mp && P.flags.retreated && MAP_MAP[P.mapGoal] ? ` (dưỡng thương, hồi 80 về ${MAP_MAP[P.mapGoal].n})` : ''}`;
  const nPill = P.pills.hoi_xuan || 0;
  const warn = [];
  if (P.flags.neck && P.flags.neck.realm === P.realm) warn.push(`<button class="hudWarn" data-hw="neck">⛓ Bình cảnh nhỏ · ${Math.max(0, P.flags.neck.until - P.age)} năm</button>`);
  if (g.skillMismatch().length) warn.push('<button class="hudWarn" data-hw="wep">⚠ Võ kỹ lệch binh khí</button>');
  setHTML($('hudSub'), `<span>${warn.length ? warn.join(' ') : esc(doing)}</span><span class="money">${g.s.opt.autoPill ? `<span title="Hồi Xuân Đan, tự uống khi sinh lực dưới 40" class="${nPill ? '' : 'noPill'}">💊${nPill}</span> · ` : ''}${fmt(P.money)} linh thạch</span>`);

  const canBreak = g.canBreak();
  setHTML($('breakRow'), canBreak ? '<button class="btn primary breakBtn wide" data-do="break">⚡ Tu vi viên mãn · Đột phá</button>' : '');
  setHTML($('speed'),
    `<button class="btn sp ${paused ? 'on' : ''}" data-sp="0" aria-label="Tạm dừng">${paused ? '▶' : '⏸'}</button>` +
    SPEEDS.map((s) => `<button class="btn sp ${!paused && s === speed ? 'on' : ''}" data-sp="${s}">${s}×</button>`).join('') +
    `<button class="btn sp auto ${askMode !== 'all' ? 'on' : ''}" data-do="auto" title="${esc(ASK_TIP[askMode])} Bấm để đổi.">${ASK[askMode]}</button>`);

  let html = '';
  if (P.closed > 0) {
    html = `<p class="hint">Đang bế quan, còn ${P.closed} năm. Tu vi x1,6, gần như không có kỳ ngộ.</p>
      <button class="btn ghost" data-do="openDoor">Xuất quan sớm</button>`;
  } else {
    html = Object.entries(ACTIONS).map(([id, a]) => {
      const ok = g.actionOk(id);
      const why = P.age < a.minAge ? `Từ ${a.minAge} tuổi` : a.needDao && !P.dao ? 'Cần nhập đạo' : a.desc;
      const m = id === 'lich_luyen' && ok ? MAP_MAP[P.map] || MAP_MAP[DEFAULT_MAP] : null;
      return `<button class="btn act ${P.action === id ? 'on' : ''}" data-act="${id}" data-tip="${esc(m ? `${a.desc} Đang chọn: ${m.n} (${DIFF[m.d].n}). Bấm để đổi vùng.` : why)}" ${ok ? '' : 'disabled'}><span class="ai">${a.icon}</span><span>${a.n}</span>${m ? `<small>${DIFF[m.d].ic} ${DIFF[m.d].n}</small>` : ''}</button>`;
    }).join('');
  }
  setHTML($('actions'), html);
  setHTML($('utils'), `
      <button class="btn ut" data-do="bag" data-tip="Trang bị, võ kỹ, chiến thuật, phân giải"><span class="ai">🎒</span><span>Hành trang</span></button>
      <button class="btn ut" data-do="forge" data-tip="${g.forgeOpen() ? 'Cường hóa, thăng cấp, tẩy luyện, rèn mới' : 'Mở từ 12 tuổi'}" ${g.forgeOpen() ? '' : 'disabled'}><span class="ai">⚒</span><span>Lò rèn</span></button>
      <button class="btn ut" data-do="shop" data-tip="Đan dược, pháp khí, bí kíp" ${P.age < 10 ? 'disabled' : ''}><span class="ai">🏮</span><span>Tụ Bảo</span></button>
      <button class="btn ut" data-do="close" data-tip="Tu nhanh, ít kỳ ngộ" ${P.dao && P.age >= 12 && !canBreak && !(P.closed > 0) ? '' : 'disabled'}><span class="ai">🕯</span><span>Bế quan</span></button>
      <button class="btn ut" data-do="more" data-tip="Nhân vật, danh hiệu, cài đặt"><span class="ai">⋯</span><span>Thêm</span></button>`);

  const tabs = [['log', 'Nhật ký'], ['rel', 'Quan hệ'], ['world', 'Thiên hạ'], ['rank', 'Xếp hạng'], ['lives', 'Sổ kiếp']];
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
      <canvas class="portrait" id="charPortrait" width="32" height="40"></canvas>
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
    $('eqStrip').onclick = openBag;
    $('charBag').onclick = openBag;
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
    <button class="btn" id="moMenu">☰ Cài đặt, hướng dẫn<small>Giao diện sáng tối, thế giới mới</small></button></div>`, () => {
    $('moChar').onclick = openChar;
    $('moTitles').onclick = openTitles;
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
function renderTab(t = tab) {
  if (t === 'log') {
    const all = g.s.log.slice(-160).reverse();
    const items = (logFilter === 'all' ? all : all.filter((l) => LOG_FILTER[logFilter].test(l))).slice(0, 80);
    const bar = `<div class="logFilter">${Object.entries(LOG_FILTER).map(([k, f]) => `<button class="${logFilter === k ? 'on' : ''}" data-lf="${k}">${f.n}</button>`).join('')}</div>`;
    const n = g.s.log.length;
    const fresh = performance.now() < freshUntil ? freshFrom : Infinity;
    return bar + (items.length ? '' : '<p class="empty">Chưa có dòng nào trong mục này.</p>') + `<ul class="log">${items.map((l, i) => {
      const idx = n - 1 - i;
      const cls = `${l.tone}${idx >= fresh ? ' fresh' : ''}`;
      if (l.h) return `<li class="${cls}"><span class="age">${l.a} tuổi</span><b class="evH">${esc(l.h)}</b>${l.c ? `<span class="evC">→ ${esc(l.c)}</span>` : ''}<div class="evR">${rich(l.t)}</div></li>`;
      return `<li class="${cls}"><span class="age">${l.a} tuổi</span>${rich(l.t)}</li>`;
    }).join('')}</ul>`;
  }
  if (tab === 'rel') {
    const list = g.known().sort((a, b) => Math.abs(b.r.v) - Math.abs(a.r.v) || (b.r.tag ? 1 : 0) - (a.r.tag ? 1 : 0));
    if (!list.length) return '<p class="empty">Ngươi chưa quen ai. Hãy thử Kết giao.</p>';
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
    const ch = g.s.chron.slice(-60).reverse();
    return `<h3>Tông môn</h3><div class="list">${ss || '<p class="empty">Thiên hạ không còn tông môn nào.</p>'}</div>
      <h3>Thiên hạ ký sự</h3><ul class="log">${ch.map((c) => `<li class="${c.imp >= 3 ? 'big' : ''}"><span class="age">Năm ${fmt(c.y)}</span>${esc(c.t)}</li>`).join('') || '<li class="empty">Thiên hạ thái bình.</li>'}</ul>`;
  }
  if (tab === 'rank') {
    const rk = g.ranking(20);
    return `<h3>Bảng Thiên Kiêu</h3><div class="list">${rk.map((x, i) => {
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
    }).join('')}</div>`;
  }
  if (tab === 'lives') return titleCodex() + codex() + '<h3>Các kiếp đã qua</h3>' + livesList();
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
  if (fighting && !bt) startBattle(p);
  $('battle').hidden = !bt;
  const ask = !!(v && !v.done);
  const showCard = ask && !bt;
  $('evPanel').hidden = !showCard;
  document.body.classList.toggle('evOpen', showCard || !!bt);
  if (!showCard) return;
  const P = g.P;
  const mp = g.curMap();
  setHTML($('evKicker'), `Kỳ ngộ · ${P ? P.age : ''} tuổi${mp ? ` · ${DIFF[mp.d].ic} ${esc(mp.n)}` : ''}`);
  $('evTitle').textContent = v.title;
  setHTML($('evText'), rich(v.text));
  setHTML($('evChoices'), v.choices.map((c, i) => `<button class="btn" data-ch="${i}"><span class="chNo">${i + 1}</span>${esc(c)}</button>`).join(''));
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
  if (g.playing && g.P.hp < 25 && g.P.hp < hp0) g.toast(`Sinh lực chỉ còn ${g.P.hp}/100.`, 'Trọng thương', 0);
  markFresh();
  save();
  dirty = true;
}
function wantBattle(res) {
  if (battleView === 'off') return false;
  if (!paused && speed >= AUTO_SPEED) return false;
  return battleView === 'all' || res.big || res.died;
}
$('evChoices').addEventListener('click', (e) => { const b = e.target.closest('[data-ch]'); if (b) pickChoice(+b.dataset.ch); });
// dòng nhật ký mới sáng lên một lúc
let freshFrom = 0, freshUntil = 0;
function markFresh() { freshFrom = Math.min(freshFrom || Infinity, g.s.log.length - 1); freshUntil = performance.now() + 2600; }

/** Chữ có mã biểu tượng: thoát HTML rồi thay mã bằng ảnh */
function rich(t) {
  return esc(t).replace(ICON_TOKEN_RE, (m, kind, q, col) => `<img class="ico inl q${q}" alt="" src="${iconURL({ kind, q: +q, col: col === '-' ? null : col })}">`);
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
function startBattle(p) {
  const res = p.battles[p.bi];
  bt = { res, i: 0, timer: null, closeT: null, fast: btFast, done: false };
  $('battle').hidden = false;
  $('btTitle').textContent = `${res.a.name} ⚔ ${res.b.name}`;
  for (const [side, f] of [['A', res.a], ['B', res.b]]) {
    const box = $('f' + side);
    box.querySelectorAll('.float').forEach((x) => x.remove());
    box.classList.remove('lunge', 'hit', 'down');
    drawSprite(box.querySelector('canvas'), lookOf(f.look));
    box.querySelector('.fname').textContent = f.name;
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
  bt.timer = setTimeout(stepBattle, 500);
}
function applySnap(t) {
  const r = bt.res;
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
    $('btBanner').textContent = t.skillN;
    $('btBanner').className = 'banner show ' + (big ? 'big ' : '') + (t.side === 'a' ? 'left' : 'right');
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
  bt.timer = setTimeout(stepBattle, bt.fast ? 420 : 900);
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
  bt.closeT = setTimeout(closeBattle, bt.fast ? 900 : 1600);
}
function closeBattle() {
  if (!bt) return;
  clearTimeout(bt.timer);
  clearTimeout(bt.closeT);
  $('battle').hidden = true;
  bt = null;
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
  return `<div class="item withIco">${itemIco(it)}<div class="body"><div class="row"><b class="${qCls(it.q)}">${esc(itemName(it))}</b><span class="meta">${QUALITY[it.q].n} · ${SLOTS[it.slot]}${wt} · ${REALMS[it.lv].n}</span></div>
    <div class="meta">${esc(itemLine(it))}</div>${sealLine(it)}${ttLine(it)}${btns ? `<div class="row btnRow">${btns}</div>` : ''}</div></div>`;
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
function shopGear() {
  const P = g.P;
  const st = g.shopStock();
  const bought = P.shopBought || [];
  const gear = st.gear.map((it) => itemCard(it, bought.includes(it.key)
    ? '<span class="meta">Đã bán hết</span>'
    : `<button class="btn ghost" data-bg="${it.key}" ${P.money < it.price ? 'disabled' : ''}>Mua · ${fmt(it.price)}</button>${g.betterThanEquipped(it) ? '<span class="tag pos">Tốt hơn đồ đang mang</span>' : ''}`)).join('');
  const books = st.books.map((b) => {
    const sk = SKILLS[b.id];
    const has = P.skills.includes(b.id);
    return `<div class="item withIco">${icoImg({ kind: 'bi_kip', q: sk.tier })}<div class="body"><div class="row"><b>Bí kíp: ${esc(sk.n)}</b><span class="meta">Linh lực ${sk.mp}</span></div><div class="meta">${esc(sk.desc)}</div>
      <div class="row btnRow">${has ? '<span class="meta">Đã học</span>' : `<button class="btn ghost" data-bk="${b.id}" ${P.money < b.price ? 'disabled' : ''}>Mua · ${fmt(b.price)}</button>`}</div></div></div>`;
  }).join('');
  return `<h3>Pháp khí · đổi hàng mỗi 5 năm</h3><div class="list">${gear}</div><h3>Bí kíp võ kỹ</h3><div class="list">${books}</div>`;
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
  const m = b.map && MAP_MAP[b.map];
  const tt = b.gq >= 4 && b.tt && TT_MAP[b.tt] ? ` · <span class="ttName">✦ thần khí 「${esc(TT_MAP[b.tt].n)}」</span>` : '';
  return m || tt ? `<div class="meta">${m ? `⛰ Đang lịch luyện ở ${esc(m.n)} <span class="diff d${m.d}">${DIFF[m.d].n}</span>` : ''}${tt}</div>` : '';
}
/** Nút bật tắt tự uống, tự mua Hồi Xuân Đan */
function pillOpts() {
  const o = g.s.opt;
  return `<div class="row btnRow"><button class="btn ${o.autoPill ? 'on' : 'ghost'}" data-opt="autoPill">💊 Tự uống Hồi Xuân Đan khi sinh lực dưới 40: ${o.autoPill ? 'bật' : 'tắt'}</button>
    <button class="btn ${o.autoBuyPill ? 'on' : 'ghost'}" data-opt="autoBuyPill" ${o.autoPill ? '' : 'disabled'}>Hết đan thì tự mua (${fmt(g.pillPrice('hoi_xuan'))}/viên): ${o.autoBuyPill ? 'bật' : 'tắt'}</button></div>`;
}
function bindPillOpts(redraw) {
  $('sheetBody').querySelectorAll('[data-opt]').forEach((b) => { b.onclick = () => { g.s.opt[b.dataset.opt] = !g.s.opt[b.dataset.opt]; save(); dirty = true; redraw(); }; });
}
const oddsCls = (p) => (p >= 0.8 ? 'o0' : p >= 0.55 ? 'o1' : p >= 0.3 ? 'o2' : p >= 0.12 ? 'o3' : 'o4');

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
    const cards = MAPS.map((m) => {
      const p = g.mapOdds(m.id);
      const risk = g.mapRisk(m.id);
      return `<button class="mapCard d${m.d} ${cur === m.id ? 'on' : ''}" data-map="${m.id}">
        <div class="row"><b>${esc(m.n)}</b><span class="diff d${m.d}">${DIFF[m.d].ic} ${DIFF[m.d].n}</span></div>
        <div class="meta">${esc(m.desc)}</div>
        <div class="meta">Yêu thú x${String(m.pow).replace('.', ',')} · Thu hoạch x${String(m.loot).replace('.', ',')} · ${m.myth ? `Thần thoại ${String(m.myth * 100).replace('.', ',')}%/món` : 'Không có đồ Thần thoại'}</div>
        <div class="meta">Nguyên liệu: ${matIco(m.mat)} ${MATS[m.mat].n}${m.haz ? ' · Có tai họa thiên nhiên' : ''}</div>
        <div class="odds ${oddsCls(p)}">Với sức ngươi lúc này: thắng ~${Math.round(p * 100)}%${p < 0.8 ? ` · thua thì nguy hiểm tính mạng ~${Math.round(risk * 100)}%` : ''}</div>
        ${(() => { const bs = g.botsIn(m.id); if (!bs.length) return '<div class="meta">Không có tu sĩ nào khác ở đây.</div>'; const known = bs.filter((b) => g.s.rel[b.id] && g.s.rel[b.id].met); return `<div class="meta">${bs.length} tu sĩ khác đang lịch luyện ở đây${known.length ? `, có người quen: ${known.slice(0, 3).map((b) => esc(b.name)).join(', ')}` : ''}.</div>`; })()}
        ${cur === m.id ? '<div class="meta"><b>Đang lịch luyện ở đây</b></div>' : ''}
      </button>`;
    }).join('');
    openSheet(`<h2>Chọn vùng lịch luyện</h2>
      <p class="intro">Các tu sĩ khác cũng tự chọn vùng theo sức mình và tính cách: kẻ liều lĩnh vào vùng khó, người cẩn trọng ở vùng dễ. Cùng vùng thì dễ chạm mặt nhau hơn, và hạ được kẻ mang thần khí thì có thể đoạt lấy.</p>
      <p class="intro">Độ khó luôn tính theo cảnh giới hiện tại của ngươi: yêu thú cùng cảnh giới nhưng mạnh hơn theo độ khó, đồ rơi ra hợp với cảnh giới của ngươi. Đồ Thần thoại chỉ xuất hiện từ vùng Khó trở lên. Tỉ lệ thắng tính theo trang bị, võ kỹ và sinh lực hiện tại (${P.hp}/100).</p>
      <div class="row btnRow"><button class="btn ${g.s.opt.retreat ? 'on' : 'ghost'}" data-retreat="1">Tự lui khi sinh lực dưới 40, hồi lên 80 tự quay lại: ${g.s.opt.retreat ? 'bật' : 'tắt'}</button></div>
      ${pillOpts()}
      <p class="intro">Còn ${P.pills.hoi_xuan || 0} viên Hồi Xuân Đan. Đan được uống trước khi xét tự lui, nên còn đan thì ngươi ở lại vùng đã chọn.</p>
      ${P.flags.retreated && MAP_MAP[P.mapGoal] ? `<p class="intro"><b>Đang tạm lui</b> về ${MAP_MAP[DEFAULT_MAP].n} dưỡng thương (sinh lực ${P.hp}/100). Hồi lên 80 sẽ quay lại ${esc(MAP_MAP[P.mapGoal].n)}. Uống Hồi Xuân Đan để quay lại sớm, hoặc tắt tự lui để ở lại mặc kệ nguy hiểm.</p>` : ''}
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
function openForge() {
  const draw = (msg = '') => {
    const P = g.P;
    const all = [...Object.values(P.eq).filter(Boolean).map((it) => ({ it, on: true })), ...P.bag.map((it) => ({ it, on: false }))];
    const mark = (x) => (x.on ? '<span class="tag gold">Đang mang</span>' : '');
    let body = '';
    if (forgeTab === 'cuong') {
      body = `<p class="intro">Mỗi cấp +8% công, thủ, sinh lực, tối đa +${PLUS_MAX}. Từ +5 có thể thất bại. Lên +8 trở lên mà thất bại thì tụt một cấp. Không bao giờ vỡ đồ.</p>` +
        all.map((x) => {
          const it = x.it;
          if ((it.plus || 0) >= PLUS_MAX) return itemCard(it, `${mark(x)}<span class="meta">Đã cường hóa tối đa</span>`);
          const c = g.enhanceCost(it);
          const p = g.enhanceChance(it);
          return itemCard(it, `${mark(x)}<button class="btn ghost" data-enh="${it.id}" ${g.canPay(c) ? '' : 'disabled'}>Cường hóa lên +${(it.plus || 0) + 1} · ~${Math.round(p * 100)}%</button><div class="cost">${costText(c)}</div>`);
        }).join('');
    } else if (forgeTab === 'thang') {
      const list = all.filter((x) => x.it.lv < P.realm);
      body = `<p class="intro">Kéo món đồ lên cấp ${REALMS[P.realm].n}. Giữ nguyên phẩm, cường hóa, các dòng và thần thông.</p>` +
        (list.map((x) => { const c = g.upgradeCost(x.it); return itemCard(x.it, `${mark(x)}<button class="btn ghost" data-up="${x.it.id}" ${g.canPay(c) ? '' : 'disabled'}>Thăng lên ${REALMS[P.realm].n}</button><div class="cost">${costText(c)}</div>`); }).join('') || '<p class="empty">Không có món nào thấp hơn cảnh giới hiện tại.</p>');
    } else if (forgeTab === 'tay') {
      const list = all.filter((x) => x.it.q >= 2 && x.it.affix && x.it.affix.length);
      body = `<p class="intro">Đổi một dòng thuộc tính của đồ Thượng phẩm trở lên. Tẩy ngẫu nhiên tốn Linh tinh. Thêm 2 dẫn liệu thì chắc chắn ra dòng của dẫn liệu đó.</p>` +
        (list.map((x) => {
          const it = x.it;
          const rows = it.affix.map((k, i) => {
            const a = AFFIX.find((y) => y.k === k);
            const c = g.rerollCost(it);
            const cats = Object.keys(MATS).filter((m) => MATS[m].aff && MATS[m].aff !== k && !it.affix.includes(MATS[m].aff) && (P.mats[m] || 0) > 0);
            return `<div class="affRow"><span>${esc(a.t)}</span><button class="btn ghost" data-rr="${it.id}:${i}" ${g.canPay(c) ? '' : 'disabled'}>Tẩy ngẫu nhiên</button>${cats.map((m) => { const c2 = g.rerollCost(it, m); const t = AFFIX.find((y) => y.k === MATS[m].aff).t; return `<button class="btn ghost" data-rr="${it.id}:${i}:${m}" ${g.canPay(c2) ? '' : 'disabled'}>→ ${esc(t)} (${MATS[m].n} x2)</button>`; }).join('')}</div>`;
          }).join('');
          return itemCard(it, `${mark(x)}<div class="cost">${costText(g.rerollCost(it))} mỗi lần</div>${rows}`);
        }).join('') || '<p class="empty">Chưa có món Thượng phẩm trở lên.</p>');
    } else {
      const S = forgeSel;
      const cats = Object.keys(MATS).filter((m) => MATS[m].aff);
      const c = g.forgeCost(S.myth, S.cat || null);
      body = `<p class="intro">Rèn một món mới cấp ${REALMS[P.realm].n}. Phẩm gieo ngẫu nhiên nhưng dễ ra Thượng, Cực phẩm hơn đồ rơi, tay nghề càng cao càng tốt. Rèn thần khí cần 3 Thần hồn: ~${Math.round(g.forgeMythChance() * 100)}% ra Thần thoại, còn lại chắc chắn Cực phẩm.</p>
        <h3>Loại đồ</h3><div class="opts">${Object.entries(SLOTS).map(([k, n]) => `<button class="btn ${S.slot === k ? 'on' : 'ghost'}" data-fs="${k}">${n}</button>`).join('')}</div>
        ${S.slot === 'vu_khi' ? `<div class="opts">${Object.entries(WEAPON_TYPES).filter(([k]) => k !== 'tay').map(([k, w]) => `<button class="btn ${S.wt === k ? 'on' : 'ghost'}" data-fw="${k}">${w.n}</button>`).join('')}</div>` : ''}
        <h3>Dẫn liệu (tùy chọn)</h3><div class="opts wide2"><button class="btn ${!S.cat ? 'on' : 'ghost'}" data-fc="">Không</button>${cats.map((m) => `<button class="btn ${S.cat === m ? 'on' : 'ghost'}" data-fc="${m}">${matIco(m)} ${MATS[m].n} → ${esc(AFFIX.find((y) => y.k === MATS[m].aff).t)}</button>`).join('')}</div>
        <h3>Lò</h3><div class="opts"><button class="btn ${!S.myth ? 'on' : 'ghost'}" data-fm="0">Lò thường</button><button class="btn ${S.myth ? 'on' : 'ghost'}" data-fm="1">Lò thần khí (3 Thần hồn)</button></div>
        <div class="cost">${costText(c)}</div>
        <button class="btn primary wide" data-forge="1" ${g.canPay(c) ? '' : 'disabled'}>⚒ Rèn</button>`;
    }
    const tabs = [['cuong', 'Cường hóa'], ['thang', 'Thăng cấp'], ['tay', 'Tẩy luyện'], ['moi', 'Rèn mới']];
    openSheet(`<h2>Lò rèn</h2>
      <p class="intro">Tay nghề rèn: <b>${P.forge || 0}/100</b> (+${Math.round(g.forgeBonus() * 100)}% tỉ lệ thành công)${P.path === 'the' ? ', Thể tu được cộng thêm' : ''}. Linh thạch: <b>${fmt(P.money)}</b>.</p>
      ${matChips(P)}
      <div class="row btnRow"><button class="btn ghost" data-iron="1" ${P.money >= g.ironPrice() ? '' : 'disabled'}>Mua ${10 * (1 + P.realm)} Tinh thiết · ${fmt(g.ironPrice())}</button></div>
      ${msg ? `<p class="forgeMsg">${rich(msg)}</p>` : ''}
      <div class="ftabs">${tabs.map(([k, n]) => `<button class="btn ${forgeTab === k ? 'on' : 'ghost'}" data-ft="${k}">${n}</button>`).join('')}</div>
      <div class="list">${body}</div>`, () => {
      const q = (sel, fn) => $('sheetBody').querySelectorAll(sel).forEach((b) => { b.onclick = () => { const m = fn(b); save(); draw(typeof m === 'string' ? m : ''); dirty = true; }; });
      q('[data-ft]', (b) => { forgeTab = b.dataset.ft; });
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
  if ((it.plus || 0) < PLUS_MAX) {
    const c = g.enhanceCost(it);
    const p = g.enhanceChance(it);
    h += `<button class="btn ghost" data-enh="${it.id}" ${g.canPay(c) ? '' : 'disabled'}>⚒ +${(it.plus || 0) + 1} · ${Math.round(p * 100)}%</button>`;
    h += `<div class="cost">Cường hóa: ${costText(c)}</div>`;
  }
  if (it.lv < P.realm) {
    const c = g.upgradeCost(it);
    h += `<button class="btn ghost" data-up="${it.id}" ${g.canPay(c) ? '' : 'disabled'}>⬆ Thăng lên ${REALMS[P.realm].n}</button><div class="cost">Thăng cấp: ${costText(c)}</div>`;
  }
  return h;
}
function openBag() {
  const draw = (msg = '') => {
    const P = g.P;
    const F = g.playerFighter();
    const forgeTip = g.forgeOpen() ? 'rèn ở ⚒ Lò rèn' : 'Lò rèn mở từ 12 tuổi';
    const eq = Object.keys(SLOTS).map((sl) => {
      const it = P.eq[sl];
      if (it) return itemCard(it, `<button class="btn ghost" data-un="${sl}">Tháo</button>${forgeBtns(it)}`);
      const inBag = P.bag.some((x) => x.slot === sl);
      return `<div class="item withIco">${icoImg({ kind: SLOT_KIND[sl], faded: true }, 'empty')}<div class="body"><b class="meta">${SLOTS[sl]}: trống</b>
        <div class="meta">${inBag ? 'Trong túi có đồ cho ô này.' : `Mua ở 🏮 Tụ Bảo Lâu, ${forgeTip}, hoặc lịch luyện vùng khó để nhặt.`}</div>
        <div class="row btnRow">${inBag ? `<button class="btn ghost" data-best="1">Mang món tốt nhất</button>` : ''}${g.forgeOpen() ? `<button class="btn ghost" data-goforge="${sl}">⚒ Rèn ${SLOTS[sl].toLowerCase()}</button>` : ''}</div></div></div>`;
    }).join('');
    const bag = P.bag.slice().sort((a, b) => (a.slot > b.slot ? 1 : a.slot < b.slot ? -1 : b.val - a.val)).map((it) => itemCard(it,
      `<button class="btn ghost" data-eq="${it.id}">Mang</button><button class="btn ghost" data-sell="${it.id}">Bán · ${fmt(it.val)}</button><button class="btn ghost" data-salv="${it.id}" title="${esc(stripTok(g.matText(g.salvageYield(it))))}">Phân giải</button>${g.betterThanEquipped(it) ? '<span class="tag pos">Tốt hơn</span>' : ''}${forgeBtns(it)}`)).join('');
    const wep = P.eq.vu_khi ? P.eq.vu_khi.wt : null;
    const sks = P.skills.map((id) => {
      const sk = SKILLS[id];
      const on = P.loadout.includes(id);
      let fit = '';
      if (sk.wep && sk.wep !== wep) {
        const alt = P.bag.filter((x) => x.slot === 'vu_khi' && x.wt === sk.wep).sort((a, b) => g.effScore(b) - g.effScore(a))[0];
        fit = `<span class="tag neg">Cần ${WEAPON_TYPES[sk.wep].n.toLowerCase()}, đang yếu 40%</span>` +
          (alt ? `<button class="btn ghost" data-eq="${alt.id}">Cầm ${esc(itemName(alt))}</button>` : g.forgeOpen() ? `<button class="btn ghost" data-goforge="vu_khi:${sk.wep}">⚒ Rèn ${WEAPON_TYPES[sk.wep].n.toLowerCase()}</button>` : '');
      }
      return `<div class="item"><div class="row"><b>${esc(sk.n)}</b><span class="meta">${sk.mp ? `Linh lực ${sk.mp}` : 'Không tốn linh lực'}</span></div><div class="meta">${esc(sk.desc)}</div>
        <div class="row btnRow"><button class="btn ${on ? 'on' : 'ghost'}" data-sk="${id}">${on ? 'Đang mang theo' : 'Mang theo'}</button>${fit}</div></div>`;
    }).join('');
    const canBest = ['vu_khi', 'ao', 'phu_kien'].some((sl) => P.bag.some((x) => x.slot === sl && g.effScore(x) > g.effScore(P.eq[sl])));
    openSheet(`<h2>Hành trang</h2>
      <div class="cstats"><span>Công <b>${fmt(F.atk)}</b></span><span>Thủ <b>${fmt(F.def)}</b></span><span>Sinh lực <b>${fmt(F.maxHp)}</b></span><span>Bạo kích <b>${Math.round(F.crit * 100)}%</b></span><span>Né <b>${Math.round(F.dodge * 100)}%</b></span></div>
      ${(() => { const ids = [...new Set(Object.values(P.eq).filter((x) => x && x.tt && !isSealed(x, P.realm)).map((x) => x.tt))]; return ids.length ? `<div class="ttActive">Thần thông đang phát huy: ${ids.map((id) => `<span class="ttName">✦ ${esc(TT_MAP[id].n)}</span>`).join(' ')}</div>` : ''; })()}
      ${msg ? `<p class="forgeMsg">${rich(msg)}</p>` : ''}
      ${matChips(P)}
      <div class="row btnRow"><button class="btn ${canBest ? 'primary' : 'ghost'}" data-best="1" ${canBest ? '' : 'disabled'}>✨ Mặc đồ tốt nhất</button>
        <button class="btn ${g.s.opt.autoEquip ? 'on' : 'ghost'}" data-autoeq="1">Nhặt được đồ tốt hơn thì tự mặc: ${g.s.opt.autoEquip ? 'bật' : 'tắt'}</button></div>
      <h3>Đang mang</h3><div class="list">${eq}</div>
      <h3>Võ kỹ · mang theo ${P.loadout.length}/4</h3><div class="list">${sks}</div>
      <h3>Chiến thuật</h3><div class="tactics">${Object.entries(TACTICS).map(([k, t]) => `<button class="btn ${P.tactic === k ? 'on' : ''}" data-tc="${k}">${t.n}<small>${t.desc}</small></button>`).join('')}</div>
      <h3>Túi đồ · ${P.bag.length}/16</h3>
      <div class="row btnRow"><button class="btn ghost" data-salvall="1" ${P.bag.some((x) => x.q <= 1) ? '' : 'disabled'}>Phân giải hết Hạ, Trung phẩm</button>
        <button class="btn ${g.s.opt.autoSalvage ? 'on' : 'ghost'}" data-autosalv="1">Túi đầy: ${g.s.opt.autoSalvage ? 'tự phân giải' : 'tự bán'}</button></div>
      <div class="list">${bag || '<p class="empty">Túi trống. Đồ rơi từ yêu thú, hang động, bí cảnh, đối thủ, hoặc mua ở Tụ Bảo Lâu.</p>'}</div>`, () => {
      const q = (sel, fn) => $('sheetBody').querySelectorAll(sel).forEach((b) => { b.onclick = () => { const m = fn(b); save(); dirty = true; draw(typeof m === 'string' ? m : ''); }; });
      q('[data-un]', (b) => g.unequip(b.dataset.un));
      q('[data-eq]', (b) => g.equip(+b.dataset.eq));
      q('[data-sell]', (b) => `Bán được ${g.sell(+b.dataset.sell)} linh thạch.`);
      q('[data-salv]', (b) => `Phân giải được: ${g.salvage(+b.dataset.salv)}.`);
      q('[data-salvall]', () => g.salvageAll(1));
      q('[data-autosalv]', () => { g.s.opt.autoSalvage = !g.s.opt.autoSalvage; });
      q('[data-autoeq]', () => { g.s.opt.autoEquip = !g.s.opt.autoEquip; });
      q('[data-best]', () => { const n = g.equipBest(); return n ? `Đã thay ${n} món tốt hơn.` : 'Đồ đang mang đã là tốt nhất.'; });
      q('[data-enh]', (b) => g.enhance(+b.dataset.enh) || 'Không đủ nguyên liệu.');
      q('[data-up]', (b) => g.upgrade(+b.dataset.up) || 'Không đủ nguyên liệu.');
      q('[data-sk]', (b) => g.toggleSkill(b.dataset.sk));
      q('[data-tc]', (b) => g.setTactic(b.dataset.tc));
      $('sheetBody').querySelectorAll('[data-goforge]').forEach((b) => { b.onclick = () => { const [sl, wt] = b.dataset.goforge.split(':'); forgeTab = 'moi'; forgeSel.slot = sl; if (wt) forgeSel.wt = wt; openForge(); }; });
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
      <p class="intro">Giang hồ xưng tụng theo việc ngươi làm trong kiếp này. Đeo một danh hiệu để nhận lợi ích, danh hiệu sẽ hiện phía trên tên. Kiếp sau phải làm lại từ đầu.</p>
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
    ? `<div class="meta">${esc(t.head || 'Tin mới')}</div><div class="toastMsg">${rich(t.msg)}</div>`
    : `<div class="meta">Danh hiệu mới</div><div class="ttl t${t.tier} big"><span>${esc(t.n)}</span></div><div class="meta">Khi đeo: ${esc(t.bonus)}</div>`;
  el.hidden = false;
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.hidden = true; toastBusy = false; }, 400); }, 2600);
}

function openShop() {
  const draw = () => {
    const P = g.P;
    openSheet(`<h2>Tụ Bảo Lâu</h2><p class="intro">Linh thạch: <b>${fmt(P.money)}</b>. Giá tăng theo cảnh giới.</p>
      <div class="list">${Object.entries(PILLS).map(([id, p]) => {
        const price = g.pillPrice(id);
        const n = P.pills[id] || 0;
        return `<div class="item withIco">${icoImg({ kind: 'dan', q: id === 'dien_tho' ? 2 : 0, col: PILL_COLORS[id] })}<div class="body"><div class="row"><b>${p.n}</b><span class="meta">Có ${n}</span></div><div class="meta">${p.desc}</div>
          <div class="row btnRow"><button class="btn ghost" data-buy="${id}" ${P.money < price ? 'disabled' : ''}>Mua · ${fmt(price)}</button>
          ${id !== 'pha_canh' ? `<button class="btn ghost" data-use="${id}" ${n ? '' : 'disabled'}>Dùng</button>` : '<span class="meta">Dùng khi đột phá</span>'}</div></div></div>`;
      }).join('')}</div>
      ${pillOpts()}
      ${shopGear()}
      <p class="intro" id="shopMsg"></p>`, () => {
      bindPillOpts(draw);
      $('sheetBody').querySelectorAll('[data-buy]').forEach((b) => { b.onclick = () => { g.buy(b.dataset.buy); save(); draw(); }; });
      $('sheetBody').querySelectorAll('[data-bg]').forEach((b) => { b.onclick = () => { const m = g.buyGear(b.dataset.bg); save(); draw(); if (m) $('shopMsg').textContent = m; }; });
      $('sheetBody').querySelectorAll('[data-bk]').forEach((b) => { b.onclick = () => { const m = g.buyBook(b.dataset.bk); save(); draw(); if (m) $('shopMsg').textContent = m; }; });
      $('sheetBody').querySelectorAll('[data-use]').forEach((b) => {
        b.onclick = () => { const m = g.usePill(b.dataset.use); save(); draw(); if (m) $('shopMsg').textContent = m; };
      });
    });
  };
  draw();
}
function openClose() {
  openSheet(`<h2>Bế quan</h2><p class="intro">Phong bế động phủ, tu vi tăng gấp 1,6 lần, gần như không gặp kỳ ngộ. Thời gian trôi nhanh gấp ba. Có chút rủi ro tẩu hỏa. Tu vi viên mãn thì tự xuất quan.</p>
    <div class="list">${[5, 10, 20, 50].map((y) => `<button class="btn" data-y="${y}">Bế quan ${y} năm</button>`).join('')}</div>`, () => {
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
    <h3>Xem diễn lại trận đấu</h3>
    <div class="opts">${Object.entries(BATTLE_VIEW).map(([k, n]) => `<button class="btn ${battleView === k ? 'on' : 'ghost'}" data-bv="${k}">${n}</button>`).join('')}</div>
    <p class="intro">Chỉ trận lớn: trận có thể mất mạng (yêu thú vùng khó, kẻ thù, ma tu...). Từ ${AUTO_SPEED}× luôn bỏ qua. Kết quả trận nào cũng ghi vào nhật ký.</p>
    ${fsInfo()}
    <h3>Bản lưu</h3>
    <p class="intro">Chuyển thế giới đang chơi sang trang khác hoặc máy khác: Xuất ra một đoạn mã rồi Nhập ở bên kia.</p>
    <div class="row btnRow"><button class="btn ghost" id="exportBtn">📤 Xuất bản lưu</button><button class="btn ghost" id="importBtn">📥 Nhập bản lưu</button></div>
    <div class="list">${canFullscreen() ? `<button class="btn" id="fsBtn">${document.fullscreenElement ? 'Thoát toàn màn hình' : '⛶ Toàn màn hình'}</button>` : ''}<button class="btn" id="themeBtn">Đổi giao diện sáng / tối</button><button class="btn" id="newWorld">Tạo thế giới mới (xóa bản lưu)</button></div>`, () => {
    $('exportBtn').onclick = openExport;
    $('importBtn').onclick = openImport;
    if ($('fsBtn')) $('fsBtn').onclick = () => { toggleFullscreen(); $('sheet').hidden = true; };
    $('sheetBody').querySelectorAll('[data-bv]').forEach((b) => { b.onclick = () => { battleView = b.dataset.bv; save(); $('menuBtn').onclick(); }; });
    $('themeBtn').onclick = () => {
      const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const nx = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nx;
      try { localStorage.setItem('tkps.theme', nx); } catch (e) { /* bỏ qua */ }
    };
    $('newWorld').onclick = (e) => {
      const btn = e.currentTarget;
      if (!btn.dataset.armed) {
        btn.dataset.armed = '1';
        btn.textContent = 'Bấm lần nữa để xóa thế giới hiện tại';
        return;
      }
      g = Game.create();
      save();
      $('sheet').hidden = true;
      dirty = true;
    };
  });
};

// Chạm chỉ số để xem giải thích. Dùng pointerdown vì chỉ số được vẽ lại liên tục khi thời gian trôi.
let statTap = null;
for (const id of ['bars', 'scr-birth', 'sheetBody']) {
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
    if (shouldAuto()) { g.autoResolve(); markFresh(); }
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
  if (b.dataset.act === 'lich_luyen') openMaps();
  else if (b.dataset.act) { g.setAction(b.dataset.act); save(); }
  else if (b.dataset.do === 'forge') openForge();
  else if (b.dataset.do === 'shop') openShop();
  else if (b.dataset.do === 'bag') openBag();
  else if (b.dataset.do === 'titles') openTitles();
  else if (b.dataset.do === 'close') openClose();
  else if (b.dataset.do === 'openDoor') { g.P.closed = 0; g.log('Ngươi xuất quan sớm.', 'muted'); }
  dirty = true;
}
$('actions').addEventListener('click', dockClick);
$('utils').addEventListener('click', dockClick);
$('tabbody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lf]');
  if (b) { logFilter = b.dataset.lf; dirty = true; }
});
$('hudSub').addEventListener('click', (e) => {
  const b = e.target.closest('[data-hw]');
  if (!b) return;
  if (b.dataset.hw === 'wep') openBag();
  else openSheet(`<h2>⛓ Bình cảnh nhỏ</h2><p class="intro">Tu vi đang kẹt ở ${esc(g.subRealmName())}. Còn khoảng ${Math.max(0, g.P.flags.neck.until - g.P.age)} năm sẽ tự thông. Uống Tĩnh Tâm Đan (Tụ Bảo Lâu) để phá ngay. Ngộ tính cao thì dễ bỗng ngộ ra sớm.</p>
    <div class="row btnRow"><button class="btn primary" id="neckPill" ${(g.P.pills.tinh_tam || 0) > 0 ? '' : 'disabled'}>Uống Tĩnh Tâm Đan (có ${g.P.pills.tinh_tam || 0})</button><button class="btn ghost" id="neckShop">🏮 Tụ Bảo Lâu</button></div>`, () => {
    $('neckPill').onclick = () => { g.usePill('tinh_tam'); save(); $('sheet').hidden = true; dirty = true; };
    $('neckShop').onclick = openShop;
  });
});
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
      speed = SPEEDS.includes(ui.speed) ? ui.speed : 1;
      askMode = ASK[ui.ask] ? ui.ask : 'big';
      battleView = BATTLE_VIEW[ui.battle] ? ui.battle : 'big';
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
    g.autoResolve();
    markFresh();
    dirty = true;
  }
  if (g.playing && !paused && !g.s.pending && !sheetOpen) {
    const yearMs = 1000 / speed / (g.P.closed > 0 ? 3 : 1);
    acc += dt;
    let n = 0;
    while (acc >= yearMs && n < 8) {
      acc -= yearMs;
      n++;
      g.tick();
      dirty = true;
      if (g.s.pending && shouldAuto()) { g.autoResolve(); markFresh(); }
      if (!g.playing || g.s.pending) { acc = 0; break; }
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
  requestAnimationFrame(frame);
}

try {
  const th = localStorage.getItem('tkps.theme');
  if (th) document.documentElement.dataset.theme = th;
} catch (e) { /* bỏ qua */ }
// chơi không cần mạng: chỉ khi chạy từ trang riêng (có manifest), không đăng ký ở bản gộp một tệp
if ('serviceWorker' in navigator && document.querySelector('link[rel="manifest"]') && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
load();
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
render();
requestAnimationFrame(frame);
