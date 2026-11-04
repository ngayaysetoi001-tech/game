// Dữ liệu tĩnh của Trăm Kiếp Phù Sinh.

// need: tu vi cần để viên mãn cảnh giới này (rồi đột phá lên cảnh giới kế)
// life: thọ nguyên gốc, pow: sức chiến đấu gốc, brk: tỉ lệ đột phá gốc LÊN cảnh giới kế
// Mỗi giới 9 cảnh giới. Phàm giới có thêm Phàm Nhân (chưa nhập đạo) ở đầu.
// Cảnh giới cuối mỗi giới (Độ Kiếp, Linh Đế) không đột phá bằng xác suất: cần lệnh bài của tháp và vượt lôi kiếp.
export const REALMS = [
  // Phàm giới (0..9)
  { n: 'Phàm Nhân', need: 60, life: 60, pow: 1, brk: 0.9 },
  { n: 'Luyện Khí', need: 300, life: 90, pow: 3, brk: 0.7 },
  { n: 'Trúc Cơ', need: 800, life: 140, pow: 9, brk: 0.55 },
  { n: 'Kim Đan', need: 2000, life: 220, pow: 27, brk: 0.45 },
  { n: 'Nguyên Anh', need: 5000, life: 350, pow: 80, brk: 0.36 },
  { n: 'Hóa Thần', need: 12000, life: 550, pow: 240, brk: 0.3 },
  { n: 'Luyện Hư', need: 30000, life: 750, pow: 700, brk: 0.25 },
  { n: 'Hợp Thể', need: 45000, life: 950, pow: 1200, brk: 0.22 },
  { n: 'Đại Thừa', need: 90000, life: 1250, pow: 2000, brk: 0.18 },
  { n: 'Độ Kiếp', need: 100000, life: 1600, pow: 3400, brk: 0 },
  // Linh giới (10..18)
  { n: 'Luyện Linh', need: 240000, life: 1500, pow: 6000, brk: 0.5 },
  { n: 'Chân Linh', need: 400000, life: 1800, pow: 10000, brk: 0.45 },
  { n: 'Huyền Linh', need: 650000, life: 2200, pow: 17000, brk: 0.4 },
  { n: 'Linh Hải', need: 1000000, life: 2700, pow: 29000, brk: 0.36 },
  { n: 'Linh Phách', need: 1600000, life: 3300, pow: 50000, brk: 0.32 },
  { n: 'Linh Vương', need: 2600000, life: 4000, pow: 85000, brk: 0.28 },
  { n: 'Linh Hoàng', need: 4200000, life: 4800, pow: 145000, brk: 0.25 },
  { n: 'Linh Tôn', need: 6800000, life: 5700, pow: 250000, brk: 0.22 },
  { n: 'Linh Đế', need: 11000000, life: 6800, pow: 420000, brk: 0 },
];
export const TOP_REALM = REALMS.length - 1;

// ---------- Vị diện ----------
// first: cảnh giới đầu tiên, top: cảnh giới cuối (phi thăng từ đây), ypt: số năm mỗi lượt
export const PLANES = [
  { id: 0, n: 'Phàm giới', first: 1, top: 9, base: 0, ypt: 1, tower: 'Thông Thiên Tháp', token: 'Thông Thiên Lệnh', next: 'Linh giới', map: 'hac_phong' },
  { id: 1, n: 'Linh giới', first: 10, top: 18, base: 10, ypt: 5, tower: 'Vạn Linh Tháp', token: 'Vạn Linh Lệnh', next: 'Tiên giới', map: 'van_linh_lam' },
];
export const planeOf = (realm) => (realm >= 10 ? 1 : 0);

// ---------- Cảnh giới nhỏ ----------
// Phàm Nhân không chia, Luyện Khí 9 tầng, từ Trúc Cơ: sơ kỳ, trung kỳ, hậu kỳ, đại viên mãn.
// Tổng tu vi mỗi cảnh giới lớn giữ nguyên, chỉ chia nấc. Lên nấc nhỏ là tự động, đột phá cảnh giới lớn vẫn như cũ.
export const SUB4 = ['sơ kỳ', 'trung kỳ', 'hậu kỳ', 'đại viên mãn'];
export const subN = (realm) => (realm === 0 ? 1 : realm === 1 ? 9 : 4);
export function subIdx(realm, tuvi) {
  const n = subN(realm);
  if (n === 1) return 0;
  return Math.max(0, Math.min(n - 1, Math.floor((tuvi / REALMS[realm].need) * n + 1e-9)));
}
/** 0..1 theo nấc (Phàm Nhân thì liên tục), dùng cho sức mạnh */
export function subFrac(realm, tuvi) {
  const n = subN(realm);
  return n === 1 ? Math.min(1, Math.max(0, tuvi / REALMS[realm].need)) : subIdx(realm, tuvi) / (n - 1);
}
export function realmLabel(realm, tuvi) {
  const R = REALMS[realm];
  const n = subN(realm);
  if (n === 1) return R.n;
  const k = subIdx(realm, tuvi);
  if (n === 9) return `${R.n} tầng ${k + 1}${tuvi >= R.need ? ' viên mãn' : ''}`;
  return `${R.n} ${SUB4[k]}`;
}

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
  { id: 'tu', n: 'Hậu duệ tu tiên gia tộc', w: 8, fx: { money: 40 }, desc: 'Tổ tiên từng có người Kim Đan. Gia tộc nay đã sa sút. Nhập đạo có sẵn 30% tu vi Phàm Nhân.' },
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
  { n: 'Kim Sí Đại Bằng', r: 7 },
  { n: 'Cửu Anh Ma Xà', r: 7 },
  { n: 'Hư Không Trùng Mẫu', r: 8 },
  { n: 'Hỗn Độn Cự Thú', r: 9 },
  { n: 'Lôi Kiếp Ma Thần', r: 9 },
  // Linh giới
  { n: 'Linh Hầu', r: 10 }, { n: 'Thụ Yêu', r: 10 },
  { n: 'Huyết Linh Giao', r: 11 }, { n: 'Thanh Vân Lộc Thần', r: 11 },
  { n: 'Lôi Văn Báo', r: 12 }, { n: 'Hải Yêu Vương', r: 12 },
  { n: 'Cửu Vĩ Linh Hồ', r: 13 }, { n: 'Thạch Hoàng Cự Nhân', r: 13 },
  { n: 'Phệ Hồn Ma Điệp', r: 14 }, { n: 'Kim Giáp Thần Quy', r: 14 },
  { n: 'Lôi Đình Kỳ Lân', r: 15 }, { n: 'Huyết Hải Ma Long', r: 15 },
  { n: 'Tử Vong Linh Vương', r: 16 }, { n: 'Thái Cổ Linh Phượng', r: 16 },
  { n: 'Hỗn Độn Linh Thú', r: 17 }, { n: 'Vẫn Linh Cổ Thần', r: 18 },
];

