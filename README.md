# Ancient Realm - Master Bot v15.0 (Bản Nâng Cấp Toàn Diện: Tự Hồi Sinh, Smart Potion & Né Chiêu Boss)

## 🌟 Tính Năng Mới Trong Bản v15.0
1. **💀 Tự Động Hồi Sinh & Quay Lại Bãi Cũ (Auto-Revive & Recovery State Machine)**:
   - Khi nhân vật tử trận (`hp <= 0` hoặc `st & 1`): Ngắt toàn bộ di chuyển/tấn công ngay lập tức để bảo vệ dữ liệu.
   - Tự động kích hoạt nút hồi sinh về Làng Phong Châu (`lang`).
   - Kiểm tra túi máu: Nếu lượng bình máu thấp dưới ngưỡng an toàn, tự động ghé Dược Điếm mua bổ sung đủ bình máu và bán đồ rác.
   - Tự động định tuyến qua các cổng bản đồ (`safeMapRoute`) quay trở lại đúng tọa độ và mục tiêu quái ban đầu mà không cần người chơi can thiệp!

2. **🧪 Smart Potion Engine 1200ms (Học từ `potion.js` của CoViet)**:
   - Cố định nhịp uống theo đúng chu kỳ server (`1200ms`), chấm dứt triệt để lỗi spam nghẽn mạng làm rơi gói tin.
   - Tự động quét tìm ô bình máu tối ưu nhất trong túi đồ (`p_hp3`, `p_hp2`, `p_hp1`,...).
   - Hỗ trợ cơ chế dự phòng kép: Gọi `quickUse('heal')` kết hợp bắn trực tiếp gói tin mạng `{ t: 'use', n: slotIndex }`.

3. **🛡️ Né Vùng Chiêu Đỏ Boss Đa Hình Học (Học từ `dodge.js` của CoViet)**:
   - Bắt trọn gói tin cảnh báo sớm (`tele`) và nổ tồn lưu (`boom`) của Boss.
   - Nhận diện toàn bộ các hình dạng kỹ năng theo phối cảnh 2.5D mặt đất (`GROUND_K = 0.55`):
     * **Hình tròn (circle)**: Lùi ra khỏi bán kính nguy hiểm kèm khoảng đệm an toàn (`pad = 37px`).
     * **Vòng khuyên (ring)**: Tính toán chính xác lỗ an toàn (`d < r0 - pad`) - đứng trong tâm an toàn không cần chạy xa.
     * **Hình nón / quạt (cone)**: Tính góc quét `arc` và `ang`, né sang hai bên sườn.
     * **Đường thẳng / tia chớp (line)**: Né vuông góc khỏi chiều rộng `w` và độ dài `len`.
   - Tìm kiếm điểm an toàn đa hướng 360 độ kết hợp tránh lao vào vùng nổ khi đang hút đồ (`autoLoot`).

4. **📱 Mobile Mini HUD & Bộ Phím Tắt 1 Chạm (Quick Actions)**:
   - Bảng Mini HUD siêu gọn, bo tròn sang trọng, hỗ trợ kéo thả tự do trên mobile.
   - Hiển thị telemetry thời gian thực: % Máu (đổi màu xanh/vàng/đỏ), Số bình máu còn lại, Số vàng tích lũy, Role chiến đấu (Gần/Xa).
   - Bộ 3 phím bấm 1 chạm tiện lợi:
     * `⚡ Mua Máu`: Cho bot tự chạy về Shop mua máu ngay lập tức.
     * `📦 Cất Kho`: Tự chạy về Thủ Kho cất trang bị quý.
     * `📜 Làm Q`: Bật/Tắt chế độ làm nhiệm vụ nhanh.
     * `📂 Panel`: Mở bảng điều khiển chi tiết 4 tab.
