import kaplay from "kaplay";
import pixelFontUrl from "@fontsource/tiny5/files/tiny5-latin-400-normal.woff2?url";

// ==================== CONFIG ====================
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 500;
const HUD_HEIGHT = 44;
const KITCHEN_RIGHT = 785;
// Receitas entregues necessárias para 1, 2 e 3 estrelas
const STAR_THRESHOLDS = [2, 4, 6];
const OVEN_COOK_TIME = 5;
const OVEN_BURN_TIME = 8;
const INTERACT_RANGE = 100;
const PLAYER_SPEED = 280;
const STATION_SIZE = 85;

// Tempo dos pedidos = tempo da receita * orderTimeFactor
const LEVELS = [
  { maxTime: 180, orderTimeFactor: 1, maxOrders: 3, spawnInterval: 10 },
  { maxTime: 150, orderTimeFactor: 0.7, maxOrders: 3, spawnInterval: 8 },
  { maxTime: 120, orderTimeFactor: 0.5, maxOrders: 4, spawnInterval: 6 },
];

const INGREDIENT_ICONS = {
  dough: "🫓",
  sauce: "🍅",
  cheese: "🧀",
  pepperoni: "🥓",
  mushroom: "🍄",
};

const RECIPES = [
  {
    name: "Margherita",
    ingredients: ["dough", "sauce", "cheese"],
    time: 45,
    points: 100,
  },
  {
    name: "Queijo Duplo",
    ingredients: ["dough", "sauce", "cheese", "cheese"],
    time: 45,
    points: 140,
  },
  {
    name: "Bacon",
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

const STATIONS = [
  { x: 75, y: 110, type: "dough", name: "Massa" },
  { x: 210, y: 110, type: "sauce", name: "Molho" },
  { x: 345, y: 110, type: "cheese", name: "Queijo" },
  { x: 480, y: 110, type: "pepperoni", name: "Bacon" },
  { x: 615, y: 110, type: "mushroom", name: "Cogumelo" },
  { x: 75, y: 310, type: "oven", name: "Forno 1" },
  { x: 210, y: 310, type: "oven", name: "Forno 2" },
  { x: 480, y: 310, type: "delivery", name: "Entrega" },
  { x: 615, y: 310, type: "trash", name: "Lixo" },
];

// ==================== DEVICE & ORIENTATION ====================
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(
    navigator.userAgent,
  ) ||
  (navigator.maxTouchPoints > 0 &&
    window.matchMedia("(pointer: coarse)").matches);

let isPortrait = false;
const orientationOverlay = document.getElementById("orientationOverlay");

function updateOrientation() {
  isPortrait = window.innerHeight > window.innerWidth;
  orientationOverlay.classList.toggle("active", isMobile && isPortrait);
  if (isMobile && isPortrait) activeGame?.setPaused(true);
}

window.addEventListener("resize", updateOrientation);
window.addEventListener("orientationchange", updateOrientation);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) activeGame?.setPaused(true);
});

// ==================== MOBILE CONTROLS ====================
const mobileInput = { x: 0, y: 0, action: false };
const mobileControls = document.getElementById("mobileControls");

if (isMobile) {
  const joystick = document.getElementById("joystick");
  const joystickStick = document.getElementById("joystickStick");
  let joystickPointer = null;
  let joystickCenter = { x: 0, y: 0 };
  let joystickRange = 30;

  function moveJoystick(e) {
    const dx = e.clientX - joystickCenter.x;
    const dy = e.clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const clamp = dist > joystickRange ? joystickRange / dist : 1;

    mobileInput.x = (dx * clamp) / joystickRange;
    mobileInput.y = (dy * clamp) / joystickRange;
    joystickStick.style.transform = `translate(${dx * clamp}px, ${dy * clamp}px)`;
  }

  // Segue só o dedo que começou no joystick, para não pular quando o outro polegar toca no botão
  function releaseJoystick(e) {
    if (e.pointerId !== joystickPointer) return;
    joystickPointer = null;
    mobileInput.x = 0;
    mobileInput.y = 0;
    joystickStick.style.transform = "";
  }

  joystick.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (joystickPointer !== null) return;

    joystickPointer = e.pointerId;
    joystick.setPointerCapture(e.pointerId);
    const rect = joystick.getBoundingClientRect();
    joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    joystickRange = (rect.width - joystickStick.offsetWidth) / 2;
    moveJoystick(e);
  });

  joystick.addEventListener("pointermove", (e) => {
    if (e.pointerId === joystickPointer) moveJoystick(e);
  });
  joystick.addEventListener("pointerup", releaseJoystick);
  joystick.addEventListener("pointercancel", releaseJoystick);
  joystick.addEventListener("lostpointercapture", releaseJoystick);

  document
    .getElementById("actionButton")
    .addEventListener("pointerdown", (e) => {
      e.preventDefault();
      mobileInput.action = true;
    });
}

// Remove loading indicator
window.addEventListener("load", () => {
  const loading = document.querySelector(".loading");
  if (loading) loading.remove();
});

// ==================== KAPLAY INIT ====================
const k = kaplay({
  canvas: document.getElementById("game-canvas"),
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  background: [20, 18, 31],
  letterbox: true,
  stretch: false,
  font: "pixel",
  global: false,
});

// A fonte pixel fica borrada quando o atlas é muito maior que o texto,
// então textos pequenos e grandes usam atlas de tamanhos diferentes
k.loadFont("pixel", pixelFontUrl, { size: 32, filter: "linear" });
k.loadFont("pixel-big", pixelFontUrl, { size: 64, filter: "linear" });
const fontFor = (size) => (size >= 28 ? "pixel-big" : "pixel");

const WHITE = k.rgb(255, 255, 255);
const BLACK = k.rgb(0, 0, 0);
const INK = k.rgb(20, 16, 24);
const ORANGE = k.rgb(255, 165, 0);
const GREEN = k.rgb(76, 175, 80);
const RED = k.rgb(235, 64, 52);
const YELLOW = k.rgb(255, 221, 87);
const BLUE = k.rgb(100, 200, 255);
const PURPLE = k.rgb(200, 120, 255);
const GRAY = k.rgb(170, 170, 185);

// ==================== AUDIO ====================
k.loadMusic("bgm", "/audio/musica-de-fundo.mp3");
k.loadSound("start", "/audio/botao-iniciar.mp3");
k.loadSound("interaction", "/audio/interacao-item-forno.mp3");
k.loadSound("error", "/audio/erro-receita.mp3");
k.loadSound("levelComplete", "/audio/level-complete.wav");
k.loadSound("victory", "/audio/kids-cheering.mp3");

