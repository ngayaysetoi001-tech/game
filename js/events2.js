// Kỳ ngộ mở rộng: nhiều nhánh, tỉ lệ khác nhau theo lựa chọn, có chuỗi sự kiện nối tiếp.
// Lựa chọn có `p` thì giao diện hiện tỉ lệ thành công ước chừng cạnh nút.
import { REALMS, TOP_REALM } from './data.js';
import { makeItem } from './items.js';

const xp = (p) => Math.max(0.03, Math.min(0.97, p));
const st = (g, k) => g.P.stats[k];
const pw = (g, add = 0) => REALMS[Math.max(0, Math.min(TOP_REALM, g.P.realm + add))].pow;
const item = (g, q, slot = null, lv = g.P.realm) => g.gainItem(makeItem(g.r, g.s.nextItem++, lv, q, slot));
const yrs = (g, n) => g.addTuvi(g.gain() * n);
const pickFoe = (g, not = null) => {
  const c = g.findBot((b) => b.dao && b.id !== not && Math.abs(b.realm - g.P.realm) <= 1 && b.age >= 14, 1);
  return c ? c.id : null;
};
const friendOf = (g) => g.known().filter(({ r }) => r.v >= 40).map(({ b }) => b)[0] || null;

export const EVENTS2 = [
  // ===== Bản đồ da dê (chuỗi) =====
  {
    id: 'ban_do', w: 2, cd: 30, acts: ['lich_luyen', 'muu_sinh'], title: 'Tấm bản đồ da dê', auto: () => 'Giữ lại',
    when: (g) => g.P.age >= 14,
    text: () => 'Một lão đạo tặc hấp hối trong ngõ hẻm dúi vào tay ngươi tấm bản đồ da dê thấm máu: "Kho... dưới Song Phong... đừng để bọn Thiết Ưng..." rồi tắt thở.',
    choices: (g) => [
      { t: 'Giữ lại, khi nào mạnh hơn sẽ đi tìm', go: (g) => { g.later(g.r.int(5, 12), 'ban_do_2', {}); return 'Ngươi gấp tấm bản đồ, khâu vào lớp lót áo. Sẽ có ngày.'; } },
      { t: 'Lập tức lên đường', go: (g) => { g.later(1, 'ban_do_2', { rush: true }); return 'Ngươi thu xếp hành lý ngay trong đêm.'; } },
      { t: 'Bán cho tiệm cầm đồ', go: (g) => { const m = 40 * (1 + g.P.realm); g.money(m); return `Lão chủ tiệm trả ${m} linh thạch, tay run run khi cầm tấm bản đồ.`; } },
    ],
  },
  {
    id: 'ban_do_2', queued: true, title: 'Dưới chân Song Phong',
    auto: (g) => (friendOf(g) ? 'Rủ' : 'Rình'),
    text: (g, { data }) => `Ngươi lần theo bản đồ tới chân núi Song Phong. Cửa hang bị đá lấp, nhưng trên mặt đất có dấu chân còn mới${data.rush ? ', ai đó cũng đang ráo riết tìm kho báu này' : ''}.`,
    choices: (g, { data }) => {
      const pDig = xp(0.5 + (st(g, 'co') - 50) / 150 - (data.rush ? 0.1 : 0));
      const fr = friendOf(g);
      return [
        {
          t: 'Đào ngay trong đêm', p: pDig, go: (g) => {
            if (g.r.chance(pDig)) { const m = g.r.int(60, 150) * (1 + g.P.realm); g.money(m); return `Dưới lớp đá là rương gỗ lim mục. Linh thạch +${m}.\n${item(g, g.r.chance(0.3) ? 3 : 2)}`; }
            g.hurt(25, 'chết vì bẫy đá trong kho báu Song Phong');
            return 'Ngươi chạm phải cơ quan. Đá trên vách đổ xuống như mưa.';
          },
        },
        {
          t: 'Rình xem ai tới trước', p: 0.6, go: (g) => {
            if (g.r.chance(0.6)) { return `Một toán Thiết Ưng bang khiêng rương đi, bỏ lại mấy món chúng chê.\n${item(g, 1)}`; }
            const f = g.fight('Thiết Ưng bang', pw(g) * 1.1);
            if (f.win) { const m = g.r.int(80, 160) * (1 + g.P.realm); g.money(m); return `Bọn Thiết Ưng phát hiện ra ngươi.\n${f.text}\n\nNgươi đánh tan chúng, ôm trọn rương báu. Linh thạch +${m}.\n${item(g, 2)}`; }
            return `Bọn Thiết Ưng phát hiện ra ngươi.\n${f.text}`;
          },
        },
        {
          t: `Rủ ${fr ? fr.name : 'bằng hữu'} cùng đi`, if: !!fr, p: 0.9, go: (g) => {
            g.relAdd(fr, 15);
            return `${fr.name} canh chừng, ngươi đào. Hai người chia đôi kho báu, vừa đủ vui.\n${item(g, g.r.chance(0.5) ? 2 : 1)}`;
          },
        },
        { t: 'Bỏ qua, kho báu nào cũng có chủ', go: () => 'Ngươi đốt tấm bản đồ. Khói bay lên, nhẹ tênh.' },
      ];
    },
  },

  // ===== Trứng lạ (chuỗi) =====
  {
    id: 'trung_la', w: 2, cd: 40, acts: ['lich_luyen'], title: 'Quả trứng nóng hổi', auto: () => 'Mang về ấp',
    when: (g) => g.P.age >= 10 && !g.P.flags.egg,
    text: () => 'Trong hốc đá có một quả trứng to bằng cái đấu, vỏ đỏ hồng và nóng ran như than. Bên trong có tiếng gõ khe khẽ.',
    choices: () => [
      { t: 'Mang về ấp', go: (g) => { g.P.flags.egg = true; g.later(g.r.int(3, 8), 'trung_no', { k: g.r.pick(['Hỏa Lân Ấu Thú', 'Băng Tinh Hồ', 'Lôi Ưng Non', 'Huyền Quy', 'Song Đầu Xà']) }); return 'Ngươi bọc trứng trong chăn bông, đêm nào cũng ôm ngủ.'; } },
      { t: 'Đem bán cho thương nhân linh thú', go: (g) => { const m = 60 * (1 + g.P.realm); g.money(m); return `Bán được ${m} linh thạch.`; } },
      {
        t: 'Luộc ăn cho bổ', p: 0.6, go: (g) => {
          if (g.r.chance(0.6)) { g.stat('can', 6); g.P.hp = Math.min(100, g.P.hp + 20); return 'Một luồng nhiệt chạy khắp người, xương cốt kêu răng rắc. Căn cốt +6.'; }
          g.hurt(18, 'trúng độc vì ăn trứng yêu thú');
          return 'Bụng ngươi quặn thắt. Thứ trong trứng không phải để ăn.';
        },
      },
    ],
  },
  {
    id: 'trung_no', queued: true, title: 'Trứng nở',
    text: (g, { data }) => {
      const k = data.k || 'Hỏa Lân Ấu Thú';
      return `Vỏ trứng nứt toác. Một con ${k} bò ra, ướt nhẹp, ngước nhìn ngươi rồi kêu lên một tiếng.${k === 'Song Đầu Xà' ? '\n\nHai cái đầu của nó nhìn nhau như đang bàn chuyện gì đó.' : ''}`;
    },
    choices: (g, { data }) => {
      const k = data.k || 'Hỏa Lân Ấu Thú';
      return [
        {
          t: g.P.flags.pet ? `Nuôi ${k}, thả ${g.P.flags.pet} về rừng` : `Nhận ${k} làm linh thú`, go: (g) => {
            g.P.flags.pet = k;
            if (k === 'Băng Tinh Hồ') g.stat('tam', 5);
            if (k === 'Huyền Quy') g.P.lifeBonus += 0.03;
            if (k === 'Lôi Ưng Non') g.stat('co', 5);
            if (k === 'Song Đầu Xà' && g.r.chance(0.4)) { g.hurt(15, 'bị chính linh thú của mình cắn chết'); return 'Một cái đầu ngoan ngoãn, cái đầu kia cắn ngươi một phát rách tay. Dù sao nó cũng ở lại.'; }
            return `${k} trèo lên vai ngươi, cọ đầu vào má. Sức chiến đấu +10%.`;
          },
        },
        { t: 'Thả về rừng', go: (g) => { g.stat('co', 5); g.tinh(5); return `${k} chạy vào rừng, ngoảnh lại ba lần. Cơ duyên +5.`; } },
      ];
    },
  },

  // ===== Thương hội (chuỗi, đầu tư) =====
  {
    id: 'dau_tu', w: 3, cd: 15, acts: ['muu_sinh'], title: 'Thuyền ra Nam Hải', auto: () => 'Không tin',
    when: (g) => g.P.money >= 100 && g.P.age >= 16,
    text: () => 'Lý chưởng quỹ thương hội Tứ Hải mời góp vốn cho đoàn thuyền ra Nam Hải buôn ngọc trai. "Ba năm sau chia lời. Có chuyến lời gấp ba, có chuyến mất trắng, sóng gió đâu ai biết."',
    choices: (g) => {
      const third = Math.floor(g.P.money / 3);
      return [
        { t: `Góp một phần ba (${third})`, go: (g) => { g.money(-third); g.later(3, 'dau_tu_2', { amt: third, high: false }); return 'Lý chưởng quỹ ghi tên ngươi vào sổ, đóng dấu đỏ.'; } },
        { t: `Dốc hết túi (${g.P.money})`, go: (g) => { const a = g.P.money; g.money(-a); g.later(3, 'dau_tu_2', { amt: a, high: true }); return 'Ngươi dốc túi đến đồng cuối cùng. Lý chưởng quỹ cười híp mắt.'; } },
        { t: 'Không tin, từ chối', go: () => 'Ngươi giữ chặt túi tiền.' },
      ];
    },
  },
  {
    id: 'dau_tu_2', queued: true, title: 'Đoàn thuyền trở về', auto: () => 0,
    text: (g, { data }) => `Ba năm đã qua. Ngươi tới thương hội Tứ Hải hỏi về ${data.amt} linh thạch đã góp.`,
    choices: (g, { data }) => [
      {
        t: 'Mở sổ sách', go: (g) => {
          const roll = g.r.next();
          const [win, mid] = data.high ? [0.35, 0.65] : [0.6, 0.9];
          if (roll < win) { const m = Math.round(data.amt * (data.high ? 3 : 1.6)); g.money(m); return `Thuyền về đầy ngọc trai. Ngươi nhận ${m} linh thạch.`; }
          if (roll < mid) { const m = Math.round(data.amt * (data.high ? 1.2 : 1)); g.money(m); return `Chuyến buôn không lời không lỗ. Nhận lại ${m} linh thạch.`; }
          if (g.r.chance(0.4)) { g.next('lua_dao', { amt: data.amt }); return 'Lý chưởng quỹ đã cuốn gói bỏ trốn từ tháng trước. Người ta thấy hắn ở trấn Hắc Thủy.'; }
          return 'Thuyền đắm ngoài khơi. Mất trắng.';
        },
      },
    ],
  },
  {
    id: 'lua_dao', queued: true, title: 'Truy đuổi kẻ lừa đảo',
    text: (g, { data }) => `Ngươi tìm thấy Lý chưởng quỹ trong một tửu lâu ở trấn Hắc Thủy, quanh hắn là mấy tên bảo tiêu. Hắn cầm ${data.amt} linh thạch của ngươi.`,
    choices: (g, { data }) => {
      const po = g.winOdds(() => g.genericFighter('bảo tiêu thương hội', pw(g) * 0.9));
      return [
        {
          t: 'Ra tay đòi lại', p: po, go: (g) => {
            const f = g.fight('bảo tiêu thương hội', pw(g) * 0.9, 1, { lethal: 0.1 });
            if (f.win) { g.money(Math.round(data.amt * 1.2)); g.fame(2); return `${f.text}\n\nNgươi đòi lại cả vốn lẫn lãi.`; }
            return f.text;
          },
        },
        { t: 'Báo quan', p: 0.4, go: (g) => { if (g.r.chance(0.4)) { g.money(Math.round(data.amt * 0.6)); return 'Quan phủ bắt được hắn, trả lại cho ngươi sáu phần.'; } return 'Quan phủ nhận tiền của hắn, đuổi ngươi ra cửa.'; } },
        { t: 'Bỏ qua, coi như học phí', go: (g) => { g.stat('tam', 4); return 'Ngươi gọi một bình rượu, uống một mình. Tâm tính +4.'; } },
      ];
    },
  },

  // ===== Sòng bạc =====
  {
    id: 'song_bac', w: 3, cd: 6, acts: ['muu_sinh'], title: 'Sòng Kim Ngân', auto: () => 'Đứng xem',
    when: (g) => g.P.age >= 16 && g.P.money >= 30,
    text: () => 'Sòng Kim Ngân ngoài trấn sáng đèn suốt đêm. Tiếng xúc xắc lách cách, tiếng người thắng hò hét, người thua chửi thề.',
    choices: (g) => {
      const p = xp(0.47 + (st(g, 'co') - 50) / 400);
      const small = Math.max(5, Math.floor(g.P.money * 0.1)), big = Math.floor(g.P.money / 2);
      const bet = (amt) => (g) => {
        if (g.r.chance(p)) {
          g.money(amt);
          g.P.cnt.gamble = (g.P.cnt.gamble || 0) + 1;
          if (g.P.cnt.gamble >= 3 && !g.P.flags.casinoMark) { g.P.flags.casinoMark = true; g.later(1, 'song_bac_2', {}); }
          return `Thắng! Linh thạch +${amt}.`;
        }
        g.money(-amt);
        return `Thua. Linh thạch -${amt}.`;
      };
      const pc = 0.85;
      return [
        { t: `Đặt nhỏ ${small}`, p, go: bet(small) },
        { t: `Đặt lớn ${big}`, p, go: bet(big) },
        {
          t: 'Dùng thần thức nhìn thấu xúc xắc', if: g.P.dao && st(g, 'ngo') >= 50, p: pc, go: (g) => {
            if (g.r.chance(0.35)) { g.next('song_bac_2', { caught: true }); return 'Chủ sòng là tu sĩ. Hắn cảm nhận được thần thức của ngươi, gõ bàn ba tiếng.'; }
            g.money(big); return `Ván nào ngươi cũng đoán trúng. Linh thạch +${big}.`;
          },
        },
        { t: 'Đứng xem', go: (g) => { g.stat('ngo', 1); return 'Ngươi nhận ra người chia bài có ngón tay áo giấu xúc xắc. Ngộ tính +1.'; } },
      ];
    },
  },
  {
    id: 'song_bac_2', queued: true, title: 'Chủ sòng mời nói chuyện',
    text: (g, { data }) => (data.caught ? 'Mấy tên bảo kê vây quanh bàn. Chủ sòng Kim Ngân cười nhạt: "Dùng thần thức trong sòng của ta? Để lại cánh tay, hoặc để lại tiền."' : 'Ngươi thắng nhiều quá. Mấy tên bảo kê sòng Kim Ngân chặn ngươi ở đầu ngõ: "Chủ nhân mời đạo hữu về nói chuyện."'),
    choices: (g) => {
      const po = g.winOdds(() => g.genericFighter('chủ sòng Kim Ngân', pw(g) * 1.1));
      const fine = Math.floor(g.P.money / 2);
      return [
        { t: `Nộp ${fine} linh thạch cho yên chuyện`, go: (g) => { g.money(-fine); return 'Chủ sòng đếm tiền, phẩy tay: "Lần sau đừng tới nữa."'; } },
        {
          t: 'Đánh ra ngoài', p: po, go: (g) => {
            const f = g.fight('chủ sòng Kim Ngân', pw(g) * 1.1, 1, { lethal: 0.2 });
            if (f.win) { const m = g.r.int(50, 120) * (1 + g.P.realm); g.money(m); g.fame(3); return `${f.text}\n\nNgươi đập tan sòng bạc, khoắng luôn két tiền. Linh thạch +${m}.`; }
            return f.text;
          },
        },
        { t: 'Chạy trốn', p: xp(0.5 + (st(g, 'co') - 50) / 150 + g.tadd('flee')), go: (g) => { if (g.r.chance(xp(0.5 + (st(g, 'co') - 50) / 150 + g.tadd('flee')))) return 'Ngươi nhảy qua mái nhà, biến vào bóng đêm.'; g.hurt(20, 'bị bảo kê sòng bạc đánh chết'); return 'Bọn bảo kê đuổi kịp, đánh ngươi một trận nhừ tử.'; } },
      ];
    },
  },

  // ===== Cổ mộ: càng vào sâu càng nhiều báu, càng nguy =====
  ...['co_mo', 'co_mo_sau'].map((id) => ({
    id, queued: id === 'co_mo_sau', w: 2, cd: 20, acts: ['lich_luyen'], title: id === 'co_mo' ? 'Cổ mộ dưới rừng tùng' : 'Sâu hơn trong cổ mộ',
    when: (g) => g.P.dao && g.P.realm >= 1,
    prep: () => ({ room: 1, loot: 0 }),
    auto: (g, { data }) => (xp(0.85 - data.room * 0.15 + (st(g, 'co') - 50) / 200) >= 0.65 ? 0 : 'Rút lui'),
    text: (g, { data }) => [
      '',
      'Rễ tùng già xé toạc mặt đất, để lộ cửa một ngôi mộ cổ. Trên bia đá chỉ còn đọc được hai chữ "Chân Nhân".',
      'Gian thứ hai đầy bình gốm và giáp trụ mục. Gió lạnh từ đâu thổi tới, đuốc chập chờn.',
      'Gian cuối cùng. Giữa phòng là quan tài bằng ngọc, nắp hé mở. Có tiếng thở rất khẽ.',
    ][Math.min(3, data.room)] + (data.loot ? `\n\nĐã thu được: tu vi tương đương ${data.loot} năm tu luyện.` : ''),
    choices: (g, { data }) => {
      const p = xp(0.85 - data.room * 0.15 + (st(g, 'co') - 50) / 200);
      const bank = (g) => { const t = data.loot ? yrs(g, data.loot) : 0; return t ? `Ngươi mang ra ngoài: tu vi +${t}.` : 'Ngươi ra về tay không.'; };
      return [
        {
          t: data.room >= 3 ? 'Mở nắp quan tài' : 'Tiến vào gian trong', p, go: (g) => {
            if (g.r.chance(p)) {
              const loot = data.loot + data.room * 3;
              if (data.room >= 3) { const t = yrs(g, loot); return `Trong quan tài chỉ có một bộ xương ôm chặt túi trữ vật. Ngươi khấn vái rồi nhận lấy.\nTu vi +${t}.\n${item(g, g.r.chance(0.4) ? 3 : 2)}`; }
              g.next('co_mo_sau', { room: data.room + 1, loot });
              return data.room === 1 ? 'Ngươi lách qua bẫy tên, tìm thấy mấy viên linh thạch vụn và một quyển sổ ghi chép tu luyện.' : 'Trong bình gốm có đan dược đã hóa thạch, vẫn còn linh khí.';
            }
            if (data.room >= 3) {
              const m = { n: 'Thi Vương giữ mộ', pow: pw(g, 1) * 0.9, beast: true, r: Math.min(TOP_REALM, g.P.realm + 1), seed: 77 };
              const f = g.fightMonster(m);
              if (f.win) { const t = yrs(g, data.loot + 12); return `Xác trong quan tài ngồi dậy.\n${f.text}\n\nTu vi +${t}.\n${item(g, 3)}`; }
              return `Xác trong quan tài ngồi dậy.\n${f.text}`;
            }
            g.hurt(18 * data.room, 'chết trong cổ mộ');
            return `Sàn đá sụp xuống. Ngươi bò ra được với một thân thương tích.\n${bank(g)}`;
          },
        },
        { t: 'Rút lui với những gì đã có', go: (g) => bank(g) },
      ];
    },
  })),

  // ===== Lôi đài: thắng tiếp để thưởng lớn hơn =====
  ...['loi_dai', 'loi_dai_n'].map((id) => ({
    id, queued: id === 'loi_dai_n', w: 2, cd: 12, title: 'Lôi đài Lạc Dương',
    when: (g) => g.P.dao && g.P.age >= 16,
    prep: (g) => ({ round: 1, foe: pickFoe(g) }),
    auto: (g, { data }) => {
      const b = data.foe ? g.soul(data.foe) : null;
      const po = b && b.alive ? g.winOdds(() => g.botFighter(b)) : 0.5;
      return po >= 0.65 ? 0 : 1;
    },
    text: (g, { data }) => {
      const b = data.foe ? g.soul(data.foe) : null;
      const head = data.round === 1 ? 'Thành Lạc Dương dựng lôi đài, thắng liền ba trận được thưởng lớn. Trên lôi đài đánh tới khi một bên ngã, hiếm khi chết người.' : `Trận thứ ${data.round}. Dân chúng hò reo tên ngươi.`;
      return `${head}\n\nĐối thủ: ${b ? g.nm(b) : 'một võ sư vô danh'}.${b ? '\n' + g.hintBot(b) : ''}`;
    },
    choices: (g, { data }) => {
      const b = data.foe ? g.soul(data.foe) : null;
      const po = b && b.alive ? g.winOdds(() => g.botFighter(b)) : g.winOdds(() => g.genericFighter('võ sư', pw(g)));
      const prize = (r) => 50 * (1 + g.P.realm) * r;
      return [
        {
          t: data.round === 1 ? 'Lên đài' : 'Đánh tiếp', p: po, go: (g) => {
            const f = b && b.alive ? g.fightBot(b, 1, { lethal: 0.05 }) : g.fight('võ sư', pw(g), 1, { lethal: 0.05 });
            if (!f.win) return `${f.text}\n\nNgươi bị đánh văng khỏi lôi đài.${data.round > 1 ? ` Vẫn nhận thưởng các trận trước: ${prize(data.round - 1)} linh thạch.` : ''}`;
            g.fame(data.round * 2);
            if (b) g.relAdd(b, b.pers === 'cuong' ? 10 : -5);
            if (data.round >= 3) { g.money(prize(5)); return `${f.text}\n\nBa trận toàn thắng! Phủ doãn trao thưởng ${prize(5)} linh thạch.\n${item(g, 2)}`; }
            g.next('loi_dai_n', { round: data.round + 1, foe: pickFoe(g, data.foe) });
            return `${f.text}\n\nThắng trận ${data.round}.`;
          },
        },
        {
          t: data.round === 1 ? 'Chỉ xem người khác đánh' : 'Xuống đài', go: (g) => {
            if (data.round === 1) { g.stat('ngo', 2); return 'Ngươi xem cả buổi, học được vài chiêu hay. Ngộ tính +2.'; }
            g.money(prize(data.round - 1)); return `Biết dừng đúng lúc. Ngươi nhận ${prize(data.round - 1)} linh thạch.`;
          },
        },
      ];
    },
  })),

  // ===== Hồ ly tinh =====
  {
    id: 'ho_ly', w: 2, cd: 25, title: 'Khách lạ đêm mưa', auto: () => 'Đóng cửa',
    when: (g) => g.P.age >= 16,
    text: (g) => `Đêm mưa, một ${g.P.g === 'nu' ? 'thư sinh' : 'thiếu nữ'} áo trắng gõ cửa xin trú nhờ. Trong mắt có ánh xanh lấp lánh, và dưới vạt áo thấp thoáng thứ gì đó như đuôi lông trắng.`,
    choices: (g) => {
      const m = { n: 'Bạch Hồ Tinh', pow: pw(g) * g.r.range(0.8, 1.1), beast: true, r: g.P.realm, seed: 4242 };
      const po = g.winOdds(() => g.monsterFighter(m));
      return [
        {
          t: 'Mời vào, rót trà nóng', go: (g) => {
            const x = g.r.next();
            if (x < 0.4) { g.stat('co', 8); return 'Sáng ra người ấy đã đi, để lại trên bàn một chiếc lông trắng tỏa hương. Cơ duyên +8.'; }
            if (x < 0.75) { g.P.tuvi = Math.floor(g.P.tuvi * 0.8); g.hurt(20, 'bị hồ ly hút cạn dương khí'); return 'Ngươi ngủ một giấc dài kỳ lạ. Tỉnh dậy người rã rời, tu vi tụt mất hai phần.'; }
            g.stat('tam', 6); g.tinh(6); return 'Hai người trò chuyện tới sáng về những ngọn núi, những dòng sông. Người ấy chỉ muốn có người nghe chuyện. Tâm tính +6.';
          },
        },
        {
          t: 'Rút kiếm vạch trần', p: po, go: (g) => {
            const f = g.fightMonster(m);
            if (f.win) { const t = yrs(g, 6); return `${f.text}\n\nBạch Hồ Tinh hiện nguyên hình rồi tan biến, để lại một viên yêu đan. Tu vi +${t}.`; }
            return f.text;
          },
        },
        { t: 'Đóng cửa', go: (g) => { g.stat('tam', 2); return 'Tiếng gõ cửa dừng lại. Sáng ra trước hiên có dấu chân cáo.'; } },
      ];
    },
  },

  // ===== Đứa trẻ bị bán (chuỗi báo ân / báo oán) =====
  {
    id: 'cho_no_le', w: 2, cd: 20, title: 'Chợ người ở trấn biên',
    when: (g) => g.P.age >= 16 && g.P.money >= 40,
    bot: (g) => g.findBot((b, r) => b.age >= 7 && b.age <= 15 && !(r && r.met), 1),
    text: (g, { bot: b }) => `Ở chợ người trấn biên, một đứa trẻ tên ${b.name} bị xích cổ, quần áo rách bươm, nhưng ánh mắt vẫn bướng bỉnh nhìn thẳng vào ngươi.`,
    choices: (g, { bot: b }) => {
      const cost = Math.round(40 * (1 + g.P.realm * 0.5));
      const po = g.winOdds(() => g.genericFighter('bọn buôn người', pw(g) * 0.8));
      return [
        { t: `Bỏ ${cost} linh thạch chuộc nó`, if: g.P.money >= cost, go: (g) => { g.money(-cost); g.relAdd(b, 45); g.tinh(5); g.later(g.r.int(8, 20), 'bao_an', {}, b.id); return `Ngươi tháo xích cho ${b.name}. Nó không nói lời cảm ơn, chỉ cúi đầu thật sâu rồi chạy đi.`; } },
        {
          t: 'Đánh bọn buôn người', p: po, go: (g) => {
            const f = g.fight('bọn buôn người', pw(g) * 0.8, 1, { lethal: 0.2 });
            if (f.win) { g.relAdd(b, 55); g.fame(3); g.tinh(8); g.later(g.r.int(8, 20), 'bao_an', {}, b.id); return `${f.text}\n\nNgươi thả hết những người bị xích. ${b.name} nhìn theo ngươi rất lâu.`; }
            return f.text;
          },
        },
        { t: `Mua về làm nô bộc (${cost})`, if: g.P.money >= cost, go: (g) => { g.money(-cost); g.relAdd(b, -35); g.tinh(-8); g.later(g.r.int(8, 20), 'bao_oan', {}, b.id); return `${b.name} theo ngươi ba năm, rồi một đêm trốn mất, mang theo cả mối hận.`; } },
        { t: 'Quay đi', go: (g) => { g.tinh(-3); return 'Ngươi bước nhanh qua. Ánh mắt đứa trẻ bám theo sau lưng.'; } },
      ];
    },
  },
  {
    id: 'bao_an', queued: true, title: 'Người xưa trở lại',
    text: (g, { bot: b }) => `Một ${b.realm >= 2 ? 'tu sĩ' : 'người'} tìm tới tận nơi, quỳ xuống trước mặt ngươi: ${g.nm(b)}. "Năm xưa ở chợ người, nếu không có ân nhân, ta đã chết rồi."`,
    choices: (g, { bot: b }) => [
      { t: 'Nhận quà báo đáp', go: (g) => { g.relAdd(b, 10); const m = 40 * (1 + b.realm); g.money(m); return `${b.name} dâng lên ${m} linh thạch và một món đồ quý.\n${item(g, Math.min(3, 1 + Math.floor(b.realm / 2)), null, Math.max(g.P.realm, b.realm))}`; } },
      { t: 'Không cần báo đáp, kết làm bằng hữu', go: (g) => { g.relAdd(b, 25); g.tinh(5); return `${b.name} ngẩn người, rồi cười: "Vậy từ nay ân nhân có việc gì, cứ gọi một tiếng."`; } },
    ],
  },
  {
    id: 'bao_oan', queued: true, title: 'Món nợ năm xưa',
    text: (g, { bot: b }) => `${g.nm(b)} chặn đường ngươi, trên cổ vẫn còn vết sẹo của chiếc xích năm nào. "Ngươi còn nhớ ta không?"\n\n${g.hintBot(b)}`,
    choices: (g, { bot: b }) => {
      const po = g.winOdds(() => g.botFighter(b));
      const pSorry = b.pers === 'hien' || b.pers === 'nghia' ? 0.7 : 0.3;
      return [
        { t: 'Quỳ xuống xin lỗi', p: pSorry, go: (g) => { if (g.r.chance(pSorry)) { g.relSet(b, 0, null); g.tinh(5); return `${b.name} nhìn ngươi rất lâu rồi quay đi: "Coi như xong."`; } g.relSet(b, -70, 'thu'); return `${b.name} cười lạnh: "Xin lỗi thì chiếc xích có tự tháo ra không?" Từ nay là kẻ thù.`; } },
        { t: 'Ra tay trước', p: po, go: (g) => { const f = g.fightBot(b); g.relSet(b, -80, 'thu'); return f.text; } },
      ];
    },
  },

  // ===== Huyết trận ở làng (chuỗi ma tu trả thù) =====
  {
    id: 'huyet_tran', w: 2, cd: 70, title: 'Làng ngủ say',
    when: (g) => g.P.dao && g.P.realm >= 1 && g.P.age >= 16,
    text: () => 'Cả làng Thạch Khê ngủ li bì không dậy, ngay cả chó cũng nằm im. Giữa đình làng là một trận pháp vẽ bằng máu, đang hút dần sinh khí của mọi người.',
    choices: (g) => {
      const p = xp(0.5 + (st(g, 'ngo') - 50) / 150);
      return [
        { t: 'Phá trận', p, go: (g) => { if (g.r.chance(p)) { g.tinh(8); g.fame(5); g.later(g.r.int(2, 5), 'ma_tu_tra_thu', {}); return 'Trận pháp vỡ vụn. Dân làng lần lượt tỉnh dậy. Xa xa, một tiếng gầm giận dữ vang lên rồi im bặt.'; } g.hurt(25, 'bị huyết trận phản phệ'); g.tinh(-2); return 'Trận pháp phản phệ, máu tươi trào ra khóe miệng ngươi. Ba người già không qua khỏi.'; } },
        { t: 'Báo cho tông môn', if: !!g.P.sect, go: (g) => { const m = 60 * (1 + g.P.realm); g.money(m); g.fame(2); return `Trưởng lão tông môn dẫn người tới phá trận, thưởng cho ngươi ${m} linh thạch.`; } },
        { t: 'Học lén trận pháp', go: (g) => { g.tinh(-12); const t = yrs(g, 8); return `Ngươi chép lại từng nét trận văn, cảm nhận sinh khí tuôn chảy. Tu vi +${t}. Làng Thạch Khê không ai tỉnh lại nữa.`; } },
        { t: 'Bỏ đi', go: (g) => { g.tinh(-6); return 'Chuyện thiên hạ, ngươi không quản nổi.'; } },
      ];
    },
  },
  {
    id: 'ma_tu_tra_thu', queued: true, title: 'Ma tu tìm tới',
    text: (g) => `Một gã áo đỏ đứng chắn đường, quanh người toàn mùi máu: "Ngươi phá trận của ta. Ba năm tâm huyết. Hôm nay lấy mạng ngươi bù vào."\n\n${g.oddsText(g.winOdds(() => g.genericFighter('Huyết Sát ma tu', pw(g) * 1.15)), 0.4, 1.15)}`,
    choices: (g) => {
      const po = g.winOdds(() => g.genericFighter('Huyết Sát ma tu', pw(g) * 1.15));
      const pf = xp(0.45 + (st(g, 'co') - 50) / 150 + g.tadd('flee'));
      return [
        { t: 'Nghênh chiến', p: po, go: (g) => { const f = g.fight('Huyết Sát ma tu', pw(g) * 1.15, 1, { lethal: 0.4, cause: 'bị ma tu báo thù, giết chết' }); if (f.win) { g.fame(5); const t = yrs(g, 6); return `${f.text}\n\nMa tu gục xuống. Tu vi +${t}.\n${item(g, 2)}`; } return f.text; } },
        { t: 'Chạy về tông môn cầu cứu', if: !!g.P.sect, p: 0.8, go: (g) => { if (g.r.chance(0.8)) return 'Ngươi chạy thục mạng về sơn môn. Ma tu không dám đuổi theo vào trận hộ sơn.'; g.hurt(35, 'bị ma tu đuổi kịp giết chết'); return 'Ma tu nhanh hơn ngươi tưởng.'; } },
        { t: 'Bỏ chạy', p: pf, go: (g) => { if (g.r.chance(pf)) return 'Ngươi thoát được, nhưng biết hắn sẽ còn quay lại.'; g.hurt(35, 'bị ma tu đuổi kịp giết chết'); return 'Một luồng huyết quang đuổi theo, đánh trúng lưng ngươi.'; } },
      ];
    },
  },

  // ===== Thiên kiếp của người khác =====
  {
    id: 'kiep_nguoi', w: 2, cd: 20, title: 'Lôi kiếp trên đỉnh núi', auto: () => 'Quan sát',
    when: (g) => g.P.dao && g.P.realm >= 1,
    bot: (g) => g.findBot((b) => b.dao && b.realm >= g.P.realm && b.realm >= 2 && b.realm < TOP_REALM),
    text: (g, { bot: b }) => `Mây sấm cuồn cuộn kéo tới đỉnh núi gần đó. ${g.nm(b)} đang độ kiếp, áo đã cháy sém, khí tức chập chờn.`,
    choices: (g, { bot: b }) => {
      const ph = xp(0.55 + (st(g, 'can') - 50) / 200 + (g.P.realm - b.realm) * 0.1);
      const pa = g.winOdds(() => g.botFighter(b), 1.6);
      return [
        { t: 'Lên đỡ một đạo sét giúp người đó', p: ph, go: (g) => { if (g.r.chance(ph)) { g.relAdd(b, 30); g.stat('ngo', 3); b.realm++; b.tuvi = 0; return `${b.name} vượt kiếp thành công, bước vào ${REALMS[b.realm].n}. Người ấy nợ ngươi một ân tình lớn. Ngộ tính +3.`; } g.relAdd(b, 15); g.hurt(25, 'bị lôi kiếp của người khác đánh chết'); return 'Đạo sét giáng thẳng vào người ngươi. Nhưng nhờ thế mà người kia trụ được.'; } },
        { t: 'Quan sát lôi kiếp để ngộ đạo', go: (g) => { g.stat('ngo', 3); const t = yrs(g, 2); return `Từng đạo sét như những nét chữ trời viết. Ngộ tính +3, tu vi +${t}.`; } },
        {
          t: 'Chờ người đó kiệt sức rồi ra tay cướp bảo vật', p: pa, go: (g) => {
            g.tinh(-15);
            const f = g.fightBot(b, 1.6);
            g.relSet(b, -80, 'thu');
            if (f.win) { if (g.r.chance(0.6)) g.botDie(b, `bị ${g.P.name} đánh lén lúc độ kiếp`); const t = yrs(g, 10); return `${f.text}\n\nTu vi +${t}.\n${item(g, 2, null, b.realm)}`; }
            return f.text;
          },
        },
      ];
    },
  },

  // ===== Bị vu oan trong tông môn =====
  {
    id: 'vu_oan', w: 2, cd: 30, title: 'Bảo khố mất đan',
    when: (g) => !!g.P.sect && g.P.age >= 14,
    bot: (g) => g.findBot((b) => b.sect === g.P.sect && b.dao, 1),
    text: (g, { bot: b }) => `Bảo khố tông môn mất một lọ Trúc Cơ Đan. Trước mặt chưởng môn, ${g.nm(b)} đứng ra chỉ thẳng vào ngươi: "Đêm qua chỉ có hắn đi ngang bảo khố."`,
    choices: (g, { bot: b }) => {
      const pd = xp(0.4 + (st(g, 'ngo') - 50) / 150 + g.P.fame / 400);
      const po = g.winOdds(() => g.botFighter(b));
      return [
        { t: 'Bình tĩnh tìm chứng cứ', p: pd, go: (g) => { if (g.r.chance(pd)) { g.relAdd(b, -25); g.fame(4); return `Ngươi chỉ ra vết sáp nến trên tay áo ${b.name}. Kẻ vu oan bị phạt quét núi ba năm.`; } g.money(-Math.floor(g.P.money / 2)); g.fame(-5); return 'Không ai tin ngươi. Ngươi bị phạt nửa gia sản, mang tiếng trộm cắp.'; } },
        { t: 'Thách đấu trước mặt mọi người', p: po, go: (g) => { const f = g.fightBot(b, 1, { lethal: 0.05 }); if (f.win) { g.fame(4); g.relAdd(b, -20); return `${f.text}\n\nKẻ thua không còn mặt mũi nào buộc tội ngươi nữa.`; } if (g.r.chance(0.5)) { g.P.sect = null; return `${f.text}\n\nThua trận, lại mang tội. Ngươi bị trục xuất khỏi tông môn.`; } return `${f.text}\n\nNgươi bị phạt diện bích một năm.`; } },
        { t: 'Bỏ trốn khỏi tông môn', go: (g) => { g.P.sect = null; g.fame(-3); return 'Đêm đó ngươi rời núi. Tội danh vẫn treo trên đầu.'; } },
      ];
    },
  },

  // ===== Linh mạch (chuỗi) =====
  {
    id: 'linh_mach', w: 2, cd: 25, acts: ['lich_luyen'], title: 'Mạch linh thạch lộ thiên', auto: () => 'Chia',
    when: (g) => g.P.dao,
    text: () => 'Sau trận lở đất, chân núi Lạc Phượng lộ ra một mạch linh thạch lấp lánh. Chưa ai phát hiện ra.',
    choices: (g) => [
      { t: 'Khai thác một mình, giấu kín', p: 0.6, go: (g) => { const m = 80 * (1 + g.P.realm); g.money(m); if (g.r.chance(0.4)) g.later(1, 'linh_mach_2', {}); return `Ngươi đào suốt ba tháng. Linh thạch +${m}.`; } },
      { t: 'Báo cho tông môn', if: !!g.P.sect, go: (g) => { g.fame(3); g.money(30 * (1 + g.P.realm)); return 'Tông môn cử người tới khai thác, ghi công cho ngươi.'; } },
      { t: 'Chia cho tán tu quanh vùng', go: (g) => { g.tinh(8); g.fame(3); g.money(20 * (1 + g.P.realm)); return 'Ngươi báo cho các tán tu nghèo quanh vùng. Mỗi người một ít, ai cũng nhớ ơn.'; } },
    ],
  },
  {
    id: 'linh_mach_2', queued: true, title: 'Tin đồn về linh mạch',
    text: () => 'Một nhóm tu sĩ tìm tới động phủ của ngươi: "Nghe nói đạo hữu đào được mỏ linh thạch. Chia cho anh em một nửa, kẻo người ngoài biết thì phiền."',
    choices: (g) => {
      const po = g.winOdds(() => g.genericFighter('nhóm tu sĩ tham lam', pw(g) * 1.2));
      return [
        { t: 'Chia một nửa', go: (g) => { g.money(-Math.floor(g.P.money / 2)); return 'Bọn họ cầm tiền đi, còn vỗ vai ngươi: "Đạo hữu biết điều."'; } },
        { t: 'Đuổi đi', p: po, go: (g) => { const f = g.fight('nhóm tu sĩ tham lam', pw(g) * 1.2, 1, { lethal: 0.25 }); if (f.win) g.fame(3); else g.money(-Math.floor(g.P.money * 0.7)); return f.text; } },
      ];
    },
  },

  // ===== Lão ăn mày =====
  {
    id: 'an_may', w: 3, cd: 15, title: 'Lão ăn mày trước cổng trấn', auto: () => 'Cho một bữa',
    when: (g) => g.P.age >= 8,
    text: () => 'Một lão ăn mày lở loét ngồi trước cổng trấn, chìa cái bát mẻ. Ai đi qua cũng bịt mũi.',
    choices: (g) => [
      { t: 'Cho một bữa no', go: (g) => { g.money(-5); if (g.r.chance(0.15)) { g.stat('ngo', 3); return `Lão ăn xong, chùi miệng, búng tay một cái vào trán ngươi rồi biến mất. ${g.learnRandom(1, 2) || 'Ngộ tính +3.'}`; } g.tinh(2); return 'Lão ăn ngấu nghiến, không nói lời nào.'; } },
      { t: 'Cho hết tiền trong túi', if: g.P.money > 0, go: (g) => { g.money(-g.P.money); g.tinh(6); if (g.r.chance(0.35)) { g.stat('ngo', 4); return `Lão nhìn ngươi hồi lâu: "Còn có kẻ ngốc như ngươi sao." Rồi lão truyền cho ngươi một bài khẩu quyết. ${g.learnRandom(2, 3) || ''}`; } return 'Lão nhận tiền, cúi đầu. Ngươi đi tiếp, túi nhẹ tênh mà lòng cũng nhẹ.'; } },
      { t: 'Đuổi đi cho khuất mắt', go: (g) => { g.tinh(-3); if (g.r.chance(0.1)) { g.stat('co', -6); return 'Lão ngẩng lên nhìn ngươi, cười một tiếng rợn người. Mấy năm sau ngươi gặp toàn chuyện xui. Cơ duyên -6.'; } return 'Lão lẳng lặng đi chỗ khác.'; } },
    ],
  },

  // ===== Thư nhà =====
  {
    id: 'thu_nha', w: 4, once: true, title: 'Thư nhà',
    when: (g) => g.P.age >= 16 && g.P.age <= 60 && g.P.origin !== 'coi' && g.P.dao,
    text: () => 'Một lá thư nhà đến tay ngươi, nét chữ của cha run rẩy: "Mẹ con lâm bệnh nặng, ngày đêm gọi tên con."',
    choices: (g) => [
      { t: 'Gác việc tu hành, về nhà ngay', p: 0.7, go: (g) => { g.P.tuvi = Math.floor(g.P.tuvi * 0.9); if (g.r.chance(0.7)) { g.stat('tam', 8); return 'Ngươi về kịp. Ngươi truyền linh khí cho mẹ suốt bảy đêm. Bà qua khỏi. Tâm tính +8.'; } g.stat('tam', 4); g.tinh(6); return 'Ngươi về kịp nhìn mặt mẹ lần cuối. Bà nắm tay ngươi, mỉm cười rồi nhắm mắt.'; } },
      { t: 'Gửi linh thạch về', if: g.P.money >= 30, p: 0.45, go: (g) => { g.money(-Math.min(200, g.P.money)); if (g.r.chance(0.45)) return 'Có tiền mua thuốc, mẹ ngươi khỏi dần.'; g.tinh(-3); return 'Thư sau báo tin mẹ ngươi đã mất. Tiền gửi về dùng để làm ma chay.'; } },
      { t: 'Đạo tâm phải vững, không về', go: (g) => { g.tinh(-12); const t = yrs(g, 2); return `Ngươi đốt lá thư, ngồi xuống tiếp tục vận công. Tu vi +${t}. Có những đêm ngươi giật mình tỉnh giấc.`; } },
    ],
  },

  // ===== Sơn tặc bắt cóc =====
  {
    id: 'bat_coc', w: 3, cd: 12, title: 'Hắc Phong trại',
    when: (g) => g.P.age >= 14,
    text: () => 'Sơn tặc Hắc Phong trại bắt mười mấy dân làng lên núi, đòi chuộc mỗi người năm mươi lạng bạc. Bà con khóc lóc nhờ ngươi.',
    choices: (g) => {
      const ps = xp(0.45 + (st(g, 'co') - 50) / 150);
      const po = g.winOdds(() => g.genericFighter('trại chủ Hắc Phong', pw(g) * 1.3));
      return [
        { t: 'Đột nhập ban đêm', p: ps, go: (g) => { if (g.r.chance(ps)) { g.tinh(8); g.fame(4); g.money(30 * (1 + g.P.realm)); return 'Ngươi lẻn vào trại, mở cũi thả hết dân làng mà bọn cướp không hay biết.'; } const f = g.fight('trại chủ Hắc Phong', pw(g) * 1.3, 1, { lethal: 0.3 }); if (f.win) { g.tinh(8); g.fame(6); return `Bị phát hiện!\n${f.text}\n\nNgươi đánh bại trại chủ, giải cứu dân làng.`; } return `Bị phát hiện!\n${f.text}`; } },
        { t: 'Xông thẳng vào trại', p: po, go: (g) => { const f = g.fight('trại chủ Hắc Phong', pw(g) * 1.3, 1, { lethal: 0.3 }); if (f.win) { g.tinh(8); g.fame(8); const m = g.r.int(60, 140) * (1 + g.P.realm); g.money(m); return `${f.text}\n\nHắc Phong trại tan tác. Kho của bọn cướp: ${m} linh thạch.`; } return f.text; } },
        { t: 'Bỏ tiền chuộc giúp', if: g.P.money >= 100, go: (g) => { g.money(-Math.min(300, g.P.money)); g.tinh(5); return 'Dân làng được thả về. Bọn cướp hả hê, năm sau lại xuống núi.'; } },
        { t: 'Lắc đầu', go: (g) => { g.tinh(-5); return 'Ngươi không phải anh hùng.'; } },
      ];
    },
  },

  // ===== Tửu lâu =====
  {
    id: 'tuu_lau', w: 3, cd: 8, acts: ['ket_giao', 'muu_sinh'], title: 'Đấu rượu ở Túy Tiên Lâu', auto: () => 'Ngồi xem',
    when: (g) => g.P.age >= 16,
    text: () => 'Ở Túy Tiên Lâu, một đại hán râu quai nón vỗ bàn thách cả quán đấu rượu: "Ai uống thắng ta, ta trả năm mươi lạng. Thua thì trả ta gấp đôi!"',
    choices: (g) => {
      const p = xp(0.35 + (st(g, 'can') - 50) / 120);
      const stake = 50 * (1 + g.P.realm * 0.5);
      return [
        { t: 'Nhận lời, uống thật', p, go: (g) => { if (g.r.chance(p)) { g.money(stake); g.fame(1); return `Đại hán gục xuống bàn. Cả quán vỗ tay. Linh thạch +${stake}.`; } g.money(-stake * 2); g.hurt(5); return `Ngươi tỉnh dậy dưới gầm bàn, túi nhẹ đi ${stake * 2}.`; } },
        { t: 'Lén dùng linh lực ép rượu ra', if: g.P.dao, p: 0.85, go: (g) => { if (g.r.chance(0.3)) { const f = g.fight('đại hán say rượu', pw(g) * 0.7, 1, { lethal: 0.02 }); return `Đại hán thấy hơi rượu bốc ra từ đầu ngón tay ngươi, nổi giận.\n${f.text}`; } g.money(stake); return `Đại hán say mềm, còn ngươi tỉnh như sáo. Linh thạch +${stake}.`; } },
        { t: 'Ngồi xem', go: (g) => { g.stat('tam', 1); return 'Ngươi nhấp chén trà, xem người ta say.'; } },
      ];
    },
  },

  // ===== Kiếm trủng =====
  {
    id: 'kiem_trung', w: 1, cd: 40, acts: ['lich_luyen'], title: 'Kiếm trủng', auto: () => 'Rút đại',
    when: (g) => g.P.dao && g.P.realm >= 1,
    text: () => 'Hàng nghìn thanh kiếm cắm la liệt trên một ngọn đồi trọc. Gió thổi qua, kiếm ngân lên như tiếng khóc. Khi ngươi bước lại gần, một thanh kiếm phủ rêu bỗng rung lên bần bật.',
    choices: (g) => {
      const p = xp(0.35 + (st(g, 'can') - 50) / 150 + g.P.realm * 0.03);
      const sword = (q) => { const it = makeItem(g.r, g.s.nextItem++, g.P.realm, q, 'vu_khi'); it.wt = 'kiem'; it.n = it.n.replace(/\S+$/, 'Kiếm'); return g.gainItem(it, 'Rút được'); };
      return [
        { t: 'Rút thanh kiếm đang rung', p, go: (g) => { if (g.r.chance(p)) return `Thanh kiếm tuột ra dễ dàng, rêu rơi xuống để lộ lưỡi kiếm sáng như nước.\n${sword(g.r.chance(0.35) ? 3 : 2)}`; g.hurt(30, 'bị kiếm khí trong kiếm trủng xé nát'); return 'Kiếm khí bùng lên, chém vào người ngươi hàng chục vết.'; } },
        { t: 'Rút đại một thanh gần nhất', p: 0.9, go: (g) => (g.r.chance(0.9) ? sword(g.r.chance(0.3) ? 1 : 0) : 'Thanh kiếm gãy làm đôi trong tay ngươi.') },
        { t: 'Bái ba bái rồi đi', go: (g) => { g.stat('ngo', 4); const sk = g.r.chance(0.3) ? ' ' + g.learnRandom(1, 2) : ''; return `Ngươi đứng giữa rừng kiếm, nghe tiếng kiếm ngân suốt một đêm. Ngộ tính +4.${sk}`; } },
      ];
    },
  },

  // ===== Yêu vương =====
  {
    id: 'yeu_vuong', w: 2, cd: 30, title: 'Yêu vương xuất thế',
    when: (g) => g.P.dao && g.P.realm >= 1,
    prep: (g) => ({ m: { n: g.r.pick(['Xích Diễm Hổ Vương', 'Cửu Đầu Xà Vương', 'Thiết Dực Bằng Vương']), pow: pw(g, 1), beast: true, r: Math.min(TOP_REALM, g.P.realm + 1), seed: g.r.int(1, 1e6) } }),
    bot: (g) => g.findBot((b) => b.dao && Math.abs(b.realm - g.P.realm) <= 1),
    auto: (g, { data }) => (g.winOdds(() => g.monsterFighter(data.m, 0.6)) >= 0.65 ? 0 : 'Để'),
    text: (g, { bot: b, data }) => `${data.m.n} ở Vạn Thú Lĩnh xuất thế, tàn phá ba trấn. Các tông môn treo thưởng lớn. ${g.nm(b)} tìm tới: "Một mình thì chết chắc, hai người may ra."`,
    choices: (g, { bot: b, data }) => {
      const pTeam = g.winOdds(() => g.monsterFighter(data.m, 0.6));
      const pSolo = g.winOdds(() => g.monsterFighter(data.m));
      return [
        { t: `Lập đội cùng ${b.name}`, p: pTeam, go: (g) => { const f = g.fightMonster(data.m, 0.6); if (f.win) { g.relAdd(b, 20); g.fame(6); const m = 80 * (1 + g.P.realm); g.money(m); return `${b.name} cầm chân, ngươi ra đòn kết liễu.\n${f.text}\n\nTiền thưởng chia đôi: ${m} linh thạch.\n${item(g, 2)}`; } if (g.r.chance(0.4)) g.botDie(b, `chết dưới móng vuốt ${data.m.n}`); return f.text; } },
        { t: 'Đi một mình, không chia thưởng', p: pSolo, go: (g) => { const f = g.fightMonster(data.m); if (f.win) { g.fame(12); const m = 200 * (1 + g.P.realm); g.money(m); return `${f.text}\n\nMột mình hạ yêu vương! Tiền thưởng ${m} linh thạch.\n${item(g, 3)}`; } return f.text; } },
        { t: 'Để người khác lo', go: (g) => { g.relAdd(b, -5); return 'Ngươi đóng cửa động phủ. Nghe nói mấy tháng sau yêu vương mới bị trừ.'; } },
      ];
    },
  },

  // ===== Hoàng lương mộng =====
  {
    id: 'mong', w: 1, cd: 40, title: 'Giấc mộng nồi kê',
    when: (g) => g.P.age >= 20,
    text: () => 'Ngủ gật trong quán trọ lúc nồi kê còn chưa chín, ngươi mơ thấy cả một đời khác. Tỉnh dậy, hơi kê vẫn bốc lên nghi ngút. Trong mộng, ngươi đã sống một đời như thế nào?',
    choices: () => [
      { t: 'Làm quan to, vinh hoa phú quý', go: (g) => { g.stat('co', 5); g.stat('tam', -3); return 'Trong mộng ngươi làm tể tướng, rồi bị chém đầu. Tỉnh dậy vẫn còn sờ cổ. Cơ duyên +5, tâm tính -3.'; } },
      { t: 'Tu thành tiên, bay lên trời', go: (g) => { g.stat('ngo', 6); return 'Trong mộng ngươi phi thăng, đứng trên mây nhìn xuống, thấy chính mình đang ngủ gật trong quán trọ. Ngộ tính +6.'; } },
      { t: 'Lấy vợ sinh con, sống bình dị', go: (g) => { g.stat('tam', 8); g.tinh(5); return 'Trong mộng ngươi già đi bên bếp lửa, con cháu đầy nhà. Tỉnh dậy, ngươi khóc mà không biết vì sao. Tâm tính +8.'; } },
    ],
  },

  // ===== Ngọc giản của người chết (chuỗi) =====
  {
    id: 'ngoc_gian', w: 2, cd: 25, title: 'Ngọc giản dính máu',
    when: (g) => g.P.age >= 14 && g.P.dao,
    text: () => 'Một tu sĩ máu me đầy người lảo đảo tới, dúi vào tay ngươi một ngọc giản rồi tắt thở. Xa xa có tiếng người đuổi tới, rất gần.',
    choices: (g) => {
      const pf = xp(0.55 + (st(g, 'co') - 50) / 150 + g.tadd('flee'));
      const po = g.winOdds(() => g.genericFighter('kẻ truy sát', pw(g) * 1.1));
      return [
        { t: 'Giấu ngọc giản, chạy', p: pf, go: (g) => { if (g.r.chance(pf)) { g.later(2, 'ngoc_gian_mo', {}); return 'Ngươi chạy một mạch ba mươi dặm. Ngọc giản vẫn còn ấm trong ngực áo.'; } const f = g.fight('kẻ truy sát', pw(g) * 1.1, 1, { lethal: 0.35 }); if (f.win) g.later(1, 'ngoc_gian_mo', {}); return `Kẻ truy sát đuổi kịp.\n${f.text}`; } },
        { t: 'Ở lại chiến đấu', p: po, go: (g) => { const f = g.fight('kẻ truy sát', pw(g) * 1.1, 1, { lethal: 0.35 }); if (f.win) { g.later(1, 'ngoc_gian_mo', {}); return `${f.text}\n\nNgươi chôn cất người chết, giữ lại ngọc giản.`; } return f.text; } },
        { t: 'Giao ngọc giản cho kẻ truy sát', go: (g) => { g.tinh(-5); const m = 30 * (1 + g.P.realm); g.money(m); return `Kẻ truy sát ném cho ngươi ${m} linh thạch: "Biết điều đấy."`; } },
      ];
    },
  },
  {
    id: 'ngoc_gian_mo', queued: true, title: 'Mở ngọc giản',
    auto: (g) => (xp(0.5 + (st(g, 'ngo') - 50) / 120) >= 0.5 ? 0 : 1),
    text: () => 'Ngươi áp ngọc giản lên trán. Bên trong là một môn công pháp, nhưng thần thức người chết còn lưu lại một tầng phong ấn.',
    choices: (g) => {
      const p = xp(0.5 + (st(g, 'ngo') - 50) / 120);
      return [
        { t: 'Phá phong ấn tham ngộ', p, go: (g) => { if (g.r.chance(p)) { g.stat('ngo', 3); return `Phong ấn vỡ, công pháp tràn vào thức hải. ${g.learnRandom(2, 3) || 'Ngộ tính +3.'}`; } g.hurt(20, 'bị phong ấn trong ngọc giản phản phệ'); return 'Phong ấn phản phệ, đầu ngươi như bị búa giáng.'; } },
        { t: 'Bán ở chợ đen', go: (g) => { const m = 100 * (1 + g.P.realm); g.money(m); return `Chợ đen trả ${m} linh thạch, không hỏi câu nào.`; } },
      ];
    },
  },

  // ===== Vườn thuốc hoang =====
  {
    id: 'vuon_thuoc', w: 3, cd: 10, acts: ['lich_luyen', 'muu_sinh'], title: 'Vườn thuốc hoang', auto: () => 'Hái thảo dược thường',
    when: (g) => g.P.age >= 12,
    text: () => 'Ngươi lạc vào một vườn thuốc bỏ hoang trong thung lũng. Giữa vườn có một gốc Huyết Sâm đỏ như máu, nhưng đất quanh đó có vết trườn của thứ gì rất lớn.',
    choices: (g) => {
      const m = { n: 'Mãng Xà giữ vườn', pow: pw(g) * 0.95, beast: true, r: g.P.realm, seed: 919 };
      const pq = xp(0.45 + (st(g, 'co') - 50) / 150);
      return [
        { t: 'Lặng lẽ hái Huyết Sâm', p: pq, go: (g) => { if (g.r.chance(pq)) { g.stat('can', 4); g.P.pills.hoi_xuan = (g.P.pills.hoi_xuan || 0) + 2; return 'Ngươi nhổ Huyết Sâm, chạy ra khỏi thung lũng. Căn cốt +4, được 2 Hồi Xuân Đan.'; } const f = g.fightMonster(m); if (f.win) { g.stat('can', 5); return `Mãng xà lao ra!\n${f.text}\n\nHuyết Sâm về tay ngươi. Căn cốt +5.`; } return `Mãng xà lao ra!\n${f.text}`; } },
        { t: 'Hái thảo dược thường', go: (g) => { g.P.pills.hoi_xuan = (g.P.pills.hoi_xuan || 0) + 1; return 'Ngươi hái một gùi thảo dược, luyện được 1 Hồi Xuân Đan.'; } },
        { t: 'Rời đi', go: () => 'Thứ để lại vết trườn ấy, ngươi không muốn gặp.' },
      ];
    },
  },

  // ===== Luyện đan =====
  {
    id: 'luyen_dan', w: 3, cd: 8, acts: ['muu_sinh'], title: 'Lò đan cũ', auto: () => 'Lửa nhỏ',
    when: (g) => g.P.dao && g.P.age >= 16,
    text: () => 'Ngươi mua được một lò đan cũ và ít dược liệu. Lửa to thì đan tốt, nhưng lò cũ, không biết chịu được không.',
    choices: (g) => {
      const pm = xp(0.55 + (st(g, 'ngo') - 50) / 200), ph = xp(0.25 + (st(g, 'ngo') - 50) / 200);
      const add = (id, n = 1) => { g.P.pills[id] = (g.P.pills[id] || 0) + n; };
      return [
        { t: 'Lửa nhỏ, luyện Hồi Xuân Đan', p: 0.85, go: (g) => { if (g.r.chance(0.85)) { add('hoi_xuan', 2); return 'Được 2 viên Hồi Xuân Đan.'; } return 'Dược liệu cháy khét.'; } },
        { t: 'Lửa vừa, luyện Phá Cảnh Đan', p: pm, go: (g) => { if (g.r.chance(pm)) { add('pha_canh'); return 'Một viên Phá Cảnh Đan tím ngắt lăn ra khỏi lò.'; } g.money(-20); return 'Đan thành tro. Mất thêm 20 linh thạch dược liệu.'; } },
        { t: 'Lửa lớn, luyện Diên Thọ Đan', p: ph, go: (g) => { if (g.r.chance(ph)) { add('dien_tho'); return 'Mùi thơm tỏa khắp núi. Một viên Diên Thọ Đan vàng óng!'; } g.hurt(22, 'chết vì nổ lò đan'); return 'Lò đan nổ tung!'; } },
      ];
    },
  },

  // ===== Đứa trẻ móc túi =====
  {
    id: 'moc_tui', w: 2, cd: 10, title: 'Bàn tay trong túi áo', auto: () => 'Tha',
    when: (g) => g.P.age >= 14 && g.P.money >= 10,
    bot: (g) => g.findBot((b, r) => b.age >= 7 && b.age <= 14 && !(r && r.met), 1),
    text: (g, { bot: b }) => `Ngươi tóm được một bàn tay nhỏ đang móc túi áo mình. Là một đứa trẻ gầy nhom tên ${b.name}, mắt láo liên.`,
    choices: (g, { bot: b }) => [
      { t: 'Tha cho nó, cho thêm mấy đồng', go: (g) => { g.money(-5); g.relAdd(b, 30); g.tinh(4); return `${b.name} ngẩn ra, rồi chạy mất. Từ đó nó hay lảng vảng quanh chỗ ngươi ở.`; } },
      { t: 'Đánh cho một trận nhớ đời', go: (g) => { g.relAdd(b, -30); g.tinh(-3); return `${b.name} ôm đầu khóc, nhưng mắt nó nhìn ngươi đầy hận thù.`; } },
      { t: 'Dạy nó vài đường quyền', if: g.P.dao, go: (g) => { g.relAdd(b, 35); b.dao = true; return `${b.name} học rất nhanh. Biết đâu sau này nó thành người.`; } },
    ],
  },
];
