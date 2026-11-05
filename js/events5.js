// Kỳ ngộ đợt 5: chỉ xảy ra khi Tu luyện (nhóm 'tu'). Toàn chuyện nội tu: đốn ngộ, linh khí, tẩu hỏa, kinh mạch, thần thức, dị tượng.
import { CHAPTER_MAP, CHAPTER_RANK, BRANCHES } from './fate.js';
import { REALMS } from './data.js';

const xp5 = (p) => Math.max(0.05, Math.min(0.95, p));
const st5 = (g, k) => g.P.stats[k];
const yrs5 = (g, n) => g.addTuvi(g.gain() * n * 0.6);

export const EVENTS5 = [
  {
    id: 'don_ngo', pool: 'tu', w: 3, cd: 18, title: 'Đốn ngộ', r3: { age: 12, realm: 1 },
    auto: () => 0,
    text: () => 'Giữa lúc vận công, một câu khẩu quyết đọc trăm lần bỗng sáng rõ như lần đầu được nghe. Ngươi thấy mình đứng trước một cánh cửa hé mở.',
    choices: (g) => {
      const p = xp5(0.5 + (st5(g, 'ngo') - 50) / 90);
      return [
        { t: 'Dồn hết tâm thần tham ngộ', p, go: (g) => { if (g.r.chance(p)) { g.addSP(2); const t = yrs5(g, 6); g.stat('ngo', 1); return `Cánh cửa mở toang. Ngươi ngồi bất động bảy ngày bảy đêm. Ngộ đạo điểm +2, tu vi +${t}, ngộ tính +1.`; } const t = yrs5(g, 2); return `Cửa khép lại trước khi ngươi kịp bước qua, chỉ kịp ghi nhớ một chút. Tu vi +${t}.`; } },
        { t: 'Ghi lại cảm ngộ, từ từ suy ngẫm', go: (g) => { const t = yrs5(g, 3); g.firm(g.gain() * 3); return `Ngươi chép cảm ngộ vào ngọc giản, mỗi ngày đọc lại một lần. Tu vi +${t}, căn cơ vững hơn.`; } },
      ];
    },
  },
  {
    id: 'linh_khi_trieu', pool: 'tu', w: 3, cd: 12, title: 'Linh khí triều dâng', r3: { age: 10 },
    auto: () => 1,
    text: () => 'Đêm nay linh khí trời đất dâng lên như thủy triều, tràn vào động phủ cuồn cuộn. Hiếm có dịp thế này, nhưng nuốt quá nhiều thì kinh mạch khó chịu nổi.',
    choices: (g) => {
      const p = xp5(0.55 + (st5(g, 'can') - 50) / 100);
      return [
        { t: 'Há miệng nuốt trọn', p, go: (g) => { if (g.r.chance(p)) { const t = yrs5(g, 10); return `Linh khí ào vào đan điền, cuộn thành xoáy. Tu vi +${t}, nhưng phần lớn chưa vững.`; } const t = yrs5(g, 4); if (g.hurt(18, 'nuốt quá nhiều linh khí, nổ tung kinh mạch')) return 'Kinh mạch vỡ nát.'; return `Kinh mạch căng như dây đàn rồi rách một đường. Tu vi +${t}, nhưng bị nội thương.`; } },
        { t: 'Hấp thu vừa sức', go: (g) => { const t = yrs5(g, 5); g.firm(g.gain() * 4); return `Ngươi chỉ lấy phần vừa đủ, luyện hóa từng tia. Tu vi +${t}, căn cơ vững.`; } },
      ];
    },
  },
  {
    id: 'tau_hoa', pool: 'tu', w: (g) => 1.5 + Math.max(0, g.P.sat - 30) / 15, cd: 15, title: 'Tẩu hỏa nhập ma', r3: { age: 14, realm: 1 },
    auto: (g) => (g.P.pills.hoi_xuan > 0 ? 2 : 1),
    text: (g) => `Chân khí đột nhiên chạy ngược, nóng rát như lửa đốt từ đan điền lên tới đỉnh đầu.${g.P.sat >= 40 ? ' Sát khí tích tụ bấy lâu thừa cơ quấy phá.' : ''} Phải xử lý ngay.`,
    choices: (g) => {
      const p = xp5(0.5 + (st5(g, 'tam') - 50) / 90 - Math.max(0, g.P.sat - 40) / 200);
      return [
        { t: 'Cưỡng ép áp chế', p, go: (g) => { if (g.r.chance(p)) { g.stat('tam', 2); g.purgeSat(10); return 'Ngươi cắn răng dẫn chân khí về đúng đường. Tâm tính +2, sát khí tan bớt.'; } if (g.hurt(28, 'tẩu hỏa nhập ma, chân khí đốt cháy kinh mạch')) return 'Chân khí bùng nổ.'; return 'Áp chế không nổi, ngươi phun ra một ngụm máu đen. Bị trọng thương.'; } },
        { t: 'Tán bớt công lực cho an toàn', go: (g) => { const lost = Math.floor(g.P.tuvi * 0.12); g.P.tuvi -= lost; g.purgeSat(5); return `Ngươi chủ động xả bớt chân khí ra ngoài. Mất ${lost.toLocaleString('vi-VN')} tu vi nhưng giữ được an toàn.`; } },
        { t: 'Uống Hồi Xuân Đan trấn áp', if: g.P.pills.hoi_xuan > 0, go: (g) => { g.P.pills.hoi_xuan--; g.stat('tam', 1); return 'Dược lực mát lạnh lan khắp kinh mạch, lửa trong người tắt dần. Mất một viên Hồi Xuân Đan.'; } },
      ];
    },
  },
  {
    id: 'kinh_mach_tac', pool: 'tu', w: 2, cd: 20, title: 'Kinh mạch tắc nghẽn', r3: { age: 12 },
    auto: () => 1,
    text: () => 'Có một đoạn kinh mạch ở cánh tay trái mãi không thông, linh khí tới đó lại dội ngược về. Đã mấy năm rồi.',
    choices: (g) => {
      const p = xp5(0.5 + (st5(g, 'can') - 50) / 80);
      return [
        { t: 'Dồn chân khí xung phá', p, go: (g) => { if (g.r.chance(p)) { g.stat('can', 2); g.P.brkBonus = Math.max(g.P.brkBonus || 0, 0.1); return 'Một tiếng "bục" nhỏ, linh khí chảy thông suốt. Căn cốt +2, lần đột phá tới +10%.'; } if (g.hurt(16, 'xung phá kinh mạch thất bại')) return 'Kinh mạch đứt lìa.'; return 'Kinh mạch không thông mà còn rách thêm. Bị thương.'; } },
        { t: 'Kiên nhẫn ôn dưỡng', go: (g) => { const t = yrs5(g, 2); g.firm(g.gain() * 3); return `Ngươi dùng linh khí ấm áp tưới dần từng ngày. Tu vi +${t}, căn cơ vững hơn.`; } },
      ];
    },
  },
  {
    id: 'than_thuc', pool: 'tu', w: 2, cd: 25, title: 'Thần thức xuất khiếu', r3: { age: 20, realm: 3 },
    auto: () => 1,
    text: () => 'Đang nhập định, thần thức ngươi bỗng nhẹ bẫng rồi bay ra khỏi thân thể. Nhìn xuống thấy chính mình ngồi bất động, nhìn ra xa thấy núi sông vạn dặm.',
    choices: (g) => {
      const p = xp5(0.55 + (st5(g, 'ngo') - 50) / 100);
      return [
        { t: 'Ngao du thật xa', p, go: (g) => { if (g.r.chance(p)) { g.addSP(1); g.stat('ngo', 2); g.fame(2); return 'Thần thức lướt qua trăm ngọn núi, thấy một lão tăng đang giảng kinh. Ngươi nghe trộm được nửa bài. Ngộ đạo điểm +1, ngộ tính +2.'; } if (g.hurt(20, 'thần thức đi quá xa, không tìm được đường về')) return 'Thần thức lạc mất.'; return 'Gió âm thổi tan một phần thần thức, ngươi giật mình tỉnh dậy, đầu đau như búa bổ.'; } },
        { t: 'Quay về ngay', go: (g) => { g.stat('tam', 2); const t = yrs5(g, 2); return `Ngươi biết điểm dừng. Tâm tính +2, tu vi +${t}.`; } },
      ];
    },
  },
  {
    id: 'di_tuong', pool: 'tu', w: 2, cd: 30, title: 'Thiên địa dị tượng', r3: { age: 16, realm: 2 },
    auto: (g) => (g.P.tuvi >= g.need() * 0.7 ? 0 : 1),
    text: () => 'Trên trời mây ngũ sắc cuộn thành vòng xoáy ngay trên đỉnh động phủ, linh khí bốn phương đổ về. Người đời gọi đây là dị tượng, trăm năm khó gặp một lần.',
    choices: (g) => {
      const ready = g.P.tuvi >= g.need() * 0.7;
      return [
        { t: ready ? 'Mượn dị tượng chuẩn bị đột phá' : 'Mượn dị tượng (tu vi chưa tới 70%)', go: (g) => { if (g.P.tuvi >= g.need() * 0.7) { g.P.brkBonus = Math.max(g.P.brkBonus || 0, 0.2); const t = yrs5(g, 3); return `Ngươi đem dị tượng khắc vào tâm. Lần đột phá tới +20%, tu vi +${t}.`; } const t = yrs5(g, 4); return `Tu vi còn non, ngươi chỉ hấp thu được linh khí. Tu vi +${t}.`; } },
        { t: 'Ngồi xem, lĩnh hội lẽ trời đất', go: (g) => { g.stat('ngo', 2); g.stat('tam', 1); const t = yrs5(g, 3); return `Mây tan, ngươi vẫn ngồi đó, trong lòng sáng tỏ. Ngộ tính +2, tâm tính +1, tu vi +${t}.`; } },
      ];
    },
  },

  // ================= Túc địch: ba lần gặp, lần cuối là quyết chiến =================
  {
    id: 'tuc_dich_1', queued: true, pool: 'doi', title: 'Kẻ tranh cơ duyên',
    text: (g, { bot: b }) => `Trong khe núi mọc một gốc linh dược ngàn năm. Ngươi vừa đưa tay thì một bóng người lao tới trước: ${b.name} (${g.botRealmN(b)}). Hắn cười lạnh: "Thứ này của ta. Cút."\n\nTừ giây phút ấy, ngươi biết người này sẽ là ${g.nemTitle()} của mình.\n\n${g.oddsText(g.nemOdds(b, 1.25), 0.02, 0)}`,
    choices: (g, { bot: b }) => {
      const po = g.nemOdds(b, 1.25);
      const pm = xp5(0.4 + (st5(g, 'co') - 50) / 100);
      return [
        { t: 'Ra tay tranh đoạt', p: po, go: (g) => { const f = g.nemFight(b, 1.25, 0.02); if (f.win) { const t = yrs5(g, 6); g.fame(5); g.nemStep(b, 1); return `${f.text}\n\nNgươi đoạt được linh dược. Tu vi +${t}, danh vọng +5. ${b.name} lau máu khóe miệng: "Ta nhớ mặt ngươi."`; } g.nemStep(b, 1, true); return `${f.text}\n\n${b.name} cầm linh dược bỏ đi, không thèm quay đầu.`; } },
        { t: 'Dùng mưu đánh lạc hướng', p: pm, go: (g) => { if (g.r.chance(pm)) { const t = yrs5(g, 5); g.nemStep(b, 1); return `Ngươi ném hòn đá về phía bụi rậm, hắn quay đầu, ngươi đã ngắt xong linh dược. Tu vi +${t}. Hắn gào lên tên ngươi giữa rừng.`; } g.hurt(15, `bị ${b.name} đánh chết`); g.nemStep(b, 1, true); return 'Hắn không mắc lừa, một chưởng đánh ngươi văng ra. Bị thương.'; } },
        { t: 'Nhường, ngày dài còn gặp', go: (g) => { g.stat('tam', 2); g.nemStep(b, 1, true); return `Ngươi lùi lại. ${b.name} cười khẩy, cầm linh dược đi. Tâm tính +2, nhưng hắn sẽ còn mạnh hơn.`; } },
      ];
    },
  },
  {
    id: 'tuc_dich_2', queued: true, pool: 'doi', title: 'Mối thù sâu thêm',
    text: (g, { bot: b }) => `${b.name} (${g.botRealmN(b)}) lại xuất hiện. ${g.nemHarm(b)}\n\n${g.oddsText(g.nemOdds(b, 1.2), 0.03, 0)}`,
    choices: (g, { bot: b }) => {
      const po = g.nemOdds(b, 1.2);
      return [
        { t: 'Đòi lại công đạo', p: po, go: (g) => { const f = g.nemFight(b, 1.2, 0.03); if (f.win) { g.fame(10); g.addSP(1); g.nemStep(b, 2); return `${f.text}\n\nGiang hồ đồn ầm lên. Danh vọng +10, ngộ đạo điểm +1. ${b.name} bỏ chạy, để lại một câu: "Lần sau, một trong hai ta phải chết."`; } g.nemStep(b, 2, true); const m = Math.floor(g.P.money * 0.3); g.money(-m); return `${f.text}\n\nNgươi thua, mất ${m.toLocaleString('vi-VN')} linh thạch. Hắn mạnh hơn ngươi nghĩ.`; } },
        { t: 'Nhẫn nhịn, khổ luyện chờ ngày', go: (g) => { g.stat('tam', 3); g.nemStep(b, 2, true); return 'Ngươi nuốt cục tức vào bụng. Tâm tính +3. Đêm ấy ngươi luyện công tới sáng.'; } },
      ];
    },
  },
  {
    id: 'tuc_dich_3', queued: true, pool: 'doi', title: 'Quyết chiến',
    text: (g, { bot: b }) => `Thư khiêu chiến cắm trên cửa động phủ, chữ viết bằng máu: "Đỉnh núi Vọng Nguyệt. Một người đi xuống."\n\n${b.name} đã tu tới ${g.botRealmN(b)}. Đây là trận quyết định giữa hai người. Thua có thể mất mạng.\n\n${g.oddsText(g.nemOdds(b, 1.2), 0.1, 0)}`,
    choices: (g, { bot: b }) => {
      const po = g.nemOdds(b, 1.2);
      const pf = xp5(0.5 + (st5(g, 'co') - 50) / 120);
      return [
        { t: 'Lên núi quyết chiến', p: po, go: (g) => { const f = g.nemFight(b, 1.2, 0.1); if (f.win) return `${f.text}\n\n${g.nemWin(b)}`; if (!g.playing) return f.text; return `${f.text}\n\n${g.nemLose(b)}`; } },
        { t: 'Không đến, ẩn mình chờ thời', p: pf, go: (g) => { if (g.r.chance(pf)) { g.nemDelay(25); return 'Ngươi đóng cửa động phủ. Hắn chờ ba ngày rồi bỏ đi, nhưng thư khiêu chiến sẽ còn quay lại.'; } g.fame(-15); g.nemDelay(15); return 'Cả giang hồ biết ngươi không dám ra mặt. Danh vọng -15. Hắn sẽ còn tìm tới.'; } },
      ];
    },
  },
  // ================= Chương mười năm =================
  {
    id: 'chuong', queued: true, pool: 'doi', title: (g) => `Chương mới · ${g.P.age} tuổi`,
    auto: (g, { data }) => { const cs = data.cards || []; const sc = (id) => (CHAPTER_MAP[id].act === g.P.action ? 0 : 10) + CHAPTER_RANK.indexOf(id); let b = 0; cs.forEach((id, i) => { if (sc(id) < sc(cs[b])) b = i; }); return b; },
    text: (g, { data }) => `${g.P.chapter ? 'Mười năm trôi qua. ' : ''}${g.chapterRecap()}\n\nMười năm tới, ngươi định sống thế nào?`,
    choices: (g, { data }) => (data.cards || []).map((id) => { const c = CHAPTER_MAP[id]; return { t: `${c.ic} ${c.n}: ${c.desc}`, go: (g) => g.startChapter(id) }; }),
  },
  // ================= Nhánh đạo lộ (tới Kim Đan) =================
  {
    id: 'nhanh_dao', queued: true, pool: 'doi', title: 'Ngã rẽ đạo lộ',
    text: (g) => `Kết thành kim đan, ngươi thấy con đường ${g.pathName()} trước mặt tách làm hai. Mỗi ngả dẫn tới một cảnh giới võ học khác hẳn nhau. Đi rồi thì không quay lại được trong kiếp này.`,
    choices: (g) => (BRANCHES[g.P.path] || []).map((b) => ({ t: `${b.ic} ${b.n}: ${b.desc}`, go: (g) => g.pickBranch(b.id) })),
  },

  // ================= Xuất thân: Con rơi của tông chủ =================
  {
    id: 'con_roi', w: 6, cd: 99, once: true, pool: 'doi', title: 'Tín vật của mẹ', r3: { age: 13, origin: 'con_roi' },
    prep: (g) => { const ss = g.aliveSects(); return ss.length ? { sect: ss.sort((a, b) => g.members(b.id).length - g.members(a.id).length)[0].id } : null; },
    text: (g, { data }) => `Mẹ ngươi trước khi mất để lại một miếng ngọc bội khắc huy hiệu ${g.sect(data.sect).name}. Người ta nói tông chủ ở đó chính là cha ngươi.`,
    choices: (g, { data }) => [
      { t: 'Cầm ngọc bội lên núi nhận cha', go: (g) => { const sc = g.sect(data.sect); g.joinSect(sc); g.fame(5); g.P.flags.conRoi = sc.id; g.later(12, 'con_roi_2'); return `Tông chủ nhìn ngọc bội rất lâu rồi nhận ngươi làm đệ tử thân truyền, không nói thêm lời nào. Nhưng mấy người con chính thất của ông nhìn ngươi bằng ánh mắt rất lạnh.`; } },
      { t: 'Đập vỡ ngọc bội, tự đi đường mình', go: (g) => { g.stat('tam', 6); g.stat('can', 3); return 'Kẻ đã bỏ mẹ con ngươi không đáng làm cha. Tâm tính +6, căn cốt +3.'; } },
    ],
  },
  {
    id: 'con_roi_2', queued: true, pool: 'doi', title: 'Huynh đệ cùng cha',
    text: () => 'Đêm trước đại tỷ thí, đại công tử của tông chủ chặn ngươi sau núi: "Đồ con hoang. Ngày mai ngươi phải thua, hoặc khỏi bao giờ xuống núi nữa."',
    choices: (g) => {
      const po = g.winOdds(() => g.genericFighter('Đại công tử', REALMS[g.P.realm].pow * 1.1));
      return [
        { t: 'Ngày mai thắng cho hắn xem', p: po, go: (g) => { const f = g.fight('Đại công tử', REALMS[g.P.realm].pow * 1.1, 1, { lethal: 0.05 }); if (f.win) { g.fame(15); g.addSP(2); return `${f.text}\n\nNgươi thắng giữa tiếng hò reo. Tông chủ lần đầu gật đầu với ngươi. Danh vọng +15, ngộ đạo điểm +2.`; } return `${f.text}\n\nNgươi thua. Đại công tử cười khẩy bỏ đi.`; } },
        { t: 'Nhường hắn, giữ hòa khí', go: (g) => { g.stat('tam', 3); g.money(Math.round(200 * (1 + g.P.realm))); return 'Ngươi cố ý thua. Hôm sau có người lặng lẽ gửi tới một túi linh thạch: lời cảm ơn không nói ra.'; } },
      ];
    },
  },
  // ================= Xuất thân: Ăn mày đầu chợ =================
  {
    id: 'an_may_hoi', w: 6, cd: 99, once: true, pool: 'doi', title: 'Bát cơm cuối cùng', r3: { age: 9, origin: 'an_may' },
    text: () => 'Mùa đông năm ấy ngươi chỉ còn nửa bát cơm. Bên cạnh có một lão ăn mày khác đói tới mức không đứng dậy nổi.',
    choices: () => [
      { t: 'Chia cho lão một nửa', go: (g) => { g.tinh(8); g.stat('co', 6); g.P.flags.anMayLao = true; g.later(20, 'an_may_hoi_2'); return 'Lão ăn xong, nhìn ngươi cười móm mém rồi biến mất trong gió tuyết. Cơ duyên +6.'; } },
      { t: 'Ăn hết, sống đã', go: (g) => { g.stat('can', 4); g.tinh(-4); return 'Ngươi sống qua mùa đông. Căn cốt +4.'; } },
    ],
  },
  {
    id: 'an_may_hoi_2', queued: true, pool: 'doi', title: 'Lão ăn mày năm xưa',
    text: () => 'Một lão già rách rưới chặn đường ngươi, chìa ra cái bát mẻ: "Nửa bát cơm năm ấy, lão phu nhớ." Trong bát là một cuộn ngọc giản tỏa ánh vàng.',
    choices: () => [
      { t: 'Nhận lấy', go: (g) => { g.addSP(4); const t = g.addTuvi(g.gain() * 6); return `Lão là một tán tiên ẩn thế. Ngọc giản chứa nửa đời tâm đắc của lão. Ngộ đạo điểm +4, tu vi +${t}.`; } },
    ],
  },
  // ================= Xuất thân: Hậu duệ ma tộc =================
  {
    id: 'ma_huyet', w: 6, cd: 99, once: true, pool: 'doi', title: 'Ma huyết thức tỉnh', r3: { age: 15, origin: 'ma_toc' },
    text: () => 'Đêm trăng máu, mắt ngươi đỏ rực, sức mạnh cuồn cuộn trong người như muốn xé toạc da thịt. Dòng máu ma tộc đã thức tỉnh.',
    choices: (g) => [
      { t: 'Đón nhận ma huyết', go: (g) => { g.P.flags.maHuyet = true; g.stat('can', 8); g.P.fight = (g.P.fight || 0) + 0.15; g.later(30, 'chinh_dao_truy'); return 'Ngươi gầm lên một tiếng, đá núi quanh mình nứt toác. Căn cốt +8, chiến đấu +15%. Từ nay chính đạo sẽ coi ngươi là ma.'; } },
      { t: 'Dùng ý chí áp chế', p: xp5(0.5 + (st5(g, 'tam') - 50) / 80), go: (g) => { const ok = g.r.chance(xp5(0.5 + (st5(g, 'tam') - 50) / 80)); if (ok) { g.stat('tam', 8); return 'Ngươi ngồi suốt đêm, ép từng giọt ma huyết về đan điền. Tâm tính +8.'; } g.hurt(25, 'ma huyết phản phệ'); return 'Ma huyết phản phệ, ngươi ngất lịm ba ngày.'; } },
    ],
  },
  {
    id: 'chinh_dao_truy', queued: true, pool: 'doi', title: 'Chính đạo truy sát',
    text: () => 'Ba tu sĩ áo trắng vây lấy ngươi giữa đường: "Ma nghiệt! Hôm nay thay trời hành đạo."',
    choices: (g) => {
      const po = g.winOdds(() => g.genericFighter('Chính đạo tu sĩ', REALMS[g.P.realm].pow * 1.3));
      return [
        { t: 'Liều mạng một trận', p: po, go: (g) => { const f = g.fight('Chính đạo tu sĩ', REALMS[g.P.realm].pow * 1.3, 1, { lethal: 0.25, cause: 'bị chính đạo trừ ma' }); if (f.win) { g.addSat(25); g.fame(-10); return `${f.text}\n\nBa xác áo trắng nằm dưới chân ngươi. Sát khí +25, tiếng xấu càng lan xa.`; } return f.text; } },
        { t: 'Bỏ chạy về phía núi sâu', p: xp5(0.5 + (st5(g, 'co') - 50) / 100), go: (g) => { if (g.r.chance(xp5(0.5 + (st5(g, 'co') - 50) / 100))) return 'Ngươi thoát được, nhưng biết chúng sẽ còn tới.'; g.hurt(30, 'bị chính đạo đuổi kịp'); return 'Một đạo kiếm quang đuổi kịp sau lưng.'; } },
      ];
    },
  },
  // ================= Xuất thân: Hoàng tộc mất nước =================
  {
    id: 'phuc_quoc', w: 6, cd: 99, once: true, pool: 'doi', title: 'Di thần tìm tới', r3: { age: 18, origin: 'hoang_toc' },
    text: () => 'Một lão tướng tóc bạc quỳ trước mặt ngươi, dâng lên một thanh kiếm gỉ: "Điện hạ. Ba vạn binh mã vẫn chờ người trong núi. Xin người phục quốc."',
    choices: () => [
      { t: 'Gánh lấy giang sơn', go: (g) => { const cost = Math.round(400 * (1 + g.P.realm)); g.money(-Math.min(g.P.money, cost)); g.fame(25); g.later(25, 'phuc_quoc_2'); return `Ngươi bỏ hết gia sản nuôi quân. Danh vọng +25. Hai mươi lăm năm nữa sẽ là trận quyết định.`; } },
      { t: 'Thời của vương triều đã qua', go: (g) => { g.stat('tam', 5); g.addSP(1); return 'Ngươi đỡ lão dậy: "Ta chỉ muốn tu đạo." Lão khóc, nhưng không trách. Tâm tính +5, ngộ đạo điểm +1.'; } },
    ],
  },
  {
    id: 'phuc_quoc_2', queued: true, pool: 'doi', title: 'Trận chiến phục quốc',
    text: () => 'Quân phục quốc áp sát kinh thành. Trên tường thành, quốc sư của triều mới đứng chờ. Hắn là tu sĩ cùng cảnh giới với ngươi.',
    choices: (g) => {
      const po = g.winOdds(() => g.genericFighter('Quốc sư', REALMS[g.P.realm].pow * 1.25));
      return [
        { t: 'Đích thân lên tường thành', p: po, go: (g) => { const f = g.fight('Quốc sư', REALMS[g.P.realm].pow * 1.25, 1, { lethal: 0.2, cause: 'tử trận trong chiến tranh phục quốc' }); if (f.win) { g.fame(50); g.money(Math.round(3000 * (1 + g.P.realm))); g.P.sanNghiep = (g.P.sanNghiep || 0) + 3; return `${f.text}\n\nCờ cũ lại tung bay trên kinh thành. Ngươi trao ngai vàng cho người khác rồi quay về núi tu luyện. Danh vọng +50, quốc khố dâng nhiều linh thạch, sản nghiệp sinh lời mỗi năm.`; } return `${f.text}\n\nQuân phục quốc tan vỡ.`; } },
        { t: 'Rút quân, tránh đổ máu', go: (g) => { g.fame(-10); g.tinh(5); return 'Ngươi ra lệnh lui binh. Lão tướng nhìn ngươi lần cuối rồi tự vẫn bên bờ sông.'; } },
      ];
    },
  },
];
