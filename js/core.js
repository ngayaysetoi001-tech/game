// Lõi game: thế giới bot tự sống + một kiếp của người chơi.
// Không đụng tới DOM, chạy được cả trong Node (tools/sim.mjs).
import { Rng } from './rng.js';
import {
  REALMS, TOP_REALM, baseGain, ROOTS, ORIGINS, PERSONALITIES, PERS_KEYS,
  SURNAMES, NAMES_M, NAMES_F, SECT_A, SECT_B, SECT_COLORS, MONSTERS, MOVES,
  ACTIONS, PILLS, LEGACIES, TAG_NAMES, THE_CHAT, THIEN_PHU, TP_WEIGHT,
  DH_A, DH_B, DH_HON, DH_HON_NU, DH_HON_MA, TITLES, PATHS, MAPS, MAP_MAP, DEFAULT_MAP, MATS,
} from './data.js';

const TITLE_MAP = Object.fromEntries(TITLES.map((t) => [t.id, t]));
// Đài Luân Hồi: giá thể chất cộng thêm theo phẩm, giá gieo lại thể chất theo phẩm bảo đảm
export const HL_PRICE = [0, 20, 60, 180, 500];
export const HL_REROLL = { 0: 5, 2: 40, 3: 150 };
// giới hạn cộng dồn từ thể chất
const THE_CAP_MUL = { gainMul: 1.8, fightMul: 1.7 };
const THE_CAP_ADD = { brk: 0.15 };

const THE_MAP = Object.fromEntries(THE_CHAT.map((t) => [t.id, t]));
const TP_MAP = Object.fromEntries(THIEN_PHU.map((t) => [t.id, t]));
import { EVENTS, EVENT_MAP } from './events.js';
import { SKILLS, SKILL_IDS, BEAST_SKILLS, fighter, battle, turnText } from './combat.js';
import { makeItem, gearStats, itemScore, QUALITY, THAN_THONG, TT_MAP, isSealed, rollQuality, itemVal, itemName, PLUS_MAX, AFFIX } from './items.js';
import { botSeed } from './sprite.js';
import { armorColor, itemToken, iconToken, matIconOpts } from './icons.js';

// đối thủ coi như có sẵn trang bị (trừ hạng phàm nhân)
const enemyGear = (realm) => (realm <= 0 ? 1 : 1.2);
const BAG_MAX = 16;
const WEP_KEYS = ['kiem', 'dao', 'thuong', 'quat'];
const WEP_N = { kiem: 'Kiếm', dao: 'Đao', thuong: 'Thương', quat: 'Phiến' };
// kỳ ngộ chịu ảnh hưởng của độ khó vùng lịch luyện
const MAP_RARE_EV = new Set(['hang_dong', 'truyen_thua', 'co_mo', 'kiem_trung', 'bi_canh', 'linh_mach', 'yeu_vuong', 'ban_do', 'trung_la', 'bao_vat', 'linh_thu', 'ngoc_gian']);
const MAP_FIGHT_EV = new Set(['khieu_chien', 'huyet_tran', 'bat_coc', 'ma_tu_tra_thu']);
export const matToken = (k) => iconToken(matIconOpts(k, MATS[k]));
// Bot đi lịch luyện: tỉ lệ ra ngoài và mức tỉ lệ thắng tối thiểu chấp nhận được, theo tính cách
const BOT_OUT = { cuong: 0.7, tham: 0.7, muu: 0.5, nghia: 0.55, hien: 0.35, an: 0.3 };
const BOT_RISK = { cuong: 0.35, tham: 0.45, muu: 0.6, nghia: 0.55, hien: 0.7, an: 0.8 };
// trang bị tốt nhất bot đang mang (phẩm) cộng vào sức mạnh
const BOT_GQ_MUL = [1, 1.04, 1.08, 1.14, 1.3];

export const SAVE_VERSION = 1;
export const SOUL_COUNT = 40;
const PREWARM_YEARS = 250;
const MAX_SECTS = 7;
const CLOSE_TAGS = ['huynh_de', 'dao_lu', 'su_phu', 'de_tu'];

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const pct = (p) => Math.round(p * 100) + '%';

// Xác suất có sự kiện mỗi năm theo việc đang làm
const EVENT_RATE = { lon_len: 0.3, tu_luyen: 0.16, lich_luyen: 0.55, muu_sinh: 0.26, ket_giao: 0.26, be_quan: 0.03 };

