import kaplay from "kaplay";

// ==================== MOBILE DETECTION & ORIENTATION ====================
const isMobile =
  /Android|webOS|iPhone|iPad|iPot|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

let isPortrait = window.innerHeight > window.innerWidth;
let gameStarted = false;
let currentK = null;

// Orientation change handler
function handleOrientationChange() {
  isPortrait = window.innerHeight > window.innerWidth;

  if (!isMobile) return;

  if (isPortrait) {
    showOrientationWarning();
  } else {
    hideOrientationWarning();
  }
}

function showOrientationWarning() {
  let overlay = document.getElementById("orientationOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "orientationOverlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    `;

    overlay.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
      <h1 style="font-size: 32px; margin: 20px 0;">Vire o celular!</h1>
      <p style="font-size: 20px; margin: 20px; max-width: 80%;">
        Por favor, gire o dispositivo para o modo paisagem para jogar.
      </p>
      <div style="font-size: 60px; margin-top: 30px;">🔄</div>
    `;

    document.body.appendChild(overlay);
  }
  overlay.style.display = "flex";
}

function hideOrientationWarning() {
  const overlay = document.getElementById("orientationOverlay");
  if (overlay) {
    overlay.style.display = "none";
  }
}

window.addEventListener("orientationchange", handleOrientationChange);
window.addEventListener("resize", handleOrientationChange);
handleOrientationChange();

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

// ==================== AUDIO SETUP ====================
const audioContext = {
  levelComplete: new Audio("/audio/level-complete.wav"),
};

let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;

  Object.values(audioContext).forEach((audio) => {
    if (!audio) return;

    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {});
  });

  audioUnlocked = true;
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", unlockAudio);
  window.removeEventListener("touchstart", unlockAudio);
}

window.addEventListener("pointerdown", unlockAudio);
window.addEventListener("keydown", unlockAudio);
window.addEventListener("touchstart", unlockAudio);

