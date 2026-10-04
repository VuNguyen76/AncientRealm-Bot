# Ancient Realm - Master Bot v16.1 (Vua Làm Nhiệm Vụ & Quét Quái Toàn Năng, Auto-Quest Engine Master)

## 🌟 Đột Phá Toàn Diện Trong Bản v16.1.0 (Auto-Quest & Mob Scanning Revolution)

### 1. ⚔️ Khắc Phục Triệt Để 100% Lỗi Quét Quái Rơi Đồ (`mobsDroppingItem`):
- **Phân tích chuẩn xác cấu trúc Loot Table của Server**:
  * Chuyển đổi hoàn toàn sang bóc tách `GD.loot.tables` và mảng `drops: [{ item, p, quest }]`.
  * Hỗ trợ chuẩn xác 100% tất cả hơn 35 nhiệm vụ thu thập vật phẩm (`collect`) như Nanh Heo Rừng (`q_nanhlon`), Vây Cá Lóc (`q_vaycaloc`), Vảy Giao Long (`q_vaygiaolong`), Hàng Chợ Đêm (`q_hangcho`), v.v.
  * Bot tự động nhận diện đúng bầy quái chứa bảng loot rớt vật phẩm nhiệm vụ và ưu tiên nhặt đồ rơi của nhiệm vụ ngay khi rớt xuống đất!

---

### 2. 🛡️ Hỗ Trợ Trọn Vẹn Tất Cả Các Dạng Nhiệm Vụ Khó (`defend`, `use`, `distinct`, `nodes`):
- **Nhiệm vụ Giữ Trận / Thủ Thành (`defend`)**:
  * Tự động tới gặp NPC (Lê Chân, Thần Long Đỗ...) để kích hoạt trận chiến.
  * Giữ vững vị trí trong vòng tròn an toàn (`step.r`), tự động kích hoạt chế độ diệt âm binh theo từng đợt sóng (`step.waves`).
- **Nhiệm vụ Dùng Vật Phẩm Tại Điểm (`use`)**:
  * Tự động điều hướng tuần tự qua các tọa độ chỉ định (`q.pts`) như thả Đèn Trôi Sông (`s7_mada`), Nhổ Cọc Long Đỗ (`ch9_step11`) và gửi gói tin `{ t: 'qu' }` chuẩn xác.
- **Nhiệm vụ Tướng Luân Phiên (`distinct: true`)**:
  * Tự động lọc bỏ các tướng đã đánh bại (`q.got`), chỉ săn các tướng cờ yểm còn lại (`s8_12coyem`).
- **Nhiệm vụ Hái Lượm / Thu Thập Tài Nguyên (`gatherNodes` & `chests`)**:
  * Quét vị trí cây thuốc, bụi hoa nhuộm (`q_hoanhuom`), bông lau (`q_bonglau`), rương yêu (`chest`) từ `window.GAME.gather` và tự động hái lượm.

---

### 3. 🧭 Cơ Chế Tuần Tra Đổi Bãi Thông Minh (CoViet Anchor Rotation):
- **Chấm dứt hoàn toàn tình trạng kẹt bãi rỗng**:
  * Nếu bãi quái hiện tại không có quái sinh trong vòng $> 6.5$ giây, bot sẽ tự động tuần tra chuyển sang bãi spawn tiếp theo của loài quái đó trên bản đồ.
  * Ngay khi phát hiện quái mục tiêu xuất hiện, bot lập tức khóa mục tiêu và tiêu diệt ngay.

---

### 4. 🎯 Khắc Phục Hiện Tượng Giật Cục / Thrashing Mục Tiêu:
- Khi đang di chuyển tới bãi quái quest, bot duy trì sự tập trung tuyệt đối vào quái nhiệm vụ, chỉ đánh trả quái khác khi chúng chủ động áp sát tấn công mình.

---

### 5. 📦 Tải Về & Cài Đặt:
- **Android APK**: `AncientRealm_Auto_v16_1.apk`
- **Tampermonkey Userscript**: `AncientRealm_Master_Bot_v16_1.user.js`
- **Chrome Extension**: `AncientRealm_Bot_Plugin_v16_1.zip`
