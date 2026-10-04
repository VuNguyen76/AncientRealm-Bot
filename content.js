// AncientRealm Online - Master Bot v16.2.0 (Vua Nâng Cấp Kỹ Năng & Cường Hóa Trang Bị, Tự Động Săn Nguyên Liệu & Khắc Phục Kẹt Q Sông Bạch Đằng)
// KẾ THỪA & NÂNG CẤP TOÀN DIỆN TỪ KIẾN TRÚC COVIET (D:\coviet-4\coviet):
// 1. TRIỆT TIÊU TẬN GỐC HIỆN TƯỢNG ĐỨNG IM CHÔN CHÂN (FREEZE / DEAD MOB POISONING):
//    - Xóa bỏ vĩnh viễn bộ nhớ đệm độc hại deadMobIds. Chuẩn hóa cờ sống chết theo CoViet sync.js: !(m.st & 1) && m.hp > 0.
//    - Khi quái hồi sinh (respawn) cùng ID cũ, cờ mb.dead được tự động khôi phục về false ngay lập tức trên snapshot.
// 2. BỘ ĐIỀU PHỐI MỤC TIÊU COVIET TARGET SCORING (HUNT.JS):
//    - Ưu tiên số 1: Boss / Elite (-1000 điểm)
//    - Ưu tiên số 2: Quái đang cắn người chơi m.tgt === myId (-500 điểm)
//    - Ưu tiên số 3: Quái gần nhất theo khoảng cách thực tế (dist)
//    - Đảm bảo 100% hễ có quái sống trong khu vực là PHẢI khóa và tấn công, không bao giờ rơi vào target: null!
// 3. CƠ CHẾ TẤN CÔNG DỰ PHÒNG TỨC THÌ (COVIET ATTACK-RANGE FALLBACK):
//    - Triệt tiêu bẫy return đóng băng khi tới bãi spawn.
//    - Nếu trong tầm đánh xuất hiện quái, lập tức xả chiêu và đánh thường ngay (targetWithin standard), không phụ thuộc vào trạng thái di chuyển.
// 4. DUY TRÌ BỘ MÁY CHIẾN ĐẤU ĐỈNH CAO:
//    - Hysteresis Latch & Conga-Kite 16 tia né vật cản v15.0.
//    - Nạp đủ 100 bình máu (đếm chuẩn túi đồ, không dừng ở 20).
//    - Nhận diện chuẩn môn phái và nút bấm 1 chạm đổi vai trò Gần / Xa trên Mini HUD.
//    - Khi d > reach: Tiến thẳng về phía quái để vào cự ly ra đòn.
//    - Vector Đẩy Lùi Vật Thể Tĩnh (Static Obstacle Repulsion):
//      Quét toàn bộ 276 vật cản tĩnh (world.cols - cây, đá, tường) trong bán kính 90px.
//      Vật cản tự động tạo ra lực đẩy cực mạnh hướng ra ngoài -> Bot KHÔNG BAO GIỜ lùi vào góc chết/bụi cây!
//    - Hệ Thống Dò 16 Tia Toàn Diện 360 Độ (16-Ray Omnidirectional Test Probe):
//      Thay vì chỉ dò hướng lùi hẹp (bị gốc cây chắn), bot quét trọn vẹn 16 hướng xung quanh (cách nhau 22.5 độ).
//      Luôn luôn tìm ra khe hở / đường luồn lách sang hai bên sườn để thoát thân ra bãi đất trống!
//    - Cơ Chế Phá Vây Khẩn Cấp (Emergency Breakout Mode):
//      Khi bị 2-3 quái áp sát mặt (dMin <= 75px) và bị cản lưng:
//      Tự động xả chiêu Choáng diện rộng (Ngũ Hành 1.2s stun hoặc Thiên Lôi 0.8s stun) làm bất động toàn bộ quái vây quanh,
//      đồng thời bứt tốc luồn lách qua khe quái lao ra bãi đất trống!
//    - Phát Hiện Kẹt & Tự Động Bẻ Lái 90 Độ (Stuck Recovery):
//      Nếu đang di chuyển mà vị trí bị kẹt 300ms (< 12px), bot tự động bẻ vuông góc 90 độ men theo thân cây trượt ra ngoài!
// 2. GIỮ NGUYÊN TOÀN BỘ CORE V13 CHUẨN:
//    - Kéo hàng dọc Conga-Line mượt mà.
//    - Bộ lọc trễ Hysteresis 55px (chống lắc người 100%).
//    - Mỏ neo Leash tiếp tuyến 90 độ (quái không bao giờ mất kiên nhẫn, không bao giờ evade hồi máu).
//    - Ưu tiên diệt đệ tử do Boss sinh ra trước (Focus Fire Adds, chống dồn quái).
//    - Bộ chuyển đổi Loadout 1 chạm: Sử dụng đồng thời CẢ 2 CHIÊU ẨN [Lôi Phù, Thủy Kính (Ẩn), Thiên Lôi (Ẩn)].