// Configure audio
Object.values(audioContext).forEach((audio) => {
  if (audio) {
    audio.volume = 0.5;
    audio.crossOrigin = "anonymous";
  }
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

currentK = k;

// ==================== MENU SCENE ====================
k.scene("menu", () => {
  gameStarted = false;

  if (isMobile && isPortrait) {
    showOrientationWarning();
  } else {
    hideOrientationWarning();
  }

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

  k.add([
    k.text("CONCLUA OS 3 NÍVEIS", { size: isMobile ? 14 : 18 }),
    k.pos(k.center().x, isMobile ? 150 : 200),
    k.anchor("center"),
    k.color(255, 165, 0),
  ]);

  // Um único botão para iniciar a campanha
  const startBtn = k.add([
    k.rect(isMobile ? 220 : 300, isMobile ? 50 : 60),
    k.pos(k.center().x, isMobile ? 220 : 280),
    k.anchor("center"),
    k.area(),
    k.color(100, 100, 150),
    k.outline(3, k.rgb(255, 165, 0)),
  ]);

  k.add([
    k.text("INICIAR", { size: isMobile ? 14 : 18 }),
    k.pos(k.center().x, isMobile ? 220 : 280),
    k.anchor("center"),
    k.color(76, 175, 80),
  ]);

  startBtn.onClick(() => {
    k.go("game", { level: 1, difficulty: "easy", maxTime: 180 });
  });

  startBtn.onHover(() => {
    startBtn.color = k.rgb(150, 150, 200);
  });

  startBtn.onHoverEnd(() => {
    startBtn.color = k.rgb(100, 100, 150);
  });

  const instructions = [
    "",
    "COMO JOGAR:",
    "",
    isMobile ? "🕹️ Joystick - Mover" : "WASD - Mover Freddy",
    isMobile ? "⚡ Botão Verde - Ação" : "ESPAÇO - Pegar/Usar estação",
    "",
    "1. Complete pelo menos 6 receitas antes do tempo acabar",
    "2. Cada nível tem diferentes dificuldades",
    "3. Quanto mais rápido, melhor sua pontuação!",
  ];

  instructions.forEach((line, i) => {
    k.add([
      k.text(line, { size: isMobile ? 9 : 11 }),
      k.pos(k.center().x, (isMobile ? 300 : 370) + i * (isMobile ? 15 : 18)),
      k.anchor("center"),
      k.z(1),
    ]);
  });

  k.onKeyPress("space", () =>
    k.go("game", { level: 1, difficulty: "easy", maxTime: 180 })
  );
  k.onClick(() => k.go("game", { level: 1, difficulty: "easy", maxTime: 180 }));
  if (isMobile) {
    k.onTouchStart(() =>
      k.go("game", { level: 1, difficulty: "easy", maxTime: 180 })
    );
  }
});

// ==================== GAME SCENE ====================
k.scene(
  "game",
  (levelData = { level: 1, difficulty: "easy", maxTime: 180 }) => {
    if (isMobile && isPortrait) {
      showOrientationWarning();
      k.go("menu");
      return;
    }

    gameStarted = true;
    hideOrientationWarning();

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
    const stationSize = isMobile ? 50 : 80;
    const iconSize = isMobile ? 22 : 36;

    // Calcular posições dinamicamente para mobile
    let stations;
    if (isMobile) {
      // Layout otimizado para mobile - 2 linhas
      stations = [
        { x: 60, y: 90, type: "dough", icon: "📦", name: "Massa" },
        { x: 130, y: 90, type: "sauce", icon: "🍅", name: "Molho" },
        { x: 200, y: 90, type: "cheese", icon: "🧀", name: "Queijo" },
        { x: 270, y: 90, type: "pepperoni", icon: "🥓", name: "Peper" },
        { x: 340, y: 90, type: "mushroom", icon: "🍄", name: "Cogu" },
        { x: 60, y: 200, type: "oven", icon: "🔥", name: "Forno 1" },
        { x: 130, y: 200, type: "oven", icon: "🔥", name: "Forno 2" },
        { x: 270, y: 200, type: "delivery", icon: "🍽️", name: "Entrega" },
        { x: 340, y: 200, type: "trash", icon: "🗑️", name: "Lixo" },
      ];
    } else {
      stations = [
        { x: 100, y: 120, type: "dough", icon: "📦", name: "Massa" },
        { x: 220, y: 120, type: "sauce", icon: "🍅", name: "Molho" },
        { x: 340, type: "cheese", y: 120, icon: "🧀", name: "Queijo" },
        { x: 460, y: 120, type: "pepperoni", icon: "🥓", name: "Pepperoni" },
        { x: 580, y: 120, type: "mushroom", icon: "🍄", name: "Cogumelo" },
        { x: 100, y: 350, type: "oven", icon: "🔥", name: "Forno 1" },
        { x: 220, y: 350, type: "oven", icon: "🔥", name: "Forno 2" },
        { x: 460, y: 350, type: "delivery", icon: "🍽️", name: "Entrega" },
        { x: 580, y: 350, type: "trash", icon: "🗑️", name: "Lixo" },
      ];
    }

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
      k.pos(k.center().x, k.height() - (isMobile ? 80 : 150)),
      k.anchor("center"),
      k.area(),
      k.color(160, 82, 45),
      k.z(10),
      {
        heldItem: null,
        speed: isMobile ? 220 : 250,
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

    // ==================== GAME STATE ====================
    const RECIPES_NEEDED = 6;
    const currentLevel = levelData.level;
    const currentDifficulty = levelData.difficulty;
    let score = 0;
    let combo = 0;
    let gameTime = levelData.maxTime;
    let orders = [];
    let nearestStation = null;
    let completedRecipes = 0;
    let levelComplete = false;

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

    const recipesText = k.add([
      k.text(`RECEITAS: 0/${RECIPES_NEEDED}`, { size: uiSize - 2 }),
      k.pos(10, 10 + uiSize * 2 + 10),
      k.color(100, 200, 255),
      k.z(100),
    ]);

    const levelText = k.add([
      k.text(`NÍVEL ${currentLevel}`, { size: uiSize - 2 }),
      k.pos(k.width() - 120, 10),
      k.anchor("topright"),
      k.color(200, 100, 255),
      k.z(100),
    ]);
    const timerText = k.add([
      k.text("TEMPO: 3:00", { size: uiSize }),
      k.pos(k.width() / 2, 10),
      k.anchor("center"),
      k.z(100),
    ]);

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

    // Adjust difficulty
    let baseOrderTime = 45;
    let maxOrders = 3;

    if (currentDifficulty === "normal") {
      baseOrderTime = 40;
      maxOrders = 3;
    } else if (currentDifficulty === "hard") {
      baseOrderTime = 35;
      maxOrders = 4;
    }

    // ==================== ORDERS ====================
    function generateOrder() {
      if (orders.length >= maxOrders) return;

      const recipe = k.choose(recipes);
      orders.push({
        id: Date.now() + Math.random(),
        recipe: recipe,
        timeLeft: baseOrderTime,
        maxTime: baseOrderTime,
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
        Math.min(k.height() - (isMobile ? 100 : 60), player.pos.y)
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

      // Verificar orientação contínua em mobile
      if (isMobile && isPortrait) {
        showOrientationWarning();
      } else {
        hideOrientationWarning();
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
      } else if (
        ingredients.includes("dough") &&
        ingredients.includes("sauce")
      ) {
        emoji = "🍕🍅";
      } else {
        emoji = "📦";
      }

      held.text = emoji;
    }

    function findNearestStation() {
      let nearest = null;
      let minDist = isMobile ? 70 : 120;

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
            completedRecipes++;

            orders.splice(i, 1);
            player.heldItem = null;
            updateHeldItemDisplay();

            scoreText.text = `PONTOS: ${score}`;
            comboText.text = `COMBO: ${combo}x`;
            recipesText.text = `RECEITAS: ${completedRecipes}/${RECIPES_NEEDED}`;

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
      if (
        ["dough", "sauce", "cheese", "pepperoni", "mushroom"].includes(type)
      ) {
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
        if (completedRecipes >= RECIPES_NEEDED) {
          k.go("levelcomplete", {
            score,
            level: currentLevel,
            time: levelData.maxTime - gameTime,
          });
        } else {
          k.go("gameover", {
            score,
            level: currentLevel,
            reason: "TEMPO_ESGOTADO",
          });
        }
      }
    });

    // ==================== DRAW ORDERS ====================
    k.onDraw(() => {
      let orderX, orderWidth, orderHeight, orderSpacing;

      if (isMobile) {
        // Otimizado para mobile - exibir em colunas compactas
        orderX = k.width() - 90;
        orderWidth = 85;
        orderHeight = 70;
        orderSpacing = 75;
      } else {
        orderX = 650;
        orderWidth = 140;
        orderHeight = 90;
        orderSpacing = 100;
      }

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
          pos: k.vec2(orderX + orderWidth / 2, y + 10),
          size: isMobile ? 9 : 14,
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
          pos: k.vec2(orderX + orderWidth / 2, y + 24),
          size: isMobile ? 10 : 16,
          anchor: "center",
        });

        const progress = order.timeLeft / order.maxTime;
        const barColor =
          progress > 0.5
            ? k.rgb(76, 175, 80)
            : progress > 0.25
            ? k.rgb(255, 193, 7)
            : k.rgb(244, 67, 54);

        const barWidth = isMobile ? 75 : 120;
        k.drawRect({
          width: barWidth * progress,
          height: 5,
          pos: k.vec2(orderX + 5, y + (isMobile ? 45 : 65)),
          color: barColor,
        });

        k.drawText({
          text: `${Math.ceil(order.timeLeft)}s`,
          pos: k.vec2(orderX + orderWidth / 2, y + (isMobile ? 56 : 78)),
          size: isMobile ? 8 : 12,
          anchor: "center",
        });
      });
    });
  }
);

