# Ancient Realm - Master Bot v15.5 (Triệt Tiêu Quái 0/1 Máu, Chuẩn Hóa Role & Khôi Phục Di Chuyển v15.1)

## 🌟 Tính Năng Mới Trong Bản v15.5.0
1. **🚫 Triệt Tiêu Hoàn Toàn Lỗi Đánh Quái 0 Máu & 1 Máu (`isMobValidAndAlive`)**:
   - Tự động bỏ qua và giải phóng mục tiêu ngay khi quái có `hp <= 1` hoặc mang cờ `st & 1` (ST.DEAD).
   - Bắt gói tin `ev.k === 'die'` từ server để xóa khóa mục tiêu (`tg = 0`) ngay trong 0ms.
   - Quét snapshot `s.n` để nhận diện quái chết sớm, tuyệt đối không bao giờ đánh quái bóng ma hay hoạt ảnh chết.

2. **⚔️/🏹 Chuẩn Hóa Nhận Diện Môn Phái & Role Đánh Gần / Đánh Xa**:
   - Bắt gói tin `welcome` và `self` từ máy chủ để nhận diện chính xác môn phái:
     * **Thiên Vương Phủ** (range 95) -> Đánh gần (Melee)
     * **Long Tuyền Môn** (range 85) -> Đánh gần (Melee)
     * **Linh Mộc Đường** (range 260) -> Đánh xa (Ranged)
     * **Âm Dương Tông** (range 280) -> Đánh xa (Ranged)
     * **Sơn Thần Giáo** (range 320) -> Đánh xa (Ranged)
   - Mặc định khi chưa rõ môn phái là **Long Tuyền Môn (85px)**, triệt tiêu lỗi ngộ nhận cận chiến thành đánh xa.
   - Thêm nút bấm 1 chạm trực tiếp trên Mobile Mini HUD: chạm vào huy hiệu Role để đổi vòng tròn giữa: `⚔️ Gần` ↔ `🏹 Xa` ↔ `⚙️ Auto`.

3. **🎯 Khôi Phục Chuẩn Di Chuyển v15.1 Theo CoViet (`coviet-extension` standard)**:
   - Khi `d <= reach`: Dừng bước ngay lập tức (`stopMoving`), trụ chân xả combo đòn đánh và kỹ năng mà không chạy lang thang ra ngoài.
   - Khi `d > reach`: Tiếp cận thẳng vào bãi quái để vào cự ly chuẩn.
   - Tỉ lệ `reach`: Cận chiến hệ số 0.85 (~93px), Đánh xa hệ số 0.88 (~267px).

4. **🔄 Tự Động Hồi Sinh & Quay Lại Bãi Cũ (Auto-Revive & Recovery)**:
   - Tự hồi sinh về Làng Phong Châu, nạp máu và trở lại bãi farm tự động.

5. **🧪 Smart Potion Engine 1200ms & Né Chiêu Boss 2.5D**:
   - Nhịp uống máu server 1200ms chống drop packet, né vùng chiêu đỏ Boss đa hình học.
