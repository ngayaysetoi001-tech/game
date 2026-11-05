# Trăm Kiếp Phù Sinh

Game tu tiên luân hồi chơi một mình, trên trình duyệt điện thoại. Ngươi sống, tu luyện, chết rồi đầu thai giữa một thế giới có 40 linh hồn bot cũng sống, tu luyện, kết thù, lập tông môn và luân hồi như ngươi.

Người từng thân với ngươi có thể nhận ra ngươi ở kiếp sau. Kẻ thù cũng vậy.

## Chơi thử

Không cần cài gì. Chỉ cần một máy chủ tĩnh (ES module không chạy khi mở thẳng file):

```bash
python3 -m http.server 8000
# mở http://localhost:8000
```

Hoặc gộp thành một file HTML duy nhất (CSS, JS nhúng sẵn) để đăng ở bất kỳ đâu:

```bash
node tools/build-artifact.mjs   # ra dist/tram-kiep-phu-sinh.html
```

## Chơi toàn màn hình trên điện thoại

Game cài được như một ứng dụng (có `manifest.webmanifest` và biểu tượng trong `icons/`). Mở từ biểu tượng trên Màn hình chính thì không còn thanh trình duyệt.

1. Bật GitHub Pages cho repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, chọn nhánh `tram-kiep-phu-sinh`, thư mục `/ (root)`, bấm **Save**. Sau 1–2 phút game có ở `https://ngayaysetoi001-tech.github.io/game/`.
2. Trên iPhone: mở địa chỉ đó bằng **Safari**, bấm nút **Chia sẻ** (ô vuông có mũi tên), chọn **Thêm vào MH chính**.
3. Trên Android: mở bằng Chrome, chọn menu ⋮ → **Thêm vào màn hình chính** (hoặc **Cài đặt ứng dụng**).

Bản lưu nằm trong trình duyệt của từng địa chỉ, nên bản lưu ở trang Claude không tự sang trang GitHub Pages.

## Đẩy bản mới

Trước mỗi lần đẩy bản mới, đánh số phiên bản để ứng dụng đã cài biết mà hiện nút **Cập nhật**:

```bash
node tools/bump-version.mjs   # ghi js/version.js và version.json
```

Ứng dụng so số phiên bản đang chạy với `version.json` trên máy chủ, lúc mở, lúc quay lại ứng dụng và mỗi 10 phút. Có bản mới thì hiện thanh "Có bản mới · Cập nhật". Bấm vào thì tải bản mới, thế giới đang chơi giữ nguyên. Trong menu ☰ có dòng phiên bản và nút Kiểm tra cập nhật.

## Mô phỏng cân bằng

```bash
node tools/sim.mjs 20 8   # 20 thế giới x 8 kiếp, chơi tự động
```

## Tài liệu

- Thiết kế: [docs/THIET_KE.md](docs/THIET_KE.md)
