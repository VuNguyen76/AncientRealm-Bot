# Ancient Realm - Master Bot v15.3 (Khắc Chế Đánh Thường Boss & Lọc Quái 0/1 HP)

## 🌟 Tính Năng Mới Đột Phá Trong Bản v15.3
1. **👑 Khắc Chế Triệt Để Tầm Đánh Thường Của Boss (Boss Basic Attack Danger Zone & Safe Kite Engine)**:
   - **Vấn đề cốt lõi**: Đòn đánh thường của Boss (Basic Attack Swings) không hiện vòng cảnh báo đỏ (`tele`/`boom`) nhưng gây sát thương cực kỳ đau đớn ở cự ly tiếp cận (`range ~64-80px + r ~28-35px`). Nhân vật đứng trong tầm này dễ bị Boss quạt tay tử trận.
   - **Bán kính đánh thường chuẩn xác**:
     `bossNormalAtkRange = (def.range || 64) + (mob.r || def.r || 28) + 15` (~105px - 135px).
   - **Ranged (Linh Mộc, Âm Dương, Sơn Thần)**:
     * **Vùng Nguy Hiểm Đánh Thường (`bossDangerZone`)**: `bossNormalAtkRange + 30px` (~140px - 170px).
     * **Cự Ly Thả Diều Vàng (`bossSafeKiteDist`)**: `Math.max(bossNormalAtkRange + 65, Math.round(baseRange * 0.82))` (~210px - 260px).
     * Khi Boss tiến sát vào vùng nguy hiểm, bot tự động vào trạng thái `KITE_BOSS`, lùi bước ngược hướng di chuyển của Boss tới cự ly vàng ngoài tầm với của Boss rồi lập tức trụ chân xả chiêu liên tục (DPS turret) mà Boss không thể chạm tới!
   - **Melee (Chiến Binh)**:
     * Đánh ở viền mép tiếp cận tối đa (`reach`), theo dõi thời gian vung tay của Boss.
     * Khi HP giảm xuống dưới 65%, bot chủ động lùi tạm thời ra ngoài bán kính đánh thường của Boss (`bossNormalAtkRange + 70px`) để cắn bình máu hồi phục an toàn trước khi quay lại giao tranh.
   - **Quái thường**: Giữ nguyên cơ chế khóa tầm `keep_range = 0.88` không lùi bừa bãi.

2. **☠️ Triệt Tiêu Hoàn Toàn Quái 0 Máu & 1 Máu (Dead Mob Blacklist & Fast Target-Drop)**:
   - **Hàm lọc `isMobAlive(m)`**: Loại bỏ triệt để mọi quái vật có `hp <= 1`, `st & 1` (cờ chết) hoặc `dead`.
   - **Bắt gói tin mạng `die` và `hit` kết liễu**: Ngay khi server phát sóng `{ k: 'die', t: id }`, bot hủy target ngay lập tức, giải phóng `window.GAME.lockId = 0` và gửi `{ t: 'tg', id: 0 }` tới server.
   - **Quét Snapshot `s.n` thời gian thực**: Mọi quái xuất hiện trong snapshot với `hp <= 1` hoặc `st & 1` được tự động gắn cờ chết và đưa vào **Dead Mob Blacklist 12s**.

3. **🎯 Khắc Phục Lỗi "Đi Ra Ngoài Tầm Đánh" Với Quái Thường (Keep-Range 0.88 Lock)**:
   - Áp dụng chuẩn công thức `reach = Math.round((baseRange + targetRadius) * 0.88)`. Melee chém liên hoàn 75-95px, Ranged xả chiêu 250-300px.

4. **💀 Tự Động Hồi Sinh & Quay Lại Bãi Cũ (Auto-Revive & Recovery State Machine)**:
   - Tử trận tự hồi sinh về Làng Phong Châu, tự ghé Dược Điếm mua máu/bán đồ rác nếu thiếu máu, tự động tìm đường qua các cổng bản đồ (`safeMapRoute`) quay lại bãi train.

5. **🧪 Smart Potion Engine 1200ms & 🛡️ Né Chiêu Đỏ Boss 2.5D**:
   - Nhịp uống máu chuẩn 1200ms không nghẽn gói, né chiêu Boss Circle/Ring/Cone/Line chuẩn phối cảnh 2.5D mặt đất.
