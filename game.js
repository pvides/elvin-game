const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const playerBar = document.getElementById("playerBar");
const blobBar = document.getElementById("blobBar");
const playerHpText = document.getElementById("playerHpText");
const blobHpText = document.getElementById("blobHpText");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");
const arrowChoice = document.getElementById("arrowChoice");
const fireChoiceBtn = document.getElementById("fireChoiceBtn");
const iceChoiceBtn = document.getElementById("iceChoiceBtn");
const quiverRow = document.getElementById("quiverRow");
const fireArrowCountEl = document.getElementById("fireArrowCount");
const iceArrowCountEl = document.getElementById("iceArrowCount");
const electricArrowCountEl = document.getElementById("electricArrowCount");
const rupeeCountEl = document.getElementById("rupeeCount");
const finalArrowChoiceEl = document.getElementById("finalArrowChoice");
const finalFireBtn = document.getElementById("finalFireBtn");
const finalIceBtn = document.getElementById("finalIceBtn");
const finalElectricBtn = document.getElementById("finalElectricBtn");
const shopPanelEl = document.getElementById("shopPanel");
const shopRupeeDisplay = document.getElementById("shopRupeeDisplay");
const shopHealBtn = document.getElementById("shopHealBtn");
const shopArrowBtn = document.getElementById("shopArrowBtn");
const shopShieldBtn = document.getElementById("shopShieldBtn");
const shopIceArrowBtn = document.getElementById("shopIceArrowBtn");
const shopFireArrowBtn = document.getElementById("shopFireArrowBtn");
const shopElectricArrowBtn = document.getElementById("shopElectricArrowBtn");
const shopDoubleBowBtn = document.getElementById("shopDoubleBowBtn");
const shopCheckpointBtn = document.getElementById("shopCheckpointBtn");
const shopLeaveBtn = document.getElementById("shopLeaveBtn");

const keys = new Set();

const world = {
  width: canvas.width,
  height: canvas.height,
};

const gridSize = 32;
const jumpHeight = gridSize * 4;
const gravity = 1300;
const airCarryMultiplier = 1.3;
const miniBlobMaxRise = gridSize * 3;
const platformTopY = world.height - 102;
const playerGroundY = world.height - 120;
const blobGroundY = world.height - 135;

const player = {
  x: 120,
  y: playerGroundY,
  radius: 18,
  hp: 100,
  maxHp: 100,
  speed: 340,
  facing: 1,
  attackCooldown: 0,
  dashCooldown: 0,
  dashTimer: 0,
  invuln: 0,
  frozenTimer: 0,
  attackLockTimer: 0,
  vy: 0,
  jumpPeakY: playerGroundY,
};

const blob = {
  x: world.width - 170,
  y: blobGroundY,
  bodyRadius: 55,
  hp: 220,
  maxHp: 220,
  speed: 115,
  attackCooldown: 0,
  slowTimer: 0,
  stunTimer: 0,
  element: "fire",
};

const blueBlob = {
  x: world.width - 170,
  y: blobGroundY,
  bodyRadius: 50,
  hp: 170,
  maxHp: 170,
  speed: 145,
  attackCooldown: 0,
  iceBallCooldown: 4,
  slowTimer: 0,
  stunTimer: 0,
  element: "ice",
};

const redBlob = {
  x: world.width - 170,
  y: blobGroundY,
  bodyRadius: 52,
  hp: 200,
  maxHp: 200,
  speed: 155,
  attackCooldown: 0,
  chargeAttackCooldown: 4,
  slowTimer: 0,
  stunTimer: 0,
  element: "fire",
};

const miniBlobConfig = {
  bodyRadius: 32,
  maxHp: 70,
  speed: 230,
};

let particles = [];
let arrows = [];
let iceBalls = [];
let miniBlobs = [];
let blueMiniBlobs = [];
let redMiniBlobs = [];
let splitPhase = false;
let blueSplitPhase = false;
let redSplitPhase = false;
let awaitingArrowChoice = false;
let unlockedArrowType = null;
let fireArrowCount = 0;
let iceArrowCount = 0;
let electricArrowCount = 0;
let rupees = 0;
let bluePhase = false;
let redPhase = false;
let hasFreezeShield = false;
let hasDoubleBow = false;
let hasBoughtRandomArrow = false;
let hasVisitedShopThisRun = false;
let finalRewardChosen = false;
let shopCheckpoint = null;
let placedCheckpoints = [];
let gameOver = false;
let winner = "";
let lastTime = 0;
const SAVE_STORAGE_KEY = "blob.saves.v1";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deepClone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function getActiveBlobs() {
  if (blueSplitPhase) {
    return blueMiniBlobs;
  }

  if (redSplitPhase) {
    return redMiniBlobs;
  }

  if (redPhase) {
    return [redBlob];
  }

  if (bluePhase) {
    return [blueBlob];
  }

  return splitPhase ? miniBlobs : [blob];
}

function createMiniBlob(x, y, element = "fire") {
  const angle = Math.random() * Math.PI * 2;
  const speed = miniBlobConfig.speed * (0.85 + Math.random() * 0.3);

  return {
    x,
    y,
    bodyRadius: miniBlobConfig.bodyRadius,
    hp: miniBlobConfig.maxHp,
    maxHp: miniBlobConfig.maxHp,
    speed: speed,
    attackCooldown: 0.45 + Math.random() * 0.6,
    slowTimer: 0,
    stunTimer: 0,
    element,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed * 0.75,
    directionTimer: 0.55 + Math.random() * 0.9,
  };
}

function spawnMiniBlobs() {
  splitPhase = true;
  miniBlobs = [
    createMiniBlob(blob.x - 45, blob.y - 18, "fire"),
    createMiniBlob(blob.x + 45, blob.y - 18, "fire"),
  ];

  spawnSparks(blob.x, blob.y, "#ff9d3f", 34, 300);
}

