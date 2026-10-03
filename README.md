# Ancient Realm - Master Bot v13.8 (Mobile & PC Edition)

## 🌟 Tính Năng Mới Trong Bản v13.8
1. **Hỗ trợ 100% Điện Thoại (Mobile Kiwi Browser, Stay, Tampermonkey)**:
   - **Xóa bỏ triệt để thông báo chặn màn hình**: Tự động lắng nghe đăng nhập trong nền mà KHÔNG hiện popup `alert("Sếp vui lòng đăng nhập...")`.
   - **Tự động thêm `?debug`**: Tự động chuyển URL sang chế độ debug mượt mà, không dùng hộp thoại `confirm()` gây đơ trình duyệt điện thoại.
   - **Giao diện tự động thu gọn thông minh trên điện thoại**:
     * Mặc định thu gọn thành **Huy Hiệu Mini (Badge)** nhỏ gọn ở góc màn hình, không che khuất màn hình hay nút kỹ năng.
     * Khung chat tự động thu gọn thành bong bóng nhỏ `💬 Chat`, giữ nút di chuyển (Joystick) hoàn toàn thông thoáng.
     * Kéo thả di chuyển tự do bằng ngón tay đến bất kỳ vị trí nào trên màn hình điện thoại.

2. **Tự Động Bán Đồ Rác & Mua Bình Máu & Quay Lại Bãi Farm**:
   - Khi hành trang còn $\le 1$ ô trống hoặc bình máu $\le 2$ bình:
     * Bot tự động ghi nhớ vị trí bãi quái đang farm.
     * Tự động tìm Cửa Hàng / NPC gần nhất trong toàn bộ thế giới game.
     * Tự động bước qua các cổng dịch chuyển để đến gặp NPC.
     * Tự động bán sạch nguyên liệu quái rơi và trang bị rác.
     * BẢO VỆ TUYỆT ĐỐI đồ nhiệm vụ (Ngọc phù, Ấn Diêm Đình, Rìu Thạch Sanh...) và đồ quý hiếm.
     * Tự động mua bổ sung bình máu đầy đủ.
     * Tự động đi ngược qua các cổng trở về đúng tọa độ bãi farm ban đầu và tiếp tục train quái $24/7$!

---

## 📱 Hướng Dẫn Cài Đặt Trên Điện Thoại (Android / iOS)
### Cách 1: Dùng trình duyệt Kiwi Browser (Android) - Đơn giản nhất
1. Tải **Kiwi Browser** từ Google Play Store.
2. Cài tiện ích mở rộng **Tampermonkey** hoặc **Violentmonkey** từ Chrome Web Store trên Kiwi Browser.
3. Mở file `AncientRealm_Master_Bot_v13_8_Mobile.user.js` và chọn **Cài đặt (Install)**.
4. Mở game tại `https://ancientrealm.online`:
   - Bot sẽ tự động chạy trong nền.
   - Khi Sếp đăng nhập vào game, Huy hiệu **🟢 Bot v13.8** sẽ tự động xuất hiện ở góc màn hình!

### Cách 2: Cài Extension trực tiếp từ file Zip
1. Vào Kiwi Browser -> Menu (3 chấm) -> **Tiện ích mở rộng (Extensions)**.
2. Bật **Chế độ dành cho nhà phát triển (Developer mode)**.
3. Chọn **+(from .zip/.crx/.user.js)** và chọn file `AncientRealm_Bot_Plugin_v13_8.zip`.
