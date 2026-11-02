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
];

export const STAT_NAMES = { can: 'Căn cốt', ngo: 'Ngộ tính', tam: 'Tâm tính', co: 'Cơ duyên' };

export const TAG_NAMES = {
  huynh_de: 'Huynh đệ',
  dao_lu: 'Đạo lữ',
  su_phu: 'Sư phụ',
  de_tu: 'Đệ tử',
  thu: 'Kẻ thù',
};
