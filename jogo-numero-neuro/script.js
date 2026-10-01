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
const startButton = document.querySelector("#number-start-button");
const maxAttemptsSelect = document.querySelector("#number-max-attempts");

let activeLevel;
let secretNumber;
let attempts;
let hasFinished;
let guessHistory;
let dailyAttemptRecorded = false;
let dailyAttemptPending = false;
let maxAttempts = 8;

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

const showDailyLimit = () => {
  ReabilityDaily.showLimitDialog({
    gameTitle: GAME_TITLE,
    levelName: activeLevel.name,
  });
};

const ensureDailyAllowance = async () => {
  const usage = ReabilityDaily.getUsage(GAME_ID, activeLevel.key);
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
  const attempt = ReabilityDaily.recordAttempt(GAME_ID, activeLevel.key);
  dailyAttemptPending = false;
  updateDailyStatus();

  if (!attempt.ok) {
    showDailyLimit();
    return false;
  }

  dailyAttemptRecorded = true;
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

const resetGame = async () => {
  await ReabilityClinic.confirmReady();
  await globalThis.ReabilityGameShell?.countdown?.();
  maxAttempts = Math.max(0, Math.min(50, Number(maxAttemptsSelect.value) || 0));
  ReabilityClinic.start(GAME_ID, activeLevel.key, { limit:activeLevel.limit, maxAttempts });
  secretNumber = createSecretNumber();
  attempts = 0;
  hasFinished = false;
  guessHistory = [];
  dailyAttemptRecorded = false;
  dailyAttemptPending = false;
  form.reset();
  guessInput.min = "1";
  guessInput.max = activeLevel.limit;
  guessInput.disabled = false;
  submitButton.disabled = false;
  instruction.textContent = `Escolha um número inteiro entre 1 e ${activeLevel.limit}.${maxAttempts?` Você tem até ${maxAttempts} tentativas.`:''} Seus palpites aparecerão abaixo com a pista de maior/menor.`;
  feedback.textContent = "";
  clearGoalResult();
  renderGuessHistory();
  updateDailyStatus();
  guessInput.focus();
};

const selectLevel = (event) => {
  const button = event.currentTarget;

  activeLevel = {
    key: LEVEL_KEYS[button.dataset.level],
    name: button.dataset.level,
    limit: Number(button.dataset.limit),
  };

  selectedLevel.textContent = `${activeLevel.name} · 1 a ${activeLevel.limit}`;
  difficultyButtons.forEach(candidate=>{const selected=candidate===button;candidate.classList.toggle('is-selected',selected);candidate.setAttribute('aria-pressed',String(selected));});
};

const startSelectedGame = async()=>{
  if (!(await ensureDailyAllowance())) return;
  difficultyScreen.hidden = true;
  gameArea.hidden = false;
  await resetGame();
};

const showDifficultyScreen = () => {
  ReabilityClinic.finish({ attempts }, "interrupted");
  gameArea.hidden = true;
  difficultyScreen.hidden = false;
  feedback.textContent = "";
  clearGoalResult();
  updateDailyStatus();
  difficultyButtons[0].focus();
};

const startNewGame = async () => {
  if (await ensureDailyAllowance()) await resetGame();
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (hasFinished || !activeLevel) return;

  const guess = Number(guessInput.value);

  if (!Number.isInteger(guess) || guess < 1 || guess > activeLevel.limit) {
    feedback.textContent = `Digite um número inteiro de 1 a ${activeLevel.limit}.`;
    return;
  }

  if (!(await recordDailyAttempt())) return;

  attempts += 1;
  const outcome =
    guess === secretNumber ? "correct" : guess < secretNumber ? "higher" : "lower";
  guessHistory.push({ guess, outcome });
  ReabilityClinic.round({ guess, outcome, correct: guess === secretNumber });
  renderGuessHistory();

  if (guess === secretNumber) {
    hasFinished = true;
    ReabilityClinic.finish({ attempts, errors: attempts - 1, won: true });
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

  if(maxAttempts&&attempts>=maxAttempts){
    hasFinished=true;
    ReabilityClinic.finish({ attempts, errors:attempts, won:false, maxAttempts });
    instruction.textContent='Limite de tentativas alcançado.';
    feedback.textContent=`O número era ${secretNumber}. Você pode iniciar um novo número ou ajustar a configuração.`;
    guessInput.disabled=true;submitButton.disabled=true;
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
startButton.addEventListener('click',startSelectedGame);
newGameButton.addEventListener("click", startNewGame);
changeLevelButton.addEventListener("click", showDifficultyScreen);

updateDailyStatus();
selectLevel({currentTarget:difficultyButtons[0]});