export class Game {
  constructor(state) {
    this.s = state;
    this.r = new Rng(state.rng);
    if (state.player) this.ensureGear(state.player);
    if (state.draft) this.ensureGear(state.draft);
    if (!state.nextItem) state.nextItem = 1;
    if (!state.opt) state.opt = { retreat: true, autoSalvage: false };
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
      skill: this.r.pick(SKILL_IDS.filter((k) => SKILLS[k].tier >= 1 && SKILLS[k].tier <= 2)),
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
    b.map = null; b.mapUntil = 0; b.gq = 0; b.tt = null;
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
    return R.pow * (1 + (b.tuvi / R.need) * 0.5) * (0.85 + b.rootM * 0.15) * (t.fx.fightMul || 1) * BOT_GQ_MUL[b.gq || 0];
  }
  /** Bot tự ước lượng tỉ lệ thắng yêu thú của một vùng (cùng đường cong với người chơi trung bình) */
  botOdds(b, map) {
    const R = REALMS[b.realm];
    const t = THE_MAP[b.the] || THE_MAP.pham;
    const k = (1 + (b.tuvi / R.need) * 0.3) * (0.85 + b.rootM * 0.15) * (t.fx.fightMul || 1) * BOT_GQ_MUL[b.gq || 0];
    const x = map.pow / k;
    return 1 / (1 + Math.exp((x - 1.38) / 0.17));
  }
  /** Bot chọn vùng lịch luyện như người chơi: kẻ liều vào vùng khó, người cẩn trọng ở vùng dễ hoặc ở nhà tu luyện */
  botPickMap(b) {
    b.mapUntil = this.s.year + this.r.int(3, 8);
    if (!b.dao || b.age < 10 || !this.r.chance(BOT_OUT[b.pers] ?? 0.5)) { b.map = null; return; }
    const thr = (BOT_RISK[b.pers] ?? 0.55) + this.r.range(-0.1, 0.1);
    let best = MAPS[0];
    for (const m of MAPS) if (this.botOdds(b, m) >= thr) best = m;
    // đôi khi chọn thấp hơn một bậc cho chắc
    if (best.d > 0 && this.r.chance(0.3)) best = MAPS[best.d - 1];
    b.map = best.id;
  }
  /** Một năm lịch luyện của bot: đánh yêu thú, nhặt đồ, có thể bỏ mạng */
  botMapYear(b) {
    const map = MAP_MAP[b.map];
    if (!map) { b.map = null; return false; }
    const odds = this.botOdds(b, map);
    const nE = (this.r.chance(0.35 + 0.05 * map.d) ? 1 : 0) + (map.d >= 3 && this.r.chance(0.2) ? 1 : 0);
    for (let i = 0; i < nE; i++) {
      if (this.r.chance(odds)) {
        b.tuvi = Math.min(REALMS[b.realm].need, b.tuvi + this.botGain(b) * map.loot);
        b.fame += map.d >= 3 ? 1 : 0;
        if (this.r.chance(Math.min(0.6, 0.15 * map.loot))) {
          const q = rollQuality(this.r, map.loot, map.myth);
          if (q > (b.gq || 0)) {
            b.gq = q;
            if (q >= 4) {
              const slot = this.r.pick(['vu_khi', 'ao', 'phu_kien']);
              b.tt = this.r.pick(THAN_THONG[slot]).id;
              this.chron(`${this.nm(b)} lịch luyện ở ${map.n}, đoạt được thần khí mang thần thông 「${TT_MAP[b.tt].n}」.`, 2);
            }
          }
        }
      } else {
        const pd = 0.35 * map.lethal * 0.18 * (b.age < 16 ? 0.3 : 1);
        if (this.r.chance(pd)) { this.botDie(b, `bỏ mạng dưới nanh yêu thú ở ${map.n}`); return true; }
        // bị thương thì về nhà dưỡng
        b.map = null;
        b.mapUntil = this.s.year + this.r.int(2, 5);
        return false;
      }
    }
    if (map.haz && this.r.chance(map.haz[0] * 0.03)) { this.botDie(b, map.haz[3]); return true; }
    return false;
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
    if (!b.dao && (b.age === 6 ? this.r.chance(0.9) : b.age > 6 && b.age <= 25 && this.r.chance(0.12))) b.dao = true;
    if (b.dao && !b.sect && b.age >= 8 && b.age <= 16 && this.r.chance(0.13)) this.botJoinSect(b);
    if (b.dao && b.age >= 10 && this.s.year >= (b.mapUntil || 0)) this.botPickMap(b);
    if (b.dao) {
      const R = REALMS[b.realm];
      // đang lịch luyện thì tu chậm hơn, bù lại bằng tu vi khi thắng yêu thú
      const mp = b.map ? MAP_MAP[b.map] : null;
      b.tuvi = Math.min(R.need, b.tuvi + this.botGain(b) * (mp ? 0.6 * Math.sqrt(mp.loot) : 1));
      if (mp && this.botMapYear(b)) return;
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
    // hiểm nguy khi lịch luyện đã tính riêng ở vùng; ở nhà vẫn có lúc gặp nạn
    if (!b.map && this.r.chance(0.003 + (b.pers === 'cuong' ? 0.003 : 0))) return this.botDie(b, 'gặp nạn giữa đường');
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
    const mp = this.playing ? this.curMap() : null;
    return this.r.weighted(list, (b) => (this.s.rel[b.id] && this.s.rel[b.id].met ? metW : 1) * (mp && b.map === mp.id ? 3 : 1));
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
    const out = [THE_MAP[P.the] || THE_MAP.pham, ...(P.the2 && THE_MAP[P.the2] ? [THE_MAP[P.the2]] : []), ...(P.tps || []).map((id) => TP_MAP[id]).filter(Boolean)];
    if (P.path && PATHS[P.path]) out.push({ n: PATHS[P.path].n, path: true, fx: PATHS[P.path].fx });
    if (P.title && TITLE_MAP[P.title]) out.push(TITLE_MAP[P.title]);
    // thần thông của đồ Thần thoại đang mặc (trùng thì chỉ tính một)
    const seen = new Set();
    for (const it of Object.values(P.eq || {})) {
      const tt = it && it.tt && TT_MAP[it.tt];
      if (tt && tt.fx && !seen.has(tt.id) && !isSealed(it, P.realm)) { seen.add(tt.id); out.push({ n: tt.n, tt: true, fx: tt.fx }); }
    }
    return out;
  }
  tmul(k) {
    // phần đến từ thể chất (có tối đa hai thể chất) bị giới hạn để không cộng dồn quá mức
    let th = 1, other = 1;
    for (const t of this.traits()) { const v = t.fx[k] ?? 1; if (t.w !== undefined) th *= v; else other *= v; }
    if (THE_CAP_MUL[k]) th = Math.min(th, THE_CAP_MUL[k]);
    return th * other;
  }
  tadd(k) {
    let th = 0, other = 0;
    for (const t of this.traits()) { const v = typeof t.fx[k] === 'number' ? t.fx[k] : 0; if (t.w !== undefined) th += v; else other += v; }
    if (THE_CAP_ADD[k] !== undefined) th = Math.min(th, THE_CAP_ADD[k]);
    return th + other;
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
    const tl = tps.map((id) => TP_MAP[id]);
    for (const t of tl) for (const k of ['can', 'ngo', 'tam', 'co']) if (t.fx[k]) st[k] += t.fx[k];
    const tinh0 = tl.reduce((m, t) => m + (t.fx.tinh || 0), 0);
    // chỉ số gốc chưa tính thể chất, để đổi thể chất ở Đài Luân Hồi không bị cộng lệch
    const baseStats = { ...st };
    const prev2 = this.s.draft && this.s.draft.the2;
    const P = {
      the, tps, the2: null, baseStats, baseTinh: tinh0,
      name: this.genName(gender), g: gender, origin: o.id, originN: o.n, root, stats: st,
      hp: 100, age: 0, realm: 0, tuvi: 0, dao: false, sect: null,
      money: (o.fx.money || 0) + (leg === 'tai_san' ? this.s.legacy.money : 0),
      fight: (o.fx.fight || 0) + (leg === 'kiem_y' ? 0.2 : 0),
      tinh: tinh0, action: 'tu_luyen', closed: 0, pills: {}, dienTho: {}, lifeBonus: 0,
      fame: 0, lifeNo: this.s.lives.length + 1, flags: {}, legacy: leg, born: null,
      look: this.r.int(0, 1e6),
    };
    if (leg === 'ky_uc') P.flags.autoDao = true;
    this.ensureGear(P);
    if (o.id === 'ren') {
      const it = makeItem(this.r, this.s.nextItem++, 0, 1, 'vu_khi');
      it.wt = 'kiem'; it.n = 'Thiết Kiếm của cha';
      P.eq.vu_khi = it;
    }
    // thần khí tìm về chủ cũ
    if (leg === 'than_khi' && this.s.legacy.item) {
      const it = { ...this.s.legacy.item };
      if (P.eq[it.slot]) P.bag.push(P.eq[it.slot]);
      P.eq[it.slot] = it;
      P.flags.thanKhi = it.n;
    }
    this.s.draft = P;
    // giữ thể chất cộng thêm đã mua khi gieo lại lá số (trùng thể chất chính thì hoàn Hồn Lực)
    if (prev2) { if (prev2 !== the) P.the2 = prev2; else this.s.honLuc = (this.s.honLuc || 0) + HL_PRICE[THE_MAP[prev2].tier]; }
    this.applyThe(P);
  }
  /** Tính lại chỉ số từ chỉ số gốc + thể chất chính + thể chất cộng thêm */
  applyThe(P) {
    const ts = [THE_MAP[P.the] || THE_MAP.pham, P.the2 ? THE_MAP[P.the2] : null].filter(Boolean);
    const st = { ...(P.baseStats || P.stats) };
    for (const t of ts) for (const k of ['can', 'ngo', 'tam', 'co']) if (t.fx[k]) st[k] += t.fx[k];
    for (const k in st) st[k] = clamp(st[k], 0, 100);
    P.stats = st;
    P.tinh = clamp((P.baseTinh || 0) + ts.reduce((m, t) => m + (t.fx.tinh || 0), 0), -100, 100);
  }

  // ---------- Hồn Lực, Đài Luân Hồi ----------
  /** Thể chất cộng thêm: chỉ chọn được thể chất đã từng thức tỉnh, khác thể chất chính */
  buyThe2(id) {
    const P = this.s.draft;
    const t = THE_MAP[id];
    if (this.s.phase !== 'birth' || !P || !t || !t.tier || id === P.the || !(this.s.seenThe || []).includes(id)) return false;
    const refund = P.the2 ? HL_PRICE[THE_MAP[P.the2].tier] : 0;
    const cost = HL_PRICE[t.tier];
    if ((this.s.honLuc || 0) + refund < cost) return false;
    this.s.honLuc = (this.s.honLuc || 0) + refund - cost;
    P.the2 = id;
    this.applyThe(P);
    return true;
  }
  dropThe2() {
    const P = this.s.draft;
    if (this.s.phase !== 'birth' || !P || !P.the2) return;
    this.s.honLuc = (this.s.honLuc || 0) + HL_PRICE[THE_MAP[P.the2].tier];
    P.the2 = null;
    this.applyThe(P);
  }
  /** Gieo lại riêng thể chất chính. minTier: bảo đảm phẩm từ mức đó trở lên */
  rerollThe(minTier = 0) {
    const P = this.s.draft;
    const cost = HL_REROLL[minTier];
    if (this.s.phase !== 'birth' || !P || cost === undefined || (this.s.honLuc || 0) < cost) return false;
    this.s.honLuc -= cost;
    let id;
    do { id = this.r.weighted(THE_CHAT.filter((t) => t.tier >= minTier), (t) => t.w).id; } while (id === P.the2);
    P.the = id;
    this.applyThe(P);
    return true;
  }
  /** Tính Hồn Lực nhận được khi một kiếp kết thúc */
  honLucGain(P) {
    const lines = [];
    const add = (n, t) => { if (n > 0) lines.push({ n, t }); };
    add([0, 2, 5, 10, 18, 30, 45, 65][P.realm] || 0, `Đạt ${REALMS[P.realm].n}`);
    add(Math.floor(P.age / 50), `Sống ${P.age} năm`);
    const tt = (P.titles || []).reduce((m, id) => m + ([0, 1, 2, 4, 8][TITLE_MAP[id].tier] || 0), 0);
    add(tt, `${(P.titles || []).length} danh hiệu`);
    add((P.flags.newCodex || 0) * 3, `${P.flags.newCodex || 0} mục mới trong Sổ`);
    // kỷ lục so với các kiếp trước (kiếp vừa chết đã được ghi vào cuối sổ)
    const prev = this.s.lives.slice(0, -1);
    const best = this.s.bestRealm ?? (prev.length ? Math.max(...prev.map((l) => l.realm)) : -1);
    if (prev.length && P.realm > best) add(10, 'Phá kỷ lục cảnh giới của linh hồn');
    if (P.ascended) add(80, 'Phi thăng');
    return { total: lines.reduce((m, x) => m + x.n, 0), lines };
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
    if (!this.s.seenThe) this.s.seenThe = [];
    if (!this.s.seenThe.includes(P.the)) { this.s.seenThe.push(P.the); if (THE_MAP[P.the].tier) P.flags.newCodex = (P.flags.newCodex || 0) + 1; }
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
    if (P.flags.thanKhi) this.log(`Thần khí ${P.flags.thanKhi} vượt qua luân hồi, tìm về bên ngươi. Đủ cảnh giới mới giải được phong ấn.`, 'big');
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
    return baseGain(P.realm) * P.root.m * (1 + (P.stats.ngo - 50) / 200) * (P.sect ? 1.2 : 1) * (P.tinh <= -30 ? 1.2 : 1) * (P.hp < 30 ? 0.6 : 1) * this.tmul('gainMul') * (P.realm <= 2 ? this.tmul('earlyGain') : P.realm >= 4 ? this.tmul('lateGain') : 1);
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
    return { n: m.n, pow: REALMS[r].pow * this.r.range(0.75, 1.25), beast: true, r, seed: this.r.int(1, 1e6) };
  }
  hint(foePow) {
    const k = this.playerPower() / foePow;
    if (k > 1.5) return 'Trông không đáng ngại.';
    if (k > 0.9) return 'Có vẻ ngang tài ngang sức.';
    if (k > 0.6) return 'Khí thế đối phương khiến ngươi chột dạ.';
    return 'Ngươi cảm thấy tử khí lạnh sống lưng.';
  }
  // ---------- Chiến đấu ----------
  /** Sức mạnh gốc (chưa tính trang bị, sinh lực) */
  basePower() {
    const P = this.P;
    const R = REALMS[P.realm];
    return R.pow * (1 + (P.tuvi / R.need) * 0.5) * (1 + (P.stats.can - 50) / 200) * (1 + P.fight) * (P.flags.pet ? (P.path === 'ngu_thu' ? 1.15 : 1.1) : 1) * this.tmul('fightMul');
  }
  /** Sức mạnh quy đổi gồm trang bị, dùng để so với đối thủ */
  rating() {
    const bp = this.basePower();
    const gs = gearStats(this.P.eq || {}, this.P.realm);
    return bp * Math.sqrt((1 + gs.atk / (10 * bp)) * (1 + (gs.hp + gs.def * 15) / (60 * bp)));
  }
  playerPower() {
    return this.rating() * (0.5 + this.P.hp / 200);
  }
  hint(foePow) {
    const k = this.playerPower() / (foePow * enemyGear(this.P.realm));
    if (k > 1.5) return 'Trông không đáng ngại.';
    if (k > 0.9) return 'Có vẻ ngang tài ngang sức.';
    if (k > 0.6) return 'Khí thế đối phương khiến ngươi chột dạ.';
    return 'Ngươi cảm thấy tử khí lạnh sống lưng.';
  }
  playerFighter(mul = 1) {
    const P = this.P;
    const w = P.eq && P.eq.vu_khi;
    return fighter({
      name: P.name, pw: this.basePower() * mul, hpPct: P.hp / 100,
      skills: P.loadout, wep: w ? w.wt : null, tactic: P.tactic, gear: gearStats(P.eq || {}, P.realm), pm: P.path && PATHS[P.path] ? PATHS[P.path].pm : null,
      spd: (P.stats.co - 50) / 25,
      look: { type: 'human', seed: P.look, g: P.g, age: P.age, life: this.lifespan(), realm: P.realm, robe: P.eq && P.eq.ao ? armorColor(P.eq.ao) : P.sect ? (this.sect(P.sect) || {}).color : null, wep: w ? w.wt : null },
    });
  }
  botWep(b) {
    return WEP_KEYS[botSeed(b) % 4];
  }
  botSkills(b) {
    const r = new Rng(botSeed(b) ^ 0x9e3779b9);
    const wep = this.botWep(b);
    const out = [];
    const m = SKILL_IDS.filter((k) => SKILLS[k].wep === wep && SKILLS[k].tier === 1);
    if (b.realm >= 1 && m.length) out.push(r.pick(m));
    const maxT = Math.min(3, 1 + Math.floor(b.realm / 2));
    if (b.realm >= 2) out.push(r.pick(SKILL_IDS.filter((k) => SKILLS[k].kind === 'atk' && !SKILLS[k].path && SKILLS[k].tier >= 1 && SKILLS[k].tier <= maxT && (!SKILLS[k].wep || SKILLS[k].wep === wep))));
    if (b.realm >= 4) out.push(r.pick(['huyen_vu', 'hoi_nguyen']));
    out.push('quyen');
    return [...new Set(out)];
  }
  /** Ghi trận đấu để giao diện diễn lại, trả về kết quả gọn cho sự kiện */
  /**
   * Chạy trận, ghi lại để diễn. Thua thì có thể mất mạng:
   * nguy hiểm theo loại đối thủ (lethal), độ chênh sức mạnh, thua gục hay chỉ hết giờ, tuổi, cơ duyên.
   */
  runBattle(A, B, opts = {}) {
    const res = battle(A, B, this.r);
    const P = this.P;
    const hp0 = P.hp;
    if (res.win) P.cnt.win++; else P.cnt.lose++;
    // thắng thì chỉ mang về 60% vết thương trong trận
    if (res.win) P.hp = Math.max(5, Math.min(P.hp, Math.round(hp0 - (hp0 - res.aHpPct * 100) * 0.6)));
    const lines = [];
    const key = res.turns.filter((t) => t.skill && t.skill !== 'quyen' && t.skill !== 'can_xe').slice(-2);
    for (const t of key) lines.push(turnText(t, 'Ngươi', B.name));
    const last = res.turns[res.turns.length - 1];
    let head = `Giao đấu ${res.rounds} hiệp.`;
    if (last && last.skill && (last.bHp <= 0 || last.aHp <= 0)) head += ` Đòn kết thúc: ${last.skillN}.`;
    const wt = this.tadd('winTuvi');
    if (res.win && wt && P.dao) {
      const t = this.addTuvi(this.gain() * wt);
      if (t) lines.push(`Sát ý sau trận hóa thành tu vi: +${t}.`);
    }
    if (res.win && hp0 > P.hp) lines.push(`Sinh lực còn ${P.hp}.`);
    let died = false;
    if (!res.win) {
      const knocked = res.aHpPct <= 0;
      const pd = this.deathChance(B.maxHp / A.maxHp, opts.lethal ?? 0.15, knocked);
      if (this.r.chance(pd)) {
        died = true;
        lines.push(knocked ? 'Đòn cuối cùng giáng xuống. Ngươi không gượng dậy được nữa.' : 'Ngươi kiệt sức, đối phương không tha.');
        this.die(opts.cause || `chết dưới tay ${B.name}`);
      } else {
        P.hp = Math.max(1, Math.min(P.hp, this.r.int(4, knocked ? 14 : 30)));
        lines.push(knocked ? `Ngươi gục xuống, may mắn thoát được một mạng. Sinh lực còn ${P.hp}.` : `Không trụ nổi nữa, ngươi buộc phải lui. Sinh lực còn ${P.hp}.`);
        // vết thương đã tính trong trận, sự kiện không trừ thêm
        this._absorbHurt = true;
      }
    }
    if (opts.extra) lines.push(opts.extra);
    res.a.hp0 = hp0;
    res.died = died;
    if (this._sink) this._sink.push(res);
    const text = [head, ...lines].join('\n');
    if (died) this._battleDeath = text;
    return { win: res.win, died, text };
  }
  /** Xác suất mất mạng khi thua. gap: sức đối phương / sức mình */
  deathChance(gap, lethal, knocked = true) {
    const P = this.P;
    let p = lethal * Math.pow(Math.max(0.5, Math.min(3, gap)), 1.4);
    if (!knocked) p *= 0.3;
    if (P.age < 16) p *= 0.3;
    p -= (P.stats.co - 50) / 400;
    return clamp(p, 0.02, 0.9);
  }
  // ---------- Dựng đối thủ ----------
  genericFighter(foeName, foePow) {
    const r = new Rng([...foeName].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7));
    return fighter({
      name: foeName, pw: foePow * enemyGear(this.P.realm), skills: ['quyen', r.pick(['han_bang', 'luu_van', 'liet_hoa', 'truy_hon'])], wep: r.pick(WEP_KEYS),
      look: { type: 'human', seed: r.int(1, 1e6), g: 'nam', age: 35, life: 80, realm: 0, robe: '#4a3f3a', wep: 'dao' },
    });
  }
  monsterFighter(m, scale = 1) {
    const r = new Rng(m.seed || 1);
    const sk = ['can_xe', r.pick(Object.keys(BEAST_SKILLS).filter((k) => k !== 'can_xe'))];
    if (m.r >= 3 || (m.d || 0) >= 3) sk.push(r.pick(['vay_giap', 'cuong_bao', 'gam_thet']));
    return fighter({ name: m.n, pw: m.pow * scale * enemyGear(m.r ?? this.P.realm), skills: [...new Set(sk)], beast: true, look: { type: 'beast', seed: m.seed, realm: m.r, name: m.n } });
  }
  botFighter(b) {
    return fighter({
      name: b.name, pw: this.power(b) * enemyGear(b.realm), skills: this.botSkills(b), wep: this.botWep(b), tactic: b.pers === 'cuong' ? 'cuong_cong' : b.pers === 'an' ? 'phong_thu' : 'can_bang',
      look: { type: 'human', seed: botSeed(b), g: b.g, age: b.age, life: b.life, realm: b.realm, robe: b.sect ? (this.sect(b.sect) || {}).color : null, wep: this.botWep(b) },
    });
  }
  /** Bot có ra tay giết người thua không */
  botLethal(b) {
    const r = this.s.rel[b.id];
    if (r && (r.tag === 'thu' || r.v <= -50)) return 0.4;
    return { cuong: 0.3, tham: 0.25, muu: 0.25, hien: 0.05, nghia: 0.07, an: 0.12 }[b.pers] ?? 0.15;
  }
  /** Ước lượng tỉ lệ thắng bằng cách đánh thử 40 trận (RNG riêng, không ảnh hưởng ván chơi) */
  winOdds(makeB, mul = 1) {
    const r = new Rng(424242);
    let w = 0;
    for (let i = 0; i < 40; i++) if (battle(this.playerFighter(mul), makeB(), r).win) w++;
    return w / 40;
  }
  oddsText(p, lethal, gap) {
    const pd = this.deathChance(gap, lethal);
    const word = p >= 0.85 ? 'Nắm chắc phần thắng' : p >= 0.6 ? 'Khá có lợi' : p >= 0.4 ? 'Năm ăn năm thua' : p >= 0.15 ? 'Bất lợi' : 'Gần như không có cửa';
    return `${word}: thắng ~${Math.round(p * 100)}%. Thua thì nguy hiểm tính mạng ~${Math.round(pd * 100)}%.`;
  }
  hintMonster(m, scale = 1) {
    const B = this.monsterFighter(m, scale);
    return this.oddsText(this.winOdds(() => this.monsterFighter(m, scale)), 0.35, B.maxHp / this.playerFighter().maxHp);
  }
  hintBot(b, mul = 1) {
    const B = this.botFighter(b);
    return this.oddsText(this.winOdds(() => this.botFighter(b), mul), this.botLethal(b), B.maxHp / this.playerFighter(mul).maxHp);
  }
  /** Đánh với đối thủ là người vô danh */
  fight(foeName, foePow, mul = 1, opts = {}) {
    return this.runBattle(this.playerFighter(mul), this.genericFighter(foeName, foePow), { lethal: 0.22, cause: `bị ${foeName} giết`, ...opts });
  }
  fightMonster(m, scale = 1, mul = 1, opts = {}) {
    const mp = m.d !== undefined ? MAPS[m.d] : null;
    const res = this.runBattle(this.playerFighter(mul), this.monsterFighter(m, scale), { lethal: 0.35 * (mp ? mp.lethal : 1), cause: `bị ${m.n} giết chết`, ...opts });
    if (res.win) this.P.cnt.beast++;
    if (res.win && this.r.chance(mp ? Math.min(0.8, 0.25 * mp.loot) : 0.25)) res.text += '\n' + this.gainItem(this.dropItem(m.r ?? this.P.realm, null, mp));
    if (res.win && mp && this.playing) { const t = this.gatherMats(mp, true); if (t) res.text += '\n' + t; }
    return res;
  }
  fightBot(b, mul = 1, opts = {}) {
    const res = this.runBattle(this.playerFighter(mul), this.botFighter(b), { lethal: this.botLethal(b), cause: `chết dưới tay ${b.name}`, ...opts });
    if (res.win && (b.gq || 0) >= 2 && this.r.chance(b.gq >= 4 ? 0.08 : 0.25)) {
      // đoạt được món tốt nhất của đối thủ (kể cả thần khí bot đoạt được ở vùng khó)
      const it = makeItem(this.r, this.s.nextItem++, b.realm, b.gq, 'vu_khi');
      it.wt = this.botWep(b);
      it.n = it.n.replace(/\S+$/, WEP_N[it.wt]);
      if (b.gq >= 4 && b.tt) { const tt = TT_MAP[b.tt]; const slot = Object.keys(THAN_THONG).find((k) => THAN_THONG[k].includes(tt)); if (slot === 'vu_khi') it.tt = b.tt; }
      this._forging = true;
      res.text += '\n' + this.gainItem(it, `Đoạt được ${b.gq >= 4 ? 'thần khí' : 'bảo vật'} của ${b.name}`);
      this._forging = false;
      b.gq = Math.max(0, b.gq - 2);
      if (b.gq < 4) b.tt = null;
    } else if (res.win && this.r.chance(0.15)) {
      const it = this.dropItem(b.realm, 'vu_khi');
      it.wt = this.botWep(b);
      it.n = it.n.replace(/\S+$/, WEP_N[it.wt]);
      res.text += '\n' + this.gainItem(it, `Nhặt được binh khí của ${b.name}`);
    }
    return res;
  }