function spawnBlueMiniBlobs() {
  blueSplitPhase = true;
  blueMiniBlobs = [
    createMiniBlob(blueBlob.x - 42, blueBlob.y - 18, "ice"),
    createMiniBlob(blueBlob.x + 42, blueBlob.y - 18, "ice"),
  ];

  spawnSparks(blueBlob.x, blueBlob.y, "#7ec8ff", 34, 300);
}

function spawnRedMiniBlobs() {
  redSplitPhase = true;
  redMiniBlobs = [
    createMiniBlob(redBlob.x - 42, redBlob.y - 18, "fire"),
    createMiniBlob(redBlob.x + 42, redBlob.y - 18, "fire"),
  ];
  redMiniBlobs[0].variant = "red";
  redMiniBlobs[1].variant = "red";

  spawnSparks(redBlob.x, redBlob.y, "#ff4b4b", 34, 300);
}

function promptArrowChoice() {
  awaitingArrowChoice = true;
  gameOver = true;
  message.textContent = "You defeated the orange blobs. Choose your new arrow power.";
  message.classList.remove("hidden");
  arrowChoice.classList.remove("hidden");
  restartBtn.classList.add("hidden");
}

function chooseArrow(type) {
  unlockedArrowType = type;
  awaitingArrowChoice = false;
  arrowChoice.classList.add("hidden");

  if (type === "fire") {
    fireArrowCount = 1;
    iceArrowCount = 0;
  } else {
    iceArrowCount = 1;
    fireArrowCount = 0;
  }

  updateQuiver();
  startBlueBlobBattle();
}

function startBlueBlobBattle() {
  gameOver = false;
  splitPhase = false;
  bluePhase = true;
  blueSplitPhase = false;
  miniBlobs = [];
  blueMiniBlobs = [];

  blueBlob.x = world.width - 170;
  blueBlob.y = blobGroundY;
  blueBlob.hp = blueBlob.maxHp;
  blueBlob.attackCooldown = 0;
  blueBlob.iceBallCooldown = 4;
  blueBlob.slowTimer = 0;
  blueBlob.stunTimer = 0;

  player.hp = player.maxHp;
  player.invuln = 0;
  player.frozenTimer = 0;

  message.classList.add("hidden");
  restartBtn.classList.add("hidden");
  iceBalls = [];
  spawnSparks(blueBlob.x, blueBlob.y, "#7ec8ff", 32, 280);
}

function promptFinalArrowChoice() {
  gameOver = true;
  message.textContent = "You defeated all blobs! Choose your final arrow reward.";
  message.classList.remove("hidden");
  finalArrowChoiceEl.classList.remove("hidden");
  restartBtn.classList.add("hidden");
}

function chooseFinalArrow(type) {
  finalArrowChoiceEl.classList.add("hidden");
  if (type === "fire") {
    fireArrowCount = 1;
    unlockedArrowType = "fire";
  } else if (type === "ice") {
    iceArrowCount = 1;
    unlockedArrowType = "ice";
  } else {
    electricArrowCount = 1;
    unlockedArrowType = "electric";
  }
  finalRewardChosen = true;
  updateQuiver();
  openShop();
}

