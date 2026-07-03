const GAME_ID = "conexoes-de-ideias";
const GAME_TITLE = "Conexões de Ideias";

const LEVELS = {
  easy: {
    name: "Fácil",
    roundCount: 4,
    targetCount: 3,
    goals: { goodMistakes: 2, standoutMistakes: 0 },
  },
  medium: {
    name: "Médio",
    roundCount: 6,
    targetCount: 4,
    goals: { goodMistakes: 3, standoutMistakes: 1 },
  },
  hard: {
    name: "Difícil",
    roundCount: 8,
    targetCount: 4,
    goals: { goodMistakes: 4, standoutMistakes: 2 },
  },
};

const rounds = [
  {
    loose: { emoji: "🛞", label: "Pneu" },
    targets: [
      { emoji: "🪙", label: "Moeda", correct: true },
      { emoji: "📚", label: "Livros" },
      { emoji: "🌳", label: "Árvore" },
      { emoji: "☕", label: "Xícara" },
    ],
    connection: "Pneu e moeda têm uma relação funcional: os dois podem rolar.",
  },
  {
    loose: { emoji: "✉️", label: "Selo postal" },
    targets: [
      { emoji: "🎁", label: "Presente", correct: true },
      { emoji: "🛏️", label: "Cama" },
      { emoji: "🎸", label: "Violão" },
      { emoji: "🍎", label: "Maçã" },
    ],
    connection: "Selo postal e presente podem ser enviados para alguém.",
  },
  {
    loose: { emoji: "🔑", label: "Chave" },
    targets: [
      { emoji: "🔐", label: "Cadeado", correct: true },
      { emoji: "🖼️", label: "Quadro" },
      { emoji: "🎈", label: "Balão" },
      { emoji: "🥕", label: "Cenoura" },
    ],
    connection: "Chave e cadeado se relacionam porque um permite abrir o outro.",
  },
  {
    loose: { emoji: "☂️", label: "Guarda-chuva" },
    targets: [
      { emoji: "🏠", label: "Casa", correct: true },
      { emoji: "🎂", label: "Bolo" },
      { emoji: "🚲", label: "Bicicleta" },
      { emoji: "📖", label: "Livro" },
    ],
    connection: "Guarda-chuva e casa podem nos proteger da chuva.",
  },
  {
    loose: { emoji: "🕯️", label: "Vela" },
    targets: [
      { emoji: "🔦", label: "Lanterna", correct: true },
      { emoji: "⚽", label: "Bola" },
      { emoji: "🪴", label: "Planta" },
      { emoji: "🧤", label: "Luva" },
    ],
    connection: "Vela e lanterna têm a mesma função: iluminar um lugar escuro.",
  },
  {
    loose: { emoji: "🗺️", label: "Mapa" },
    targets: [
      { emoji: "🧭", label: "Bússola", correct: true },
      { emoji: "🎨", label: "Tinta" },
      { emoji: "🧁", label: "Bolo pequeno" },
      { emoji: "🪥", label: "Escova de dentes" },
    ],
    connection: "Mapa e bússola ajudam uma pessoa a se orientar no caminho.",
  },
  {
    loose: { emoji: "🧼", label: "Sabonete" },
    targets: [
      { emoji: "🪥", label: "Escova de dentes", correct: true },
      { emoji: "📷", label: "Câmera" },
      { emoji: "🧱", label: "Tijolo" },
      { emoji: "🎧", label: "Fone" },
    ],
    connection: "Sabonete e escova de dentes se relacionam pelo cuidado com a higiene.",
  },
  {
    loose: { emoji: "🧵", label: "Linha" },
    targets: [
      { emoji: "🪡", label: "Agulha", correct: true },
      { emoji: "🧃", label: "Suco" },
      { emoji: "🪑", label: "Cadeira" },
      { emoji: "🌙", label: "Lua" },
    ],
    connection: "Linha e agulha costumam trabalhar juntas para costurar.",
  },
];

