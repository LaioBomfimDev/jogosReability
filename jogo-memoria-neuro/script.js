const GAME_ID = "memoria-visual";
const GAME_TITLE = "Memória em Movimento";

const cardSymbols = [
  { symbol: "🧠", label: "Cérebro" },
  { symbol: "🧬", label: "Neurociência" },
  { symbol: "🦴", label: "Osso" },
  { symbol: "🖐️", label: "Movimento" },
  { symbol: "👁️", label: "Visão" },
  { symbol: "👂", label: "Audição" },
  { symbol: "🗣️", label: "Comunicação" },
  { symbol: "🩺", label: "Cuidado" },
  { symbol: "🧩", label: "Puzzle" },
  { symbol: "⭐", label: "Destaque" },
];

const LEVELS = {
  easy: {
    name: "Fácil",
    pairCount: 6,
    goals: { goodMoves: 16, standoutMoves: 12, goodTime: 90, standoutTime: 60 },
  },
  medium: {
    name: "Médio",
    pairCount: 8,
    goals: { goodMoves: 24, standoutMoves: 18, goodTime: 120, standoutTime: 80 },
  },
  hard: {
    name: "Difícil",
    pairCount: 10,
    goals: { goodMoves: 34, standoutMoves: 26, goodTime: 160, standoutTime: 110 },
  },
};

const board = document.querySelector("#game-board");
const startScreen = document.querySelector("#start-screen");
const gameArea = document.querySelector("#game-area");
const difficultyButtons = document.querySelectorAll(".difficulty-option");
const dailyStatus = document.querySelector("#daily-status");
const gameDailyStatus = document.querySelector("#game-daily-status");
const selectedLevelElement = document.querySelector("#selected-level");
const matchesElement = document.querySelector("#matches");
const totalMatchesElement = document.querySelector("#total-matches");
const movesElement = document.querySelector("#moves");
const timerElement = document.querySelector("#timer");
const restartButton = document.querySelector("#restart-button");
const changeLevelButton = document.querySelector("#change-level-button");
const shareButton = document.querySelector("#share-button");
const shareFeedback = document.querySelector("#share-feedback");
const victoryDialog = document.querySelector("#victory-dialog");
const victorySummary = document.querySelector("#victory-summary");
const playAgainButton = document.querySelector("#play-again-button");

let activeLevelKey = "easy";
let firstCard;
let secondCard;
let isResolving = false;
let matches = 0;
let moves = 0;
let startedAt;
let timerInterval;

const activeLevel = () => LEVELS[activeLevelKey];

const activeSymbols = () => cardSymbols.slice(0, activeLevel().pairCount);

const shuffle = (cards) => {
  const shuffledCards = [...cards];

  for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledCards[index], shuffledCards[randomIndex]] = [
      shuffledCards[randomIndex],
      shuffledCards[index],
    ];
  }

  return shuffledCards;
};

