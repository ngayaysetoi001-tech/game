// Giao diện trình duyệt. Mọi luật chơi nằm trong core.js.
import { Game, REALMS, ACTIONS, PILLS, LEGACIES, THE_MAP, THE_CHAT, TITLES, TITLE_MAP, clamp } from './core.js';
import { STAT_NAMES, PERSONALITIES } from './data.js';
import { drawSprite, spriteURL, botSeed } from './sprite.js';
import { SKILLS, TACTICS, WEAPON_TYPES, turnText } from './combat.js';
import { SLOTS, QUALITY, itemLine } from './items.js';
import { iconURL, itemIconOpts, armorColor, PILL_COLORS } from './icons.js';

const SAVE_KEY = 'tkps.save.v1';
const SPEEDS = [1, 2, 4, 8, 16, 32];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => Math.floor(n).toLocaleString('vi-VN');

let g = null;
let speed = 1;
let paused = false;
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
      return;
    }
  } catch (e) {
    console.warn('Không đọc được bản lưu, tạo thế giới mới.', e);
  }
  g = Game.create();
}
function save() {
  try {
    g.s.ui = { speed };
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
  return Object.keys(STAT_NAMES).map((k) => `<div><span>${STAT_NAMES[k]}</span> <b>${st[k]}</b></div>`).join('');
}

const TIER_N = ['Thường', 'Khá', 'Hiếm', 'Truyền thuyết', 'Thần thoại'];
/** Khối thể chất + thiên phú cho màn đầu thai */
function traitBlock() {
  const ts = g.traits();
  const [the, ...tps] = ts;
  return `<div class="traits">
    <div class="trait t${the.tier}"><div class="row"><b>${esc(the.n)}${g.s.phase === 'birth' && the.tier && !(g.s.seenThe || []).includes(the.id) ? ' <span class="newTag">Mới!</span>' : ''}</b><span class="meta">Thể chất${the.tier ? ' · ' + TIER_N[the.tier] : ''}</span></div><div class="meta">${esc(the.desc)}</div></div>
    ${tps.length ? tps.map((t) => `<div class="trait t${t.tier}"><div class="row"><b>${esc(t.n)}</b><span class="meta">Thiên phú · ${TIER_N[t.tier]}</span></div><div class="meta">${esc(t.desc)}</div></div>`).join('') : '<div class="meta">Không có thiên phú gì đặc biệt.</div>'}
  </div>`;
}
function openTraits() {
  openSheet(`<h2>Thể chất và thiên phú</h2>${traitBlock()}`);
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
      <div class="btns">
        <button class="btn ghost" id="rerollBtn" ${g.s.rerolls <= 0 ? 'disabled' : ''}>Gieo lại (${g.s.rerolls})</button>
        <button class="btn primary" id="startBtn">Đầu thai</button>
      </div>
    </div>`;
  drawPortrait($('birthPortrait'), { ...P, age: 20 }, { life: 100 });
  $('rerollBtn').onclick = () => { g.reroll(); save(); dirty = true; };
  $('startBtn').onclick = () => { g.start(); paused = false; tab = 'log'; save(); dirty = true; };
}

function bar(label, val, max, color, text) {
  const w = clamp((val / Math.max(1, max)) * 100, 0, 100);
  return `<div class="bar"><span>${label}</span><div class="track"><div class="fill" style="width:${w}%;background:${color}"></div></div><span class="num">${text}</span></div>`;
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
    ${ttl ? `<div class="titleTag">「${esc(ttl)}」</div>` : ''}
    <h1>${esc(P.name)}</h1>
    ${hon ? `<div class="daohieu">${esc(hon)}</div>` : ''}
    <div class="sub">${P.age} tuổi · Kiếp ${P.lifeNo} · ${esc(P.root.n)}</div>
    <div class="sub"><span class="realm">${REALMS[P.realm].n}</span>${P.dao ? '' : ' · chưa nhập đạo'}${sc ? ` · ${esc(sc.name)}` : P.dao ? ' · tán tu' : ''}</div>
    <button class="eqStrip" id="eqStrip" aria-label="Mở hành trang">${Object.keys(SLOTS).map((sl) => (P.eq && P.eq[sl] ? itemIco(P.eq[sl]) : icoImg({ kind: SLOT_KIND[sl], faded: true }, 'empty'))).join('')}</button>`;
  $('eqStrip').onclick = openBag;
  const need = g.need();
  $('bars').innerHTML =
    bar('Tu vi', P.tuvi, need, 'var(--tuvi)', P.dao ? `${fmt(P.tuvi)}/${fmt(need)}` : '-') +
    bar('Sinh lực', P.hp, 100, 'var(--hp)', `${P.hp}/100`) +
    bar('Thọ', P.age, life, 'var(--life)', `${P.age}/${life}`);
  const tinh = P.tinh >= 30 ? 'Hữu tình' : P.tinh <= -30 ? 'Vô tình' : 'Trung dung';
  $('stats').innerHTML =
    Object.keys(STAT_NAMES).map((k) => `<span class="chip">${STAT_NAMES[k]} <b>${P.stats[k]}</b></span>`).join('') +
    `<span class="chip" title="Hữu tình: bạn bè hộ pháp khi đột phá. Vô tình: tu nhanh hơn.">${tinh} <b>${P.tinh > 0 ? '+' : ''}${P.tinh}</b></span>` +
    `<span class="chip">Linh thạch <b>${fmt(P.money)}</b></span>` +
    `<span class="chip">Danh vọng <b>${fmt(P.fame)}</b></span>` +
    (P.flags.pet ? `<span class="chip">Linh thú: ${esc(P.flags.pet)}</span>` : '') +
    `<button class="chip chipBtn" id="traitChip">${esc(g.traits().map((t) => t.n).join(' · '))} ›</button>`;
  $('traitChip').onclick = openTraits;

  const canBreak = g.canBreak();
  setHTML($('speed'),
    `<button class="btn sp ${paused ? 'on' : ''}" data-sp="0" aria-label="Tạm dừng">${paused ? '▶' : '⏸'}</button>` +
    SPEEDS.map((s) => `<button class="btn sp ${!paused && s === speed ? 'on' : ''}" data-sp="${s}">${s}×</button>`).join('') +
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
    return `<ul class="log">${items.map((l) => `<li class="${l.tone}"><span class="age">${l.a} tuổi</span>${esc(l.t)}</li>`).join('')}</ul>`;
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
    ? `<span class="cx t2" title="${esc(t.cond)}">${esc(t.n)}</span>`
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
    <h3>Chọn một tàn niệm mang sang kiếp sau</h3>
    <div class="legacies">${d.options.map((id) => {
      const x = LEGACIES.find((q) => q.id === id);
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
  $('evText').textContent = v.text;
  if (v.done) {
    $('evChoices').innerHTML = `<button class="btn primary" id="evOk">Tiếp tục</button>`;
    $('evOk').onclick = () => { g.dismiss(); save(); dirty = true; };
  } else {
    $('evChoices').innerHTML = v.choices.map((c, i) => `<button class="btn" data-ch="${i}">${esc(c)}</button>`).join('');
    $('evChoices').querySelectorAll('[data-ch]').forEach((b) => { b.onclick = () => { g.choose(+b.dataset.ch); save(); dirty = true; }; });
  }
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
  $('sheetBody').innerHTML = html;
  $('sheet').hidden = false;
  if (bind) bind();
}
$('sheetClose').onclick = () => { $('sheet').hidden = true; dirty = true; };

const qCls = (q) => `q${q}`;
function itemCard(it, btns) {
  const wt = it.wt ? ` · ${WEAPON_TYPES[it.wt].n}` : '';
  return `<div class="item withIco">${itemIco(it)}<div class="body"><div class="row"><b class="${qCls(it.q)}">${esc(it.n)}</b><span class="meta">${QUALITY[it.q].n} · ${SLOTS[it.slot]}${wt} · ${REALMS[it.lv].n}</span></div>
    <div class="meta">${esc(itemLine(it))}</div>${btns ? `<div class="row btnRow">${btns}</div>` : ''}</div></div>`;
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
      ${msg ? `<p class="intro">${esc(msg)}</p>` : ''}
      <h3>Danh hiệu · đeo một danh hiệu để nhận lợi ích</h3><div class="list">${P.titles.length ? P.titles.map((id) => {
        const t = TITLE_MAP[id];
        const on = P.title === id;
        return `<div class="item"><div class="row"><b>「${esc(t.n)}」</b><span class="meta">${esc(t.bonus)}</span></div><div class="meta">${esc(t.cond)}</div>
          <div class="row btnRow"><button class="btn ${on ? 'on' : 'ghost'}" data-ti="${on ? '' : id}">${on ? 'Đang đeo' : 'Đeo'}</button></div></div>`;
      }).join('') : '<p class="empty">Chưa có danh hiệu. Giang hồ sẽ xưng tụng khi ngươi làm nên chuyện: thắng trận, tu nhanh, giàu có, kết giao, báo thù...</p>'}</div>
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
      q('[data-ti]', (b) => g.setTitle(b.dataset.ti || null));
    });
  };
  draw();
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

// Gắn sự kiện một lần (ủy quyền), không gắn lại mỗi lần vẽ
$('speed').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.do === 'break') { g.openBreak(); dirty = true; return; }
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
  if (g.playing && !paused && !g.s.pending && !sheetOpen) {
    const yearMs = 1000 / speed / (g.P.closed > 0 ? 3 : 1);
    acc += dt;
    let n = 0;
    while (acc >= yearMs && n < 8) {
      acc -= yearMs;
      n++;
      g.tick();
      dirty = true;
      if (!g.playing || g.s.pending) { acc = 0; break; }
    }
  } else acc = 0;
  if (dirty) render();
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
