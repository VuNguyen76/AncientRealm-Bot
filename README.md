# Ancient Realm - Master Bot v14.3 (Bản Kiểm Tra Bản Đồ & Hòa Hợp Toàn Diện)

## 🌟 Tính Năng Mới Trong Bản v14.3
1. **🗺️ Kiểm Tra Bản Đồ & Định Tuyến Cổng Thông Minh (Học Từ CoViet)**:
   - **Xác thực cổng thông minh (`isPortalLocked`)**:
     * Kiểm tra chính xác cấp độ yêu cầu (`reqLv`).
     * Kiểm tra tiến độ nhiệm vụ (`reqQuest`) qua danh sách `self.quests.done` và `self.quests.list`.
     * Kiểm tra chìa khóa / ngọc phù mở cổng (`req`) trong hành trang.
   - **Đồng bộ thời gian thực Layout bản đồ (`syncZoneLayout`)**:
     * Tự động cập nhật tọa độ thực tế của Cổng dịch chuyển và NPC từ server, loại bỏ triệt để tình trạng lệch tọa độ.
   - **Chống kẹt cổng & Chống lặp cổng (Anti-Ping-Pong)**: Tự động giữ vị trí cho đến khi nhận được gói tin chuyển map an toàn.

2. **⚔️ Khắc Phục Triệt Để Xung Đột Giữa Auto-Cày Quái & Auto-Quest**:
   - **Tách biệt 2 luồng mục tiêu**:
     * `cfg.farmMob`: Quái cày do người chơi chủ động chọn trên giao diện.
     * `questState.targetMobs`: Danh sách quái mục tiêu của nhiệm vụ đang làm.
   - **Phối hợp thông minh không ghi đè**:
     * Khi bước nhiệm vụ yêu cầu diệt quái / thu thập đồ: Ưu tiên săn quái nhiệm vụ (hỗ trợ nhiều loài quái đồng thời).
     * Khi xong nhiệm vụ hoặc quay về gặp NPC trả Q: Tự động khôi phục 100% mục tiêu cày của người chơi.
     * Ô chọn quái trên giao diện (`#sm-mob-sel`) **không bao giờ bị mất focus hay bị ghi đè lung tung**.
   - **Tự vệ khẩn cấp**: Khi đang di chuyển tới NPC mà bị quái bu cắn nguy hiểm, bot tự động kích hoạt tự vệ phá vây, không bị quái cắn chết dọc đường.

3. **🎯 Chuẩn Hóa 2 Role Đánh Gần & Đánh Xa**:
   - Tự động nhận diện phái (Thiên Vương/Long Tuyền: Melee ~80px | Linh Mộc/Âm Dương/Sơn Thần: Ranged ~260px kiting).
   - Tùy chọn ép role Đánh Gần hoặc Đánh Xa linh hoạt trên Tab ⚔️ Cày.

4. **🛒 Bộ Lọc Chọn Đồ Bán Nâng Cao & Tự Cất Kho Thủ Kho & 60 FPS Canvas**.