function clearPersistedSaves() {
  try {
    window.localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch (_) {
    // Ignore storage errors so gameplay keeps working.
  }
}

function persistSaves() {
  try {
    const payload = {
      shopCheckpoint,
      placedCheckpoints,
    };
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {
    // Ignore storage errors so gameplay keeps working.
  }
}

function loadPersistedSaves() {
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;

    shopCheckpoint = parsed.shopCheckpoint ? deepClone(parsed.shopCheckpoint) : null;
    placedCheckpoints = Array.isArray(parsed.placedCheckpoints)
      ? deepClone(parsed.placedCheckpoints)
      : [];
  } catch (_) {
    clearPersistedSaves();
    shopCheckpoint = null;
    placedCheckpoints = [];
  }
}

function resetGame(clearSaves = true) {
  player.x = 120;
  player.y = playerGroundY;
  player.hp = player.maxHp;
  player.attackCooldown = 0;
  player.dashCooldown = 0;
  player.dashTimer = 0;
  player.invuln = 0;
  player.facing = 1;
  player.vy = 0;
  player.jumpPeakY = playerGroundY;
  player.frozenTimer = 0;
  player.attackLockTimer = 0;

  blob.x = world.width - 170;
  blob.y = blobGroundY;
  blob.hp = blob.maxHp;
  blob.attackCooldown = 0;
  blob.slowTimer = 0;
  blob.stunTimer = 0;

  blueBlob.x = world.width - 170;
  blueBlob.y = blobGroundY;
  blueBlob.hp = blueBlob.maxHp;
  blueBlob.attackCooldown = 0;
  blueBlob.iceBallCooldown = 4;
  blueBlob.slowTimer = 0;
  blueBlob.stunTimer = 0;

  redBlob.x = world.width - 170;
  redBlob.y = blobGroundY;
  redBlob.hp = redBlob.maxHp;
  redBlob.attackCooldown = 0;
  redBlob.chargeAttackCooldown = 4;
  redBlob.slowTimer = 0;
  redBlob.stunTimer = 0;

  particles = [];
  arrows = [];
  iceBalls = [];
  miniBlobs = [];
  blueMiniBlobs = [];
  redMiniBlobs = [];
  splitPhase = false;
  blueSplitPhase = false;
  redSplitPhase = false;
  awaitingArrowChoice = false;
  unlockedArrowType = null;
  fireArrowCount = 0;
  iceArrowCount = 0;
  electricArrowCount = 0;
  rupees = 0;
  bluePhase = false;
  redPhase = false;
  hasFreezeShield = false;
  hasDoubleBow = false;
  hasBoughtRandomArrow = false;
  hasVisitedShopThisRun = false;
  finalRewardChosen = false;
  shopCheckpoint = null;
  placedCheckpoints = [];
  if (clearSaves) clearPersistedSaves();
  gameOver = false;
  winner = "";
  message.classList.add("hidden");
  arrowChoice.classList.add("hidden");
  finalArrowChoiceEl.classList.add("hidden");
  shopPanelEl.classList.add("hidden");
  restartBtn.classList.add("hidden");
  quiverRow.classList.add("hidden");
  updateHud();
}

function createCheckpointSnapshot() {
  return {
    player: deepClone(player),
    blob: deepClone(blob),
    blueBlob: deepClone(blueBlob),
    redBlob: deepClone(redBlob),
    miniBlobs: deepClone(miniBlobs),
    blueMiniBlobs: deepClone(blueMiniBlobs),
    redMiniBlobs: deepClone(redMiniBlobs),
    arrows: deepClone(arrows),
    iceBalls: deepClone(iceBalls),
    particles: deepClone(particles),
    splitPhase,
    blueSplitPhase,
    redSplitPhase,
    bluePhase,
    redPhase,
    awaitingArrowChoice,
    unlockedArrowType,
    fireArrowCount,
    iceArrowCount,
    electricArrowCount,
    rupees,
    hasFreezeShield,
    hasDoubleBow,
    hasBoughtRandomArrow,
    hasVisitedShopThisRun,
    finalRewardChosen,
  };
}

function saveCheckpointAtShop() {
  shopCheckpoint = createCheckpointSnapshot();
  persistSaves();
}

function restoreCheckpoint(checkpoint, options = {}) {
  if (!checkpoint) return false;

  const { openShopPanel = false } = options;

  Object.assign(player, deepClone(checkpoint.player));
  Object.assign(blob, deepClone(checkpoint.blob));
  Object.assign(blueBlob, deepClone(checkpoint.blueBlob));
  Object.assign(redBlob, deepClone(checkpoint.redBlob));

  miniBlobs = deepClone(checkpoint.miniBlobs);
  blueMiniBlobs = deepClone(checkpoint.blueMiniBlobs);
  redMiniBlobs = deepClone(checkpoint.redMiniBlobs || []);
  arrows = deepClone(checkpoint.arrows);
  iceBalls = deepClone(checkpoint.iceBalls);
  particles = deepClone(checkpoint.particles);

  splitPhase = checkpoint.splitPhase;
  blueSplitPhase = checkpoint.blueSplitPhase;
  redSplitPhase = checkpoint.redSplitPhase || false;
  bluePhase = checkpoint.bluePhase;
  redPhase = checkpoint.redPhase;
  awaitingArrowChoice = checkpoint.awaitingArrowChoice;
  unlockedArrowType = checkpoint.unlockedArrowType;
  fireArrowCount = checkpoint.fireArrowCount;
  iceArrowCount = checkpoint.iceArrowCount;
  electricArrowCount = checkpoint.electricArrowCount;
  rupees = checkpoint.rupees;
  hasFreezeShield = checkpoint.hasFreezeShield;
  hasDoubleBow = checkpoint.hasDoubleBow;
  hasBoughtRandomArrow = checkpoint.hasBoughtRandomArrow;
  hasVisitedShopThisRun = checkpoint.hasVisitedShopThisRun;
  finalRewardChosen = checkpoint.finalRewardChosen;

  gameOver = openShopPanel;
  winner = "";
  message.classList.add("hidden");
  arrowChoice.classList.add("hidden");
  finalArrowChoiceEl.classList.add("hidden");
  if (openShopPanel) {
    shopPanelEl.classList.remove("hidden");
    updateShopButtons();
  } else {
    shopPanelEl.classList.add("hidden");
  }
  restartBtn.classList.add("hidden");
  updateQuiver();
  updateHud();
  return true;
}

function placePlacedCheckpoint() {
  placedCheckpoints.push(createCheckpointSnapshot());
  persistSaves();
}

function formatCheckpointItems(checkpoint) {
  const itemParts = [];
  if (checkpoint.fireArrowCount > 0) itemParts.push(`F:${checkpoint.fireArrowCount}`);
  if (checkpoint.iceArrowCount > 0) itemParts.push(`I:${checkpoint.iceArrowCount}`);
  if (checkpoint.electricArrowCount > 0) itemParts.push(`E:${checkpoint.electricArrowCount}`);
  if (checkpoint.hasFreezeShield) itemParts.push("Shield");
  if (checkpoint.hasDoubleBow) itemParts.push("DoubleBow");
  if (!itemParts.length) itemParts.push("None");
  return itemParts.join(", ");
}

function chooseAndRestorePlacedCheckpoint(options = {}) {
  const { preserveCurrentRupees = false } = options;
  if (!placedCheckpoints.length) {
    window.alert("No placed checkpoints. Buy one at the shop for 25 💎.");
    return false;
  }

  const checkpointList = placedCheckpoints
    .map((cp, i) => `${i + 1}: HP ${Math.round(cp.player.hp)} | 💎 ${cp.rupees} | Items ${formatCheckpointItems(cp)}`)
    .join("\n");
  const input = window.prompt(`Choose placed checkpoint:\n${checkpointList}`);
  if (input === null) return false;

  const index = Number.parseInt(input, 10) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= placedCheckpoints.length) {
    window.alert("Invalid checkpoint choice.");
    return false;
  }

  const rupeesBeforeRestore = rupees;
  const restored = restoreCheckpoint(placedCheckpoints[index]);
  if (restored && preserveCurrentRupees) {
    rupees = Math.max(rupees, rupeesBeforeRestore);
    updateHud();
  }
  return restored;
}

function chooseAnySaveAndRestore() {
  const entries = [];
  if (shopCheckpoint) {
    entries.push({
      label: `Shop: HP ${Math.round(shopCheckpoint.player.hp)} | 💎 ${shopCheckpoint.rupees} | Items ${formatCheckpointItems(shopCheckpoint)}`,
      checkpoint: shopCheckpoint,
      openShopPanel: true,
    });
  }

  placedCheckpoints.forEach((cp, i) => {
    entries.push({
      label: `Placed ${i + 1}: HP ${Math.round(cp.player.hp)} | 💎 ${cp.rupees} | Items ${formatCheckpointItems(cp)}`,
      checkpoint: cp,
      openShopPanel: false,
    });
  });

  if (!entries.length) {
    window.alert("No saves available yet.");
    return false;
  }

  const menu = entries.map((entry, i) => `${i + 1}: ${entry.label}`).join("\n");
  const input = window.prompt(`Choose save to restore:\n${menu}`);
  if (input === null) return false;

  const index = Number.parseInt(input, 10) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
    window.alert("Invalid save choice.");
    return false;
  }

  const selected = entries[index];
  return restoreCheckpoint(selected.checkpoint, { openShopPanel: selected.openShopPanel });
}

