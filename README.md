# Ancient Realm - Master Bot v14.0 (Tích Hợp Siêu Cấp CoViet Edition)

## 🌟 Tính Năng Mới Trong Bản v14.0 (Học Từ Dự Án CoViet)
1. **📜 Hệ Thống Auto-Quest Thông Minh Tự Động Toàn Cầu**:
   - Tự động nhận nhiệm vụ từ NPC khi có lời mời (`offers`).
   - Tự động di chuyển qua các map an toàn để nói chuyện với NPC (`talk`).
   - Tự động tìm bãi quái phù hợp để diệt (`kill`) và khóa mục tiêu đúng quái nhiệm vụ.
   - **Tự động thu thập vật phẩm (`collect`)**: Tra cứu quái rơi đồ (`mobsDroppingItem`), tự tìm map bãi quái, săn quái và ưu tiên hút sạch vật phẩm rơi của nhiệm vụ.
   - Tự động đi tới điểm chỉ định (`reach`) trên bản đồ.
   - Tự động quay về gặp NPC trả nhiệm vụ (`ready`) nhận thưởng.
   - Tab riêng **📜 Q.Vụ** trực quan với tiến độ, tên Q, bước làm và nút **⚡ Làm Ngay**.

2. **🛒 Bộ Lọc Chọn Đồ Bán Nâng Cao (Smart Junk Sell Filter)**:
   - Tùy chọn lọc trang bị bán theo loại: Vũ khí, Giáp, Nón, Áo choàng, Nhẫn.
   - Tùy chọn giữ lại theo Phẩm chất (`keepRarity`): Trắng, Xanh lá, Xanh lam, Tím, Cam.
   - Tùy chọn giữ lại theo Cấp độ trang bị (`keepLevel`).
   - Tùy chọn bán nguyên liệu rác quái rơi (`sellMats`).
   - **BẢO VỆ TUYỆT ĐỐI**: Đồ nhiệm vụ, bình máu, mana, ấn Diêm Đình, ngọc phù KHÔNG BAO GIỜ bị bán nhầm.

3. **📦 Tự Động Cất Đồ Vào Kho / Đặt Cọc Kho (Auto Storage Deposit)**:
   - Khi hành trang đầy và có trang bị quý hiếm đạt chuẩn giữ lại (`keeperSlots`).
   - Bot tự động tìm đường đến NPC **Thủ Kho** (`thukho` Làng Phong Châu hoặc thủ kho gần nhất).
   - Tự động mở kho và cất từng món đồ quý vào rương an toàn.
   - Tự động quay trở lại bãi farm ban đầu tiếp tục train.

4. **⚡ Canvas Optimizer 60 FPS & Draggable Cyber UI**:
   - Ẩn triệt để 276 hitbox đỏ của engine giúp game chạy cực mượt 60 FPS trên cả điện thoại và PC.
   - Giao diện 4 Tab phong cách Cyberpunk siêu gọn, kéo thả linh hoạt, có nút Mini Badge `🤖` không che khuất màn hình.

---

## 📱 Cài Đặt Trên Điện Thoại & PC
- **Trình duyệt (Kiwi Browser / Chrome / Edge + Tampermonkey)**: Cài file `AncientRealm_Master_Bot_v14_0.user.js`.
- **Ứng dụng Android APK**: Cài file `AncientRealm_Auto_v14_0.apk`.
