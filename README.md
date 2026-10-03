# Ancient Realm - Master Bot v15.4 (Khắc Chế Độc Nghê Chúa & Né Chiêu Không Kẹt Đá)

## 🌟 Tính Năng Mới Đột Phá Trong Bản v15.4
1. **🦁 Nhận Diện Toàn Diện Boss "Nghê Chúa Động Thiên" & Quái Cấp Cao**:
   - Tự động chuẩn hóa tiếng Việt loại bỏ dấu (`stripVN`): nhận diện tức thì mọi tên gọi Boss: `nghe`, `chua`, `dong thien`, `vuong`, `tuong`, `than`, `trum`, `thu linh`, `tinh`, `cau`,...
   - Tự động phân loại Boss khi máu $ge 5000$ hoặc cấp $ge 45$.
   - Kích hoạt cự ly thả diều vàng 210px - 260px cho phái đánh xa, tuyệt đối không bước vào hốc đá dưới chân Boss.

2. **🔥 Khắc Chế Đám Mây Độc & Lửa Tồn Lưu Sau Khi Nổ (Lingering Cloud Hazard Engine)**:
   - Đám mây độc/khói lửa tím phát nổ từ Boss luôn được hệ thống theo dõi và duy trì vùng nguy hiểm ít nhất 2200ms sau vụ nổ (`handleBossBoom`).
   - Bot không bao giờ bước trở lại vào đám mây khi lửa/khói độc còn đang bốc lên.

3. **🪨 Dò Đường Né Chiêu Thông Minh Không Bao Giờ Đâm Sầm Vào Đá (`findSafeDodgePoint` & `testProbe`)**:
   - Tích hợp bộ giải mã chuẩn xác vật cản của server (`GAME.world.cols`): hình tròn `['c', x, y, r]`, hình hộp chữ nhật `['b', x0, y0, x1, y1]`, elip `['e', x, y, rx, ry]`.
   - Thuật toán tìm điểm né chiêu quét 6 vòng bán kính kết hợp kiểm tra va chạm tĩnh (`isPointBlockedByCollider`) và tia dò đường (`testProbe`). Bot chỉ né vào những khoảng trống thực sự đi được, tuyệt đối không chọn điểm rơi nằm trong tảng đá!
   - Thêm cơ chế giải phóng góc kẹt khi né chiêu: nếu phát hiện bị chặn bởi vách đá quá 250ms, bot tự động trượt theo phương tiếp tuyến 90 độ men theo gờ đá để thoát hiểm.

4. **👑 Khắc Chế Tầm Đánh Thường Của Boss (Boss Basic Attack Danger Zone & Safe Kite Engine)**:
   - Tính toán bán kính đánh thường của Boss `bossNormalAtkRange = range + r + 20px`.
   - Ranged xả đạn ở cự ly vàng ngoài tầm quạt tay của Boss, Melee lùi ngoài bán kính khi máu < 65% để cắn bình máu.

5. **☠️ Triệt Tiêu Quái 0 Máu & 1 Máu, Khóa Tầm Đánh Quái Thường Keep-Range 0.88 & Tự Động Hồi Sinh**.
