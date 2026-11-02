// Lõi game: thế giới bot tự sống + một kiếp của người chơi.
// Không đụng tới DOM, chạy được cả trong Node (tools/sim.mjs).
import { Rng } from './rng.js';
import {
  REALMS, TOP_REALM, baseGain, ROOTS, ORIGINS, PERSONALITIES, PERS_KEYS,
  SURNAMES, NAMES_M, NAMES_F, SECT_A, SECT_B, SECT_COLORS, MONSTERS, MOVES,
  ACTIONS, PILLS, LEGACIES, TAG_NAMES, THE_CHAT, THIEN_PHU, TP_WEIGHT,
} from './data.js';

const THE_MAP = Object.fromEntries(THE_CHAT.map((t) => [t.id, t]));
const TP_MAP = Object.fromEntries(THIEN_PHU.map((t) => [t.id, t]));
import { EVENTS, EVENT_MAP } from './events.js';

export const SAVE_VERSION = 1;
export const SOUL_COUNT = 40;
const PREWARM_YEARS = 250;
const MAX_SECTS = 7;
const CLOSE_TAGS = ['huynh_de', 'dao_lu', 'su_phu', 'de_tu'];

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const pct = (p) => Math.round(p * 100) + '%';

// Xác suất có sự kiện mỗi năm theo việc đang làm
const EVENT_RATE = { lon_len: 0.25, tu_luyen: 0.1, lich_luyen: 0.45, muu_sinh: 0.18, ket_giao: 0.18, be_quan: 0.03 };

export class Game {
  constructor(state) {
    this.s = state;
    this.r = new Rng(state.rng);
  }

  // ---------- Tạo, lưu, tải ----------
  static create(seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0) {
    const st = {
      v: SAVE_VERSION, seed, rng: seed, year: 0,
      souls: [], sects: [], chron: [], rel: {}, nextId: 1,
      player: null, draft: null, lives: [], legacy: null,
      phase: 'birth', pending: null, queue: [], log: [], cd: {}, once: {},
      rerolls: 3, deadInfo: null,
    };
    const g = new Game(st);
    for (let i = 0; i < 4; i++) g.newSect(null);
    for (let i = 0; i < SOUL_COUNT; i++) {
      const b = g.newSoul();
      b.reborn = g.r.int(0, 140);
    }
    for (let y = 0; y < PREWARM_YEARS; y++) g.worldYear();
    st.chron = st.chron.slice(-25);
    g.rollDraft();
    return g;
  }
  save() {
    this.s.rng = this.r.s;
    return JSON.stringify(this.s);
  }
  static load(json) {
    const st = JSON.parse(json);
    if (!st || st.v !== SAVE_VERSION) throw new Error('save version');
    return new Game(st);
  }

  get P() {
    return this.s.player;
  }
  get playing() {
    return this.s.phase === 'play' && this.s.player;
  }

  // ---------- Tiện ích ----------
  soul(id) {
    return this.s.souls.find((b) => b.id === id) || null;
  }
  sect(id) {
    return this.s.sects.find((x) => x.id === id) || null;
  }
  aliveSects() {
    return this.s.sects.filter((x) => x.alive);
  }
  members(sid) {
    return this.s.souls.filter((b) => b.alive && b.sect === sid);
  }
  genName(gender) {
    return this.r.pick(SURNAMES) + ' ' + this.r.pick(gender === 'nu' ? NAMES_F : NAMES_M);
  }
  rollRoot() {
    const x = this.r.weighted(ROOTS, (o) => o.w);
    return { n: x.n, m: x.m };
  }
  nm(b) {
    return `${b.name} (${REALMS[b.realm].n})`;
  }
  realmName(r) {
    return REALMS[r].n;
  }
  chron(t, imp = 1) {
    this.s.chron.push({ y: this.s.year, t, imp });
    if (this.s.chron.length > 220) this.s.chron.splice(0, this.s.chron.length - 220);
  }
  log(t, tone = 'normal') {
    const P = this.P;
    this.s.log.push({ a: P ? P.age : 0, t, tone });
    if (this.s.log.length > 300) this.s.log.splice(0, this.s.log.length - 300);
  }

