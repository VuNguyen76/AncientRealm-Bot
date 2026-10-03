# Ancient Realm - Master Bot v15.8 (Kiến Trúc CoViet: Triệt Tiêu Freeze Đứng Im, Target Scoring Chuẩn & Immediate Combat Fallback)

## 🌟 Tính Năng Đột Phá Trong Bản v15.8.0 (Học Hỏi Kiến Trúc CoViet)
1. **🛡️ Triệt Tiêu Hoàn Toàn Lỗi Freeze Đứng Im Chôn Chân (Dead Mob Poisoning Bug)**:
   - Nghiên cứu từ `sync.js` của dự án CoViet: Ancient Realm tái sử dụng ID quái cũ khi quái hồi sinh (respawn). Bộ đệm `deadMobIds` tĩnh trước đây đã vĩnh viễn khóa chết quái hồi sinh, khiến bot tưởng rằng không còn quái nào trên bản đồ và đứng im với thông báo *"Chờ xuất hiện..."*.
   - Bản v15.8 xóa bỏ hoàn toàn `deadMobIds`, đồng bộ cờ sống chết theo đúng chuẩn gói tin mạng: `!(m.st & 1) && m.hp > 0`. Khi quái vừa hồi sinh, cờ `mb.dead` được khôi phục về `false` ngay lập tức trên snapshot.

2. **🎯 Bộ Điều Phối Mục Tiêu CoViet Target Scoring (`hunt.js` Standard)**:
   - Xếp hạng ưu tiên mục tiêu theo thang điểm chính xác:
     * **👑 Boss / Elite**: Ưu tiên tuyệt đối (-1000 điểm).
     * **⚔️ Quái đang cắn người chơi (`m.tgt === myId`)**: Ưu tiên phản đòn lập tức (-500 điểm).
     * **👾 Quái gần nhất**: Tính theo khoảng cách thực tế (dist).
   - Hễ có bất kỳ quái sống nào trong tầm quan sát, bot CHẮC CHẮN khóa và tấn công, không bao giờ rơi vào trạng thái `target: null`.

3. **⚡ Cơ Chế Tấn Công Tức Thời CoViet (`targetWithin` Fallback)**:
   - Không còn phụ thuộc vào trạng thái điều hướng di chuyển. Nếu trong tầm đánh xuất hiện quái, nhân vật lập tức xả chiêu và đánh thường liên hoàn, tuyệt đối không bị lệnh `return` đóng băng.

4. **🏹 Kế Thừa Toàn Bộ Hệ Thống Đỉnh Cao v15.0 - v15.7**:
   - Thả diều Hysteresis Latch & Conga-Kite 16 tia né vật cản tĩnh (cây, đá, tường).
   - Né chiêu đỏ Boss Non-Blocking (vừa chạy né vừa xả chiêu tầm xa).
   - Đếm chuẩn xác từng bình máu trong túi đồ, nạp đủ 100 bình liên tục.
   - Nhận diện chuẩn môn phái và nút bấm 1 chạm đổi vai trò Gần / Xa trên Mini HUD.
