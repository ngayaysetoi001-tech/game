// Dữ liệu tĩnh của Trăm Kiếp Phù Sinh.

// need: tu vi cần để viên mãn cảnh giới này (rồi đột phá lên cảnh giới kế)
// life: thọ nguyên gốc, pow: sức chiến đấu gốc, brk: tỉ lệ đột phá gốc LÊN cảnh giới kế
export const REALMS = [
  { n: 'Phàm Nhân', need: 100, life: 60, pow: 1, brk: 0.9 },
  { n: 'Luyện Khí', need: 300, life: 90, pow: 3, brk: 0.7 },
  { n: 'Trúc Cơ', need: 800, life: 140, pow: 9, brk: 0.55 },
  { n: 'Kim Đan', need: 2000, life: 220, pow: 27, brk: 0.45 },
  { n: 'Nguyên Anh', need: 5000, life: 350, pow: 80, brk: 0.36 },
  { n: 'Hóa Thần', need: 12000, life: 550, pow: 240, brk: 0.3 },
  { n: 'Luyện Hư', need: 30000, life: 750, pow: 700, brk: 0.25 },
  { n: 'Đại Thừa', need: 90000, life: 1000, pow: 2000, brk: 0.18 },
];
export const TOP_REALM = REALMS.length - 1;

/** Tu vi một năm tu luyện chuyên tâm, trước các hệ số */
export const baseGain = (realm) => 6 * Math.pow(1.5, realm);

export const ROOTS = [
  { n: 'Thiên linh căn', m: 2.0, w: 3 },
  { n: 'Biến dị linh căn', m: 1.7, w: 5 },
  { n: 'Song linh căn', m: 1.4, w: 15 },
  { n: 'Tam linh căn', m: 1.1, w: 30 },
  { n: 'Tứ linh căn', m: 0.85, w: 30 },
  { n: 'Ngũ hành tạp căn', m: 0.6, w: 17 },
];

export const ORIGINS = [
  { id: 'nong', n: 'Con nhà nông', w: 30, fx: { can: 6 }, desc: 'Lớn lên ngoài đồng, thân thể rắn rỏi.' },
  { id: 'buon', n: 'Con nhà buôn', w: 20, fx: { money: 60 }, desc: 'Biết đếm tiền trước khi biết chữ.' },
  { id: 'thu', n: 'Thư hương thế gia', w: 15, fx: { ngo: 8 }, desc: 'Ông nội là tú tài, sách chất đầy nhà.' },
  { id: 'coi', n: 'Cô nhi đầu đường', w: 15, fx: { tam: 8, co: 5 }, desc: 'Không ai nuôi, tự học cách sống.' },
  { id: 'ren', n: 'Con thợ rèn', w: 12, fx: { can: 3, fight: 0.1 }, desc: 'Tiếng búa đập sắt là bài hát ru.' },
  { id: 'tu', n: 'Hậu duệ tu tiên gia tộc', w: 8, fx: { money: 40, dao: true }, desc: 'Tổ tiên từng có người Kim Đan. Gia tộc nay đã sa sút.' },
];

export const PERSONALITIES = {
  hien: { n: 'Hiền hòa', relMul: 1.3, fight: 0.5, betray: 0 },
  tham: { n: 'Tham lam', relMul: 0.8, fight: 1, betray: 0.25 },
  cuong: { n: 'Cuồng ngạo', relMul: 0.7, fight: 3, betray: 0.05 },
  an: { n: 'Ẩn dật', relMul: 0.9, fight: 0.4, betray: 0 },
  muu: { n: 'Mưu sâu', relMul: 1, fight: 1.5, betray: 0.15 },
  nghia: { n: 'Trọng nghĩa', relMul: 1.4, fight: 1, betray: 0 },
};
export const PERS_KEYS = Object.keys(PERSONALITIES);

