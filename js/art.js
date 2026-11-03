// Tranh vẽ tay (chibi) cho nhân vật, quái, linh thú, kỹ năng. Tệp nằm ở assets/; bản gộp một tệp thay bằng data URI.
// Danh sách sinh tự động bằng tools/gen-art.mjs.
// <list>
const ART_LIST = ["heroes/kiem","heroes/kiem_nu","heroes/meditate","heroes/meditate_nu","heroes/phu","heroes/phu_nu","heroes/the","heroes/the_nu","monsters/bang_hoang","monsters/bang_xa","monsters/bang_yeu","monsters/hac_thi","monsters/hau_yeu","monsters/hoang_tuyen_quy","monsters/hon_don_de_quan","monsters/hon_don_linh","monsters/hon_don_thu","monsters/hu_anh","monsters/hu_khong_thu","monsters/hu_xa","monsters/huyet_lang","monsters/huyet_ma","monsters/lang_vuong","monsters/ma_thi","monsters/ma_vien","monsters/moc_linh","monsters/moc_yeu","monsters/soi_yeu","monsters/thai_co_ma_than","monsters/u_hon","monsters/xa_yeu","monsters/xuong_giap","pets/bang_ly","pets/hoa_phuong","pets/kim_ho","pets/kim_thiem","pets/ky_lan","pets/linh_hac","pets/quy_giap","pets/thanh_long","pets/tieu_ho","pets/van_ho","skills/kiem_1","skills/kiem_2","skills/kiem_3","skills/kiem_4","skills/kiem_5","skills/kiem_6","skills/kiem_7","skills/kiem_8","skills/phu_1","skills/phu_2","skills/phu_3","skills/phu_4","skills/phu_5","skills/phu_6","skills/phu_7","skills/phu_8","skills/the_1","skills/the_2","skills/the_3","skills/the_4","skills/the_5","skills/the_6","skills/the_7","skills/the_8"];
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
/** Tranh ngồi thiền (bế quan) */
export const meditateArt = (g = 'nam') => (g === 'nu' && ART['heroes/meditate_nu']) || ART['heroes/meditate'];
/** Hào quang vẽ thêm cho tranh không có sẵn hào quang */
export const heroFilter = () => '';
/** Biểu tượng kỹ năng (tên tệp trùng mã kỹ năng) */
export const skillArt = (id) => ART[`skills/${id}`] || '';
// quái: theo từ khóa trong tên, không khớp thì chọn theo seed; mỗi biến thể đổi màu nhẹ
const MON_RULES = [
  [/Vương|Lang Vương/, ['monsters/lang_vuong']], [/Huyết Lang|Huyết Nha/, ['monsters/huyet_lang']], [/Lang|Sói|Khuyển/, ['monsters/soi_yeu', 'monsters/huyet_lang']],
  [/Băng Xà|Hàn Giao|Băng Lang/, ['monsters/bang_xa']], [/Lôi.*Xà|Hư.*Xà|Ma Xà|Cửu Anh/, ['monsters/hu_xa']], [/Xà|Giao|Hải Yêu|Đằng Xà/, ['monsters/xa_yeu', 'monsters/hu_xa']],
  [/Ma Viên|Hùng|Trư/, ['monsters/ma_vien']], [/Hầu|Viên/, ['monsters/hau_yeu']],
  [/Thi Vương|Thi Mộ|Cương Thi|Thi Hổ/, ['monsters/hac_thi', 'monsters/ma_thi']], [/Thi/, ['monsters/ma_thi']],
  [/Xương|Bất Tử|Tàn Binh|Kiếm Nô/, ['monsters/xuong_giap']],
  [/Diêm|Phán Quan|Hoàng Tuyền|Mạnh Bà|Luân Hồi/, ['monsters/hoang_tuyen_quy']], [/Hồn|Quỷ|Âm|Ảnh|Mộng|Huyễn|Tâm Ma/, ['monsters/u_hon', 'monsters/hu_anh']],
  [/Bức|Điệp/, ['monsters/hu_anh']],
  [/Thụ|Mộc|Đằng|Linh Hầu/, ['monsters/moc_yeu', 'monsters/moc_linh']],
  [/Hỏa|Viêm|Dung Nham|Lửa/, ['monsters/hon_don_linh']], [/Băng|Tuyết|Hàn/, ['monsters/bang_yeu', 'monsters/bang_hoang']],
  [/Ma Thần|Ma Tôn|Ma Long|Thần Ma|Ma Tướng/, ['monsters/thai_co_ma_than']], [/Ma|Huyết/, ['monsters/huyet_ma']],
  [/Hư Không|Long|Kình/, ['monsters/hu_khong_thu']], [/Kỳ Lân/, ['pets/ky_lan']], [/Quy|Rùa/, ['pets/quy_giap']],
  [/Báo|Hổ/, ['pets/kim_ho', 'pets/tieu_ho']], [/Hồ/, ['pets/van_ho', 'pets/bang_ly']],
  [/Bằng|Ưng|Điểu|Phượng|Hạc|Tinh/, ['monsters/bang_hoang', 'pets/hoa_phuong']],
  [/Ngưu|Giác|Lộc|Hỗn Độn|Thú/, ['monsters/hon_don_thu']],
  [/Tướng|Binh|Vệ|Sĩ|Khách|Pháp Sư|Cự Nhân|Thạch|Đế|Tổ|Chủ|Linh Tộc/, ['monsters/hon_don_de_quan']],
];
const MON_ALL = () => ART_LIST.filter((k) => k.startsWith('monsters/'));
const HUES = [0, 0, 0, 25, -25, 60, -60, 150];
/** { src, filter } cho một con quái */
export function monsterArt(name = '', seed = 1) {
  const n = String(name).replace(/^(\S+ · )+/, '');
  let pool = null;
  for (const [re, ks] of MON_RULES) if (re.test(n)) { pool = ks.filter((k) => ART[k]); if (pool.length) break; }
  if (!pool || !pool.length) pool = MON_ALL();
  if (!pool.length) return null;
  const k = pool[Math.abs(seed) % pool.length];
  const hue = HUES[Math.abs(seed >> 3) % HUES.length];
  return { src: ART[k], filter: hue ? `hue-rotate(${hue}deg)` : '' };
}
