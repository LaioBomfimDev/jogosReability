const GAME_ID = "logica-numerica";
const GAME_TITLE = "Lógica Numérica";
const LEVEL_KEYS = {
  Fácil: "easy",
  Médio: "medium",
  Difícil: "hard",
};
const LEVEL_GOALS = {
  easy: { good: 6, standout: 4, goodLabel: "6 tentativas", standoutLabel: "4 tentativas" },
  medium: { good: 9, standout: 7, goodLabel: "9 tentativas", standoutLabel: "7 tentativas" },
  hard: { good: 12, standout: 10, goodLabel: "12 tentativas", standoutLabel: "10 tentativas" },
};

const form = document.querySelector("#guess-form");
const guessInput = document.querySelector("#guess");
const instruction = document.querySelector("#instruction");
const feedback = document.querySelector("#feedback");
const attemptsElement = document.querySelector("#attempts");
const guessHistoryList = document.querySelector("#guess-history-list");
const guessHistoryEmpty = document.querySelector("#guess-history-empty");
const selectedLevel = document.querySelector("#selected-level");
const difficultyScreen = document.querySelector("#difficulty-screen");
const gameArea = document.querySelector("#game-area");
const difficultyButtons = document.querySelectorAll(".difficulty-option");
const dailyStatus = document.querySelector("#daily-status");
const gameDailyStatus = document.querySelector("#game-daily-status");
const newGameButton = document.querySelector("#new-game-button");
const changeLevelButton = document.querySelector("#change-level-button");
const submitButton = form.querySelector("button[type='submit']");

let activeLevel;
let secretNumber;
let attempts;
let hasFinished;
let guessHistory;

const createSecretNumber = () => Math.floor(Math.random() * activeLevel.limit) + 1;

const currentLevelKey = () => activeLevel?.key || "easy";

const currentLevelName = () => activeLevel?.name || "Fácil";

const updateDailyStatus = () => {
  const text = ReabilityDaily.statusText({
    gameId: GAME_ID,
    levelKey: currentLevelKey(),
    levelName: currentLevelName(),
  });

  dailyStatus.textContent = text;
  gameDailyStatus.textContent = text;
  difficultyButtons.forEach((button) => {
    ReabilityDaily.updateLevelLock(button, GAME_ID, LEVEL_KEYS[button.dataset.level]);
  });
};

const requestDailyAttempt = async () => {
  await ReabilityDaily.ensurePlayerName();
  const attempt = ReabilityDaily.recordAttempt(GAME_ID, activeLevel.key);
  updateDailyStatus();

  if (!attempt.ok) {
    ReabilityDaily.showLimitDialog({
      gameTitle: GAME_TITLE,
      levelName: activeLevel.name,
    });
    return false;
  }

  return true;
};

const clearGoalResult = () => {
  feedback.parentElement.querySelector(".goal-result")?.remove();
};

const renderGuessHistory = () => {
  attemptsElement.textContent = `(${attempts})`;
  guessHistoryEmpty.hidden = guessHistory.length > 0;
  guessHistoryList.replaceChildren();

  guessHistory.forEach(({ guess, outcome }) => {
    const item = document.createElement("li");
    const number = document.createElement("strong");
    const hint = document.createElement("span");

    item.className = `guess-history__item guess-history__item--${outcome}`;
    number.textContent = guess;
    hint.textContent =
      outcome === "correct" ? "Acertou" : `Pista: ${outcome === "higher" ? "maior" : "menor"}`;

    item.append(number, hint);
    guessHistoryList.append(item);
  });
};

const resetGame = () => {
  secretNumber = createSecretNumber();
  attempts = 0;
  hasFinished = false;
  guessHistory = [];
  form.reset();
  guessInput.min = "1";
  guessInput.max = activeLevel.limit;
  guessInput.disabled = false;
  submitButton.disabled = false;
  instruction.textContent = `Escolha um número inteiro entre 1 e ${activeLevel.limit}. Seus palpites aparecerão abaixo com a pista de maior/menor.`;
  feedback.textContent = "";
  clearGoalResult();
  renderGuessHistory();
  updateDailyStatus();
  guessInput.focus();
};

const selectLevel = async (event) => {
  const button = event.currentTarget;

  activeLevel = {
    key: LEVEL_KEYS[button.dataset.level],
    name: button.dataset.level,
    limit: Number(button.dataset.limit),
  };

  if (!(await requestDailyAttempt())) return;

  selectedLevel.textContent = `${activeLevel.name} · 1 a ${activeLevel.limit}`;
  difficultyScreen.hidden = true;
  gameArea.hidden = false;
  resetGame();
};

const showDifficultyScreen = () => {
  gameArea.hidden = true;
  difficultyScreen.hidden = false;
  feedback.textContent = "";
  clearGoalResult();
  updateDailyStatus();
  difficultyButtons[0].focus();
};

const startNewGame = async () => {
  if (await requestDailyAttempt()) resetGame();
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (hasFinished || !activeLevel) return;

  const guess = Number(guessInput.value);

  if (!Number.isInteger(guess) || guess < 1 || guess > activeLevel.limit) {
    feedback.textContent = `Digite um número inteiro de 1 a ${activeLevel.limit}.`;
    return;
  }

  attempts += 1;
  const outcome =
    guess === secretNumber ? "correct" : guess < secretNumber ? "higher" : "lower";
  guessHistory.push({ guess, outcome });
  renderGuessHistory();

  if (guess === secretNumber) {
    hasFinished = true;
    instruction.textContent = "Desafio concluído!";
    feedback.textContent = `Você encontrou o número ${secretNumber} em ${attempts} ${attempts === 1 ? "tentativa" : "tentativas"}.`;
    ReabilityDaily.goals.showGoalResult(
      feedback,
      ReabilityDaily.goals.rateLower(attempts, LEVEL_GOALS[activeLevel.key]),
    );
    guessInput.disabled = true;
    submitButton.disabled = true;
    return;
  }

  feedback.textContent =
    guess > secretNumber
      ? "Pista: o número secreto é menor que seu palpite."
      : "Pista: o número secreto é maior que seu palpite.";
  guessInput.value = "";
  guessInput.focus();
});

difficultyButtons.forEach((button) => button.addEventListener("click", selectLevel));
newGameButton.addEventListener("click", startNewGame);
changeLevelButton.addEventListener("click", showDifficultyScreen);

updateDailyStatus();