function chooseVictoryTeleport() {
  const choices = [];
  if (shopCheckpoint) choices.push("1: Teleport to shop checkpoint");
  if (placedCheckpoints.length) choices.push("2: Choose a placed checkpoint");

  if (!choices.length) return false;

  const input = window.prompt(`Victory! Teleport somewhere?\n${choices.join("\n")}\nAny other key to skip.`);
  if (input === null) return false;

  const pick = Number.parseInt(input, 10);
  if (pick === 1 && shopCheckpoint) {
    const rupeesBeforeRestore = rupees;
    const restored = restoreCheckpoint(shopCheckpoint, { openShopPanel: true });
    if (restored) {
      rupees = Math.max(rupees, rupeesBeforeRestore);
      updateHud();
      updateShopButtons();
    }
    return restored;
  }
  if (pick === 2 && placedCheckpoints.length) {
    return chooseAndRestorePlacedCheckpoint({ preserveCurrentRupees: true });
  }
  return false;
}

function updateHud() {
  const activeBlobs = getActiveBlobs();
  const blobHp = activeBlobs.reduce((sum, enemy) => sum + Math.max(0, enemy.hp), 0);
  const blobMaxHp = activeBlobs.reduce((sum, enemy) => sum + enemy.maxHp, 0);

  const playerPercent = (player.hp / player.maxHp) * 100;
  const blobPercent = blobMaxHp > 0 ? (blobHp / blobMaxHp) * 100 : 0;

  playerBar.style.width = `${playerPercent}%`;
  blobBar.style.width = `${blobPercent}%`;
  playerHpText.textContent = `${Math.max(0, Math.round(player.hp))} / ${player.maxHp}`;
  blobHpText.textContent = `${Math.max(0, Math.round(blobHp))} / ${Math.round(blobMaxHp)}`;
  rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
}

function endGame(text) {
  gameOver = true;
  winner = text;
  message.textContent = text;
  message.classList.remove("hidden");
  arrowChoice.classList.add("hidden");
  finalArrowChoiceEl.classList.add("hidden");
  shopPanelEl.classList.add("hidden");
  restartBtn.classList.remove("hidden");
}

function openShop() {
  hasVisitedShopThisRun = true;
  gameOver = true;
  saveCheckpointAtShop();
  shopPanelEl.classList.remove("hidden");
  message.classList.add("hidden");
  restartBtn.classList.add("hidden");
  updateShopButtons();
}

function updateShopButtons() {
  shopRupeeDisplay.textContent = rupees;
  shopHealBtn.disabled = rupees < 4 || player.hp >= player.maxHp;
  shopArrowBtn.disabled = rupees < 5 || unlockedArrowType === null || hasBoughtRandomArrow;
  shopShieldBtn.disabled = rupees < 7 || hasFreezeShield;
  shopIceArrowBtn.disabled = rupees < 6;
  shopFireArrowBtn.disabled = rupees < 6;
  shopElectricArrowBtn.disabled = rupees < 8;
  shopDoubleBowBtn.disabled = rupees < 65 || hasDoubleBow;
  if (shopCheckpointBtn) shopCheckpointBtn.disabled = rupees < 25;
}


function updateQuiver() {
  if (unlockedArrowType === null) {
    quiverRow.classList.add("hidden");
    return;
  }
  quiverRow.classList.remove("hidden");
  fireArrowCountEl.textContent = `🔥 ${fireArrowCount}`;
  iceArrowCountEl.textContent = `❄️ ${iceArrowCount}`;
  electricArrowCountEl.textContent = `⚡ ${electricArrowCount}`;
}

function getElementalArrowCount(type) {
  if (type === "fire") return fireArrowCount;
  if (type === "ice") return iceArrowCount;
  return electricArrowCount;
}

function addElementalArrow(type) {
  if (type === "fire") fireArrowCount += 1;
  else if (type === "ice") iceArrowCount += 1;
  else electricArrowCount += 1;
}

function addPreferredOrRandomArrow(type) {
  if (getElementalArrowCount(type) > 0) {
    const types = ["fire", "ice", "electric"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    addElementalArrow(randomType);
    return;
  }
  addElementalArrow(type);
}

function spawnSparks(x, y, color, amount = 12, power = 220) {
  for (let i = 0; i < amount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = power * (0.35 + Math.random() * 0.65);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.35,
      size: 2 + Math.random() * 4,
      color,
    });
  }
}

function handleInput(dt) {
  if (player.frozenTimer > 0) return;

  let dx = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;

  if (dx !== 0) player.facing = dx;

  let moveSpeed = player.speed;
  if (player.y < playerGroundY - 0.5) moveSpeed *= airCarryMultiplier;
  if (player.dashTimer > 0) moveSpeed *= 2.2;

  player.x += dx * moveSpeed * dt;
  player.x = clamp(player.x, player.radius, world.width - player.radius);

  player.vy += gravity * dt;
  player.y += player.vy * dt;

  if (player.y >= playerGroundY) {
    player.y = playerGroundY;
    player.vy = 0;
    player.jumpPeakY = playerGroundY;
  }
  if (player.y < player.jumpPeakY) player.jumpPeakY = player.y;
}

function jump() {
  if (player.frozenTimer > 0) return;
  if (player.y >= playerGroundY - 0.5) {
    player.vy = -Math.sqrt(2 * gravity * jumpHeight);
    player.jumpPeakY = player.y;
  }
}