export const MOVES = ['Lưu Vân Chưởng', 'Phá Sơn Quyền', 'Hàn Băng Chỉ', 'Kinh Hồng Kiếm', 'Liệt Hỏa Đao', 'Bôn Lôi Cước', 'Tàn Nguyệt Trảm', 'Vạn Diệp Phi Hoa', 'Trấn Nhạc Ấn', 'Thanh Phong Bộ', 'Huyền Vũ Thuẫn', 'Truy Hồn Thích'];

export const ACTIONS = {
  tu_luyen: { n: 'Tu luyện', icon: '☯', minAge: 6, needDao: true, desc: 'Tu vi tăng nhanh nhất, củng cố căn cơ, xả sát khí, dưỡng thương. Tu liền 10 năm: đột phá +15%. Kỳ ngộ hiếm, chỉ chuyện nội tu (đốn ngộ, tâm ma, linh khí triều…).' },
  lich_luyen: { n: 'Lịch luyện', icon: '⛰', minAge: 10, desc: 'Đi khắp nơi: đánh yêu thú, nhặt đồ, nguyên liệu, gặp người trên đường. Kỳ ngộ nhiều, đổi theo địa hình vùng. Tích sát khí, tu vi chưa vững, gần như không dưỡng thương.' },
  muu_sinh: { n: 'Mưu sinh', icon: '⚖', minAge: 8, desc: 'Kiếm linh thạch, luyện nghề phụ, quen biết người ở trấn. Kỳ ngộ chợ búa, tửu lâu, đấu giá, thương đội. Bấm để chọn nghề.' },
  vuot_thap: { n: 'Vượt tháp', icon: '🗼', minAge: 10, needDao: true, desc: 'Leo tháp 1000 tầng. Hạ tầng cuối mới được phi thăng.' },
};

// Đan dược bán ở Tụ Bảo Lâu. price là giá ở Phàm Nhân, nhân (1 + cảnh giới) khi mua.
export const PILLS = {
  hoi_xuan: { n: 'Hồi Xuân Đan', price: 25, desc: 'Chữa thương: hồi 40 (trọng thương thành thương nhẹ).' },
  pha_canh: { n: 'Phá Cảnh Đan', price: 100, desc: 'Dùng khi đột phá: tỉ lệ +10%.' },
  dien_tho: { n: 'Diên Thọ Đan', price: 120, desc: 'Thọ nguyên +5%. Mỗi cảnh giới chỉ hấp thu được một viên.' },
  tinh_tam: { n: 'Tĩnh Tâm Đan', price: 40, desc: 'Tâm tính +6. Phá được bình cảnh nhỏ.' },
  ngung_than: { n: 'Ngưng Thần Đan', price: 50, desc: 'Sát khí -40. Luyện đan sư tự luyện được.' },
  bao_khi: { n: 'Bạo Khí Đan', price: 90, craft: true, desc: 'Trận lớn kế tiếp (trùm, vùng chủ, lôi kiếp): công +30%. Chỉ luyện đan sư làm ra, hoặc đổi ở Tháp thương điếm.' },
};

