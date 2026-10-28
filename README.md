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