function dash() {
  if (player.frozenTimer > 0 || player.dashCooldown > 0) return;
  player.dashTimer = 0.18;
  player.dashCooldown = 0.8;
  player.invuln = Math.max(player.invuln, 0.22);
  spawnSparks(player.x, player.y, "#c8ffd0", 8, 180);
}

function fireArrow(type) {
  if (player.attackCooldown > 0 || player.attackLockTimer > 0) return;

  let arrowColor = "#e8d060";
  let damage = 8 + Math.random() * 5;

  if (type === "fire") {
    if (fireArrowCount <= 0) return;
    fireArrowCount -= 1;
    arrowColor = "#ff6a00";
    damage = 10 + Math.random() * 5;
    updateQuiver();
  } else if (type === "ice") {
    if (iceArrowCount <= 0) return;
    iceArrowCount -= 1;
    arrowColor = "#5ad4ff";
    damage = 10 + Math.random() * 5;
    updateQuiver();
  } else if (type === "electric") {
    if (electricArrowCount <= 0) return;
    electricArrowCount -= 1;
    arrowColor = "#c0ff40";
    damage = 12 + Math.random() * 5;
    updateQuiver();
  }

  const speed = 900;
  const shotOffsets = hasDoubleBow ? [-7, 7] : [0];
  for (const yOffset of shotOffsets) {
    arrows.push({
      x: player.x + player.facing * player.radius,
      y: player.y - 6 + yOffset,
      vx: player.facing * speed,
      vy: 0,
      radius: 6,
      damage,
      type,
      color: arrowColor,
      life: 1.4,
    });
  }

  player.attackCooldown = 0.35;
  spawnSparks(player.x + player.facing * 28, player.y - 6, arrowColor, 5, 90);
}

function applyArrowDamage(arrow, enemy) {
  const isSmall = enemy.bodyRadius <= miniBlobConfig.bodyRadius;
  const isSmallRedBlob = isSmall && enemy.element === "fire";
  const isFireStrong = arrow.type === "fire" && enemy.element === "ice";
  const isIceStrong = arrow.type === "ice" && enemy.element === "fire";
  const isIceStrongVsRed = arrow.type === "ice" && enemy === redBlob;
  const isElectric = arrow.type === "electric";

  if (arrow.type === "ice" && isSmallRedBlob) {
    enemy.hp = 0;
    return;
  }

  if ((isFireStrong || isIceStrong) && isSmall) {
    enemy.hp = 0;
    return;
  }
  let dmg = arrow.damage;
  if (isFireStrong || isIceStrong || isIceStrongVsRed) dmg *= 3;
  if (isElectric) enemy.stunTimer = 2;
  enemy.hp -= dmg;
}

function updateArrows(dt) {
  const enemies = [
    ...(!splitPhase && !bluePhase && !blueSplitPhase && !redPhase && !redSplitPhase ? [blob] : []),
    ...(splitPhase && !bluePhase ? miniBlobs : []),
    ...(bluePhase && !blueSplitPhase ? [blueBlob] : []),
    ...(blueSplitPhase ? blueMiniBlobs : []),
    ...(redPhase ? [redBlob] : []),
    ...(redSplitPhase ? redMiniBlobs : []),
  ];

  arrows = arrows.filter((arrow) => {
    arrow.x += arrow.vx * dt;
    arrow.y += arrow.vy * dt;
    arrow.life -= dt;
    if (arrow.life <= 0 || arrow.x < 0 || arrow.x > world.width) return false;

    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const dx = arrow.x - enemy.x;
      const dy = arrow.y - enemy.y;
      if (Math.sqrt(dx * dx + dy * dy) < arrow.radius + enemy.bodyRadius) {
        applyArrowDamage(arrow, enemy);
        spawnSparks(arrow.x, arrow.y, arrow.color, 6, 120);
        return false;
      }
    }
    return true;
  });
}

function updateIceBalls(dt) {
  iceBalls = iceBalls.filter((ball) => {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.life -= dt;
    if (ball.life <= 0 || ball.x < 0 || ball.x > world.width) return false;

    if (player.invuln <= 0) {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < ball.radius + player.radius) {
        player.hp -= 10;
        const isFireBall = ball.effect === "attackLock";
        if (isFireBall) {
          player.attackLockTimer = Math.max(player.attackLockTimer, 3);
        } else {
          player.frozenTimer = hasFreezeShield ? 0.5 : 1;
        }
        const sparkColor = ball.color || "#7ec8ff";
        spawnSparks(ball.x, ball.y, sparkColor, 10, 160);
        return false;
      }
    }
    return true;
  });
}

function updateParticles(dt) {
  particles = particles.filter((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += gravity * 0.4 * dt;
    p.life -= dt;
    return p.life > 0;
  });
}

function blobContactDamage(enemy, dmg) {
  if (player.invuln > 0) return;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  if (Math.sqrt(dx * dx + dy * dy) < enemy.bodyRadius + player.radius - 6) {
    player.hp -= dmg;
    player.invuln = 0.55;
    spawnSparks(player.x, player.y, "#ff9d3f", 8, 140);
  }
}

function updateBlob(dt) {
  if (splitPhase || bluePhase || blueSplitPhase || redPhase || blob.hp <= 0) return;
  if (blob.stunTimer > 0) { blob.stunTimer -= dt; return; }
  if (blob.slowTimer > 0) blob.slowTimer -= dt;

  const speed = blob.slowTimer > 0 ? blob.speed * 0.45 : blob.speed;
  const dx = player.x - blob.x;
  if (Math.abs(dx) > 2) blob.x += Math.sign(dx) * speed * dt;
  blob.x = clamp(blob.x, blob.bodyRadius, world.width - blob.bodyRadius);

  if (blob.attackCooldown > 0) { blob.attackCooldown -= dt; return; }
  const distX = Math.abs(player.x - blob.x);
  const distY = Math.abs(player.y - blob.y);
  if (distX < blob.bodyRadius + player.radius - 8 && distY < 60) {
    if (player.invuln <= 0) {
      player.hp -= 14 + Math.random() * 8;
      player.invuln = 0.55;
      blob.attackCooldown = 0.9;
      spawnSparks(player.x, player.y, "#ff9d3f", 8, 140);
    }
  }
}

