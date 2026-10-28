# Tu Tiên Nhàn Rỗi

Game tu tiên nhàn rỗi (idle) chạy trên trình duyệt, lấy cảm hứng từ Nhất Niệm Tiêu Dao.
Viết bằng Vite + React + TypeScript.

## Chạy thử

```bash
npm install
npm run dev      # mở http://localhost:5173
npm test         # test logic game
npm run build    # bản build tĩnh ở dist/, deploy được lên GitHub Pages / Netlify
```

## Tính năng bản MVP

- **Tạo nhân vật & linh căn ngẫu nhiên**: từ Ngũ Hành Tạp Linh Căn (×1) tới Thiên Linh Căn (×3) và Dị Linh Căn (Lôi/Phong/Băng). Được đổi linh căn 3 lần.
- **9 đại cảnh giới**: Luyện Khí (9 tầng) → Trúc Cơ → Kim Đan → Nguyên Anh → Hóa Thần → Luyện Hư → Hợp Thể → Đại Thừa → Độ Kiếp (mỗi cảnh giới 4 tiểu cảnh).
  Tầng nhỏ tự lên; tầng cuối mỗi cảnh giới là **bình cảnh**, phải đột phá thủ công.
- **Đột phá có rủi ro**: thất bại mất 30% tu vi, bị thương 5 phút (tốc độ ×0.5), nhưng lần sau +5% tỉ lệ (tối đa +25%).
- **Bế quan**: 10 phút / 1 giờ / 8 giờ, tốc độ ×1.5 / ×2 / ×2.5. Xuất quan đúng hạn có sự kiện ngẫu nhiên (cơ duyên, linh thạch, đan dược, tâm ma).
- **Phường Thị**: Tụ Khí Đan, Phá Cảnh Đan (+15% đột phá), Hồi Xuân Đan; mua bằng linh thạch.
- **Tiến độ offline**: tính bù tối đa 12 giờ khi mở lại game.
- **Lưu tự động** vào localStorage mỗi 5 giây, có xuất/nhập mã lưu để chuyển máy.

### Giai đoạn 1: chiến đấu & build

- **Giao diện 4 tab**: Tu Luyện / Bí Cảnh / Nhân Vật / Phường Thị, có chấm báo khi có việc cần làm.
- **Bí Cảnh 40 tầng**, 8 khu vực, thủ lĩnh mỗi 5 tầng. Chiến đấu tự động theo thanh hành động (tốc độ, bạo kích),
  có ước tính tỉ lệ thắng và chiến báo chi tiết. **Đột phá đại cảnh giới yêu cầu vượt tầng chặn** (Trúc Cơ: 3, Kim Đan: 5, Nguyên Anh: 10…).
- **Lịch luyện**: treo máy ở tầng đã vượt (kể cả offline) để nhặt linh thạch, tàn quyển, pháp bảo; đổi lại tu luyện ×0.5. Không thể vừa lịch luyện vừa bế quan.
- **Pháp bảo** 3 ô (Vũ Khí, Hộ Giáp, Linh Bội) × 4 phẩm (Phàm → Tiên). Linh bội tăng tốc độ tu luyện. Túi 30 ô, bán nhanh đồ kém hơn.
- **Công pháp**: Dẫn Khí Quyết từ đầu; tới Trúc Cơ chọn **Kiếm Tu / Thể Tu / Pháp Tu** (không đổi được), linh căn hợp hệ ×1.25 hiệu quả.
  Nâng cấp bằng tàn quyển + linh thạch, giới hạn cấp theo cảnh giới.
- Save bản MVP tự nâng cấp; các tầng chặn của cảnh giới hiện tại được tính là đã vượt.

### Hình ảnh thủy mặc

- Toàn bộ hình vẽ bằng code (SVG + Canvas), không cần file ảnh: tranh sơn thủy nhiều lớp với viền mực loang và sương trôi,
  8 bối cảnh bí cảnh + động phủ + hang bế quan, tu sĩ ngồi thiền / chiến đấu theo hướng tu, 40 quái vật từ 9 dạng cơ thể.
- **Tu Luyện**: linh khí xoáy vào người, hào quang đổi màu theo cảnh giới; hiệu ứng lên tầng, sấm sét khi đột phá, vết nứt khi thất bại.
- **Bí Cảnh**: sân đấu phát lại từng đòn (lao vào, trúng đòn, số sát thương, bạo kích, thanh máu, Thắng/Bại), có nút Bỏ qua.
- Biểu tượng pháp bảo theo phẩm, đan dược. Tắt mọi chuyển động khi hệ điều hành bật "giảm chuyển động".
- Xem toàn bộ hình một lượt: mở trang với `#gallery` ở cuối địa chỉ.
- **Thay bằng ảnh thật**: đặt file vào `src/assets/art/` theo quy ước tên trong [README ở đó](src/assets/art/README.md);
  thiếu file nào thì game dùng hình vẽ bằng code.