// ==================== LEVEL COMPLETE SCENE ====================
k.scene("levelcomplete", (data) => {
  // Play completion sound
  try {
    audioContext.levelComplete.currentTime = 0;
    audioContext.levelComplete.play().catch(() => {});
  } catch (e) {}

  k.add([
    k.text("🎉 NÍVEL CONCLUÍDO! 🎉", { size: isMobile ? 28 : 36 }),
    k.pos(k.center().x, isMobile ? 80 : 120),
    k.anchor("center"),
    k.color(76, 175, 80),
  ]);

  k.add([
    k.text(`NÍVEL ${data.level}`, { size: isMobile ? 20 : 24 }),
    k.pos(k.center().x, isMobile ? 130 : 180),
    k.anchor("center"),
    k.color(200, 100, 255),
  ]);

  k.add([
    k.text(`Pontuação: ${data.score}`, { size: isMobile ? 22 : 28 }),
    k.pos(k.center().x, isMobile ? 180 : 240),
    k.anchor("center"),
    k.color(255, 165, 0),
  ]);

  k.add([
    k.text(`Tempo: ${Math.floor(data.time)}s`, { size: isMobile ? 16 : 20 }),
    k.pos(k.center().x, isMobile ? 220 : 290),
    k.anchor("center"),
    k.color(100, 200, 255),
  ]);

  const nextLevel = data.level + 1;

  if (nextLevel <= 3) {
    k.add([
      k.text(`PRÓXIMO: NÍVEL ${nextLevel}`, { size: isMobile ? 18 : 22 }),
      k.pos(k.center().x, isMobile ? 270 : 350),
      k.anchor("center"),
      k.color(255, 255, 100),
    ]);

    // Delay automático de 3 segundos antes de passar pro próximo nível
    k.wait(3, () => {
      k.go("game", {
        level: nextLevel,
        difficulty: nextLevel === 2 ? "normal" : "hard",
        maxTime: nextLevel === 2 ? 150 : 120,
      });
    });

    const countdownText = k.add([
      k.text("3", { size: isMobile ? 32 : 48 }),
      k.pos(k.center().x, isMobile ? 320 : 420),
      k.anchor("center"),
      k.color(255, 100, 100),
    ]);

    let countdown = 3;
    k.loop(1, () => {
      countdown--;
      if (countdown > 0) {
        countdownText.text = countdown.toString();
      } else {
        countdownText.opacity = 0;
      }
    });

    // Permitir pular o delay com ESPAÇO ou clique
    k.onKeyPress("space", () => {
      k.go("game", {
        level: nextLevel,
        difficulty: nextLevel === 2 ? "normal" : "hard",
        maxTime: nextLevel === 2 ? 150 : 120,
      });
    });
    k.onClick(() => {
      k.go("game", {
        level: nextLevel,
        difficulty: nextLevel === 2 ? "normal" : "hard",
        maxTime: nextLevel === 2 ? 150 : 120,
      });
    });
    if (isMobile) {
      k.onTouchStart(() => {
        k.go("game", {
          level: nextLevel,
          difficulty: nextLevel === 2 ? "normal" : "hard",
          maxTime: nextLevel === 2 ? 150 : 120,
        });
      });
    }
  } else {
    k.add([
      k.text("🏆 PARABÉNS! 🏆", { size: isMobile ? 20 : 24 }),
      k.pos(k.center().x, isMobile ? 120 : 150),
      k.anchor("center"),
      k.color(255, 215, 0),
    ]);

    k.add([
      k.text("VOCÊ COMPLETOU TODOS OS NÍVEIS!", { size: isMobile ? 12 : 16 }),
      k.pos(k.center().x, isMobile ? 180 : 240),
      k.anchor("center"),
    ]);

    k.add([
      k.text(`Pontuação Total: ${data.score}`, { size: isMobile ? 20 : 24 }),
      k.pos(k.center().x, isMobile ? 230 : 300),
      k.anchor("center"),
      k.color(255, 165, 0),
    ]);

    // Delay automático de 5 segundos antes de voltar ao menu
    k.wait(5, () => {
      k.go("menu");
    });

    const countdownText = k.add([
      k.text("5", { size: isMobile ? 32 : 48 }),
      k.pos(k.center().x, isMobile ? 320 : 420),
      k.anchor("center"),
      k.color(255, 215, 0),
    ]);

    let countdown = 5;
    k.loop(1, () => {
      countdown--;
      if (countdown > 0) {
        countdownText.text = countdown.toString();
      } else {
        countdownText.opacity = 0;
      }
    });

    k.add([
      k.text(isMobile ? "Toque para menu" : "ESPAÇO - Menu principal", {
        size: isMobile ? 14 : 16,
      }),
      k.pos(k.center().x, k.height() - (isMobile ? 80 : 100)),
      k.anchor("center"),
    ]);

    k.onKeyPress("space", () => k.go("menu"));
    k.onClick(() => k.go("menu"));
    if (isMobile) {
      k.onTouchStart(() => k.go("menu"));
    }
  }

  k.onKeyPress("escape", () => k.go("menu"));
});

