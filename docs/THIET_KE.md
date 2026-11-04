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
2. **Thời gian tự trôi:** tốc độ 1× đến 16× (bỏ 32× từ bản 5.1). Mỗi năm làm một việc:

| Việc | Từ tuổi | Tác dụng |
|---|---|---|
| Tu luyện | 6, cần nhập đạo | Tu vi đầy đủ |
| Lịch luyện | 10 | Nhiều kỳ ngộ, yêu thú, bí cảnh. Tu vi 35% |
| Mưu sinh | 8 | Linh thạch. Tu vi 25% |
| Kết giao | 8 | Gặp bot, tăng thân thiết. Tu vi 25% |
| Bế quan | 12, cần nhập đạo | Tu vi x1,6, thời gian trôi nhanh x3, gần như không có kỳ ngộ |

3. **Nhập đạo:** ai cũng nhập đạo lúc 6 tuổi và bắt đầu tu luyện ngay. Hậu duệ gia tộc tu tiên nhập đạo với sẵn 30% tu vi Phàm Nhân, tàn niệm "Ký ức đạo pháp" sẵn 50%. Ông lão bên giếng (một lần mỗi kiếp) và sách cũ trong kho (khi còn là Phàm Nhân) giờ cho ngộ tính, tu vi hoặc võ kỹ. Bot nhập đạo lúc 6 tuổi (90%), số còn lại gặp cơ duyên muộn hơn; vào tông môn từ 8 đến 16 tuổi. Phàm Nhân cần 60 tu vi nên Luyện Khí thường đến khoảng 11-23 tuổi (trung vị 15).
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

## 3b. Thể chất và thiên phú

Lúc đầu thai, ngoài 4 chỉ số còn gieo **một thể chất** và **0-2 thiên phú** (25% không có, 50% một, 25% hai). Gieo lại thì gieo cả những thứ này. Món nào mạnh cũng có cái giá.

**Thể chất:** 32 loại ngoài Phàm thể, chia 4 phẩm. Tỉ lệ gieo: Phàm thể khoảng 55%, Khá khoảng 24%, Hiếm khoảng 18%, Truyền thuyết khoảng 2,8%, Thần thoại khoảng 0,2%. Bot cũng có thể chất, hiện trong tab Quan hệ.

- **Khá (8):** Thiết Cốt Thể, Linh Lung Tâm, Thanh Tâm Thể, Phúc Hậu Tướng, Khinh Thân Thể, Dược Linh Thể, Trường Xuân Thể, Bách Độc Bất Xâm.
- **Hiếm (15):** Cửu Âm Hàn Thể (hàn độc, đạo lữ áp chế), Liệt Dương Chiến Thể, Thông Linh Thể, Vô Cấu Linh Thể, Thiên Sinh Mị Cốt, Túc Mệnh Nhãn (thấy tiền kiếp bot), Kiếm Thai Thể (thắng trận được tu vi), Lôi Linh Thể (đột phá từ Kim Đan), Ất Mộc Linh Thể, Huyền Băng Thể, Tiềm Long Thể (đầu chậm cuối nhanh), Thần Đồng Thể (đầu nhanh cuối chậm), Thạch Tâm Thể (bế quan), Tụ Bảo Thể, Huyết Sát Thể.
- **Truyền thuyết (7):** Bất Diệt Kim Thân, Hỗn Độn Đạo Thể, Nhật Nguyệt Đồng Huy Thể, Niết Bàn Thể (sống lại một lần mỗi kiếp), Khí Vận Chi Tử, Vạn Pháp Thể, Chân Long Huyết Mạch.
- **Thần thoại (2):** Tiên Thiên Đạo Thai, Hồng Mông Thánh Thể.

Các kiểu tác dụng: cộng chỉ số, nhân tu luyện, tu luyện theo giai đoạn (đến Trúc Cơ / từ Nguyên Anh), chiến đấu, chịu đòn, hồi sinh lực, thọ, đột phá (chung hoặc từ Kim Đan), bế quan, đan dược, mưu sinh, thân thiết, bỏ chạy, tần suất kỳ ngộ, trọng số từng sự kiện, tu vi khi thắng trận, sống lại một lần. Chi tiết trong `js/data.js`.

**Sổ thể chất** (tab Sổ kiếp): ghi lại các thể chất linh hồn từng thức tỉnh, cái chưa có hiện "???" theo phẩm. Lúc đầu thai, thể chất chưa từng có gắn dấu "Mới!".

**Thiên phú:** Võ si, Đầu óc buôn bán, Dễ gần, Đa nghi (không bị lừa của), Bệnh căn từ nhỏ, Sinh giờ hoàng đạo, Hay mơ, Chân nhanh hơn não, Lòng trắc ẩn, Đồng bì thiết cốt, Độc hành giả, Đại khí vãn thành (đột phá xong ngộ tính +4), Sát khí bẩm sinh. Chi tiết trong `js/data.js`.

Tàn niệm mới **Huyết mạch còn vương**: giữ thể chất sang kiếp sau (chỉ hiện khi thể chất không phải Phàm thể).

**Giải thích chỉ số:** chạm vào bất kỳ chỉ số nào (căn cốt, ngộ tính, tâm tính, cơ duyên, Hữu tình/Vô tình, linh thạch, danh vọng, thanh tu vi, sinh lực, thọ), kể cả ở màn đầu thai, để mở bảng giải thích: chỉ số làm gì, tác dụng tính theo đúng giá trị hiện tại (ví dụ căn cốt 26 → thọ -10%, sức chiến đấu -12%), và cách tăng. Nội dung ở `statInfo` trong `js/ui.js`, công thức phải khớp với `js/core.js`.

## 3c. Hồn Lực và Đài Luân Hồi

**Hồn Lực** tích qua mọi kiếp, nhận khi chết: cảnh giới (Phàm 0, Luyện Khí 2, Trúc Cơ 5, Kim Đan 10, Nguyên Anh 18, Hóa Thần 30, Luyện Hư 45, Đại Thừa 65), +1 mỗi 50 năm sống, danh hiệu (Thường 1, Hiếm 2, Truyền kỳ 4, Thần thoại 8), +3 mỗi mục mới trong Sổ thể chất hoặc Danh hiệu lục, +10 khi phá kỷ lục cảnh giới của linh hồn (từ kiếp 2), +80 khi phi thăng. Màn chết hiện chi tiết. Mô phỏng: trung vị 11 mỗi kiếp, kiếp xuất sắc 130-270; sau 6 kiếp trung vị khoảng 230.

**Đài Luân Hồi** (màn đầu thai, `buyThe2`, `rerollThe` trong `js/core.js`):
- Thể chất cộng thêm (ô thứ hai): chỉ chọn thể chất đã từng thức tỉnh, khác thể chất chính, phát huy 100%, chỉ trong kiếp đó. Giá: Khá 20, Hiếm 60, Truyền thuyết 180, Thần thoại 500. Đổi hoặc bỏ thì được hoàn. Gieo lại lá số vẫn giữ ô này (trùng thể chất chính thì hoàn).
- Gieo lại riêng thể chất chính: 5. Bảo đảm Hiếm trở lên: 40. Bảo đảm Truyền thuyết trở lên: 150.
- Giới hạn cộng dồn từ thể chất: tu luyện tối đa x1,8, chiến đấu x1,7, đột phá +15%.

## 3d. Con đường tu hành (chọn khi lên Trúc Cơ)

Sự kiện "Ngã rẽ đạo đồ" (`dao_do`) hiện khi lên Trúc Cơ, chọn một lần mỗi kiếp, có thể hoãn 10 năm. Mỗi con đường có tuyệt học riêng không học được ở đâu khác (`path` trong `SKILLS`). Dữ liệu ở `PATHS` trong `js/data.js`; hệ số theo trường phái chiêu (`cls`: the quyền cước, phap chưởng/ấn/lôi, ma ma công, ho hộ thể/hồi phục, thu linh thú, hoặc loại binh khí).

| Con đường | Yêu cầu | Tác dụng | Tuyệt học |
|---|---|---|---|
| Kiếm tu | | Kiếm pháp +30%, cầm kiếm bạo kích +10%, thủ -10% | Nhất Kiếm Đoạn Giang |
| Thể tu | | Sinh lực +25%, thủ +15%, quyền cước +25%, tay không công +15%, thọ +10%, chịu đòn ngoài trận -15%, tu luyện -10% | Bá Thể Quyền |
| Pháp tu | | Chưởng, ấn, lôi pháp +50%, linh lực hồi +8/lượt, sinh lực -10% | Cửu Thiên Lôi Ấn |
| Phật tu | Hữu tình từ 30 | Hộ thể, hồi phục +30%, đột phá +5%, thân thiết +20%, tâm ma x0,4, công -10% | Đại Bi Kim Thân |
| Ma tu | Vô tình từ -30 | Tu luyện +25%, ma công +50%, hút máu +15%, tôn xưng ma đạo từ Kim Đan, tâm ma x2 | Huyết Hải Ma Công |
| Ngự thú tu | Có linh thú | Linh thú cho +15% sức chiến đấu (thường +10%), gặp linh thú x4, trứng lạ x3 | Vạn Thú Triều Bái |

Thử với yêu thú Trúc Cơ mạnh hơn 60%, mỗi bên cầm binh khí hợp con đường: không con đường 5%, Kiếm 41%, Ngự thú 37%, Thể 27%, Pháp 23%, Phật 16%, Ma 8% (Phật và Ma bù bằng lợi ích ngoài trận).

## 3e. Luật xuất hiện kỳ ngộ

`EVENT_RULES` trong `js/events.js`: mỗi kỳ ngộ có tuổi tối thiểu (mặc định 14), cờ `child` (được xảy ra trước 6 tuổi), và nơi chốn: `xa` chỉ khi Lịch luyện (hang động, linh mạch, cổ mộ, kiếm trủng, bí cảnh, truyền thừa, trứng lạ, linh thú, vườn thuốc, lôi kiếp người khác, huyết trận, Hắc Phong trại, ngọc giản), `thanh` chỉ khi Mưu sinh hoặc Kết giao (chợ đêm, sòng bạc, tửu lâu, đấu giá, thương hội, hộ tống, chợ người, móc túi, ăn mày, lôi đài, bản đồ). Từ 16 tuổi: sòng bạc, tửu lâu, đấu giá, đầu tư, chợ người, đạo lữ, song tu, hồ ly, luyện đan, huyết trận, yêu vương (cần Trúc Cơ). Kết nghĩa cần người kia từ 14 tuổi, đạo lữ từ 16. Dưới 14 tuổi không được ra tiền tuyến khi tông môn bị đánh. Cô nhi không có lựa chọn "mẹ chăm sóc". Kiểm tra tự động: `node tools/check-events.mjs`.

## 4. Cảnh giới

Mỗi giới 9 cảnh giới. Phàm giới có thêm Phàm Nhân (chưa nhập đạo) ở đầu.

| # | Phàm giới | Tu vi cần | Thọ gốc | Đột phá | | # | Linh giới | Tu vi cần | Thọ gốc | Đột phá |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Phàm Nhân | 60 | 60 | 90% | | | | | | |
| 1 | Luyện Khí | 300 | 90 | 70% | | 10 | Luyện Linh | 240.000 | 1.500 | 50% |
| 2 | Trúc Cơ | 800 | 140 | 55% | | 11 | Chân Linh | 400.000 | 1.800 | 45% |
| 3 | Kim Đan | 2.000 | 220 | 45% | | 12 | Huyền Linh | 650.000 | 2.200 | 40% |
| 4 | Nguyên Anh | 5.000 | 350 | 36% | | 13 | Linh Hải | 1.000.000 | 2.700 | 36% |
| 5 | Hóa Thần | 12.000 | 550 | 30% | | 14 | Linh Phách | 1.600.000 | 3.300 | 32% |
| 6 | Luyện Hư | 30.000 | 750 | 25% | | 15 | Linh Vương | 2.600.000 | 4.000 | 28% |
| 7 | Hợp Thể (mới) | 45.000 | 950 | 22% | | 16 | Linh Hoàng | 4.200.000 | 4.800 | 25% |
| 8 | Đại Thừa | 90.000 | 1.250 | 18% | | 17 | Linh Tôn | 6.800.000 | 5.700 | 22% |
| 9 | Độ Kiếp (mới) | 100.000 | 1.600 | lôi kiếp | | 18 | Linh Đế | 11.000.000 | 6.800 | lôi kiếp |