function updateBlueBlob(dt) {
  if (!bluePhase || blueSplitPhase || blueBlob.hp <= 0) return;
  if (blueBlob.stunTimer > 0) { blueBlob.stunTimer -= dt; return; }
  if (blueBlob.slowTimer > 0) blueBlob.slowTimer -= dt;

  const speed = blueBlob.slowTimer > 0 ? blueBlob.speed * 0.45 : blueBlob.speed;
  const dx = player.x - blueBlob.x;
  if (Math.abs(dx) > 2) blueBlob.x += Math.sign(dx) * speed * dt;
  blueBlob.x = clamp(blueBlob.x, blueBlob.bodyRadius, world.width - blueBlob.bodyRadius);

  if (blueBlob.attackCooldown > 0) {
    blueBlob.attackCooldown -= dt;
  } else {
    const distX = Math.abs(player.x - blueBlob.x);
    const distY = Math.abs(player.y - blueBlob.y);
    if (distX < blueBlob.bodyRadius + player.radius - 8 && distY < 60 && player.invuln <= 0) {
      player.hp -= 12 + Math.random() * 8;
      player.invuln = 0.55;
      blueBlob.attackCooldown = 0.85;
      spawnSparks(player.x, player.y, "#7ec8ff", 8, 140);
    }
  }

  blueBlob.iceBallCooldown -= dt;
  if (blueBlob.iceBallCooldown <= 0) {
    blueBlob.iceBallCooldown = 4;
    const angle = Math.atan2(player.y - blueBlob.y, player.x - blueBlob.x);
    const s = 280;
    iceBalls.push({ x: blueBlob.x, y: blueBlob.y, vx: Math.cos(angle) * s, vy: Math.sin(angle) * s, radius: 14, life: 3 });
    spawnSparks(blueBlob.x, blueBlob.y, "#7ec8ff", 8, 100);
  }
}

function updateRedBlob(dt) {
  if (!redPhase || redSplitPhase || redBlob.hp <= 0) return;
  if (redBlob.stunTimer > 0) { redBlob.stunTimer -= dt; return; }
  if (redBlob.slowTimer > 0) redBlob.slowTimer -= dt;

  const speed = redBlob.slowTimer > 0 ? redBlob.speed * 0.45 : redBlob.speed;
  const dx = player.x - redBlob.x;
  if (Math.abs(dx) > 2) redBlob.x += Math.sign(dx) * speed * dt;
  redBlob.x = clamp(redBlob.x, redBlob.bodyRadius, world.width - redBlob.bodyRadius);

  if (redBlob.attackCooldown > 0) {
    redBlob.attackCooldown -= dt;
  } else {
    const distX = Math.abs(player.x - redBlob.x);
    const distY = Math.abs(player.y - redBlob.y);
    if (distX < redBlob.bodyRadius + player.radius - 8 && distY < 60 && player.invuln <= 0) {
      player.hp -= 15 + Math.random() * 10;
      player.invuln = 0.55;
      redBlob.attackCooldown = 0.75;
      spawnSparks(player.x, player.y, "#ff4444", 10, 160);
    }
  }

  redBlob.chargeAttackCooldown -= dt;
  if (redBlob.chargeAttackCooldown <= 0) {
    redBlob.chargeAttackCooldown = 4;
    const angle = Math.atan2(player.y - redBlob.y, player.x - redBlob.x);
    const s = 320;
    iceBalls.push({ x: redBlob.x, y: redBlob.y, vx: Math.cos(angle) * s, vy: Math.sin(angle) * s, radius: 16, life: 2.5, color: "#ff6666", effect: "attackLock" });
    spawnSparks(redBlob.x, redBlob.y, "#ff4444", 10, 120);
  }
}

function updateMiniBlobArray(dt, arr, color) {
  const hopSpeed = Math.sqrt(2 * gravity * miniBlobMaxRise);
  const dead = arr.filter((mb) => mb.hp <= 0);
  const alive = arr.filter((mb) => mb.hp > 0);

  if (dead.length) {
    rupees += dead.length * 2;
    rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
    for (const mb of dead) spawnSparks(mb.x, mb.y, color, 18, 200);
  }

  for (const mb of alive) {
    if (mb.stunTimer > 0) { mb.stunTimer -= dt; continue; }

    mb.directionTimer -= dt;
    if (mb.directionTimer <= 0) {
      const angle = Math.random() * Math.PI * 2;
      mb.vx = Math.cos(angle) * mb.speed * (0.7 + Math.random() * 0.6);
      mb.directionTimer = 0.5 + Math.random() * 0.8;

      // Keep split blobs bouncing upward instead of flattening out.
      if (mb.y >= blobGroundY - 1) {
        mb.vy = -(hopSpeed * (0.82 + Math.random() * 0.15));
      }
    }

    mb.vy += gravity * dt;
    mb.y += mb.vy * dt;
    mb.x += mb.vx * dt;

    if (mb.y >= blobGroundY) {
      mb.y = blobGroundY;
      mb.vy = -Math.abs(mb.vy) * 0.65;
      if (Math.abs(mb.vy) < hopSpeed * 0.5) mb.vy = -(hopSpeed * 0.86);
    }
    const peak = blobGroundY - miniBlobMaxRise;
    if (mb.y < peak) { mb.y = peak; mb.vy = Math.abs(mb.vy) * 0.5; }

    mb.x = clamp(mb.x, mb.bodyRadius, world.width - mb.bodyRadius);
    if (mb.x <= mb.bodyRadius || mb.x >= world.width - mb.bodyRadius) mb.vx *= -1;

    if (mb.attackCooldown > 0) { mb.attackCooldown -= dt; continue; }
    if (player.invuln <= 0) {
      const dx = player.x - mb.x;
      const dy = player.y - mb.y;
      if (Math.sqrt(dx * dx + dy * dy) < mb.bodyRadius + player.radius - 6) {
        player.hp -= 9 + Math.random() * 6;
        player.invuln = 0.5;
        mb.attackCooldown = 0.7;
        spawnSparks(player.x, player.y, color, 7, 120);
      }
    }
  }

  return alive;
}