  // ---------- Thế giới ----------
  newSect(founder) {
    const used = new Set(this.s.sects.map((x) => x.name));
    let name;
    for (let i = 0; i < 20; i++) {
      name = this.r.pick(SECT_A) + ' ' + this.r.pick(SECT_B);
      if (!used.has(name)) break;
    }
    const sc = {
      id: this.s.nextId++, name, alive: true, founded: this.s.year,
      founder: founder ? founder.name : null,
      color: SECT_COLORS[this.s.sects.length % SECT_COLORS.length],
    };
    this.s.sects.push(sc);
    if (founder) {
      founder.sect = sc.id;
      this.chron(`${this.nm(founder)} khai sơn lập phái, dựng nên ${sc.name}.`, 2);
    }
    return sc;
  }
  newSoul() {
    const b = {
      id: this.s.nextId++, pers: this.r.pick(PERS_KEYS), alive: false, reborn: this.s.year,
      lives: 0, ascended: false, name: '', g: 'nam', age: 0, realm: 0, tuvi: 0,
      rootM: 1, rootN: '', dao: false, sect: null, life: 60, fame: 0, kills: 0, cause: null,
    };
    this.s.souls.push(b);
    return b;
  }
  incarnate(b) {
    if (b.name) b.prevName = b.name;
    b.g = this.r.chance(0.5) ? 'nam' : 'nu';
    b.name = this.genName(b.g);
    b.age = 0; b.realm = 0; b.tuvi = 0;
    const root = this.rollRoot();
    b.rootM = root.m; b.rootN = root.n;
    b.dao = false; b.sect = null; b.life = this.r.int(50, 72);
    b.alive = true; b.lives++; b.fame = 0; b.kills = 0; b.cause = null;
    // linh hồn giữ tính cách cũ phần lớn thời gian
    if (this.r.chance(0.3)) b.pers = this.r.pick(PERS_KEYS);
    b.the = this.rollThe();
    const rel = this.s.rel[b.id];
    if (rel) rel.met = false;
  }
  power(b) {
    const R = REALMS[b.realm];
    const t = THE_MAP[b.the] || THE_MAP.pham;
    return R.pow * (1 + (b.tuvi / R.need) * 0.5) * (0.85 + b.rootM * 0.15) * (t.fx.fightMul || 1);
  }
  botGain(b) {
    let m = b.rootM * (b.sect ? 1.2 : 1) * (b.pers === 'an' ? 1.1 : 1) * ((THE_MAP[b.the] || THE_MAP.pham).fx.gainMul || 1);
    const rel = this.s.rel[b.id];
    if (rel && rel.tag === 'de_tu' && this.playing) m *= 1.3;
    return baseGain(b.realm) * m * this.r.range(0.6, 1);
  }
  botJoinSect(b) {
    const ss = this.aliveSects();
    if (!ss.length) return;
    // tông vắng người dễ được chọn hơn, tránh một tông nuốt cả thiên hạ
    const sc = this.r.weighted(ss, (x) => 1 / (this.members(x.id).length + 2));
    if (sc) b.sect = sc.id;
  }
  botDie(b, cause, killer = null) {
    if (!b.alive) return;
    b.alive = false;
    b.cause = cause;
    b.reborn = this.s.year + this.r.int(3, 15);
    if (b.realm >= 3) this.chron(`${this.nm(b)} ${cause}.`, b.realm >= 5 ? 2 : 1);
    const r = this.s.rel[b.id];
    if (!r) return;
    const close = CLOSE_TAGS.includes(r.tag) || r.v >= 60;
    if (this.playing && r.met && !close && r.v >= 30) this.log(`Nghe tin ${b.name} ${cause}.`, 'muted');
    if (this.playing && r.met && close && !this.cool('tin_du', 6)) this.log(`Tin dữ: ${b.name} ${cause}.`, 'bad');
    else if (this.playing && r.met && close) {
      this.s.queue.push({
        id: 'tin_du', botId: null,
        data: { name: b.name, realm: b.realm, tag: r.tag, v: r.v, cause, killer: killer ? killer.id : null },
      });
    }
    if (r.met && (Math.abs(r.v) >= 25 || r.tag)) {
      r.past.push({ name: b.name, tag: r.tag, v: r.v, realm: b.realm, year: this.s.year });
      if (r.past.length > 5) r.past.shift();
    }
    r.v = Math.round(r.v * 0.3);
    r.tag = null;
    r.met = false;
    r.cn = null;
  }
  botYear(b) {
    if (!b.alive) {
      if (!b.ascended && this.s.year >= b.reborn) this.incarnate(b);
      return;
    }
    b.age++;
    if (!b.dao && b.age >= 8 && b.age <= 25 && this.r.chance(0.12)) {
      b.dao = true;
      if (this.r.chance(0.7)) this.botJoinSect(b);
    }
    if (b.dao) {
      const R = REALMS[b.realm];
      b.tuvi = Math.min(R.need, b.tuvi + this.botGain(b));
      if (b.tuvi >= R.need && this.r.chance(0.35)) {
        const p = R.brk * 0.95 + (b.rootM - 1) * 0.08;
        if (this.r.chance(p)) {
          if (b.realm === TOP_REALM) {
            b.alive = false;
            b.ascended = true;
            this.chron(`Lôi kiếp chín tầng giáng xuống. ${b.name} phi thăng thượng giới, cả thiên hạ chấn động.`, 3);
            const nb = this.newSoul();
            nb.reborn = this.s.year + this.r.int(1, 10);
            return;
          }
          b.realm++;
          b.tuvi = 0;
          b.life = Math.max(b.life, Math.round(REALMS[b.realm].life * this.r.range(0.85, 1.15)));
          b.fame += b.realm * 2;
          if (b.realm >= 4) this.chron(`${b.name} đột phá ${REALMS[b.realm].n}.`, b.realm >= 5 ? 2 : 1);
        } else {
          b.tuvi *= 0.75;
          if (b.realm >= 3 && this.r.chance(0.06)) return this.botDie(b, 'đột phá thất bại, tẩu hỏa nhập ma');
        }
      }
    }
    if (this.r.chance(0.004 + (b.pers === 'cuong' ? 0.004 : 0))) return this.botDie(b, 'gặp nạn giữa đường');
    if (b.age >= b.life) return this.botDie(b, 'thọ tận tọa hóa');
  }
  clash(pa, pb) {
    let w = 0, l = 0;
    const rounds = [];
    while (w < 2 && l < 2) {
      const win = pa * this.r.range(0.7, 1.3) > pb * this.r.range(0.7, 1.3);
      rounds.push(win);
      if (win) w++; else l++;
    }
    return { win: w > l, rounds };
  }
  botDuels() {
    const pool = this.s.souls.filter((b) => b.alive && b.dao && b.age >= 14);
    if (pool.length < 2) return;
    const n = 2 + Math.floor(pool.length / 20);
    for (let k = 0; k < n; k++) {
      const a = this.r.weighted(pool, (b) => PERSONALITIES[b.pers].fight);
      if (!a || !a.alive) continue;
      const opps = pool.filter((x) => x !== a && x.alive && Math.abs(x.realm - a.realm) <= 1 && (!a.sect || x.sect !== a.sect));
      if (!opps.length || !this.r.chance(0.5)) continue;
      const b = this.r.pick(opps);
      const res = this.clash(this.power(a), this.power(b));
      const [win, lose] = res.win ? [a, b] : [b, a];
      win.fame += 1 + lose.realm;
      if (this.r.chance(0.25)) {
        win.kills++;
        this.botDie(lose, `bị ${win.name} đánh chết`, win);
      } else if (Math.max(a.realm, b.realm) >= 3 && this.r.chance(0.3)) {
        this.chron(`${this.nm(win)} đánh bại ${this.nm(lose)}.`);
      }
    }
  }
  sectYear() {
    const ss = this.aliveSects();
    if (ss.length >= 2 && this.r.chance(0.03)) {
      const A = this.r.pick(ss);
      const Bs = this.r.pick(ss.filter((x) => x !== A));
      this.chron(`${A.name} tuyên chiến với ${Bs.name}. Máu nhuộm đỏ núi non.`, 2);
      for (let i = 0; i < 3; i++) {
        const ma = this.members(A.id), mb = this.members(Bs.id);
        if (!ma.length || !mb.length) break;
        const a = this.r.pick(ma), b = this.r.pick(mb);
        const res = this.clash(this.power(a), this.power(b));
        const [win, lose] = res.win ? [a, b] : [b, a];
        if (this.r.chance(0.3)) this.botDie(lose, `tử trận trong cuộc chiến ${A.name} và ${Bs.name}`, win);
      }
      const P = this.P;
      if (this.playing && P.sect && (P.sect === A.id || P.sect === Bs.id)) {
        this.s.queue.push({ id: 'tong_mon_chien', botId: null, data: { enemy: P.sect === A.id ? Bs.id : A.id } });
      }
    }
    for (const sc of ss) {
      if (this.s.year - sc.founded > 40 && !this.members(sc.id).length && !(this.playing && this.P.sect === sc.id)) {
        sc.alive = false;
        this.chron(`${sc.name} không còn người kế tục, sơn môn hoang phế.`, 2);
      }
    }
    if (this.aliveSects().length < 2 && this.r.chance(0.1)) {
      const sc = this.newSect(null);
      this.chron(`${sc.name} ẩn thế nhiều năm, nay mở cửa sơn môn thu nhận đệ tử.`, 2);
    }
    const nSects = this.aliveSects().length;
    if (nSects < MAX_SECTS && this.r.chance(nSects < 3 ? 0.25 : 0.05)) {
      // người mạnh có chí lớn tách ra lập phái (kể cả khi đang ở tông khác)
      const cand = this.s.souls.filter((b) => b.alive && b.dao && b.realm >= 3 && ['cuong', 'muu', 'nghia'].includes(b.pers) && (!b.sect || this.r.chance(0.3)));
      if (cand.length) this.newSect(this.r.pick(cand));
    }
  }
  worldYear() {
    this.s.year++;
    for (const b of this.s.souls) this.botYear(b);
    this.botDuels();
    this.sectYear();
  }

