const COMBO_WINDOW = 5_000;
const MAX_COMBO = 9;
const GAME_ID = "puzzle-rotacao";
const GAME_TITLE = "Puzzle de Rotação";

const LEVELS = {
  calmo: {
    name: "Calmo",
    gridSize: 3,
    timeLimit: 90_000,
    scoreMultiplier: 1,
    goals: { good: 1200, standout: 2400, goodLabel: "1200 pontos", standoutLabel: "2400 pontos" },
  },
  ritmo: {
    name: "Ritmo",
    gridSize: 4,
    timeLimit: 120_000,
    scoreMultiplier: 1.35,
    goals: { good: 2600, standout: 5200, goodLabel: "2600 pontos", standoutLabel: "5200 pontos" },
  },
  foco: {
    name: "Foco",
    gridSize: 5,
    timeLimit: 150_000,
    scoreMultiplier: 1.7,
    goals: { good: 5200, standout: 9800, goodLabel: "5200 pontos", standoutLabel: "9800 pontos" },
  },
};

const targetGrid = document.querySelector("#target-grid");
const puzzleGrid = document.querySelector("#puzzle-grid");
const scoreElement = document.querySelector("#score");
const comboElement = document.querySelector("#combo");
const correctCountElement = document.querySelector("#correct-count");
const totalPiecesElement = document.querySelector("#total-pieces");
const timeLeftElement = document.querySelector("#time-left");
const timeBar = document.querySelector("#time-bar");
const gameMessage = document.querySelector("#game-message");
const dailyStatus = document.querySelector("#daily-status");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const levelButtons = document.querySelectorAll(".level-option");
const resultDialog = document.querySelector("#result-dialog");
const resultEyebrow = document.querySelector("#result-eyebrow");
const resultSummary = document.querySelector("#result-summary");
const playAgainButton = document.querySelector("#play-again-button");

const state = {
  active: false,
  levelKey: "ritmo",
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctSlots: new Set(),
  lastMatchAt: undefined,
  startedAt: undefined,
  timer: undefined,
  pieces: [],
  drag: undefined,
  dailyAttemptRecorded: false,
  dailyAttemptPending: false,
};

const activeLevel = () => LEVELS[state.levelKey];

const updateDailyStatus = () => {
  dailyStatus.textContent = ReabilityDaily.statusText({
    gameId: GAME_ID,
    levelKey: state.levelKey,
    levelName: activeLevel().name,
  });
};

const showDailyLimit = () => {
  ReabilityDaily.showLimitDialog({
    gameTitle: GAME_TITLE,
    levelName: activeLevel().name,
  });
};

const ensureDailyAllowance = async () => {
  const usage = ReabilityDaily.getUsage(GAME_ID, state.levelKey);
  updateLevelControls();

  if (usage.remaining === 0) {
    showDailyLimit();
    return false;
  }

  await ReabilityDaily.ensurePlayerName();
  updateLevelControls();
  return true;
};

const recordDailyAttempt = async () => {
  if (state.dailyAttemptRecorded) return true;
  if (state.dailyAttemptPending) return false;

  state.dailyAttemptPending = true;
  await ReabilityDaily.ensurePlayerName();
  const attempt = ReabilityDaily.recordAttempt(GAME_ID, state.levelKey);
  state.dailyAttemptPending = false;
  updateLevelControls();

  if (!attempt.ok) {
    showDailyLimit();
    return false;
  }

  state.dailyAttemptRecorded = true;
  return true;
};

const clearGoalResult = () => {
  resultSummary.parentElement.querySelector(".goal-result")?.remove();
};

const shuffle = (items) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const normalizeRotation = (rotation) => ((rotation % 360) + 360) % 360;

const formatTime = (milliseconds) => {
  const seconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
};

const tilePosition = (targetIndex) => {
  const { gridSize } = activeLevel();
  const row = Math.floor(targetIndex / gridSize);
  const column = targetIndex % gridSize;
  const denominator = Math.max(1, gridSize - 1);

  return {
    row,
    column,
    backgroundX: `${(column / denominator) * 100}%`,
    backgroundY: `${(row / denominator) * 100}%`,
  };
};