export const SURNAMES = ['Lâm', 'Tô', 'Diệp', 'Hàn', 'Lục', 'Tiêu', 'Tần', 'Bạch', 'Vân', 'Thẩm', 'Liễu', 'Cố', 'Mạc', 'Phong', 'Đường', 'Lý', 'Triệu', 'Hứa', 'Giang', 'Ôn', 'Kỷ', 'Tạ', 'Mục', 'Úc'];
export const NAMES_M = ['Phong', 'Vũ', 'Thần', 'Dật', 'Hiên', 'Khải', 'Lăng', 'Viêm', 'Hạo', 'Kiệt', 'Minh', 'Uyên', 'Trạch', 'Hàn', 'Sơ', 'Cảnh', 'Mặc', 'Tuấn', 'Trường Sinh', 'Thừa Ân', 'Vô Cữu', 'Bắc Thần', 'Tử Kỳ', 'Thanh Hà'];
export const NAMES_F = ['Nguyệt', 'Tuyết', 'Dao', 'Linh', 'Yên', 'Thanh', 'Nhược', 'Lam', 'Diệu', 'Hi', 'Uyển', 'Ngưng', 'Sương', 'Tịch', 'Như', 'Vi', 'Cầm', 'Khê', 'Nghiên', 'Tố Tâm', 'Vãn Ca', 'Lạc Anh', 'Thu Thủy', 'Mộng Điệp'];

export const SECT_A = ['Vân Thủy', 'Xích Diễm', 'Huyền Thiết', 'Bách Thảo', 'Lạc Nhạn', 'Bích Lạc', 'Hắc Sa', 'Tử Vi', 'Phù Dung', 'Kinh Lôi', 'Bạch Lộc', 'Hàn Sơn', 'Vọng Nguyệt', 'Thiên Trì', 'Cô Tinh', 'Mộ Vân'];
export const SECT_B = ['Tông', 'Môn', 'Các', 'Cốc', 'Phái', 'Cung', 'Sơn Trang'];
export const SECT_COLORS = ['#4f8fd6', '#d65a4f', '#8a8f99', '#5fae5a', '#c58fd6', '#d6b04f', '#4fc0b8', '#9a6b4a'];

export const MONSTERS = [
  { n: 'Hắc Lang', r: 0 },
  { n: 'Dã Trư Tinh', r: 0 },
  { n: 'Thiết Bối Hùng', r: 1 },
  { n: 'Xích Luyện Xà', r: 1 },
  { n: 'Ma Viên', r: 2 },
  { n: 'Song Đầu Ưng', r: 2 },
  { n: 'Ngân Lân Giao', r: 3 },
  { n: 'Hỏa Vân Báo', r: 3 },
  { n: 'Cửu U Thi Vương', r: 4 },
  { n: 'Thạch Linh Cự Nhân', r: 4 },
  { n: 'Huyết Nha Bức Vương', r: 5 },
  { n: 'Phong Lôi Thú', r: 5 },
  { n: 'Thái Cổ Ma Long', r: 6 },
  { n: 'Hư Không Trùng Mẫu', r: 7 },
];

export const MOVES = ['Lưu Vân Chưởng', 'Phá Sơn Quyền', 'Hàn Băng Chỉ', 'Kinh Hồng Kiếm', 'Liệt Hỏa Đao', 'Bôn Lôi Cước', 'Tàn Nguyệt Trảm', 'Vạn Diệp Phi Hoa', 'Trấn Nhạc Ấn', 'Thanh Phong Bộ', 'Huyền Vũ Thuẫn', 'Truy Hồn Thích'];

export const ACTIONS = {
  tu_luyen: { n: 'Tu luyện', icon: '☯', minAge: 6, needDao: true, desc: 'Tu vi tăng nhanh nhất.' },
  lich_luyen: { n: 'Lịch luyện', icon: '⛰', minAge: 10, desc: 'Đi khắp nơi, gặp nhiều kỳ ngộ và hiểm nguy.' },
  muu_sinh: { n: 'Mưu sinh', icon: '⚖', minAge: 8, desc: 'Kiếm linh thạch.' },
  ket_giao: { n: 'Kết giao', icon: '☕', minAge: 8, desc: 'Gặp gỡ tu sĩ khác, kết bạn, tìm đạo lữ.' },
};

// Đan dược bán ở Tụ Bảo Lâu. price là giá ở Phàm Nhân, nhân (1 + cảnh giới) khi mua.
export const PILLS = {
  hoi_xuan: { n: 'Hồi Xuân Đan', price: 25, desc: 'Hồi 40 sinh lực.' },
  pha_canh: { n: 'Phá Cảnh Đan', price: 100, desc: 'Dùng khi đột phá: tỉ lệ +10%.' },
  dien_tho: { n: 'Diên Thọ Đan', price: 120, desc: 'Thọ nguyên +5%. Mỗi cảnh giới chỉ hấp thu được một viên.' },
  tinh_tam: { n: 'Tĩnh Tâm Đan', price: 40, desc: 'Tâm tính +6.' },
};