const formatTime = (elapsedMilliseconds) => {
  const totalSeconds = Math.floor(elapsedMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
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

const rateMemoryGoal = (elapsedSeconds) => {
  const goals = activeLevel().goals;

  if (moves <= goals.standoutMoves && elapsedSeconds <= goals.standoutTime) {
    return {
      tier: "standout",
      label: "Meta destaque",
      message: `Destaque alcançado: até ${goals.standoutMoves} tentativas e ${goals.standoutTime}s.`,
    };
  }

  if (moves <= goals.goodMoves && elapsedSeconds <= goals.goodTime) {
    return {
      tier: "good",
      label: "Boa meta",
      message: `Boa meta alcançada. Destaque: até ${goals.standoutMoves} tentativas e ${goals.standoutTime}s.`,
    };
  }

  return {
    tier: "training",
    label: "Meta do dia",
    message: `Boa meta: até ${goals.goodMoves} tentativas e ${goals.goodTime}s. Destaque: até ${goals.standoutMoves} tentativas e ${goals.standoutTime}s.`,
  };
};

const updateTimer = () => {
  if (startedAt) {
    timerElement.textContent = formatTime(Date.now() - startedAt);
  }
};

const startTimer = () => {
  if (startedAt) return;

  startedAt = Date.now();
  updateTimer();
  timerInterval = window.setInterval(updateTimer, 1000);
};

const stopTimer = () => {
  window.clearInterval(timerInterval);
};

const updateStatus = () => {
  matchesElement.textContent = matches;
  movesElement.textContent = moves;
};

const resetTurn = () => {
  firstCard = undefined;
  secondCard = undefined;
  isResolving = false;
};

const finishGame = () => {
  stopTimer();
  const elapsedMilliseconds = startedAt ? Date.now() - startedAt : 0;
  const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

  victorySummary.textContent = `Você concluiu o nível ${activeLevel().name} em ${moves} tentativas e ${timerElement.textContent}.`;
  ReabilityDaily.goals.showGoalResult(victorySummary, rateMemoryGoal(elapsedSeconds));
  victoryDialog.showModal();
};

const resolveTurn = () => {
  const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

  if (isMatch) {
    firstCard.classList.add("is-matched");
    secondCard.classList.add("is-matched");
    firstCard.disabled = true;
    secondCard.disabled = true;
    matches += 1;
    updateStatus();
    resetTurn();

    if (matches === activeLevel().pairCount) {
      window.setTimeout(finishGame, 300);
    }

    return;
  }

  window.setTimeout(() => {
    firstCard.classList.remove("is-open");
    secondCard.classList.remove("is-open");
    resetTurn();
  }, 700);
};

const handleCardClick = (event) => {
  const selectedCard = event.currentTarget;

  if (
    isResolving ||
    selectedCard === firstCard ||
    selectedCard.classList.contains("is-matched")
  ) {
    return;
  }

  startTimer();
  selectedCard.classList.add("is-open");

  if (!firstCard) {
    firstCard = selectedCard;
    return;
  }

  secondCard = selectedCard;
  isResolving = true;
  moves += 1;
  updateStatus();
  resolveTurn();
};

const createCard = ({ symbol, label }, index) => {
  const card = document.createElement("button");
  const cardId = `card-${index + 1}`;

  card.className = "memory-card";
  card.type = "button";
  card.dataset.symbol = symbol;
  card.setAttribute("aria-label", `Carta ${index + 1}`);
  card.setAttribute("aria-pressed", "false");
  card.innerHTML = `
    <span class="card-face card-front" aria-hidden="true"></span>
    <span class="card-face card-back" id="${cardId}" aria-hidden="true" title="${label}">${symbol}</span>
  `;
  card.addEventListener("click", handleCardClick);

  return card;
};

const startGame = () => {
  stopTimer();
  board.replaceChildren();
  if (victoryDialog.open) victoryDialog.close();
  shareFeedback.textContent = "";
  firstCard = undefined;
  secondCard = undefined;
  isResolving = false;
  matches = 0;
  moves = 0;
  startedAt = undefined;
  timerElement.textContent = "00:00";
  totalMatchesElement.textContent = activeLevel().pairCount;
  selectedLevelElement.textContent = `${activeLevel().name} · ${activeLevel().pairCount} pares`;
  startScreen.hidden = true;
  gameArea.hidden = false;
  updateStatus();
  updateDailyStatus();

  const symbols = activeSymbols();
  const shuffledDeck = shuffle([...symbols, ...symbols]);
  shuffledDeck.forEach((card, index) => board.append(createCard(card, index)));
};

const selectLevel = async (event) => {
  activeLevelKey = event.currentTarget.dataset.level;

  if (await requestDailyAttempt()) startGame();
};

const restartGame = async () => {
  if (await requestDailyAttempt()) startGame();
};

const showLevelSelection = () => {
  stopTimer();
  if (victoryDialog.open) victoryDialog.close();
  gameArea.hidden = true;
  startScreen.hidden = false;
  updateDailyStatus();
  difficultyButtons[0].focus();
};

const shareChallenge = async () => {
  const shareText = `Consegue encontrar todos os pares no nível ${activeLevel().name} do desafio Memória em Movimento?`;

  try {
    if (navigator.share) {
      await navigator.share({ title: "Memória em Movimento", text: shareText });
      shareFeedback.textContent = "Desafio compartilhado.";
      return;
    }

    await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
    shareFeedback.textContent = "Link copiado. Agora é só compartilhar com quem você quiser!";
  } catch (error) {
    if (error.name !== "AbortError") {
      shareFeedback.textContent = "Não foi possível compartilhar agora. Tente copiar o link da página.";
    }
  }
};

difficultyButtons.forEach((button) => button.addEventListener("click", selectLevel));
restartButton.addEventListener("click", restartGame);
changeLevelButton.addEventListener("click", showLevelSelection);
playAgainButton.addEventListener("click", restartGame);
shareButton.addEventListener("click", shareChallenge);

updateDailyStatus();