  // ---------- Quan hệ ----------
  rel(b) {
    let r = this.s.rel[b.id];
    if (!r) r = this.s.rel[b.id] = { v: 0, tag: null, past: [], met: false, cn: null };
    return r;
  }
  relAdd(b, dv) {
    const r = this.rel(b);
    if (dv > 0 && this.P) dv *= this.tmul('relMul');
    r.v = clamp(Math.round(r.v + dv), -100, 100);
    r.met = true;
    return r.v;
  }
  relSet(b, v, tag) {
    const r = this.rel(b);
    r.v = clamp(Math.round(v), -100, 100);
    if (tag !== undefined) r.tag = tag;
    r.met = true;
  }
  relLabel(r) {
    if (r.tag) return TAG_NAMES[r.tag];
    if (r.v >= 50) return 'Tri kỷ';
    if (r.v >= 20) return 'Bằng hữu';
    if (r.v <= -50) return 'Kẻ thù';
    if (r.v <= -20) return 'Bất hòa';
    return 'Quen biết';
  }
  /** Bot đã quen ở kiếp này */
  known() {
    return this.s.souls
      .filter((b) => b.alive && this.s.rel[b.id] && this.s.rel[b.id].met)
      .map((b) => ({ b, r: this.s.rel[b.id] }));
  }
  closeFriends() {
    return this.known().filter(({ r }) => r.v >= 40 || CLOSE_TAGS.includes(r.tag));
  }
  /** Chọn một bot thỏa điều kiện, ưu tiên người đã quen */
  findBot(pred, metW = 2) {
    const list = this.s.souls.filter((b) => b.alive && pred(b, this.s.rel[b.id]));
    return this.r.weighted(list, (b) => (this.s.rel[b.id] && this.s.rel[b.id].met ? metW : 1));
  }
  meetBot() {
    const P = this.P;
    const b = this.findBot((x, r) => x.age >= 8 && Math.abs(x.realm - P.realm) <= 1 + (r && r.met ? 2 : 0), 2);
    if (!b) return this.log('Ngươi ngồi quán trà cả năm mà chẳng gặp ai hợp chuyện.');
    const r = this.rel(b);
    if (!r.met && r.cn) return this.s.queue.push({ id: 'co_nhan_gap_lai', botId: b.id, data: {} });
    const lp = r.past[r.past.length - 1];
    if (!r.met && lp && (lp.tag || Math.abs(lp.v) >= 40) && this.cool('duyen_no', 12)) return this.s.queue.push({ id: 'duyen_no', botId: b.id, data: {} });
    const dv = Math.max(1, Math.round(this.r.range(4, 10) * PERSONALITIES[b.pers].relMul * (1 + P.tinh / 200)));
    this.relAdd(b, dv);
    P.tinh = clamp(P.tinh + 1, -100, 100);
    const what = this.r.pick(['uống trà luận đạo', 'đánh một ván cờ', 'ngồi bàn chuyện giang hồ', 'đi dạo bên hồ', 'cùng nhau luyện kiếm', 'nghe kể chuyện cổ tu']);
    this.log(`Cùng ${b.name} ${what}. Thân thiết +${dv}.`);
  }