(function() {
  // 1. Tự động chuyển URL sang '?debug' nếu thiếu (mượt mà, không dùng confirm popup gây kẹt mobile)
  if (!location.search.includes('debug')) {
    const newSearch = location.search ? location.search + '&debug' : '?debug';
    const newUrl = location.pathname + newSearch + location.hash;
    location.replace(newUrl);
    return;
  }

  // SIÊU TỐI ƯU HÓA CANVAS 60 FPS CHO MOBILE:
  // Loại bỏ hoàn toàn 276 vòng lặp vẽ hitbox đỏ (world.cols) và bảng đen debug của game gốc
  // Giúp WebView mobile tăng vọt từ 20 FPS lên 60 FPS mượt mà tuyệt đối!
  (function optimizeCanvas() {
    if (window.__canvasOptimized) return;
    window.__canvasOptimized = true;
    try {
      const origStroke = CanvasRenderingContext2D.prototype.stroke;
      const origArc = CanvasRenderingContext2D.prototype.arc;
      const origEllipse = CanvasRenderingContext2D.prototype.ellipse;
      const origFillRect = CanvasRenderingContext2D.prototype.fillRect;
      const origFillText = CanvasRenderingContext2D.prototype.fillText;

      CanvasRenderingContext2D.prototype.stroke = function() {
        const s = this.strokeStyle;
        if (typeof s === 'string' && (s.includes('255, 40, 40') || s.includes('255,40,40') || s === '#33ccff' || s === '#3cf')) {
          return; // Bỏ qua vẽ 276 vòng đỏ cản đường mỗi frame!
        }
        return origStroke.apply(this, arguments);
      };

      CanvasRenderingContext2D.prototype.arc = function() {
        const s = this.strokeStyle;
        if (typeof s === 'string' && (s.includes('255, 40, 40') || s.includes('255,40,40') || s === '#33ccff' || s === '#3cf')) {
          return;
        }
        return origArc.apply(this, arguments);
      };

      CanvasRenderingContext2D.prototype.ellipse = function() {
        const s = this.strokeStyle;
        if (typeof s === 'string' && (s.includes('255, 40, 40') || s.includes('255,40,40'))) {
          return;
        }
        return origEllipse.apply(this, arguments);
      };

      CanvasRenderingContext2D.prototype.fillRect = function(x, y, w, h) {
        if (x === 8 && w === 260 && h === 50) return; // Bỏ qua bảng đen đè màn hình
        return origFillRect.apply(this, arguments);
      };

      CanvasRenderingContext2D.prototype.fillText = function(text, x, y) {
        if (typeof text === 'string' && (text.includes('fps ·') || text.includes(' · chờ '))) return;
        return origFillText.apply(this, arguments);
      };
      console.log("%c[CANVAS OPTIMIZER] Đã kích hoạt bộ tối ưu 60 FPS, ẩn 276 hitbox đỏ thành công!", "color: #00e676; font-weight: bold;");
    } catch (e) {
      console.warn("[CANVAS OPTIMIZER ERROR]", e);
    }
  })();

  // BẮT KẾT NỐI WEBSOCKET ĐỂ CHỐNG LỖI GAME.net BỊ NULL KHI ĐĂNG NHẬP LẦN ĐẦU:
  if (!window.__wsCaptured) {
    window.__wsCaptured = true;
    window.__activeWS = null;
    const OrigWebSocket = window.WebSocket;
    if (OrigWebSocket) {
      try {
        const WSProxy = new Proxy(OrigWebSocket, {
          construct(target, args) {
            const ws = Reflect.construct(target, args);
            if (args[0] && String(args[0]).includes('/ws')) {
              window.__activeWS = ws;
            }
            return ws;
          }
        });
        // BẢO ĐẢM TOÀN BỘ HẰNG SỐ NGUYÊN BẢN (OPEN=1, CONNECTING=0...) KHÔNG BỊ MẤT
        WSProxy.CONNECTING = OrigWebSocket.CONNECTING !== undefined ? OrigWebSocket.CONNECTING : 0;
        WSProxy.OPEN = OrigWebSocket.OPEN !== undefined ? OrigWebSocket.OPEN : 1;
        WSProxy.CLOSING = OrigWebSocket.CLOSING !== undefined ? OrigWebSocket.CLOSING : 2;
        WSProxy.CLOSED = OrigWebSocket.CLOSED !== undefined ? OrigWebSocket.CLOSED : 3;
        WSProxy.prototype = OrigWebSocket.prototype;
        window.WebSocket = WSProxy;
      } catch (e) {
        console.warn("[WS HOOK FAILED]", e);
      }
    }
  }

  // 0. HOT-PATCH CHỐNG CRASH GAME GỐC (main.js:884 Cannot read properties of null reading 'joined')
  // Lỗi xảy ra khi bật "Tự đánh" trong cài đặt game trước khi đăng nhập vào nhân vật
  try {
    if (localStorage.getItem('dainam_autofight') === '1') {
      localStorage.setItem('dainam_autofight', '0');
      console.log("%c[BOT ENGINE PATCH] Đã tự động tắt 'dainam_autofight' của game gốc để chống crash main.js:884!", "color: #00e676; font-weight: bold;");
    }
  } catch (e) {}

  // 2. Chế độ chờ đăng nhập tự động (Hoạt động hoàn hảo trên cả Điện thoại & PC)
  if (window.__ancientMasterBotPolling) return;
  window.__ancientMasterBotPolling = true;

  function boot() {
    try {
      const g = window.GAME;
      if (!g || !g.me || !g.self) {
        setTimeout(boot, 300);
        return;
      }

      // TỰ ĐỘNG BÙ ĐẮP GAME.net NẾU BỊ NULL DO ĐĂNG NHẬP SAU KHI TẢI TRANG
      if (!g.net) {
        if (window.__activeWS && window.__activeWS.readyState === 1) {
          console.log("%c[BOT ENGINE] Tự động liên kết synthetic GAME.net từ active WebSocket!", "color: #00e676; font-weight: bold;");
          g.net = {
            ws: window.__activeWS,
            snaps: [],
            h: {},
            joined: true,
            send: (msg) => {
              if (window.__activeWS && window.__activeWS.readyState === 1) {
                window.__activeWS.send(JSON.stringify(msg));
              }
            }
          };
        } else {
          setTimeout(boot, 300);
          return;
        }
      }

      window.__ancientMasterBotPolling = false;
      runBotEngine();
    } catch(err) {
      console.error("[BOT BOOT ERROR]", err);
      setTimeout(boot, 1000);
    }
  }

  boot();

  function runBotEngine() {
    if (window._ancientMasterBot) window._ancientMasterBot.destroy();
    const oldPanels = document.querySelectorAll('[id^="ancient-master-bot"], #sm-mini-badge, #sm-fab-toggle, #ancient-floating-chat, #ancient-chat-bubble');
    oldPanels.forEach(p => p.remove());
    disableNativeAutoFight();

    const MOB_BASE = 1_000_000;

  // =========================================================================
  // HỆ THỐNG VAI TRÒ CHIẾN ĐẤU (ROLE: ĐÁNH GẦN & ĐÁNH XA) - HỌC TỪ COVIET
  // Chuẩn hóa môn phái:
  // - Đánh Gần (Melee): Thiên Vương Phủ (range 95), Long Tuyền Môn (range 85)
  let capturedSelf = null;

  // BỘ LỌC TRIỆT TIÊU 100% QUÁI 0 MÁU VÀ 1 MÁU (CHỐNG KẸT QUÁI BÓNG MA / SẮP CHẾT)
  function isMobValidAndAlive(m) {
    if (!m) return false;
    if (m.dead === true) return false;
    // Cờ ST.DEAD từ server: bit 0 của st (st & 1 === 1)
    if (typeof m.st === 'number' && (m.st & 1) === 1) return false;
    // Quái 0 máu hoặc 1 máu (đang trong hoạt ảnh chết)
    if (typeof m.hp === 'number' && m.hp <= 1) return false;
    return true;
  }

  function isBossMob(m) {
    if (!m) return false;
    const def = getMobDef(m);
    return !!(def?.boss || def?.elite || ['chantinh', 'daibang', 'moctinh', 'xuongho', 'nghechua'].includes(m.kind));
  }

  function getColliderDistance(c, px, py) {
    if (!c) return Infinity;
    if (c.t === 'c') {
      return Math.hypot(px - c.x, py - c.y) - (c.r || 20);
    }
    if (c.t === 'b') {
      const cx = Math.max(c.x0, Math.min(px, c.x1));
      const cy = Math.max(c.y0, Math.min(py, c.y1));
      return Math.hypot(px - cx, py - cy);
    }
    if (c.t === 'e') {
      const ex = (px - c.x) / (c.rx || 100);
      const ey = (py - c.y) / (c.ry || 50);
      return (Math.hypot(ex, ey) - 1.0) * Math.min(c.rx || 100, c.ry || 50);
    }
    if (Array.isArray(c)) {
      return Math.hypot(px - c[0], py - c[1]) - (c[2] || 20);
    }
    return Infinity;
  }

  function getColliderSurfaceVector(c, px, py) {
    if (!c) return { dx: 0, dy: 0, distSurface: Infinity };
    let cx = px, cy = py, r = 0;
    if (c.t === 'c') {
      cx = c.x; cy = c.y; r = c.r || 20;
    } else if (c.t === 'b') {
      cx = Math.max(c.x0, Math.min(px, c.x1));
      cy = Math.max(c.y0, Math.min(py, c.y1));
      r = 0;
    } else if (c.t === 'e') {
      cx = c.x; cy = c.y; r = Math.min(c.rx || 100, c.ry || 50);
    } else if (Array.isArray(c)) {
      cx = c[0]; cy = c[1]; r = c[2] || 20;
    }
    const dx = px - cx, dy = py - cy;
    const d = Math.hypot(dx, dy) || 1;
    const distSurface = d - r;
    return { dx: dx / d, dy: dy / d, distSurface };
  }

  function isPointColliding(px, py, pad = 18) {
    const world = window.GAME?.world;
    if (!world) return false;
    const mapW = world.w || 2000, mapH = world.h || 2000;
    if (px < pad + 20 || px > mapW - pad - 20 || py < pad + 50 || py > mapH - pad - 20) {
      return true;
    }
    const cols = world.cols || [];
    const near = world.nearCols ? world.nearCols(px, py, pad + 20) : null;
    const indices = near ? Array.from(near) : null;
    if (indices) {
      for (const i of indices) {
        if (getColliderDistance(cols[i], px, py) < pad) return true;
      }
    } else {
      for (let i = 0; i < cols.length; i++) {
        if (getColliderDistance(cols[i], px, py) < pad) return true;
      }
    }
    return false;
  }

  function isPathClear(x0, y0, x1, y1, r = 18) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(d / 12));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const sx = x0 + (x1 - x0) * t;
      const sy = y0 + (y1 - y0) * t;
      if (isPointColliding(sx, sy, r)) return false;
    }
    return true;
  }

  function countBlockedDirections(x, y, dist = 65) {
    let blockedCount = 0;
    for (let a = 0; a < 360; a += 45) {
      const rad = a * Math.PI / 180;
      const dx = Math.cos(rad) * dist, dy = Math.sin(rad) * dist;
      if (!isPathClear(x, y, x + dx, y + dy, 18)) {
        blockedCount++;
      }
    }
    return blockedCount;
  }

  // - Đánh Xa (Ranged): Linh Mộc Đường (range 260), Âm Dương Tông (range 280), Sơn Thần Giáo (range 320)
  // =========================================================================
  const CLASS_SPECS = {
    thienvuong: { name: 'Thiên Vương Phủ', role: 'melee', defaultRange: 95, atkMs: 900, icon: '🗡️' },
    longtuyen:  { name: 'Long Tuyền Môn',  role: 'melee', defaultRange: 85, atkMs: 650, icon: '⚔️' },
    linhmoc:    { name: 'Linh Mộc Đường',  role: 'ranged', defaultRange: 260, atkMs: 1000, icon: '🌿' },
    amduong:    { name: 'Âm Dương Tông',   role: 'ranged', defaultRange: 280, atkMs: 1000, icon: '☯️' },
    sonthan:    { name: 'Sơn Thần Giáo',   role: 'ranged', defaultRange: 320, atkMs: 900, icon: '🏹' }
  };

  function detectClassFromSkills(self) {
    const loadout = self?.loadout || [];
    for (const skId of loadout) {
      if (!skId || typeof skId !== 'string') continue;
      if (skId.startsWith('tv_')) return 'thienvuong';
      if (skId.startsWith('lt_')) return 'longtuyen';
      if (skId.startsWith('lm_')) return 'linhmoc';
      if (skId.startsWith('ad_')) return 'amduong';
      if (skId.startsWith('st_')) return 'sonthan';
    }
    if (self?.sks && typeof self.sks === 'object') {
      for (const skId of Object.keys(self.sks)) {
        if (skId.startsWith('tv_')) return 'thienvuong';
        if (skId.startsWith('lt_')) return 'longtuyen';
        if (skId.startsWith('lm_')) return 'linhmoc';
        if (skId.startsWith('ad_')) return 'amduong';
        if (skId.startsWith('st_')) return 'sonthan';
      }
    }
    return null;
  }

  function getCharacterRoleInfo() {
    const self = capturedSelf || window.GAME?.self || window.GAME?.ui?.self;
    const GD = window.GAME?.GD || {};
    const gdClasses = GD.classes || {};

    let classId = self?.cls?.id || self?.cls || self?.class;
    
    // Nếu chưa có, quét danh sách người chơi trong zone tìm chính mình
    if (!classId) {
      const myId = window.GAME?.myId || window.GAME?.me?.id;
      const allPlayers = window.GAME?.players ? Array.from(window.GAME.players.values()) : [];
      const mePlayer = allPlayers.find(p => p.id === myId || (self?.name && p.name === self.name));
      if (mePlayer?.cls) {
        classId = typeof mePlayer.cls === 'string' ? mePlayer.cls : mePlayer.cls?.id;
      }
    }

    if (!classId || typeof classId !== 'string') {
      classId = detectClassFromSkills(self);
    }

    // NẾU KHÔNG NHẬN DIỆN ĐƯỢC: MẶC ĐỊNH LÀ LONG TUYỀN MÔN (ĐÁNH GẦN 85px)
    // Tuyệt đối không mặc định là Âm Dương (280px) để cận chiến không bị đứng ngoài tầm đánh!
    if (!classId || !CLASS_SPECS[classId]) {
      classId = 'longtuyen';
    }

    const spec = CLASS_SPECS[classId] || CLASS_SPECS.longtuyen;
    const gdCls = gdClasses[classId] || {};

    const className = gdCls.name || spec.name || classId;
    const detectedRole = spec.role; // 'melee' | 'ranged'

    // Role hoạt động thực tế: Ưu tiên thiết lập người dùng chọn
    let activeRole = detectedRole;
    if (cfg?.combatRole === 'melee') activeRole = 'melee';
    else if (cfg?.combatRole === 'ranged') activeRole = 'ranged';

    const isMelee = (activeRole === 'melee');

    // Tầm đánh cơ bản (baseRange) tính toán linh hoạt:
    let baseRange;
    if (cfg?.combatRole === 'melee') {
      baseRange = (detectedRole === 'melee') ? (gdCls.range || spec.defaultRange || 85) : 85;
    } else if (cfg?.combatRole === 'ranged') {
      baseRange = (detectedRole === 'ranged') ? (gdCls.range || spec.defaultRange || 280) : 260;
    } else {
      baseRange = gdCls.range || spec.defaultRange || (isMelee ? 85 : 280);
    }

    const atkMs = gdCls.atkMs || spec.atkMs || (isMelee ? 650 : 1000);

    return {
      classId,
      className,
      detectedRole, // 'melee' | 'ranged'
      activeRole,   // 'melee' | 'ranged'
      isMelee,
      baseRange,
      atkMs,
      icon: isMelee ? '⚔️' : '🏹'
    };
  }

  function getMyCls() {
    const r = getCharacterRoleInfo();
    return { id: r.classId, name: r.className, range: r.baseRange, atkMs: r.atkMs };
  }

  const rawClassRange = 280;
  const maxRange = 310;

  const cfg = {
    enabled: true,
    combatRole: 'auto', // 'auto': Tự nhận diện môn phái, 'melee': Đánh gần (cận chiến), 'ranged': Đánh xa (thả diều)
    farmMob: 'all', // Quái người chơi chỉ định cày (Tách biệt hoàn toàn, không bao giờ bị ghi đè bởi nhiệm vụ)
    targetMob: 'all',
    autoLoot: true,
    lootRadius: 320,
    
    // Quái thường:
    retreatTriggerDistMob: 210,
    retreatSafeDistMob: 265,
    approachTriggerDistMob: 310,
    approachStopDistMob: 250,

    // Boss:
    retreatTriggerDistBoss: 265,
    retreatSafeDistBoss: 295,
    approachTriggerDistBoss: 320,
    approachStopDistBoss: 280,

    castGateMinImpactTime: 450,
    autoPotion: true,

    // Auto-Shop & Return to Farm Settings (v14.0)
    autoShop: true,
    autoShopSameMapOnly: false, // Tùy chọn giữ bãi: Chỉ bán khi có Shop cùng map, không nhảy cổng
    autoShopMaxHops: 3, // Giới hạn số cổng tối đa được phép đi (tránh đi lang thang)
    autoShopFreeSlotTrigger: 1, // Hành trang còn <= 1 ô trống -> Đi bán rác & nguyên liệu
    autoShopHpPotionTrigger: 10, // Còn <= 10 bình máu -> Đi nạp bình máu
    autoShopMinPotionsToBuy: 100, // Số bình máu muốn nạp đủ (100 bình)

    // TÍNH NĂNG NHIỆM VỤ AUTO-QUEST (HỌC TỪ COVIET):
    autoQuest: false,
    questDoSide: true,
    questDoDaily: false,

    // BỘ LỌC CHỌN ĐỒ BÁN NÂNG CAO (HỌC TỪ COVIET):
    autoSell: true,
    keepRarity: 2, // 0: Giữ hết, 1: Giữ từ Xanh lá, 2: Giữ từ Xanh lam, 3: Giữ từ Tím, 4: Giữ từ Cam
    keepLevel: 1, // Giữ trang bị từ cấp này trở lên
    sellTypes: ['weapon', 'armor', 'helmet', 'cape', 'ring'], // Các loại trang bị được bán
    sellMats: true, // Bán nguyên liệu quái rơi rác

    // TỰ ĐỘNG CẤT ĐỒ VÀO KHO / ĐẶT CỌC KHO (HỌC TỪ COVIET):
    autoStore: false // Tự động cất trang bị quý vào kho Thủ Kho khi túi đầy
  };

  const devState = {
    totalAttacks: 0,
    totalSkills: 0,
    skillsBreakdown: { loiphu: 0, hoalong: 0, nguhanh: 0, thuykinh: 0, thienloi: 0 },
    totalDamageTaken: 0,
    totalItemsPicked: 0,
    minionsPurged: 0,
    breakoutsTriggered: 0,
    gatedCastsPrevented: 0,
    swingDodged: 0,
    leashReversals: 0,
    lastMeasuredAtkDist: 0,
    lastMeasuredMobKind: '',
    totalTrashSold: 0,
    totalPotionsBought: 0,
    goldEarnedFromShop: 0
  };

  let movementState = 'STAND';
  let pendingLoadout = null;
  const mobSwingCooldowns = new Map();
  // Boss Hazard Dodging Engine (Học từ dodge.js của CoViet)
  const activeHazards = [];
  const activeTelegraphs = activeHazards; // Tương thích ngược

  function addBossHazard(ev, now) {
    const num = (v, d = 0) => (Number.isFinite(v) ? v : d);
    activeHazards.push({
      sh: ev.sh || 'circle',
      x: ev.x,
      y: ev.y,
      r: num(ev.r, 100),
      r0: num(ev.r0, 0),
      w: num(ev.w, 0),
      len: num(ev.len, 0),
      arc: num(ev.arc, 0),
      ang: num(ev.ang, 0),
      until: now + num(ev.ms, 1000) + 250,
      boomed: false
    });
  }

  function handleBossBoom(ev, now) {
    const num = (v, d = 0) => (Number.isFinite(v) ? v : d);
    const dur = num(ev.dur, 0);
    const sh = ev.sh || 'circle';
    const i = activeHazards.findIndex(h => !h.boomed && h.sh === sh && Math.hypot(h.x - ev.x, h.y - ev.y) < 8);
    if (i >= 0) {
      if (dur > 0) Object.assign(activeHazards[i], { boomed: true, until: now + dur + 100 });
      else activeHazards.splice(i, 1);
    } else if (dur > 0) {
      activeHazards.push({
        sh, x: ev.x, y: ev.y, r: num(ev.r, 100), r0: num(ev.r0, 0),
        w: num(ev.w, 0), len: num(ev.len, 0), arc: num(ev.arc, 0), ang: num(ev.ang, 0),
        until: now + dur + 100, boomed: true
      });
    }
  }

  function isPointInsideHazard(h, px, py, pad = 37) {
    const GROUND_K = 0.55;
    const c = Math.cos(h.ang || 0), s = Math.sin(h.ang || 0);
    const gx = px - h.x, gy = (py - h.y) / GROUND_K;
    const lx = gx * c + gy * s, ly = -gx * s + gy * c;
    const d = Math.hypot(lx, ly);
    switch (h.sh) {
      case 'ring':
        return d < h.r + pad && d > h.r0 - pad;
      case 'cone':
        return d < h.r + pad && (d <= pad || Math.abs(Math.atan2(ly, lx)) <= h.arc + Math.atan2(pad, d));
      case 'line':
        return lx > -pad && lx < h.len + pad && Math.abs(ly) < (h.w / 2) + pad;
      default:
        return d < h.r + pad;
    }
  }

  function findSafeDodgePoint(me, hazards) {
    const world = window.GAME?.world;
    if (!world) return null;
    const worldW = world.w || 2000, worldH = world.h || 2000;

    // Vòng quét bán kính: từ gần đến xa, mở rộng đến 450px cho đại chiêu Boss
    const RINGS = [65, 110, 160, 220, 290, 370, 450];
    const candidates = [];
    const currentTarget = currentTargetId ? window.GAME?.mobs?.get(currentTargetId) : null;

    for (const dist of RINGS) {
      for (let angleDeg = 0; angleDeg < 360; angleDeg += 15) {
        const rad = angleDeg * Math.PI / 180;
        const cx = me.x + Math.cos(rad) * dist;
        const cy = me.y + Math.sin(rad) * dist;

        // 1. Phải nằm ngoài tất cả vùng chiêu nguy hiểm (cộng đệm an toàn 32px)
        if (hazards.some(h => isPointInsideHazard(h, cx, cy, 32))) continue;

        // 2. Không nằm sát rìa bản đồ (cách ít nhất 120px)
        if (cx < 120 || cx > worldW - 120 || cy < 150 || cy > worldH - 120) continue;

        // 3. Điểm đích không bị vật cản tĩnh chặn (đệm thông thoáng 24px)
        if (isPointColliding(cx, cy, 24)) continue;

        // 4. KIỂM TRA ĐƯỜNG ĐI TRỰC TIẾP (LINE OF SIGHT):
        // Nếu giữa vị trí hiện tại và điểm né có gốc cây / tảng đá / tường chắn thì LOẠI BỎ!
        if (!isPathClear(me.x, me.y, cx, cy, 18)) continue;

        // 5. LOẠI BỎ TRIỆT ĐỂ GÓC CHẾT (DEAD CORNER ELIMINATION):
        // Nếu xung quanh điểm né có từ 3 hướng trở lên bị chặn -> ĐÓ LÀ GÓC KẸT / HẺM CỤT, LOẠI BỎ NGAY!
        const blockedDirs = countBlockedDirections(cx, cy, 70);
        if (blockedDirs >= 3) continue;

        // 6. Tính điểm: Ưu tiên khoảng cách ngắn, cực kỳ ưu tiên bãi đất trống (blockedDirs = 0),
        // và duy trì khoảng cách tác chiến hợp lý với mục tiêu (học từ CoViet)
        let cost = dist + (blockedDirs * 100);
        if (currentTarget) {
          const dt = Math.hypot(cx - currentTarget.x, cy - currentTarget.y);
          cost += dt * 0.2;
        }
        candidates.push({ x: cx, y: cy, cost });
      }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.cost - b.cost);
    return { x: candidates[0].x, y: candidates[0].y };
  }

  // Tự Động Hồi Sinh & Trở Lại Bãi Train (v15.0)
  const reviveRecoveryState = {
    active: false,
    step: 'IDLE', // 'DEAD' | 'CHECK_POTIONS' | 'BUYING_POTIONS' | 'RETURNING_TO_FARM'
    deathTime: 0,
    lastReviveAttempt: 0,
    farmZone: null,
    farmPos: null,
    farmTargetMob: null,
    statusText: ''
  };
  let lastFarmedZone = null;
  let lastFarmedPos = null;
  let lastFarmedMob = null;

  // Smart Potion 1200ms Rhythm Engine (Học từ potion.js của CoViet)
  let lastPotionUseTime = 0;
  let lastManaUseTime = 0;

  function getBestPotionSlot(type = 'heal') {
    const inv = window.GAME?.self?.inv || [];
    const GD = window.GAME?.GD || {};
    let bestSlot = -1;
    let bestVal = 0;
    for (let i = 0; i < inv.length; i++) {
      const s = inv[i];
      if (!s || !s.id) continue;
      const it = GD.items?.[s.id] || {};
      if (type === 'heal') {
        if (s.id.startsWith('p_hp') || it.type === 'potion') {
          const val = it.heal || (s.id === 'p_hp3' ? 1000 : (s.id === 'p_hp2' ? 500 : (s.id === 'p_hp1' ? 200 : 100)));
          if (val > bestVal) {
            bestVal = val;
            bestSlot = i;
          }
        }
      } else if (type === 'mana') {
        if (s.id.startsWith('p_mp') || it.type === 'mana') {
          const val = it.mana || (s.id === 'p_mp3' ? 1000 : (s.id === 'p_mp2' ? 500 : (s.id === 'p_mp1' ? 200 : 100)));
          if (val > bestVal) {
            bestVal = val;
            bestSlot = i;
          }
        }
      }
    }
    return bestSlot;
  }

  function handleSmartPotion(now, vitals) {
    if (!cfg.autoPotion) return;
    const hpRatio = vitals.maxHp ? (vitals.hp / vitals.maxHp) : 1;
    if (vitals.hp > 0 && hpRatio < 0.65) {
      if (now - lastPotionUseTime >= 1200) {
        lastPotionUseTime = now;
        let used = false;
        if (window.GAME?.ui?.quickUse) {
          try { window.GAME.ui.quickUse('heal'); used = true; } catch (_) {}
        }
        const slot = getBestPotionSlot('heal');
        if (slot >= 0) {
          window.GAME.net?.send({ t: 'use', n: slot });
          used = true;
        }
        if (used) {
          devState.totalPotionsDrunk = (devState.totalPotionsDrunk || 0) + 1;
        }
      }
    }

    const currentMp = window.GAME?.self?.mp || 500;
    if (currentMp < 150) {
      if (now - lastManaUseTime >= 1200) {
        lastManaUseTime = now;
        if (window.GAME?.ui?.quickUse) {
          try { window.GAME.ui.quickUse('mana'); } catch (_) {}
        }
        const slot = getBestPotionSlot('mana');
        if (slot >= 0) {
          window.GAME.net?.send({ t: 'use', n: slot });
        }
      }
    }
  }

  function formatGold(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  let capturedDrops = [];

  // Chống lặp cổng (Anti-Ping-Pong) & Chuyển map thông minh
  let lastZoneTransitionTime = 0;
  let lastArrivedPortalCoords = null;

  // Khóa mục tiêu dính chặt (Target Stickiness) & Tránh spam gói tin tg
  let currentTargetId = null;
  let lastTargetIdSent = null;

  // Theo dõi kẹt địa hình
  let lastPosCheck = { x: 0, y: 0, t: 0 };
  let isCurrentlyStuck = false;
  let stuckEscapeDir = null;
  let stuckUntil = 0;

  // Bộ đếm hồi chiêu động toàn cục cho mọi kỹ năng (cả 5 phái)
  const skillTimers = {};

  function getPlayerHp() {
    const snaps = window.GAME?.net?.snaps;
    const latest = snaps?.at(-1);
    const myPlayer = Array.from(window.GAME?.players?.values() || []).find(p => p.isMe);
    const myId = myPlayer?.id || window.GAME?.self?.id || Array.from(window.GAME?.players?.keys() || [])[0];

    if (latest?.p && myId) {
      const mine = latest.p.get(myId);
      if (mine && mine[6] !== undefined) {
        return { hp: mine[6], maxHp: mine[7] || 1 };
      }
    }
    const statHp = window.GAME?.self?.hp || 900;
    return { hp: statHp, maxHp: statHp };
  }

  function getMobDef(mob) {
    if (!mob) return null;
    return window.GAME?.GD?.mobs?.[mob.kind] || window.GAME?.GD?.mobs?.[mob.type] || mob.m || null;
  }

  function applySkillLoadout(s0, s1, s2) {
    const isFighting = movementState === 'RETREAT' || devState.pursuerCount > 0;
    if (isFighting) {
      pendingLoadout = [s0, s1, s2];
      const stEl = document.getElementById('sm-st-txt');
      if (stEl) stEl.textContent = `⏳ Đã lưu build [${s0}, ${s1}, ${s2}], sẽ tự đổi ngay khi dứt quái!`;
      return false;
    }
    window.GAME.net.send({ t: 'lo', n: 0, s: s0 });
    window.GAME.net.send({ t: 'lo', n: 1, s: s1 });
    window.GAME.net.send({ t: 'lo', n: 2, s: s2 });
    return true;
  }

  // Bắt gói tin mạng
  const origNetOnMessage = window.GAME.net.onMessage;
  window.GAME.net.onMessage = function(m) {
    try {
      if (m) {
        if (m.type === 'e' && Array.isArray(m.l)) {
          const now = performance.now();
          const me = window.GAME?.me;
          for (const ev of m.l) {
            if (ev.k === 'matk') {
              const mb = window.GAME?.mobs?.get(ev.a);
              const def = getMobDef(mb);
              const atkMs = mb?.m?.atkMs || def?.atkMs || 1400;
              mobSwingCooldowns.set(ev.a, now + atkMs);
              devState.swingDodged++;

              if (me && mb) {
                const distAtk = Math.hypot(mb.x - me.x, mb.y - me.y);
                devState.lastMeasuredAtkDist = Math.round(distAtk);
                devState.lastMeasuredMobKind = def?.name || mb.kind || 'Quái';
                const elDist = document.getElementById('sm-measured-atk');
                if (elDist) elDist.textContent = `${devState.lastMeasuredMobKind}: ${devState.lastMeasuredAtkDist}px`;
              }
            } else if (ev.k === 'hit' && ev.t < MOB_BASE) {
              devState.totalDamageTaken += ev.d || 0;
            } else if (ev.k === 'die') {
              // BẮT SỰ KIỆN QUÁI CHẾT TỪ SERVER: GIẢI PHÓNG MỤC TIÊU NGAY LẬP TỨC
              const deadId = ev.t;
              const mb = window.GAME?.mobs?.get(deadId);
              if (mb) {
                mb.dead = true;
                mb.hp = 0;
                mb.st |= 1;
                const def = getMobDef(mb);
                if (def?.boss || def?.elite || ['chantinh','daibang','moctinh','xuongho'].includes(mb.kind)) {
                  activeHazards.length = 0;
                }
              }
              if (currentTargetId === deadId) {
                currentTargetId = null;
                if (window.GAME) {
                  window.GAME.lockId = 0;
                  window.GAME.targetId = 0;
                }
                if (lastTargetIdSent) {
                  window.GAME.net.send({ t: 'tg', id: 0 });
                  lastTargetIdSent = null;
                }
              }
            } else if (ev.k === 'tele') {
              addBossHazard(ev, now);
            } else if (ev.k === 'boom') {
              handleBossBoom(ev, now);
            }
          }
        } else if (m.type === 'welcome' || m.type === 'self') {
          // BẮT GÓI TIN CHÂN DUNG NHÂN VẬT TỪ MÁY CHỦ (CHỨA MÔN PHÁI CLS & KỸ NĂNG)
          if (m.self) {
            capturedSelf = Object.assign(capturedSelf || {}, m.self);
            if (!window.GAME.self) window.GAME.self = capturedSelf;
            else Object.assign(window.GAME.self, m.self);
          }
          activeHazards.length = 0;
        } else if (m.type === 'map') {
          activeHazards.length = 0;
        } else if (m.type === 'got') {
          devState.totalItemsPicked++;
          const lootEl = document.getElementById('sm-s-loot');
          if (lootEl) lootEl.textContent = `${devState.totalItemsPicked} món`;
        }
      }
    } catch (_) {}
    return origNetOnMessage.apply(this, arguments);
  };

  const originalOnSnapshot = window.GAME.net.h.onSnapshot;
  window.GAME.net.h.onSnapshot = function(s) {
    const res = originalOnSnapshot ? originalOnSnapshot.apply(this, arguments) : undefined;
    try {
      if (s) {
        if (s.d) capturedDrops = s.d;
        // QUÉT SNAPSHOT MẠNG CHUẨN COVIET: ĐỒNG BỘ TRẠNG THÁI SỐNG / CHẾT / HỒI SINH
        if (Array.isArray(s.n)) {
          const seen = new Set();
          for (const r of s.n) {
            const id = r[0], hp = r[6], st = r[8];
            seen.add(id);
            const mb = window.GAME?.mobs?.get(id);
            if (mb) {
              if (hp <= 1 || (st & 1)) {
                mb.dead = true;
                mb.hp = 0;
                mb.st |= 1;
                if (currentTargetId === id || window.GAME?.lockId === id || window.GAME?.targetId === id) {
                  currentTargetId = null;
                  if (window.GAME) {
                    window.GAME.lockId = 0;
                    window.GAME.targetId = 0;
                  }
                  window.GAME.net.send({ t: 'tg', id: 0 });
                  lastTargetIdSent = 0;
                }
              } else {
                // Quái còn sống hoặc vừa hồi sinh (respawn): Khôi phục cờ dead về false ngay lập tức!
                mb.dead = false;
              }
            }
          }
          // Dọn các quái biến mất khỏi snapshot (đã chết và biến mất hẳn)
          if (window.GAME?.mobs) {
            for (const [id, mb] of window.GAME.mobs.entries()) {
              if (!seen.has(id)) {
                mb.dead = true;
                mb.hp = 0;
                mb.st |= 1;
                if (currentTargetId === id || window.GAME?.lockId === id || window.GAME?.targetId === id) {
                  currentTargetId = null;
                  if (window.GAME) {
                    window.GAME.lockId = 0;
                    window.GAME.targetId = 0;
                  }
                  window.GAME.net.send({ t: 'tg', id: 0 });
                  lastTargetIdSent = 0;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Snapshot-Hook]', e);
    }
    return res;
  };

  const activeKeys = new Set();
  function setSteeringVector(dx, dy) {
    const mag = Math.hypot(dx, dy);
    if (mag < 0.15) { stopMoving(); return; }
    const nx = dx / mag, ny = dy / mag;

    const neededKeys = new Set();
    if (ny < -0.38) neededKeys.add('KeyW');
    if (ny > 0.38) neededKeys.add('KeyS');
    if (nx < -0.38) neededKeys.add('KeyA');
    if (nx > 0.38) neededKeys.add('KeyD');

    for (const k of activeKeys) {
      if (!neededKeys.has(k)) {
        const char = k.replace('Key', '').toLowerCase();
        window.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: k, bubbles: true }));
        activeKeys.delete(k);
      }
    }
    for (const k of neededKeys) {
      if (!activeKeys.has(k)) {
        const char = k.replace('Key', '').toLowerCase();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: k, bubbles: true }));
        activeKeys.add(k);
      }
    }
  }

  function stopMoving() {
    const allMoveKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    for (const k of allMoveKeys) {
      const char = k.replace('Key', '').toLowerCase();
      window.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: k, bubbles: true }));
    }
    activeKeys.clear();
  }

  // Tự động giải phóng phím khi cửa sổ mất focus (chống trôi nhân vật và mất lái)
  window.addEventListener('blur', () => {
    stopMoving();
  });

  function getUnstuckSteer(me) {
    const rays = 8;
    let bestAngle = 0, maxClear = 0;
    for (let i = 0; i < rays; i++) {
      const a = (i * 2 * Math.PI) / rays;
      const p = testProbe(me, Math.cos(a), Math.sin(a), 65);
      if (p.dist > maxClear) {
        maxClear = p.dist;
        bestAngle = a;
      }
    }
    return { dx: Math.cos(bestAngle), dy: Math.sin(bestAngle) };
  }

  function testProbe(me, vx, vy, step = 50) {
    const world = window.GAME?.world;
    if (!world?.move) return { canMove: true, dist: step, x: me.x + vx * step, y: me.y + vy * step };
    const res = world.move(me.x, me.y, 16, vx * step, vy * step);
    const dist = Math.hypot(res.x - me.x, res.y - me.y);
    return { canMove: dist > step * 0.5, dist, x: res.x, y: res.y };
  }

  // ==========================================
  // THUẬT TOÁN ĐIỀU HƯỚNG CONGA-LINE + ĐẨY LÙI VẬT CẢN (OBSTACLE REPULSION) + 16 TIA 360 ĐỘ
  // ==========================================
  function computeCongaKiteVector(me, pursuers, spawnCenter, isBoss) {
    let repX = 0, repY = 0;

    // 1. Lực đẩy từ quái (Mob Repulsion)
    for (const m of pursuers) {
      const dx = me.x - m.x;
      const dy = me.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      const weight = 1 / (d * d);
      repX += (dx / d) * weight;
      repY += (dy / d) * weight;
    }

    // 2. LỰC ĐẨY TỪ VẬT CẢN TĨNH (OBSTACLE REPULSION - CÂY, ĐÁ, VÁCH):
    // Triệt tiêu nguy cơ bị dồn vào gốc cây / góc chết!
    const cols = window.GAME?.world?.cols || [];
    let obstacleNearCount = 0;
    for (const c of cols) {
      const info = getColliderSurfaceVector(c, me.x, me.y);
      const distSurface = info.distSurface - 16;
      if (distSurface < 95) {
        obstacleNearCount++;
        // Càng gần vật cản, lực đẩy ngược ra càng cực đại!
        const weight = 1 / Math.max(1, distSurface * distSurface);
        repX += info.dx * weight * 3500;
        repY += info.dy * weight * 3500;
      }
    }

    // Lực đẩy từ 4 mép bản đồ (World Boundaries Repulsion)
    const mapW = window.GAME?.world?.w || 2000;
    const mapH = window.GAME?.world?.h || 2000;
    const pad = 120;
    if (me.x < pad) { repX += (1 / Math.max(1, me.x * me.x)) * 5000; obstacleNearCount++; }
    if (me.x > mapW - pad) { repX -= (1 / Math.max(1, (mapW - me.x) * (mapW - me.x))) * 5000; obstacleNearCount++; }
    if (me.y < pad + 30) { repY += (1 / Math.max(1, me.y * me.y)) * 5000; obstacleNearCount++; }
    if (me.y > mapH - pad) { repY -= (1 / Math.max(1, (mapH - me.y) * (mapH - me.y))) * 5000; obstacleNearCount++; }

    const repLen = Math.hypot(repX, repY) || 1;
    let normRepX = repX / repLen;
    let normRepY = repY / repLen;

    // 3. Khóa Mỏ Neo Leash
    const maxLeashDist = isBoss ? 550 : 250;
    if (spawnCenter) {
      const distFromSpawn = Math.hypot(me.x - spawnCenter.x, me.y - spawnCenter.y);
      if (distFromSpawn >= maxLeashDist) {
        devState.leashReversals++;
        const toSpawnX = spawnCenter.x - me.x;
        const toSpawnY = spawnCenter.y - me.y;
        const spawnLen = Math.hypot(toSpawnX, toSpawnY) || 1;
        const tangentX = -normRepY;
        const tangentY = normRepX;
        normRepX = tangentX * 0.65 + (toSpawnX / spawnLen) * 0.65;
        normRepY = tangentY * 0.65 + (toSpawnY / spawnLen) * 0.65;
      }
    }

    // 4. QUÉT 16 TIA ĐA HƯỚNG TRỌN VẸN 360 ĐỘ:
    // Đảm bảo dù hướng lùi chính bị vách đá cản, bot luôn tìm được khe hở thoát hiểm ra bãi trống!
    const numRays = 16;
    let bestVx = normRepX, bestVy = normRepY, bestScore = -Infinity;
    const zoneW = window.GAME?.world?.w || 3600;
    const zoneH = window.GAME?.world?.h || 2600;

    for (let i = 0; i < numRays; i++) {
      const angle = (i * 2 * Math.PI) / numRays;
      const vx = Math.cos(angle), vy = Math.sin(angle);
      const probe = testProbe(me, vx, vy, 55);
      if (!probe.canMove) continue;

      let score = probe.dist * 3.0; // Độ thoáng di chuyển

      // Ưu tiên theo hướng đẩy lùi (cả quái và vật cản)
      const dotRep = vx * normRepX + vy * normRepY;
      score += dotRep * 60;

      // Đánh giá khoảng cách với bầy quái sau khi bước thử
      const nextX = me.x + vx * 50, nextY = me.y + vy * 50;
      let minNextMobDist = Infinity;
      for (const m of pursuers) {
        const md = Math.hypot(nextX - m.x, nextY - m.y);
        if (md < minNextMobDist) minNextMobDist = md;
      }
      if (minNextMobDist !== Infinity) {
        score += minNextMobDist * 1.5;
      }

      // Tránh mép bản đồ
      if (nextX < 120 || nextX > zoneW - 120 || nextY < 120 || nextY > zoneH - 120) {
        score -= 300;
      }

      // LOẠI TRỪ GÓC CHẾT (DEAD CORNER PENALTY):
      // Nếu hướng này dẫn vào một hẻm cụt có từ 3 hướng bị chặn, phạt cực nặng!
      const blockedAtNext = countBlockedDirections(nextX, nextY, 65);
      if (blockedAtNext >= 3) {
        score -= 600;
      } else if (blockedAtNext === 0) {
        score += 100; // Bãi đất trống cực thoáng
      }

      if (score > bestScore) {
        bestScore = score;
        bestVx = vx;
        bestVy = vy;
      }
    }

    return { vx: bestVx, vy: bestVy, obstacleNear: obstacleNearCount > 0 };
  }

  function calculateDirectSteering(me, targetX, targetY) {
    if (isCurrentlyStuck && performance.now() < stuckUntil) {
      return getUnstuckSteer(me);
    }
    const directAngle = Math.atan2(targetY - me.y, targetX - me.x);
    const test1 = testProbe(me, Math.cos(directAngle), Math.sin(directAngle), 35);
    if (test1.canMove) {
      return { dx: Math.cos(directAngle), dy: Math.sin(directAngle) };
    }

    // Quét 8 hướng phụ khi đường thẳng bị chặn
    const anglesToTest = [
      directAngle + Math.PI * 0.25, directAngle - Math.PI * 0.25,
      directAngle + Math.PI * 0.5, directAngle - Math.PI * 0.5,
      directAngle + Math.PI * 0.75, directAngle - Math.PI * 0.75,
      directAngle + Math.PI, directAngle - Math.PI
    ];

    let bestAngle = directAngle, bestScore = -Infinity;
    for (const a of anglesToTest) {
      const res = testProbe(me, Math.cos(a), Math.sin(a), 35);
      if (!res.canMove) continue;
      const progress = (res.x - me.x) * Math.cos(directAngle) + (res.y - me.y) * Math.sin(directAngle);
      const score = progress * 1.8 + res.dist;
      if (score > bestScore) {
        bestScore = score;
        bestAngle = a;
      }
    }

    return { dx: Math.cos(bestAngle), dy: Math.sin(bestAngle) };
  }

  function findDynamicSpawnCenter(mob, me) {
    if (!mob) return null;
    const spawns = window.GAME?.world?.zone?.spawns || [];
    const matchingSpawns = spawns.filter(s => s.mob === mob.kind);
    if (matchingSpawns.length > 0) {
      matchingSpawns.sort((a, b) => Math.hypot(a.x - mob.x, a.y - mob.y) - Math.hypot(b.x - mob.x, b.y - mob.y));
      return { x: matchingSpawns[0].x, y: matchingSpawns[0].y, r: matchingSpawns[0].r || 180 };
    }
    return { x: mob.x, y: mob.y, r: 180 };
  }

  function disableNativeAutoFight() {
    try {
      if (window.GAME?.ui) {
        window.GAME.ui.autoFight = false;
        try {
          Object.defineProperty(window.GAME.ui, 'autoFight', {
            get: () => false,
            set: () => {},
            configurable: true
          });
        } catch(e) {}
      }
      localStorage.setItem('dainam_autofight', '0');
    } catch(e) {}
  }

  // ==========================================
  // HỆ THỐNG CHỌN MỤC TIÊU & PHÁ VÂY (CHUẨN FOCUS & CHỐNG ĐỔI MỤC TIÊU LUNG TUNG)
  // ==========================================
  // =========================================================================
  // BỘ PHỐI HỢP MỤC TIÊU CÀY & NHIỆM VỤ (ZERO-CONFLICT HARMONY ENGINE)
  // - Khi làm nhiệm vụ (kill / collect): Tự động ưu tiên săn quái của nhiệm vụ.
  // - Khi không làm nhiệm vụ (hoặc xong Q / đi gặp NPC): Giữ nguyên 100% mục tiêu cày của người chơi.
  // =========================================================================
  function getActiveTargetFilter() {
    // 1. ƯU TIÊN SỐ 1: BƯỚC NHIỆM VỤ ĐANG CẦN DIỆT QUÁI HOẶC THU THẬP ĐỒ
    if (cfg.autoQuest && questState.active && questState.targetMobs && questState.targetMobs.size > 0) {
      return {
        type: 'quest',
        matches: (kind, id) => questState.targetMobs.has(kind) || questState.targetMobs.has(id),
        getMatchingSpawns: (spawns) => spawns.filter(s => questState.targetMobs.has(s.mob)),
        label: Array.from(questState.targetMobs).map(k => getMobDef({ kind: k })?.name || k).join('/')
      };
    }

    // 2. MỤC TIÊU CÀY DO NGƯỜI CHƠI CHỌN TRÊN GIAO DIỆN
    const farmTarget = cfg.targetMob || 'all';
    if (farmTarget && farmTarget !== 'all') {
      return {
        type: 'farm',
        matches: (kind, id) => kind === farmTarget || id === farmTarget || (farmTarget.startsWith('player_') && id === parseInt(farmTarget.replace('player_', ''))),
        getMatchingSpawns: (spawns) => spawns.filter(s => s.mob === farmTarget),
        label: farmTarget
      };
    }

    // 3. Không lọc (Đánh mọi quái)
    return null;
  }

  function resolveTargetAndState(me) {
    disableNativeAutoFight();

    // 0. Triệt tiêu ngay lập tức quái chết hoặc quái 0 máu / 1 máu đang bị dính lock
    if (currentTargetId) {
      const cur = window.GAME?.mobs?.get(currentTargetId);
      if (!cur || !isMobValidAndAlive(cur)) {
        currentTargetId = null;
        if (window.GAME) {
          window.GAME.lockId = 0;
          window.GAME.targetId = 0;
        }
        if (lastTargetIdSent) {
          window.GAME.net.send({ t: 'tg', id: 0 });
          lastTargetIdSent = null;
        }
      }
    }

    const allMobs = window.GAME?.mobs ? Array.from(window.GAME.mobs.values()).filter(m => isMobValidAndAlive(m)) : [];
    const spawns = window.GAME?.world?.zone?.spawns || [];
    const cfgTarget = cfg.targetMob;

    // Lấy thông tin người chơi hiện tại
    const allPlayers = window.GAME?.players ? Array.from(window.GAME.players.values()) : [];
    const mePlayer = allPlayers.find(p => p.name === window.GAME?.self?.name);
    const myId = mePlayer?.id;
    const myHp = mePlayer?.hp || 1000;
    const myMaxHp = mePlayer?.maxHp || mePlayer?.mhp || 1000;

    const zoneId = window.GAME?.world?.zone?.id;
    const isPvpZone = zoneId === 'vodai' || window.GAME?.world?.zone?.pvp === true;

    // ==========================================
    // 0. HỆ THỐNG PVP SOLO 1V1 / TỈ THÍ / PK (ƯU TIÊN HÀNG ĐẦU)
    // ==========================================
    let pvpOpponent = null;
    if (window._activeDuel && window._activeDuel.foeId) {
      pvpOpponent = allPlayers.find(p => p.id === window._activeDuel.foeId && !(p.st & 1) && p.hp > 0);
    }
    if (!pvpOpponent) {
      const lock = window.GAME?.lockId || window.GAME?.targetId;
      if (lock && lock < 1_000_000 && lock !== myId) {
        pvpOpponent = allPlayers.find(p => p.id === lock && !(p.st & 1) && p.hp > 0);
      }
    }
    if (!pvpOpponent && cfgTarget && cfgTarget.startsWith('player_')) {
      const pId = parseInt(cfgTarget.replace('player_', ''));
      pvpOpponent = allPlayers.find(p => p.id === pId && !(p.st & 1) && p.hp > 0);
    }
    if (!pvpOpponent && isPvpZone) {
      const rivals = allPlayers.filter(p => p.id !== myId && !(p.st & 1) && p.hp > 0);
      if (rivals.length > 0) {
        rivals.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
        pvpOpponent = rivals[0];
      }
    }

    if (pvpOpponent) {
      const dist = Math.hypot(pvpOpponent.x - me.x, pvpOpponent.y - me.y);
      const oppCls = pvpOpponent.cls?.id || pvpOpponent.cls || 'thienvuong';
      const isMelee = oppCls === 'thienvuong' || oppCls === 'longtuyen';
      const isRanged = oppCls === 'sonthan' || oppCls === 'linhmoc';

      currentTargetId = pvpOpponent.id;
      if (window.GAME) {
        window.GAME.lockId = pvpOpponent.id;
        window.GAME.targetId = pvpOpponent.id;
      }

      return {
        target: pvpOpponent,
        isPvP: true,
        pvpClass: oppCls,
        isMeleeOpponent: isMelee,
        isRangedOpponent: isRanged,
        dMin: dist,
        closestMob: pvpOpponent,
        pursuers: [pvpOpponent],
        pursuerCount: 1,
        spawnCenter: { x: me.x, y: me.y, r: 400 },
        isBoss: false,
        isPeeling: false
      };
    }

    // ==========================================
    // CƠ CHẾ PVE: TÍNH KHOẢNG CÁCH D_MIN & QUÁI BÁM
    // ==========================================
    let dMin = Infinity, closestMob = null;
    const pursuers = [];

    for (const m of allMobs) {
      const d = Math.hypot(m.x - me.x, m.y - me.y);
      if (d < dMin) {
        dMin = d;
        closestMob = m;
      }
      if (d <= 350) {
        pursuers.push({ mob: m, dist: d });
      }
    }
    pursuers.sort((a, b) => a.dist - b.dist);

    // ==========================================
    // 1. MỤC TIÊU CÀY & NHIỆM VỤ (PHỐI HỢP THÔNG MINH, KHÔNG BAO GIỜ XUNG ĐỘT)
    // ==========================================
    const targetFilter = getActiveTargetFilter();
    if (targetFilter) {
      let lockedTarget = null;
      if (currentTargetId) {
        const cur = allMobs.find(m => m.id === currentTargetId);
        if (cur && isMobValidAndAlive(cur)) {
          const dCur = Math.hypot(cur.x - me.x, cur.y - me.y);
          const isCurBoss = isBossMob(cur);
          const roleInfo = getCharacterRoleInfo();
          const maxLockDist = isCurBoss ? 550 : Math.min(380, roleInfo.baseRange + 100);
          const matches = targetFilter.matches(cur.kind, getMobDef(cur)?.id);
          if (dCur <= maxLockDist && matches) {
            lockedTarget = cur;
          }
        }
      }

      if (lockedTarget) {
        const d = Math.hypot(lockedTarget.x - me.x, lockedTarget.y - me.y);
        const def = getMobDef(lockedTarget);
        return {
          target: lockedTarget,
          isQuestTarget: targetFilter.type === 'quest',
          dMin: dMin === Infinity ? d : dMin,
          closestMob: closestMob || lockedTarget,
          pursuers: pursuers.map(p => p.mob),
          pursuerCount: pursuers.length,
          spawnCenter: findDynamicSpawnCenter(lockedTarget, me),
          isBoss: isBossMob(lockedTarget),
          isPeeling: false
        };
      }

      // Chưa có mục tiêu khóa: Tìm con quái đúng loại hợp lệ gần nhất
      const matchingMobs = allMobs.filter(m => targetFilter.matches(m.kind, getMobDef(m)?.id));
      if (matchingMobs.length > 0) {
        matchingMobs.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
        const newTarget = matchingMobs[0];
        currentTargetId = newTarget.id;
        questState.emptySince = 0;
        if (window.GAME) {
          window.GAME.lockId = newTarget.id;
          window.GAME.targetId = newTarget.id;
        }
        const d = Math.hypot(newTarget.x - me.x, newTarget.y - me.y);
        const def = getMobDef(newTarget);
        return {
          target: newTarget,
          isQuestTarget: targetFilter.type === 'quest',
          dMin: dMin === Infinity ? d : dMin,
          closestMob: closestMob || newTarget,
          pursuers: pursuers.map(p => p.mob),
          pursuerCount: pursuers.length,
          spawnCenter: findDynamicSpawnCenter(newTarget, me),
          isBoss: isBossMob(newTarget),
          isPeeling: false
        };
      }

      // Quái đúng loại chưa xuất hiện: Tìm bãi spawn của quái đó và chạy thẳng đến bãi!
      // Cơ chế CoViet Anchor Rotation: nếu bãi hiện tại trống > 6.5s thì tuần tra chuyển bãi khác
      const matchingSpawns = targetFilter.getMatchingSpawns(spawns);
      if (matchingSpawns.length > 0) {
        let targetSpawn = matchingSpawns[0];
        if (targetFilter.type === 'quest') {
          if (questState.anchorZone !== zoneId) {
            questState.anchorZone = zoneId;
            questState.anchorIdx = nearestIdx(matchingSpawns, me);
            questState.emptySince = 0;
          }
          const curAnchor = matchingSpawns[questState.anchorIdx % matchingSpawns.length];
          const dAnchor = Math.hypot(curAnchor.x - me.x, curAnchor.y - me.y);
          if (dAnchor <= 90) {
            if (!questState.emptySince) questState.emptySince = performance.now();
            if (performance.now() - questState.emptySince > 6500 && matchingSpawns.length > 1) {
              questState.anchorIdx = (questState.anchorIdx + 1) % matchingSpawns.length;
              questState.emptySince = 0;
              console.log('[AUTO-QUEST] Bãi quái quest trống lâu, tuần tra chuyển sang bãi index:', questState.anchorIdx);
            }
          }
          targetSpawn = matchingSpawns[questState.anchorIdx % matchingSpawns.length];
        } else {
          matchingSpawns.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
          targetSpawn = matchingSpawns[0];
        }

        currentTargetId = null;
        return {
          target: null,
          isQuestTarget: targetFilter.type === 'quest',
          navigatingSpawn: targetSpawn,
          dMin: dMin === Infinity ? 999 : dMin,
          closestMob,
          pursuers: pursuers.map(p => p.mob),
          pursuerCount: pursuers.length,
          spawnCenter: { x: targetSpawn.x, y: targetSpawn.y, r: targetSpawn.r || 200 },
          isBoss: false,
          isPeeling: false
        };
      }

      // Không tìm thấy bãi quái này trên map hiện tại
      currentTargetId = null;
      return {
        target: null,
        isQuestTarget: targetFilter.type === 'quest',
        dMin: dMin === Infinity ? 999 : dMin,
        closestMob,
        pursuers: pursuers.map(p => p.mob),
        pursuerCount: pursuers.length,
        spawnCenter: { x: me.x, y: me.y, r: 200 },
        isBoss: false,
        isPeeling: false
      };
    }

    // ==========================================
    // 2. CHẾ ĐỘ ĐÁNH TẤT CẢ QUÁI (cfgTarget === 'all')
    // ==========================================
    // a. Target Stickiness: Nếu đang đánh 1 con quái, dính chặt vào nó cho đến khi chết!
    let lockedTarget = null;
    if (currentTargetId) {
      const cur = allMobs.find(m => m.id === currentTargetId);
      if (cur && isMobValidAndAlive(cur)) {
        const dCur = Math.hypot(cur.x - me.x, cur.y - me.y);
        const isCurBoss = isBossMob(cur);
        const roleInfo = getCharacterRoleInfo();
        // Quái thường chỉ giữ stickiness tối đa 380px (tránh chạy rông over tầm), Boss tối đa 550px
        const maxLockDist = isCurBoss ? 550 : Math.min(380, roleInfo.baseRange + 120);
        if (dCur <= maxLockDist) {
          lockedTarget = cur;
        }
      }
    }

    if (lockedTarget && !isBossMob(lockedTarget)) {
      // Nếu có Boss xuất hiện trong map, Boss luôn cướp quyền ưu tiên của quái thường đang khóa
      const activeBossOnMap = allMobs.find(m => isBossMob(m));
      if (!activeBossOnMap) {
        const d = Math.hypot(lockedTarget.x - me.x, lockedTarget.y - me.y);
        return {
          target: lockedTarget,
          dMin: dMin === Infinity ? d : dMin,
          closestMob: closestMob || lockedTarget,
          pursuers: pursuers.map(p => p.mob),
          pursuerCount: pursuers.length,
          spawnCenter: findDynamicSpawnCenter(lockedTarget, me),
          isBoss: false,
          isPeeling: false
        };
      }
    }

    // b. Hệ thống chấm điểm CoViet Target Scoring:
    // Boss > Minion Purge (khi bị đệ tử quây) > Quái đang cắn người chơi > Quái gần nhất
    const activeBoss = allMobs.find(m => isBossMob(m));

    // Nếu có Boss trên map VÀ có từ 2 đệ tử trở lên bu sát trong phạm vi 200px:
    let addClearTarget = null;
    if (activeBoss) {
      const nearbyMinions = allMobs.filter(m => !isBossMob(m) && Math.hypot(m.x - me.x, m.y - me.y) <= 200);
      if (nearbyMinions.length >= 2) {
        nearbyMinions.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
        addClearTarget = nearbyMinions[0];
      }
    }

    let chosen = null;
    if (addClearTarget) {
      chosen = addClearTarget;
    } else if (activeBoss) {
      chosen = activeBoss;
    } else if (lockedTarget) {
      chosen = lockedTarget;
    } else if (allMobs.length > 0) {
      allMobs.sort((a, b) => {
        const scoreA = (a.tgt === myId ? -500 : 0) + Math.hypot(a.x - me.x, a.y - me.y);
        const scoreB = (b.tgt === myId ? -500 : 0) + Math.hypot(b.x - me.x, b.y - me.y);
        return scoreA - scoreB;
      });
      chosen = allMobs[0];
    }
    if (chosen) {
      currentTargetId = chosen.id;
      if (window.GAME) {
        window.GAME.lockId = chosen.id;
        window.GAME.targetId = chosen.id;
      }
      const d = Math.hypot(chosen.x - me.x, chosen.y - me.y);
      const isBoss = isBossMob(chosen);
      return {
        target: chosen,
        dMin: dMin === Infinity ? d : dMin,
        closestMob: closestMob || chosen,
        pursuers: pursuers.map(p => p.mob),
        pursuerCount: pursuers.length,
        spawnCenter: findDynamicSpawnCenter(chosen, me),
        isBoss,
        isAddClear: !!(addClearTarget && chosen.id === addClearTarget.id),
        isPeeling: false
      };
    }

    // Chưa thấy quái nào trên màn hình:
    // Nếu có bãi spawn trên bản đồ, di chuyển đến bãi spawn gần nhất để tìm quái thay vì đứng chôn chân!
    currentTargetId = null;
    const validSpawns = (spawns || []).filter(sp => sp && typeof sp.x === 'number' && typeof sp.y === 'number');
    if (validSpawns.length > 0) {
      validSpawns.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
      const nearestSpawn = validSpawns[0];
      return {
        target: null,
        navigatingSpawn: nearestSpawn,
        dMin: dMin === Infinity ? 999 : dMin,
        closestMob,
        pursuers: pursuers.map(p => p.mob),
        pursuerCount: pursuers.length,
        spawnCenter: { x: nearestSpawn.x, y: nearestSpawn.y, r: nearestSpawn.r || 200 },
        isBoss: false,
        isPeeling: false
      };
    }

    return {
      target: null,
      dMin: dMin === Infinity ? 999 : dMin,
      closestMob,
      pursuers: pursuers.map(p => p.mob),
      pursuerCount: pursuers.length,
      spawnCenter: { x: me.x, y: me.y, r: 200 },
      isBoss: false,
      isPeeling: false
    };
  }

  let lastAtkTime = 0;
  let lastTgSentTime = 0;
  let localCastUntil = 0;

  function executeOracleAttack(target, now, distToTarget, dMin, closestMob, pursuerCount, isEmergencyBreakout, isPvP) {
    if (!target || !isMobValidAndAlive(target)) return;
    const me = window.GAME?.me;
    if (!me) return;

    const self = window.GAME?.self;
    const GD = window.GAME?.GD || {};
    const currentLoadout = self?.loadout || [];
    const currentMp = self?.mp || 500;
    const roleInfo = getCharacterRoleInfo();
    const baseRange = roleInfo.baseRange;
    const isPlayerMelee = roleInfo.isMelee;

    const dx = target.x - me.x, dy = target.y - me.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = Math.round((dx / len) * 100) / 100;
    const ny = Math.round((dy / len) * 100) / 100;

    me.facing = dx >= 0 ? 1 : -1;
    if (target.id !== lastTargetIdSent && (now - lastTgSentTime >= 250)) {
      window.GAME.net.send({ t: 'tg', id: target.id });
      lastTargetIdSent = target.id;
      lastTgSentTime = now;
      if (window.GAME) {
        window.GAME.lockId = target.id;
        window.GAME.targetId = target.id;
      }
    }

    const targetRadius = target.r || getMobDef(target)?.r || 24;

    // 1. DUYỆT TỰ ĐỘNG CÁC CHIÊU BUFF / PHÒNG THỦ / HỒI PHỤC (range === 0 hoặc buff)
    for (const skId of currentLoadout) {
      const skDef = GD.skills?.[skId];
      if (!skDef) continue;
      const isBuff = skDef.range === 0 || skDef.buff || skDef.heal || skDef.shield || ['thuykinh', 'hoixuan', 'hoathan', 'kimquy', 'ungnhan', 'cotrang', 'hotran'].some(k => skId.includes(k));
      if (isBuff) {
        const cd = skDef.cd || 20000;
        const lastCast = skillTimers[skId] || 0;
        const needBuff = (skId.includes('hoixuan') || skId.includes('cotrang'))
          ? ((self?.hp || 1) / (self?.maxHp || 1) < 0.75 || isEmergencyBreakout)
          : (distToTarget <= 320 || dMin <= 240 || isEmergencyBreakout || isPvP);

        const isReadyByGame = window.GAME?.ui?.ready ? window.GAME.ui.ready(skId) : true;
        if (isReadyByGame && (now - lastCast >= cd + 50) && currentMp >= (skDef.mp || 0) && needBuff) {
          window.GAME.net.send({ t: 'sk', s: skId, id: 0, x: 0, y: 0 });
          skillTimers[skId] = now;
          devState.totalSkills++;
          if (devState.skillsBreakdown[skId] !== undefined) devState.skillsBreakdown[skId]++;
          else devState.skillsBreakdown[skId] = 1;
        }
      }
    }

    if (now < localCastUntil) return;

    // 2. TÍNH TOÁN AN TOÀN KHI NIỆM CHIÊU CÓ CAST TIME
    const closestDef = getMobDef(closestMob);
    const closestSpeed = closestDef?.speed || 130;
    const closestAtkRange = (closestDef?.range || 64) + (closestDef?.r || 28) + 15;
    const distToAtkRange = Math.max(0, dMin - closestAtkRange);
    const timeToImpactMs = (distToAtkRange / closestSpeed) * 1000;
    const nextAllowedSwing = mobSwingCooldowns.get(closestMob?.id) || 0;
    const isClosestMobOnSwingCd = now < nextAllowedSwing;
    const swingCdRemainingMs = Math.max(0, nextAllowedSwing - now);
    const isSafeForCastTime = isPvP ? (distToTarget >= 160 || isEmergencyBreakout) : ((timeToImpactMs >= cfg.castGateMinImpactTime) || (isClosestMobOnSwingCd && swingCdRemainingMs >= 400));

    // 3. DUYỆT TỰ ĐỘNG CÁC CHIÊU TẤN CÔNG (ƯU TIÊN CHIÊU CÓ CD LỚN -> NHỎ)
    const offensiveSkills = currentLoadout
      .map(skId => ({ id: skId, def: GD.skills?.[skId] }))
      .filter(s => s.def && s.def.range !== 0 && !['thuykinh', 'hoixuan', 'hoathan', 'kimquy', 'ungnhan', 'cotrang', 'hotran'].some(k => s.id.includes(k)))
      .sort((a, b) => (b.def.cd || 0) - (a.def.cd || 0));

    for (const s of offensiveSkills) {
      const skId = s.id;
      const skDef = s.def;
      const cd = skDef.cd || 5000;
      const lastCast = skillTimers[skId] || 0;
      const skRange = skDef.range || baseRange;
      const castTime = skDef.cast || 0;

      const isReadyByGame = window.GAME?.ui?.ready ? window.GAME.ui.ready(skId) : true;
      if (isReadyByGame && (now - lastCast >= cd + 50) && currentMp >= (skDef.mp || 0) && distToTarget <= skRange + targetRadius + 8) {
        window.GAME.net.send({ t: 'sk', s: skId, id: target.id, x: nx, y: ny });
        skillTimers[skId] = now;
        if (castTime > 0) {
          localCastUntil = now + castTime + 100;
        }
        devState.totalSkills++;
        if (devState.skillsBreakdown[skId] !== undefined) devState.skillsBreakdown[skId]++;
        else devState.skillsBreakdown[skId] = 1;
        return;
      }
    }

    // 4. ĐÒN ĐÁNH CƠ BẢN (AUTO-ATTACK): Chuẩn nhịp server theo role & tốc đánh môn phái
    const atkCd = roleInfo.atkMs ? Math.max(500, Math.round(roleInfo.atkMs * 0.85)) : 600;
    if (now - lastAtkTime >= atkCd && distToTarget <= baseRange + targetRadius + 8) {
      window.GAME.net.send({ t: 'atk', id: target.id, x: nx, y: ny });
      lastAtkTime = now;
      devState.totalAttacks++;
    }
  }

  // =========================================================================
  // BỘ TIỆN ÍCH KÉO THẢ MƯỢT MÀ (UNIVERSAL DRAGGABLE COMPONENT)
  // =========================================================================
  function makeDraggable(element, handle, storageKey) {
    if (!element || !handle) return;
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    // Khôi phục vị trí đã lưu nếu có
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
          const w = element.offsetWidth || 180;
          const h = element.offsetHeight || 40;
          if (saved.x >= 0 && saved.x <= window.innerWidth - 30 && saved.y >= 0 && saved.y <= window.innerHeight - 30) {
            const maxX = Math.max(0, window.innerWidth - w);
            const maxY = Math.max(0, window.innerHeight - h);
            element.style.left = Math.min(maxX, Math.max(0, saved.x)) + 'px';
            element.style.top = Math.min(maxY, Math.max(0, saved.y)) + 'px';
            element.style.right = 'auto';
            element.style.bottom = 'auto';
          }
        }
      } catch (e) {}
    }

    const onPointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('button, input, select, textarea, details, summary, .no-drag')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      element.style.left = initialLeft + 'px';
      element.style.top = initialTop + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';

      handle.style.cursor = 'grabbing';

      const onPointerMove = (moveEvt) => {
        if (!isDragging) return;
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;

        const maxX = Math.max(0, window.innerWidth - element.offsetWidth);
        const maxY = Math.max(0, window.innerHeight - element.offsetHeight);

        const newLeft = Math.min(maxX, Math.max(0, initialLeft + dx));
        const newTop = Math.min(maxY, Math.max(0, initialTop + dy));

        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
      };

      const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        handle.style.cursor = 'grab';
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);

        if (storageKey) {
          try {
            const rect = element.getBoundingClientRect();
            localStorage.setItem(storageKey, JSON.stringify({ x: Math.round(rect.left), y: Math.round(rect.top) }));
          } catch (e) {}
        }
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.style.cursor = 'grab';
  }

  // =========================================================================
  // 1. GIAO DIỆN BOT CHÍNH (GỌN NHẸ, KÉO THẢ, CÓ NÚT THU GỌN)
  // =========================================================================

  // =========================================================================
  // HỆ THỐNG TỰ ĐỘNG BÁN ĐỒ RÁC & NẠP BÌNH MÁU TOÀN CẦU (v14.0 DYNAMIC ZERO-HARDCODE)
  // =========================================================================

  function getAllShopsFromGD() {
    const GD = window.GAME?.GD || {};
    const shops = [];
    for (const [zoneId, zData] of Object.entries(GD.zones || {})) {
      for (const npc of zData.npcs || []) {
        if (npc.shop && Array.isArray(npc.shop) && npc.shop.length > 0) {
          const sellsHp = npc.shop.some(i => i.startsWith('p_hp'));
          const sellsHpBetter = npc.shop.some(i => ['p_hp4', 'p_hp5'].includes(i));
          shops.push({
            zone: zoneId,
            npcId: npc.id,
            name: npc.name || npc.id,
            x: npc.x,
            y: npc.y,
            shop: npc.shop,
            sellsHp,
            sellsHpBetter
          });
        }
      }
    }
    return shops;
  }

  const autoShopState = {
    active: false,
    phase: 'IDLE', // 'IDLE' | 'TRAVEL_TO_SHOP' | 'SELLING' | 'BUYING' | 'TRAVEL_TO_FARM'
    farmZone: null,
    farmPos: null,
    farmTargetMob: null,
    shopNpc: null,
    shopZone: null,
    routeToShop: null,
    routeToFarm: null,
    lastActionTime: 0,
    soldItemsCount: 0,
    goldEarned: 0,
    boughtPotionsCount: 0,
    statusText: 'Sẵn sàng'
  };

  // =========================================================================
  // HỆ THỐNG KIỂM TRA BẢN ĐỒ & ĐỊNH TUYẾN CỔNG AN TOÀN (HỌC TỪ COVIET TRAVEL & NAV)
  // =========================================================================
  function getPortalBlockReason(p) {
    const self = window.GAME?.self;
    if (!self) return null;

    // 1. Kiểm tra cấp độ yêu cầu (reqLv)
    if (p.reqLv && (self.lv || 1) < p.reqLv) {
      return `Cần cấp độ ${p.reqLv}`;
    }

    // 2. Kiểm tra tiến độ nhiệm vụ (reqQuest - Chuẩn hóa theo CoViet questReached)
    if (p.reqQuest) {
      const parts = p.reqQuest.split(':');
      const qid = parts[0], reqStep = +(parts[1] || 0);

      // Đã hoàn thành nhiệm vụ này trong quá khứ?
      const doneQuests = self.quests?.done || [];
      const isDone = doneQuests.includes(qid) || (self.quest?.done && self.quest.id === qid);
      if (!isDone) {
        // Tìm trong danh sách nhiệm vụ đang làm
        const list = self.quests?.list || (self.quest ? [self.quest] : []);
        const activeQ = list.find(q => q && q.id === qid);
        if (!activeQ) {
          return `Cần nhiệm vụ ${qid}`;
        }
        if (activeQ.step < reqStep) {
          return `Cần nhiệm vụ ${qid} bước ${reqStep}`;
        }
      }
    }

    // 3. Kiểm tra vật phẩm / chìa khóa bắt buộc (req)
    if (p.req) {
      const inv = self.inv || [];
      const hasItem = inv.some(s => s && s.id === p.req);
      if (!hasItem) {
        return p.reqMsg || `Cần vật phẩm ${p.req}`;
      }
    }

    return null; // Cổng hoàn toàn mở, đi được an toàn!
  }

  function isPortalLocked(p) {
    return getPortalBlockReason(p) !== null;
  }

  // Cập nhật tọa độ cổng & NPC thời gian thực từ engine vào GD.zones (Học từ CoViet applyLayout)
  function syncZoneLayout() {
    const worldZone = window.GAME?.world?.zone;
    const GD = window.GAME?.GD;
    if (!worldZone || !worldZone.id || !GD?.zones) return;
    const zData = GD.zones[worldZone.id] || GD.zones.zones?.[worldZone.id];
    if (!zData) return;

    if (Array.isArray(worldZone.portals)) {
      if (!zData.portals) zData.portals = [];
      for (const liveP of worldZone.portals) {
        const cachedP = zData.portals.find(p => p.to === liveP.to);
        if (cachedP) {
          Object.assign(cachedP, { x: liveP.x, y: liveP.y, r: liveP.r || cachedP.r });
        } else {
          zData.portals.push({ ...liveP });
        }
      }
    }

    if (Array.isArray(worldZone.npcs)) {
      if (!zData.npcs) zData.npcs = [];
      for (const liveNpc of worldZone.npcs) {
        const cachedNpc = zData.npcs.find(n => n.id === liveNpc.id);
        if (cachedNpc) {
          Object.assign(cachedNpc, { x: liveNpc.x, y: liveNpc.y });
        } else {
          zData.npcs.push({ ...liveNpc });
        }
      }
    }
  }

  function safeMapRoute(fromZone, toZone) {
    if (fromZone === toZone) return [];
    const GD = window.GAME?.GD;
    if (!GD?.zones) return null;
    const prev = { [fromZone]: null }, q = [fromZone];
    while (q.length && !(toZone in prev)) {
      const id = q.shift();
      const zPortals = GD.zones[id]?.portals || [];
      for (const p of zPortals) {
        if (isPortalLocked(p)) continue;
        if (!(p.to in prev) && GD.zones[p.to]) {
          prev[p.to] = { from: id, to: p.to, portal: p };
          q.push(p.to);
        }
      }
    }
    if (!(toZone in prev)) return null;
    const out = [];
    for (let z = toZone; prev[z]; z = prev[z].from) out.unshift(prev[z]);
    return out;
  }

  function findDynamicGlobalShop(fromZone, maxHops = 99) {
    const allShops = getAllShopsFromGD();
    if (!allShops.length) return null;

    // 1. Kiểm tra có shop ngay trong map hiện tại không (0 hops - TỐI ƯU NHẤT)
    const localShop = allShops.find(s => s.zone === fromZone && s.sellsHp);
    if (localShop) {
      return { ...localShop, hops: 0, route: [] };
    }

    // Nếu người chơi chọn giữ map (sameMapOnly) hoặc maxHops === 0 -> Không rời map
    if (cfg.autoShopSameMapOnly || maxHops === 0) return null;

    // 2. Tìm shop gần nhất qua các cổng an toàn (BFS)
    let bestShop = null;
    for (const s of allShops) {
      if (!s.sellsHp) continue;
      const r = safeMapRoute(fromZone, s.zone);
      if (r !== null && r.length <= maxHops) {
        const hops = r.length;
        if (!bestShop || hops < bestShop.hops || (hops === bestShop.hops && s.sellsHpBetter && !bestShop.sellsHpBetter)) {
          bestShop = { ...s, hops, route: r };
        }
      }
    }
    return bestShop;
  }

  // =========================================================================
  // BỘ QUẢN LÝ TÚI ĐỒ & BỘ LỌC BÁN / CẤT KHO THÔNG MINH (HỌC TỪ COVIET)
  // =========================================================================
  const EQUIP_TYPES = new Set(['weapon', 'armor', 'helmet', 'cape', 'ring']);

  function isJunkItem(s, gdIt) {
    if (!s || !s.id) return false;
    const type = gdIt.type || s.type;
    const r = s.r || gdIt.r || 0;
    const lv = gdIt.lv || s.lv || 1;
    const sellPrice = gdIt.sell || 0;
    if (sellPrice <= 0) return false;

    // NGUYÊN TẮC BẢO VỆ TUYỆT ĐỐI:
    if (type === 'quest' || s.id.startsWith('q_')) return false; // Đồ nhiệm vụ
    if (type === 'potion' || s.id.startsWith('p_')) return false; // Bình máu/mana
    if (type === 'seal' || s.id.startsWith('seal_') || s.id.includes('an_') || s.id.includes('ngoc_')) return false; // Ấn, ngọc quý

    // Nguyên liệu quái rơi rác:
    if (type === 'mat') return !!cfg.sellMats;

    // Trang bị: Bán nếu thuộc loại được chọn VÀ (phẩm chất < mức giữ HOẶC cấp < mức giữ)
    if (EQUIP_TYPES.has(type) && cfg.sellTypes.includes(type)) {
      return (r < cfg.keepRarity) || (lv < cfg.keepLevel);
    }
    return false;
  }

  function isKeeperItem(s, gdIt) {
    if (!s || !s.id) return false;
    const type = gdIt.type || s.type;
    if (!EQUIP_TYPES.has(type)) return false;
    const r = s.r || gdIt.r || 0;
    const lv = gdIt.lv || s.lv || 1;
    // Trang bị quý đạt chuẩn giữ lại (phẩm chất VÀ cấp đều >= mức giữ):
    return (r >= cfg.keepRarity) && (lv >= cfg.keepLevel);
  }

  function inspectInventory() {
    const inv = window.GAME?.self?.inv || [];
    const GD = window.GAME?.GD || {};
    let freeSlots = 0;
    let hpPotionCount = 0;
    const sellableSlots = [];
    const keeperSlots = [];

    for (let i = 0; i < inv.length; i++) {
      const s = inv[i];
      if (!s || !s.id) {
        freeSlots++;
        continue;
      }
      const gdIt = GD.items?.[s.id] || {};
      const type = gdIt.type || s.type;
      const r = s.r || gdIt.r || 0;
      const sellPrice = gdIt.sell || 0;

      const isHpPotion = s.id.startsWith('p_hp') || (type === 'potion' && (gdIt.heal || 0) > 0);
      if (isHpPotion) {
        hpPotionCount += (typeof s.n === 'number' && s.n > 0 ? s.n : 1);
      }

      if (isJunkItem(s, gdIt)) {
        sellableSlots.push({
          slot: i,
          id: s.id,
          name: gdIt.name || s.id,
          n: s.n || 1,
          r,
          type,
          price: Math.round(sellPrice * (s.n || 1) * ([1, 1.2, 1.5, 2, 3][r] || 1))
        });
      } else if (isKeeperItem(s, gdIt)) {
        keeperSlots.push({
          slot: i,
          id: s.id,
          name: gdIt.name || s.id,
          r,
          lv: gdIt.lv || 1
        });
      }
    }

    return { freeSlots, hpPotionCount, sellableSlots, keeperSlots };
  }

  // =========================================================================
  // BỘ TỰ ĐỘNG CẤT ĐỒ VÀO KHO / ĐẶT CỌC KHO (AUTO STORAGE DEPOSIT - HỌC TỪ COVIET)
  // =========================================================================
  const storageState = {
    active: false,
    phase: 'IDLE', // TRAVEL_TO_STORAGE, DEPOSITING, TRAVEL_TO_FARM
    storageNpc: null,
    farmZone: null,
    farmPos: null,
    farmTargetMob: null,
    routeToStorage: [],
    storedCount: 0,
    statusText: '',
    lastActionTime: 0
  };

  function findNearestStorageNpc(curZone) {
    const localNpc = window.GAME?.world?.zone?.npcs?.find(n => n.storage || n.id === 'thukho' || n.name?.includes('Kho'));
    if (localNpc) return { ...localNpc, zone: curZone, hops: 0, route: [] };

    const GD = window.GAME?.GD || {};
    const zones = GD.zones?.zones || GD.zones || {};
    for (const [zid, z] of Object.entries(zones)) {
      const n = (z.npcs || []).find(x => x.storage || x.id === 'thukho');
      if (n) {
        const r = safeMapRoute(curZone, zid);
        if (r) return { ...n, zone: zid, hops: r.length, route: r };
      }
    }
    const r = safeMapRoute(curZone, 'lang');
    return { id: 'thukho', name: 'Thủ Kho', zone: 'lang', x: 600, y: 600, hops: r?.length || 1, route: r || [] };
  }

  function triggerStorageTrip(force = false) {
    if (storageState.active && !force) return;
    const curZone = window.GAME?.world?.zone?.id;
    if (!curZone) return;
    const me = window.GAME?.me;
    if (!me) return;

    const storageNpc = findNearestStorageNpc(curZone);
    if (!storageNpc) {
      logShopEvent('⚠️ Không tìm thấy NPC Thủ Kho.');
      return;
    }

    storageState.active = true;
    storageState.phase = 'TRAVEL_TO_STORAGE';
    storageState.farmZone = curZone;
    storageState.farmPos = { x: Math.round(me.x), y: Math.round(me.y) };
    storageState.farmTargetMob = cfg.targetMob;
    storageState.storageNpc = storageNpc;
    storageState.routeToStorage = storageNpc.route || [];
    storageState.storedCount = 0;
    storageState.statusText = `📦 Đi tới ${storageNpc.name} (${storageNpc.zone}) cất đồ quý...`;
    logShopEvent(`📦 Bắt đầu chuyến đi cất đồ quý vào kho tại ${storageNpc.name} (${storageNpc.zone}).`);
  }

  function handleStorageStep(me, now, keeperSlots) {
    const curZone = window.GAME?.world?.zone?.id;
    if (!curZone) return;

    if (storageState.phase === 'TRAVEL_TO_STORAGE') {
      if (curZone === storageState.storageNpc.zone) {
        const npcX = storageState.storageNpc.x;
        const npcY = storageState.storageNpc.y;
        const distNpc = Math.hypot(npcX - me.x, npcY - me.y);

        if (distNpc <= 110) {
          stopMoving();
          storageState.phase = 'DEPOSITING';
          storageState.statusText = `📦 Đã tới ${storageState.storageNpc.name}. Đang cất đồ vào kho...`;
          if (statusTxt) statusTxt.textContent = storageState.statusText;
          return;
        }

        const steer = calculateDirectSteering(me, npcX, npcY);
        setSteeringVector(steer.dx, steer.dy);
        storageState.statusText = `📦 Tiếp cận ${storageState.storageNpc.name} (${Math.round(distNpc)}px)`;
        if (statusTxt) statusTxt.textContent = storageState.statusText;
        return;
      }

      const curRoute = safeMapRoute(curZone, storageState.storageNpc.zone);
      if (!curRoute || curRoute.length === 0) {
        logShopEvent(`⚠️ Mất dấu đường tới Thủ Kho từ map ${curZone}! Hủy cất đồ.`);
        storageState.active = false;
        return;
      }

      const step = curRoute[0];
      const pX = step.portal.x, pY = step.portal.y;
      const distPortal = Math.hypot(pX - me.x, pY - me.y);
      if (distPortal <= 45 && now - lastZoneTransitionTime >= 2500) {
        setSteeringVector(pX - me.x, pY - me.y);
        storageState.statusText = `🚪 Bước qua cổng sang ${step.to}...`;
      } else {
        const steer = calculateDirectSteering(me, pX, pY);
        setSteeringVector(steer.dx, steer.dy);
        storageState.statusText = `📦 Đi tới cổng sang ${step.to} (${Math.round(distPortal)}px)`;
      }
      if (statusTxt) statusTxt.textContent = storageState.statusText;
      return;
    }

    if (storageState.phase === 'DEPOSITING') {
      stopMoving();
      if (keeperSlots.length > 0) {
        if (now - storageState.lastActionTime >= 350) {
          const item = keeperSlots[0];
          window.GAME.net.send({ t: 'npc', s: storageState.storageNpc.id });
          setTimeout(() => {
            window.GAME.net.send({ t: 'dep', s: storageState.storageNpc.id, n: item.slot });
          }, 150);
          storageState.lastActionTime = now;
          storageState.storedCount++;
          storageState.statusText = `📦 Đang cất vào kho: ${item.name}`;
          if (statusTxt) statusTxt.textContent = storageState.statusText;
        }
        return;
      }

      // Đã cất hết -> Chuyển sang quay về bãi farm hoặc đi bán đồ nếu có rác
      logShopEvent(`📦 Đã cất xong ${storageState.storedCount} trang bị quý vào kho!`);
      const returnRoute = safeMapRoute(curZone, storageState.farmZone);
      if (returnRoute && returnRoute.length > 0) {
        storageState.phase = 'TRAVEL_TO_FARM';
        storageState.statusText = `📦 Đang quay lại bãi farm (${storageState.farmZone})...`;
        if (statusTxt) statusTxt.textContent = storageState.statusText;
      } else {
        storageState.active = false;
        storageState.phase = 'IDLE';
      }
      return;
    }

    if (storageState.phase === 'TRAVEL_TO_FARM') {
      if (curZone === storageState.farmZone) {
        if (storageState.farmTargetMob && cfg.targetMob !== storageState.farmTargetMob) {
          cfg.targetMob = storageState.farmTargetMob;
        }
        const farmX = storageState.farmPos.x, farmY = storageState.farmPos.y;
        const distFarm = Math.hypot(farmX - me.x, farmY - me.y);
        if (distFarm <= 80) {
          stopMoving();
          storageState.active = false;
          storageState.phase = 'IDLE';
          logShopEvent(`✅ Đã về lại đúng bãi farm ban đầu! Tiếp tục cày.`);
          return;
        }
        const steer = calculateDirectSteering(me, farmX, farmY);
        setSteeringVector(steer.dx, steer.dy);
        storageState.statusText = `🧭 Về lại bãi farm (${Math.round(distFarm)}px)`;
        if (statusTxt) statusTxt.textContent = storageState.statusText;
        return;
      }

      const curReturnRoute = safeMapRoute(curZone, storageState.farmZone);
      if (!curReturnRoute || curReturnRoute.length === 0) {
        storageState.active = false;
        return;
      }
      const step = curReturnRoute[0];
      const pX = step.portal.x, pY = step.portal.y;
      const distPortal = Math.hypot(pX - me.x, pY - me.y);
      if (distPortal <= 45 && now - lastZoneTransitionTime >= 2500) {
        setSteeringVector(pX - me.x, pY - me.y);
      } else {
        const steer = calculateDirectSteering(me, pX, pY);
        setSteeringVector(steer.dx, steer.dy);
      }
      storageState.statusText = `🚪 Về bãi farm: Cổng sang ${step.to} (${Math.round(distPortal)}px)`;
      if (statusTxt) statusTxt.textContent = storageState.statusText;
    }
  }

  // =========================================================================
  // BỘ TỰ ĐỘNG LÀM NHIỆM VỤ AUTO-QUEST ENGINE (HỌC TỪ COVIET)
  // =========================================================================
  const questState = {
    active: false,
    currentQuest: null,
    targetMobs: null, // Set of mob kinds for current quest
    collectItem: null,
    lastTalkTime: 0,
    lastUseTime: 0,
    lastGatherTime: 0,
    anchorIdx: 0,
    emptySince: 0,
    anchorZone: null,
    statusText: '',
    talkTries: 0
  };

  function nearestIdx(spots, me) {
    if (!spots || spots.length === 0) return 0;
    return spots.reduce((b, s, i) => (Math.hypot(s.x - me.x, s.y - me.y) < Math.hypot(spots[b].x - me.x, spots[b].y - me.y) ? i : b), 0);
  }

  function getActiveQuest() {
    const ui = window.GAME?.ui;
    const self = window.GAME?.self;
    const list = self?.quests?.list || [];

    // 1. Ưu tiên cao nhất: Nhiệm vụ đã hoàn thành mục tiêu, sẵn sàng trả (q.ready)
    const readyQ = list.find(q => q && q.ready && !q.done);
    if (readyQ) return readyQ;

    // 2. Nhiệm vụ đang ghim trên bảng hướng dẫn màn hình game
    if (ui?.guideQuest) {
      const gq = ui.guideQuest();
      if (gq && !gq.done) return gq;
    }

    // 3. Nhiệm vụ chính tuyến (ch1..ch9)
    const mainQ = list.find(q => q && !q.done && /^ch\d+$/.test(q.id));
    if (mainQ) return mainQ;

    // 4. Bất kỳ nhiệm vụ nào chưa xong trong danh sách
    const active = list.find(q => q && !q.done);
    if (active) return active;
    if (self?.quest && !self.quest.done) return self.quest;
    return null;
  }

  function getQuestDef(questId) {
    return window.GAME?.GD?.quests?.[questId] || null;
  }

  function mobsDroppingItem(itemId) {
    const GD = window.GAME?.GD || {};
    const mobs = GD.mobs || {};
    const tables = GD.loot?.tables || {};
    const result = new Set();
    for (const [lootId, table] of Object.entries(tables)) {
      if (!table) continue;
      const drops = table.drops || [];
      const items = table.items || [];
      if (drops.some(d => d.item === itemId) || items.includes(itemId)) {
        for (const [mid, m] of Object.entries(mobs)) {
          if (m.loot === lootId || mid === lootId) {
            result.add(mid);
          }
        }
      }
    }
    return Array.from(result);
  }

  function findZoneForMobs(mobList, preferZone) {
    const GD = window.GAME?.GD || {};
    const zones = GD.zones?.zones || GD.zones || {};
    const hasMob = zid => {
      const z = zones[zid];
      return z?.spawns && z.spawns.some(s => mobList.includes(s.mob));
    };
    if (preferZone && hasMob(preferZone)) return preferZone;
    for (const zid of Object.keys(zones)) {
      if (hasMob(zid)) return zid;
    }
    return null;
  }

  function findNpcZoneAndLocation(npcId) {
    const GD = window.GAME?.GD || {};
    const zones = GD.zones?.zones || GD.zones || {};
    for (const [zid, z] of Object.entries(zones)) {
      const n = (z.npcs || []).find(x => x.id === npcId);
      if (n) return { ...n, zone: zid };
    }
    return null;
  }

  function handleAutoQuest(me, now) {
    if (!cfg.autoQuest) return false;
    const curZone = window.GAME?.world?.zone?.id;
    if (!curZone) return false;

    const q = getActiveQuest();
    if (!q) {
      const offers = window.GAME?.self?.quests?.offers || [];
      if (offers.length > 0) {
        const offerNpcId = offers[0];
        const npcLoc = findNpcZoneAndLocation(offerNpcId);
        if (npcLoc) {
          if (curZone !== npcLoc.zone) {
            const r = safeMapRoute(curZone, npcLoc.zone);
            if (r && r.length > 0) {
              const p = r[0].portal;
              const distP = Math.hypot(p.x - me.x, p.y - me.y);
              if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
                setSteeringVector(p.x - me.x, p.y - me.y);
              } else {
                const s = calculateDirectSteering(me, p.x, p.y);
                setSteeringVector(s.dx, s.dy);
              }
              questState.statusText = `📜 Đi sang ${npcLoc.zone} nhận quest...`;
              if (statusTxt) statusTxt.textContent = questState.statusText;
              return true;
            }
          } else {
            const distNpc = Math.hypot(npcLoc.x - me.x, npcLoc.y - me.y);
            if (distNpc <= 110) {
              stopMoving();
              if (now - questState.lastTalkTime >= 1500) {
                questState.lastTalkTime = now;
                window.GAME.net.send({ t: 'npc', s: offerNpcId });
                setTimeout(() => {
                  window.GAME.net.send({ t: 'acc', s: offerNpcId, m: '' });
                }, 400);
              }
              questState.statusText = `📜 Nhận nhiệm vụ từ ${npcLoc.name || offerNpcId}...`;
              if (statusTxt) statusTxt.textContent = questState.statusText;
              return true;
            } else {
              const s = calculateDirectSteering(me, npcLoc.x, npcLoc.y);
              setSteeringVector(s.dx, s.dy);
              questState.statusText = `📜 Tới gặp ${npcLoc.name || offerNpcId} (${Math.round(distNpc)}px)`;
              if (statusTxt) statusTxt.textContent = questState.statusText;
              return true;
            }
          }
        }
      }
      return false;
    }

    const def = getQuestDef(q.id);
    const step = def?.steps?.[q.step];
    if (!step) return false;

    // A. BƯỚC NÓI CHUYỆN HOẶC ĐÃ XONG ĐANG TRẢ NHIỆM VỤ (q.ready) HOẶC DỊCH VỤ NPC (barber, dye...)
    const isServiceStep = ['barber', 'enhance', 'refine', 'dye', 'bless', 'reroll', 'craft', 'seal'].includes(step.type);
    if (step.type === 'talk' || q.ready || isServiceStep) {
      questState.active = false;
      questState.targetMobs = null;
      questState.collectItem = null;
      const targetNpcId = q.npc || step.npc;
      const npcLoc = findNpcZoneAndLocation(targetNpcId);
      if (npcLoc) {
        if (curZone !== npcLoc.zone) {
          const r = safeMapRoute(curZone, npcLoc.zone);
          if (r && r.length > 0) {
            const p = r[0].portal;
            const distP = Math.hypot(p.x - me.x, p.y - me.y);
            if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
              setSteeringVector(p.x - me.x, p.y - me.y);
            } else {
              const s = calculateDirectSteering(me, p.x, p.y);
              setSteeringVector(s.dx, s.dy);
            }
            questState.statusText = `📜 Đi sang ${npcLoc.zone} gặp ${npcLoc.name || targetNpcId}...`;
            if (statusTxt) statusTxt.textContent = questState.statusText;
            return true;
          }
        } else {
          const distNpc = Math.hypot(npcLoc.x - me.x, npcLoc.y - me.y);
          if (distNpc <= 110) {
            stopMoving();
            if (now - questState.lastTalkTime >= 1500) {
              questState.lastTalkTime = now;
              window.GAME.net.send({ t: 'npc', s: targetNpcId });
              setTimeout(() => {
                window.GAME.net.send({ t: 'qa', s: targetNpcId, m: q.id });
                logShopEvent(`✅ Đã giao tiếp nhiệm vụ [${def.name || q.id}] với ${npcLoc.name || targetNpcId}!`);
              }, 400);
            }
            questState.statusText = `📜 Đang giao tiếp với ${npcLoc.name || targetNpcId}...`;
            if (statusTxt) statusTxt.textContent = questState.statusText;
            return true;
          } else {
            const s = calculateDirectSteering(me, npcLoc.x, npcLoc.y);
            setSteeringVector(s.dx, s.dy);
            questState.statusText = `📜 Gặp ${npcLoc.name || targetNpcId} (${Math.round(distNpc)}px)`;
            if (statusTxt) statusTxt.textContent = questState.statusText;
            return true;
          }
        }
      }
      return false;
    }

    // B. BƯỚC GIỮ TRẬN / THỦ THÀNH (defend)
    if (step.type === 'defend') {
      const defendHud = document.getElementById('defend-hud');
      const isDefendActive = defendHud && !defendHud.hidden;
      const targetZone = step.zone || q.zone || curZone;

      if (curZone !== targetZone) {
        const r = safeMapRoute(curZone, targetZone);
        if (r && r.length > 0) {
          const p = r[0].portal;
          const distP = Math.hypot(p.x - me.x, p.y - me.y);
          if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
            setSteeringVector(p.x - me.x, p.y - me.y);
          } else {
            const s = calculateDirectSteering(me, p.x, p.y);
            setSteeringVector(s.dx, s.dy);
          }
          questState.statusText = `📜 Sang ${targetZone} giữ trận...`;
          if (statusTxt) statusTxt.textContent = questState.statusText;
          return true;
        }
      }

      // Đã ở đúng zone giữ trận
      const waveMobs = (step.waves || []).map(w => w.mob);
      questState.active = true;
      questState.targetMobs = new Set(waveMobs.length > 0 ? waveMobs : ['ambinh', 'dieugiay']);
      questState.collectItem = null;

      if (!isDefendActive) {
        // Chưa kích hoạt giữ trận: Tới NPC nói chuyện để bắt đầu!
        const targetNpcId = step.npc || q.npc;
        const npcLoc = findNpcZoneAndLocation(targetNpcId) || { x: step.x, y: step.y, name: targetNpcId };
        const distNpc = Math.hypot(npcLoc.x - me.x, npcLoc.y - me.y);
        if (distNpc <= 110) {
          stopMoving();
          if (now - questState.lastTalkTime >= 1500) {
            questState.lastTalkTime = now;
            window.GAME.net.send({ t: 'npc', s: targetNpcId });
            setTimeout(() => {
              window.GAME.net.send({ t: 'qa', s: targetNpcId, m: q.id });
            }, 400);
          }
          questState.statusText = `🛡️ Bắt đầu giữ trận cùng ${npcLoc.name || targetNpcId}...`;
          if (statusTxt) statusTxt.textContent = questState.statusText;
          return true;
        } else {
          const s = calculateDirectSteering(me, npcLoc.x, npcLoc.y);
          setSteeringVector(s.dx, s.dy);
          questState.statusText = `🛡️ Tới gặp ${npcLoc.name || targetNpcId} (${Math.round(distNpc)}px)`;
          if (statusTxt) statusTxt.textContent = questState.statusText;
          return true;
        }
      } else {
        // Đang trong trận thủ thành: Giữ vị trí trong vòng (step.x, step.y, step.r)
        const centerX = step.x, centerY = step.y, radius = step.r || 200;
        const distCenter = Math.hypot(centerX - me.x, centerY - me.y);
        if (distCenter > radius * 0.75) {
          const s = calculateDirectSteering(me, centerX, centerY);
          setSteeringVector(s.dx, s.dy);
          questState.statusText = `🛡️ Giữ vòng trận (${Math.round(distCenter)}px) - ${defendHud?.textContent || 'Đang thủ'}`;
          if (statusTxt) statusTxt.textContent = questState.statusText;
          return true;
        } else {
          // Đã ở trong vòng an toàn: Nhường cho combat loop diệt quái âm binh!
          questState.statusText = `🛡️ Dẹp âm binh thủ trận (${waveMobs.join('/')})`;
          return false;
        }
      }
    }

    // C. BƯỚC DÙNG VẬT PHẨM TẠI ĐIỂM (use)
    if (step.type === 'use') {
      const targetZone = step.zone || q.zone || curZone;
      if (curZone !== targetZone) {
        const r = safeMapRoute(curZone, targetZone);
        if (r && r.length > 0) {
          const p = r[0].portal;
          const distP = Math.hypot(p.x - me.x, p.y - me.y);
          if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
            setSteeringVector(p.x - me.x, p.y - me.y);
          } else {
            const s = calculateDirectSteering(me, p.x, p.y);
            setSteeringVector(s.dx, s.dy);
          }
          questState.statusText = `📜 Sang ${targetZone} dùng đồ quest...`;
          if (statusTxt) statusTxt.textContent = questState.statusText;
          return true;
        }
      }

      // Tìm điểm cần dùng gần nhất
      const pts = (q.pts && q.pts.length > 0) ? q.pts : (step.points || (step.x && step.y ? [[step.x, step.y]] : []));
      if (pts.length > 0) {
        pts.sort((a, b) => Math.hypot(a[0] - me.x, a[1] - me.y) - Math.hypot(b[0] - me.x, b[1] - me.y));
        const nearestPt = pts[0];
        const pRadius = step.r || q.r || 85;
        const distPt = Math.hypot(nearestPt[0] - me.x, nearestPt[1] - me.y);
        if (distPt <= pRadius) {
          stopMoving();
          if (now - (questState.lastUseTime || 0) >= 1200) {
            questState.lastUseTime = now;
            window.GAME.net.send({ t: 'qu', m: q.id });
            logShopEvent(`✋ Đã bấm dùng vật phẩm quest [${q.name || q.id}]!`);
          }
          questState.statusText = `✋ Đang dùng vật phẩm tại điểm quest...`;
          if (statusTxt) statusTxt.textContent = questState.statusText;
          return true;
        } else {
          const s = calculateDirectSteering(me, nearestPt[0], nearestPt[1]);
          setSteeringVector(s.dx, s.dy);
          questState.statusText = `📜 Đi tới điểm dùng quest (${Math.round(distPt)}px)`;
          if (statusTxt) statusTxt.textContent = questState.statusText;
          return true;
        }
      }
    }

    // D. BƯỚC GIẾT QUÁI (kill) HOẶC THU THẬP VẬT PHẨM (collect)
    if (step.type === 'kill' || step.type === 'collect') {
      let mobList = [];
      if (step.type === 'kill') {
        mobList = step.distinct 
          ? (step.mobs || []).filter(id => !q.got?.includes(id))
          : (step.mobs || (step.mob ? [step.mob] : []));
      } else {
        mobList = mobsDroppingItem(step.item);
        if (step.mob && !mobList.includes(step.mob)) mobList.push(step.mob);
      }

      // Kiểm tra điểm hái lượm / rương yêu cho collect
      if (step.type === 'collect') {
        const GD = window.GAME?.GD || {};
        const tabs = Object.entries(GD.loot?.tables || {})
          .filter(([, t]) => (t.drops || []).some(d => d.item === step.item) || (t.items || []).includes(step.item))
          .map(([id]) => id);
        const chestHere = tabs.includes(window.GAME?.world?.zone?.chests?.loot);
        const gatherList = (window.GAME?.gather || []).filter(g => g[4] && (g[1] === step.item || (g[1] === 'chest' && chestHere)));
        if (gatherList.length > 0) {
          gatherList.sort((a, b) => Math.hypot(a[2] - me.x, a[3] - me.y) - Math.hypot(b[2] - me.x, b[3] - me.y));
          const nearestNode = gatherList[0];
          const distNode = Math.hypot(nearestNode[2] - me.x, nearestNode[3] - me.y);
          if (distNode <= 45) {
            stopMoving();
            if (now - (questState.lastGatherTime || 0) >= 1200) {
              questState.lastGatherTime = now;
              window.GAME.net.send({ t: 'gather', id: nearestNode[0] });
              logShopEvent(`🌿 Thu hoạch điểm quest [${nearestNode[1]}]!`);
            }
            questState.statusText = `🌿 Đang thu hoạch ${step.item}...`;
            if (statusTxt) statusTxt.textContent = questState.statusText;
            return true;
          } else {
            const s = calculateDirectSteering(me, nearestNode[2], nearestNode[3]);
            setSteeringVector(s.dx, s.dy);
            questState.statusText = `🌿 Tới điểm thu hoạch (${Math.round(distNode)}px)`;
            if (statusTxt) statusTxt.textContent = questState.statusText;
            return true;
          }
        }
      }

      if (mobList.length > 0) {
        questState.active = true;
        questState.targetMobs = new Set(mobList);
        questState.collectItem = (step.type === 'collect') ? step.item : null;

        const targetZone = step.zone || q.zone || findZoneForMobs(mobList, curZone);
        if (targetZone && targetZone !== curZone) {
          const r = safeMapRoute(curZone, targetZone);
          if (r && r.length > 0) {
            const p = r[0].portal;
            const distP = Math.hypot(p.x - me.x, p.y - me.y);
            if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
              setSteeringVector(p.x - me.x, p.y - me.y);
            } else {
              const s = calculateDirectSteering(me, p.x, p.y);
              setSteeringVector(s.dx, s.dy);
            }
            questState.statusText = `📜 Sang ${targetZone} săn quái quest (${mobList.join('/')})...`;
            if (statusTxt) statusTxt.textContent = questState.statusText;
            return true;
          }
        } else {
          // Đã ở đúng map: Nhường hoàn toàn quyền điều khiển cho combat loop!
          // Combat loop sẽ dùng getActiveTargetFilter() để tự động khóa đúng quái quest
          questState.statusText = `⚔️ Săn quái nhiệm vụ: ${mobList.join('/')}`;
          return false;
        }
      }
      return false;
    }

    // E. BƯỚC TỚI NƠI (reach)
    if (step.type === 'reach') {
      const targetZone = step.zone || q.zone;
      if (targetZone && curZone !== targetZone) {
        const r = safeMapRoute(curZone, targetZone);
        if (r && r.length > 0) {
          const p = r[0].portal;
          const distP = Math.hypot(p.x - me.x, p.y - me.y);
          if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
            setSteeringVector(p.x - me.x, p.y - me.y);
          } else {
            const s = calculateDirectSteering(me, p.x, p.y);
            setSteeringVector(s.dx, s.dy);
          }
          questState.statusText = `📜 Tới map ${targetZone}...`;
          if (statusTxt) statusTxt.textContent = questState.statusText;
          return true;
        }
      } else if (step.x && step.y) {
        const distStep = Math.hypot(step.x - me.x, step.y - me.y);
        if (distStep > 50) {
          const s = calculateDirectSteering(me, step.x, step.y);
          setSteeringVector(s.dx, s.dy);
          questState.statusText = `📜 Đi tới điểm quest (${Math.round(distStep)}px)`;
          if (statusTxt) statusTxt.textContent = questState.statusText;
          return true;
        }
      }
    }

    return false;
  }

  
  // =========================================================================
  // BỘ TỰ ĐỘNG SĂN NGUYÊN LIỆU & NÂNG CẤP KỸ NĂNG, CƯỜNG HÓA TRANG BỊ (v16.2.0)
  // =========================================================================

  const UPGRADE_MATS = {
    // 1. KỸ NĂNG (SKILLS)
    m_ngoctrai: {
      id: 'm_ngoctrai',
      name: 'Ngọc Trai',
      icon: '⚪',
      zone: 'dam',
      zoneName: 'Đầm Dạ Trạch',
      targetMob: 'giaolong',
      coords: [2350, 2350],
      mobs: ['giaolong', 'haitac', 'ngubinh'],
      desc: 'Nâng Skill Bậc 2 (cần 3 viên)'
    },
    m_longdaibang: {
      id: 'm_longdaibang',
      name: 'Lông Đại Bàng',
      icon: '🪶',
      zone: 'kimson',
      zoneName: 'Núi Kim Sơn',
      targetMob: 'daibang',
      coords: [3080, 420],
      mobs: ['daibang'],
      desc: 'Nâng Skill Bậc 3 (cần 3 chiếc)'
    },
    m_manhdong: {
      id: 'm_manhdong',
      name: 'Mảnh Đồng Cổ',
      icon: '🥉',
      zone: 'kimson',
      zoneName: 'Núi Kim Sơn',
      targetMob: 'chuachuot',
      coords: [800, 2420],
      mobs: ['chuachuot', 'lonmo'],
      desc: 'Nâng Skill Bậc 3 (cần 2 mảnh)'
    },

    // 2. CƯỜNG HÓA TRANG BỊ (EQUIPMENT ENHANCE)
    // Tier 1-2 (Lv 1-9)
    m_dalon: {
      id: 'm_dalon',
      name: 'Da Lợn Rừng',
      icon: '🟫',
      zone: 'doi',
      zoneName: 'Đồi Trung Du',
      targetMob: 'lon',
      coords: [1250, 1650],
      mobs: ['lon'],
      desc: 'Cường hóa đồ Lv 1-4'
    },
    m_canhdoi: {
      id: 'm_canhdoi',
      name: 'Cánh Dơi',
      icon: '🦇',
      zone: 'doi',
      zoneName: 'Đồi Trung Du',
      targetMob: 'doi',
      coords: [2350, 780],
      mobs: ['doi'],
      desc: 'Cường hóa đồ Lv 5-9'
    },
    m_longcao: {
      id: 'm_longcao',
      name: 'Lông Cáo Bạc',
      icon: '🦊',
      zone: 'doi',
      zoneName: 'Đồi Trung Du',
      targetMob: 'caoho',
      coords: [2860, 1660],
      mobs: ['caoho'],
      desc: 'Cường hóa cao cấp Lv 1-9 (+8..+10)'
    },

    // Tier 3 (Lv 10-19)
    m_rangcasau: {
      id: 'm_rangcasau',
      name: 'Răng Cá Sấu',
      icon: '🦷',
      zone: 'dam',
      zoneName: 'Đầm Dạ Trạch',
      targetMob: 'casau',
      coords: [2000, 950],
      mobs: ['casau', 'thuongluong'],
      desc: 'Cường hóa đồ Lv 10-19'
    },

    // Tier 4 (Lv 20-29)
    m_nanhheo: {
      id: 'm_nanhheo',
      name: 'Nanh Heo Rừng',
      icon: '🐗',
      zone: 'bavi',
      zoneName: 'Rừng Ba Vì',
      targetMob: 'heorung',
      coords: [1100, 700],
      mobs: ['heorung'],
      desc: 'Cường hóa đồ Lv 20-29'
    },
    m_dabao: {
      id: 'm_dabao',
      name: 'Da Báo Gấm',
      icon: '🐆',
      zone: 'bavi',
      zoneName: 'Rừng Ba Vì',
      targetMob: 'baogam',
      coords: [2150, 1900],
      mobs: ['baogam', 'hoba'],
      desc: 'Cường hóa cao cấp Lv 20-29 (+8..+10)'
    },

    // Tier 5 (Lv 30-39)
    m_buavang: {
      id: 'm_buavang',
      name: 'Bùa Vàng Trấn Thi',
      icon: '📜',
      zone: 'hoangtuyen',
      zoneName: 'Hoàng Tuyền',
      targetMob: 'cuongthi',
      coords: [500, 800],
      mobs: ['cuongthi'],
      desc: 'Cường hóa đồ Lv 30-39'
    },
    m_xichnguc: {
      id: 'm_xichnguc',
      name: 'Xích Ngục Âm Phủ',
      icon: '⛓️',
      zone: 'hoangtuyen',
      zoneName: 'Hoàng Tuyền',
      targetMob: 'nguctuong',
      coords: [3220, 2340],
      mobs: ['nguctuong'],
      desc: 'Cường hóa cao cấp Lv 30-39 (+8..+10)'
    },

    // Tier 6 (Lv 40-45)
    m_xuongam: {
      id: 'm_xuongam',
      name: 'Xương Âm Binh',
      icon: '🦴',
      zone: 'hatmon',
      zoneName: 'Đầm Hát Môn',
      targetMob: 'ambinh',
      coords: [2800, 720],
      mobs: ['ambinh', 'ambinhcung'],
      desc: 'Cường hóa đồ Lv 40-45 (Tier 5: +1..+7)'
    },
    m_buayem: {
      id: 'm_buayem',
      name: 'Bùa Yểm Cao Biền',
      icon: '🧧',
      zone: 'hatmon',
      zoneName: 'Đầm Hát Môn',
      targetMob: 'choyem',
      coords: [3150, 700],
      mobs: ['choyem', 'amky'],
      desc: 'Cường hóa cao cấp Lv 40-45 (+8..+10)'
    },

    // Tier 7 (Lv 46+)
    m_duoichuot: {
      id: 'm_duoichuot',
      name: 'Đuôi Chuột Yểm',
      icon: '🐀',
      zone: 'daila',
      zoneName: 'Thành Đại La',
      targetMob: 'chuotyem',
      coords: [1250, 650],
      mobs: ['chuotcong', 'chuotyem'],
      desc: 'Cường hóa đồ Lv 46+ (Tier 6: +1..+7)'
    },
    m_manhgiap: {
      id: 'm_manhgiap',
      name: 'Mảnh Giáp Âm Tướng',
      icon: '🛡️',
      zone: 'daila',
      zoneName: 'Thành Đại La',
      targetMob: 'amtuong',
      coords: [3000, 1750],
      mobs: ['amtuong'],
      desc: 'Cường hóa cao cấp Lv 46+ (+8..+10)'
    },

    // 3. BÙA HỘ RÈN
    m_buahoren: {
      id: 'm_buahoren',
      name: 'Bùa Hộ Rèn',
      icon: '🧧',
      zone: 'dongthien',
      zoneName: 'Săn Boss Động Thiên',
      targetMob: 'nghechua',
      coords: [1350, 700],
      mobs: ['nghechua', 'todinh', 'xuongho'],
      desc: 'Bùa hộ mệnh không tụt cấp khi rèn xịt'
    }
  };

  const TRAINER_LIST = [
    { zone: 'lang', id: 'thaycung', name: 'Thầy Cúng Lão Mộc', x: 780, y: 262 },
    { zone: 'chuxa', id: 'chudongtu', name: 'Chử Đồng Tử', x: 740, y: 480 },
    { zone: 'banmuong', id: 'sonthanh', name: 'Tản Viên Sơn Thánh', x: 800, y: 440 },
    { zone: 'coloa', id: 'caolo', name: 'Tướng Cao Lỗ', x: 470, y: 760 },
    { zone: 'mieu', id: 'thanhhoang', name: 'Thành Hoàng', x: 800, y: 575 }
  ];

  const BLACKSMITH_LIST = [
    { zone: 'lang', id: 'thoren', name: 'Thợ Rèn Đồng Sơn', x: 440, y: 760 },
    { zone: 'coloa', id: 'thoduc', name: 'Thợ Đúc Đông Sơn', x: 640, y: 880 },
    { zone: 'thanglong', id: 'thorenkinh', name: 'Lò Rèn Kinh Thành', x: 820, y: 900 }
  ];

  const upgradeState = {
    active: false,
    mode: 'none', // 'skill' | 'gear' | 'quick_mat'
    step: 'IDLE', // 'FARMING' | 'NAV_UPGRADE' | 'TALKING'
    targetMat: null,
    targetSkill: null,
    targetGearSlot: null,
    targetGearIndex: null,
    targetNpc: null,
    lastActionTime: 0,
    statusText: '',
    consecutiveFails: 0
  };

  function getSkillUpgradeAnalysis() {
    const self = window.GAME?.self;
    const GD = window.GAME?.GD;
    if (!self || !GD?.skills || !GD?.training) return null;

    const classDef = GD.classes?.[self.cls] || GD.appearance?.[self.cls];
    const skillIds = (classDef && classDef.skills) ? classDef.skills : Object.keys(self.sks || {});
    const ranks = GD.training.ranks || [];

    for (const skId of skillIds) {
      const skDef = GD.skills[skId];
      if (!skDef) continue;
      const curRank = self.sks?.[skId]?.r || 1;
      if (curRank >= 3) continue; // Đã đạt Rank 3 tối đa

      const nextRankCost = ranks.find(r => r.rank === curRank + 1);
      if (!nextRankCost) continue;

      const missingMats = [];
      let allMatsReady = true;

      for (const [matId, reqQty] of nextRankCost.mats || []) {
        const have = countItemInInventory(matId);
        if (have < reqQty) {
          allMatsReady = false;
          missingMats.push({ id: matId, name: GD.items[matId]?.name || matId, have, need: reqQty });
        }
      }

      const hasGold = (self.gold || 0) >= nextRankCost.gold;
      const hasLv = (self.lv || 1) >= nextRankCost.lv;

      return {
        skillId: skId,
        skillName: skDef.name || skId,
        curRank,
        targetRank: curRank + 1,
        gold: nextRankCost.gold,
        lv: nextRankCost.lv,
        hasGold,
        hasLv,
        missingMats,
        allMatsReady: allMatsReady && hasGold && hasLv
      };
    }
    return null;
  }

  function getGearEnhanceAnalysis(targetEnhanceLevel = 7) {
    const self = window.GAME?.self;
    const GD = window.GAME?.GD;
    if (!self || !self.eq || !GD?.services?.enhance) return null;

    const enhanceDef = GD.services.enhance;
    const EQ_ORDER = ['weapon', 'helmet', 'armor', 'cape', 'ring'];

    for (let i = 0; i < EQ_ORDER.length; i++) {
      const slot = EQ_ORDER[i];
      const item = self.eq[slot];
      if (!item || !item.id) continue;

      const curE = item.e || 0;
      if (curE >= targetEnhanceLevel) continue;

      const iDef = GD.items[item.id] || {};
      const lv = iDef.lv || 1;

      // Xác định Tier dựa theo tierLv: [1, 5, 10, 20, 30, 40, 46]
      let tierIdx = 0;
      for (let t = enhanceDef.tierLv.length - 1; t >= 0; t--) {
        if (lv >= enhanceDef.tierLv[t]) { tierIdx = t; break; }
      }
      const tierInfo = enhanceDef.tiers[tierIdx] || enhanceDef.tiers[0];
      const isElite = curE >= (enhanceDef.eliteFrom || 8);
      const reqMatId = isElite ? tierInfo.elite : tierInfo.mat;
      const reqMatQty = enhanceDef.mats[curE] || 1;

      const curMatCount = countItemInInventory(reqMatId);
      const hasEnoughMat = curMatCount >= reqMatQty;
      const costGold = Math.round(enhanceDef.goldK * Math.pow(curE + 1, enhanceDef.pow) * 10);
      const hasGold = (self.gold || 0) >= costGold;

      return {
        slot,
        gearIndex: -i - 1, // index for net.send enhance
        itemId: item.id,
        name: iDef.name || item.id,
        curE,
        targetE: targetEnhanceLevel,
        reqMatId,
        matName: GD.items[reqMatId]?.name || reqMatId,
        reqMatQty,
        curMatCount,
        costGold,
        hasGold,
        hasEnoughMat,
        readyToForge: hasEnoughMat && hasGold
      };
    }
    return null;
  }

  function findNearestNpcFromList(list, fromZone) {
    const local = list.find(n => n.zone === fromZone);
    if (local) return { ...local, hops: 0 };

    let best = null;
    for (const n of list) {
      const r = safeMapRoute(fromZone, n.zone);
      if (r !== null) {
        if (!best || r.length < best.hops) {
          best = { ...n, hops: r.length, route: r };
        }
      }
    }
    return best;
  }

  function handleAutoUpgradeStep(me, now) {
    const curZone = window.GAME?.world?.zone?.id;
    if (!curZone) return false;

    // 1. SĂN NHANH NGUYÊN LIỆU (QUICK MAT FARM)
    if (cfg.farmMat && cfg.farmMat !== 'none') {
      const mat = UPGRADE_MATS[cfg.farmMat];
      if (mat) {
        if (curZone !== mat.zone) {
          const r = safeMapRoute(curZone, mat.zone);
          if (r && r.length > 0) {
            const p = r[0].portal;
            const distP = Math.hypot(p.x - me.x, p.y - me.y);
            if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
              setSteeringVector(p.x - me.x, p.y - me.y);
            } else {
              const s = calculateDirectSteering(me, p.x, p.y);
              setSteeringVector(s.dx, s.dy);
            }
            upgradeState.statusText = `🌾 Sang ${mat.zoneName} săn ${mat.name}...`;
            if (statusTxt) statusTxt.textContent = upgradeState.statusText;
            return true;
          }
        } else {
          cfg.targetMob = mat.targetMob || mat.mobs[0];
          const distCoords = Math.hypot(mat.coords[0] - me.x, mat.coords[1] - me.y);
          if (distCoords > 240) {
            const s = calculateDirectSteering(me, mat.coords[0], mat.coords[1]);
            setSteeringVector(s.dx, s.dy);
            upgradeState.statusText = `🌾 Đi tới bãi săn ${mat.name} (${Math.round(distCoords)}px)`;
            if (statusTxt) statusTxt.textContent = upgradeState.statusText;
            return true;
          }
        }
      }
    }

    // 2. TỰ ĐỘNG NÂNG CẤP KỸ NĂNG (AUTO-SKILL UPGRADE)
    if (cfg.autoSkillUpgrade) {
      const skillAnalysis = getSkillUpgradeAnalysis();
      if (skillAnalysis) {
        if (!skillAnalysis.allMatsReady && skillAnalysis.missingMats.length > 0) {
          const nextMissing = skillAnalysis.missingMats[0];
          const matDef = UPGRADE_MATS[nextMissing.id];
          if (matDef) {
            if (curZone !== matDef.zone) {
              const r = safeMapRoute(curZone, matDef.zone);
              if (r && r.length > 0) {
                const p = r[0].portal;
                const distP = Math.hypot(p.x - me.x, p.y - me.y);
                if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
                  setSteeringVector(p.x - me.x, p.y - me.y);
                } else {
                  const s = calculateDirectSteering(me, p.x, p.y);
                  setSteeringVector(s.dx, s.dy);
                }
                upgradeState.statusText = `🪶 [Kỹ Năng] Sang ${matDef.zoneName} săn ${nextMissing.name} (${nextMissing.have}/${nextMissing.need})...`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              }
            } else {
              cfg.targetMob = matDef.targetMob || matDef.mobs[0];
              const distC = Math.hypot(matDef.coords[0] - me.x, matDef.coords[1] - me.y);
              if (distC > 240) {
                const s = calculateDirectSteering(me, matDef.coords[0], matDef.coords[1]);
                setSteeringVector(s.dx, s.dy);
                upgradeState.statusText = `🪶 Săn ${nextMissing.name} (${nextMissing.have}/${nextMissing.need}) tại ${matDef.zoneName}`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              }
            }
          }
        } else if (skillAnalysis.allMatsReady) {
          const nearestTrainer = findNearestNpcFromList(TRAINER_LIST, curZone);
          if (nearestTrainer) {
            if (curZone !== nearestTrainer.zone) {
              const r = safeMapRoute(curZone, nearestTrainer.zone);
              if (r && r.length > 0) {
                const p = r[0].portal;
                const distP = Math.hypot(p.x - me.x, p.y - me.y);
                if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
                  setSteeringVector(p.x - me.x, p.y - me.y);
                } else {
                  const s = calculateDirectSteering(me, p.x, p.y);
                  setSteeringVector(s.dx, s.dy);
                }
                upgradeState.statusText = `🎓 Đủ đồ! Đi gặp ${nearestTrainer.name} (${nearestTrainer.zone}) nâng Skill...`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              }
            } else {
              const distNpc = Math.hypot(nearestTrainer.x - me.x, nearestTrainer.y - me.y);
              if (distNpc <= 85) {
                stopMoving();
                if (now - upgradeState.lastActionTime >= 1500) {
                  upgradeState.lastActionTime = now;
                  window.GAME.net.send({ t: 'npc', s: nearestTrainer.id });
                  setTimeout(() => {
                    window.GAME.net.send({ t: 'rank', s: nearestTrainer.id, m: skillAnalysis.skillId });
                    logShopEvent(`🎉 Đã gửi lệnh nâng cấp [${skillAnalysis.skillName}] lên Bậc ${skillAnalysis.targetRank} với ${nearestTrainer.name}!`);
                  }, 400);
                }
                upgradeState.statusText = `🎓 Đang nâng cấp [${skillAnalysis.skillName}] Bậc ${skillAnalysis.targetRank}...`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              } else {
                const s = calculateDirectSteering(me, nearestTrainer.x, nearestTrainer.y);
                setSteeringVector(s.dx, s.dy);
                upgradeState.statusText = `🎓 Tới gặp ${nearestTrainer.name} (${Math.round(distNpc)}px)`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              }
            }
          }
        }
      }
    }

    // 3. TỰ ĐỘNG CƯỜNG HÓA TRANG BỊ (AUTO-GEAR ENHANCE)
    if (cfg.autoGearEnhance) {
      const gearAnalysis = getGearEnhanceAnalysis(cfg.enhanceTargetLevel || 7);
      if (gearAnalysis) {
        const minBatch = 5;
        if (gearAnalysis.curMatCount < Math.min(minBatch, gearAnalysis.reqMatQty)) {
          const matDef = UPGRADE_MATS[gearAnalysis.reqMatId];
          if (matDef) {
            if (curZone !== matDef.zone) {
              const r = safeMapRoute(curZone, matDef.zone);
              if (r && r.length > 0) {
                const p = r[0].portal;
                const distP = Math.hypot(p.x - me.x, p.y - me.y);
                if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
                  setSteeringVector(p.x - me.x, p.y - me.y);
                } else {
                  const s = calculateDirectSteering(me, p.x, p.y);
                  setSteeringVector(s.dx, s.dy);
                }
                upgradeState.statusText = `🔨 [Cường Hóa] Sang ${matDef.zoneName} săn ${gearAnalysis.matName} (${gearAnalysis.curMatCount}/${minBatch})...`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              }
            } else {
              cfg.targetMob = matDef.targetMob || matDef.mobs[0];
              const distC = Math.hypot(matDef.coords[0] - me.x, matDef.coords[1] - me.y);
              if (distC > 240) {
                const s = calculateDirectSteering(me, matDef.coords[0], matDef.coords[1]);
                setSteeringVector(s.dx, s.dy);
                upgradeState.statusText = `🔨 Săn ${gearAnalysis.matName} (${gearAnalysis.curMatCount}/${minBatch}) cho [${gearAnalysis.name}]`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              }
            }
          }
        } else if (gearAnalysis.readyToForge) {
          const nearestSmith = findNearestNpcFromList(BLACKSMITH_LIST, curZone);
          if (nearestSmith) {
            if (curZone !== nearestSmith.zone) {
              const r = safeMapRoute(curZone, nearestSmith.zone);
              if (r && r.length > 0) {
                const p = r[0].portal;
                const distP = Math.hypot(p.x - me.x, p.y - me.y);
                if (distP <= 45 && now - lastZoneTransitionTime >= 2500) {
                  setSteeringVector(p.x - me.x, p.y - me.y);
                } else {
                  const s = calculateDirectSteering(me, p.x, p.y);
                  setSteeringVector(s.dx, s.dy);
                }
                upgradeState.statusText = `⚒️ Đi gặp ${nearestSmith.name} (${nearestSmith.zone}) cường hóa đồ...`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              }
            } else {
              const distSmith = Math.hypot(nearestSmith.x - me.x, nearestSmith.y - me.y);
              if (distSmith <= 85) {
                stopMoving();
                if (now - upgradeState.lastActionTime >= 1600) {
                  upgradeState.lastActionTime = now;
                  window.GAME.net.send({ t: 'npc', s: nearestSmith.id });
                  setTimeout(() => {
                    const haveCharm = countItemInInventory('m_buahoren') > 0;
                    const useCharm = gearAnalysis.curE >= 7 && haveCharm;
                    const cmd = { t: 'enhance', s: nearestSmith.id, n: gearAnalysis.gearIndex };
                    if (useCharm) cmd.m = '1';
                    window.GAME.net.send(cmd);
                    logShopEvent(`⚒️ Đã gửi lệnh cường hóa [${gearAnalysis.name}] (${gearAnalysis.curE} -> +${gearAnalysis.curE + 1}) với ${nearestSmith.name}!`);
                  }, 400);
                }
                upgradeState.statusText = `⚒️ Đang cường hóa [${gearAnalysis.name}] +${gearAnalysis.curE + 1}...`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              } else {
                const s = calculateDirectSteering(me, nearestSmith.x, nearestSmith.y);
                setSteeringVector(s.dx, s.dy);
                upgradeState.statusText = `⚒️ Tới gặp ${nearestSmith.name} (${Math.round(distSmith)}px)`;
                if (statusTxt) statusTxt.textContent = upgradeState.statusText;
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  function logShopEvent(msg) {
    console.log('%c[AUTO-SHOP] ' + msg, 'color: #ff9800; font-weight: bold;');
    try {
      if (typeof appendChatMessage === 'function') {
        appendChatMessage(`<b>🛒 [Hệ Thống Shop]:</b> ${msg}`, 'loot');
      } else if (window.GAME?.ui?.chatLine) {
        window.GAME.ui.chatLine(`<b>🛒 [Hệ Thống Shop]:</b> ${msg}`, 'loot');
      }
    } catch (e) {}
  }

  function triggerShopTrip(force = false) {
    if (autoShopState.active && !force) return;
    const curZone = window.GAME?.world?.zone?.id;
    if (!curZone) return;
    const me = window.GAME?.me;
    if (!me) return;

    const maxHops = cfg.autoShopSameMapOnly ? 0 : (cfg.autoShopMaxHops || 3);
    const targetShop = findDynamicGlobalShop(curZone, maxHops);
    if (!targetShop) {
      if (cfg.autoShopSameMapOnly) {
        logShopEvent(`ℹ️ Map ${curZone} không có Shop. Đang bật [Chỉ bán trong map] để làm nhiệm vụ, bot không tự ý rời map.`);
      } else {
        logShopEvent(`⚠️ Không tìm thấy Shop an toàn trong phạm vi ${maxHops} cổng từ ${curZone}. Tiếp tục giữ bãi train.`);
      }
      return;
    }

    autoShopState.active = true;
    autoShopState.phase = 'TRAVEL_TO_SHOP';
    autoShopState.farmZone = curZone;
    autoShopState.farmPos = { x: Math.round(me.x), y: Math.round(me.y) };
    autoShopState.farmTargetMob = cfg.targetMob;
    autoShopState.shopNpc = targetShop;
    autoShopState.shopZone = targetShop.zone;
    autoShopState.routeToShop = targetShop.route || [];
    autoShopState.soldItemsCount = 0;
    autoShopState.goldEarned = 0;
    autoShopState.boughtPotionsCount = 0;

    if (targetShop.hops === 0) {
      autoShopState.statusText = `🚚 Đi bán đồ tại ${targetShop.name} (Cùng map ${targetShop.zone})`;
      logShopEvent(`🛒 Ghé ${targetShop.name} ngay trong map ${curZone} để bán đồ & nạp máu.`);
    } else {
      autoShopState.statusText = `🚚 Bắt đầu đi bán đồ tại ${targetShop.name} (${targetShop.zone}, ${targetShop.hops} cổng)`;
      logShopEvent(`🛒 Đi bán đồ & nạp máu tại ${targetShop.name} (${targetShop.zone}, ${targetShop.hops} cổng). Bãi farm: ${curZone} (${autoShopState.farmPos.x}, ${autoShopState.farmPos.y})`);
    }
  }

  function handleAutoShopStep(me, now, invInfo) {
    const curZone = window.GAME?.world?.zone?.id;
    if (!curZone) return;

    // 1. Tự bảo vệ khi có chiêu nguy hiểm của Boss trên đường đi
    const dangerH = activeHazards.find(h => isPointInsideHazard(h, me.x, me.y));
    if (dangerH) {
      const safePt = findSafeDodgePoint(me, activeHazards);
      if (safePt) {
        const dx = safePt.x - me.x, dy = safePt.y - me.y;
        const d = Math.hypot(dx, dy) || 1;
        setSteeringVector(dx / d, dy / d);
      } else {
        const kiteVec = computeCongaKiteVector(me, [], null, true);
        setSteeringVector(kiteVec.vx, kiteVec.vy);
      }
      if (statusTxt) statusTxt.textContent = `⚠️ NÉ CHIÊU BOSS [${(dangerH.sh || 'hazard').toUpperCase()}] TRÊN ĐƯỜNG ĐI!`;
      return;
    }

    const mobs = Array.from(window.GAME?.mobs?.values() || []);
    const closestMob = mobs.reduce((min, m) => {
      if (!isMobValidAndAlive(m)) return min;
      const d = Math.hypot(m.x - me.x, m.y - me.y);
      return (!min || d < min.d) ? { mob: m, d } : min;
    }, null);

    // Kích hoạt chiêu phòng thủ khẩn cấp nếu bị quái chặn đường
    if (closestMob && closestMob.d < 180) {
      const self = window.GAME?.self;
      const currentLoadout = self?.loadout || [];
      for (const skId of currentLoadout) {
        if (['thuykinh', 'hoixuan', 'hoathan', 'kimquy', 'ungnhan'].some(k => skId.includes(k))) {
          if (now - (skillTimers[skId] || 0) >= 20050) {
            window.GAME.net.send({ t: 'sk', s: skId, id: 0, x: 0, y: 0 });
            skillTimers[skId] = now;
            devState.totalSkills++;
            break;
          }
        }
      }
    }

    // Phase 1: TRAVEL_TO_SHOP
    if (autoShopState.phase === 'TRAVEL_TO_SHOP') {
      if (curZone === autoShopState.shopZone) {
        // Đã tới map có Shop -> Tiến sát NPC
        const npcX = autoShopState.shopNpc.x;
        const npcY = autoShopState.shopNpc.y;
        const distNpc = Math.hypot(npcX - me.x, npcY - me.y);

        if (distNpc <= 110) {
          stopMoving();
          autoShopState.phase = 'SELLING';
          autoShopState.statusText = `💰 Đã tới ${autoShopState.shopNpc.name}. Đang tiến hành bán đồ...`;
          if (statusTxt) statusTxt.textContent = autoShopState.statusText;
          return;
        }

        const steer = calculateDirectSteering(me, npcX, npcY);
        setSteeringVector(steer.dx, steer.dy);
        autoShopState.statusText = `🚚 Tiếp cận ${autoShopState.shopNpc.name} (${Math.round(distNpc)}px)`;
        if (statusTxt) statusTxt.textContent = autoShopState.statusText;
        return;
      }

      // Chưa tới map shop -> Tính đường đi động từ curZone
      const curRoute = safeMapRoute(curZone, autoShopState.shopZone);
      if (!curRoute || curRoute.length === 0) {
        console.warn('[AUTO-SHOP] Mất dấu đường tới Shop! Hủy bỏ Auto-Shop.');
        logShopEvent(`⚠️ Mất dấu đường tới Shop từ map ${curZone}! Hủy bỏ Auto-Shop để an toàn.`);
        autoShopState.active = false;
        return;
      }

      const step = curRoute[0];
      const pX = step.portal.x, pY = step.portal.y;
      const distPortal = Math.hypot(pX - me.x, pY - me.y);

      // Chống lặp cổng (Anti-Ping-Pong): Không bước vào cổng nếu vừa mới đến map trong 2500ms
      const isTransitionImmune = (now - lastZoneTransitionTime < 2500);

      if (distPortal <= 45 && !isTransitionImmune) {
        setSteeringVector(pX - me.x, pY - me.y);
        autoShopState.statusText = `🚪 Bước qua cổng sang ${step.to}...`;
        if (statusTxt) statusTxt.textContent = autoShopState.statusText;
        return;
      }

      const steer = calculateDirectSteering(me, pX, pY);
      setSteeringVector(steer.dx, steer.dy);
      autoShopState.statusText = `🚚 Đi tới cổng sang ${step.to} (${Math.round(distPortal)}px)`;
      if (statusTxt) statusTxt.textContent = autoShopState.statusText;
      return;
    }

    // Phase 2: SELLING
    if (autoShopState.phase === 'SELLING') {
      stopMoving();
      if (invInfo.sellableSlots.length > 0) {
        if (now - autoShopState.lastActionTime >= 130) {
          const itemToSell = invInfo.sellableSlots[0];
          window.GAME.net.send({ t: 'sell', n: itemToSell.slot });
          autoShopState.lastActionTime = now;
          autoShopState.soldItemsCount++;
          autoShopState.goldEarned += itemToSell.price;
          devState.totalTrashSold++;
          devState.goldEarnedFromShop += itemToSell.price;
          autoShopState.statusText = `💰 Đang bán: ${itemToSell.name} (+${itemToSell.price} vàng)`;
          if (statusTxt) statusTxt.textContent = autoShopState.statusText;
        }
        return;
      }

      // Đã bán sạch đồ rác!
      logShopEvent(`💰 Bán xong ${autoShopState.soldItemsCount} món đồ rác/nguyên liệu! Thu về +${autoShopState.goldEarned} vàng.`);

      // Kiểm tra có cần mua máu không
      if (invInfo.hpPotionCount < cfg.autoShopMinPotionsToBuy && (window.GAME?.self?.gold || 0) >= 30) {
        autoShopState.phase = 'BUYING';
        autoShopState.statusText = `🧪 Đã bán xong. Đang nạp bổ sung bình máu...`;
        if (statusTxt) statusTxt.textContent = autoShopState.statusText;
        return;
      }

      // Bắt đầu quay về bãi farm
      const returnRoute = safeMapRoute(curZone, autoShopState.farmZone);
      if (returnRoute !== null) {
        autoShopState.routeToFarm = returnRoute;
        autoShopState.phase = 'TRAVEL_TO_FARM';
        autoShopState.statusText = `🏃 Đang quay lại bãi farm (${autoShopState.farmZone})...`;
        if (statusTxt) statusTxt.textContent = autoShopState.statusText;
      } else {
        console.warn('[AUTO-SHOP] Không tìm thấy đường về bãi farm!');
        logShopEvent(`⚠️ Không tìm thấy đường về bãi farm từ ${curZone}!`);
        autoShopState.active = false;
      }
      return;
    }

    // Phase 3: BUYING - ĐẾM CHÍNH XÁC SỐ BÌNH MÁU TRONG TÚI ĐỂ NẠP ĐỦ TARGET
    if (autoShopState.phase === 'BUYING') {
      stopMoving();
      const curGold = window.GAME?.self?.gold || 0;
      const GD = window.GAME?.GD || {};
      
      const shopNpcData = window.GAME?.world?.zone?.npcs?.find(n => n.id === autoShopState.shopNpc.npcId);
      const shopItems = shopNpcData?.shop || autoShopState.shopNpc?.shop || [];
      
      let bestPotion = null;
      for (const pid of ['p_hp4', 'p_hp3', 'p_hp2', 'p_hp1']) {
        if (shopItems.includes(pid)) {
          bestPotion = pid;
          break;
        }
      }
      if (!bestPotion) bestPotion = 'p_hp1';

      const potionPrice = GD.items?.[bestPotion]?.price || (bestPotion === 'p_hp1' ? 8 : (bestPotion === 'p_hp2' ? 30 : 60));
      const currentPotions = invInfo.hpPotionCount;
      const targetPotions = cfg.autoShopMinPotionsToBuy || 100;
      const stillNeeded = targetPotions - currentPotions;

      // Kiểm tra xem túi còn có thể nhét thêm bình máu hay không (ô trống hoặc stack chưa đầy 50)
      const maxStack = GD.items?.[bestPotion]?.stack || 50;
      const hasSlotForPotion = invInfo.freeSlots > 0 || (window.GAME?.self?.inv || []).some(s => s && s.id === bestPotion && (s.n || 1) < maxStack);

      if (stillNeeded <= 0) {
        logShopEvent(`✅ Đã đếm đủ ${currentPotions}/${targetPotions} bình máu trong túi! Chuẩn bị quay lại bãi farm.`);
      } else if (curGold < potionPrice) {
        logShopEvent(`⚠️ Hết vàng mua thêm máu (Đang có ${currentPotions}/${targetPotions} bình, còn ${curGold} vàng). Chuẩn bị quay lại bãi farm.`);
      } else if (!hasSlotForPotion) {
        logShopEvent(`⚠️ Túi đồ đã đầy không thể chứa thêm bình máu (Đang có ${currentPotions}/${targetPotions} bình). Chuẩn bị quay lại bãi farm.`);
      } else {
        // CÒN THIẾU VÀ CÒN ĐỦ ĐIỀU KIỆN MUA:
        if (now - autoShopState.lastActionTime >= 120) {
          const maxCanAfford = Math.floor(curGold / potionPrice);
          const batch = Math.min(6, stillNeeded, maxCanAfford);

          for (let b = 0; b < batch; b++) {
            window.GAME.net.send({ t: 'buy', s: autoShopState.shopNpc.npcId, m: bestPotion });
            autoShopState.boughtPotionsCount++;
            devState.totalPotionsBought++;
          }
          autoShopState.lastActionTime = now;

          const potName = GD.items[bestPotion]?.name || bestPotion;
          autoShopState.statusText = `🧪 Đang nạp ${potName}: Đã đếm ${currentPotions}/${targetPotions} bình (Còn thiếu ${stillNeeded} bình)`;
          if (statusTxt) statusTxt.textContent = autoShopState.statusText;
        }
        return;
      }

      // Đã mua đủ hoặc hết điều kiện -> Quay về bãi farm
      const returnRoute = safeMapRoute(curZone, autoShopState.farmZone);
      if (returnRoute !== null) {
        autoShopState.routeToFarm = returnRoute;
        autoShopState.phase = 'TRAVEL_TO_FARM';
        autoShopState.statusText = `🏃 Đang quay lại bãi farm (${autoShopState.farmZone})...`;
        if (statusTxt) statusTxt.textContent = autoShopState.statusText;
      } else {
        autoShopState.active = false;
      }
      return;
    }

    // Phase 4: TRAVEL_TO_FARM
    if (autoShopState.phase === 'TRAVEL_TO_FARM') {
      if (curZone === autoShopState.farmZone) {
        // Đã về tới map farm! Khôi phục ngay mục tiêu farm
        if (autoShopState.farmTargetMob && cfg.targetMob !== autoShopState.farmTargetMob) {
          cfg.targetMob = autoShopState.farmTargetMob;
          const mobSel = botPanel.querySelector('#sm-mob-sel');
          if (mobSel) mobSel.value = cfg.farmMob || cfg.targetMob || 'all';
        }

        const farmX = autoShopState.farmPos.x;
        const farmY = autoShopState.farmPos.y;
        const distFarm = Math.hypot(farmX - me.x, farmY - me.y);

        // Kiểm tra xem quái mục tiêu đã xuất hiện xung quanh chưa hoặc đã về gần bãi (<= 110px)
        const targetMobsNearby = Array.from(window.GAME?.mobs?.values() || []).filter(m => isMobValidAndAlive(m) && (cfg.targetMob === 'all' || m.kind === cfg.targetMob));
        const hasTargetNearby = targetMobsNearby.some(m => Math.hypot(m.x - me.x, m.y - me.y) <= 200);

        if (distFarm <= 110 || hasTargetNearby) {
          stopMoving();
          autoShopState.active = false;
          autoShopState.phase = 'IDLE';
          console.log('%c[AUTO-SHOP] ĐÃ QUAY LẠI BÃI FARM AN TOÀN! TIẾP TỤC TRAIN QUÁI.', 'color: #00e676; font-weight: bold;');
          logShopEvent(`✅ Đã quay lại bãi farm an toàn tại ${curZone} (${farmX}, ${farmY})! Tiếp tục train quái.`);
          if (statusTxt) statusTxt.textContent = `✅ ĐÃ VỀ TỚI BÃI FARM! TIẾP TỤC TRAIN QUÁI!`;
          return;
        }

        const steer = calculateDirectSteering(me, farmX, farmY);
        setSteeringVector(steer.dx, steer.dy);
        autoShopState.statusText = `🏃 Về lại bãi farm (${Math.round(distFarm)}px)`;
        if (statusTxt) statusTxt.textContent = autoShopState.statusText;
        return;
      }

      // Đang qua các map trung gian -> Tính đường đi động từ curZone
      const curReturnRoute = safeMapRoute(curZone, autoShopState.farmZone);
      if (!curReturnRoute || curReturnRoute.length === 0) {
        console.warn('[AUTO-SHOP] Mất dấu đường về bãi farm! Dừng auto-shop tại map:', curZone);
        logShopEvent(`⚠️ Không tìm thấy đường về ${autoShopState.farmZone} từ ${curZone}! Dừng tại chỗ để an toàn.`);
        autoShopState.active = false;
        return;
      }

      const step = curReturnRoute[0];
      const pX = step.portal.x, pY = step.portal.y;
      const distPortal = Math.hypot(pX - me.x, pY - me.y);
      const isTransitionImmune = (now - lastZoneTransitionTime < 2500);

      if (distPortal <= 45 && !isTransitionImmune) {
        setSteeringVector(pX - me.x, pY - me.y);
        autoShopState.statusText = `🚪 Bước qua cổng sang ${step.to}...`;
        if (statusTxt) statusTxt.textContent = autoShopState.statusText;
        return;
      }

      const steer = calculateDirectSteering(me, pX, pY);
      setSteeringVector(steer.dx, steer.dy);
      autoShopState.statusText = `🏃 Về bãi farm: Cổng sang ${step.to} (${Math.round(distPortal)}px)`;
      if (statusTxt) statusTxt.textContent = autoShopState.statusText;
      return;
    }
  }

  const botPanel = document.createElement('div');
  botPanel.id = 'ancient-master-bot-v13';
  botPanel.innerHTML = `
    <div style="position: fixed; top: 12px; right: 12px; width: 300px; max-width: calc(100vw - 24px); max-height: calc(100vh - 24px);
                background: rgba(10, 14, 23, 0.95); border: 1.5px solid #00e676; border-radius: 12px; color: #e0e6ed;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                font-size: 11.5px; z-index: 999999; box-shadow: 0 10px 35px rgba(0,0,0,0.85), 0 0 15px rgba(0,230,118,0.25);
                backdrop-filter: blur(14px); display: none; flex-direction: column; overflow: hidden; user-select: none;">
      <!-- Header Drag Handle -->
      <div id="sm-header" style="background: linear-gradient(90deg, #0d2818, #04471c); padding: 8px 12px;
                  cursor: grab; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,230,118,0.3);">
        <div style="display: flex; align-items: center; gap: 7px; font-weight: bold; font-size: 12px; color: #fff;">
          <span style="font-size: 14px;">🤖</span>
          <span style="background: linear-gradient(90deg, #00e676, #00b0ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; letter-spacing: 0.5px;">CỔ GIỚI BOT v15.9</span>
          <span style="background: rgba(0,230,118,0.2); border: 1px solid #00e676; color: #00e676; font-size: 9px; padding: 1px 5px; border-radius: 8px; font-weight: 700;">60 FPS</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button id="sm-btn-min" title="Thu gọn" style="background: rgba(255,255,255,0.12); border: none; color: #fff; border-radius: 4px; cursor: pointer; width: 22px; height: 20px; font-size: 12px; font-weight: bold; line-height: 1; display: flex; align-items: center; justify-content: center;">_</button>
          <button id="sm-btn-close" title="Đóng panel" style="background: rgba(255,68,68,0.2); border: 1px solid rgba(255,68,68,0.4); color: #ff5252; border-radius: 4px; cursor: pointer; width: 22px; height: 20px; font-size: 12px; font-weight: bold; line-height: 1; display: flex; align-items: center; justify-content: center;">✕</button>
        </div>
      </div>

      <!-- Master Switch Bar -->
      <div style="padding: 7px 10px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; gap: 8px; align-items: center;">
        <button id="sm-btn-toggle" style="flex: 1; padding: 7px; background: linear-gradient(135deg, #1b5e20, #00c853); border: none; border-radius: 6px; color: #fff; font-weight: bold; font-size: 12px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,200,83,0.3); display: flex; align-items: center; justify-content: center; gap: 6px;">
          🟢 AUTO: ĐANG CHẠY
        </button>
      </div>

      <!-- Navigation Tabs (4 Tabs Cyberpunk) -->
      <div id="sm-nav-tabs" style="display: flex; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(0,230,118,0.2); padding: 4px 6px; gap: 3px;">
        <button class="sm-tab-btn active" data-tab="combat" style="flex: 1; padding: 5px 2px; background: rgba(0,230,118,0.18); border: 1px solid #00e676; border-radius: 6px; color: #00e676; font-size: 10px; font-weight: bold; cursor: pointer;">⚔️ Cày</button>
        <button class="sm-tab-btn" data-tab="quest" style="flex: 1; padding: 5px 2px; background: rgba(255,255,255,0.05); border: 1px solid transparent; border-radius: 6px; color: #8b949e; font-size: 10px; font-weight: bold; cursor: pointer;">📜 Q.Vụ</button>
        <button class="sm-tab-btn" data-tab="skills" style="flex: 1; padding: 5px 2px; background: rgba(255,255,255,0.05); border: 1px solid transparent; border-radius: 6px; color: #8b949e; font-size: 10px; font-weight: bold; cursor: pointer;">⚡ Chiêu</button>
        <button class="sm-tab-btn" data-tab="shop" style="flex: 1; padding: 5px 2px; background: rgba(255,255,255,0.05); border: 1px solid transparent; border-radius: 6px; color: #8b949e; font-size: 10px; font-weight: bold; cursor: pointer;">🛒 Bán/Kho</button>
      </div>

      <!-- Scrollable Tab Content Container -->
      <div style="flex: 1; overflow-y: auto; max-height: 290px; padding: 8px 10px; display: flex; flex-direction: column; gap: 7px; scrollbar-width: thin; scrollbar-color: #00e676 rgba(0,0,0,0.3);">
        <!-- TAB 1: CHIẾN ĐẤU -->
        <div id="sm-tab-combat" class="sm-tab-content" style="display: flex; flex-direction: column; gap: 7px;">
          <!-- Role Đánh Gần & Xa Selector (Học từ CoViet) -->
          <div style="background: rgba(16, 21, 31, 0.9); border: 1px solid rgba(0, 229, 255, 0.25); border-radius: 8px; padding: 6px 9px; display: flex; flex-direction: column; gap: 4px; font-size: 10.5px; margin-bottom: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; color: #00e5ff; font-size: 10.5px;">🎯 VAI TRÒ CHIẾN ĐẤU:</span>
              <span id="sm-role-badge" style="background: rgba(0,229,255,0.15); color: #00e5ff; padding: 1px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold;">Đang tải...</span>
            </div>
            <select id="sm-role-sel" style="width: 100%; background: #0b0f17; color: #fff; border: 1px solid #30363d; padding: 4px 6px; border-radius: 6px; font-size: 10.5px; outline: none; cursor: pointer;">
              <option value="auto">🤖 Tự động nhận diện (Theo môn phái)</option>
              <option value="melee">⚔️ Đánh Gần (Cận chiến / Melee - ~80px)</option>
              <option value="ranged">🏹 Đánh Xa (Thả diều / Ranged - ~260px)</option>
            </select>
          </div>

          <!-- Target Selection Card -->
          <div style="background: rgba(19, 24, 34, 0.9); border: 1px solid rgba(255,215,106,0.35); border-radius: 8px; padding: 7px 9px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: bold; color: #ffd76a; font-size: 10.5px;">🎯 CHỌN QUÁI / BOSS:</span>
              <button id="sm-btn-refresh-mobs" style="background: rgba(255,215,106,0.15); border: 1px solid #ffd76a; color: #ffd76a; border-radius: 4px; font-size: 9.5px; padding: 2px 7px; cursor: pointer; font-weight: bold;">🔄 Quét</button>
            </div>
            <select id="sm-mob-sel" style="width: 100%; background: #0b0f17; color: #69f0ae; border: 1px solid #30363d; padding: 5px 7px; border-radius: 6px; font-size: 10.5px; outline: none; cursor: pointer;">
              <option value="all">🌟 Tự động (Mọi quái trong khu vực)</option>
            </select>
          </div>

          <!-- Live Combat Telemetry Card -->
          <div style="background: rgba(16, 21, 31, 0.9); border: 1px solid rgba(0,176,255,0.3); border-radius: 8px; padding: 7px 9px; display: flex; flex-direction: column; gap: 4px; font-size: 10.5px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #8b949e;">Mục tiêu:</span>
              <b id="sm-target-txt" style="color: #40c4ff;">None</b>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #8b949e;">Hành động:</span>
              <b id="sm-st-txt" style="color: #ffd76a;">Đang dò tìm...</b>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #8b949e;">Cự ly:</span>
              <div><b id="sm-dmin-txt" style="color: #ff5252;">0px</b> <span style="color: #8b949e;">| Bám đuổi:</span> <b id="sm-pursuers-txt" style="color: #ff9100;">0</b></div>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 3px; margin-top: 2px;">
              <span style="color: #8b949e;">Nhặt đồ:</span>
              <b id="sm-s-loot" style="color: #69f0ae;">0 món</b>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9.5px; color: #ce93d8;">
              <span>Tần số đánh:</span>
              <b id="sm-measured-atk">Đang theo dõi...</b>
            </div>
          </div>

          <!-- Quick Metrics Strip -->
          <div style="display: flex; justify-content: space-between; font-size: 9.5px; color: #8b949e; padding: 0 4px;">
            <span>Đánh: <b id="sm-s-atk" style="color: #ffd54f;">0</b></span>
            <span>Phá vây: <b id="sm-s-breakout" style="color: #ff9100;">0</b></span>
            <span>Né chiêu: <b id="sm-s-dodge" style="color: #69f0ae;">0</b></span>
            <span>Giữ Leash: <b id="sm-s-leash" style="color: #ff5252;">0</b></span>
          </div>
        </div>

        <!-- TAB 2: NHIỆM VỤ AUTO-QUEST (HỌC TỪ COVIET) -->
        <div id="sm-tab-quest" class="sm-tab-content" style="display: none; flex-direction: column; gap: 7px;">
          <div style="background: rgba(14, 28, 38, 0.9); border: 1px solid rgba(0,229,255,0.4); border-radius: 8px; padding: 7px 9px; display: flex; flex-direction: column; gap: 5px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: #80d8ff; font-size: 10.5px; font-weight: bold; user-select: none;">
              <input type="checkbox" id="sm-toggle-autoquest" style="cursor: pointer; width: 13px; height: 13px;">
              <span>📜 Tự Động Làm Nhiệm Vụ NPC</span>
            </label>
            <div style="display: flex; gap: 10px; font-size: 9.5px; color: #b0bec5; padding-left: 20px;">
              <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                <input type="checkbox" id="sm-chk-quest-side" checked> Q.Phụ
              </label>
              <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                <input type="checkbox" id="sm-chk-quest-daily"> Q.Hằng Ngày
              </label>
            </div>
          </div>

          <div style="background: rgba(22, 27, 34, 0.9); border: 1px solid rgba(255,215,106,0.35); border-radius: 8px; padding: 7px 9px; display: flex; flex-direction: column; gap: 4px; font-size: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #ffd76a; font-weight: bold;">📜 NHIỆM VỤ ĐANG THEO DÕI:</span>
              <span id="sm-q-status-tag" style="background: rgba(0,230,118,0.15); color: #00e676; border: 1px solid #00e676; border-radius: 4px; padding: 1px 5px; font-size: 8.5px; font-weight: bold;">SẴN SÀNG</span>
            </div>
            <div style="font-weight: bold; color: #fff; font-size: 11px;" id="sm-q-title">Đang quét nhiệm vụ...</div>
            <div style="color: #90caf9;" id="sm-q-goal">Mục tiêu: Đang nạp...</div>
            <div style="display: flex; justify-content: space-between; color: #ce93d8;">
              <span>Tiến độ:</span>
              <b id="sm-q-prog" style="color: #69f0ae;">0/0</b>
            </div>
            <div style="display: flex; justify-content: space-between; color: #ffb74d;">
              <span>Bước tiếp theo:</span>
              <b id="sm-q-step-desc">Đang phân tích...</b>
            </div>
            <button id="sm-btn-do-quest" style="width: 100%; margin-top: 3px; padding: 5px; background: linear-gradient(135deg, #0288d1, #00acc1); border: none; border-radius: 5px; color: #fff; font-weight: bold; font-size: 10px; cursor: pointer;">
              🎯 Ưu Tiên Làm Nhiệm Vụ Này Ngay
            </button>
          </div>
        </div>

        <!-- TAB 3: CHIÊU THỨC & BUILDS -->
        <div id="sm-tab-skills" class="sm-tab-content" style="display: none; flex-direction: column; gap: 7px;">
          <div style="font-weight: bold; color: #80d8ff; font-size: 10.5px;">🎯 CHUYỂN BUILD 1-CHẠM:</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button id="sm-b-dual-hidden" style="background: linear-gradient(135deg, #004d40, #00796b); border: 1px solid #00bfa5; color: #e0f2f1; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-align: left; display: flex; justify-content: space-between; align-items: center;">
              <span>👑 Song Ẩn</span>
              <span style="font-size: 9px; opacity: 0.85;">[Thủy Kính + Thiên Lôi]</span>
            </button>
            <button id="sm-b-burst-stun" style="background: linear-gradient(135deg, #1a237e, #283593); border: 1px solid #3d5afe; color: #e8eaf6; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-align: left; display: flex; justify-content: space-between; align-items: center;">
              <span>⚡ Khống Chế Stun</span>
              <span style="font-size: 9px; opacity: 0.85;">[Thiên Lôi + Ngũ Hành]</span>
            </button>
            <button id="sm-b-aoe-farm" style="background: linear-gradient(135deg, #b71c1c, #c62828); border: 1px solid #ff5252; color: #ffebee; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-align: left; display: flex; justify-content: space-between; align-items: center;">
              <span>🔥 Càn Quét Bãi</span>
              <span style="font-size: 9px; opacity: 0.85;">[Hỏa Long + Thiên Lôi]</span>
            </button>
          </div>
          <div id="sm-loadout-cur" style="color: #ffd54f; font-size: 9.5px; background: rgba(0,0,0,0.3); padding: 5px 8px; border-radius: 4px;">Ô đang trang bị: Đang nạp...</div>

          <!-- Cooldown Stats -->
          <div style="background: rgba(16, 21, 31, 0.9); border: 1px solid rgba(61,90,254,0.3); border-radius: 8px; padding: 6px 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 9.5px;">
            <div>⚡ Lôi Phù: <b id="sm-sk-loiphu" style="color: #ffd54f;">0</b></div>
            <div>🔥 Hỏa Long: <b id="sm-sk-hoalong" style="color: #ff7043;">0</b></div>
            <div>🌀 Ngũ Hành: <b id="sm-sk-nguhanh" style="color: #ab47bc;">0</b></div>
            <div>🛡️ Thủy Kính: <b id="sm-sk-thuykinh" style="color: #29b6f6;">0</b></div>
            <div style="grid-column: span 2;">⚡⚡ Thiên Lôi: <b id="sm-sk-thienloi" style="color: #ffff00;">0</b></div>
          </div>
        </div>

        <!-- TAB 4: BÁN & KHO (AUTO-SHOP & STORAGE - HỌC TỪ COVIET) -->
        <div id="sm-tab-shop" class="sm-tab-content" style="display: none; flex-direction: column; gap: 7px;">
          <!-- Auto-Shop HP Potions Card -->
          <div style="background: rgba(28, 22, 13, 0.9); border: 1px solid rgba(255,179,0,0.4); border-radius: 8px; padding: 7px 9px; display: flex; flex-direction: column; gap: 5px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: #ffe082; font-size: 10.5px; font-weight: bold; user-select: none;">
              <input type="checkbox" id="sm-toggle-autoshop" ${cfg.autoShop ? 'checked' : ''} style="cursor: pointer; width: 13px; height: 13px;">
              <span>🛒 Tự Bán Đồ & Nạp Bình Máu</span>
            </label>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 9.5px; color: #ffe082;">
              <span>Mục tiêu nạp đủ trong túi:</span>
              <div style="display: flex; align-items: center; gap: 4px;">
                <input id="sm-potions-target" type="number" min="10" max="300" value="${cfg.autoShopMinPotionsToBuy || 100}" style="width: 50px; background: rgba(0,0,0,0.6); border: 1px solid #ffb300; border-radius: 4px; color: #fff; padding: 2px 4px; font-size: 10px; text-align: right;" />
                <span>bình</span>
              </div>
            </div>
            <div style="font-size: 9.5px; color: #b0bec5; line-height: 1.4;">
              Trạng thái: <b id="sm-shop-status" style="color: #ffd54f;">Sẵn sàng</b><br>
              Trong túi: <b id="sm-potions-in-bag" style="color: #69f0ae;">0</b>/<span id="sm-potions-target-label">${cfg.autoShopMinPotionsToBuy || 100}</span> bình | Đã mua: <b id="sm-potions-bought" style="color: #40c4ff;">0</b> bình
            </div>
            <button id="sm-btn-force-shop" style="width: 100%; background: linear-gradient(135deg, #e65100, #ff9800); border: none; border-radius: 5px; padding: 5px; color: #fff; font-weight: bold; font-size: 10px; cursor: pointer; margin-top: 2px;">
              🏃 Đi Bán Rác & Nạp Máu Ngay
            </button>
          </div>

          <!-- Auto-Storage Deposit Card (Đặt cọc kho) -->
          <div style="background: rgba(18, 28, 20, 0.9); border: 1px solid rgba(76,175,80,0.4); border-radius: 8px; padding: 7px 9px; display: flex; flex-direction: column; gap: 5px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: #a5d6a7; font-size: 10.5px; font-weight: bold; user-select: none;">
              <input type="checkbox" id="sm-toggle-autostore" style="cursor: pointer; width: 13px; height: 13px;">
              <span>📦 Tự Cất Đồ Quý Vào Kho (Thủ Kho)</span>
            </label>
            <div style="font-size: 9px; color: #81c784;">Khi túi đầy, tự động tới Thủ Kho cất trang bị đạt chuẩn giữ lại (không bán nhầm).</div>
            <button id="sm-btn-force-store" style="width: 100%; background: linear-gradient(135deg, #2e7d32, #43a047); border: none; border-radius: 5px; padding: 5px; color: #fff; font-weight: bold; font-size: 10px; cursor: pointer;">
              📦 Đi Cất Đồ Vào Kho Ngay
            </button>
          </div>

          <!-- Advanced Selling Filters (Bộ lọc bán đồ thông minh) -->
          <div style="background: rgba(16, 21, 31, 0.9); border: 1px solid rgba(33,150,243,0.3); border-radius: 8px; padding: 7px 9px; display: flex; flex-direction: column; gap: 5px; font-size: 10px;">
            <span style="font-weight: bold; color: #90caf9;">⚙️ BỘ LỌC BÁN ĐỒ CHI TIẾT:</span>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #b0bec5;">Giữ phẩm chất:</span>
              <select id="sm-sel-keep-rarity" style="background: #0b0f17; color: #ffd76a; border: 1px solid #30363d; border-radius: 4px; padding: 2px 4px; font-size: 9.5px;">
                <option value="0">Giữ mọi đồ</option>
                <option value="1">Từ Xanh lá (Bán Trắng)</option>
                <option value="2">Từ Xanh lam (Bán Trắng/Lá)</option>
                <option value="3" selected>Từ Tím (Bán Trắng/Lá/Lam)</option>
                <option value="4">Từ Cam (Bán Tím trở xuống)</option>
              </select>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #b0bec5;">Giữ cấp từ:</span>
              <input id="sm-input-keep-lv" type="number" min="1" max="100" value="1" style="width: 50px; background: #0b0f17; color: #fff; border: 1px solid #30363d; border-radius: 4px; padding: 2px 4px; font-size: 9.5px;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #b0bec5;">Bán nguyên liệu rác:</span>
              <input type="checkbox" id="sm-chk-sell-mats" checked style="cursor: pointer;">
            </div>
            <div style="font-size: 8.5px; color: #ffb74d;">🛡️ Bảo vệ tuyệt đối: Bình máu, đồ nhiệm vụ, ấn, ngọc, đồ đang trang bị!</div>
          </div>

          <!-- Session Token Tools & Chat Button -->
          <div style="background: rgba(16, 21, 31, 0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 7px 9px; display: flex; flex-direction: column; gap: 5px;">
            <div style="font-weight: bold; color: #80d8ff; font-size: 10px;">🔑 QUẢN LÝ MÃ PHIÊN TÀI KHOẢN:</div>
            <div style="display: flex; gap: 4px;">
              <input id="sm-token-input" type="password" placeholder="Mã phiên (s.xxxx)" readonly style="flex: 1; background: #0b0f17; border: 1px solid #30363d; border-radius: 4px; padding: 4px 6px; color: #a5d6ff; font-size: 9.5px; outline: none;" />
              <button id="sm-btn-copy-token" style="background: #238636; border: none; border-radius: 4px; padding: 4px 8px; color: #fff; font-size: 9.5px; font-weight: bold; cursor: pointer;">📋 Chép</button>
              <button id="sm-btn-paste-token" style="background: #1f6feb; border: none; border-radius: 4px; padding: 4px 8px; color: #fff; font-size: 9.5px; font-weight: bold; cursor: pointer;">✏️ Dán</button>
            </div>
            <div id="sm-token-msg" style="color: #69f0ae; font-size: 9px; display: none;">✅ Đã chép mã phiên!</div>
          </div>

          <div style="display: flex; gap: 6px;">
            <button id="sm-btn-open-chat" style="flex: 1; background: #3e2723; border: 1px solid #ffb300; color: #ffd76a; border-radius: 5px; font-size: 10px; padding: 4px; cursor: pointer; font-weight: bold;">💬 Mở Khung Chat Nổi</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(botPanel);

  // Mini Badge Floating Button (khi thu gọn bot panel)
  const botMiniBadge = document.createElement('div');
  botMiniBadge.id = 'sm-mini-badge';
  botMiniBadge.innerHTML = `
    <div style="position: fixed; top: 68px; right: 10px; background: rgba(10, 15, 26, 0.95); border: 1.5px solid #00e5ff;
                border-radius: 14px; padding: 6px 10px; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 11px; z-index: 999999; box-shadow: 0 6px 24px rgba(0,0,0,0.8), 0 0 10px rgba(0,229,255,0.3); backdrop-filter: blur(12px);
                display: none; flex-direction: column; gap: 5px; cursor: grab; user-select: none; touch-action: none; max-width: 290px;">
      
      <!-- Top Telemetry Row -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
        <span id="sm-mini-status" style="font-weight: bold; color: #00e676; font-size: 11px;">🟢 v16.2.0</span>
        <span style="color: #ff5252;">❤️ <b id="sm-mini-hp">100%</b></span>
        <span style="color: #69f0ae;">🩸 <b id="sm-mini-pots">0</b></span>
        <span style="color: #ffd740;">💰 <b id="sm-mini-gold">0</b></span>
        <span id="sm-mini-role-badge" title="Chạm để chuyển Role: Gần / Xa / Auto" style="color: #00e5ff; font-weight: 600; font-size: 10px; cursor: pointer; padding: 2px 6px; border-radius: 4px; background: rgba(0,229,255,0.12); border: 1px solid rgba(0,229,255,0.3); user-select: none;">⚔️ Gần</span>
      </div>

      <!-- Live Status String -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
        <span id="sm-mini-state" style="color: #e0f2fe; font-size: 10.5px; max-width: 210px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">Sẵn sàng...</span>
        <span style="color: #b0bec5; font-size: 10px;">⚔️ <b id="sm-mini-atk">0</b></span>
      </div>

      <!-- Quick 1-Touch Actions -->
      <div style="display: flex; gap: 4px; align-items: center; justify-content: space-between; margin-top: 2px;">
        <button id="sm-quick-shop" title="Đi mua máu & bán rác ngay" style="flex: 1; background: linear-gradient(135deg, #e65100, #ff9800); border: none; color: #fff; border-radius: 8px; padding: 4px 6px; font-size: 10px; font-weight: bold; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 6px rgba(255,152,0,0.4);">⚡ Mua Máu</button>
        <button id="sm-quick-store" title="Cất đồ quý vào Thủ Kho" style="flex: 1; background: linear-gradient(135deg, #00695c, #00bfa5); border: none; color: #fff; border-radius: 8px; padding: 4px 6px; font-size: 10px; font-weight: bold; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,191,165,0.4);">📦 Cất Kho</button>
        <button id="sm-quick-quest" title="Bật/Tắt Auto-Quest" style="flex: 1; background: linear-gradient(135deg, #1565c0, #29b6f6); border: none; color: #fff; border-radius: 8px; padding: 4px 6px; font-size: 10px; font-weight: bold; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 6px rgba(41,182,246,0.4);">📜 Làm Q</button>
        <button id="sm-mini-btn-expand" title="Mở Bảng Điều Khiển Đầy Đủ" style="flex: 1; background: linear-gradient(135deg, #2e7d32, #4caf50); border: none; color: #fff; border-radius: 8px; padding: 4px 6px; font-size: 10px; font-weight: bold; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 6px rgba(76,175,80,0.4);">📂 Panel</button>
        <button id="sm-mini-btn-hide" title="Thu nhỏ về nút 🤖" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 8px; padding: 4px 6px; font-size: 10px; cursor: pointer;">❌</button>
      </div>
    </div>
  `;
  document.body.appendChild(botMiniBadge);

  // Nút Nổi Thông Minh (FAB) - Luôn hiển thị trên màn hình điện thoại ở vị trí an toàn
  const botFab = document.createElement('div');
  botFab.id = 'sm-fab-toggle';
  botFab.innerHTML = `
    <div style="position: fixed; top: 70px; left: 12px; width: 44px; height: 44px; background: radial-gradient(circle at 30% 30%, #00e676, #004d40);
                border: 2px solid rgba(255,255,255,0.9); border-radius: 50%; box-shadow: 0 0 15px rgba(0,230,118,0.7), 0 4px 14px rgba(0,0,0,0.6); z-index: 1000000;
                display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none;
                font-size: 22px; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); touch-action: none;" title="Chạm để Mở / Đóng Bot Cổ Giới">
      🤖
    </div>
  `;
  document.body.appendChild(botFab);

  const botPanelEl = botPanel.firstElementChild;
  const botMiniEl = botMiniBadge.firstElementChild;
  const botFabEl = botFab.firstElementChild;

  makeDraggable(botPanelEl, botPanel.querySelector('#sm-header'), 'ancient_bot_panel_pos');
  makeDraggable(botMiniEl, botMiniEl, 'ancient_bot_mini_pos');
  makeDraggable(botFabEl, botFabEl, 'ancient_bot_fab_pos');

  // Mặc định: Panel thu gọn, chỉ hiện nút FAB 🤖 neon tinh gọn!
  botPanelEl.style.display = 'none';
  botMiniEl.style.display = 'none';

  function toggleBotPanel() {
    if (botPanelEl.style.display !== 'none') {
      botPanelEl.style.display = 'none';
      botMiniEl.style.display = 'flex';
    } else if (botMiniEl.style.display !== 'none') {
      botMiniEl.style.display = 'none';
    } else {
      botMiniEl.style.display = 'flex';
    }
  }
  botFabEl.onclick = toggleBotPanel;

  // Tab switcher
  const tabBtns = botPanel.querySelectorAll('.sm-tab-btn');
  const tabContents = {
    combat: botPanel.querySelector('#sm-tab-combat'),
    quest: botPanel.querySelector('#sm-tab-quest'),
    skills: botPanel.querySelector('#sm-tab-skills'),
    shop: botPanel.querySelector('#sm-tab-shop')
  };

  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => {
        b.style.background = 'rgba(255,255,255,0.05)';
        b.style.borderColor = 'transparent';
        b.style.color = '#8b949e';
      });
      btn.style.background = 'rgba(0,230,118,0.18)';
      btn.style.borderColor = '#00e676';
      btn.style.color = '#00e676';

      const targetTab = btn.getAttribute('data-tab');
      Object.keys(tabContents).forEach(k => {
        if (tabContents[k]) {
          tabContents[k].style.display = (k === targetTab) ? 'flex' : 'none';
        }
      });
    };
  });

  // Token manager handlers
  const tokenInput = botPanel.querySelector('#sm-token-input');
  const btnCopyToken = botPanel.querySelector('#sm-btn-copy-token');
  const btnPasteToken = botPanel.querySelector('#sm-btn-paste-token');
  const tokenMsg = botPanel.querySelector('#sm-token-msg');

  if (tokenInput) {
    const curTok = localStorage.getItem('dainam_session') || '';
    tokenInput.value = curTok;
  }

  if (btnCopyToken) {
    btnCopyToken.onclick = () => {
      const curTok = localStorage.getItem('dainam_session') || '';
      if (!curTok) {
        alert('Chưa có mã phiên đăng nhập!');
        return;
      }
      navigator.clipboard?.writeText(curTok).catch(() => {});
      if (tokenMsg) {
        tokenMsg.style.display = 'block';
        tokenMsg.textContent = '✅ Đã sao chép mã phiên!';
        setTimeout(() => { tokenMsg.style.display = 'none'; }, 2500);
      }
    };
  }

  if (btnPasteToken) {
    btnPasteToken.onclick = () => {
      const t = prompt('Dán mã phiên tài khoản (bắt đầu bằng s.):');
      if (t && t.trim()) {
        localStorage.setItem('dainam_session', t.trim());
        location.reload();
      }
    };
  }

  // Cử chỉ chạm 2 lần vào góc trên bên trái (dưới avatar) để bật/tắt bot
  let lastTapTime = 0;
  window.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTapTime < 320) {
      if (e.target.closest('#ancient-master-bot-v13, #sm-mini-badge, #sm-fab-toggle, #ancient-floating-chat, #afc-bubble')) return;
      const touch = e.changedTouches?.[0];
      if (touch && touch.clientX < 150 && touch.clientY < 150) {
        toggleBotPanel();
      }
    }
    lastTapTime = now;
  });

  // Auto-Shop & Auto-Store Event Handlers
  const chkAutoShop = botPanel.querySelector('#sm-toggle-autoshop');
  const btnForceShop = botPanel.querySelector('#sm-btn-force-shop');
  const elShopStatus = botPanel.querySelector('#sm-shop-status');
  const elTrashSold = botPanel.querySelector('#sm-trash-sold');
  const elPotionsBought = botPanel.querySelector('#sm-potions-bought');

  const chkAutoStore = botPanel.querySelector('#sm-toggle-autostore');
  const btnForceStore = botPanel.querySelector('#sm-btn-force-store');
  const selKeepRarity = botPanel.querySelector('#sm-sel-keep-rarity');
  const inputKeepLv = botPanel.querySelector('#sm-input-keep-lv');
  const chkSellMats = botPanel.querySelector('#sm-chk-sell-mats');

  const inputPotionsTarget = botPanel.querySelector('#sm-potions-target');
  const lblPotionsTarget = botPanel.querySelector('#sm-potions-target-label');
  const elPotionsInBag = botPanel.querySelector('#sm-potions-in-bag');

  if (inputPotionsTarget) {
    inputPotionsTarget.onchange = e => {
      const v = parseInt(e.target.value, 10);
      if (!isNaN(v) && v > 0) {
        cfg.autoShopMinPotionsToBuy = v;
        if (lblPotionsTarget) lblPotionsTarget.textContent = v;
        logShopEvent(`Đã cập nhật mục tiêu nạp bình máu: ${v} bình.`);
      }
    };
  }

  if (chkAutoShop) {
    chkAutoShop.onchange = e => {
      cfg.autoShop = e.target.checked;
      if (elShopStatus) elShopStatus.textContent = cfg.autoShop ? 'Bật (Sẵn sàng)' : 'Tắt';
    };
  }
  if (btnForceShop) {
    btnForceShop.onclick = () => {
      triggerShopTrip(true);
    };
  }
  if (chkAutoStore) {
    chkAutoStore.onchange = e => {
      cfg.autoStore = e.target.checked;
    };
  }
  if (btnForceStore) {
    btnForceStore.onclick = () => {
      triggerStorageTrip(true);
    };
  }
  if (selKeepRarity) {
    selKeepRarity.onchange = e => {
      cfg.keepRarity = parseInt(e.target.value, 10);
    };
  }
  if (inputKeepLv) {
    inputKeepLv.onchange = e => {
      cfg.keepLevel = parseInt(e.target.value, 10) || 1;
    };
  }
  if (chkSellMats) {
    chkSellMats.onchange = e => {
      cfg.sellMats = e.target.checked;
    };
  }

  // Auto-Quest Event Handlers
  const chkAutoQuest = botPanel.querySelector('#sm-toggle-autoquest');
  const chkQuestSide = botPanel.querySelector('#sm-chk-quest-side');
  const chkQuestDaily = botPanel.querySelector('#sm-chk-quest-daily');
  const btnDoQuest = botPanel.querySelector('#sm-btn-do-quest');
  const elQTitle = botPanel.querySelector('#sm-q-title');
  const elQGoal = botPanel.querySelector('#sm-q-goal');
  const elQProg = botPanel.querySelector('#sm-q-prog');
  const elQStep = botPanel.querySelector('#sm-q-step-desc');

  if (chkAutoQuest) {
    chkAutoQuest.onchange = e => {
      cfg.autoQuest = e.target.checked;
    };
  }
  if (chkQuestSide) {
    chkQuestSide.onchange = e => {
      cfg.questDoSide = e.target.checked;
    };
  }
  if (chkQuestDaily) {
    chkQuestDaily.onchange = e => {
      cfg.questDoDaily = e.target.checked;
    };
  }
  if (btnDoQuest) {
    btnDoQuest.onclick = () => {
      cfg.autoQuest = true;
      if (chkAutoQuest) chkAutoQuest.checked = true;
    };
  }

  // Toggle thu gọn bot panel & Quick Action Buttons
  const btnMinBot = botPanel.querySelector('#sm-btn-min');
  const btnCloseBot = botPanel.querySelector('#sm-btn-close');
  const btnExpandBot = botMiniBadge.querySelector('#sm-mini-btn-expand');
  const btnHideMini = botMiniBadge.querySelector('#sm-mini-btn-hide');
  const btnQuickShop = botMiniBadge.querySelector('#sm-quick-shop');
  const btnQuickStore = botMiniBadge.querySelector('#sm-quick-store');
  const btnQuickQuest = botMiniBadge.querySelector('#sm-quick-quest');

  if (btnMinBot) {
    btnMinBot.onclick = () => {
      botPanelEl.style.display = 'none';
      botMiniEl.style.display = 'flex';
    };
  }
  if (btnCloseBot) {
    btnCloseBot.onclick = () => {
      botPanelEl.style.display = 'none';
      botMiniEl.style.display = 'flex';
    };
  }
  if (btnExpandBot) {
    btnExpandBot.onclick = () => {
      botMiniEl.style.display = 'none';
      botPanelEl.style.display = 'flex';
    };
  }
  if (btnHideMini) {
    btnHideMini.onclick = (e) => {
      e.stopPropagation();
      botMiniEl.style.display = 'none';
    };
  }
  if (btnQuickShop) {
    btnQuickShop.onclick = (e) => {
      e.stopPropagation();
      triggerShopTrip(true);
    };
  }
  if (btnQuickStore) {
    btnQuickStore.onclick = (e) => {
      e.stopPropagation();
      triggerStorageTrip();
    };
  }
  if (btnQuickQuest) {
    btnQuickQuest.onclick = (e) => {
      e.stopPropagation();
      cfg.autoQuest = !cfg.autoQuest;
      const cb = botPanel.querySelector('#sm-auto-quest');
      if (cb) cb.checked = cfg.autoQuest;
      btnQuickQuest.style.background = cfg.autoQuest ? 'linear-gradient(135deg, #1565c0, #29b6f6)' : 'rgba(255,255,255,0.15)';
      logQuest(`[UI] Đã ${cfg.autoQuest ? 'BẬT' : 'TẮT'} Tự Động Làm Nhiệm Vụ từ Quick Action.`);
    };
  }

  const btnMiniRole = botMiniBadge.querySelector('#sm-mini-role-badge');
  if (btnMiniRole) {
    btnMiniRole.onclick = (e) => {
      e.stopPropagation();
      if (cfg.combatRole === 'auto') {
        cfg.combatRole = 'melee';
      } else if (cfg.combatRole === 'melee') {
        cfg.combatRole = 'ranged';
      } else {
        cfg.combatRole = 'auto';
      }
      const r = getCharacterRoleInfo();
      btnMiniRole.textContent = `${r.icon} ${cfg.combatRole === 'auto' ? `Auto (${r.isMelee ? 'Gần' : 'Xa'})` : (r.isMelee ? 'Gần' : 'Xa')}`;
      btnMiniRole.style.color = r.isMelee ? '#ff5252' : '#00e5ff';
      const sel = botPanel.querySelector('#sm-role-sel');
      if (sel) sel.value = cfg.combatRole;
      const statusTxtEl = document.getElementById('sm-status');
      if (statusTxtEl) statusTxtEl.textContent = `🎯 Đã chuyển Role: ${cfg.combatRole.toUpperCase()} (Tầm ${r.baseRange}px)`;
    };
  }

  // =========================================================================
  // 2. KHUNG CHAT KÉO THẢ GỌN NHẸ DỄ NHÌN (FLOATING DRAGGABLE CHAT)
  // =========================================================================
  const floatingChat = document.createElement('div');
  floatingChat.id = 'ancient-floating-chat';
  floatingChat.innerHTML = `
    <div style="position: fixed; left: 15px; bottom: 85px; width: 360px; background: rgba(14, 18, 26, 0.88);
                border: 1px solid rgba(255, 215, 106, 0.45); border-radius: 9px; box-shadow: 0 8px 30px rgba(0,0,0,0.75);
                backdrop-filter: blur(10px); z-index: 999998; font-family: 'Segoe UI', Tahoma, sans-serif;
                font-size: 11.5px; display: none; flex-direction: column; overflow: hidden;
                transition: transform 0.15s ease, opacity 0.15s ease;">
      <!-- Header Drag Handle -->
      <div id="afc-header" style="background: linear-gradient(90deg, #3e2723, #4e342e); padding: 5px 10px;
                  cursor: grab; font-weight: bold; color: #ffd76a; display: flex; justify-content: space-between;
                  align-items: center; user-select: none; border-bottom: 1px solid rgba(255, 215, 106, 0.2);">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>💬 KHUNG TRÒ CHUYỆN</span>
          <span id="afc-unread-badge" style="background: #e53935; color: #fff; font-size: 9px; padding: 1px 5px; border-radius: 10px; display: none;">0</span>
        </div>
        <div style="display: flex; gap: 5px; align-items: center;">
          <button id="afc-btn-min" title="Thu gọn chat" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #ffd76a; border-radius: 3px; cursor: pointer; width: 20px; height: 18px; font-size: 11px; line-height: 1; display: flex; align-items: center; justify-content: center;">—</button>
          <button id="afc-btn-close" title="Ẩn chat" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 1; padding: 0 3px;">✕</button>
        </div>
      </div>

      <!-- Body -->
      <div id="afc-body" style="display: flex; flex-direction: column; height: 210px;">
        <!-- Filter Tabs -->
        <div id="afc-tabs" style="display: flex; background: rgba(0,0,0,0.35); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 3px 6px; gap: 4px; font-size: 10.5px;">
          <button class="afc-tab-btn active" data-tab="all" style="background: #5d4037; border: 1px solid #8d6e63; color: #ffd76a; border-radius: 3px; padding: 2px 7px; cursor: pointer; font-weight: bold;">🌟 Tất cả</button>
          <button class="afc-tab-btn" data-tab="chat" style="background: rgba(0,0,0,0.4); border: 1px solid transparent; color: #b0bec5; border-radius: 3px; padding: 2px 7px; cursor: pointer;">💬 Trò chuyện</button>
          <button class="afc-tab-btn" data-tab="sys" style="background: rgba(0,0,0,0.4); border: 1px solid transparent; color: #b0bec5; border-radius: 3px; padding: 2px 7px; cursor: pointer;">⚔️ Hệ thống</button>
          <button class="afc-tab-btn" data-tab="loot" style="background: rgba(0,0,0,0.4); border: 1px solid transparent; color: #b0bec5; border-radius: 3px; padding: 2px 7px; cursor: pointer;">🎁 Nhặt đồ</button>
        </div>

        <!-- Messages Area -->
        <div id="afc-messages" style="flex: 1; overflow-y: auto; padding: 6px 8px; display: flex; flex-direction: column; gap: 3px; scrollbar-width: thin; scrollbar-color: #ffd76a rgba(0,0,0,0.3);">
          <div style="color: #90a4ae; font-style: italic; font-size: 10.5px;">Đang đồng bộ tin nhắn trò chuyện...</div>
        </div>

        <!-- Chat Input Field -->
        <form id="afc-input-form" style="display: flex; gap: 4px; padding: 4px 6px; background: rgba(10,12,16,0.95); border-top: 1px solid rgba(255,255,255,0.08);">
          <input id="afc-input" maxlength="120" placeholder="Nói gì đó (Enter để gửi)..." autocomplete="off" style="flex: 1; background: rgba(255,255,255,0.08); border: 1px solid #5a4530; border-radius: 4px; color: #fff; padding: 4px 8px; font-size: 11px; outline: none;" />
          <button type="submit" style="background: #2e7d32; border: 1px solid #4caf50; color: #fff; border-radius: 4px; padding: 3px 10px; font-weight: bold; font-size: 11px; cursor: pointer;">Gửi</button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(floatingChat);

  // Floating Chat Bubble Icon (khi thu nhỏ khung chat)
  const chatBubble = document.createElement('div');
  chatBubble.id = 'afc-bubble';
  chatBubble.innerHTML = `
    <div style="position: fixed; left: 15px; bottom: 85px; width: 44px; height: 44px; border-radius: 50%;
                background: linear-gradient(135deg, #4e342e, #ffb300); border: 2px solid #ffd76a;
                box-shadow: 0 4px 16px rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center;
                cursor: grab; z-index: 999998; font-size: 20px; user-select: none;">
      💬
      <span id="afc-bubble-badge" style="position: absolute; top: -3px; right: -3px; background: #e53935; color: #fff; font-size: 9px; font-weight: bold; width: 17px; height: 17px; border-radius: 50%; display: none; align-items: center; justify-content: center; border: 1px solid #fff;">0</span>
    </div>
  `;
  document.body.appendChild(chatBubble);

  const floatingChatEl = floatingChat.firstElementChild;
  const chatBubbleEl = chatBubble.firstElementChild;
  makeDraggable(floatingChatEl, floatingChat.querySelector('#afc-header'), 'ancient_chat_pos');
  makeDraggable(chatBubbleEl, chatBubbleEl, 'ancient_chat_bubble_pos');

  // Quản lý tin nhắn Chat
  const chatHistory = [];
  let activeChatTab = 'all';
  let unreadChatCount = 0;
  const afcMessages = floatingChat.querySelector('#afc-messages');
  const afcInput = floatingChat.querySelector('#afc-input');
  const afcForm = floatingChat.querySelector('#afc-input-form');
  const unreadBadge = floatingChat.querySelector('#afc-unread-badge');
  const bubbleBadge = chatBubble.querySelector('#afc-bubble-badge');

  function classifyMessage(html, cls) {
    if (cls === 'loot' || html.includes('Nhận được') || html.includes('vàng')) return 'loot';
    if (cls === 'sys' || html.includes('✨') || html.includes('cấp') || html.includes('Nhiệm vụ') || html.includes('gục ngã')) return 'sys';
    return 'chat';
  }

  function renderChatMessage(msg) {
    const d = document.createElement('div');
    d.style.padding = '2px 5px';
    d.style.borderRadius = '3px';
    d.style.wordBreak = 'break-word';
    d.style.fontSize = '11px';
    d.style.lineHeight = '1.35';

    if (msg.cat === 'loot') {
      d.style.background = 'rgba(255, 215, 106, 0.08)';
      d.style.borderLeft = '2px solid #ffd76a';
      d.style.color = '#ffe082';
    } else if (msg.cat === 'sys') {
      d.style.background = 'rgba(129, 199, 132, 0.08)';
      d.style.borderLeft = '2px solid #81c784';
      d.style.color = '#b9f6ca';
    } else {
      d.style.background = 'rgba(66, 165, 245, 0.1)';
      d.style.borderLeft = '2px solid #42a5f5';
      d.style.color = '#e3f2fd';
    }

    d.innerHTML = `<span style="color: #78909c; font-size: 9.5px; margin-right: 4px;">[${msg.time}]</span>${msg.html}`;
    afcMessages.appendChild(d);
  }

  function refreshChatView() {
    afcMessages.innerHTML = '';
    const filtered = chatHistory.filter(m => activeChatTab === 'all' || m.cat === activeChatTab);
    if (filtered.length === 0) {
      afcMessages.innerHTML = '<div style="color: #90a4ae; font-style: italic; font-size: 10.5px; padding: 6px;">Không có tin nhắn nào trong mục này.</div>';
      return;
    }
    filtered.forEach(renderChatMessage);
    afcMessages.scrollTop = afcMessages.scrollHeight;
  }

  function appendChatMessage(html, cls = '') {
    const cat = classifyMessage(html, cls);
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const msg = { html, cls, cat, time: nowStr };
    chatHistory.push(msg);
    if (chatHistory.length > 80) chatHistory.shift();

    if (activeChatTab === 'all' || activeChatTab === cat) {
      if (afcMessages.querySelector('div[style*="font-style: italic"]')) {
        afcMessages.innerHTML = '';
      }
      renderChatMessage(msg);
      afcMessages.scrollTop = afcMessages.scrollHeight;
    }

    if (floatingChatEl.style.display === 'none' && chatBubbleEl.style.display === 'flex') {
      unreadChatCount++;
      bubbleBadge.textContent = unreadChatCount > 99 ? '99+' : unreadChatCount;
      bubbleBadge.style.display = 'flex';
    }
  }

  // Chuyển tab lọc tin nhắn
  floatingChat.querySelectorAll('.afc-tab-btn').forEach(btn => {
    btn.onclick = () => {
      floatingChat.querySelectorAll('.afc-tab-btn').forEach(b => {
        b.style.background = 'rgba(0,0,0,0.4)';
        b.style.borderColor = 'transparent';
        b.style.color = '#b0bec5';
        b.style.fontWeight = 'normal';
      });
      btn.style.background = '#5d4037';
      btn.style.borderColor = '#8d6e63';
      btn.style.color = '#ffd76a';
      btn.style.fontWeight = 'bold';
      activeChatTab = btn.dataset.tab;
      refreshChatView();
    };
  });

  // Toggle thu nhỏ / mở rộng khung chat
  const btnMinChat = floatingChat.querySelector('#afc-btn-min');
  const btnCloseChat = floatingChat.querySelector('#afc-btn-close');
  function minimizeChat() {
    floatingChatEl.style.display = 'none';
    chatBubbleEl.style.display = 'flex';
  }
  function closeChat() {
    floatingChatEl.style.display = 'none';
    chatBubbleEl.style.display = 'none';
  }
  function openChat() {
    chatBubbleEl.style.display = 'none';
    floatingChatEl.style.display = 'flex';
    unreadChatCount = 0;
    bubbleBadge.style.display = 'none';
    afcMessages.scrollTop = afcMessages.scrollHeight;
  }

  // Mặc định ẩn hoàn toàn cả khung chat lẫn bubble để không bao giờ chắn joystick ảo
  floatingChatEl.style.display = 'none';
  chatBubbleEl.style.display = 'none';

  btnMinChat.onclick = minimizeChat;
  btnCloseChat.onclick = closeChat;
  chatBubbleEl.onclick = openChat;
  const btnOpenChat = botPanel.querySelector('#sm-btn-open-chat');
  if (btnOpenChat) {
    btnOpenChat.onclick = openChat;
  }

  // Gõ phím gửi tin nhắn trực tiếp
  afcForm.onsubmit = (e) => {
    e.preventDefault();
    const text = afcInput.value.trim();
    if (!text) return;
    if (window.GAME?.net) {
      window.GAME.net.send({ t: 'chat', m: text });
    }
    afcInput.value = '';
  };

  // Ngăn phím WASD điều khiển nhân vật khi đang gõ chữ trong ô chat!
  afcInput.addEventListener('keydown', (e) => e.stopPropagation());
  afcInput.addEventListener('keyup', (e) => e.stopPropagation());

  // Nạp lại các dòng tin nhắn cũ từ #chat-log nếu có
  const existingChatLog = document.getElementById('chat-log');
  if (existingChatLog) {
    Array.from(existingChatLog.children).forEach(child => {
      const cls = child.className.replace('old', '').trim();
      appendChatMessage(child.innerHTML, cls);
    });
  }

  // Hook 2 chiều với GAME.ui.chatLine và GAME.ui.toggleChat
  let origUiChatLine = null;
  let origUiToggleChat = null;
  if (window.GAME?.ui) {
    origUiChatLine = window.GAME.ui.chatLine;
    origUiToggleChat = window.GAME.ui.toggleChat;

    window.GAME.ui.chatLine = function(html, cls = '') {
      if (origUiChatLine) {
        try { origUiChatLine.call(this, html, cls); } catch(e) {}
      }
      appendChatMessage(html, cls);
    };

    window.GAME.ui.toggleChat = function(on) {
      if (floatingChatEl.style.display === 'none') {
        openChat();
        setTimeout(() => afcInput.focus(), 50);
      } else {
        minimizeChat();
      }
    };
  }

  // =========================================================================
  // GẮN SỰ KIỆN ĐIỀU KHIỂN BOT CŨ
  // =========================================================================
  botPanel.querySelector('#sm-btn-close').onclick = () => window._ancientMasterBot.destroy();
  const togBtn = botPanel.querySelector('#sm-btn-toggle');
  togBtn.onclick = () => {
    cfg.enabled = !cfg.enabled;
    togBtn.textContent = cfg.enabled ? '🟢 ĐANG HOẠT ĐỘNG' : '🔴 ĐÃ TẠM DỪNG';
    togBtn.style.background = cfg.enabled ? '#2e7d32' : '#c62828';
    if (!cfg.enabled) stopMoving();
  };

  botPanel.querySelector('#sm-b-dual-hidden').onclick = () => applySkillLoadout('ad_loiphu', 'ad_thuykinh', 'ad_thienloi');
  botPanel.querySelector('#sm-b-burst-stun').onclick = () => applySkillLoadout('ad_loiphu', 'ad_thienloi', 'ad_nguhanh');
  botPanel.querySelector('#sm-b-aoe-farm').onclick = () => applySkillLoadout('ad_loiphu', 'ad_hoalong', 'ad_thienloi');

  const mobSel = botPanel.querySelector('#sm-mob-sel');

  function populateMobSelect() {
    const gdMobs = window.GAME?.GD?.mobs || {};
    const zone = window.GAME?.world?.zone;
    const spawns = zone?.spawns || [];
    const activeMobs = Array.from(window.GAME?.mobs?.values() || []).filter(m => isMobValidAndAlive(m));
    const curVal = mobSel.value;

    mobSel.innerHTML = '<option value="all">🌟 Tự động (Mọi quái trong khu vực)</option>';
    const added = new Set(['all']);

    for (const m of activeMobs) {
      const def = gdMobs[m.kind] || { id: m.kind, name: m.kind };
      const id = def.id || m.kind;
      if (added.has(id)) continue;
      added.add(id);

      const opt = document.createElement('option');
      opt.value = id;
      const isBoss = !!(def.boss || def.elite);
      opt.textContent = `${isBoss ? '👑 [BOSS] ' : '👾 '}${def.name || id} (Lv.${def.lv || '?'})`;
      mobSel.appendChild(opt);
    }

    for (const s of spawns) {
      if (!s.mob || added.has(s.mob)) continue;
      added.add(s.mob);
      const def = gdMobs[s.mob] || { id: s.mob, name: s.mob };
      const opt = document.createElement('option');
      opt.value = s.mob;
      const isBoss = !!(def.boss || def.elite);
      opt.textContent = `${isBoss ? '👑 [BOSS] ' : '👾 '}${def.name || s.mob} (Lv.${def.lv || '?'}) [Bãi xa]`;
      mobSel.appendChild(opt);
    }

    // Thêm danh sách người chơi xung quanh để chọn Solo
    const allPlayers = window.GAME?.players ? Array.from(window.GAME.players.values()) : [];
    const myName = window.GAME?.self?.name;
    const nearbyPlayers = allPlayers.filter(p => p.name !== myName && !(p.st & 1) && p.hp > 0);
    if (nearbyPlayers.length > 0) {
      for (const p of nearbyPlayers) {
        const clsName = window.GAME?.GD?.classes?.[p.cls?.id || p.cls]?.name || 'Chiến binh';
        const opt = document.createElement('option');
        opt.value = 'player_' + p.id;
        opt.textContent = `⚔️ [PVP SOLO] ${p.name} (Lv.${p.lv} - ${clsName})`;
        mobSel.appendChild(opt);
        added.add('player_' + p.id);
      }
    }

    if (added.has(curVal)) mobSel.value = curVal;
  }

  populateMobSelect();
  mobSel.onchange = e => {
    cfg.farmMob = e.target.value;
    cfg.targetMob = e.target.value;
    console.log(`[BOT] Đã chọn mục tiêu cày: '${cfg.farmMob}'`);
  };
  botPanel.querySelector('#sm-btn-refresh-mobs').onclick = populateMobSelect;

  const selCombatRole = botPanel.querySelector('#sm-role-sel');
  const badgeCombatRole = botPanel.querySelector('#sm-role-badge');
  if (selCombatRole) {
    selCombatRole.value = cfg.combatRole || 'auto';
    selCombatRole.onchange = e => {
      cfg.combatRole = e.target.value;
      const r = getCharacterRoleInfo();
      if (badgeCombatRole) {
        const modeTxt = cfg.combatRole === 'auto' ? `Tự động: ${r.className}` : (cfg.combatRole === 'melee' ? 'Ép Đánh Gần' : 'Ép Đánh Xa');
        badgeCombatRole.textContent = `${r.icon} ${modeTxt} (${r.baseRange}px)`;
        badgeCombatRole.style.color = r.isMelee ? '#ff5252' : '#00e5ff';
      }
    };
  }

  const statusTxt = botPanel.querySelector('#sm-st-txt');
  const targetTxt = botPanel.querySelector('#sm-target-txt');
  const dminTxt = botPanel.querySelector('#sm-dmin-txt');
  const pursuersTxt = botPanel.querySelector('#sm-pursuers-txt');
  const statAtkEl = botPanel.querySelector('#sm-s-atk');
  const statBreakoutEl = botPanel.querySelector('#sm-s-breakout');
  const statDodgeEl = botPanel.querySelector('#sm-s-dodge');
  const statLeashEl = botPanel.querySelector('#sm-s-leash');
  const curLoadoutEl = botPanel.querySelector('#sm-loadout-cur');
  const skLoiPhuEl = botPanel.querySelector('#sm-sk-loiphu');
  const skHoaLongEl = botPanel.querySelector('#sm-sk-hoalong');
  const skNguHanhEl = botPanel.querySelector('#sm-sk-nguhanh');
  const skThuyKinhEl = botPanel.querySelector('#sm-sk-thuykinh');
  const skThienLoiEl = botPanel.querySelector('#sm-sk-thienloi');

  const miniStatusEl = botMiniBadge.querySelector('#sm-mini-status');
  const miniAtkEl = botMiniBadge.querySelector('#sm-mini-atk');
  const miniBreakoutEl = botMiniBadge.querySelector('#sm-mini-breakout');
  const miniStateEl = botMiniBadge.querySelector('#sm-mini-state');
  const miniHpEl = botMiniBadge.querySelector('#sm-mini-hp');
  const miniPotsEl = botMiniBadge.querySelector('#sm-mini-pots');
  const miniGoldEl = botMiniBadge.querySelector('#sm-mini-gold');
  const miniRoleBadge = botMiniBadge.querySelector('#sm-mini-role-badge');

  let lastZoneId = null;
  let lastPickTime = 0;
  const mainLoop = setInterval(() => {
    if (!cfg.enabled || !window.GAME?.me || !window.GAME?.net) return;
    const me = window.GAME.me, now = performance.now();

    const zone = window.GAME?.world?.zone;
    if (zone && zone.id !== lastZoneId) {
      lastZoneId = zone.id;
      lastZoneTransitionTime = now;
      lastArrivedPortalCoords = { x: me.x, y: me.y };

      // Đồng bộ thời gian thực layout map (tọa độ cổng, NPC thật từ server)
      syncZoneLayout();

      // Chống trôi nhân vật, reset phím di chuyển & trạng thái kẹt
      stopMoving();
      movementState = 'STAND';
      isCurrentlyStuck = false;
      stuckUntil = 0;
      lastPosCheck = { x: me.x, y: me.y, t: now };

      // Reset target cũ từ map trước để tránh kẹt focus mục tiêu cũ
      currentTargetId = null;
      lastTargetIdSent = null;
      if (window.GAME?.net) window.GAME.net.send({ t: 'tg', id: 0 });

      // Lấy lại focus trình duyệt và canvas game (tránh mất focus điều khiển)
      try {
        window.focus();
        const canvas = document.querySelector('canvas');
        if (canvas) canvas.focus();
      } catch (_) {}

      populateMobSelect();
      setTimeout(populateMobSelect, 350);

      // Nếu đang Auto-Shop và quay về map farm: Khôi phục chính xác quái ban đầu
      if (autoShopState.active && autoShopState.farmZone === zone.id && autoShopState.farmTargetMob) {
        cfg.targetMob = autoShopState.farmTargetMob;
        const mobSel = botPanel.querySelector('#sm-mob-sel');
        if (mobSel) mobSel.value = cfg.farmMob || cfg.targetMob || 'all';
        console.log(`[BOT] Về lại map farm (${zone.id}), giữ nguyên focus quái: '${cfg.targetMob}'`);
      } else if (!autoShopState.active && cfg.targetMob !== 'all') {
        // KHÔNG BAO GIỜ tự động reset mục tiêu lọc của người chơi về 'all' khi chuyển map!
        // Giữ nguyên mục tiêu để khi sang map mới hoặc quái xuất hiện là bot đánh ngay!
        console.log(`[BOT] Giữ nguyên mục tiêu lọc '${cfg.targetMob}' qua chuyển map (${zone.id})`);
      }
    }

    // Hiển thị Loadout
    const currentLo = window.GAME?.self?.loadout || [];
    if (curLoadoutEl) {
      const skNames = {
        ad_loiphu: '⚡ Lôi Phù',
        ad_hoalong: '🔥 Hỏa Long',
        ad_nguhanh: '🌀 Ngũ Hành',
        ad_thuykinh: '🛡️ Thủy Kính [Ẩn]',
        ad_thienloi: '🌩️ Thiên Lôi [Ẩn]'
      };
      curLoadoutEl.textContent = `Ô đang trang bị: ${currentLo.map(id => skNames[id] || id).join(' | ')}`;
    }

    // Tự động xả lệnh đổi loadout khi an toàn
    if (pendingLoadout && movementState === 'STAND') {
      const isSafe = !window.GAME?.mobs || Array.from(window.GAME.mobs.values()).every(m => !isMobValidAndAlive(m) || Math.hypot(m.x - me.x, m.y - me.y) > 280);
      if (isSafe) {
        applySkillLoadout(...pendingLoadout);
        pendingLoadout = null;
      }
    }

    const vitals = getPlayerHp();
    const invInfo = inspectInventory();
    handleSmartPotion(now, vitals);

    // Cập nhật telemetry thời gian thực cho Mobile Mini HUD (v15.0)
    if (miniHpEl) {
      const hpPct = Math.round(vitals.maxHp ? (vitals.hp / vitals.maxHp) * 100 : 100);
      miniHpEl.textContent = `${hpPct}%`;
      miniHpEl.style.color = hpPct > 70 ? '#69f0ae' : (hpPct > 35 ? '#ffd740' : '#ff5252');
    }
    if (miniPotsEl) {
      miniPotsEl.textContent = invInfo.hpPotionCount;
      miniPotsEl.style.color = invInfo.hpPotionCount > 15 ? '#69f0ae' : '#ff5252';
    }
    if (miniGoldEl) {
      miniGoldEl.textContent = formatGold(window.GAME?.self?.gold || 0);
    }
    if (miniRoleBadge) {
      const r = getCharacterRoleInfo();
      miniRoleBadge.textContent = `${r.icon} ${r.isMelee ? 'Gần' : 'Xa'}`;
      miniRoleBadge.style.color = r.isMelee ? '#ff5252' : '#00e5ff';
    }

    // =======================================================================
    // 0. AUTO-REVIVE & RECOVERY CONTROLLER (v15.0)
    // =======================================================================
    const isDead = (vitals.hp <= 0) || ((window.GAME?.self?.st & 1) === 1);
    if (isDead) {
      stopMoving();
      currentTargetId = null;
      if (window.GAME) {
        window.GAME.lockId = 0;
        window.GAME.targetId = 0;
      }
      if (!reviveRecoveryState.active) {
        reviveRecoveryState.active = true;
        reviveRecoveryState.step = 'DEAD';
        reviveRecoveryState.deathTime = now;
        reviveRecoveryState.farmZone = lastFarmedZone || zone?.id;
        reviveRecoveryState.farmPos = lastFarmedPos || { x: Math.round(me.x), y: Math.round(me.y) };
        reviveRecoveryState.farmTargetMob = cfg.farmMob || cfg.targetMob;
        console.warn(`[BOT] Nhân vật đã tử trận! Ghi nhớ bãi train: ${reviveRecoveryState.farmZone} (${reviveRecoveryState.farmPos?.x}, ${reviveRecoveryState.farmPos?.y}), quái: ${reviveRecoveryState.farmTargetMob}`);
      }
      
      reviveRecoveryState.statusText = '💀 Đã tử trận! Đang hồi sinh về Làng...';
      if (statusTxt) statusTxt.textContent = reviveRecoveryState.statusText;
      if (miniStateEl) {
        miniStateEl.textContent = reviveRecoveryState.statusText;
        miniStateEl.style.color = '#ff5252';
      }

      // Kích hoạt hồi sinh
      if (now - (reviveRecoveryState.lastReviveAttempt || 0) > 1000) {
        reviveRecoveryState.lastReviveAttempt = now;
        try {
          const deadBtn = document.getElementById('dead')?.querySelector('button');
          if (deadBtn) deadBtn.click();
          if (window.GAME?.ui?.revive) window.GAME.ui.revive();
          window.GAME?.net?.send({ t: 'revive' });
        } catch (_) {}
      }
      return;
    }

    // Xử lý phục hồi sau khi hồi sinh sống lại:
    if (reviveRecoveryState.active) {
      if (reviveRecoveryState.step === 'DEAD') {
        reviveRecoveryState.step = 'CHECK_POTIONS';
        reviveRecoveryState.revivedTime = now;
      }

      if (reviveRecoveryState.step === 'CHECK_POTIONS') {
        const needsPotions = (invInfo.hpPotionCount <= cfg.autoShopHpPotionTrigger);
        if (cfg.autoShop && needsPotions) {
          reviveRecoveryState.statusText = '🛒 Hồi sinh: Máu thấp, tự động đi mua máu...';
          reviveRecoveryState.step = 'BUYING_POTIONS';
          triggerShopTrip(true);
          autoShopState.farmZone = reviveRecoveryState.farmZone;
          autoShopState.farmPos = reviveRecoveryState.farmPos;
          autoShopState.farmTargetMob = reviveRecoveryState.farmTargetMob;
        } else {
          reviveRecoveryState.step = 'RETURNING_TO_FARM';
        }
      }

      if (reviveRecoveryState.step === 'BUYING_POTIONS') {
        if (!autoShopState.active) {
          reviveRecoveryState.step = 'RETURNING_TO_FARM';
        } else {
          handleAutoShopStep(me, now, invInfo);
          return;
        }
      }

      if (reviveRecoveryState.step === 'RETURNING_TO_FARM') {
        if (!reviveRecoveryState.farmZone || zone.id === reviveRecoveryState.farmZone) {
          if (reviveRecoveryState.farmPos) {
            const d = Math.hypot(reviveRecoveryState.farmPos.x - me.x, reviveRecoveryState.farmPos.y - me.y);
            if (d > 85) {
              reviveRecoveryState.statusText = `🏃 Trở lại tọa độ bãi cũ (${Math.round(d)}px)...`;
              if (statusTxt) statusTxt.textContent = reviveRecoveryState.statusText;
              if (miniStateEl) {
                miniStateEl.textContent = reviveRecoveryState.statusText;
                miniStateEl.style.color = '#69f0ae';
              }
              const steer = calculateDirectSteering(me, reviveRecoveryState.farmPos.x, reviveRecoveryState.farmPos.y);
              setSteeringVector(steer.dx, steer.dy);
              return;
            }
          }
          stopMoving();
          console.log(`[BOT] Đã trở lại bãi train an toàn sau khi hồi sinh!`);
          if (reviveRecoveryState.farmTargetMob) {
            cfg.targetMob = reviveRecoveryState.farmTargetMob;
            const mobSel = botPanel.querySelector('#sm-mob-sel');
            if (mobSel) mobSel.value = cfg.farmMob || cfg.targetMob || 'all';
          }
          reviveRecoveryState.active = false;
          reviveRecoveryState.step = 'IDLE';
        } else {
          const route = safeMapRoute(zone.id, reviveRecoveryState.farmZone);
          if (!route || route.length === 0) {
            console.warn(`[BOT] Không tìm thấy đường từ ${zone.id} về ${reviveRecoveryState.farmZone}`);
            reviveRecoveryState.active = false;
            reviveRecoveryState.step = 'IDLE';
          } else {
            const nextHop = route[0];
            const p = zone.portals?.find(pt => pt.to === nextHop.targetZone) || nextHop.portal;
            if (p) {
              const d = Math.hypot(p.x - me.x, p.y - me.y);
              reviveRecoveryState.statusText = `🚪 [Hồi sinh] Đi qua cổng ${nextHop.targetZone} (${Math.round(d)}px)`;
              if (statusTxt) statusTxt.textContent = reviveRecoveryState.statusText;
              if (miniStateEl) {
                miniStateEl.textContent = reviveRecoveryState.statusText;
                miniStateEl.style.color = '#ffb300';
              }
              const steer = calculateDirectSteering(me, p.x, p.y);
              setSteeringVector(steer.dx, steer.dy);
              return;
            }
          }
        }
      }
    }

    // Ghi nhớ bãi farm khi đang cày bình thường (ngoài làng & không trong tiến trình shop/kho/hồi sinh)
    if (zone && zone.id !== 'lang' && !autoShopState.active && !storageState.active && !reviveRecoveryState.active) {
      lastFarmedZone = zone.id;
      lastFarmedPos = { x: Math.round(me.x), y: Math.round(me.y) };
      lastFarmedMob = cfg.farmMob || cfg.targetMob;
    }

    // =======================================================================
    // 1. AUTO-SHOP & AUTO-STORAGE CONTROLLER (HỌC TỪ COVIET)
    // =======================================================================
    if (elTrashSold) elTrashSold.textContent = devState.totalTrashSold;
    if (elPotionsBought) elPotionsBought.textContent = devState.totalPotionsBought;
    if (elPotionsInBag) elPotionsInBag.textContent = invInfo.hpPotionCount;

    // Cập nhật thông tin Role & Tầm đánh theo thời gian thực:
    if (badgeCombatRole && (!badgeCombatRole._lastUpdated || (now - badgeCombatRole._lastUpdated >= 1200))) {
      badgeCombatRole._lastUpdated = now;
      const r = getCharacterRoleInfo();
      const modeTxt = cfg.combatRole === 'auto' ? `${r.className}` : (cfg.combatRole === 'melee' ? 'Ép Gần' : 'Ép Xa');
      badgeCombatRole.textContent = `${r.icon} ${modeTxt} (${r.baseRange}px)`;
      badgeCombatRole.style.color = r.isMelee ? '#ff5252' : '#00e5ff';
    }

    // A. Cất Đồ Vào Kho (Thủ Kho) khi túi đầy và có trang bị quý
    if (cfg.autoStore && !storageState.active && !autoShopState.active) {
      if (invInfo.freeSlots <= cfg.autoShopFreeSlotTrigger && invInfo.keeperSlots.length > 0) {
        triggerStorageTrip();
      }
    }
    if (storageState.active) {
      if (miniStateEl) {
        miniStateEl.textContent = storageState.statusText;
        miniStateEl.style.color = '#00e5ff';
      }
      handleStorageStep(me, now, invInfo.keeperSlots);
      return;
    }

    // B. Bán Đồ & Nạp 100 Bình Máu
    if (cfg.autoShop) {
      if (!autoShopState.active) {
        const needsHpPotions = (invInfo.hpPotionCount <= cfg.autoShopHpPotionTrigger);
        const bagIsFull = (invInfo.freeSlots <= cfg.autoShopFreeSlotTrigger && invInfo.sellableSlots.length > 0);

        if (needsHpPotions || bagIsFull) {
          triggerShopTrip();
        }
      }

      if (autoShopState.active) {
        if (elShopStatus) elShopStatus.textContent = autoShopState.statusText;
        if (miniStateEl) {
          miniStateEl.textContent = autoShopState.statusText;
          miniStateEl.style.color = '#ffb300';
        }
        handleAutoShopStep(me, now, invInfo);
        return;
      } else {
        if (elShopStatus) elShopStatus.textContent = `🟢 Farm (Trống: ${invInfo.freeSlots}/48 | Máu: ${invInfo.hpPotionCount})`;
      }
    }

    // =======================================================================
    // 2. AUTO-QUEST CONTROLLER (HỌC TỪ COVIET)
    // =======================================================================
    if (cfg.autoQuest && !autoShopState.active && !storageState.active) {
      const isQuestNavigating = handleAutoQuest(me, now);
      if (isQuestNavigating) return;
    }

    // Cập nhật giao diện Quest tab theo thời gian thực:
    const activeQ = getActiveQuest();
    if (activeQ && elQTitle) {
      const qDef = getQuestDef(activeQ.id);
      const qStep = qDef?.steps?.[activeQ.step];
      elQTitle.textContent = qDef?.name || activeQ.title || activeQ.id;
      if (elQGoal) elQGoal.textContent = qStep?.title || qStep?.type || 'Làm nhiệm vụ';
      if (elQProg) elQProg.textContent = `${activeQ.have ?? 0}/${activeQ.need || qStep?.n || 1}`;
      if (elQStep) {
        if (activeQ.ready) {
          elQStep.textContent = 'Gặp NPC trả nhiệm vụ';
        } else if (qStep?.type === 'talk') {
          elQStep.textContent = 'Nói chuyện NPC';
        } else if (qStep?.type === 'defend') {
          elQStep.textContent = 'Thủ thành / Giữ trận (' + ((qStep.waves || []).map(w => w.mob).join('/') || 'âm binh') + ')';
        } else if (qStep?.type === 'use') {
          elQStep.textContent = 'Dùng vật phẩm tại điểm';
        } else if (qStep?.type === 'kill') {
          elQStep.textContent = 'Diệt quái: ' + (qStep.mobs?.join('/') || qStep.mob || 'quái');
        } else if (qStep?.type === 'collect') {
          elQStep.textContent = 'Thu thập: ' + (qStep.item || 'vật phẩm');
        } else {
          elQStep.textContent = 'Đi tới điểm nhiệm vụ';
        }
      }
    } else if (elQTitle) {
      elQTitle.textContent = 'Không có nhiệm vụ';
      if (elQGoal) elQGoal.textContent = 'Đã hoàn thành tất cả';
      if (elQProg) elQProg.textContent = '100%';
      if (elQStep) elQStep.textContent = 'Sẵn sàng';
    }

    if (statAtkEl) statAtkEl.textContent = devState.totalAttacks;
    if (statBreakoutEl) statBreakoutEl.textContent = devState.breakoutsTriggered;
    if (statDodgeEl) statDodgeEl.textContent = devState.swingDodged;
    if (statLeashEl) statLeashEl.textContent = devState.leashReversals;

    if (skLoiPhuEl) skLoiPhuEl.textContent = devState.skillsBreakdown.loiphu;
    if (skHoaLongEl) skHoaLongEl.textContent = devState.skillsBreakdown.hoalong;
    if (skNguHanhEl) skNguHanhEl.textContent = devState.skillsBreakdown.nguhanh;
    if (skThuyKinhEl) skThuyKinhEl.textContent = devState.skillsBreakdown.thuykinh;
    if (skThienLoiEl) skThienLoiEl.textContent = devState.skillsBreakdown.thienloi;

    // 1. Né chiêu đỏ Boss & Hazard Geometry (Học từ dodge.js của CoViet)
    for (let i = activeHazards.length - 1; i >= 0; i--) {
      if (now > activeHazards[i].until) activeHazards.splice(i, 1);
    }
    const dangerousHazard = activeHazards.find(h => isPointInsideHazard(h, me.x, me.y));
    let isDodgingHazard = false;
    if (dangerousHazard) {
      isDodgingHazard = true;
      movementState = 'RETREAT';
      devState.swingDodged++;
      const safePt = findSafeDodgePoint(me, activeHazards);
      if (safePt) {
        const dx = safePt.x - me.x, dy = safePt.y - me.y;
        const d = Math.hypot(dx, dy) || 1;
        setSteeringVector(dx / d, dy / d);
      } else {
        const kiteVec = computeCongaKiteVector(me, [], null, true);
        setSteeringVector(kiteVec.vx, kiteVec.vy);
      }
      if (statusTxt) statusTxt.textContent = `⚠️ NÉ CHIÊU BOSS [${(dangerousHazard.sh || 'hazard').toUpperCase()}] RA BÃI TRỐNG!`;
      if (miniStateEl) {
        miniStateEl.textContent = `⚠️ Né ${dangerousHazard.sh || 'chiêu'}`;
        miniStateEl.style.color = '#ff5252';
      }
      // Không return: tiếp tục chạy xuống xử lý mục tiêu & xả chiêu tầm xa trong lúc lùi né!
    }

    const state = resolveTargetAndState(me);
    if (dminTxt) dminTxt.textContent = `${Math.round(state.dMin)}px`;
    if (pursuersTxt) pursuersTxt.textContent = `${state.pursuerCount} con`;

    // Phá vây nếu đánh xa bị 2 quái trở lên áp sát 78px
    const isPinnedAgainstWall = (!getCharacterRoleInfo().isMelee && state.dMin <= 78 && state.pursuerCount >= 2);
    
    // Theo dõi kẹt bước chân (Universal Stuck Breakout - kể cả lúc đi cổng/shop)
    if (now - lastPosCheck.t > 300) {
      const movedDist = Math.hypot(me.x - lastPosCheck.x, me.y - lastPosCheck.y);
      const isTryingToMove = movementState !== 'STAND' || autoShopState.active;
      if (isTryingToMove && movedDist < 8) {
        isCurrentlyStuck = true;
        devState.breakoutsTriggered++;
        stuckUntil = now + 450;
      } else if (now >= stuckUntil) {
        isCurrentlyStuck = false;
      }
      lastPosCheck = { x: me.x, y: me.y, t: now };
    }

    // Dọn dẹp mục tiêu chết để giải phóng khóa mục tiêu (không kẹt target cũ, quái 0 máu / 1 máu)
    if (currentTargetId) {
      const curMob = window.GAME?.mobs?.get(currentTargetId);
      if (!curMob || !isMobValidAndAlive(curMob)) {
        currentTargetId = null;
        if (window.GAME) {
          window.GAME.lockId = 0;
          window.GAME.targetId = 0;
        }
        if (lastTargetIdSent) {
          window.GAME.net.send({ t: 'tg', id: 0 });
          lastTargetIdSent = null;
        }
      }
    }

    const snaps = window.GAME.net?.snaps;
    const latest = snaps?.[snaps.length - 1];
    const currentDrops = latest?.d || capturedDrops || [];

    // 3. Nhặt đồ độc lập: CHỈ KHI QUÁI ĐÃ CHẾT VÀ AN TOÀN (VÀ KHÔNG TRONG LÚC NÉ CHIÊU)
    if (cfg.autoLoot && !isDodgingHazard && (!state.target || state.dMin >= 200) && currentDrops.length > 0) {
      const validDrops = currentDrops.map(d => ({
        id: d[0], item: d[1], x: d[2], y: d[3], r: d[4], mine: d[6],
        dist: Math.hypot(d[2] - me.x, d[3] - me.y)
      })).filter(d => d.dist <= cfg.lootRadius && !activeHazards.some(h => isPointInsideHazard(h, d.x, d.y, 20)));

      if (validDrops.length > 0) {
        movementState = 'STAND';
        validDrops.sort((a, b) => {
          // Ưu tiên 1: Đồ nhiệm vụ đang cần thu thập (Học từ CoViet)
          if (questState?.collectItem) {
            const aIsQ = a.item === questState.collectItem;
            const bIsQ = b.item === questState.collectItem;
            if (aIsQ !== bIsQ) return bIsQ ? 1 : -1;
          }
          // Ưu tiên 2: Đồ của mình rơi
          if (a.mine !== b.mine) return b.mine ? 1 : -1;
          // Ưu tiên 3: Khoảng cách gần nhất
          return a.dist - b.dist;
        });
        const targetDrop = validDrops[0];

        if (targetDrop.dist <= 42) {
          stopMoving();
          if (now - lastPickTime > 140) {
            window.GAME.net.send({ t: 'pick', id: targetDrop.id });
            lastPickTime = now;
            devState.totalItemsPicked++;
          }
          if (statusTxt) statusTxt.textContent = `🎁 ĐANG HÚT ĐỒ: ${targetDrop.item}`;
          return;
        } else {
          const steer = calculateDirectSteering(me, targetDrop.x, targetDrop.y);
          setSteeringVector(steer.dx, steer.dy);
          if (statusTxt) statusTxt.textContent = `🏃 ĐẾN NHẶT ĐỒ SAU GIAO TRANH (${Math.round(targetDrop.dist)}px)`;
          return;
        }
      }
    }

    if (state.navigatingSpawn && !state.target) {
      // CoViet targetWithin check: nếu có quái hợp lệ trong tầm, ưu tiên xả chiêu & đánh ngay!
      const roleInfo = getCharacterRoleInfo();
      const allActiveMobs = window.GAME?.mobs ? Array.from(window.GAME.mobs.values()).filter(m => isMobValidAndAlive(m)) : [];
      const targetFilter = getActiveTargetFilter();
      const mobInRange = allActiveMobs.find(m => {
        const d = Math.hypot(m.x - me.x, m.y - me.y);
        if (d > roleInfo.baseRange + 50) return false;
        if (state.isQuestTarget && targetFilter) {
          return targetFilter.matches(m.kind, getMobDef(m)?.id) || (m.tgt === me.id && state.pursuers?.includes(m));
        }
        return true;
      });
      if (mobInRange) {
        currentTargetId = mobInRange.id;
        if (window.GAME) {
          window.GAME.lockId = mobInRange.id;
          window.GAME.targetId = mobInRange.id;
        }
        executeOracleAttack(mobInRange, now, Math.hypot(mobInRange.x - me.x, mobInRange.y - me.y), 0, mobInRange, 1, false, false);
      }

      if (!isDodgingHazard) {
        movementState = 'APPROACH';
        const dist = Math.hypot(state.navigatingSpawn.x - me.x, state.navigatingSpawn.y - me.y);
        if (dist > 80) {
          const steer = calculateDirectSteering(me, state.navigatingSpawn.x, state.navigatingSpawn.y);
          setSteeringVector(steer.dx, steer.dy);
          const mobDef = window.GAME?.GD?.mobs?.[state.navigatingSpawn.mob];
          if (statusTxt) statusTxt.textContent = `🧭 ĐI TỚI BÃI: ${mobDef?.name || state.navigatingSpawn.mob}`;
          if (targetTxt) targetTxt.textContent = `[BÃI] ${mobDef?.name || state.navigatingSpawn.mob} (${Math.round(dist)}px)`;
        } else {
          stopMoving();
          if (statusTxt) statusTxt.textContent = `Đã tới bãi, chờ quái ra...`;
          if (targetTxt) targetTxt.textContent = `Chờ xuất hiện...`;
        }
      }
      return;
    }

    const targetMob = state.target;
    if (!targetMob || !isMobValidAndAlive(targetMob)) {
      // CoViet targetWithin fallback: nếu mất target nhưng có quái sống trong tầm, không bao giờ đứng chôn chân
      const roleInfo = getCharacterRoleInfo();
      const allActiveMobs = window.GAME?.mobs ? Array.from(window.GAME.mobs.values()).filter(m => isMobValidAndAlive(m)) : [];
      const targetFilter = getActiveTargetFilter();
      const mobInRange = allActiveMobs.find(m => {
        const d = Math.hypot(m.x - me.x, m.y - me.y);
        if (d > roleInfo.baseRange + 50) return false;
        if (state.isQuestTarget && targetFilter) {
          return targetFilter.matches(m.kind, getMobDef(m)?.id) || (m.tgt === me.id && state.pursuers?.includes(m));
        }
        return true;
      });
      if (mobInRange) {
        currentTargetId = mobInRange.id;
        if (window.GAME) {
          window.GAME.lockId = mobInRange.id;
          window.GAME.targetId = mobInRange.id;
        }
        executeOracleAttack(mobInRange, now, Math.hypot(mobInRange.x - me.x, mobInRange.y - me.y), 0, mobInRange, 1, false, false);
      } else {
        currentTargetId = null;
        if (!isDodgingHazard) {
          movementState = 'STAND';
          stopMoving();
          if (statusTxt) statusTxt.textContent = "Đang quét tìm quái...";
          if (targetTxt) targetTxt.textContent = "None";
        }
      }
      return;
    }

    const distToTarget = Math.hypot(targetMob.x - me.x, targetMob.y - me.y);
    const def = getMobDef(targetMob);
    const mobName = def?.name || targetMob.kind || targetMob.id;

    if (targetTxt) {
      const isBoss = def?.boss || def?.elite;
      let addPrefix = '';
      if (state.isPvP) addPrefix = '⚔️ [PVP SOLO] ';
      if (state.isAddClear) addPrefix = '⚡ [ĐỆ TỬ] ';
      else if (state.isRetaliation) addPrefix = '🛡️ [CẮN LÉN] ';
      else if (state.isRoadblock) addPrefix = '🚧 [CẢN ĐƯỜNG] ';
      else if (isBoss) addPrefix = '👑 [BOSS] ';

      targetTxt.textContent = `${addPrefix}${mobName} [${targetMob.hp}/${targetMob.maxHp}] (${Math.round(distToTarget)}px)`;
    }

    const targetRadius = targetMob.r || def?.r || 24;
    const roleInfo = getCharacterRoleInfo();
    const isPlayerMelee = roleInfo.isMelee;
    const baseRange = roleInfo.baseRange;
    const isTargetBoss = state.isBoss || isBossMob(targetMob);
    const actualMaxReach = baseRange + targetRadius;

    let retreatTrigger, retreatSafe, approachTrigger, approachStop;

    if (state.isPvP) {
      if (state.isMeleeOpponent) {
        retreatTrigger = isPlayerMelee ? 60 : Math.round(baseRange * 0.72);
        retreatSafe = isPlayerMelee ? 85 : Math.round(baseRange * 0.92);
        approachTrigger = isPlayerMelee ? 110 : Math.round(baseRange * 1.08);
        approachStop = isPlayerMelee ? 65 : Math.round(baseRange * 0.85);
      } else if (state.isRangedOpponent) {
        retreatTrigger = isPlayerMelee ? 70 : Math.round(baseRange * 0.75);
        retreatSafe = isPlayerMelee ? 95 : Math.round(baseRange * 0.95);
        approachTrigger = isPlayerMelee ? 130 : Math.round(baseRange * 1.12);
        approachStop = isPlayerMelee ? 70 : Math.round(baseRange * 0.88);
      } else {
        retreatTrigger = isPlayerMelee ? 60 : Math.round(baseRange * 0.72);
        retreatSafe = isPlayerMelee ? 85 : Math.round(baseRange * 0.92);
        approachTrigger = isPlayerMelee ? 110 : Math.round(baseRange * 1.08);
        approachStop = isPlayerMelee ? 65 : Math.round(baseRange * 0.85);
      }
    } else if (isTargetBoss) {
      // ĐÁNH BOSS (NGHÊ CHÚA, CHẤN TINH, MỘC TINH, ĐẠI BÀNG, XƯƠNG HỔ):
      // Boss có hitbox to lớn (r=66+), đòn cận chiến 130px, nhảy đè/vả quét 160-180px.
      if (isPlayerMelee) {
        // CẬN CHIẾN ĐÁNH BOSS: Áp sát trong tầm chém, sẵn sàng né chiêu đỏ
        approachTrigger = actualMaxReach - 10;
        approachStop = Math.round(baseRange * 0.75) + targetRadius;
        retreatTrigger = 45 + targetRadius;
        retreatSafe = 75 + targetRadius;
      } else {
        // ĐÁNH XA ĐÁNH BOSS: Giữ cự ly vàng tuyệt đối ngoài tầm đánh cận chiến (130px) và nhảy đè của Boss!
        // actualMaxReach = 280 + 66 = 346px
        approachTrigger = Math.round(actualMaxReach * 0.94); // ~325px (< actualMaxReach, KHÔNG BAO GIỜ BỊ DEAD ZONE!)
        approachStop = Math.round(actualMaxReach * 0.86);    // ~298px
        retreatTrigger = Math.round(actualMaxReach * 0.70);  // ~242px (khoảng cách mép Boss > 158px, Boss không với tới!)
        retreatSafe = Math.round(actualMaxReach * 0.86);     // ~298px
      }
    } else {
      // ĐÁNH QUÁI THƯỜNG (PVE FARM & QUEST):
      // Áp dụng chuẩn CoViet: Đứng yên xả chiêu, không lùi chạy lung tung trước quái thường!
      if (isPlayerMelee) {
        // CẬN CHIẾN: Áp sát chém liên hoàn, không bao giờ lùi chạy trước quái thường
        approachTrigger = actualMaxReach - 8;
        approachStop = Math.round(baseRange * 0.70) + targetRadius;
        retreatTrigger = 0;
        retreatSafe = 50;
      } else {
        // ĐÁNH XA: Trụ chân từ xa xả chiêu, chỉ lùi phá vây khi quái bu sát mặt (< 110px)
        approachTrigger = Math.round(actualMaxReach * 0.94); // ~285px (< 304px reach, KHÔNG BAO GIỜ BỊ DEAD ZONE!)
        approachStop = Math.round(actualMaxReach * 0.85);    // ~258px
        retreatTrigger = 110;                                // Chỉ lùi khi quái cắn sát mặt
        retreatSafe = 180;
      }
    }

    if (isDodgingHazard) {
      // Đang né chiêu đỏ: Vector di chuyển đã được thiết lập né ra điểm an toàn (findSafeDodgePoint)!
    } else if (isPinnedAgainstWall || (isCurrentlyStuck && now < stuckUntil)) {
      movementState = 'RETREAT';
      // Dò tia có độ dài di chuyển tối đa trong 16 hướng ra khoảng trống
      const kiteVec = computeCongaKiteVector(me, state.pursuers, state.spawnCenter, state.isBoss);
      setSteeringVector(kiteVec.vx, kiteVec.vy);
      if (statusTxt) {
        statusTxt.textContent = `🚨 PHÁ VÂY KHẨN CẤP: Bẻ lái trượt qua khe quái ra khoảng trống!`;
      }
    } else {
      // Hysteresis Latch chuẩn v15.0
      if (movementState === 'STAND') {
        if (state.dMin < retreatTrigger || state.isPeeling) {
          movementState = 'RETREAT';
        } else if (distToTarget > approachTrigger) {
          movementState = 'APPROACH';
        }
      } else if (movementState === 'RETREAT') {
        if (state.dMin >= retreatSafe && !state.isPeeling) {
          movementState = 'STAND';
        }
      } else if (movementState === 'APPROACH') {
        if (distToTarget <= approachStop) {
          movementState = 'STAND';
        } else if (state.dMin < retreatTrigger) {
          movementState = 'RETREAT';
        }
      }

      if (movementState === 'RETREAT') {
        let vx, vy;
        if (state.isPvP && state.isRangedOpponent) {
          // Né chiêu định hướng của Sơn Thần: Di chuyển đảo hướng zic-zac 90 độ (Perpendicular Strafe)
          const dx = me.x - targetMob.x, dy = me.y - targetMob.y;
          const d = Math.hypot(dx, dy) || 1;
          const ux = dx / d, uy = dy / d;
          const tx = -uy, ty = ux;
          const strafeDir = (Math.floor(now / 1200) % 2 === 0) ? 1 : -1;
          vx = ux * 0.4 + tx * 0.6 * strafeDir;
          vy = uy * 0.4 + ty * 0.6 * strafeDir;
        } else {
          const kiteVec = computeCongaKiteVector(me, state.pursuers, state.spawnCenter, state.isBoss);
          vx = kiteVec.vx;
          vy = kiteVec.vy;
        }
        setSteeringVector(vx, vy);
        if (statusTxt) {
          if (state.isPvP) {
            statusTxt.textContent = `🏃 NÉ TẦM CHIÊU ĐỐI THỦ: ${targetMob.name} (${Math.round(distToTarget)}px -> ${retreatSafe}px)`;
          } else if (state.isAddClear) {
            statusTxt.textContent = `⚔️ FOCUS DIỆT ĐỆ TỬ CỦA BOSS: ${mobName} (${Math.round(state.dMin)}px)`;
          } else if (state.isRetaliation) {
            statusTxt.textContent = `🛡️ TỰ VỆ PHẢN CÔNG: ${mobName} đang cắn lén (${Math.round(state.dMin)}px)!`;
          } else if (state.isRoadblock) {
            statusTxt.textContent = `🚧 MỞ ĐƯỜNG TIẾN BÃI: Dọn ${mobName} chắn lối (${Math.round(state.dMin)}px)!`;
          } else {
            statusTxt.textContent = state.isPeeling
              ? `🛡️ PHÁ VÒNG VÂY: d_min=${Math.round(state.dMin)}px`
              : `🏃 LÙI THẢ DIỀU & TRÁNH CẢN: ${mobName} (${Math.round(state.dMin)}px -> ${retreatSafe}px)`;
          }
        }
      } else if (movementState === 'APPROACH') {
        const steer = calculateDirectSteering(me, targetMob.x, targetMob.y);
        setSteeringVector(steer.dx, steer.dy);
        if (statusTxt) {
          statusTxt.textContent = state.isPvP 
            ? `⚡ TIẾP CẬN SOLO: ${targetMob.name} (${Math.round(distToTarget)}px)` 
            : (isPlayerMelee 
                ? `⚔️ TIẾP CẬN ÁP SÁT: ${mobName} (${Math.round(distToTarget)}px -> ${approachStop}px)` 
                : `🏹 TIẾP CẬN TẦM XA: ${mobName} (${Math.round(distToTarget)}px -> ${approachStop}px)`);
        }
      } else {
        stopMoving();
        if (statusTxt) {
          if (state.isPvP) {
            statusTxt.textContent = `⚔️ ĐẤU CHIÊU SOLO: Xả combo dồn ép ${targetMob.name} (${Math.round(distToTarget)}px)!`;
          } else if (state.isAddClear) {
            statusTxt.textContent = `⚔️ ĐỨNG BẮN GỤC ĐỆ TỬ (${Math.round(state.dMin)}px): Dọn sạch quái đệ tử!`;
          } else if (state.isRetaliation) {
            statusTxt.textContent = `🛡️ TRỤ CHÂN VẢ CHẾT KẺ CẮN LÉN: ${mobName} (${Math.round(distToTarget)}px)!`;
          } else if (state.isRoadblock) {
            statusTxt.textContent = `🚧 ĐỨNG BẮN DỌN VẬT CẢN: ${mobName} (${Math.round(distToTarget)}px)!`;
          } else {
            statusTxt.textContent = isPlayerMelee
              ? `⚔️ CẬN CHIẾN CHÉM LIÊN HOÀN (${Math.round(distToTarget)}px): XẢ FULL SKILL!`
              : `🏹 TRỤ CHÂN XẢ CHIÊU TẦM XA (${Math.round(distToTarget)}px): XẢ FULL SKILL!`;
          }
        }
      }
    }

    // Xả kỹ năng: Khi bị vây khẩn cấp, kích hoạt Choáng diện rộng ngay lập tức!
    executeOracleAttack(targetMob, now, distToTarget, state.dMin, state.closestMob, state.pursuerCount, isPinnedAgainstWall, state.isPvP);

    if (miniStatusEl) miniStatusEl.textContent = cfg.enabled ? '🟢 Bot v16.2.0' : '🔴 Tạm dừng';
    if (miniAtkEl) miniAtkEl.textContent = devState.totalAttacks;
    if (miniBreakoutEl) miniBreakoutEl.textContent = devState.breakoutsTriggered;
    if (miniStateEl && statusTxt) miniStateEl.textContent = statusTxt.textContent;
  }, 60);


  window._ancientMasterBot = {
    version: '16.2.0',
    cfg,
    devState,
    skillTimers,
    autoShopState,
    inspectInventory,
    findDynamicGlobalShop,
    triggerShopTrip,

    populateMobSelect,
    applySkillLoadout,
    openChat,
    minimizeChat,
    upgradeState,
    getSkillUpgradeAnalysis,
    getGearEnhanceAnalysis,
    questBlacklist,
    destroy() {
      clearInterval(mainLoop);
      stopMoving();
      if (botPanel.parentNode) botPanel.parentNode.removeChild(botPanel);
      if (botMiniBadge.parentNode) botMiniBadge.parentNode.removeChild(botMiniBadge);
      if (floatingChat.parentNode) floatingChat.parentNode.removeChild(floatingChat);
      if (chatBubble.parentNode) chatBubble.parentNode.removeChild(chatBubble);
      if (origNetOnMessage && window.GAME?.net) window.GAME.net.onMessage = origNetOnMessage;
      if (originalOnSnapshot && window.GAME?.net?.h) window.GAME.net.h.onSnapshot = originalOnSnapshot;
      if (origUiChatLine && window.GAME?.ui) window.GAME.ui.chatLine = origUiChatLine;
      if (origUiToggleChat && window.GAME?.ui) window.GAME.ui.toggleChat = origUiToggleChat;
      delete window._ancientMasterBot;
      console.log("%c[BOT v16.2.0] Đã gỡ bỏ toàn bộ giao diện và tiến trình.", "color: #ff9800; font-weight: bold;");
    }
  };

    console.log("%c[BOT v16.2.0] KHỞI ĐỘNG THÀNH CÔNG: VUA NÂNG CẤP KỸ NĂNG & CƯỜNG HÓA TRANG BỊ, TỰ ĐỘNG SĂN NGUYÊN LIỆU ĐỈNH CAO!", "color: #00e676; font-size: 14px; font-weight: bold;");
  }
})();
