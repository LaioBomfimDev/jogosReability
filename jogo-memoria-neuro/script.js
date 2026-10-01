const GAME_ID = "memoria-visual";
const GAME_TITLE = "Memória Visual";

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
const startButton = document.querySelector("#memory-start-button");
const timeLimitSelect = document.querySelector("#memory-time-limit");
const revealTimeSelect = document.querySelector("#memory-reveal-time");

let activeLevelKey = "easy";
let firstCard;
let secondCard;
let isResolving = false;
let matches = 0;
let moves = 0;
let startedAt;
let timerInterval;
let turnTimeout;
let dailyAttemptRecorded = false;
let dailyAttemptPending = false;
let timeLimitSeconds = 90;
let revealTime = 700;
let gameFinished = false;

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
    label: "Meta de treino",
    message: `Boa meta: até ${goals.goodMoves} tentativas e ${goals.goodTime}s. Destaque: até ${goals.standoutMoves} tentativas e ${goals.standoutTime}s.`,
  };
};

const updateTimer = () => {
  if (startedAt) {
    const elapsed = Date.now() - startedAt;
    if (timeLimitSeconds) {
      const remaining = Math.max(0, timeLimitSeconds * 1000 - elapsed);
      timerElement.textContent = formatTime(remaining);
      if (remaining <= 0) finishGame(true);
    } else timerElement.textContent = formatTime(elapsed);
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

const finishGame = (timedOut = false) => {
  if (gameFinished) return;
  gameFinished = true;
  ReabilityClinic.finish({ moves, matches, errors: moves - matches, timedOut });
  stopTimer();
  const elapsedMilliseconds = startedAt ? Date.now() - startedAt : 0;
  const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

  victorySummary.textContent = timedOut
    ? `Tempo encerrado: ${matches} de ${activeLevel().pairCount} pares encontrados em ${moves} tentativas.`
    : `Você concluiu o nível ${activeLevel().name} em ${moves} tentativas e ${timerElement.textContent}.`;
  ReabilityDaily.goals.showGoalResult(victorySummary, rateMemoryGoal(elapsedSeconds));
  victoryDialog.showModal();
};

const resolveTurn = () => {
  const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;
  ReabilityClinic.round({ correct: isMatch, selected: [firstCard.dataset.symbol, secondCard.dataset.symbol], moves });

  if (isMatch) {
    firstCard.classList.add("is-matched");
    secondCard.classList.add("is-matched");
    firstCard.disabled = true;
    secondCard.disabled = true;
    matches += 1;
    updateStatus();
    resetTurn();

    if (matches === activeLevel().pairCount) {
      turnTimeout = window.setTimeout(finishGame, 300);
    }

    return;
  }

  turnTimeout = window.setTimeout(() => {
    firstCard.classList.remove("is-open");
    secondCard.classList.remove("is-open");
    resetTurn();
  }, revealTime);
};

const handleCardClick = async (event) => {
  const selectedCard = event.currentTarget;

  if (
    isResolving ||
    selectedCard === firstCard ||
    selectedCard.classList.contains("is-matched")
  ) {
    return;
  }

  if (!(await recordDailyAttempt())) return;

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

const startGame = async () => {
  await ReabilityClinic.confirmReady();
  await globalThis.ReabilityGameShell?.countdown?.();
  window.clearTimeout(turnTimeout);
  timeLimitSeconds = Math.max(0, Math.min(600, Number(timeLimitSelect.value) || 0));
  revealTime = Math.max(250, Math.min(2500, Number(revealTimeSelect.value) || 700));
  ReabilityClinic.start(GAME_ID, activeLevelKey, { pairs:activeLevel().pairCount, timeLimitSeconds, revealTimeMs:revealTime });
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
  dailyAttemptRecorded = false;
  dailyAttemptPending = false;
  gameFinished = false;
  timerElement.textContent = timeLimitSeconds ? formatTime(timeLimitSeconds * 1000) : "00:00";
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

const selectLevel = (event) => {
  activeLevelKey = event.currentTarget.dataset.level;
  difficultyButtons.forEach(button=>{const selected=button.dataset.level===activeLevelKey;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
  selectedLevelElement.textContent = `${activeLevel().name} · ${activeLevel().pairCount} pares`;
};

const restartGame = async () => {
  if (await ensureDailyAllowance()) await startGame();
};

const showLevelSelection = () => {
  window.clearTimeout(turnTimeout);
  ReabilityClinic.finish({ moves, matches }, "interrupted");
  stopTimer();
  if (victoryDialog.open) victoryDialog.close();
  gameArea.hidden = true;
  startScreen.hidden = false;
  updateDailyStatus();
  difficultyButtons[0].focus();
};

const shareChallenge = async () => {
  const shareText = `Consegue encontrar todos os pares no nível ${activeLevel().name} do desafio Memória Visual?`;

  try {
    if (navigator.share) {
      await navigator.share({ title: "Memória Visual", text: shareText });
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
startButton.addEventListener("click", async()=>{ if(await ensureDailyAllowance()) await startGame(); });
restartButton.addEventListener("click", restartGame);
changeLevelButton.addEventListener("click", showLevelSelection);
playAgainButton.addEventListener("click", restartGame);
shareButton.addEventListener("click", shareChallenge);

updateDailyStatus();
selectLevel({ currentTarget:difficultyButtons[0] });
