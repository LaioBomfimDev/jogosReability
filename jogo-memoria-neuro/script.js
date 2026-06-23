const cardSymbols = [
  { symbol: "🧠", label: "Cérebro" },
  { symbol: "🧬", label: "Neurociência" },
  { symbol: "🦴", label: "Osso" },
  { symbol: "🖐️", label: "Movimento" },
  { symbol: "👁️", label: "Visão" },
  { symbol: "👂", label: "Audição" },
  { symbol: "🗣️", label: "Comunicação" },
  { symbol: "🩺", label: "Cuidado" },
];

const board = document.querySelector("#game-board");
const matchesElement = document.querySelector("#matches");
const totalMatchesElement = document.querySelector("#total-matches");
const movesElement = document.querySelector("#moves");
const timerElement = document.querySelector("#timer");
const restartButton = document.querySelector("#restart-button");
const shareButton = document.querySelector("#share-button");
const shareFeedback = document.querySelector("#share-feedback");
const victoryDialog = document.querySelector("#victory-dialog");
const victorySummary = document.querySelector("#victory-summary");
const playAgainButton = document.querySelector("#play-again-button");

let firstCard;
let secondCard;
let isResolving = false;
let matches = 0;
let moves = 0;
let startedAt;
let timerInterval;

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
  victorySummary.textContent = `Você concluiu o desafio em ${moves} tentativas e ${timerElement.textContent}.`;
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

    if (matches === cardSymbols.length) {
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
  victoryDialog.close();
  shareFeedback.textContent = "";
  firstCard = undefined;
  secondCard = undefined;
  isResolving = false;
  matches = 0;
  moves = 0;
  startedAt = undefined;
  timerElement.textContent = "00:00";
  totalMatchesElement.textContent = cardSymbols.length;
  updateStatus();

  const shuffledDeck = shuffle([...cardSymbols, ...cardSymbols]);
  shuffledDeck.forEach((card, index) => board.append(createCard(card, index)));
};

const shareChallenge = async () => {
  const shareText = "Consegue encontrar todos os pares no desafio Memória em Movimento?";

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

restartButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);
shareButton.addEventListener("click", shareChallenge);

startGame();