const createTileSurface = (targetIndex, rotation = 0) => {
  const position = tilePosition(targetIndex);
  const surface = document.createElement("span");

  surface.className = "tile-surface";
  surface.style.setProperty("--bg-x", position.backgroundX);
  surface.style.setProperty("--bg-y", position.backgroundY);
  surface.style.setProperty("--bg-size", `${activeLevel().gridSize * 100}%`);
  surface.style.setProperty("--piece-rotation", `${normalizeRotation(rotation)}deg`);
  surface.setAttribute("aria-hidden", "true");

  return surface;
};

const createTargetPieces = () => {
  const total = activeLevel().gridSize ** 2;

  return Array.from({ length: total }, (_, targetIndex) => ({ targetIndex, rotation: 0 }));
};

const isSolvedOrder = (pieces) => pieces.every((piece, index) => (
  piece.targetIndex === index && normalizeRotation(piece.rotation) === 0
));

const createScrambledPieces = () => {
  const targetPieces = createTargetPieces();
  let pieces;

  do {
    pieces = shuffle(targetPieces).map((piece) => ({
      targetIndex: piece.targetIndex,
      rotation: Math.floor(Math.random() * 4) * 90,
    }));
  } while (isSolvedOrder(pieces));

  return pieces;
};

const getCorrectSlots = () => new Set(
  state.pieces
    .map((piece, index) => (
      piece.targetIndex === index && normalizeRotation(piece.rotation) === 0 ? index : undefined
    ))
    .filter((index) => index !== undefined),
);

const updateGridSizes = () => {
  targetGrid.style.setProperty("--grid-size", activeLevel().gridSize);
  puzzleGrid.style.setProperty("--grid-size", activeLevel().gridSize);
};

const renderTarget = () => {
  updateGridSizes();

  const targetSlots = createTargetPieces().map((piece, index) => {
    const slot = document.createElement("div");
    const tile = document.createElement("span");

    slot.className = "target-slot";
    tile.className = "target-tile";
    tile.append(createTileSurface(piece.targetIndex, 0));
    slot.append(tile);
    slot.setAttribute("aria-label", `Peça objetivo ${index + 1}`);

    return slot;
  });

  targetGrid.replaceChildren(...targetSlots);
};

const pieceDescription = (piece) => {
  const position = tilePosition(piece.targetIndex);
  const rotation = normalizeRotation(piece.rotation);

  return `Fragmento da linha ${position.row + 1}, coluna ${position.column + 1}, girado ${rotation} graus`;
};

const updateStatus = () => {
  scoreElement.textContent = state.score;
  comboElement.textContent = `x${Math.max(1, state.combo)}`;
  correctCountElement.textContent = state.correctSlots.size;
  totalPiecesElement.textContent = activeLevel().gridSize ** 2;
};

const updateLevelControls = () => {
  levelButtons.forEach((button) => {
    const isSelected = button.dataset.level === state.levelKey;

    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected);
    button.disabled = state.active;
    ReabilityDaily.updateLevelLock(button, GAME_ID, button.dataset.level);
  });
  updateDailyStatus();
};

const setMessage = (message) => {
  gameMessage.textContent = message;
};

const renderBoard = () => {
  updateGridSizes();

  const slots = state.pieces.map((piece, index) => {
    const slot = document.createElement("div");
    const tile = document.createElement("button");

    slot.className = "puzzle-slot";
    slot.dataset.index = index;
    tile.className = "puzzle-tile";
    tile.type = "button";
    tile.dataset.index = index;
    tile.disabled = !state.active;
    tile.setAttribute(
      "aria-label",
      `${pieceDescription(piece)}. ${
        state.active ? "Toque para girar 90 graus ou arraste para trocar de posição." : "Inicie o desafio para mover."
      }`,
    );

    if (state.correctSlots.has(index)) tile.classList.add("is-correct");

    tile.append(createTileSurface(piece.targetIndex, piece.rotation));
    tile.addEventListener("pointerdown", handlePointerDown);
    tile.addEventListener("pointermove", handlePointerMove);
    tile.addEventListener("pointerup", handlePointerUp);
    tile.addEventListener("pointercancel", stopDrag);
    tile.addEventListener("keydown", handleKeyboardRotation);
    slot.append(tile);

    return slot;
  });

  puzzleGrid.replaceChildren(...slots);
};

