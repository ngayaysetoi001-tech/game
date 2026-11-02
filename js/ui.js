// Giao diện trình duyệt. Mọi luật chơi nằm trong core.js.
import { Game, REALMS, ACTIONS, PILLS, LEGACIES, THE_MAP, clamp } from './core.js';
import { STAT_NAMES, PERSONALITIES } from './data.js';
import { drawSprite, spriteURL, botSeed } from './sprite.js';

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
  drawSprite(canvas, { seed: p.look || 1, g: p.g, age: p.age, life: opts.life, realm: p.realm || 0, robe: opts.robe || null, dead: opts.dead, asc: opts.asc });
}
const sectRobe = (sectId) => {
  const sc = sectId ? g.sect(sectId) : null;
  return sc ? sc.color : null;
};
/** Ảnh nhỏ của một bot */
const botAvatar = (b) => `<img class="avatar" alt="" src="${spriteURL({ seed: botSeed(b), g: b.g, age: b.age, life: b.life, realm: b.realm, robe: sectRobe(b.sect) })}">`;
const robeOf = sectRobe;

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

const TIER_N = ['Thường', 'Khá', 'Hiếm', 'Truyền thuyết'];
/** Khối thể chất + thiên phú cho màn đầu thai */
function traitBlock() {
  const ts = g.traits();
  const [the, ...tps] = ts;
  return `<div class="traits">
    <div class="trait t${the.tier}"><div class="row"><b>${esc(the.n)}</b><span class="meta">Thể chất${the.tier ? ' · ' + TIER_N[the.tier] : ''}</span></div><div class="meta">${esc(the.desc)}</div></div>
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
  drawPortrait($('portrait'), P, { life, robe: robeOf(P.sect), dead: g.s.phase === 'dead' });
  $('who').innerHTML = `
    <h1>${esc(P.name)}</h1>
    <div class="sub">${P.age} tuổi · Kiếp ${P.lifeNo} · ${esc(P.root.n)}</div>
    <div class="sub"><span class="realm">${REALMS[P.realm].n}</span>${P.dao ? '' : ' · chưa nhập đạo'}${sc ? ` · ${esc(sc.name)}` : P.dao ? ' · tán tu' : ''}</div>`;
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
    html += `<button class="btn" data-do="shop" ${P.age < 10 ? 'disabled' : ''}>🏮 Tụ Bảo Lâu<small>Mua và dùng đan dược</small></button>`;
    html += `<button class="btn" data-do="close" ${P.dao && P.age >= 12 && !canBreak ? '' : 'disabled'}>🕯 Bế quan<small>${P.dao ? 'Tu nhanh, xa lánh thế sự' : 'Cần nhập đạo'}</small></button>`;
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
      return `<div class="item withAv">${botAvatar(b)}<div class="body"><div class="row"><b>${esc(b.name)}</b><span class="tag ${cls}">${esc(g.relLabel(r))} ${r.v > 0 ? '+' : ''}${r.v}</span></div>
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
        ? `<img class="avatar" alt="" src="${spriteURL({ seed: P.look, g: P.g, age: P.age, life: g.lifespan(), realm: P.realm, robe: sectRobe(P.sect) })}">`
        : botAvatar(g.soul(x.id));
      return `<div class="item withAv ${x.me ? 'me' : ''}">${av}<div class="body"><div class="row"><b>${i + 1}. ${esc(x.name)}${x.me ? ' (ngươi)' : ''}</b><span class="meta">${REALMS[x.realm].n} ${Math.floor(x.prog * 100)}%</span></div>
        <div class="meta">${x.age} tuổi${sc ? ` · ${esc(sc.name)}` : ' · tán tu'}</div></div></div>`;
    }).join('')}</div>`;
  }
  if (tab === 'lives') return livesList();
  return '';
}

function livesList() {
  const ls = g.s.lives.slice().reverse();
  if (!ls.length) return '<p class="empty">Đây là kiếp đầu tiên.</p>';
  return `<div class="list">${ls.map((l) => `<div class="item"><div class="row"><b>Kiếp ${l.no}: ${esc(l.name)}</b><span class="meta">${l.age} tuổi</span></div>
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
    <h3>Sổ kiếp</h3>${livesList()}`;
  drawPortrait($('deadPortrait'), { ...g.P, age: l.age }, { life: g.lifespan(), robe: robeOf(g.P.sect), dead: !l.asc, asc: l.asc });
  $('scr-dead').querySelectorAll('[data-leg]').forEach((b) => {
    b.onclick = () => { g.chooseLegacy(b.dataset.leg); save(); dirty = true; window.scrollTo(0, 0); };
  });
}

function renderModal() {
  const v = g.eventView();
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

// ---------- Bảng phụ ----------
function openSheet(html, bind) {
  $('sheetBody').innerHTML = html;
  $('sheet').hidden = false;
  if (bind) bind();
}
$('sheetClose').onclick = () => { $('sheet').hidden = true; dirty = true; };

function openShop() {
  const draw = () => {
    const P = g.P;
    openSheet(`<h2>Tụ Bảo Lâu</h2><p class="intro">Linh thạch: <b>${fmt(P.money)}</b>. Giá tăng theo cảnh giới.</p>
      <div class="list">${Object.entries(PILLS).map(([id, p]) => {
        const price = g.pillPrice(id);
        const n = P.pills[id] || 0;
        return `<div class="item"><div class="row"><b>${p.n}</b><span class="meta">Có ${n}</span></div><div class="meta">${p.desc}</div>
          <div class="row" style="margin-top:6px;gap:8px"><button class="btn ghost" data-buy="${id}" ${P.money < price ? 'disabled' : ''}>Mua · ${fmt(price)}</button>
          ${id !== 'pha_canh' ? `<button class="btn ghost" data-use="${id}" ${n ? '' : 'disabled'}>Dùng</button>` : '<span class="meta">Dùng khi đột phá</span>'}</div></div>`;
      }).join('')}</div><p class="intro" id="shopMsg"></p>`, () => {
      $('sheetBody').querySelectorAll('[data-buy]').forEach((b) => { b.onclick = () => { g.buy(b.dataset.buy); save(); draw(); }; });
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