// Tàn niệm: chọn 1 trong 3 khi chết, mang sang kiếp sau
export const LEGACIES = [
  { id: 'ky_uc', n: 'Ký ức đạo pháp', desc: 'Ngộ tính +15. Nhập đạo lúc 6 tuổi đã có sẵn nửa tầng tu vi.' },
  { id: 'than_the', n: 'Thân thể kiếp trước', desc: 'Căn cốt +15.' },
  { id: 'co_duyen', n: 'Dư âm cơ duyên', desc: 'Cơ duyên +15.' },
  { id: 'kiem_y', n: 'Tàn hồn kiếm ý', desc: 'Sức chiến đấu +20% suốt kiếp sau.' },
  { id: 'linh_can', n: 'Linh căn tôi luyện', desc: 'Gieo linh căn hai lần, lấy cái tốt hơn.' },
  { id: 'tam_canh', n: 'Tâm như chỉ thủy', desc: 'Tâm tính +15.' },
  { id: 'duyen', n: 'Một sợi tơ duyên', desc: 'Người thân thiết nhất kiếp này sẽ sớm tìm thấy ngươi.' },
  { id: 'tai_san', n: 'Rương chôn dưới gốc đào', desc: 'Chôn lại một nửa linh thạch (tối đa 500) cho kiếp sau.' },
  { id: 'huyet_mach', n: 'Huyết mạch còn vương', desc: 'Kiếp sau giữ lại thể chất của kiếp này.' },
  { id: 'than_khi', n: 'Thần khí nhận chủ', desc: 'Mang món đồ Thần thoại mạnh nhất sang kiếp sau. Phải tu lại tới cảnh giới của nó mới mở hết sức mạnh.' },
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
  { id: 'thach_tam', n: 'Thạch Tâm Thể', tier: 2, w: 1.2, desc: 'Ngồi yên như đá: tu luyện hiệu quả gấp rưỡi. Ít gặp kỳ ngộ hơn 30%.', fx: { closedMul: 1.5, eventRate: 0.7 } },
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
export const DH_HON = [null, null, 'Tử', 'Chân Nhân', 'Chân Quân', 'Đạo Quân', 'Tôn Giả', 'Thánh Quân', 'Đạo Tôn', 'Thiên Tôn', 'Linh Quân', 'Linh Quân', 'Huyền Quân', 'Huyền Quân', 'Linh Tôn Giả', 'Linh Vương', 'Linh Hoàng', 'Linh Thánh Tôn', 'Linh Đế'];
export const DH_HON_NU = [null, null, 'Tiên Tử', 'Chân Nhân', 'Chân Quân', 'Nguyên Quân', 'Tôn Giả', 'Thánh Nữ', 'Đạo Tôn', 'Thiên Tôn', 'Linh Tiên Tử', 'Linh Tiên Tử', 'Huyền Nữ', 'Huyền Nữ', 'Linh Tôn Giả', 'Linh Hậu', 'Linh Hoàng', 'Linh Thánh Tôn', 'Linh Đế'];
export const DH_HON_MA = [null, null, 'Tử', 'Ma Nhân', 'Ma Quân', 'Ma Quân', 'Ma Tôn', 'Ma Tôn', 'Ma Tôn', 'Ma Tổ', 'Linh Ma', 'Linh Ma', 'Huyết Ma Quân', 'Huyết Ma Quân', 'Ma Tôn Giả', 'Ma Vương', 'Ma Hoàng', 'Ma Thánh', 'Ma Đế'];

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
  { id: 'tang_bao', n: 'Tàng Bảo Các Chủ', cond: 'Mang một món Cực phẩm trở lên', bonus: 'Kỳ ngộ +5%', fx: { eventRate: 1.05 }, check: (g) => Object.values(g.P.eq || {}).some((it) => it && it.q >= 3) },
  { id: 'vo_hoc', n: 'Võ Học Tông Sư', cond: 'Mở đủ 8 kỹ năng của đạo lộ', bonus: 'Chiến đấu +4%', fx: { fightMul: 1.04 }, check: (g) => Object.keys(g.skillLvs()).length >= 8 },
  { id: 'tong_su_ren', n: 'Luyện Khí Tông Sư', cond: 'Tay nghề rèn đạt 100', bonus: 'Cường hóa, rèn +5%', fx: { forgeBonus: 0.05 }, check: (g) => (g.P.forge || 0) >= 100 },
  { id: 'tu_dia', n: 'Tử Địa Hành Giả', cond: 'Sống sót 10 năm lịch luyện ở Tử địa trở lên', bonus: 'Chiến đấu +5%, chịu đòn -5%', fx: { fightMul: 1.05, hurtMul: 0.95 }, check: (g) => (g.P.cnt.hard || 0) >= 10 },
  { id: 'thap_100', n: 'Bách Tầng Tháp Khách', cond: 'Vượt tầng 100 của tháp', bonus: 'Chiến đấu +3%', fx: { fightMul: 1.03 }, check: (g) => g.towerBest() >= 100 },
  { id: 'thap_500', n: 'Ngũ Bách Tầng', cond: 'Vượt tầng 500 của tháp', bonus: 'Chiến đấu +6%', fx: { fightMul: 1.06 }, check: (g) => g.towerBest() >= 500 },
  { id: 'thap_1000', n: 'Vấn Đỉnh Thông Thiên', cond: 'Vượt tầng 1000 Thông Thiên Tháp', bonus: 'Chiến đấu +8%, đột phá +3%', fx: { fightMul: 1.08, brk: 0.03 }, check: (g) => !!(g.P.tokens && g.P.tokens[0]) },
  { id: 'phi_thang_gia', n: 'Phi Thăng Giả', cond: 'Phi thăng lên Linh giới', bonus: 'Tu luyện +8%', fx: { gainMul: 1.08 }, check: (g) => g.P.plane >= 1 && !!g.P.flags.ascendedFrom },
  { id: 'van_linh_chu', n: 'Vạn Linh Chi Chủ', cond: 'Vượt tầng 1000 Vạn Linh Tháp', bonus: 'Chiến đấu +10%, tu luyện +10%', fx: { fightMul: 1.1, gainMul: 1.1 }, check: (g) => !!(g.P.tokens && g.P.tokens[1]) },
  { id: 'huyet_mach', n: 'Huyết Mạch Thức Tỉnh', cond: 'Mang thể chất Truyền thuyết trở lên', bonus: 'Đột phá +2%', fx: { brk: 0.02 }, check: (g) => g.traits()[0].tier >= 3 },
];

// phẩm danh hiệu theo độ khó: 1 Thường, 2 Hiếm, 3 Truyền kỳ, 4 Thần thoại
const TITLE_TIER = {
  thap_100: 1, thap_500: 2, thap_1000: 3, phi_thang_gia: 3, van_linh_chu: 4,
  tong_su_ren: 3, tu_dia: 3,
  so_xuat: 1, danh_chan: 1, lao_thu: 1,
  bach_chien: 2, khac_tinh: 2, thien_kieu_tu: 2, phu_giap: 2, hiep_khach: 2, thu_dich: 2, than_tien: 2, bao_thu: 2, tru_cot: 2, vo_hoc: 2,
  thieu_nien: 3, lao_bat_tu: 3, vong_tinh: 3, bang_huu: 3, dao_ly: 3, cuu_tu: 3, danh_thien_ha: 3, thap_dai: 3, tang_bao: 3, huyet_mach: 3,
  duc_hoa: 4, bang_thu: 4,
};
for (const t of TITLES) t.tier = TITLE_TIER[t.id] || 1;
export const TITLE_TIER_N = ['', 'Thường', 'Hiếm', 'Truyền kỳ', 'Thần thoại'];