let muted = k.getData("muted", false);
let music = null;

function playSfx(name) {
  k.play(name, { volume: 0.8 });
}

// O navegador só libera áudio depois de uma interação, então tentamos de novo a cada gesto
function startMusic() {
  k.audioCtx.resume();
  if (!music) {
    music = k.play("bgm", { loop: true, volume: 0.35 });
  } else if (music.paused) {
    music.paused = false;
  }
}

window.addEventListener("click", startMusic);
window.addEventListener("touchend", startMusic);
window.addEventListener("keydown", startMusic);

function applyVolume() {
  k.setVolume(muted ? 0 : 1);
}

function toggleMute() {
  muted = !muted;
  k.setData("muted", muted);
  applyVolume();
}

applyVolume();

// Grito sintetizado do jumpscare
function playScreech() {
  if (muted) return;

  const ctx = k.audioCtx;
  const duration = 1.3;
  const now = ctx.currentTime;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  gain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(160, now + duration);

  const wobble = ctx.createOscillator();
  wobble.frequency.value = 38;
  const wobbleGain = ctx.createGain();
  wobbleGain.gain.value = 260;
  wobble.connect(wobbleGain).connect(osc.frequency);

  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.4;

  osc.connect(gain);
  noise.connect(noiseGain).connect(gain);
  [osc, wobble, noise].forEach((node) => {
    node.start(now);
    node.stop(now + duration);
  });
}

// ==================== SHARED STATE ====================
// Cena de jogo ativa (para pausar ao trocar de aba ou girar o celular)
let activeGame = null;

function enterScene({ inGame }) {
  activeGame = null;
  mobileInput.action = false;
  mobileControls.classList.toggle("active", isMobile && inGame);
  k.setCursor("default");
  addSoundButton();
}

function saveHighScore(score) {
  const highScore = k.getData("highScore", 0);
  if (score > highScore) {
    k.setData("highScore", score);
    return { highScore: score, isNew: true };
  }
  return { highScore, isNew: false };
}

function starsForRecipes(recipes) {
  return STAR_THRESHOLDS.filter((needed) => recipes >= needed).length;
}

function starRow(count) {
  return "⭐".repeat(count) + "☆".repeat(STAR_THRESHOLDS.length - count);
}

// ==================== DRAWING HELPERS ====================
function drawCheckerFloor(x, y, width, height, tile = 50) {
  for (let row = 0; row * tile < height; row++) {
    for (let col = 0; col * tile < width; col++) {
      k.drawRect({
        pos: k.vec2(x + col * tile, y + row * tile),
        width: Math.min(tile, width - col * tile),
        height: Math.min(tile, height - row * tile),
        color: (row + col) % 2 === 0 ? k.rgb(42, 40, 56) : k.rgb(70, 68, 86),
      });
    }
  }
}

// Bordas escurecidas em faixas finas que não se sobrepõem
function drawVignette(x, y, width, height, strength = 0.5) {
  const bands = 16;
  const bandSize = 4;
  for (let i = 0; i < bands; i++) {
    const opacity = strength * (1 - i / bands) ** 2;
    const inset = i * bandSize;
    const innerWidth = width - inset * 2;
    const innerHeight = height - inset * 2;
    const strips = [
      [x + inset, y + inset, innerWidth, bandSize],
      [x + inset, y + height - inset - bandSize, innerWidth, bandSize],
      [x + inset, y + inset + bandSize, bandSize, innerHeight - bandSize * 2],
      [
        x + width - inset - bandSize,
        y + inset + bandSize,
        bandSize,
        innerHeight - bandSize * 2,
      ],
    ];
    strips.forEach(([sx, sy, w, h]) => {
      k.drawRect({
        pos: k.vec2(sx, sy),
        width: w,
        height: h,
        color: BLACK,
        opacity,
      });
    });
  }
}

// Freddy desenhado com formas simples; (0, 0) fica no centro do corpo
function drawFreddy({ facing = 1, bob = 0, scary = false } = {}) {
  const brown = k.rgb(150, 92, 48);
  const dark = k.rgb(92, 54, 26);
  const light = k.rgb(214, 162, 104);
  const black = k.rgb(18, 14, 18);
  const edge = { width: 1.5, color: dark };
  const y = bob;

  k.drawEllipse({
    pos: k.vec2(0, 23),
    radiusX: 16,
    radiusY: 5,
    color: BLACK,
    opacity: 0.35,
  });

  // Pernas e corpo
  k.drawRect({
    pos: k.vec2(-9, 13 + y),
    width: 7,
    height: 9,
    radius: 2,
    color: dark,
  });
  k.drawRect({
    pos: k.vec2(2, 13 + y),
    width: 7,
    height: 9,
    radius: 2,
    color: dark,
  });
  k.drawRect({
    pos: k.vec2(0, 5 + y),
    width: 28,
    height: 22,
    radius: 9,
    anchor: "center",
    color: brown,
    outline: edge,
  });
  k.drawEllipse({
    pos: k.vec2(0, 8 + y),
    radiusX: 9,
    radiusY: 6.5,
    color: light,
  });

  // Gravata borboleta
  k.drawTriangle({
    p1: k.vec2(0, -4 + y),
    p2: k.vec2(-6, -7 + y),
    p3: k.vec2(-6, -1 + y),
    color: black,
  });
  k.drawTriangle({
    p1: k.vec2(0, -4 + y),
    p2: k.vec2(6, -7 + y),
    p3: k.vec2(6, -1 + y),
    color: black,
  });

  // Orelhas e cabeça
  [-11, 11].forEach((x) => {
    k.drawCircle({
      pos: k.vec2(x, -26 + y),
      radius: 5,
      color: brown,
      outline: edge,
    });
    k.drawCircle({ pos: k.vec2(x, -26 + y), radius: 2.5, color: dark });
  });
  k.drawCircle({
    pos: k.vec2(0, -15 + y),
    radius: 14,
    color: brown,
    outline: edge,
  });
  k.drawEllipse({
    pos: k.vec2(0, -8 + y),
    radiusX: 8,
    radiusY: 5.5,
    color: light,
  });
  k.drawEllipse({
    pos: k.vec2(0, -11 + y),
    radiusX: 3,
    radiusY: 2,
    color: black,
  });

  if (scary) {
    k.drawRect({
      pos: k.vec2(0, -4 + y),
      width: 12,
      height: 6,
      radius: 1,
      anchor: "center",
      color: black,
    });
    [-4.5, -1.5, 1.5, 4.5].forEach((x) => {
      k.drawRect({
        pos: k.vec2(x, -6.5 + y),
        width: 2,
        height: 2,
        anchor: "center",
        color: WHITE,
      });
    });
    [-5.5, 5.5].forEach((x) => {
      k.drawCircle({ pos: k.vec2(x, -19 + y), radius: 4, color: black });
      k.drawCircle({
        pos: k.vec2(x, -19 + y),
        radius: 1.6,
        color: RED,
        opacity: 0.5,
      });
      k.drawCircle({ pos: k.vec2(x, -19 + y), radius: 0.9, color: WHITE });
    });
  } else {
    [-5.5, 5.5].forEach((x) => {
      k.drawCircle({ pos: k.vec2(x, -19 + y), radius: 3.6, color: WHITE });
      k.drawCircle({
        pos: k.vec2(x + facing * 1.2, -19 + y),
        radius: 1.8,
        color: k.rgb(40, 80, 170),
      });
    });
  }

  // Cartola
  k.drawRect({
    pos: k.vec2(0, -28 + y),
    width: 18,
    height: 3,
    anchor: "center",
    color: black,
  });
  k.drawRect({
    pos: k.vec2(0, -34 + y),
    width: 11,
    height: 10,
    anchor: "center",
    color: black,
  });
}