// Tàn niệm: chọn 1 trong 3 khi chết, mang sang kiếp sau
export const LEGACIES = [
  { id: 'ky_uc', n: 'Ký ức đạo pháp', desc: 'Ngộ tính +15. Sáu tuổi đã tự nhập đạo.' },
  { id: 'than_the', n: 'Thân thể kiếp trước', desc: 'Căn cốt +15.' },
  { id: 'co_duyen', n: 'Dư âm cơ duyên', desc: 'Cơ duyên +15.' },
  { id: 'kiem_y', n: 'Tàn hồn kiếm ý', desc: 'Sức chiến đấu +20% suốt kiếp sau.' },
  { id: 'linh_can', n: 'Linh căn tôi luyện', desc: 'Gieo linh căn hai lần, lấy cái tốt hơn.' },
  { id: 'tam_canh', n: 'Tâm như chỉ thủy', desc: 'Tâm tính +15.' },
  { id: 'duyen', n: 'Một sợi tơ duyên', desc: 'Người thân thiết nhất kiếp này sẽ sớm tìm thấy ngươi.' },
  { id: 'tai_san', n: 'Rương chôn dưới gốc đào', desc: 'Chôn lại một nửa linh thạch (tối đa 500) cho kiếp sau.' },
  { id: 'huyet_mach', n: 'Huyết mạch còn vương', desc: 'Kiếp sau giữ lại thể chất của kiếp này.' },
];

export const STAT_NAMES = { can: 'Căn cốt', ngo: 'Ngộ tính', tam: 'Tâm tính', co: 'Cơ duyên' };

export const TAG_NAMES = {
  huynh_de: 'Huynh đệ',
  dao_lu: 'Đạo lữ',
  su_phu: 'Sư phụ',
  de_tu: 'Đệ tử',
  thu: 'Kẻ thù',
};

