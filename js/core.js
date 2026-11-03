// Lõi game: thế giới bot tự sống + một kiếp của người chơi.
// Không đụng tới DOM, chạy được cả trong Node (tools/sim.mjs).
import { Rng } from './rng.js';
import {
  REALMS, TOP_REALM, baseGain, ROOTS, ORIGINS, PERSONALITIES, PERS_KEYS,
  SURNAMES, NAMES_M, NAMES_F, SECT_A, SECT_B, SECT_COLORS, MONSTERS, MOVES,
  ACTIONS, PILLS, LEGACIES, TAG_NAMES, THE_CHAT, THIEN_PHU, TP_WEIGHT,
  DH_A, DH_B, DH_HON, DH_HON_NU, DH_HON_MA, TITLES, PATHS, MAPS, MAP_MAP, DEFAULT_MAP, MATS,
  subN, subIdx, subFrac, realmLabel, PLANES, planeOf, mapsOf, RARE_MATS, mythMatOf, TOWER_THEMES, MOB_AFFIX, MOB_AFFIX_MAP, WORLD_DIFF,
  BOSS_KITS, THEME_BG, TAM_PHAP, TAM_PHAP_IDS, NGHE, PHU, TOWER_SHOP, PLAN_TEMPLATES,
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
import { armorColor, itemToken, iconToken, matIconOpts, skillToken } from './icons.js';

// đối thủ coi như có sẵn trang bị (trừ hạng phàm nhân)
const enemyGear = (realm) => (realm <= 0 ? 1 : 1.2);
// hệ số trang bị của quái theo độ khó vùng (Dễ .. Luyện ngục)
const ENEMY_GEAR_D = [1.2, 1.2, 1.25, 1.35, 1.4, 1.5];
// trần cộng dồn: sức chiến đấu cộng thẳng (kỳ ngộ, xuất thân...) và các hệ số không phải thể chất
const FIGHT_ADD_CAP = 0.6;
const OTHER_CAP_MUL = { fightMul: 1.6, gainMul: 2.2 };
const BAG_MAX = 16;
const WEP_KEYS = ['kiem', 'dao', 'thuong', 'quat'];
const WEP_N = { kiem: 'Kiếm', dao: 'Đao', thuong: 'Thương', quat: 'Phiến' };
// kỳ ngộ chịu ảnh hưởng của độ khó vùng lịch luyện
const MAP_RARE_EV = new Set(['hang_dong', 'truyen_thua', 'co_mo', 'kiem_trung', 'bi_canh', 'linh_mach', 'yeu_vuong', 'ban_do', 'trung_la', 'bao_vat', 'linh_thu', 'ngoc_gian']);
// kỳ ngộ tự quyết được nhưng đủ quan trọng để hỏi người chơi khi chạy chậm
const MAJOR_EV = new Set(['truyen_thua', 'bi_canh', 'kiem_trung', 'yeu_vuong', 'tam_ma', 'tuong_quan', 'binh_hon_chu', 'hoa_linh', 'huyet_an_1', 'thien_kieu_chien', 'kiem_y', 'loi_tri', 'tran_phap', 'thu_tien_hoa', 'do_hoa', 'luan_dao', 'ma_dao_xam', 'dai_ty_thi', 'truy_than_khi', 'tranh_chuong_mon', 'tieu_thien_kiep', 'phan_phe', 'huyet_an_2', 'huyet_an_3', 'thap_chu', 'loi_kiep', 'vung_chu', 'thieu_gia_ban_dia', 'linh_vuong_tan_hon', 'tiep_dan_2', 'tiep_dan_3', 'chieu_pho_ma', 'linh_kiep_nho', 'huyet_trieu', 'loi_mach']);
const MAP_FIGHT_EV = new Set(['khieu_chien', 'huyet_tran', 'bat_coc', 'ma_tu_tra_thu']);
export const matToken = (k) => iconToken(matIconOpts(k, MATS[k]));
// Bot đi lịch luyện: tỉ lệ ra ngoài và mức tỉ lệ thắng tối thiểu chấp nhận được, theo tính cách
const BOT_OUT = { cuong: 0.7, tham: 0.7, muu: 0.5, nghia: 0.55, hien: 0.35, an: 0.3 };
const BOT_RISK = { cuong: 0.35, tham: 0.45, muu: 0.6, nghia: 0.55, hien: 0.7, an: 0.8 };
// trang bị tốt nhất bot đang mang (phẩm) cộng vào sức mạnh
const BOT_GQ_MUL = [1, 1.04, 1.08, 1.14, 1.3];

export const SAVE_VERSION = 2;
const LINH_SOULS = 30;
export const SOUL_COUNT = 40;
const PREWARM_YEARS = 250;
const MAX_SECTS = 7;
const CLOSE_TAGS = ['huynh_de', 'dao_lu', 'su_phu', 'de_tu'];

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const fmtN = (n) => Math.round(n).toLocaleString('vi-VN');
const PLAN_ACT_N = { vuot_thap: 'Vượt tháp', lich_luyen: 'Lịch luyện', tu_luyen: 'Tu luyện', be_quan: 'Bế quan', muu_sinh: 'Mưu sinh', ket_giao: 'Kết giao' };
export const PLAN_COND_OK = (x) => x && PLAN_ACT_N[x.a] && ['y', 'sg', 'sl'].includes(x.k) && x.v >= 0 && x.v <= 300;
export const planStepText = (x) => `${PLAN_ACT_N[x.a]} ${x.a === 'be_quan' ? `${x.v || 10} năm` : x.k === 'y' ? `${x.v} năm` : x.k === 'sg' ? `tới khi sát khí ${x.v}` : `tới khi sát khí còn ${x.v}`}`;
export const pct = (p) => Math.round(p * 100) + '%';

// Xác suất có sự kiện mỗi năm theo việc đang làm
const EVENT_RATE = { lon_len: 0.3, tu_luyen: 0.16, lich_luyen: 0.55, muu_sinh: 0.26, ket_giao: 0.26, be_quan: 0.03 };

export class Game {
  constructor(state) {
    this.s = state;
    this.r = new Rng(state.rng);
    if (state.v === 1) Game.migrateV1(state);
    if (!state.diff || !WORLD_DIFF[state.diff]) state.diff = 'thuong';
    if (!state.unlock) state.unlock = {};
    if (!state.towerBest) state.towerBest = {};
    for (const b of state.souls) if (b.plane === undefined) b.plane = 0;
    for (const sc of state.sects) if (sc.plane === undefined) sc.plane = 0;
    if (!state.souls.some((b) => b.plane === 1)) this.initPlane(1, 400);
    if (state.player) this.ensureGear(state.player);
    if (state.draft) this.ensureGear(state.draft);
    if (!state.nextItem) state.nextItem = 1;
    if (!state.opt) state.opt = { retreat: true, autoSalvage: false };
    if (state.opt.autoPill === undefined) state.opt.autoPill = true;
    if (state.opt.autoBuyPill === undefined) state.opt.autoBuyPill = false;
    if (state.opt.autoEquip === undefined) state.opt.autoEquip = true;
    if (state.opt.towerResume === undefined) state.opt.towerResume = true;
    if (state.opt.autoSell === undefined) state.opt.autoSell = false;
  }

  /** Bản lưu cũ (Phàm giới 8 cảnh giới): thêm Hợp Thể vào giữa nên Đại Thừa từ 7 thành 8 */
  static migrateV1(st) {
    const sh = (r) => (r >= 7 ? r + 1 : r);
    const shKeys = (o) => { if (!o) return o; const n = {}; for (const k in o) n[sh(+k)] = o[k]; return n; };
    const fixP = (P) => {
      if (!P) return;
      P.realm = sh(P.realm);
      for (const it of [...(P.bag || []), ...Object.values(P.eq || {})]) if (it) it.lv = sh(it.lv);
      P.dienTho = shKeys(P.dienTho);
      if (P.flags) { P.flags.subMax = shKeys(P.flags.subMax); P.flags.neckDone = shKeys(P.flags.neckDone); if (P.flags.neck) P.flags.neck.realm = sh(P.flags.neck.realm); }
    };
    fixP(st.player); fixP(st.draft);
    for (const b of st.souls || []) b.realm = sh(b.realm);
    for (const l of st.lives || []) l.realm = sh(l.realm);
    if (st.legacy && st.legacy.item) st.legacy.item.lv = sh(st.legacy.item.lv);
    if (st.bestRealm !== undefined) st.bestRealm = sh(st.bestRealm);
    st.v = 2;
  }
  /** Tạo dân bản địa và tông môn cho một vị diện, cho thế giới đó sống trước `years` năm */
  initPlane(plane, years = 0) {
    for (let i = 0; i < 3; i++) this.newSect(null, plane);
    for (let i = 0; i < LINH_SOULS; i++) { const b = this.newSoul(plane); b.reborn = this.s.year - this.r.int(0, Math.max(1, years)); }
    if (!years) return;
    const y0 = this.s.year;
    this._quiet = true;
    this.s.year = y0 - years;
    for (let y = 0; y < years; y++) {
      this.s.year++;
      for (const b of this.s.souls) if (b.plane === plane) this.botYear(b);
      this.botDuels(plane);
      this.sectYear(plane);
    }
    this.s.year = y0;
    this._quiet = false;
  }

  // ---------- Tạo, lưu, tải ----------
  static create(seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0, diff = 'thuong') {
    const st = {
      v: SAVE_VERSION, seed, rng: seed, year: 0, diff: WORLD_DIFF[diff] ? diff : 'thuong', unlock: {}, towerBest: {},
      souls: [], sects: [], chron: [], rel: {}, nextId: 1,
      player: null, draft: null, lives: [], legacy: null,
      phase: 'birth', pending: null, queue: [], log: [], cd: {}, once: {},
      rerolls: 3, deadInfo: null,
    };
    st.souls.push({ id: -1, plane: 1, alive: false, ascended: true }); // giữ chỗ để constructor không tự tạo Linh giới lần nữa
    const g = new Game(st);
    st.souls = st.souls.filter((b) => b.id !== -1);
    for (let i = 0; i < 4; i++) g.newSect(null);
    for (let i = 0; i < SOUL_COUNT; i++) {
      const b = g.newSoul();
      b.reborn = g.r.int(0, 140);
    }
    // Linh giới: dân bản địa cũng sống song song từ đầu
    for (let i = 0; i < 3; i++) g.newSect(null, 1);
    for (let i = 0; i < LINH_SOULS; i++) { const b = g.newSoul(1); b.reborn = g.r.int(0, 100); }
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
    if (!st || (st.v !== SAVE_VERSION && st.v !== 1)) throw new Error('save version');
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
  /** Vị diện đang xét: của người chơi nếu đang chơi, không thì Phàm giới */
  get plane() {
    return this.P ? this.P.plane || 0 : 0;
  }
  aliveSects(plane = this.plane) {
    return this.s.sects.filter((x) => x.alive && (x.plane || 0) === plane);
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
  chron(t, imp = 1, pl = this._pl ?? this.plane) {
    if (this._quiet && imp < 3) return;
    this.s.chron.push({ y: this.s.year, t, imp, pl });
    if (this.s.chron.length > 220) this.s.chron.splice(0, this.s.chron.length - 220);
  }
  /** Thông báo nổi cho tin quan trọng (giao diện hiện lần lượt) */
  toast(msg, head, tier = 4) {
    (this.s.toasts = this.s.toasts || []).push({ msg, head, tier });
    if (this.s.toasts.length > 5) this.s.toasts.shift();
  }
  log(t, tone = 'normal') {
    const P = this.P;
    this.s.log.push({ a: P ? P.age : 0, t, tone });
    if (this.s.log.length > 300) this.s.log.splice(0, this.s.log.length - 300);
  }

  // ---------- Thế giới ----------
  newSect(founder, plane = founder ? founder.plane || 0 : 0) {
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
      plane,
    };
    this.s.sects.push(sc);
    if (founder) {
      founder.sect = sc.id;
      this.chron(`${this.nm(founder)} khai sơn lập phái, dựng nên ${sc.name}.`, 2);
    }
    return sc;
  }
  newSoul(plane = 0) {
    const b = {
      id: this.s.nextId++, pers: this.r.pick(PERS_KEYS), alive: false, reborn: this.s.year,
      lives: 0, ascended: false, name: '', g: 'nam', age: 0, realm: PLANES[plane].base, tuvi: 0,
      rootM: 1, rootN: '', dao: false, sect: null, life: 60, fame: 0, kills: 0, cause: null, plane,
    };
    this.s.souls.push(b);
    return b;
  }
  incarnate(b) {
    if (b.name) b.prevName = b.name;
    b.g = this.r.chance(0.5) ? 'nam' : 'nu';
    b.name = this.genName(b.g);
    b.age = 0; b.realm = PLANES[b.plane || 0].base; b.tuvi = 0;
    const root = this.rollRoot();
    b.rootM = root.m; b.rootN = root.n;
    b.dao = false; b.sect = null; b.life = b.plane ? Math.round(REALMS[b.realm].life * this.r.range(0.7, 1.1)) : this.r.int(50, 72);
    b.map = null; b.mapUntil = 0; b.gq = 0; b.tt = null; b.tower = 0;
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
    return R.pow * (1 + subFrac(b.realm, b.tuvi) * 0.5) * (0.85 + b.rootM * 0.15) * (t.fx.fightMul || 1) * BOT_GQ_MUL[b.gq || 0];
  }
  /** Bot tự ước lượng tỉ lệ thắng yêu thú của một vùng (cùng đường cong với người chơi trung bình) */
  botOdds(b, map) {
    const R = REALMS[b.realm];
    const t = THE_MAP[b.the] || THE_MAP.pham;
    const k = (1 + subFrac(b.realm, b.tuvi) * 0.3) * (0.85 + b.rootM * 0.15) * (t.fx.fightMul || 1) * BOT_GQ_MUL[b.gq || 0];
    const x = map.pow / k;
    return 1 / (1 + Math.exp((x - 1.38) / 0.17));
  }
  /** Bot chọn vùng lịch luyện như người chơi: kẻ liều vào vùng khó, người cẩn trọng ở vùng dễ hoặc ở nhà tu luyện */
  botPickMap(b) {
    b.mapUntil = this.s.year + this.r.int(3, 8);
    if (!b.dao || b.age < 10 || !this.r.chance(BOT_OUT[b.pers] ?? 0.5)) { b.map = null; return; }
    const thr = (BOT_RISK[b.pers] ?? 0.55) + this.r.range(-0.1, 0.1);
    const ms = mapsOf(b.plane || 0);
    let best = ms[0];
    for (const m of ms) if (this.botOdds(b, m) >= thr) best = m;
    // đôi khi chọn thấp hơn một bậc cho chắc
    if (best.d > 0 && this.r.chance(0.3)) best = ms[best.d - 1];
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
    const ss = this.aliveSects(b.plane || 0);
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
    if (this.playing && r.met && close && !this.cool('tin_du', 6)) { this.log(`Tin dữ: ${b.name} ${cause}.`, 'bad'); this.toast(`${b.name} ${cause}.`, 'Tin dữ', 0); }
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
      // leo tháp: tiến dần tới tầng ngang sức mình
      if (b.age >= 10) {
        const cap = this.towerCapFor(b);
        if ((b.tower || 0) < cap && this.r.chance(0.5)) b.tower = Math.min(cap, (b.tower || 0) + this.r.int(1, 8));
      }
      const PL = PLANES[b.plane || 0];
      const atTop = b.realm === PL.top;
      // ở cảnh giới cuối: phải vượt hết tháp rồi mới độ kiếp phi thăng
      if (b.tuvi >= R.need && (!atTop || (b.tower || 0) >= 1000) && this.r.chance(0.35)) {
        const p = atTop ? 0.3 + (b.rootM - 1) * 0.1 : R.brk * 0.95 + (b.rootM - 1) * 0.08;
        if (this.r.chance(p)) {
          if (atTop) {
            this.chron(`Lôi kiếp chín tầng giáng xuống. ${b.name} phi thăng ${PL.next}, cả ${PL.n} chấn động.`, 3);
            const nb = this.newSoul(b.plane || 0);
            nb.reborn = this.s.year + this.r.int(1, 10);
            if ((b.plane || 0) === 0) {
              // sang Linh giới, làm lại từ cảnh giới đầu
              b.plane = 1; b.realm = PLANES[1].first; b.tuvi = 0; b.sect = null; b.map = null; b.tower = 0; b.gq = Math.min(b.gq || 0, 2); b.tt = null;
              b.life = Math.max(b.age + 300, Math.round(REALMS[b.realm].life * this.r.range(0.85, 1.15)));
              b.ascFrom = 0;
              this.chron(`Một người phi thăng từ hạ giới đáp xuống Tiếp Dẫn Đài: ${b.name}.`, 2, 1);
              return;
            }
            b.alive = false;
            b.ascended = true;
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
  botDuels(plane = 0) {
    this._pl = plane;
    const pool = this.s.souls.filter((b) => b.alive && b.dao && b.age >= 14 && (b.plane || 0) === plane);
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
  sectYear(plane = 0) {
    this._pl = plane;
    const ss = this.aliveSects(plane);
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
    if (this.aliveSects(plane).length < 2 && this.r.chance(0.1)) {
      const sc = this.newSect(null, plane);
      this.chron(`${sc.name} ẩn thế nhiều năm, nay mở cửa sơn môn thu nhận đệ tử.`, 2);
    }
    const nSects = this.aliveSects(plane).length;
    if (nSects < MAX_SECTS && this.r.chance(nSects < 3 ? 0.25 : 0.05)) {
      // người mạnh có chí lớn tách ra lập phái (kể cả khi đang ở tông khác)
      const cand = this.s.souls.filter((b) => b.alive && b.dao && (b.plane || 0) === plane && b.realm >= 3 && ['cuong', 'muu', 'nghia'].includes(b.pers) && (!b.sect || this.r.chance(0.3)));
      if (cand.length) this.newSect(this.r.pick(cand));
    }
  }
  worldYear() {
    this.s.year++;
    for (const b of this.s.souls) { this._pl = b.plane || 0; this.botYear(b); }
    for (const pl of [0, 1]) { this.botDuels(pl); this.sectYear(pl); }
    this._pl = undefined;
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
    const pl = this.plane;
    const list = this.s.souls.filter((b) => b.alive && (b.plane || 0) === pl && pred(b, this.s.rel[b.id]));
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
    if (OTHER_CAP_MUL[k]) other = Math.min(other, OTHER_CAP_MUL[k]);
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
  birthPlaneOk() {
    const pl = this.s.birthPlane || 0;
    return pl && this.s.unlock && this.s.unlock[pl] ? pl : 0;
  }
  /** Chọn giới để đầu thai (chỉ khi đã từng phi thăng lên đó) */
  setBirthPlane(pl) {
    if (pl !== 0 && !this.s.unlock[pl]) return;
    this.s.birthPlane = pl;
    const D = this.s.draft;
    if (D && this.s.phase === 'birth') { D.plane = pl; D.realm = PLANES[pl].base; D.map = PLANES[pl].map; }
  }
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
      hp: 100, age: 0, realm: PLANES[this.birthPlaneOk()].base, plane: this.birthPlaneOk(), tuvi: 0, dao: false, sect: null,
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
    const dr = this.diffReward();
    add(Math.round(([0, 2, 5, 10, 18, 30, 45, 55, 65, 80, 100, 115, 130, 150, 170, 195, 220, 250, 280][P.realm] || 0) * dr), `Đạt ${REALMS[P.realm].n}`);
    add(Math.floor(P.age / 50), `Sống ${P.age} năm`);
    const tt = (P.titles || []).reduce((m, id) => m + ([0, 1, 2, 4, 8][TITLE_MAP[id].tier] || 0), 0);
    add(tt, `${(P.titles || []).length} danh hiệu`);
    add((P.flags.newCodex || 0) * 3, `${P.flags.newCodex || 0} mục mới trong Sổ`);
    // kỷ lục so với các kiếp trước (kiếp vừa chết đã được ghi vào cuối sổ)
    const prev = this.s.lives.slice(0, -1);
    const best = this.s.bestRealm ?? (prev.length ? Math.max(...prev.map((l) => l.realm)) : -1);
    if (prev.length && P.realm > best) add(10, 'Phá kỷ lục cảnh giới của linh hồn');
    if (P.flags.ascendedFrom === 0) add(Math.round(100 * dr), 'Phi thăng Linh giới');
    if (P.ascended) add(Math.round(200 * dr), `Phi thăng ${PLANES[P.plane || 0].next}`);
    add(Math.round(this.towerBest() / 20), `Tháp: tầng ${this.towerBest()}`);
    let total = lines.reduce((m, x) => m + x.n, 0);
    // kiếp sống ở Linh giới (sinh ra hay phi thăng lên) được nhân đôi Hồn Lực
    if ((P.plane || 0) >= 1) { lines.push({ n: total, t: 'Kiếp ở Linh giới: nhân đôi' }); total *= 2; }
    return { total, lines };
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
    return baseGain(P.realm) * P.root.m * (1 + (P.stats.ngo - 50) / 200) * (P.sect ? 1.2 : 1) * (P.tinh <= -30 ? 1.2 : 1) * (P.hp < 30 ? 0.6 : 1) * this.tmul('gainMul') * (P.realm <= 2 ? this.tmul('earlyGain') : P.realm >= 4 ? this.tmul('lateGain') : 1) * (1 + this.tpFx('gainMul'));
  }
  /** loose: tu vi có được từ chiến đấu (chưa vững, cần tu luyện / bế quan củng cố) */
  addTuvi(n, loose = false) {
    const P = this.P;
    if (!P.dao) return 0;
    // sát khí từ 50: tu vi từ chiến đấu giảm 20%
    if (loose && P.sat >= this.satLine(50)) n *= 0.8;
    const before = P.tuvi;
    const need = this.need();
    P.tuvi = Math.min(need, P.tuvi + n);
    // bình cảnh nhỏ: kẹt ở hậu kỳ một thời gian
    const nk = P.flags.neck;
    if (nk && nk.realm === P.realm && P.tuvi > nk.cap) P.tuvi = Math.max(before, nk.cap);
    if (subN(P.realm) === 4 && before < need * 0.75 && P.tuvi >= need * 0.75) {
      P.flags.neckDone = P.flags.neckDone || {};
      if (!P.flags.neckDone[P.realm]) {
        P.flags.neckDone[P.realm] = true;
        if (this.r.chance(0.2)) {
          const yrs = this.r.int(3, 8);
          P.flags.neck = { realm: P.realm, cap: need * 0.75 - 0.001, until: P.age + yrs };
          P.tuvi = Math.max(before, P.flags.neck.cap);
          this.log(`Bình cảnh nhỏ: tu vi kẹt ở ${realmLabel(P.realm, P.tuvi)}, linh khí vào bao nhiêu cũng tan bấy nhiêu. Khoảng ${yrs} năm nữa mới tự thông, hoặc uống Tĩnh Tâm Đan, hoặc chờ một lúc ngộ đạo.`, 'bad');
        }
      }
    }
    const kb = subIdx(P.realm, before), ka = subIdx(P.realm, P.tuvi);
    // chỉ báo khi lần đầu lên tới nấc này (đột phá hỏng tụt lùi rồi tu lại thì không báo lại)
    const key = `${P.realm}`;
    P.flags.subMax = P.flags.subMax || {};
    if (ka > kb && ka > (P.flags.subMax[key] ?? 0)) { P.flags.subMax[key] = ka; this.log(`Tu vi tăng tiến, ngươi bước vào ${realmLabel(P.realm, P.tuvi)}.`, 'good'); }
    if (loose) P.loose = Math.min(P.tuvi, (P.loose || 0) + (P.tuvi - before));
    return Math.round(P.tuvi - before);
  }
  subRealmName(P = this.P) {
    return realmLabel(P.realm, P.tuvi);
  }
  monster(realm) {
    const r = clamp(realm, 0, TOP_REALM);
    const opts = MONSTERS.filter((m) => m.r === Math.min(r, MONSTERS[MONSTERS.length - 1].r));
    const m = this.r.pick(opts.length ? opts : MONSTERS);
    return { n: m.n, pow: REALMS[r].pow * this.r.range(0.75, 1.25), beast: true, r, seed: this.r.int(1, 1e6) };
  }
  // ---------- Chiến đấu ----------
  /** Sức mạnh gốc (chưa tính trang bị, sinh lực) */
  basePower() {
    const P = this.P;
    const R = REALMS[P.realm];
    return R.pow * (1 + subFrac(P.realm, P.tuvi) * 0.5) * (1 + (P.stats.can - 50) / 200) * (1 + Math.min(FIGHT_ADD_CAP, P.fight)) * (P.flags.pet ? (P.path === 'ngu_thu' ? 1.15 : 1.1) : 1) * this.tmul('fightMul');
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
  playerFighter(mul = 1, hp = null) {
    const P = this.P;
    const w = P.eq && P.eq.vu_khi;
    const gear = { ...gearStats(P.eq || {}, P.realm) };
    // tâm pháp chủ tu
    for (const k of ['crit', 'regenTurn', 'mpRegen', 'dmgRed']) { const v = this.tpFx(k); if (v) gear[k] = (gear[k] || 0) + v; }
    const pm = { ...(P.path && PATHS[P.path] ? PATHS[P.path].pm : {}) };
    const hpx = this.tpFx('hpPct');
    if (hpx) pm.hpPct = (pm.hpPct || 0) + hpx;
    // Ma tu: sát khí hóa thành sức mạnh
    if (P.path === 'ma' && P.sat > 0) mul *= 1 + Math.min(0.25, P.sat / 400);
    return fighter({
      name: P.name, pw: this.basePower() * mul, hpPct: (hp ?? P.hp) / 100,
      skills: P.loadout, wep: w ? w.wt : null, tactic: P.tactic, gear, pm,
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
    const P = this.P;
    // trận lớn: phù, Bạo Khí Đan, bạn trợ chiến
    const pre = opts.big ? this.bigFightBuffs(A) : [];
    const res = battle(A, B, this.r);
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
      const pd = opts.safe ? 0 : this.deathChance(B.maxHp / A.maxHp, opts.lethal ?? 0.15, knocked);
      let dies = !opts.safe && this.r.chance(pd);
      if (dies && (P.phu.truyen_tong || 0) > 0) {
        P.phu.truyen_tong--;
        dies = false;
        lines.push('Truyền Tống Phù trong ngực áo tự cháy, kéo ngươi ra khỏi tử địa trong gang tấc.');
      }
      if (dies) {
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
    if (pre.length) lines.unshift(pre.join(' '));
    // chiến đấu tích sát khí
    if (P.dao && this.playing) this.addSat(opts.big ? 4 : 1);
    res.a.hp0 = hp0;
    res.died = died;
    if (opts.tag) Object.assign(res, opts.tag);
    // trận lớn: có thể mất mạng thật (yêu thú vùng khó, kẻ thù, ma tu...), giao diện ưu tiên diễn lại
    res.big = died || (opts.lethal ?? 0.15) >= 0.4;
    if (this._sink) this._sink.push(res);
    else if (opts.replay) { const q = (this.s.replay = this.s.replay || []); q.push(res); if (q.length > 3) q.shift(); }
    const text = [head, ...lines].join('\n');
    if (died) this._battleDeath = text;
    return { win: res.win, died, text };
  }
  /** Xác suất mất mạng khi thua. gap: sức đối phương / sức mình */
  /** Hệ số sức mạnh của đối thủ theo độ khó thế giới */
  diffPow() {
    return (WORLD_DIFF[this.s.diff] || WORLD_DIFF.thuong).pow;
  }
  diffReward() {
    return (WORLD_DIFF[this.s.diff] || WORLD_DIFF.thuong).reward;
  }
  deathChance(gap, lethal, knocked = true) {
    const P = this.P;
    let p = lethal * (WORLD_DIFF[this.s.diff] || WORLD_DIFF.thuong).lethal * Math.pow(Math.max(0.5, Math.min(3, gap)), 1.4);
    // vào trận khi đang bị thương thì thua dễ mất mạng hơn (đầy máu x1, cạn máu tới x1,5)
    p *= 1 + 0.5 * (1 - clamp(P.hp, 0, 100) / 100);
    if (!knocked) p *= 0.3;
    if (P.age < 16) p *= 0.3;
    p -= (P.stats.co - 50) / 400;
    return clamp(p, 0.02, 0.9);
  }
  // ---------- Dựng đối thủ ----------
  genericFighter(foeName, foePow) {
    const r = new Rng([...foeName].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7));
    return fighter({
      name: foeName, pw: foePow * enemyGear(this.P.realm) * this.diffPow(), skills: ['quyen', r.pick(['han_bang', 'luu_van', 'liet_hoa', 'truy_hon'])], wep: r.pick(WEP_KEYS),
      look: { type: 'human', seed: r.int(1, 1e6), g: 'nam', age: 35, life: 80, realm: 0, robe: '#4a3f3a', wep: 'dao' },
    });
  }
  monsterFighter(m, scale = 1) {
    const r = new Rng(m.seed || 1);
    const sk = ['can_xe', r.pick(['doc_nha', 'cuong_bao', 'vay_giap', 'gam_thet'])];
    if (m.r >= 3 || (m.d || 0) >= 3) sk.push(r.pick(['vay_giap', 'cuong_bao', 'gam_thet']));
    // trùm tháp: bộ chiêu riêng
    if (m.skills) { sk.length = 0; sk.push('can_xe', ...m.skills); }
    // quái vùng khó coi như có trang bị tốt hơn; thiên phú của tinh anh/trùm thành chỉ số trong trận
    const eg = m.tower ? 1 : m.d !== undefined ? ENEMY_GEAR_D[m.d] * (m.r <= 0 ? 1 / 1.2 : 1) : enemyGear(m.r ?? this.P.realm);
    const gear = {};
    for (const id of m.aff || []) { const a = MOB_AFFIX_MAP[id]; if (a) for (const k in a.gear) gear[k] = typeof a.gear[k] === 'number' ? (gear[k] || 0) + a.gear[k] : a.gear[k]; }
    if (m.kitGear) for (const k in m.kitGear) gear[k] = (gear[k] || 0) + m.kitGear[k];
    if (m.rage) gear.atkPct = (gear.atkPct || 0) + m.rage;
    return fighter({ name: m.n, pw: m.pow * scale * eg * this.diffPow(), skills: [...new Set(sk)], beast: true, gear, look: { type: 'beast', seed: m.seed, realm: Math.min(m.r ?? 0, 7), name: m.n } });
  }
  botFighter(b) {
    return fighter({
      name: b.name, pw: this.power(b) * enemyGear(b.realm) * this.diffPow(), skills: this.botSkills(b), wep: this.botWep(b), tactic: b.pers === 'cuong' ? 'cuong_cong' : b.pers === 'an' ? 'phong_thu' : 'can_bang',
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
    const hp = this.P.hp;
    return `${word}: thắng ~${Math.round(p * 100)}%. Thua thì nguy hiểm tính mạng ~${Math.round(pd * 100)}%.${hp < 100 ? ` (Tính theo sinh lực hiện tại ${hp}/100.)` : ''}`;
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
    const mp = this.monsterMap(m);
    const res = this.runBattle(this.playerFighter(mul), this.monsterFighter(m, scale), { lethal: 0.35 * (mp ? mp.lethal : 1), cause: `bị ${m.n} giết chết`, ...opts });
    if (res.win) this.P.cnt.beast++;
    if (res.win && this.r.chance(mp ? Math.min(0.8, 0.25 * mp.loot) : 0.25)) res.text += '\n' + this.gainItem(this.dropItem(m.r ?? this.P.realm, null, mp));
    if (res.win && mp && this.playing) {
      const t = this.gatherMats(mp, true); if (t) res.text += '\n' + t;
      // hạ đủ 10 yêu thú ở một vùng (từ Khó trở lên) thì vùng chủ xuất hiện
      if (!m.boss && m.mapId && mp.d >= 2) {
        const P = this.P;
        P.mapKills = P.mapKills || {};
        P.mapKills[m.mapId] = (P.mapKills[m.mapId] || 0) + 1;
        if (P.mapKills[m.mapId] >= 10 && !this.s.queue.some((q) => q.id === 'vung_chu')) { P.mapKills[m.mapId] = 0; this.s.queue.push({ id: 'vung_chu', botId: null, data: { map: m.mapId } }); }
      }
    }
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
  // ---------- Tháp 1000 tầng ----------
  /** Tầng f ứng với cảnh giới nào và nấc nhỏ nào (k: 0..1) */
  floorRealm(plane, f) {
    const PL = PLANES[plane];
    const x = ((Math.max(1, Math.min(1000, f)) - 1) * 9) / 1000;
    const i = Math.min(8, Math.floor(x));
    return { r: PL.first + i, k: Math.min(1, Math.floor((x - i) * 4) / 3) };
  }
  floorKind(f) {
    return f >= 1000 ? 'final' : f % 100 === 0 ? 'boss' : f % 10 === 0 ? 'elite' : 'normal';
  }
  floorTheme(plane, f) {
    return TOWER_THEMES[plane][Math.min(9, Math.floor((Math.max(1, f) - 1) / 100))];
  }
  /** Sức mạnh quái ở tầng f (đã gồm trang bị của tháp) */
  floorPow(plane, f) {
    const { r, k } = this.floorRealm(plane, f);
    const kind = this.floorKind(f);
    // quái tháp mạnh dần cả về trang bị: tầng thấp dễ thở, tầng cao đòi đồ cường hóa thật sự
    const gear = 0.85 + 0.75 * Math.pow(f / 1000, 1.2);
    return REALMS[r].pow * (1 + 0.5 * k) * { normal: 1, elite: 1.2, boss: 1.4, final: 0.95 }[kind] * gear;
  }
  /** Tầng cao nhất mà bot đủ sức leo tới */
  towerCapFor(b) {
    const pw = this.power(b) * 1.25;
    let lo = 0, hi = 1000;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (this.floorPow(b.plane || 0, mid) <= pw) lo = mid; else hi = mid - 1; }
    return lo;
  }
  towerMonster(plane, f, rr = this.r) {
    const th = this.floorTheme(plane, f);
    const kind = this.floorKind(f);
    const { r } = this.floorRealm(plane, f);
    const m = { n: kind === 'boss' || kind === 'final' ? (kind === 'final' ? TOWER_THEMES[plane][9].boss : th.boss) : rr.pick(th.mobs), pow: this.floorPow(plane, f) * rr.range(0.95, 1.05), beast: true, r, seed: rr.int(1, 1e6), tower: true, kind, floor: f };
    if (kind === 'elite') this.makeElite(m, 1 + Math.floor(f / 400), rr);
    if (kind === 'boss') this.makeElite(m, 2, rr, 'Trùm tầng');
    if (kind === 'final') this.makeElite(m, 3, rr, 'Tháp chủ');
    m.pow /= 1 + 0.1 * (m.aff ? m.aff.length : 0); // floorPow đã tính sẵn độ mạnh tinh anh/trùm
    return m;
  }
  towerState(plane = this.plane) {
    const P = this.P;
    if (!P.tower[plane]) P.tower[plane] = { f: 0, recall: Math.floor((this.s.towerBest[plane] || 0) * 0.3), sweptAt: -999 };
    return P.tower[plane];
  }
  /** Tầng cao nhất đã vượt trong kiếp này (mọi giới) */
  towerBest() {
    const P = this.P;
    return Math.max(0, ...Object.values(P.tower || {}).map((t) => t.f || 0));
  }
  towerRanking(n = 10) {
    const pl = this.plane;
    const list = this.s.souls.filter((b) => b.alive && b.dao && (b.plane || 0) === pl && (b.tower || 0) > 0).map((b) => ({ name: b.name, f: b.tower || 0, id: b.id, realm: b.realm, tuvi: b.tuvi, me: false }));
    if (this.playing) list.push({ name: this.P.name, f: this.towerState().f, id: 0, realm: this.P.realm, tuvi: this.P.tuvi, me: true });
    return list.sort((a, b) => b.f - a.f).slice(0, n);
  }
  /** Phần thưởng lần đầu vượt một tầng thường / tinh anh. Trả về mảng chữ (đồ) để gộp vào nhật ký. */
  towerReward(f, kind) {
    const P = this.P;
    const { r } = this.floorRealm(this.plane, f);
    const dr = this.diffReward();
    this.money(Math.round(3 * (1 + (r % 10) * 1.5 + this.plane * 12) * dr));
    P.towerCoin = (P.towerCoin || 0) + (kind === 'elite' ? 5 : 1);
    const out = [];
    if (kind === 'elite') {
      const fr = 1 + P.realm;
      const q = rollQuality(this.r, 1 + f / 350, f >= 500 ? 0.02 + (f - 500) / 25000 : 0);
      this._forging = q >= 4; // đồ Thần thoại của tháp (từ tầng 500) được phép
      out.push(this.gainItem(makeItem(this.r, this.s.nextItem++, P.realm, q), `Rương tầng ${f}`));
      this._forging = false;
      P.mats.tinh_thiet = (P.mats.tinh_thiet || 0) + Math.round(2 * fr * dr);
      if (this.r.chance(0.4)) P.mats.linh_tinh = (P.mats.linh_tinh || 0) + Math.max(1, Math.round(fr * 0.5));
    }
    return out;
  }
  /** Mỗi lượt vượt tháp: leo vài tầng, dừng khi gặp trùm, tầng đặc biệt, thua hoặc sinh lực thấp */
  climbTower() {
    const P = this.P;
    const pl = this.plane;
    const T = this.towerState(pl);
    const name = PLANES[pl].tower;
    if (T.f >= 1000) { this.log(`${name} đã vượt hết 1000 tầng. Hãy đi tu luyện hoặc độ kiếp.`, 'muted'); return; }
    if (T.f < T.recall) {
      this.log(`Hồi ức tháp: ký ức kiếp trước dẫn đường, ngươi đi nhanh qua ${T.recall - T.f} tầng đầu của ${name} (không nhận thưởng).`, 'muted');
      T.f = T.recall;
    }
    const from = T.f;
    let n = this.r.int(2, 5);
    let stop = '';
    let lostAt = 0;
    const loot = [];
    while (n-- > 0 && T.f < 1000) {
      const f = T.f + 1;
      const kind = this.floorKind(f);
      if (kind === 'boss' || kind === 'final') { if (!this.s.queue.some((q) => q.id === 'thap_chu')) this.s.queue.push({ id: 'thap_chu', botId: null, data: { floor: f, plane: pl } }); stop = 'boss'; break; }
      if (kind === 'normal' && f > 5 && this.r.chance(1 / 12)) {
        const sp = this.specialFloor(f, pl);
        if (sp) { this.s.queue.push(sp); stop = 'special'; break; }
      }
      const m = this.towerMonster(pl, f);
      const hp0 = P.hp;
      let win;
      if (kind === 'elite') {
        // tinh anh mỗi 10 tầng: trận thật, ghi lại để diễn
        const th = this.floorTheme(pl, f);
        const res = this.runBattle(this.playerFighter(), this.monsterFighter(m), { safe: true, replay: true, tag: { tower: 'elite', label: `Tầng ${f} · ${th.n} · Tinh anh`, bg: THEME_BG[this.themeIdx(f)] } });
        win = res.win;
      } else {
        const res = battle(this.playerFighter(), this.monsterFighter(m), this.r);
        win = res.win;
        if (win) { P.cnt.win++; P.hp = Math.max(5, Math.min(P.hp, Math.round(hp0 - (hp0 - res.aHpPct * 100) * 0.6))); }
        else { P.cnt.lose++; P.hp = Math.max(1, Math.min(P.hp, this.r.int(5, 20))); }
      }
      if (win) {
        T.f = f;
        loot.push(...this.towerReward(f, kind));
        if (P.hp < 35) { stop = 'hp'; break; }
      } else {
        lostAt = f;
        stop = `Thua ${m.n} ở tầng ${f}. Cấm chế của tháp đẩy ngươi ra ngoài, sinh lực còn ${P.hp}.`;
        break;
      }
    }
    this.addSat(1.5 + (T.f - from) * 0.5);
    this.s.towerBest[pl] = Math.max(this.s.towerBest[pl] || 0, T.f);
    const th = this.floorTheme(pl, Math.max(1, T.f));
    const head = T.f > from ? `${name}: vượt tầng ${from + 1}${T.f > from + 1 ? `–${T.f}` : ''} (${th.n}).` : `${name}: dừng ở tầng ${T.f + 1}.`;
    const tail = stop === 'hp' ? ` Sinh lực còn ${P.hp}, ra ngoài nghỉ.` : stop.startsWith('Thua') ? ` ${stop}` : '';
    this.log(head + tail + (loot.length ? ` ${loot.map((x) => x.replace(/^Rương tầng \d+: /, '')).join(' ')}` : ''), stop.startsWith('Thua') ? 'bad' : 'muted');
    if (Math.floor(T.f / 100) > Math.floor(from / 100) && T.f % 100 !== 0) this.toast(`Đã qua tầng ${Math.floor(T.f / 100) * 100}.`, `🗼 Tầng ${T.f}/1000`, 1);
    if (lostAt) this.towerPause(lostAt, false);
    this.autoHeal();
  }
  themeIdx(f) {
    return Math.min(9, Math.floor((Math.max(1, f) - 1) / 100));
  }
  /** Thua (hoặc rút lui) trong tháp: chuyển sang tu luyện, đủ sức thì tự leo lại */
  towerPause(f, boss, why = '') {
    const P = this.P;
    if (!this.playing) return;
    P.towerWait = { f, boss: !!boss, at: P.age, chk: P.age };
    const pl = P.plan;
    if (pl && pl.on) {
      if (boss) this.planStop(`thua trùm tầng ${f}`);
      else { this.planAdvance(); return; }
    }
    if (P.action === 'vuot_thap') P.action = 'tu_luyen';
    const resume = this.s.opt.towerResume !== false;
    this.log(`${why || `Thua ở tầng ${f}`}. Tạm dừng vượt tháp, chuyển sang tu luyện.${resume ? ` Khi tỉ lệ thắng tầng ${f} đạt ${boss ? 75 : 60}% sẽ tự leo lại.` : ''}`, 'bad');
    this.toast(`${why || `Thua ở tầng ${f}`} · tạm dừng vượt tháp`, '🗼 Tháp', 1);
  }
  /** Tỉ lệ thắng tầng f (trùm: tính đủ mọi giai đoạn) */
  floorOdds(f, plane = this.plane) {
    const k = this.floorKind(f);
    if (k === 'boss' || k === 'final') return this.bossOdds(plane, f);
    const fix = { pick: (a) => a[0], range: () => 1, int: (a) => a, chance: () => false };
    return this.winOdds(() => this.monsterFighter(this.towerMonster(plane, f, fix)));
  }
  bossPhases(f) {
    return f >= 1000 ? 3 : 2;
  }
  /** Trùm tầng ở giai đoạn i, với bộ chiêu riêng của khu */
  bossMonster(plane, f, i = 0, typical = false) {
    const fix = { pick: (a) => a[0], range: () => 1, int: (a) => a, chance: () => false };
    const m = this.towerMonster(plane, f, typical ? fix : this.r);
    const idx = this.themeIdx(f);
    if (f >= 1000) {
      // Tháp chủ: mỗi giai đoạn mượn chiêu của ba trùm trước
      const ks = [0, 1, 2].map((j) => BOSS_KITS[Math.min(8, i * 3 + j)]);
      m.skills = [...new Set(ks.map((k) => k.sk[0]))];
      m.kitGear = {};
      for (const k of ks) for (const x in k.gear) m.kitGear[x] = (m.kitGear[x] || 0) + k.gear[x] * 0.7;
    } else {
      m.skills = BOSS_KITS[idx].sk.slice();
      m.kitGear = { ...BOSS_KITS[idx].gear };
    }
    if (i > 0) { m.rage = 0.25 * i; m.n = `${m.n} (nổi giận)`; }
    return m;
  }
  /** Tỉ lệ thắng trùm: đánh thử đủ chuỗi giai đoạn, máu mang sang giai đoạn sau */
  bossOdds(plane, f) {
    const P = this.P;
    const r = new Rng(777 + f);
    const n = this.bossPhases(f);
    const N = 24;
    let w = 0;
    for (let k = 0; k < N; k++) {
      let hp = P.hp;
      let ok = true;
      for (let i = 0; i < n && ok; i++) {
        const res = battle(this.playerFighter(1, hp), this.monsterFighter(this.bossMonster(plane, f, i, true)), r);
        if (!res.win) ok = false;
        else hp = Math.max(5, Math.min(hp, Math.round(hp - (hp - res.aHpPct * 100) * 0.6)));
      }
      if (ok) w++;
    }
    return w / N;
  }
  /** Tầng đặc biệt: chọn loại, có thể cần một bot */
  specialFloor(f, pl) {
    const types = ['thu_tam', 'ao_canh', 'guong', 'bao_kho', 'suoi_linh', 'thuong_nhan', 'lien_hoan', 'doi_thu', 'nguoi_ket', 'bia_ngo'];
    const type = this.r.pick(types);
    const data = { floor: f, plane: pl, type };
    let botId = null;
    if (type === 'doi_thu') {
      // đối thủ leo tháp: bot có tầng gần ngươi nhất
      const list = this.s.souls.filter((b) => b.alive && b.dao && (b.plane || 0) === pl && (b.tower || 0) > 0).sort((a, b) => Math.abs(a.tower - f) - Math.abs(b.tower - f));
      if (!list.length) data.type = 'suoi_linh'; else botId = list[0].id;
    }
    if (type === 'nguoi_ket') {
      const P = this.P;
      const b = this.findBot((x) => x.age >= 14 && x.dao && x.realm <= P.realm + 1, 1);
      if (!b) data.type = 'bao_kho'; else botId = b.id;
    }
    return { id: 'thap_dac_biet', botId, data };
  }
  /** Tháp thương điếm */
  towerBuy(id) {
    const P = this.P;
    const it = TOWER_SHOP.find((x) => x.id === id);
    if (!this.playing || !it || (P.towerCoin || 0) < it.price) return null;
    let msg = '';
    if (it.pill) { P.pills[it.pill[0]] = (P.pills[it.pill[0]] || 0) + it.pill[1]; msg = `Đổi được ${it.n}.`; }
    else if (it.mats) { const m = { tinh_thiet: 10 * (1 + P.realm), linh_tinh: 3 * (1 + P.realm) }; for (const k in m) P.mats[k] = (P.mats[k] || 0) + m[k]; msg = this.matText(m, 'Đổi được'); }
    else if (it.book) { msg = this.learnRandom(2, 3); if (!msg) return 'Bí kíp ở đây ngươi đã học hết.'; }
    else if (it.tamPhap) { msg = this.learnTamPhap(true); if (!msg) return 'Tâm pháp ở đây ngươi đã biết hết.'; }
    P.towerCoin -= it.price;
    return msg;
  }
  /** Phần thưởng lần đầu hạ trùm tầng (mỗi 100 tầng) và Tháp chủ (tầng 1000) */
  towerBossReward(f, plane = this.plane) {
    const P = this.P;
    const fr = 1 + P.realm;
    const dr = this.diffReward();
    const PL = PLANES[plane];
    const out = [];
    const mythP = f >= 1000 ? 1 : f >= 500 ? 0.1 + (f - 500) / 2000 : 0;
    this._forging = true;
    out.push(this.gainItem(makeItem(this.r, this.s.nextItem++, P.realm, this.r.chance(mythP) ? 4 : 3), f >= 1000 ? 'Tháp chủ để lại' : `Trùm tầng ${f} rơi`));
    this._forging = false;
    if (this.r.chance(0.5) || f >= 1000) { const sk = this.learnRandom(2, 3); if (sk) out.push(sk); }
    const m = { tinh_thiet: Math.round(5 * fr * dr), linh_tinh: Math.round(2 * fr * dr) };
    if (f >= 500) m[mythMatOf(plane)] = f >= 1000 ? 3 : 1;
    for (const k in m) P.mats[k] = (P.mats[k] || 0) + m[k];
    out.push(this.matText(m, 'Thu được'));
    const money = Math.round(60 * fr * dr * (f / 100));
    this.money(money);
    const coin = f >= 1000 ? 100 : 30;
    P.towerCoin = (P.towerCoin || 0) + coin;
    out.push(`Tháp tệ +${coin}.`);
    if (f < 1000) this.toast(`Hạ trùm tầng ${f} ${PL.tower}.`, `🗼 Tầng ${f}/1000`, 2);
    if (this.r.chance(0.3)) { const t = this.learnTamPhap(); if (t) out.push(t); }
    this.fame(Math.round(f / 50));
    out.push(`Linh thạch +${money}.`);
    if (f >= 1000) {
      P.tokens[plane] = true;
      P.flags.notifiedFull = false;
      this.chron(`${this.fullName()} vượt tầng 1000 ${PL.tower}, đoạt ${PL.token}.`, 3);
      this.toast(`${PL.token} vào tay. Tu vi viên mãn ở ${REALMS[PL.top].n} là có thể độ kiếp phi thăng.`, 'Vấn đỉnh tháp', 4);
      out.push(`\n${PL.token} vào tay! Có lệnh bài này, tu vi ${REALMS[PL.top].n} viên mãn là có thể độ kiếp phi thăng ${PL.next}.`);
    } else if (f % 500 === 0) this.chron(`${this.fullName()} vượt tầng ${f} ${PL.tower}.`, 2);
    this.checkTitles();
    return out.join('\n');
  }
  /** Bóng gương: mạnh đúng bằng ngươi */
  mirrorFighter() {
    const A = this.playerFighter();
    return { ...A, name: 'Bóng của ngươi', st: { ...A.st }, skills: A.skills.slice(), look: { ...A.look, seed: (A.look.seed || 1) + 7 } };
  }
  /** Vùng chủ: yêu thú mạnh nhất vùng, 2 thiên phú. typical: bản cố định để ước lượng */
  mapBoss(mapId, typical = false) {
    const map = MAP_MAP[mapId];
    const rr = typical ? { pick: (a) => a[a.length - 1], range: () => 1, int: (a) => a, chance: () => false } : this.r;
    const m = this.mapMonster(map, rr);
    delete m.aff; m.n = m.n.replace(/^(\S+ · )+/, '');
    m.boss = true;
    m.pow *= 1.6;
    this.makeElite(m, 2, rr, 'Vùng chủ');
    m.n = `Vùng chủ ${m.n}`;
    return m;
  }
  /** Quét các tầng đã vượt để nhặt nguyên liệu (mỗi 10 năm một lần) */
  sweepTower() {
    const P = this.P;
    const T = this.towerState();
    if (T.f < 50 || P.age - T.sweptAt < 10) return null;
    T.sweptAt = P.age;
    const fr = 1 + P.realm;
    const got = { tinh_thiet: Math.round((T.f / 40) * fr), linh_tinh: Math.max(1, Math.round((T.f / 200) * fr)) };
    for (const k in got) P.mats[k] = (P.mats[k] || 0) + got[k];
    return this.matText(got, 'Quét tháp');
  }

  /** Vùng mặc định (Vừa) của vị diện đang ở */
  defaultMap() {
    return MAP_MAP[PLANES[this.plane].map];
  }
  /** Vùng mà một con yêu thú thuộc về (nếu là yêu thú của vùng lịch luyện) */
  monsterMap(m) {
    return m && m.mapId ? MAP_MAP[m.mapId] : m && m.d !== undefined ? MAPS[m.d] : null;
  }
  /** Vùng đang lịch luyện. Trong một kỳ ngộ thì là vùng lúc kỳ ngộ xảy ra. */
  curMap() {
    const P = this.P;
    if (!P) return null;
    const p = this.s.pending;
    if (p && p.map !== undefined) return p.map ? MAP_MAP[p.map] : null;
    if (this.effectiveAction() !== 'lich_luyen') return null;
    return MAP_MAP[P.map] || this.defaultMap();
  }
  setMap(id) {
    if (!this.playing || !MAP_MAP[id]) return;
    const P = this.P;
    P.map = id;
    P.mapGoal = id;
    P.flags.mapWarned = false;
    P.flags.retreated = false;
    // cố ý vào khi đang bị thương thì không tự lui ngay, đợi hồi lên 40 rồi tụt lại mới tính
    P.flags.enteredLow = P.hp < 40;
    this.setAction('lich_luyen');
  }
  /** Yêu thú của vùng: cùng cảnh giới với ngươi, sức mạnh nhân theo độ khó */
  mapMonster(map = this.curMap(), rr = this.r) {
    const P = this.P;
    if (!map) return this.monster(P.realm);
    const PL = PLANES[map.plane || 0];
    const nr = clamp(P.realm + Math.floor(map.d / 2), PL.base, PL.top);
    const opts = MONSTERS.filter((m) => m.r === nr);
    const pick = rr.pick(opts.length ? opts : MONSTERS.filter((m) => planeOf(m.r) === PL.id));
    // quái mạnh theo cả cảnh giới nhỏ của ngươi: lợi thế chỉ còn ở trang bị, võ kỹ, cách xây nhân vật
    const sub = 1 + 0.5 * subFrac(P.realm, P.tuvi);
    const m = { n: map.d >= 2 && map.beast ? `${map.beast} ${pick.n}` : pick.n, pow: REALMS[P.realm].pow * map.pow * sub * rr.range(0.85, 1.15), beast: true, r: P.realm, d: map.d, mapId: map.id, seed: rr.int(1, 1e6) };
    // tinh anh: vùng càng khó càng hay gặp, mang 1-3 thiên phú
    const eliteP = [0, 0, 0.15, 0.25, 0.35, 0.5][map.d] || 0;
    if (eliteP && rr.chance(eliteP)) this.makeElite(m, rr.int(1, Math.min(3, map.d - 1)), rr);
    return m;
  }
  /** Gắn thiên phú cho quái (tinh anh, trùm) */
  makeElite(m, n, rr = this.r, tag = 'Tinh anh') {
    const pool = MOB_AFFIX.map((a) => a.id);
    m.aff = [];
    for (let i = 0; i < n && pool.length; i++) m.aff.push(pool.splice(rr.int(0, pool.length - 1), 1)[0]);
    m.n = `${m.aff.map((id) => MOB_AFFIX_MAP[id].n).join(' · ')} ${m.n}`;
    m.tag = tag;
    m.pow *= 1 + 0.1 * n;
    return m;
  }
  /** Yêu thú điển hình của vùng (không phải tinh anh), dùng cho cảnh báo tỉ lệ thắng */
  typicalMonster(map) {
    const m = this.mapMonster(map, { pick: (a) => a[0], range: () => 1, int: () => 7700 + map.d, chance: () => false });
    return m;
  }
  /** Tỉ lệ thắng một con yêu thú điển hình của vùng (dùng cho cảnh báo) */
  mapOdds(id) {
    const map = MAP_MAP[id];
    const m = this.typicalMonster(map);
    return this.winOdds(() => this.monsterFighter(m));
  }
  mapRisk(id) {
    const map = MAP_MAP[id];
    const m = this.typicalMonster(map);
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
      const rare = RARE_MATS.has(map.mat);
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
    if (it.q >= 4) y[mythMatOf(planeOf(it.lv))] = 1;
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
    const fm = this.forgeMul();
    const c = { tinh_thiet: Math.ceil((2 + 1.5 * n) * f * fm), money: Math.round(10 * (n + 1) * f * fm) };
    if (n >= 4) c.linh_tinh = (n - 3) * f;
    if (it.q >= 4 && n >= 7) c[mythMatOf(planeOf(it.lv))] = 1;
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
    if (it.q >= 4) c[mythMatOf(this.plane)] = 1;
    // linh hóa: đồ hạ giới lên giới trên cần Linh tủy
    if (planeOf(it.lv) < this.plane) c.linh_tuy = 2 * (1 + it.q);
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
  rerollAffix(id, idx, cat = null) {
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
    const fm = this.forgeMul();
    const c = myth ? { tinh_thiet: Math.ceil(20 * f * fm), linh_tinh: 5 * f, [mythMatOf(this.plane)]: 3, money: Math.round(200 * f * fm) } : { tinh_thiet: Math.ceil(6 * f * fm), linh_tinh: f, money: Math.round(30 * f * fm) };
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
    if (P.plane === undefined) P.plane = planeOf(P.realm || 0);
    if (!P.tokens) P.tokens = {};
    if (!P.tower) P.tower = {};
    if (!P.map || !MAP_MAP[P.map] || MAP_MAP[P.map].plane !== P.plane) P.map = PLANES[P.plane].map;
    if (P.forge === undefined) P.forge = 0;
    // vai trò của các việc làm: sát khí, căn cơ (tu vi chưa vững), tâm pháp, nghề phụ, phù, Tháp tệ, lịch trình
    if (P.sat === undefined) P.sat = 0;
    if (P.loose === undefined) P.loose = 0;
    if (!P.tpLv) P.tpLv = {};
    if (!P.tpXp) P.tpXp = {};
    if (P.tp === undefined) P.tp = null;
    if (P.nghe === undefined) P.nghe = null;
    if (!P.phu) P.phu = {};
    if (P.towerCoin === undefined) P.towerCoin = 0;
    if (P.plan === undefined) P.plan = null;
    if (P.towerWait === undefined) P.towerWait = null;
    if (P.brkBonus === undefined) P.brkBonus = 0;
    if (P.sanNghiep === undefined) P.sanNghiep = 0;
    if (P.dao && !P.tp) { P.tp = 'thanh_tam'; P.tpLv.thanh_tam = P.tpLv.thanh_tam || 1; }
    for (const id of ['ngung_than', 'bao_khi']) if (P.pills && P.pills[id] === undefined) P.pills[id] = 0;
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
    const m = `Lĩnh ngộ võ kỹ: ${skillToken(id, SKILLS[id])}${SKILLS[id].n}.`;
    this.log(m, 'good');
    return m;
  }
  /** Xếp 4 võ kỹ mạnh nhất dùng được với binh khí đang cầm: 3 chiêu đánh + 1 chiêu hộ thể/hồi phục nếu có */
  autoLoadout() {
    const P = this.P;
    const w = P.eq && P.eq.vu_khi ? P.eq.vu_khi.wt : null;
    const ok = P.skills.filter((id) => SKILLS[id] && (!SKILLS[id].wep || SKILLS[id].wep === w));
    const power = (id) => { const k = SKILLS[id]; return (k.path ? 5 : 0) + k.tier * 3 + (k.mult || 0) * (k.hits || 1); };
    const atk = ok.filter((id) => SKILLS[id].kind === 'atk' && id !== 'quyen').sort((a, b) => power(b) - power(a));
    const def = ok.filter((id) => SKILLS[id].kind !== 'atk').sort((a, b) => power(b) - power(a));
    const pick = [...atk.slice(0, def.length ? 3 : 4), ...def.slice(0, 1)];
    for (const id of [...atk.slice(3), ...def.slice(1)]) if (pick.length < 4) pick.push(id);
    if (pick.length < 4) pick.push('quyen');
    const before = P.loadout.join();
    P.loadout = [...new Set(pick)].slice(0, 4);
    return before !== P.loadout.join();
  }
  /** Đặt võ kỹ vào ô i (0-3) của bộ mang theo; đã ở ô khác thì đổi chỗ */
  setSkillSlot(i, id) {
    const P = this.P;
    if (!P.skills.includes(id) || i < 0 || i > 3) return;
    const L = P.loadout;
    const j = L.indexOf(id);
    if (j === i) return;
    if (i >= L.length) { if (j >= 0) return; L.push(id); return; }
    if (j >= 0) [L[i], L[j]] = [L[j], L[i]];
    else L[i] = id;
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
    if (it.q >= 4) this.toast(`${tk}${it.n}${it.tt && TT_MAP[it.tt] ? ` · 「${TT_MAP[it.tt].n}」` : ''}`, 'Thần khí vào tay', 4);
    if (!P.eq[it.slot]) {
      P.eq[it.slot] = it;
      const m = `${prefix}: ${tk}${it.n} (${qn}), đã mang vào người.`;
      this.log(m, 'good');
      return m;
    }
    if (this.s.opt && this.s.opt.autoEquip && this.betterThanEquipped(it)) {
      const old = P.eq[it.slot];
      P.eq[it.slot] = it;
      P.bag.push(old);
      let m = `${prefix}: ${tk}${it.n} (${qn}), tốt hơn ${itemName(old)} nên mang vào luôn.`;
      if (P.bag.length > BAG_MAX) m += this.trimBag();
      this.log(m, 'good');
      return m;
    }
    P.bag.push(it);
    let msg = `${prefix}: ${tk}${it.n} (${qn}).`;
    if (P.bag.length > BAG_MAX) msg += this.trimBag();
    this.log(msg, 'good');
    return msg;
  }
  /** Túi đầy: bán hoặc phân giải món kém nhất, trả về câu thông báo */
  trimBag() {
    const P = this.P;
    let msg = '';
    {
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
    return this.effScore(it) > this.effScore(this.P.eq[it.slot]);
  }
  /** Điểm thực dùng: đồ Thần thoại bị phong ấn thì tính theo sức đang phát huy */
  effScore(it) {
    if (!it) return 0;
    let sc;
    if (!isSealed(it, this.P.realm)) sc = itemScore(it);
    else { const g = gearStats({ x: it }, this.P.realm); sc = g.atk * 3 + g.def * 4 + g.hp * 0.5; }
    // vũ khí không hợp võ kỹ đang mang thì kém giá trị hơn với ngươi
    if (it.slot === 'vu_khi') { const need = this.wepNeeded(); if (need && it.wt !== need) sc *= 0.6; }
    return sc;
  }
  /** Loại binh khí mà võ kỹ đang mang cần nhiều nhất (null nếu không cần) */
  wepNeeded() {
    const cnt = {};
    for (const id of this.P.loadout || []) { const w = SKILLS[id] && SKILLS[id].wep; if (w) cnt[w] = (cnt[w] || 0) + 1; }
    const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  }
  /** Võ kỹ đang mang mà không hợp binh khí đang cầm */
  skillMismatch() {
    const P = this.P;
    const w = P.eq && P.eq.vu_khi ? P.eq.vu_khi.wt : null;
    return (P.loadout || []).filter((id) => SKILLS[id] && SKILLS[id].wep && SKILLS[id].wep !== w);
  }
  /** Mặc món tốt nhất cho mỗi ô. Trả về số món đã đổi. */
  equipBest() {
    const P = this.P;
    let n = 0;
    for (const slot of ['vu_khi', 'ao', 'phu_kien']) {
      const best = P.bag.filter((x) => x.slot === slot).sort((a, b) => this.effScore(b) - this.effScore(a))[0];
      if (best && this.effScore(best) > this.effScore(P.eq[slot])) { this.equip(best.id); n++; }
    }
    return n;
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
    return `Học được ${skillToken(id, SKILLS[id])}${SKILLS[id].n}.`;
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
    P.closeLen = years;
    P.closeServed = 0;
    this.log(`Ngươi phong bế động phủ, ${years >= 50 ? 'tử quan' : 'bế quan'} ${years} năm.`, 'muted');
    return true;
  }
  pillPrice(id) {
    return Math.round(PILLS[id].price * (1 + this.P.realm) * this.shopMul());
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
    if (id === 'ngung_than') { const b = P.sat; P.sat = Math.max(0, P.sat - 40 * pm); return `Sát khí ${Math.round(b)} → ${Math.round(P.sat)}.`; }
    if (id === 'bao_khi') { if (P.flags.baoKhi) { P.pills[id]++; return 'Dược lực viên trước còn chưa dùng tới.'; } P.flags.baoKhi = true; return 'Khí huyết sôi trào, trận lớn kế tiếp công +30%.'; }
    if (id === 'tinh_tam') {
      this.stat('tam', Math.round(6 * pm));
      if (P.flags.neck) { P.flags.neck = null; this.log('Tĩnh Tâm Đan tan trong đan điền, bình cảnh nhỏ vỡ tan.', 'good'); return `Tâm tính +${Math.round(6 * pm)}. Bình cảnh nhỏ đã phá.`; }
      return `Tâm tính +${Math.round(6 * pm)}.`;
    }
    if (id === 'dien_tho') {
      P.dienTho[P.realm] = true;
      P.lifeBonus += 0.05;
      return `Thọ nguyên tăng lên ${this.lifespan()}.`;
    }
    return null;
  }
  /** Sinh lực dưới 40: tự uống Hồi Xuân Đan (hết thì tự mua nếu bật). Trả về số viên đã uống. */
  autoHeal() {
    const P = this.P;
    const o = this.s.opt || {};
    if (!this.playing || !o.autoPill || P.hp >= 40) return 0;
    let n = 0;
    const hp0 = P.hp;
    while (P.hp < 40 && n < 3) {
      if (!(P.pills.hoi_xuan > 0) && o.autoBuyPill && P.money >= this.pillPrice('hoi_xuan')) { this.buy('hoi_xuan'); P.flags.pillBought = (P.flags.pillBought || 0) + 1; }
      if (!(P.pills.hoi_xuan > 0)) break;
      this.usePill('hoi_xuan');
      n++;
    }
    if (n) {
      P.flags.noPillWarned = false;
      this.log(`Sinh lực còn ${hp0}, tự uống ${n} viên Hồi Xuân Đan: sinh lực ${P.hp}. Còn ${P.pills.hoi_xuan || 0} viên.`, 'muted');
    } else if (!P.flags.noPillWarned) {
      P.flags.noPillWarned = true;
      this.toast(`Sinh lực còn ${P.hp} mà hết Hồi Xuân Đan${o.autoBuyPill ? ', cũng không đủ linh thạch để mua' : ''}.`, 'Hết đan', 0);
    }
    return n;
  }
  canBreak() {
    const P = this.P;
    if (!(this.playing && P.dao && P.tuvi >= this.need() && !this.s.pending)) return false;
    // cảnh giới cuối mỗi giới: cần lệnh bài của tháp
    return !this.atPlaneTop() || !!(P.tokens && P.tokens[P.plane]);
  }
  atPlaneTop(P = this.P) {
    return P.realm === PLANES[P.plane || 0].top;
  }
  /** Sức mạnh đợt lôi kiếp thứ k (1..9) */
  kiepPow(k) {
    const P = this.P;
    return REALMS[P.realm].pow * 1.5 * (0.75 + 0.075 * (k - 1)) * 1.2;
  }
  /** Vượt hết lôi kiếp: lên giới trên (người chơi đi tiếp) hoặc phi thăng hẳn */
  ascendPlane() {
    const P = this.P;
    const from = P.plane || 0;
    const PL = PLANES[from];
    if (from === 0) {
      const old = REALMS[P.realm].n;
      P.plane = 1; P.realm = PLANES[1].first; P.tuvi = 0;
      P.flags.ascendedFrom = 0; P.flags.notifiedFull = false; P.flags.neck = null;
      P.sect = null; P.flags.chuongMon = undefined; P.closed = 0; P.hp = 100;
      P.map = PLANES[1].map; P.mapGoal = P.map; P.flags.retreated = false;
      if (P.action === 'lich_luyen' || P.action === 'vuot_thap') P.action = 'tu_luyen';
      this.s.unlock[1] = true;
      this.fame(50);
      this.chron(`${this.fullName()} vượt chín đạo lôi kiếp, phi thăng Linh giới. Cả Phàm giới chấn động.`, 3, 0);
      this.chron(`Tiếp Dẫn Đài sáng rực: ${P.name} từ hạ giới phi thăng lên.`, 2, 1);
      this.log(`Ngươi phi thăng Linh giới! Từ ${old}, ngươi đáp xuống Tiếp Dẫn Đài, bắt đầu lại ở ${REALMS[P.realm].n}. Thọ nguyên ${this.lifespan()} năm. Đồ hạ giới bị pháp tắc áp chế, mang Linh tủy tới lò rèn để linh hóa.`, 'big');
      this.toast('Phi thăng Linh giới!', 'Phi thăng', 4);
      this.checkTitles();
      return `Đạo lôi thứ chín tan vào thân thể ngươi. Một cột sáng từ trời rủ xuống, kéo ngươi lên qua tầng mây.\n\nNgươi đáp xuống Tiếp Dẫn Đài của Linh giới. Linh khí đậm đặc gấp trăm lần hạ giới. Ở đây ngươi chỉ là kẻ mới: ${REALMS[P.realm].n} sơ kỳ.`;
    }
    P.ascended = true;
    this.s.unlock[from + 1] = true;
    this.die(`vượt qua lôi kiếp, phi thăng ${PL.next}`);
    return `Đạo lôi cuối cùng tan biến. Cổng ${PL.next} mở ra trên đỉnh trời.\n\nNgươi phi thăng.`;
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
    p += this.brkMods().reduce((m, x) => m + x.v, 0);
    return clamp(p, 0.05, 0.95);
  }
  /** Các yếu tố mới của đột phá: căn cơ, sát khí, bế quan, tâm pháp */
  brkMods() {
    const P = this.P;
    const out = [];
    const lo = Math.min(1, (P.loose || 0) / Math.max(1, this.need()));
    if (lo > 0.02) out.push({ n: `Căn cơ chưa vững (${Math.round(lo * 100)}% tu vi)`, v: -0.3 * lo });
    if (P.sat >= this.satLine(70)) out.push({ n: `Sát khí ${Math.round(P.sat)}`, v: -0.1 });
    if (P.brkBonus) out.push({ n: 'Vừa bế quan xong', v: P.brkBonus });
    const tb = this.tpFx('brk');
    if (tb) out.push({ n: TAM_PHAP[P.tp].n, v: tb });
    return out;
  }
  attemptBreak(bonus = 0) {
    const P = this.P;
    if (!this.playing || P.tuvi < this.need()) return '';
    const p = this.breakChance(bonus);
    if (!this.atPlaneTop()) P.brkBonus = 0;
    const helpers = this.breakHelpers();
    const helpTxt = helpers.length ? `\n${helpers.map(({ b }) => b.name).join(', ')} hộ pháp bên ngoài động phủ.` : '';
    const lightning = P.realm >= 2 ? 'Mây đen kéo tới, lôi kiếp giáng xuống từng đạo một. ' : '';
    P.flags.notifiedFull = false;
    if (this.atPlaneTop()) {
      // độ kiếp phi thăng: chín đợt lôi kiếp là chín trận thật, giữa các đợt không hồi phục
      this.next('loi_kiep', { wave: 1 });
      return `Mây kiếp đen kịt phủ kín trời, rộng cả trăm dặm. Chín đạo lôi kiếp sắp giáng xuống, đạo sau mạnh hơn đạo trước.${helpTxt}`;
    }
    if (this.r.chance(p)) {
      P.realm++;
      if (P.realm >= 2 && P.daoHieu === undefined) this.s.queue.push({ id: 'dao_hieu', botId: null, data: { opts: this.genDaoHieuOpts() } });
      P.tuvi = 0;
      P.loose = 0;
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
    P.loose = Math.min(P.loose || 0, P.tuvi);
    const dmg = 10 + P.realm * 5;
    const deathP = P.realm >= 3 ? clamp(0.05 + P.realm * 0.015 - (P.stats.tam - 50) / 1000, 0.01, 0.3) : 0;
    if (this.r.chance(deathP)) {
      this.die('đột phá thất bại, kinh mạch đứt đoạn');
      return `${lightning}Linh khí chạy ngược, kinh mạch nổ tung từng đoạn.${helpTxt}`;
    }
    const dead = this.hurt(dmg, 'đột phá thất bại, thương thế quá nặng');
    return `${lightning}Linh khí chạy ngược, ngươi phun ra một ngụm máu.${helpTxt}\n\nĐột phá thất bại. Tu vi tụt còn 70%, sinh lực -${dmg}.${dead ? '' : ' Lần sau hãy chuẩn bị kỹ hơn.'}`;
  }


  /** Đang tu luyện vì thua tháp: mỗi 5 năm xem lại, đủ sức thì tự leo tiếp */
  towerResumeCheck() {
    const P = this.P;
    const w = P.towerWait;
    if (!w || (P.plan && P.plan.on) || this.s.opt.towerResume === false) return;
    if (P.action !== 'tu_luyen' || P.closed > 0 || P.hp < 70) return;
    if (P.age - (w.chk ?? w.at) < 5) return;
    w.chk = P.age;
    const T = this.towerState();
    const f = Math.max(w.f, T.f + 1);
    if (f > 1000) { P.towerWait = null; return; }
    const boss = this.floorKind(f) === 'boss' || this.floorKind(f) === 'final';
    const p = this.floorOdds(f);
    if (p < (boss ? 0.75 : 0.6)) return;
    P.towerWait = null;
    P.action = 'vuot_thap';
    this.log(`Tu luyện xong một chặng, tỉ lệ thắng tầng ${f} đã lên ~${Math.round(p * 100)}%. Ngươi quay lại tháp.`, 'good');
    this.toast(`Đủ sức rồi (~${Math.round(p * 100)}%), quay lại tầng ${f}.`, '🗼 Tự leo lại', 1);
  }
  /** Kết giao: trả ân tình, bạn tặng quà, thanh danh */
  socialPerks() {
    const P = this.P;
    const owed = this.known().find(({ r }) => r.owe);
    if (owed) {
      owed.r.owe = false;
      this.relAdd(owed.b, 5);
      this.log(`Ngươi dành thời gian giúp ${owed.b.name} một việc lớn, trả xong ân tình lần trước. Thân thiết +5.`, 'muted');
      return;
    }
    if (this.r.chance(0.3)) this.fame(1);
    const fr = this.known().filter(({ r }) => r.v >= 50);
    if (fr.length && this.r.chance(0.15)) {
      const { b } = this.r.pick(fr);
      const k = this.r.int(0, 3);
      const f = 1 + P.realm;
      let t;
      if (k === 0) { P.pills.hoi_xuan = (P.pills.hoi_xuan || 0) + 2; t = '2 viên Hồi Xuân Đan'; }
      else if (k === 1) { const m = { tinh_thiet: 4 * f, linh_tinh: Math.max(1, Math.round(f / 2)) }; for (const x in m) P.mats[x] = (P.mats[x] || 0) + m[x]; t = 'một túi Tinh thiết, Linh tinh'; }
      else if (k === 2) { const n = Math.round(30 * f * (1 + this.plane * 4)); this.money(n); t = `${fmtN(n)} linh thạch`; }
      else { P.pills.ngung_than = (P.pills.ngung_than || 0) + 1; t = 'một viên Ngưng Thần Đan'; }
      this.log(`${b.name} tặng ngươi ${t}.`, 'good');
    }
  }

  // ---------- Sát khí ----------
  /** Ngưỡng sát khí (Ma tu chịu được cao hơn 20) */
  satLine(v) {
    return this.P.path === 'ma' ? v + 20 : v;
  }
  addSat(n) {
    const P = this.P;
    if (!P || !P.dao) return;
    if (n > 0 && P.path === 'ma') n *= 0.7;
    const before = P.sat || 0;
    P.sat = clamp(before + n, 0, 100);
    const top = this.satLine(100) > 100 ? 100 : 100;
    if (n > 0 && before < this.satLine(80) && P.sat >= this.satLine(80) && P.sat < top) this.toast(`Sát khí ${Math.round(P.sat)}. Tới 100 sẽ tẩu hỏa nhập ma. Nên tu luyện, bế quan hoặc kết giao để xả.`, '☠ Sát khí cao', 1);
  }
  /** Xả sát khí (Phật tu nhanh gấp đôi, Tĩnh Thần Quyết nhanh thêm) */
  purgeSat(n) {
    const P = this.P;
    if (!P || !(P.sat > 0)) return;
    const m = (P.path === 'phat' ? 2 : 1) * (1 + this.tpFx('satPurge'));
    P.sat = Math.max(0, P.sat - n * m);
  }
  /** Sát khí đầy: tẩu hỏa nhập ma */
  checkSat() {
    const P = this.P;
    if (!(P.sat >= 100)) return false;
    const lost = Math.floor(P.tuvi * 0.2);
    P.tuvi -= lost;
    P.loose = Math.min(P.loose || 0, P.tuvi);
    P.sat = 60;
    this.log(`Sát khí ngập đầu, ngươi tẩu hỏa nhập ma! Kinh mạch rối loạn, tu vi mất ${fmtN(lost)}.`, 'bad');
    this.toast('Tẩu hỏa nhập ma: trọng thương, mất tu vi. Hãy bế quan hoặc tu luyện để xả sát khí.', '☠ Tẩu hỏa nhập ma', 0);
    if (P.plan && P.plan.on) this.planStop('tẩu hỏa nhập ma');
    if (P.action === 'vuot_thap') { const T = this.towerState(); P.towerWait = { f: T.f + 1, boss: false, at: P.age, chk: P.age }; }
    if (P.action === 'vuot_thap' || P.action === 'lich_luyen') P.action = 'tu_luyen';
    return this.hurt(40, 'tẩu hỏa nhập ma, kinh mạch nổ tung');
  }

  // ---------- Tâm pháp ----------
  tpFx(k) {
    const P = this.P;
    if (!P || !P.tp || !TAM_PHAP[P.tp]) return 0;
    const v = TAM_PHAP[P.tp].fx[k];
    return v ? v * (P.tpLv[P.tp] || 1) : 0;
  }
  tpNeed(lv) {
    return 8 + lv * 6;
  }
  /** Học một tâm pháp chưa biết (true: lấy bất kỳ) */
  learnTamPhap(any = false) {
    const P = this.P;
    const pool = TAM_PHAP_IDS.filter((id) => !P.tpLv[id]);
    if (!pool.length) return '';
    const id = this.r.pick(pool);
    P.tpLv[id] = 1;
    P.tpXp[id] = 0;
    if (!P.tp) P.tp = id;
    return `Lĩnh hội tâm pháp ${TAM_PHAP[id].n}. (${TAM_PHAP[id].desc}${P.tp === id ? '' : ' Đổi chủ tu ở mục Công pháp trong túi.'})`;
  }
  setTamPhap(id) {
    const P = this.P;
    if (!this.playing || !P.tpLv[id]) return false;
    P.tp = id;
    return true;
  }
  /** Tu luyện, bế quan: tâm pháp chủ tu lên cấp */
  tpTrain(years, mul = 1) {
    const P = this.P;
    const id = P.tp;
    if (!id || !P.dao) return;
    const lv = P.tpLv[id] || 1;
    if (lv >= 9) return;
    P.tpXp[id] = (P.tpXp[id] || 0) + years * mul;
    if (P.tpXp[id] >= this.tpNeed(lv)) this.tpLevelUp(id);
  }
  tpLevelUp(id, why = '') {
    const P = this.P;
    const lv = P.tpLv[id] || 1;
    if (lv >= 9) return false;
    P.tpXp[id] = 0;
    P.tpLv[id] = lv + 1;
    this.log(`${why}Tâm pháp ${TAM_PHAP[id].n} lên tầng ${lv + 1}.`, 'good');
    return true;
  }

  // ---------- Trận lớn: phù, đan, bạn trợ chiến ----------
  bigFightBuffs(A) {
    const P = this.P;
    const out = [];
    // phù, đan chỉ dùng một lần cho cả trận nhiều giai đoạn
    const once = !this._encBuffed;
    if (this._enc) this._encBuffed = true;
    if (once) {
    if ((P.phu.ho_than || 0) > 0) { P.phu.ho_than--; A.st.shield += Math.round(A.maxHp * 0.3); A.st.shieldT = 99; out.push('Hộ Thân Phù sáng lên, kết thành khiên.'); }
    if ((P.phu.bao_loi || 0) > 0) { P.phu.bao_loi--; A.atk *= 1.25; out.push('Bạo Lôi Phù nổ vang, sấm sét quấn quanh binh khí.'); }
    if (P.flags.baoKhi) { P.flags.baoKhi = false; A.atk *= 1.3; out.push('Dược lực Bạo Khí Đan bùng nổ.'); }
    else if (this.s.opt.autoBaoKhi !== false && (P.pills.bao_khi || 0) > 0) { P.pills.bao_khi--; A.atk *= 1.3; out.push('Ngươi nuốt một viên Bạo Khí Đan, khí huyết sôi trào.'); }
    }
    const al = this._ally;
    if (al) {
      const k = Math.min(1.5, this.power(al) / Math.max(1, this.rating()));
      A.atk *= 1 + 0.3 * k;
      A.st.shield += Math.round(A.maxHp * 0.15 * k);
      A.st.shieldT = 99;
      out.push(`${al.name} kề vai sát cánh.`);
    }
    return out;
  }
  /** Bạn có thể mời trợ chiến: thân từ 50, cùng giới, cảnh giới không thấp hơn ngươi quá một bậc, chưa mắc nợ */
  allyCands() {
    const P = this.P;
    return this.known().filter(({ b, r }) => (r.v >= 50 || CLOSE_TAGS.includes(r.tag)) && (b.plane || 0) === this.plane && b.realm >= P.realm - 1 && !r.owe && (!r.allyAt || P.age - r.allyAt >= 10)).sort((x, y) => this.power(y.b) - this.power(x.b));
  }
  /** Gọi bạn trợ chiến cho một hàm đánh; xong thì bạn có thể bị thương và ngươi mắc nợ ân tình */
  withAlly(b, fn) {
    const P = this.P;
    const r = this.rel(b);
    this._ally = b;
    let out;
    try { out = fn(); } finally { this._ally = null; }
    if (!this.playing) return out;
    r.allyAt = P.age;
    r.owe = true;
    this.relAdd(b, 3);
    const hurt = this.r.chance(out && out.win === false ? 0.6 : 0.25);
    const note = hurt ? `${b.name} bị thương khá nặng vì trận này. Ngươi nợ người ấy một ân tình.` : `${b.name} phủi áo cười: "Lần sau tới lượt ngươi giúp ta." Ngươi nợ một ân tình.`;
    if (out && typeof out.text === 'string') out.text += `\n${note}`;
    return out;
  }
  /** Hộ pháp lôi kiếp: người rất thân (thân từ 70 hoặc đạo lữ, huynh đệ, sư đồ) */
  hoPhapCand() {
    const P = this.P;
    return this.known().filter(({ b, r }) => (r.v >= 70 || CLOSE_TAGS.includes(r.tag)) && (b.plane || 0) === this.plane && b.realm >= P.realm - 1).sort((x, y) => this.power(y.b) - this.power(x.b))[0] || null;
  }
  daoLu() {
    const x = this.known().find(({ r }) => r.tag === 'dao_lu');
    return x ? x.b : null;
  }

  // ---------- Bế quan ----------
  /** Xuất quan: đủ 10 năm thì được thưởng; tử quan (từ 50 năm) có thể đốn ngộ */
  exitClose(why = 'Ngươi xuất quan.') {
    const P = this.P;
    const served = P.closeServed || 0;
    const len = P.closeLen || 0;
    P.closed = 0;
    P.closeServed = 0;
    P.closeLen = 0;
    const bits = [];
    if (served >= 10) {
      P.brkBonus = 0.15;
      P.hp = 100;
      P.sat = 0;
      P.loose = 0;
      bits.push('sinh lực hồi đầy, sát khí tan hết, căn cơ vững chắc, lần đột phá tới +15%');
      if (len >= 50 && served >= 50 && P.tp && this.r.chance(0.5)) { if (this.tpLevelUp(P.tp, 'Tử quan đốn ngộ! ')) bits.push('đốn ngộ'); }
    }
    this.log(`${why}${bits.length ? ` Bế quan ${served} năm: ${bits.join(', ')}.` : served ? ` (Bế quan ${served} năm, chưa đủ 10 năm nên chưa có thành quả đặc biệt.)` : ''}`, bits.length ? 'good' : 'muted');
  }
  openDoor() {
    if (this.playing && this.P.closed > 0) this.exitClose('Ngươi xuất quan sớm.');
  }

  // ---------- Nghề phụ ----------
  chooseNghe(id) {
    const P = this.P;
    if (!this.playing || !NGHE[id]) return false;
    if (P.nghe && P.nghe.id === id) return true;
    // đổi nghề thì mất một nửa cấp
    const lv = P.nghe ? Math.max(1, Math.floor(P.nghe.lv / 2)) : 1;
    P.nghe = { id, lv, xp: 0 };
    return true;
  }
  ngheLv(id) {
    const n = this.P.nghe;
    return n && n.id === id ? n.lv : 0;
  }
  sanNghiepPrice() {
    return Math.round(400 * (1 + this.P.realm) * (1 + this.P.sanNghiep));
  }
  buySanNghiep() {
    const P = this.P;
    if (!this.ngheLv('thuong_nhan') || P.sanNghiep >= 5 || P.money < this.sanNghiepPrice()) return null;
    this.money(-this.sanNghiepPrice());
    P.sanNghiep++;
    return `Mua thêm một sản nghiệp (${P.sanNghiep}/5). Mỗi năm tự sinh linh thạch.`;
  }
  /** Một lượt mưu sinh theo nghề */
  ngheWork(years) {
    const P = this.P;
    const n = P.nghe;
    const fr = 1 + P.realm;
    if (!n) return '';
    n.xp += years;
    if (n.lv < 9 && n.xp >= 6 + n.lv * 6) { n.xp = 0; n.lv++; this.log(`Tay nghề ${NGHE[n.id].n} lên cấp ${n.lv}.`, 'good'); }
    const lv = n.lv;
    if (n.id === 'luyen_dan') {
      const got = {};
      const tries = Math.max(1, Math.round(years / 2));
      for (let i = 0; i < tries; i++) {
        if (!this.r.chance(0.35 + lv * 0.05)) continue;
        const pool = [['hoi_xuan', 5], ['ngung_than', lv >= 2 ? 3 : 0], ['bao_khi', lv >= 3 ? 2 : 0], ['tinh_tam', lv >= 4 ? 2 : 0], ['pha_canh', lv >= 6 ? 1 : 0], ['dien_tho', lv >= 8 ? 0.5 : 0]].filter((x) => x[1] > 0);
        const id = this.r.weighted(pool, (x) => x[1])[0];
        got[id] = (got[id] || 0) + 1;
      }
      for (const k in got) P.pills[k] = (P.pills[k] || 0) + got[k];
      return Object.keys(got).length ? `Luyện được ${Object.entries(got).map(([k, v]) => `${PILLS[k].n} x${v}`).join(', ')}.` : '';
    }
    if (n.id === 'luyen_khi') {
      const m = { tinh_thiet: Math.round((2 + lv) * fr * years * 0.5) };
      if (this.r.chance(0.3 + lv * 0.05)) m.linh_tinh = Math.max(1, Math.round(fr * lv * 0.3));
      for (const k in m) P.mats[k] = (P.mats[k] || 0) + m[k];
      this.addForge(0.5 * years);
      return '';
    }
    if (n.id === 'phu_su') {
      const got = {};
      if (this.r.chance(0.4 + lv * 0.05)) { const id = this.r.weighted([['ho_than', 4], ['bao_loi', 4], ['truyen_tong', lv >= 4 ? 1 + lv * 0.2 : 0]].filter((x) => x[1] > 0), (x) => x[1])[0]; got[id] = 1; }
      for (const k in got) P.phu[k] = Math.min(9, (P.phu[k] || 0) + got[k]);
      return Object.keys(got).length ? `Vẽ được ${Object.keys(got).map((k) => PHU[k].n).join(', ')}.` : '';
    }
    return '';
  }
  /** Hệ số giá với Thương nhân / Luyện khí sư */
  shopMul() {
    return 1 - 0.03 * this.ngheLv('thuong_nhan');
  }
  forgeMul() {
    return 1 - 0.04 * this.ngheLv('luyen_khi');
  }

  // ---------- Lịch trình tự động ----------
  setPlan(steps) {
    const P = this.P;
    const ok = (steps || []).filter((x) => PLAN_COND_OK(x)).slice(0, 5);
    if (!ok.length) { P.plan = null; return false; }
    P.plan = { steps: ok, i: 0, begun: false, t0: P.age, on: true };
    P.towerWait = null;
    this.log(`Bắt đầu lịch trình: ${ok.map(planStepText).join(' → ')}.`, 'muted');
    return true;
  }
  planStop(why) {
    const P = this.P;
    if (!P.plan || !P.plan.on) return;
    P.plan.on = false;
    P.plan.begun = false;
    if (why) { this.log(`Lịch trình tạm dừng: ${why}.`, 'bad'); this.toast(`Lịch trình tạm dừng: ${why}.`, '📅 Lịch trình', 1); }
  }
  planResume() {
    const P = this.P;
    if (!P.plan) return false;
    P.plan.on = true;
    P.plan.begun = false;
    return true;
  }
  planAdvance() {
    const pl = this.P.plan;
    if (!pl) return;
    pl.i = (pl.i + 1) % pl.steps.length;
    pl.begun = false;
  }
  /** Đầu mỗi lượt: chuyển bước khi đủ điều kiện */
  planTick() {
    const P = this.P;
    const pl = P.plan;
    if (!pl || !pl.on) return;
    for (let guard = 0; guard < pl.steps.length + 1; guard++) {
      const st = pl.steps[pl.i];
      if (!pl.begun) {
        pl.begun = true;
        pl.t0 = P.age;
        if (st.a === 'be_quan') {
          if (P.closed > 0) return;
          if (!this.closeDoor(st.v || 10)) { this.planAdvance(); continue; }
          return;
        }
        if (!this.actionOk(st.a) || (st.a === 'vuot_thap' && this.towerState().f >= 1000)) { this.planAdvance(); continue; }
        P.action = st.a;
        return;
      }
      const yrs = P.age - pl.t0;
      const done = st.a === 'be_quan' ? P.closed === 0
        : yrs >= 300 ? true
        : st.k === 'y' ? yrs >= st.v : st.k === 'sg' ? P.sat >= st.v : P.sat <= st.v;
      if (!done) return;
      this.planAdvance();
    }
  }
  /** Người chơi tự bấm đổi việc: dừng lịch trình, bỏ chờ leo tháp */
  manualAction(id) {
    const P = this.P;
    if (!this.playing) return;
    if (P.plan && P.plan.on) this.planStop('ngươi tự đổi việc');
    P.towerWait = null;
    this.setAction(id);
  }

  // ---------- Vòng năm ----------
  /** Trôi một năm. Trả về false nếu không trôi được (đang có sự kiện, đã chết...). */
  tick() {
    if (!this.playing || this.s.pending) return false;
    const P = this.P;
    // vị diện cao: mỗi lượt trôi nhiều năm để nhịp chơi không lê thê
    const ypt = PLANES[P.plane || 0].ypt;
    for (let i = 0; i < ypt; i++) this.worldYear();
    P.age += ypt;
    this.planTick();
    this.towerResumeCheck();
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
      if (!P.tp) { P.tp = 'thanh_tam'; P.tpLv.thanh_tam = 1; this.log('Cùng bài dẫn khí là tâm pháp nhập môn Thanh Tâm Quyết. Tu luyện, bế quan sẽ làm tâm pháp lên tầng.', 'muted'); }
    }
    if (P.dao && !P.flags.firstSkill) {
      P.flags.firstSkill = true;
      const t = this.learnRandom(1, 1);
      if (t) this.log(`Bước vào đường tu, ngươi tự mò ra một môn võ kỹ. ${t}`, 'good');
    }
    const g = this.gain() * ypt;
    const lu = (act === 'tu_luyen' || act === 'be_quan') && this.daoLu() ? this.daoLu() : null;
    // củng cố căn cơ: tu vi chưa vững dần thành vững
    const firm = (n) => { P.loose = Math.max(0, (P.loose || 0) - n); };
    if (act === 'vuot_thap') {
      this.addTuvi(g * 0.6, true);
      this.climbTower();
    } else if (act === 'tu_luyen') {
      this.addTuvi(g * this.r.range(0.85, 1.15) * (lu ? 1.25 : 1));
      firm(g * 1.2 * (lu ? 1.5 : 1));
      this.purgeSat(4 + (lu ? 3 : 0));
      this.tpTrain(ypt, 1);
    } else if (act === 'be_quan') {
      this.addTuvi(g * ((P.closeLen || 0) >= 50 ? 2 : 1.6) * this.tmul('closedMul') * (lu ? 1.25 : 1));
      firm(g * 4 * (lu ? 1.5 : 1));
      this.purgeSat(15 + (lu ? 3 : 0));
      this.tpTrain(ypt, 2.5);
      P.closeServed = (P.closeServed || 0) + ypt;
    } else if (act === 'lich_luyen') {
      // đã tự lui dưỡng thương: hồi đủ 80 thì quay lại vùng đã chọn
      if (P.flags.retreated && P.hp >= 80 && MAP_MAP[P.mapGoal] && P.map !== P.mapGoal) {
        P.map = P.mapGoal;
        P.flags.retreated = false;
        this.log(`Thương thế đã lành, ngươi quay lại ${MAP_MAP[P.map].n}.`, 'muted');
      }
      const mp = this.curMap();
      this.addTuvi(g * 0.35 * Math.sqrt(mp.loot), true);
      this.addSat([0.5, 1, 1.5, 2.5, 3.5, 4.5][mp.d] || 1);
      if (this.r.chance(0.15)) this.stat('co', 1);
      if (this.r.chance(0.35)) { const t = this.gatherMats(mp, false); if (t && /Linh tinh|Thú hạch|Độc nang|Hỏa tinh|Binh hồn|Thần hồn/.test(t)) this.log(t, 'muted'); }
      if (mp.haz && this.r.chance(mp.haz[0])) {
        const dmg = Math.round(mp.haz[1] * this.r.range(0.7, 1.3));
        this.log(`${mp.haz[2]}. Sinh lực -${dmg}.`, 'bad');
        if (this.hurt(dmg, mp.haz[3])) return true;
      }
      if (mp.d >= 4) P.cnt.hard = (P.cnt.hard || 0) + 1;
      this.autoHeal();
      if (P.hp >= 40) P.flags.enteredLow = false;
      if (mp.d >= 2 && P.hp < 40 && !P.flags.enteredLow) {
        if (this.s.opt.retreat) {
          P.map = this.defaultMap().id;
          P.mapGoal = P.mapGoal && MAP_MAP[P.mapGoal] && MAP_MAP[P.mapGoal].d >= 2 ? P.mapGoal : mp.id;
          P.flags.retreated = true;
          const msg = `Sinh lực chỉ còn ${P.hp}, ngươi rút khỏi ${mp.n} về ${this.defaultMap().n} dưỡng thương. Hồi lên 80 sẽ tự quay lại.`;
          this.log(msg, 'bad');
          this.toast(msg, 'Tự lui', 0);
        } else if (!P.flags.mapWarned) {
          P.flags.mapWarned = true;
          this.s.alert = { title: `Nguy hiểm ở ${mp.n}`, text: `Sinh lực chỉ còn ${P.hp}. Ở ${mp.n} lúc này, tỉ lệ thắng yêu thú chỉ khoảng ${Math.round(this.mapOdds(mp.id) * 100)}%. Nên về vùng dễ hơn dưỡng thương.` };
        }
      }
      if (P.hp >= 70) P.flags.mapWarned = false;
    } else if (act === 'muu_sinh') {
      const nid = P.nghe ? P.nghe.id : null;
      const nm = !nid ? 1 : nid === 'thuong_nhan' ? 2 + 0.1 * P.nghe.lv : nid === 'luyen_dan' ? 0.6 : 0.7;
      const m = Math.round(15 * ypt * (1 + P.realm * 1.5) * this.r.range(0.7, 1.3) * (1 + (P.stats.co - 50) / 200) * this.tmul('moneyMul') * nm);
      this.money(m);
      this.addTuvi(g * 0.25);
      firm(g * 0.3);
      this.purgeSat(3);
      const t = this.ngheWork(ypt);
      if (t) this.log(t, 'muted');
    } else if (act === 'ket_giao') {
      this.addTuvi(g * 0.25);
      firm(g * 0.3);
      this.purgeSat(8);
      this.meetBot();
      this.socialPerks();
    }
    if (P.sanNghiep > 0) this.money(Math.round(P.sanNghiep * 6 * ypt * (1 + P.realm * 1.5)));
    if (act !== 'vuot_thap' && act !== 'lich_luyen' && act !== 'tu_luyen' && act !== 'be_quan' && act !== 'muu_sinh' && act !== 'ket_giao') this.purgeSat(2);
    if (this.checkSat()) return true; else if (act === 'lon_len' && P.age >= 6 && this.r.chance(0.2)) {
      this.stat(this.r.pick(['can', 'ngo', 'tam', 'co']), 1);
    }
    if (P.plan && P.plan.on && P.hp < 20 && !(P.pills.hoi_xuan > 0)) this.planStop(`sinh lực chỉ còn ${P.hp}, hết Hồi Xuân Đan`);
    P.hp = Math.min(100, P.hp + (act === 'be_quan' ? 6 : 4) * Math.min(3, ypt) * this.tmul('regenMul') * (1 + this.tpFx('regen')));
    this.autoHeal();
    const nk = P.flags.neck;
    if (nk && (nk.realm !== P.realm || P.age >= nk.until)) { P.flags.neck = null; if (nk.realm === P.realm) this.log('Bình cảnh nhỏ tự tan, linh khí lại chảy thông suốt.', 'good'); }
    else if (nk && this.r.chance(Math.max(0, P.stats.ngo - 30) / 400)) { P.flags.neck = null; this.log('Một đêm ngồi nhìn trăng, ngươi bỗng ngộ ra. Bình cảnh nhỏ vỡ tan.', 'good'); }
    if (this.thas('coldPoison') && P.age >= 8 && this.r.chance(0.04) && !this.known().some(({ r }) => r.tag === 'dao_lu')) {
      this.log('Hàn độc Cửu Âm phát tác, cả người lạnh như băng.', 'bad');
      if (this.hurt(12, 'hàn độc Cửu Âm phát tác, đông cứng mà chết')) return true;
    }

    if (P.age >= this.lifespan()) {
      this.die('thọ nguyên cạn kiệt, tọa hóa');
      return true;
    }
    if (P.closed > 0) {
      P.closed = Math.max(0, P.closed - ypt);
      if (this.r.chance(0.03) && this.hurt(15, 'tẩu hỏa nhập ma trong lúc bế quan')) return true;
      if (P.closed === 0) this.exitClose('Ngươi xuất quan.');
    }
    if (P.dao && P.tuvi >= this.need() && !P.flags.notifiedFull && this.atPlaneTop() && !(P.tokens && P.tokens[P.plane])) {
      // cảnh giới cuối mỗi giới: phải có lệnh bài của tháp mới độ kiếp phi thăng
      P.flags.notifiedFull = true;
      const PL = PLANES[P.plane];
      this.log(`Tu vi ${REALMS[P.realm].n} đã viên mãn. Muốn độ kiếp phi thăng ${PL.next} cần ${PL.token}: vượt tầng 1000 của ${PL.tower}. Tầng cao nhất của ngươi: ${this.towerState().f}.`, 'big');
      this.toast(`Cần ${PL.token} (tầng 1000 ${PL.tower}) mới phi thăng được.`, 'Tu vi viên mãn', 3);
      if (P.plan && P.plan.on && P.plan.steps.every((x) => x.a !== 'vuot_thap')) this.planStop('tu vi viên mãn nhưng chưa có lệnh bài');
    }
    if (P.dao && P.tuvi >= this.need() && !P.flags.notifiedFull) {
      P.flags.notifiedFull = true;
      if (P.closed > 0) this.exitClose('Tu vi viên mãn, ngươi phá quan đi ra.');
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
      // luật mở rộng: đúng vùng lịch luyện, đủ cảnh giới, đúng con đường, có tông môn
      if (ru.map && (!mapNow || mapNow.id !== ru.map)) continue;
      if (ru.minD !== undefined && (!mapNow || mapNow.d < ru.minD)) continue;
      if (ru.plane !== undefined && (P.plane || 0) !== ru.plane) continue;
      if (ru.realm && P.realm < ru.realm) continue;
      if (ru.path && P.path !== ru.path) continue;
      if (ru.sect && !(P.sect && this.sect(P.sect) && this.sect(P.sect).alive)) continue;
      if (e.when && !e.when(this)) continue;
      const bot = e.bot ? e.bot(this) : null;
      if (e.bot && !bot) continue;
      const data = e.prep ? e.prep(this, bot) : {};
      if (e.prep && !data) continue;
      let w = typeof e.w === 'function' ? e.w(this) : e.w ?? 1;
      if (e.acts && e.acts.includes(act)) w *= 3;
      if (mapNow) w *= MAP_RARE_EV.has(e.id) ? 0.5 + 0.35 * mapNow.d : e.id === 'yeu_thu' ? 0.6 + 0.3 * mapNow.d : MAP_FIGHT_EV.has(e.id) ? 0.8 + 0.15 * mapNow.d : 1;
      w *= this.tevW(e.id);
      if (e.id === 'tam_ma' && P.sat >= this.satLine(70)) w *= 3;
      if (ru.map) w *= 3; // chuyện riêng của vùng đang ở
      // ưu tiên chuyện chưa gặp trong kiếp này, gặp rồi thì giảm dần
      const seen = (P.evSeen && P.evSeen[e.id]) || 0;
      w *= seen ? 1 / (1 + 0.5 * seen) : 1.5;
      cands.push({ e, bot, data, w });
    }
    const pick = this.r.weighted(cands, (c) => c.w);
    if (!pick) return;
    s.cd[pick.e.id] = P.age;
    if (pick.e.once) s.once[pick.e.id] = true;
    P.evSeen = P.evSeen || {};
    P.evSeen[pick.e.id] = (P.evSeen[pick.e.id] || 0) + 1;
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
    // ghi đủ kết quả vào nhật ký: tên kỳ ngộ, lựa chọn, diễn biến (giao diện không cần hiện màn kết quả nữa)
    const title = typeof ev.title === 'function' ? ev.title(this, c) : ev.title;
    if (this.P && res.trim()) {
      this.log(res.trim(), 'event');
      const L = this.s.log[this.s.log.length - 1];
      L.h = title;
      L.c = `${this._auto ? '(Tự quyết) ' : ''}${ch.t}`;
    }
    if (this.s.phase === 'dead' && this.s.deadInfo) this.s.deadInfo.last = { h: title, c: ch.t, t: res.trim() };
    if (this.playing) this.autoHeal();
    if (this.playing) this.checkTitles();
  }
  /** Sự kiện đang chờ có tự quyết được không (việc nhỏ) */
  canAuto() {
    const p = this.s.pending;
    if (!p || p.result !== undefined) return false;
    const ev = EVENT_MAP[p.id];
    if (!ev || !ev.auto) return false;
    // sự kiện tự quyết định có cho tự quyết hay không (vd trùm tháp: chỉ khi tỉ lệ thắng từ 75%)
    if (ev.canAuto) { if (p.canAutoC === undefined) p.canAutoC = !!ev.canAuto(this, this.ctx(p)); return p.canAutoC; }
    return true;
  }
  /** Việc nhỏ: tự quyết được ở mọi tốc độ. Việc lớn (cơ duyên lớn, sinh tử, quan hệ) vẫn hỏi người chơi. */
  canAutoMinor() {
    if (!this.canAuto()) return false;
    const p = this.s.pending;
    if (MAJOR_EV.has(p.id)) return false;
    // yêu thú ở vùng Nguy hiểm trở lên là chuyện sống chết
    if (p.id === 'yeu_thu') { const mp = this.curMap(); if (mp && mp.d >= 3) return false; }
    return true;
  }
  /** Tự chọn phương án mặc định của sự kiện nhỏ, bỏ qua phần diễn trận, rồi đóng lại */
  autoResolve(keep = null) {
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
    if (p.battles) {
      // vẫn diễn những trận giao diện muốn xem (vd trùm tháp), chạy nhanh
      const k = keep ? p.battles.filter(keep) : [];
      if (k.length) { p.battles = k; p.bi = 0; p.fast = true; return true; }
      p.bi = p.battles.length;
    }
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
    this.log(`Ngươi chọn con đường ${pa.n}. Lĩnh ngộ tuyệt học ${skillToken(pa.skill, SKILLS[pa.skill])}${SKILLS[pa.skill].n}.`, 'big');
    return `Từ nay ngươi là ${pa.n}. Lĩnh ngộ tuyệt học ${skillToken(pa.skill, SKILLS[pa.skill])}${SKILLS[pa.skill].n}: ${SKILLS[pa.skill].desc}`;
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
      .filter((b) => b.alive && b.dao && (b.plane || 0) === this.plane)
      .map((b) => ({ name: b.name, realm: b.realm, prog: b.tuvi / REALMS[b.realm].need, sect: b.sect, id: b.id, me: false, age: b.age }));
    if (this.playing && this.P.dao) {
      const P = this.P;
      list.push({ name: P.name, realm: P.realm, prog: P.tuvi / this.need(), sect: P.sect, id: 0, me: true, age: P.age });
    }
    return list.sort((a, b) => b.realm - a.realm || b.prog - a.prog).slice(0, n);
  }
}

export { REALMS, TOP_REALM, ACTIONS, PILLS, LEGACIES, TAG_NAMES, THE_MAP, TP_MAP, THE_CHAT, TITLES, TITLE_MAP, PATHS };
