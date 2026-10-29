# Ảnh thay thế cho hình vẽ bằng code

Đặt ảnh (`.webp`, `.png`, `.jpg` hoặc `.svg`) vào đúng thư mục và đúng tên dưới đây. Game tự dùng ảnh thay cho hình vẽ bằng code; thiếu file nào thì file đó vẫn dùng hình vẽ. Nhân vật và quái nên nền trong suốt.

## Cách đặt tên

| Thư mục | Tên file | Ví dụ |
|---|---|---|
| `monsters/` | tên quái bỏ dấu, nối bằng `-` (bảng bên dưới) | `lang-vuong.webp` |
| `cultivator/` | `<huong-tu>-<tu-the>`: hướng tu `none`/`kiem`/`the`/`phap`, tư thế `sit` (bế quan) hoặc `stand` (chiến đấu) | `kiem-stand.webp`, `none-sit.webp` |
| `scenes/` | `dong-phu` (tu luyện), `be-quan`, hoặc tên khu bí cảnh bỏ dấu (bảng bên dưới). Tháp Vô Cực dùng ảnh `hon-don-hu-khong` | `hac-phong-lam.webp` |
| `items/` | `<o>-<pham>`: ô `weapon`/`armor`/`pendant`/`ring`/`boots`, phẩm `0` (Phàm) … `4` (Thần) | `ring-3.webp` |
| `pills/` | mã đan: `tuKhi`, `tuKhi2`, `tuKhi3`, `phaCanh`, `phaCanh2`, `phaCanh3`, `hoiXuan` | `phaCanh2.webp` |
| `skills/` | mã võ kỹ, gồm cả chiêu quái và chiêu pháp bảo (`src/engine/skills.ts`) | `kiem_pha_thien.webp`, `n_tran_an.webp` |
| `techs/` | mã công pháp (`src/engine/techniques.ts`) | `kiem_0.webp`, `dan_khi.webp` |
| `buildings/` | `linh_dien`, `dan_phong`, `tu_linh`, `linh_mach` | `dan_phong.webp` |
| `herbs/` | mã thảo dược: `linh_thao`, `thanh_tam`, `huyet_sam`, `ket_dan`, `tu_linh_chi`, `ngoc_tuy`, `cuu_diep`, `thien_huong`, `hoan_hon`, `hon_nguyen` | `linh_thao.webp` |
| `natal/` | pháp bảo: `phi_kiem`, `ho_lo`, `linh_chung`, `tran_an`, `hon_phan`, `phong_quat` | `phi_kiem.webp` |

Kích thước gợi ý: quái và nhân vật 512×512, bối cảnh 1200×720 (tỉ lệ 5:3), biểu tượng 128×128.

### Tên file cảnh bí cảnh

| Tên file (không đuôi) | Khu |
|---|---|
| `hac-phong-lam` | Hắc Phong Lâm |
| `huyet-sac-cam-dia` | Huyết Sắc Cấm Địa |
| `van-yeu-coc` | Vạn Yêu Cốc |
| `co-ma-chien-truong` | Cổ Ma Chiến Trường |
| `thien-loi-hai` | Thiên Lôi Hải |
| `u-minh-gioi` | U Minh Giới |
| `thai-co-tien-phu` | Thái Cổ Tiên Phủ |
| `hon-don-hu-khong` | Hỗn Độn Hư Không |

### Tên file quái theo khu

Quái thường lần lượt theo tầng, cuối cùng là thủ lĩnh.

| Khu | Quái |
|---|---|
| Hắc Phong Lâm | `thanh-lang`, `doc-phong`, `hac-hung`, `thanh-lang-dau-linh`, `lang-vuong` |
| Huyết Sắc Cấm Địa | `huyet-buc`, `thi-khoi`, `huyet-mang`, `huyet-thi`, `huyet-mang-vuong` |
| Vạn Yêu Cốc | `hoa-ho`, `thiet-boi-vien`, `loi-ung`, `tam-vi-yeu-ho`, `yeu-coc-chi-chu` |
| Cổ Ma Chiến Trường | `ma-binh`, `oan-hon`, `cot-ma`, `ma-tuong`, `co-ma-thong-linh` |
| Thiên Lôi Hải | `hai-yeu`, `phong-bao-linh`, `loi-giao`, `loi-linh-cu-thu`, `loi-giao-vuong` |
| U Minh Giới | `u-hon`, `minh-xa`, `quy-tuong`, `cau-hon-su`, `u-minh-quy-de` |
| Thái Cổ Tiên Phủ | `khoi-loi-ho-phap`, `kiem-linh`, `tien-phu-thu-ve`, `dan-lo-khi-linh`, `tien-phu-khi-linh` |
| Hỗn Độn Hư Không | `hu-khong-thu`, `hon-don-ma`, `thien-ngoai-ta-ma`, `phe-tinh-trung`, `hon-don-co-than` |