const startScreen = document.querySelector("#start-screen");
const gameArea = document.querySelector("#game-area");
const difficultyButtons = document.querySelectorAll(".difficulty-option");
const dailyStatus = document.querySelector("#daily-status");
const gameDailyStatus = document.querySelector("#game-daily-status");
const selectedLevelElement = document.querySelector("#selected-level");
const looseCard = document.querySelector("#loose-card");
const targetGrid = document.querySelector("#target-grid");
const roundNumber = document.querySelector("#round-number");
const totalRounds = document.querySelector("#total-rounds");
const scoreElement = document.querySelector("#score");
const mistakesElement = document.querySelector("#mistakes");
const instruction = document.querySelector("#instruction");
const feedback = document.querySelector("#feedback");
const restartButton = document.querySelector("#restart-button");
const changeLevelButton = document.querySelector("#change-level-button");
const nextButton = document.querySelector("#next-button");
const victoryDialog = document.querySelector("#victory-dialog");
const victorySummary = document.querySelector("#victory-summary");
const playAgainButton = document.querySelector("#play-again-button");

let activeLevelKey = "easy";
let roundQueue = [];
let currentRound = 0;
let score = 0;
let mistakes = 0;
let selected = false;
let roundComplete = false;

const activeLevel = () => LEVELS[activeLevelKey];

const shuffle = (items) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const updateDailyStatus = () => {
  const text = ReabilityDaily.statusText({
    gameId: GAME_ID,
    levelKey: activeLevelKey,
    levelName: activeLevel().name,
  });

  dailyStatus.textContent = text;
  gameDailyStatus.textContent = text;
  difficultyButtons.forEach((button) => {
    ReabilityDaily.updateLevelLock(button, GAME_ID, button.dataset.level);
  });
};

const requestDailyAttempt = async () => {
  await ReabilityDaily.ensurePlayerName();
  const attempt = ReabilityDaily.recordAttempt(GAME_ID, activeLevelKey);
  updateDailyStatus();

  if (!attempt.ok) {
    ReabilityDaily.showLimitDialog({
      gameTitle: GAME_TITLE,
      levelName: activeLevel().name,
    });
    return false;
  }

  return true;
};

const rateConnectionGoal = () => {
  const goals = activeLevel().goals;

  if (mistakes <= goals.standoutMistakes) {
    return {
      tier: "standout",
      label: "Meta destaque",
      message: `Destaque alcançado: ${mistakes} erro${mistakes === 1 ? "" : "s"}.`,
    };
  }

  if (mistakes <= goals.goodMistakes) {
    return {
      tier: "good",
      label: "Boa meta",
      message: `Boa meta alcançada. Destaque: até ${goals.standoutMistakes} erro${goals.standoutMistakes === 1 ? "" : "s"}.`,
    };
  }

  return {
    tier: "training",
    label: "Meta do dia",
    message: `Boa meta: até ${goals.goodMistakes} erros. Destaque: até ${goals.standoutMistakes} erro${goals.standoutMistakes === 1 ? "" : "s"}.`,
  };
};

const createCardContents = ({ emoji, label }) => `
  <span class="card-emoji" aria-hidden="true">${emoji}</span>
  <span class="card-label">${label}</span>
`;

const updateStatus = () => {
  roundNumber.textContent = currentRound + 1;
  totalRounds.textContent = roundQueue.length;
  scoreElement.textContent = score;
  mistakesElement.textContent = mistakes;
};

const deselectLooseCard = () => {
  selected = false;
  looseCard.classList.remove("is-selected");
  looseCard.setAttribute("aria-pressed", "false");
};

const selectLooseCard = () => {
  if (roundComplete) return;

  selected = !selected;
  looseCard.classList.toggle("is-selected", selected);
  looseCard.setAttribute("aria-pressed", String(selected));
  feedback.textContent = selected ? "Agora escolha uma das imagens." : "";
};

const resolveChoice = (target) => {
  if (roundComplete) return;

  if (!selected) {
    selectLooseCard();
    feedback.textContent = "Primeiro selecione a carta solta; depois escolha uma imagem.";
    return;
  }

  if (!target.dataset.correct) {
    mistakes += 1;
    updateStatus();
    feedback.textContent = "Essa conexão não é a que procuramos. Tente pensar no que as imagens podem fazer.";
    target.classList.remove("is-incorrect");
    window.requestAnimationFrame(() => target.classList.add("is-incorrect"));
    return;
  }

  roundComplete = true;
  score += 1;
  updateStatus();
  looseCard.classList.add("is-connected");
  target.classList.add("is-correct");
  looseCard.disabled = true;
  targetGrid.querySelectorAll("button").forEach((card) => {
    card.disabled = true;
  });
  deselectLooseCard();
  instruction.textContent = "Boa conexão! Veja a relação que une essas imagens.";
  feedback.textContent = roundQueue[currentRound].connection;

  nextButton.textContent = currentRound === roundQueue.length - 1 ? "Ver resultado" : "Próxima conexão";
  nextButton.hidden = false;
  nextButton.focus();
};