const updateClock = () => {
  const elapsed = state.startedAt ? performance.now() - state.startedAt : 0;
  const remaining = Math.max(0, activeLevel().timeLimit - elapsed);
  const percent = (remaining / activeLevel().timeLimit) * 100;

  timeLeftElement.textContent = formatTime(remaining);
  timeBar.style.setProperty("--time-progress", `${percent}%`);
  timeBar.classList.toggle("is-urgent", remaining <= 15_000);

  if (state.active && state.lastMatchAt && performance.now() - state.lastMatchAt > COMBO_WINDOW) {
    state.combo = 0;
    updateStatus();
  }

  if (state.active && remaining <= 0) endGame(false);
};

const clearTimer = () => window.clearInterval(state.timer);

const stopDrag = () => {
  if (!state.drag) return;

  state.drag.ghost?.remove();
  state.drag.source?.classList.remove("is-dragging");
  state.drag = undefined;
};

const updateGhostPosition = (event) => {
  if (!state.drag?.ghost) return;

  state.drag.ghost.style.left = `${event.clientX}px`;
  state.drag.ghost.style.top = `${event.clientY}px`;
};

const startDragging = (event) => {
  const { source } = state.drag;
  const rect = source.getBoundingClientRect();
  const ghost = source.cloneNode(true);

  ghost.classList.add("drag-ghost");
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  document.body.append(ghost);
  source.classList.add("is-dragging");
  state.drag.ghost = ghost;
  state.drag.dragging = true;
  updateGhostPosition(event);
};

const evaluateBoard = () => {
  const previousCorrectSlots = state.correctSlots;
  const currentCorrectSlots = getCorrectSlots();
  const newMatches = [...currentCorrectSlots].filter((index) => !previousCorrectSlots.has(index));
  const lostMatches = [...previousCorrectSlots].filter((index) => !currentCorrectSlots.has(index));

  ReabilityClinic.round({ action: "move", newMatches: newMatches.length, lostMatches: lostMatches.length, correctSlots: currentCorrectSlots.size });
  state.correctSlots = currentCorrectSlots;

  if (lostMatches.length) {
    state.combo = 0;
    state.lastMatchAt = undefined;
  }

  if (newMatches.length) {
    const now = performance.now();
    const isQuickMatch = state.lastMatchAt && now - state.lastMatchAt <= COMBO_WINDOW;

    state.combo = isQuickMatch ? Math.min(MAX_COMBO, state.combo + newMatches.length) : newMatches.length;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.lastMatchAt = now;

    const gainedPoints = Math.round(
      newMatches.length * 120 * Math.max(1, state.combo) * activeLevel().scoreMultiplier,
    );
    state.score += gainedPoints;
    setMessage(
      state.combo > 1
        ? `Combo x${state.combo}! +${gainedPoints} pontos.`
        : `Peça encaixada! +${gainedPoints} pontos.`,
    );
  } else if (lostMatches.length) {
    setMessage("Uma peça correta saiu do lugar. Compare com o objetivo e recupere o ritmo.");
  } else {
    setMessage("Continue ajustando posição e giro.");
  }

  updateStatus();
  renderBoard();

  if (currentCorrectSlots.size === activeLevel().gridSize ** 2) endGame(true);
};

const rotatePiece = async (index) => {
  if (!state.active) return;

  if (!(await recordDailyAttempt())) return;

  state.pieces[index].rotation = normalizeRotation(state.pieces[index].rotation + 90);
  evaluateBoard();
};

function handlePointerDown(event) {
  if (!state.active || event.button !== 0) return;

  event.preventDefault();
  const source = event.currentTarget;

  source.setPointerCapture(event.pointerId);
  state.drag = {
    index: Number(source.dataset.index),
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    source,
    dragging: false,
  };
}

function handlePointerMove(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;

  const distance = Math.hypot(event.clientX - state.drag.startX, event.clientY - state.drag.startY);

  if (!state.drag.dragging && distance > 8) startDragging(event);
  if (state.drag.dragging) updateGhostPosition(event);
}