function update(dt) {
  if (gameOver) return;

  if (player.attackCooldown > 0) player.attackCooldown -= dt;
  if (player.dashTimer > 0) player.dashTimer -= dt;
  if (player.dashCooldown > 0) player.dashCooldown -= dt;
  if (player.invuln > 0) player.invuln -= dt;
  if (player.frozenTimer > 0) player.frozenTimer -= dt;
  if (player.attackLockTimer > 0) player.attackLockTimer -= dt;

  handleInput(dt);
  updateBlob(dt);
  updateBlueBlob(dt);
  updateRedBlob(dt);

  if (splitPhase && !bluePhase) miniBlobs = updateMiniBlobArray(dt, miniBlobs, "#ff9d3f");
  if (blueSplitPhase) blueMiniBlobs = updateMiniBlobArray(dt, blueMiniBlobs, "#7ec8ff");
  if (redSplitPhase) redMiniBlobs = updateMiniBlobArray(dt, redMiniBlobs, "#ff4b4b");

  updateArrows(dt);
  updateIceBalls(dt);
  updateParticles(dt);

  player.hp = clamp(player.hp, 0, player.maxHp);

  if (player.hp <= 0) {
    if (placedCheckpoints.length && window.confirm("You died. Revive from your last placed checkpoint?")) {
      restoreCheckpoint(placedCheckpoints[placedCheckpoints.length - 1]);
      return;
    }
    if (shopCheckpoint && window.confirm("You died. Revive from your last shop visit?")) {
      restoreCheckpoint(shopCheckpoint, { openShopPanel: true });
      return;
    }
    endGame("The elven warrior has fallen...");
    return;
  }

  if (!splitPhase && !bluePhase && !blueSplitPhase && !redPhase && !redSplitPhase && blob.hp <= 0) {
    rupees += 3;
    rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
    spawnMiniBlobs();
  } else if (splitPhase && !bluePhase && miniBlobs.length === 0) {
    splitPhase = false;
    promptArrowChoice();
  } else if (bluePhase && !blueSplitPhase && blueBlob.hp <= 0) {
    rupees += 5;
    rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
    spawnBlueMiniBlobs();
  } else if (blueSplitPhase && blueMiniBlobs.length === 0 && !finalRewardChosen) {
    promptFinalArrowChoice();
  } else if (redPhase && redBlob.hp <= 0) {
    rupees += 5;
    rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
    redPhase = false;
    spawnRedMiniBlobs();
  } else if (redSplitPhase && redMiniBlobs.length === 0) {
    redSplitPhase = false;
    if (chooseVictoryTeleport()) return;
    endGame("🎉 Victory! Press / to teleport to a checkpoint, or Play Again.");
  }

  updateHud();
}

function drawPlatform() {
  ctx.fillStyle = "#4a7c59";
  ctx.fillRect(0, platformTopY, world.width, world.height - platformTopY);
  ctx.fillStyle = "#3a5e45";
  ctx.fillRect(0, platformTopY, world.width, 8);
}

function drawPlayer() {
  const px = player.x;
  const py = player.y;

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.ellipse(px, playerGroundY + 8, player.radius * 0.9, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  if (player.invuln > 0) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(px, py, player.radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
  }

  const bodyColor = player.frozenTimer > 0 ? "#5ad4ff" : "#4a9b6f";
  ctx.beginPath();
  ctx.arc(px, py, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(px - player.radius * 0.8, py - player.radius * 0.4);
  ctx.lineTo(px - player.radius * 1.3, py - player.radius * 0.9);
  ctx.lineTo(px - player.radius * 0.6, py - player.radius * 0.7);
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px + player.radius * 0.8, py - player.radius * 0.4);
  ctx.lineTo(px + player.radius * 1.3, py - player.radius * 0.9);
  ctx.lineTo(px + player.radius * 0.6, py - player.radius * 0.7);
  ctx.fillStyle = bodyColor;
  ctx.fill();

  const eyeOffX = player.facing * 6;
  ctx.beginPath();
  ctx.arc(px + eyeOffX, py - 4, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + eyeOffX + player.facing * 1.5, py - 4, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "#222";
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "#8b5e3c";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(px + player.facing * 10, py, 12, -Math.PI * 0.7, Math.PI * 0.7, player.facing < 0);
  ctx.stroke();
  ctx.strokeStyle = "#d4c89a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + player.facing * 10, py - 12);
  ctx.lineTo(px + player.facing * 10, py + 12);
  ctx.stroke();
  ctx.restore();
}

function drawBlobShape(bx, by, r, colorA, colorB) {
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.ellipse(bx, blobGroundY + 10, r * 0.85, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(bx, by, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.1, bx, by, r);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB);
  ctx.fillStyle = grad;
  ctx.fill();

  const eo = r * 0.25;
  ctx.beginPath();
  ctx.arc(bx - eo, by - r * 0.18, r * 0.13, 0, Math.PI * 2);
  ctx.arc(bx + eo, by - r * 0.18, r * 0.13, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bx - eo + 1.5, by - r * 0.18, r * 0.065, 0, Math.PI * 2);
  ctx.arc(bx + eo + 1.5, by - r * 0.18, r * 0.065, 0, Math.PI * 2);
  ctx.fillStyle = "#222";
  ctx.fill();
}

function drawBlob() {
  if (splitPhase || bluePhase || blueSplitPhase || redPhase || redSplitPhase || blob.hp <= 0) return;
  drawBlobShape(blob.x, blob.y, blob.bodyRadius, "#ffb347", "#cc5500");
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(blob.hp)}`, blob.x, blob.y - blob.bodyRadius - 6);
}

function drawRedBlob() {
  if (!redPhase || redSplitPhase || redBlob.hp <= 0) return;
  drawBlobShape(redBlob.x, redBlob.y, redBlob.bodyRadius, "#ff7777", "#cc0000");
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(redBlob.hp)}`, redBlob.x, redBlob.y - redBlob.bodyRadius - 6);
}