// ==================== UI HELPERS ====================
function addBackdrop({ dim = 0.5 } = {}) {
  return k.add([
    k.z(0),
    {
      draw() {
        drawCheckerFloor(0, 0, GAME_WIDTH, GAME_HEIGHT);
        k.drawRect({
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          color: BLACK,
          opacity: dim,
        });
        drawVignette(0, 0, GAME_WIDTH, GAME_HEIGHT, 0.6);
      },
    },
  ]);
}

// Luz piscando de vez em quando, como as lâmpadas da pizzaria
function addLightFlicker(
  area = { x: 0, y: 0, width: GAME_WIDTH, height: GAME_HEIGHT },
) {
  let nextFlicker = k.rand(4, 9);
  let flickerTime = 0;

  return k.add([
    k.z(300),
    {
      update() {
        nextFlicker -= k.dt();
        flickerTime = Math.max(0, flickerTime - k.dt());
        if (nextFlicker <= 0) {
          flickerTime = 0.35;
          nextFlicker = k.rand(6, 14);
        }
      },
      draw() {
        if (flickerTime > 0 && Math.sin(flickerTime * 60) > 0) {
          k.drawRect({
            pos: k.vec2(area.x, area.y),
            width: area.width,
            height: area.height,
            color: BLACK,
            opacity: 0.4,
          });
        }
      },
    },
  ]);
}

function addPanel(width, height, pos, parent = k) {
  return parent.add([
    k.rect(width, height, { radius: 16 }),
    k.pos(pos),
    k.anchor("center"),
    k.color(22, 18, 34),
    k.opacity(0.94),
    k.outline(4, ORANGE),
    k.z(10),
  ]);
}

function addLabel(text, pos, { size = 20, color = WHITE, parent = k } = {}) {
  return parent.add([
    k.text(text, { size, font: fontFor(size) }),
    k.pos(pos),
    k.anchor("center"),
    k.color(color),
    k.z(11),
  ]);
}

function addButton(
  text,
  pos,
  onPress,
  { width = 240, height = 54, size = 24, color = GREEN, parent = k } = {},
) {
  const button = parent.add([
    k.rect(width, height, { radius: 12 }),
    k.pos(pos),
    k.anchor("center"),
    k.color(color),
    k.outline(3, INK),
    k.area(),
    k.scale(1),
    k.z(20),
  ]);

  button.label = button.add([
    k.text(text, { size, font: fontFor(size) }),
    k.anchor("center"),
  ]);

  button.onHover(() => {
    button.scale = k.vec2(1.06);
    k.setCursor("pointer");
  });
  button.onHoverEnd(() => {
    button.scale = k.vec2(1);
    k.setCursor("default");
  });
  button.onClick(onPress);

  return button;
}

function addSoundButton() {
  const icon = () => (muted ? "🔇" : "🔊");
  const toggle = () => {
    toggleMute();
    button.label.text = icon();
  };

  const button = addButton(icon(), k.vec2(962, 22), toggle, {
    width: 40,
    height: 32,
    size: 18,
    color: k.rgb(60, 54, 80),
  });
  button.z = 150;
  k.onKeyPress("m", toggle);
  return button;
}

function showFeedback(
  text,
  pos,
  { color = WHITE, size = 16, duration = 0.9, rise = true } = {},
) {
  const label = k.add([
    k.text(text, { size, font: fontFor(size) }),
    k.pos(pos),
    k.anchor("center"),
    k.color(color),
    k.opacity(1),
    k.scale(0.4),
    ...(rise ? [k.move(k.UP, 30)] : []),
    k.lifespan(duration, { fade: 0.3 }),
    k.z(200),
  ]);
  k.tween(0.4, 1, 0.2, (s) => (label.scale = k.vec2(s)), k.easings.easeOutBack);
  return label;
}

function addStars(count, y, { size = 48, spacing = 70 } = {}) {
  [-1, 0, 1].forEach((offset, i) => {
    const earned = i < count;
    const star = k.add([
      k.text("⭐", { size, font: fontFor(size) }),
      k.pos(GAME_WIDTH / 2 + offset * spacing, y),
      k.anchor("center"),
      k.opacity(earned ? 1 : 0.18),
      k.scale(earned ? 0 : 1),
      k.z(11),
    ]);

    if (earned) {
      k.wait(0.3 + i * 0.25, () => {
        playSfx("interaction");
        k.tween(
          0,
          1,
          0.3,
          (s) => (star.scale = k.vec2(s)),
          k.easings.easeOutBack,
        );
      });
    }
  });
}

