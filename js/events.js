// Kỳ ngộ. Mỗi sự kiện:
//  id, title, w (trọng số hoặc hàm), cd (năm hồi), once, acts (việc làm tăng x3 trọng số),
//  inClosed (xảy ra cả khi bế quan), queued (chỉ vào qua hàng đợi),
//  when(g), bot(g) chọn bot liên quan, prep(g, bot) chuẩn bị dữ liệu,
//  text(g, ctx), choices(g, ctx) -> [{ t, if, go(g, ctx) -> chuỗi kết quả }]
import { REALMS, TOP_REALM, TAG_NAMES, PATHS, MAPS } from './data.js';
import { makeItem } from './items.js';
import { EVENTS2 } from './events2.js';
import { EVENTS3 } from './events3.js';

const RN = (r) => REALMS[r].n;
// gần cảnh giới; nếu cùng lịch luyện một vùng thì nới thêm một bậc
const near = (g, b, d = 1) => { const mp = g.curMap(); return Math.abs(b.realm - g.P.realm) <= d + (mp && b.map === mp.id ? 1 : 0); };
const relOf = (g, b) => g.s.rel[b.id];
const metOf = (g, b) => !!(relOf(g, b) && relOf(g, b).met);
const pastLabel = (p) => (p.tag ? TAG_NAMES[p.tag].toLowerCase() : p.v >= 40 ? 'tri kỷ' : p.v > 0 ? 'bằng hữu' : 'kẻ thù');