// ---------- Thể chất (mỗi người một loại) và thiên phú (0-2 món) ----------
// fx: cộng chỉ số lúc sinh (can, ngo, tam, co, tinh), hệ số nhân (*Mul), cộng tỉ lệ (brk, flee),
//     evW: nhân trọng số sự kiện, cờ đặc biệt (coldPoison, noBetray, seePast, ngoOnBreak)
// tier: 0 thường, 1 khá, 2 hiếm, 3 truyền thuyết
export const THE_CHAT = [
  { id: 'pham', n: 'Phàm thể', tier: 0, w: 55, desc: 'Thân thể bình thường như bao người.', fx: {} },
  // --- Khá ---
  { id: 'thiet_cot', n: 'Thiết Cốt Thể', tier: 1, w: 3, desc: 'Căn cốt +5, chịu đòn -15%.', fx: { can: 5, hurtMul: 0.85 } },
  { id: 'linh_lung', n: 'Linh Lung Tâm', tier: 1, w: 3, desc: 'Ngộ tính +10.', fx: { ngo: 10 } },
  { id: 'thanh_tam', n: 'Thanh Tâm Thể', tier: 1, w: 3, desc: 'Tâm tính +10, tâm ma ít gặp.', fx: { tam: 10, evW: { tam_ma: 0.6 } } },
  { id: 'phuc_hau', n: 'Phúc Hậu Tướng', tier: 1, w: 3, desc: 'Cơ duyên +8, mưu sinh kiếm thêm 30%.', fx: { co: 8, moneyMul: 1.3 } },
  { id: 'khinh_than', n: 'Khinh Thân Thể', tier: 1, w: 3, desc: 'Bỏ chạy dễ thoát hơn 25%, gặp kỳ ngộ nhiều hơn 15%.', fx: { flee: 0.25, eventRate: 1.15 } },
  { id: 'duoc_linh', n: 'Dược Linh Thể', tier: 1, w: 3, desc: 'Đan dược hiệu quả gấp rưỡi, sinh lực hồi nhanh 30%.', fx: { pillMul: 1.5, regenMul: 1.3 } },
  { id: 'truong_xuan', n: 'Trường Xuân Thể', tier: 1, w: 3, desc: 'Thọ nguyên +10%.', fx: { lifeMul: 1.1 } },
  { id: 'bach_doc', n: 'Bách Độc Bất Xâm', tier: 1, w: 3, desc: 'Chịu đòn -15%, sinh lực hồi nhanh 30%.', fx: { hurtMul: 0.85, regenMul: 1.3 } },
  // --- Hiếm ---
  { id: 'cuu_am', n: 'Cửu Âm Hàn Thể', tier: 2, w: 1.2, desc: 'Tu luyện +25%. Hàn độc thỉnh thoảng phát tác làm mất sinh lực. Có đạo lữ thì hàn độc bị áp chế.', fx: { gainMul: 1.25, coldPoison: true } },
  { id: 'liet_duong', n: 'Liệt Dương Chiến Thể', tier: 2, w: 1.2, desc: 'Sức chiến đấu +35%. Tính nóng như lửa: tâm tính -10, hay bị kẻ khác khiêu chiến.', fx: { fightMul: 1.35, tam: -10, evW: { khieu_chien: 2 } } },
  { id: 'thong_linh', n: 'Thông Linh Thể', tier: 2, w: 1.2, desc: 'Ngộ tính +8, cơ duyên +5. Linh thú tự tìm đến.', fx: { ngo: 8, co: 5, evW: { linh_thu: 4 } } },
  { id: 'vo_cau', n: 'Vô Cấu Linh Thể', tier: 2, w: 1.2, desc: 'Đột phá +8%. Tâm ma khó xâm nhập.', fx: { brk: 0.08, evW: { tam_ma: 0.3 } } },
  { id: 'mi_cot', n: 'Thiên Sinh Mị Cốt', tier: 2, w: 1.2, desc: 'Ai gặp cũng mến: thân thiết tăng nhanh 50%, dễ gặp đạo lữ. Kẻ tham lam cũng dễ nhòm ngó.', fx: { relMul: 1.5, evW: { dao_lu: 2, phan_boi: 2 } } },
  { id: 'tuc_menh', n: 'Túc Mệnh Nhãn', tier: 2, w: 1.2, desc: 'Nhìn thấu tiền kiếp người khác. Dễ gặp lại cố nhân, và thấy kiếp trước của mọi người trong Quan hệ.', fx: { seePast: true, evW: { duyen_no: 3, co_nhan_tim: 2 } } },
  { id: 'kiem_thai', n: 'Kiếm Thai Thể', tier: 2, w: 1.2, desc: 'Sức chiến đấu +25%. Mỗi trận thắng, kiếm ý mài sắc thêm: tu vi bằng một năm tu luyện.', fx: { fightMul: 1.25, winTuvi: 1 } },
  { id: 'loi_linh', n: 'Lôi Linh Thể', tier: 2, w: 1.2, desc: 'Lôi kiếp thân quen như mưa rào: từ Kim Đan trở đi đột phá +12%. Sức chiến đấu +10%.', fx: { brkLate: 0.12, fightMul: 1.1 } },
  { id: 'moc_linh', n: 'Ất Mộc Linh Thể', tier: 2, w: 1.2, desc: 'Sinh lực hồi gấp đôi, thọ nguyên +12%.', fx: { regenMul: 2, lifeMul: 1.12 } },
  { id: 'huyen_bang', n: 'Huyền Băng Thể', tier: 2, w: 1.2, desc: 'Tâm tính +8, tu luyện +10%, tâm ma hiếm khi gặp.', fx: { tam: 8, gainMul: 1.1, evW: { tam_ma: 0.5 } } },
  { id: 'tiem_long', n: 'Tiềm Long Thể', tier: 2, w: 1.2, desc: 'Rồng nằm dưới vực: đến Trúc Cơ tu luyện -20%, từ Nguyên Anh trở đi +50%.', fx: { earlyGain: 0.8, lateGain: 1.5 } },
  { id: 'than_dong', n: 'Thần Đồng Thể', tier: 2, w: 1.2, desc: 'Đến Trúc Cơ tu luyện +60%. Từ Nguyên Anh trở đi -15%.', fx: { earlyGain: 1.6, lateGain: 0.85 } },
  { id: 'thach_tam', n: 'Thạch Tâm Thể', tier: 2, w: 1.2, desc: 'Ngồi yên như đá: bế quan hiệu quả gấp rưỡi. Ít gặp kỳ ngộ hơn 30%.', fx: { closedMul: 1.5, eventRate: 0.7 } },
  { id: 'tu_bao', n: 'Tụ Bảo Thể', tier: 2, w: 1.2, desc: 'Tiền tự tìm đến: mưu sinh kiếm gấp đôi, cơ duyên +5. Kẻ tham dễ sinh lòng phản.', fx: { moneyMul: 2, co: 5, evW: { phan_boi: 2 } } },
  { id: 'huyet_sat', n: 'Huyết Sát Thể', tier: 2, w: 1.2, desc: 'Sức chiến đấu +15%, mỗi trận thắng tu vi bằng hai năm tu luyện. Khởi đầu Vô tình -20.', fx: { fightMul: 1.15, winTuvi: 2, tinh: -20 } },
  // --- Truyền thuyết ---
  { id: 'bat_diet', n: 'Bất Diệt Kim Thân', tier: 3, w: 0.4, desc: 'Sinh lực hồi gấp đôi, chịu đòn -30%, thọ +15%. Thân thể nặng nề, tu luyện -10%.', fx: { regenMul: 2, hurtMul: 0.7, lifeMul: 1.15, gainMul: 0.9 } },
  { id: 'hon_don', n: 'Hỗn Độn Đạo Thể', tier: 3, w: 0.4, desc: 'Tu luyện +45%. Bình cảnh dày như núi: đột phá -8%.', fx: { gainMul: 1.45, brk: -0.08 } },
  { id: 'nhat_nguyet', n: 'Nhật Nguyệt Đồng Huy Thể', tier: 3, w: 0.4, desc: 'Âm dương cùng sáng: tu luyện +30%, đột phá +5%.', fx: { gainMul: 1.3, brk: 0.05 } },
  { id: 'niet_ban', n: 'Niết Bàn Thể', tier: 3, w: 0.4, desc: 'Một lần mỗi kiếp, khi trọng thương sắp chết thì tắm lửa tái sinh với nửa sinh lực. Thọ +10%.', fx: { deathSave: true, lifeMul: 1.1 } },
  { id: 'khi_van', n: 'Khí Vận Chi Tử', tier: 3, w: 0.4, desc: 'Trời đất thiên vị: cơ duyên +25, kỳ ngộ nhiều hơn 30%, đột phá +5%.', fx: { co: 25, eventRate: 1.3, brk: 0.05 } },
  { id: 'van_phap', n: 'Vạn Pháp Thể', tier: 3, w: 0.4, desc: 'Học gì cũng thông: tu luyện +20%, sức chiến đấu +20%, ngộ tính +5.', fx: { gainMul: 1.2, fightMul: 1.2, ngo: 5 } },
  { id: 'chan_long', n: 'Chân Long Huyết Mạch', tier: 3, w: 0.4, desc: 'Sức chiến đấu +40%, thọ +20%, hồi sinh lực nhanh 50%. Long tính khó thuần: tâm tính -8.', fx: { fightMul: 1.4, lifeMul: 1.2, regenMul: 1.5, tam: -8 } },
  // --- Thần thoại ---
  { id: 'dao_thai', n: 'Tiên Thiên Đạo Thai', tier: 4, w: 0.12, desc: 'Sinh ra đã mang đạo: tu luyện +50%, đột phá +10%, thọ +20%. Trời ghen người tài: tâm ma tìm đến gấp đôi.', fx: { gainMul: 1.5, brk: 0.1, lifeMul: 1.2, evW: { tam_ma: 2 } } },
  { id: 'hong_mong', n: 'Hồng Mông Thánh Thể', tier: 4, w: 0.12, desc: 'Thể chất từ thuở khai thiên: tu luyện +35%, sức chiến đấu +35%, chịu đòn -25%, thọ +15%.', fx: { gainMul: 1.35, fightMul: 1.35, hurtMul: 0.75, lifeMul: 1.15 } },
];

