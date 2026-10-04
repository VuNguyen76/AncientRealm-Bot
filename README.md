# Ancient Realm - Master Bot v16.2 (Vua Nâng Cấp Kỹ Năng & Cường Hóa Trang Bị, Tự Động Săn Nguyên Liệu)

## 🌟 Đột Phá Toàn Diện Trong Bản v16.2.0 (Auto-Material & Auto-Upgrade Revolution)

### 1. 🌟 Hệ Thống Tự Động Cày Nguyên Liệu & Nâng Cấp Kỹ Năng (Auto-Skill Upgrade):
- **Tự động quét toàn bộ cây chiêu thức**:
  * Nhận diện các kỹ năng chưa đạt Bậc 3 tối đa (như *Thủy Kính* Bậc 2 $\rightarrow$ Bậc 3, hoặc các skill Bậc 1 $\rightarrow$ Bậc 2).
  * Kiểm tra chính xác số lượng nguyên liệu trong hành trang:
    - **Skill Bậc 2**: Cần 3 $\times$ Ngọc Trai (`m_ngoctrai`) $\rightarrow$ Tự động sang Đầm Dạ Trạch (`dam`) săn Giao Long Đỏ / Ngư Binh.
    - **Skill Bậc 3**: Cần 3 $\times$ Lông Đại Bàng (`m_longdaibang`) + 2 $\times$ Mảnh Đồng Cổ (`m_manhdong`) $\rightarrow$ Tự động sang Núi Kim Sơn (`kimson`) săn Đại Bàng Tinh và Chúa Chuột Kho Thóc.
  * Khi thu thập đủ nguyên liệu, bot tự động tìm đường về gặp Trainer gần nhất (Thầy Cúng Lão Mộc, Chử Đồng Tử, Tản Viên Sơn Thánh, Tướng Cao Lỗ, Thành Hoàng) và thực hiện nâng cấp kỹ năng!

---

### 2. ⚒️ Hệ Thống Tự Động Cày Nguyên Liệu & Cường Hóa Trang Bị (Auto-Gear Enhance):
- **Tự động quét toàn bộ trang bị đang mặc (Vũ khí, Áo, Mũ, Choàng, Nhẫn)**:
  * Cho phép người chơi chọn mốc cường hóa mong muốn (`+3`, `+5`, `+7`).
  * Phân tích cấp độ vật phẩm và xác định chính xác Tier nguyên liệu cần dùng:
    - **Tier 5 (Lv 40-45, e.g. Vũ khí Phù Trượng)**: Cần Xương Âm Binh (`m_xuongam`) $\rightarrow$ Tự động sang Đầm Hát Môn (`hatmon`) săn Âm Binh.
    - **Tier 6 (Lv 46+, e.g. Áo Gấm, Mũ Trụ, Choàng Cờ Lau, Nhẫn Tràng An)**: Cần Đuôi Chuột Yểm (`m_duoichuot`) $\rightarrow$ Tự động sang Thành Đại La (`daila`) săn Chuột Yểm.
  * Tự động gom đủ số lượng nguyên liệu, sau đó điều hướng nhân vật tới Thợ Rèn (Thợ Rèn Đông Sơn ở Làng Phong Châu, Thợ Đúc ở Cổ Loa, Lò Rèn Kinh Thành ở Thăng Long) và tiến hành cường hóa trang bị an toàn!

---

### 3. 🌾 Menu Săn Nhanh Nguyên Liệu Toàn Cõi (Quick Mat Farm):
- Cho phép người chơi tự do chọn bất kỳ loại nguyên liệu nào trong danh mục:
  * 🪶 **Lông Đại Bàng** (`kimson`)
  * 🥉 **Mảnh Đồng Cổ** (`kimson`)
  * ⚪ **Ngọc Trai** (`dam`)
  * 🦴 **Xương Âm Binh** (`hatmon`)
  * 🧧 **Bùa Yểm Cao Biền** (`hatmon`)
  * 🐀 **Đuôi Chuột Yểm** (`daila`)
  * 🛡️ **Mảnh Giáp Âm Tướng** (`daila`)
  * 🐗 **Nanh Heo Rừng** (`bavi`)
  * 🐆 **Da Báo Gấm** (`bavi`)
  * 📜 **Bùa Vàng Trấn Thi** (`hoangtuyen`)
  * ⛓️ **Xích Ngục Âm Phủ** (`hoangtuyen`)
  * 🧧 **Bùa Hộ Rèn** (Boss Thế Giới)
- Bot lập tức nhảy cổng sang đúng bản đồ, chạy tới đúng tọa độ bãi spawn và tập trung farm quái rơi nguyên liệu đó!

---

### 4. 🛡️ Khắc Phục Triệt Để Lỗi Kẹt Nhiệm Vụ Sông Bạch Đằng (`s7_mada`):
- **Cơ chế phát hiện thiếu vật phẩm nhiệm vụ**:
  * Phát hiện trường hợp người chơi lỡ tay vứt bỏ Đèn Trôi Sông (`q_dentroi`) khiến không thể thả đèn ở bến sông.
  * Tự động nhận diện bước `use` bị thiếu vật phẩm và **bỏ qua nhiệm vụ này**, chuyển sang làm ngay các nhiệm vụ tiếp theo (như 12 Sứ Quân, Diệt quái, Chính tuyến) mà không bị kẹt lặp vòng vô tận ở bờ sông Bạch Đằng!
  * Bổ sung nút **[⏭️ Bỏ Qua Q]** trực tiếp trên bảng điều khiển để người chơi có thể chủ động bỏ qua bất kỳ nhiệm vụ nào mình muốn!

---

### 5. 💎 Bảo Vệ Tuyệt Đối 100% Nguyên Liệu Nâng Cấp (`PROTECTED_UPGRADE_MATS`):
- Sửa triệt để lỗi `sellMats` trước đây khiến bot bán nhầm các nguyên liệu quý. Toàn bộ 16 loại nguyên liệu nâng cấp kỹ năng và cường hóa trang bị hiện nay được bảo vệ vĩnh viễn, không bao giờ bị bán nhầm tại Tiệm Thuốc!

---

### 6. 📦 Tải Về & Cài Đặt:
- **Android APK**: `AncientRealm_Auto_v16_2.apk`
- **Tampermonkey Userscript**: `AncientRealm_Master_Bot_v16_2.user.js`
- **Chrome Extension**: `AncientRealm_Bot_Plugin_v16_2.zip`
