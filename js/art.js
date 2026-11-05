// Tranh vẽ tay (chibi) cho nhân vật, quái, linh thú, kỹ năng. Tệp nằm ở assets/; bản gộp một tệp thay bằng data URI.
// Danh sách sinh tự động bằng tools/gen-art.mjs.
// <list>
const ART_LIST = ["heroes/kiem","heroes/kiem_dung","heroes/kiem_nu","heroes/kiem_nu_dung","heroes/meditate","heroes/meditate_nu","heroes/phu","heroes/phu_dung","heroes/phu_nu","heroes/phu_nu_dung","heroes/the","heroes/the_dung","heroes/the_nu","heroes/the_nu_dung","monsters/bang_hoang","monsters/bang_xa","monsters/bang_yeu","monsters/cu_kinh","monsters/cuu_vi_ho","monsters/da_tru","monsters/doc_hat","monsters/dung_nham_thu","monsters/hac_thi","monsters/hai_yeu","monsters/hau_yeu","monsters/hoa_van_bao","monsters/hoang_tuyen_quy","monsters/hon_don_de_quan","monsters/hon_don_linh","monsters/hon_don_thu","monsters/hu_anh","monsters/hu_khong_thu","monsters/hu_trung","monsters/hu_xa","monsters/huyet_buc","monsters/huyet_lang","monsters/huyet_ma","monsters/huyet_sa","monsters/kiem_khach","monsters/kim_giap_quy","monsters/kim_si_bang","monsters/lang_vuong","monsters/linh_phuong","monsters/linh_to","monsters/loc_than","monsters/loi_bao","monsters/loi_ky_lan","monsters/ma_long","monsters/ma_thi","monsters/ma_vien","monsters/moc_linh","monsters/moc_yeu","monsters/mong_yeu","monsters/soi_yeu","monsters/song_dau_ung","monsters/thach_cu_nhan","monsters/thai_co_ma_than","monsters/thap_linh","monsters/thien_binh","monsters/thiet_hung","monsters/tinh_thu","monsters/u_hon","monsters/xa_yeu","monsters/xuong_giap","skills/kiem_1","skills/kiem_2","skills/kiem_3","skills/kiem_4","skills/kiem_5","skills/kiem_6","skills/kiem_7","skills/kiem_8","skills/phu_1","skills/phu_2","skills/phu_3","skills/phu_4","skills/phu_5","skills/phu_6","skills/phu_7","skills/phu_8","skills/the_1","skills/the_2","skills/the_3","skills/the_4","skills/the_5","skills/the_6","skills/the_7","skills/the_8","ui/nut_be_quan","ui/nut_hanh_trang","ui/nut_ket_giao","ui/nut_lich_luyen","ui/nut_lo_ren","ui/nut_muu_sinh","ui/nut_thap","ui/nut_them","ui/nut_tu_bao","ui/nut_tu_luyen","pets/bang_ly","pets/hoa_phuong","pets/kim_ho","pets/kim_thiem","pets/ky_lan","pets/linh_hac","pets/quy_giap","pets/thanh_long","pets/tieu_ho","pets/van_ho","treasures/can_khon_dinh","treasures/ho_than_phu","treasures/hon_nguyen_chung","treasures/huyen_vu_an","treasures/huyet_sat_chau","treasures/phong_loi_phien","treasures/that_tinh_kiem","treasures/thien_co_la_ban","treasures/tinh_ha_binh","treasures/tu_linh_binh","treasures/van_loi_an"];
// </list>
export const ART = Object.fromEntries(ART_LIST.map((k) => [k, `assets/${k}.webp`]));
export const hasArt = (k) => !!ART[k];
export const artURL = (k) => ART[k] || '';
/** Tranh nhân vật theo đường tu */
const HERO_BASE = { kiem: 'kiem', the: 'the', tinh: 'phu' };
/** Tranh nhân vật theo đường tu và giới tính (nữ chưa có tranh thì dùng tranh nam) */
export const heroArt = (path, g = 'nam') => {
  const b = HERO_BASE[path] || 'meditate';
  return (g === 'nu' && ART[`heroes/${b}_nu`]) || ART[`heroes/${b}`];
};
/** Tranh đứng yên (túi trữ vật, hình đại diện); thiếu thì dùng tranh ra đòn */
export const heroStandArt = (path, g = 'nam') => {
  const b = HERO_BASE[path] || 'meditate';
  return (g === 'nu' && (ART[`heroes/${b}_nu_dung`] || ART[`heroes/${b}_nu`])) || ART[`heroes/${b}_dung`] || ART[`heroes/${b}`];
};
/** Tranh ngồi thiền (bế quan) */
export const meditateArt = (g = 'nam') => (g === 'nu' && ART['heroes/meditate_nu']) || ART['heroes/meditate'];
/** Hào quang vẽ thêm cho tranh không có sẵn hào quang */
export const heroFilter = () => '';
/** Biểu tượng kỹ năng (tên tệp trùng mã kỹ năng) */
export const skillArt = (id) => ART[`skills/${id}`] || '';
// quái: theo từ khóa trong tên, không khớp thì chọn theo seed; mỗi biến thể đổi màu nhẹ
// chữ đứng riêng (tránh "Thi" khớp nhầm "Thiết", "Thiên"; "Hồ" khớp nhầm "Hồi")
const W = (w) => new RegExp(`(^|\\s)(${w})(\\s|$)`);
const MON_RULES = [
  // tranh riêng (đặt trước để không bị luật chung bắt nhầm, vd "Hỏa Vân Báo" có chữ Hỏa)
  [/Lôi Văn Báo|Lôi Báo/, ['monsters/loi_bao']], [/Hỏa Vân Báo/, ['monsters/hoa_van_bao']],
  [W('Hồ|Hồ Ly|Cửu Vĩ'), ['monsters/cuu_vi_ho']], [/Kỳ Lân/, ['monsters/loi_ky_lan']], [W('Quy|Rùa'), ['monsters/kim_giap_quy']],
  [/Đại Bằng|Kim Sí|Bằng/, ['monsters/kim_si_bang']], [W('Ưng'), ['monsters/song_dau_ung']], [/Phượng/, ['monsters/linh_phuong']],
  [/Tháp Linh/, ['monsters/thap_linh']], [/Linh Tổ Tàn Hồn|Linh Đế/, ['monsters/linh_to']],
  [/Lang Vương|Thú Lâm Chi Vương/, ['monsters/lang_vuong']], [/Băng Lang/, ['monsters/soi_yeu']],
  [/Bức/, ['monsters/huyet_buc', '|monsters/hu_anh']], [/Huyết Lang/, ['monsters/huyet_lang']], [W('Lang|Sói|Khuyển'), ['monsters/soi_yeu', 'monsters/huyet_lang']],
  [W('Hùng'), ['monsters/thiet_hung', '|monsters/ma_vien']], [W('Trư'), ['monsters/da_tru', '|monsters/ma_vien']],
  [/Cự Nhân|Thạch|Khôi Lỗi|Nham Thạch/, ['monsters/thach_cu_nhan', '|monsters/hon_don_de_quan']],
  [W('Hạt'), ['monsters/doc_hat']], [W('Lộc'), ['monsters/loc_than', '|monsters/hon_don_thu']],
  [W('Long|Ma Long|Long Vương|Long Hậu'), ['monsters/ma_long', '|monsters/hu_khong_thu']],
  [/Cự Kình|Kình/, ['monsters/cu_kinh', '|monsters/hu_khong_thu']], [/Huyết Sa|Sa Ngư/, ['monsters/huyet_sa', '|monsters/xa_yeu']], [/Hải Yêu/, ['monsters/hai_yeu', '|monsters/xa_yeu']],
  [/Tinh Thú|Tinh Hải/, ['monsters/tinh_thu', '|monsters/hu_khong_thu']], [W('Trùng|Trùng Mẫu'), ['monsters/hu_trung', '|monsters/hu_khong_thu']],
  [/Dung Nham/, ['monsters/dung_nham_thu', '|monsters/hon_don_linh']],
  [/Mộng|Huyễn|Tâm Ma/, ['monsters/mong_yeu', '|monsters/u_hon']],
  [/Kiếm Khách|Kiếm Chi Chủ|Bá Chủ|Đấu Sĩ/, ['monsters/kiem_khach', '|monsters/hon_don_de_quan']],
  [/Thiên Binh|Thiên Tướng|Thần Vệ|Thị Vệ|Thánh Vệ|Lôi Vệ|Vệ Binh/, ['monsters/thien_binh', '|monsters/hon_don_de_quan']],
  [/Băng Xà|Hàn Giao/, ['monsters/bang_xa']], [/Lôi.*Xà|Hư.*Xà|Ma Xà|Cửu Anh/, ['monsters/hu_xa']], [W('Xà|Giao|Đằng Xà'), ['monsters/xa_yeu', 'monsters/hu_xa']],
  [/Ma Viên/, ['monsters/ma_vien']], [/Hầu|Viên/, ['monsters/hau_yeu']],
  [/Thi Vương|Thi Mộ|Cương Thi|Thi Hổ/, ['monsters/hac_thi', 'monsters/ma_thi']], [W('Thi'), ['monsters/ma_thi']],
  [/Xương|Bất Tử|Tàn Binh|Kiếm Nô/, ['monsters/xuong_giap']],
  [/Diêm|Phán Quan|Hoàng Tuyền|Mạnh Bà|Luân Hồi|Tử Vong/, ['monsters/hoang_tuyen_quy']], [/Hồn|Quỷ|Âm|Ảnh/, ['monsters/u_hon', 'monsters/hu_anh']],
  [/Bức|Điệp/, ['monsters/hu_anh']],
  [/Thụ|Mộc|Đằng|Linh Hầu/, ['monsters/moc_yeu', 'monsters/moc_linh']],
  [/Hỏa|Viêm|Lửa|Lôi Linh/, ['monsters/hon_don_linh']], [/Tuyết|Băng|Hàn/, ['monsters/bang_yeu', 'monsters/bang_hoang']],
  [/Ma Thần|Ma Tôn|Thần Ma|Ma Tướng|Cổ Thần/, ['monsters/thai_co_ma_than']], [/Ma|Huyết/, ['monsters/huyet_ma']],
  [/Hư Không|Không Gian/, ['monsters/hu_khong_thu']],
  [/Báo|Hổ/, ['monsters/hoa_van_bao', 'monsters/loi_bao']],
  [/Điểu|Hạc/, ['monsters/bang_hoang']],
  [/Ngưu|Giác|Hỗn Độn|Thú/, ['monsters/hon_don_thu']],
  [/Tướng|Binh|Vệ|Sĩ|Khách|Pháp Sư|Đế|Tổ|Chủ|Linh Tộc|Vương/, ['monsters/hon_don_de_quan']],
];
const MON_ALL = () => ART_LIST.filter((k) => k.startsWith('monsters/'));
// hướng gốc của tranh: L = nhìn sang trái, R = nhìn sang phải, không ghi = nhìn thẳng
const FACE = {
  'monsters/bang_hoang': 'L', 'monsters/bang_xa': 'L', 'monsters/hac_thi': 'L', 'monsters/hau_yeu': 'L', 'monsters/hon_don_thu': 'L',
  'monsters/hu_khong_thu': 'L', 'monsters/hu_xa': 'L', 'monsters/huyet_lang': 'L', 'monsters/lang_vuong': 'L', 'monsters/soi_yeu': 'L', 'monsters/xa_yeu': 'L',
  'monsters/hoa_van_bao': 'L', 'monsters/loi_bao': 'L', 'monsters/cuu_vi_ho': 'L', 'monsters/kim_giap_quy': 'L', 'monsters/loi_ky_lan': 'L', 'monsters/kim_si_bang': 'L', 'monsters/song_dau_ung': 'L',
  'monsters/thiet_hung': 'L', 'monsters/da_tru': 'L', 'monsters/doc_hat': 'L', 'monsters/loc_than': 'L',
  'monsters/ma_long': 'L', 'monsters/hai_yeu': 'L', 'monsters/huyet_sa': 'L', 'monsters/cu_kinh': 'L', 'monsters/tinh_thu': 'L', 'monsters/hu_trung': 'L',
  'monsters/dung_nham_thu': 'L', 'monsters/mong_yeu': 'L', 'monsters/kiem_khach': 'L', 'monsters/thien_binh': 'L', 'monsters/thap_linh': 'L',
};
const keyOf = (src) => Object.keys(ART).find((k) => ART[k] === src);
/** Có cần lật tranh để nhìn về phía want ('L' hoặc 'R') không */
export const needFlip = (src, want) => { const f = FACE[keyOf(src)]; return !!f && f !== want; };
const HUES = [0, 0, 0, 25, -25, 60, -60, 150];
/** { src, filter } cho một con quái */
export function monsterArt(name = '', seed = 1) {
  const n = String(name).replace(/^(\S+ · )+/, '');
  let pool = null;
  // mục bắt đầu bằng | là tranh dự phòng: chỉ dùng khi chưa có tranh riêng
  for (const [re, ks] of MON_RULES) if (re.test(n)) { pool = ks.filter((k) => k[0] !== '|' && ART[k]); if (!pool.length) pool = ks.filter((k) => k[0] === '|' && ART[k.slice(1)]).map((k) => k.slice(1)); if (pool.length) break; }
  if (!pool || !pool.length) pool = MON_ALL();
  if (!pool.length) return null;
  const k = pool[Math.abs(seed) % pool.length];
  const hue = HUES[Math.abs(seed >> 3) % HUES.length];
  return { src: ART[k], filter: hue ? `hue-rotate(${hue}deg)` : '' };
}
/** Biểu tượng nút: tranh assets/ui/nut_<id> nếu có, không thì chữ dự phòng */
export function uiIcon(id, fb = '') {
  const s = ART[`ui/nut_${id}`];
  return s ? `<img class="ai btnIco" src="${s}" alt="" draggable="false">` : `<span class="ai">${fb}</span>`;
}