export const THIEN_PHU = [
  { id: 'vo_si', n: 'Võ si', tier: 1, desc: 'Sức chiến đấu +15%.', fx: { fightMul: 1.15 } },
  { id: 'buon_ban', n: 'Đầu óc buôn bán', tier: 1, desc: 'Mưu sinh kiếm được gấp rưỡi.', fx: { moneyMul: 1.5 } },
  { id: 'de_gan', n: 'Dễ gần', tier: 1, desc: 'Thân thiết tăng nhanh 25%.', fx: { relMul: 1.25 } },
  { id: 'da_nghi', n: 'Đa nghi', tier: 1, desc: 'Không bao giờ bị lừa mất của. Đổi lại khó thân với ai.', fx: { noBetray: true, relMul: 0.85 } },
  { id: 'benh_can', n: 'Bệnh căn từ nhỏ', tier: 1, desc: 'Căn cốt -10. Ốm đau nhiều nên tâm tính +10.', fx: { can: -10, tam: 10 } },
  { id: 'hoang_dao', n: 'Sinh giờ hoàng đạo', tier: 1, desc: 'Cơ duyên +12.', fx: { co: 12 } },
  { id: 'hay_mo', n: 'Hay mơ', tier: 1, desc: 'Ngộ tính +8, tâm tính -4.', fx: { ngo: 8, tam: -4 } },
  { id: 'chan_nhanh', n: 'Chân nhanh hơn não', tier: 1, desc: 'Bỏ chạy dễ thoát hơn 20%.', fx: { flee: 0.2 } },
  { id: 'trac_an', n: 'Lòng trắc ẩn', tier: 1, desc: 'Khởi đầu Hữu tình +20, tâm tính +4.', fx: { tinh: 20, tam: 4 } },
  { id: 'dong_bi', n: 'Đồng bì thiết cốt', tier: 2, desc: 'Chịu đòn -25% sát thương.', fx: { hurtMul: 0.75 } },
  { id: 'doc_hanh', n: 'Độc hành giả', tier: 2, desc: 'Tu luyện +12%, nhưng khó kết thân (thân thiết -40%).', fx: { gainMul: 1.12, relMul: 0.6 } },
  { id: 'van_thanh', n: 'Đại khí vãn thành', tier: 2, desc: 'Mỗi lần đột phá thành công, ngộ tính +4.', fx: { ngoOnBreak: 4 } },
  { id: 'sat_khi', n: 'Sát khí bẩm sinh', tier: 2, desc: 'Sức chiến đấu +10%. Sinh ra đã lạnh lùng: khởi đầu Vô tình -25.', fx: { fightMul: 1.1, tinh: -25 } },
];
export const TP_WEIGHT = { 1: 10, 2: 4 };

