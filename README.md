# Ancient Realm - Master Bot v14.2 (Phân Định Chuẩn 2 Role Đánh Gần & Đánh Xa)

## 🌟 Tính Năng Mới Trong Bản v14.2
1. **🎯 Chuẩn Hóa & Nhận Diện 2 Vai Trò Chiến Đấu (Role Đánh Gần & Đánh Xa)**:
   - **Tự động nhận diện môn phái chính xác 100%**:
     * **⚔️ Đánh Gần (Melee)**: **Thiên Vương Phủ** (tầm 95px), **Long Tuyền Môn** (tầm 85px).
     * **🏹 Đánh Xa (Ranged)**: **Linh Mộc Đường** (tầm 260px), **Âm Dương Tông** (tầm 280px), **Sơn Thần Giáo** (tầm 320px).
   - **Tùy chọn linh hoạt trên UI (Tab ⚔️ Cày)**:
     * `🤖 Tự động nhận diện (Theo môn phái)`: Tự động quét phái, kỹ năng loadout và tầm vũ khí để đặt cự ly tối ưu.
     * `⚔️ Đánh Gần (Cận chiến / Melee)`: Ép cự ly áp sát ~60-80px, chém thường liên tục, không lùi chạy lung tung trước quái thường.
     * `🏹 Đánh Xa (Thả diều / Ranged)`: Ép cự ly vàng ~240-280px, đứng từ xa xả combo, tự động lùi thả diều (kiting) khi quái áp sát.
   - **Hiển thị trực quan Badge thời gian thực**: Hiển thị rõ môn phái, vai trò và số pixel tầm đánh ngay trên thanh điều khiển.

2. **📜 Hệ Thống Auto-Quest Thông Minh Toàn Cầu (Học từ CoViet)**:
   - Tự động nhận nhiệm vụ từ NPC khi có lời mời (`offers`).
   - Tự động di chuyển qua các map an toàn để nói chuyện với NPC (`talk`).
   - Tự động tìm bãi quái phù hợp để diệt (`kill`) và khóa mục tiêu đúng quái nhiệm vụ.
   - **Tự động thu thập vật phẩm (`collect`)**: Tra cứu quái rơi đồ (`mobsDroppingItem`), tự tìm map bãi quái, săn quái và ưu tiên hút sạch vật phẩm rơi của nhiệm vụ.
   - Tự động đi tới điểm chỉ định (`reach`) trên bản đồ.
   - Tự động quay về gặp NPC trả nhiệm vụ (`ready`) nhận thưởng.
   - Tab riêng **📜 Q.Vụ** trực quan với tiến độ, tên Q, bước làm và nút **⚡ Làm Ngay**.

3. **🛒 Bộ Lọc Chọn Đồ Bán Nâng Cao (Smart Junk Sell Filter)**:
   - Tùy chọn lọc trang bị bán theo loại: Vũ khí, Giáp, Nón, Áo choàng, Nhẫn.
   - Tùy chọn giữ lại theo Phẩm chất (`keepRarity`): Trắng, Xanh lá, Xanh lam, Tím, Cam.
   - Tùy chọn giữ lại theo Cấp độ trang bị (`keepLevel`).
   - Tùy chọn bán nguyên liệu rác quái rơi (`sellMats`).
   - **BẢO VỆ TUYỆT ĐỐI**: Đồ nhiệm vụ, bình máu, mana, ấn Diêm Đình, ngọc phù KHÔNG BAO GIỜ bị bán nhầm.

4. **📦 Tự Động Cất Đồ Vào Kho / Đặt Cọc Kho (Auto Storage Deposit)**:
   - Khi hành trang đầy và có trang bị quý hiếm đạt chuẩn giữ lại (`keeperSlots`).
   - Bot tự động tìm đường đến NPC **Thủ Kho** (`thukho` Làng Phong Châu hoặc thủ kho gần nhất).
   - Tự động mở kho và cất từng món đồ quý vào rương an toàn.
   - Tự động quay trở lại bãi farm ban đầu tiếp tục train.

5. **⚡ Canvas Optimizer 60 FPS & Draggable Cyber UI**:
   - Ẩn triệt để 276 hitbox đỏ của engine giúp game chạy cực mượt 60 FPS trên cả điện thoại và PC.
   - Giao diện 4 Tab phong cách Cyberpunk siêu gọn, kéo thả linh hoạt, có nút Mini Badge `🤖` không che khuất màn hình.

---

## 📱 Cài Đặt Trên Điện Thoại & PC
- **Trình duyệt (Kiwi Browser / Chrome / Edge + Tampermonkey)**: Cài file `AncientRealm_Master_Bot_v14_0.user.js`.
- **Ứng dụng Android APK**: Cài file `AncientRealm_Auto_v14_0.apk`.
