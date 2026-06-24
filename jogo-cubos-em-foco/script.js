const TIME_LIMIT = 75_000;
const COMBO_WINDOW = 4_500;
const MAX_COMBO = 5;

const targetLayout = [
  { type: "yellow", rotation: 0 },
  { type: "diagonal", rotation: 90 },
  { type: "black", rotation: 0 },
  { type: "diagonal", rotation: 180 },
  { type: "black", rotation: 0 },
  { type: "diagonal", rotation: 0 },
  { type: "black", rotation: 0 },
  { type: "diagonal", rotation: 270 },
  { type: "yellow", rotation: 0 },
];

const targetGrid = document.querySelector("#target-grid");
const puzzleGrid = document.querySelector("#puzzle-grid");
const scoreElement = document.querySelector("#score");
const comboElement = document.querySelector("#combo");
const mountedElement = document.querySelector("#mounted");
const timeLeftElement = document.querySelector("#time-left");
const timeBar = document.querySelector("#time-bar");
const gameMessage = document.querySelector("#game-message");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const resultDialog = document.querySelector("#result-dialog");
const resultEyebrow = document.querySelector("#result-eyebrow");
const resultSummary = document.querySelector("#result-summary");
const playAgainButton = document.querySelector("#play-again-button");

const state = {
  active: false,
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctSlots: new Set(),
  lastMatchAt: undefined,
  startedAt: undefined,
  timer: undefined,
  pieces: [],
  drag: undefined,
};

const shuffle = (items) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const formatTime = (milliseconds) => {
  const seconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
};

const createFace = ({ type, rotation = 0 }) => {
  const face = document.createElement("span");
  face.className = `cube-face cube-face--${type}`;
  face.style.setProperty("--face-rotation", `${rotation}deg`);
  face.setAttribute("aria-hidden", "true");
  face.innerHTML = '<span class="cube-face__surface"></span>';

  return face;
};

const renderTarget = () => {
  targetGrid.replaceChildren(...targetLayout.map(createFace));
};

const getCorrectSlots = () => new Set(
  state.pieces
    .map((piece, index) => {
      const target = targetLayout[index];
      const typeMatches = piece.type === target.type;
      const rotationMatches = piece.type !== "diagonal" || piece.rotation === target.rotation;

      return typeMatches && rotationMatches ? index : undefined;
    })
    .filter((index) => index !== undefined),
);

const createScrambledPieces = () => {
  let pieces;

  do {
    pieces = shuffle(
      targetLayout.map((target, index) => ({
        id: index,
        type: target.type,
        rotation: target.type === "diagonal" ? Math.floor(Math.random() * 4) * 90 : 0,
      })),
    );
  } while (pieces.every((piece, index) => {
    const target = targetLayout[index];
    return piece.type === target.type && (piece.type !== "diagonal" || piece.rotation === target.rotation);
  }));

  return pieces;
};

const updateStatus = () => {
  scoreElement.textContent = state.score;
  comboElement.textContent = `x${Math.max(1, state.combo)}`;
  mountedElement.textContent = state.correctSlots.size;
};