// ---------- Con đường tu hành (chọn khi lên Trúc Cơ) ----------
// req(P): điều kiện, pm: hệ số trong trận, fx: hiệu ứng ngoài trận (chung hệ với thể chất)
// Ba con đường tu hành: chọn khi nhập đạo (6 tuổi). Mỗi đường một bộ 8 kỹ năng (combat.js: PATH_SKILLS).
// pm: hệ số chỉ số trong trận, fx: hiệu ứng ngoài trận (như thể chất)
export const PATHS = {
  kiem: {
    n: 'Kiếm Tu', icon: '⚔', res: 'Kiếm ý', wep: 'kiem', hero: 'kiem',
    tag: 'Một kiếm phá vạn pháp', short: 'Sát thương dồn dập, kết liễu nhanh, mỏng manh.',
    desc: 'Bản mệnh phi kiếm chém theo mỗi đòn. Kiếm ý tích theo nhát kiếm, đủ 10 tung Tru Tiên Nhất Kiếm. Công +5%, sinh lực -5%, thủ -5%. Cần cầm kiếm.',
    good: ['Sát thương cao nhất, leo tháp nhanh', 'Bạo kích, né tránh, ra tay trước', 'Lôi kiếp: kiếm trảm lôi, mỗi đợt 25% yếu đi 20%'],
    bad: ['Máu mỏng, thủ thấp', 'Sợ giáp dày, phản đòn', 'Không cầm kiếm thì chiêu chỉ còn 60%'],
    bars: { cong: 5, thu: 2, khong: 3, tu: 3, ky: 3 },
    pm: { hpPct: -0.05, defPct: -0.05, atkPct: 0.05 }, fx: {},
  },
  the: {
    n: 'Thể Tu', icon: '🛡', res: 'Nộ huyết', wep: 'quyen', hero: 'the',
    tag: 'Lấy thân làm pháp bảo', short: 'Trâu bò, đánh lâu, càng đau càng mạnh.',
    desc: 'Không cần linh lực: chiêu mạnh đốt máu của chính mình. Bị đánh tích Nộ huyết (+6, đánh trúng +4), đủ 100 tung Thái Sơn Áp Đỉnh. Sinh lực +15%, thọ +20%, chịu tai họa -50%. Tu vi -12%.',
    good: ['Sống dai nhất, hồi máu mỗi lượt', 'Miễn choáng, phản đòn, Bất Diệt', 'Lịch luyện vùng hiểm an toàn, thọ cao'],
    bad: ['Tu vi chậm nhất', 'Không có sát thương chuẩn', 'Sợ địch né cao và đòn tinh thần'],
    bars: { cong: 3, thu: 5, khong: 3, tu: 2, ky: 2 },
    pm: { hpPct: 0.15, defPct: 0.05 }, fx: { gainMul: 0.88, lifeMul: 1.2, hurtMul: 0.5 },
  },
  tinh: {
    n: 'Tinh Thần Lực', icon: '👁', res: 'Thần thức', wep: 'phap', hero: 'phu',
    tag: 'Thần niệm ngự phù', short: 'Sát thương chuẩn, khống chế, nhìn thấu.',
    desc: 'Dùng thần thức vẽ phù văn giữa không trung: đòn bỏ qua thủ, loạn thần, hỗn loạn. Thần thức đầy 100 tung Thiên Lôi Thần Phạt. Đột phá +6%, nghề phụ và kỳ ngộ tốt nhất. Sinh lực, thủ -20%.',
    good: ['Sát thương chuẩn xuyên giáp, khiên', 'Khống chế: loạn thần, hỗn loạn, tiên tri', 'Đột phá, tu luyện, nghề phụ, kỳ ngộ tốt nhất'],
    bad: ['Máu, thủ thấp nhất', 'Quái vô hồn (cương thi, khôi lỗi, trùng) miễn khống chế, chịu -50%', 'Lôi kiếp đợt 9 đánh vào hồn nặng hơn'],
    bars: { cong: 3, thu: 2, khong: 5, tu: 5, ky: 5 },
    pm: { hpPct: -0.2, defPct: -0.2 }, fx: { brk: 0.06, gainMul: 1.05 },
  },
};
export const PATH_BAR_N = { cong: 'Công', thu: 'Thủ', khong: 'Khống chế', tu: 'Tốc tu', ky: 'Kỳ ngộ, nghề' };