- Sức mạnh gốc: Phàm giới 1 → 3.400 (Độ Kiếp); Linh giới 6.000 (Luyện Linh) → 420.000 (Linh Đế).
- Bản lưu cũ (8 cảnh giới) được chuyển tự động: Đại Thừa từ số 7 thành số 8, cả nhân vật, bot, đồ, Sổ kiếp.

- Tu vi mỗi năm = `6 × 1,5^cảnh giới × linh căn × (1 + (ngộ tính - 50)/200)`, x1,2 nếu có tông môn, x1,2 nếu vô tình, x0,6 khi sinh lực dưới 30.
- Thọ = thọ gốc × (1 + (căn cốt - 50)/250) × (1 + Diên Thọ Đan).
- Tỉ lệ đột phá = gốc + (ngộ-50)/250 + (tâm-50)/300 + (cơ duyên-50)/400 + hộ pháp + đan, kẹp trong 5%-95%.
- Phần thưởng tu vi từ sự kiện tính theo **số năm tu luyện** (ví dụ "+6 năm"), không theo % tu vi cần. Vì vậy cảnh giới cao không bị sự kiện "gánh".

## 4b. Cảnh giới nhỏ

| Cảnh giới | Cảnh giới nhỏ |
|---|---|
| Phàm Nhân | không chia |
| Luyện Khí | tầng 1 → tầng 9 (đầy tu vi thì "tầng 9 viên mãn") |
| Trúc Cơ trở lên | sơ kỳ → trung kỳ → hậu kỳ → đại viên mãn (mỗi nấc 25% tu vi) |

- Tổng tu vi mỗi cảnh giới lớn giữ nguyên. Lên nấc nhỏ là tự động, có dòng nhật ký. Đột phá lên cảnh giới lớn vẫn như cũ: đầy tu vi thì mới hỏi.
- Đột phá hỏng làm tu vi tụt lùi; tu lại tới nấc đã từng đạt thì không báo lại.
- **Sức mạnh tăng theo nấc**, thay cho kiểu tăng đều từng chút:
  - người chơi: +0% ở nấc đầu tới +50% ở nấc cuối;
  - bot: cũng theo nấc như vậy;
  - ước lượng của bot khi chọn vùng lịch luyện: tới +30%;
  - riêng Phàm Nhân vẫn tăng đều theo tu vi.
- **Bình cảnh nhỏ:** lần đầu từ hậu kỳ lên đại viên mãn ở mỗi cảnh giới (Trúc Cơ trở lên) có 20% bị kẹt 3–8 năm.
  - Cách phá: uống Tĩnh Tâm Đan, hoặc chờ "ngộ ra". Mỗi năm có (ngộ tính − 30)/400 khả năng tự ngộ.
  - Thanh trên có nút cảnh báo ⛓, bấm vào để xem cách phá.
- **Thanh tu vi** có vạch chia nấc. Tên cảnh giới nhỏ hiện ở thanh trên, bảng Nhân vật, Quan hệ, Bảng Thiên Kiêu.
- **Số liệu** (mô phỏng 20 kiếp chỉ tu luyện): mỗi kiếp lên khoảng 17 nấc nhỏ, gặp khoảng 0,2 lần bình cảnh nhỏ. Mô phỏng 540 kiếp: tuổi trung bình 310, phi thăng 11. Phân bố cảnh giới của bot không đổi.

## 5. Thế giới bot

- 40 linh hồn. Mỗi linh hồn có **tính cách** giữ qua các kiếp (70%): Hiền hòa, Tham lam, Cuồng ngạo, Ẩn dật, Mưu sâu, Trọng nghĩa. Tính cách ảnh hưởng tốc độ kết thân, độ hiếu chiến, khả năng phản bội.
- Mỗi năm thế giới: bot tu luyện, đột phá, gặp nạn, hết thọ; vài cặp bot giao đấu (thua có 25% chết); tông môn có thể gây chiến (3%/năm); người mạnh có chí lớn tách ra lập phái; tông môn hết người thì tan rã; dưới 2 tông thì có tông ẩn thế xuất sơn.
- Bot chết thì đầu thai sau 3-15 năm. Bot phi thăng thì rời thế giới và một linh hồn mới được sinh ra.
- **Thiên hạ ký sự** ghi lại các chuyện lớn: đột phá cao, cái chết của cao thủ, chiến tranh tông môn, lập phái, phi thăng.
- **Bảng Thiên Kiêu** xếp hạng mọi tu sĩ đang sống, kể cả ngươi.
- Trước khi người chơi đầu tiên ra đời, thế giới đã chạy sẵn 250 năm.

## 6. Tàn niệm (chọn 1 trong 3 khi chết)

Ký ức đạo pháp, Thân thể kiếp trước, Dư âm cơ duyên, Tàn hồn kiếm ý, Linh căn tôi luyện, Tâm như chỉ thủy, Một sợi tơ duyên (người thân nhất sẽ sớm tìm thấy ngươi), Rương chôn dưới gốc đào.

## 6b. Chiến đấu, võ kỹ, trang bị

**Trận đấu** (`js/combat.js`) đánh theo lượt, tối đa 14 hiệp, rồi so % sinh lực. Hai bên tự ra chiêu theo **chiến thuật** đã chọn (Cuồng công / Cân bằng / Phòng thủ). Giao diện diễn lại từng lượt: tên chiêu, sát thương bay lên, lao tới, rung khi trúng đòn; có nút Nhanh ×2 và Bỏ qua.

- Chỉ số quy từ sức mạnh gốc `pw`: sinh lực 60·pw, công 10·pw, thủ 4·pw, linh lực 100 (hồi 12 mỗi lượt). Trang bị cộng thẳng vào.
- Sát thương = công × hệ số chiêu × (1 - thủ/(thủ + 1,5·công)), ±10%. Bạo kích x1,7. Mỗi trận mỗi bên có "phong độ" ±22% công, để kẻ yếu hơn vẫn có cửa lật kèo.
- Trạng thái: thiêu đốt/trúng độc, choáng/đóng băng, phá giáp (-40% thủ), né tránh, khiên, phản đòn, hút máu, cuồng bạo.
- Đối thủ từ Luyện Khí trở lên được tính như có trang bị (x1,2 sức mạnh).
- Thắng trận chỉ mang về 60% vết thương. Thua thì sự kiện tự xử lý hậu quả như trước.
- Tỉ lệ thắng thử nghiệm (cùng bộ chiêu): yếu hơn 20% không đồ ~7%, có đồ Hạ phẩm ~30%; ngang sức ~50-60%; mạnh hơn 25% ~94%.

**Võ kỹ:** 17 chiêu theo binh khí (kiếm, đao, thương, quạt), chưởng/ấn dùng tay không, hộ thể, hồi phục. Mang tối đa 4. Dùng chiêu không hợp binh khí đang cầm thì yếu đi 40%. Học được từ: lần đầu nhập đạo (1 chiêu Khá), vào tông môn (chiêu riêng của tông), truyền thừa (phẩm 2-3), tiền bối chỉ điểm (40%), bí kíp ở Tụ Bảo Lâu. Yêu thú có bộ chiêu riêng (cắn xé, độc nha, cuồng bạo, vảy giáp, gầm thét). Bot có chiêu theo binh khí và cảnh giới.

**Trang bị** (`js/items.js`): 3 ô (vũ khí, y phục, phụ kiện), 4 phẩm (Hạ, Trung, Thượng, Cực), chỉ số theo cảnh giới của món. Thượng phẩm có 1 thuộc tính đặc biệt, Cực phẩm có 2 (hút máu, bạo kích, phản chấn, né tránh, thân pháp). Loại vũ khí có thiên hướng riêng: kiếm thêm bạo kích, đao thêm công, thương xuyên giáp, quạt thêm né. Vũ khí đang cầm hiện trên chân dung. Nguồn: yêu thú (25%), hang động (60%), bí cảnh, đánh bại bot (15%, rơi binh khí của họ), Tụ Bảo Lâu (3 món, đổi hàng mỗi 5 năm), hội đấu giá (Thượng/Cực phẩm). Con thợ rèn khởi đầu với Thiết Kiếm. Túi chứa 16 món, đầy thì tự bán món rẻ nhất.

**Hình ảnh vật phẩm** (`js/icons.js`): mỗi món có biểu tượng pixel 16x16 vẽ bằng code theo loại (4 vũ khí, 4 kiểu y phục, 4 kiểu phụ kiện, bình đan, bí kíp). Phẩm đổi màu lưỡi và khảm; Thượng phẩm có vầng sáng xanh, Cực phẩm vầng sáng vàng. Biểu tượng hiện ở dải trang bị cạnh chân dung (chạm để mở Hành trang), trong Hành trang và Tụ Bảo Lâu. Y phục đang mặc đổi màu áo trên nhân vật, cả trong màn giao chiến. Xem tất cả: `tools/preview-icons.html`.

## 6c. Đạo hiệu và danh hiệu

**Đạo hiệu:** lên Trúc Cơ thì có sự kiện đặt đạo hiệu (chọn 1 trong 3 tên ghép hai chữ, hoặc giữ tục danh). Tôn xưng đổi theo cảnh giới: Tử (nữ: Tiên Tử), Chân Nhân, Chân Quân, Đạo Quân (nữ: Nguyên Quân), Tôn Giả, Đạo Tôn; phi thăng thành Tiên Tôn. Từ Kim Đan mà Vô tình từ -50 trở xuống thì thành Ma Nhân, Ma Quân, Ma Tôn. Bot từ Trúc Cơ cũng có đạo hiệu (cố định theo kiếp); bot từng giết 3 người thì mang tôn xưng ma đạo. Đạo hiệu hiện trên chân dung, Quan hệ, Bảng Thiên Kiêu, Thiên hạ ký sự và Sổ kiếp.

**Danh hiệu:** 25 danh hiệu giang hồ xưng tụng, mở theo thành tích trong kiếp (thắng trận, hạ yêu thú, tu nhanh hoặc tu muộn, sống lâu, giàu có, Hữu tình/Vô tình cực độ, nhiều bạn, nhiều thù, đạo lữ, đệ tử, báo thù, cửu tử nhất sinh, danh vọng, thứ hạng Bảng Thiên Kiêu, mạnh nhất tông môn, đồ Cực phẩm, võ kỹ, thể chất). Đeo một danh hiệu để nhận lợi ích nhỏ (2-8%), hiện phía trên tên. Danh hiệu mở lại mỗi kiếp. **Danh hiệu lục** (tab Sổ kiếp) ghi mọi danh hiệu từng có, cái chưa có hiện điều kiện để người chơi nhắm tới. Bảng Thiên Kiêu gắn nhãn Bảng thủ và Chưởng môn (người mạnh nhất mỗi tông).

**Phẩm danh hiệu và hiệu ứng** (`TITLE_TIER` trong `js/data.js`): Thường (khung đơn), Hiếm (khung xanh), Truyền kỳ (chữ vàng ánh kim chạy ngang), Thần thoại (chữ ánh cầu vồng, khung tỏa sáng, tia lấp lánh hai bên). Danh hiệu có ô riêng (nút 🏅 Danh hiệu, hoặc chạm danh hiệu trên tên): đang đeo, đã đạt, chưa đạt kèm điều kiện. Đạt danh hiệu mới thì có thông báo trượt xuống từ trên màn hình. Hiệu ứng tắt khi máy bật giảm chuyển động.

**Thang màu độ hiếm dùng chung** (biến `--r0`…`--r4` trong `style.css`): Thường xám, Khá lam, Hiếm tím, Truyền thuyết/Truyền kỳ vàng, Thần thoại đỏ rực (viền lửa chập chờn, chữ ánh đỏ-cam-vàng). Áp cho thể chất, thiên phú, Sổ thể chất, thể chất của bot, danh hiệu, Danh hiệu lục. Phẩm trang bị theo cùng thang: Hạ phẩm xám, Trung phẩm lam, Thượng phẩm tím, Cực phẩm vàng, Thần thoại đỏ rực.

