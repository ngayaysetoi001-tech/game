// Kỳ ngộ đợt 3: riêng từng vùng lịch luyện, cảnh giới cao, con đường tu hành, tông môn,
// thiên hạ (gắn với bot), tuổi thơ, tuổi già, bế quan, và hai chuỗi dài.
// r3: luật xuất hiện (gộp vào EVENT_RULES): age, child, place ('xa' | 'thanh'),
//     map (chỉ khi đang lịch luyện ở vùng đó), minD (đang lịch luyện ở vùng từ độ khó này trở lên), realm (cảnh giới tối thiểu), path (con đường tu hành), sect (phải có tông môn).
import { REALMS, TOP_REALM, MATS } from './data.js';
import { makeItem, THAN_THONG, TT_MAP } from './items.js';

const xp3 = (p) => Math.max(0.03, Math.min(0.97, p));
const st3 = (g, k) => g.P.stats[k];
const pw3 = (g, add = 0) => REALMS[Math.max(0, Math.min(TOP_REALM, g.P.realm + add))].pow;
// phần thưởng tu vi của kỳ ngộ đợt này nhân 0,6 để không làm game dễ đi
const yrs3 = (g, n) => g.addTuvi(g.gain() * n * 0.6);
const item3 = (g, q, slot = null, prefix) => g.gainItem(makeItem(g.r, g.s.nextItem++, g.P.realm, q, slot), prefix);
const mats3 = (g, m) => {
  for (const k in m) g.P.mats[k] = (g.P.mats[k] || 0) + m[k];
  return g.matText(m, 'Thu được');
};
const fr3 = (g) => 1 + g.P.realm; // nguyên liệu cơ bản tính theo cảnh giới
// yêu thú của vùng đang lịch luyện, mạnh hơn mul lần
const mapM3 = (g, mul = 1, name = null) => { const m = g.mapMonster(); m.pow *= mul; if (name) m.n = name; return m; };
const odds3 = (g, m) => g.winOdds(() => g.monsterFighter(m));
const hasThe3 = (g, id) => g.P.the === id || g.P.the2 === id;
const near3 = (g, b, d = 1) => Math.abs(b.realm - g.P.realm) <= d;