// ==================== MENU SCENE ====================
k.scene("menu", () => {
  enterScene({ inGame: false });
  addBackdrop({ dim: 0.45 });
  addLightFlicker();

  // Freddy grandão balançando
  k.add([
    k.pos(200, 300),
    k.scale(4.2),
    k.z(5),
    {
      draw() {
        drawFreddy({ bob: Math.sin(k.time() * 2) * 1.5 });
      },
    },
  ]);

  addLabel("FNAF PIZZA KITCHEN", k.vec2(620, 70), { size: 46, color: ORANGE });
  addLabel("🍕 Estilo Overcooked! 🐻", k.vec2(620, 115), { size: 22 });

  addPanel(500, 210, k.vec2(620, 255));
  addLabel("COMO JOGAR", k.vec2(620, 172), { size: 22, color: YELLOW });

  const instructions = [
    isMobile ? "🕹️ Joystick - Mover" : "WASD / Setas - Mover",
    isMobile
      ? "⚡ Botão verde - Usar estação"
      : "ESPAÇO - Usar estação  ·  ESC - Pausar",
    "Massa → molho → recheio → forno → entrega",
    `${STAR_THRESHOLDS[0]} receitas ⭐  ·  ${STAR_THRESHOLDS[1]} ⭐⭐  ·  ${STAR_THRESHOLDS[2]} ⭐⭐⭐`,
    "Sem estrelas... o Freddy fica bravo! 🐻",
  ];

  instructions.forEach((line, i) => {
    addLabel(line, k.vec2(620, 206 + i * 28), { size: 17 });
  });

  let starting = false;
  const startGame = () => {
    if (starting) return;
    starting = true;
    startMusic();
    playSfx("start");
    k.go("game", { level: 1, totalScore: 0, stars: [] });
  };

  addButton("INICIAR", k.vec2(620, 405), startGame, {
    width: 260,
    height: 58,
    size: 28,
  });

  const highScore = k.getData("highScore", 0);
  if (highScore > 0) {
    addLabel(`Recorde: ${highScore}`, k.vec2(620, 460), {
      size: 17,
      color: GRAY,
    });
  }

  k.onKeyPress("space", startGame);
  k.onKeyPress("enter", startGame);
});

