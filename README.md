# Ancient Realm - Master Bot v16.0 (Vua Né Chiêu Boss & Triệt Tiêu Góc Chết, Chống Kẹt Địa Hình Đỉnh Cao)

## 🌟 Cải Tiến Đột Phá Trong Bản v16.0.0 (King of Dodging & Pathing)

### 1. 🛡️ Triệt Tiêu Hoàn Toàn "Góc Chết" Khi Né Chiêu Boss (Dead-Corner Elimination):
- **Phát hiện và xử lý chuẩn xác 3 hình học Collider của Server**:
  * Tròn (`t: 'c'`): Cây cối, tảng đá.
  * Hộp chữ nhật (`t: 'b'`): Hàng rào, tường thành, bờ dậu nhà.
  * Elip (`t: 'e'`): Bờ hồ nước, ao sen.
- **Sửa triệt để bug `c[0]` gây `NaN`**: Khôi phục 100% lực đẩy từ vật cản tĩnh (`Obstacle Repulsion`), giải quyết tận gốc nguyên nhân khiến bot đứng im chôn chân trước gốc cây hoặc vách đá.
- **Thuật toán quét 8 hướng loại bỏ góc kẹt (`countBlockedDirections`)**:
  * Thử nghiệm 8 hướng tỏa ra 70px xung quanh điểm né dự kiến. Nếu có $\ge 3$ hướng bị chặn bởi vật cản hoặc mép bản đồ $\rightarrow$ **LOẠI BỎ NGAY LẬP TỨC VÌ ĐÓ LÀ GÓC CHẾT / HẺM CỤT**!
  * Tuyệt đối không bao giờ chui vào ngõ cụt, góc tường hay khe giữa hai gốc cây để bị Boss ép góc xả combo.
- **Tia quét kiểm tra trực tiếp (`isPathClear`)**: Đảm bảo từ vị trí hiện tại đến điểm an toàn có đường đi thẳng thông thoáng 100% không cắt góc qua bất kỳ vật cản nào.

---

### 2. ⚡ Quyền Ưu Tiên Tuyệt Đối Khi Né Chiêu (Absolute Priority Hazard Dodge):
- **Học tập trực tiếp kiến trúc CoViet (`dodge.js` & `move.js` override)**:
  * Khi đứng trong vùng cảnh báo đỏ của Boss (`circle`, `ring`, `cone`, `line`), bot lập tức gán trạng thái né chiêu với quyền ưu tiên cao nhất.
  * **Chống ngắt quãng do mất mục tiêu**: Khắc phục lỗi khi Boss bay/nhảy khiến target tạm mất làm gọi `stopMoving()` giữa chừng. Bot kiên quyết chạy thoát ra điểm an toàn cho đến khi hoàn toàn rời khỏi vùng nguy hiểm.
  * Duy trì xả chiêu từ xa trong lúc lùi né, đảm bảo DPS không bị gián đoạn.

---

### 3. 🏃 Động Cơ Thả Diều 16 Tia 360 Độ Kháng Vật Cản & Rìa Map:
- **Lực đẩy vật cản tĩnh + mép bản đồ (`World Boundaries Repulsion`)**: Khi lùi cách rìa map $< 120px$ hoặc gần cây $< 95px$, lực đẩy ngược ra bãi trống tự động tăng vọt.
- **16 tia Conga-Line**: Quét trọn vẹn 360 độ, phạt 600 điểm nếu tia hướng vào ngõ cụt và cộng 100 điểm cho các bãi đất trống cực thoáng.

---

### 4. 🎯 Kế Thừa Trọn Vẹn Tính Năng v15.9:
- Xóa bỏ triệt để hiện tượng quái over tầm (Dead Zone elimination với `targetRadius`).
- Quét sạch 100% quái 0 máu / 1 máu, giải phóng target tức thì với `{ t: 'tg', id: 0 }`.
- Cơ chế chuyên trị Boss với kiting cự ly vàng ngoài tầm chém 130px và dọn dẹp đệ tử.

---

### 5. 📦 Tải Về & Cài Đặt:
- **Android APK**: `AncientRealm_Auto_v16_0.apk`
- **Tampermonkey Userscript**: `AncientRealm_Master_Bot_v16_0.user.js`
- **Chrome Extension**: `AncientRealm_Bot_Plugin_v16_0.zip`