export const EVENTS3 = [
  // ================= Riêng từng vùng lịch luyện =================
  {
    id: 'yeu_cao', w: 4, cd: 12, title: 'Yêu cáo trộm gà', r3: { map: 'ngoai_o', age: 10 },
    auto: () => 'Đặt bẫy',
    text: () => 'Làng ven trấn mất gà liên tiếp. Dân làng chỉ cho ngươi dấu chân cáo dẫn vào bụi lau, kèm theo mùi khói hương rất lạ: con cáo này đã thành tinh.',
    choices: (g) => {
      const pTrap = xp3(0.55 + (st3(g, 'ngo') - 50) / 150);
      return [
        { t: 'Lần theo dấu, bắt tận ổ', p: odds3(g, mapM3(g, 0.8, 'Hồ ly tinh')), go: (g) => { const f = g.fightMonster(mapM3(g, 0.8, 'Hồ ly tinh')); if (f.win) { g.money(15 * fr3(g)); g.fame(1); return `${f.text}\n\nDân làng góp ${15 * fr3(g)} linh thạch tạ ơn.`; } return `${f.text}\n\nCon cáo cười khanh khách rồi biến vào bụi lau.`; } },
        { t: 'Đặt bẫy ở chuồng gà', p: pTrap, go: (g) => { if (g.r.chance(pTrap)) { g.stat('ngo', 2); g.money(10 * fr3(g)); return `Nửa đêm bẫy sập. Con cáo kêu như người khóc, xin tha. Ngươi bắt nó thề không bén mảng tới làng nữa. Ngộ tính +2, linh thạch +${10 * fr3(g)}.`; } return 'Sáng ra bẫy trống trơn, bên cạnh có ba cái lông gà xếp thành hình mặt cười.'; } },
        { t: 'Mặc kệ, chuyện nhà nông', go: (g) => { g.tinh(-2); return 'Ngươi đi tiếp. Sau lưng, bà cụ đầu làng thở dài.'; } },
      ];
    },
  },
  {
    id: 'de_lang', w: 3, cd: 20, title: 'Đê làng sắp vỡ', r3: { map: 'ngoai_o', age: 12 },
    auto: () => 'Xắn tay',
    text: () => 'Mưa ba ngày không dứt, nước sông dâng sát mặt đê. Cả làng đang hì hục đắp bao cát, trẻ con khóc ầm trong đình.',
    choices: (g) => {
      const pMagic = xp3(0.4 + g.P.realm * 0.12 + (st3(g, 'can') - 50) / 200);
      return [
        { t: 'Xắn tay đắp đê cùng dân làng', go: (g) => { g.hurt(6, 'kiệt sức khi đắp đê'); g.tinh(5); g.fame(2); g.stat('can', 1); return 'Hai đêm không ngủ. Đê giữ được. Ông trưởng làng nắm tay ngươi mãi không buông. Căn cốt +1.'; } },
        { t: 'Vận linh lực chặn dòng nước', if: g.P.realm >= 1, p: pMagic, go: (g) => { if (g.r.chance(pMagic)) { g.fame(6); g.tinh(6); const t = yrs3(g, 3); return `Ngươi dựng một bức tường linh khí giữa dòng lũ. Nước rẽ đôi, đi vòng qua làng. Danh vọng +6, tu vi +${t} vì linh lực được tôi luyện.`; } g.hurt(22, 'kiệt sức giữa dòng lũ'); return 'Dòng nước quá mạnh, ngươi bị cuốn đi mấy dặm mới bám được vào gốc cây.'; } },
        { t: 'Đi chỗ khác tránh mưa', go: (g) => { g.tinh(-4); return 'Ngươi tìm một hang đá khô ráo. Đêm đó nghe tiếng đê vỡ vọng lại từ xa.'; } },
      ];
    },
  },
  {
    id: 'lang_vuong', w: 3, cd: 15, title: 'Lang Vương Hắc Phong', r3: { map: 'hac_phong', age: 14 },
    auto: (g) => (odds3(g, mapM3(g, 1.4, 'Hắc Phong Lang Vương')) >= 0.6 ? 0 : 'Lánh'),
    text: (g) => `Tiếng hú vang khắp sườn núi. Con sói đầu đàn to như con bê, lông đen như mực, dẫn theo cả bầy chặn lối đi.\n\n${g.hintMonster(mapM3(g, 1.4, 'Hắc Phong Lang Vương'))}`,
    choices: (g) => {
      const m = mapM3(g, 1.4, 'Hắc Phong Lang Vương');
      const pLure = xp3(0.45 + (st3(g, 'ngo') - 50) / 120);
      return [
        { t: 'Đánh thẳng vào Lang Vương', p: odds3(g, m), go: (g) => { const f = g.fightMonster(m); if (f.win) { g.fame(4); return `${f.text}\n\nBầy sói tan tác khi con đầu đàn gục xuống.\n${mats3(g, { thu_hach: 3 + g.r.int(0, 2) })}`; } return `${f.text}\n\nNgươi lết được xuống chân núi.`; } },
        { t: 'Dụ cả bầy vào khe núi hẹp', p: pLure, go: (g) => { if (g.r.chance(pLure)) { g.stat('ngo', 2); return `Ngươi lăn đá chặn miệng khe. Bầy sói kẹt lại, chỉ còn Lang Vương một mình gầm gừ rồi bỏ đi. Ngộ tính +2.\n${mats3(g, { thu_hach: 1 })}`; } g.hurt(18, 'bị bầy sói xé xác'); return 'Bầy sói khôn hơn ngươi tưởng, chúng bọc ra phía sau.'; } },
        { t: 'Lánh đi đường vòng', go: () => 'Ngươi đi vòng mất cả ngày, nhưng giữ được mạng.' },
      ];
    },
  },
  {
    id: 'tho_san', w: 3, cd: 15, title: 'Thợ săn mất tích', r3: { map: 'hac_phong', age: 12 },
    auto: () => 'Lên núi',
    text: () => 'Một người đàn bà bế con chạy tới: chồng bà lên Hắc Phong Lĩnh săn gấu đã ba ngày chưa về. Trong tay bà là chiếc giày rách dính máu.',
    choices: (g) => {
      const pFind = xp3(0.5 + (st3(g, 'co') - 50) / 120);
      return [
        { t: 'Lên núi tìm người', p: pFind, go: (g) => { if (g.r.chance(pFind)) { g.tinh(6); g.fame(3); g.money(8 * fr3(g)); return `Ngươi tìm thấy anh ta trong một khe đá, gãy chân nhưng còn sống. Cả nhà cõng ngươi về ăn cơm, dúi cho ${8 * fr3(g)} linh thạch dành dụm.`; } const f = g.fightMonster(mapM3(g, 1, 'Thiết Bối Hùng')); return `Ngươi chỉ tìm thấy hang gấu.\n${f.text}${f.win ? '\n\nTrong hang có xác người thợ săn. Ngươi mang về cho vợ con anh ta chôn cất.' : ''}`; } },
        { t: 'Cho bà ít linh thạch rồi đi', if: g.P.money >= 10, go: (g) => { g.money(-10); g.tinh(2); return 'Bà cúi đầu cảm ơn, nhưng mắt vẫn nhìn mãi lên núi.'; } },
        { t: 'Lắc đầu bỏ đi', go: (g) => { g.tinh(-3); return 'Tiếng đứa trẻ khóc theo ngươi suốt đoạn đường.'; } },
      ];
    },
  },
  {
    id: 'co_trung', w: 3, cd: 15, title: 'Tổ cổ trùng', r3: { map: 'vu_an', age: 14 },
    auto: () => 'Đốt',
    text: () => 'Dưới gốc cây mục giữa đầm, hàng nghìn con cổ trùng óng ánh bò thành vòng tròn quanh một con mẹ to bằng nắm tay. Người luyện độc sẽ trả giá rất cao cho nó.',
    choices: (g) => {
      const pCatch = xp3(0.4 + (st3(g, 'ngo') - 50) / 150 + (hasThe3(g, 'bach_doc') ? 0.25 : 0));
      return [
        { t: 'Bắt sống con cổ mẹ', p: pCatch, go: (g) => { if (g.r.chance(pCatch)) { g.money(40 * fr3(g)); return `Ngươi nhốt được con cổ mẹ vào ống trúc. Bán cho thầy thuốc ở trấn được ${40 * fr3(g)} linh thạch.\n${mats3(g, { doc_nang: 3 })}`; } g.hurt(25, 'trúng cổ độc mà chết'); return 'Cổ mẹ chui qua kẽ tay, cắn một nhát. Cả cánh tay ngươi tím ngắt mấy ngày liền.'; } },
        { t: 'Đốt cả tổ cho sạch', go: (g) => { g.tinh(2); return `Lửa cháy suốt một canh giờ. Trong tro còn sót mấy túi độc.\n${mats3(g, { doc_nang: 1 })}`; } },
        { t: 'Nuốt cổ mẹ luyện thành bản mệnh cổ', if: g.P.path === 'ma' || hasThe3(g, 'bach_doc'), p: xp3(0.55 + (st3(g, 'can') - 50) / 150), go: (g) => { if (g.r.chance(xp3(0.55 + (st3(g, 'can') - 50) / 150))) { g.P.fight += 0.03; g.tinh(-4); return 'Cổ mẹ tan vào huyết mạch. Từ nay mỗi đòn đánh của ngươi đều mang theo một sợi độc. Sức chiến đấu +3%.'; } g.hurt(40, 'bị cổ trùng ăn từ trong ra ngoài'); return 'Cổ mẹ phản phệ, ngươi nôn ra một vũng máu đen.'; } },
      ];
    },
  },
  {
    id: 'doc_thao', w: 3, cd: 25, title: 'Độc thảo ngàn năm', r3: { map: 'vu_an', age: 14 },
    auto: () => 'Hái ngay',
    text: () => 'Giữa vũng bùn đen, một khóm cỏ tím phát sáng lờ mờ. Lá có chín vân vàng: Cửu Văn Độc Thảo, nghìn năm mới thành. Rễ còn non, nếu đợi tới trăng tròn thì dược lực gấp ba.',
    choices: (g) => {
      const pPick = xp3(0.6 + (st3(g, 'co') - 50) / 150);
      return [
        { t: 'Hái ngay kẻo người khác tới', p: pPick, go: (g) => { if (g.r.chance(pPick)) { const t = yrs3(g, 5); return `Ngươi luyện độc thảo thành đan ngay tại chỗ. Tu vi +${t}.`; } g.hurt(15, 'trúng độc độc thảo'); return 'Nhựa cỏ dính vào tay, rát như lửa đốt. Khóm cỏ héo rũ.'; } },
        { t: 'Ở lại canh tới trăng tròn', go: (g) => { g.later(1, 'doc_thao_2'); return 'Ngươi dựng lều cạnh đầm, ngày ngày xua đuổi rắn rết.'; } },
        { t: 'Đánh dấu chỗ rồi đi', go: (g) => { g.stat('ngo', 1); return 'Ngươi vẽ lại vị trí vào sổ. Kiến thức về dược thảo của ngươi lại tăng thêm. Ngộ tính +1.'; } },
      ];
    },
  },
  {
    id: 'doc_thao_2', queued: true, w: 1, title: 'Trăng tròn trên đầm', auto: () => 'Hái',
    text: () => 'Trăng tròn. Khóm độc thảo nở ra chín bông hoa nhỏ. Nhưng trong bóng tối, một đôi mắt vàng to như đèn lồng cũng đang nhìn nó: con Độc Giao giữ cỏ đã tỉnh.',
    choices: (g) => {
      const m = { n: 'Độc Giao giữ cỏ', pow: pw3(g) * 1.3, beast: true, r: g.P.realm, seed: 909 };
      return [
        { t: 'Hái', p: odds3(g, m), go: (g) => { const f = g.fightMonster(m); if (f.win) { const t = yrs3(g, 16); g.stat('can', 3); return `${f.text}\n\nNgươi nuốt nguyên khóm độc thảo dưới ánh trăng. Tu vi +${t}, căn cốt +3.\n${mats3(g, { doc_nang: 4 })}`; } return `${f.text}\n\nĐộc Giao cuộn khóm cỏ xuống đáy đầm.`; } },
        { t: 'Để lại cho nó', go: (g) => { g.tinh(3); return 'Ngươi cúi chào con Độc Giao rồi lặng lẽ rút đi. Nó nhìn theo, không đuổi.'; } },
      ];
    },
  },
  {
    id: 'hoa_linh', w: 3, cd: 18, title: 'Hỏa linh trong miệng núi', r3: { map: 'xich_diem', age: 16 },
    auto: (g) => (odds3(g, mapM3(g, 1.1, 'Hỏa Linh')) >= 0.6 ? 'Đánh' : 'Tránh'),
    text: () => 'Một đốm lửa có hình người nhỏ xíu nhảy nhót trên dòng nham thạch, tò mò nhìn ngươi. Hỏa linh trời sinh, thứ mà pháp tu cả đời mong một lần gặp.',
    choices: (g) => {
      const pTame = xp3(0.3 + (st3(g, 'ngo') - 50) / 120 + (g.P.path === 'tinh' ? 0.25 : 0));
      const m = mapM3(g, 1.1, 'Hỏa Linh');
      return [
        { t: 'Thu phục bằng thần thức', p: pTame, go: (g) => { if (g.r.chance(pTame)) { g.P.fight += 0.024; const t = yrs3(g, 6); return `Hỏa linh chui vào đan điền, cuộn tròn ngủ. Linh lực của ngươi nóng rực. Sức chiến đấu +2,5%, tu vi +${t}.`; } g.hurt(20, 'bị hỏa linh thiêu thành tro'); return 'Hỏa linh nổi giận, phun lửa vào mặt ngươi rồi lặn xuống nham thạch.'; } },
        { t: 'Đánh tan lấy hỏa tinh', p: odds3(g, m), go: (g) => { const f = g.fightMonster(m); if (f.win) return `${f.text}\n\n${mats3(g, { hoa_tinh: 3 })}`; return f.text; } },
        { t: 'Tránh đi, lửa không có mắt', go: () => 'Hỏa linh nhìn theo ngươi một lúc, rồi lại nhảy nhót trên dòng nham.' },
      ];
    },
  },
  {
    id: 'lo_co', w: 3, cd: 20, title: 'Lò luyện cổ', r3: { map: 'xich_diem', age: 16 },
    auto: () => 'Đập',
    text: () => 'Sâu trong lòng núi lửa có một chiếc lò đồng ba chân cao bằng hai người, khắc đầy phù văn. Lửa địa tâm vẫn đang cháy dưới đáy lò sau hàng nghìn năm.',
    choices: (g) => {
      const pForge = xp3(0.45 + (st3(g, 'ngo') - 50) / 150 + Math.min(0.2, (g.P.forge || 0) / 300));
      return [
        { t: 'Mượn lửa lò rèn một món đồ', p: pForge, go: (g) => { if (g.r.chance(pForge)) { g.addForge(5); return `Lửa địa tâm luyện kim loại trong nháy mắt. Tay nghề rèn +5.\n${item3(g, g.r.chance(0.35) ? 3 : 2, null, 'Lò cổ cho ra')}`; } g.hurt(16, 'bị lửa địa tâm thiêu chết'); return 'Lò phun ngược một luồng lửa. Ngươi cháy sém nửa người.'; } },
        { t: 'Luyện đan bằng lửa lò', go: (g) => { g.P.pills.hoi_xuan = (g.P.pills.hoi_xuan || 0) + 2; return 'Ngươi luyện được 2 viên Hồi Xuân Đan, viên nào cũng tròn trịa.'; } },
        { t: 'Đập vỡ phù văn lấy tinh thạch', go: (g) => { g.tinh(-2); return `Phù văn vỡ, lò tắt lửa vĩnh viễn.\n${mats3(g, { hoa_tinh: 2, tinh_thiet: 6 * fr3(g) })}`; } },
      ];
    },
  },
  {
    id: 'tuong_quan', w: 3, cd: 25, title: 'Tàn hồn tướng quân', r3: { map: 'co_chien', age: 16 },
    auto: () => 'Bái',
    text: () => 'Giữa bãi xương trắng, một bóng giáp trụ mờ ảo vẫn đứng thẳng, tay chống trường thương. Ông ta quay đầu: "Vạn năm rồi... đã có ai tới thay ta giữ cửa ải này chưa?"',
    choices: (g) => {
      const m = { n: 'Tàn hồn tướng quân', pow: pw3(g) * 1.5, beast: true, r: g.P.realm, d: 4, seed: 4040 };
      return [
        { t: 'Quỳ xuống bái lạy, xin chỉ giáo', go: (g) => { const sk = g.learnRandom(2, 3); g.stat('tam', 2); return `Tướng quân gật đầu, múa một bài thương pháp cuối cùng rồi tan vào gió.\n${sk || 'Ngươi nhớ hết từng thế, nhưng chưa thành chiêu. Tâm tính +2.'}`; } },
        { t: 'Thách đấu để chứng minh', p: odds3(g, m), go: (g) => { const f = g.fightMonster(m); if (f.win) { g.fame(5); return `${f.text}\n\n"Hậu sinh khả úy." Ông cười lớn rồi tan biến, để lại thanh thương và hồn binh.\n${mats3(g, { binh_hon: 2 })}\n${item3(g, 3, 'vu_khi', 'Tướng quân để lại')}`; } return `${f.text}\n\n"Chưa đủ." Bóng giáp quay lưng, tiếp tục canh giữ.`; } },
        { t: 'Siêu độ cho ông yên nghỉ', p: xp3(0.5 + (st3(g, 'tam') - 50) / 120 + (g.P.path === 'phat' ? 0.3 : 0)), go: (g) => { if (g.r.chance(xp3(0.5 + (st3(g, 'tam') - 50) / 120 + (g.P.path === 'phat' ? 0.3 : 0)))) { g.tinh(10); g.stat('tam', 5); return 'Ngươi tụng kinh suốt đêm. Sáng ra, cả bãi xương như nhẹ đi. Tâm tính +5.'; } return 'Oán khí vạn năm quá nặng. Lời kinh của ngươi tan vào hư không.'; } },
      ];
    },
  },
  {
    id: 'binh_hon_chu', w: 3, cd: 25, title: 'Binh hồn nhận chủ', r3: { map: 'co_chien', age: 16 },
    auto: () => 'Bỏ',
    text: () => 'Một thanh binh khí gãy cắm trên tảng đá bỗng rung lên khi ngươi đi qua. Binh hồn bên trong vẫn còn, nó đang tìm chủ mới, hoặc tìm kẻ để giết.',
    choices: (g) => {
      const pBlood = xp3(0.4 + (st3(g, 'can') - 50) / 120 + (g.P.path === 'kiem' ? 0.2 : 0));
      const m = { n: 'Binh hồn cuồng nộ', pow: pw3(g) * 1.2, beast: true, r: g.P.realm, d: 4, seed: 5151 };
      return [
        { t: 'Nhỏ máu nhận chủ', p: pBlood, go: (g) => { if (g.r.chance(pBlood)) return `Binh khí hút máu ngươi rồi liền lại như mới.\n${item3(g, g.r.chance(0.08) ? 4 : 3, 'vu_khi', 'Binh hồn nhận chủ')}`; g.hurt(30, 'bị binh hồn hút cạn máu'); return 'Binh hồn hút máu không ngừng. Ngươi phải chặt đứt liên kết mới thoát được.'; } },
        { t: 'Ép binh hồn khuất phục', p: odds3(g, m), go: (g) => { const f = g.fightMonster(m); if (f.win) return `${f.text}\n\n${mats3(g, { binh_hon: 3 })}`; return f.text; } },
        { t: 'Bỏ đi', go: () => 'Thanh binh khí ngừng rung, tiếp tục chờ người khác.' },
      ];
    },
  },
  {
    id: 'khe_thoi_gian', w: 2, cd: 40, title: 'Khe nứt thời gian', r3: { map: 'hu_khong', age: 16 },
    text: () => 'Trước mặt ngươi, không gian rạn ra như mặt hồ đóng băng. Qua khe nứt, ngươi thấy một ngọn núi lúc thì cây cỏ xanh tươi, lúc thì chỉ còn tro bụi. Thời gian bên trong trôi khác hẳn bên ngoài.',
    choices: (g) => {
      const pSee = xp3(0.5 + (st3(g, 'ngo') - 50) / 120);
      return [
        { t: 'Bước vào tu luyện bên trong', go: (g) => { const t = yrs3(g, 25); g.P.lifeBonus -= 0.06; return `Bên trong một ngày bằng mười năm. Ngươi bước ra, tóc đã điểm bạc. Tu vi +${t}, thọ nguyên còn ${g.lifespan()}.`; } },
        { t: 'Đứng ngoài quan sát dòng thời gian', p: pSee, go: (g) => { if (g.r.chance(pSee)) { g.stat('ngo', 6); return 'Ngươi nhìn một cái cây mọc lên, già đi, mục nát, rồi lại nảy mầm. Bỗng hiểu ra nhiều điều. Ngộ tính +6.'; } g.hurt(20, 'bị khe nứt thời gian hút vào'); return 'Khe nứt bỗng mở rộng, hút mất một mảng áo và một mảng da của ngươi.'; } },
        { t: 'Tránh xa', go: () => 'Có những thứ không nên nhìn quá lâu.' },
      ];
    },
  },
  {
    id: 'bong_kiep_truoc', w: 2, cd: 60, title: 'Bóng hình kiếp trước', r3: { map: 'hu_khong', age: 16 },
    when: (g) => g.s.lives.length > 0,
    text: (g) => { const l = g.s.lives[g.s.lives.length - 1]; return `Trong hư không hiện ra một người đứng quay lưng. Khi người ấy quay lại, ngươi nhận ra gương mặt của chính mình kiếp trước: ${l.name}, ${l.asc ? 'người đã phi thăng' : REALMS[l.realm].n}, ${l.cause}.\n\n"Ta đã đi tới đâu, ngươi có muốn biết không?"`; },
    choices: (g) => {
      const l = g.s.lives[g.s.lives.length - 1];
      const nm = `Bóng ${l.name}`, bp = pw3(g) * (1 + l.realm * 0.08);
      return [
        { t: 'Ngồi xuống trò chuyện', go: (g) => { g.stat('tam', 4); g.stat('ngo', 3); g.tinh(4); return `Hai người nói chuyện tới khi hư không sáng lên. ${l.name} kể về những lựa chọn đã làm, những người đã gặp. Tâm tính +4, ngộ tính +3.`; } },
        { t: 'Giao đấu để vượt qua chính mình', p: g.winOdds(() => g.genericFighter(nm, bp)), go: (g) => { const f = g.fight(nm, bp, 1, { lethal: 0.2, cause: 'tan biến trong hư không' }); if (f.win) { const t = yrs3(g, 12 + l.realm * 2); return `${f.text}\n\n"Tốt. Đi xa hơn ta nhé." Bóng hình tan thành ánh sáng, chảy vào người ngươi. Tu vi +${t}.`; } return `${f.text}\n\n"Chưa được." Bóng hình mỉm cười rồi biến mất.`; } },
        { t: 'Quay đi, kiếp này là kiếp này', go: (g) => { g.stat('tam', 2); return 'Ngươi không ngoảnh lại. Phía sau, có tiếng cười rất khẽ. Tâm tính +2.'; } },
      ];
    },
  },

  // ================= Cảnh giới cao =================
  {
    id: 'khai_tong', w: 2, cd: 40, title: 'Khai tông lập phái', r3: { realm: 3, age: 30 },
    when: (g) => g.P.flags.chuongMon === undefined && g.aliveSects().length < 9,
    text: (g) => `Danh tiếng của ngươi đã lan khắp một vùng. Mấy chục thanh niên quỳ trước động phủ xin làm đồ đệ, có người quỳ đã ba ngày. Một trưởng lão ẩn cư khuyên: "Đã tới lúc khai sơn lập phái rồi."\n\nDựng sơn môn cần ${fmt3(600 * (1 + g.P.realm))} linh thạch.`,
    choices: (g) => {
      const cost = 600 * (1 + g.P.realm);
      return [
        { t: 'Khai sơn lập phái', if: g.P.money >= cost, go: (g) => { g.money(-cost); const sc = g.newSect(null); sc.founder = g.P.name; g.P.sect = sc.id; g.P.flags.chuongMon = sc.id; g.fame(20); g.learn(g.sectSkill(sc)); g.chron(`${g.fullName()} khai sơn lập phái, dựng nên ${sc.name}.`, 2); return `Ngày khai tông, chín tiếng chuông vang khắp núi. Từ nay ngươi là tổ sư của ${sc.name}. Tu luyện nhanh hơn 20%, danh vọng +20.`; } },
        { t: 'Chưa đủ linh thạch, hẹn ngày khác', if: g.P.money < cost, go: () => 'Ngươi bảo họ về nhà. Có người đi, có người vẫn quỳ.' },
        { t: 'Từ chối, một mình tiêu dao', go: (g) => { g.P.flags.chuongMon = null; g.stat('tam', 3); return 'Ngươi đóng cửa động phủ. Tâm tính +3.'; } },
      ];
    },
  },
  {
    id: 'moi_truong_lao', w: 2, cd: 30, title: 'Thư mời trưởng lão', r3: { realm: 3, age: 30 },
    when: (g) => !g.P.flags.chuongMon,
    prep: (g) => { const ss = g.aliveSects().filter((s) => s.id !== g.P.sect); return ss.length ? { sect: g.r.pick(ss).id } : null; },
    auto: () => 'Từ chối',
    text: (g, { data }) => `Sứ giả của ${g.sect(data.sect).name} mang tới một phong thư dát vàng: mời ngươi làm khách khanh trưởng lão, bổng lộc hậu hĩnh, không phải quản việc vặt.`,
    choices: (g, { data }) => [
      { t: 'Nhận lời', go: (g) => { const sc = g.sect(data.sect); g.P.sect = sc.id; g.learn(g.sectSkill(sc)); const m = 150 * (1 + g.P.realm); g.money(m); g.fame(6); return `Ngươi trở thành trưởng lão của ${sc.name}. Bổng lộc ${m} linh thạch, tu luyện nhanh hơn 20%.`; } },
      { t: 'Từ chối khéo', go: (g) => { g.fame(2); return 'Ngươi gửi lại một bình trà quý thay lời từ chối. Giang hồ khen ngươi biết điều.'; } },
    ],
  },
  {
    id: 'luan_dao', w: 3, cd: 15, title: 'Luận đạo trên đỉnh núi', r3: { realm: 2, age: 20 },
    bot: (g) => g.findBot((b) => b.dao && b.realm >= g.P.realm && b.realm <= g.P.realm + 2 && b.age >= 20),
    auto: () => 'Lắng nghe',
    text: (g, { bot: b }) => `${g.nm(b)} hẹn ngươi lên đỉnh núi luận đạo. Mây trôi dưới chân, một ấm trà, hai người. Câu đầu tiên: "Đạo là gì?"`,
    choices: (g, { bot: b }) => {
      const pWin = xp3(0.45 + (st3(g, 'ngo') - 50) / 100 - (b.realm - g.P.realm) * 0.12);
      return [
        { t: 'Tranh luận tới cùng', p: pWin, go: (g) => { if (g.r.chance(pWin)) { g.stat('ngo', 5); g.fame(4); g.relAdd(b, 8); const t = yrs3(g, 4); return `Ba ngày ba đêm. Cuối cùng ${b.name} chắp tay: "Ta thua." Ngộ tính +5, tu vi +${t}.`; } g.stat('tam', -2); g.relAdd(b, -4); return `${b.name} chỉ ra một chỗ hổng trong đạo tâm của ngươi. Ngươi bứt rứt suốt mấy tháng. Tâm tính -2.`; } },
        { t: 'Lắng nghe là chính', go: (g) => { g.stat('ngo', 2); g.relAdd(b, 12); return `Ngươi nói ít, nghe nhiều. ${b.name} rất vui, hứa lần sau lại hẹn. Ngộ tính +2.`; } },
        { t: 'Chỉ uống trà ngắm mây', go: (g) => { g.stat('tam', 3); g.relAdd(b, 6); return 'Hai người ngồi tới tối, không ai nói câu nào. Kỳ lạ là cả hai đều thấy đã hiểu nhau. Tâm tính +3.'; } },
      ];
    },
  },
  {
    id: 'ma_dao_xam', w: 2, cd: 25, title: 'Ma đạo xâm lấn', r3: { realm: 2, age: 20 },
    auto: (g) => (g.winOdds(() => g.genericFighter('Huyết Ma sứ giả', pw3(g) * 1.1)) >= 0.6 ? 0 : 'Tránh'),
    text: (g) => `Ma đạo kéo quân từ phương bắc tràn xuống, ba trấn đã thành tro. Các tông môn chính đạo hợp sức lập phòng tuyến, gửi thư khắp nơi tìm người giúp.\n\n${g.oddsText(g.winOdds(() => g.genericFighter('Huyết Ma sứ giả', pw3(g) * 1.1)), 0.3, 1.1)}`,
    choices: (g) => [
      { t: 'Gia nhập phòng tuyến', go: (g) => { const f = g.fight('Huyết Ma sứ giả', pw3(g) * 1.1, 1, { lethal: 0.3, cause: 'tử trận khi chống ma đạo' }); if (f.win) { g.fame(10); g.tinh(5); const m = 60 * (1 + g.P.realm); g.money(m); return `${f.text}\n\nPhòng tuyến giữ vững. Ngươi được các tông môn ghi công đầu. Danh vọng +10, linh thạch +${m}.`; } return `${f.text}\n\nPhòng tuyến vỡ một đoạn.`; } },
      { t: 'Nhập bọn ma đạo', if: g.P.path === 'ma' || g.P.tinh <= -30, go: (g) => { g.tinh(-10); g.fame(-5); const m = 120 * (1 + g.P.realm); g.money(m); const t = yrs3(g, 5); return `Ma đạo đón ngươi như khách quý. Ngươi được chia ${m} linh thạch và một phần huyết tinh. Tu vi +${t}. Chính đạo bắt đầu gọi tên ngươi với giọng căm hận.`; } },
      { t: 'Tránh xa chiến sự', go: (g) => { g.tinh(-2); return 'Ngươi đóng cửa bế quan. Khi ra ngoài, chiến sự đã qua.'; } },
    ],
  },
  {
    id: 'tieu_thien_kiep', w: 2, cd: 50, title: 'Tiểu thiên kiếp', r3: { realm: 4, age: 40 },
    auto: (g) => (xp3(0.55 + (st3(g, 'can') - 50) / 120 + (g.P.path === 'the' ? 0.2 : 0)) >= 0.65 ? 0 : g.P.eq.ao ? 'Dùng' : 'Bỏ'),
    text: () => 'Mây đen tụ lại trên đỉnh động phủ, sấm rền không dứt. Không phải lúc đột phá, nhưng trời đất vẫn ghen ghét kẻ tu hành quá nhanh: tiểu thiên kiếp đã tìm tới.',
    choices: (g) => {
      const pTank = xp3(0.55 + (st3(g, 'can') - 50) / 120 + (g.P.path === 'the' ? 0.2 : 0));
      return [
        { t: 'Lấy thân chịu sấm, mượn kiếp tôi luyện', p: pTank, go: (g) => { if (g.r.chance(pTank)) { g.stat('can', 5); g.P.fight += 0.018; const t = yrs3(g, 10); return `Chín đạo sấm đánh xuống, ngươi đứng vững tới đạo cuối cùng. Căn cốt +5, sức chiến đấu +2%, tu vi +${t}.`; } g.hurt(45, 'bị tiểu thiên kiếp đánh thành tro'); return 'Đạo sấm thứ bảy quật ngươi ngã xuống. Xương cốt rạn khắp người.'; } },
        { t: 'Dùng pháp bảo đỡ sấm', if: !!g.P.eq.ao, go: (g) => { g.hurt(12, 'chết dưới tiểu thiên kiếp'); const t = yrs3(g, 4); return `Y phục của ngươi cháy sém nhưng chặn được phần lớn sấm sét. Tu vi +${t}.`; } },
        { t: 'Bỏ động phủ chạy xa', go: (g) => { g.hurt(8, 'bị sét đánh khi chạy trốn'); return 'Sấm đuổi theo ngươi mấy chục dặm rồi tan. Động phủ cũ chỉ còn là đống đá.'; } },
      ];
    },
  },
  {
    id: 'truyen_y_bat', w: 3, cd: 999, once: true, title: 'Truyền y bát', r3: { realm: 2, age: 60 },
    when: (g) => g.P.age >= g.lifespan() * 0.85,
    bot: (g) => g.findBot((b, r) => r && r.met && r.v >= 30 && b.age < g.P.age * 0.6, 3),
    text: (g, { bot: b }) => `Thọ nguyên sắp cạn. Ngươi nghĩ tới ${b.name}, người hậu bối ngươi quý nhất. Cả đời tu hành, có nên trao lại cho ai không?`,
    choices: (g, { bot: b }) => [
      { t: `Truyền hết cho ${b.name}`, go: (g) => { g.relSet(b, 90, 'de_tu'); b.tuvi = Math.min(REALMS[b.realm].need, b.tuvi + REALMS[b.realm].need * 0.5); b.dao = true; g.tinh(8); g.stat('tam', 6); return `${b.name} quỳ ba ngày bên giường. Ngươi truyền lại công pháp và nửa đời tu vi. Người ấy sẽ nhớ ngươi, kể cả ở kiếp sau. Tâm tính +6.`; } },
      { t: 'Giữ lại, mang theo xuống mồ', go: (g) => { g.stat('tam', -3); return 'Ngươi chỉ nói với họ mấy câu xã giao rồi đóng cửa.'; } },
    ],
  },

  // ================= Con đường tu hành =================
  {
    id: 'kiem_y', w: 4, cd: 30, title: 'Kiếm ý bên thác', r3: { path: 'kiem', age: 20 },
    auto: () => 'Ngồi',
    text: () => 'Ngươi dừng chân bên một ngọn thác trăm trượng. Nước đổ xuống thẳng như một đường kiếm, không bao giờ ngừng.',
    choices: (g) => {
      const p = xp3(0.45 + (st3(g, 'ngo') - 50) / 100);
      return [
        { t: 'Ngồi xem thác suốt bảy ngày', p, go: (g) => { if (g.r.chance(p)) { g.P.fight += 0.03; g.stat('ngo', 2); return 'Ngày thứ bảy, ngươi rút kiếm chém một nhát. Thác nước đứt làm đôi trong một hơi thở. Kiếm ý đã thành. Sức chiến đấu +3%.'; } g.stat('ngo', 1); return 'Ngươi thấy nước, thấy đá, nhưng chưa thấy kiếm. Ngộ tính +1.'; } },
        { t: 'Luyện kiếm dưới thác trăm ngày', go: (g) => { g.stat('can', 3); const t = yrs3(g, 3); return `Thân thể chai sạn như đá. Căn cốt +3, tu vi +${t}.`; } },
      ];
    },
  },
  {
    id: 'do_hoa', w: 4, cd: 25, title: 'Độ hóa ma đầu', r3: { path: 'phat', age: 20 },
    bot: (g) => g.findBot((b, r) => b.dao && near3(g, b, 1) && (b.pers === 'cuong' || b.kills >= 2 || (r && r.v <= -30))),
    auto: () => 'Tụng',
    text: (g, { bot: b }) => `${g.nm(b)} giết người như ngóe, ${b.kills ? `trên tay đã có ${b.kills} mạng người` : 'tiếng ác vang khắp vùng'}. Người ấy chặn đường ngươi, cười khẩy: "Hòa thượng, ngươi định độ ta à?"`,
    choices: (g, { bot: b }) => {
      const p = xp3(0.35 + (st3(g, 'tam') - 50) / 100 + g.P.tinh / 300);
      return [
        { t: 'Tụng kinh độ hóa', p, go: (g) => { if (g.r.chance(p)) { g.relSet(b, 50); b.pers = 'hien'; g.tinh(10); g.fame(6); return `Tiếng kinh vang tới sáng. ${b.name} buông đao xuống, khóc như đứa trẻ. Từ nay người ấy không giết ai nữa. Danh vọng +6.`; } g.relAdd(b, -15); const f = g.fightBot(b); return `${b.name} cười lớn rồi rút đao.\n${f.text}`; } },
        { t: 'Dùng sức hàng ma', go: (g) => { const f = g.fightBot(b); if (f.win) { g.fame(4); return `${f.text}\n\nPhật cũng có lúc nổi giận.`; } return f.text; } },
      ];
    },
  },
  {
    id: 'phan_phe', w: 4, cd: 25, title: 'Ma công phản phệ', r3: { path: 'ma', age: 20 },
    auto: (g) => (xp3(0.45 + (st3(g, 'tam') - 50) / 100) >= 0.65 ? 0 : 'Tán'),
    text: () => 'Đêm trăng máu, ma công trong người bỗng chạy ngược. Huyết khí sôi trào, trước mắt toàn những khuôn mặt người đã chết dưới tay ngươi.',
    choices: (g) => {
      const p = xp3(0.45 + (st3(g, 'tam') - 50) / 100);
      return [
        { t: 'Dùng ý chí trấn áp', p, go: (g) => { if (g.r.chance(p)) { g.stat('tam', 4); const t = yrs3(g, 6); return `Ngươi nghiến răng tới sáng. Ma công thuần phục thêm một tầng. Tâm tính +4, tu vi +${t}.`; } g.hurt(30, 'ma công phản phệ, nổ tung kinh mạch'); return 'Một ngụm máu đen phun ra. Ngươi nằm liệt mấy tháng.'; } },
        { t: 'Huyết tế, lấy máu mình nuôi ma công', go: (g) => { g.hurt(20, 'chết vì huyết tế'); g.P.fight += 0.024; g.tinh(-6); return 'Máu chảy xuống pháp trận, ma công ăn no rồi ngủ. Sức chiến đấu +2,5%. Nhưng ngươi biết lần sau nó sẽ đói hơn.'; } },
        { t: 'Tán bớt công lực cho an toàn', go: (g) => { g.P.tuvi = Math.floor(g.P.tuvi * 0.8); g.stat('tam', 2); return 'Ngươi tự phế hai phần tu vi. Ma công yên lặng trở lại. Tu vi -20%.'; } },
      ];
    },
  },
  {
    id: 'loi_tri', w: 4, cd: 25, title: 'Lôi trì tôi thân', r3: { path: 'the', age: 20 },
    auto: () => 'Bỏ',
    text: () => 'Ngươi tìm thấy một hồ nước giữa núi, mặt nước lúc nào cũng lóe điện. Thể tu đời trước để lại lời: "Ngâm mình đủ ba ngày, thân như kim cương."',
    choices: (g) => {
      const p = xp3(0.5 + (st3(g, 'can') - 50) / 100);
      return [
        { t: 'Ngâm mình ba ngày ba đêm', p, go: (g) => { if (g.r.chance(p)) { g.stat('can', 6); g.P.fight += 0.024; return 'Da thịt nứt ra rồi lành lại, lần sau cứng hơn lần trước. Căn cốt +6, sức chiến đấu +2,5%.'; } g.hurt(35, 'bị lôi trì thiêu cháy'); return 'Ngày thứ hai ngươi bất tỉnh, bị dòng điện hất văng lên bờ.'; } },
        { t: 'Ngâm một canh giờ thử sức', go: (g) => { g.hurt(8, 'bị lôi trì thiêu cháy'); g.stat('can', 2); return 'Tê rần cả người. Căn cốt +2.'; } },
        { t: 'Bỏ đi', go: () => 'Chưa phải lúc.' },
      ];
    },
  },
  {
    id: 'tran_phap', w: 4, cd: 25, title: 'Trận pháp thượng cổ', r3: { path: 'tinh', age: 20 },
    auto: () => 'Chép',
    text: () => 'Trong một sơn cốc vắng, đá xếp thành một trận pháp khổng lồ, đến chim cũng không bay qua được. Giữa trận có một chiếc rương đá.',
    choices: (g) => {
      const p = xp3(0.4 + (st3(g, 'ngo') - 50) / 100);
      return [
        { t: 'Phá trận lấy rương', p, go: (g) => { if (g.r.chance(p)) { g.stat('ngo', 3); return `Ngươi tìm ra trận nhãn, nhẹ nhàng rút một viên đá. Cả trận tan như khói. Ngộ tính +3.\n${mats3(g, { linh_tinh: 2 * fr3(g) })}\n${item3(g, g.r.chance(0.3) ? 3 : 2, 'phu_kien', 'Trong rương có')}`; } g.hurt(25, 'bị trận pháp nghiền nát'); return 'Trận pháp phản kích, đá bay như mưa.'; } },
        { t: 'Ngồi chép lại trận đồ', go: (g) => { g.P.fight += 0.018; g.stat('ngo', 2); return 'Ngươi học được cách bày trận phòng thân. Sức chiến đấu +2%, ngộ tính +2.'; } },
      ];
    },
  },
  {
    id: 'thu_tien_hoa', w: 4, cd: 30, title: 'Linh thú tiến hóa', r3: { path: 'ngu_thu', age: 16 },
    when: (g) => !!g.P.flags.pet,
    auto: () => 'Để',
    text: (g) => `${g.P.flags.pet} mấy hôm nay ăn không ngon, cứ cuộn mình run rẩy, toàn thân nóng ran. Linh thú sắp tiến hóa. Nếu có linh khí trợ giúp, nó sẽ mạnh lên rất nhiều.`,
    choices: (g) => {
      const need = 2 * fr3(g);
      return [
        { t: `Cho ăn ${need} Linh tinh`, if: (g.P.mats.linh_tinh || 0) >= need, go: (g) => { g.P.mats.linh_tinh -= need; g.P.fight += 0.036; g.P.flags.petLv = (g.P.flags.petLv || 0) + 1; return `${g.P.flags.pet} nuốt hết linh tinh rồi lột xác. Thân hình to gấp rưỡi, mắt sáng như sao. Sức chiến đấu +3,5%.`; } },
        { t: 'Để nó tự vượt qua', go: (g) => { if (g.r.chance(0.6)) { g.P.fight += 0.018; return `Ba ngày sau ${g.P.flags.pet} tự tiến hóa thành công. Sức chiến đấu +2%.`; } return `${g.P.flags.pet} vượt qua cơn sốt nhưng không tiến hóa được. Lần sau vậy.`; } },
      ];
    },
  },

  // ================= Đời sống tông môn =================
  {
    id: 'dai_ty_thi', w: 3, cd: 10, title: 'Đại tỷ thí tông môn', r3: { sect: true, age: 14 },
    bot: (g) => g.findBot((b) => b.sect === g.P.sect && b.dao && near3(g, b, 1)),
    auto: (g, { bot: b }) => (g.winOdds(() => g.botFighter(b)) >= 0.55 ? 0 : 'Không'),
    text: (g, { bot: b }) => `${g.sect(g.P.sect).name} mở đại tỷ thí mười năm một lần. Ngươi bốc thăm gặp ${g.nm(b)}.\n\n${g.hintBot(b)}`,
    choices: (g, { bot: b }) => [
      { t: 'Lên đài', p: g.winOdds(() => g.botFighter(b)), go: (g) => { const f = g.fightBot(b, 1, { lethal: 0.03 }); if (f.win) { g.fame(5); const m = 50 * (1 + g.P.realm); g.money(m); g.relAdd(b, 4); return `${f.text}\n\nNgươi vào top đầu, được chưởng môn ban thưởng ${m} linh thạch.\n${item3(g, g.r.chance(0.3) ? 3 : 2, null, 'Phần thưởng')}`; } g.relAdd(b, 6); return `${f.text}\n\n${b.name} đỡ ngươi dậy: "Lần sau nhé."`; } },
      { t: 'Không tham gia', go: () => 'Ngươi ngồi dưới khán đài cắn hạt dưa.' },
    ],
  },
  {
    id: 'nhiem_vu_tong', w: 4, cd: 6, title: 'Nhiệm vụ tông môn', r3: { sect: true, age: 14 },
    auto: () => 'Thu',
    text: (g) => `Bảng nhiệm vụ của ${g.sect(g.P.sect).name} hôm nay có ba tờ mới.`,
    choices: (g) => {
      const m = g.monster(g.P.realm); m.pow *= 1.1;
      const pEsc = xp3(0.6 + (st3(g, 'co') - 50) / 150);
      return [
        { t: 'Diệt yêu thú quấy phá', p: odds3(g, m), go: (g) => { const f = g.fightMonster(m); if (f.win) { const r = 40 * (1 + g.P.realm); g.money(r); g.fame(2); return `${f.text}\n\nNộp đầu yêu thú, nhận ${r} linh thạch.`; } return f.text; } },
        { t: 'Hộ tống đệ tử mới xuống núi', p: pEsc, go: (g) => { if (g.r.chance(pEsc)) { g.money(25 * (1 + g.P.realm)); g.tinh(3); return `Chuyến đi bình an. Lũ đệ tử mới quý ngươi lắm. Linh thạch +${25 * (1 + g.P.realm)}.`; } g.hurt(15, 'chết khi hộ tống đệ tử'); return 'Gặp cướp giữa đường. Ngươi che cho lũ trẻ, nhận mấy nhát đao.'; } },
        { t: 'Thu hái dược liệu sau núi', go: (g) => { g.P.pills.hoi_xuan = (g.P.pills.hoi_xuan || 0) + 1; g.money(10 * (1 + g.P.realm)); return `Việc nhẹ, thưởng ít. Linh thạch +${10 * (1 + g.P.realm)}, thêm 1 viên Hồi Xuân Đan.`; } },
      ];
    },
  },
  {
    id: 'tranh_chuong_mon', w: 2, cd: 40, title: 'Tranh ngôi chưởng môn', r3: { sect: true, realm: 3, age: 40 },
    auto: (g, { bot: b }) => (g.winOdds(() => g.botFighter(b)) >= 0.6 ? 0 : 'Nhường'),
    when: (g) => g.P.flags.chuongMon !== g.P.sect,
    bot: (g) => { const m = g.members(g.P.sect).sort((a, b) => b.realm - a.realm || b.tuvi - a.tuvi)[0]; return m && m.realm <= g.P.realm + 1 ? m : null; },
    text: (g, { bot: b }) => `Chưởng môn cũ tọa hóa. Trong tông, người có tiếng nói nhất ngoài ngươi là ${g.nm(b)}. Hai phe đệ tử đã bắt đầu gườm nhau.\n\n${g.hintBot(b)}`,
    choices: (g, { bot: b }) => [
      { t: 'Tranh ngôi bằng một trận', p: g.winOdds(() => g.botFighter(b)), go: (g) => { const f = g.fightBot(b, 1, { lethal: 0.05 }); if (f.win) { g.P.flags.chuongMon = g.P.sect; g.fame(15); g.relAdd(b, -20); g.chron(`${g.fullName()} lên ngôi chưởng môn ${g.sect(g.P.sect).name}.`, 2); return `${f.text}\n\nNgươi lên ngôi chưởng môn ${g.sect(g.P.sect).name}. Danh vọng +15.`; } g.relAdd(b, 5); return `${f.text}\n\n${b.name} lên ngôi. Người ấy vẫn giữ ngươi làm trưởng lão.`; } },
      { t: `Nhường cho ${b.name}`, go: (g) => { g.relAdd(b, 30); g.tinh(5); g.stat('tam', 3); return `${b.name} nắm tay ngươi rất lâu. Tông môn không đổ máu. Tâm tính +3.`; } },
    ],
  },
  {
    id: 'phan_do', w: 3, cd: 20, title: 'Truy bắt phản đồ', r3: { sect: true, age: 16 },
    bot: (g) => g.findBot((b) => b.sect === g.P.sect && b.dao && near3(g, b, 1) && ['muu', 'tham', 'cuong'].includes(b.pers)),
    auto: (g, { bot: b }) => (g.winOdds(() => g.botFighter(b)) >= 0.6 ? 0 : 'Báo'),
    text: (g, { bot: b }) => `${g.nm(b)} trộm bí kíp trấn phái rồi bỏ trốn. Chưởng môn giao cho ngươi truy bắt.\n\n${g.hintBot(b)}`,
    choices: (g, { bot: b }) => [
      { t: 'Đuổi theo bắt về', p: g.winOdds(() => g.botFighter(b)), go: (g) => { const f = g.fightBot(b); if (f.win) { b.sect = null; g.relAdd(b, -40); g.fame(5); const sk = g.r.chance(0.5) ? g.learnRandom(2, 2) : ''; return `${f.text}\n\nNgươi giải ${b.name} về sơn môn. Chưởng môn cho ngươi đọc bí kíp một lần. ${sk}`; } return `${f.text}\n\n${b.name} trốn thoát.`; } },
      { t: 'Báo cho trưởng lão xử lý', go: () => 'Ngươi về báo tin. Nghe nói mấy tháng sau mới bắt được.' },
      { t: 'Lén thả đi', go: (g) => { b.sect = null; g.relAdd(b, 35); g.tinh(-2); return `${b.name} nhìn ngươi, không nói lời nào rồi biến mất. Món nợ này người ấy sẽ nhớ.`; } },
    ],
  },

  // ================= Thiên hạ (gắn với bot) =================
  {
    id: 'truy_than_khi', w: 1.5, cd: 40, title: 'Thần khí trong tay người khác', r3: { age: 20, realm: 1, minD: 2 },
    bot: (g) => g.findBot((b) => b.dao && b.gq >= 4 && b.tt && near3(g, b, 1)),
    auto: (g, { bot: b }) => (g.winOdds(() => g.botFighter(b)) >= 0.65 ? 0 : 'Kết giao'),
    text: (g, { bot: b }) => `Tin đồn khắp giang hồ: ${g.nm(b)} mang trên người thần khí có thần thông 「${TT_MAP[b.tt] ? TT_MAP[b.tt].n : ''}」. Ngươi vừa gặp người ấy ở quán trọ ven đường.\n\n${g.hintBot(b)}`,
    choices: (g, { bot: b }) => [
      { t: 'Đoạt lấy thần khí', p: g.winOdds(() => g.botFighter(b)), go: (g) => { const f = g.fightBot(b, 1, { lethal: g.botLethal(b) + 0.05 }); if (f.win) { const tt = b.tt; const slot = Object.keys(THAN_THONG).find((k) => THAN_THONG[k].some((x) => x.id === tt)) || 'vu_khi'; const it = makeItem(g.r, g.s.nextItem++, g.P.realm, 4, slot); it.tt = tt; b.gq = 2; b.tt = null; g.relSet(b, -70, 'thu'); g.fame(8); g._forging = true; const m = g.gainItem(it, `Đoạt được từ ${b.name}`); g._forging = false; return `${f.text}\n\n${m}\nTừ nay ${b.name} coi ngươi là kẻ thù không đội trời chung.`; } return `${f.text}\n\n${b.name} nhìn ngươi bằng ánh mắt lạnh băng.`; } },
      { t: 'Kết giao, mời một chén rượu', go: (g) => { g.relAdd(b, 18); return `Hai người uống tới khuya. ${b.name} cho ngươi xem thần khí, kể về trận chiến đoạt được nó.`; } },
      { t: 'Không dính vào', go: () => 'Thần khí là phúc hay họa, chỉ người mang nó biết.' },
    ],
  },
  {
    id: 'chon_phe', w: 2, cd: 30, title: 'Hai tông giao tranh', r3: { age: 18, realm: 1 },
    prep: (g) => { const ss = g.aliveSects().filter((s) => s.id !== g.P.sect); if (ss.length < 2) return null; const a = g.r.pick(ss); const b = g.r.pick(ss.filter((x) => x !== a)); return { a: a.id, b: b.id }; },
    auto: () => 'Đứng',
    text: (g, { data }) => `${g.sect(data.a).name} và ${g.sect(data.b).name} đánh nhau vì một mạch linh thạch. Cả hai bên đều gửi người tới mời ngươi.`,
    choices: (g, { data }) => {
      const side = (me, them) => (g) => { const foe = g.members(them).find((b) => near3(g, b, 1)); const f = foe ? g.fightBot(foe, 1, { lethal: 0.2 }) : g.fight('Đệ tử đối phương', pw3(g), 1, { lethal: 0.15 }); if (f.win) { const m = 80 * (1 + g.P.realm); g.money(m); g.fame(4); for (const b of g.members(me).slice(0, 4)) g.relAdd(b, 8); for (const b of g.members(them).slice(0, 4)) g.relAdd(b, -10); return `${f.text}\n\n${g.sect(me).name} thắng trận, chia cho ngươi ${m} linh thạch.`; } return f.text; };
      return [
        { t: `Giúp ${g.sect(data.a).name}`, go: side(data.a, data.b) },
        { t: `Giúp ${g.sect(data.b).name}`, go: side(data.b, data.a) },
        { t: 'Đứng ngoài', go: (g) => { g.stat('tam', 1); return 'Ngươi gửi thư chúc cả hai bên mạnh khỏe.'; } },
      ];
    },
  },
  {
    id: 'di_bao', w: 2, cd: 30, title: 'Dị bảo xuất thế', r3: { age: 18, realm: 1 },
    bot: (g) => g.findBot((b) => b.dao && near3(g, b, 1) && b.age >= 16),
    auto: (g, { bot: b }) => (g.winOdds(() => g.botFighter(b)) >= 0.65 ? 0 : 'Rút'),
    text: (g, { bot: b }) => `Đêm qua một cột sáng xuyên trời ở phía tây. Dị bảo xuất thế! Tu sĩ khắp nơi đổ về. Tới nơi, ngươi thấy ${g.nm(b)} cũng vừa tới.\n\n${g.hintBot(b)}`,
    choices: (g, { bot: b }) => [
      { t: 'Tranh đoạt', p: g.winOdds(() => g.botFighter(b)), go: (g) => { const f = g.fightBot(b, 1, { lethal: g.botLethal(b) }); if (f.win) { g.relAdd(b, -20); g.fame(5); return `${f.text}\n\n${item3(g, 3, null, 'Dị bảo')}\n${mats3(g, { linh_tinh: 2 * fr3(g) })}`; } g.relAdd(b, -10); return `${f.text}\n\n${b.name} cầm dị bảo bỏ đi.`; } },
      { t: `Rủ ${b.name} cùng chia`, go: (g) => { g.relAdd(b, 15); return `Hai người hợp sức phá phong ấn rồi chia đôi.\n${mats3(g, { linh_tinh: fr3(g), tinh_thiet: 4 * fr3(g) })}`; } },
      { t: 'Rút lui', go: () => 'Người tranh quá đông. Ngươi đứng trên đồi xa nhìn họ đánh nhau.' },
    ],
  },
  {
    id: 'thien_kieu_chien', w: 3, cd: 15, title: 'Khiêu chiến Bảng Thiên Kiêu', r3: { age: 20, realm: 2 },
    prep: (g) => { const rk = g.ranking(30); const i = rk.findIndex((x) => x.me); if (i <= 0) return null; const above = rk[i - 1]; return above && !above.me ? { foe: above.id, rank: i } : null; },
    auto: (g, { data }) => (g.winOdds(() => g.botFighter(g.soul(data.foe))) >= 0.6 ? 0 : 'Chưa'),
    text: (g, { data }) => { const b = g.soul(data.foe); return `Ngươi đang đứng hạng ${data.rank + 1} Bảng Thiên Kiêu. Ngay trên ngươi là ${g.nm(b)}. Người ấy gửi thư: "Nghe nói ngươi muốn chỗ của ta?"\n\n${g.hintBot(b)}`; },
    choices: (g, { data }) => {
      const b = g.soul(data.foe);
      return [
        { t: 'Nhận lời khiêu chiến', p: g.winOdds(() => g.botFighter(b)), go: (g) => { const f = g.fightBot(b, 1, { lethal: 0.08 }); if (f.win) { g.fame(10); b.tuvi *= 0.85; g.relAdd(b, -8); return `${f.text}\n\nCả giang hồ bàn tán. Danh vọng +10.`; } g.fame(-2); return f.text; } },
        { t: 'Chưa phải lúc', go: () => 'Ngươi gửi thư lại: "Mười năm nữa."' },
      ];
    },
  },

  // ================= Tuổi thơ =================
  {
    id: 'truong_lang', w: 5, cd: 99, once: true, title: 'Trường làng', r3: { age: 5, child: true },
    when: (g) => g.P.age <= 10,
    auto: () => 'Chăm',
    text: () => 'Ông đồ già mở lớp dạy chữ trong đình làng. Bọn trẻ ngồi xếp hàng trên chiếu, đứa nào cũng ngáp.',
    choices: () => [
      { t: 'Chăm chỉ học chữ', go: (g) => { g.stat('ngo', 4); return 'Ông đồ khen ngươi viết chữ đẹp nhất lớp. Ngộ tính +4.'; } },
      { t: 'Trốn học đi bắt dế', go: (g) => { g.stat('co', 3); return 'Ngươi bắt được con dế chọi to nhất làng, đổi được ba cái kẹo. Cơ duyên +3.'; } },
      { t: 'Đánh nhau với thằng to xác nhất lớp', go: (g) => { g.stat('can', 3); g.hurt(4, 'ngã gãy cổ khi đánh nhau'); return 'Sứt môi, nhưng từ đó không đứa nào dám bắt nạt ngươi. Căn cốt +3.'; } },
    ],
  },
  {
    id: 'chim_non', w: 4, cd: 99, once: true, title: 'Chim non rơi tổ', r3: { age: 3, child: true },
    when: (g) => g.P.age <= 9,
    auto: () => 'Trả',
    text: () => 'Sau cơn giông, ngươi nhặt được một con chim non rơi khỏi tổ, lông còn ướt, kêu chiêm chiếp.',
    choices: () => [
      { t: 'Đem về nuôi', go: (g) => { g.tinh(4); if (g.r.chance(0.15)) { g.P.flags.petEgg = true; return 'Ngươi bón cho nó từng hạt gạo. Lớn lên, nó cứ quanh quẩn bên nhà không chịu đi. Lông nó ánh lên màu xanh lạ lắm.'; } return 'Ngươi nuôi nó ba tháng, rồi một sáng nó bay đi. Ngươi khóc cả buổi.'; } },
      { t: 'Trèo cây trả về tổ', go: (g) => { g.stat('co', 2); g.tinh(2); return 'Chim mẹ kêu inh ỏi rồi đậu xuống vai ngươi một lúc. Cơ duyên +2.'; } },
    ],
  },
  {
    id: 'hoi_lang', w: 4, cd: 4, title: 'Hội làng mùa xuân', r3: { age: 6, child: true },
    when: (g) => g.P.age <= 13,
    auto: () => 'Xem',
    text: () => 'Hội xuân, cả làng đổ ra bãi đất trống. Bên này múa lân, bên kia thi vật, đầu đình có ông đồ ra câu đố treo thưởng.',
    choices: () => [
      { t: 'Xem múa lân', go: (g) => { g.stat('tam', 2); return 'Tiếng trống làm lòng ngươi rộn ràng cả ngày. Tâm tính +2.'; } },
      { t: 'Vào sới thi vật', p: 0.5, go: (g) => { if (g.r.chance(0.5)) { g.stat('can', 2); g.money(5); return 'Ngươi quật ngã ba đứa lớn hơn, được thưởng 5 linh thạch. Căn cốt +2.'; } return 'Bị quật ngã ngay ván đầu, cả làng cười ồ.'; } },
      { t: 'Giải câu đố treo thưởng', p: 0.5, go: (g) => { if (g.r.chance(0.5)) { g.stat('ngo', 2); g.money(5); return 'Ngươi giải được câu đố mà người lớn chịu thua. Ngộ tính +2, thưởng 5 linh thạch.'; } return 'Nghĩ nát óc vẫn không ra. Đêm về nằm mơ thấy câu đố.'; } },
    ],
  },

  // ================= Tuổi già =================
  {
    id: 'di_thu', w: 4, cd: 999, once: true, title: 'Viết di thư', r3: { age: 40 },
    when: (g) => g.P.age >= g.lifespan() * 0.9,
    auto: () => 'Viết',
    text: () => 'Đêm khuya, ngươi thắp đèn, mài mực. Thọ nguyên không còn nhiều. Có những điều nên viết lại.',
    choices: (g) => [
      { t: 'Viết thư cho những người thân', if: g.closeFriends().length > 0, go: (g) => { for (const { b } of g.closeFriends().slice(0, 5)) g.relAdd(b, 10); g.tinh(6); g.stat('tam', 5); return 'Mỗi lá thư một câu chuyện. Viết xong, trời đã sáng. Lòng nhẹ như mây. Tâm tính +5.'; } },
      { t: 'Ghi lại tâm đắc tu luyện', go: (g) => { g.stat('ngo', 4); g.s.honLuc = (g.s.honLuc || 0) + 5; return 'Viết ra mới thấy mình hiểu sai bao nhiêu chỗ. Ngộ tính +4. Linh hồn khắc ghi được thêm một chút: Hồn Lực +5.'; } },
      { t: 'Đốt hết giấy, đi ngủ', go: (g) => { g.stat('tam', 2); return 'Đời người như giấc mộng, viết làm gì. Tâm tính +2.'; } },
    ],
  },
  {
    id: 'truyen_nghe', w: 3, cd: 25, title: 'Truyền nghề cho hậu bối', r3: { age: 50, realm: 1 },
    when: (g) => g.P.age >= g.lifespan() * 0.6,
    bot: (g) => g.findBot((b, r) => b.age >= 8 && b.age <= 20 && b.realm < g.P.realm && !(r && r.tag)),
    auto: () => 'Dạy',
    text: (g, { bot: b }) => `Một đứa trẻ tên ${b.name} ngày nào cũng đứng ngoài hàng rào xem ngươi luyện công, hỏi gì cũng không chịu về.`,
    choices: (g, { bot: b }) => [
      { t: 'Dạy nó vài đường', go: (g) => { g.relSet(b, 55, 'de_tu'); b.dao = true; g.tinh(5); return `${b.name} học như bọt biển hút nước. Ngươi thấy trong nó hình bóng của mình hồi trẻ.`; } },
      { t: 'Đuổi về', go: (g) => { g.relAdd(b, -5); return 'Đứa trẻ cúi đầu đi về. Hôm sau nó lại đứng đó.'; } },
    ],
  },

  // ================= Bế quan =================
  {
    id: 'quay_be_quan', w: 3, cd: 15, inClosed: true, title: 'Tiếng gõ ngoài động phủ', r3: { age: 14, realm: 1 },
    auto: () => 'Mặc',
    text: () => 'Đang lúc nhập định, có tiếng đập cửa động phủ ầm ầm. Ai đó gọi tên ngươi, giọng hoảng hốt.',
    choices: (g) => [
      { t: 'Ra ngoài xem chuyện gì', go: (g) => { if (g.r.chance(0.5)) { g.tinh(5); g.fame(2); return 'Làng dưới núi bị cướp. Ngươi đuổi được bọn cướp, dân làng mang gà vịt lên tạ ơn.'; } const f = g.fight('Kẻ phá động phủ', pw3(g) * 0.9, 1, { lethal: 0.15 }); return `Là kẻ thù cũ dụ ngươi ra ngoài.\n${f.text}`; } },
      { t: 'Mặc kệ, tiếp tục nhập định', p: xp3(0.6 + (st3(g, 'tam') - 50) / 120), go: (g) => { if (g.r.chance(xp3(0.6 + (st3(g, 'tam') - 50) / 120))) { g.stat('tam', 3); return 'Tiếng đập cửa xa dần. Tâm ngươi như mặt hồ không gợn sóng. Tâm tính +3.'; } g.hurt(12, 'tẩu hỏa nhập ma khi bế quan'); return 'Tâm bị loạn, khí chạy sai đường. Ngươi phun ra một ngụm máu.'; } },
    ],
  },
  {
    id: 'ngo_be_quan', w: 3, cd: 20, inClosed: true, title: 'Ngộ đạo khi tu luyện', r3: { age: 14, realm: 1 },
    auto: () => 'Ổn',
    text: () => 'Tu luyện đã bao năm, ngươi cũng không nhớ nữa. Bỗng một tia linh quang lóe lên trong đầu, như có ai đẩy cánh cửa bấy lâu đóng chặt.',
    choices: (g) => {
      const p = xp3(0.55 + (st3(g, 'ngo') - 50) / 100);
      return [
        { t: 'Thả mình theo cảm ngộ', p, go: (g) => { if (g.r.chance(p)) { const t = yrs3(g, 10); g.stat('ngo', 2); return `Linh quang hóa thành dòng sông. Ngươi trôi theo nó, tỉnh dậy tu vi đã tăng vọt. Tu vi +${t}, ngộ tính +2.`; } g.hurt(18, 'tẩu hỏa nhập ma khi bế quan'); return 'Cảm ngộ quá mạnh, kinh mạch không chịu nổi.'; } },
        { t: 'Ổn định tâm thần, từ từ tiêu hóa', go: (g) => { const t = yrs3(g, 4); return `Ngươi chỉ giữ lại một phần cảm ngộ, nhưng chắc chắn. Tu vi +${t}.`; } },
      ];
    },
  },

  // ================= Chuỗi: Huyết án trấn Thanh Thạch =================
  {
    id: 'huyet_an_1', w: 2, cd: 80, title: 'Huyết án trấn Thanh Thạch', r3: { place: 'thanh', age: 16, plane: 0 },
    auto: () => 'Báo',
    text: () => 'Sáng sớm, cả trấn xôn xao: nhà họ Lâm bảy người chết không một vết thương, mặt ai cũng trắng bệch như bị hút hết máu. Quan phủ đóng cửa nha môn không dám điều tra.',
    choices: (g) => {
      const p = xp3(0.5 + (st3(g, 'ngo') - 50) / 100);
      return [
        { t: 'Tự mình điều tra', p, go: (g) => { if (g.r.chance(p)) { g.later(g.r.int(1, 2), 'huyet_an_2'); g.stat('ngo', 2); return 'Ngươi tìm thấy dưới gầm giường một vảy đỏ như máu, và dấu chân dẫn về phía nghĩa địa ngoài trấn. Ngộ tính +2.\n\n(Chuyện này chưa kết thúc.)'; } return 'Ngươi lục khắp nhà mà không thấy gì lạ. Có lẽ kẻ ra tay rất cẩn thận.'; } },
        { t: 'Báo lên tông môn gần nhất', go: (g) => { g.fame(1); return 'Tông môn hứa sẽ cử người tới. Ngươi không biết họ có tới thật không.'; } },
        { t: 'Rời trấn ngay trong ngày', go: (g) => { g.tinh(-2); return 'Đêm đó, thêm một nhà nữa chết.'; } },
      ];
    },
  },
  {
    id: 'huyet_an_2', queued: true, w: 1, title: 'Nghĩa địa ngoài trấn',
    auto: (g) => (g.winOdds(() => g.genericFighter('Huyết y nhân', pw3(g))) >= 0.6 ? 0 : 'Lặng'),
    text: () => 'Ngươi rình ở nghĩa địa ba đêm. Đêm thứ ba, một bóng người áo đỏ dắt theo đứa bé đi vào một ngôi mộ mới đào. Đứa bé đi như người mộng du.',
    choices: (g) => {
      const pStealth = xp3(0.55 + (st3(g, 'co') - 50) / 120);
      return [
        { t: 'Xông ra cứu đứa bé ngay', go: (g) => { const f = g.fight('Huyết y nhân', pw3(g) * 1.0, 1, { lethal: 0.25, cause: 'bị huyết ma hút cạn máu' }); if (f.win) { g.tinh(8); g.later(g.r.int(1, 3), 'huyet_an_3'); return `${f.text}\n\nKẻ áo đỏ bị thương, bỏ chạy, để lại một lệnh bài khắc chữ "Huyết Sát". Đứa bé được cứu.\n\n(Phía sau kẻ này còn có người.)`; } return `${f.text}\n\nKẻ áo đỏ dắt đứa bé biến mất trong sương.`; } },
        { t: 'Lặng lẽ bám theo xem hang ổ', p: pStealth, go: (g) => { if (g.r.chance(pStealth)) { g.later(1, 'huyet_an_3', { known: true }); return 'Ngôi mộ là lối vào một địa đạo. Ngươi đã biết hang ổ của chúng.\n\n(Phải chuẩn bị kỹ trước khi quay lại.)'; } g.hurt(15, 'bị huyết ma phát hiện'); return 'Ngươi giẫm phải một cành khô. Kẻ áo đỏ quay lại, tung một chưởng vào ngực ngươi.'; } },
      ];
    },
  },
  {
    id: 'huyet_an_3', queued: true, w: 1, title: 'Hang ổ Huyết Sát',
    auto: (g, { data }) => (g.winOdds(() => g.genericFighter('Huyết Sát lão ma', pw3(g) * (data.known ? 1.15 : 1.35))) >= 0.6 ? 0 : 'Lén'),
    text: (g, { data }) => `${data.known ? 'Ngươi lần theo địa đạo đã dò được.' : 'Lần theo lệnh bài Huyết Sát, ngươi tìm tới một hang đá.'} Bên trong là một huyết trì, mười mấy đứa trẻ bị trói quanh bờ. Ngồi giữa huyết trì là lão ma đầu tóc bạc, mắt đỏ như than.`,
    choices: (g, { data }) => {
      const boss = pw3(g) * (data.known ? 1.15 : 1.35);
      return [
        { t: 'Quyết chiến với lão ma', p: g.winOdds(() => g.genericFighter('Huyết Sát lão ma', boss)), go: (g) => { const f = g.fight('Huyết Sát lão ma', boss, 1, { lethal: 0.4, cause: 'chết trong hang ổ Huyết Sát' }); if (f.win) { g.fame(15); g.tinh(12); const t = yrs3(g, 8); g.chron(`${g.fullName()} một mình diệt trừ Huyết Sát lão ma, cứu mười mấy đứa trẻ trấn Thanh Thạch.`, 2); return `${f.text}\n\nHuyết trì cạn khô. Ngươi cõng từng đứa trẻ ra ngoài dưới ánh bình minh. Danh vọng +15, tu vi +${t}.\n${item3(g, 3, null, 'Kho của lão ma có')}`; } return `${f.text}\n\nNgươi chỉ kịp cắt dây cho mấy đứa trẻ chạy thoát.`; } },
        { t: 'Lén cứu bọn trẻ rồi rút', p: xp3(0.5 + (st3(g, 'co') - 50) / 100), go: (g) => { if (g.r.chance(xp3(0.5 + (st3(g, 'co') - 50) / 100))) { g.tinh(10); g.fame(6); return 'Ngươi cắt dây từng đứa, dắt chúng men theo vách đá ra ngoài. Lão ma không hề hay biết. Danh vọng +6.'; } g.hurt(25, 'bị lão ma phát hiện'); return 'Một đứa trẻ khóc thét. Lão ma mở mắt.'; } },
      ];
    },
  },

  // ================= Chuỗi: Lời hẹn trăm năm =================
  {
    id: 'loi_hen_1', w: 2, cd: 80, once: true, title: 'Lời hẹn dưới gốc đào', r3: { age: 18 },
    bot: (g) => g.findBot((b, r) => r && r.met && r.v >= 45 && b.dao),
    text: (g, { bot: b }) => `Đêm trước khi chia tay, ${b.name} và ngươi ngồi dưới gốc đào già. Người ấy bảo: "Đường tu dài lắm. Mai này dù ở đâu, trăm năm nữa ta gặp lại ở đây nhé?"`,
    choices: (g, { bot: b }) => [
      { t: 'Ngoéo tay hẹn ước', go: (g) => { const r = g.rel(b); g.relAdd(b, 15); r.hen = g.s.year; g.later(g.r.int(25, 45), 'loi_hen_2', { bid: b.id, name: b.name }); g.tinh(5); return 'Hai người khắc tên lên thân cây. Gió thổi, hoa đào rơi đầy vai.'; } },
      { t: 'Cười: "Ai mà biết trăm năm"', go: (g) => { g.relAdd(b, -5); return `${b.name} cười theo, nhưng mắt hơi buồn.`; } },
    ],
  },
  {
    id: 'loi_hen_2', queued: true, w: 1, title: 'Gốc đào năm ấy',
    text: (g, { data }) => { const b = g.soul(data.bid); return `Ngươi quay lại gốc đào. Cây đã già hơn, tên hai người khắc năm xưa đã mờ. ${b && b.alive && b.name === data.name ? `${b.name} đang ngồi đó, tóc đã khác, nhưng nụ cười vẫn vậy.` : `Chỉ có gió. ${data.name} đã không còn trên đời.`}`; },
    choices: (g, { data }) => { const b = g.soul(data.bid); return (b && b.alive && b.name === data.name
      ? [
        { t: 'Ôm lấy cố nhân', go: (g) => { g.relAdd(b, 25); g.tinh(10); g.stat('tam', 6); return `Hai người kể cho nhau nghe mấy chục năm. Trước khi đi, ${b.name} nói: "Kiếp sau, ta cũng sẽ tìm ngươi." Tâm tính +6.`; } },
        { t: 'Cùng luyện công một trận như xưa', go: (g) => { g.relAdd(b, 15); const t = yrs3(g, 5); return `Kiếm qua kiếm lại tới tối, như hồi còn trẻ. Tu vi +${t}.`; } },
      ]
      : [
        { t: 'Ngồi đợi tới sáng', go: (g) => { g.stat('tam', 5); g.tinh(8); return 'Ngươi đợi tới khi trăng lặn. Ngươi khắc thêm một dòng lên thân cây, cho người không còn tới được nữa. Tâm tính +5.'; } },
      ]); },
  },
];

const fmt3 = (n) => Math.floor(n).toLocaleString('vi-VN');