// ==================== GAME SCENE ====================
k.scene("game", ({ level = 1, totalScore = 0, stars = [] } = {}) => {
  enterScene({ inGame: true });

  const levelConfig = LEVELS[level - 1];
  let score = 0;
  let combo = 0;
  let gameTime = levelConfig.maxTime;
  let completedRecipes = 0;
  let orders = [];
  let spawnTimer = 0;
  let nearestStation = null;
  let paused = false;
  let levelOver = false;
  let pauseLayer = null;

  // ==================== KITCHEN ====================
  k.add([
    k.z(0),
    {
      draw() {
        drawCheckerFloor(
          0,
          HUD_HEIGHT,
          KITCHEN_RIGHT,
          GAME_HEIGHT - HUD_HEIGHT,
        );

        // Balcão entre as estações de ingredientes e os fornos
        k.drawRect({
          pos: k.vec2(20, 200),
          width: KITCHEN_RIGHT - 40,
          height: 16,
          radius: 4,
          color: k.rgb(120, 66, 30),
          outline: { width: 2, color: INK },
        });
        k.drawRect({
          pos: k.vec2(22, 201),
          width: KITCHEN_RIGHT - 44,
          height: 4,
          color: k.rgb(170, 104, 56),
        });
      },
    },
  ]);

  k.add([
    k.z(150),
    {
      draw() {
        drawVignette(
          0,
          HUD_HEIGHT,
          KITCHEN_RIGHT,
          GAME_HEIGHT - HUD_HEIGHT,
          0.45,
        );
      },
    },
  ]);

  addLightFlicker({
    x: 0,
    y: HUD_HEIGHT,
    width: KITCHEN_RIGHT,
    height: GAME_HEIGHT - HUD_HEIGHT,
  });

  // ==================== STATIONS ====================
  const STATION_STYLES = {
    oven: { body: k.rgb(72, 72, 86), icon: "🔥" },
    delivery: { body: k.rgb(46, 104, 72), icon: "🍽️" },
    trash: { body: k.rgb(64, 64, 70), icon: "🗑️" },
  };

  function ovenStatus(oven) {
    if (!oven.item) return "empty";
    if (oven.item.burnt) return "burnt";
    return oven.elapsed < OVEN_COOK_TIME ? "cooking" : "done";
  }

  function drawOvenBar(oven) {
    const status = ovenStatus(oven);
    if (status === "empty") return;

    const width = 70;
    const pos = k.vec2(-width / 2, -STATION_SIZE / 2 - 14);
    k.drawRect({
      pos,
      width,
      height: 8,
      radius: 4,
      color: BLACK,
      opacity: 0.6,
    });

    if (status === "cooking") {
      k.drawRect({
        pos,
        width: width * (oven.elapsed / OVEN_COOK_TIME),
        height: 8,
        radius: 4,
        color: ORANGE,
      });
    } else if (status === "done") {
      const burnProgress = (oven.elapsed - OVEN_COOK_TIME) / OVEN_BURN_TIME;
      const blinking = burnProgress > 0.5 && Math.sin(k.time() * 18) > 0;
      k.drawRect({ pos, width, height: 8, radius: 4, color: GREEN });
      k.drawRect({
        pos,
        width: width * burnProgress,
        height: 8,
        radius: 4,
        color: blinking ? YELLOW : RED,
      });
    } else {
      k.drawRect({
        pos,
        width,
        height: 8,
        radius: 4,
        color: k.rgb(60, 60, 60),
      });
    }
  }

  function stationIcon(station) {
    if (station.oven) {
      const status = ovenStatus(station.oven);
      if (status === "done") return "🍕";
      if (status === "burnt") return "💨";
      return "🔥";
    }
    return (
      INGREDIENT_ICONS[station.stationType] ??
      STATION_STYLES[station.stationType].icon
    );
  }

  const stationObjects = STATIONS.map((s) =>
    k.add([
      k.pos(s.x, s.y),
      k.z(5),
      {
        stationType: s.type,
        name: s.name,
        oven: s.type === "oven" ? { item: null, elapsed: 0 } : null,
        highlighted: false,
        draw() {
          const half = STATION_SIZE / 2;
          const body =
            STATION_STYLES[this.stationType]?.body ?? k.rgb(122, 80, 48);

          k.drawRect({
            pos: k.vec2(0, 6),
            width: STATION_SIZE,
            height: STATION_SIZE,
            radius: 10,
            anchor: "center",
            color: BLACK,
            opacity: 0.35,
          });
          k.drawRect({
            width: STATION_SIZE,
            height: STATION_SIZE,
            radius: 10,
            anchor: "center",
            color: body,
            outline: this.highlighted
              ? { width: 4, color: YELLOW }
              : { width: 2, color: INK },
          });

          // Brilho do forno ligado
          if (this.oven && ovenStatus(this.oven) === "cooking") {
            k.drawCircle({
              pos: k.vec2(0, -8),
              radius: 26,
              color: ORANGE,
              opacity: 0.25 + Math.sin(k.time() * 8) * 0.1,
            });
          }

          const idleOven = this.oven && !this.oven.item;
          k.drawText({
            text: stationIcon(this),
            pos: k.vec2(0, -8),
            size: 36,
            font: "pixel-big",
            anchor: "center",
            opacity: idleOven ? 0.45 : 1,
          });

          k.drawRect({
            pos: k.vec2(0, half - 12),
            width: STATION_SIZE - 10,
            height: 18,
            radius: 5,
            anchor: "center",
            color: BLACK,
            opacity: 0.5,
          });
          k.drawText({
            text: this.name,
            pos: k.vec2(0, half - 12),
            size: 15,
            anchor: "center",
          });

          if (this.oven) drawOvenBar(this.oven);
        },
      },
    ]),
  );

  // ==================== PLAYER ====================
  const actionHint = isMobile ? "⚡" : "ESPAÇO";

  function heldItemLabel(item) {
    if (item.burnt) return "🍕💨";
    if (item.cooked) return "🍕✨";
    return item.ingredients.map((ing) => INGREDIENT_ICONS[ing]).join("");
  }

  const player = k.add([
    k.pos(345, 400),
    k.z(10),
    {
      heldItem: null,
      facing: 1,
      moving: false,
      draw() {
        const bob = this.moving ? -Math.abs(Math.sin(k.time() * 14)) * 2 : 0;
        drawFreddy({ facing: this.facing, bob });

        if (this.heldItem) {
          const label = k.formatText({
            text: heldItemLabel(this.heldItem),
            size: 16,
            pos: k.vec2(0, -56),
            anchor: "center",
          });
          k.drawRect({
            pos: k.vec2(0, -56),
            width: label.width + 14,
            height: 26,
            radius: 8,
            anchor: "center",
            color: BLACK,
            opacity: 0.65,
          });
          k.drawFormattedText(label);
        }

        if (nearestStation && !paused) {
          k.drawText({
            text: actionHint,
            pos: k.vec2(0, 38),
            size: 13,
            anchor: "center",
            color: YELLOW,
            opacity: Math.sin(k.time() * 5) * 0.4 + 0.6,
          });
        }
      },
    },
  ]);

  // ==================== HUD ====================
  k.add([
    k.z(100),
    {
      draw() {
        k.drawRect({
          width: GAME_WIDTH,
          height: HUD_HEIGHT,
          color: k.rgb(14, 12, 22),
        });
        k.drawRect({
          pos: k.vec2(0, HUD_HEIGHT - 3),
          width: GAME_WIDTH,
          height: 3,
          color: ORANGE,
        });
      },
    },
  ]);

  const addHudText = (text, x, color, anchor = "left", size = 18) =>
    k.add([
      k.text(text, { size }),
      k.pos(x, 21),
      k.anchor(anchor),
      k.color(color),
      k.scale(1),
      k.z(101),
    ]);

  const scoreText = addHudText("PONTOS: 0", 16, ORANGE);
  const comboText = addHudText("COMBO: 0x", 180, GREEN);
  const recipesText = addHudText("RECEITAS: 0", 300, BLUE);
  const starsText = addHudText(starRow(0), 430, WHITE);
  const timerText = addHudText("", 610, WHITE, "center", 22);
  addHudText(`NÍVEL ${level}/${LEVELS.length}`, 880, PURPLE, "right");

  const pauseButton = addButton(
    "⏸️",
    k.vec2(916, 22),
    () => setPaused(!paused),
    {
      width: 40,
      height: 32,
      size: 18,
      color: k.rgb(60, 54, 80),
    },
  );
  pauseButton.z = 150;

  function updateHud() {
    scoreText.text = `PONTOS: ${score}`;
    comboText.text = `COMBO: ${combo}x`;
    recipesText.text = `RECEITAS: ${completedRecipes}`;
    starsText.text = starRow(starsForRecipes(completedRecipes));

    const timeLeft = Math.max(0, Math.ceil(gameTime));
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    timerText.text = `⏱️ ${min}:${sec.toString().padStart(2, "0")}`;

    if (gameTime <= 30) {
      timerText.color = RED;
      timerText.scale = k.vec2(1 + Math.abs(Math.sin(k.time() * 4)) * 0.12);
    }
  }

  updateHud();

  // ==================== ORDERS ====================
  function generateOrder() {
    if (orders.length >= levelConfig.maxOrders) return;

    const recipe = k.choose(RECIPES);
    const time = Math.round(recipe.time * levelConfig.orderTimeFactor);
    orders.push({ recipe, timeLeft: time, maxTime: time });
  }

  generateOrder();

  k.add([
    k.z(50),
    {
      draw() {
        const panelX = KITCHEN_RIGHT + 10;
        const panelWidth = GAME_WIDTH - panelX - 10;
        const centerX = panelX + panelWidth / 2;

        k.drawRect({
          pos: k.vec2(panelX, HUD_HEIGHT + 6),
          width: panelWidth,
          height: GAME_HEIGHT - HUD_HEIGHT - 12,
          radius: 10,
          color: k.rgb(16, 14, 26),
          outline: { width: 2, color: ORANGE },
        });
        k.drawText({
          text: "PEDIDOS",
          pos: k.vec2(centerX, HUD_HEIGHT + 24),
          size: 18,
          anchor: "center",
          color: ORANGE,
        });

        if (orders.length === 0) {
          k.drawText({
            text: "Aguardando...",
            pos: k.vec2(centerX, 120),
            size: 15,
            anchor: "center",
            color: GRAY,
          });
        }

        orders.forEach((order, i) => {
          const x = panelX + 10;
          const y = 84 + i * 100;
          const width = panelWidth - 20;
          const progress = order.timeLeft / order.maxTime;
          const urgent = progress <= 0.25;
          const barColor =
            progress > 0.5 ? GREEN : progress > 0.25 ? YELLOW : RED;

          k.drawRect({
            pos: k.vec2(x, y),
            width,
            height: 92,
            radius: 8,
            color: k.rgb(36, 30, 50),
            outline: {
              width: 2,
              color:
                urgent && Math.sin(k.time() * 12) > 0
                  ? RED
                  : k.rgb(80, 72, 100),
            },
          });
          k.drawText({
            text: order.recipe.name,
            pos: k.vec2(centerX, y + 15),
            size: 17,
            anchor: "center",
          });
          k.drawText({
            text: order.recipe.ingredients
              .map((ing) => INGREDIENT_ICONS[ing])
              .join(""),
            pos: k.vec2(centerX, y + 40),
            size: 20,
            anchor: "center",
          });
          k.drawRect({
            pos: k.vec2(x + 12, y + 60),
            width: width - 24,
            height: 8,
            radius: 4,
            color: BLACK,
            opacity: 0.6,
          });
          k.drawRect({
            pos: k.vec2(x + 12, y + 60),
            width: (width - 24) * progress,
            height: 8,
            radius: 4,
            color: barColor,
          });
          k.drawText({
            text: `${Math.ceil(order.timeLeft)}s`,
            pos: k.vec2(centerX, y + 79),
            size: 14,
            anchor: "center",
            color: urgent ? RED : WHITE,
          });
        });
      },
    },
  ]);

  // ==================== INTERACTION ====================
  function findNearestStation() {
    let nearest = null;
    let minDist = INTERACT_RANGE;

    stationObjects.forEach((station) => {
      const dist = player.pos.dist(station.pos);
      if (dist < minDist) {
        minDist = dist;
        nearest = station;
      }
    });

    return nearest;
  }

  // Fica parado: subindo, invadiria o HUD (linha de cima) ou a barra do forno
  function stationFeedback(station, text, color, size = 15) {
    const offset = station.oven ? 32 : 14;
    showFeedback(text, station.pos.add(0, -STATION_SIZE / 2 - offset), {
      color,
      size,
      rise: false,
    });
  }

  function deliver(station) {
    const item = player.heldItem;

    if (!item) {
      stationFeedback(station, "SEM PIZZA!", RED);
      return;
    }
    if (item.burnt) {
      stationFeedback(station, "QUEIMADA! 🗑️", RED);
      return;
    }
    if (!item.cooked) {
      stationFeedback(station, "ASSE PRIMEIRO!", ORANGE);
      return;
    }

    const heldIng = [...item.ingredients].sort().join(",");
    const orderIndex = orders.findIndex(
      (order) => [...order.recipe.ingredients].sort().join(",") === heldIng,
    );

    if (orderIndex === -1) {
      combo = 0;
      updateHud();
      playSfx("error");
      k.shake(10);
      stationFeedback(station, "ERRADO!", RED, 20);
      return;
    }

    const pts = orders[orderIndex].recipe.points + combo * 10;
    const starsBefore = starsForRecipes(completedRecipes);
    score += pts;
    combo++;
    completedRecipes++;
    orders.splice(orderIndex, 1);
    player.heldItem = null;
    playSfx("interaction");
    updateHud();

    showFeedback(`+${pts}`, player.pos.add(0, -40), {
      color: GREEN,
      size: 24,
      duration: 1.3,
    });
    if (combo > 1) {
      showFeedback(`${combo}x COMBO!`, k.vec2(KITCHEN_RIGHT / 2, 250), {
        color: GREEN,
        size: 32,
        duration: 1,
      });
    }

    const starsNow = starsForRecipes(completedRecipes);
    if (starsNow > starsBefore) {
      playSfx("levelComplete");
      showFeedback(
        `${starRow(starsNow)} ESTRELA!`,
        k.vec2(KITCHEN_RIGHT / 2, 200),
        {
          color: YELLOW,
          size: 28,
          duration: 1.4,
        },
      );
    }
  }

  function useOven(station) {
    const oven = station.oven;
    const status = ovenStatus(oven);
    const item = player.heldItem;

    if (status === "empty") {
      if (!item) return;
      if (item.cooked || item.burnt) {
        stationFeedback(station, "JÁ ASSOU!", ORANGE);
        return;
      }
      if (item.ingredients.length < 2) {
        stationFeedback(station, "FALTA RECHEIO!", ORANGE);
        return;
      }

      oven.item = item;
      oven.elapsed = 0;
      player.heldItem = null;
      playSfx("interaction");
      stationFeedback(station, "🔥", ORANGE, 20);
      return;
    }

    if (status === "cooking") {
      stationFeedback(station, "⏱️ ASSANDO...", YELLOW);
      return;
    }

    if (item) {
      stationFeedback(station, "MÃOS CHEIAS!", ORANGE);
      return;
    }

    player.heldItem = oven.item;
    player.heldItem.cooked = status === "done";
    oven.item = null;
    playSfx("interaction");
    stationFeedback(
      station,
      status === "done" ? "✅" : "💨",
      status === "done" ? GREEN : GRAY,
      20,
    );
  }

  function addIngredient(station) {
    const type = station.stationType;
    const item = player.heldItem;

    if (!item) {
      if (type !== "dough") {
        stationFeedback(station, "MASSA PRIMEIRO!", ORANGE);
        return;
      }
      player.heldItem = { ingredients: ["dough"], cooked: false, burnt: false };
      playSfx("interaction");
      stationFeedback(station, "✓", GREEN, 20);
      return;
    }

    if (item.cooked || item.burnt) {
      stationFeedback(station, "JÁ ASSOU!", RED);
      return;
    }
    if (type === "dough") {
      stationFeedback(station, "JÁ TEM MASSA!", RED);
      return;
    }

    item.ingredients.push(type);
    playSfx("interaction");
    stationFeedback(station, "✓", GREEN, 20);
  }

  function interactWithStation(station) {
    switch (station.stationType) {
      case "trash":
        if (player.heldItem) {
          player.heldItem = null;
          playSfx("error");
          stationFeedback(station, "🗑️", GRAY, 20);
        }
        break;
      case "delivery":
        deliver(station);
        break;
      case "oven":
        useOven(station);
        break;
      default:
        addIngredient(station);
    }
  }

  function tryInteract() {
    if (paused || levelOver || !nearestStation) return;
    interactWithStation(nearestStation);

    k.add([
      k.circle(12),
      k.pos(player.pos),
      k.anchor("center"),
      k.color(YELLOW),
      k.opacity(0.8),
      k.lifespan(0.2, { fade: 0.2 }),
      k.z(200),
    ]);
  }

  // ==================== LEVEL END ====================
  // Precisa de pelo menos 1 estrela para passar de nível
  function endLevel() {
    levelOver = true;
    const levelStars = starsForRecipes(completedRecipes);

    if (levelStars === 0) {
      k.go("gameover", {
        level,
        score,
        completedRecipes,
        previousScore: totalScore,
        stars,
      });
      return;
    }

    showFeedback("⏰ FIM DE TURNO! ⏰", k.vec2(KITCHEN_RIGHT / 2, 250), {
      color: YELLOW,
      size: 32,
      duration: 1.2,
    });

    k.wait(1, () =>
      k.go("levelcomplete", {
        level,
        score,
        completedRecipes,
        totalScore: totalScore + score,
        stars: [...stars, levelStars],
      }),
    );
  }

  // ==================== PAUSE ====================
  function setPaused(value) {
    if (value === paused || levelOver) return;
    paused = value;

    if (!paused) {
      pauseLayer.destroy();
      pauseLayer = null;
      return;
    }

    pauseLayer = k.add([k.z(400)]);
    pauseLayer.add([
      k.rect(GAME_WIDTH, GAME_HEIGHT),
      k.color(BLACK),
      k.opacity(0.6),
    ]);
    addPanel(380, 280, k.vec2(GAME_WIDTH / 2, 250), pauseLayer);
    addLabel("PAUSADO", k.vec2(GAME_WIDTH / 2, 155), {
      size: 40,
      color: ORANGE,
      parent: pauseLayer,
    });
    addButton(
      "CONTINUAR",
      k.vec2(GAME_WIDTH / 2, 235),
      () => setPaused(false),
      {
        parent: pauseLayer,
      },
    );
    addButton("MENU", k.vec2(GAME_WIDTH / 2, 305), () => k.go("menu"), {
      color: k.rgb(90, 84, 120),
      parent: pauseLayer,
    });
    if (!isMobile) {
      addLabel("ESC - Continuar  ·  Q - Menu", k.vec2(GAME_WIDTH / 2, 362), {
        size: 15,
        color: GRAY,
        parent: pauseLayer,
      });
    }
  }

  activeGame = { setPaused };
  if (isMobile && isPortrait) setPaused(true);

  // ==================== INPUT ====================
  k.onKeyPress("space", tryInteract);
  k.onKeyPress(["escape", "p"], () => setPaused(!paused));
  k.onKeyPress("q", () => {
    if (paused) k.go("menu");
  });

  // ==================== UPDATE ====================
  k.onUpdate(() => {
    if (paused || levelOver) {
      player.moving = false;
      mobileInput.action = false;
      return;
    }

    const dt = k.dt();

    // Movimento (teclado + joystick), sem andar mais rápido na diagonal
    let dir = k.vec2(0, 0);
    if (k.isKeyDown("left") || k.isKeyDown("a")) dir.x -= 1;
    if (k.isKeyDown("right") || k.isKeyDown("d")) dir.x += 1;
    if (k.isKeyDown("up") || k.isKeyDown("w")) dir.y -= 1;
    if (k.isKeyDown("down") || k.isKeyDown("s")) dir.y += 1;
    dir = dir.add(mobileInput.x, mobileInput.y);
    if (dir.len() > 1) dir = dir.unit();

    player.moving = dir.len() > 0.1;
    if (Math.abs(dir.x) > 0.1) player.facing = Math.sign(dir.x);
    player.pos = player.pos.add(dir.scale(PLAYER_SPEED * dt));
    player.pos.x = k.clamp(player.pos.x, 30, KITCHEN_RIGHT - 20);
    player.pos.y = k.clamp(
      player.pos.y,
      HUD_HEIGHT + 40,
      GAME_HEIGHT - (isMobile ? 100 : 30),
    );

    nearestStation = findNearestStation();
    stationObjects.forEach((station) => {
      station.highlighted = station === nearestStation;
    });

    if (mobileInput.action) {
      mobileInput.action = false;
      tryInteract();
    }

    // Fornos
    stationObjects.forEach((station) => {
      const oven = station.oven;
      if (!oven?.item || oven.item.burnt) return;

      oven.elapsed += dt;
      if (oven.elapsed >= OVEN_COOK_TIME + OVEN_BURN_TIME) {
        oven.item.burnt = true;
        playSfx("error");
        stationFeedback(station, "QUEIMOU!", RED, 20);
      }
    });

    // Pedidos
    spawnTimer += dt;
    if (spawnTimer >= levelConfig.spawnInterval || orders.length === 0) {
      spawnTimer = 0;
      generateOrder();
    }

    for (let i = orders.length - 1; i >= 0; i--) {
      orders[i].timeLeft -= dt;

      if (orders[i].timeLeft <= 0) {
        orders.splice(i, 1);
        combo = 0;
        playSfx("error");
        k.shake(15);
        showFeedback("PEDIDO PERDIDO!", k.vec2(KITCHEN_RIGHT / 2, 250), {
          color: RED,
          size: 28,
          duration: 1.5,
        });
      }
    }

    // Tempo
    gameTime -= dt;
    updateHud();

    if (gameTime <= 0) endLevel();
  });
});

