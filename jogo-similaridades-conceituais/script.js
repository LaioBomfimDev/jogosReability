const GAME_ID = "conexoes-de-ideias";
const GAME_TITLE = "Conexões de Ideias";

const LEVELS = {
  easy: {
    name: "Fácil",
    roundCount: 4,
    targetCount: 3,
    timeLimit: null,
    goals: { goodMistakes: 2, standoutMistakes: 0 },
  },
  medium: {
    name: "Médio",
    roundCount: 6,
    targetCount: 5,
    timeLimit: 25,
    goals: { goodMistakes: 3, standoutMistakes: 1 },
  },
  hard: {
    name: "Difícil",
    roundCount: 8,
    targetCount: 6,
    timeLimit: 15,
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
  {
    loose: { emoji: "🔨", label: "Martelo" },
    targets: [
      { emoji: "📌", label: "Prego", correct: true },
      { emoji: "🪵", label: "Tábua" },
      { emoji: "🧱", label: "Tijolo" },
      { emoji: "🔧", label: "Chave inglesa" },
    ],
    connection: "O martelo é usado para fixar o prego.",
  },
  {
    loose: { emoji: "👟", label: "Sapato" },
    targets: [
      { emoji: "🧦", label: "Meia", correct: true },
      { emoji: "👒", label: "Chapéu" },
      { emoji: "👖", label: "Calça" },
      { emoji: "🧤", label: "Luva" },
    ],
    connection: "Usamos a meia antes de calçar o sapato para proteger os pés.",
  },
  {
    loose: { emoji: "🐝", label: "Abelha" },
    targets: [
      { emoji: "🌸", label: "Flor", correct: true },
      { emoji: "🍯", label: "Mel" },
      { emoji: "🍃", label: "Folha" },
      { emoji: "🕸️", label: "Teia" },
    ],
    connection: "A abelha visita a flor para colher o pólen.",
  },
  {
    loose: { emoji: "✏️", label: "Lápis" },
    targets: [
      { emoji: "🧼", label: "Borracha", correct: true },
      { emoji: "📏", label: "Régua" },
      { emoji: "📎", label: "Clipes" },
      { emoji: "✒️", label: "Caneta" },
    ],
    connection: "A borracha é usada para apagar o que escrevemos com o lápis.",
  },
  {
    loose: { emoji: "☀️", label: "Sol" },
    targets: [
      { emoji: "🕶️", label: "Óculos de sol", correct: true },
      { emoji: "☂️", label: "Guarda-chuva" },
      { emoji: "🧢", label: "Boné" },
      { emoji: "🧥", label: "Casaco" },
    ],
    connection: "Os óculos de sol protegem nossos olhos da luz forte do sol.",
  },
  {
    loose: { emoji: "🐶", label: "Cachorro" },
    targets: [
      { emoji: "🦴", label: "Osso", correct: true },
      { emoji: "🎗️", label: "Coleira" },
      { emoji: "🏠", label: "Casinha" },
      { emoji: "⚽", label: "Bola" },
    ],
    connection: "O osso é um alimento e brinquedo muito apreciado pelos cachorros.",
  },
  {
    loose: { emoji: "🐦", label: "Pássaro" },
    targets: [
      { emoji: "🪹", label: "Ninho", correct: true },
      { emoji: "🕸️", label: "Gaiola" },
      { emoji: "🪶", label: "Pena" },
      { emoji: "🌿", label: "Galho" },
    ],
    connection: "O ninho é a casa que o pássaro constrói para seus filhotes.",
  },
  {
    loose: { emoji: "🪴", label: "Planta" },
    targets: [
      { emoji: "🚿", label: "Regador", correct: true },
      { emoji: "🏺", label: "Vaso" },
      { emoji: "🌱", label: "Semente" },
      { emoji: "⛏️", label: "Pá" },
    ],
    connection: "Usamos o regador para fornecer a água que ajuda a planta a crescer.",
  },
  {
    loose: { emoji: "💻", label: "Computador" },
    targets: [
      { emoji: "🖱️", label: "Mouse", correct: true },
      { emoji: "⌨️", label: "Teclado" },
      { emoji: "🎧", label: "Fone" },
      { emoji: "🔌", label: "Cabo" },
    ],
    connection: "O mouse é usado para navegar na tela do computador.",
  },
  {
    loose: { emoji: "🍴", label: "Garfo" },
    targets: [
      { emoji: "🍽️", label: "Prato", correct: true },
      { emoji: "🥄", label: "Colher" },
      { emoji: "🔪", label: "Faca" },
      { emoji: "🥤", label: "Copo" },
    ],
    connection: "O garfo e o prato são utensílios usados durante as refeições.",
  },
  {
    loose: { emoji: "👓", label: "Óculos" },
    targets: [
      { emoji: "📖", label: "Livro", correct: true },
      { emoji: "🔎", label: "Lupa" },
      { emoji: "✏️", label: "Lápis" },
      { emoji: "👁️", label: "Olho" },
    ],
    connection: "Os óculos ajudam a ler o livro com mais clareza.",
  },
  {
    loose: { emoji: "🐱", label: "Gato" },
    targets: [
      { emoji: "🧶", label: "Novelo de Lã", correct: true },
      { emoji: "🐟", label: "Peixe" },
      { emoji: "🐭", label: "Rato" },
      { emoji: "🥛", label: "Leite" },
    ],
    connection: "Os gatos adoram brincar com novelos de lã.",
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
const timerElement = document.querySelector("#timer");
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
let dailyAttemptRecorded = false;
let dailyAttemptPending = false;
let timerInterval = null;
let secondsLeft = 0;

const stopRoundTimer = () => {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
};

const handleTimeOut = () => {
  if (roundComplete) return;

  roundComplete = true;
  mistakes += 1;
  updateStatus();
  looseCard.disabled = true;
  targetGrid.querySelectorAll("button").forEach((card) => {
    card.disabled = true;
  });
  deselectLooseCard();
  instruction.textContent = "Tempo esgotado!";
  
  const correctOption = roundQueue[currentRound].targets.find((t) => t.correct);
  feedback.textContent = `A resposta correta era: ${correctOption.label}. ${roundQueue[currentRound].connection}`;

  nextButton.textContent = currentRound === roundQueue.length - 1 ? "Ver resultado" : "Próxima conexão";
  nextButton.hidden = false;
  nextButton.focus();
};

const startRoundTimer = () => {
  stopRoundTimer();
  const limit = activeLevel().timeLimit;
  if (!limit) {
    timerElement.textContent = "Livre";
    timerElement.style.color = "";
    return;
  }

  secondsLeft = limit;
  timerElement.textContent = `${secondsLeft}s`;
  timerElement.style.color = "";

  timerInterval = window.setInterval(() => {
    secondsLeft -= 1;
    timerElement.textContent = `${secondsLeft}s`;

    if (secondsLeft <= 5) {
      timerElement.style.color = "#b35a4b";
    }

    if (secondsLeft <= 0) {
      stopRoundTimer();
      handleTimeOut();
    }
  }, 1000);
};

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

const showDailyLimit = () => {
  ReabilityDaily.showLimitDialog({
    gameTitle: GAME_TITLE,
    levelName: activeLevel().name,
  });
};

const ensureDailyAllowance = async () => {
  const usage = ReabilityDaily.getUsage(GAME_ID, activeLevelKey);
  updateDailyStatus();

  if (usage.remaining === 0) {
    showDailyLimit();
    return false;
  }

  await ReabilityDaily.ensurePlayerName();
  updateDailyStatus();
  return true;
};

const recordDailyAttempt = async () => {
  if (dailyAttemptRecorded) return true;
  if (dailyAttemptPending) return false;

  dailyAttemptPending = true;
  await ReabilityDaily.ensurePlayerName();
  const attempt = ReabilityDaily.recordAttempt(GAME_ID, activeLevelKey);
  dailyAttemptPending = false;
  updateDailyStatus();

  if (!attempt.ok) {
    showDailyLimit();
    return false;
  }

  dailyAttemptRecorded = true;
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

const resolveChoice = async (target) => {
  if (roundComplete) return;

  if (!selected) {
    selectLooseCard();
    feedback.textContent = "Primeiro selecione a carta solta; depois escolha uma imagem.";
    return;
  }

  if (!(await recordDailyAttempt())) return;

  if (!target.dataset.correct) {
    mistakes += 1;
    updateStatus();
    feedback.textContent = "Essa conexão não é a que procuramos. Tente pensar no que as imagens podem fazer.";
    target.classList.remove("is-incorrect");
    window.requestAnimationFrame(() => target.classList.add("is-incorrect"));
    return;
  }

  roundComplete = true;
  stopRoundTimer();
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
  let distractors = shuffle(round.targets.filter((target) => !target.correct));

  const neededDistractors = activeLevel().targetCount - 1;
  if (distractors.length < neededDistractors) {
    // Coletar distratores de outras rodadas para completar o número necessário
    const otherRounds = rounds.filter((r) => r.loose.label !== round.loose.label);
    const poolOfExtraDistractors = [];
    otherRounds.forEach((r) => {
      r.targets.forEach((t) => {
        // Adiciona apenas se não for o item correto da rodada atual e se o rótulo for único
        if (!t.correct && t.label !== correctTarget.label && !distractors.some((d) => d.label === t.label)) {
          poolOfExtraDistractors.push(t);
        }
      });
    });
    // Embaralha o pool extra e pega o que falta
    const extraDistractors = shuffle(poolOfExtraDistractors);
    for (const extra of extraDistractors) {
      if (distractors.length >= neededDistractors) break;
      if (!distractors.some((d) => d.label === extra.label)) {
        distractors.push(extra);
      }
    }
  } else {
    // Se já temos o suficiente ou mais, apenas corta
    distractors = distractors.slice(0, neededDistractors);
  }

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

  startRoundTimer();
};

const finishGame = () => {
  stopRoundTimer();
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
  stopRoundTimer();
  currentRound = 0;
  score = 0;
  mistakes = 0;
  dailyAttemptRecorded = false;
  dailyAttemptPending = false;
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

  if (await ensureDailyAllowance()) startGame();
};

const restartGame = async () => {
  if (await ensureDailyAllowance()) startGame();
};

const showLevelSelection = () => {
  stopRoundTimer();
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
