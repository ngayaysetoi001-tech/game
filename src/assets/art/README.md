# Ảnh thay thế cho hình vẽ bằng code

Đặt ảnh (`.webp`, `.png`, `.jpg` hoặc `.svg`, nền trong suốt nếu là nhân vật/quái) vào đúng thư mục
và đúng tên dưới đây. Game sẽ tự dùng ảnh thay cho hình vẽ bằng code; thiếu file nào thì vẫn dùng hình vẽ.

| Thư mục | Tên file | Ví dụ |
|---|---|---|
| `monsters/` | tên quái, bỏ dấu, nối bằng `-` | `lang-vuong.webp`, `huyet-mang-vuong.webp` |
| `cultivator/` | `<huong-tu>-<tu-the>` với hướng tu `none`/`kiem`/`the`/`phap`, tư thế `sit`/`stand` | `kiem-stand.webp` |
| `scenes/` | `dong-phu`, `be-quan`, hoặc tên khu bí cảnh bỏ dấu | `hac-phong-lam.webp` |
| `items/` | `<o>-<pham>` với ô `weapon`/`armor`/`pendant`, phẩm `0`–`3` | `weapon-3.webp` |
| `pills/` | `tuKhi`, `phaCanh`, `hoiXuan` | `phaCanh.webp` |

Gợi ý kích thước: quái/nhân vật 512×512, bối cảnh 1200×720, biểu tượng 128×128.