// ==================== GAME OVER SCENE ====================
k.scene("gameover", (data) => {
  let title = "TEMPO ESGOTADO!";
  let titleColor = k.rgb(255, 0, 0);

  if (data.reason === "TEMPO_ESGOTADO") {
    title = "⏰ TEMPO ESGOTADO! ⏰";
  }

  k.add([
    k.text(title, { size: isMobile ? 28 : 36 }),
    k.pos(k.center().x, isMobile ? 100 : 150),
    k.anchor("center"),
    k.color(titleColor),
  ]);

  k.add([
    k.text(`NÍVEL ${data.level}`, { size: isMobile ? 16 : 20 }),
    k.pos(k.center().x, isMobile ? 150 : 210),
    k.anchor("center"),
    k.color(200, 100, 255),
  ]);

  k.add([
    k.text(`Pontuação: ${data.score}`, { size: isMobile ? 22 : 28 }),
    k.pos(k.center().x, isMobile ? 200 : 270),
    k.anchor("center"),
    k.color(255, 165, 0),
  ]);

  const highScore = k.getData("highScore", 0);
  if (data.score > highScore) {
    k.setData("highScore", data.score);
    k.add([
      k.text("🎉 RECORDE! 🎉", { size: isMobile ? 20 : 24 }),
      k.pos(k.center().x, isMobile ? 250 : 320),
      k.anchor("center"),
      k.color(76, 175, 80),
    ]);
  } else {
    k.add([
      k.text(`Recorde: ${highScore}`, { size: isMobile ? 16 : 20 }),
      k.pos(k.center().x, isMobile ? 250 : 320),
      k.anchor("center"),
    ]);
  }

  k.add([
    k.text(isMobile ? "Toque para repetir" : "ESPAÇO - Repetir nível", {
      size: isMobile ? 14 : 16,
    }),
    k.pos(k.center().x, k.height() - (isMobile ? 100 : 130)),
    k.anchor("center"),
  ]);

  if (!isMobile) {
    k.add([
      k.text("ESC - Menu principal", { size: 14 }),
      k.pos(k.center().x, k.height() - 90),
      k.anchor("center"),
      k.color(200, 200, 200),
    ]);
  }

  k.onKeyPress("space", () =>
    k.go("game", {
      level: data.level,
      difficulty:
        data.level === 1 ? "easy" : data.level === 2 ? "normal" : "hard",
      maxTime: data.level === 1 ? 180 : data.level === 2 ? 150 : 120,
    })
  );
  k.onKeyPress("escape", () => k.go("menu"));
  k.onClick(() =>
    k.go("game", {
      level: data.level,
      difficulty:
        data.level === 1 ? "easy" : data.level === 2 ? "normal" : "hard",
      maxTime: data.level === 1 ? 180 : data.level === 2 ? 150 : 120,
    })
  );

  if (isMobile) {
    k.onTouchStart(() =>
      k.go("game", {
        level: data.level,
        difficulty:
          data.level === 1 ? "easy" : data.level === 2 ? "normal" : "hard",
        maxTime: data.level === 1 ? 180 : data.level === 2 ? 150 : 120,
      })
    );
  }
});

// ==================== START ====================
k.go("menu");