**Trang bị Thần thoại:** chỉ số x5 so với Hạ phẩm (Cực phẩm x2,5), 3 dòng thường và 1 dòng **Thần thông** chỉ đồ Thần thoại mới có, tên riêng (Hồng Mông, Thái Sơ, Cửu U, Diệt Thế, Chư Thiên, Thái Cổ, Hỗn Nguyên, Vạn Kiếp). Rơi ngẫu nhiên 0,4%; cơ hội riêng: hội đấu giá 3%, rương cuối cổ mộ 6%, Thi Vương giữ mộ 12%, kiếm trủng 5%, một mình hạ yêu vương 15%.

**Thần thông** (`THAN_THONG` trong `js/items.js`, 32 loại theo ô đồ; trùng nhau chỉ tính một):
- Vũ khí: Sát Phạt (thắng trận +3 năm tu vi), Phá Thiên (xuyên 50% thủ), Liên Hoàn (25% thêm đòn), Huyết Tế (hút máu 20%), Đoạn Mệnh (địch dưới 30% sinh lực nhận x1,8), Tiên Phát Chế Nhân (luôn ra tay trước, đòn đầu bạo kích), Kinh Lôi (15% choáng mỗi đòn), Tuyệt Sát (bạo kích +10%, x2,5), Thôn Linh (nuốt 10 linh lực mỗi đòn), Ma Thần Phụ Thể (công +40%, chịu đòn +15%).
- Y phục: Hộ Mệnh (chết thay một lần mỗi kiếp), Bất Hoại (sát thương ngoài trận -25%), Vạn Pháp Bất Xâm (miễn choáng, đóng băng, thiêu đốt, trúng độc, phá giáp), Trường Sinh (thọ +15%), Bất Tử Thân (mỗi trận gục một lần thì đứng dậy với 30% sinh lực), Huyền Quang Hộ Thể (khiên 30% đầu trận), Phản Thiên (phản 30%), Kim Cương Bất Diệt (giảm 25% sát thương trong trận), Sinh Sinh Bất Tức (hồi 6%/lượt, ngoài trận hồi x2), Ẩn Thân (né +25%, bỏ chạy +30%).
- Phụ kiện: Ngộ Đạo (tu luyện +25%), Thiên Cơ (đột phá +8%), Khí Vận Hộ Thân (kỳ ngộ +30%), Tụ Linh (bế quan x1,5), Chiêu Tài (mưu sinh x2), Vạn Duyên (thân thiết +50%), Dược Vương (đan x2), Linh Tuyền (linh lực hồi x2), Thiên Nhãn (thấy tiền kiếp, bạo kích +10%), Nghịch Thiên (đột phá từ Kim Đan +12%), Tâm Ma Bất Sinh (không gặp tâm ma), Phong Thần (hồi sinh lực ngoài trận x3, thọ +5%).
- Thử 1.500 trận ngang sức: không thần thông thắng 28%, có một thần thông chiến đấu thắng 38-65%.

**Thần khí kén chủ:** đồ Thần thoại có cảnh giới cao hơn chủ thì bị áp chế: công, thủ, sinh lực ép về cảnh giới của chủ rồi còn một nửa (ngang đồ Cực phẩm cùng cảnh giới), các dòng % còn một nửa, thần thông bị khóa. Lên tới cảnh giới của món thì phong ấn vỡ, có thông báo, phát huy toàn bộ.

**Thần khí nhận chủ** (tàn niệm `than_khi`): chết lúc đang có đồ Thần thoại (mặc hoặc trong túi) thì tàn niệm này chắc chắn có trong 3 lựa chọn. Chọn thì món mạnh nhất (theo `itemScore`) theo sang kiếp sau, mặc sẵn từ lúc chào đời, chịu luật kén chủ.

## 6d. Tốc độ cao và tự quyết

- Nút **Tự quyết** (bật sẵn, lưu theo bản lưu): từ 8× trở lên, kỳ ngộ nhỏ tự chọn phương án mặc định (`auto` trong từng sự kiện ở `js/events.js`, ví dụ yêu thú thì đánh nếu đủ sức, không thì chạy) và ghi vào nhật ký với tiền tố "(Tự quyết)", bỏ qua phần diễn trận.
- Việc lớn vẫn hỏi: đột phá, đạo hiệu, đạo lữ, tin dữ, cố nhân, duyên nợ, kẻ thù kiếp trước, phản bội, đệ tử gặp nạn, lời mời tông môn, tuổi già. Mô phỏng: khoảng 12 lần hỏi mỗi kiếp (phần lớn là đột phá), 42 lần tự quyết. Chiến hỏa sơn môn cũng tự quyết: đủ mạnh thì ra tiền tuyến, không thì ở hậu phương.
- Hộp câu hỏi không còn phủ tối và chặn màn hình: các nút tốc độ, tạm dừng, tự quyết vẫn bấm được; trong hộp có nút "Dừng sau khi chọn".
- Biểu tượng vật phẩm và bí kíp được nhúng vào chữ bằng mã `[[i|loại|phẩm|màu]]` (`iconToken` trong `js/icons.js`), giao diện thay bằng ảnh trong kết quả sự kiện và nhật ký.

## 6e. Thua trận có thể chết, kỳ ngộ nhiều nhánh

**Thua trận:** thua thì có thể mất mạng. Xác suất = mức tàn độc của đối thủ × (sức đối thủ / sức mình)^1,4, giảm 70% nếu chỉ thua vì hết hiệp (chưa gục), giảm 70% nếu dưới 16 tuổi, cơ duyên cao giảm thêm; kẹp 2%-90%. Mức tàn độc: yêu thú 0,35; người vô danh 0,22; bot cuồng ngạo 0,3, tham/mưu 0,25, ẩn dật 0,12, trọng nghĩa 0,07, hiền 0,05, kẻ thù 0,4; lôi đài 0,05. Sống sót thì sinh lực còn 4-14 (gục) hoặc 4-30 (hết hiệp), sự kiện không trừ thêm. Trước trận, lời dẫn hiện "thắng ~X%, thua thì nguy hiểm tính mạng ~Y%", tính bằng cách đánh thử 40 trận với RNG riêng (`winOdds`).

**Tỉ lệ trên nút:** lựa chọn có `p` hiện "· ~X%" ngay trên nút. Tự quyết chỉ đánh khi thắng từ 60% (cứu người 65%).

**Chuỗi sự kiện:** `g.later(năm, id, data, botId)` hẹn một sự kiện vài năm sau, `g.next(id, data)` cho sự kiện xảy ra ngay sau sự kiện hiện tại. Tần suất kỳ ngộ tăng (tu luyện 16%, lịch luyện 55%, mưu sinh và kết giao 26%).

**Kỳ ngộ mới** (`js/events2.js`, 23 sự kiện + 11 sự kiện nối tiếp):
- Bản đồ da dê → Dưới chân Song Phong (đào, rình, rủ bạn).
- Trứng nóng hổi → Trứng nở (5 loại linh thú, Song Đầu Xà có thể cắn chủ).
- Thuyền ra Nam Hải: góp 1/3 hay dốc hết túi, 3 năm sau lời gấp 3, hòa vốn, đắm thuyền hoặc bị lừa → Truy đuổi kẻ lừa đảo.
- Sòng Kim Ngân: cược nhỏ/lớn, gian lận bằng thần thức; thắng nhiều thì chủ sòng mời "nói chuyện".
- Cổ mộ 3 gian: càng vào sâu càng nhiều báu, tỉ lệ an toàn giảm dần, gian cuối có Thi Vương.
- Lôi đài Lạc Dương: 3 trận liên tiếp, có thể dừng giữa chừng giữ thưởng.
- Khách lạ đêm mưa (hồ ly), Chợ người (chuộc, đánh, mua làm nô) → Người xưa trở lại báo ân / Món nợ năm xưa báo oán.
- Làng ngủ say (huyết trận) → Ma tu tìm tới trả thù.
- Lôi kiếp người khác: hộ pháp, quan sát ngộ đạo, đánh lén cướp bảo vật.
- Bị vu oan trong tông môn, Linh mạch → bị đòi chia, Lão ăn mày (có thể là cao nhân), Thư nhà, Hắc Phong trại bắt cóc, Đấu rượu, Kiếm trủng, Yêu vương (lập đội hay đi một mình), Giấc mộng nồi kê, Ngọc giản dính máu → Mở ngọc giản, Vườn thuốc hoang, Lò đan cũ (3 mức lửa), Đứa trẻ móc túi.

## 6f. Bản đồ lịch luyện theo độ khó

Chọn Lịch luyện thì mở bảng chọn vùng. Độ khó **luôn tính theo cảnh giới hiện tại** của nhân vật: yêu thú cùng cảnh giới nhưng sức mạnh nhân theo độ khó, đồ rơi ra đúng cảnh giới của mình (đồ Thần thoại nhặt được không bị phong ấn). Phàm Nhân cũng vào được Luyện ngục nếu dám.

| Vùng | Độ khó | Yêu thú | Thu hoạch | Thần thoại/món | Nguyên liệu | Tai họa/năm |
|---|---|---|---|---|---|---|
| Ngoại ô Thanh Thạch | Dễ | x0,6 | x0,6 | 0 | Tinh thiết | không |
| Hắc Phong Lĩnh | Vừa (mặc định) | x1 | x1 | 0 | Thú hạch | không |
| Vụ Ẩn Đầm Lầy | Khó | x1,25 | x1,5 | 1% | Độc nang | 6%, -12 |
| Xích Diệm Cốc | Nguy hiểm | x1,5 | x2,2 | 2,5% | Hỏa tinh | 9%, -18 |
| Cổ Chiến Trường | Tử địa | x1,8 | x3 | 5% | Binh hồn | 12%, -24 |
| Hư Không Liệt Cốc | Luyện ngục | x2,1 | x4 | 9% | Thần hồn | 15%, -32 |

- Đồ Thần thoại **chỉ** xuất hiện ở vùng Khó trở lên (hoặc tự rèn). Kỳ ngộ ở nơi khác vốn cho đồ Thần thoại thì hạ xuống Cực phẩm.
- Thua yêu thú ở vùng khó dễ mất mạng hơn (hệ số 0,3 ở Dễ tới 2,5 ở Luyện ngục). Vùng khó gặp kỳ ngộ hiếm, yêu thú và cao thủ nhiều hơn.
- Mỗi thẻ vùng hiện tỉ lệ thắng thật theo trang bị, võ kỹ, sinh lực đang có, và nguy hiểm tính mạng khi thua. Vào vùng Nguy hiểm trở lên phải xác nhận.
- **Sinh lực dưới 40 ở vùng Khó trở lên:**
  - Nếu bật "tự lui" (mặc định): về Hắc Phong Lĩnh dưỡng thương, có thông báo nổi. Hồi lên 80 thì tự quay lại vùng đã chọn.
  - Nếu tắt "tự lui": game dừng lại cảnh báo một lần, rồi ở lại.
  - Cố ý chọn vào vùng khó khi sinh lực đang dưới 40 thì không bị kéo về ngay. Phải hồi lên 40 rồi tụt xuống lại mới tính.
- **Tự uống Hồi Xuân Đan** (mặc định bật): sinh lực dưới 40 thì uống, tối đa 3 viên một lần.
  - Kiểm tra sau mỗi năm và sau mỗi kỳ ngộ.
  - Đan được uống trước khi xét tự lui, nên còn đan thì ở lại vùng đã chọn.
  - Tùy chọn "hết đan thì tự mua" (mặc định tắt) dùng linh thạch mua theo giá Tụ Bảo Lâu.
  - Hết đan thì có thông báo nổi một lần.
  - Thanh trên hiện số viên còn lại (💊).
  - Nút bật tắt nằm ở bảng chọn vùng và ở Tụ Bảo Lâu.
- Hệ số được chỉnh theo mô phỏng: nhân vật trung bình thắng ~100% / 85% / 65% / 35% / 10% / 2% ở 6 vùng. Lối chơi "luôn vào vùng khó nhất còn thắng được 55%" mang về ~0,4 món Thần thoại mỗi kiếp nhưng 4 trên 10 kiếp chết dưới nanh yêu thú.

