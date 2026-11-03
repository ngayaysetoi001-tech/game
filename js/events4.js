// Kỳ ngộ đợt 4: tháp 1000 tầng (trùm, tầng đặc biệt), lôi kiếp phi thăng, vùng chủ, và Linh giới.
// r3.plane: chỉ xảy ra ở vị diện đó (0 Phàm giới, 1 Linh giới).
import { REALMS, PLANES, MAP_MAP, BOSS_KITS, THEME_BG, TOWER_SHOP, MOB_AFFIX_MAP } from './data.js';
import { makeItem } from './items.js';

const xp4 = (p) => Math.max(0.03, Math.min(0.97, p));
const st4 = (g, k) => g.P.stats[k];
const pw4 = (g, add = 0) => REALMS[Math.max(0, Math.min(PLANES[g.P.plane || 0].top, g.P.realm + add))].pow;
const yrs4 = (g, n) => g.addTuvi(g.gain() * n * 0.6);
const fr4 = (g) => 1 + g.P.realm;
const mats4 = (g, m) => { for (const k in m) g.P.mats[k] = (g.P.mats[k] || 0) + m[k]; return g.matText(m, 'Thu được'); };
const item4 = (g, q, slot = null, prefix, allowMyth = false) => {
  g._forging = allowMyth;
  const m = g.gainItem(makeItem(g.r, g.s.nextItem++, g.P.realm, q, slot), prefix);
  g._forging = false;
  return m;
};
const tower4 = (g, data) => PLANES[data.plane ?? g.P.plane].tower;
const clearFloor = (g, data) => {
  const T = g.towerState(data.plane);
  if (T.f < data.floor) T.f = data.floor;
  g.s.towerBest[data.plane] = Math.max(g.s.towerBest[data.plane] || 0, T.f);
  g.towerReward(data.floor, 'normal');
  g.P.towerCoin = (g.P.towerCoin || 0) + 2;
};
const near4 = (g, b, d = 1) => Math.abs(b.realm - g.P.realm) <= d;
const SP_N = { thu_tam: 'Thử Tâm', ao_canh: 'Ảo Cảnh', guong: 'Tầng Gương', bao_kho: 'Bảo Khố', suoi_linh: 'Suối Linh', thuong_nhan: 'Thương Nhân', lien_hoan: 'Thử Thách Liên Hoàn', doi_thu: 'Đối Thủ Leo Tháp', nguoi_ket: 'Người Kẹt Trong Tháp', bia_ngo: 'Bia Ngộ Đạo' };
const FIX4 = { pick: (a) => a[0], range: () => 1, int: (a) => a, chance: () => false };
const chainOdds = (g, data) => phaseOdds(g, () => g.towerMonster(data.plane, data.floor, FIX4), 3);

/** Đánh qua nhiều giai đoạn, không hồi máu giữa chừng. Trả về { win, text } */
function phases(g, mk, n, opts, tagOf = null) {
  const parts = [];
  g._enc = true; g._encBuffed = false;
  try { return phasesRun(g, mk, n, opts, tagOf, parts); } finally { g._enc = false; g._encBuffed = false; }
}
function phasesRun(g, mk, n, opts, tagOf, parts) {
  for (let i = 0; i < n; i++) {
    const m = mk(i);
    if (i > 0 && !m.rage) { m.rage = 0.25 * i; m.n = `${m.n} (nổi giận)`; }
    const f = g.fightMonster(m, 1, 1, { big: true, ...opts, tag: tagOf ? tagOf(i, m) : undefined });
    parts.push(n > 1 ? `[Giai đoạn ${i + 1}/${n}] ${f.text}` : f.text);
    if (!f.win) return { win: false, text: parts.join('\n\n') };
    if (i < n - 1) parts.push(`— Giai đoạn ${i + 1} qua. Sinh lực còn ${g.P.hp}. Đối thủ gầm lên, khí thế bùng nổ. —`);
  }
  return { win: true, text: parts.join('\n\n') };
}
function phaseOdds(g, mk, n) {
  // ước lượng: tỉ lệ thắng giai đoạn đầu nhân dần (mỗi giai đoạn sau khó hơn vì mất máu)
  const p1 = g.winOdds(() => g.monsterFighter(mk(0)));
  return Math.pow(p1, 1 + (n - 1) * 0.8);
}
/** Lựa chọn mời bạn trợ chiến (thân từ 50) */
const allyChoice = (g, label, run) => {
  const c = g.allyCands()[0];
  if (!c) return null;
  return { t: `Mời ${c.b.name} (${REALMS[c.b.realm].n}) trợ chiến · ${label}`, go: (g) => g.withAlly(c.b, () => ({ text: run(g) })).text };
};
const bossOddsOf = (g, data) => g.bossOdds(data.plane, data.floor);
const bossTag = (g, data) => (i, m) => {
  const idx = g.themeIdx(data.floor);
  const th = g.floorTheme(data.plane, data.floor);
  const n = g.bossPhases(data.floor);
  return { tower: 'boss', boss: true, label: `Tầng ${data.floor} · ${data.floor >= 1000 ? 'Tháp chủ' : th.n} · Giai đoạn ${i + 1}/${n}`, phase: i + 1, phases: n, intro: i === 0 ? { n: data.floor >= 1000 ? `${PLANES[data.plane].tower} chi chủ` : th.boss, th: `${data.floor >= 1000 ? 'Tháp chủ' : th.n}${m.aff && m.aff.length ? ` · ${m.aff.map((x) => (MOB_AFFIX_MAP[x] ? MOB_AFFIX_MAP[x].n : x)).join(', ')}` : ''}`, mech: BOSS_KITS[idx].mech } : null, rage: i > 0, bg: THEME_BG[idx] };
};

