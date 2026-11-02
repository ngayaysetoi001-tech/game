# Trăm Kiếp Phù Sinh - Thiết kế

Game tu tiên luân hồi chơi một mình, chạy offline trên trình duyệt điện thoại. Thế giới không có người chơi khác: thay vào đó là **40 linh hồn bot tự sống**. Họ tu luyện, kết thù, lập tông môn, chết đi rồi đầu thai giống hệt người chơi.

## 1. Điểm khác biệt chính: Duyên nợ ba sinh

Ở đa số game luân hồi, thứ mang sang kiếp sau là một cửa hàng điểm. Ở đây, thứ mang sang là **các mối quan hệ**.

- **Bot nhớ ngươi.** Khi ngươi chết, ai còn sống mà từng thân hoặc từng thù với ngươi sẽ giữ ký ức đó (`rel.cn`). Kiếp sau:
  - Cố nhân đủ mạnh (từ Kim Đan, hơn ngươi 2 cảnh giới) sẽ **đi tìm ngươi** và có thể nhận ngươi làm đệ tử (`co_nhan_tim`).
  - Kẻ thù cũ sẽ **truy sát ngươi** (`thu_kiep_truoc`).
  - Gặp lại ngẫu nhiên: người có tu vi cao nhận ra ngay, người yếu chỉ thấy quen quen (`co_nhan_gap_lai`).
- **Ngươi nhớ bot.** Khi một bot chết, quan hệ với ngươi được lưu vào `rel.past`. Gặp lại linh hồn ấy ở kiếp mới của họ, ngươi nằm mơ thấy kiếp trước (`duyen_no`) và chọn nối lại duyên cũ hoặc trả nợ cũ.
- **Thế giới không chờ ngươi.** Lúc ngươi chết, thế giới trôi thêm 5-20 năm rồi ngươi mới đầu thai.

## 2. Vòng chơi một kiếp

1. **Đầu thai:** gieo lá số (tên, giới, xuất thân, linh căn, 4 chỉ số). Được gieo lại 3 lần mỗi kiếp.
2. **Thời gian tự trôi:** tốc độ 1× đến 32×. Mỗi năm làm một việc:

| Việc | Từ tuổi | Tác dụng |
|---|---|---|
| Tu luyện | 6, cần nhập đạo | Tu vi đầy đủ |
| Lịch luyện | 10 | Nhiều kỳ ngộ, yêu thú, bí cảnh. Tu vi 35% |
| Mưu sinh | 8 | Linh thạch. Tu vi 25% |
| Kết giao | 8 | Gặp bot, tăng thân thiết. Tu vi 25% |
| Bế quan | 12, cần nhập đạo | Tu vi x1,6, thời gian trôi nhanh x3, gần như không có kỳ ngộ |

3. **Nhập đạo:** sinh ra là phàm nhân, phải gặp cơ duyên mới tu được (ông lão bên giếng, tông môn tuyển đệ tử, sách cũ trong kho, cố nhân dẫn đường). Hậu duệ gia tộc tu tiên và tàn niệm "Ký ức đạo pháp" thì nhập đạo sẵn.
4. **Đột phá:** tu vi đầy thì người chơi **tự chọn lúc đột phá**. Có thể uống Phá Cảnh Đan. Từ Kim Đan trở lên, thất bại có thể chết.
5. **Chết hoặc phi thăng:** chọn 1 trong 3 tàn niệm ngẫu nhiên mang sang kiếp sau.

## 3. Chỉ số

- **Căn cốt:** thọ nguyên, sức chiến đấu.
- **Ngộ tính:** tốc độ tu luyện, tỉ lệ đột phá.
- **Tâm tính:** tỉ lệ đột phá, giảm nguy cơ chết khi đột phá hỏng, chống tâm ma.
- **Cơ duyên:** thắng các phép thử may rủi trong sự kiện, chạy trốn.
- **Hữu tình ↔ Vô tình** (-100 đến 100), thay cho trục chính/tà:
  - Hữu tình (từ 30): bạn bè thân (thân thiết từ 50, cảnh giới không thấp hơn ngươi) **hộ pháp khi đột phá**, mỗi người +4%, tối đa 4 người.
  - Vô tình (từ -30 trở xuống): tu luyện x1,2, đột phá +6%, nhưng sống cô độc.
- Sinh lực 0-100: về 0 là chết. Mỗi năm hồi 4 (bế quan hồi 6).

## 4. Cảnh giới