// ---------- Bản đồ lịch luyện ----------
// Độ khó tính theo cảnh giới HIỆN TẠI của nhân vật: yêu thú cùng cảnh giới, sức mạnh nhân pow.
// loot: hệ số thu hoạch, myth: tỉ lệ một món rơi ra là Thần thoại, lethal: hệ số nguy hiểm tính mạng khi thua,
// haz: tai họa thiên nhiên mỗi năm (tỉ lệ, sát thương), mat: nguyên liệu đặc trưng
export const DIFF = [
  { n: 'Dễ', ic: '🟢' }, { n: 'Vừa', ic: '🟡' }, { n: 'Khó', ic: '🟠' },
  { n: 'Nguy hiểm', ic: '🔴' }, { n: 'Tử địa', ic: '☠' }, { n: 'Luyện ngục', ic: '💀' },
];
export const MAPS = [
  { id: 'ngoai_o', n: 'Ngoại ô Thanh Thạch', d: 0, pow: 0.6, loot: 0.6, myth: 0, lethal: 0.3, haz: null, mat: 'tinh_thiet', beast: 'Dã', desc: 'Đồng cỏ và rừng thưa quanh trấn. Yêu thú nhút nhát, người qua lại đông.' },
  { id: 'hac_phong', n: 'Hắc Phong Lĩnh', d: 1, pow: 1, loot: 1, myth: 0, lethal: 1, haz: null, mat: 'thu_hach', beast: '', desc: 'Dãy núi gió đen, bầy sói và gấu sắt làm tổ.' },
  { id: 'vu_an', n: 'Vụ Ẩn Đầm Lầy', d: 2, pow: 1.25, loot: 1.5, myth: 0.01, lethal: 1.3, haz: [0.06, 12, 'Sương độc tràn qua đầm, ngươi hít phải mấy hơi', 'trúng sương độc giữa đầm lầy'], mat: 'doc_nang', beast: 'Độc', desc: 'Sương độc quanh năm. Thảo dược quý mọc giữa bùn lầy.' },
  { id: 'xich_diem', n: 'Xích Diệm Cốc', d: 3, pow: 1.5, loot: 2.2, myth: 0.025, lethal: 1.6, haz: [0.09, 18, 'Nham thạch phun trào, ngươi chạy không kịp, bỏng một mảng lưng', 'chết cháy trong dòng nham thạch'], mat: 'hoa_tinh', beast: 'Hỏa', desc: 'Lòng núi lửa, nham thạch chảy thành sông. Hỏa tinh kết trong đá.' },
  { id: 'co_chien', n: 'Cổ Chiến Trường', d: 4, pow: 1.8, loot: 3, myth: 0.05, lethal: 2, haz: [0.12, 24, 'Oán hồn vạn năm quấn lấy ngươi suốt một đêm', 'bị oán hồn cổ chiến trường hút cạn sinh khí'], mat: 'binh_hon', beast: 'Huyết', desc: 'Nơi chư tiên đại chiến vạn năm trước. Oán hồn và binh khí cổ nằm la liệt.' },
  { id: 'hu_khong', n: 'Hư Không Liệt Cốc', d: 5, pow: 2.1, loot: 4, myth: 0.09, lethal: 2.5, haz: [0.15, 32, 'Một vết nứt không gian lướt qua, suýt cắt ngươi làm đôi', 'bị vết nứt không gian xé nát'], mat: 'than_hon', beast: 'Hư Không', desc: 'Vết nứt của trời đất. Không gian vỡ vụn, mười người vào chỉ một trở về.' },
];
export const MAP_MAP = Object.fromEntries(MAPS.map((m) => [m.id, m]));
export const DEFAULT_MAP = 'hac_phong';

// ---------- Nguyên liệu rèn ----------
// aff: dùng làm dẫn liệu để chắc chắn ra dòng thuộc tính đó
export const MATS = {
  tinh_thiet: { n: 'Tinh thiết', q: 0, col: '#9aa3ab', desc: 'Sắt tinh luyện, nguyên liệu cơ bản của mọi lò rèn.' },
  linh_tinh: { n: 'Linh tinh', q: 2, col: '#8fd3ff', desc: 'Linh khí ngưng kết. Dùng để tẩy luyện và rèn đồ tốt.' },
  thu_hach: { n: 'Thú hạch', q: 1, col: '#c0503a', aff: 'ls', desc: 'Lõi yêu lực trong thân yêu thú. Dẫn liệu cho dòng Hút máu.' },
  doc_nang: { n: 'Độc nang', q: 1, col: '#6fbf4a', aff: 'dodge', desc: 'Túi độc của sinh vật đầm lầy. Dẫn liệu cho dòng Né tránh.' },
  hoa_tinh: { n: 'Hỏa tinh', q: 2, col: '#ff7a2a', aff: 'crit', desc: 'Tinh thể kết trong đá núi lửa. Dẫn liệu cho dòng Bạo kích.' },
  binh_hon: { n: 'Binh hồn', q: 3, col: '#d8c06a', aff: 'rf', desc: 'Tàn hồn của binh khí cổ. Dẫn liệu cho dòng Phản chấn.' },
  than_hon: { n: 'Thần hồn', q: 4, col: '#ff3b5a', desc: 'Mảnh hồn của thần khí. Cần để rèn và thăng cấp đồ Thần thoại.' },
};