// ==================== LEVEL COMPLETE SCENE ====================
k.scene("levelcomplete", (data) => {
  enterScene({ inGame: false });
  addBackdrop();

  const isFinalLevel = data.level >= LEVELS.length;
  let transitioning = false;
  const goTo = (scene, args) => {
    if (transitioning) return;
    transitioning = true;
    k.go(scene, args);
  };

  if (!isFinalLevel) {
    playSfx("levelComplete");
    addPanel(560, 420, k.vec2(GAME_WIDTH / 2, 250));
    addLabel(`NÍVEL ${data.level} CONCLUÍDO!`, k.vec2(GAME_WIDTH / 2, 78), {
      size: 34,
      color: GREEN,
    });
    const levelStars = data.stars[data.stars.length - 1];
    addStars(levelStars, 140);

    addLabel(
      `Receitas entregues: ${data.completedRecipes}`,
      k.vec2(GAME_WIDTH / 2, 195),
      {
        size: 20,
        color: BLUE,
      },
    );
    addLabel(`Pontos do nível: ${data.score}`, k.vec2(GAME_WIDTH / 2, 228), {
      size: 20,
    });
    addLabel(`Total: ${data.totalScore}`, k.vec2(GAME_WIDTH / 2, 268), {
      size: 30,
      color: ORANGE,
    });

    if (levelStars < STAR_THRESHOLDS.length) {
      const missing = STAR_THRESHOLDS[levelStars] - data.completedRecipes;
      addLabel(
        `Faltou ${missing} receita${missing > 1 ? "s" : ""} para ${starRow(levelStars + 1)}`,
        k.vec2(GAME_WIDTH / 2, 305),
        { size: 16 },
      );
    }

    const nextLevel = {
      level: data.level + 1,
      totalScore: data.totalScore,
      stars: data.stars,
    };
    const goNextLevel = () => goTo("game", nextLevel);

    let countdown = 8;
    const nextButton = addButton(
      `NÍVEL ${data.level + 1} (${countdown})`,
      k.vec2(GAME_WIDTH / 2, 360),
      goNextLevel,
      { width: 280 },
    );
    k.loop(1, () => {
      countdown--;
      nextButton.label.text = `NÍVEL ${data.level + 1} (${countdown})`;
      if (countdown <= 0) goNextLevel();
    });

    if (!isMobile) {
      addLabel(
        "ESPAÇO - Continuar  ·  ESC - Menu",
        k.vec2(GAME_WIDTH / 2, 425),
        {
          size: 15,
          color: GRAY,
        },
      );
    }

    k.onKeyPress("space", goNextLevel);
    k.onKeyPress("enter", goNextLevel);
    k.onKeyPress("escape", () => goTo("menu"));
    return;
  }

  // Completou todos os níveis!
  playSfx("victory");
  const CONFETTI_COLORS = [ORANGE, GREEN, RED, YELLOW, BLUE, PURPLE];
  k.loop(0.06, () => {
    k.add([
      k.rect(8, 12),
      k.pos(k.rand(0, GAME_WIDTH), -10),
      k.anchor("center"),
      k.color(k.choose(CONFETTI_COLORS)),
      k.rotate(k.rand(0, 360)),
      k.move(k.vec2(k.rand(-0.3, 0.3), 1), k.rand(120, 220)),
      k.opacity(1),
      k.lifespan(4),
      k.z(5),
      {
        spin: k.rand(-360, 360),
        update() {
          this.angle += this.spin * k.dt();
        },
      },
    ]);
  });

  addPanel(600, 440, k.vec2(GAME_WIDTH / 2, 250));
  addLabel("🏆 VOCÊ VENCEU! 🏆", k.vec2(GAME_WIDTH / 2, 70), {
    size: 40,
    color: YELLOW,
  });
  addLabel("Todos os níveis concluídos", k.vec2(GAME_WIDTH / 2, 112), {
    size: 20,
  });

  data.stars.forEach((count, i) => {
    addLabel(
      `Nível ${i + 1}  ${starRow(count)}`,
      k.vec2(GAME_WIDTH / 2, 152 + i * 32),
      {
        size: 20,
      },
    );
  });

  const earnedStars = data.stars.reduce((sum, count) => sum + count, 0);
  const maxStars = LEVELS.length * STAR_THRESHOLDS.length;
  addLabel(
    `Estrelas: ${earnedStars}/${maxStars}`,
    k.vec2(GAME_WIDTH / 2, 260),
    {
      size: 18,
      color: YELLOW,
    },
  );
  addLabel(`Pontuação Total: ${data.totalScore}`, k.vec2(GAME_WIDTH / 2, 298), {
    size: 32,
    color: ORANGE,
  });

  const { highScore, isNew } = saveHighScore(data.totalScore);
  addLabel(
    isNew ? "🎉 NOVO RECORDE! 🎉" : `Recorde: ${highScore}`,
    k.vec2(GAME_WIDTH / 2, 338),
    {
      size: 20,
      color: isNew ? WHITE : GRAY,
    },
  );

  const goMenu = () => goTo("menu");
  addButton("MENU", k.vec2(GAME_WIDTH / 2, 400), goMenu);

  k.onKeyPress("space", goMenu);
  k.onKeyPress("enter", goMenu);
  k.onKeyPress("escape", goMenu);
});

