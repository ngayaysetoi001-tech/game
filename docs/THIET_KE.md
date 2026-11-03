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

| Cảnh giới | Tu vi cần | Thọ gốc | Đột phá lên kế tiếp |
|---|---|---|---|
| Phàm Nhân | 60 | 60 | 90% |
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
- Sinh lực dưới 40% ở vùng Khó trở lên: nếu bật "tự lui" thì về Hắc Phong Lĩnh; nếu tắt thì game dừng lại cảnh báo một lần.
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
