# Ancient Realm - Master Bot v15.9 (Khắc Phục Over Tầm, Quét Sạch Quái 0 Máu, Chuyên Trị Boss & Kiting Đỉnh Cao)

## 🌟 Cải Tiến Đột Phá Trong Bản v15.9.0

### 1. 🎯 Khắc Phục Triệt Để Hiện Tượng "Quái Over Tầm":
- **Xóa bỏ hoàn toàn "Dead Zone" (Vùng Chết)**: Trong các phiên bản trước, ngưỡng tiếp cận `approachTrigger` lớn hơn tầm với đòn đánh tối đa (`maxReach`), khiến nhân vật rơi vào trạng thái `STAND` khi đứng cách quái 305-313px — không thể tiếp cận và cũng không thể xuất chiêu!
- **Tích hợp bán kính quái `targetRadius` vào toàn bộ công thức di chuyển**:
  * **Đánh xa (Ranged)**: `approachTrigger = Math.round(actualMaxReach * 0.94)` (luôn nhỏ hơn `actualMaxReach`). Khi dừng chân (`STAND`), nhân vật LUÔN LUÔN nằm trọn vẹn trong tầm xuất chiêu!
  * **Đánh gần (Melee)**: `approachTrigger = actualMaxReach - 8`, áp sát chém liên hoàn `75-85px`, cắm chốt gây sát thương tối đa.
- **Giới hạn khoảng cách bám mục tiêu (Target Leash)**: Không bao giờ đuổi theo quái ra quá `380px` (đối với quái thường) hoặc `550px` (đối với Boss), tránh chạy rông khắp bản đồ.

---

### 2. 👻 Quét Sạch 100% Quái 0 Máu Và 1 Máu:
- **Bộ lọc nghiêm ngặt**: Loại bỏ hoàn toàn `m.hp <= 1 || m.dead || (m.st & 1)` ở mọi khâu tìm kiếm và chọn mục tiêu.
- **Giải phóng mục tiêu 0 độ trễ (Zero-Latency Target Release)**: Ngay khi quái nhận sự kiện `die` hoặc snapshot báo máu $le 1$, bot lập tức gán `currentTargetId = null`, xóa `lockId = 0` và truyền gói tin `{ t: 'tg', id: 0 }` lên server.
- **Dọn dẹp quái biến mất khỏi Snapshot**: Quét và dọn sạch các thực thể không còn nằm trong danh sách `s.n` của server.

---

### 3. 👑 Cơ Chế Chuyên Trị Boss & Thả Diều Đỉnh Cao (Boss Anti-Wipe Engine):
- **Tính toán Hitbox khổng lồ của Boss (`r = 66+` như Nghê Chúa)**: Boss sở hữu sải tay chém cận chiến 130px và chiêu nhảy đè / quét đuôi 160-180px.
- **Giữ cự ly vàng tuyệt đối cho Đánh Xa**:
  * Duy trì cự ly `242px - 325px` so với tâm Boss (khoảng cách mép $> 158px$, Boss hoàn toàn không với tới).
  * Nếu Boss áp sát $< 242px$: Tự động lùi thả diều (`RETREAT`) mở rộng khoảng cách về `298px`.
- **Dọn sạch đệ tử của Boss (Minion Purge)**: Khi Boss triệu hồi từ 2 đệ tử trở lên bu sát trong $200px$, bot tự động chuyển mục tiêu dọn sạch đệ tử trước để giải tỏa sát thương, chống bị quây chết.
- **Né chiêu đỏ thời gian thực (Non-Blocking Hazard Dodge)**: Tự động phát hiện vòng tròn, quạt lửa, tia sấm và lách sang điểm an toàn không bị vật cản.

---

### 4. 📦 Tải Về & Cài Đặt:
- **Android APK**: `AncientRealm_Auto_v15_9.apk`
- **Tampermonkey Userscript**: `AncientRealm_Master_Bot_v15_9.user.js`
- **Chrome Extension**: `AncientRealm_Bot_Plugin_v15_9.zip`