**Bot cũng lịch luyện như người chơi.** Từ 10 tuổi, cứ 3 đến 8 năm mỗi bot quyết định ra ngoài hay ở nhà tu luyện, rồi chọn vùng khó nhất mà nó tự tin thắng được. Tỉ lệ thắng bot tự ước lượng theo cùng đường cong với người chơi, tính cả linh căn, thể chất, tu vi và trang bị đang có.

| Tính cách | Tỉ lệ ra ngoài | Chấp nhận tỉ lệ thắng từ |
|---|---|---|
| Cuồng | 70% | 35% |
| Tham | 70% | 45% |
| Nghĩa | 55% | 55% |
| Mưu | 50% | 60% |
| Hiền | 35% | 70% |
| Ẩn | 30% | 80% |

- **Mỗi năm ở vùng:** bot tu chậm hơn khi ở nhà (x0,6 nhân căn bậc hai hệ số thu hoạch). Bù lại, mỗi lần thắng yêu thú được thêm tu vi và có thể nhặt đồ.
- **Đồ của bot:** chỉ giữ món có phẩm tốt nhất. Phẩm đó tăng sức mạnh của bot, tới x1,3 khi mang Thần thoại. Bot có thể đoạt thần khí ở vùng Khó trở lên, và Thiên hạ ký sự sẽ báo, khoảng 18 lần mỗi 1000 năm.
- **Thua yêu thú:** bot có thể bỏ mạng; nếu sống thì về nhà dưỡng thương. Vùng có tai họa thiên nhiên thì thỉnh thoảng cũng có bot chết vì tai họa. Rủi ro "gặp nạn giữa đường" chung trước đây nay chỉ còn tính khi bot ở nhà.
- **Cân bằng:** phân bố cảnh giới của thế giới bot giữ gần như cũ (Phàm Nhân 35%, Luyện Khí 33%, Trúc Cơ 19%, Kim Đan 8%, Nguyên Anh 3%...).
- **Gặp người chơi:** khi người chơi và bot cùng một vùng, bot đó dễ được chọn vào kỳ ngộ gấp 3 lần, và được nới thêm một bậc cảnh giới khi xét có gặp nhau không.
- **Đoạt đồ của bot:** hạ được bot mang bảo vật thì có 25% đoạt món đó. Với thần khí chỉ 8%, để đồ Thần thoại vẫn chủ yếu đến từ vùng khó: người chơi chỉ ở vùng Vừa trung bình được ~0,13 món mỗi kiếp nhờ cướp của bot, còn lối chơi liều được ~0,4.
- **Giao diện:** tab Quan hệ và Bảng Thiên Kiêu ghi bot đang lịch luyện ở đâu và có thần khí không. Mỗi thẻ vùng ghi số tu sĩ đang ở đó và tên người quen.

## 6g. Phân giải và lò rèn

**Nguyên liệu:** Tinh thiết (cơ bản), Linh tinh (tẩy luyện, đồ tốt), Thú hạch / Độc nang / Hỏa tinh / Binh hồn (dẫn liệu cho Hút máu / Né tránh / Bạo kích / Phản chấn), Thần hồn (đồ Thần thoại). Nhặt khi lịch luyện, hạ yêu thú, phân giải đồ; Tinh thiết mua được ở lò rèn. Tinh thiết và Linh tinh tính theo cảnh giới (nhiều hơn khi cảnh giới cao, chi phí cũng tăng theo).

**Phân giải** (trong Hành trang): Hạ ~2, Trung 3, Thượng 5 Tinh thiết + 1 Linh tinh, Cực 8 + 3, Thần thoại 4 Tinh thiết + 2 Linh tinh + 1 Thần hồn; nhân (1 + cảnh giới món). Đồ đã cường hóa trả lại một nửa nguyên liệu đã bỏ vào. Có nút phân giải hết đồ Hạ, Trung phẩm và tùy chọn túi đầy thì tự phân giải thay vì tự bán.

**Lò rèn** (từ 12 tuổi):
- Cường hóa +1 đến +10, mỗi cấp +8% công, thủ, sinh lực. +1 đến +4 chắc chắn thành công, +5 trở đi 85% giảm dần tới 35%. Lên +8 trở lên thất bại thì tụt một cấp. Không bao giờ vỡ đồ.
- Thăng cấp: kéo món đồ lên cảnh giới hiện tại, giữ phẩm, cường hóa, dòng, thần thông.
- Tẩy luyện: đổi một dòng của đồ Thượng phẩm trở lên, ngẫu nhiên hoặc chắc chắn theo dẫn liệu (2 cái).
- Rèn mới: chọn ô, loại binh khí, dẫn liệu. Phẩm 35/38/20/7% (Hạ/Trung/Thượng/Cực). Lò thần khí tốn 3 Thần hồn: ~15% ra Thần thoại, còn lại chắc Cực phẩm.
- Tay nghề rèn (mỗi kiếp, tối đa 100) cộng tới +15% tỉ lệ; Thể tu +5%. Tay nghề 100 mở danh hiệu Luyện Khí Tông Sư. Sống sót 10 năm ở Tử địa trở lên mở danh hiệu Tử Địa Hành Giả.

## 6h. Bố cục màn chơi

Màn chơi chia làm 3 phần cố định:

- **Thanh trên gọn (~90px):** ảnh nhỏ, tên, cảnh giới, tuổi, tông môn. Bên dưới là 3 thanh tu vi, sinh lực, thọ (chạm vào từng thanh để xem giải thích) và một dòng ghi việc đang làm, vùng lịch luyện, linh thạch. Chạm vào ảnh hoặc tên thì mở bảng **Nhân vật** gồm ảnh lớn, trang bị, 8 chỉ số, thể chất, danh hiệu.
- **Ở giữa:** các tab (Nhật ký, Quan hệ, Thiên hạ, Xếp hạng, Sổ kiếp) và nội dung tab. Đây là vùng cuộn duy nhất, tự chiếm phần màn hình còn lại.
- **Dải điều khiển dưới cùng (vùng ngón cái):**
  - Hàng tốc độ và Tự quyết.
  - 4 việc làm, chỉ có biểu tượng và tên. Lịch luyện ghi thêm độ khó của vùng đang chọn.
  - 5 tiện ích: Hành trang, Lò rèn, Tụ Bảo Lâu, Bế quan, Thêm (Nhân vật, Danh hiệu, Cài đặt).
  - Bấm giữ một nút thì hiện mô tả.
  - Khi đủ tu vi, nút Đột phá to hiện ngay trên hàng tốc độ.

Tin quan trọng hiện thành thông báo nổi: danh hiệu mới, thần khí vào tay, tin dữ của người thân.

Trên màn hình rộng (từ 900px), bố cục chia 2 cột: trái là nhân vật và điều khiển, phải là các tab.

Ở điện thoại cỡ 390×844, nhật ký bắt đầu ở y=208 và cao 472px, không cần cuộn trang (trước đây nhật ký bắt đầu sau khoảng 1.500px).

**Kỳ ngộ và trận đấu không phủ màn hình (6h bổ sung):**

- **Thẻ kỳ ngộ:**
  - Hiện ngay trong vùng giữa, cao vừa nội dung; nhật ký vẫn thấy bên dưới.
  - Dải điều khiển vẫn dùng được: đổi tốc độ, mở Hành trang uống đan, đổi đồ trước khi chọn.
  - Thời gian tự dừng cho tới khi chọn.
- **Chọn xong:**
  - Không còn màn kết quả hay nút "Tiếp tục".
  - Kết quả được ghi vào nhật ký: tên kỳ ngộ, lựa chọn (có dấu "Tự quyết" nếu máy chọn), diễn biến đầy đủ. Dòng mới sáng lên vài giây.
  - Game chạy tiếp ngay.
- **Trận đấu:**
  - Diễn lại trong vùng giữa, đánh xong tự đóng sau 1,6 giây; nút "Bỏ qua" đóng ngay.
  - Cài đặt "Xem diễn lại trận đấu" có 3 mức: Luôn xem / Chỉ trận lớn (mặc định) / Không xem.
  - Trận lớn là trận có thể mất mạng thật: chết trong trận, hoặc hệ số nguy hiểm từ 0,4 trở lên (yêu thú vùng Khó trở lên, kẻ thù, ma tu...).
  - Từ 8× luôn bỏ qua.
- **Thông báo nổi:** thêm "Trọng thương" khi sinh lực tụt dưới 25 sau một kỳ ngộ.
- **Chết:** màn kết thúc kiếp ghi lại "giây phút cuối" (kỳ ngộ, lựa chọn, diễn biến).
- **Bàn phím:** phím 1–9 chọn phương án, Space tạm dừng hoặc chạy tiếp, Esc đóng bảng.
- **Màn hình rộng:** thẻ kỳ ngộ ở cột trái, nhật ký bên phải luôn hiện.
- **Thẻ kỳ ngộ ở dưới:** nằm ngay trên dải điều khiển, cao tối đa 48% màn hình. Nhật ký (dòng mới nhất ở trên) luôn đọc được.
- **Nút Tự quyết có 3 chế độ** (bấm để đổi, có giải thích ngắn):

  | Chế độ | Tốc độ dưới 8× | Từ 8× |
  |---|---|---|
  | Hỏi tất cả | Hỏi mọi kỳ ngộ | Hỏi mọi kỳ ngộ |
  | Hỏi việc lớn (mặc định) | Việc nhỏ tự quyết | Tự quyết mọi việc tự quyết được |
  | Tự quyết hết | Tự quyết mọi việc tự quyết được | Tự quyết mọi việc tự quyết được |

  - Ở chế độ "Tự quyết hết", game chỉ hỏi những kỳ ngộ không tự quyết được: đột phá, đạo đồ, đạo hiệu, chuyện quan hệ.
  - **Việc lớn** gồm:
    - những kỳ ngộ không tự quyết được (đột phá, đạo đồ, đạo hiệu, chuyện quan hệ, báo thù, cố nhân...);
    - truyền thừa, bí cảnh, kiếm trủng, yêu vương, tâm ma;
    - yêu thú ở vùng Nguy hiểm trở lên.
  - **Tần suất ở 1×** (1 năm mỗi giây, mô phỏng 30 kiếp): "Hỏi tất cả" khoảng 2,7 giây một lần; "Hỏi việc lớn" khoảng 8 giây một lần, trong đó nhiều nhất là đột phá.

**Màn hình thấp và toàn màn hình:**

- Màn hình cao dưới 760px (iPhone nhỏ, hoặc bị thanh trình duyệt chiếm chỗ): lúc có kỳ ngộ thì tạm ẩn 3 thanh chỉ số, hàng nút tab và hàng việc làm.
  - Nhật ký vẫn hiện (luôn là tab Nhật ký) và lấp phần còn lại.
  - Dải điều khiển luôn sát đáy; tốc độ và tiện ích vẫn giữ.
  - Thẻ quá dài thì nhật ký co lại, thẻ cuộn bên trong.
- Thẻ kỳ ngộ dài (ví dụ 6 con đường tu hành) thì cuộn được.
- Cài như ứng dụng: `manifest.webmanifest`, biểu tượng `icons/` vẽ từ sprite của game, các thẻ meta cho iPhone. Phần trên chừa chỗ tai thỏ.
- Menu ☰ có hướng dẫn cài ra Màn hình chính. Trình duyệt hỗ trợ (Android, máy tính) thì có thêm nút Toàn màn hình.

## 6i. Hành trang, bản lưu, ngoại tuyến

- **Hành trang:**
  - Mỗi món (đang mang hay trong túi) có nút cường hóa (tỉ lệ và chi phí hiện sẵn) và nút thăng cấp nếu món đó thấp hơn cảnh giới. Kết quả hiện ngay đầu bảng.
  - Nút "Mặc đồ tốt nhất".
  - Tùy chọn "nhặt được đồ tốt hơn thì tự mặc" (mặc định bật). Đồ phong ấn tính theo sức đang phát huy. Vũ khí không hợp võ kỹ đang mang bị tính kém đi 40%, để không tự đổi kiếm lấy đao.
  - Ô trống có gợi ý chỗ kiếm đồ và nút "Rèn" mở thẳng thẻ Rèn mới của Lò rèn.
