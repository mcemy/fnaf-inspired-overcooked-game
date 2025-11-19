import kaplay from "kaplay";

// ==================== MOBILE DETECTION & CONTROLS ====================
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

let mobileInput = {
  x: 0,
  y: 0,
  action: false,
};

if (isMobile) {
  // Show mobile controls
  const mobileControls = document.getElementById("mobileControls");
  if (mobileControls) mobileControls.classList.add("active");

  // Joystick
  const joystick = document.getElementById("joystick");
  const joystickStick = document.getElementById("joystickStick");
  let joystickActive = false;
  let joystickCenter = { x: 0, y: 0 };

  function handleJoystickStart(e) {
    e.preventDefault();
    joystickActive = true;
    const rect = joystick.getBoundingClientRect();
    joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function handleJoystickMove(e) {
    if (!joystickActive) return;
    e.preventDefault();

    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - joystickCenter.x;
    const dy = touch.clientY - joystickCenter.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 30;

    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      mobileInput.x = Math.cos(angle);
      mobileInput.y = Math.sin(angle);

      joystickStick.style.left = `${30 + Math.cos(angle) * maxDistance}px`;
      joystickStick.style.top = `${30 + Math.sin(angle) * maxDistance}px`;
    } else {
      mobileInput.x = dx / maxDistance;
      mobileInput.y = dy / maxDistance;

      joystickStick.style.left = `${30 + dx}px`;
      joystickStick.style.top = `${30 + dy}px`;
    }
  }

  function handleJoystickEnd(e) {
    e.preventDefault();
    joystickActive = false;
    mobileInput.x = 0;
    mobileInput.y = 0;
    joystickStick.style.left = "30px";
    joystickStick.style.top = "30px";
  }

  joystick.addEventListener("touchstart", handleJoystickStart, {
    passive: false,
  });
  joystick.addEventListener("touchmove", handleJoystickMove, {
    passive: false,
  });
  joystick.addEventListener("touchend", handleJoystickEnd, { passive: false });
  joystick.addEventListener("mousedown", handleJoystickStart);
  document.addEventListener("mousemove", handleJoystickMove);
  document.addEventListener("mouseup", handleJoystickEnd);

  // Action Button
  const actionButton = document.getElementById("actionButton");
  let actionCooldown = false;

  function handleActionPress(e) {
    e.preventDefault();
    if (actionCooldown) return;

    mobileInput.action = true;
    actionCooldown = true;

    setTimeout(() => {
      actionCooldown = false;
    }, 200);
  }

  actionButton.addEventListener("touchstart", handleActionPress, {
    passive: false,
  });
  actionButton.addEventListener("mousedown", handleActionPress);
}

// Remove loading indicator
window.addEventListener("load", () => {
  const loading = document.querySelector(".loading");
  if (loading) loading.remove();
});

// ==================== KAPLAY INIT ====================
const k = kaplay({
  width: isMobile ? Math.min(window.innerWidth, 800) : 800,
  height: isMobile ? Math.min(window.innerHeight, 600) : 600,
  background: [29, 29, 68],
  letterbox: !isMobile,
  stretch: isMobile,
  global: false,
});

// ==================== MENU SCENE ====================
k.scene("menu", () => {
  k.add([
    k.text("🍕 FNAF PIZZA KITCHEN 🐻", { size: isMobile ? 24 : 32 }),
    k.pos(k.center().x, isMobile ? 60 : 80),
    k.anchor("center"),
    k.color(255, 165, 0),
  ]);

  k.add([
    k.text("Estilo Overcooked!", { size: isMobile ? 16 : 20 }),
    k.pos(k.center().x, isMobile ? 95 : 130),
    k.anchor("center"),
  ]);

  const instructions = [
    "",
    "COMO JOGAR:",
    "",
    isMobile ? "🕹️ Joystick - Mover" : "WASD - Mover Freddy",
    isMobile ? "⚡ Botão Verde - Ação" : "ESPAÇO - Pegar/Usar estação",
    "",
    "1. Vá até a massa 📦",
    "2. Vá até o molho 🍅",
    "3. Vá até o queijo 🧀",
    "4. Cozinhe no forno 🔥",
    "5. Entregue 🍽️",
    "",
    isMobile ? "Toque para começar" : "Pressione ESPAÇO",
  ];

  instructions.forEach((line, i) => {
    k.add([
      k.text(line, { size: isMobile ? 11 : 13 }),
      k.pos(k.center().x, (isMobile ? 130 : 170) + i * (isMobile ? 18 : 20)),
      k.anchor("center"),
    ]);
  });

  const startText = k.add([
    k.text(isMobile ? ">>> TOQUE AQUI <<<" : ">>> PRESSIONE ESPAÇO <<<", {
      size: isMobile ? 18 : 20,
    }),
    k.pos(k.center().x, k.height() - (isMobile ? 50 : 50)),
    k.anchor("center"),
    k.color(255, 165, 0),
    k.opacity(1),
  ]);

  k.loop(0.5, () => {
    startText.opacity = startText.opacity === 1 ? 0.3 : 1;
  });

  k.onKeyPress("space", () => k.go("game"));
  k.onClick(() => k.go("game"));

  if (isMobile) {
    k.onTouchStart(() => k.go("game"));
  }
});

