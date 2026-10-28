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

Nhịp độ dự kiến với linh căn trung bình (không bế quan): Luyện Khí ~10 phút, Trúc Cơ ~30 phút,
Kim Đan ~1.5 giờ, Nguyên Anh ~4 giờ… hết Độ Kiếp ~10 ngày.

## Cấu trúc

```
src/
  engine/       logic game thuần TypeScript, không phụ thuộc giao diện
    data.ts       toàn bộ số liệu cân bằng: cảnh giới, linh căn, đan dược, bế quan
    engine.ts     tick thời gian, đột phá, bế quan, đan dược, offline, lưu/tải
    engine.test.ts
  ui/           giao diện React
```

Muốn chỉnh độ khó / tốc độ game, chỉ cần sửa `src/engine/data.ts`.
Mọi hành động trong engine nhận `now` và `rng` làm tham số nên test được một cách tất định.

## Lộ trình tiếp theo

- v2: Luyện đan (công thức + nguyên liệu), Bí cảnh treo máy, Công pháp / hướng tu (Kiếm, Thể, Pháp)
- v3: Sự kiện kỳ ngộ dạng văn bản có lựa chọn, Chuyển sinh / Phi Thăng (prestige)
- Sau: Động phủ, linh thú, tông môn NPC
