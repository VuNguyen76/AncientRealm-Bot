# Ancient Realm - Master Bot v15.2 (Lọc Quái 0/1 Máu & Khóa Tầm Đánh Chuẩn Xác)

## 🌟 Tính Năng Mới Trong Bản v15.2
1. **☠️ Triệt Tiêu Hoàn Toàn Quái 0 Máu & 1 Máu (Dead Mob Blacklist & Fast Target-Drop)**:
   - **Hàm lọc `isMobAlive(m)`**: Loại bỏ triệt để mọi quái vật có `hp <= 1`, `st & 1` (cờ chết) hoặc `dead`. Bot không bao giờ target hoặc đuổi theo xác chết/quái đang chờ biến mất.
   - **Bắt gói tin mạng `die` và `hit` kết liễu**: Ngay khi server phát sóng sự kiện `{ k: 'die', t: id }`, bot hủy target ngay lập tức, giải phóng `window.GAME.lockId = 0` và gửi `{ t: 'tg', id: 0 }` tới server mà không chờ trễ 1 khung hình.
   - **Quét Snapshot `s.n` thời gian thực**: Mọi quái xuất hiện trong snapshot với `hp <= 1` hoặc `st & 1` được tự động gắn cờ chết và đưa vào **Dead Mob Blacklist 12s**.
   - **Cưỡng chế giải phóng `lockId` của Game Client**: Nếu client game tự ý khóa vào một quái chết hoặc $le 1$ máu, bot lập tức un-lock và bẻ lái tìm quái sống khác.

2. **🎯 Khắc Phục Triệt Để Lỗi "Đi Ra Ngoài Tầm Đánh" (Keep-Range 0.88 Lock)**:
   - Chuẩn hóa thuật toán cự ly chiến đấu học từ `coviet-extension`:
     `reach = Math.round((baseRange + targetRadius) * 0.88)`
   - **Melee (Chiến Binh, Cận chiến)**: Đứng vững chắc tại 75px - 95px, dừng bước (`stopMoving`), chém liên hoàn và tung kỹ năng liên tục.
   - **Ranged (Linh Mộc, Âm Dương, Sơn Thần)**: Đứng xả chiêu từ cự ly vàng 250px - 300px, chuyển sang chế độ pháo đài cố định (DPS turret) diệt quái nhanh gấp 5 lần thay vì chạy lùi ngắt quãng.
   - **Loại bỏ cờ `isPeeling` và `isPinnedAgainstWall` giả lập**: Triệt tiêu hoàn toàn hiện tượng "vừa áp sát quái đã tự ý quay đầu bỏ chạy ra ngoài tầm đánh".
   - **Mở khóa toàn bộ chiêu thức có Cast-Time**: Không còn bị bộ lọc `isSafeForCastTime` chặn thi triển khi quái đứng cạnh.

3. **💀 Tự Động Hồi Sinh & Quay Lại Bãi Cũ (Auto-Revive & Recovery State Machine)**:
   - Khi nhân vật tử trận (`hp <= 0` hoặc `st & 1`): Ngắt toàn bộ di chuyển/tấn công ngay lập tức để bảo vệ dữ liệu.
   - Tự động kích hoạt nút hồi sinh về Làng Phong Châu (`lang`).
   - Kiểm tra túi máu: Nếu lượng bình máu thấp dưới ngưỡng an toàn, tự động ghé Dược Điếm mua bổ sung đủ bình máu và bán đồ rác.
   - Tự động định tuyến qua các cổng bản đồ (`safeMapRoute`) quay trở lại đúng tọa độ và mục tiêu quái ban đầu mà không cần người chơi can thiệp!

4. **🧪 Smart Potion Engine 1200ms (Học từ `potion.js` của CoViet)**:
   - Cố định nhịp uống theo đúng chu kỳ server (`1200ms`), chấm dứt triệt để lỗi spam nghẽn mạng làm rơi gói tin.
   - Tự động quét tìm ô bình máu tối ưu nhất trong túi đồ (`p_hp3`, `p_hp2`, `p_hp1`,...).
   - Hỗ trợ cơ chế dự phòng kép: Gọi `quickUse('heal')` kết hợp bắn trực tiếp gói tin mạng `{ t: 'use', n: slotIndex }`.

5. **🛡️ Né Vùng Chiêu Đỏ Boss Đa Hình Học (Học từ `dodge.js` của CoViet)**:
   - Bắt trọn gói tin cảnh báo sớm (`tele`) và nổ tồn lưu (`boom`) của Boss.
   - Nhận diện toàn bộ các hình dạng kỹ năng theo phối cảnh 2.5D mặt đất (`GROUND_K = 0.55`): Circle, Ring (an toàn trong lõi), Cone, Line.

6. **📱 Mobile Mini HUD & Bộ Phím Tắt 1 Chạm (Quick Actions)**:
   - Bảng Mini HUD siêu gọn, bo tròn sang trọng, hỗ trợ kéo thả tự do trên mobile.
   - Hiển thị telemetry thời gian thực: % Máu, Số bình máu, Vàng, Role.
   - Phím 1 chạm: `⚡ Mua Máu`, `📦 Cất Kho`, `📜 Làm Q`, `📂 Panel`.