  // ---------- Bản đồ lịch luyện ----------
  /** Vùng đang lịch luyện. Trong một kỳ ngộ thì là vùng lúc kỳ ngộ xảy ra. */
  curMap() {
    const P = this.P;
    if (!P) return null;
    const p = this.s.pending;
    if (p && p.map !== undefined) return p.map ? MAP_MAP[p.map] : null;
    if (this.effectiveAction() !== 'lich_luyen') return null;
    return MAP_MAP[P.map] || MAP_MAP[DEFAULT_MAP];
  }
  setMap(id) {
    if (!this.playing || !MAP_MAP[id]) return;
    this.P.map = id;
    this.P.flags.mapWarned = false;
    this.setAction('lich_luyen');
  }
  /** Yêu thú của vùng: cùng cảnh giới với ngươi, sức mạnh nhân theo độ khó */
  mapMonster(map = this.curMap(), rr = this.r) {
    const P = this.P;
    if (!map) return this.monster(P.realm);
    const nr = clamp(P.realm + Math.floor(map.d / 2), 0, MONSTERS[MONSTERS.length - 1].r);
    const opts = MONSTERS.filter((m) => m.r === nr);
    const pick = rr.pick(opts.length ? opts : MONSTERS);
    return { n: map.d >= 2 && map.beast ? `${map.beast} ${pick.n}` : pick.n, pow: REALMS[P.realm].pow * map.pow * rr.range(0.85, 1.15), beast: true, r: P.realm, d: map.d, seed: rr.int(1, 1e6) };
  }
  /** Tỉ lệ thắng một con yêu thú điển hình của vùng (dùng cho cảnh báo) */
  mapOdds(id) {
    const map = MAP_MAP[id];
    const m = this.mapMonster(map, new Rng(7700 + map.d));
    m.pow = REALMS[this.P.realm].pow * map.pow;
    return this.winOdds(() => this.monsterFighter(m));
  }
  mapRisk(id) {
    const map = MAP_MAP[id];
    const m = this.mapMonster(map, new Rng(7700 + map.d));
    m.pow = REALMS[this.P.realm].pow * map.pow;
    const B = this.monsterFighter(m);
    return this.deathChance(B.maxHp / this.playerFighter().maxHp, 0.35 * map.lethal);
  }
  /** Tu sĩ (bot) đang lịch luyện ở một vùng */
  botsIn(id) {
    return this.s.souls.filter((b) => b.alive && b.map === id);
  }
  /** Đồ rơi ngẫu nhiên, phẩm theo vùng đang ở */
  dropItem(lv = this.P.realm, slot = null, map = this.curMap()) {
    const q = rollQuality(this.r, map ? map.loot : 1, map ? map.myth : 0);
    return makeItem(this.r, this.s.nextItem++, lv, q, slot);
  }
  mythOk() {
    const mp = this.curMap();
    return !!this._forging || (!!mp && mp.d >= 2);
  }
  /** Ngoài vùng Khó trở lên, đồ Thần thoại hạ xuống Cực phẩm */
  demote(it) {
    const n = makeItem(this.r, it.id, it.lv, 3, it.slot);
    if (it.wt) { n.wt = it.wt; n.n = n.n.replace(/\S+$/, WEP_N[it.wt]); }
    return n;
  }
  /** Nhặt nguyên liệu ở vùng lịch luyện. kill: hạ được yêu thú */
  gatherMats(map, kill = false) {
    const P = this.P;
    const f = 1 + P.realm;
    const got = {};
    const add = (k, n) => { n = Math.max(0, Math.round(n)); if (!n) return; P.mats[k] = (P.mats[k] || 0) + n; got[k] = (got[k] || 0) + n; };
    add('tinh_thiet', this.r.range(0.5, 1.5) * map.loot * f * (kill ? 1 : 0.6));
    if (this.r.chance((kill ? 0.12 : 0.06) * map.loot)) add('linh_tinh', this.r.range(0.6, 1.4) * f);
    if (map.mat !== 'tinh_thiet') {
      const rare = map.mat === 'than_hon';
      if (this.r.chance(rare ? (kill ? 0.15 : 0.03) : kill ? 0.5 : 0.25)) add(map.mat, rare ? 1 : this.r.int(1, 2));
    }
    return this.matText(got, 'Nhặt được');
  }
  matText(m, prefix = '') {
    const parts = Object.entries(m).filter(([, n]) => n > 0).map(([k, n]) => `${matToken(k)}${MATS[k].n} x${n}`);
    return parts.length ? `${prefix ? prefix + ': ' : ''}${parts.join(', ')}.` : '';
  }