## Chuyển động tự thêm cho ảnh thật

Ảnh đứng yên được game thêm chuyển động bằng code, không cần làm gì thêm:

- Bối cảnh: phóng và trượt rất chậm, hai lớp sương trôi ở phía trước.
- Nhân vật: thở nhẹ; ở cảnh tu luyện có thêm hào quang đập nhịp theo cảnh giới.
- Quái: nhấp nhô lơ lửng.
- Khi đánh nhau: lao tới, rung khi trúng đòn, ngã, né, choáng, thiêu đốt, số sát thương, hô tên chiêu và hiệu ứng chiêu thức vẫn chạy trên ảnh.
- Đột phá và Thiên Kiếp: sét, chớp trắng, vòng sáng hoặc vết nứt đặt đè lên ảnh.

Tất cả tắt khi hệ điều hành bật "giảm chuyển động". Hình vẽ bằng code vẫn có chuyển động riêng, nên không bị thêm hai lần.

## Ảnh động (cách 3)

Ngoài ảnh tĩnh, mọi mục trong bảng trên đều nhận được ảnh động theo hai cách:

1. **Ảnh động có sẵn** (`.gif`, WebP động, APNG): đặt đúng tên như ảnh tĩnh, game tự phát vòng lặp.
2. **Sprite sheet** (nhiều khung xếp trong một ảnh): thêm `.sheet-<cột>x<hàng>-<fps>` vào tên, trước đuôi file. Các khung xếp trái sang phải, trên xuống dưới, mọi khung cùng kích thước. Ví dụ `none-sit.sheet-4x2-6.webp` là 8 khung (4 cột, 2 hàng), 6 khung/giây, lặp vòng. Khung nên cùng tỉ lệ với ô hiển thị (nhân vật 100:120, quái 120:100, hiệu ứng vuông).

### Tư thế chiến đấu

Nhân vật và quái có thể có ảnh riêng cho từng tư thế; tư thế nào thiếu thì dùng ảnh gốc.

| Tư thế | Khi nào hiện | Tên file nhân vật | Tên file quái |
|---|---|---|---|
| `attack` | lúc ra đòn | `cultivator/<huong-tu>-attack` | `monsters/<ten-quai>-attack` |
| `cast` | lúc thi triển chiêu hỗ trợ (hồi máu, khiên, tăng lực, thanh tâm) | `cultivator/<huong-tu>-cast` | `monsters/<ten-quai>-cast` |
| `hit` | lúc bị đánh trúng | `cultivator/<huong-tu>-hit` | `monsters/<ten-quai>-hit` |
| `defeated` | khi bại trận | `cultivator/<huong-tu>-defeated` | `monsters/<ten-quai>-defeated` |

### Hiệu ứng một lần (thư mục `fx/`)

Phát đè lên cảnh một lần rồi dừng ở khung cuối; không có ảnh thì dùng hiệu ứng vẽ bằng code.

| Tên file | Khi nào phát |
|---|---|
| `fx/breakthrough` | đột phá đại cảnh giới thành công (không qua Thiên Kiếp) |
| `fx/stage-up` | lên một tầng trong cảnh giới |
| `fx/break-fail` | đột phá thất bại |
| `fx/kiep-pass` | vượt Thiên Kiếp |
| `fx/kiep-fail` | ngã xuống ở Thiên Kiếp |
| `fx/skill-<ma-vo-ky>` | khi thi triển chiêu đó (mã trong `src/engine/skills.ts`, ví dụ `fx/skill-kiem_pha_thien`), đặt trên mục tiêu của chiêu |

Tất cả ảnh động dừng ở khung đầu khi hệ điều hành bật "giảm chuyển động".

Xem toàn bộ biểu tượng và hình hiện có bằng cách mở trang với đuôi `#gallery`.