// ==================== GAME OVER SCENE (with jumpscare) ====================
k.scene("gameover", (data) => {
  enterScene({ inGame: false });
  playSfx("error");
  playScreech();

  // ---- JUMPSCARE PHASE ----
  const jumpscare = k.add([k.z(500)]);
  jumpscare.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.color(BLACK)]);

  const face = jumpscare.add([
    k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2),
    k.scale(2),
    {
      draw() {
        drawFreddy({ scary: true, bob: Math.sin(k.time() * 50) * 0.4 });
      },
    },
  ]);

  // Cresce para cima da tela, mantendo o rosto no centro
  k.tween(
    2,
    10,
    0.3,
    (s) => {
      face.scale = k.vec2(s);
      face.pos = k.vec2(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15 * s);
    },
    k.easings.easeOutQuad,
  );

  k.flash(RED, 0.4);
  k.shake(40);

  k.wait(0.5, () => {
    jumpscare.add([
      k.text("GAME OVER", { size: 64, font: "pixel-big" }),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT - 60),
      k.anchor("center"),
      k.color(RED),
    ]);
  });

  // After 1.6 seconds, remove jumpscare and show results
  k.wait(1.6, () => {
    jumpscare.destroy();
    showGameOverResults(data);
  });
});

function showGameOverResults(data) {
  addBackdrop({ dim: 0.6 });
  addPanel(560, 400, k.vec2(GAME_WIDTH / 2, 250));

  addLabel("⏰ TEMPO ESGOTADO! ⏰", k.vec2(GAME_WIDTH / 2, 90), {
    size: 34,
    color: RED,
  });
  addLabel(`NÍVEL ${data.level}`, k.vec2(GAME_WIDTH / 2, 140), {
    size: 22,
    color: PURPLE,
  });
  addLabel(
    `Receitas: ${data.completedRecipes}  ·  precisa de ${STAR_THRESHOLDS[0]} para ⭐`,
    k.vec2(GAME_WIDTH / 2, 178),
    { size: 20 },
  );

  const runScore = data.previousScore + data.score;
  addLabel(`Pontuação: ${runScore}`, k.vec2(GAME_WIDTH / 2, 222), {
    size: 28,
    color: ORANGE,
  });

  const { highScore, isNew } = saveHighScore(runScore);
  addLabel(
    isNew ? "🎉 RECORDE! 🎉" : `Recorde: ${highScore}`,
    k.vec2(GAME_WIDTH / 2, 262),
    {
      size: 20,
      color: isNew ? WHITE : GRAY,
    },
  );

  let transitioning = false;
  const goTo = (scene, args) => {
    if (transitioning) return;
    transitioning = true;
    k.go(scene, args);
  };

  const retryLevel = () =>
    goTo("game", {
      level: data.level,
      totalScore: data.previousScore,
      stars: data.stars,
    });
  const goMenu = () => goTo("menu");

  addButton("TENTAR DE NOVO", k.vec2(GAME_WIDTH / 2 - 125, 340), retryLevel, {
    width: 230,
  });
  addButton("MENU", k.vec2(GAME_WIDTH / 2 + 125, 340), goMenu, {
    width: 200,
    color: k.rgb(90, 84, 120),
  });

  if (!isMobile) {
    addLabel("ESPAÇO - Repetir  ·  ESC - Menu", k.vec2(GAME_WIDTH / 2, 405), {
      size: 15,
      color: GRAY,
    });
  }

  k.onKeyPress("space", retryLevel);
  k.onKeyPress("enter", retryLevel);
  k.onKeyPress("escape", goMenu);
}

// ==================== START ====================
updateOrientation();
k.go("menu");