// ---------- Linh giới: bản đồ, nguyên liệu ----------
MAPS.push(
  { id: 'tiep_dan_coc', plane: 1, n: 'Tiếp Dẫn Cốc', d: 0, pow: 0.6, loot: 0.6, myth: 0, lethal: 0.3, haz: null, mat: 'linh_moc', beast: '', desc: 'Thung lũng dưới chân Tiếp Dẫn Đài, nơi người phi thăng đáp xuống. Linh thú ở đây hiền lành.' },
  { id: 'van_linh_lam', plane: 1, n: 'Vạn Linh Sâm Lâm', d: 1, pow: 1, loot: 1, myth: 0, lethal: 1, haz: null, mat: 'linh_tuy', beast: '', desc: 'Rừng cổ vạn năm, cây nào cũng có linh trí. Thụ yêu và linh hầu làm chủ.' },
  { id: 'huyet_linh_hai', plane: 1, n: 'Huyết Linh Hải', d: 2, pow: 1.25, loot: 1.5, myth: 0.01, lethal: 1.3, haz: [0.06, 12, 'Huyết vụ bốc lên từ mặt biển, ngươi hít phải mấy hơi', 'bị huyết vụ ăn mòn ngũ tạng'], mat: 'huyet_linh_chau', beast: 'Huyết', desc: 'Biển nước đỏ như máu, hải yêu ẩn dưới sóng.' },
  { id: 'loi_minh_nguyen', plane: 1, n: 'Lôi Minh Cao Nguyên', d: 3, pow: 1.5, loot: 2.2, myth: 0.025, lethal: 1.6, haz: [0.09, 18, 'Một đạo sét từ trời giáng xuống ngay cạnh chỗ ngươi đứng', 'bị sét cao nguyên đánh thành tro'], mat: 'loi_tinh', beast: 'Lôi', desc: 'Cao nguyên sấm sét quanh năm. Lôi thú sinh ra từ tia chớp.' },
  { id: 'linh_hu_chien', plane: 1, n: 'Linh Hư Chiến Trường', d: 4, pow: 1.8, loot: 3, myth: 0.05, lethal: 2, haz: [0.12, 24, 'Tàn hồn linh tộc gào thét lao qua người ngươi', 'bị tàn hồn linh tộc xé nát thần hồn'], mat: 'linh_hon_tinh', beast: 'Tàn Hồn', desc: 'Cổ chiến trường nơi linh tộc diệt vong. Tàn hồn vẫn đánh nhau không ngừng.' },
  { id: 'van_linh_uyen', plane: 1, n: 'Vẫn Linh Uyên', d: 5, pow: 2.1, loot: 4, myth: 0.09, lethal: 2.5, haz: [0.15, 32, 'Vực sâu hút lấy linh hồn ngươi, suýt nữa không về được', 'linh hồn tan biến dưới đáy Vẫn Linh Uyên'], mat: 'dao_van_thach', beast: 'Vẫn Linh', desc: 'Vực sâu không đáy, nơi linh hồn tiêu tán. Đá dưới đáy khắc đầy đạo văn.' },
);
for (const m of MAPS) if (m.plane === undefined) m.plane = 0;
for (const m of MAPS) MAP_MAP[m.id] = m;
export const mapsOf = (plane) => MAPS.filter((m) => m.plane === plane);
Object.assign(MATS, {
  linh_moc: { n: 'Linh mộc', q: 1, col: '#7fbf5a', aff: 'sp', desc: 'Gỗ cây linh vạn năm. Dẫn liệu cho dòng Thân pháp.' },
  linh_tuy: { n: 'Linh tủy', q: 2, col: '#a8f0ff', desc: 'Tủy linh mạch. Dùng để linh hóa đồ hạ giới và rèn đồ Linh giới.' },
  huyet_linh_chau: { n: 'Huyết linh châu', q: 2, col: '#e03040', aff: 'ls', desc: 'Ngọc kết từ huyết vụ. Dẫn liệu cho dòng Hút máu.' },
  loi_tinh: { n: 'Lôi tinh', q: 3, col: '#ffe066', aff: 'crit', desc: 'Tinh thể kết từ tia sét. Dẫn liệu cho dòng Bạo kích.' },
  linh_hon_tinh: { n: 'Linh hồn tinh', q: 3, col: '#b08cff', aff: 'rf', desc: 'Tàn hồn linh tộc kết tinh. Dẫn liệu cho dòng Phản chấn.' },
  dao_van_thach: { n: 'Đạo văn thạch', q: 4, col: '#ff6a9a', desc: 'Đá khắc đạo văn từ đáy Vẫn Linh Uyên. Để rèn đồ Thần thoại ở Linh giới.' },
});
// nguyên liệu hiếm (rơi ít, chỉ 1 viên): dùng rèn đồ Thần thoại
export const RARE_MATS = new Set(['than_hon', 'dao_van_thach']);
export const mythMatOf = (plane) => (plane >= 1 ? 'dao_van_thach' : 'than_hon');

// ---------- Tháp 1000 tầng ----------
// Mỗi 100 tầng một tầng cảnh: tên, kiểu quái (beast: yêu thú, human: người/hồn), danh sách tên quái, trùm tầng
export const TOWER_THEMES = [
  [ // Thông Thiên Tháp
    { n: 'Thú Lâm', beast: true, mobs: ['Hắc Lang', 'Thiết Giác Ngưu', 'Độc Hạt'], boss: 'Thú Lâm Chi Vương' },
    { n: 'Thi Mộ', beast: true, mobs: ['Cương Thi', 'Thi Hổ', 'Quỷ Bộc'], boss: 'Thi Mộ Lão Tổ' },
    { n: 'Băng Ngục', beast: true, mobs: ['Băng Lang', 'Hàn Giao', 'Tuyết Yêu'], boss: 'Băng Phách Long Hậu' },
    { n: 'Hỏa Uyên', beast: true, mobs: ['Hỏa Linh', 'Dung Nham Thú', 'Viêm Ma'], boss: 'Viêm Ma Đại Vương' },
    { n: 'Quỷ Vực', beast: false, mobs: ['Quỷ Tướng', 'Âm Hồn', 'Huyết Quỷ'], boss: 'Quỷ Vực Diêm Quân' },
    { n: 'Kiếm Trủng', beast: false, mobs: ['Kiếm Hồn', 'Kiếm Nô', 'Tàn Kiếm Khách'], boss: 'Vạn Kiếm Chi Chủ' },
    { n: 'Ma Thành', beast: false, mobs: ['Ma Binh', 'Ma Tướng', 'Huyết Ma'], boss: 'Ma Thành Thành Chủ' },
    { n: 'Lôi Đài', beast: false, mobs: ['Lôi Vệ', 'Đấu Sĩ Bất Tử', 'Lôi Đài Tàn Ảnh'], boss: 'Lôi Đài Bá Chủ' },
    { n: 'Hư Không', beast: true, mobs: ['Hư Không Trùng', 'Không Gian Thú', 'Hư Ảnh'], boss: 'Hư Không Trùng Mẫu' },
    { n: 'Thiên Môn', beast: false, mobs: ['Thiên Binh', 'Thiên Tướng', 'Thủ Môn Thần Vệ'], boss: 'Tháp Linh Thông Thiên' },
  ],
  [ // Vạn Linh Tháp
    { n: 'Linh Mộc Giới', beast: true, mobs: ['Thụ Yêu', 'Linh Hầu', 'Đằng Xà'], boss: 'Thiên Niên Thụ Vương' },
    { n: 'Huyết Hải Tầng', beast: true, mobs: ['Huyết Giao', 'Hải Yêu', 'Huyết Sa'], boss: 'Huyết Hải Long Vương' },
    { n: 'Lôi Vực', beast: true, mobs: ['Lôi Báo', 'Lôi Ưng', 'Lôi Linh'], boss: 'Lôi Đình Kỳ Lân' },
    { n: 'Linh Tộc Cố Đô', beast: false, mobs: ['Linh Tộc Vệ Binh', 'Linh Tộc Pháp Sư', 'Linh Tộc Tàn Hồn'], boss: 'Linh Tộc Vong Quân' },
    { n: 'Mộng Cảnh', beast: false, mobs: ['Mộng Yêu', 'Huyễn Ảnh', 'Tâm Ma Hóa Thân'], boss: 'Mộng Cảnh Chi Chủ' },
    { n: 'Tinh Hải', beast: true, mobs: ['Tinh Không Cự Kình', 'Tinh Thú', 'Lưu Tinh Ưng'], boss: 'Tinh Hải Bá Chủ' },
    { n: 'Thần Ma Chiến Địa', beast: false, mobs: ['Thần Ma Tàn Binh', 'Ma Thần Bộc', 'Thần Ma Hồn'], boss: 'Thần Ma Tàn Tướng' },
    { n: 'Luân Hồi Lộ', beast: false, mobs: ['Luân Hồi Sứ', 'Vãng Sinh Hồn', 'Mạnh Bà Vệ'], boss: 'Luân Hồi Phán Quan' },
    { n: 'Hỗn Độn Biên', beast: true, mobs: ['Hỗn Độn Thú', 'Hư Vô Trùng', 'Khai Thiên Tàn Ảnh'], boss: 'Hỗn Độn Cổ Thú' },
    { n: 'Vạn Linh Đỉnh', beast: false, mobs: ['Linh Tổ Thị Vệ', 'Vạn Linh Thánh Vệ', 'Linh Đế Tàn Ảnh'], boss: 'Linh Tổ Tàn Hồn' },
  ],
];
// thiên phú của quái tinh anh, trùm: k là khóa trong gear của fighter
export const MOB_AFFIX = [
  { id: 'cuong', n: 'Cuồng Bạo', gear: { atkPct: 0.3 } },
  { id: 'hut', n: 'Hút Huyết', gear: { ls: 0.2 } },
  { id: 'giap', n: 'Thiết Giáp', gear: { dmgRed: 0.22 } },
  { id: 'khien', n: 'Hộ Thuẫn', gear: { startShield: 0.35 } },
  { id: 'phan', n: 'Phản Kích', gear: { rf: 0.25 } },
  { id: 'tai_sinh', n: 'Tái Sinh', gear: { regenTurn: 0.05 } },
  { id: 'lien', n: 'Liên Kích', gear: { combo: 0.3 } },
  { id: 'bao', n: 'Bạo Liệt', gear: { crit: 0.2, critDmg: 2.3 } },
  { id: 'mien', n: 'Bất Động', gear: { immune: true } },
  { id: 'bat_tu', n: 'Bất Tử', gear: { lastStand: true } },
];
export const MOB_AFFIX_MAP = Object.fromEntries(MOB_AFFIX.map((a) => [a.id, a]));