- **Võ kỹ lệch binh khí:**
  - Có nút "Cầm [vũ khí hợp] trong túi"; không có thì có nút "Rèn [loại binh khí]".
  - Thanh trên hiện cảnh báo ⚠, bấm vào mở Hành trang.
- **Lọc nhật ký:** Tất cả / Kỳ ngộ / Chiến đấu / Quan trọng. Quan trọng gồm đột phá, thần khí, danh hiệu, tin dữ, bình cảnh, đạo đồ, tâm ma, truyền thừa…
- **Xuất / nhập bản lưu** (menu ☰):
  - Mã dạng `TKPS1:` + base64 của bản lưu, khoảng 30 nghìn ký tự.
  - Có nút chép mã và tải thành tệp.
  - Nhập sẽ thay thế thế giới hiện tại, có hỏi xác nhận.
- **Ngoại tuyến và cập nhật:**
  - Trang riêng (GitHub Pages) có `sw.js`. Có mạng thì luôn lấy tệp mới nhất từ máy chủ (bỏ qua bộ nhớ đệm của trình duyệt) rồi lưu lại; mất mạng thì dùng bản đã lưu.
  - Mỗi bản có số phiên bản (`js/version.js`, `version.json`, ghi bằng `tools/bump-version.mjs`). Ứng dụng so với máy chủ lúc mở, lúc quay lại ứng dụng và mỗi 10 phút; có bản mới thì hiện thanh "Có bản mới · Cập nhật".
  - Bấm Cập nhật thì lưu thế giới, xóa bộ nhớ đệm, tải lại trang.
  - Menu ☰ có dòng phiên bản và nút Kiểm tra cập nhật.
  - Bản gộp một tệp trong Claude không dùng service worker, tự cập nhật khi đăng lại.

## 6j. Biểu tượng võ kỹ, kỳ ngộ đợt 3

**Biểu tượng võ kỹ** (`js/icons.js`, xem thử ở `tools/preview-skills.html`):
- 23 võ kỹ và 5 chiêu yêu thú, mỗi chiêu một biểu tượng pixel 16×16.
- **Hình theo loại chiêu:**
  - binh khí: kiếm, đao, thương, phiến, vạn kiếm
  - tay không: quyền, chưởng, ấn, trảo
  - hộ thể, hồi phục: khiên, hồi phục, sen
  - khác: lôi, giọt huyết, móng thú, cuồng nộ, gầm thét
- **Màu theo hệ, vầng sáng theo phẩm.** Tuyệt học của 6 con đường tu hành có vầng đỏ như đồ Thần thoại.
- **Hiện ở:** Hành trang, bí kíp ở Tụ Bảo Lâu, nhật ký khi lĩnh ngộ, tên chiêu khi đánh nhau.
- **Nút "Xếp võ kỹ hợp binh khí":** chọn 3 chiêu đánh mạnh nhất dùng được với binh khí đang cầm, cộng 1 chiêu hộ thể hoặc hồi phục.

**Kỳ ngộ đợt 3** (`js/events3.js`): 45 kỳ ngộ mới, tổng cộng 117.

| Nhóm | Kỳ ngộ |
|---|---|
| Riêng từng vùng lịch luyện (luật `map`) | yêu cáo trộm gà, đê làng sắp vỡ (Ngoại ô) · Lang Vương, thợ săn mất tích (Hắc Phong) · cổ trùng, độc thảo ngàn năm + đêm trăng tròn (Vụ Ẩn) · hỏa linh, lò luyện cổ (Xích Diệm) · tàn hồn tướng quân, binh hồn nhận chủ (Cổ Chiến) · khe nứt thời gian, bóng hình kiếp trước (Hư Không) |
| Cảnh giới cao (luật `realm`) | khai tông lập phái (người chơi làm tổ sư), thư mời trưởng lão, luận đạo, ma đạo xâm lấn, tiểu thiên kiếp, truyền y bát |
| Con đường tu hành (luật `path`) | kiếm ý bên thác, độ hóa ma đầu, ma công phản phệ, lôi trì tôi thân, trận pháp thượng cổ, linh thú tiến hóa |
| Tông môn (luật `sect`) | đại tỷ thí, nhiệm vụ tông môn, tranh ngôi chưởng môn, truy bắt phản đồ |
| Thiên hạ | đoạt thần khí của bot (chỉ ở vùng Khó trở lên, luật `minD`), hai tông giao tranh (chọn phe), dị bảo xuất thế, khiêu chiến Bảng Thiên Kiêu |
| Tuổi thơ, tuổi già, bế quan | trường làng, chim non rơi tổ, hội làng · viết di thư, truyền nghề · tiếng gõ ngoài động phủ, ngộ đạo trong bế quan |
| Chuỗi dài | Huyết án trấn Thanh Thạch (3 bước), Lời hẹn dưới gốc đào (hẹn ước, 25–45 năm sau gặp lại, hoặc người đã mất) |

**Lựa chọn khác nhau theo người:** nhiều lựa chọn riêng chỉ hiện khi đủ điều kiện, ví dụ:
- Ma tu hoặc thể chất Bách Độc được nuốt cổ trùng.
- Pháp tu dễ thu phục hỏa linh hơn, Phật tu dễ siêu độ hơn.
- Có linh thú thì mới có chuyện linh thú tiến hóa.

**Luật xuất hiện mở rộng:** `map`, `minD`, `realm`, `path`, `sect`, kiểm cả khi chọn kỳ ngộ lẫn trong `tools/check-events.mjs`.

**Trọng số:**
- Kỳ ngộ riêng của vùng nhân 3 khi đang ở đúng vùng.
- Kỳ ngộ chưa gặp trong kiếp này nhân 1,5; đã gặp n lần thì nhân 1/(1 + 0,5n).

**Cân bằng:**
- Tu vi thưởng của đợt này nhân 0,6; các khoản cộng sức chiến đấu vĩnh viễn chỉ 2–3,5%.
- Kỳ ngộ có trận nguy hiểm đều có tự quyết theo tỉ lệ thắng, và được xếp vào nhóm "việc lớn" nên ở tốc độ chậm vẫn hỏi người chơi.

**Số liệu sau đợt này:**

| Mô phỏng | Kết quả |
|---|---|
| Cân bằng chung (540 kiếp) | tuổi trung bình 310, phi thăng 17 |
| Chỉ ở vùng Vừa (200 kiếp) | khoảng 0,09 món Thần thoại mỗi kiếp |
| Lối chơi liều (200 kiếp) | khoảng 0,6 món Thần thoại mỗi kiếp |
| Bị hỏi ở 1× (chế độ "Hỏi việc lớn") | khoảng 8 giây một lần |
| Thử từng lựa chọn của 45 kỳ ngộ mới | 113 lựa chọn, không lỗi |

## 10. Vị diện, tháp 1000 tầng, độ khó (bản 2)

### Vị diện
- **Phàm giới** (1 lượt = 1 năm) và **Linh giới** (1 lượt = 5 năm).
- Mỗi giới có dân bản địa riêng (Phàm 40 linh hồn, Linh 30), tông môn, Bảng Thiên Kiêu, Thiên hạ ký sự riêng. Kỳ ngộ tìm bot đều lọc theo giới đang ở.
- **Bot cũng phi thăng:** bot phi thăng ở Phàm giới sẽ đáp xuống Tiếp Dẫn Đài Linh giới và làm lại từ Luyện Linh, nên người quen cũ có thể gặp lại ở trên. Bot muốn phi thăng cũng phải leo hết tháp.
- **Người chơi phi thăng:**
  - Đi tiếp, giữ tuổi, võ kỹ, thể chất, danh hiệu. Bắt đầu ở Luyện Linh sơ kỳ.
  - Đồ hạ giới bị **áp chế còn 20%** (dòng % còn một nửa). Linh hóa ở lò rèn cần Linh tủy.
  - Đồ Thần thoại ở Linh giới cần Đạo văn thạch thay cho Thần hồn.
- **Hồn Lực ở Linh giới:** cả kiếp nhân đôi, thêm +100 khi phi thăng Linh giới, +200 khi phi thăng khỏi Linh giới.
- **Đầu thai:** đã phi thăng lên Linh giới một lần thì được chọn sinh ra ở Phàm giới hay làm dân bản địa Linh giới.

### Tháp 1000 tầng (Thông Thiên Tháp ở Phàm giới, Vạn Linh Tháp ở Linh giới)
- Khoảng 111 tầng ứng với 1 cảnh giới của giới đó, mạnh dần theo cả cảnh giới nhỏ.
- **Trang bị của quái tháp** tăng theo tầng: x0,85 ở tầng 1, x1,6 ở tầng 1000.
- **Nhịp tầng:**
  - mỗi 10 tầng có **tinh anh**;
  - mỗi 100 tầng có **trùm tầng**, đánh qua 2 giai đoạn liền, giai đoạn sau nổi giận;
  - tầng 1000 là **Tháp chủ**, đánh qua 3 giai đoạn.
- **10 tầng cảnh:** mỗi 100 tầng một tầng cảnh, có quái và trùm riêng.
- **Tầng đặc biệt** (khoảng 1/14 tầng thường): Thử Tâm, Ảo Cảnh, Gương (đánh với bóng mình), Bảo Khố (chọn 1 trong 3 rương), Suối Linh (hồi đầy máu).
- **Việc làm "Vượt tháp":** mỗi lượt leo 2–5 tầng.
  - Tu vi bằng 60% lúc tu luyện.
  - Sinh lực mất đi giữ nguyên giữa các tầng; dưới 35 thì ra nghỉ.
  - Thua ở tầng thường thì bị đẩy ra, không chết. Trùm và Tháp chủ thì có thể mất mạng.
- **Phần thưởng:**
  - mỗi tầng: linh thạch;
  - tinh anh: rương đồ, có Thần thoại từ tầng 500;
  - trùm tầng: đồ Cực phẩm, bí kíp 50%, nguyên liệu, từ tầng 500 có 10–35% ra Thần thoại;
  - Tháp chủ: đồ Thần thoại chắc chắn, và **lệnh bài** của tháp.
- **Lệnh bài là bắt buộc để phi thăng.** Danh hiệu mốc: tầng 100, 500, 1000, Vạn Linh Chi Chủ.
- **Mỗi kiếp leo lại từ đầu.** Hồi ức tháp: đi nhanh qua 30% kỷ lục mọi kiếp, không nhận thưởng.
- **Quét tầng** đã qua (từ tầng 50, 10 năm một lần) để nhặt nguyên liệu.

### Phi thăng
- Ở cảnh giới cuối (Độ Kiếp, Linh Đế), đột phá không còn là gieo xác suất. Cần đủ tu vi viên mãn **và** lệnh bài.
- **9 đợt lôi kiếp** là 9 trận liền, mạnh dần, giữa các đợt không hồi máu. Có thể uống Hồi Xuân Đan trước mỗi đợt, hoặc từ bỏ (tu vi còn 85%).
- Thua một đợt: có thể chết; nếu sống thì tu vi còn 70%.
- Đo bằng mô phỏng, với nhân vật Độ Kiếp viên mãn:

  | Trang bị | Thắng Tháp chủ | Qua lôi kiếp |
  |---|---|---|
  | Cực phẩm +6 | ~40% | ~40% |
  | Cực phẩm +10 | ~57% | ~53% |
  | Thần thoại +6 | ~97% | ~100% |

### Độ khó
- **Quái vùng lịch luyện:**
  - Mạnh theo cả cảnh giới nhỏ của người chơi, nên lợi thế chỉ còn ở trang bị, võ kỹ, cách xây nhân vật.
  - Hệ số trang bị theo vùng: 1,2 / 1,2 / 1,25 / 1,35 / 1,4 / 1,5 (Dễ → Luyện ngục).
