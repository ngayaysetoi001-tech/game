// Kỳ ngộ đợt 5: chỉ xảy ra khi Tu luyện (nhóm 'tu'). Toàn chuyện nội tu: đốn ngộ, linh khí, tẩu hỏa, kinh mạch, thần thức, dị tượng.
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
];
