// Giao diện trình duyệt. Mọi luật chơi nằm trong core.js.
import { Game, REALMS, ACTIONS, PILLS, LEGACIES, THE_MAP, THE_CHAT, TITLES, TITLE_MAP, HL_PRICE, HL_REROLL, PATHS, clamp } from './core.js';
import { STAT_NAMES, PERSONALITIES, TITLE_TIER_N } from './data.js';
import { drawSprite, spriteURL, botSeed } from './sprite.js';
import { SKILLS, TACTICS, WEAPON_TYPES, turnText } from './combat.js';
import { SLOTS, QUALITY, itemLine, TT_MAP, isSealed, gearStats } from './items.js';
import { iconURL, itemIconOpts, armorColor, PILL_COLORS, ICON_TOKEN_RE } from './icons.js';

const SAVE_KEY = 'tkps.save.v1';
const SPEEDS = [1, 2, 4, 8, 16, 32];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => Math.floor(n).toLocaleString('vi-VN');

let g = null;
let speed = 1;
let paused = false;
let autoOn = true; // tự quyết việc nhỏ từ 8×
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
      autoOn = ui.auto !== false;
      return;
    }
  } catch (e) {
    console.warn('Không đọc được bản lưu, tạo thế giới mới.', e);
  }
  g = Game.create();
}
function save() {
  try {
    g.s.ui = { speed, auto: autoOn };
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
}
function render() {
  $('worldYear').textContent = `Năm ${fmt(g.s.year)} Thiên Nguyên`;
  const ph = g.s.phase;
  if (ph === 'birth') renderBirth();
  else if (ph === 'play' || (ph === 'dead' && g.s.pending)) renderPlay();
  else renderDead();
  renderModal();
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

function bar(label, val, max, color, text, key) {
  const w = clamp((val / Math.max(1, max)) * 100, 0, 100);
  return `<div class="bar" data-stat="${key}" role="button" tabindex="0"><span>${label} <i class="qm">?</i></span><div class="track"><div class="fill" style="width:${w}%;background:${color}"></div></div><span class="num">${text}</span></div>`;
}

function renderPlay() {
  show('scr-play');
  const P = g.P;
  const life = g.lifespan();
  const sc = P.sect ? g.sect(P.sect) : null;
  drawPortrait($('portrait'), P, { life, robe: playerRobe(P), dead: g.s.phase === 'dead' });
  const hon = g.honorific();
  const ttl = P.title && TITLE_MAP[P.title] ? TITLE_MAP[P.title].n : null;
  $('who').innerHTML = `
    ${ttl ? `<button class="ttl t${TITLE_MAP[P.title].tier}" id="ttlBtn"><span>${esc(ttl)}</span></button>` : ''}
    <h1>${esc(P.name)}</h1>
    ${hon ? `<div class="daohieu">${esc(hon)}</div>` : ''}
    <div class="sub">${P.age} tuổi · Kiếp ${P.lifeNo} · ${esc(P.root.n)}</div>
    <div class="sub"><span class="realm">${REALMS[P.realm].n}</span>${P.path && PATHS[P.path] ? ` · <button class="pathTag" data-stat="path">${esc(PATHS[P.path].n)}</button>` : ''}${P.dao ? '' : ' · chưa nhập đạo'}${sc ? ` · ${esc(sc.name)}` : P.dao ? ' · tán tu' : ''}</div>
    <button class="eqStrip" id="eqStrip" aria-label="Mở hành trang">${Object.keys(SLOTS).map((sl) => (P.eq && P.eq[sl] ? itemIco(P.eq[sl]) : icoImg({ kind: SLOT_KIND[sl], faded: true }, 'empty'))).join('')}</button>`;
  $('eqStrip').onclick = openBag;
  if ($('ttlBtn')) $('ttlBtn').onclick = openTitles;
  const need = g.need();
  $('bars').innerHTML =
    bar('Tu vi', P.tuvi, need, 'var(--tuvi)', P.dao ? `${fmt(P.tuvi)}/${fmt(need)}` : '-', 'tuvi') +
    bar('Sinh lực', P.hp, 100, 'var(--hp)', `${P.hp}/100`, 'hp') +
    bar('Thọ', P.age, life, 'var(--life)', `${P.age}/${life}`, 'tho');
  const tinh = P.tinh >= 30 ? 'Hữu tình' : P.tinh <= -30 ? 'Vô tình' : 'Trung dung';
  $('stats').innerHTML =
    Object.keys(STAT_NAMES).map((k) => `<button class="chip chipBtn" data-stat="${k}">${STAT_NAMES[k]} <b>${P.stats[k]}</b></button>`).join('') +
    `<button class="chip chipBtn" data-stat="tinh">${tinh} <b>${P.tinh > 0 ? '+' : ''}${P.tinh}</b></button>` +
    `<button class="chip chipBtn" data-stat="money">Linh thạch <b>${fmt(P.money)}</b></button>` +
    `<button class="chip chipBtn" data-stat="fame">Danh vọng <b>${fmt(P.fame)}</b></button>` +
    (P.flags.pet ? `<span class="chip">Linh thú: ${esc(P.flags.pet)}</span>` : '') +
    `<button class="chip chipBtn" id="traitChip">${esc(g.traits().filter((t) => !t.cond && !t.tt && !t.path).map((t) => t.n).join(' · '))} ›</button>`;
  $('traitChip').onclick = openTraits;

  const canBreak = g.canBreak();
  setHTML($('speed'),
    `<button class="btn sp ${paused ? 'on' : ''}" data-sp="0" aria-label="Tạm dừng">${paused ? '▶' : '⏸'}</button>` +
    SPEEDS.map((s) => `<button class="btn sp ${!paused && s === speed ? 'on' : ''}" data-sp="${s}">${s}×</button>`).join('') +
    `<button class="btn sp ${autoOn ? 'on' : ''}" data-do="auto" title="Từ ${AUTO_SPEED}×, kỳ ngộ nhỏ tự chọn phương án hợp lý">Tự quyết ${autoOn ? 'bật' : 'tắt'}</button>` +
    `<span class="grow"></span>` +
    (canBreak ? `<button class="btn primary breakBtn" data-do="break">Đột phá</button>` : ''));

  const act = g.effectiveAction();
  let html = '';
  if (P.closed > 0) {
    html = `<p class="hint">Đang bế quan, còn ${P.closed} năm. Tu vi tăng gấp 1,6 lần, gần như không có kỳ ngộ.</p>
      <button class="btn ghost wide" data-do="openDoor" style="grid-column:1/-1">Xuất quan sớm</button>`;
  } else {
    html = Object.entries(ACTIONS).map(([id, a]) => {
      const ok = g.actionOk(id);
      const why = P.age < a.minAge ? `Từ ${a.minAge} tuổi` : a.needDao && !P.dao ? 'Cần nhập đạo' : a.desc;
      return `<button class="btn ${P.action === id ? 'on' : ''}" data-act="${id}" ${ok ? '' : 'disabled'}>${a.icon} ${a.n}<small>${esc(why)}</small></button>`;
    }).join('');
    html += `<div class="utils">
      <button class="btn" data-do="bag">🎒 Hành trang<small>Trang bị, võ kỹ</small></button>
      <button class="btn" data-do="titles">🏅 Danh hiệu<small>${P.titles.length ? `Đã có ${P.titles.length}` : 'Chưa có'}</small></button>
      <button class="btn" data-do="shop" ${P.age < 10 ? 'disabled' : ''}>🏮 Tụ Bảo Lâu<small>Đan, pháp khí, bí kíp</small></button>
      <button class="btn" data-do="close" ${P.dao && P.age >= 12 && !canBreak ? '' : 'disabled'}>🕯 Bế quan<small>${P.dao ? 'Tu nhanh, ít kỳ ngộ' : 'Cần nhập đạo'}</small></button>
    </div>`;
    if (act === 'lon_len') html += `<p class="hint">${P.age < 6 ? 'Ngươi còn nhỏ, cứ lớn lên đã.' : 'Chưa nhập đạo nên chưa thể tu luyện. Hãy đi đây đi đó, cơ duyên sẽ tới.'}</p>`;
  }
  setHTML($('actions'), html);

  const tabs = [['log', 'Nhật ký'], ['rel', 'Quan hệ'], ['world', 'Thiên hạ'], ['rank', 'Xếp hạng'], ['lives', 'Sổ kiếp']];
  setHTML($('tabs'), tabs.map(([id, n]) => `<button class="${tab === id ? 'on' : ''}" data-tab="${id}">${n}</button>`).join(''));
  setHTML($('tabbody'), renderTab());
}

function renderTab() {
  if (tab === 'log') {
    const items = g.s.log.slice(-80).reverse();
    return `<ul class="log">${items.map((l) => `<li class="${l.tone}"><span class="age">${l.a} tuổi</span>${rich(l.t)}</li>`).join('')}</ul>`;
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
        <div class="meta">${REALMS[b.realm].n} · ${b.age} tuổi · ${PERSONALITIES[b.pers].n}${sc ? ` · ${esc(sc.name)}` : ''}${theTxt}</div>${past}</div></div>`;
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
      return `<div class="item withAv ${x.me ? 'me' : ''}">${av}<div class="body"><div class="row"><b>${i + 1}. ${esc(x.name)}${x.me ? ' (ngươi)' : ''}${xh ? ` <span class="dhSmall">${esc(xh)}</span>` : ''}</b><span class="meta">${REALMS[x.realm].n} ${Math.floor(x.prog * 100)}%</span></div>
        <div class="meta">${x.age} tuổi${sc ? ` · ${esc(sc.name)}` : ' · tán tu'} ${badge}</div></div></div>`;
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

function renderModal() {
  const v = g.eventView();
  const p = g.s.pending;
  if (v && v.done && p.battles && p.bi < p.battles.length) {
    $('modal').hidden = true;
    if (!bt) startBattle(p);
    return;
  }
  $('modal').hidden = !v;
  if (!v) return;
  $('evTitle').textContent = v.title;
  $('evText').innerHTML = rich(v.text);
  $('evPause').textContent = paused ? '▶ Chạy tiếp sau khi chọn' : '⏸ Dừng sau khi chọn';
  $('evPause').classList.toggle('on', paused);
  if (v.done) {
    $('evChoices').innerHTML = `<button class="btn primary" id="evOk">Tiếp tục</button>`;
    $('evOk').onclick = () => { g.dismiss(); save(); dirty = true; };
  } else {
    $('evChoices').innerHTML = v.choices.map((c, i) => `<button class="btn" data-ch="${i}">${esc(c)}</button>`).join('');
    $('evChoices').querySelectorAll('[data-ch]').forEach((b) => { b.onclick = () => { g.choose(+b.dataset.ch); save(); dirty = true; }; });
  }
}

/** Chữ có mã biểu tượng: thoát HTML rồi thay mã bằng ảnh */
function rich(t) {
  return esc(t).replace(ICON_TOKEN_RE, (m, kind, q, col) => `<img class="ico inl q${q}" alt="" src="${iconURL({ kind, q: +q, col: col === '-' ? null : col })}">`);
}
$('evPause').onclick = () => { paused = !paused; dirty = true; };

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
  bt = { res, i: 0, timer: null, fast: btFast, done: false };
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
  $('btNext').textContent = 'Tiếp tục';
}
$('btNext').onclick = () => {
  if (!bt) return;
  if (!bt.done) return endBattle();
  const p = g.s.pending;
  $('battle').hidden = true;
  bt = null;
  if (p && p.battles) p.bi++;
  save();
  dirty = true;
};
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
  return `<div class="item withIco">${itemIco(it)}<div class="body"><div class="row"><b class="${qCls(it.q)}">${esc(it.n)}</b><span class="meta">${QUALITY[it.q].n} · ${SLOTS[it.slot]}${wt} · ${REALMS[it.lv].n}</span></div>
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

function openBag() {
  const draw = (msg = '') => {
    const P = g.P;
    const F = g.playerFighter();
    const eq = Object.keys(SLOTS).map((sl) => {
      const it = P.eq[sl];
      return it ? itemCard(it, `<button class="btn ghost" data-un="${sl}">Tháo</button>`) : `<div class="item withIco">${icoImg({ kind: SLOT_KIND[sl], faded: true }, 'empty')}<div class="body"><b class="meta">${SLOTS[sl]}: trống</b></div></div>`;
    }).join('');
    const bag = P.bag.slice().sort((a, b) => (a.slot > b.slot ? 1 : a.slot < b.slot ? -1 : b.val - a.val)).map((it) => itemCard(it,
      `<button class="btn ghost" data-eq="${it.id}">Mang</button><button class="btn ghost" data-sell="${it.id}">Bán · ${fmt(it.val)}</button>${g.betterThanEquipped(it) ? '<span class="tag pos">Tốt hơn</span>' : ''}`)).join('');
    const wep = P.eq.vu_khi ? P.eq.vu_khi.wt : null;
    const sks = P.skills.map((id) => {
      const sk = SKILLS[id];
      const on = P.loadout.includes(id);
      const fit = sk.wep && sk.wep !== wep ? `<span class="tag neg">Cần ${WEAPON_TYPES[sk.wep].n.toLowerCase()}, đang yếu 40%</span>` : '';
      return `<div class="item"><div class="row"><b>${esc(sk.n)}</b><span class="meta">${sk.mp ? `Linh lực ${sk.mp}` : 'Không tốn linh lực'}</span></div><div class="meta">${esc(sk.desc)}</div>
        <div class="row btnRow"><button class="btn ${on ? 'on' : 'ghost'}" data-sk="${id}">${on ? 'Đang mang theo' : 'Mang theo'}</button>${fit}</div></div>`;
    }).join('');
    openSheet(`<h2>Hành trang</h2>
      <div class="cstats"><span>Công <b>${fmt(F.atk)}</b></span><span>Thủ <b>${fmt(F.def)}</b></span><span>Sinh lực <b>${fmt(F.maxHp)}</b></span><span>Bạo kích <b>${Math.round(F.crit * 100)}%</b></span><span>Né <b>${Math.round(F.dodge * 100)}%</b></span></div>
      ${(() => { const ids = [...new Set(Object.values(P.eq).filter((x) => x && x.tt && !isSealed(x, P.realm)).map((x) => x.tt))]; return ids.length ? `<div class="ttActive">Thần thông đang phát huy: ${ids.map((id) => `<span class="ttName">✦ ${esc(TT_MAP[id].n)}</span>`).join(' ')}</div>` : ''; })()}
      ${msg ? `<p class="intro">${esc(msg)}</p>` : ''}
      <h3>Đang mang</h3><div class="list">${eq}</div>
      <h3>Võ kỹ · mang theo ${P.loadout.length}/4</h3><div class="list">${sks}</div>
      <h3>Chiến thuật</h3><div class="tactics">${Object.entries(TACTICS).map(([k, t]) => `<button class="btn ${P.tactic === k ? 'on' : ''}" data-tc="${k}">${t.n}<small>${t.desc}</small></button>`).join('')}</div>
      <h3>Túi đồ · ${P.bag.length}/16</h3><div class="list">${bag || '<p class="empty">Túi trống. Đồ rơi từ yêu thú, hang động, bí cảnh, đối thủ, hoặc mua ở Tụ Bảo Lâu.</p>'}</div>`, () => {
      const q = (sel, fn) => $('sheetBody').querySelectorAll(sel).forEach((b) => { b.onclick = () => { const m = fn(b); save(); draw(typeof m === 'string' ? m : ''); }; });
      q('[data-un]', (b) => g.unequip(b.dataset.un));
      q('[data-eq]', (b) => g.equip(+b.dataset.eq));
      q('[data-sell]', (b) => `Bán được ${g.sell(+b.dataset.sell)} linh thạch.`);
      q('[data-sk]', (b) => g.toggleSkill(b.dataset.sk));
      q('[data-tc]', (b) => g.setTactic(b.dataset.tc));
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
  el.innerHTML = `<div class="meta">Danh hiệu mới</div><div class="ttl t${t.tier} big"><span>${esc(t.n)}</span></div><div class="meta">Khi đeo: ${esc(t.bonus)}</div>`;
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
      ${shopGear()}
      <p class="intro" id="shopMsg"></p>`, () => {
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
    <div class="list"><button class="btn" id="themeBtn">Đổi giao diện sáng / tối</button><button class="btn" id="newWorld">Tạo thế giới mới (xóa bản lưu)</button></div>`, () => {
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
for (const id of ['stats', 'bars', 'scr-birth', 'who']) {
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
  if (b.dataset.do === 'auto') { autoOn = !autoOn; save(); dirty = true; return; }
  const v = +b.dataset.sp;
  if (v === 0) paused = !paused;
  else { speed = v; paused = false; }
  dirty = true;
});
$('actions').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.dataset.act) { g.setAction(b.dataset.act); save(); }
  else if (b.dataset.do === 'shop') openShop();
  else if (b.dataset.do === 'bag') openBag();
  else if (b.dataset.do === 'titles') openTitles();
  else if (b.dataset.do === 'close') openClose();
  else if (b.dataset.do === 'openDoor') { g.P.closed = 0; g.log('Ngươi xuất quan sớm.', 'muted'); }
  dirty = true;
});
$('tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b && b.dataset.tab) { tab = b.dataset.tab; dirty = true; }
});

// ---------- Vòng lặp ----------
function frame(t) {
  const dt = Math.min(250, t - lastT);
  lastT = t;
  const sheetOpen = !$('sheet').hidden;
  // tốc độ cao: kỳ ngộ nhỏ tự quyết để không bị hộp câu hỏi chặn liên tục
  if (autoOn && !paused && speed >= AUTO_SPEED && g.playing && g.canAuto()) {
    g.autoResolve();
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
      if (g.s.pending && autoOn && speed >= AUTO_SPEED && g.canAuto()) g.autoResolve();
      if (!g.playing || g.s.pending) { acc = 0; break; }
    }
  } else acc = 0;
  if (dirty) render();
  if (g.s.toasts && g.s.toasts.length) showToasts();
  if (t - lastSave > 5000) save();
  requestAnimationFrame(frame);
}

try {
  const th = localStorage.getItem('tkps.theme');
  if (th) document.documentElement.dataset.theme = th;
} catch (e) { /* bỏ qua */ }
load();
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
render();
requestAnimationFrame(frame);