// ==================== GAME SCENE ====================
k.scene("game", () => {
  // Background
  k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(58, 58, 82),
    k.z(0),
  ]);

  // Counter
  k.add([
    k.rect(k.width() - (isMobile ? 50 : 100), 10),
    k.pos(isMobile ? 25 : 50, isMobile ? 200 : 250),
    k.color(139, 69, 19),
  ]);

  // ==================== STATIONS ====================
  const stationSize = isMobile ? 60 : 80;
  const iconSize = isMobile ? 28 : 36;

  const stations = [
    {
      x: isMobile ? 80 : 100,
      y: 120,
      type: "dough",
      icon: "📦",
      name: "Massa",
    },
    {
      x: isMobile ? 180 : 220,
      y: 120,
      type: "sauce",
      icon: "🍅",
      name: "Molho",
    },
    {
      x: isMobile ? 280 : 340,
      type: "cheese",
      y: 120,
      icon: "🧀",
      name: "Queijo",
    },
    {
      x: isMobile ? 380 : 460,
      y: 120,
      type: "pepperoni",
      icon: "🥓",
      name: "Pepperoni",
    },
    {
      x: isMobile ? 480 : 580,
      y: 120,
      type: "mushroom",
      icon: "🍄",
      name: "Cogumelo",
    },

    {
      x: isMobile ? 80 : 100,
      y: isMobile ? 280 : 350,
      type: "oven",
      icon: "🔥",
      name: "Forno 1",
    },
    {
      x: isMobile ? 180 : 220,
      y: isMobile ? 280 : 350,
      type: "oven",
      icon: "🔥",
      name: "Forno 2",
    },
    {
      x: isMobile ? 380 : 460,
      y: isMobile ? 280 : 350,
      type: "delivery",
      icon: "🍽️",
      name: "Entrega",
    },
    {
      x: isMobile ? 480 : 580,
      y: isMobile ? 280 : 350,
      type: "trash",
      icon: "🗑️",
      name: "Lixo",
    },
  ];

  const stationObjects = [];

  stations.forEach((s) => {
    const base = k.add([
      k.rect(stationSize, stationSize),
      k.pos(s.x, s.y),
      k.anchor("center"),
      k.color(85, 85, 85),
      k.outline(2, k.rgb(255, 165, 0)),
      k.area(),
      k.z(5),
      "station",
      {
        stationType: s.type,
        working: false,
        timer: 0,
        item: null,
      },
    ]);

    const icon = k.add([
      k.text(s.icon, { size: iconSize }),
      k.pos(s.x, s.y - 4),
      k.anchor("center"),
      k.z(6),
    ]);

    k.add([
      k.text(s.name, { size: isMobile ? 8 : 10 }),
      k.pos(s.x, s.y + stationSize / 2 - 8),
      k.anchor("center"),
      k.z(6),
    ]);

    stationObjects.push({ base, icon });
  });

  // ==================== PLAYER ====================
  const playerSize = isMobile ? 24 : 32;

  const player = k.add([
    k.rect(playerSize, playerSize),
    k.pos(k.center().x, k.height() - (isMobile ? 150 : 150)),
    k.anchor("center"),
    k.area(),
    k.color(160, 82, 45),
    k.z(10),
    {
      heldItem: null,
      speed: isMobile ? 200 : 250,
    },
  ]);

  k.add([
    k.circle(playerSize * 0.375),
    k.pos(player.pos.x, player.pos.y - 5),
    k.anchor("center"),
    k.color(139, 69, 19),
    k.z(11),
    "playerHead",
  ]);

  k.add([
    k.text("FREDDY", { size: isMobile ? 8 : 10 }),
    k.pos(player.pos.x, player.pos.y + playerSize / 2 + 10),
    k.anchor("center"),
    k.color(255, 165, 0),
    k.z(11),
    "playerName",
  ]);

  const heldItemDisplay = k.add([
    k.text("", { size: isMobile ? 20 : 24 }),
    k.pos(player.pos.x, player.pos.y - 30),
    k.anchor("center"),
    k.z(12),
    "heldItem",
  ]);

  const nearStationIndicator = k.add([
    k.text("⬇️ " + (isMobile ? "⚡" : "ESPAÇO") + " ⬇️", {
      size: isMobile ? 12 : 14,
    }),
    k.pos(player.pos.x, player.pos.y + 40),
    k.anchor("center"),
    k.color(255, 255, 0),
    k.z(12),
    k.opacity(0),
    "indicator",
  ]);

  // ==================== UI ====================
  const uiSize = isMobile ? 14 : 18;

  const scoreText = k.add([
    k.text("PONTOS: 0", { size: uiSize }),
    k.pos(10, 10),
    k.color(255, 165, 0),
    k.z(100),
  ]);

  const comboText = k.add([
    k.text("COMBO: 0x", { size: uiSize - 2 }),
    k.pos(10, 10 + uiSize + 5),
    k.color(76, 175, 80),
    k.z(100),
  ]);

  const timerText = k.add([
    k.text("TEMPO: 3:00", { size: uiSize }),
    k.pos(k.width() / 2, 10),
    k.anchor("center"),
    k.z(100),
  ]);

  // Game state
  let score = 0;
  let combo = 0;
  let gameTime = 180;
  let orders = [];
  let nearestStation = null;

  // ==================== RECIPES ====================
  const recipes = [
    {
      name: "Margherita",
      ingredients: ["dough", "sauce", "cheese"],
      time: 45,
      points: 100,
    },
    {
      name: "Pepperoni",
      ingredients: ["dough", "sauce", "cheese", "pepperoni"],
      time: 50,
      points: 150,
    },
    {
      name: "Cogumelo",
      ingredients: ["dough", "sauce", "cheese", "mushroom"],
      time: 50,
      points: 150,
    },
    {
      name: "Supreme",
      ingredients: ["dough", "sauce", "cheese", "pepperoni", "mushroom"],
      time: 60,
      points: 200,
    },
  ];

  // ==================== ORDERS ====================
  function generateOrder() {
    if (orders.length >= (isMobile ? 2 : 3)) return;

    const recipe = k.choose(recipes);
    orders.push({
      id: Date.now() + Math.random(),
      recipe: recipe,
      timeLeft: recipe.time,
      maxTime: recipe.time,
    });
  }

  generateOrder();
  k.loop(10, generateOrder);

  // ==================== MOVEMENT ====================
  k.onUpdate(() => {
    const speed = player.speed;

    // Desktop controls
    if (k.isKeyDown("left") || k.isKeyDown("a")) {
      player.pos.x -= speed * k.dt();
    }
    if (k.isKeyDown("right") || k.isKeyDown("d")) {
      player.pos.x += speed * k.dt();
    }
    if (k.isKeyDown("up") || k.isKeyDown("w")) {
      player.pos.y -= speed * k.dt();
    }
    if (k.isKeyDown("down") || k.isKeyDown("s")) {
      player.pos.y += speed * k.dt();
    }

    // Mobile controls
    if (isMobile && (mobileInput.x !== 0 || mobileInput.y !== 0)) {
      player.pos.x += mobileInput.x * speed * k.dt();
      player.pos.y += mobileInput.y * speed * k.dt();
    }

    player.pos.x = Math.max(40, Math.min(k.width() - 40, player.pos.x));
    player.pos.y = Math.max(
      40,
      Math.min(k.height() - (isMobile ? 220 : 60), player.pos.y)
    );

    const head = k.get("playerHead")[0];
    const name = k.get("playerName")[0];
    const held = k.get("heldItem")[0];
    const indicator = k.get("indicator")[0];

    if (head) head.pos = player.pos.add(0, -5);
    if (name) name.pos = player.pos.add(0, playerSize / 2 + 10);
    if (held) held.pos = player.pos.add(0, -30);

    nearestStation = findNearestStation();

    if (nearestStation && indicator) {
      indicator.pos = player.pos.add(0, 40);
      indicator.opacity = Math.sin(k.time() * 5) * 0.5 + 0.5;
    } else if (indicator) {
      indicator.opacity = 0;
    }
  });

  // ==================== FUNCTIONS ====================
  function updateHeldItemDisplay() {
    const held = k.get("heldItem")[0];
    if (!held) return;

    if (!player.heldItem) {
      held.text = "";
      return;
    }

    const ingredients = player.heldItem.ingredients;
    let emoji = "📦";

    if (player.heldItem.cooked) {
      emoji = "🍕✨";
    } else if (player.heldItem.needsOven) {
      emoji = "🍕❄️";
    } else if (ingredients.length === 1 && ingredients.includes("dough")) {
      emoji = "🫓";
    } else if (ingredients.includes("dough") && ingredients.includes("sauce")) {
      emoji = "🍕🍅";
    } else {
      emoji = "📦";
    }

    held.text = emoji;
  }

  function findNearestStation() {
    let nearest = null;
    let minDist = isMobile ? 80 : 120;

    stationObjects.forEach((s) => {
      const dist = player.pos.dist(s.base.pos);
      if (dist < minDist) {
        minDist = dist;
        nearest = s.base;
      }
    });

    return nearest;
  }

  function interactWithStation(station) {
    const type = station.stationType;
    const feedbackSize = isMobile ? 12 : 14;

    // TRASH
    if (type === "trash") {
      if (player.heldItem) {
        player.heldItem = null;
        updateHeldItemDisplay();
        k.add([
          k.text("🗑️", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(200, 200, 200),
          k.opacity(1),
          k.lifespan(0.8),
          k.z(200),
        ]);
      }
      return;
    }

    // DELIVERY
    if (type === "delivery") {
      if (!player.heldItem) {
        k.add([
          k.text("SEM PIZZA!", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(255, 0, 0),
          k.opacity(1),
          k.lifespan(0.8),
          k.z(200),
        ]);
        return;
      }

      if (!player.heldItem.cooked) {
        k.add([
          k.text("COZINHAR!", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(255, 165, 0),
          k.opacity(1),
          k.lifespan(0.8),
          k.z(200),
        ]);
        return;
      }

      const heldIng = [...player.heldItem.ingredients].sort().join(",");

      for (let i = 0; i < orders.length; i++) {
        const orderIng = [...orders[i].recipe.ingredients].sort().join(",");

        if (heldIng === orderIng) {
          const pts = orders[i].recipe.points + combo * 10;
          score += pts;
          combo++;

          orders.splice(i, 1);
          player.heldItem = null;
          updateHeldItemDisplay();

          scoreText.text = `PONTOS: ${score}`;
          comboText.text = `COMBO: ${combo}x`;

          k.add([
            k.text(`+${pts}`, { size: 20 }),
            k.pos(player.pos),
            k.anchor("center"),
            k.color(76, 175, 80),
            k.opacity(1),
            k.lifespan(1.5),
            k.move(k.UP, 50),
            k.z(200),
          ]);

          if (combo > 1) {
            k.add([
              k.text(`${combo}x COMBO!`, { size: isMobile ? 20 : 28 }),
              k.pos(k.center()),
              k.anchor("center"),
              k.color(76, 175, 80),
              k.opacity(1),
              k.lifespan(1),
              k.z(200),
            ]);
          }
          return;
        }
      }

      combo = 0;
      comboText.text = "COMBO: 0x";
      k.shake(10);
      k.add([
        k.text("ERRADO!", { size: feedbackSize + 4 }),
        k.pos(station.pos.add(0, -40)),
        k.anchor("center"),
        k.color(255, 0, 0),
        k.opacity(1),
        k.lifespan(1),
        k.z(200),
      ]);
      return;
    }

    // OVEN
    if (type === "oven") {
      if (
        player.heldItem &&
        player.heldItem.needsOven &&
        !player.heldItem.cooked &&
        !station.working
      ) {
        station.item = player.heldItem;
        station.working = true;
        station.timer = 5;
        player.heldItem = null;
        updateHeldItemDisplay();

        k.add([
          k.text("🔥", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(255, 165, 0),
          k.opacity(1),
          k.lifespan(1),
          k.z(200),
        ]);
        return;
      }

      if (station.working && station.timer <= 0 && !player.heldItem) {
        player.heldItem = station.item;
        player.heldItem.cooked = true;
        player.heldItem.needsOven = false;
        station.item = null;
        station.working = false;

        // Reset oven icon
        const stationIcon = stationObjects.find((s) => s.base === station);
        if (stationIcon) {
          stationIcon.icon.text = "🔥";
        }

        updateHeldItemDisplay();

        k.add([
          k.text("✅", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(76, 175, 80),
          k.opacity(1),
          k.lifespan(1),
          k.z(200),
        ]);
        return;
      }

      if (station.working && station.timer > 0) {
        k.add([
          k.text("⏱️", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(255, 255, 0),
          k.opacity(1),
          k.lifespan(0.8),
          k.z(200),
        ]);
      }
      return;
    }

    // INGREDIENTS
    if (["dough", "sauce", "cheese", "pepperoni", "mushroom"].includes(type)) {
      if (!player.heldItem) {
        if (type !== "dough") {
          k.add([
            k.text("MASSA 1°!", { size: feedbackSize }),
            k.pos(station.pos.add(0, -40)),
            k.anchor("center"),
            k.color(255, 165, 0),
            k.opacity(1),
            k.lifespan(1.2),
            k.z(200),
          ]);
          return;
        }

        player.heldItem = {
          ingredients: [type],
          needsOven: false,
          cooked: false,
        };
        updateHeldItemDisplay();

        k.add([
          k.text("✓", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(76, 175, 80),
          k.opacity(1),
          k.lifespan(0.8),
          k.z(200),
        ]);
        return;
      }

      if (player.heldItem.cooked) {
        k.add([
          k.text("PRONTA!", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(255, 0, 0),
          k.opacity(1),
          k.lifespan(0.8),
          k.z(200),
        ]);
        return;
      }

      if (type === "dough") {
        k.add([
          k.text("JÁ TEM!", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(255, 0, 0),
          k.opacity(1),
          k.lifespan(0.8),
          k.z(200),
        ]);
        return;
      }

      if (!player.heldItem.ingredients.includes("dough")) {
        k.add([
          k.text("CADÊ MASSA?", { size: feedbackSize }),
          k.pos(station.pos.add(0, -40)),
          k.anchor("center"),
          k.color(255, 165, 0),
          k.opacity(1),
          k.lifespan(1),
          k.z(200),
        ]);
        return;
      }

      player.heldItem.ingredients.push(type);

      if (player.heldItem.ingredients.length >= 2) {
        player.heldItem.needsOven = true;
      }

      updateHeldItemDisplay();

      k.add([
        k.text("✓", { size: feedbackSize }),
        k.pos(station.pos.add(0, -40)),
        k.anchor("center"),
        k.color(76, 175, 80),
        k.opacity(1),
        k.lifespan(0.8),
        k.z(200),
      ]);
      return;
    }
  }

  // ==================== INPUT ====================
  k.onKeyPress("space", () => {
    const station = findNearestStation();
    if (station) {
      interactWithStation(station);

      k.add([
        k.circle(12),
        k.pos(player.pos),
        k.anchor("center"),
        k.color(255, 255, 0),
        k.opacity(0.8),
        k.lifespan(0.2),
        k.z(200),
      ]);
    }
  });

  // Mobile action button
  if (isMobile) {
    k.onUpdate(() => {
      if (mobileInput.action) {
        const station = findNearestStation();
        if (station) {
          interactWithStation(station);

          k.add([
            k.circle(12),
            k.pos(player.pos),
            k.anchor("center"),
            k.color(255, 255, 0),
            k.opacity(0.8),
            k.lifespan(0.2),
            k.z(200),
          ]);
        }
        mobileInput.action = false;
      }
    });
  }

  k.onKeyPress("escape", () => k.go("menu"));

  // ==================== UPDATES ====================
  k.onUpdate(() => {
    // Update ovens
    stationObjects.forEach((s) => {
      if (s.base.working) {
        s.base.timer -= k.dt();
        s.icon.text = s.base.timer > 0 ? "🔥" : "✅";
      }
    });

    // Update orders
    for (let i = orders.length - 1; i >= 0; i--) {
      orders[i].timeLeft -= k.dt();

      if (orders[i].timeLeft <= 0) {
        orders.splice(i, 1);
        combo = 0;
        comboText.text = "COMBO: 0x";
        k.shake(15);

        k.add([
          k.text("PERDIDO!", { size: isMobile ? 18 : 24 }),
          k.pos(k.center()),
          k.anchor("center"),
          k.color(255, 0, 0),
          k.opacity(1),
          k.lifespan(2),
          k.move(k.UP, 20),
          k.z(200),
        ]);
      }
    }

    // Update timer
    gameTime -= k.dt();
    const min = Math.floor(gameTime / 60);
    const sec = Math.floor(gameTime % 60);
    timerText.text = `TEMPO: ${min}:${sec.toString().padStart(2, "0")}`;

    if (gameTime <= 30) {
      timerText.color = k.rgb(255, 0, 0);
    }

    if (gameTime <= 0) {
      k.go("gameover", score);
    }
  });

  // ==================== DRAW ORDERS ====================
  k.onDraw(() => {
    const orderX = isMobile ? k.width() - 115 : 650;
    const orderWidth = isMobile ? 110 : 140;
    const orderHeight = isMobile ? 75 : 90;
    const orderSpacing = isMobile ? 80 : 100;

    orders.forEach((order, i) => {
      const y = (isMobile ? 30 : 100) + i * orderSpacing;

      k.drawRect({
        width: orderWidth,
        height: orderHeight,
        pos: k.vec2(orderX, y),
        color: k.rgb(0, 0, 0),
        opacity: 0.7,
        outline: { width: 2, color: k.rgb(255, 165, 0) },
      });

      k.drawText({
        text: order.recipe.name,
        pos: k.vec2(orderX + orderWidth / 2, y + 12),
        size: isMobile ? 11 : 14,
        anchor: "center",
      });

      const ingredientsMap = {
        dough: "🫓",
        sauce: "🍅",
        cheese: "🧀",
        pepperoni: "🥓",
        mushroom: "🍄",
      };
      const icons = order.recipe.ingredients
        .map((ing) => ingredientsMap[ing] || "?")
        .join("");

      k.drawText({
        text: icons,
        pos: k.vec2(orderX + orderWidth / 2, y + 28),
        size: isMobile ? 12 : 16,
        anchor: "center",
      });

      const progress = order.timeLeft / order.maxTime;
      const barColor =
        progress > 0.5
          ? k.rgb(76, 175, 80)
          : progress > 0.25
          ? k.rgb(255, 193, 7)
          : k.rgb(244, 67, 54);

      const barWidth = isMobile ? 90 : 120;
      k.drawRect({
        width: barWidth * progress,
        height: 6,
        pos: k.vec2(orderX + 10, y + (isMobile ? 50 : 65)),
        color: barColor,
      });

      k.drawText({
        text: `${Math.ceil(order.timeLeft)}s`,
        pos: k.vec2(orderX + orderWidth / 2, y + (isMobile ? 60 : 78)),
        size: isMobile ? 10 : 12,
        anchor: "center",
      });
    });
  });
});

// ==================== GAME OVER SCENE ====================
k.scene("gameover", (finalScore) => {
  k.add([
    k.text("TEMPO ESGOTADO!", { size: isMobile ? 28 : 36 }),
    k.pos(k.center().x, isMobile ? 120 : 150),
    k.anchor("center"),
    k.color(255, 0, 0),
  ]);

  k.add([
    k.text(`Pontuação: ${finalScore}`, { size: isMobile ? 22 : 28 }),
    k.pos(k.center().x, isMobile ? 200 : 250),
    k.anchor("center"),
    k.color(255, 165, 0),
  ]);

  const highScore = k.getData("highScore", 0);
  if (finalScore > highScore) {
    k.setData("highScore", finalScore);
    k.add([
      k.text("🎉 RECORDE! 🎉", { size: isMobile ? 20 : 24 }),
      k.pos(k.center().x, isMobile ? 260 : 320),
      k.anchor("center"),
      k.color(76, 175, 80),
    ]);
  } else {
    k.add([
      k.text(`Recorde: ${highScore}`, { size: isMobile ? 16 : 20 }),
      k.pos(k.center().x, isMobile ? 260 : 320),
      k.anchor("center"),
    ]);
  }

  k.add([
    k.text(isMobile ? "Toque para jogar" : "ESPAÇO - Jogar novamente", {
      size: isMobile ? 14 : 16,
    }),
    k.pos(k.center().x, k.height() - (isMobile ? 120 : 150)),
    k.anchor("center"),
  ]);

  if (!isMobile) {
    k.add([
      k.text("ESC - Menu principal", { size: 14 }),
      k.pos(k.center().x, k.height() - 120),
      k.anchor("center"),
      k.color(200, 200, 200),
    ]);
  }

  k.onKeyPress("space", () => k.go("game"));
  k.onKeyPress("escape", () => k.go("menu"));
  k.onClick(() => k.go("game"));

  if (isMobile) {
    k.onTouchStart(() => k.go("game"));
  }
});

// ==================== START ====================
k.go("menu");