// ---------- Đạo hiệu ----------
export const DH_A = ['Thanh', 'Huyền', 'Vân', 'Tử', 'Lăng', 'Mặc', 'Trường', 'Vô', 'Bích', 'Hư', 'Lạc', 'Tịch', 'Minh', 'Cô', 'Phong', 'Nguyệt', 'Tinh', 'Hàn', 'U', 'Tĩnh', 'Thái', 'Ngọc'];
export const DH_B = ['Hư', 'Cơ', 'Dương', 'Trần', 'Nhai', 'Tùng', 'Hạc', 'Tuyền', 'Ngộ', 'Kiếm', 'Vân', 'Thủy', 'Sơn', 'Phong', 'Diệp', 'Huyền', 'Linh', 'Tâm', 'Uyên', 'Hà', 'Cốc'];
// tôn xưng theo cảnh giới (từ Trúc Cơ)
export const DH_HON = [null, null, 'Tử', 'Chân Nhân', 'Chân Quân', 'Đạo Quân', 'Tôn Giả', 'Đạo Tôn'];
export const DH_HON_NU = [null, null, 'Tiên Tử', 'Chân Nhân', 'Chân Quân', 'Nguyên Quân', 'Tôn Giả', 'Đạo Tôn'];
export const DH_HON_MA = [null, null, 'Tử', 'Ma Nhân', 'Ma Quân', 'Ma Quân', 'Ma Tôn', 'Ma Tôn'];

