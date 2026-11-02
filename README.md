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

## Mô phỏng cân bằng

```bash
node tools/sim.mjs 20 8   # 20 thế giới x 8 kiếp, chơi tự động
```

## Tài liệu

- Thiết kế: [docs/THIET_KE.md](docs/THIET_KE.md)