export const EVENTS4 = [
  // ================= Tháp: trùm mỗi 100 tầng, Tháp chủ tầng 1000 =================
  {
    id: 'thap_chu', queued: true, w: 1,
    title: (g, { data }) => (data.floor >= 1000 ? `${tower4(g, data)} · Tháp chủ` : `${tower4(g, data)} · Tầng ${data.floor}`),
    // chỉ tự đánh khi chắc thắng từ 75% (tính đủ mọi giai đoạn); thấp hơn thì luôn dừng lại hỏi
    canAuto: (g, { data }) => bossOddsOf(g, data) >= 0.75,
    auto: () => 0,
    text: (g, { data }) => {
      const th = g.floorTheme(data.plane, data.floor);
      const fin = data.floor >= 1000;
      const n = g.bossPhases(data.floor);
      const p = bossOddsOf(g, data);
      const boss = fin ? `${PLANES[data.plane].tower} chi chủ` : th.boss;
      const kit = BOSS_KITS[g.themeIdx(data.floor)];
      const safe = data.floor < 500;
      return `${fin ? `Đỉnh ${tower4(g, data)}. Cả tầng tháp là một đại điện trống trải, chỉ có một bóng người ngồi trên ngai đá. Hạ được người này mới có ${PLANES[data.plane].token}, mới được phi thăng.` : `Tầng ${data.floor}, tầng cuối của ${th.n}. ${boss} chờ sẵn, khí thế đè nặng cả tầng tháp.`}\n\nCơ chế: ${kit.mech}.\nPhải đánh qua ${n} giai đoạn liền, giữa chừng không hồi phục. Ước chừng thắng cả ${n} giai đoạn ~${Math.round(p * 100)}% (sinh lực hiện tại ${g.P.hp}/100). ${safe ? 'Thua chỉ trọng thương (cấm chế tầng dưới 500 kéo ngươi ra).' : 'Thua có thể mất mạng.'}`;
    },
    choices: (g, { data }) => {
      const fin = data.floor >= 1000;
      const n = g.bossPhases(data.floor);
      const p = bossOddsOf(g, data);
      const safe = data.floor < 500;
      const fight = (g) => {
        const r = phases(g, (i) => g.bossMonster(data.plane, data.floor, i), n, { lethal: fin ? 0.4 : 0.25, safe, cause: `tử trận ở tầng ${data.floor} ${tower4(g, data)}` }, bossTag(g, data));
        if (!r.win) {
          if (g.playing) g.towerPause(data.floor, true, `Thua trùm tầng ${data.floor}`);
          return `${r.text}\n\n${g.playing ? 'Ngươi thua. Cấm chế của tháp kéo ngươi ra ngoài trước khi đòn cuối giáng xuống.' : ''}`;
        }
        const T = g.towerState(data.plane);
        T.f = Math.max(T.f, data.floor);
        g.s.towerBest[data.plane] = Math.max(g.s.towerBest[data.plane] || 0, T.f);
        g.addSat(5);
        return `${r.text}\n\n${g.towerBossReward(data.floor, data.plane)}`;
      };
      const out = [{ t: fin ? 'Khiêu chiến Tháp chủ' : 'Khiêu chiến trùm tầng', p, go: fight }];
      const al = allyChoice(g, 'cùng khiêu chiến', fight);
      if (al) out.push(al);
      out.push({ t: 'Rút lui, chuẩn bị thêm', go: (g) => { g.towerPause(data.floor, true, `Rút lui trước trùm tầng ${data.floor}`); return 'Ngươi rời tháp. Khi nào mạnh hơn thì quay lại.'; } });
      return out;
    },
  },

  // ================= Tháp: tầng đặc biệt =================
  {
    id: 'thap_dac_biet', queued: true, w: 1,
    title: (g, { data }) => `${tower4(g, data)} · Tầng ${data.floor}: ${SP_N[data.type]}`,
    auto: (g, { data, bot }) => (data.type === 'guong' ? (g.winOdds(() => g.mirrorFighter()) >= 0.5 ? 0 : 1)
      : data.type === 'thuong_nhan' ? 'Đi tiếp'
      : data.type === 'lien_hoan' ? (chainOdds(g, data) >= 0.6 ? 0 : 1)
      : data.type === 'doi_thu' ? 'Chắp tay'
      : data.type === 'nguoi_ket' ? (bot && g.floorOdds(data.floor, data.plane) >= 0.6 ? 0 : 'Mặc')
      : data.type === 'bia_ngo' ? 'Tĩnh tọa' : 0),
    text: (g, { data, bot }) => ({
      thu_tam: 'Tầng tháp trống không, chỉ có một giọng nói vang lên trong đầu: "Ngươi tu đạo vì điều gì?" Mỗi câu trả lời dối lòng, cả tầng tháp sẽ siết lại.',
      ao_canh: 'Sương mù dày đặc. Khi sương tan, ngươi thấy mình đứng giữa sân nhà cũ, cha mẹ đang gọi ra ăn cơm. Biết là ảo cảnh, nhưng sao ấm áp quá.',
      guong: 'Cả tầng tháp là một tấm gương khổng lồ. Bóng của ngươi bước ra, cầm đúng binh khí của ngươi, dùng đúng chiêu thức của ngươi.',
      bao_kho: 'Giữa tầng có ba chiếc rương: một rương đồng, một rương bạc, một rương gỗ mục. Chỉ được mở một.',
      suoi_linh: 'Một dòng suối linh trong vắt chảy giữa tầng tháp, hơi nước thơm ngát. Người leo tháp xưa khắc lên đá: "Uống đi, đường còn dài."',
      thuong_nhan: `Một lão thương nhân ngồi xếp bằng giữa tầng tháp, sau lưng là cái gùi to hơn người. "Leo tháp mà không mang đủ đồ thì chết sớm." Lão chỉ nhận Tháp tệ. Ngươi có ${g.P.towerCoin || 0} Tháp tệ.`,
      lien_hoan: `Ba cánh cửa đá mở ra liền nhau, sau mỗi cửa là một đối thủ. Bia đá ghi: "Qua cả ba, thưởng gấp đôi. Giữa chừng không được nghỉ." Ước chừng qua cả ba ~${Math.round(chainOdds(g, data) * 100)}%. Thua chỉ bị đẩy ra ngoài.`,
      doi_thu: bot ? `${bot.name} (${REALMS[bot.realm].n}) cũng đang leo ${tower4(g, data)}, kỷ lục tầng ${bot.tower || 0}. Hai người chạm mặt ở chiếu nghỉ hẹp, chỉ một người đi trước được. ${g.hintBot(bot)}` : '',
      nguoi_ket: bot ? `Giữa tầng tháp, một trận pháp sáng mờ giam một người bên trong: ${bot.name} (${REALMS[bot.realm].n}), mặt mũi hốc hác, đã kẹt ở đây không biết bao lâu. Muốn phá trận phải hạ con quái giữ trận. Tỉ lệ thắng ~${Math.round(g.floorOdds(data.floor, data.plane) * 100)}%.` : '',
      bia_ngo: 'Một tấm bia đá cổ khắc đầy chữ và hình người luyện công. Đứng trước bia lâu, chữ như sống dậy, chạy vào trong đầu.',
    }[data.type]),
    choices: (g, { data, bot }) => {
      const T = data.type;
      if (T === 'thu_tam') {
        const p = xp4(0.5 + (st4(g, 'tam') - 50) / 80);
        return [
          { t: 'Trả lời thật lòng', p, go: (g) => { if (g.r.chance(p)) { g.stat('tam', 3); clearFloor(g, data); return 'Giọng nói im bặt. Cửa lên tầng trên mở ra. Tâm tính +3.'; } g.hurt(15, 'bị tầng Thử Tâm nghiền nát'); return 'Ngươi ngập ngừng một thoáng. Tầng tháp siết lại, ép ngươi văng ra ngoài.'; } },
          { t: 'Im lặng, không đáp', go: (g) => { g.tinh(-2); clearFloor(g, data); return 'Rất lâu sau, giọng nói thở dài rồi mở cửa. Có những câu hỏi không cần trả lời.'; } },
        ];
      }
      if (T === 'ao_canh') {
        const p = xp4(0.5 + (st4(g, 'ngo') - 50) / 80);
        return [
          { t: 'Phá ảo cảnh', p, go: (g) => { if (g.r.chance(p)) { g.stat('ngo', 2); clearFloor(g, data); return 'Ngươi cắn đầu lưỡi, máu chảy ra, ảo cảnh vỡ tan. Ngộ tính +2.'; } g.hurt(12, 'chìm trong ảo cảnh mà chết'); return 'Ảo cảnh quá thật. Ngươi ngồi ăn cơm với cha mẹ suốt ba ngày, tới khi tháp đẩy ngươi ra ngoài.'; } },
          { t: 'Ở lại thêm một chút rồi mới đi', go: (g) => { g.stat('tam', 4); g.tinh(4); clearFloor(g, data); return 'Ngươi ăn hết bát cơm, cúi chào cha mẹ trong ảo cảnh rồi tự bước ra. Tâm tính +4.'; } },
        ];
      }
      if (T === 'guong') {
        return [
          { t: 'Đánh với bóng mình', p: g.winOdds(() => g.mirrorFighter()), go: (g) => { const f = g.runBattle(g.playerFighter(), g.mirrorFighter(), { safe: true, cause: 'bị bóng mình giết', tag: { tower: 'elite', label: `Tầng ${data.floor} · Tầng Gương`, bg: '#2a3442' } }); if (f.win) { clearFloor(g, data); const t = yrs4(g, 3); return `${f.text}\n\nBóng gương vỡ thành nghìn mảnh. Ngươi hiểu mình hơn một chút. Tu vi +${t}.`; } return `${f.text}\n\nBóng gương đứng nhìn ngươi bị đẩy ra ngoài, mỉm cười đúng như ngươi vẫn cười.`; } },
          { t: 'Đi vòng qua gương', go: () => 'Tấm gương không cho ai đi vòng. Ngươi đành ra ngoài, lần sau quay lại.' },
        ];
      }
      if (T === 'bao_kho') {
        const open = (kind) => (g) => {
          clearFloor(g, data);
          const r = g.r.next();
          if (kind === 'dong') return r < 0.7 ? mats4(g, { tinh_thiet: 6 * fr4(g), linh_tinh: fr4(g) }) : item4(g, 2, null, 'Rương đồng');
          if (kind === 'bac') { if (r < 0.25) { g.hurt(20, 'trúng bẫy rương bạc'); return 'Rương bạc là bẫy, kim độc bắn ra tứ phía.'; } return item4(g, r < 0.6 ? 2 : 3, null, 'Rương bạc'); }
          if (r < 0.5) return 'Rương gỗ mục trống trơn, chỉ có một tờ giấy: "Tham thì thâm."';
          return item4(g, data.floor >= 500 && r > 0.95 ? 4 : 3, null, 'Rương gỗ mục', data.floor >= 500);
        };
        return [
          { t: 'Mở rương đồng (chắc ăn)', go: open('dong') },
          { t: 'Mở rương bạc (có thể có bẫy)', go: open('bac') },
          { t: 'Mở rương gỗ mục (được ăn cả)', go: open('go') },
        ];
      }
      if (T === 'thuong_nhan') {
        const buy = (id) => (g) => { const m = g.towerBuy(id); clearFloor(g, data); return m || 'Không đủ Tháp tệ. Lão thương nhân lắc đầu, ngươi đi tiếp.'; };
        const c = g.P.towerCoin || 0;
        return [
          ...TOWER_SHOP.filter((x) => ['hx', 'nt', 'bk', 'pc', 'tp'].includes(x.id)).map((x) => ({ t: `Đổi ${x.n} (${x.price} Tháp tệ)`, if: c >= x.price, go: buy(x.id) })),
          { t: 'Đi tiếp', go: (g) => { clearFloor(g, data); return 'Ngươi gật đầu chào rồi đi tiếp. Lão thương nhân lại nhắm mắt.'; } },
        ];
      }
      if (T === 'lien_hoan') {
        return [
          {
            t: 'Nhận thử thách liên hoàn', p: chainOdds(g, data), go: (g) => {
              const r = phases(g, () => g.towerMonster(data.plane, data.floor), 3, { safe: true, big: false, cause: 'gục ở thử thách liên hoàn' }, (i) => ({ tower: 'elite', label: `Tầng ${data.floor} · Thử thách liên hoàn ${i + 1}/3`, bg: THEME_BG[g.themeIdx(data.floor)] }));
              if (!r.win) return `${r.text}

Ngươi gục ở cửa đá. Cấm chế đẩy ngươi ra ngoài.`;
              clearFloor(g, data);
              g.P.towerCoin = (g.P.towerCoin || 0) + 10;
              const loot = g.towerReward(data.floor, 'elite');
              return `${r.text}

Qua cả ba cửa! Thưởng gấp đôi: Tháp tệ +10.
${loot.join('\n')}`;
            },
          },
          { t: 'Đi lối thường', go: (g) => { clearFloor(g, data); return 'Ngươi đi lối thường lên tầng trên.'; } },
        ];
      }
      if (T === 'doi_thu' && bot) {
        return [
          {
            t: 'Tỷ thí giành đường', p: g.winOdds(() => g.botFighter(bot)), go: (g) => {
              const f = g.fightBot(bot, 1, { safe: true, lethal: 0, big: true, tag: { tower: 'elite', label: `Tầng ${data.floor} · Đối thủ leo tháp`, bg: THEME_BG[g.themeIdx(data.floor)] } });
              if (f.win) { clearFloor(g, data); g.fame(3); g.relAdd(bot, -3); g.P.towerCoin = (g.P.towerCoin || 0) + 8; return `${f.text}

${bot.name} lùi lại nhường đường, mặt khó coi. Thanh danh +3, Tháp tệ +8.`; }
              g.relAdd(bot, 2);
              return `${f.text}

${bot.name} bước qua người ngươi lên tầng trên. Thua người leo tháp không mất mạng, chỉ mất mặt.`;
            },
          },
          { t: 'Chắp tay nhường đường', go: (g) => { g.relAdd(bot, 6); clearFloor(g, data); return `${bot.name} gật đầu cảm kích, đi trước một bước. Lát sau ngươi cũng lên tầng trên. Thân thiết +6.`; } },
          { t: 'Rủ cùng leo một đoạn', go: (g) => { g.relAdd(bot, 4); clearFloor(g, data); const t = yrs4(g, 2); return `Hai người cùng leo, vừa đi vừa luận chiêu. Thân thiết +4, tu vi +${t}.`; } },
        ];
      }
      if (T === 'nguoi_ket' && bot) {
        return [
          {
            t: `Phá trận cứu ${bot.name}`, p: g.floorOdds(data.floor, data.plane), go: (g) => {
              const f = g.fightMonster(g.towerMonster(data.plane, data.floor), 1, 1, { safe: true });
              if (f.win) { clearFloor(g, data); g.relAdd(bot, 25); g.fame(2); g.tinh(3); return `${f.text}

Trận pháp vỡ. ${bot.name} quỳ xuống tạ ơn: "Ơn cứu mạng, kiếp này không quên." Thân thiết +25.`; }
              g.relAdd(bot, 5);
              return `${f.text}

Ngươi bị đẩy ra ngoài. ${bot.name} vẫn kẹt trong trận, nhưng nhớ mặt người đã liều mình vì mình. Thân thiết +5.`;
            },
          },
          { t: 'Mặc kệ, đi tiếp', go: (g) => { g.tinh(-3); clearFloor(g, data); return `Ngươi bước qua. Tiếng gọi của ${bot.name} nhỏ dần sau lưng.`; } },
        ];
      }
      if (T === 'bia_ngo') {
        const pv = xp4(0.4 + (st4(g, 'ngo') - 50) / 100);
        return [
          { t: 'Lĩnh ngộ chiêu thức trên bia', p: pv, go: (g) => { clearFloor(g, data); if (g.r.chance(pv)) return g.learnRandom(2, 3); g.stat('ngo', 1); return 'Chữ trên bia nhòe đi trước mắt. Ngươi chỉ hiểu được chút ít. Ngộ tính +1.'; } },
          { t: 'Tham ngộ đạo văn', go: (g) => { clearFloor(g, data); const n = g.P.path === 'tinh' ? 5 : 3; g.addSP(n); return `Đạo văn trên bia tan vào thức hải. Ngộ đạo điểm +${n}.`; } },
          { t: 'Tĩnh tọa trước bia', go: (g) => { clearFloor(g, data); g.stat('ngo', 2); g.stat('tam', 1); g.purgeSat(15); return 'Ngồi trước bia ba ngày, lòng lặng như nước. Ngộ tính +2, tâm tính +1, sát khí giảm.'; } },
        ];
      }
      return [
        { t: 'Uống nước suối', go: (g) => { g.P.hp = 100; clearFloor(g, data); return 'Nước suối mát lạnh chảy vào kinh mạch. Sinh lực hồi đầy.'; } },
        { t: 'Ngồi tu luyện bên suối', go: (g) => { g.P.hp = Math.min(100, g.P.hp + 30); clearFloor(g, data); const t = yrs4(g, 4); return `Linh khí bên suối dồi dào hơn hẳn. Sinh lực +30, tu vi +${t}.`; } },
      ];
    },
  },

  // ================= Lôi kiếp phi thăng: chín đợt =================
  {
    id: 'loi_kiep', queued: true, w: 1,
    title: (g, { data }) => `Lôi kiếp · đợt ${data.wave}/9`,
    auto: (g, { data }) => (g.P.hp < 55 && (g.P.pills.hoi_xuan || 0) > 0 ? 'Uống' : 0),
    text: (g, { data }) => {
      const k = data.wave;
      const desc = ['Đạo lôi đầu tiên xé toạc mây kiếp, thô như cánh tay.', 'Đạo thứ hai mang theo tiếng rồng gầm.', 'Đạo thứ ba nhuộm tím cả bầu trời.', 'Đạo thứ tư tách làm ba, đánh xuống từ ba hướng.', 'Đạo thứ năm là lửa sét, thiêu cả không khí.', 'Đạo thứ sáu mang hình bóng tâm ma của chính ngươi.', 'Đạo thứ bảy to như cột chống trời.', 'Đạo thứ tám, trời đất lặng đi một thoáng trước khi nó giáng xuống.', 'Đạo thứ chín: Thiên Phạt. Nó không đánh vào thân thể, mà đánh vào đạo của ngươi.'][k - 1];
      return `${desc}\n\n${g.oddsText(g.winOdds(() => g.genericFighter(`Đạo lôi thứ ${k}`, g.kiepPow(k))), 0.45, 1.3)}\nGiữa các đợt không có thời gian hồi phục.`;
    },
    choices: (g, { data }) => {
      const k = data.wave;
      const fightWave = (g, pre = '') => {
        const cut = g.P.path === 'kiem' && g.r.chance(0.25);
        if (cut) pre += 'Kiếm trảm lôi! Ngươi vung kiếm chém tan một phần đạo lôi trước khi nó giáng xuống, lực sét yếu đi 20%.\n';
        const f = g.fight(`Đạo lôi thứ ${k}`, g.kiepPow(k) * (cut ? 0.8 : 1), 1, { lethal: 0.45, big: true, cause: 'tan biến dưới lôi kiếp phi thăng', tag: { boss: true, label: `Lôi kiếp · đợt ${k}/9`, bg: '#1d1a3a' } });
        if (f.win) {
          if (k >= 9) return `${pre}${f.text}\n\n${g.ascendPlane()}`;
          g.next('loi_kiep', { wave: k + 1, hp: data.hp });
          return `${pre}${f.text}\n\nĐợt ${k} qua. Sinh lực còn ${g.P.hp}. Mây kiếp vẫn cuộn, đợt thứ ${k + 1} đang tụ lại.`;
        }
        if (!g.playing) return `${pre}${f.text}`;
        g.P.tuvi = Math.floor(g.P.tuvi * 0.7);
        g.P.flags.notifiedFull = false;
        return `${pre}${f.text}\n\nNgươi gục xuống ở đợt thứ ${k}. Mây kiếp tan, tu vi tụt còn 70%. Lần sau phải chuẩn bị kỹ hơn.`;
      };
      return [
        { t: `Chống đỡ đợt ${k}`, p: g.winOdds(() => g.genericFighter(`Đạo lôi thứ ${k}`, g.kiepPow(k))), go: (g) => fightWave(g) },
        { t: `Uống Hồi Xuân Đan rồi chống (còn ${g.P.pills.hoi_xuan || 0})`, if: (g.P.pills.hoi_xuan || 0) > 0, go: (g) => { g.usePill('hoi_xuan'); return fightWave(g, `Đan dược tan ra, sinh lực hồi lên ${g.P.hp}.\n`); } },
        ...(() => {
          const h = !data.hp && k < 9 && g.hoPhapCand();
          if (!h) return [];
          return [{ t: `Nhờ ${h.b.name} hộ pháp, đỡ thay đợt ${k}`, go: (g) => {
            g.relAdd(h.b, 5);
            g.rel(h.b).owe = true;
            g.next('loi_kiep', { wave: k + 1, hp: true });
            return `${h.b.name} bay lên giữa trời, dựng pháp bảo đón lấy đạo lôi thứ ${k}. Tiếng nổ rung chuyển trăm dặm. Người ấy rơi xuống, máu chảy khóe miệng nhưng vẫn mỉm cười với ngươi. Ngươi nợ một ân tình lớn.`;
          } }];
        })(),
        { t: 'Từ bỏ độ kiếp', go: (g) => { g.P.tuvi = Math.floor(g.P.tuvi * 0.85); g.P.flags.notifiedFull = false; g.hurt(15, 'bị lôi kiếp phản phệ'); return 'Ngươi thu hết linh lực, ép mây kiếp tan đi. Cái giá là tu vi tụt còn 85% và một thân thương tích.'; } },
      ];
    },
  },

  // ================= Vùng chủ: hạ đủ 10 yêu thú trong một vùng từ Khó trở lên =================
  {
    id: 'vung_chu', queued: true, w: 1,
    title: (g, { data }) => `Vùng chủ ${MAP_MAP[data.map].n}`,
    auto: (g, { data }) => (phaseOdds(g, () => g.mapBoss(data.map, true), 2) >= 0.55 ? 0 : 'Tránh'),
    text: (g, { data }) => {
      const mp = MAP_MAP[data.map];
      return `Ngươi giết quá nhiều yêu thú ở ${mp.n}. Mặt đất rung chuyển, chủ nhân của vùng này đã thức giấc và đang tìm tới.\n\nVùng chủ đánh qua 2 giai đoạn, ước chừng thắng ~${Math.round(phaseOdds(g, () => g.mapBoss(data.map, true), 2) * 100)}% (sinh lực ${g.P.hp}/100). Hạ được chắc chắn rơi bảo vật.`;
    },
    choices: (g, { data }) => {
      const mp = MAP_MAP[data.map];
      return [
        ...[{
          t: 'Nghênh chiến vùng chủ', p: phaseOdds(g, () => g.mapBoss(data.map, true), 2), go: (g) => {
            const r = phases(g, () => g.mapBoss(data.map), 2, { lethal: 0.35 * mp.lethal, cause: `bị vùng chủ ${mp.n} xé xác` }, (i) => ({ boss: true, label: `Vùng chủ ${mp.n} · Giai đoạn ${i + 1}/2`, phase: i + 1, phases: 2, rage: i > 0 }));
            if (!r.win) return r.text;
            g.fame(4 + mp.d * 2);
            const myth = mp.d >= 5 ? 0.25 : mp.d >= 4 ? 0.12 : mp.d >= 3 ? 0.05 : 0;
            const m = { [mp.mat]: RARE(mp.mat) ? 1 : 3, linh_tinh: fr4(g) * 2 };
            return `${r.text}\n\nVùng chủ ${mp.n} gục ngã.\n${item4(g, g.r.chance(myth) ? 4 : 3, null, 'Vùng chủ rơi')}\n${mats4(g, m)}`;
          },
        }].flatMap((c) => [c, allyChoice(g, 'cùng nghênh chiến', c.go)].filter(Boolean)),
        { t: 'Tránh đi, rời vùng này một thời gian', go: (g) => { g.P.map = g.defaultMap().id; return `Ngươi rút về ${g.defaultMap().n}. Vùng chủ gầm vang sau lưng.`; } },
      ];
    },
  },

  // ================= Linh giới: riêng từng vùng =================
  {
    id: 'linh_tan_khach', w: 4, cd: 15, title: 'Kẻ mới phi thăng', r3: { plane: 1, map: 'tiep_dan_coc', age: 14 },
    auto: () => 'Chỉ đường',
    text: () => 'Dưới chân Tiếp Dẫn Đài, một người vừa phi thăng đứng ngơ ngác, áo còn cháy sém vì lôi kiếp. Người ấy hỏi ngươi đường tới thành gần nhất, mắt đầy cảnh giác.',
    choices: (g) => [
      { t: 'Chỉ đường, dặn vài điều cần tránh', go: (g) => { g.tinh(4); g.fame(1); return 'Người ấy cúi đầu cảm ơn rối rít. Ngươi nhớ lại ngày mình mới lên đây, cũng ngơ ngác y như vậy.'; } },
      { t: 'Cho ít linh thạch đi đường', if: g.P.money >= 30, go: (g) => { g.money(-30); g.tinh(6); g.stat('co', 2); return 'Người ấy nhận, hứa sau này sẽ trả. Cơ duyên +2.'; } },
      { t: 'Lừa dẫn vào chỗ vắng, cướp túi trữ vật', go: (g) => { g.tinh(-10); const m = 80 * fr4(g); g.money(m); return `Túi trữ vật của người hạ giới chỉ có ${m} linh thạch và mấy món đồ quê mùa. Ngươi thấy lòng nặng trĩu.`; } },
    ],
  },
  {
    id: 'linh_hau_dao', w: 4, cd: 15, title: 'Linh hầu trộm đào', r3: { plane: 1, map: 'van_linh_lam', age: 14 },
    auto: () => 'Đổi',
    text: () => 'Một bầy linh hầu ôm đầy những trái đào phát sáng chạy qua trước mặt, con đầu đàn còn quay lại lè lưỡi trêu ngươi. Phía sau, vườn đào linh của ai đó tan hoang.',
    choices: (g) => {
      const m = g.mapMonster(); m.n = 'Linh Hầu Vương';
      return [
        { t: 'Đuổi theo con đầu đàn', p: g.winOdds(() => g.monsterFighter(m)), go: (g) => { const f = g.fightMonster(m); if (f.win) { const t = yrs4(g, 4); return `${f.text}\n\nNgươi ăn một trái đào linh. Tu vi +${t}.\n${mats4(g, { linh_tuy: 2 })}`; } return f.text; } },
        { t: 'Lấy linh tủy đổi đào với chúng', if: (g.P.mats.linh_tuy || 0) >= 1, go: (g) => { g.P.mats.linh_tuy -= 1; g.stat('co', 3); const t = yrs4(g, 3); return `Linh hầu khoái chí đổi hai trái đào. Từ đó bầy hầu hay bám theo ngươi. Cơ duyên +3, tu vi +${t}.`; } },
        { t: 'Báo cho chủ vườn', go: (g) => { g.money(40 * fr4(g)); g.fame(1); return `Chủ vườn là một lão linh nông, thưởng cho ngươi ${40 * fr4(g)} linh thạch.`; } },
      ];
    },
  },
  {
    id: 'huyet_trieu', w: 3, cd: 20, title: 'Huyết triều dâng', r3: { plane: 1, map: 'huyet_linh_hai', age: 16 },
    auto: () => 'Thu',
    text: () => 'Trăng máu mọc, cả Huyết Linh Hải sôi lên. Huyết triều cuộn sóng đỏ thẫm, mang theo vô số huyết linh châu trôi dạt vào bờ. Trong sóng, bóng hải yêu lấp ló.',
    choices: (g) => {
      const p = xp4(0.5 + (st4(g, 'can') - 50) / 100 + (g.P.path === 'the' ? 0.2 : 0));
      return [
        { t: 'Ngâm mình trong huyết triều luyện thể', p, go: (g) => { if (g.r.chance(p)) { g.stat('can', 5); g.P.fight += 0.02; return 'Máu triều thấm vào da thịt, tôi luyện từng thớ cơ. Căn cốt +5, sức chiến đấu +2%.'; } g.hurt(28, 'bị huyết triều nuốt chửng'); return 'Huyết triều cuốn ngươi ra xa bờ, hải yêu cắn mấy nhát mới thoát được.'; } },
        { t: 'Nhặt huyết linh châu dạt vào bờ', go: (g) => mats4(g, { huyet_linh_chau: 2 + g.r.int(0, 2) }) },
        { t: 'Lánh xa bờ biển', go: () => 'Ngươi ngồi trên vách đá xem huyết triều tới sáng.' },
      ];
    },
  },
  {
    id: 'loi_mach', w: 3, cd: 20, title: 'Mạch lôi tinh lộ thiên', r3: { plane: 1, map: 'loi_minh_nguyen', age: 16 },
    auto: () => 'Đào',
    text: () => 'Sét đánh xuống một chỗ mãi không thôi. Tới gần, ngươi thấy cả một mạch lôi tinh lộ ra khỏi đá, tím biếc, kêu lách tách.',
    choices: (g) => {
      const p = xp4(0.5 + (st4(g, 'co') - 50) / 100);
      return [
        { t: 'Đào lôi tinh', p, go: (g) => { if (g.r.chance(p)) return mats4(g, { loi_tinh: 3 + g.r.int(0, 2) }); g.hurt(25, 'bị sét đánh khi đào lôi tinh'); return 'Một đạo sét giáng đúng lúc ngươi chạm vào mạch tinh.'; } },
        { t: 'Ngồi giữa mạch, hấp thu sét', p: xp4(0.4 + (st4(g, 'ngo') - 50) / 100 + (g.P.path === 'tinh' ? 0.25 : 0)), go: (g) => { if (g.r.chance(xp4(0.4 + (st4(g, 'ngo') - 50) / 100 + (g.P.path === 'tinh' ? 0.25 : 0)))) { const t = yrs4(g, 8); g.stat('ngo', 2); return `Sét chạy khắp kinh mạch, thiêu sạch tạp chất. Tu vi +${t}, ngộ tính +2.`; } g.hurt(35, 'bị lôi mạch thiêu thành tro'); return 'Dòng sét quá mạnh, ngươi bị hất văng mấy trượng.'; } },
      ];
    },
  },
  {
    id: 'linh_vuong_tan_hon', w: 3, cd: 30, title: 'Tàn hồn Linh tộc vương', r3: { plane: 1, map: 'linh_hu_chien', age: 16 },
    text: () => 'Giữa chiến trường, một tàn hồn đội vương miện gãy vẫn ngồi trên ngai đá vỡ. "Linh tộc ta diệt vong vì người phi thăng các ngươi. Nhưng ta mệt rồi. Ngươi muốn gì, nói đi."',
    choices: (g) => {
      const m = { n: 'Linh tộc vương tàn hồn', pow: pw4(g) * 1.6, beast: false, r: g.P.realm, seed: 5050 };
      g.makeElite(m, 2, { pick: (a) => a[0], range: () => 1, int: (a) => a, chance: () => false }, 'Trùm');
      return [
        { t: 'Xin truyền thừa', p: xp4(0.4 + (st4(g, 'tam') - 50) / 100), go: (g) => { if (g.r.chance(xp4(0.4 + (st4(g, 'tam') - 50) / 100))) { const sk = g.learnRandom(3, 3); g.stat('ngo', 3); return `Tàn hồn nhìn ngươi rất lâu rồi đặt tay lên trán ngươi. ${sk || 'Ngươi ngộ ra một môn tuyệt kỹ của linh tộc, nhưng chưa luyện thành.'} Ngộ tính +3.`; } g.hurt(18, 'bị oán khí linh tộc xé nát'); return '"Không xứng." Một luồng oán khí hất ngươi ra xa.'; } },
        { t: 'Siêu độ cho người', go: (g) => { g.tinh(8); g.stat('tam', 4); return 'Tàn hồn mỉm cười, tan thành ánh sáng. Cả chiến trường bỗng yên lặng hẳn đi. Tâm tính +4.'; } },
        { t: 'Thách đấu để chiếm ngai', p: g.winOdds(() => g.monsterFighter(m)), go: (g) => { const f = g.fightMonster(m, 1, 1, { lethal: 0.45, cause: 'chết dưới tay Linh tộc vương' }); if (f.win) { g.fame(10); return `${f.text}\n\nVương miện gãy lăn xuống chân ngươi.\n${item4(g, g.r.chance(0.15) ? 4 : 3, 'phu_kien', 'Linh tộc vương để lại', true)}\n${mats4(g, { linh_hon_tinh: 3 })}`; } return f.text; } },
      ];
    },
  },
  {
    id: 'vuc_goi', w: 2, cd: 40, title: 'Tiếng gọi từ đáy vực', r3: { plane: 1, map: 'van_linh_uyen', age: 16 },
    text: () => 'Từ đáy Vẫn Linh Uyên vọng lên một giọng nói gọi đúng tên ngươi, giọng của người thân đã khuất. Dưới đó, đạo văn thạch phát sáng như sao.',
    choices: (g) => {
      const p = xp4(0.35 + (st4(g, 'tam') - 50) / 80);
      return [
        { t: 'Lần xuống đáy vực', p, go: (g) => { if (g.r.chance(p)) { const t = yrs4(g, 10); return `Ngươi giữ vững tâm trí suốt đường xuống, nhặt đá rồi leo lên. Tu vi +${t}.\n${mats4(g, { dao_van_thach: 2 })}`; } g.hurt(45, 'linh hồn bị đáy vực nuốt mất'); return 'Giọng nói kéo ngươi xuống sâu mãi. Khi tỉnh lại ngươi đã nằm trên miệng vực, linh hồn như bị xé mất một mảnh.'; } },
        { t: 'Bịt tai, quay đi', go: (g) => { g.stat('tam', 3); return 'Tiếng gọi theo ngươi ba ngày mới dứt. Tâm tính +3.'; } },
      ];
    },
  },

  // ================= Linh giới: phi thăng giả và bản địa =================
  {
    id: 'ho_tich', w: 5, cd: 999, once: true, title: 'Hộ tịch phi thăng giả', r3: { plane: 1, age: 14 },
    when: (g) => g.P.flags.ascendedFrom === 0,
    auto: () => 'Nộp',
    text: (g) => `Quan sai của thành gần Tiếp Dẫn Đài chặn ngươi lại: "Phàm thai từ hạ giới lên phải đăng ký hộ tịch, nộp ${80 * fr4(g)} linh thạch. Không có hộ tịch thì không được vào thành, không được bái sư."`,
    choices: (g) => [
      { t: 'Nộp tiền cho êm chuyện', if: g.P.money >= 80 * fr4(g), go: (g) => { g.money(-80 * fr4(g)); return 'Quan sai đóng dấu vào thẻ ngọc, ném lại cho ngươi như ném cho chó.'; } },
      { t: 'Cãi lý: luật nào bắt người phi thăng nộp tiền?', p: xp4(0.4 + (st4(g, 'ngo') - 50) / 100), go: (g) => { if (g.r.chance(xp4(0.4 + (st4(g, 'ngo') - 50) / 100))) { g.fame(3); return 'Ngươi đọc vanh vách luật thành. Quan sai đỏ mặt, đóng dấu miễn phí. Mấy người phi thăng đứng sau vỗ tay.'; } g.hurt(10, 'bị quan sai đánh chết'); return 'Quan sai gọi thêm người, đánh ngươi một trận rồi mới đóng dấu.'; } },
      { t: 'Đánh quan sai', go: (g) => { const f = g.fight('Quan sai bản địa', pw4(g) * 0.9, 1, { lethal: 0.1 }); if (f.win) { g.fame(2); g.tinh(-3); return `${f.text}\n\nNgươi vào thành không cần hộ tịch. Từ nay quan sai thấy ngươi là tránh.`; } return f.text; } },
    ],
  },
  {
    id: 'thieu_gia_ban_dia', w: 3, cd: 15, title: 'Thiếu gia bản địa', r3: { plane: 1, age: 16 },
    bot: (g) => g.findBot((b) => b.dao && !b.ascFrom && near4(g, b, 1) && (b.pers === 'cuong' || b.pers === 'tham')),
    auto: (g, { bot: b }) => (g.winOdds(() => g.botFighter(b)) >= 0.65 ? 'Dạy' : 'Nhịn'),
    text: (g, { bot: b }) => `${g.nm(b)}, con cháu một dòng họ lớn ở Linh giới, giẫm lên vạt áo ngươi giữa chợ: "Phàm thai cũng dám đi giữa đường à?" Đám tùy tùng cười ầm lên.\n\n${g.hintBot(b)}`,
    choices: (g, { bot: b }) => [
      { t: 'Nhịn, cúi đầu đi qua', go: (g) => { g.stat('tam', 3); g.relAdd(b, -5); return 'Ngươi siết chặt nắm tay rồi đi tiếp. Chuyện này ngươi sẽ nhớ. Tâm tính +3.'; } },
      { t: 'Dạy cho một bài học', p: g.winOdds(() => g.botFighter(b)), go: (g) => { const f = g.fightBot(b); if (f.win) { g.relSet(b, -60, 'thu'); g.fame(5); return `${f.text}\n\nCả chợ im phăng phắc. Từ nay người Linh giới nhìn người phi thăng bằng con mắt khác.`; } return f.text; } },
      { t: 'Dùng mưu: khen hắn, rồi gài bẫy', p: xp4(0.45 + (st4(g, 'ngo') - 50) / 100), go: (g) => { if (g.r.chance(xp4(0.45 + (st4(g, 'ngo') - 50) / 100))) { const m = 60 * fr4(g); g.money(m); g.relAdd(b, -20); return `Ngươi dụ hắn vào một ván cược, ăn sạch ${m} linh thạch. Hắn tức tím mặt mà không làm gì được.`; } g.relAdd(b, -30); return 'Hắn nhìn thấu mưu kế, cười khẩy bỏ đi.'; } },
    ],
  },
  {
    id: 'hoi_phi_thang', w: 4, cd: 999, once: true, title: 'Hội Phi Thăng', r3: { plane: 1, age: 16 },
    when: (g) => g.P.flags.ascendedFrom === 0 && !g.P.sect,
    auto: () => 'Gia nhập',
    text: () => 'Một người đàn bà áo xám tìm tới, đưa cho ngươi tấm lệnh bài hình cánh cửa: "Ở đây người bản địa chỉ coi chúng ta là phàm thai. Người phi thăng phải che chở cho nhau. Hội Phi Thăng mở cửa cho ngươi."',
    choices: (g) => [
      { t: 'Gia nhập Hội Phi Thăng', go: (g) => { let sc = g.aliveSects(1).find((x) => x.name === 'Hội Phi Thăng'); if (!sc) { sc = g.newSect(null, 1); sc.name = 'Hội Phi Thăng'; } g.joinSect(sc); for (const b of g.s.souls) if (b.alive && b.plane === 1 && b.ascFrom === 0 && !b.sect && g.r.chance(0.6)) b.sect = sc.id; return 'Ngươi được dẫn tới một sơn trang ẩn trong mây. Ở đây toàn người từ hạ giới lên, có người còn nói đúng giọng quê ngươi. Tu luyện nhanh hơn 20%.'; } },
      { t: 'Từ chối, một mình vẫn hơn', go: (g) => { g.stat('tam', 2); return 'Người đàn bà gật đầu, để lại tấm lệnh bài: "Khi nào cần thì tới."'; } },
    ],
  },
  {
    id: 'co_nhan_thuong_gioi', w: 5, cd: 30, title: 'Cố nhân ở thượng giới', r3: { plane: 1, age: 16 },
    bot: (g) => g.findBot((b, r) => b.ascFrom === 0 && r && (r.v >= 15 || (r.past && r.past.length) || r.tag)),
    auto: () => 0,
    text: (g, { bot: b }) => `Giữa phố đông người Linh giới, có ai đó gọi tên ngươi bằng giọng hạ giới. Là ${g.nm(b)}, người quen cũ ở Phàm giới đã phi thăng lên trước.`,
    choices: (g, { bot: b }) => [
      { t: 'Ôm lấy cố nhân', go: (g) => { g.relAdd(b, 25); g.rel(b).met = true; g.tinh(6); const m = 100 * fr4(g); g.money(m); return `Hai người tìm một quán rượu, kể chuyện tới sáng. ${b.name} chỉ cho ngươi những chỗ nên tránh ở Linh giới, dúi thêm ${m} linh thạch.`; } },
      { t: 'Hỏi thăm về Vạn Linh Tháp', go: (g) => { g.relAdd(b, 10); g.rel(b).met = true; g.stat('ngo', 3); return `${b.name} đã leo tới tầng ${b.tower || 0}. Người ấy kể kỹ từng tầng cảnh, từng con trùm. Ngộ tính +3.`; } },
    ],
  },
  {
    id: 'di_vat_ha_gioi', w: 3, cd: 999, once: true, title: 'Di vật hạ giới', r3: { plane: 1, age: 16 },
    when: (g) => [...g.P.bag, ...Object.values(g.P.eq)].some((it) => it && it.lv < 10),
    auto: () => 'Giữ',
    text: () => 'Một lão sưu tầm Linh giới để ý món đồ hạ giới của ngươi: "Đồ phàm giới ở đây hiếm lắm, người ta mua về làm kỷ vật. Ta trả giá gấp mười."',
    choices: (g) => {
      const it = [...g.P.bag, ...Object.values(g.P.eq)].filter((x) => x && x.lv < 10).sort((a, b) => b.val - a.val)[0];
      const price = it.val * 10;
      return [
        { t: `Bán ${it.n} lấy ${fmt4(price)} linh thạch`, go: (g) => { const i = g.P.bag.indexOf(it); if (i >= 0) g.P.bag.splice(i, 1); else for (const k in g.P.eq) if (g.P.eq[k] === it) g.P.eq[k] = null; g.money(price); return `Lão vuốt ve món đồ như vuốt con. Ngươi nhận ${fmt4(price)} linh thạch.`; } },
        { t: 'Giữ lại làm kỷ niệm', go: (g) => { g.stat('tam', 2); return 'Có những thứ không bán được bằng linh thạch. Tâm tính +2.'; } },
      ];
    },
  },

  // ================= Linh giới: đời sống =================
  {
    id: 'tranh_linh_mach', w: 3, cd: 20, title: 'Tranh đoạt linh mạch', r3: { plane: 1, age: 16 },
    prep: (g) => { const ss = g.aliveSects(1).filter((x) => x.id !== g.P.sect); return ss.length >= 2 ? { a: ss[0].id, b: ss[1].id } : null; },
    auto: () => 'Đứng',
    text: (g, { data }) => `Một linh mạch cấp cao vừa lộ ra giữa địa phận ${g.sect(data.a).name} và ${g.sect(data.b).name}. Hai bên dàn trận, ai cũng muốn thuê thêm người.`,
    choices: (g, { data }) => {
      const side = (me) => (g) => { const f = g.fight(`Đệ tử ${g.sect(me === data.a ? data.b : data.a).name}`, pw4(g), 1, { lethal: 0.18 }); if (f.win) { const m = 150 * fr4(g); g.money(m); g.fame(3); return `${f.text}\n\n${g.sect(me).name} giữ được linh mạch, chia cho ngươi ${m} linh thạch.\n${mats4(g, { linh_tuy: 2 })}`; } return f.text; };
      return [
        { t: `Giúp ${g.sect(data.a).name}`, go: side(data.a) },
        { t: `Giúp ${g.sect(data.b).name}`, go: side(data.b) },
        { t: 'Lén vào hút linh khí khi hai bên đánh nhau', p: xp4(0.45 + (st4(g, 'co') - 50) / 100), go: (g) => { if (g.r.chance(xp4(0.45 + (st4(g, 'co') - 50) / 100))) { const t = yrs4(g, 8); return `Không ai để ý tới ngươi. Tu vi +${t}.`; } g.hurt(25, 'bị hai tông cùng truy sát'); return 'Cả hai bên đều phát hiện ra ngươi, và lần đầu tiên họ đồng lòng: đánh kẻ trộm trước.'; } },
        { t: 'Đứng ngoài', go: () => 'Ngươi đứng trên đồi xem hai tông đánh nhau suốt ba ngày.' },
      ];
    },
  },
  {
    id: 'huyet_mach_linh_toc', w: 2, cd: 999, once: true, title: 'Huyết mạch Linh tộc', r3: { plane: 1, age: 16 },
    auto: () => 'Thử',
    text: () => 'Trong một làng ẩn giữa rừng, những người cuối cùng của Linh tộc thử huyết mạch cho người lạ. Truyền thuyết nói có những người phi thăng mang trong mình một giọt máu Linh tộc từ ngàn đời trước.',
    choices: (g) => [
      { t: 'Nhỏ máu lên bia thử', p: xp4(0.25 + (st4(g, 'co') - 50) / 120), go: (g) => { if (g.r.chance(xp4(0.25 + (st4(g, 'co') - 50) / 120))) { g.stat('can', 6); g.stat('ngo', 4); g.P.fight += 0.03; g.chron(`${g.P.name} thức tỉnh huyết mạch Linh tộc.`, 2); return 'Bia đá sáng lên. Cả làng quỳ xuống. Huyết mạch Linh tộc thức tỉnh: căn cốt +6, ngộ tính +4, sức chiến đấu +3%.'; } g.stat('tam', 1); return 'Bia đá lặng im. Bà lão Linh tộc vỗ vai ngươi: "Không có cũng tốt. Huyết mạch là gánh nặng."'; } },
      { t: 'Chỉ ở lại học tiếng Linh tộc', go: (g) => { g.stat('ngo', 3); return 'Ngôn ngữ Linh tộc có những từ chỉ linh khí mà tiếng người không có. Ngộ tính +3.'; } },
    ],
  },
  {
    id: 'dau_gia_linh', w: 3, cd: 15, title: 'Đấu giá Vạn Bảo Các', r3: { plane: 1, place: 'thanh', age: 16 },
    auto: () => 'Không',
    text: (g) => `Vạn Bảo Các mở phiên đấu giá lớn. Món đáng chú ý: một bảo vật Cực phẩm (giá khởi điểm ${fmt4(900 * fr4(g))} linh thạch) và ba viên đạo văn thạch (${fmt4(600 * fr4(g))}).`,
    choices: (g) => [
      { t: `Trả giá bảo vật (${fmt4(900 * fr4(g))})`, if: g.P.money >= 900 * fr4(g), go: (g) => { g.money(-900 * fr4(g)); return item4(g, 3, null, 'Thắng đấu giá'); } },
      { t: `Mua đạo văn thạch (${fmt4(600 * fr4(g))})`, if: g.P.money >= 600 * fr4(g), go: (g) => { g.money(-600 * fr4(g)); return mats4(g, { dao_van_thach: 3 }); } },
      { t: 'Không mua gì', go: () => 'Ngươi ngồi xem người ta ném linh thạch như ném sỏi.' },
    ],
  },
  {
    id: 'cho_den_linh', w: 3, cd: 12, title: 'Chợ đen Linh giới', r3: { plane: 1, place: 'thanh', age: 16 },
    auto: () => 'Bỏ',
    text: (g) => `Trong một con hẻm tối, một kẻ trùm mặt chào bán linh tủy rẻ bằng một nửa giá chợ: 10 viên ${fmt4(150 * fr4(g))} linh thạch. "Hàng thật, lấy từ kho của tông môn đổ nát."`,
    choices: (g) => [
      { t: 'Mua', if: g.P.money >= 150 * fr4(g), go: (g) => { g.money(-150 * fr4(g)); if (g.r.chance(0.7)) return mats4(g, { linh_tuy: 10 }); return 'Về mở ra mới thấy là đá thường quét bột phát sáng. Kẻ kia đã biến mất.'; } },
      { t: 'Bắt hắn khai nguồn hàng', p: xp4(0.5 + (st4(g, 'co') - 50) / 100), go: (g) => { if (g.r.chance(xp4(0.5 + (st4(g, 'co') - 50) / 100))) { g.fame(2); return `Hắn khai ra một kho hàng lậu. Ngươi báo quan, được thưởng.\n${mats4(g, { linh_tuy: 4 })}`; } g.hurt(15, 'bị bọn chợ đen đâm lén'); return 'Đồng bọn của hắn từ trong bóng tối lao ra.'; } },
      { t: 'Bỏ đi', go: () => 'Hàng rẻ thì có lý do của nó.' },
    ],
  },
  {
    id: 'khe_uoc_linh_thu', w: 3, cd: 30, title: 'Khế ước linh thú', r3: { plane: 1, age: 14 },
    when: (g) => !g.P.flags.pet,
    auto: () => 'Khế',
    text: () => 'Một con linh thú non bị thương nằm thoi thóp dưới gốc cây, mắt to tròn nhìn ngươi. Ở Linh giới, linh thú chỉ khế ước với người nó tự chọn.',
    choices: (g) => {
      const p = xp4(0.45 + (st4(g, 'co') - 50) / 100 + g.P.tinh / 300);
      const pet = g.r.pick(['Lôi Văn Báo con', 'Thanh Loan non', 'Linh Hồ ba đuôi', 'Ngọc Lân non']);
      return [
        { t: 'Băng bó rồi đưa tay ra', p, go: (g) => { if (g.r.chance(p)) { g.P.flags.pet = pet; g.tinh(5); return `${pet} liếm tay ngươi. Một sợi dây khế ước sáng lên giữa hai bên. Từ nay nó theo ngươi. Sức chiến đấu +10% khi có linh thú.`; } g.tinh(3); return 'Nó gầm gừ, gượng dậy tập tễnh bỏ đi. Có lẽ chưa phải duyên.'; } },
        { t: 'Bán cho thương nhân linh thú', go: (g) => { const m = 120 * fr4(g); g.money(m); g.tinh(-5); return `Thương nhân trả ${m} linh thạch. Con vật nhìn ngươi suốt tới khi xe khuất.`; } },
      ];
    },
  },
  {
    id: 'linh_hai_trieu', w: 2, cd: 40, title: 'Linh Hải triều dâng', r3: { plane: 1, age: 16 },
    auto: () => 'Tu',
    text: () => 'Trăm năm một lần, linh khí cả Linh giới dâng lên như thủy triều. Ai cũng đóng cửa tu luyện. Linh khí đặc tới mức đọng thành sương trên lá.',
    choices: (g) => [
      { t: 'Liều hấp thu hết sức', p: xp4(0.5 + (st4(g, 'tam') - 50) / 100), go: (g) => { if (g.r.chance(xp4(0.5 + (st4(g, 'tam') - 50) / 100))) { const t = yrs4(g, 15); return `Kinh mạch giãn ra như sông mùa lũ. Tu vi +${t}.`; } g.hurt(30, 'kinh mạch nổ tung vì hấp thu quá sức'); const t = yrs4(g, 4); return `Linh khí quá nhiều, kinh mạch rạn nứt. Ngươi chỉ giữ được một phần. Tu vi +${t}.`; } },
        { t: 'Tu luyện vừa sức', go: (g) => { const t = yrs4(g, 7); return `Ngươi hấp thu đều đặn suốt mấy tháng. Tu vi +${t}.`; } },
    ],
  },
  {
    id: 'chieu_pho_ma', w: 2, cd: 60, title: 'Linh Hoàng chiêu thân', r3: { plane: 1, realm: 12, age: 30 },
    auto: () => 'Không',
    text: (g) => `Linh Hoàng của một vương triều Linh giới mở đại hội ${g.P.g === 'nu' ? 'tuyển phi cho thái tử' : 'chiêu phò mã cho công chúa'}. Người được chọn có cả một vương triều chống lưng. Người phi thăng cũng được dự, nhưng hiếm ai qua vòng đầu.`,
    choices: (g) => [
      { t: 'Dự tuyển', p: xp4(0.25 + (st4(g, 'co') - 50) / 100 + g.P.fame / 1000), go: (g) => { if (g.r.chance(xp4(0.25 + (st4(g, 'co') - 50) / 100 + g.P.fame / 1000))) { g.fame(25); const m = 1500 * fr4(g); g.money(m); g.chron(`${g.fullName()} trúng tuyển trong đại hội chiêu thân của Linh Hoàng.`, 2); return `Ngươi qua cả ba vòng thi. Linh Hoàng đích thân ban hôn. Sính lễ ${fmt4(m)} linh thạch, danh vọng +25.`; } g.fame(3); return 'Ngươi vào tới vòng hai, cũng đủ để cả thành biết tên.'; } },
      { t: 'Không dự', go: () => 'Ngươi nghe kể lại, cười một mình.' },
    ],
  },
  {
    id: 'linh_ton_chi_diem', w: 3, cd: 25, title: 'Linh Tôn chỉ điểm', r3: { plane: 1, age: 20 },
    bot: (g) => g.findBot((b) => b.dao && b.realm >= g.P.realm + 2),
    auto: () => 'Nghe',
    text: (g, { bot: b }) => `${g.nm(b)} đi ngang qua lúc ngươi đang luyện công, dừng lại xem một lúc rồi nói: "Ngươi luyện sai một chỗ."`,
    choices: (g, { bot: b }) => [
      { t: 'Cúi đầu xin chỉ giáo', go: (g) => { g.relAdd(b, 10); g.rel(b).met = true; const sk = g.r.chance(0.4) ? g.learnRandom(2, 3) : ''; const t = yrs4(g, 5); return `${b.name} chỉ đúng ba câu. Ngươi ngồi nghĩ ba tháng mới hiểu hết. Tu vi +${t}. ${sk}`; } },
      { t: 'Cãi lại: "Ta luyện kiểu của ta"', go: (g) => { g.relAdd(b, -5); g.stat('tam', 2); return `${b.name} nhún vai bỏ đi. Có thể người ấy đúng, có thể không.`; } },
    ],
  },
  {
    id: 'linh_kiep_nho', w: 2, cd: 50, title: 'Linh kiếp nhỏ', r3: { plane: 1, realm: 13, age: 30 },
    auto: (g) => (xp4(0.5 + (st4(g, 'can') - 50) / 100) >= 0.6 ? 0 : 'Tránh'),
    text: () => 'Linh khí trong người ngươi tích tụ quá nhanh, trời đất bắt đầu bài xích. Một trận linh kiếp nhỏ đang kéo tới: không phải sấm, mà là linh khí hỗn loạn xoáy thành lốc.',
    choices: (g) => {
      const p = xp4(0.5 + (st4(g, 'can') - 50) / 100 + (g.P.path === 'the' ? 0.15 : 0));
      return [
        { t: 'Đứng giữa lốc, luyện hóa', p, go: (g) => { if (g.r.chance(p)) { const t = yrs4(g, 12); g.stat('can', 3); return `Lốc linh khí bị ngươi nuốt trọn. Tu vi +${t}, căn cốt +3.`; } g.hurt(40, 'bị linh kiếp xé nát'); return 'Lốc xé toạc da thịt ngươi.'; } },
        { t: 'Tránh vào động sâu', go: (g) => { g.hurt(10, 'chết trong linh kiếp'); return 'Linh kiếp quét qua động phủ, ngươi chỉ bị thương nhẹ.'; } },
      ];
    },
  },

  // ================= Chuỗi: Bí mật Tiếp Dẫn Đài =================
  {
    id: 'tiep_dan_1', w: 2, cd: 999, once: true, title: 'Người phi thăng mất tích', r3: { plane: 1, age: 20 },
    auto: () => 'Bỏ',
    text: () => 'Gần đây, người mới phi thăng lên Tiếp Dẫn Đài cứ biến mất không dấu vết. Hội Phi Thăng nói họ được "Tiếp Dẫn Sứ" đưa đi đăng ký, rồi không ai thấy quay về.',
    choices: (g) => [
      { t: 'Điều tra Tiếp Dẫn Sứ', p: xp4(0.45 + (st4(g, 'ngo') - 50) / 100), go: (g) => { if (g.r.chance(xp4(0.45 + (st4(g, 'ngo') - 50) / 100))) { g.later(g.r.int(5, 15), 'tiep_dan_2'); return 'Ngươi theo dõi một đoàn Tiếp Dẫn Sứ. Họ dẫn người mới vào một cửa đá dưới chân đài, rồi chỉ có họ đi ra.\n\n(Chuyện này chưa kết thúc.)'; } return 'Tiếp Dẫn Sứ rất cẩn thận, ngươi không tìm ra gì.'; } },
      { t: 'Bỏ qua, chuyện không phải của mình', go: (g) => { g.tinh(-3); return 'Ngươi quay đi. Hôm sau lại có người mất tích.'; } },
    ],
  },
  {
    id: 'tiep_dan_2', queued: true, w: 1, title: 'Hầm ngầm dưới Tiếp Dẫn Đài',
    auto: (g) => (g.winOdds(() => g.genericFighter('Tiếp Dẫn Vệ', pw4(g) * 1.1)) >= 0.6 ? 0 : 1),
    text: () => 'Ngươi lẻn qua cửa đá. Bên dưới là một đại trận khổng lồ, hàng trăm người phi thăng bị xích quanh trận, linh lực bị hút dần ra như những giọt sương. Họ thành "linh nô" nuôi trận cho ai đó.',
    choices: (g) => [
      { t: 'Phá xiềng cứu người ngay', go: (g) => { const f = g.fight('Tiếp Dẫn Vệ', pw4(g) * 1.1, 1, { lethal: 0.25, cause: 'chết dưới hầm Tiếp Dẫn Đài' }); if (f.win) { g.tinh(8); g.fame(6); g.later(g.r.int(3, 8), 'tiep_dan_3', { ally: false }); return `${f.text}\n\nNgươi cứu được mười mấy người. Nhưng trận pháp vẫn chạy, và kẻ đứng sau đã biết có người phá đám.\n\n(Hắn sẽ tìm tới.)`; } return `${f.text}\n\nNgươi phải bỏ chạy.`; } },
      { t: 'Ra ngoài báo cho Hội Phi Thăng', go: (g) => { g.later(g.r.int(3, 8), 'tiep_dan_3', { ally: true }); return 'Hội Phi Thăng nghe tin, tập hợp tất cả những ai còn đánh được. Ngày khai chiến đã được định.\n\n(Chuẩn bị cho trận quyết chiến.)'; } },
    ],
  },
  {
    id: 'tiep_dan_3', queued: true, w: 1, title: 'Tiếp Dẫn Sứ Giả',
    auto: (g, { data }) => (g.winOdds(() => g.genericFighter('Tiếp Dẫn Sứ Giả', pw4(g, 1) * (data.ally ? 0.9 : 1.2))) >= 0.55 ? 0 : 1),
    text: (g, { data }) => `${data.ally ? 'Người của Hội Phi Thăng vây kín Tiếp Dẫn Đài.' : 'Kẻ đứng sau tự tìm tới ngươi.'} Tiếp Dẫn Sứ Giả hiện ra, một lão già mặc áo trắng tinh, nụ cười hiền hậu: "Phàm thai sinh ra để làm củi. Các ngươi đốt lên thì Linh giới mới ấm."\n\n${g.oddsText(g.winOdds(() => g.genericFighter('Tiếp Dẫn Sứ Giả', pw4(g, 1) * (data.ally ? 0.9 : 1.2))), 0.4, 1.3)}`,
    choices: (g, { data }) => [
      { t: 'Quyết chiến', go: (g) => { const f = g.fight('Tiếp Dẫn Sứ Giả', pw4(g, 1) * (data.ally ? 0.9 : 1.2), 1, { lethal: 0.4, cause: 'chết dưới tay Tiếp Dẫn Sứ Giả' }); if (f.win) { g.fame(30); g.tinh(12); g.chron(`${g.fullName()} phá đại trận dưới Tiếp Dẫn Đài, giải thoát hàng trăm người phi thăng.`, 3); const t = yrs4(g, 15); return `${f.text}\n\nĐại trận vỡ tan. Hàng trăm linh nô được thả ra, quỳ rạp dưới chân ngươi. Danh vọng +30, tu vi +${t}.\n${item4(g, 4, null, 'Kho của Tiếp Dẫn Sứ Giả có', true)}\n${mats4(g, { linh_tuy: 10, dao_van_thach: 2 })}`; } return `${f.text}\n\nNgươi thất bại. Đại trận vẫn tiếp tục chạy dưới chân Tiếp Dẫn Đài.`; } },
      { t: 'Rút lui, chờ thời', go: () => 'Ngươi rút lui. Nụ cười hiền hậu của lão già theo ngươi vào tận giấc mơ.' },
    ],
  },
];
const RARE = (k) => k === 'than_hon' || k === 'dao_van_thach';

const fmt4 = (n) => Math.floor(n).toLocaleString('vi-VN');