// ---------- Danh hiệu: giang hồ xưng tụng theo thành tích, mỗi kiếp mở lại ----------
// cond: điều kiện (hiện cho người chơi), check(g): đạt chưa, fx: lợi ích khi đeo (dùng chung hệ với thể chất)
const fr = (g) => g.known();
export const TITLES = [
  { id: 'so_xuat', n: 'Sơ Xuất Giang Hồ', cond: 'Thắng 5 trận', bonus: 'Chiến đấu +3%', fx: { fightMul: 1.03 }, check: (g) => g.P.cnt.win >= 5 },
  { id: 'bach_chien', n: 'Bách Chiến Dư Sinh', cond: 'Thắng 30 trận', bonus: 'Chiến đấu +7%', fx: { fightMul: 1.07 }, check: (g) => g.P.cnt.win >= 30 },
  { id: 'khac_tinh', n: 'Yêu Thú Khắc Tinh', cond: 'Hạ 15 yêu thú', bonus: 'Chiến đấu +5%, chịu đòn -5%', fx: { fightMul: 1.05, hurtMul: 0.95 }, check: (g) => g.P.cnt.beast >= 15 },
  { id: 'thieu_nien', n: 'Thiếu Niên Anh Tài', cond: 'Lên Trúc Cơ trước 30 tuổi', bonus: 'Tu luyện +5%', fx: { gainMul: 1.05 }, check: (g) => g.P.realm >= 2 && g.P.age < 30 },
  { id: 'thien_kieu_tu', n: 'Thiên Chi Kiêu Tử', cond: 'Lên Kim Đan trước 80 tuổi', bonus: 'Đột phá +3%', fx: { brk: 0.03 }, check: (g) => g.P.realm >= 3 && g.P.age < 80 },
  { id: 'lao_thu', n: 'Lão Thụ Khai Hoa', cond: 'Lên Kim Đan sau 150 tuổi', bonus: 'Thọ nguyên +5%', fx: { lifeMul: 1.05 }, check: (g) => g.P.realm >= 3 && g.P.age >= 150 },
  { id: 'lao_bat_tu', n: 'Lão Bất Tử', cond: 'Sống tới 500 tuổi', bonus: 'Thọ nguyên +5%', fx: { lifeMul: 1.05 }, check: (g) => g.P.age >= 500 },
  { id: 'phu_giap', n: 'Phú Giáp Nhất Phương', cond: 'Có 5.000 linh thạch', bonus: 'Mưu sinh +15%', fx: { moneyMul: 1.15 }, check: (g) => g.P.money >= 5000 },
  { id: 'hiep_khach', n: 'Nhân Nghĩa Hiệp Khách', cond: 'Hữu tình đạt 70', bonus: 'Thân thiết +15%', fx: { relMul: 1.15 }, check: (g) => g.P.tinh >= 70 },
  { id: 'vong_tinh', n: 'Thái Thượng Vong Tình', cond: 'Vô tình đạt -70', bonus: 'Tu luyện +5%', fx: { gainMul: 1.05 }, check: (g) => g.P.tinh <= -70 },
  { id: 'bang_huu', n: 'Bằng Hữu Khắp Thiên Hạ', cond: '5 người thân thiết từ 50 cùng lúc', bonus: 'Thân thiết +10%, đột phá +2%', fx: { relMul: 1.1, brk: 0.02 }, check: (g) => fr(g).filter(({ r }) => r.v >= 50).length >= 5 },
  { id: 'thu_dich', n: 'Kẻ Thù Của Thiên Hạ', cond: '3 kẻ thù cùng lúc', bonus: 'Chiến đấu +5%', fx: { fightMul: 1.05 }, check: (g) => fr(g).filter(({ r }) => r.v <= -40 || r.tag === 'thu').length >= 3 },
  { id: 'than_tien', n: 'Thần Tiên Quyến Lữ', cond: 'Có đạo lữ, cả hai từ Kim Đan', bonus: 'Đột phá +3%', fx: { brk: 0.03 }, check: (g) => g.P.realm >= 3 && fr(g).some(({ b, r }) => r.tag === 'dao_lu' && b.realm >= 3) },
  { id: 'dao_ly', n: 'Đào Lý Khắp Nơi', cond: 'Có 3 đệ tử', bonus: 'Thân thiết +10%', fx: { relMul: 1.1 }, check: (g) => fr(g).filter(({ r }) => r.tag === 'de_tu').length >= 3 },
  { id: 'bao_thu', n: 'Có Thù Tất Báo', cond: 'Báo thù cho người thân thành công', bonus: 'Chiến đấu +4%', fx: { fightMul: 1.04 }, check: (g) => g.P.cnt.revenge >= 1 },
  { id: 'cuu_tu', n: 'Cửu Tử Nhất Sinh', cond: '3 lần sống sót khi sinh lực dưới 20', bonus: 'Chịu đòn -8%', fx: { hurtMul: 0.92 }, check: (g) => g.P.cnt.low >= 3 },
  { id: 'duc_hoa', n: 'Dục Hỏa Trùng Sinh', cond: 'Sống lại nhờ lửa Niết Bàn', bonus: 'Hồi sinh lực +20%', fx: { regenMul: 1.2 }, check: (g) => !!g.P.flags.reborn },
  { id: 'danh_chan', n: 'Danh Chấn Một Phương', cond: 'Danh vọng 50', bonus: 'Kỳ ngộ +5%', fx: { eventRate: 1.05 }, check: (g) => g.P.fame >= 50 },
  { id: 'danh_thien_ha', n: 'Uy Chấn Thiên Hạ', cond: 'Danh vọng 200', bonus: 'Đột phá +3%, kỳ ngộ +5%', fx: { brk: 0.03, eventRate: 1.05 }, check: (g) => g.P.fame >= 200 },
  { id: 'thap_dai', n: 'Thập Đại Cao Thủ', cond: 'Vào top 10 Bảng Thiên Kiêu khi đã Nguyên Anh', bonus: 'Chiến đấu +5%', fx: { fightMul: 1.05 }, check: (g) => g.P.realm >= 4 && g._rank <= 10 },
  { id: 'bang_thu', n: 'Thiên Kiêu Bảng Thủ', cond: 'Giữ ngôi đầu Bảng Thiên Kiêu 100 năm', bonus: 'Tu luyện +8%, chiến đấu +5%', fx: { gainMul: 1.08, fightMul: 1.05 }, check: (g) => g.P.cnt.top1 >= 100 },
  { id: 'tru_cot', n: 'Trụ Cột Sơn Môn', cond: 'Mạnh nhất tông môn của mình', bonus: 'Tu luyện +5%', fx: { gainMul: 1.05 }, check: (g) => !!g.P.sect && g.P.realm >= 2 && g.members(g.P.sect).every((b) => b.realm < g.P.realm || (b.realm === g.P.realm && b.tuvi <= g.P.tuvi)) },
  { id: 'tang_bao', n: 'Tàng Bảo Các Chủ', cond: 'Mang một món Cực phẩm', bonus: 'Kỳ ngộ +5%', fx: { eventRate: 1.05 }, check: (g) => Object.values(g.P.eq || {}).some((it) => it && it.q >= 3) },
  { id: 'vo_hoc', n: 'Võ Học Tông Sư', cond: 'Biết 8 võ kỹ', bonus: 'Chiến đấu +4%', fx: { fightMul: 1.04 }, check: (g) => g.P.skills.length >= 8 },
  { id: 'huyet_mach', n: 'Huyết Mạch Thức Tỉnh', cond: 'Mang thể chất Truyền thuyết trở lên', bonus: 'Đột phá +2%', fx: { brk: 0.02 }, check: (g) => g.traits()[0].tier >= 3 },
];

// phẩm danh hiệu theo độ khó: 1 Thường, 2 Hiếm, 3 Truyền kỳ, 4 Thần thoại
const TITLE_TIER = {
  so_xuat: 1, danh_chan: 1, lao_thu: 1,
  bach_chien: 2, khac_tinh: 2, thien_kieu_tu: 2, phu_giap: 2, hiep_khach: 2, thu_dich: 2, than_tien: 2, bao_thu: 2, tru_cot: 2, vo_hoc: 2,
  thieu_nien: 3, lao_bat_tu: 3, vong_tinh: 3, bang_huu: 3, dao_ly: 3, cuu_tu: 3, danh_thien_ha: 3, thap_dai: 3, tang_bao: 3, huyet_mach: 3,
  duc_hoa: 4, bang_thu: 4,
};
for (const t of TITLES) t.tier = TITLE_TIER[t.id] || 1;
export const TITLE_TIER_N = ['', 'Thường', 'Hiếm', 'Truyền kỳ', 'Thần thoại'];
