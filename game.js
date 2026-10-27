// Download Surfer - original endless runner game (canvas, 3 lanes)
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const LANES = [W * 0.25, W * 0.5, W * 0.75];

  let state = "waiting"; // waiting | running | dead
  let targetLane = 1, lane = 1, laneX = LANES[1];
  let y = 0, vy = 0, jumping = false, ducking = false;
  let speed = 6, dist = 0, coins = 0, best = 0;
  let obstacles = [], pickups = [];
  let spawnTimer = 0, pickupTimer = 0;
  let downloadPct = 0;

  try { best = Number(localStorage.getItem("ds_best") || 0); } catch (e) {}
  document.getElementById("best").textContent = best ? "Best: " + best : "";

  const overlay = document.getElementById("overlay");

  function reset() {
    targetLane = lane = 1; laneX = LANES[1];
    y = 0; vy = 0; jumping = false; ducking = false;
    speed = 6; dist = 0; coins = 0;
    obstacles = []; pickups = [];
    spawnTimer = 0; pickupTimer = 0;
    state = "running";
    overlay.classList.add("hidden");
  }

  function overlayScreen(title, lines) {
    overlay.innerHTML =
      '<div style="font-size:26px;font-weight:700">' + title + "</div>" +
      lines.map((l) => "<div>" + l + "</div>").join("");
    overlay.classList.remove("hidden");
  }

  function die(msg) {
    state = "dead";
    if (dist > best) {
      best = Math.floor(dist);
      try { localStorage.setItem("ds_best", best); } catch (e) {}
    }
    overlayScreen("WASTED", [
      "Score: <b>" + Math.floor(dist) + "</b> &nbsp; Coins: <b>" + coins + "</b>",
      "Best: <b>" + best + "</b>",
      msg ? '<div class="hint">' + msg + "</div>" : "",
      '<div class="hint">Press any key / tap to run again</div>'
    ]);
  }

  // input
  function input(dir) {
    if (state !== "running") { reset(); return; }
    if (dir === "left" && targetLane > 0) targetLane--;
    if (dir === "right" && targetLane < 2) targetLane++;
    if (dir === "up" && !jumping) { jumping = true; vy = -14; ducking = false; }
    if (dir === "down") { ducking = true; setTimeout(() => { ducking = false; }, 600); }
  }
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["arrowleft", "a"].includes(k)) input("left");
    else if (["arrowright", "d"].includes(k)) input("right");
    else if (["arrowup", "w"].includes(k)) input("up");
    else if (["arrowdown", "s"].includes(k)) input("down");
    else input("none");
  });
  let touchX = null, touchY = null;
  canvas.addEventListener("touchstart", (e) => {
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  });
  canvas.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > Math.abs(dy)) input(dx > 0 ? "right" : "left");
    else input(dy > 0 ? "down" : "up");
  });

  // download progress messages from background
  browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === "download-progress") {
      const dls = msg.downloads || [];
      document.getElementById("dlCount").textContent = dls.length;
      if (dls.length) {
        const d = dls[dls.length - 1];
        downloadPct = d.total > 0 ? Math.round((d.bytes / d.total) * 100) : 0;
        document.getElementById("dlPct").textContent =
          (d.filename ? d.filename + " \u2014 " : "") + downloadPct + "%";
        document.getElementById("progressBar").style.width = downloadPct + "%";
        if (state === "waiting") reset();
      }
    }
    if (msg.type === "download-done") {
      if (state === "running") die("Download finished. Go touch grass.");
    }
  });

  function spawnObstacle() {
    obstacles.push({
      lane: Math.floor(Math.random() * 3),
      kind: Math.random() < 0.7 ? "block" : "bar",
      z: 0
    });
  }
  function spawnCoin() {
    pickups.push({ lane: Math.floor(Math.random() * 3), z: 0 });
  }

  function update() {
    if (state !== "running") return;
    dist += speed / 10;
    speed = 6 + dist / 400;

    laneX += (LANES[targetLane] - laneX) * 0.25;
    lane = targetLane;

    if (jumping) {
      vy += 0.8; y += vy;
      if (y >= 0) { y = 0; vy = 0; jumping = false; }
    }

    const dz = speed;
    obstacles.forEach((o => { o.z += dz; });
    pickups.forEach((p) => { p.z += dz; });

    spawnTimer -= dz;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 90 + Math.random() * 120;
    }
    pickupTimer -= dz;
    if (pickupTimer <= 0) {
      spawnCoin();
      pickupTimer = 50 + Math.random() * 80;
    }

    for (const o of obstacles) {
      if (o.lane !== lane) continue;
      if (o.z < 40 || o.z > 80) continue;
      if (o.kind === "block") {
        if (!jumping || y < 20) { die(); return; }
      } else {
        // overhead bar: must be ducking (and not jumping)
        if (jumping || !ducking) { die(); return; }
      }
    }
    pickups = pickups.filter((p) => {
      if (p.lane === lane && p.z > 35 && p.z < 85 && y < 30) {
        coins++;
        return false;
      }
      return p.z < 130;
    });
    obstacles = obstacles.filter((o) => o.z < 130);
  }

  // --------- render ----------
  function project(z) {
    return 90 / (z + 40);
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1a1a4e");
    sky.addColorStop(1, "#33d2a63");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const horizon = 140;

    ctx.fillStyle = "#222244";
    ctx.beginPath();
    ctx.moveTo(W / 2 - 20, horizon);
    ctx.lineTo(W / 2 + 20, horizon);
    ctx.lineTo(W + 60, H);
    ctx.lineTo(-60, H);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#565684";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; iK++) {
      const x = LANES[i] + (i < 2 ? 55 : -55);
      ctx.beginPath();
      ctx.moveTo(W / 2 + (x - W / 2) * 0.1, horizon);
      ctx.lineTo(x + (x - W / 2) * 0.8, H);
      ctx.stroke();
    }
    const scroll = (dist * 3) %  80;
    for (let z = scroll; z < 500; z += 80) {
      const s = project(z);
      const yy = horizon + (H - horizon) * (1 - s);
      if (yy > horizon && yy < H + 10) {
        ctx.globalAlpha = Math.min(0.5, s);
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(W, yy);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    const items = [
      ...obstacles.map((o) => Object.assign({}, o, { type: "ob" })),
      ...pickups.map((p) => Object.assign({}, p, { type: "coin" }))
    ].sort((a, b) => b.z - a.z);

    for (const it of items) {
      const s = project(it.z);
      const yy = horizon + (H - horizon) * (1 - s);
      const bx = W / 2 + (LANES[it.lane] - W / 2) * (0.1 + 0.9 * (1 - s));
      const size = 60 * s;
      if (it.type === "ob") {
        if (it.kind === "block") {
          ctx.fillStyle = "#ff5f7e";
          ctx.fillRect(bx - size / 2, yy - size, size, size);
          ctx.fillStyle = "#c23a56";
          ctx.fillRect(bx - size / 2, yy - size * 0.2, size, size * 0.2);
        } else {
          ctx.fillStyle = "#ffb35f";
          ctx.fillRect(bx - size / 2, yy - size * 2.2, size, size * 0.5);
        }
      } else {
        ctx.fillStyle = "#ffd94a";
        ctx.beginPath();
        ctx.arc(bx, yy - size * 0.6, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const px = laneX;
    const py = H - 80 + y;
    const ph = ducking ? 22 : 40;
    ctx.fillStyle = "#7cf5ff";
    ctx.fillRect(px - 14, py - ph, 28, ph);
    ctx.fillStyle = "#fff";
    ctx.fillRect(px - 8, py - ph + 6, 6, 6);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("Score: " + Math.floor(dist), 12, 30);
    ctx.fillText("Coins: " + coins, 12, 54);
    ctx.fillText("Speed: " + speed.toFixed(1), W - 110, 30);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();

  browser.runtime.sendMessage({ type: "check-now" });
})();
