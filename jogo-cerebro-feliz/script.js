const board = document.querySelector("#brain-board");
const gameCard = document.querySelector(".game-card");
const startScreen = document.querySelector("#start-screen");
const gameInterface = document.querySelector("#game-interface");
const difficultyButtons = document.querySelectorAll(".difficulty-option");
const stopButton = document.querySelector("#stop-button");
const scoreElement = document.querySelector("#score");
const timeLeftElement = document.querySelector("#time-left");
const selectedLevelElement = document.querySelector("#selected-level");
const gameMessage = document.querySelector("#game-message");
const resultDialog = document.querySelector("#result-dialog");
const resultSummary = document.querySelector("#result-summary");
const playAgainButton = document.querySelector("#play-again-button");
const chooseLevelButton = document.querySelector("#choose-level-button");

const cellCount = 36;
const gameDuration = 45;

let activeDifficulty;
let activeCellIndex = -1;
let previousBrainIndex = -1;
let cells = [];
let score = 0;
let timeLeft = gameDuration;
let isPlaying = false;
let isTransitioning = false;
let timerInterval;
let moveTimeout;

const createBoard = () => {
  board.replaceChildren();
  cells = Array.from({ length: cellCount }, (_, index) => {
    const cell = document.createElement("button");
    cell.className = "brain-cell";
    cell.type = "button";
    cell.dataset.index = index;
    cell.setAttribute("aria-label", `Espaço ${index + 1}`);
    cell.tabIndex = -1;
    cell.addEventListener("click", handleCellClick);
    board.append(cell);
    return cell;
  });
};

const updateStatus = () => {
  scoreElement.textContent = score;
  timeLeftElement.textContent = timeLeft;
};

const clearActiveCell = () => {
  if (activeCellIndex === -1) return;

  const previousCell = cells[activeCellIndex];
  previousCell.classList.remove("is-active", "is-hit");
  previousCell.textContent = "";
  previousCell.tabIndex = -1;
  previousCell.setAttribute("aria-label", `Espaço ${activeCellIndex + 1}`);
};

const moveBrain = (placeAtCenter = false) => {
  clearActiveCell();

  let nextIndex;
  if (placeAtCenter) {
    nextIndex = Math.floor(cellCount / 2);
  } else {
    do {
      nextIndex = Math.floor(Math.random() * cellCount);
    } while (nextIndex === previousBrainIndex && cellCount > 1);
  }

  activeCellIndex = nextIndex;
  previousBrainIndex = nextIndex;
  const activeCell = cells[activeCellIndex];
  activeCell.classList.add("is-active");
  activeCell.innerHTML = '<svg class="brain-target" viewBox="0 0 64 64" aria-hidden="true"><use href="../assets/icons/neuro-icons.svg#brain"></use></svg>';
  activeCell.tabIndex = 0;
  activeCell.setAttribute("aria-label", "Cérebro presente: toque para marcar um ponto");
};

const stopTimers = () => {
  window.clearInterval(timerInterval);
  window.clearTimeout(moveTimeout);
};

const scheduleNextMove = () => {
  window.clearTimeout(moveTimeout);
  moveTimeout = window.setTimeout(() => {
    if (!isPlaying || isTransitioning) return;

    moveBrain();
    scheduleNextMove();
  }, activeDifficulty.delay);
};

const finishGame = (wasStopped = false) => {
  if (!isPlaying) return;

  isPlaying = false;
  isTransitioning = false;
  stopTimers();
  clearActiveCell();
  activeCellIndex = -1;
  document.body.classList.remove("game-in-progress");
  gameCard.classList.remove("is-playing");
  gameMessage.textContent = "Desafio encerrado.";
  resultSummary.textContent = wasStopped
    ? `Você marcou ${score} ${score === 1 ? "ponto" : "pontos"} antes de encerrar o desafio.`
    : `Tempo encerrado! Você marcou ${score} ${score === 1 ? "ponto" : "pontos"}.`;
  resultDialog.showModal();
};

function handleCellClick(event) {
  const clickedIndex = Number(event.currentTarget.dataset.index);

  if (!isPlaying || isTransitioning || clickedIndex !== activeCellIndex) return;

  isTransitioning = true;
  window.clearTimeout(moveTimeout);
  const hitCell = event.currentTarget;
  score += 1;
  updateStatus();
  activeCellIndex = -1;
  hitCell.classList.remove("is-active");
  hitCell.classList.add("is-hit");
  hitCell.tabIndex = -1;
  gameMessage.textContent = "Boa! +1 ponto.";

  window.setTimeout(() => {
    hitCell.classList.remove("is-hit");
    hitCell.textContent = "";
    hitCell.setAttribute("aria-label", `Espaço ${clickedIndex + 1}`);

    if (isPlaying) {
      isTransitioning = false;
      moveBrain();
      scheduleNextMove();
    }
  }, 110);
}

const startGame = () => {
  stopTimers();
  resultDialog.close();
  score = 0;
  timeLeft = gameDuration;
  activeCellIndex = -1;
  previousBrainIndex = -1;
  isPlaying = true;
  isTransitioning = false;
  document.body.classList.add("game-in-progress");
  gameCard.classList.add("is-playing");
  startScreen.hidden = true;
  gameInterface.hidden = false;
  selectedLevelElement.textContent = `${activeDifficulty.name} · cérebro a cada ${activeDifficulty.label}`;
  createBoard();
  updateStatus();
  gameMessage.textContent = "Toque no cérebro quando ele aparecer.";
  moveBrain(true);
  scheduleNextMove();

  timerInterval = window.setInterval(() => {
    timeLeft -= 1;
    updateStatus();

    if (timeLeft <= 0) finishGame();
  }, 1000);
};

const selectDifficulty = (event) => {
  const button = event.currentTarget;
  const delayInSeconds = Number(button.dataset.delay) / 1000;
  activeDifficulty = {
    name: button.dataset.level,
    delay: Number(button.dataset.delay),
    label: delayInSeconds === 1 ? "1 segundo" : `${delayInSeconds.toString().replace(".", ",")} segundos`,
  };
  startGame();
};

const showLevelSelection = () => {
  resultDialog.close();
  gameInterface.hidden = true;
  startScreen.hidden = false;
  difficultyButtons[0].focus();
};

difficultyButtons.forEach((button) => button.addEventListener("click", selectDifficulty));
playAgainButton.addEventListener("click", startGame);
stopButton.addEventListener("click", () => finishGame(true));
chooseLevelButton.addEventListener("click", showLevelSelection);