  /** Sự kiện hàng đợi chưa xảy ra trong `years` năm gần đây thì đánh dấu và trả về true */
  cool(id, years) {
    const P = this.P;
    if (!P) return false;
    if (this.s.cd[id] !== undefined && P.age - this.s.cd[id] < years) return false;
    this.s.cd[id] = P.age;
    return true;
  }

  // ---------- Thể chất, thiên phú ----------
  rollThe() {
    return this.r.weighted(THE_CHAT, (t) => t.w).id;
  }
  rollTraits() {
    const n = this.r.weighted([0, 1, 2], (k) => [25, 50, 25][k]);
    const pool = THIEN_PHU.slice();
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = this.r.weighted(pool, (x) => TP_WEIGHT[x.tier]);
      out.push(t.id);
      pool.splice(pool.indexOf(t), 1);
    }
    return out;
  }
  /** Danh sách thể chất + thiên phú của người chơi */
  traits(P = this.P || this.s.draft) {
    if (!P) return [];
    return [THE_MAP[P.the] || THE_MAP.pham, ...(P.tps || []).map((id) => TP_MAP[id]).filter(Boolean)];
  }
  tmul(k) {
    return this.traits().reduce((m, t) => m * (t.fx[k] ?? 1), 1);
  }
  tadd(k) {
    return this.traits().reduce((m, t) => m + (typeof t.fx[k] === 'number' ? t.fx[k] : 0), 0);
  }
  thas(k) {
    return this.traits().some((t) => t.fx[k]);
  }
  tevW(id) {
    return this.traits().reduce((m, t) => m * ((t.fx.evW && t.fx.evW[id]) ?? 1), 1);
  }

  // ---------- Người chơi ----------
  rollDraft() {
    const leg = this.s.legacy ? this.s.legacy.id : null;
    const gender = this.r.chance(0.5) ? 'nam' : 'nu';
    const o = this.r.weighted(ORIGINS, (x) => x.w);
    let root = this.rollRoot();
    if (leg === 'linh_can') {
      const r2 = this.rollRoot();
      if (r2.m > root.m) root = r2;
    }
    const st = { can: this.r.int(25, 75), ngo: this.r.int(25, 75), tam: this.r.int(25, 75), co: this.r.int(25, 75) };
    for (const k of ['can', 'ngo', 'tam', 'co']) if (o.fx[k]) st[k] += o.fx[k];
    if (leg === 'ky_uc') st.ngo += 15;
    if (leg === 'than_the') st.can += 15;
    if (leg === 'co_duyen') st.co += 15;
    if (leg === 'tam_canh') st.tam += 15;
    const the = leg === 'huyet_mach' && this.s.legacy.the ? this.s.legacy.the : this.rollThe();
    const tps = this.rollTraits();
    const tl = [THE_MAP[the], ...tps.map((id) => TP_MAP[id])];
    for (const t of tl) for (const k of ['can', 'ngo', 'tam', 'co']) if (t.fx[k]) st[k] += t.fx[k];
    const tinh0 = tl.reduce((m, t) => m + (t.fx.tinh || 0), 0);
    for (const k in st) st[k] = clamp(st[k], 0, 100);
    const P = {
      the, tps,
      name: this.genName(gender), g: gender, origin: o.id, originN: o.n, root, stats: st,
      hp: 100, age: 0, realm: 0, tuvi: 0, dao: !!o.fx.dao, sect: null,
      money: (o.fx.money || 0) + (leg === 'tai_san' ? this.s.legacy.money : 0),
      fight: (o.fx.fight || 0) + (leg === 'kiem_y' ? 0.2 : 0),
      tinh: tinh0, action: 'tu_luyen', closed: 0, pills: {}, dienTho: {}, lifeBonus: 0,
      fame: 0, lifeNo: this.s.lives.length + 1, flags: {}, legacy: leg, born: null,
      look: this.r.int(0, 1e6),
    };
    if (leg === 'ky_uc') P.flags.autoDao = true;
    this.s.draft = P;
  }
  reroll() {
    if (this.s.phase !== 'birth' || this.s.rerolls <= 0) return false;
    this.s.rerolls--;
    this.rollDraft();
    return true;
  }
  start() {
    if (this.s.phase !== 'birth') return;
    const P = this.s.draft;
    this.s.draft = null;
    P.born = this.s.year;
    this.s.player = P;
    this.s.phase = 'play';
    this.s.log = [];
    this.s.cd = {};
    this.s.once = {};
    this.s.queue = [];
    this.s.pending = null;
    if (P.legacy === 'duyen') {
      const best = this.s.souls
        .filter((b) => b.alive && this.s.rel[b.id] && this.s.rel[b.id].cn && this.s.rel[b.id].cn.v > 0)
        .sort((a, b) => this.s.rel[b.id].cn.v - this.s.rel[a.id].cn.v)[0];
      if (best) P.flags.duyenBot = best.id;
    }
    const omen = this.r.pick([
      'Đêm ngươi chào đời, sao chổi vạch ngang trời tây.',
      'Ngươi chào đời giữa cơn mưa rào, tiếng khóc át cả tiếng sấm.',
      'Ngươi sinh vào ngày rằm, trăng sáng đến mức đếm được từng sợi tóc bà mụ.',
      'Ngươi chào đời lặng lẽ, không khóc, chỉ mở mắt nhìn quanh.',
    ]);
    this.log(`${omen} Ngươi tên ${P.name}, ${P.originN.toLowerCase()}. ${P.root.n}.`, 'big');
    if (P.lifeNo > 1) this.log(`Đây là kiếp thứ ${P.lifeNo} của linh hồn này.`, 'muted');
  }
  lifespan(P = this.P) {
    return Math.round(REALMS[P.realm].life * (1 + (P.stats.can - 50) / 250) * (1 + P.lifeBonus) * this.tmul('lifeMul'));
  }
  need(P = this.P) {
    return REALMS[P.realm].need;
  }
  stat(k, dv) {
    const P = this.P;
    P.stats[k] = clamp(P.stats[k] + dv, 0, 100);
  }
  tinh(dv) {
    this.P.tinh = clamp(this.P.tinh + dv, -100, 100);
  }
  money(dv) {
    this.P.money = Math.max(0, Math.round(this.P.money + dv));
  }
  fame(dv) {
    this.P.fame = Math.max(0, this.P.fame + dv);
  }
  gain() {
    const P = this.P;
    return baseGain(P.realm) * P.root.m * (1 + (P.stats.ngo - 50) / 200) * (P.sect ? 1.2 : 1) * (P.tinh <= -30 ? 1.2 : 1) * (P.hp < 30 ? 0.6 : 1) * this.tmul('gainMul');
  }
  addTuvi(n) {
    const P = this.P;
    if (!P.dao) return 0;
    const before = P.tuvi;
    P.tuvi = Math.min(this.need(), P.tuvi + n);
    return Math.round(P.tuvi - before);
  }
  playerPower() {
    const P = this.P;
    const R = REALMS[P.realm];
    return R.pow * (1 + (P.tuvi / R.need) * 0.5) * (1 + (P.stats.can - 50) / 200) * (1 + P.fight) * (0.5 + P.hp / 200) * (P.flags.pet ? 1.1 : 1) * this.tmul('fightMul');
  }
  monster(realm) {
    const r = clamp(realm, 0, TOP_REALM);
    const opts = MONSTERS.filter((m) => m.r === Math.min(r, MONSTERS[MONSTERS.length - 1].r));
    const m = this.r.pick(opts.length ? opts : MONSTERS);
    return { n: m.n, pow: REALMS[r].pow * this.r.range(0.75, 1.25) };
  }
  hint(foePow) {
    const k = this.playerPower() / foePow;
    if (k > 1.5) return 'Trông không đáng ngại.';
    if (k > 0.9) return 'Có vẻ ngang tài ngang sức.';
    if (k > 0.6) return 'Khí thế đối phương khiến ngươi chột dạ.';
    return 'Ngươi cảm thấy tử khí lạnh sống lưng.';
  }
  fight(foeName, foePow, mul = 1) {
    const res = this.clash(this.playerPower() * mul, foePow);
    const lines = res.rounds.map((w, i) => {
      const mv = this.r.pick(MOVES);
      return w
        ? `Hiệp ${i + 1}: ngươi tung ${mv}, ${foeName} lảo đảo lùi lại.`
        : `Hiệp ${i + 1}: ${mv} của ngươi bị hóa giải, ${foeName} phản đòn trúng ngực.`;
    });
    return { win: res.win, text: lines.join('\n') };
  }
  fightBot(b, mul = 1) {
    return this.fight(b.name, this.power(b), mul);
  }
  hurt(n, cause) {
    const P = this.P;
    P.hp = Math.max(0, P.hp - Math.round(n * this.tmul('hurtMul')));
    if (P.hp <= 0) {
      this.die(cause || 'trọng thương không qua khỏi');
      return true;
    }
    return false;
  }
  joinSect(sc) {
    this.P.sect = sc.id;
    this.P.dao = true;
  }
  /** Việc thực tế năm nay (có thể khác lựa chọn nếu chưa đủ điều kiện) */
  effectiveAction() {
    const P = this.P;
    if (P.closed > 0) return 'be_quan';
    if (P.age < 6) return 'lon_len';
    const ok = (id) => {
      const a = ACTIONS[id];
      return P.age >= a.minAge && (!a.needDao || P.dao);
    };
    return ok(P.action) ? P.action : 'lon_len';
  }
  actionOk(id) {
    const P = this.P;
    const a = ACTIONS[id];
    return P.age >= a.minAge && (!a.needDao || P.dao);
  }
  setAction(id) {
    if (this.playing && ACTIONS[id]) this.P.action = id;
  }
  closeDoor(years) {
    const P = this.P;
    if (!this.playing || !P.dao || P.age < 12 || P.tuvi >= this.need()) return false;
    P.closed = years;
    this.log(`Ngươi phong bế động phủ, bế quan ${years} năm.`, 'muted');
    return true;
  }
  pillPrice(id) {
    return PILLS[id].price * (1 + this.P.realm);
  }
  buy(id) {
    const price = this.pillPrice(id);
    if (!this.playing || this.P.money < price) return false;
    this.money(-price);
    this.P.pills[id] = (this.P.pills[id] || 0) + 1;
    return true;
  }
  usePill(id) {
    const P = this.P;
    if (!this.playing || !(P.pills[id] > 0)) return null;
    if (id === 'pha_canh') return 'Phá Cảnh Đan được dùng khi đột phá.';
    if (id === 'dien_tho' && P.dienTho[P.realm]) return 'Thân thể đã kháng thuốc, ở cảnh giới này không hấp thu thêm được.';
    P.pills[id]--;
    if (id === 'hoi_xuan') { P.hp = Math.min(100, P.hp + 40); return 'Sinh lực hồi phục.'; }
    if (id === 'tinh_tam') { this.stat('tam', 6); return 'Tâm tính +6.'; }
    if (id === 'dien_tho') {
      P.dienTho[P.realm] = true;
      P.lifeBonus += 0.05;
      return `Thọ nguyên tăng lên ${this.lifespan()}.`;
    }
    return null;
  }
  canBreak() {
    return this.playing && this.P.dao && this.P.tuvi >= this.need() && !this.s.pending;
  }
  openBreak() {
    if (this.canBreak()) this.s.pending = { id: 'dot_pha', botId: null, data: {} };
  }
  breakHelpers() {
    const P = this.P;
    if (P.tinh < 30) return [];
    return this.known().filter(({ b, r }) => r.v >= 50 && b.realm >= P.realm).slice(0, 4);
  }
  breakChance(bonus = 0) {
    const P = this.P;
    const st = P.stats;
    let p = REALMS[P.realm].brk + (st.ngo - 50) / 250 + (st.tam - 50) / 300 + (st.co - 50) / 400 + bonus;
    p += this.breakHelpers().length * 0.04;
    if (P.tinh <= -30) p += 0.06;
    p += this.tadd('brk');
    return clamp(p, 0.05, 0.95);
  }
  attemptBreak(bonus = 0) {
    const P = this.P;
    if (!this.playing || P.tuvi < this.need()) return '';
    const p = this.breakChance(bonus);
    const helpers = this.breakHelpers();
    const helpTxt = helpers.length ? `\n${helpers.map(({ b }) => b.name).join(', ')} hộ pháp bên ngoài động phủ.` : '';
    const lightning = P.realm >= 2 ? 'Mây đen kéo tới, lôi kiếp giáng xuống từng đạo một. ' : '';
    P.flags.notifiedFull = false;
    if (this.r.chance(p)) {
      if (P.realm === TOP_REALM) {
        P.ascended = true;
        this.die('vượt qua cửu trùng lôi kiếp, phi thăng thượng giới');
        return `${lightning}Đạo lôi cuối cùng tan vào thân thể ngươi. Một cột sáng từ trời rủ xuống.${helpTxt}\n\nNgươi phi thăng.`;
      }
      P.realm++;
      P.tuvi = 0;
      this.fame(P.realm * 3);
      const ob = this.tadd('ngoOnBreak');
      if (ob) this.stat('ngo', ob);
      this.log(`Đột phá thành công! Ngươi đã là tu sĩ ${REALMS[P.realm].n}. Thọ nguyên ${this.lifespan()}.`, 'big');
      if (P.realm >= 3) this.chron(`${P.name} đột phá ${REALMS[P.realm].n}.`, 2);
      return `${lightning}Bình cảnh vỡ tan như băng mùa xuân.${helpTxt}\n\nNgươi đã bước vào ${REALMS[P.realm].n}. Thọ nguyên tăng lên ${this.lifespan()} năm.`;
    }
    P.tuvi = Math.floor(P.tuvi * 0.7);
    const dmg = 10 + P.realm * 5;
    const deathP = P.realm >= 3 ? clamp(0.05 + P.realm * 0.015 - (P.stats.tam - 50) / 1000, 0.01, 0.3) : 0;
    this.log('Đột phá thất bại, tu vi tụt lùi.', 'bad');
    if (this.r.chance(deathP)) {
      this.die(P.realm === TOP_REALM ? 'tan biến dưới cửu trùng lôi kiếp' : 'đột phá thất bại, kinh mạch đứt đoạn');
      return `${lightning}Linh khí chạy ngược, kinh mạch nổ tung từng đoạn.${helpTxt}`;
    }
    const dead = this.hurt(dmg, 'đột phá thất bại, thương thế quá nặng');
    return `${lightning}Linh khí chạy ngược, ngươi phun ra một ngụm máu.${helpTxt}\n\nĐột phá thất bại. Tu vi tụt còn 70%, sinh lực -${dmg}.${dead ? '' : ' Lần sau hãy chuẩn bị kỹ hơn.'}`;
  }

  // ---------- Vòng năm ----------
  /** Trôi một năm. Trả về false nếu không trôi được (đang có sự kiện, đã chết...). */
  tick() {
    if (!this.playing || this.s.pending) return false;
    const P = this.P;
    this.worldYear();
    P.age++;
    const act = this.effectiveAction();
    if (P.flags.autoDao && P.age >= 6 && !P.dao) {
      P.dao = true;
      this.log('Sáu tuổi, những khẩu quyết mơ hồ trong giấc mơ bỗng rõ ràng từng chữ. Ngươi tự nhập đạo.', 'good');
    }
    const g = this.gain();
    if (act === 'tu_luyen') this.addTuvi(g * this.r.range(0.85, 1.15));
    else if (act === 'be_quan') this.addTuvi(g * 1.6);
    else if (act === 'lich_luyen') {
      this.addTuvi(g * 0.35);
      if (this.r.chance(0.15)) this.stat('co', 1);
    } else if (act === 'muu_sinh') {
      const m = Math.round(15 * (1 + P.realm * 1.5) * this.r.range(0.7, 1.3) * (1 + (P.stats.co - 50) / 200) * this.tmul('moneyMul'));
      this.money(m);
      this.addTuvi(g * 0.25);
    } else if (act === 'ket_giao') {
      this.addTuvi(g * 0.25);
      this.meetBot();
    } else if (act === 'lon_len' && P.age >= 6 && this.r.chance(0.2)) {
      this.stat(this.r.pick(['can', 'ngo', 'tam', 'co']), 1);
    }
    P.hp = Math.min(100, P.hp + (act === 'be_quan' ? 6 : 4) * this.tmul('regenMul'));
    if (this.thas('coldPoison') && P.age >= 8 && this.r.chance(0.04) && !this.known().some(({ r }) => r.tag === 'dao_lu')) {
      this.log('Hàn độc Cửu Âm phát tác, cả người lạnh như băng.', 'bad');
      if (this.hurt(12, 'hàn độc Cửu Âm phát tác, đông cứng mà chết')) return true;
    }

    if (P.age >= this.lifespan()) {
      this.die('thọ nguyên cạn kiệt, tọa hóa');
      return true;
    }
    if (P.closed > 0) {
      P.closed--;
      if (this.r.chance(0.03) && this.hurt(15, 'tẩu hỏa nhập ma trong lúc bế quan')) return true;
      if (P.closed === 0) this.log('Ngươi xuất quan.', 'muted');
    }
    if (P.dao && P.tuvi >= this.need() && !P.flags.notifiedFull) {
      P.flags.notifiedFull = true;
      if (P.closed > 0) {
        P.closed = 0;
        this.log('Tu vi viên mãn, ngươi phá quan đi ra.', 'muted');
      }
      this.s.queue.push({ id: 'dot_pha', botId: null, data: {} });
    }
    this.nextEvent(act);
    return true;
  }
  nextEvent(act, queueOnly = false) {
    const s = this.s;
    while (s.queue.length && !s.pending) {
      const q = s.queue.shift();
      const ev = EVENT_MAP[q.id];
      if (!ev) continue;
      if (q.botId && !(this.soul(q.botId) || {}).alive) continue;
      s.pending = q;
      return;
    }
    if (s.pending || queueOnly) return;
    const rate = EVENT_RATE[act] ?? 0.25;
    if (!this.r.chance(rate)) return;
    const P = this.P;
    const cands = [];
    for (const e of EVENTS) {
      if (e.queued) continue;
      if (act === 'be_quan' && !e.inClosed) continue;
      if (e.once && s.once[e.id]) continue;
      if (s.cd[e.id] !== undefined && P.age - s.cd[e.id] < (e.cd ?? 8)) continue;
      if (e.when && !e.when(this)) continue;
      const bot = e.bot ? e.bot(this) : null;
      if (e.bot && !bot) continue;
      const data = e.prep ? e.prep(this, bot) : {};
      if (e.prep && !data) continue;
      let w = typeof e.w === 'function' ? e.w(this) : e.w ?? 1;
      if (e.acts && e.acts.includes(act)) w *= 3;
      w *= this.tevW(e.id);
      cands.push({ e, bot, data, w });
    }
    const pick = this.r.weighted(cands, (c) => c.w);
    if (!pick) return;
    s.cd[pick.e.id] = P.age;
    if (pick.e.once) s.once[pick.e.id] = true;
    s.pending = { id: pick.e.id, botId: pick.bot ? pick.bot.id : null, data: pick.data };
  }
  ctx(p = this.s.pending) {
    return { bot: p && p.botId ? this.soul(p.botId) : null, data: (p && p.data) || {} };
  }
  eventView() {
    const p = this.s.pending;
    if (!p) return null;
    const ev = EVENT_MAP[p.id];
    const c = this.ctx(p);
    if (p.result !== undefined) return { title: ev.title, text: p.result, done: true };
    const choices = ev.choices(this, c).filter((x) => x.if !== false);
    return { title: typeof ev.title === 'function' ? ev.title(this, c) : ev.title, text: ev.text(this, c), choices: choices.map((x) => x.t) };
  }
  choose(idx) {
    const p = this.s.pending;
    if (!p || p.result !== undefined) return;
    const ev = EVENT_MAP[p.id];
    const c = this.ctx(p);
    const choices = ev.choices(this, c).filter((x) => x.if !== false);
    const ch = choices[idx];
    if (!ch) return;
    let res = ch.go(this, c) || '';
    if (this.s.phase === 'dead') res += `\n\n${this.P.name} ngã xuống, hưởng thọ ${this.P.age} tuổi.`;
    p.result = res;
    const first = res.split('\n').filter(Boolean).pop();
    if (this.P && first) this.log(`${ev.title}: ${first}`, 'event');
  }
  dismiss() {
    const p = this.s.pending;
    if (!p || p.result === undefined) return;
    this.s.pending = null;
    if (this.playing) this.nextEvent(null, true);
  }

  // ---------- Chết và luân hồi ----------
  die(cause) {
    if (!this.playing) return;
    const P = this.P;
    this.s.phase = 'dead';
    P.cause = cause;
    P.closed = 0;
    const sc = P.sect ? this.sect(P.sect) : null;
    const rec = {
      no: P.lifeNo, name: P.name, age: P.age, realm: P.realm, cause, tinh: P.tinh,
      sect: sc ? sc.name : null, root: P.root.n, year: this.s.year, asc: !!P.ascended, fame: P.fame,
      friends: this.closeFriends().length,
    };
    this.s.lives.push(rec);
    if (P.realm >= 3 || P.ascended) this.chron(`${P.name} (${REALMS[P.realm].n}) ${cause}.`, 2);
    for (const id in this.s.rel) {
      const r = this.s.rel[id];
      const b = this.soul(+id);
      if (b && b.alive && r.met && (Math.abs(r.v) >= 20 || r.tag)) {
        r.cn = { name: P.name, tag: r.tag, v: r.v, life: P.lifeNo, year: this.s.year };
      } else r.cn = null;
      r.v = 0;
      r.tag = null;
      r.met = false;
    }
    const hasBond = this.s.souls.some((b) => b.alive && this.s.rel[b.id] && this.s.rel[b.id].cn && this.s.rel[b.id].cn.v > 0);
    const pool = LEGACIES.filter((l) => l.id !== 'duyen' || hasBond).filter((l) => l.id !== 'tai_san' || P.money >= 20).filter((l) => l.id !== 'huyet_mach' || (P.the && P.the !== 'pham'));
    const opts = [];
    while (opts.length < 3 && pool.length) opts.push(pool.splice(this.r.int(0, pool.length - 1), 1)[0].id);
    this.s.deadInfo = { rec, options: opts, money: P.money, the: P.the };
  }
  chooseLegacy(id) {
    if (this.s.phase !== 'dead' || !this.s.deadInfo.options.includes(id)) return;
    this.s.legacy = { id, money: id === 'tai_san' ? Math.min(500, Math.floor(this.s.deadInfo.money / 2)) : 0, the: id === 'huyet_mach' ? this.s.deadInfo.the : null };
    this.s.pending = null;
    this.s.queue = [];
    this.s.player = null;
    const gap = this.r.int(5, 20);
    for (let i = 0; i < gap; i++) this.worldYear();
    this.s.rerolls = 3;
    this.s.deadInfo = null;
    this.s.phase = 'birth';
    this.rollDraft();
  }

  // ---------- Bảng xếp hạng ----------
  ranking(n = 15) {
    const list = this.s.souls
      .filter((b) => b.alive && b.dao)
      .map((b) => ({ name: b.name, realm: b.realm, prog: b.tuvi / REALMS[b.realm].need, sect: b.sect, id: b.id, me: false, age: b.age }));
    if (this.playing && this.P.dao) {
      const P = this.P;
      list.push({ name: P.name, realm: P.realm, prog: P.tuvi / this.need(), sect: P.sect, id: 0, me: true, age: P.age });
    }
    return list.sort((a, b) => b.realm - a.realm || b.prog - a.prog).slice(0, n);
  }
}

export { REALMS, TOP_REALM, ACTIONS, PILLS, LEGACIES, TAG_NAMES, THE_MAP, TP_MAP };