- **Tinh anh ở vùng lịch luyện:** từ Khó trở lên, 15/25/35/50% mỗi con là tinh anh, mang 1–3 thiên phú: Cuồng Bạo, Hút Huyết, Thiết Giáp, Hộ Thuẫn, Phản Kích, Tái Sinh, Liên Kích, Bạo Liệt, Bất Động, Bất Tử.
- **Vùng chủ:** hạ đủ 10 yêu thú ở một vùng từ Khó trở lên thì vùng chủ xuất hiện. Đánh 2 giai đoạn, chắc chắn rơi đồ Cực phẩm (Luyện ngục 25% Thần thoại).
- **Trần cộng dồn:**
  - sức chiến đấu cộng thẳng (kỳ ngộ, xuất thân, tàn niệm) tối đa +60%;
  - hệ số không phải thể chất: chiến đấu tối đa x1,6, tu luyện tối đa x2,2.
- **Độ khó thế giới** (chọn khi tạo thế giới mới):

  | Độ khó | Quái | Nguy cơ mất mạng | Thưởng, Hồn Lực |
  |---|---|---|---|
  | Thường | x1 | x1 | x1 |
  | Khó | x1,25 | x1,3 | x1,3 |
  | Nghịch Thiên | x1,6 | x2 | x2 |

- **Số liệu (mô phỏng):**

  | Chỉ số | Kết quả |
  |---|---|
  | Thắng ở Luyện ngục lúc 300 tuổi | 21% (trước 71%) |
  | Tầng tháp đạt được (trung vị) | Kim Đan ~230, Hóa Thần ~510, Hợp Thể ~800, Đại Thừa ~900 |
  | Lối chỉ tu luyện, tới Độ Kiếp | 5% số kiếp, nhưng không phi thăng được vì không leo tháp |
  | Lối leo tháp và rèn đồ, lên Linh giới | khoảng 2% số kiếp |

### Kỳ ngộ Linh giới (`js/events4.js`, luật `plane`)
- **Mỗi vùng một chuyện riêng:**
  - Tiếp Dẫn Cốc: kẻ mới phi thăng.
  - Vạn Linh Sâm Lâm: linh hầu trộm đào.
  - Huyết Linh Hải: huyết triều.
  - Lôi Minh Cao Nguyên: mạch lôi tinh.
  - Linh Hư Chiến Trường: tàn hồn Linh tộc vương.
  - Vẫn Linh Uyên: tiếng gọi từ đáy vực.
- **Phi thăng giả và dân bản địa:** hộ tịch, thiếu gia bản địa, Hội Phi Thăng (tông môn riêng của người phi thăng), cố nhân ở thượng giới, di vật hạ giới.
- **Đời sống:** tranh linh mạch, huyết mạch Linh tộc, đấu giá Vạn Bảo Các, chợ đen, khế ước linh thú, Linh Hải triều dâng, Linh Hoàng chiêu thân, Linh Tôn chỉ điểm, linh kiếp nhỏ.
- **Chuỗi "Bí mật Tiếp Dẫn Đài" (3 bước):** người phi thăng mất tích, hầm linh nô, Tiếp Dẫn Sứ Giả.
- **Tổng cộng 144 kỳ ngộ.** Chuyện chỉ hợp Phàm giới (ví dụ Huyết án trấn Thanh Thạch) có luật `plane: 0`.

## 11. Tháp đa dạng, vai trò các việc làm, túi trữ vật (bản 3)

### Tháp
- Thua ở bất kỳ tầng nào: tự chuyển sang Tu luyện, ghi nhật ký, báo "Thua ở tầng X · tạm dừng vượt tháp". Tùy chọn "Thua thì tu luyện, đủ sức tự leo lại" (mặc định bật): cứ 5 năm xem lại, tỉ lệ thắng tầng đó từ 60% (trùm 75%) và sinh lực từ 70 thì quay lại tháp.
- Tỉ lệ thắng trùm tính đủ mọi giai đoạn (đánh thử 24 lần cả chuỗi, máu mang sang giai đoạn sau). Trùm chỉ tự đánh khi từ 75% (sự kiện có `canAuto`), thấp hơn thì luôn dừng lại hỏi, kể cả ở 32×.
- Rút lui trước trùm: chuyển sang tu luyện, không xếp lại trùm mỗi lượt.
- Trùm tầng 100-400 thua chỉ trọng thương (`safe`). Từ tầng 500 và Tháp chủ vẫn có thể chết.
- Diễn trận tinh anh (mỗi 10 tầng) và trùm (mỗi 100 tầng) cả khi chạy nhanh (tốc độ cao, khoảng 2 giây). Cài đặt "Xem trận trong tháp": Trùm và tinh anh / Chỉ trùm / Không xem. Trận tinh anh đánh lúc trôi năm được đẩy vào `s.replay` để giao diện diễn.
- Trùm: màn giới thiệu (tên, khu, cơ chế), thanh máu lớn, nhãn giai đoạn 1/2/3, hiệu ứng nổi giận khi sang giai đoạn sau, hình to hơn, nền trận theo màu khu (`THEME_BG`).
- Mỗi khu một bộ chiêu trùm (`BOSS_KITS`): Thi Mộ triệu cương thi (khiên) và thi độc, Băng đóng băng, Viêm Ma thiêu đốt, Quỷ Vực hút máu, Vạn Kiếm phản đòn, Ma Thành tăng công và phá giáp, Lôi Đài liên hoàn, Hư Không né cao. Tháp chủ: mỗi giai đoạn mượn chiêu của ba trùm trước.
- Tầng đặc biệt (1/12 tầng thường): thêm Thương nhân (đổi bằng Tháp tệ), Thử thách liên hoàn (3 trận liền, thưởng gấp đôi), Đối thủ leo tháp (bot có kỷ lục gần nhất), Người kẹt trong tháp (cứu bot, thân +25), Bia ngộ đạo (võ kỹ, tâm pháp, ngộ tính).
- Tháp tệ: tầng thường +1, tinh anh +5, tầng đặc biệt +2, trùm +30, Tháp chủ +100. Tháp thương điếm trong bảng tháp: Hồi Xuân, Ngưng Thần, Bạo Khí, Phá Cảnh Đan, đá cường hóa, bí kíp tháp, tâm pháp.
- HUD có chip "🗼 tầng/1000", bảng tháp có tháp pixel 10 khu và dấu tầng hiện tại, toast mỗi khi qua mốc 100.

### Vai trò các việc làm
- **Sát khí** (0-100): vượt tháp +1,5 mỗi lượt +0,5 mỗi tầng, lịch luyện +0,5..4,5 theo độ khó vùng, mỗi trận +1 (trận lớn +4). Từ 50: tu vi từ chiến đấu -20%. Từ 70: đột phá -10%, tâm ma dễ gặp gấp 3. 100: tẩu hỏa nhập ma (sinh lực -40, mất 20% tu vi, về 60). Giảm: tu luyện -4, bế quan -15, kết giao -8, mưu sinh -3 mỗi lượt. Phật tu xả gấp đôi; Ma tu chịu thêm 20, tích chậm hơn 30%, sát khí tăng sức mạnh tới +25%.
- **Căn cơ**: tu vi từ vượt tháp, lịch luyện là "chưa vững" (`P.loose`, thanh tu vi có đoạn sọc cam). Tu luyện củng cố 1,2 × tu vi mỗi lượt, bế quan 4 ×. Đột phá: -30% × (chưa vững / tu vi cần).
- **Tâm pháp**: một môn chủ tu, tầng 1-9, chỉ lên khi tu luyện (bế quan nhanh 2,5 lần), cần 8 + 6×tầng năm. 7 môn (`TAM_PHAP`): Thanh Tâm (tu luyện), Kim Thân (sinh lực), Linh Hải (linh lực), Kiếm Tâm (bạo kích), Hồi Xuân Công (hồi phục), Tĩnh Thần (xả sát khí, đột phá), Bất Động Minh Vương (giảm sát thương). Nhập đạo có sẵn Thanh Tâm Quyết; học thêm từ trùm tháp, Bia ngộ đạo, Tháp thương điếm.
- **Bế quan**: đủ 10 năm thì xuất quan sinh lực đầy, sát khí 0, căn cơ vững, lần đột phá tới +15%. Tử quan 50-100 năm: tu vi x2, xuất quan 50% đốn ngộ (tâm pháp +1 tầng).
- **Mưu sinh**: chọn một nghề (`NGHE`), cấp 1-9 chỉ lên khi mưu sinh, đổi nghề mất nửa cấp. Luyện đan (ra Hồi Xuân, Ngưng Thần, Bạo Khí, cấp cao ra Tĩnh Tâm, Phá Cảnh, Diên Thọ; thu nhập x0,6). Luyện khí (Tinh thiết, Linh tinh, tay nghề rèn, rèn và cường hóa rẻ hơn 4%/cấp). Phù sư (Hộ Thân, Bạo Lôi, từ cấp 4 Truyền Tống). Thương nhân (thu nhập x2+, Tụ Bảo Lâu rẻ 3%/cấp, tối đa 5 sản nghiệp sinh lời mỗi năm).
- **Trận lớn** (trùm, vùng chủ, lôi kiếp, `opts.big`): tự dùng Hộ Thân Phù (khiên 30%), Bạo Lôi Phù (công +25%), Bạo Khí Đan (công +30%), một lần cho cả trận nhiều giai đoạn. Truyền Tống Phù tự cháy khi sắp mất mạng.
- **Kết giao**: xả sát khí, thanh danh, bạn thân từ 50 tặng quà. Trợ chiến: bạn thân từ 50, cùng giới, cảnh giới không kém quá một bậc, mời vào trận trùm tháp và vùng chủ (công +30% × tỉ lệ sức, khiên 15%), mỗi người 10 năm một lần, xong thì nợ ân tình (kết giao để trả). Hộ pháp lôi kiếp: bạn thân từ 70 hoặc đạo lữ, huynh đệ, sư đồ đỡ thay một đợt. Đạo lữ song tu: tu luyện, bế quan +25%, củng cố x1,5, xả thêm sát khí.
- **Lịch trình tự động** (`P.plan`): tối đa 5 bước lặp lại, mỗi bước một việc với điều kiện số năm / sát khí ≥ / sát khí ≤ (bế quan theo số năm). Mẫu: Leo tháp, Tu đạo, Làm giàu. Dừng khi thua trùm, sinh lực dưới 20 mà hết đan, tẩu hỏa, tu vi viên mãn mà chưa thể đột phá, hoặc người chơi tự đổi việc. Thua tầng thường khi đang chạy lịch trình thì sang bước kế.

Mô phỏng 30 kiếp mỗi cách chơi (Phàm giới, có rèn đồ):

| Cách chơi | Cảnh giới TB khi chết | Tầng tháp TB | Tới Độ Kiếp |
|---|---|---|---|
| Chỉ tu luyện | 4,6 | 0 | 3/30 |
| Chỉ bấm Vượt tháp (game tự chuyển tu luyện khi thua) | 5,6 | 447 | 6/30 |
| Lịch trình "Leo tháp" | 8,5 | 708 | 14/30 |

### Túi trữ vật
- 5 thẻ biểu tượng: Trang bị, Công pháp, Đan và phù, Nguyên liệu, Cài đặt.
- Trang bị: hình nhân vật lớn, 3 ô trang bị quanh hình (trống thì hiện bóng mờ), chỉ số bằng biểu tượng (chạm để xem giải thích), lưới 5 cột có viền theo phẩm, nhãn +N, ▲ tốt hơn, 🔒 phong ấn, ⚠ áp chế. Chạm ô mở thẻ chi tiết có so sánh với đồ đang mang và nút Mang / Cường hóa / Thăng cấp / Bán / Phân giải. Lọc theo ô, xếp theo phẩm / cảnh giới / mới nhặt, chọn nhiều để bán hoặc phân giải hàng loạt.
- Công pháp: thanh 4 ô võ kỹ (lệch binh khí viền đỏ kèm biểu tượng binh khí cần), lưới võ kỹ đã học, thẻ chi tiết có nút đặt vào ô 1-4, chiến thuật dạng 3 thẻ, tâm pháp chủ tu.
- Lò rèn, Tụ Bảo Lâu, Tháp thương điếm dùng cùng kiểu lưới ô.