function drawBlueBlob() {
  if (!bluePhase || blueSplitPhase || blueBlob.hp <= 0) return;
  drawBlobShape(blueBlob.x, blueBlob.y, blueBlob.bodyRadius, "#a0e8ff", "#1a5ca0");
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(blueBlob.hp)}`, blueBlob.x, blueBlob.y - blueBlob.bodyRadius - 6);
}

function drawMiniBlobArray(arr) {
  for (const mb of arr) {
    if (mb.hp <= 0) continue;
    const r = mb.bodyRadius;
    if (mb.variant === "red") {
      drawBlobShape(mb.x, mb.y, r, "#ff8080", "#cc1c1c");
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(mb.hp)}`, mb.x, mb.y - r - 6);
    } else if (mb.element === "ice") {
      drawBlobShape(mb.x, mb.y, r, "#a0e8ff", "#2070c0");
    } else {
      drawBlobShape(mb.x, mb.y, r, "#ffb347", "#cc5500");
    }
  }
}

function drawArrows() {
  for (const arrow of arrows) {
    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate(Math.atan2(arrow.vy, arrow.vx));

    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(6, 0);
    ctx.strokeStyle = "#8b5e3c";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(14, -4);
    ctx.lineTo(14, 4);
    ctx.closePath();
    ctx.fillStyle = arrow.color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-26, -5);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-26, 5);
    ctx.closePath();
    ctx.fillStyle = "#e8d8c0";
    ctx.fill();

    ctx.restore();
  }
}

function drawIceBalls() {
  for (const ball of iceBalls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    const baseColor = ball.color || "#3099cc";
    const lightColor = ball.color ? (ball.color === "#ff6666" ? "#ffaaaa" : "#e0f8ff") : "#e0f8ff";
    const grad = ctx.createRadialGradient(ball.x - 4, ball.y - 4, 2, ball.x, ball.y, ball.radius);
    grad.addColorStop(0, lightColor);
    grad.addColorStop(1, baseColor);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / 0.75);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }
}

function draw() {
  ctx.clearRect(0, 0, world.width, world.height);
  drawPlatform();
  drawMiniBlobArray(miniBlobs);
  drawMiniBlobArray(blueMiniBlobs);
  drawMiniBlobArray(redMiniBlobs);
  drawBlob();
  drawBlueBlob();
  drawRedBlob();
  drawPlayer();
  drawArrows();
  drawIceBalls();
  drawParticles();
}

function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.033);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "/" || event.key === "-" || event.key === "_") {
    chooseAnySaveAndRestore();
    return;
  }

  if (event.key === "`" && hasVisitedShopThisRun && !gameOver) {
    if (!shopCheckpoint) {
      window.alert("No shop checkpoint saved.");
      return;
    }
    restoreCheckpoint(shopCheckpoint, { openShopPanel: true });
    return;
  }

  if (gameOver) return;

  const key = event.key.toLowerCase();
  if (key === "arrowup" || key === "w") jump();
  if (event.key === " ") fireArrow("normal");
  else if (event.key === "Enter") fireArrow("fire");
  else if (event.key === "Shift") fireArrow("ice");
  else if (event.key === "\\") fireArrow("electric");
  else if (key === "x") dash();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

restartBtn.addEventListener("click", resetGame);
fireChoiceBtn.addEventListener("click", () => chooseArrow("fire"));
iceChoiceBtn.addEventListener("click", () => chooseArrow("ice"));
finalFireBtn.addEventListener("click", () => chooseFinalArrow("fire"));
finalIceBtn.addEventListener("click", () => chooseFinalArrow("ice"));
finalElectricBtn.addEventListener("click", () => chooseFinalArrow("electric"));

shopHealBtn.addEventListener("click", () => {
  if (rupees < 4 || player.hp >= player.maxHp) return;
  rupees -= 4;
  player.hp = Math.min(player.maxHp, player.hp + 30);
  updateShopButtons();
  rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
});

shopArrowBtn.addEventListener("click", () => {
  if (rupees < 5 || unlockedArrowType === null || hasBoughtRandomArrow) return;
  rupees -= 5;
  addPreferredOrRandomArrow(unlockedArrowType);
  hasBoughtRandomArrow = true;
  updateShopButtons();
  updateQuiver();
  rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
});

shopShieldBtn.addEventListener("click", () => {
  if (rupees < 7 || hasFreezeShield) return;
  rupees -= 7;
  hasFreezeShield = true;
  updateShopButtons();
  rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
});

shopIceArrowBtn.addEventListener("click", () => {
  if (rupees < 6) return;
  rupees -= 6;
  addPreferredOrRandomArrow("ice");
  updateShopButtons();
  updateQuiver();
  rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
});

shopFireArrowBtn.addEventListener("click", () => {
  if (rupees < 6) return;
  rupees -= 6;
  addPreferredOrRandomArrow("fire");
  updateShopButtons();
  updateQuiver();
  rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
});

shopElectricArrowBtn.addEventListener("click", () => {
  if (rupees < 8) return;
  rupees -= 8;
  addPreferredOrRandomArrow("electric");
  updateShopButtons();
  updateQuiver();
  rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
});

shopDoubleBowBtn.addEventListener("click", () => {
  if (rupees < 65 || hasDoubleBow) return;
  rupees -= 65;
  hasDoubleBow = true;
  updateShopButtons();
  rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
});

if (shopCheckpointBtn) {
  shopCheckpointBtn.addEventListener("click", () => {
    if (rupees < 25) return;
    rupees -= 25;
    placePlacedCheckpoint();
    updateShopButtons();
    rupeeCountEl.textContent = `💎 Rupees: ${rupees}`;
  });
}

shopLeaveBtn.addEventListener("click", () => {
  shopPanelEl.classList.add("hidden");
  redPhase = true;
  gameOver = false;
});

resetGame(false);
loadPersistedSaves();
requestAnimationFrame(loop);