// ---------- Độ khó thế giới ----------
export const WORLD_DIFF = {
  thuong: { n: 'Thường', pow: 1, lethal: 1, reward: 1, desc: 'Như bản gốc.' },
  kho: { n: 'Khó', pow: 1.25, lethal: 1.3, reward: 1.3, desc: 'Quái mạnh hơn 25%, dễ mất mạng hơn 30%. Thưởng và Hồn Lực +30%.' },
  nghich: { n: 'Nghịch Thiên', pow: 1.6, lethal: 2, reward: 2, desc: 'Quái mạnh hơn 60%, thua dễ chết gấp đôi. Thưởng và Hồn Lực x2.' },
};

// ---------- Trùm tháp: mỗi trùm một bộ chiêu riêng (theo thứ tự 10 khu của tháp) ----------
// sk: chiêu (trong BEAST_SKILLS), gear: chỉ số riêng, mech: mô tả cơ chế cho người chơi
export const BOSS_KITS = [
  { sk: ['can_xe', 'cuong_bao', 'gam_thet'], gear: { atkPct: 0.1 }, mech: 'Cuồng bạo và gầm thét làm choáng' },
  { sk: ['b_trieu_thi', 'b_thi_doc'], gear: { ls: 0.08 }, mech: 'Triệu cương thi đỡ đòn (khiên), thi độc' },
  { sk: ['b_bang_phong', 'b_han_khi'], gear: { dmgRed: 0.1 }, mech: 'Đóng băng (mất lượt) rất hay trúng' },
  { sk: ['b_viem_nguc', 'b_hoa_bao'], gear: { atkPct: 0.12 }, mech: 'Thiêu đốt dài, đòn lửa mạnh' },
  { sk: ['b_quy_hut', 'b_am_phong'], gear: { ls: 0.18 }, mech: 'Hút sinh lực, bào mòn' },
  { sk: ['b_kiem_vuc', 'b_van_kiem'], gear: { rf: 0.22 }, mech: 'Kiếm vực phản sát thương, vạn kiếm nhiều nhát' },
  { sk: ['b_ma_bao', 'b_pha_giap'], gear: { atkPct: 0.2 }, mech: 'Ma bạo tăng công, phá giáp' },
  { sk: ['b_lien_quyen', 'gam_thet'], gear: { combo: 0.4 }, mech: 'Liên hoàn: đánh dồn nhiều đòn mỗi lượt' },
  { sk: ['b_hu_bo', 'b_khong_tram'], gear: { dodge: 0.25 }, mech: 'Hư không bộ: né rất cao' },
  { sk: [], gear: {}, mech: 'Mỗi giai đoạn mượn chiêu của ba trùm trước' },
];
// màu nền trận đấu theo khu của tháp
export const THEME_BG = ['#1f3a24', '#2b2636', '#1b3448', '#4a1d12', '#241733', '#353a44', '#3c1219', '#3b3315', '#150f2e', '#3d3420'];