### So sánh đồ bằng lực chiến, ghim, khóa (bản 3.1)
- **Lực chiến** (`combatValue`): thử mặc cả bộ rồi dựng chỉ số trận đấu thật (`playerFighter`), tính sát thương mỗi lượt × lượng máu thực chịu được. Gồm thần thông, dòng %, phong ấn, áp chế, võ kỹ có hợp binh khí, tâm pháp, con đường. Đối chiếu 60 bộ đồ ngẫu nhiên với tỉ lệ thắng đánh thật: tương quan hạng 0,98 (điểm cũ 0,91). Ví dụ đao Thần thoại cảnh giới 3 được chấm cao hơn đao Trung phẩm cảnh giới 5, đánh thật thắng 25% so với 7%.
- Thẻ chi tiết: lực chiến trước → sau, "Mặc + xếp lại võ kỹ" khi đổi loại binh khí, từng chỉ số ▲▼, thần thông được/mất, "nếu thăng/linh hóa lên cảnh giới hiện tại", "khi lên X mở phong ấn", **Đánh thử** 40 trận với quái vùng / tầng tháp kế / trùm tháp kế.
- Nhãn ô: ▲ tốt hơn ngay, ⬆ thăng cấp lên sẽ tốt hơn, 📌 ô đang ghim, 🔒 đã khóa, ⛓ phong ấn, ⚠ áp chế. Nút cường hóa, thăng cấp ghi trước lực chiến tăng bao nhiêu.
- **Ghim**: tự tay mặc thì ô đó được ghim, tự mặc và "Mặc tốt nhất" không thay. Có đồ mạnh hơn từ 10% thì HUD báo "⚠ Có đồ mạnh hơn".
- **Tự mặc khi nhặt**: Tắt / Lực chiến +10% (mặc định) / Hễ tốt hơn. Không thay đồ Thần thoại bằng đồ phẩm thấp hơn.
- **Khóa**: đồ Thần thoại tự khóa. Đồ khóa không bán, không phân giải, không bị chọn nhiều. Túi đầy: bỏ món tiềm năng kém nhất (không đụng đồ khóa, Thần thoại, đồ có ⬆); toàn đồ khóa thì cho tràn và báo.
- **Chọn nhiều** tự tắt mỗi lần mở túi, có thanh báo và nút Xong. "Chọn hết đồ kém" chỉ chọn Thượng phẩm trở xuống không khóa, không tốt hơn kể cả khi thăng cấp.
- Bán, phân giải đồ Cực phẩm trở lên phải bấm hai lần. Có **↶ Hoàn tác** lần bán/phân giải gần nhất trong 10 giây.
- Túi mở rộng 16 → 24 → 32 ô bằng linh thạch hoặc Tháp tệ. Xếp theo lực chiến, lọc "Thăng được", "Đã khóa".

## 12. Ba đạo lộ, kỹ năng thay võ kỹ, tranh vẽ tay (bản 4)

- Bỏ 4 đường cũ (Pháp, Phật, Ma, Ngự thú), bỏ võ kỹ, bí kíp, tâm pháp. Còn 3 đạo lộ (`PATHS` trong data.js), chọn **ngay khi nhập đạo (6 tuổi)** ở màn riêng có tranh, biểu đồ, điểm mạnh yếu, nút **Thử đạo** (một trận mẫu giả như ở Kim Đan). Gợi ý theo thiên tư: căn cốt → Thể, ngộ tính, tâm tính → Tinh thần, cơ duyên, trận thắng → Kiếm; chọn đúng +3 ngộ đạo điểm. Chọn xong được tặng binh khí đúng loại. Mỗi kiếp được **chuyển tu** một lần (mất 50% tu vi, hoàn nửa điểm đã dùng).
- Mỗi đạo 8 kỹ năng (`SKILLS` trong combat.js, mã `kiem_1..8`, `the_1..8`, `phu_1..8` trùng tên tranh): đòn cơ bản, 3 chiêu (chiêu chốt có liên kích), 1 tuyệt kỹ, 3 bị động. Mở theo cảnh giới (Phàm Nhân, Trúc Cơ, Kim Đan, Nguyên Anh, Hóa Thần, Luyện Hư; Linh giới mở hết). Tự dùng hết trong trận. Cấp 1-10 (tuyệt kỹ 1-5), nâng bằng **ngộ đạo điểm ◈**: đột phá +5, nấc nhỏ +1, trùm tháp +2 (Tháp chủ +10), tông môn +3, Bia ngộ đạo, kỳ ngộ (trước cho võ kỹ), ngọc giản ở Tụ Bảo Lâu và Tháp thương điếm. Có tùy chọn tự nâng.
- Thanh tài nguyên trong trận, đầy thì tự tung tuyệt kỹ: **Kiếm ý** 0-10 (nhát kiếm trúng +2, bạo kích +1), **Nộ huyết** 0-100 (bị đánh +6, đánh trúng +4), **Thần thức** 0-100 (mỗi lượt +6, mỗi chiêu +20).
- Cơ chế mới trong trận: phi kiếm chém theo, sát thương chuẩn (bỏ qua thủ, khiên), chiêu đốt máu, kết liễu, Choáng váng / Phá giáp / Loạn thần làm trạng thái liên kích (+40%), hỗn loạn (địch tự đánh mình), tiên tri (né chắc chắn mỗi 4 đòn), phân thần (tuyệt kỹ thêm 50% từ Hợp Thể), hồi chiêu, kháng choáng 2 lượt sau khi bị choáng. Quái vô hồn (cương thi, xương, khôi lỗi, trùng, nham thạch…) miễn khống chế tinh thần, chịu sát thương tinh thần -50%.
- Binh khí còn 3 loại: Kiếm, Quyền Sáo, Pháp Ấn. Đồ cũ: đao, thương thành kiếm; quạt thành pháp ấn. Đồ rơi 70% đúng loại của đạo đang đi. Tương khắc khi đấu bot: Kiếm > Tinh thần > Thể > Kiếm (±15%). Bot cũng theo 3 đạo.
- Lôi kiếp: Kiếm tu 25% chém tan bớt 20% một đợt; Thể tu có Kim Thân thì lôi kiếp -15%; Tinh thần lực đợt 9 +15%.
- Bản lưu cũ: võ kỹ đã học quy thành ngộ đạo điểm (3 mỗi chiêu) cộng tầng tâm pháp; đường cũ thì được chọn lại.
- Tranh vẽ tay của tác giả (repo `tutien`), nén WebP trong `assets/` (khoảng 600KB): nhân vật theo đạo (`heroes/`; đã bỏ hoạt ảnh vung kiếm vì trông không đẹp), 24 quái (`monsters/`), 24 biểu tượng kỹ năng (`skills/`). `js/art.js` chọn tranh quái theo tên, đổi màu nhẹ theo seed, ghi hướng gốc của từng tranh (`FACE`) để quái trong trận luôn nhìn về phía nhân vật; tranh người (ngươi, bot) giữ như ban đầu (bên trái không lật, bên phải lật). Lang Vương đã vẽ lại đủ thân (ảnh gốc bị cắt). Tranh riêng mới: Hỏa Vân Báo, Lôi Báo (cũng dùng cho quái tên Hổ, Báo), Cửu Vĩ Linh Hồ, Kim Giáp Thần Quy, Lôi Đình Kỳ Lân, Kim Sí Đại Bằng, Song Đầu Ưng (cũng dùng cho Lôi Ưng, Lưu Tinh Ưng), Thái Cổ Linh Phượng, Thiết Bối Hùng, Dã Trư Tinh, Thạch Cự Nhân, Độc Hạt, Thanh Vân Lộc Thần, Ma Long, Hải Yêu, Huyết Sa, Tinh Không Cự Kình, Tinh Thú, Hư Không Trùng, Dung Nham Thú, Mộng Yêu, Tàn Kiếm Khách, Thiên Binh, Huyết Nha Bức Vương, Tháp Linh Thông Thiên, Linh Tổ Tàn Hồn (47 tranh quái). Trong MON_RULES, mục bắt đầu bằng | là tranh dự phòng, chỉ dùng khi chưa có tranh riêng. Tranh linh thú (huy hiệu tròn, ảnh đại diện linh thú) không đưa vào game. `tools/gen-art.mjs` cập nhật danh sách cho art.js và sw.js; bản gộp một tệp nhúng tranh dạng data URI.

- Tranh nữ (vẽ bằng Nano Banana): `heroes/kiem_nu`, `heroes/phu_nu` (nền hồng tím, tách màu và khử ám), `heroes/meditate_nu` (nền xanh, hiện khi bế quan), `heroes/the_nu` (nền hồng tím, giữ lửa). Chưa có tranh nữ thì dùng tranh nam.

Mô phỏng 42 kiếp mỗi đạo (lịch trình Leo tháp, có rèn đồ):

| Đạo | Cảnh giới TB | Tầng tháp TB | Tuổi TB | Tới Kim Đan (tuổi trung vị) | Tới Độ Kiếp |
|---|---|---|---|---|---|
| Kiếm Tu | 5,55 | 569 | 760 | 93 | 8/42 |
| Thể Tu | 6,17 | 573 | 1203 | 103 | 8/42 |
| Tinh Thần Lực | 5,98 | 554 | 1079 | 87 | 10/42 |

### Đồ không phân cảnh giới (bản 4.1)
- Mọi món đồ luôn theo cảnh giới hiện tại của nhân vật (`syncGear`: nạp game, nhặt đồ, đột phá, phi thăng đều kéo chỉ số về cảnh giới hiện tại). Chỉ phẩm cấp, cường hóa, dòng thuộc tính, thần thông quyết định độ mạnh. Bỏ thăng cấp, linh hóa, phong ấn thần khí, áp chế đồ hạ giới.
- Tự mặc (mặc định bật): nhặt được món có lực chiến cao hơn là mặc ngay, cứ 3 năm xét lại cả túi. Bỏ ghim ô.
- Tự xử lý theo phẩm ngay khi nhặt (`opt.qRule`): mỗi phẩm Hạ, Trung, Thượng, Cực chọn Giữ / Bán / Phân giải (mặc định Hạ, Trung phân giải; Thượng, Cực giữ). Áp dụng cả cho món vừa bị thay ra. Đồ khóa, đồ Thần thoại luôn giữ.
- Túi trữ vật: 3 ô trang bị xếp cột trái, cột phải 3 ô trống để dành; bỏ hàng lọc, xếp đồ theo phẩm rồi lực chiến; lưới luôn hiện đủ số ô của túi.

## 7. Kỹ thuật

- HTML, CSS, JavaScript thuần (ES module), không cần build, không cần máy chủ.
- `js/core.js`: luật chơi và mô phỏng, không đụng DOM. `js/events.js`: kỳ ngộ. `js/data.js`: dữ liệu. `js/combat.js`: chiến đấu, võ kỹ. `js/items.js`: trang bị. `js/sprite.js`: nhân vật và yêu thú pixel. `js/ui.js`: giao diện. `js/rng.js`: RNG có seed.
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

## Giao diện cổ phong (bản 4.2)

- **HUD:**
  - Ảnh nửa người 74×92, viền màu theo bậc cảnh giới trong giới (r0–r4), có vầng sáng vàng khi tu vi viên mãn.
  - Dòng 1: tên và cảnh giới. Dòng 2: danh hiệu, tuổi (và tông môn), biểu tượng đạo lộ ⚔ / 🛡 / 👁.
  - Ba thanh mảnh, chữ số nằm trong thanh.
  - Một hàng chip: 💊 đan, 💎 linh thạch, 🗼 tầng tháp, ☠ sát khí, 📅 lịch trình.
- **Hàng tốc độ:** một thanh liền khối ⏸ 1×…16×. Chế độ hỏi là nút biểu tượng: 🔔 hỏi tất cả, 🛎 hỏi việc lớn, 🔕 tự quyết hết.
- **Nút việc làm:** Lịch luyện ghi tên vùng đang đi.
- **Thẻ kỳ ngộ:** dòng dẫn nhỏ, tiêu đề có gạch dưới, lựa chọn bo tròn có số.
- **Nhật ký:** biểu tượng đầu dòng theo loại.
  - ⚡ đột phá, ⚔ trận, ✦ kỳ ngộ, ☯ tâm pháp và kỹ năng, 🏅 danh hiệu, ◈ tài vật, ★ việc lớn, ✓ việc tốt, ✕ việc xấu.