async function handlePointerUp(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;

  const { dragging, index: sourceIndex } = state.drag;

  if (!dragging) {
    stopDrag();
    await rotatePiece(sourceIndex);
    return;
  }

  const dropTarget = document.elementFromPoint(event.clientX, event.clientY)?.closest(".puzzle-slot");
  const targetIndex = Number(dropTarget?.dataset.index);

  stopDrag();

  if (Number.isInteger(targetIndex) && targetIndex !== sourceIndex) {
    if (!(await recordDailyAttempt())) return;

    [state.pieces[sourceIndex], state.pieces[targetIndex]] = [
      state.pieces[targetIndex],
      state.pieces[sourceIndex],
    ];
    evaluateBoard();
    return;
  }

  setMessage("Solte a peça sobre outra casa para trocar as posições.");
}

async function handleKeyboardRotation(event) {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  await rotatePiece(Number(event.currentTarget.dataset.index));
}

const endGame = (isVictory) => {
  if (!state.active) return;

  state.active = false;
  clearTimer();
  stopDrag();
  renderBoard();
  startButton.textContent = "Iniciar desafio";
  startButton.disabled = false;
  updateLevelControls();

  if (isVictory) {
    const remaining = Math.max(0, activeLevel().timeLimit - (performance.now() - state.startedAt));
    const timeBonus = Math.round((remaining / 1000) * 3 * activeLevel().scoreMultiplier);

    state.score += timeBonus;
    updateStatus();
    resultEyebrow.textContent = "Puzzle concluído";
    resultSummary.textContent = `Você completou o nível ${activeLevel().name} com ${state.score} pontos, bônus de tempo de ${timeBonus} e combo máximo x${Math.max(1, state.maxCombo)}.`;
  } else {
    resultEyebrow.textContent = "Tempo esgotado";
    resultSummary.textContent = `Você encaixou ${state.correctSlots.size} de ${activeLevel().gridSize ** 2} peças e fez ${state.score} pontos no nível ${activeLevel().name}.`;
  }

  ReabilityClinic.finish({ score: state.score, correctSlots: state.correctSlots.size, maxCombo: state.maxCombo, won: isVictory }, isVictory ? "completed" : "timeout");
  ReabilityDaily.goals.showGoalResult(
    resultSummary,
    ReabilityDaily.goals.rateHigher(state.score, activeLevel().goals),
  );
  if (!resultDialog.open) resultDialog.showModal();
};

const prepareGame = (startImmediately = false) => {
  if (startImmediately) ReabilityClinic.start(GAME_ID, state.levelKey);
  clearTimer();
  stopDrag();
  if (resultDialog.open) resultDialog.close();
  clearGoalResult();

  state.active = startImmediately;
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.lastMatchAt = undefined;
  state.pieces = createScrambledPieces();
  state.correctSlots = getCorrectSlots();
  state.startedAt = startImmediately ? performance.now() : undefined;
  state.dailyAttemptRecorded = false;
  state.dailyAttemptPending = false;

  renderTarget();
  updateStatus();
  updateClock();
  renderBoard();
  updateLevelControls();

  if (startImmediately) {
    startButton.textContent = "Desafio em andamento";
    startButton.disabled = true;
    setMessage(`${activeLevel().name}: encaixes em sequência ativam combos maiores.`);
    state.timer = window.setInterval(updateClock, 100);
  } else {
    startButton.textContent = "Iniciar desafio";
    startButton.disabled = false;
    setMessage(`${activeLevel().name}: ${activeLevel().gridSize}×${activeLevel().gridSize} em ${activeLevel().timeLimit / 1000} segundos.`);
  }
};

const selectLevel = (event) => {
  const levelKey = event.currentTarget.dataset.level;

  if (state.active || levelKey === state.levelKey) return;

  state.levelKey = levelKey;
  prepareGame();
};

const startDailyGame = async () => {
  if (await ensureDailyAllowance()) prepareGame(true);
};

startButton.addEventListener("click", startDailyGame);
restartButton.addEventListener("click", startDailyGame);
playAgainButton.addEventListener("click", startDailyGame);
levelButtons.forEach((button) => button.addEventListener("click", selectLevel));
resultDialog.addEventListener("cancel", (event) => event.preventDefault());

prepareGame();