const handleDrop = (event) => {
  event.preventDefault();
  event.currentTarget.classList.remove("is-drag-over");
  selected = true;
  resolveChoice(event.currentTarget);
};

const activeTargets = (round) => {
  const correctTarget = round.targets.find((target) => target.correct);
  const distractors = shuffle(round.targets.filter((target) => !target.correct)).slice(
    0,
    activeLevel().targetCount - 1,
  );

  return shuffle([correctTarget, ...distractors]);
};

const renderRound = () => {
  const round = roundQueue[currentRound];

  roundComplete = false;
  deselectLooseCard();
  updateStatus();
  feedback.textContent = "";
  nextButton.hidden = true;
  looseCard.disabled = false;
  looseCard.classList.remove("is-connected");
  looseCard.innerHTML = createCardContents(round.loose);
  looseCard.setAttribute("aria-label", `Carta solta: ${round.loose.label}. Toque para selecionar ou arraste.`);
  instruction.textContent = "Arraste a carta solta para a imagem que combina com ela. Se preferir, toque na carta e depois no destino.";
  targetGrid.style.setProperty("--target-count", activeLevel().targetCount);
  targetGrid.replaceChildren();

  activeTargets(round).forEach((target) => {
    const card = document.createElement("button");
    card.className = "idea-card target-card";
    card.type = "button";
    card.dataset.correct = target.correct ? "true" : "";
    card.innerHTML = createCardContents(target);
    card.setAttribute("aria-label", `Destino: ${target.label}`);
    card.addEventListener("click", () => resolveChoice(card));
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!roundComplete) card.classList.add("is-drag-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("is-drag-over"));
    card.addEventListener("drop", handleDrop);
    card.addEventListener("animationend", () => card.classList.remove("is-incorrect"));
    targetGrid.append(card);
  });
};

const finishGame = () => {
  victorySummary.textContent = `Você encontrou ${score} de ${roundQueue.length} conexões no nível ${activeLevel().name}, com ${mistakes} erro${mistakes === 1 ? "" : "s"}.`;
  ReabilityDaily.goals.showGoalResult(victorySummary, rateConnectionGoal());
  victoryDialog.showModal();
};

const goToNextRound = () => {
  if (!roundComplete) return;

  if (currentRound === roundQueue.length - 1) {
    finishGame();
    return;
  }

  currentRound += 1;
  renderRound();
  looseCard.focus();
};

const startGame = () => {
  currentRound = 0;
  score = 0;
  mistakes = 0;
  roundQueue = shuffle(rounds).slice(0, activeLevel().roundCount);
  if (victoryDialog.open) victoryDialog.close();
  startScreen.hidden = true;
  gameArea.hidden = false;
  selectedLevelElement.textContent = `${activeLevel().name} · ${activeLevel().roundCount} conexões`;
  updateDailyStatus();
  renderRound();
};

const selectLevel = async (event) => {
  activeLevelKey = event.currentTarget.dataset.level;

  if (await requestDailyAttempt()) startGame();
};

const restartGame = async () => {
  if (await requestDailyAttempt()) startGame();
};

const showLevelSelection = () => {
  if (victoryDialog.open) victoryDialog.close();
  gameArea.hidden = true;
  startScreen.hidden = false;
  updateDailyStatus();
  difficultyButtons[0].focus();
};

looseCard.addEventListener("click", selectLooseCard);
looseCard.addEventListener("dragstart", (event) => {
  if (roundComplete) {
    event.preventDefault();
    return;
  }

  selected = true;
  looseCard.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", "idea-card");
});
looseCard.addEventListener("dragend", () => looseCard.classList.remove("is-dragging"));
restartButton.addEventListener("click", restartGame);
changeLevelButton.addEventListener("click", showLevelSelection);
nextButton.addEventListener("click", goToNextRound);
playAgainButton.addEventListener("click", restartGame);
difficultyButtons.forEach((button) => button.addEventListener("click", selectLevel));

updateDailyStatus();