const updateClock = () => {
  const elapsed = state.startedAt ? performance.now() - state.startedAt : 0;
  const remaining = Math.max(0, TIME_LIMIT - elapsed);
  const percent = (remaining / TIME_LIMIT) * 100;

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

const pieceDescription = (piece) => {
  if (piece.type === "yellow") return "Face amarela";
  if (piece.type === "black") return "Face preta";

  return "Face diagonal amarela e preta";
};

const renderBoard = () => {
  const slots = state.pieces.map((piece, index) => {
    const slot = document.createElement("div");
    slot.className = "puzzle-slot";
    slot.dataset.index = index;

    const cube = document.createElement("button");
    cube.className = "puzzle-cube";
    cube.type = "button";
    cube.dataset.index = index;
    cube.disabled = !state.active;
    const interaction = piece.type === "diagonal"
      ? "Toque para girar ou arraste para trocar de posição."
      : "Arraste para trocar de posição.";
    cube.setAttribute(
      "aria-label",
      `${pieceDescription(piece)}. ${state.active ? interaction : "Inicie o desafio para mover esta peça."}`,
    );

    if (state.correctSlots.has(index)) cube.classList.add("is-correct");
    cube.append(createFace(piece));
    cube.addEventListener("pointerdown", handlePointerDown);
    cube.addEventListener("pointermove", handlePointerMove);
    cube.addEventListener("pointerup", handlePointerUp);
    cube.addEventListener("pointercancel", stopDrag);
    cube.addEventListener("keydown", handleKeyboardRotation);
    slot.append(cube);

    return slot;
  });

  puzzleGrid.replaceChildren(...slots);
};

const setMessage = (message) => {
  gameMessage.textContent = message;
};

const evaluateBoard = () => {
  const previousCorrectSlots = state.correctSlots;
  const currentCorrectSlots = getCorrectSlots();
  const newMatches = [...currentCorrectSlots].filter((index) => !previousCorrectSlots.has(index));
  const lostMatches = [...previousCorrectSlots].filter((index) => !currentCorrectSlots.has(index));

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

    const gainedPoints = newMatches.length * 100 * Math.max(1, state.combo);
    state.score += gainedPoints;
    setMessage(state.combo > 1 ? `Combo x${state.combo}! +${gainedPoints} pontos` : `Encaixe certo! +${gainedPoints} pontos`);
  } else if (lostMatches.length) {
    setMessage("Essa face saiu do encaixe. Compare com o objetivo.");
  }

  updateStatus();
  renderBoard();

  if (currentCorrectSlots.size === targetLayout.length) endGame(true);
};

const rotatePiece = (index) => {
  if (!state.active) return;

  const piece = state.pieces[index];

  if (piece.type !== "diagonal") {
    setMessage("Faces inteiras não precisam girar — arraste-as para a posição certa.");
    return;
  }

  piece.rotation = (piece.rotation + 90) % 360;
  evaluateBoard();
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

function handlePointerUp(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;

  const { dragging, index: sourceIndex } = state.drag;

  if (!dragging) {
    stopDrag();
    rotatePiece(sourceIndex);
    return;
  }

  const dropTarget = document.elementFromPoint(event.clientX, event.clientY)?.closest(".puzzle-slot");
  const targetIndex = Number(dropTarget?.dataset.index);
  stopDrag();

  if (Number.isInteger(targetIndex) && targetIndex !== sourceIndex) {
    [state.pieces[sourceIndex], state.pieces[targetIndex]] = [
      state.pieces[targetIndex],
      state.pieces[sourceIndex],
    ];
    evaluateBoard();
    return;
  }

  setMessage("Arraste uma face sobre outra posição para trocá-las.");
}

function handleKeyboardRotation(event) {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  rotatePiece(Number(event.currentTarget.dataset.index));
}

const endGame = (isVictory) => {
  if (!state.active) return;

  state.active = false;
  clearTimer();
  stopDrag();
  renderBoard();
  startButton.textContent = "Iniciar desafio";
  startButton.disabled = false;

  if (isVictory) {
    resultEyebrow.textContent = "Padrão concluído";
    resultSummary.textContent = `Você montou as 9 faces com ${state.score} pontos e alcançou combo máximo x${Math.max(1, state.maxCombo)}.`;
  } else {
    resultEyebrow.textContent = "Tempo esgotado";
    resultSummary.textContent = `Você deixou ${state.correctSlots.size} de 9 faces no lugar certo e fez ${state.score} pontos. Tente um novo padrão.`;
  }

  resultDialog.showModal();
};

const prepareGame = (startImmediately = false) => {
  clearTimer();
  stopDrag();
  if (resultDialog.open) resultDialog.close();
  state.active = startImmediately;
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.lastMatchAt = undefined;
  state.pieces = createScrambledPieces();
  state.correctSlots = getCorrectSlots();
  state.startedAt = startImmediately ? performance.now() : undefined;
  updateStatus();
  updateClock();
  renderBoard();

  if (startImmediately) {
    startButton.textContent = "Desafio em andamento";
    startButton.disabled = true;
    setMessage("Encaixes rápidos aumentam o combo. Boa montagem!");
    state.timer = window.setInterval(updateClock, 100);
  } else {
    startButton.textContent = "Iniciar desafio";
    startButton.disabled = false;
    setMessage("Pronto para observar o padrão?");
  }
};

startButton.addEventListener("click", () => prepareGame(true));
restartButton.addEventListener("click", () => prepareGame(true));
playAgainButton.addEventListener("click", () => prepareGame(true));

renderTarget();
prepareGame();