### Tiện ích tự động (chạy cả khi offline)

- **Tự động khiêu chiến** (tab Bí Cảnh): đánh tầng kế tiếp mỗi 20 giây; thua thì tạm dừng tới khi chiến lực tăng, không bế quan cùng lúc.
- **Tự bế quan lại** (tab Tu Luyện): bế quan xong tự vào lại cùng loại; dừng khi tu vi đầy bình cảnh để người chơi đột phá.
- **Tự dùng pháp bảo tốt hơn / tự bán đồ kém hơn** khi nhặt được (tab Nhân Vật).
- **Tự dùng Hồi Xuân Đan** khi bị thương (tab Phường Thị).
- Thông báo nổi cho sự kiện quan trọng và khi có thể đột phá; thẻ **Thống Kê**; popup offline tóm tắt cả tầng vượt, trận đấu, số lần bế quan.

### Võ kỹ (đợt A)

- **15 võ kỹ**: 4 cho mỗi hướng tu + 3 dùng chung. Hiệu ứng: sát thương lớn, nhiều đòn, bạo kích, hút máu, choáng, thiêu đốt,
  giảm tốc, phá giáp, tăng công, né tránh, khiên, hồi máu, giải hiệu ứng xấu.
- **3 ô võ kỹ** mở ở Trúc Cơ / Kim Đan / Nguyên Anh. Trong trận tự dùng chiêu đầu tiên đã hồi chiêu theo thứ tự ưu tiên người chơi xếp.
- Học: chiêu đầu khi chọn hướng tu, **bí tịch rơi từ thủ lĩnh** (tầng 5, 10, 15, 20, 25), Tàng Kinh Các ở Phường Thị. Nâng cấp tới cấp 10 bằng tàn quyển + linh thạch.
- **Quái từ tầng 5 có chiêu thức**, thủ lĩnh có 2 chiêu; xem trước chiêu của đối thủ trong tab Bí Cảnh. Thủ lĩnh tầng 30/35/40 rơi gói tàn quyển.
- Sân đấu hô tên chiêu, hiện hồi máu, khiên, né, choáng, thiêu đốt. Tab Nhân Vật chia mục con: Tổng quan / Công Pháp / Võ Kỹ / Pháp Bảo.
- Save cũ tự nâng lên v4 và được trao lại các võ kỹ tương ứng với những thủ lĩnh đã hạ.

### Pháp bảo (đợt B)

- **5 ô**: Vũ Khí, Hộ Giáp, Linh Bội, Giới Chỉ (bạo kích), Hài (tốc độ). Thêm phẩm **Thần Phẩm** (×5.5), chỉ rơi từ thủ lĩnh; lịch luyện ở tầng thủ lĩnh cũng rơi đồ tốt như thủ lĩnh.
- **Thuộc tính phụ ngẫu nhiên** theo phẩm (0 / 1 / 2 / 3 / 3 dòng): hút máu, phản đòn, né tránh, bạo kích, % công / khí huyết / thủ, tốc độ, tu luyện, linh thạch.
- **Bộ trang bị theo khu bí cảnh**: pháp bảo rơi ở khu nào thì thuộc bộ khu đó (Thanh Lang, Huyết Ma, Yêu Hồ, Cổ Ma, Lôi Đình, U Minh, Tiên Phủ, Hỗn Độn).
  Mặc 2 món / 4 món cùng bộ để nhận thêm thuộc tính (hút máu, thiêu đốt mỗi đòn, phản đòn, choáng mỗi đòn…).
- **Cường hóa +1 đến +10** bằng linh thạch, mỗi cấp +8% chỉ số gốc; tỉ lệ thành công giảm dần (100% → 15%). Thất bại chỉ mất linh thạch.
- Chiến đấu hỗ trợ hút máu, phản đòn, né tránh, choáng và thiêu đốt từ pháp bảo. Save v4 tự nâng lên v5 (đồ cũ giữ nguyên, thêm ô Giới Chỉ và Hài).

### Công pháp theo phẩm cấp (đợt C)

- **1 công pháp chính + 2 công pháp phụ.** Mỗi hướng tu có 4 công pháp chính từ Hoàng đến Thiên Cấp
  (Kiếm: Thanh Liên Kiếm Quyết → Tử Điện Kiếm Điển → Ngự Kiếm Chân Kinh → Hỗn Nguyên Kiếm Kinh; Thể và Pháp tương tự). Phẩm càng cao càng mạnh và có thêm chỉ số riêng.
- **10 công pháp phụ** dùng chung: Dẫn Khí Quyết, Quy Tức Công (offline tới 16 giờ), Tụ Linh Trận Pháp (bế quan nhanh hơn), Thần Thức Quyết, Liễm Tức Thuật, Kim Chung Tráo, Phản Chấn Quyết, Phệ Huyết Công, Thiên Cơ Diễn Toán, Càn Khôn Đại Pháp.
- Học từ Tàng Kinh Các (Phường Thị) hoặc bí kíp rơi từ thủ lĩnh. Học công pháp chính mới sẽ kế thừa một nửa số tầng của công pháp cũ; công pháp cũ giữ nguyên tầng để đổi lại.
- Save v5 tự nâng lên v6: tầng công pháp cũ được giữ, và được học lại các bí kíp ứng với thủ lĩnh đã hạ.

