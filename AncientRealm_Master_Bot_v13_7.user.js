// ==UserScript==
// @name         Ancient Realm - Master Bot v13.6 (Official Plugin)
// @namespace    https://ancientrealm.online/
// @version      13.6.0
// @description  Tự động đánh quái, chống kẹt phá vây 16 tia, phản công tự vệ, mở đường & khung chat nổi kéo thả cho Đại Nam Cổ Giới
// @author       Antigravity
// @match        *://ancientrealm.online/*
// @match        *://*.ancientrealm.online/*
// @icon         https://ancientrealm.online/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==

// ==AncientRealm Master Bot v13.6 - Chrome Extension Content Script==
// Tự động khởi động khi vào game, không cần copy code mỗi lần mở lại!
(function() {
  'use strict';

  // 1. Tự động thêm ?debug nếu chưa có để kích hoạt hệ thống điều khiển
  if (!location.search.includes('debug')) {
    console.log('[BOT PLUGIN] Tự động kích hoạt chế độ ?debug cho game...');
    const sep = location.search ? '&' : '?';
    location.replace(location.pathname + location.search + sep + 'debug' + location.hash);
    return;
  }

  // 2. Chờ người chơi đăng nhập và thế giới game sẵn sàng
  function waitForGameReady() {
    if (window._ancientMasterBotPluginInited) return;

    let checkCount = 0;
    const interval = setInterval(() => {
      checkCount++;
      const isReady = typeof window.GAME !== 'undefined' &&
                      window.GAME &&
                      window.GAME.net &&
                      window.GAME.me &&
                      window.GAME.self &&
                      window.GAME.world &&
                      window.GAME.world.zone &&
                      window.GAME.GD;

      if (isReady) {
        clearInterval(interval);
        if (window._ancientMasterBotPluginInited) return;
        window._ancientMasterBotPluginInited = true;

        console.log("%c[ANCIENT REALM BOT v13.6 PLUGIN] ĐÃ KẾT NỐI VÀO GAME ENGINE THÀNH CÔNG! ĐANG KHỞI CHẠY BOT...", "color: #00e676; font-size: 13px; font-weight: bold;");
        
        try {
          runBotCore();
        } catch (err) {
          console.error('[BOT PLUGIN ERROR]', err);
        }
      } else if (checkCount % 10 === 0) {
        console.log('[BOT PLUGIN] Đang chờ Sếp đăng nhập vào nhân vật...');
      }
    }, 500);
  }

  function runBotCore() {

  // [Plugin Auto-Hooked] Game engine verified before launch

  if (window._ancientMasterBot) window._ancientMasterBot.destroy();
  const oldPanels = document.querySelectorAll('[id^="ancient-master-bot"]');
  oldPanels.forEach(p => p.remove());

  const MOB_BASE = 1_000_000;

  function getMyCls() {
    const self = window.GAME?.self;
    const gdClasses = window.GAME?.GD?.classes;
    if (!self || !gdClasses) return null;
    return gdClasses[self.cls] || null;
  }

  const clsData = getMyCls();
  const rawClassRange = clsData?.range || 280;
  const maxRange = Math.round(rawClassRange + 30); // 310px

  const cfg = {
    enabled: true,
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
    autoPotion: true
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
    lastMeasuredMobKind: ''
  };

  let movementState = 'STAND';
  let pendingLoadout = null;
  const mobSwingCooldowns = new Map();
  const activeTelegraphs = [];
  let capturedDrops = [];

  // Theo dõi kẹt địa hình
  let lastPosCheck = { x: 0, y: 0, t: 0 };
  let isCurrentlyStuck = false;
  let stuckEscapeDir = null;
  let stuckUntil = 0;

  const skillTimers = {
    ad_loiphu: 0,
    ad_hoalong: 0,
    ad_nguhanh: 0,
    ad_thuykinh: 0,
    ad_thienloi: 0
  };

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
            } else if (ev.k === 'tele') {
              activeTelegraphs.push({
                x: ev.x, y: ev.y, r: ev.r || 100,
                expiresAt: performance.now() + (ev.ms || 1200) + 150
              });
            }
          }
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
    if (s && s.d) capturedDrops = s.d;
    return originalOnSnapshot.apply(this, arguments);
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
    for (const k of activeKeys) {
      const char = k.replace('Key', '').toLowerCase();
      window.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: k, bubbles: true }));
    }
    activeKeys.clear();
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
      const cx = c[0], cy = c[1], cr = c[2];
      const dx = me.x - cx, dy = me.y - cy;
      const distCenter = Math.hypot(dx, dy) || 1;
      const distSurface = distCenter - cr - 16;
      if (distSurface < 85) {
        obstacleNearCount++;
        // Càng gần vật cản, lực đẩy ngược ra càng cực đại!
        const weight = 1 / Math.max(1, distSurface * distSurface);
        repX += (dx / distCenter) * weight * 2500;
        repY += (dy / distCenter) * weight * 2500;
      }
    }

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
    // Đảm bảo dù hướng lùi chính bị vách đá cản, bot luôn tìm được khe hở thoát hiểm!
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

      if (score > bestScore) {
        bestScore = score;
        bestVx = vx;
        bestVy = vy;
      }
    }

    return { vx: bestVx, vy: bestVy, obstacleNear: obstacleNearCount > 0 };
  }

  function calculateDirectSteering(me, targetX, targetY) {
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

  // ==========================================
  // HỆ THỐNG CHỌN MỤC TIÊU & PHÁ VÂY
  // ==========================================
  function resolveTargetAndState(me) {
    const allMobs = window.GAME?.mobs ? Array.from(window.GAME.mobs.values()).filter(m => !(m.st & 1) && m.hp > 0) : [];
    const spawns = window.GAME?.world?.zone?.spawns || [];
    const cfgTarget = cfg.targetMob;

    // Lấy thông tin người chơi hiện tại
    const allPlayers = window.GAME?.players ? Array.from(window.GAME.players.values()) : [];
    const mePlayer = allPlayers.find(p => p.name === window.GAME?.self?.name);
    const myId = mePlayer?.id;
    const myHp = mePlayer?.hp || 1000;
    const myMaxHp = mePlayer?.maxHp || mePlayer?.mhp || 1000;
    const isHpLow = myHp < myMaxHp * 0.92;

    const zoneId = window.GAME?.world?.zone?.id;
    const isPvpZone = zoneId === 'vodai' || window.GAME?.world?.zone?.pvp === true;

    // ==========================================
    // 0. HỆ THỐNG PVP SOLO 1V1 / TỈ THÍ / PK (ƯU TIÊN HÀNG ĐẦU)
    // ==========================================
    let pvpOpponent = null;

    // a. Trận Tỉ Thí Lôi Đài đang diễn ra (Duel packet)
    if (window._activeDuel && window._activeDuel.foeId) {
      pvpOpponent = allPlayers.find(p => p.id === window._activeDuel.foeId && !(p.st & 1) && p.hp > 0);
    }

    // b. Người chơi được click chọn hoặc đang khóa mục tiêu (lockId / targetId)
    if (!pvpOpponent) {
      const lock = window.GAME?.lockId || window.GAME?.targetId;
      if (lock && lock < 1_000_000 && lock !== myId) {
        pvpOpponent = allPlayers.find(p => p.id === lock && !(p.st & 1) && p.hp > 0);
      }
    }

    // c. Mục tiêu người chơi được chọn từ dropdown (cfgTarget = 'player_XXX')
    if (!pvpOpponent && cfgTarget && cfgTarget.startsWith('player_')) {
      const pId = parseInt(cfgTarget.replace('player_', ''));
      pvpOpponent = allPlayers.find(p => p.id === pId && !(p.st & 1) && p.hp > 0);
    }

    // d. Tự động nhận diện đối thủ trong bản đồ Võ Đài / PK
    if (!pvpOpponent && isPvpZone) {
      const rivals = allPlayers.filter(p => p.id !== myId && !(p.st & 1) && p.hp > 0);
      if (rivals.length > 0) {
        rivals.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
        pvpOpponent = rivals[0];
      }
    }

    // NẾU CÓ ĐỐI THỦ PVP: KÍCH HOẠT CHẾ ĐỘ CHIẾN ĐẤU SOLO VÀ NÉ TẦM SKILL
    if (pvpOpponent) {
      const dist = Math.hypot(pvpOpponent.x - me.x, pvpOpponent.y - me.y);
      const oppCls = pvpOpponent.cls?.id || pvpOpponent.cls || 'thienvuong';
      const isMelee = oppCls === 'thienvuong' || oppCls === 'longtuyen';
      const isRanged = oppCls === 'sonthan' || oppCls === 'linhmoc';

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
        isPeeling: isMelee && dist <= 190
      };
    }

    // ==========================================
    // CƠ CHẾ PVE: TÌM QUÁI, BOSS, PHẢN CÔNG & DỌN ĐƯỜNG
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

    const activeBoss = allMobs.find(m => {
      const def = getMobDef(m);
      return !!(def?.boss || def?.elite || m.kind === 'chantinh' || m.kind === 'daibang' || m.kind === 'moctinh' || m.kind === 'xuongho');
    });

    if (activeBoss) {
      const distToBoss = Math.hypot(activeBoss.x - me.x, activeBoss.y - me.y);
      if (distToBoss <= 480 || (myId && activeBoss.tgt === myId)) {
        const adds = pursuers.filter(p => p.mob.id !== activeBoss.id && !getMobDef(p.mob)?.boss && !getMobDef(p.mob)?.elite);
        if (adds.length > 0) {
          adds.sort((a, b) => (a.mob.hp - b.mob.hp) || (a.dist - b.dist));
          const targetAdd = adds[0].mob;
          return {
            target: targetAdd,
            isAddClear: true,
            isPeeling: adds[0].dist <= 130,
            dMin: dMin === Infinity ? 999 : dMin,
            closestMob,
            pursuers: pursuers.map(p => p.mob),
            pursuerCount: pursuers.length,
            spawnCenter: findDynamicSpawnCenter(activeBoss, me),
            isBoss: false,
            bossContext: activeBoss
          };
        }
      }
    }

    let chosenTarget = null;
    let targetDest = null;
    let targetSpawn = null;

    if (cfgTarget !== 'all') {
      const matchingMobs = allMobs.filter(m => m.kind === cfgTarget || getMobDef(m)?.id === cfgTarget);
      if (matchingMobs.length > 0) {
        matchingMobs.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
        chosenTarget = matchingMobs[0];
        targetDest = { x: chosenTarget.x, y: chosenTarget.y };
      } else {
        const matchingSpawns = spawns.filter(s => s.mob === cfgTarget);
        if (matchingSpawns.length > 0) {
          matchingSpawns.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
          targetSpawn = matchingSpawns[0];
          targetDest = { x: targetSpawn.x, y: targetSpawn.y };
        }
      }
    } else {
      chosenTarget = activeBoss || closestMob;
      if (chosenTarget) {
        targetDest = { x: chosenTarget.x, y: chosenTarget.y };
      }
    }

    if (myId) {
      const aggroAttackers = pursuers.filter(p => {
        const m = p.mob;
        if (chosenTarget && m.id === chosenTarget.id) return false;
        return m.tgt === myId && p.dist <= 260;
      });

      if (aggroAttackers.length > 0) {
        const distToChosen = chosenTarget ? Math.hypot(chosenTarget.x - me.x, chosenTarget.y - me.y) : Infinity;
        const urgentThreat = isHpLow || aggroAttackers[0].dist <= 170 || distToChosen > 180 || !chosenTarget;

        if (urgentThreat) {
          aggroAttackers.sort((a, b) => (a.mob.hp - b.mob.hp) || (a.dist - b.dist));
          const retaliateMob = aggroAttackers[0].mob;
          return {
            target: retaliateMob,
            isRetaliation: true,
            isPeeling: aggroAttackers[0].dist <= 130,
            dMin: dMin === Infinity ? 999 : dMin,
            closestMob,
            pursuers: pursuers.map(p => p.mob),
            pursuerCount: pursuers.length,
            spawnCenter: findDynamicSpawnCenter(retaliateMob, me),
            isBoss: !!(getMobDef(retaliateMob)?.boss || getMobDef(retaliateMob)?.elite),
            navigatingSpawn: targetSpawn
          };
        }
      }
    }

    if (targetDest) {
      const dxDest = targetDest.x - me.x;
      const dyDest = targetDest.y - me.y;
      const distDest = Math.hypot(dxDest, dyDest);

      if (distDest > 120) {
        const roadblocks = [];
        for (const p of pursuers) {
          const m = p.mob;
          if (chosenTarget && m.id === chosenTarget.id) continue;
          if (p.dist > 220 || p.dist >= distDest) continue;

          const dot = ((targetDest.x - me.x) * (m.x - me.x) + (targetDest.y - me.y) * (m.y - me.y)) / (distDest * p.dist);
          if (dot >= 0.707) {
            const crossDist = Math.abs((targetDest.x - me.x) * (m.y - me.y) - (targetDest.y - me.y) * (m.x - me.x)) / distDest;
            if (crossDist <= 70) {
              roadblocks.push({ mob: m, dist: p.dist, crossDist, hp: m.hp });
            }
          }
        }

        if (roadblocks.length > 0) {
          roadblocks.sort((a, b) => (a.dist - b.dist) || (a.hp - b.hp));
          const roadblockMob = roadblocks[0].mob;
          return {
            target: roadblockMob,
            isRoadblock: true,
            isPeeling: roadblocks[0].dist <= 130,
            dMin: dMin === Infinity ? 999 : dMin,
            closestMob,
            pursuers: pursuers.map(p => p.mob),
            pursuerCount: pursuers.length,
            spawnCenter: findDynamicSpawnCenter(roadblockMob, me),
            isBoss: !!(getMobDef(roadblockMob)?.boss || getMobDef(roadblockMob)?.elite),
            navigatingSpawn: targetSpawn
          };
        }
      }
    }

    if (chosenTarget) {
      const spawnCenter = findDynamicSpawnCenter(chosenTarget, me);
      const closeThreat = pursuers.find(p => p.mob.id !== chosenTarget.id && p.dist <= 130);

      return {
        target: closeThreat ? closeThreat.mob : chosenTarget,
        isPeeling: !!closeThreat,
        dMin: dMin === Infinity ? 999 : dMin,
        closestMob,
        pursuers: pursuers.map(p => p.mob),
        pursuerCount: pursuers.length,
        spawnCenter,
        isBoss: !!(getMobDef(chosenTarget)?.boss || getMobDef(chosenTarget)?.elite),
        navigatingSpawn: targetSpawn
      };
    }

    if (targetSpawn) {
      return {
        target: null,
        navigatingSpawn: targetSpawn,
        dMin: dMin === Infinity ? 999 : dMin,
        closestMob,
        pursuers: pursuers.map(p => p.mob),
        pursuerCount: pursuers.length,
        spawnCenter: null,
        isBoss: false
      };
    }

    return {
      target: null,
      navigatingSpawn: spawns.length > 0 ? spawns[0] : null,
      dMin: dMin === Infinity ? 999 : dMin,
      closestMob,
      pursuers: pursuers.map(p => p.mob),
      pursuerCount: pursuers.length,
      spawnCenter: null,
      isBoss: false
    };
  }

  let lastAtkTime = 0;
  let localCastUntil = 0;

  function executeOracleAttack(target, now, distToTarget, dMin, closestMob, pursuerCount, isEmergencyBreakout, isPvP) {
    if (!target || (target.st & 1) || target.hp <= 0) return;
    const me = window.GAME?.me;
    if (!me) return;

    const allowedSkills = new Set(window.GAME?.self?.loadout || []);

    const dx = target.x - me.x, dy = target.y - me.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = Math.round((dx / len) * 100) / 100;
    const ny = Math.round((dy / len) * 100) / 100;

    me.facing = dx >= 0 ? 1 : -1;
    window.GAME.net.send({ t: 'tg', id: target.id });

    // Tính toán an toàn thi triển chiêu có cast time
    const closestDef = getMobDef(closestMob);
    const closestSpeed = closestDef?.speed || 130;
    const closestAtkRange = (closestDef?.range || 64) + (closestDef?.r || 28) + 15;
    const distToAtkRange = Math.max(0, dMin - closestAtkRange);
    const timeToImpactMs = (distToAtkRange / closestSpeed) * 1000;

    const nextAllowedSwing = mobSwingCooldowns.get(closestMob?.id) || 0;
    const isClosestMobOnSwingCd = now < nextAllowedSwing;
    const swingCdRemainingMs = Math.max(0, nextAllowedSwing - now);

    const isSafeForCastTime = isPvP ? (distToTarget >= 160 || isEmergencyBreakout) : ((timeToImpactMs >= cfg.castGateMinImpactTime) || (isClosestMobOnSwingCd && swingCdRemainingMs >= 400));
    const isBoss = !!(getMobDef(target)?.boss || getMobDef(target)?.elite || target.kind === 'chantinh' || target.kind === 'daibang');

    // SKILL 4 [ẨN 1]: THỦY KÍNH (Buff 60% giáp + hồi phục)
    // Trong PvP: Bật NGAY khi đối thủ trong tầm 320px để buff giáp và hồi máu liên tục!
    if (allowedSkills.has('ad_thuykinh') && now - skillTimers.ad_thuykinh >= 20050 && (distToTarget <= 320 || dMin <= 240 || isEmergencyBreakout || isPvP)) {
      window.GAME.net.send({ t: 'sk', s: 'ad_thuykinh', id: 0, x: 0, y: 0 });
      skillTimers.ad_thuykinh = now;
      devState.totalSkills++;
      devState.skillsBreakdown.thuykinh++;
    }

    if (now < localCastUntil) return;

    // SKILL 5 [ẨN 2]: THIÊN LÔI GIÁNG THẾ (460% AOE + CHOÁNG 0.8s)
    // Trong PvP: Chiêu sốc sát thương và khống chế ngắt chiêu tối thượng!
    const shouldCastThienLoi = isPvP ? (distToTarget <= 320 && isSafeForCastTime) : ((isBoss || pursuerCount >= 2 || isEmergencyBreakout) && distToTarget <= 320 && (isSafeForCastTime || isEmergencyBreakout));
    if (allowedSkills.has('ad_thienloi') && now - skillTimers.ad_thienloi >= 45050 && shouldCastThienLoi) {
      window.GAME.net.send({ t: 'sk', s: 'ad_thienloi', id: target.id, x: nx, y: ny });
      skillTimers.ad_thienloi = now;
      localCastUntil = now + 700;
      devState.totalSkills++;
      devState.skillsBreakdown.thienloi++;
      return;
    }

    // SKILL 3: NGŨ HÀNH LUÂN CHUYỂN (AOE 312% + CHOÁNG 1.2s)
    // Trong PvP: Vũ khí phòng thủ khống chế số 1 chống cận chiến khi đối thủ áp sát <= 210px!
    const shouldCastNguHanh = isPvP ? (distToTarget <= 210 || isEmergencyBreakout) : (distToTarget <= 220 || isEmergencyBreakout || dMin <= 100);
    if (allowedSkills.has('ad_nguhanh') && now - skillTimers.ad_nguhanh >= 20050 && shouldCastNguHanh) {
      window.GAME.net.send({ t: 'sk', s: 'ad_nguhanh', id: target.id, x: nx, y: ny });
      skillTimers.ad_nguhanh = now;
      localCastUntil = now + 600;
      devState.totalSkills++;
      devState.skillsBreakdown.nguhanh++;
      return;
    }

    // SKILL 1: LÔI PHÙ (TỨC THỜI 0ms, 2.0s CD, 252% DAMAGE) -> Spam liên tục trong PvP & PvE
    if (allowedSkills.has('ad_loiphu') && now - skillTimers.ad_loiphu >= 2050 && distToTarget <= 320) {
      window.GAME.net.send({ t: 'sk', s: 'ad_loiphu', id: target.id, x: nx, y: ny });
      skillTimers.ad_loiphu = now;
      devState.totalSkills++;
      devState.skillsBreakdown.loiphu++;
    }

    // SKILL 2: HỎA LONG TRẬN (CD 7.0s, AOE 228%)
    if (allowedSkills.has('ad_hoalong') && now - skillTimers.ad_hoalong >= 7100 && distToTarget <= 300 && isSafeForCastTime) {
      window.GAME.net.send({ t: 'sk', s: 'ad_hoalong', id: target.id, x: nx, y: ny });
      skillTimers.ad_hoalong = now;
      localCastUntil = now + 400;
      devState.totalSkills++;
      devState.skillsBreakdown.hoalong++;
      return;
    }

    // ĐÒN ĐÁNH THƯỜNG
    const atkCd = 380;
    if (now - lastAtkTime >= atkCd && distToTarget <= maxRange) {
      window.GAME.net.send({ t: 'atk', id: target.id, x: nx, y: ny });
      lastAtkTime = now;
      devState.totalAttacks++;
    }
  }

  // =========================================================================
  // BỘ TIỆN ÍCH KÉO THẢ MƯỢT MÀ (UNIVERSAL DRAGGABLE COMPONENT)
  // =========================================================================
  function makeDraggable(element, handle, storageKey) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    // Khôi phục vị trí đã lưu nếu có
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
          const maxX = Math.max(0, window.innerWidth - (element.offsetWidth || 280));
          const maxY = Math.max(0, window.innerHeight - (element.offsetHeight || 60));
          element.style.left = Math.min(maxX, Math.max(0, saved.x)) + 'px';
          element.style.top = Math.min(maxY, Math.max(0, saved.y)) + 'px';
          element.style.right = 'auto';
          element.style.bottom = 'auto';
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
  const botPanel = document.createElement('div');
  botPanel.id = 'ancient-master-bot-v13';
  botPanel.innerHTML = `
    <div style="position: fixed; top: 75px; right: 15px; width: 330px; background: rgba(14, 18, 26, 0.92);
                border: 1.5px solid #00e676; border-radius: 9px; color: #e6dfd3; font-family: 'Segoe UI', Tahoma, sans-serif;
                font-size: 11.5px; z-index: 999999; box-shadow: 0 8px 32px rgba(0,0,0,0.85); backdrop-filter: blur(10px);
                transition: transform 0.15s ease, opacity 0.15s ease;">
      <!-- Header Drag Handle -->
      <div id="sm-header" style="background: linear-gradient(90deg, #1b5e20, #2e7d32); padding: 6px 10px;
                  cursor: grab; font-weight: bold; color: #fff; display: flex; justify-content: space-between;
                  align-items: center; border-top-left-radius: 7px; border-top-right-radius: 7px; user-select: none;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>🔮 BOT v13.7 (PVP SOLO & SKILL SPACING CORE)</span>
        </div>
        <div style="display: flex; gap: 5px; align-items: center;">
          <button id="sm-btn-min" title="Thu gọn giao diện" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #fff; border-radius: 3px; cursor: pointer; width: 20px; height: 18px; font-size: 11px; line-height: 1; display: flex; align-items: center; justify-content: center;">—</button>
          <button id="sm-btn-close" title="Tắt bot" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 1; padding: 0 3px;">✕</button>
        </div>
      </div>

      <!-- Main Body -->
      <div id="sm-body" style="padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
        <button id="sm-btn-toggle" style="background: #2e7d32; border: 1px solid #4caf50; color: #fff;
                    font-weight: bold; padding: 5px; border-radius: 4px; cursor: pointer; font-size: 11.5px;">
          🟢 ĐANG HOẠT ĐỘNG
        </button>

        <!-- Status Card -->
        <div style="background: rgba(24,30,42,0.85); border: 1px solid #37474f; padding: 6px 8px; border-radius: 5px; font-size: 11px; display: flex; flex-direction: column; gap: 2px;">
          <div style="color: #ffd76a;">Trạng thái: <b id="sm-st-txt">Khởi tạo...</b></div>
          <div style="color: #4fc3f7;">Mục tiêu: <b id="sm-target-txt">None</b></div>
          <div style="color: #ff8a80;">Cự ly d_min: <b id="sm-dmin-txt">0px</b> | Quái bám: <b id="sm-pursuers-txt">0</b></div>
          <div style="color: #ce93d8;">📡 Đo gói tin: <b id="sm-measured-atk">Đang theo dõi...</b></div>
          <div style="color: #81c784;">🎁 Đã nhặt: <b id="sm-s-loot">0 món</b></div>
        </div>

        <!-- Loadout Switcher -->
        <div style="background: rgba(18,32,45,0.85); border: 1px solid #00b0ff; padding: 6px 8px; border-radius: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: bold; color: #80d8ff; font-size: 11px;">🎯 ĐỔI BUILD KỸ NĂNG:</span>
            <button id="sm-btn-open-chat" style="background: #3e2723; border: 1px solid #ffb300; color: #ffd76a; border-radius: 3px; font-size: 10px; padding: 2px 7px; cursor: pointer; font-weight: bold;">💬 Khung Chat</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr; gap: 3px;">
            <button id="sm-b-dual-hidden" style="background: #004d40; border: 1px solid #00bfa5; color: #a7ffeb; padding: 3px; border-radius: 3px; cursor: pointer; font-size: 10px; font-weight: bold;">
              👑 Song Ẩn: [Lôi Phù + Thủy Kính (Ẩn) + Thiên Lôi (Ẩn)]
            </button>
            <button id="sm-b-burst-stun" style="background: #1a237e; border: 1px solid #3d5afe; color: #8c9eff; padding: 3px; border-radius: 3px; cursor: pointer; font-size: 10px; font-weight: bold;">
              ⚡ Khống Chế Sốc Dmg: [Lôi Phù + Thiên Lôi + Ngũ Hành]
            </button>
            <button id="sm-b-aoe-farm" style="background: #b71c1c; border: 1px solid #ff5252; color: #ff8a80; padding: 3px; border-radius: 3px; cursor: pointer; font-size: 10px; font-weight: bold;">
              🔥 Càn Quét Bãi: [Lôi Phù + Hỏa Long + Thiên Lôi]
            </button>
          </div>
          <div id="sm-loadout-cur" style="color: #ffd54f; font-size: 9.5px; margin-top: 3px;">Ô đang trang bị: Đang nạp...</div>
        </div>

        <!-- Collapsible Details: Stats -->
        <details style="background: rgba(20,25,35,0.85); border: 1px solid #3d5afe; border-radius: 5px; padding: 4px 6px;">
          <summary style="font-weight: bold; color: #82b1ff; font-size: 10.5px; cursor: pointer; user-select: none;">⚡ Bảng Thống Kê Chiêu Thức</summary>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 10px; margin-top: 4px;">
            <div>⚡ Lôi Phù (2s): <b id="sm-sk-loiphu" style="color: #ffd54f;">0</b></div>
            <div>🔥 Hỏa Long (7s): <b id="sm-sk-hoalong" style="color: #ff7043;">0</b></div>
            <div>🌀 Ngũ Hành (20s): <b id="sm-sk-nguhanh" style="color: #ab47bc;">0</b></div>
            <div>🛡️ Thủy Kính [Ẩn]: <b id="sm-sk-thuykinh" style="color: #29b6f6;">0</b></div>
            <div style="grid-column: span 2;">⚡⚡ Thiên Lôi [Ẩn]: <b id="sm-sk-thienloi" style="color: #ffff00;">0</b></div>
          </div>
        </details>

        <!-- Collapsible Details: Mob Select -->
        <details open style="background: rgba(40,30,20,0.85); border: 1px solid #7c6145; border-radius: 5px; padding: 4px 6px;">
          <summary style="font-weight: bold; color: #ffd76a; font-size: 10.5px; cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center;">
            <span>🎯 CHỌN QUÁI CẦN ĐÁNH</span>
          </summary>
          <div style="display: flex; gap: 4px; margin-top: 4px;">
            <select id="sm-mob-sel" style="flex: 1; background: #1a120b; color: #6fdc6f; border: 1px solid #5a4530; padding: 3px 5px; border-radius: 4px; font-size: 10.5px; cursor: pointer;">
              <option value="all">🌟 Tự động (Mọi quái trong khu vực)</option>
            </select>
            <button id="sm-btn-refresh-mobs" style="background: #2a522a; border: 1px solid #4caf50; color: #a5d6a7; border-radius: 3px; font-size: 10px; cursor: pointer; padding: 2px 6px; font-weight: bold;">🔄 Quét</button>
          </div>
        </details>

        <!-- Telemetry Counters -->
        <div style="display: flex; justify-content: space-between; font-size: 9.5px; color: #a5d6a7; border-top: 1px solid #37474f; padding-top: 3px;">
          <span>Đòn đánh: <b id="sm-s-atk" style="color: #ffd54f;">0</b></span>
          <span>Phá vây: <b id="sm-s-breakout" style="color: #ff9100;">0</b></span>
          <span>Né vung: <b id="sm-s-dodge" style="color: #81c784;">0</b></span>
          <span>Giữ Leash: <b id="sm-s-leash" style="color: #ff5252;">0</b></span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(botPanel);

  // Mini Badge Floating Button (khi thu gọn bot panel)
  const botMiniBadge = document.createElement('div');
  botMiniBadge.id = 'sm-mini-badge';
  botMiniBadge.innerHTML = `
    <div style="position: fixed; top: 15px; right: 15px; background: rgba(14, 20, 28, 0.9); border: 1.5px solid #00e676;
                border-radius: 20px; padding: 4px 12px; color: #fff; font-family: 'Segoe UI', Tahoma, sans-serif;
                font-size: 11px; z-index: 999999; box-shadow: 0 4px 16px rgba(0,0,0,0.6); backdrop-filter: blur(8px);
                display: none; align-items: center; gap: 8px; cursor: grab; user-select: none;">
      <span id="sm-mini-status">🟢 Bot v13.7</span>
      <span style="color: #ffd76a;">⚔️ <b id="sm-mini-atk">0</b></span>
      <span style="color: #ff8a80;">🛡️ <b id="sm-mini-breakout">0</b></span>
      <span id="sm-mini-state" style="color: #80d8ff; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Khởi tạo...</span>
      <button id="sm-mini-btn-expand" title="Mở rộng giao diện" style="background: #2e7d32; border: 1px solid #4caf50; color: #fff; border-radius: 10px; padding: 2px 8px; font-size: 10px; font-weight: bold; cursor: pointer;">📂 Mở</button>
    </div>
  `;
  document.body.appendChild(botMiniBadge);

  const botPanelEl = botPanel.firstElementChild;
  const botMiniEl = botMiniBadge.firstElementChild;
  makeDraggable(botPanelEl, botPanel.querySelector('#sm-header'), 'ancient_bot_panel_pos');
  makeDraggable(botMiniEl, botMiniEl, 'ancient_bot_mini_pos');

  // Toggle thu gọn bot panel
  const btnMinBot = botPanel.querySelector('#sm-btn-min');
  const btnExpandBot = botMiniBadge.querySelector('#sm-mini-btn-expand');
  btnMinBot.onclick = () => {
    botPanelEl.style.display = 'none';
    botMiniEl.style.display = 'flex';
  };
  btnExpandBot.onclick = () => {
    botMiniEl.style.display = 'none';
    botPanelEl.style.display = 'block';
  };

  // =========================================================================
  // 2. KHUNG CHAT KÉO THẢ GỌN NHẸ DỄ NHÌN (FLOATING DRAGGABLE CHAT)
  // =========================================================================
  const floatingChat = document.createElement('div');
  floatingChat.id = 'ancient-floating-chat';
  floatingChat.innerHTML = `
    <div style="position: fixed; left: 15px; bottom: 85px; width: 360px; background: rgba(14, 18, 26, 0.88);
                border: 1px solid rgba(255, 215, 106, 0.45); border-radius: 9px; box-shadow: 0 8px 30px rgba(0,0,0,0.75);
                backdrop-filter: blur(10px); z-index: 999998; font-family: 'Segoe UI', Tahoma, sans-serif;
                font-size: 11.5px; display: flex; flex-direction: column; overflow: hidden;
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
  function openChat() {
    chatBubbleEl.style.display = 'none';
    floatingChatEl.style.display = 'flex';
    unreadChatCount = 0;
    bubbleBadge.style.display = 'none';
    afcMessages.scrollTop = afcMessages.scrollHeight;
  }

  btnMinChat.onclick = minimizeChat;
  btnCloseChat.onclick = minimizeChat;
  chatBubbleEl.onclick = openChat;
  botPanel.querySelector('#sm-btn-open-chat').onclick = openChat;

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
    const activeMobs = Array.from(window.GAME?.mobs?.values() || []).filter(m => !(m.st & 1));
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

    if (added.has(curVal)) mobSel.value = curVal;
  }

  populateMobSelect();
  mobSel.onchange = e => cfg.targetMob = e.target.value;
  botPanel.querySelector('#sm-btn-refresh-mobs').onclick = populateMobSelect;

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

  let lastZoneId = null;
  let lastPickTime = 0;
  const mainLoop = setInterval(() => {
    if (!cfg.enabled || !window.GAME?.me || !window.GAME?.net) return;
    const me = window.GAME.me, now = performance.now();

    const zone = window.GAME?.world?.zone;
    if (zone && zone.id !== lastZoneId) {
      lastZoneId = zone.id;
      populateMobSelect();
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
      const isSafe = !window.GAME?.mobs || Array.from(window.GAME.mobs.values()).every(m => (m.st & 1) || Math.hypot(m.x - me.x, m.y - me.y) > 280);
      if (isSafe) {
        applySkillLoadout(...pendingLoadout);
        pendingLoadout = null;
      }
    }

    const vitals = getPlayerHp();
    if (cfg.autoPotion && vitals.hp > 0 && (vitals.hp / vitals.maxHp) < 0.65) {
      if (window.GAME?.ui?.quickUse) window.GAME.ui.quickUse('heal');
    }
    const currentMp = window.GAME?.self?.mp || 500;
    if (cfg.autoPotion && currentMp < 150) {
      if (window.GAME?.ui?.quickUse) window.GAME.ui.quickUse('mana');
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

    // 1. Né chiêu đỏ telegraph
    for (let i = activeTelegraphs.length - 1; i >= 0; i--) {
      if (now > activeTelegraphs[i].expiresAt) activeTelegraphs.splice(i, 1);
    }
    const dangerTele = activeTelegraphs.find(t => Math.hypot(t.x - me.x, t.y - me.y) < t.r + 25);
    if (dangerTele) {
      movementState = 'RETREAT';
      const angle = Math.atan2(me.y - dangerTele.y, me.x - dangerTele.x);
      setSteeringVector(Math.cos(angle), Math.sin(angle));
      if (statusTxt) statusTxt.textContent = `⚠️ NÉ CHIÊU ĐỎ CỦA BOSS!`;
      return;
    }

    const state = resolveTargetAndState(me);
    if (dminTxt) dminTxt.textContent = `${Math.round(state.dMin)}px`;
    if (pursuersTxt) pursuersTxt.textContent = `${state.pursuerCount} con`;

    // ==========================================
    // 2. PHÁT HIỆN BỊ VÂY ÉP / KẸT VÀO VẬT CẢN (EMERGENCY BREAKOUT)
    // ==========================================
    const isPinnedAgainstWall = (state.dMin <= 78 && state.pursuerCount >= 2);
    
    // Theo dõi kẹt bước chân
    if (now - lastPosCheck.t > 300) {
      const movedDist = Math.hypot(me.x - lastPosCheck.x, me.y - lastPosCheck.y);
      if (movementState !== 'STAND' && movedDist < 12 && state.pursuerCount > 0) {
        isCurrentlyStuck = true;
        devState.breakoutsTriggered++;
        // Bẻ lái vuông góc 90 độ tìm lối thoát
        stuckUntil = now + 450;
      } else {
        isCurrentlyStuck = false;
      }
      lastPosCheck = { x: me.x, y: me.y, t: now };
    }

    const snaps = window.GAME.net?.snaps;
    const latest = snaps?.[snaps.length - 1];
    const currentDrops = latest?.d || capturedDrops || [];

    // 3. Nhặt đồ độc lập: CHỈ KHI QUÁI ĐÃ CHẾT VÀ AN TOÀN
    if (cfg.autoLoot && (!state.target || state.dMin >= 200) && currentDrops.length > 0) {
      const validDrops = currentDrops.map(d => ({
        id: d[0], item: d[1], x: d[2], y: d[3], r: d[4], mine: d[6],
        dist: Math.hypot(d[2] - me.x, d[3] - me.y)
      })).filter(d => d.dist <= cfg.lootRadius);

      if (validDrops.length > 0) {
        movementState = 'STAND';
        validDrops.sort((a, b) => (a.mine !== b.mine ? (b.mine ? 1 : -1) : a.dist - b.dist));
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
      return;
    }

    const targetMob = state.target;
    if (!targetMob) {
      movementState = 'STAND';
      stopMoving();
      if (statusTxt) statusTxt.textContent = "Đang quét tìm quái...";
      if (targetTxt) targetTxt.textContent = "None";
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

    let retreatTrigger, retreatSafe, approachTrigger, approachStop;
    if (state.isPvP) {
      if (state.isMeleeOpponent) {
        // Cận chiến (Thiên Vương, Long Tuyền): Giữ cự ly vàng 240px - 280px, né tầm húc và chém
        retreatTrigger = 220;
        retreatSafe = 265;
        approachTrigger = 310;
        approachStop = 250;
      } else if (state.isRangedOpponent) {
        // Xạ thủ tầm xa (Sơn Thần, Linh Mộc): Giữ 260px - 290px
        retreatTrigger = 230;
        retreatSafe = 280;
        approachTrigger = 320;
        approachStop = 260;
      } else {
        // Pháp sư Âm Dương
        retreatTrigger = 220;
        retreatSafe = 270;
        approachTrigger = 310;
        approachStop = 255;
      }
    } else {
      retreatTrigger = state.isBoss ? cfg.retreatTriggerDistBoss : cfg.retreatTriggerDistMob;
      retreatSafe = state.isBoss ? cfg.retreatSafeDistBoss : cfg.retreatSafeDistMob;
      approachTrigger = state.isBoss ? cfg.approachTriggerDistBoss : cfg.approachTriggerDistMob;
      approachStop = state.isBoss ? cfg.approachStopDistBoss : cfg.approachStopDistMob;
    }
            
    // Phá vây khẩn cấp nếu bị ép sát vách đá
    if (isPinnedAgainstWall || (isCurrentlyStuck && now < stuckUntil)) {
      movementState = 'RETREAT';
      // Dò tia có độ dài di chuyển tối đa trong 16 hướng ra khoảng trống
      const kiteVec = computeCongaKiteVector(me, state.pursuers, state.spawnCenter, state.isBoss);
      setSteeringVector(kiteVec.vx, kiteVec.vy);
      if (miniStatusEl) miniStatusEl.textContent = cfg.enabled ? '🟢 Bot v13.7' : '🔴 Tạm dừng';
    if (miniAtkEl) miniAtkEl.textContent = devState.totalAttacks;
    if (miniBreakoutEl) miniBreakoutEl.textContent = devState.breakoutsTriggered;
    if (miniStateEl && statusTxt) miniStateEl.textContent = statusTxt.textContent;

    if (statusTxt) {
        statusTxt.textContent = `🚨 PHÁ VÂY KHẨN CẤP: Bẻ lái trượt qua khe quái ra khoảng trống!`;
      }
    } else {
      // Hysteresis Latch chuẩn v13
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
              : `🏃 LÙI MƯỢT & TRÁNH VẬT CẢN (${Math.round(state.dMin)}px -> ${retreatSafe}px)`;
          }
        }
      } else if (movementState === 'APPROACH') {
        const steer = calculateDirectSteering(me, targetMob.x, targetMob.y);
        setSteeringVector(steer.dx, steer.dy);
        if (statusTxt) {
          statusTxt.textContent = state.isPvP ? `⚡ TIẾP CẬN SOLO: ${targetMob.name} (${Math.round(distToTarget)}px)` : `⚡ TIẾP CẬN BẮN TỈA: ${mobName} (${Math.round(distToTarget)}px)`;
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
            statusTxt.textContent = `🔥 TRỤ CHÂN BẮN TỈA (${Math.round(state.dMin)}px): XẢ FULL SKILL!`;
          }
        }
      }
    }

    // Xả kỹ năng: Khi bị vây khẩn cấp, kích hoạt Choáng diện rộng ngay lập tức!
    executeOracleAttack(targetMob, now, distToTarget, state.dMin, state.closestMob, state.pursuerCount, isPinnedAgainstWall, state.isPvP);

  }, 60);


  window._ancientMasterBot = {
    version: '13.7',
    cfg,
    devState,
    skillTimers,
    populateMobSelect,
    applySkillLoadout,
    openChat,
    minimizeChat,
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
      console.log("%c[BOT v13.7] Đã gỡ bỏ toàn bộ giao diện và tiến trình.", "color: #ff9800; font-weight: bold;");
    }
  };

  console.log("%c[BOT v13.7] KHỞI ĐỘNG THÀNH CÔNG: RETALIATION, ROADBLOCK CLEAR & SLEEK DRAGGABLE UI!", "color: #00e676; font-size: 14px; font-weight: bold;");

  }

  // Khởi động chờ game sẵn sàng
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    waitForGameReady();
  } else {
    window.addEventListener('DOMContentLoaded', waitForGameReady);
  }
})();