  // ---------- Phân giải, lò rèn ----------
  findItem(id) {
    const P = this.P;
    return P.bag.find((x) => x.id === id) || Object.values(P.eq).find((x) => x && x.id === id) || null;
  }
  salvageYield(it) {
    const f = 1 + it.lv;
    const base = [[1.5, 0], [3, 0], [5, 1], [8, 3], [4, 2]][it.q];
    const y = { tinh_thiet: Math.max(1, Math.round(base[0] * f)), linh_tinh: Math.round(base[1] * f) };
    if (it.q >= 4) y.than_hon = 1;
    if (it.inv) for (const k in it.inv) y[k] = (y[k] || 0) + Math.floor(it.inv[k] * 0.5);
    for (const k in y) if (!y[k]) delete y[k];
    return y;
  }
  /** Phân giải một món trong túi, trả về câu mô tả nguyên liệu nhận được */
  salvage(id) {
    const P = this.P;
    const i = P.bag.findIndex((x) => x.id === id);
    if (i < 0) return '';
    const it = P.bag.splice(i, 1)[0];
    const y = this.salvageYield(it);
    for (const k in y) P.mats[k] = (P.mats[k] || 0) + y[k];
    return this.matText(y).replace(/\.$/, '');
  }
  /** Phân giải mọi món trong túi từ phẩm maxQ trở xuống */
  salvageAll(maxQ = 1) {
    const P = this.P;
    const tot = {};
    let n = 0;
    for (const it of P.bag.filter((x) => x.q <= maxQ)) {
      const y = this.salvageYield(it);
      this.salvage(it.id);
      n++;
      for (const k in y) tot[k] = (tot[k] || 0) + y[k];
    }
    return n ? `Phân giải ${n} món: ${this.matText(tot).replace(/\.$/, '')}.` : 'Không có món nào để phân giải.';
  }
  canPay(c) {
    const P = this.P;
    for (const k in c) if (k === 'money' ? P.money < c[k] : (P.mats[k] || 0) < c[k]) return false;
    return true;
  }
  pay(c, it = null) {
    const P = this.P;
    if (!this.canPay(c)) return false;
    for (const k in c) {
      if (k === 'money') { this.money(-c[k]); continue; }
      P.mats[k] -= c[k];
      if (it && (k === 'tinh_thiet' || k === 'linh_tinh')) { it.inv = it.inv || {}; it.inv[k] = (it.inv[k] || 0) + c[k]; }
    }
    return true;
  }
  forgeOpen() {
    return this.playing && this.P.age >= 12;
  }
  /** Tay nghề rèn, Thể tu và danh hiệu cộng thêm tỉ lệ */
  forgeBonus() {
    const P = this.P;
    return Math.min(0.15, (P.forge || 0) * 0.0015) + (P.path === 'the' ? 0.05 : 0) + this.tadd('forgeBonus');
  }
  addForge(n) {
    this.P.forge = Math.min(100, (this.P.forge || 0) + n);
  }
  enhanceCost(it) {
    const n = it.plus || 0;
    const f = 1 + it.lv;
    const c = { tinh_thiet: Math.ceil((2 + 1.5 * n) * f), money: Math.round(10 * (n + 1) * f) };
    if (n >= 4) c.linh_tinh = (n - 3) * f;
    if (it.q >= 4 && n >= 7) c.than_hon = 1;
    return c;
  }
  enhanceChance(it) {
    const n = it.plus || 0;
    if (n < 4) return 1;
    return Math.min(0.95, [0.85, 0.75, 0.65, 0.55, 0.45, 0.35][n - 4] + this.forgeBonus());
  }
  /** Cường hóa: từ +5 có thể hỏng, từ +8 hỏng thì tụt một cấp. Không bao giờ vỡ đồ. */
  enhance(id) {
    const it = this.findItem(id);
    if (!it || !this.forgeOpen() || (it.plus || 0) >= PLUS_MAX) return null;
    const n = it.plus || 0;
    const p = this.enhanceChance(it);
    if (!this.pay(this.enhanceCost(it), it)) return null;
    this.addForge(1);
    let msg;
    if (this.r.chance(p)) {
      it.plus = n + 1;
      msg = `Lửa lò bùng lên, ${it.n} sáng rực. Cường hóa thành công: +${it.plus}.`;
      if (it.plus >= 8) this.log(`Cường hóa ${itemToken(it)}${it.n} lên +${it.plus}.`, 'good');
    } else if (n >= 7) {
      it.plus = n - 1;
      msg = `Tiếng kim loại rạn khẽ vang lên. Cường hóa thất bại, ${it.n} tụt xuống +${it.plus}.`;
    } else msg = `Lửa lò chập chờn rồi tắt. Cường hóa thất bại, nguyên liệu tiêu tan, ${it.n} vẫn +${n}.`;
    it.val = itemVal(it);
    this.checkTitles();
    return msg;
  }
  upgradeCost(it) {
    const f = 1 + this.P.realm;
    const c = { tinh_thiet: 4 * f * (1 + it.q), money: 25 * f * (1 + it.q) };
    if (it.q >= 2) c.linh_tinh = it.q * f;
    if (it.q >= 4) c.than_hon = 1;
    return c;
  }
  /** Thăng cấp: kéo cảnh giới món đồ lên bằng cảnh giới hiện tại, giữ phẩm, dòng và thần thông */
  upgrade(id) {
    const P = this.P;
    const it = this.findItem(id);
    if (!it || !this.forgeOpen() || it.lv >= P.realm) return null;
    if (!this.pay(this.upgradeCost(it), it)) return null;
    const k = REALMS[P.realm].pow / REALMS[it.lv].pow;
    for (const s of ['atk', 'def', 'hp']) if (it[s]) it[s] = Math.round(it[s] * k);
    const from = REALMS[it.lv].n;
    it.lv = P.realm;
    it.val = itemVal(it);
    this.addForge(2);
    this.checkTitles();
    return `Nấu lại ${it.n} bằng lửa ${REALMS[P.realm].n}. Món đồ từ cấp ${from} lên cấp ${REALMS[P.realm].n}.`;
  }
  rerollCost(it, cat = null) {
    const c = { linh_tinh: (it.q - 1) * (1 + it.lv), money: 15 * (1 + it.lv) };
    if (cat) c[cat] = 2;
    return c;
  }
  /** Tẩy luyện một dòng thuộc tính. cat: dẫn liệu để chắc chắn ra dòng của nó */
  reroll(id, idx, cat = null) {
    const it = this.findItem(id);
    if (!it || !this.forgeOpen() || it.q < 2 || !it.affix || idx < 0 || idx >= it.affix.length) return null;
    const old = it.affix[idx];
    let nk;
    if (cat) {
      nk = MATS[cat] && MATS[cat].aff;
      if (!nk || (it.affix.includes(nk) && nk !== old)) return null;
    } else {
      const pool = AFFIX.filter((a) => !it.affix.includes(a.k));
      if (!pool.length) return null;
      nk = this.r.pick(pool).k;
    }
    if (!this.pay(this.rerollCost(it, cat), it)) return null;
    const A = (k) => AFFIX.find((a) => a.k === k);
    it[old] = (it[old] || 0) - A(old).v;
    if (Math.abs(it[old]) < 1e-9) delete it[old];
    it[nk] = (it[nk] || 0) + A(nk).v;
    it.affix[idx] = nk;
    this.addForge(2);
    this.checkTitles();
    return `Tẩy luyện: ${A(old).t} → ${A(nk).t}.`;
  }
  forgeCost(myth = false, cat = null) {
    const f = 1 + this.P.realm;
    const c = myth ? { tinh_thiet: 20 * f, linh_tinh: 5 * f, than_hon: 3, money: 200 * f } : { tinh_thiet: 6 * f, linh_tinh: f, money: 30 * f };
    if (cat) c[cat] = (c[cat] || 0) + 2;
    return c;
  }
  forgeMythChance() {
    return Math.min(0.4, 0.15 + this.forgeBonus() * 0.5);
  }
  /** Rèn món mới hợp cảnh giới hiện tại */
  forgeNew(slot, wt = null, cat = null, myth = false) {
    const P = this.P;
    if (!this.forgeOpen() || !['vu_khi', 'ao', 'phu_kien'].includes(slot)) return null;
    if (cat && !(MATS[cat] && MATS[cat].aff)) return null;
    if (!this.pay(this.forgeCost(myth, cat))) return null;
    this.addForge(3);
    const b = this.forgeBonus();
    let q;
    if (myth) q = this.r.chance(this.forgeMythChance()) ? 4 : 3;
    else { const w = [35, 38, 20 * (1 + b * 3), 7 * (1 + b * 5)]; q = this.r.weighted([0, 1, 2, 3], (x) => w[x]); }
    const it = makeItem(this.r, this.s.nextItem++, P.realm, q, slot);
    if (slot === 'vu_khi' && WEP_KEYS.includes(wt)) { it.wt = wt; it.n = it.n.replace(/\S+$/, WEP_N[wt]); }
    if (cat) {
      const k = MATS[cat].aff;
      if (!it.affix.includes(k)) {
        const A = (x) => AFFIX.find((a) => a.k === x);
        if (it.affix.length) { const i = this.r.int(0, it.affix.length - 1); const o = it.affix[i]; it[o] -= A(o).v; if (Math.abs(it[o]) < 1e-9) delete it[o]; it.affix[i] = k; }
        else it.affix.push(k);
        it[k] = (it[k] || 0) + A(k).v;
      }
    }
    it.val = itemVal(it);
    this._forging = true;
    const msg = this.gainItem(it, myth && q < 4 ? 'Thần hồn tan đi một nửa, lò chỉ ra' : 'Rèn được');
    this._forging = false;
    if (q >= 4) this.log(`Lò rèn rung chuyển, thần khí xuất thế: ${itemToken(it)}${it.n}.`, 'big');
    this.checkTitles();
    return msg;
  }
  /** Mua Tinh thiết ở lò rèn */
  buyIron(n = 10) {
    const price = n * 4 * (1 + this.P.realm);
    if (!this.playing || this.P.money < price) return null;
    this.money(-price);
    this.P.mats.tinh_thiet = (this.P.mats.tinh_thiet || 0) + n * (1 + this.P.realm);
    return `Mua ${n * (1 + this.P.realm)} Tinh thiết.`;
  }
  ironPrice(n = 10) {
    return n * 4 * (1 + this.P.realm);
  }