- **Khung chung:** viền vàng mảnh (--frame) cho thẻ, nút, ô. Tiêu đề in đậm.

## Bốn việc làm, kỳ ngộ theo việc (bản 4.3)

- **Bỏ Bế quan và Kết giao.**
  - Còn 4 việc: ☯ Tu luyện, ⛰ Lịch luyện, ⚖ Mưu sinh, 🗼 Tháp.
  - Hàng tiện ích còn 4 nút: Hành trang, Lò rèn, Tụ Bảo, Thêm.
- **Tu luyện (gộp bế quan):**
  - Tu vi ×1,3 (`TU_MUL`), nhân thêm `closedMul` của thể chất và trang bị.
  - Củng cố căn cơ gấp 3 lần, xả sát khí 12/năm, dưỡng thương 9/năm.
  - Không khóa năm. Tu liền 10 năm (`P.tuStreak`) thì lần đột phá tới +15% và căn cơ vững hẳn.
- **Nhóm kỳ ngộ** (`e.pool`, bảng `POOL_OF` trong events.js):

  | Nhóm | Gặp khi | Số lượng | Tần suất |
  |---|---|---|---|
  | `tu` | chỉ khi Tu luyện | 15 (6 cái mới trong events5.js) | khoảng 9 năm một lần |
  | `lich` | chỉ khi Lịch luyện | 50 | khoảng 2 năm một lần |
  | `muu` | chỉ khi Mưu sinh | 22 | khoảng 3,5 năm một lần |
  | `doi` | mọi lúc (chuyện đời, cốt truyện một kiếp) | 63 | thưa một nửa khi Tu luyện và Tháp |

  - Lúc nhỏ chưa có việc (`lon_len`) thì gặp được mọi nhóm.
  - 6 kỳ ngộ tu luyện mới: Đốn ngộ, Linh khí triều dâng, Tẩu hỏa nhập ma, Kinh mạch tắc nghẽn, Thần thức xuất khiếu, Thiên địa dị tượng.
- **Địa hình** (`EVENT_TERRAIN`, `terrainOf(map)`): rừng, đầm, hỏa, hồn, hư không. Kỳ ngộ hợp địa hình vùng đang đi ra nhiều hơn ×2,5.
- **Gặp người:**
  - Mưu sinh: 35%/năm (đôi khi được bạn giúp). Lịch luyện: 12%/năm.
  - Kết bái, đạo lữ, song tu chuyển sang nhóm `doi`.
  - Tab Quan hệ, trợ chiến, hộ pháp giữ nguyên. Thông tin xem ở Thêm → Quan hệ, trợ chiến.
- **Thương thế thay Sinh lực:**
  - Sinh lực 0–100 vẫn tính ngầm, giao diện chỉ hiện mức (`woundLv`): Khỏe (≥80), Thương nhẹ (≥50), Trọng thương (≥25), Nguy kịch.
  - Hồi mỗi năm (`REGEN`): Tu luyện 9, Mưu sinh 5, Tháp 4, Lịch luyện 1,5.
  - Lịch luyện: trọng thương thì tự rút về vùng dễ. Nguy kịch mà hết đan thì tự về Tu luyện.
  - Nhật ký đổi "Sinh lực -N" thành "Bị thương".
- **Lịch trình mẫu:**
  - Leo tháp: tháp tới khi sát khí 60 → tu luyện 10 năm.
  - Tu đạo: tu 20 → lịch luyện tới khi sát khí 40 → tu 10.
  - Làm giàu: mưu sinh 20 → tu 10.
- **Bản lưu cũ:** đang bế quan thì chuyển sang Tu luyện, đang kết giao thì chuyển sang Mưu sinh. Bước lịch trình cũ được đổi theo.

## Gọn giao diện (bản 4.4)

- **HUD 4 dòng:**
  1. Tên và cảnh giới.
  2. Danh hiệu · tuổi · tông môn · đạo lộ.
  3. Tu vi và Thọ.
  4. Chip: thương thế, các cảnh báo, đan ("hết đan" màu đỏ), linh thạch, tháp, sát khí.
- **Dòng trạng thái:** chỉ hiện khi còn nhỏ, chưa nhập đạo, hoặc đang lui dưỡng thương.
- **Tab:** Nhật ký · Quan hệ · Thiên hạ · Bảng · Kiếp, chữ nhỏ hơn. Hàng lọc nhật ký có nền và bóng nên không đè chữ.
- **Thanh dưới:**
  - Tốc độ thấp hơn, nút ⏸/▶ vẽ bằng CSS.
  - Nút việc làm thấp hơn. Tháp ở tầng 0 không ghi tầng.
  - Tiện ích thành thanh điều hướng mỏng liền khối.
- **Điện thoại:** đầu trang bỏ tên game, chỉ còn năm · giới và nút ☰.
- **Khi có kỳ ngộ:** ẩn tab và nhật ký, HUD còn tên, cảnh giới và thanh tu vi. Thẻ kỳ ngộ chữ nhỏ hơn, nút thấp hơn.

## Rà soát tổng thể (bản 4.6)

- **Sót từ bản cũ:**
  - Nhập đạo không còn ghi "võ kỹ". Chữ bế quan, võ kỹ, sinh lực cũ đã đổi.
  - Danh hiệu Võ Học Tông Sư giờ tính theo việc mở đủ 8 kỹ năng đạo lộ.
  - Tự mặc đồ xét lại mỗi năm. Cảnh báo "có đồ mạnh hơn" chỉ hiện khi tắt tự mặc.
- **Thông báo:** một dải mỏng trên cùng, không che HUD.
- **Bảng phụ:**
  - Bỏ nút Đóng thừa.
  - Túi (cả 4 tab), Tụ Bảo Lâu, Lò rèn dùng lưới ô + popup cạnh ô (`popBox`, `placeItemPop`, `bindPop`).
  - Vùng lịch luyện mỗi vùng 2 dòng.
  - Giải thích dài gập lại (`details.more`).
- **Menu và cài đặt:**
  - Bỏ nút ☰. Mọi thứ vào nút Thêm, gồm Cài đặt và Hướng dẫn, bản lưu.
  - Mọi cài đặt (trang bị, đan và thương thế, kỹ năng và tháp, xem trận, giao diện) nằm ở Túi → Cài đặt.
- **Màn chính:**
  - Nhật ký 14px. Gộp các dòng ngắn liền nhau cùng tuổi, cùng loại.
  - Hàng chip luôn một hàng.
  - Tab Kiếp ghi các kiếp đã qua; sổ sưu tầm (danh hiệu, thể chất) gập lại bên dưới.
- **Quen người:** thêm cơ hội khi tu luyện trong tông môn (10%/năm) và khi leo tháp (6%/năm).

## Bản 5: Thiên mệnh, Túc địch, Cây Hồn lực (giai đoạn 1 của hướng "roguelite luân hồi")

- **Thiên mệnh** (`js/fate.js`, `DESTINIES`):
  - Lúc đầu thai bốc 3 lá (thêm 1 lá mỗi cấp "Nhìn thấu thiên cơ") và chọn 1.
  - Có 15 loại: theo cảnh giới (một số có hạn tuổi), Bảng Thiên Kiêu, tháp 200, khai tông, đạo lữ, 3 tri kỷ, hạ Túc địch, sống 400 tuổi, danh vọng 80, đồ Cực phẩm +5, phi thăng, nối duyên người quen kiếp trước.
  - Lá khó chỉ ra khi linh hồn từng đạt cảnh giới đủ cao (`need`).
  - Thiên mệnh đang theo làm kỳ ngộ liên quan ra nhiều hơn ×3 (`DESTINY_EV`); Thiên mệnh về quan hệ làm gặp người nhiều hơn ×2.
  - Hoàn thành thì có thông báo; Hồn lực được cộng khi kiếp kết thúc.
- **Túc địch** (`nemTick`, sự kiện `tuc_dich_1..3` trong events5):
  - Từ 10 tuổi (đã nhập đạo) chọn một linh hồn làm Túc địch. Ưu tiên kẻ thù kiếp trước, không thì người cùng lứa.
  - Gặp 3 lần: tranh cơ duyên (Luyện Khí), thù sâu thêm (Kim Đan hoặc sau 60 năm), quyết chiến (Nguyên Anh, sau 80 năm, hoặc khi đã sống 60% thọ).
  - Mỗi lần gặp hắn được nâng lên ngang cảnh giới của ngươi. Hắn không chết trước khi phân thắng bại.
  - Quyết chiến có thể mất mạng (25%). Thua mà sống thì 30 năm sau tái đấu; thua 2 lần thì hắn thắng hẳn kiếp đó.
  - Chết khi chưa hạ được thì hắn mang thù sang kiếp sau.
  - Hạ được: danh vọng +30, một món Cực phẩm, +30 Hồn lực (+50% với "Biết người biết ta").
- **Cây Hồn lực** (`PERKS`, `s.perks`): mua ở màn đầu thai, giữ mãi.
  - Tu luyện +10%/cấp, chiến đấu +8%/cấp, thọ +10%/cấp (mỗi loại 3 cấp).
  - Thêm lá Thiên mệnh, ngộ đạo điểm khi nhập đạo, Hồi Xuân Đan đầu kiếp, túi +4 ô, thắng Túc địch dễ hơn.
- **HUD:** chip 📜 Thiên mệnh và chip ⚔ Túc địch. Bấm vào mở bảng Thiên mệnh, Túc địch.
- **Mô phỏng 36 kiếp:** Túc địch gặp đủ 3 lần; quyết chiến thắng 13 kiếp, bị Túc địch giết 7 kiếp. Hồn lực trung bình mỗi kiếp tăng từ 67 lên 98.

## Bản 5.1: Chương mười năm, xem trước được/mất (giai đoạn 2)

- **Chương mười năm** (`CHAPTERS` trong fate.js, sự kiện `chuong`):
  - Từ 12 tuổi (đã nhập đạo), cứ hết 10 năm lại bốc 3 lá để chọn 1. Lá hợp Thiên mệnh hoặc đang có Túc địch được ưu tiên.
  - Mỗi lá gồm một việc làm cho cả chương và hiệu ứng (`fx` đi vào `traits()`).
  - Có 9 lá:
    - Bế tử quan: tu vi ×1,6, kỳ ngộ ×0,25, khóa việc; đủ 10 năm thì đột phá +15%.
    - Theo sư môn: ×1,25 tu vi, củng cố căn cơ.
    - Ẩn cư: thọ +4%, cả đời tối đa +12%.
    - Thám hiểm: vào vùng khó hơn một bậc, nhặt nguyên liệu nhiều hơn.
    - Du hiệp: kỳ ngộ ×2, có danh vọng.
    - Thương lộ: linh thạch ×1,8.
    - Kết giao: gặp người ×3, thân thiết ×1,5.
    - Leo tháp: tu vi trong tháp ×1,5.
    - Truy Túc địch: lần gặp tới đến ngay, mạnh hơn 10%.
  - Tự đổi việc là bỏ dở chương. Tử quan không đổi việc được, muốn ra sớm thì bấm chip Chương.
  - Đang chạy lịch trình tự động thì không có Chương. Có thể tắt trong Cài đặt.
  - Thẻ Chương là việc lớn nên được hỏi. "Tự quyết hết" chọn lá hợp việc đang làm.
- **Xem trước lựa chọn** (`choicePreview`):
  - Mỗi lựa chọn được chạy thử 6 lần trên bản sao, mỗi lần một hạt giống ngẫu nhiên khác (không lộ trước kết quả thật).
  - Hiện nhãn khi ít nhất một nửa số lần thấy thay đổi: tu vi, linh thạch, danh vọng, chỉ số, ngộ đạo, đồ, thân thiết hay kết thù, thọ, bị thương ~%, có thể chết.
- **Túc địch:**
  - Không còn lẫn vào kỳ ngộ ngẫu nhiên.
  - Tỉ lệ chết khi thua: tranh cơ duyên 2%, thù sâu 3%, quyết chiến 10%. Con số này còn được nhân thêm theo chênh lệch máu.