| Cảnh giới | Tu vi cần | Thọ gốc | Đột phá lên kế tiếp |
|---|---|---|---|
| Phàm Nhân | 100 | 60 | 90% |
| Luyện Khí | 300 | 90 | 70% |
| Trúc Cơ | 800 | 140 | 55% |
| Kim Đan | 2.000 | 220 | 45% |
| Nguyên Anh | 5.000 | 350 | 36% |
| Hóa Thần | 12.000 | 550 | 30% |
| Luyện Hư | 30.000 | 750 | 25% |
| Đại Thừa | 90.000 | 1.000 | 18% (phi thăng) |

- Tu vi mỗi năm = `6 × 1,5^cảnh giới × linh căn × (1 + (ngộ tính - 50)/200)`, x1,2 nếu có tông môn, x1,2 nếu vô tình, x0,6 khi sinh lực dưới 30.
- Thọ = thọ gốc × (1 + (căn cốt - 50)/250) × (1 + Diên Thọ Đan).
- Tỉ lệ đột phá = gốc + (ngộ-50)/250 + (tâm-50)/300 + (cơ duyên-50)/400 + hộ pháp + đan, kẹp trong 5%-95%.
- Phần thưởng tu vi từ sự kiện tính theo **số năm tu luyện** (ví dụ "+6 năm"), không theo % tu vi cần. Vì vậy cảnh giới cao không bị sự kiện "gánh".

## 5. Thế giới bot

- 40 linh hồn. Mỗi linh hồn có **tính cách** giữ qua các kiếp (70%): Hiền hòa, Tham lam, Cuồng ngạo, Ẩn dật, Mưu sâu, Trọng nghĩa. Tính cách ảnh hưởng tốc độ kết thân, độ hiếu chiến, khả năng phản bội.
- Mỗi năm thế giới: bot tu luyện, đột phá, gặp nạn, hết thọ; vài cặp bot giao đấu (thua có 25% chết); tông môn có thể gây chiến (3%/năm); người mạnh có chí lớn tách ra lập phái; tông môn hết người thì tan rã; dưới 2 tông thì có tông ẩn thế xuất sơn.
- Bot chết thì đầu thai sau 3-15 năm. Bot phi thăng thì rời thế giới và một linh hồn mới được sinh ra.
- **Thiên hạ ký sự** ghi lại các chuyện lớn: đột phá cao, cái chết của cao thủ, chiến tranh tông môn, lập phái, phi thăng.
- **Bảng Thiên Kiêu** xếp hạng mọi tu sĩ đang sống, kể cả ngươi.
- Trước khi người chơi đầu tiên ra đời, thế giới đã chạy sẵn 250 năm.

## 6. Tàn niệm (chọn 1 trong 3 khi chết)

Ký ức đạo pháp, Thân thể kiếp trước, Dư âm cơ duyên, Tàn hồn kiếm ý, Linh căn tôi luyện, Tâm như chỉ thủy, Một sợi tơ duyên (người thân nhất sẽ sớm tìm thấy ngươi), Rương chôn dưới gốc đào.

## 7. Kỹ thuật

- HTML, CSS, JavaScript thuần (ES module), không cần build, không cần máy chủ.
- `js/core.js`: luật chơi và mô phỏng, không đụng DOM. `js/events.js`: kỳ ngộ. `js/data.js`: dữ liệu. `js/ui.js`: giao diện. `js/rng.js`: RNG có seed.
- **RNG có seed** và trạng thái nằm trong bản lưu: cùng seed và cùng lựa chọn cho cùng kết quả, dễ tái hiện lỗi.
- Lưu bằng `localStorage` (`tkps.save.v1`) mỗi 5 giây, khi chọn và khi rời tab.
- `tools/sim.mjs`: chơi tự động nhiều kiếp không giao diện để kiểm lỗi và cân bằng.

## 8. Số liệu mô phỏng (bản 0.1)

- Lối chơi gần tối ưu (70% tu luyện, mua đan): khoảng 5-13% số kiếp phi thăng. Tuổi thọ trung bình khoảng 450-600.
- Mỗi kiếp khoảng 95 sự kiện, tức trung bình một sự kiện mỗi 5 năm.
- Cố nhân tìm tới ở khoảng một nửa số kiếp từ kiếp 2 trở đi; kẻ thù kiếp trước truy sát ở khoảng 15%.

## 9. Ý tưởng cho bản sau

- Bot có mục tiêu dài hạn (báo thù, tìm đạo lữ, lập phái) và chủ động tìm người chơi.
- Đệ tử của ngươi lớn lên thành tông chủ, kiếp sau ngươi có thể bái chính đệ tử cũ làm sư phụ.
- Thần binh, công pháp, pháp bảo. Linh thú tiến hóa.
- Bản đồ vùng đất, di chuyển giữa các địa danh.
- Hồi ký từng kiếp, cây gia phả linh hồn.
- Âm thanh, ảnh pixel LPC (ghi công tác giả).