### Bản mệnh pháp bảo (đợt D)

- Mở ở Trúc Cơ, chọn 1 trong 3: **Thanh Hồng Phi Kiếm** (công kích), **Càn Khôn Hồ Lô** (bền bỉ), **Trấn Hồn Linh Chung** (khống chế). Không đổi được.
- **Luyện hóa pháp bảo thừa** (theo phẩm, tầng, cấp cường hóa) để bản mệnh lên cấp 30. Có công tắc tự luyện hóa đồ kém hơn thay cho tự bán.
- Tiến hóa 4 giai đoạn (Phàm, Linh, Bảo, Tiên Khí) với thưởng thêm mỗi giai đoạn; có **chiêu bản mệnh riêng** luôn ưu tiên dùng trước trong trận, mạnh lên theo cấp. Bản mệnh lơ lửng cạnh nhân vật trong cảnh tu luyện.
- Sức quái từ tầng 6 trở đi tăng thêm để bù cho các nguồn sức mạnh mới.

### Biểu tượng võ kỹ và công pháp

- Mỗi võ kỹ, chiêu của quái, chiêu bản mệnh và công pháp có biểu tượng riêng cùng kiểu khung với pháp bảo: võ kỹ có vòng tròn, số cấp và số thứ tự ưu tiên; công pháp có hai trục cuộn, màu khung theo phẩm cấp và số chấm = phẩm cấp.
- Hiện ở mục Võ Kỹ, Công Pháp, Phường Thị, chiêu thức của đối thủ, chiêu bản mệnh và khi hô tên chiêu trong trận. Thẻ **Đang Trang Bị** ở mục Tổng quan gom công pháp, võ kỹ và bản mệnh đang dùng, chạm vào để mở mục tương ứng.
- Thay bằng ảnh thật: `src/assets/art/skills/<mã võ kỹ>`, `techs/<mã công pháp>`, `natal/<mã>` (xem README trong thư mục đó). Xem tất cả ở trang `#gallery`.

### Nhiệm vụ và gợi ý

- **Việc Nên Làm** (tab Tu Luyện): đọc trạng thái game và chỉ ra 1–2 việc đáng làm nhất, có nút dẫn thẳng tới đúng tab và mục con. Dùng cả tỉ lệ thắng ước tính tầng kế tiếp (đột phá bị chặn thì khuyên lịch luyện hay khiêu chiến, thắng chắc thì khuyên bật tự động…).
- **25 nhiệm vụ chủ tuyến** dạy dần từng hệ thống (bế quan, bí cảnh, trang bị, công pháp, hướng tu, bản mệnh, cường hóa, bộ trang bị…), mỗi nhiệm vụ có thưởng linh thạch, tàn quyển hoặc đan dược. Thưởng linh thạch cố định theo cảnh giới nhắm tới của nhiệm vụ, để dành không có lợi. Điều kiện tính thẳng từ trạng thái game.
- Chấm báo ở tab Tu Luyện và thông báo nổi khi có nhiệm vụ xong; nút "Nhận thưởng tất cả". Save v6 tự nâng lên v7 (nhiệm vụ đã đạt được nhận ngay).

Nhịp độ dự kiến với linh căn trung bình (không bế quan): Luyện Khí ~10 phút, Trúc Cơ ~30 phút,
Kim Đan ~1.5 giờ, Nguyên Anh ~4 giờ… hết Độ Kiếp ~10 ngày.

## Cấu trúc

```
src/
  engine/       logic game thuần TypeScript, không phụ thuộc giao diện
    data.ts       toàn bộ số liệu cân bằng: cảnh giới, linh căn, đan dược, bế quan, bí cảnh, pháp bảo, công pháp
    state.ts      kiểu dữ liệu, tra cứu cảnh giới, định dạng số
    combat.ts     chỉ số chiến đấu, quái, pháp bảo, mô phỏng trận đấu
    engine.ts     tick thời gian và mọi hành động (đột phá, bế quan, bí cảnh, trang bị, công pháp…), offline, lưu/tải
    engine.test.ts
  ui/           giao diện React
```

Muốn chỉnh độ khó / tốc độ game, chỉ cần sửa `src/engine/data.ts`.
Mọi hành động trong engine nhận `now` và `rng` làm tham số nên test được một cách tất định.

## Lộ trình tiếp theo

- Giai đoạn 2: Thọ nguyên + Luân hồi (prestige)
- Giai đoạn 3: Linh điền + Luyện đan, kỳ ngộ có lựa chọn (Chính/Tà)
- Giai đoạn 4: Thiên kiếp, tông môn NPC
