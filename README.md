# Ancient Realm - Master Bot v15.7 (Khôi Phục Bộ Máy Chiến Đấu & Thả Diều v15.0, Né Chiêu Boss Không Chặn Đòn & Tuần Tra Bãi Quái)

## 🌟 Tính Năng Mới Trong Bản v15.7.0
1. **🏹 Khôi Phục Hoàn Toàn Hysteresis Latch & Thả Diều Kiting v15.0**:
   - Sửa tận gốc cảm giác thụ động, đứng im chịu trận khi quái/boss áp sát của các bản v15.1 - v15.6.
   - **Đánh Xa (Âm Dương, Linh Mộc, Sơn Thần)**:
     * Tiến vào tầm chiêu `approachStop` (~82% tầm), trụ chân xả full combo chiêu thức và đòn đánh.
     * Khi quái/boss áp sát `< 68%` tầm (`retreatTrigger`), tự động kích hoạt trạng thái `RETREAT` và dùng thuật toán **Conga-Kite Vector 16 tia** để lùi mượt mà, né gốc cây/đá/vách núi, duy trì cự ly vàng `retreatSafe`.
     * Vừa di chuyển thả diều vừa xả kỹ năng liên tục (Stutter-step DPS)!
   - **Đánh Gần (Thiên Vương, Long Tuyền)**:
     * Áp sát chặt chẽ `60-70px` chém liên hoàn tốc lực, trụ chân tối đa, chỉ lùi phá vây khi bị kẹp giữa nhiều quái hoặc chân boss.

2. **⚡ Khắc Phục Triệt Để Cơ Chế Né Chiêu Boss (Non-Blocking Hazard Dodge)**:
   - Loại bỏ hoàn toàn lệnh đóng băng `return;` khi đang né chiêu đỏ boss.
   - Nhân vật vừa di chuyển trượt ra vùng an toàn (`safePt`), vừa tiếp tục khóa mục tiêu và bắn chiêu tầm xa vào Boss mà không bị khựng lại dù chỉ 1 frame.
   - Tự động xóa sạch các bẫy `activeHazards` khi Boss/Elite bị hạ gục hoặc khi đổi bản đồ.

3. **🧭 Tự Động Tuần Tra Bãi Quái (Spawn Patrol - Không Bao Giờ Đứng Chôn Chân)**:
   - Khi khu vực xung quanh đã dọn sạch quái (`target: null`), bot tự động tính toán và di chuyển đến bãi spawn quái gần nhất trên bản đồ thay vì đứng im chờ đợi.

4. **🧪 Kế Thừa Toàn Bộ Các Tính Năng Đỉnh Cao Trước Đó**:
   - **Đếm chính xác từng bình máu trong túi**: nạp đủ 100 bình liên tục mà không bị khựng ở 20 bình.
   - **Triệt tiêu hoàn toàn quái 0 máu / 1 máu**: không bao giờ đánh quái bóng ma.
   - **Nhận diện chuẩn môn phái**: bắt gói tin server và cung cấp nút bấm 1 chạm đổi vai trò Gần / Xa trực tiếp trên Mini HUD.