  // ---------- Trang bị, võ kỹ ----------
  ensureGear(P) {
    if (!P.bag) P.bag = [];
    if (!P.eq) P.eq = { vu_khi: null, ao: null, phu_kien: null };
    if (!P.skills) P.skills = ['quyen'];
    if (!P.loadout) P.loadout = ['quyen'];
    if (!P.tactic) P.tactic = 'can_bang';
    if (!P.cnt) P.cnt = { win: 0, lose: 0, beast: 0, revenge: 0, low: 0 };
    if (!P.titles) P.titles = [];
    if (P.title === undefined) P.title = null;
    if (!P.later) P.later = [];
    if (!P.mats) P.mats = {};
    if (!P.map || !MAP_MAP[P.map]) P.map = DEFAULT_MAP;
    if (P.forge === undefined) P.forge = 0;
    // đồ Thần thoại từ bản cũ chưa có thần thông thì gán theo mã món
    for (const it of [...P.bag, ...Object.values(P.eq)]) {
      if (it && it.q >= 4 && !it.tt) { const pool = THAN_THONG[it.slot]; it.tt = pool[Math.abs(it.id) % pool.length].id; }
    }
  }
  learn(id) {
    const P = this.P;
    if (!SKILLS[id] || P.skills.includes(id)) return false;
    P.skills.push(id);
    if (P.loadout.length < 4) P.loadout.push(id);
    else if (P.loadout.includes('quyen')) P.loadout[P.loadout.indexOf('quyen')] = id;
    return true;
  }
  /** Học một võ kỹ ngẫu nhiên trong khoảng phẩm, trả về câu thông báo */
  learnRandom(minT, maxT) {
    const P = this.P;
    const w = P.eq.vu_khi ? P.eq.vu_khi.wt : null;
    const opts = SKILL_IDS.filter((k) => !SKILLS[k].path && SKILLS[k].tier >= minT && SKILLS[k].tier <= maxT && !P.skills.includes(k));
    if (!opts.length) return '';
    const id = this.r.weighted(opts, (k) => (!SKILLS[k].wep || SKILLS[k].wep === w ? 3 : 1));
    this.learn(id);
    const m = `Lĩnh ngộ võ kỹ: ${iconToken({ kind: 'bi_kip', q: SKILLS[id].tier })}${SKILLS[id].n}.`;
    this.log(m, 'good');
    return m;
  }
  toggleSkill(id) {
    const P = this.P;
    if (!P.skills.includes(id)) return;
    const i = P.loadout.indexOf(id);
    if (i >= 0) { if (P.loadout.length > 1) P.loadout.splice(i, 1); }
    else if (P.loadout.length < 4) P.loadout.push(id);
  }
  setTactic(t) {
    if (this.P) this.P.tactic = t;
  }
  /** Bỏ một món vào túi, tự mặc nếu ô đang trống. Trả về câu thông báo. */
  gainItem(it, prefix = 'Thu được') {
    const P = this.P;
    // đồ Thần thoại chỉ xuất hiện ở vùng lịch luyện từ Khó trở lên (hoặc tự rèn)
    if (it.q >= 4 && !this.mythOk()) it = this.demote(it);
    const qn = QUALITY[it.q].n;
    const tk = itemToken(it);
    if (it.tt && TT_MAP[it.tt]) prefix = `${prefix} thần khí mang thần thông 「${TT_MAP[it.tt].n}」`;
    if (!P.eq[it.slot]) {
      P.eq[it.slot] = it;
      const m = `${prefix}: ${tk}${it.n} (${qn}), đã mang vào người.`;
      this.log(m, 'good');
      return m;
    }
    P.bag.push(it);
    let msg = `${prefix}: ${tk}${it.n} (${qn}).`;
    if (P.bag.length > BAG_MAX) {
      P.bag.sort((a, b) => a.val - b.val);
      const sold = P.bag[0];
      if (this.s.opt && this.s.opt.autoSalvage) {
        msg += ` Túi đầy, phân giải ${itemName(sold)}: ${this.salvage(sold.id)}.`;
      } else {
        P.bag.shift();
        this.money(sold.val);
        msg += ` Túi đầy, bán ${itemName(sold)} được ${sold.val} linh thạch.`;
      }
    }
    this.log(msg, 'good');
    return msg;
  }
  equip(itemId) {
    const P = this.P;
    const i = P.bag.findIndex((x) => x.id === itemId);
    if (i < 0) return;
    const it = P.bag.splice(i, 1)[0];
    if (P.eq[it.slot]) P.bag.push(P.eq[it.slot]);
    P.eq[it.slot] = it;
  }
  unequip(slot) {
    const P = this.P;
    if (P.eq[slot] && P.bag.length < BAG_MAX) {
      P.bag.push(P.eq[slot]);
      P.eq[slot] = null;
    }
  }
  sell(itemId) {
    const P = this.P;
    const i = P.bag.findIndex((x) => x.id === itemId);
    if (i < 0) return 0;
    const it = P.bag.splice(i, 1)[0];
    this.money(it.val);
    return it.val;
  }
  betterThanEquipped(it) {
    return itemScore(it) > itemScore(this.P.eq[it.slot]);
  }
  /** Hàng của Tụ Bảo Lâu, đổi mỗi 5 năm */
  shopStock() {
    const P = this.P;
    const win = Math.floor(this.s.year / 5);
    const r = new Rng((this.s.seed ^ (win * 7919) ^ (P.realm * 104729)) >>> 0);
    const gear = [0, 1, 2].map((i) => {
      const it = makeItem(r, -1 - i, P.realm, r.chance(0.3) ? 1 : 0, ['vu_khi', 'ao', 'phu_kien'][i]);
      it.price = Math.round(it.val * 2.5);
      it.key = `${win}:${i}`;
      return it;
    });
    const maxT = Math.min(3, 1 + Math.floor(P.realm / 2));
    const pool = SKILL_IDS.filter((k) => SKILLS[k].tier >= 1 && SKILLS[k].tier <= Math.min(2, maxT));
    const books = [];
    for (let i = 0; i < 2 && pool.length; i++) books.push(pool.splice(r.int(0, pool.length - 1), 1)[0]);
    return { win, gear, books: books.map((id) => ({ id, price: 120 * SKILLS[id].tier * (1 + P.realm) })) };
  }
  buyGear(key) {
    const P = this.P;
    const st = this.shopStock();
    const it = st.gear.find((x) => x.key === key);
    P.shopBought = P.shopBought || [];
    if (!it || P.shopBought.includes(key) || P.money < it.price) return null;
    this.money(-it.price);
    P.shopBought.push(key);
    const own = { ...it, id: this.s.nextItem++ };
    delete own.price; delete own.key;
    return this.gainItem(own, 'Mua');
  }
  buyBook(id) {
    const P = this.P;
    const b = this.shopStock().books.find((x) => x.id === id);
    if (!b || P.skills.includes(id) || P.money < b.price) return null;
    this.money(-b.price);
    this.learn(id);
    return `Học được ${iconToken({ kind: 'bi_kip', q: SKILLS[id].tier })}${SKILLS[id].n}.`;
  }
  hurt(n, cause) {
    const P = this.P;
    if (this._absorbHurt) { this._absorbHurt = false; return false; }
    if (!this.playing) return true;
    P.hp = Math.max(0, P.hp - Math.round(n * this.tmul('hurtMul')));
    if (P.hp <= 0 && this.thas('deathSave') && !P.flags.reborn) {
      P.flags.reborn = true;
      P.hp = 50;
      this.log('Lửa Niết Bàn bùng lên từ trong xương tủy. Ngươi chết đi rồi sống lại.', 'big');
      return false;
    }
    if (P.hp <= 0) {
      this.die(cause || 'trọng thương không qua khỏi');
      return true;
    }
    if (P.hp < 20) P.cnt.low++;
    return false;
  }
  joinSect(sc) {
    this.P.sect = sc.id;
    this.P.dao = true;
    const sk = this.sectSkill(sc);
    if (this.learn(sk)) this.log(`Nhập môn ${sc.name}, được truyền ${SKILLS[sk].n}.`, 'good');
  }
  sectSkill(sc) {
    if (!sc.skill) sc.skill = SKILL_IDS.filter((k) => SKILLS[k].tier >= 1 && SKILLS[k].tier <= 2)[sc.id % 12];
    return sc.skill;
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
    const pm = this.tmul('pillMul');
    if (id === 'hoi_xuan') { P.hp = Math.min(100, P.hp + Math.round(40 * pm)); return 'Sinh lực hồi phục.'; }
    if (id === 'tinh_tam') { this.stat('tam', Math.round(6 * pm)); return `Tâm tính +${Math.round(6 * pm)}.`; }
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
    p += this.tadd('brk') + (P.realm >= 3 ? this.tadd('brkLate') : 0);
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
      if (P.realm >= 2 && P.daoHieu === undefined) this.s.queue.push({ id: 'dao_hieu', botId: null, data: { opts: this.genDaoHieuOpts() } });
      P.tuvi = 0;
      this.fame(P.realm * 3);
      for (const it of Object.values(P.eq)) {
        if (it && it.q >= 4 && it.lv === P.realm) {
          this.log(`Phong ấn trên ${it.n} vỡ tan. Thần khí nhận ngươi làm chủ, phát huy toàn bộ sức mạnh${it.tt && TT_MAP[it.tt] ? ` và thần thông 「${TT_MAP[it.tt].n}」` : ''}.`, 'big');
          (this.s.toasts = this.s.toasts || []).push({ n: `${it.n} giải phong`, tier: 4, bonus: it.tt && TT_MAP[it.tt] ? TT_MAP[it.tt].n : 'Toàn bộ sức mạnh' });
        }
      }
      const ob = this.tadd('ngoOnBreak');
      if (ob) this.stat('ngo', ob);
      this.log(`Đột phá thành công! Ngươi đã là tu sĩ ${REALMS[P.realm].n}. Thọ nguyên ${this.lifespan()}.`, 'big');
      if (P.realm >= 3) this.chron(`${this.fullName()} đột phá ${REALMS[P.realm].n}.`, 2);
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
    if (P.age >= 6 && !P.dao) {
      P.dao = true;
      const head = (P.flags.autoDao ? 0.5 : 0) + (P.origin === 'tu' ? 0.3 : 0);
      if (head) P.tuvi = Math.min(this.need(), P.tuvi + this.need() * head);
      this.log(P.flags.autoDao
        ? 'Sáu tuổi, những khẩu quyết mơ hồ trong giấc mơ bỗng rõ ràng từng chữ. Ngươi nhập đạo với một nửa tầng tu vi có sẵn.'
        : P.origin === 'tu'
          ? 'Sáu tuổi, ông nội lấy ra cuốn gia phả cũ, dạy ngươi bài khẩu quyết tổ truyền. Ngươi nhập đạo, khí tức đã thông được ba phần.'
          : 'Sáu tuổi, cha mẹ gom góp đưa ngươi tới nghe một tán tu giảng đạo ở đầu làng. Ngươi học được bài dẫn khí đầu tiên và chính thức nhập đạo.', 'good');
    }
    if (P.dao && !P.flags.firstSkill) {
      P.flags.firstSkill = true;
      const t = this.learnRandom(1, 1);
      if (t) this.log(`Bước vào đường tu, ngươi tự mò ra một môn võ kỹ. ${t}`, 'good');
    }
    const g = this.gain();
    if (act === 'tu_luyen') this.addTuvi(g * this.r.range(0.85, 1.15));
    else if (act === 'be_quan') this.addTuvi(g * 1.6 * this.tmul('closedMul'));
    else if (act === 'lich_luyen') {
      const mp = this.curMap();
      this.addTuvi(g * 0.35 * Math.sqrt(mp.loot));
      if (this.r.chance(0.15)) this.stat('co', 1);
      if (this.r.chance(0.35)) { const t = this.gatherMats(mp, false); if (t && /Linh tinh|Thú hạch|Độc nang|Hỏa tinh|Binh hồn|Thần hồn/.test(t)) this.log(t, 'muted'); }
      if (mp.haz && this.r.chance(mp.haz[0])) {
        const dmg = Math.round(mp.haz[1] * this.r.range(0.7, 1.3));
        this.log(`${mp.haz[2]}. Sinh lực -${dmg}.`, 'bad');
        if (this.hurt(dmg, mp.haz[3])) return true;
      }
      if (mp.d >= 4) P.cnt.hard = (P.cnt.hard || 0) + 1;
      if (mp.d >= 2 && P.hp < 40) {
        if (this.s.opt.retreat) {
          P.map = DEFAULT_MAP;
          this.log(`Sinh lực chỉ còn ${P.hp}, ngươi rút khỏi ${mp.n}, về ${MAP_MAP[DEFAULT_MAP].n} dưỡng thương.`, 'muted');
        } else if (!P.flags.mapWarned) {
          P.flags.mapWarned = true;
          this.s.alert = { title: `Nguy hiểm ở ${mp.n}`, text: `Sinh lực chỉ còn ${P.hp}. Ở ${mp.n} lúc này, tỉ lệ thắng yêu thú chỉ khoảng ${Math.round(this.mapOdds(mp.id) * 100)}%. Nên về vùng dễ hơn dưỡng thương.` };
        }
      }
      if (P.hp >= 70) P.flags.mapWarned = false;
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
    if (P.realm >= 2 && P.path === undefined && (!P.pathRetry || P.age >= P.pathRetry) && !this.s.queue.some((q) => q.id === 'dao_do') && !(this.s.pending && this.s.pending.id === 'dao_do')) this.s.queue.unshift({ id: 'dao_do', botId: null, data: {} });
    if (P.realm >= 2 && P.daoHieu === undefined && !this.s.queue.some((q) => q.id === 'dao_hieu')) this.s.queue.push({ id: 'dao_hieu', botId: null, data: { opts: this.genDaoHieuOpts() } });
    this.checkTitles();
    if (this._rank === 1) P.cnt.top1 = (P.cnt.top1 || 0) + 1;
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
    // chuỗi sự kiện: tình huống được hẹn từ lựa chọn trước, tới lúc thì xảy ra
    const P0 = this.P;
    const due = P0.later.findIndex((x) => x.at <= P0.age);
    if (due >= 0) {
      const x = P0.later.splice(due, 1)[0];
      if (EVENT_MAP[x.id] && (!x.botId || (this.soul(x.botId) || {}).alive)) {
        s.pending = { id: x.id, botId: x.botId || null, data: x.data || {} };
        return;
      }
    }
    const rate = (EVENT_RATE[act] ?? 0.25) * this.tmul('eventRate');
    if (!this.r.chance(rate)) return;
    const P = this.P;
    const cands = [];
    const mapNow = this.curMap();
    for (const e of EVENTS) {
      if (e.queued) continue;
      if (act === 'be_quan' && !e.inClosed) continue;
      if (e.once && s.once[e.id]) continue;
      if (s.cd[e.id] !== undefined && P.age - s.cd[e.id] < (e.cd ?? 8)) continue;
      // luật tuổi và nơi chốn (EVENT_RULES trong events.js)
      const ru = e.rule || {};
      if (P.age < 6 && !ru.child) continue;
      if (P.age < (ru.age ?? 14)) continue;
      if (ru.place === 'xa' && act !== 'lich_luyen') continue;
      if (ru.place === 'thanh' && act !== 'muu_sinh' && act !== 'ket_giao') continue;
      if (e.when && !e.when(this)) continue;
      const bot = e.bot ? e.bot(this) : null;
      if (e.bot && !bot) continue;
      const data = e.prep ? e.prep(this, bot) : {};
      if (e.prep && !data) continue;
      let w = typeof e.w === 'function' ? e.w(this) : e.w ?? 1;
      if (e.acts && e.acts.includes(act)) w *= 3;
      if (mapNow) w *= MAP_RARE_EV.has(e.id) ? 0.5 + 0.35 * mapNow.d : e.id === 'yeu_thu' ? 0.6 + 0.3 * mapNow.d : MAP_FIGHT_EV.has(e.id) ? 0.8 + 0.15 * mapNow.d : 1;
      w *= this.tevW(e.id);
      cands.push({ e, bot, data, w });
    }
    const pick = this.r.weighted(cands, (c) => c.w);
    if (!pick) return;
    s.cd[pick.e.id] = P.age;
    if (pick.e.once) s.once[pick.e.id] = true;
    const mp0 = this.curMap();
    s.pending = { id: pick.e.id, botId: pick.bot ? pick.bot.id : null, data: pick.data, act, age: P.age, map: mp0 ? mp0.id : null };
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
    return { title: typeof ev.title === 'function' ? ev.title(this, c) : ev.title, text: ev.text(this, c), choices: choices.map((x) => (x.p !== undefined ? `${x.t} · ~${Math.round(clamp(x.p, 0, 1) * 100)}%` : x.t)) };
  }
  choose(idx) {
    const p = this.s.pending;
    if (!p || p.result !== undefined) return;
    const ev = EVENT_MAP[p.id];
    const c = this.ctx(p);
    const choices = ev.choices(this, c).filter((x) => x.if !== false);
    const ch = choices[idx];
    if (!ch) return;
    this._sink = [];
    this._battleDeath = null;
    let res = ch.go(this, c) || '';
    // chết trong trận thì bỏ lời kể thua trận của sự kiện, chỉ giữ diễn biến
    if (this._battleDeath && this.s.phase === 'dead') res = this._battleDeath;
    if (this._sink.length) { p.battles = this._sink; p.bi = 0; }
    this._sink = null;
    this._absorbHurt = false;
    if (this.s.phase === 'dead') res += `\n\n${this.P.name} ngã xuống, hưởng thọ ${this.P.age} tuổi.`;
    p.result = res;
    const first = res.split('\n').filter(Boolean).pop();
    if (this.P && first) this.log(`${this._auto ? '(Tự quyết) ' : ''}${ev.title}: ${first}`, 'event');
    if (this.playing) this.checkTitles();
  }
  /** Sự kiện đang chờ có tự quyết được không (việc nhỏ) */
  canAuto() {
    const p = this.s.pending;
    if (!p || p.result !== undefined) return false;
    const ev = EVENT_MAP[p.id];
    return !!(ev && ev.auto);
  }
  /** Tự chọn phương án mặc định của sự kiện nhỏ, bỏ qua phần diễn trận, rồi đóng lại */
  autoResolve() {
    if (!this.canAuto()) return false;
    const p = this.s.pending;
    const ev = EVENT_MAP[p.id];
    const c = this.ctx(p);
    const list = ev.choices(this, c).filter((x) => x.if !== false);
    let pick = ev.auto(this, c, list);
    if (typeof pick === 'string') { const i = list.findIndex((x) => x.t.startsWith(pick)); pick = i >= 0 ? i : list.length - 1; }
    if (typeof pick === 'number' && pick < 0) pick = list.length + pick;
    if (typeof pick !== 'number' || pick < 0 || pick >= list.length) pick = list.length - 1;
    this._auto = true;
    this.choose(pick);
    this._auto = false;
    if (p.battles) p.bi = p.battles.length;
    const dead = this.s.phase === 'dead';
    if (!dead) this.dismiss();
    return true;
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
      sect: sc ? sc.name : null, root: P.root.n, path: P.path && PATHS[P.path] ? PATHS[P.path].n : null, dh: this.honorific(), title: P.title ? TITLE_MAP[P.title].n : null, nTitles: P.titles.length, year: this.s.year, asc: !!P.ascended, fame: P.fame,
      friends: this.closeFriends().length,
    };
    this.s.lives.push(rec);
    if (P.realm >= 3 || P.ascended) this.chron(`${this.fullName()} (${REALMS[P.realm].n}) ${cause}.`, 2);
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
    // thần khí mạnh nhất đang có (mặc hoặc trong túi)
    const myth = [...Object.values(P.eq || {}), ...(P.bag || [])].filter((it) => it && it.q >= 4).sort((a, b) => itemScore(b) - itemScore(a))[0] || null;
    const pool = LEGACIES.filter((l) => l.id !== 'duyen' || hasBond).filter((l) => l.id !== 'tai_san' || P.money >= 20).filter((l) => l.id !== 'huyet_mach' || (P.the && P.the !== 'pham')).filter((l) => l.id !== 'than_khi');
    const opts = myth ? ['than_khi'] : [];
    while (opts.length < 3 && pool.length) opts.push(pool.splice(this.r.int(0, pool.length - 1), 1)[0].id);
    const hl = this.honLucGain(P);
    this.s.honLuc = (this.s.honLuc || 0) + hl.total;
    this.s.bestRealm = Math.max(this.s.bestRealm ?? -1, P.realm);
    this.s.deadInfo = { rec, options: opts, money: P.money, the: P.the, myth, hl };
  }
  chooseLegacy(id) {
    if (this.s.phase !== 'dead' || !this.s.deadInfo.options.includes(id)) return;
    this.s.legacy = { id, money: id === 'tai_san' ? Math.min(500, Math.floor(this.s.deadInfo.money / 2)) : 0, the: id === 'huyet_mach' ? this.s.deadInfo.the : null, item: id === 'than_khi' ? this.s.deadInfo.myth : null };
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

  /** Chọn con đường tu hành (một lần mỗi kiếp), học tuyệt học của con đường */
  setPath(id) {
    const P = this.P;
    const pa = PATHS[id];
    if (!P || !pa || P.path || (pa.req && !pa.req(P))) return '';
    P.path = id;
    this.learn(pa.skill);
    this.log(`Ngươi chọn con đường ${pa.n}. Lĩnh ngộ tuyệt học ${iconToken({ kind: 'bi_kip', q: 3 })}${SKILLS[pa.skill].n}.`, 'big');
    return `Từ nay ngươi là ${pa.n}. Lĩnh ngộ tuyệt học ${iconToken({ kind: 'bi_kip', q: 3 })}${SKILLS[pa.skill].n}: ${SKILLS[pa.skill].desc}`;
  }

  /** Hẹn một sự kiện xảy ra sau `years` năm (0 = năm sau) */
  later(years, id, data = {}, botId = null) {
    this.P.later.push({ at: this.P.age + Math.max(1, years), id, data, botId });
  }
  /** Đưa ngay một sự kiện vào hàng đợi (hiện ngay sau sự kiện hiện tại) */
  next(id, data = {}, botId = null) {
    this.s.queue.unshift({ id, data, botId });
  }

  // ---------- Đạo hiệu, danh hiệu ----------
  genDaoHieu(r = this.r) {
    let a, b;
    do { a = r.pick(DH_A); b = r.pick(DH_B); } while (a === b);
    return `${a} ${b}`;
  }
  genDaoHieuOpts() {
    const out = new Set();
    while (out.size < 3) out.add(this.genDaoHieu());
    return [...out];
  }
  /** Tôn xưng hiện tại của người chơi (null nếu chưa có đạo hiệu) */
  honorific(P = this.P) {
    if (!P || !P.daoHieu || P.realm < 2) return null;
    const ma = (P.tinh <= -50 || P.path === 'ma') && P.realm >= 3;
    const hon = ma ? DH_HON_MA : P.g === 'nu' ? DH_HON_NU : DH_HON;
    return P.ascended ? `${P.daoHieu} Tiên Tôn` : `${P.daoHieu} ${hon[Math.min(P.realm, hon.length - 1)]}`;
  }
  fullName(P = this.P) {
    const h = this.honorific(P);
    return h ? `${P.name} (${h})` : P.name;
  }
  /** Đạo hiệu của bot, cố định theo kiếp */
  botHonorific(b) {
    if (b.realm < 2 || !b.dao) return null;
    const r = new Rng((botSeed(b) ^ 0x2545f491) >>> 0);
    const base = this.genDaoHieu(r);
    const hon = b.kills >= 3 && b.realm >= 3 ? DH_HON_MA : b.g === 'nu' ? DH_HON_NU : DH_HON;
    return `${base} ${hon[Math.min(b.realm, hon.length - 1)]}`;
  }
  myRank() {
    const i = this.ranking(40).findIndex((x) => x.me);
    return i < 0 ? 99 : i + 1;
  }
  checkTitles() {
    const P = this.P;
    if (!P || !P.cnt) return;
    if (!this.s.seenTitles) this.s.seenTitles = [];
    this._rank = P.dao ? this.myRank() : 99;
    for (const t of TITLES) {
      if (P.titles.includes(t.id)) continue;
      let ok = false;
      try { ok = t.check(this); } catch (e) { ok = false; }
      if (!ok) continue;
      P.titles.push(t.id);
      if (!this.s.seenTitles.includes(t.id)) { this.s.seenTitles.push(t.id); P.flags.newCodex = (P.flags.newCodex || 0) + 1; }
      this.log(`Giang hồ bắt đầu gọi ngươi là 「${t.n}」. (${t.bonus} khi đeo)`, 'big');
      (this.s.toasts = this.s.toasts || []).push({ n: t.n, tier: t.tier, bonus: t.bonus });
      if (this.s.toasts.length > 5) this.s.toasts.shift();
      if (!P.title) P.title = t.id;
    }
  }
  setTitle(id) {
    const P = this.P;
    if (P && (id === null || P.titles.includes(id))) P.title = id;
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

export { REALMS, TOP_REALM, ACTIONS, PILLS, LEGACIES, TAG_NAMES, THE_MAP, TP_MAP, THE_CHAT, TITLES, TITLE_MAP, PATHS };
