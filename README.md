# Ancient Realm - Master Bot v15.6 (Đếm Chuẩn Bình Máu & Nạp Đủ 100 Bình Máu, Triệt Tiêu Quái 0/1 Máu & Role Lock)

## 🌟 Tính Năng Mới Trong Bản v15.6.0
1. **🧪 Khắc Phục Triệt Để Lỗi Mua Bình Máu Dừng Ở 20 Bình (Đếm Chính Xác Túi Đồ)**:
   - Sửa tận gốc nguyên nhân bot dừng mua sớm ở ~20 bình: Loại bỏ công thức cộng dồn sai lệch, thay bằng thuật toán đếm thực tế `currentPotions = inspectInventory().hpPotionCount` trên từng khung hình.
   - Tính toán lượng bình máu thực tế còn thiếu (`stillNeeded = targetPotions - currentPotions`). Bot tiếp tục nạp liên tục cho đến khi túi đồ thực sự đạt đủ số lượng mục tiêu (mặc định 100 bình).
   - Bổ sung ô nhập mục tiêu số bình máu (`#sm-potions-target`) trên Bot Panel, cho phép tự do thiết lập từ 10 - 300 bình tùy nhu cầu.
   - Hiển thị trực quan theo thời gian thực trên giao diện: `Trong túi: X/100 bình`.
   - Đồng thời đồng bộ và khắc phục thuật toán trong cả `coviet-extension` (`src/trade.js`, `src/potion.js`, `data/config.default.json`, `ui/index.html`).

2. **🚫 Triệt Tiêu Hoàn Toàn Lỗi Đánh Quái 0 Máu & 1 Máu (`isMobValidAndAlive`)**:
   - Tự động bỏ qua và giải phóng mục tiêu ngay khi quái có `hp <= 1` hoặc mang cờ `st & 1` (ST.DEAD).
   - Bắt gói tin `ev.k === 'die'` từ server để xóa khóa mục tiêu (`tg = 0`) ngay trong 0ms.
   - Quét snapshot `s.n` để nhận diện quái chết sớm, tuyệt đối không bao giờ đánh quái bóng ma hay hoạt ảnh chết.

3. **⚔️/🏹 Chuẩn Hóa Nhận Diện Môn Phái & Role Đánh Gần / Đánh Xa**:
   - Bắt gói tin `welcome` và `self` từ máy chủ để nhận diện chính xác môn phái:
     * **Thiên Vương Phủ** (range 95) -> Đánh gần (Melee)
     * **Long Tuyền Môn** (range 85) -> Đánh gần (Melee)
     * **Linh Mộc Đường** (range 260) -> Đánh xa (Ranged)
     * **Âm Dương Tông** (range 280) -> Đánh xa (Ranged)
     * **Sơn Thần Giáo** (range 320) -> Đánh xa (Ranged)
   - Mặc định khi chưa rõ môn phái là **Long Tuyền Môn (85px)**, triệt tiêu lỗi ngộ nhận cận chiến thành đánh xa.
   - Thêm nút bấm 1 chạm trực tiếp trên Mobile Mini HUD: chạm vào huy hiệu Role để đổi vòng tròn giữa: `⚔️ Gần` ↔ `🏹 Xa` ↔ `⚙️ Auto`.

4. **🎯 Khôi Phục Chuẩn Di Chuyển v15.1 Theo CoViet (`coviet-extension` standard)**:
   - Khi `d <= reach`: Dừng bước ngay lập tức (`stopMoving`), trụ chân xả combo đòn đánh và kỹ năng mà không chạy lang thang ra ngoài.
   - Khi `d > reach`: Tiếp cận thẳng vào bãi quái để vào cự ly chuẩn.
   - Tỉ lệ `reach`: Cận chiến hệ số 0.85 (~93px), Đánh xa hệ số 0.88 (~267px).
