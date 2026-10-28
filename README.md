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