const BASE_EVENTS = [
  // ===== Đột phá (vào qua hàng đợi hoặc nút Đột phá) =====
  {
    id: 'dot_pha', queued: true, title: 'Bình cảnh',
    text: (g) => {
      const P = g.P;
      const top = P.realm === TOP_REALM;
      let t = `Tu vi ${RN(P.realm)} đã viên mãn. Linh khí trong đan điền cuộn trào, chỉ chờ một bước để phá vỡ bình cảnh.\n\nTỉ lệ thành công ước chừng ${Math.round(g.breakChance() * 100)}%.`;
      const h = g.breakHelpers();
      if (h.length) t += `\nCó ${h.length} người thân thiết đủ sức hộ pháp cho ngươi (+${h.length * 4}%).`;
      if (top) t += '\n\nĐây là bước cuối cùng: phi thăng, hoặc tan thành tro bụi.';
      else if (P.realm >= 3) t += '\nTừ Kim Đan trở lên, đột phá thất bại có thể mất mạng.';
      return t;
    },
    choices: (g) => [
      { t: 'Đột phá ngay', go: (g) => g.attemptBreak(0) },
      {
        t: `Uống Phá Cảnh Đan rồi đột phá (+10%, còn ${g.P.pills.pha_canh || 0})`, if: (g.P.pills.pha_canh || 0) > 0,
        go: (g) => { g.P.pills.pha_canh--; return g.attemptBreak(0.1); },
      },
      { t: 'Chưa vội, củng cố thêm', go: () => 'Ngươi tạm đè linh khí xuống. Khi nào sẵn sàng thì bấm nút Đột phá.' },
    ],
  },

  // ===== Tuổi thơ =====
  {
    id: 'lac_rung', auto: () => 0, once: true, w: 40, title: 'Đom đóm xanh',
    when: (g) => g.P.age >= 3 && g.P.age <= 6,
    text: () => 'Ngươi đuổi theo một con đom đóm xanh vào khu rừng sau làng. Khi ngoảnh lại, con đường về đã biến mất.',
    choices: (g) => [
      { t: 'Ngồi yên chờ người lớn đi tìm', go: (g) => { g.stat('tam', 4); return 'Trời tối hẳn thì có tiếng gọi tên ngươi. Ngươi không khóc, chỉ ngồi đó. Tâm tính +4.'; } },
      {
        t: 'Theo con đom đóm đi tiếp', go: (g) => {
          if (g.r.chance(0.5)) { g.stat('can', 5); g.stat('co', 3); return 'Con đom đóm dẫn ngươi tới một con suối nước ấm. Ngươi tắm ở đó rồi ngủ thiếp đi, sáng ra người khỏe hẳn. Căn cốt +5, cơ duyên +3.'; }
          g.hurt(10); g.stat('can', 2); return 'Ngươi vấp rễ cây ngã lăn xuống dốc, trầy xước khắp người, nhưng tự lần được đường về. Căn cốt +2.';
        },
      },
      { t: 'Trèo lên cây cao nhìn quanh', go: (g) => { g.stat('ngo', 4); return 'Từ ngọn cây ngươi nhìn thấy khói bếp nhà mình, và nhớ mãi cách tìm đường bằng sao. Ngộ tính +4.'; } },
    ],
  },
  {
    id: 'sot_cao', auto: () => 0, once: true, w: 4, title: 'Cơn sốt bảy ngày',
    when: (g) => g.P.age >= 2 && g.P.age <= 9,
    text: () => 'Ngươi lên cơn sốt bảy ngày bảy đêm, người nóng như hòn than. Thầy lang trong làng lắc đầu.',
    choices: (g) => [
      {
        t: g.P.origin === 'coi' ? 'Bà lão hàng xóm thức trắng đêm chăm sóc' : 'Mẹ thức trắng đêm chăm sóc', go: (g) => {
          if (g.r.chance(0.6)) { g.stat('tam', 5); return 'Sáng ngày thứ tám ngươi hạ sốt. Ngươi nhớ mãi bàn tay mát lạnh trên trán mình. Tâm tính +5.'; }
          g.stat('can', -4); return 'Ngươi qua khỏi nhưng người yếu hẳn đi. Căn cốt -4.';
        },
      },
      {
        t: 'Một đạo sĩ đi ngang cho uống bùa', go: (g) => {
          if (g.r.chance(0.5)) { g.stat('can', 8); g.stat('co', 3); return 'Tro bùa đắng ngắt, nhưng sau đó ngươi thấy trong người có luồng khí lạ. Căn cốt +8, cơ duyên +3.'; }
          g.hurt(20); g.stat('can', -6); return 'Bùa là bùa giả. Ngươi nôn thốc nôn tháo, bệnh càng nặng thêm. Căn cốt -6.';
        },
      },
      { t: 'Cắn răng tự chịu đựng', go: (g) => { g.stat('tam', 8); g.stat('can', -3); return 'Ngươi không rên một tiếng. Người lớn bảo đứa bé này lì lắm. Tâm tính +8, căn cốt -3.'; } },
    ],
  },
  {
    id: 'ban_thuo_nho', auto: () => 0, once: true, w: 5, title: 'Đứa trẻ nhà bên',
    when: (g) => g.P.age >= 4 && g.P.age <= 12,
    bot: (g) => g.findBot((b, r) => Math.abs(b.age - g.P.age) <= 3 && !(r && r.met), 1),
    text: (g, { bot: b }) => {
      const r = relOf(g, b);
      let t = `Nhà bên có ${b.name}, trạc tuổi ngươi, ngày nào cũng ngồi vẽ bậy lên tường đất.`;
      if (r && (r.past.length || r.cn)) t += '\n\nKhông hiểu vì sao, lần đầu nhìn thấy mà ngươi thấy quen như đã biết nhau từ lâu lắm.';
      return t;
    },
    choices: (g, { bot: b }) => [
      { t: 'Rủ đi bắt cá', go: (g) => { g.relAdd(b, 25); return `Hai đứa ướt như chuột lột, về bị mắng một trận, nhưng từ đó ${b.name} thành bạn thân của ngươi.`; } },
      { t: 'Giành cục phấn của nó', go: (g) => { g.relAdd(b, -20); g.stat('can', 2); return `Hai đứa vật nhau lăn lộn. Ngươi thắng, nhưng ${b.name} ghét ngươi từ đó.`; } },
      { t: 'Lặng lẽ ngồi vẽ cạnh bên', go: (g) => { g.relAdd(b, 15); g.stat('ngo', 2); return `${b.name} liếc ngươi một cái rồi đưa cho ngươi nửa cục phấn.`; } },
    ],
  },

  // ===== Tuổi nhỏ (ai cũng nhập đạo lúc 6 tuổi, các sự kiện này cho thêm cơ duyên) =====
  {
    id: 'lao_gia_gieng', auto: () => 0, w: 6, cd: 3, title: 'Ông lão bên giếng',
    once: true,
    when: (g) => g.P.age >= 6 && g.P.age <= 15,
    text: () => 'Một ông lão rách rưới ngồi bên miệng giếng làng, chìa cái gáo dừa ra xin nước uống.',
    choices: (g) => [
      {
        t: 'Múc nước mời ông', p: 0.55 + g.P.stats.co / 500, go: (g) => {
          if (g.r.chance(0.55 + g.P.stats.co / 500)) {
            g.stat('ngo', 5); const t = g.addTuvi(g.need() * 0.4);
            return `Ông uống xong, gõ nhẹ lên trán ngươi ba cái. Đêm ấy ngươi mơ thấy một bài khẩu quyết tinh diệu hơn hẳn bài đang luyện, tỉnh dậy vẫn nhớ từng chữ.\n\nNgộ tính +5. Tu vi +${t}.`;
          }
          g.stat('tam', 3); return 'Ông cảm ơn rồi chống gậy đi mất. Ngươi thấy lòng nhẹ nhõm. Tâm tính +3.';
        },
      },
      {
        t: 'Hỏi ông có biết phép tiên không', go: (g) => {
          if (g.P.stats.ngo >= 55) { const t = g.learnRandom(1, 2); g.stat('ngo', 2); return `Ông nheo mắt: "Thằng nhóc này lanh đấy." Rồi ông vạch xuống đất mấy đường quyền, bắt ngươi tập tới tối.\n\nNgộ tính +2. ${t || 'Ngươi nhớ được vài thế, nhưng chưa thành chiêu.'}`; }
          return 'Ông cười khà khà, không đáp, chống gậy đi mất.';
        },
      },
      {
        t: 'Ném đá trêu ông', go: (g) => {
          g.tinh(-5);
          if (g.r.chance(0.3)) { g.hurt(15); return 'Viên đá bay ngược lại trúng trán ngươi. Ngẩng lên thì ông lão đã biến mất.'; }
          return 'Ông chẳng thèm nhìn. Ngươi chợt thấy mình thật trẻ con.';
        },
      },
    ],
  },
  {
    id: 'khao_hach', auto: () => 0, w: 6, cd: 3, title: 'Tông môn tuyển đệ tử',
    when: (g) => !g.P.sect && g.P.age >= 8 && g.P.age <= 16,
    prep: (g) => { const ss = g.aliveSects(); return ss.length ? { sect: g.r.pick(ss).id } : null; },
    text: (g, { data }) => `${g.sect(data.sect).name} mở đợt thu nhận đệ tử ở trấn bên. Trẻ con khắp vùng xếp hàng, lần lượt đặt tay lên trắc linh thạch.`,
    choices: (g, { data }) => [
      {
        t: 'Xếp hàng thử sức', p: 0.2 + g.P.root.m * 0.3 + (g.P.stats.ngo - 50) / 200, go: (g) => {
          const sc = g.sect(data.sect);
          const p = 0.2 + g.P.root.m * 0.3 + (g.P.stats.ngo - 50) / 200;
          if (g.r.chance(p)) {
            g.joinSect(sc);
            return `Trắc linh thạch sáng lên: ${g.P.root.n}. Trưởng lão gật đầu, ghi tên ngươi vào sổ.\n\nTừ nay ngươi là đệ tử ${sc.name}. Tu luyện nhanh hơn 20%.`;
          }
          g.stat('tam', 4); return 'Viên đá chỉ le lói rồi tắt. Ngươi bị gạt ra. Trên đường về ngươi tự nhủ: đường tu đâu chỉ có một cửa. Tâm tính +4.';
        },
      },
      { t: 'Không đi', go: () => 'Ngươi ở nhà phụ việc. Có những ngã rẽ lướt qua mà người ta không hề hay biết.' },
    ],
  },
  {
    id: 'co_duyen_muon', auto: () => 0, w: 4, cd: 5, title: 'Quyển sách trong kho',
    when: (g) => g.P.realm === 0 && g.P.age >= 10 && g.P.age <= 45,
    text: () => 'Dọn kho cũ, ngươi tìm thấy một quyển sách chép tay mục nát. Trang đầu viết bốn chữ: "Dẫn khí nhập thể", nét chữ khác hẳn bài khẩu quyết ngươi đang luyện.',
    choices: (g) => [
      {
        t: 'Thức đêm nghiền ngẫm', p: 0.5 + g.P.stats.ngo / 200, go: (g) => {
          if (g.r.chance(0.5 + g.P.stats.ngo / 200)) { const t = g.addTuvi(g.need() * 0.5); return `Ba tháng sau, một luồng khí mát chạy dọc sống lưng, những chỗ tắc nghẽn bấy lâu bỗng thông suốt.\n\nTu vi +${t}.`; }
          g.stat('ngo', 3); return 'Chữ nghĩa lộn xộn, đọc mãi không hiểu. Nhưng đầu óc ngươi sáng ra đôi chút. Ngộ tính +3.';
        },
      },
      { t: 'Đem bán cho tiệm sách cũ', go: (g) => { g.money(20); return 'Lão chủ tiệm trả 20 linh thạch, mắt sáng rỡ một cách đáng ngờ.'; } },
    ],
  },
  {
    id: 'tong_mon_moi', w: 2, cd: 8, title: 'Lời mời từ sơn môn',
    when: (g) => g.P.dao && !g.P.sect && g.P.realm >= 1 && g.P.realm <= 4 && g.P.age >= 14,
    prep: (g) => { const ss = g.aliveSects(); return ss.length ? { sect: g.r.pick(ss).id } : null; },
    text: (g, { data }) => `Trưởng lão ${g.sect(data.sect).name} nghe danh ngươi, đích thân tới mời gia nhập.`,
    choices: (g, { data }) => [
      { t: 'Gia nhập', go: (g) => { const sc = g.sect(data.sect); g.joinSect(sc); return `Ngươi trở thành đệ tử ${sc.name}. Tu luyện nhanh hơn 20%.`; } },
      { t: 'Tán tu tự tại hơn', go: (g) => { g.stat('tam', 2); g.stat('co', 2); return 'Ngươi cúi chào từ chối. Trời rộng, đường dài, một mình cũng được.'; } },
    ],
  },

  // ===== Chọn con đường tu hành (vào qua hàng đợi khi lên Trúc Cơ) =====
  {
    id: 'dao_do', queued: true, title: 'Ngã rẽ đạo đồ',
    text: (g) => {
      const P = g.P;
      const locked = Object.values(PATHS).filter((pa) => pa.req && !pa.req(P));
      return `Trúc Cơ đã thành, đạo cơ vững vàng. Đã đến lúc chọn con đường sẽ đi suốt đời này. Chọn rồi không đổi được.${locked.length ? `\n\nChưa đủ duyên: ${locked.map((pa) => `${pa.n} (${pa.reqText.toLowerCase()})`).join(', ')}.` : ''}`;
    },
    choices: (g) => [
      ...Object.entries(PATHS).filter(([, pa]) => !pa.req || pa.req(g.P)).map(([id, pa]) => ({ t: `${pa.n}: ${pa.desc}`, go: (g) => g.setPath(id) })),
      { t: 'Chưa quyết, đi thêm một đoạn rồi tính', go: (g) => { g.P.pathRetry = g.P.age + 10; return 'Ngươi gác lại ngã rẽ. Mười năm sau sẽ lại phải chọn. Biết đâu khi ấy duyên phận đã khác.'; } },
    ],
  },

  // ===== Đạo hiệu (vào qua hàng đợi khi lên Trúc Cơ) =====
  {
    id: 'dao_hieu', queued: true, title: 'Đạo hiệu',
    text: (g) => `Bước vào Trúc Cơ là đã rời hàng phàm tục. Theo lệ người tu đạo, ngươi nên tự đặt cho mình một đạo hiệu. Tôn xưng sẽ đổi theo cảnh giới: Trúc Cơ gọi là "Tử"${g.P.g === 'nu' ? ' hoặc "Tiên Tử"' : ''}, Kim Đan là "Chân Nhân", Nguyên Anh là "Chân Quân"...`,
    choices: (g, { data }) => [
      ...data.opts.map((o) => ({ t: `${o} ${g.P.g === 'nu' ? 'Tiên Tử' : 'Tử'}`, go: (g) => { g.P.daoHieu = o; return `Từ nay giang hồ gọi ngươi là ${g.honorific()}.`; } })),
      { t: `Giữ tục danh ${g.P.name}`, go: (g) => { g.P.daoHieu = null; return 'Tên cha mẹ đặt, ngươi không đổi. Người ta vẫn gọi ngươi bằng tên thật.'; } },
    ],
  },

  // ===== Lịch luyện =====
  {
    id: 'hang_dong', cd: 20, auto: (g) => (g.P.hp >= 60 && g.P.stats.co >= 55 ? 0 : 1), w: 5, acts: ['lich_luyen'], title: 'Hang động sau thác',
    when: (g) => g.P.dao && g.P.age >= 12,
    text: () => 'Sau một thác nước có cửa hang tối om. Hơi lạnh và linh khí từ bên trong tỏa ra từng đợt.',
    choices: (g) => [
      {
        t: 'Đi vào tận cùng', p: 0.45 + (g.P.stats.co - 50) / 150, go: (g) => {
          if (g.r.chance(0.45 + (g.P.stats.co - 50) / 150)) {
            const t = g.addTuvi(g.gain() * 6);
            const m = g.r.int(10, 40) * (1 + g.P.realm);
            g.money(m);
            const loot = g.r.chance(0.6) ? '\n' + g.gainItem(g.dropItem(), 'Trong túi còn có') : '';
            return `Cuối hang là một bộ hài cốt ngồi kiết già, trước mặt đặt một túi trữ vật. Ngươi vái ba vái rồi nhận lấy.\n\nTu vi +${t}, linh thạch +${m}.${loot}`;
          }
          g.hurt(g.r.int(15, 30), 'chết trong hang động sau thác nước');
          return 'Cơ quan dưới chân bật lên, tên độc bắn ra như mưa. Ngươi lết được ra ngoài, máu me đầy người.';
        },
      },
      { t: 'Ngồi ở cửa hang hấp thu linh khí', go: (g) => { const t = g.addTuvi(g.gain() * 1.5); return `Ngươi ngồi ba ngày ba đêm, để linh khí thấm dần vào kinh mạch. Tu vi +${t}.`; } },
      { t: 'Bỏ đi', go: () => 'Có những cánh cửa không nên mở. Ngươi đi tiếp.' },
    ],
  },
  {
    id: 'yeu_thu', auto: (g, { data }) => (g.winOdds(() => g.monsterFighter(data.m)) >= 0.6 ? 0 : 1), w: 5, cd: 3, acts: ['lich_luyen'], title: 'Yêu thú chặn đường',
    when: (g) => g.P.age >= 10,
    prep: (g) => ({ m: g.curMap() ? g.mapMonster() : g.monster(g.P.realm + (g.P.realm === 0 ? 0 : g.r.pick([-1, 0, 0, 1]))) }),
    text: (g, { data }) => `Một con ${data.m.n} chặn ngang đường mòn${data.m.d !== undefined ? ` ở ${MAPS[data.m.d].n}` : ''}, mắt đỏ ngầu, nước dãi nhỏ xuống đất.\n\n${g.hintMonster(data.m)}`,
    choices: (g, { data }) => [
      {
        t: 'Nghênh chiến', p: g.winOdds(() => g.monsterFighter(data.m)), go: (g) => {
          const m = data.m;
          const f = g.fightMonster(m);
          if (f.win) {
            const L = m.d !== undefined ? MAPS[m.d].loot : 1;
            const t = g.addTuvi(g.gain() * 2 * L);
            const mo = Math.round(g.r.int(8, 25) * (1 + g.P.realm) * L);
            g.money(mo); g.fame(1);
            return `${f.text}\n\nNgươi hạ được ${m.n}. Tu vi +${t}, linh thạch +${mo}.`;
          }
          g.hurt(g.r.int(20, 40), `bị ${m.n} cắn chết giữa rừng`);
          return `${f.text}\n\nNgươi thua, bị thương nặng.`;
        },
      },
      {
        t: 'Bỏ chạy', p: 0.55 + (g.P.stats.co - 50) / 150 + g.tadd('flee'), go: (g) => {
          if (g.r.chance(0.55 + (g.P.stats.co - 50) / 150 + g.tadd('flee'))) return 'Ngươi lao xuống dốc, lẩn vào bụi rậm. Thoát rồi.';
          g.hurt(Math.round(15 * (1 + 0.3 * (data.m.d || 0))), `bị ${data.m.n} đuổi kịp`);
          return 'Không thoát kịp. Lưng ngươi bị cào một vệt dài.';
        },
      },
    ],
  },
  {
    id: 'cho_dem', auto: () => -1, w: 2, cd: 6, title: 'Chợ đêm tán tu',
    when: (g) => g.P.age >= 12 && g.P.money >= 20,
    text: () => 'Phiên chợ đêm của tán tu họp dưới chân núi. Đèn lồng giấy treo lủng lẳng, người bán nào cũng trùm kín mặt.',
    choices: (g) => {
      const hx = Math.round(g.pillPrice('hoi_xuan') * 0.7);
      const da = Math.round(30 * (1 + g.P.realm * 0.5));
      return [
        { t: `Mua Hồi Xuân Đan giá hời (${hx})`, if: g.P.money >= hx, go: (g) => { g.money(-hx); g.P.pills.hoi_xuan = (g.P.pills.hoi_xuan || 0) + 1; return 'Đan thật, giá rẻ hơn Tụ Bảo Lâu ba phần.'; } },
        {
          t: `Mua một hòn đá thô (${da})`, if: g.P.money >= da, go: (g) => {
            g.money(-da);
            if (g.r.chance(0.4)) {
              if (g.P.dao) { const t = g.addTuvi(g.gain() * 4); return `Đập ra, bên trong là một khối linh tinh trong suốt. Tu vi +${t}.`; }
              g.money(da * 4); return `Đập ra, bên trong là linh tinh. Ngươi bán lại được ${da * 4} linh thạch.`;
            }
            return 'Đá vẫn chỉ là đá.';
          },
        },
        { t: 'Chỉ dạo xem', go: (g) => { g.stat('ngo', 1); return 'Ngươi nghe lỏm được vài chuyện hay ho về các đại tông môn. Ngộ tính +1.'; } },
      ];
    },
  },
  {
    id: 'truyen_thua', auto: (g) => (g.P.stats.ngo >= 50 && g.P.hp >= 60 ? 0 : 1), w: 2, cd: 25, acts: ['lich_luyen'], title: 'Pho tượng dưới vực',
    when: (g) => g.P.dao && g.P.realm >= 1 && g.P.stats.co >= 40,
    text: () => 'Dưới đáy vực sâu, ngươi thấy một pho tượng đá tay cầm ngọc giản. Vừa chạm vào, một giọng nói vang lên trong đầu: "Ba nghìn năm rồi... cuối cùng cũng có người tới."',
    choices: (g) => [
      {
        t: 'Quỳ xuống nhận truyền thừa', p: 0.6 + (g.P.stats.ngo - 50) / 200, go: (g) => {
          if (g.r.chance(0.6 + (g.P.stats.ngo - 50) / 200)) {
            const t = g.addTuvi(g.gain() * 15); g.stat('ngo', 5);
            const sk = g.learnRandom(2, g.P.realm >= 4 ? 3 : 2);
            return `Ký ức của một kiếm tu cổ xưa tràn vào đầu ngươi: những trận chiến, những năm tháng cô độc, một cái tên đã bị thế gian quên lãng.\n\nTu vi +${t}, ngộ tính +5. ${sk}`;
          }
          g.hurt(40, 'không chịu nổi truyền thừa, thần hồn vỡ nát');
          return 'Thần thức của cổ nhân quá mạnh, đầu ngươi như muốn nổ tung.';
        },
      },
      { t: 'Vái ba vái rồi rời đi', go: (g) => { g.stat('tam', 5); g.stat('co', 3); return 'Giọng nói thở dài: "Cũng tốt." Ngươi rời đi, lòng nhẹ như mây. Tâm tính +5, cơ duyên +3.'; } },
    ],
  },
  {
    id: 'linh_thu', auto: () => 0, w: 2, cd: 10, acts: ['lich_luyen'], title: 'Sinh linh bị thương',
    when: (g) => g.P.age >= 10 && !g.P.flags.pet,
    prep: (g) => ({ sp: g.r.pick(['hồ ly lông bạc', 'chim sẻ lửa', 'rùa đá nhỏ', 'mèo mun ba mắt', 'rắn ngọc xanh']) }),
    text: (g, { data }) => `Trong bụi rậm có một con ${data.sp} bị thương, đang run rẩy nhìn ngươi.`,
    choices: (g, { data }) => [
      { t: 'Băng bó rồi mang về nuôi', go: (g) => { g.P.flags.pet = data.sp; g.tinh(4); return `Từ nay ngươi có bạn đồng hành: một con ${data.sp}. Sức chiến đấu +10%.`; } },
      { t: 'Bắt đem bán', go: (g) => { const m = 40 * (1 + g.P.realm); g.money(m); g.tinh(-4); return `Bán được ${m} linh thạch. Tiếng kêu của nó văng vẳng mãi trong đầu ngươi.`; } },
      { t: 'Để nó tự đi', go: (g) => { g.stat('co', 2); return 'Ngươi đặt nó xuống. Nó nhìn ngươi một lúc rồi biến vào rừng. Cơ duyên +2.'; } },
    ],
  },
  {
    id: 'dich_benh', auto: (g) => (g.P.hp >= 50 ? 0 : -1), w: 2, cd: 20, title: 'Ôn dịch',
    when: (g) => g.P.age >= 14,
    text: () => 'Ôn dịch hoành hành ở trấn Lạc Hà. Người chết nằm la liệt bên đường, ai còn chân đều bỏ chạy.',
    choices: (g) => [
      { t: 'Ở lại sắc thuốc cứu người', go: (g) => { g.tinh(10); g.fame(4); g.stat('tam', 3); g.hurt(g.r.int(5, 20), 'nhiễm ôn dịch khi cứu người'); return 'Ngươi ở lại ba tháng. Khi dịch tàn, dân trấn khắc tên ngươi lên cổng làng.'; } },
      { t: 'Quyên linh thạch rồi đi', if: g.P.money >= 30, go: (g) => { g.money(-30); g.tinh(4); return 'Ngươi để lại 30 linh thạch cho thầy thuốc trong trấn rồi lên đường.'; } },
      { t: 'Rời đi ngay', go: (g) => { g.tinh(-4); return 'Ngươi lấy khăn bịt mũi, đi thật nhanh, không ngoảnh lại.'; } },
    ],
  },

  // ===== Mưu sinh =====
  {
    id: 'ho_tong', auto: (g) => (g.P.hp >= 50 ? 0 : 1), w: 4, cd: 4, acts: ['muu_sinh'], title: 'Hộ tống thương đội',
    when: (g) => g.P.age >= 14,
    text: () => 'Một thương đội cần người hộ tống qua Hắc Thạch Cốc. Tiền công hậu hĩnh, nhưng ai cũng biết trong cốc có cướp.',
    choices: (g) => [
      {
        t: 'Nhận việc', go: (g) => {
          const pay = Math.round(30 * (1 + g.P.realm * 1.5));
          if (g.r.chance(0.5)) { g.money(pay); return `Chuyến đi êm ả. Ngươi nhận ${pay} linh thạch.`; }
          const pow = REALMS[Math.max(0, g.P.realm - 1)].pow * g.r.range(1, 1.6);
          const f = g.fight('toán cướp', pow);
          if (f.win) { g.money(pay * 2); g.fame(1); return `Giữa cốc, một toán cướp ập ra.\n${f.text}\n\nNgươi đánh tan bọn chúng. Chủ thương đội trả gấp đôi: ${pay * 2} linh thạch.`; }
          g.hurt(25, 'bị cướp giết ở Hắc Thạch Cốc');
          g.money(Math.round(pay / 3));
          return `Giữa cốc, một toán cướp ập ra.\n${f.text}\n\nHàng bị cướp mất một nửa, ngươi bị thương.`;
        },
      },
      { t: 'Đường đó nguy hiểm, thôi', go: () => 'Ngươi tìm việc khác an toàn hơn.' },
    ],
  },
  {
    id: 'dau_gia', auto: () => -1, w: 2, cd: 6, title: 'Hội đấu giá Tứ Phương',
    when: (g) => g.P.realm >= 1 && g.P.money >= 80 * (1 + g.P.realm),
    text: () => 'Hội đấu giá Tứ Phương mở cửa. Trên đài là những món ngoài chợ không bao giờ có.',
    choices: (g) => {
      const p = 80 * (1 + g.P.realm);
      return [
        { t: `Ngộ Đạo Trà: ngộ tính +8 (${p})`, if: g.P.money >= p, go: (g) => { g.money(-p); g.stat('ngo', 8); return 'Một ngụm trà, trước mắt như có ngàn con chữ xoay tròn. Ngộ tính +8.'; } },
        { t: `Cốt Linh Quả: căn cốt +8 (${p})`, if: g.P.money >= p, go: (g) => { g.money(-p); g.stat('can', 8); return 'Ăn xong, xương cốt kêu răng rắc. Căn cốt +8. Thọ nguyên cũng dài thêm.'; } },
        {
          t: `Một món pháp khí Thượng phẩm (${p * 2})`, if: g.P.money >= p * 2, go: (g) => {
            g.money(-p * 2);
            return 'Ngươi giơ bảng giá cuối cùng. ' + g.gainItem(makeItem(g.r, g.s.nextItem++, g.P.realm, g.r.chance(0.03) ? 4 : g.r.chance(0.2) ? 3 : 2), 'Thắng đấu giá');
          },
        },
        { t: 'Chỉ đứng xem', go: () => 'Giá cứ thế vọt lên. Ngươi lặng lẽ ra về.' },
      ];
    },
  },

  // ===== Bot: cứu, đấu, kết giao =====
  {
    id: 'cuu_nguoi', auto: (g, { data }) => (g.winOdds(() => g.monsterFighter(data.m, 0.8)) >= 0.65 ? 'Lao vào cứu' : 'Làm như không thấy'), w: 4, cd: 5, title: 'Tiếng kêu cứu',
    when: (g) => g.P.age >= 12,
    bot: (g) => g.findBot((b) => b.age >= 10 && near(g, b)),
    prep: (g, b) => ({ m: g.monster(b.realm) }),
    text: (g, { bot: b, data }) => `Giữa rừng, ${g.nm(b)} đang bị một con ${data.m.n} dồn vào vách đá, áo đã rách tả tơi.\n\n${g.hintMonster(data.m, 0.8)}`,
    choices: (g, { bot: b, data }) => [
      {
        t: 'Lao vào cứu', p: g.winOdds(() => g.monsterFighter(data.m, 0.8)), go: (g) => {
          const f = g.fightMonster(data.m, 0.8);
          if (f.win) { g.relAdd(b, 35); g.tinh(5); g.fame(2); return `${f.text}\n\nHai người cùng hạ con thú. ${b.name} chắp tay: "Ơn cứu mạng, ngày sau nhất định báo đáp."`; }
          g.relAdd(b, 20);
          g.hurt(25, `chết khi cứu ${b.name}`);
          return `${f.text}\n\nNgươi bị hất văng, nhưng thế cũng đủ để ${b.name} thoát thân. Người ấy không quên chuyện này.`;
        },
      },
      {
        t: 'Ném một viên Hồi Xuân Đan rồi đi', if: (g.P.pills.hoi_xuan || 0) > 0,
        go: (g) => { g.P.pills.hoi_xuan--; g.relAdd(b, 15); return `${b.name} chụp lấy viên đan, gật đầu với ngươi một cái rồi quay lại chiến đấu.`; },
      },
      {
        t: 'Làm như không thấy', go: (g) => {
          g.tinh(-3);
          if (g.r.chance(0.3)) { g.botDie(b, `bị ${data.m.n} giết giữa rừng`); return 'Ngươi đi tiếp. Tiếng kêu sau lưng tắt hẳn.'; }
          if (g.r.chance(0.5)) { g.relAdd(b, -10); return 'Lúc quay đi, ngươi bắt gặp ánh mắt của người đó.'; }
          return 'Ngươi đi tiếp. Tiếng gầm nhỏ dần sau lưng.';
        },
      },
      {
        t: 'Chờ cả hai kiệt sức rồi nhặt của', go: (g) => {
          g.tinh(-12);
          if (g.r.chance(0.5)) {
            const m = g.r.int(20, 60) * (1 + b.realm);
            g.money(m);
            g.botDie(b, `chết dưới vuốt ${data.m.n}`);
            return `${b.name} gục xuống. Ngươi lục túi trữ vật của người chết, được ${m} linh thạch.`;
          }
          g.relSet(b, -60, 'thu');
          return `${b.name} sống sót, và thấy ngươi đang lom khom bên túi đồ của mình. Từ nay hai người là kẻ thù.`;
        },
      },
    ],
  },
  {
    id: 'khieu_chien', auto: (g, { bot }) => (g.winOdds(() => g.botFighter(bot)) >= 0.6 ? 'Nhận lời' : 'Chắp tay từ chối'), w: 4, cd: 4, title: 'Kẻ chặn đường',
    when: (g) => g.P.dao && g.P.age >= 14,
    bot: (g) => g.findBot((b, r) => b.dao && b.age >= 14 && near(g, b) && (b.pers === 'cuong' || (r && r.met && r.v <= -20))),
    text: (g, { bot: b }) => `${g.nm(b)} chặn đường, mũi kiếm chĩa thẳng vào ngươi: "Nghe danh đã lâu. Hôm nay xem ngươi có xứng không!"\n\n${g.hintBot(b)}`,
    choices: (g, { bot: b }) => {
      const go = (mul) => (g) => {
        const f = g.fightBot(b, mul);
        const r = relOf(g, b);
        if (f.win) {
          const t = g.addTuvi(g.gain());
          g.fame(4);
          g.relAdd(b, b.pers === 'cuong' ? 15 : -10);
          return `${f.text}\n\nNgươi thắng. ${b.pers === 'cuong' ? `${b.name} cười lớn: "Được! Ta phục." ` : ''}Danh vọng +4, tu vi +${t}.`;
        }
        g.fame(-2);
        g.hurt(g.r.int(15, 30), `chết trong trận đấu với ${b.name}`);
        g.relAdd(b, -5);
        return `${f.text}\n\nNgươi thua, nằm sóng soài dưới đất. ${b.name} quay lưng bỏ đi.`;
      };
      return [
        { t: 'Nhận lời', p: g.winOdds(() => g.botFighter(b)), go: go(1) },
        { t: 'Nói khích cho hắn mất bình tĩnh', if: g.P.stats.ngo >= 55, p: g.winOdds(() => g.botFighter(b), 1.3), go: go(1.3) },
        { t: 'Chắp tay từ chối', go: (g) => { g.fame(-3); g.stat('tam', 2); g.relAdd(b, -5); return `${b.name} cười nhạt: "Đồ nhát gan." Ngươi mặc kệ. Danh vọng -3, tâm tính +2.`; } },
      ];
    },
  },
  {
    id: 'ket_bai', auto: () => 'Cạn chén', w: 4, cd: 5, title: 'Chén rượu trên đỉnh núi',
    when: (g) => g.P.age >= 14,
    bot: (g) => g.findBot((b, r) => b.age >= 14 && r && r.met && r.v >= 45 && !r.tag),
    text: (g, { bot: b }) => `${b.name} mời ngươi lên đỉnh núi, rót hai chén rượu: "Đời người gặp được tri kỷ không dễ. Chi bằng ta kết nghĩa, sống chết có nhau?"`,
    choices: (g, { bot: b }) => [
      { t: 'Cạn chén, kết nghĩa', go: (g) => { g.relSet(b, relOf(g, b).v + 15, 'huynh_de'); g.tinh(6); return `Hai người quỳ xuống trước trời đất. Từ nay ${b.name} là người kết nghĩa của ngươi.`; } },
      { t: 'Từ chối khéo', go: (g) => { g.relAdd(b, -8); return `${b.name} uống cạn cả hai chén, không nói thêm gì.`; } },
    ],
  },
  {
    id: 'dao_lu', w: 3, cd: 6, title: 'Bờ hồ đêm trăng',
    when: (g) => g.P.age >= 16 && !g.known().some(({ r }) => r.tag === 'dao_lu'),
    bot: (g) => g.findBot((b, r) => b.age >= 16 && r && r.met && r.v >= 55 && !r.tag),
    text: (g, { bot: b }) => `Đêm trăng, ${b.name} hẹn ngươi ra bờ hồ. Người ấy ngập ngừng mãi mới nói: "Đường tu dài đằng đẵng. Ta muốn có người cùng đi."`,
    choices: (g, { bot: b }) => [
      { t: 'Nắm lấy tay người ấy', go: (g) => { g.relSet(b, relOf(g, b).v + 10, 'dao_lu'); g.stat('tam', 5); g.tinh(10); return `Trăng soi xuống mặt hồ hai cái bóng. Từ nay ${b.name} là đạo lữ của ngươi. Tâm tính +5.`; } },
      { t: 'Đạo tâm chưa vững, xin lỗi', go: (g) => { g.relAdd(b, -15); g.tinh(-4); g.stat('tam', 2); return 'Người ấy cúi đầu, cười rất khẽ: "Ta hiểu." Rồi đi mất vào màn sương.'; } },
    ],
  },
  {
    id: 'song_tu', auto: () => 'Đi cùng', w: 3, cd: 5, title: 'Tử Trúc Lâm',
    when: (g) => g.P.dao,
    bot: (g) => g.findBot((b, r) => b.dao && r && r.met && r.tag === 'dao_lu'),
    text: (g, { bot: b }) => `${b.name} rủ ngươi cùng vào Tử Trúc Lâm bế quan song tu một mùa.`,
    choices: (g, { bot: b }) => [
      { t: 'Đi cùng', go: (g) => { const t = g.addTuvi(g.gain() * 3); b.tuvi = Math.min(REALMS[b.realm].need, b.tuvi + g.botGain(b) * 2); g.relAdd(b, 8); g.stat('tam', 2); return `Linh khí hai người hòa vào nhau như sông gặp biển. Tu vi +${t}.`; } },
      { t: 'Để lần sau', go: (g) => { g.relAdd(b, -3); return `${b.name} thở dài, nhưng vẫn cười.`; } },
    ],
  },
  {
    id: 'phan_boi', w: 2, cd: 15, title: 'Túi trữ vật trống rỗng',
    when: (g) => g.P.money >= 50 && !g.thas('noBetray'),
    bot: (g) => g.findBot((b, r) => (b.pers === 'tham' || b.pers === 'muu') && r && r.met && r.tag !== 'dao_lu' && (r.tag === 'huynh_de' || (r.v >= 20 && r.v <= 70))),
    prep: (g) => ({ loss: Math.floor(g.P.money * 0.5) }),
    text: (g, { bot: b, data }) => `Sáng ra tỉnh dậy, ${data.loss} linh thạch trong túi ngươi đã không cánh mà bay. ${b.name} cũng biến mất, chỉ để lại vết chân dẫn về hướng tây.`,
    choices: (g, { bot: b, data }) => [
      {
        t: 'Đuổi theo', go: (g) => {
          g.money(-data.loss);
          const f = g.fightBot(b);
          g.relSet(b, -60, 'thu');
          if (f.win) { g.money(data.loss); return `${f.text}\n\nNgươi đòi lại được linh thạch. Tình nghĩa thì không.`; }
          g.hurt(20, `bị ${b.name} giết khi đòi lại của`);
          return `${f.text}\n\n${b.name} bỏ trốn cùng số linh thạch.`;
        },
      },
      { t: 'Coi như trả nợ kiếp trước', go: (g) => { g.money(-data.loss); g.stat('tam', 6); g.tinh(4); g.relSet(b, -20, null); return 'Ngươi ngồi uống hết bình trà nguội rồi đứng dậy đi tiếp. Tâm tính +6.'; } },
      { t: 'Khắc tên kẻ phản bội vào lòng', go: (g) => { g.money(-data.loss); g.relSet(b, -80, 'thu'); g.tinh(-5); return `Cái tên ${b.name} từ nay là một cái gai trong tim ngươi.`; } },
    ],
  },
  {
    id: 'bi_canh', auto: () => 'Rủ người đó cùng đi', w: 3, cd: 10, title: 'Bí cảnh mở cửa',
    when: (g) => g.P.dao && g.P.realm >= 1 && g.P.realm <= 5,
    bot: (g) => g.findBot((b) => b.dao && near(g, b)),
    text: (g, { bot: b }) => `Một bí cảnh thượng cổ vừa mở giữa sa mạc. Ở cửa vào, ngươi chạm mặt ${g.nm(b)}, cũng đang định bước vào.`,
    choices: (g, { bot: b }) => [
      { t: 'Rủ người đó cùng đi', go: (g) => { const t = g.addTuvi(g.gain() * 6); g.relAdd(b, 15); return `Hai người thay nhau canh gác, đi được tới tầng thứ ba. Tu vi +${t}, ${b.name} thân thiết hơn.`; } },
      {
        t: 'Đi một mình', p: 0.4 + (g.P.stats.co - 50) / 150, go: (g) => {
          if (g.r.chance(0.4 + (g.P.stats.co - 50) / 150)) { const t = g.addTuvi(g.gain() * 10); const it = g.gainItem(makeItem(g.r, g.s.nextItem++, g.P.realm, g.r.chance(0.3) ? 2 : 1), 'Bên hồ còn có'); return `Ngươi tìm được một hồ linh dịch ở tầng sâu nhất. Tu vi +${t}.\n${it}`; }
          g.hurt(30, 'lạc trong bí cảnh, không bao giờ ra được');
          return 'Ngươi lạc vào mê trận, mãi mới tìm được lối ra, người đầy thương tích.';
        },
      },
      {
        t: 'Chặn cửa, không cho ai vào', p: g.winOdds(() => g.botFighter(b)), go: (g) => {
          const f = g.fightBot(b);
          if (f.win) { const t = g.addTuvi(g.gain() * 12); g.relAdd(b, -40); g.tinh(-8); return `${f.text}\n\n${b.name} bị đánh bật ra ngoài. Ngươi một mình vơ vét bí cảnh. Tu vi +${t}.`; }
          g.relAdd(b, -20);
          g.hurt(25, `bị ${b.name} giết trước cửa bí cảnh`);
          return `${f.text}\n\nNgươi bị đánh văng. ${b.name} bước qua người ngươi mà vào.`;
        },
      },
    ],
  },
  {
    id: 'bao_vat', auto: () => 'Đề nghị chia đôi', w: 3, cd: 6, title: 'Linh chi ngàn năm',
    when: (g) => g.P.dao && g.P.realm >= 1,
    bot: (g) => g.findBot((b) => b.dao && near(g, b)),
    text: (g, { bot: b }) => `Trên vách núi mọc một gốc linh chi ngàn năm. ${g.nm(b)} cũng vừa tới nơi. Hai người nhìn nhau.`,
    choices: (g, { bot: b }) => [
      { t: 'Nhường cho người đó', go: (g) => { g.relAdd(b, 20); g.stat('tam', 3); g.tinh(3); return `${b.name} ngạc nhiên, rồi chắp tay thật sâu.`; } },
      { t: 'Đề nghị chia đôi', go: (g) => { const t = g.addTuvi(g.gain() * 3); g.relAdd(b, 6); return `Mỗi người một nửa. Tu vi +${t}.`; } },
      {
        t: 'Ra tay giành lấy', p: g.winOdds(() => g.botFighter(b)), go: (g) => {
          const f = g.fightBot(b);
          if (f.win) { const t = g.addTuvi(g.gain() * 8); g.relAdd(b, -30); g.tinh(-5); return `${f.text}\n\nLinh chi về tay ngươi. Tu vi +${t}.`; }
          g.relAdd(b, -15);
          g.hurt(20, `bị ${b.name} giết trên vách núi`);
          return `${f.text}\n\n${b.name} hái linh chi rồi bỏ đi.`;
        },
      },
    ],
  },
  {
    id: 'tien_boi', auto: () => 'Xin được chỉ điểm', w: 2, cd: 8, title: 'Người câu cá bên suối',
    when: (g) => g.P.dao && g.P.age >= 12,
    bot: (g) => g.findBot((b) => b.dao && b.realm >= g.P.realm + 2),
    text: (g, { bot: b }) => `Ngươi gặp ${g.nm(b)} đang ngồi câu cá bên suối. Khí tức người này sâu như biển.`,
    choices: (g, { bot: b }) => [
      {
        t: 'Xin được chỉ điểm', go: (g) => {
          if (b.pers === 'cuong' && g.r.chance(0.5)) { g.hurt(10); return 'Người đó búng tay một cái, ngươi bay xa ba trượng: "Không có duyên."'; }
          g.stat('ngo', 4); const t = g.addTuvi(g.gain() * 2); g.relAdd(b, 10);
          const sk = g.r.chance(0.4) ? ' ' + g.learnRandom(1, 2) : '';
          return `${b.name} nói vài câu, chỉ vài câu thôi, mà bao năm vướng mắc của ngươi bỗng thông suốt. Ngộ tính +4, tu vi +${t}.${sk}`;
        },
      },
      { t: 'Ngồi câu cùng, không nói gì', go: (g) => { g.stat('tam', 3); g.relAdd(b, b.pers === 'an' ? 20 : 10); return 'Hai người ngồi tới tối, chẳng ai câu được con nào. Tâm tính +3.'; } },
      { t: 'Lặng lẽ đi qua', go: () => 'Ngươi đi qua. Người câu cá không ngẩng đầu lên.' },
    ],
  },
  {
    id: 'thu_de_tu', auto: () => 'Thu nhận', w: 3, cd: 15, title: 'Đứa trẻ quỳ trước động phủ',
    when: (g) => g.P.realm >= 3 && g.known().filter(({ r }) => r.tag === 'de_tu').length < 3,
    bot: (g) => g.findBot((b, r) => b.age >= 8 && b.age <= 18 && !(r && r.tag), 1),
    text: (g, { bot: b }) => `Một đứa trẻ tên ${b.name} quỳ trước động phủ của ngươi ba ngày ba đêm, nhất quyết xin làm đồ đệ.\nLinh căn: ${b.rootN}. Tính tình: ${b.pers === 'hien' ? 'hiền lành' : b.pers === 'tham' ? 'hơi tham' : b.pers === 'cuong' ? 'ngang ngược' : b.pers === 'an' ? 'lầm lì' : b.pers === 'muu' ? 'lanh lợi khó đoán' : 'thẳng thắn'}.`,
    choices: (g, { bot: b }) => [
      { t: 'Thu nhận', go: (g) => { g.relSet(b, 50, 'de_tu'); b.dao = true; if (g.P.sect) b.sect = g.P.sect; return `Ngươi truyền cho ${b.name} bài khẩu quyết đầu tiên. Đệ tử tu luyện nhanh hơn 30% khi có ngươi dạy dỗ.`; } },
      { t: 'Đuổi về', go: (g) => { g.relAdd(b, -10); g.stat('tam', 1); return 'Ngươi đóng cửa động phủ. Sáng hôm sau, đứa trẻ đã đi.'; } },
    ],
  },
  {
    id: 'de_tu_nan', w: 2, cd: 10, title: 'Thư cầu cứu',
    when: (g) => g.P.dao,
    bot: (g) => g.findBot((b, r) => r && r.met && r.tag === 'de_tu'),
    prep: (g, b) => ({ m: g.monster(b.realm + 1) }),
    text: (g, { bot: b, data }) => `Một con hạc giấy bay tới: đệ tử ${b.name} bị ${data.m.n} vây khốn ở Hắc Phong Lĩnh.\n\n${g.hintMonster(data.m)}`,
    choices: (g, { bot: b, data }) => [
      {
        t: 'Lập tức lên đường', p: g.winOdds(() => g.monsterFighter(data.m)), go: (g) => {
          const f = g.fightMonster(data.m);
          if (f.win) { g.relAdd(b, 20); g.fame(3); return `${f.text}\n\nNgươi cứu được đệ tử. Nó ôm chân ngươi khóc như mưa.`; }
          if (g.r.chance(0.5)) g.botDie(b, `chết dưới tay ${data.m.n} ở Hắc Phong Lĩnh`);
          g.hurt(30, `chết khi cứu đệ tử ${b.name}`);
          return `${f.text}\n\nNgươi tới quá muộn, hoặc quá yếu.`;
        },
      },
      {
        t: 'Đệ tử phải tự vượt qua', go: (g) => {
          if (g.r.chance(0.5)) { b.tuvi = Math.min(REALMS[b.realm].need, b.tuvi + REALMS[b.realm].need * 0.3); g.relAdd(b, -5); return `Mười ngày sau, ${b.name} tự trở về, người đầy vết thương nhưng ánh mắt đã khác.`; }
          g.botDie(b, `chết dưới tay ${data.m.n} ở Hắc Phong Lĩnh`);
          g.tinh(-6);
          return `Mấy ngày sau, người ta mang về thanh kiếm gãy của ${b.name}.`;
        },
      },
    ],
  },

  // ===== Tâm ma =====
  {
    id: 'tam_ma', auto: () => 'Nhìn thẳng', w: 3, cd: 10, inClosed: true, title: 'Tâm ma',
    when: (g) => g.P.realm >= 2,
    text: () => 'Đang vận công, trước mắt ngươi bỗng hiện ra những gương mặt cũ: kẻ từng làm nhục ngươi, người ngươi từng phụ. Chúng cười, chúng khóc, chúng gọi tên ngươi.',
    choices: (g) => {
      const fr = g.closeFriends();
      return [
        {
          t: 'Nhìn thẳng vào chúng', p: 0.4 + g.P.stats.tam / 150, go: (g) => {
            if (g.r.chance(0.4 + g.P.stats.tam / 150)) { g.stat('tam', 6); const t = g.addTuvi(g.gain() * 2); return `Ảo ảnh tan như khói. Tâm cảnh ngươi sáng thêm một tầng. Tâm tính +6, tu vi +${t}.`; }
            g.stat('tam', -3);
            g.hurt(20, 'bị tâm ma cắn nuốt');
            return 'Ngươi chìm vào ảo ảnh suốt mấy ngày, tỉnh lại thì miệng đầy máu. Tâm tính -3.';
          },
        },
        { t: 'Dùng sát niệm chém tan', go: (g) => { g.tinh(-8); const t = g.addTuvi(g.gain() * 1.5); return `Ảo ảnh vỡ nát. Lòng ngươi lạnh đi một chút, nhưng tu vi lại tiến nhanh hơn. Tu vi +${t}.`; } },
        { t: `Nghĩ tới ${fr.length ? fr[0].b.name : 'người thân'}`, if: fr.length > 0, go: (g) => { g.tinh(6); g.stat('tam', 4); return `Gương mặt của ${fr[0].b.name} hiện lên, ấm áp và rõ ràng. Tâm ma lùi lại. Tâm tính +4.`; } },
      ];
    },
  },

  // ===== Tông môn (từ hàng đợi) =====
  {
    id: 'tong_mon_chien', auto: (g, { data }) => { const f = g.members(data.enemy).filter((b) => Math.abs(b.realm - g.P.realm) <= 1); const avg = f.length ? f.reduce((m, b) => m + g.power(b), 0) / f.length : REALMS[g.P.realm].pow; return g.P.hp >= 50 && g.playerPower() >= avg * 1.2 ? 'Xông ra tiền tuyến' : 'Ở hậu phương'; }, queued: true, title: 'Chiến hỏa sơn môn',
    text: (g, { data }) => `${g.sect(data.enemy).name} kéo người đánh lên sơn môn ${g.sect(g.P.sect).name}. Trống trận vang khắp núi.`,
    choices: (g, { data }) => [
      {
        t: 'Xông ra tiền tuyến', if: g.P.age >= 14, go: (g) => {
          const foes = g.members(data.enemy).filter((b) => near(g, b, 1));
          const foe = foes.length ? g.r.pick(foes) : null;
          const f = foe ? g.fightBot(foe) : g.fight('đệ tử địch', REALMS[g.P.realm].pow * g.r.range(0.8, 1.2));
          if (f.win) {
            g.fame(5); const t = g.addTuvi(g.gain() * 2);
            if (foe) { g.relSet(foe, -50, 'thu'); if (g.r.chance(0.3)) g.botDie(foe, `tử trận dưới tay ${g.P.name}`); }
            return `${f.text}\n\nNgươi giữ vững cổng núi. Danh vọng +5, tu vi +${t}.`;
          }
          g.hurt(30, 'tử trận khi bảo vệ sơn môn');
          return `${f.text}\n\nNgươi bị đánh lui, phải khiêng về hậu phương.`;
        },
      },
      { t: 'Ở hậu phương cứu chữa người bị thương', go: (g) => { g.tinh(6); g.fame(1); return 'Ngươi băng bó cho hàng chục đồng môn. Nhiều người nhớ ơn ngươi.'; } },
      { t: 'Lặng lẽ trốn khỏi tông môn', go: (g) => { g.P.sect = null; g.fame(-6); g.tinh(-6); return 'Đêm đó ngươi trèo qua tường sau mà đi. Từ nay ngươi là tán tu.'; } },
    ],
  },

  // ===== Tin dữ (từ hàng đợi) =====
  {
    id: 'tin_du', queued: true, title: 'Tin dữ',
    text: (g, { data }) => `Tin dữ truyền tới: ${data.name}${data.tag ? `, ${TAG_NAMES[data.tag].toLowerCase()} của ngươi,` : ''} đã ${data.cause}.`,
    choices: (g, { data }) => {
      const k = data.killer ? g.soul(data.killer) : null;
      const alive = k && k.alive;
      return [
        {
          t: alive ? `Đi tìm ${k.name} báo thù` : 'Đi tìm kẻ thủ ác', if: !!alive, p: alive ? g.winOdds(() => g.botFighter(k)) : undefined, go: (g) => {
            const f = g.fightBot(k);
            if (f.win) {
              g.fame(6); g.tinh(-3);
              if (g.r.chance(0.5)) { g.P.cnt.revenge++; g.botDie(k, `bị ${g.P.name} giết để báo thù cho ${data.name}`); return `${f.text}\n\n${k.name} gục dưới chân ngươi. Mối thù đã trả.`; }
              g.relSet(k, -70, 'thu');
              return `${f.text}\n\n${k.name} bị trọng thương, nhưng đã chạy thoát.`;
            }
            g.relSet(k, -70, 'thu');
            g.hurt(35, `chết khi báo thù cho ${data.name}`);
            return `${f.text}\n\nNgươi không phải đối thủ của ${k.name}.`;
          },
        },
        { t: 'Lập mộ, thắp hương', go: (g) => { g.stat('tam', 4); g.tinh(4); return `Ngươi đắp cho ${data.name} một nấm mộ nhỏ dưới gốc tùng, mỗi năm đều quay lại thắp hương.`; } },
        { t: 'Khắc mối thù vào lòng', if: !!alive, go: (g) => { g.relSet(k, -70, 'thu'); g.tinh(-3); return `Ngươi ghi nhớ cái tên ${k.name}. Sẽ có ngày.`; } },
      ];
    },
  },

  // ===== Duyên nợ xuyên kiếp =====
  {
    id: 'duyen_no', w: 1, cd: 15, title: 'Như đã từng quen',
    when: (g) => g.P.age >= 8,
    bot: (g) => g.findBot((b, r) => r && !r.met && r.past.length > 0 && (r.past[r.past.length - 1].tag || Math.abs(r.past[r.past.length - 1].v) >= 40) && b.age >= 6, 1),
    text: (g, { bot: b }) => {
      const p = relOf(g, b).past[relOf(g, b).past.length - 1];
      return `Lần đầu gặp ${g.nm(b)} mà ngươi thấy quen đến lạ.\n\nĐêm ấy ngươi nằm mơ: một kiếp nào đó, người này tên là ${p.name}, từng là ${pastLabel(p)} của ngươi.`;
    },
    choices: (g, { bot: b }) => {
      const p = relOf(g, b).past[relOf(g, b).past.length - 1];
      if (p.v >= 0) {
        return [
          { t: 'Tìm người ấy, kể lại giấc mơ', go: (g) => { g.relAdd(b, Math.round(p.v * 0.6) + 10); return `Người kia ngẩn ra hồi lâu rồi bật cười: "Ta cũng từng mơ thấy ngươi." Duyên cũ nối lại.`; } },
          { t: 'Giữ kín trong lòng', go: (g) => { g.relAdd(b, 5); g.stat('tam', 3); return 'Ngươi chỉ gật đầu chào. Có những chuyện để trong lòng thì đẹp hơn.'; } },
        ];
      }
      return [
        { t: 'Oán cũ đã qua, kết giao lại từ đầu', go: (g) => { g.relAdd(b, 10); g.tinh(5); g.stat('tam', 3); return 'Ngươi mời người ấy một chén trà. Mối oán kiếp trước, kiếp này để nó trôi đi.'; } },
        {
          t: 'Ra tay trước khi hắn nhớ ra', go: (g) => {
            g.tinh(-8);
            const f = g.fightBot(b);
            g.relSet(b, -60, 'thu');
            if (f.win) { if (g.r.chance(0.4)) g.botDie(b, `bị ${g.P.name} giết vì oán cũ kiếp trước`); return `${f.text}\n\nNgươi ra tay trước. Nợ cũ, kiếp này thanh toán.`; }
            g.hurt(25, `chết dưới tay ${b.name}, oán cũ chưa dứt`);
            return `${f.text}\n\nNgươi thất thủ. Oán cũ thêm oán mới.`;
          },
        },
      ];
    },
  },
  {
    id: 'co_nhan_gap_lai', queued: true, title: 'Cố nhân',
    text: (g, { bot: b }) => {
      const cn = relOf(g, b).cn;
      if (b.realm >= 3) return `${g.nm(b)} nhìn ngươi chằm chằm, giọng run run: "${cn.name}? ...Là ngươi thật sao?"\n\nNgười này từng là ${pastLabel(cn)} của ngươi ở kiếp trước, và đủ tu vi để nhìn thấu luân hồi.`;
      return `${g.nm(b)} cứ nhìn ngươi như đang cố nhớ ra điều gì. Ngươi cũng thấy người này quen lắm.`;
    },
    choices: (g, { bot: b }) => {
      const cn = relOf(g, b).cn;
      const end = (v) => { const r = relOf(g, b); g.relSet(b, v); r.cn = null; };
      return [
        { t: 'Thừa nhận', if: b.realm >= 3, go: (g) => { end(cn.v * 0.8); return cn.v >= 0 ? 'Hai người ngồi nói chuyện tới sáng, về một đời đã qua.' : 'Ánh mắt người kia lạnh đi. Món nợ cũ vẫn còn đó.'; } },
        { t: 'Lảng đi', go: (g) => { end(cn.v * 0.4); return 'Ngươi mỉm cười cho qua. Nhưng người kia vẫn đứng nhìn theo rất lâu.'; } },
      ];
    },
  },
  {
    id: 'co_nhan_tim', w: (g) => 40, once: true, title: 'Người tìm ngươi suốt bao năm',
    when: (g) => g.P.age >= 5 && g.P.age <= 25,
    bot: (g) => {
      const fav = g.P.flags.duyenBot ? g.soul(g.P.flags.duyenBot) : null;
      if (fav && fav.alive && relOf(g, fav) && relOf(g, fav).cn) return fav;
      return g.findBot((b, r) => r && r.cn && r.cn.v >= 35 && b.realm >= 3 && b.realm >= g.P.realm + 2, 1);
    },
    text: (g, { bot: b }) => {
      const cn = relOf(g, b).cn;
      return `${g.nm(b)} bỗng dừng chân trước mặt ngươi và nhìn rất lâu. Rồi người ấy khẽ nói: "${cn.name}... ta tìm ngươi đã ${g.s.year - cn.year} năm."\n\nKý ức kiếp trước chợt ùa về: người này từng là ${pastLabel(cn)} của ngươi.`;
    },
    choices: (g, { bot: b }) => {
      const r = relOf(g, b);
      const cn = r.cn;
      return [
        {
          t: 'Bái người làm sư phụ', if: b.realm >= g.P.realm + 2, go: (g) => {
            g.relSet(b, 60, 'su_phu'); r.cn = null;
            g.P.dao = true;
            if (b.sect && g.sect(b.sect) && g.sect(b.sect).alive) g.P.sect = b.sect;
            const t = g.addTuvi(g.gain() * 10);
            const m = 50 * (1 + b.realm); g.money(m);
            return `Người ấy dẫn ngươi lên núi, truyền cho ngươi công pháp ngày xưa hai người từng cùng luyện.\n\nNgươi đã nhập đạo. Tu vi +${t}, linh thạch +${m}.`;
          },
        },
        { t: 'Nhận lại cố nhân, nhưng muốn tự bước đi', go: (g) => { g.relSet(b, Math.max(50, cn.v)); r.cn = null; const m = 30 * (1 + b.realm); g.money(m); g.stat('co', 5); return `Người ấy cười, đặt vào tay ngươi ${m} linh thạch: "Vẫn cứng đầu như xưa."`; } },
      ];
    },
  },
  {
    id: 'thu_kiep_truoc', w: 30, once: true, title: 'Nợ máu kiếp trước',
    when: (g) => g.P.age >= 16 && g.P.dao,
    bot: (g) => g.findBot((b, r) => r && r.cn && r.cn.v <= -35 && b.dao, 1),
    text: (g, { bot: b }) => `Một bóng áo đen chặn đường: ${g.nm(b)}. Người đó cười lạnh: "${relOf(g, b).cn.name}, đầu thai rồi tưởng ta không nhận ra sao?"\n\n${g.hintBot(b)}`,
    choices: (g, { bot: b }) => {
      const r = relOf(g, b);
      const done = (v, tag) => { g.relSet(b, v, tag); r.cn = null; };
      return [
        {
          t: 'Liều một trận', p: g.winOdds(() => g.botFighter(b)), go: (g) => {
            const f = g.fightBot(b);
            done(-60, 'thu');
            if (f.win) { g.fame(8); return `${f.text}\n\nKẻ thù kiếp trước bỏ chạy, buông lại một câu: "Chưa xong đâu."`; }
            g.hurt(45, `bị ${b.name} truy sát, nợ máu kiếp trước đến kiếp này mới trả`);
            return `${f.text}\n\nNgươi gục xuống. Người kia không thèm kết liễu, chỉ cười rồi bỏ đi.`;
          },
        },
        {
          t: 'Quỳ xuống xin tha', p: b.pers === 'hien' || b.pers === 'nghia' ? 0.85 : 0.45, go: (g) => {
            g.stat('tam', -5);
            if (g.r.chance(b.pers === 'hien' || b.pers === 'nghia' ? 0.85 : 0.45)) { done(-20, null); return 'Người kia nhổ toẹt xuống đất: "Kiếp này ngươi không đáng để ta ra tay." Rồi bỏ đi.'; }
            done(-60, 'thu');
            g.hurt(30, `bị ${b.name} giết vì oán cũ kiếp trước`);
            return 'Một chưởng giáng xuống lưng ngươi: "Kiếp trước ngươi có tha cho ta không?"';
          },
        },
        {
          t: 'Bỏ chạy', p: 0.4 + (g.P.stats.co - 50) / 150 + g.tadd('flee'), go: (g) => {
            done(-60, 'thu');
            if (g.r.chance(0.4 + (g.P.stats.co - 50) / 150 + g.tadd('flee'))) return 'Ngươi thoát được, nhưng biết rằng người đó sẽ còn quay lại.';
            g.hurt(35, `bị ${b.name} đuổi kịp và giết chết`);
            return 'Bóng đen đuổi theo như hình với bóng.';
          },
        },
      ];
    },
  },

  // ===== Tuổi già =====
  {
    id: 'tuoi_gia', w: 200, once: true, title: 'Tóc bạc',
    when: (g) => g.P.age >= 40 && g.lifespan() - g.P.age <= 6,
    text: () => 'Sáng nay soi gương, ngươi thấy tóc mình đã bạc trắng. Thọ nguyên sắp cạn, ngươi biết mình không còn nhiều năm.',
    choices: (g) => {
      const dt = g.known().filter(({ r }) => r.tag === 'de_tu');
      return [
        {
          t: `Truyền công lực cho đệ tử ${dt.length ? dt[0].b.name : ''}`, if: dt.length > 0, go: (g) => {
            const b = dt[0].b;
            b.tuvi = REALMS[b.realm].need;
            g.relAdd(b, 30); g.tinh(10);
            return `Ngươi đặt tay lên đỉnh đầu ${b.name}, dồn hết tu vi cả đời vào. Đệ tử khóc không thành tiếng.\n\n${b.name} sẽ nhớ ơn ngươi qua cả kiếp sau.`;
          },
        },
        {
          t: 'Lên núi tìm thuốc trường sinh', p: 0.25 + (g.P.stats.co - 50) / 200, go: (g) => {
            if (g.r.chance(0.25 + (g.P.stats.co - 50) / 200)) { g.P.lifeBonus += 0.15; return `Trên đỉnh tuyết sơn, ngươi tìm được một gốc tuyết liên. Thọ nguyên tăng lên ${g.lifespan()}.`; }
            g.hurt(20, 'chết rét trên tuyết sơn khi tìm thuốc trường sinh');
            return 'Trên đỉnh núi chỉ có gió lạnh và tuyết.';
          },
        },
        { t: 'Ngồi yên ngắm hoàng hôn', go: (g) => { g.stat('tam', 10); g.P.flags.binhThan = true; return 'Ngươi ngồi bên hiên nhà, nhìn mặt trời lặn xuống sau núi. Lần đầu tiên sau bao năm, ngươi không muốn gì cả.'; } },
      ];
    },
  },
];

