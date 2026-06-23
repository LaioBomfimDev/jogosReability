const form = document.querySelector("#guess-form");
const guessInput = document.querySelector("#guess");
const instruction = document.querySelector("#instruction");
const feedback = document.querySelector("#feedback");
const attemptsElement = document.querySelector("#attempts");
const selectedLevel = document.querySelector("#selected-level");
const difficultyScreen = document.querySelector("#difficulty-screen");
const gameArea = document.querySelector("#game-area");
const difficultyButtons = document.querySelectorAll(".difficulty-option");
const newGameButton = document.querySelector("#new-game-button");
const changeLevelButton = document.querySelector("#change-level-button");
const submitButton = form.querySelector("button[type='submit']");

let activeLevel;
let secretNumber;
let attempts;
let hasFinished;

const createSecretNumber = () => Math.floor(Math.random() * activeLevel.limit) + 1;

const resetGame = () => {
  secretNumber = createSecretNumber();
  attempts = 0;
  hasFinished = false;
  form.reset();
  guessInput.min = "1";
  guessInput.max = activeLevel.limit;
  guessInput.disabled = false;
  submitButton.disabled = false;
  instruction.textContent = `Escolha um número inteiro entre 1 e ${activeLevel.limit}.`;
  feedback.textContent = "";
  attemptsElement.textContent = "Tentativas: 0";
  guessInput.focus();
};

const selectLevel = (event) => {
  const button = event.currentTarget;

  activeLevel = {
    name: button.dataset.level,
    limit: Number(button.dataset.limit),
  };
  selectedLevel.textContent = `${activeLevel.name} · 1 a ${activeLevel.limit}`;
  difficultyScreen.hidden = true;
  gameArea.hidden = false;
  resetGame();
};

const showDifficultyScreen = () => {
  gameArea.hidden = true;
  difficultyScreen.hidden = false;
  feedback.textContent = "";
  difficultyButtons[0].focus();
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
  attemptsElement.textContent = `Tentativas: ${attempts}`;

  if (guess === secretNumber) {
    hasFinished = true;
    instruction.textContent = "Desafio concluído!";
    feedback.textContent = `Você encontrou o número ${secretNumber} em ${attempts} ${attempts === 1 ? "tentativa" : "tentativas"}.`;
    guessInput.disabled = true;
    submitButton.disabled = true;
    return;
  }

  feedback.textContent = guess > secretNumber ? "O número secreto é menor." : "O número secreto é maior.";
  guessInput.value = "";
  guessInput.focus();
});

difficultyButtons.forEach((button) => button.addEventListener("click", selectLevel));
newGameButton.addEventListener("click", resetGame);
changeLevelButton.addEventListener("click", showDifficultyScreen);