// ---------- Tâm pháp (đã bỏ ở bản 4, giữ dữ liệu cho bản lưu cũ) ----------
// fx theo mỗi cấp
export const TAM_PHAP = {
  thanh_tam: { n: 'Thanh Tâm Quyết', fx: { gainMul: 0.03 }, desc: 'Tốc độ tu luyện +3% mỗi cấp.' },
  kim_than: { n: 'Kim Thân Quyết', fx: { hpPct: 0.04 }, desc: 'Sinh lực trong trận +4% mỗi cấp.' },
  linh_hai: { n: 'Linh Hải Công', fx: { mpRegen: 1.2 }, desc: 'Hồi linh lực mỗi lượt +1,2 mỗi cấp: ra sát chiêu nhiều hơn.' },
  kiem_tam: { n: 'Kiếm Tâm Quyết', fx: { crit: 0.015 }, desc: 'Bạo kích +1,5% mỗi cấp.' },
  hoi_xuan_cong: { n: 'Hồi Xuân Công', fx: { regenTurn: 0.004, regen: 0.4 }, desc: 'Mỗi lượt trong trận hồi 0,4% sinh lực mỗi cấp, ngoài trận hồi phục nhanh hơn.' },
  tinh_than: { n: 'Tĩnh Thần Quyết', fx: { satPurge: 0.12, brk: 0.006 }, desc: 'Tiêu sát khí nhanh hơn 12% và đột phá +0,6% mỗi cấp.' },
  bat_dong: { n: 'Bất Động Minh Vương Kinh', fx: { dmgRed: 0.012 }, desc: 'Giảm sát thương nhận vào 1,2% mỗi cấp.' },
};
export const TAM_PHAP_IDS = Object.keys(TAM_PHAP);

// ---------- Nghề phụ (Mưu sinh): chọn một nghề, cấp 1-9, chỉ lên cấp khi mưu sinh ----------
export const NGHE = {
  luyen_dan: { n: 'Luyện đan sư', icon: '⚗', desc: 'Mưu sinh luyện ra đan dược: Hồi Xuân, Ngưng Thần (giảm sát khí), Bạo Khí (tăng công một trận lớn), cấp cao ra Tĩnh Tâm, Phá Cảnh. Thu nhập linh thạch ít hơn.' },
  luyen_khi: { n: 'Luyện khí sư', icon: '⚒', desc: 'Mưu sinh rèn ra Tinh thiết, Linh tinh. Tay nghề rèn tăng, rèn và cường hóa rẻ hơn 4% mỗi cấp.' },
  phu_su: { n: 'Phù sư', icon: '📜', desc: 'Mưu sinh vẽ phù dùng một lần trong trận lớn: Hộ Thân (khiên), Bạo Lôi (tăng công), cấp 4 có Truyền Tống (thoát chết một lần).' },
  thuong_nhan: { n: 'Thương nhân', icon: '💰', desc: 'Thu nhập mưu sinh gấp đôi, mua ở Tụ Bảo Lâu rẻ hơn 3% mỗi cấp, mua được sản nghiệp sinh lời mỗi năm dù đang làm việc khác.' },
};
export const PHU = {
  ho_than: { n: 'Hộ Thân Phù', desc: 'Vào trận lớn có khiên 30% sinh lực.' },
  bao_loi: { n: 'Bạo Lôi Phù', desc: 'Vào trận lớn công +25%.' },
  truyen_tong: { n: 'Truyền Tống Phù', desc: 'Một lần sắp mất mạng thì tự kích hoạt, đưa ngươi thoát ra.' },
};

// ---------- Tháp thương điếm: đổi bằng Tháp tệ ----------
export const TOWER_SHOP = [
  { id: 'hx', n: '3 Hồi Xuân Đan', price: 12, pill: ['hoi_xuan', 3] },
  { id: 'nt', n: 'Ngưng Thần Đan', price: 15, pill: ['ngung_than', 1] },
  { id: 'bk', n: 'Bạo Khí Đan', price: 25, pill: ['bao_khi', 1] },
  { id: 'pc', n: 'Phá Cảnh Đan', price: 40, pill: ['pha_canh', 1] },
  { id: 'tt', n: 'Đá cường hóa (Tinh thiết, Linh tinh)', price: 20, mats: true },
  { id: 'vk', n: 'Ngọc giản ngộ đạo (◈ +5)', price: 70, book: true },
];

// ---------- Lịch trình tự động ----------
// bước: { a: việc, k: điều kiện chuyển bước ('y' số năm, 'sg' sát khí >=, 'sl' sát khí <=), v }
export const PLAN_STEP_ACTS = { vuot_thap: '🗼 Vượt tháp', lich_luyen: '⛰ Lịch luyện', tu_luyen: '☯ Tu luyện', muu_sinh: '⚖ Mưu sinh' };
export const PLAN_COND = { y: 'năm', sg: 'tới khi sát khí ≥', sl: 'tới khi sát khí ≤' };
export const PLAN_TEMPLATES = [
  { id: 'thap', n: 'Leo tháp', desc: 'Vượt tháp tới khi sát khí 60 → tu luyện 10 năm (xả sát khí, dưỡng thương, củng cố căn cơ, đột phá +15%).', steps: [{ a: 'vuot_thap', k: 'sg', v: 60 }, { a: 'tu_luyen', k: 'y', v: 10 }] },
  { id: 'dao', n: 'Tu đạo', desc: 'Tu luyện 20 năm → lịch luyện tới khi sát khí 40 → tu luyện 10 năm.', steps: [{ a: 'tu_luyen', k: 'y', v: 20 }, { a: 'lich_luyen', k: 'sg', v: 40 }, { a: 'tu_luyen', k: 'y', v: 10 }] },
  { id: 'giau', n: 'Làm giàu', desc: 'Mưu sinh 20 năm (kiếm linh thạch, quen biết) → tu luyện 10 năm.', steps: [{ a: 'muu_sinh', k: 'y', v: 20 }, { a: 'tu_luyen', k: 'y', v: 10 }] },
];