// Luật xuất hiện: age = tuổi tối thiểu (mặc định 14), child = được xảy ra trước 6 tuổi,
// place: 'xa' chỉ khi Lịch luyện, 'thanh' chỉ khi Mưu sinh hoặc Kết giao, không ghi = mọi lúc
export const EVENT_RULES = {
  lac_rung: { age: 3, child: true }, sot_cao: { age: 2, child: true }, ban_thuo_nho: { age: 4, child: true }, co_nhan_tim: { age: 5, child: true },
  lao_gia_gieng: { age: 6 }, khao_hach: { age: 8 }, an_may: { age: 8, place: 'thanh' }, duyen_no: { age: 8 },
  yeu_thu: { age: 10 }, linh_thu: { age: 10, place: 'xa' }, cuu_nguoi: { age: 12 }, vuon_thuoc: { age: 12, place: 'xa' }, tien_boi: { age: 12, place: 'xa' },
  hang_dong: { place: 'xa' }, truyen_thua: { place: 'xa' }, bi_canh: { place: 'xa' }, bao_vat: { place: 'xa' }, trung_la: { place: 'xa' },
  co_mo: { place: 'xa' }, kiep_nguoi: { place: 'xa' }, linh_mach: { place: 'xa' }, kiem_trung: { place: 'xa' },
  cho_dem: { place: 'thanh' }, ho_tong: { place: 'thanh' }, ban_do: { place: 'thanh' }, moc_tui: { place: 'thanh' },
  dau_gia: { age: 16, place: 'thanh' }, bat_coc: { place: 'xa' }, ngoc_gian: { place: 'xa' }, dau_tu: { age: 16, place: 'thanh' }, song_bac: { age: 16, place: 'thanh' }, loi_dai: { age: 16, place: 'thanh' },
  cho_no_le: { age: 16, place: 'thanh' }, tuu_lau: { age: 16, place: 'thanh' },
  huyet_tran: { age: 16, place: 'xa' }, dao_lu: { age: 16 }, song_tu: { age: 16 }, ho_ly: { age: 16 }, de_tu_nan: { age: 16 },
  thu_kiep_truoc: { age: 16 }, thu_nha: { age: 16 }, yeu_vuong: { age: 16 }, co_duyen_muon: { age: 16 }, luyen_dan: { age: 16 }, mong: { age: 20 },
};
export const EVENTS = BASE_EVENTS.concat(EVENTS2, EVENTS3);
for (const e of EVENTS) e.rule = EVENT_RULES[e.id] || e.r3 || {};
export const EVENT_MAP = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
